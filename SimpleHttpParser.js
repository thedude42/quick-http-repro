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
        var messagePieces,
            possibleMessages,
            clFramedObj,
            messageObj,
            i,
            contentLength,
            contentType,
            transferEncoding;
        chunks = Buffer.concat(chunks, totalLen)
        console.log("OK: stream read complete. #chunks:"+chunks.length+" totalLen: "+totalLen);
        self.allmessages = chunks.toString('ascii');
        messagePieces = self.allmessages.split("\r\n\r\n"); // our "tokenizer"
        possibleMessages = messagePieces.length+1
        console.log("OK: identified "+messagePieces.length+" potential HTTP messages in stream")
        i = -1; // index in to messagePieces[] for current work item
        while ( i < messagePieces.length - 1 ) {
            i++;
            //console.log("top of loop, i === "+i+", messagePieces.length: "+messagePieces.length);
            possibleMessages--;
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
            else if (messageObj.type === "empty") { // case: instances of multiple contiguous CRLFCRLF
                if (i !== messagePieces.length-1) {
                    console.log("WARN: empty string found in message pieces at index "+i);
                }
                continue;
            }
            else { // case: messagePieces[i] is not a single complete http header; likely http body data
                if (i === 0) {
                    throw "file "+inFile+" begins with an incomplete http message";
                }
                contentLength =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Content-Length"],
                contentType =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Content-Type"],
                transferEncoding =
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["Transfer-Encoding"] ||
                    self.parsedMessages[self.parsedMessages.length-1].headerPart.headers["TE"];
                if (contentLength && parseInt(contentLength) === messagePieces[i].length) { // happy path
                    self.addBodyToParsedMessage( {
                        currentParsedMessage:self.parsedMessages[self.parsedMessages.length-1],
                        messageBody:messagePieces[i],
                        allmessages:self.allmessages
                    });
                    continue;
                }
                else if (contentLength && contentLength > messagePieces[i].length) {
                    clFramedObj = self.collectClFrame(messagePieces.slice(i), contentLength);
                    self.addBodyToParsedMessage( {
                        currentParsedMessage:self.parsedMessages[self.parsedMessages.length-1],
                        messageBody:clFramedObj,
                        allmessages:self.allmessages
                    });
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
                    self.addBodyToParsedMessage( {
                        currentParsedMessage:self.parsedMessages[self.parsedMessages.length-1],
                        messageBody:messagePieces[i].substr(0,contentLength),
                        allmessages:self.allmessages
                    });
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
                    self.addBodyToParsedMessage( {
                        currentParsedMessage:self.parsedMessages[self.parsedMessages.length-1],
                        messageBody:chunkedObj.chunkBody,
                        allmessages:self.allmessages
                    });
                    i += chunkedObj.parts - 1;
                    console.log("*** SETTING i === "+i+" AFTER PROCESSING CHUNKED ENCODING");
                    continue;
                }
                /* TODO: need test coverage for cases where http bodies contain strings
                that are also http messages, and will need to be gathered together from
                contiguous array elements. I think the current way we use content-length
                and chunk length checks accounts for this already but it may be bugged
                */
                throw "should not hit this point; current message:\n< "+messagePieces[i]+" >";
            }
        }
        console.log("OK: parsed all messages");
        self.emit('done', self.parsedMessages);
    });
    console.log("OK: startint new parse of file: "+this.inFile);
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

SimpleHttpParser.prototype.addBodyToParsedMessage = function(bodyDataObj) {
    bodyDataObj.currentParsedMessage.entityBody = bodyDataObj.messageBody;
    bodyDataObj.currentParsedMessage.bodyOffset = bodyDataObj.allmessages.indexOf(bodyDataObj.messageBody);
    bodyDataObj.currentParsedMessage.bodyEnd = bodyDataObj.currentParsedMessage.bodyOffset + bodyDataObj.messageBody.length - 1;
}

SimpleHttpParser.prototype.collectClFrame = function(bodyParts, byteLength) {
    var parts = [],
        partsByteCount = 0,
        retObj = {body:"", bytes:partsByteCount, header:undefined, numParts:0},
        currentType,
        headStart;
    for (var i = 0; i < bodyParts.length; i++) {
        if (byteLength === partsByteCount) {
            break;
        }
        if (byteCount + bodyParts[i].length <= byteLength) {
            parts.push(bodyParts[i]);
            retObj.numParts++;
            partsByteCount += bodyParts[i].length;
            continue;
        }
        else if (byteCount + bodyParts[i].length > byteLength) {
            currentType = this.getMessageType(bodyParts[i]);
            if (currentType === "boundary") {
                headStart = bodyParts[i].search(this.rqstLineRegex);
                parts.push(bodyParts.slice(0, headStart));
                partsByteCount += parts[parts.length -1].length;
                if (partsByteCount !== byteLength) {
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
        }
    }
}

SimpleHttpParser.prototype.verifyChunk = function(chunklen, content) {
    var len = parseInt("0x"+chunklen);
    if (content.length !== len) {
        return false;
    };
    return true;
}

exports.SimpleHttpParser = SimpleHttpParser;
