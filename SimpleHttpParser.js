"use strict";

var fs = require("fs"),
    events = require("events");

function SimpleHttpParser(messages) {
    var self = this,
        chunks = [],
        totalLen = 0,
        httpMessageStream = fs.createReadStream(messages);
    this.inFile = messages;
    this.rqstLineRegex = /([A-Z]{3,10}) (\/.*) HTTP\/[01]\.[091]\r\n/;
    this.respLineRegex = /HTTP\/([01]\.[091]) (\d{3}) ([A-Za-z ]+)\r\n/;
    this.isWireshark = false;
    this.parsedMessages = [];
    this.counts = {requests:0, responses:0};

    httpMessageStream.on("data", function(chunk) {
        chunks.push(chunk);
        totalLen += chunk.length;
    });
    httpMessageStream.on('end', function() {
        console.log("OK: stream read complete. #chunks:"+chunks.length+" totalLen: "+totalLen);
        chunks = Buffer.concat(chunks, totalLen);
        self.allmessages = chunks.toString('ascii');
        var messagePieces = self.allmessages.split("\r\n\r\n"); // our "tokenizer"
        var possibleMessages = messagePieces.length+1;
        console.log("OK: identified "+messagePieces.length+" potential HTTP messages in stream")
        var i = -1; // index in to messagePieces[] for current work item
        while ( i < messagePieces.length - 1 ) {
            i++;
            //console.log("top of loop, i == "+i+", messagePieces.length: "+messagePieces.length);
            possibleMessages--;
            console.log("OK: "+ possibleMessages+" possible HTTP message left to parse");
            var messageObj = {type:self.getMessageType(messagePieces[i])}
            if (messageObj.type == "request" || messageObj.type == "response") { // case: headers
                messageObj.headerPart = self.parseHeaders(messagePieces[i]);
                self.parsedMessages.push(messageObj);
                console.log("OK: pushed new "+messageObj.type+" message headers, number parsedMessages: "+self.parsedMessages.length);
                if (messageObj.type == "request") {
                    self.counts.requests++;
                }
                else {
                    self.counts.responses++;
                }
                if (self.counts.responses > 0 && self.counts.requests > 0) {
                    self.isWireshark = true;
                }
                continue;
            }
            else if (messageObj.type == "empty") { // case: instances of multiple contiguous CRLFCRLF
                if (i != messagePieces.length-1) {
                    console.log("WARN: empty string found in message pieces at index "+i);
                }
                continue;
            }
            else { // case: messagePieces[i] is not a single complete http header; likely http body data
                if (i == 0) {
                    throw "file "+inFile+" begins with an incomplete http message";
                }

                var contentLength =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Content-Length"],
                    contentType =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Content-Type"],
                    transferEncoding =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Transfer-Encoding"] ||
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["TE"];

                if (contentLength && contentLength == messagePieces[i].length) { // happy path
                    self.addBodyToParsedMessage(messagePieces[i]);
                    continue;
                }
                else if (contentLength && contentLength > messagePieces[i].length) {
                    var clFramedObj = self.collectClFrame(messagePieces.slice(i), contentLength);
                    self.addBodyToParsedMessage(clFramedObj.body);
                    i += clFramedObj.numParts - 1;
                    if (clFramedObj.headers) {
                        messageObj.type = "request";
                        messageObj.headerPart = clFramedObj.header;
                    }
                    continue;
                }
                else if (contentLength &&
                contentLength < messagePieces[i].length) { // case: this part is the end of a body and headers of a new message
                    console.log("OK: splitting body and header parts");
                    self.addBodyToParsedMessage(messagePieces[i].substr(0,contentLength));
                    // process the rest of the message as a header
                    messageObj.type =
                     self.getMessageType(messagePieces[i].substr(contentLength));//,messagePieces[i].length));
                    messageObj.headerPart =
                     self.parseHeaders(messagePieces[i].substr(contentLength));//,messagePieces[i].length));
                    self.parsedMessages.push(messageObj);
                    continue;
                }
                else if (transferEncoding) {
                    console.log("doing chunked message");
                    var chunkedObj = self.findAndMergeChunks(messagePieces.slice(i));
                    self.addBodyToParsedMessage(chunkedObj.chunkBody);
                    i += chunkedObj.parts - 1;
                    console.log("*** SETTING i == "+i+" AFTER PROCESSING CHUNKED ENCODING");
                    continue;
                }
                /* TODO: need test coverage for cases where http bodies contain strings
                that are also http messages, and will need to be gathered together from
                contiguous array elements. I think the current way we use content-length
                and chunk length checks accounts for this already but it may be bugged
                */
                throw "should not hit this point; current message:\n"+messagePieces[i];
            }
        }
        console.log("OK: parsed all messages");
        self.emit('done', self.parsedMessages);
    });
    console.log("OK: startint new parse of file: "+this.inFile);
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
        return "boundary";
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
            var match = this.rqstLineRegex.exec(headerObj["start"]+"\r\n");
            if (match) {
                headerObj["uri"] = match[2];
            }
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

SimpleHttpParser.prototype.collectClFrame = function(bodyParts, byteLength) {
    var parts = [],
        partsByteCount = 0,
        retObj = {body:"", bytes:partsByteCount, header:undefined, numParts:0};
    for (var i = 0; i < bodyParts.length; i++) {
        if (byteLength == partsByteCount) {
            break;
        }
        if (byteCount + bodyParts[i].length <= byteLength) {
            parts.push(bodyParts[i]);
            retObj.numParts++;
            partsByteCount += bodyParts[i].length;
            continue;
        }
        else if (byteCount + bodyParts[i].length > byteLength) {
            var currentType = this.getMessageType(bodyParts[i]),
                headStart;
            if (currentType == "boundary") {
                headStart = bodyParts[i].search(this.rqstLineRegex);
                parts.push(bodyParts.slice(0, headStart));
                partsByteCount += parts[parts.length -1].length;
                if (partsByteCount != byteLength) {
                    throw "incorrect content-length detected for message";
                }
                retObj.header = this.parseHeaders(bodyParts.slice(headStart));
            }
            else {
                throw "malformed http message body or incorrect content-length";
            }
        }
    }
    retObj.numParts = parts.length;
    retObj.body = Buffer.concat(parts, partsByteCount);
    return retObj;
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
            console.log("total message parts used to complete chunk: "+totalParts);
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
