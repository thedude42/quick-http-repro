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

SimpleHttpParser.prototype.__proto__ = events.EventEmitter.prototype;

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
            eventChunks = chunks.length,
            possibleMessages,
            messageObj,
            bodyObj, //inline created {bodyStr:"", numPieces:0} with contentLength property in those cases
            i = 0,
            contentLength,
            transferEncoding;
        chunks = Buffer.concat(chunks, totalLen);
        console.log("OK: stream read complete for "+self.inFile+". #io chunks:"+eventChunks+" totalLen: "+totalLen);
        self.allmessages = chunks.toString('ascii');
        messagePieces = self.allmessages.split("\r\n\r\n"); // our "tokenizer"
        possibleMessages = messagePieces.length+1
        console.log("OK: identified "+messagePieces.length+" potential HTTP messages in stream")
        while ( i < messagePieces.length - 1 ) {
            possibleMessages -= 1; // this smells funny
            messageObj = {type:self.getMessageType(messagePieces[i])};
            if (messageObj.type === "request" || messageObj.type === "response") { // case: headers
                messageObj.headerPart = self.parseHeaders(messagePieces[i]);
                self.parsedMessages.push(messageObj);
                if (messageObj.type === "request") {
                    self.counts.requests += 1;
                }
                else {
                    self.counts.responses += 1;
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
                transferEncoding =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Transfer-Encoding"] ||
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["TE"];
                if (contentLength) {
                    bodyObj = self.getBodyObj(messagePieces.slice(i),
                                {"contentLength":parseInt(contentLength), bodyStr:"", numPieces:0});
                }
                else if (transferEncoding) {
                    bodyObj = self.getBodyObj(messagePieces.slice(i), {bodyStr:"", numPieces:0});
                }
                else {
                    throw "no content-length or transfer-encoding!";
                }
                self.parsedMessages[self.parsedMessages.length-1].entityBody = bodyObj.bodyStr;
                self.parsedMessages[self.parsedMessages.length-1].bodyOffset =
                    self.allmessages.indexOf(bodyObj.bodyStr);
                self.parsedMessages[self.parsedMessages.length-1].bodyEnd =
                    self.parsedMessages[self.parsedMessages.length-1].bodyOffset + bodyObj.bodyStr.length - 1;
                self.parsedMessages[self.parsedMessages.length-1].chunkMessages = bodyObj.chunkMessages;
                if (bodyObj.nextHeaders) {
                    if (bodyObj.nextHeaders.uri) {
                        messageObj.type = "request";
                        self.counts.requests += 1;
                    }
                    else {
                        messageObj.type = "response";
                        self.counts.responses += 1;
                    }
                    messageObj.headerPart = bodyObj.nextHeaders;
                    self.parsedMessages.push(messageObj);
                }
                i += bodyObj.numPieces;
            }
        }
        if (self.counts.responses > 0 && self.counts.requests > 0) {
            self.isWireshark = true;
        }
        console.log("OK: parsed all messages");
        self.emit('done', self.parsedMessages);
    });
    console.log("OK: starting new parse of file: "+this.inFile);
}

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
                headerObj["type"] = "request";
            }
            else if (matchResp) {
                headerObj["type"] = "response";
                headerObj["status_code"] = matchResp[2];
                headerObj["status_message"] = matchResp[3];
            }
            else {
                throw "could not match start line with request or response! : "+headers;
            }
        }
        else if (headerLines[i] === "") {
            throw "SimpleHttpParser found an extra CRLF or more somewhere in part of a 'header' (possibly trailing)";
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
        return this.getChunkedBodyObj(bodyPieces, bodyObj);
    }
}

SimpleHttpParser.prototype.getChunkedBodyObj = function(bodyPieces, bodyObj) {
    if (bodyPieces[0] == undefined) {
        throw "made to end of pieces without finding chunk terminator";
    }
    bodyObj.chunkMessages = [];
    var piece = bodyPieces[0],
        splitPiece = piece.split("\r\n"),
        terminal = splitPiece.indexOf("0");
    if (terminal === -1) {
        bodyObj.bodyStr += piece;
        bodyObj.numPieces += 1;
        return this.getChunkedBodyObj(bodyPieces.slice(1), bodyObj);
    }
    else if (terminal === splitPiece.length - 1) {
        bodyObj.bodyStr += piece;
        if (this.validateChunkedBody(bodyObj.bodyStr.split("\r\n"), bodyObj)) {
            bodyObj.numPieces += 1;
            bodyObj.bodyStr+="\r\n\r\n";
            return bodyObj;
        }
    }
    else if (terminal === splitPiece.length - 2) {
        // assume a chunk extention
        splitPiece = bodyObj.bodyStr.split("\r\n");
        if (this.validateChunkedBody(splitPiece)) {
            bodyObj.numPieces += 1;
            bodyObj.bodyStr+="\r\n"+splitPiece[splitPiece.length - 1]+"\r\n";
            return bodyObj;
        }
    }
    else {
        throw "found chunk terminator outside of CRLFCRLF boundary";
    }
}

SimpleHttpParser.prototype.validateChunkedBody = function(entityChunks, bodyObj) {
    var modifiedChunks = [];
    if (entityChunks[0] === "0" && (entityChunks.length >= 1 && entityChunks.length <= 3)) {
        return true;
    }
    else if (/[0-9a-fA-F]/.test(entityChunks[0])) {
        if (this.verifyChunk(entityChunks[0], entityChunks[1])) {
            bodyObj.chunkMessages.push(entityChunks[1]);
            return this.validateChunkedBody(entityChunks.slice(2), bodyObj);
        }
        else if (entityChunks[2] !== undefined){
            modifiedChunks.push(entityChunks[0]);
            modifiedChunks.push(entityChunks[1]+"\r\n"+entityChunks[2]);
            modifiedChunks = modifiedChunks.concat(entityChunks.slice(3));
            return this.validateChunkedBody(modifiedChunks, bodyObj);
        }
    }
    throw "malformed chunked entity";
}

SimpleHttpParser.prototype.verifyChunk = function(chunklen, content) {
    var len = parseInt("0x"+chunklen);
    if (content.length !== len) {
        return false;
    };
    return true;
}

exports.SimpleHttpParser = SimpleHttpParser;
