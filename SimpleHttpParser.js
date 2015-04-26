"use strict";

var fs = require("fs"),
    events = require("events");

function SimpleHttpParser(messages) {
    var self = this,
        chunks = [],
        totalLen = 0,
        httpMessageStream = fs.createReadStream(messages);
    this.inFile = messages;
    this.rqstLineRegex = /[A-Z]{3,10} (\/.*)\r\n/;
    this.respLineRegex = /HTTP\/[01]\.[091] \d{3} [A-Za-z ]/;
    this.isWireshark = false;
    this.parsedMessages = [];
    this._multipartCollect = false;

    httpMessageStream.on("data", function(chunk) {
        chunks.push(chunk);
        totalLen += chunk.length;
    });
    httpMessageStream.on('end', function() {
        console.log("OK: stream read complete. #chunks:"+chunks.length+" totalLen: "+totalLen);
        chunks = Buffer.concat(chunks, totalLen);
        self.allmessages = chunks.toString('ascii');
        var messagePieces = self.allmessages.split("\r\n\r\n");
        var possibleMessages = messagePieces.length+1;
        console.log("OK: identified "+messagePieces.length+" potential HTTP messages in stream")
        // use self.allmessages.indexOf(messagePieces[i]) to get offset value of body
        //--
        // use while loop so we can look forward and backward in the array
        // invariant: messagePieces[0 -> i-1] have all been associated with either a message header or a complete entity body
        var i = -1;
        while ( i < messagePieces.length - 1 ) {
            i++;
            possibleMessages--;
            console.log("OK: "+ possibleMessages+" possible HTTP message left to parse");
            var messageObj = {type:self.getMessageType(messagePieces[i])}
            if (messageObj.type == "request" || messageObj.type == "response") {
                messageObj.headerPart = self.parseHeaders(messagePieces[i]);
                self.parsedMessages.push(messageObj);
                continue;
            }
            else if (messageObj.type == "empty") {
                console.log("OK: empty string found in message pieces at index "+i);
                continue;
            }
            else { // case: messagePieces[i] is not a single complete http header; maybe http body data
                if (i == 0) {
                    throw "file "+inFile+" begins with an incomplete http message";
                }
                /* strategy: examine messagePieces[i-1] for headers Content-Length or TE/Transfer-Encoding.
                             if Content-Length, count messagePieces[i,i++] until we have Content-Length number
                              of bytes and fix i
                             if chunked TE, split bodies on \r\n and find the chunk terminator, verify the
                              length of the preceeding chunk against its length header
                */
                var contentLength = self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Content-Length"],
                    contentType =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Content-Type"],
                    transferEncoding =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Transfer-Encoding"] ||
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["TE"];

                if ( (contentLength && contentLength == messagePieces[i].length)) { // happy path
                    self.addBodyToParsedMessage(messagePieces[i]);
                    continue;
                }
                else if (contentLength && contentLength < messagePieces[i].length &&
                messageObj.type == "wireshark") { //wireshark style content-length body
                    self.addBodyToParsedMessage(messagePieces[i].substr(0,contentLength));
                    // process the rest of the message as a header
                    messageObj.type =
                     self.getMessageType(messagePieces[i].substr(contentLength,messagePieces[i].length));
                    messageObj.headerPart =
                     self.parseHeaders(messagePieces[i].substr(contentLength,messagePieces[i].length));
                    self.parsedMessages.push(messageObj);
                    continue;
                }
                else if (transferEncoding) {
                    console.log("doing chunked message");
                    var chunkedObj = self.findAndMergeChunks(messagePieces.slice(i));
                    self.addBodyToParsedMessage(chunkedObj.chunkBody);
                    i = i + chunkedObj.totalParts - 1;
                    continue;
                }
                /* if we get here, we need to concatenate any messagePieces from i => i+n-1 where
                   n is the total number of messagePieces members comprising the next HTTP message
                   body associated with parsedMessages[i-1]
                   TODO: test data doesn't cover this code path yet so for now we throw
                */
                throw "unimplemented code path, and this is a bug with the current test data:\n"+messagePieces[i];
                var bodyCollection = [],
                    bodyByteCount = 0;
                for (var j = i; j < messagePieces.length; j++) {
                    if (messagePieces[j].search(self.rqstLineRegex) != -1 ||
                    messagePieces[j].search(self.respLineRegex) != -1) {
                        //now we know the next piece is probably a body part,
                        bodyCollection.push(messagePieces[j]);
                        bodyByteCount += messagePieces[j].length;
                        if (contentLength) { // the side-effect of this algorithm is that parsedMessages ends up being sparse, with 'undefined' members
                            if (contentLength != bodyByteCount) {
                                continue
                            }
                            else {
                                self.parsedMessages[self.parsedMessages.length-1].entityBody = Buffer.concat(bodyCollection, bodyByteCount);
                                self.parsedMessages[self.parsedMessages.length-1].bodyOffset = self.allmessages.indexOf(messagePieces[i]);
                                self.parsedMessages[self.parsedMessages.length-1].bodyEnd = self.parsedMessages[self.parsedMessages.length-1].bodyOffset + messagePieces[i].length - 1;
                                i = j;
                            }
                        }
                        else {
                            throw "collecting really wierd chunked encodings not yest supported";
                        }
                    }
                    else {

                    }
                }
            }
        }
        console.log("OK: parsed all messages");
        self.emit('done', self.parsedMessages);
    });
}

SimpleHttpParser.prototype.__proto__ = events.EventEmitter.prototype;

SimpleHttpParser.prototype.getMessageType = function(str) {
    if (str.search(this.respLineRegex) == 0) {
        return "response";
    }
    else if (str.search(this.rqstLineRegex) == 0) {
        return "request";
    }
    else if (str.search(this.respLineRegex) != -1 &&
             str.search(this.rqstLineRegex) != -1) {
        return "both";
    }
    else if (str.search(this.rqstLineRegex) > 0) {
        this.isWireshark = true;
        return "wireshark";
    }
    else if (str == "") {
        return "empty";
    }
    else if (str.search(this.respLineRegex) == -1 &&
             str.search(this.rqstLineRegex) == -1) {
        return "body";
    }
    else {
        // case: we found a response line somewhere inside a content with no CRLFCRLF separation
        // only way to figure out is to count body length values and compare
        return "mangled";
    }
}

SimpleHttpParser.prototype.parseHeaders = function(headers) {
    var headerLines = headers.split("\r\n"),
        headerObj = {"start":"","headers":{}};

    for (var i = 0; i < headerLines.length; i++) {
        if (i === 0) {
            headerObj["start"] = headerLines[i];
        }
        else if (headerLines[i] == "") {
            throw "SimpleHttpParser found a CRLFCRLF in the middle of a 'header'";
        }
        else {
            var aHeader = headerLines[i].split(":");
            if (aHeader.length != 2) {
                headerObj.headers[aHeader[0]] = headerLines[i].substr(aHeader[0].length+1, headerLines.length);
            }
            headerObj.headers[aHeader[0].trim()] = aHeader[1].trim();
        }
    }
    if (headerObj["Content-Type"] &&
        headerObj["Content-Type"].search("multipart") != -1) {
        this.multipartCollect = true;
    }
    else {
        this.multipartCollect = false;
    }
    return headerObj;
}

SimpleHttpParser.prototype.getNewMessageObj = function() {
    return {type:undefined, headers:undefined, entityBody:undefined};
}

SimpleHttpParser.prototype.addBodyToParsedMessage = function(bodyStr) {
    this.parsedMessages[this.parsedMessages.length-1].entityBody = bodyStr;
    this.parsedMessages[this.parsedMessages.length-1].bodyOffset = this.allmessages.indexOf(bodyStr);
    this.parsedMessages[this.parsedMessages.length-1].bodyEnd = this.parsedMessages[this.parsedMessages.length-1].bodyOffset + bodyStr.length - 1;
}

SimpleHttpParser.prototype.findAndMergeChunks = function(parts) {

    var totalParts = 0,
        splitChunks = parts[0].split("\r\n"),
        chunkParts = [];
    while (totalParts < parts.length) {
        totalParts++;
        var terminator = splitChunks.indexOf("0");
        if (terminator == splitChunks.length-1) {
            console.log("number of splitCHunks: "+splitChunks.length);
            var i = 0,
                j = i+1;
            while (j < splitChunks.length) {
                if (splitChunks[j+1].search(/^[0-9a-fA-F]+$/) != -1) {
                    console.log("found next chunklen at j+1 where j == "+j+"\n"+splitChunks[j+1]);
                    if (this.verifyChunk(splitChunks[i], splitChunks[j])) {
                        i = j+1;
                        j = i+1;
                        console.log("verified chunk, i == "+i+" j == "+j);
                    }
                    else if (j == i+1) {
                        console.log("j == i+1 case");
                        throw "malformed chunk length";
                    }
                    else if (this.verifyChunk(splitChunks[i], splitChunks.slice(i+1,j+1).join("\r\n"))) {
                        i = j+1;
                        j = i+1;
                        console.log("verified chunk, i == "+i+" j == "+j);
                    }
                    else {
                        console.log("i == "+i+" j == "+j);
                        throw "malformed chunk length";
                    }
                }
                else {
                    j++;
                    console.log("fell through to increment j alone, j == "+j+" i == "+i);
                }
            }
            return {parts:totalParts, chunkBody:splitChunks.join("\r\n")};
        }
        else {
            splitChunks.concat(parts[totalParts]);
        }
    }
}

SimpleHttpParser.prototype.verifyChunk = function(chunklen, content) {
    var len = parseInt("0x"+chunklen);
    console.log("chunk len: "+len+" content.len: "+content.length);
    if (content.length != len) {
        return false;
    };
    return true;
}

exports.SimpleHttpParser = SimpleHttpParser;
