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
        var allmessages = chunks.toString('ascii');
        var messagePieces = allmessages.split("\r\n\r\n");
        var possibleMessages = messagePieces.length;
        console.log("OK: identified "+messagePieces.length+" potential HTTP messages in stream")
        // use allmessages.indexOf(messagePieces[i]) to get offset value of body
        //--
        // use for loop so we can look forward and backward in the array
        for (var i = 0; i < messagePieces.length; i++) {

            var messageObj;
            if (messagePieces[i].search(self.rqstLineRegex) == 0) {
                console.log("OK: identified REQUEST")
                messageObj = self.getNewMessageObj();
                // piece at index i is a REQUEST
                // if GET or HEAD or OPTIONS or TRACE, don't look for a body
                messageObj.type = 'request';
                messageObj.headerPart = self.parseHeaders(messagePieces[i]);
                self.parsedMessages.push(messageObj);
            }
            else if (messagePieces[i].search(self.respLineRegex) == 0) {
                messageObj = self.getNewMessageObj();
                messageObj.type = 'response';
                messageObj.headerPart = self.parseHeaders(messagePieces[i]);
                self.parsedMessages.push(messageObj);
            }
            else if (messagePieces[i] == "") {
                console.log("OK: empty string found in message pieces at index "+i);
                continue;
            }
            else {
                if (i == 0) {
                    throw "file "+inFile+"begins with an incomplete http message";
                }
                // this message must be a body, or some mangled message.
                // look for wireshark style messages using body length information
                self.parseBody(messagePieces[i], self.parsedMessages[i-1]);
            }
            possibleMessages--;
            console.log("OK: "+ possibleMessages+" possible HTTP message left to parse");
        }
        console.log("OK: parsed all messages");
        self.emit('done', self.parsedMessages);
    });
}

SimpleHttpParser.prototype.__proto__ = events.EventEmitter.prototype;

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
            var aHeader = headerLines[i].split(": ");
            // this will throw if the header line wasn't a header per HTTP RFC grammar
            headerObj.headers[aHeader[0]] = aHeader[1];
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

SimpleHttpParser.prototype.parseBody = function(bodyStr, messageObj) {
    var self = this,
        cl = messageObj.headers["Content-Length"],
        contentType = messageObj.headers["Content-Type"]; // need this to deal with multi-part
        // oh... not dealing with that right now
    if (cl) {
        if (! cl == bodyStr.length) {
            var idxRqst = bodyStr.search(self.rqstLineRegex);
            var idxResp = bodyStr.search(self.respLineRegex);
            if (idxRqst == -1 && idxResp == -1) {
                throw "illegal http entity: content length information does not match body";
            }
            else if (idxRqst >= 0 && idxResp >= 0){
                throw "malformed source file, multiple missing CRLFCRLF sequences"
            }
            else {
                // deal with wireshark style message
            }
        }
    }
    else {
        if (! messageObj.headers["Transfer-Encoding"]) {
            throw "illegal HTTP entity: no content length or tranfer encoding";
        }
        // check for a containing request or response headers message preceeded by '0'
        var idxRqst = bodyStr.search(self.rqstLineRegex);
        var idxResp = bodyStr.search(self.respLineRegex);
        if (idxRqst == -1 && idxResp == -1) {
            if (bodyStr.charAt(bodyStr.length-1) == "0" &&
                bodyStr.charAt(bodyStr.length-2) == "\n" &&
                bodyStr.charAt(bodyStr.length-3) == "\r") {
                messageObj.entityBody = bodyStr;
            }
            else {
                throw "Malformed or incomplete chunked transfer encoded message";
            }
        }
        else {
            // deal with wireshark style message
        }
    }
}

exports.SimpleHttpParser = SimpleHttpParser;
