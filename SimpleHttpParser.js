"use strict";

var fs = require("fs"),
    events = require("events");

function SimpleHttpParser(messages) {

    this.inFile = messages;
    this.rqstLineRegex = /([A-Z]{3,10}) (\/.*) HTTP\/[01]\.[091]\r\n/;
    this.respLineRegex = /HTTP\/([01]\.[091]) (\d{3}) ([A-Za-z ]+)\r\n/;
    this.isWireshark = false;
    this.parsedMessages = [];
    this.counts = {requests:0, responses:0};
}

SimpleHttpParser.prototype.init = function() {
    var self = this,
        chunks = [],
        totalLen = 0,
        httpMessageStream = fs.createReadStream(self.inFile);

    httpMessageStream.on("data", function(chunk) {
        chunks.push(chunk);
        totalLen += chunk.length;
    });
    httpMessageStream.on('end', function() {
        var messagePieces,
            possibleMessages,
            clFramedObj,
            messageObj,
            bodyObj,
            i = 0,
            contentLength,
            contentType,
            transferEncoding;
        chunks = Buffer.concat(chunks, totalLen)
        console.log("OK: stream read complete for "+self.inFile+". #chunks:"+chunks.length+" totalLen: "+totalLen);
        self.allmessages = chunks.toString('ascii');
        messagePieces = self.allmessages.split("\r\n\r\n"); // our "tokenizer"
        possibleMessages = messagePieces.length+1
        console.log("OK: identified "+messagePieces.length+" potential HTTP messages in stream")
        while ( i < messagePieces.length - 1 ) {
            //console.log("top of loop, i === "+i+", messagePieces.length: "+messagePieces.length);
            possibleMessages -= 1;
            console.log("OK: "+ possibleMessages+" possible HTTP message left to parse");
            messageObj = {type:self.getMessageType(messagePieces[i])}
            //console.log(messageObj.type);
            //console.log(messagePieces[i].length);
            //console.log(messagePieces[i]);
            if (messageObj.type === "request" || messageObj.type === "response") { // case: headers
                messageObj.headerPart = self.parseHeaders(messagePieces[i]);
                self.parsedMessages.push(messageObj);
                console.log("OK: pushed new "+messageObj.type+" message headers, number parsedMessages: "+self.parsedMessages.length);
                if (messageObj.type === "request") {
                    self.counts.requests += 1;
                }
                else {
                    self.counts.responses += 1;
                }
                if (self.counts.responses > 0 && self.counts.requests > 0) {
                    self.isWireshark = true;
                }
                i += 1;
            }
            else if (messageObj.type === "empty") { // case: instances of multiple contiguous CRLFCRLF
                if (i !== messagePieces.length-1) {
                    console.log("WARN: empty string found in message pieces at index "+i);
                }
                i += 1;
            }
            else { // case: messagePieces[i] is not a single complete http header; likely http body data
                if (i === 0) {
                    throw "file "+inFile+" begins with an incomplete http message";
                }
                contentLength =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Content-Length"];
                contentType =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Content-Type"];
                transferEncoding =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Transfer-Encoding"] ||
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["TE"];
                if (contentLength) {
                    bodyObj = self.getBodyObj(messagePieces.slice(i), {"contentLength":parseInt(contentLength),
                                                                bodyStr:"",
                                                                numPieces:0});
                }
                else {
                    bodyObj = self.getBodyObj(messagePieces.slice(i), {bodyStr:"", numPieces:0});
                }
                self.parsedMessages[self.parsedMessages.length-1].entityBody = bodyObj.bodyStr;
                self.parsedMessages[self.parsedMessages.length-1].bodyOffset =
                    self.allmessages.indexOf(bodyObj.bodyStr);
                    self.parsedMessages[self.parsedMessages.length-1].bodyEnd =
                    self.parsedMessages[self.parsedMessages.length-1].bodyOffset + bodyObj.bodyStr.length - 1;
                console.log("OK: appended body to previous message");
                if (bodyObj.nextHeaders) {
                    if (bodyObj.nextHeaders.uri) {
                        messageObj.type = "request";
                        self.counts.requests += 1;
                    }
                    else {
                        messageObj.type = "response";
                        self.counts.responses += 1;
                    }
                    if (self.counts.responses > 0 && self.counts.requests > 0) {
                        self.isWireshark = true;
                    }
                    messageObj.headerPart = bodyObj.nextHeaders;
                    self.parsedMessages.push(messageObj);
                    console.log("OK: pushed "+messageObj.type+" message headers after body; number parsedMessages: "+self.parsedMessages.length);
                }
                i += bodyObj.numPieces;
            }
        }
        console.log("OK: parsed all messages");
        self.emit('done', self.parsedMessages);
    });
    console.log("OK: starting new parse of file: "+this.inFile);
}

SimpleHttpParser.prototype.__proto__ = events.EventEmitter.prototype;

SimpleHttpParser.prototype.getMessageType = function(str) {
    if (str.search(this.respLineRegex) === 0) {
        return "response";
    }
    else if (str.search(this.rqstLineRegex) === 0) {
        return "request";
    }
    else if (str.search(this.respLineRegex) !== -1 &&
             str.search(this.rqstLineRegex) !== -1) {
        return "both";
    }
    else if (str.search(this.rqstLineRegex) > 0) {
        return "boundary";
    }
    else if (str === "") {
        return "empty";
    }
    else if (str.search(this.respLineRegex) === -1 &&
             str.search(this.rqstLineRegex) === -1) {
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
            var matchRqst = this.rqstLineRegex.exec(headerObj["start"]+"\r\n");
            var matchResp = this.respLineRegex.exec(headerObj["start"]+"\r\n");
            if (matchRqst) {
                headerObj["uri"] = matchRqst[2];
            }
            else if (matchResp) {
                headerObj["status_code"] = matchResp[2];
                headerObj["status_message"] = matchResp[3];
            }
            else {
                throw "could not match start line with request or response! : "+headers;
            }
        }
        else if (headerLines[i] === "") {
            throw "SimpleHttpParser found a CRLFCRLF in the middle of a 'header'";
        }
        else {
            var aHeader = headerLines[i].split(":");
            if (aHeader.length !== 2) {
                headerObj.headers[aHeader[0].trim()] = headerLines[i].substr(aHeader[0].length+1).trim();
            }
            else {
                headerObj.headers[aHeader[0].trim()] = aHeader[1].trim();
            }
        }
    }
    if (headerObj["Content-Type"] &&
        headerObj["Content-Type"].search("multipart") !== -1) {
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

SimpleHttpParser.prototype.getBodyObj = function(bodyPieces, bodyObj) {
    var piece = bodyPieces[0],
        bodyEnd;
    if (bodyObj.contentLength) {
        if (piece.length === bodyObj.contentLength ||
        piece.length + bodyObj.bodyStr.length === bodyObj.contentLength) {
            bodyObj.bodyStr += piece;
            bodyObj.numPieces += 1;
            return bodyObj;
        }
        else if (piece.length + bodyObj.bodyStr.length > bodyObj.contentLength) {
            bodyEnd = bodyObj.contentLength - bodyObj.bodyStr.length;
            bodyObj.bodyStr += piece.substring(0,bodyEnd);
            bodyObj.nextHeaders = this.parseHeaders(piece.substring(bodyEnd, piece.length));
            bodyObj.numPieces += 1;
            return bodyObj;
        }
        else {
            bodyObj.bodyStr += piece;
            bodyObj.pieces += 1;
            return this.getBodyObj(bodyPieces.slice(1,bodyPieces.length), bodyObj);
        }
    }
    else { // chunked transfer-encoding
        bodyObj = this.findAndMergeChunks(bodyPieces);
        return {bodyStr:bodyObj.chunkBody, numPieces:bodyObj.parts};
    }
}

SimpleHttpParser.prototype.findAndMergeChunks = function(parts) {
//TODO: this only deals with an \r\n showing up inside a chunk one time. better algoritmh needed to collect all
    var totalParts = 0,
        splitChunks = parts[0].split("\r\n"),
        chunkParts = [],
        i, j;
    while (totalParts < parts.length) {
        totalParts++;
        var terminator = splitChunks.indexOf("0");
        if (terminator === splitChunks.length-1) {
            i = 0;
            j = i+1;
            while (j < splitChunks.length) {

                if (splitChunks[j+1].search(/^[0-9a-fA-F]+$/) !== -1) {
                    if (this.verifyChunk(splitChunks[i], splitChunks[j])) {
                        i = j+1;
                        j = i+1;
                    }
                    else if (j === i+1) {
                        throw "malformed chunk length";
                    }
                    else if (this.verifyChunk(splitChunks[i], splitChunks.slice(i+1,j+1).join("\r\n"))) {
                        i = j+1;
                        j = i+1;
                    }
                    else {
                        throw "malformed chunk length";
                    }
                }
                else {
                    j++;
                }
            }
            return {parts:totalParts, chunkBody:splitChunks.join("\r\n")};
        }
        else {
            splitChunks.concat(parts[totalParts]);
            console.log("concatenating more chunk parts");
        }
    }
    throw "could not locate chunked body";
}

SimpleHttpParser.prototype.verifyChunk = function(chunklen, content) {
    var len = parseInt("0x"+chunklen);
    if (content.length !== len) {
        return false;
    };
    return true;
}

exports.SimpleHttpParser = SimpleHttpParser;
