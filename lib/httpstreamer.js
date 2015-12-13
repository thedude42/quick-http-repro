"use strict";

var fs = require("fs"),
    stream = require("stream"),
    through2 = require("through2");

module.exports.getHttpStream = function httpStreamer() {
    var buffs = [],
        byte_count = 0,
        bigchunk,
        currentobj;
    return through2({ objectMode: true }, function through2httpStream(chunk, enc, callback) {
        var current_pieces,
            headerobj,
            msg_body;
        // first, look at the buffer we just got, get our working set of data ready for processing
        buffs.push(chunk);
        bigchunk = Buffer.concat(buffs);
        buffs = [];
        // split bigchunk to guarantee we have at most one body
        current_pieces = bigchunk.split("\r\n\r\n");
        headerobj = getHeaders(current_pieces[0]);
        if (currentobj.type !== undefined && currentobj.headers !== undefined) {
            // we have current object with a valid type and a vallid header obj
            if (currentobj.headers["Content-Length"] !== undefined ||
                currentobj.headers["Transfer-Encoding"] !== undefined ||
                currentobj.headers.TE !== undefined) {
                if (headerobj !== null) {
                    throw new Error("previous object expected content body but more headers were seen. was the body of the response an http message???");
                }
                // ASSUMPTION: we need to get the body from current_pieces[0]
                for (var i = 1; i <= current_pieces.length; ++i) {
                    msg_body = getBodyObj(
                            current_pieces.slice(0,i).join("\r\n\r\n"), 
                            currentobj.headers["Content-Length"]);
                    if (msg_body !== null) {
                        // once we get a body piece, reset stream state
                        currentobj.body = msg_body;
                        buffs.push(msg_body.extra);
                        buffs.push(current_pieces.slize(i,current_pieces.length).join("\r\n\r\n"));
                        break;
                    }
                }
                if (msg_body !== null) {
                // put the rest of the stream back in the working set of buffer space
                    delete currentobj.body.extra;
                    this.push(currentobj);
                    currentobj = {};
                }
                callback(); 
            }
            else {
                if (headerobj !== null) {
                    this.push(currentobj);
                    currentobj.type = headerobj.type;
                    currentobj.headers = headerobj;
                    callback();
                }
                if (current_pieces.length > 1) {
                    throw new Error("Invalid http stream, non header content following headers indicating no content body");
                }
                // gather more chunks so we can make more profress
                callback();
            }
        // we don't have an object with a full header, so we shouldn't have a type either
        }
        else if (currentobj.type !== undefined) {
            throw new Error("currentobj has type", currentobj.type, "but no headers??? This is a bug");
        }
        else {
            if (headerobj !== null) {
                currentobj.type = headerobj.type;
                currentobj.headers = headerobj;
            }
            callback();
        }
    });
};

function getHeaders(chunk) {
    var header_lines = chunk.split("\r\n"),
        headerobj = {type:"", start:"", headers:{}},
        rqst_regex = /([A-Z]{3,10}) (\/.*) HTTP\/[01]\.[091]/,
        resp_regex = /HTTP\/([01]\.[091]) (\d{3}) ([A-Za-z ]+)/;

    for (var i = 0; i < header_lines.length; i++) {
        if (i === 0) {
            headerobj.start = header_lines[i];
            var matchRqst = rqst_regex.exec(headerobj.start+"\r\n");
            var matchResp = resp_regex.exec(headerobj.start+"\r\n");
            if (matchRqst) {
                headerobj.uri = matchRqst[2];
                headerobj.type = "request";
            }
            else if (matchResp) {
                headerobj.type = "response";
                headerobj.status_code = matchResp[2];
                headerobj.status_message = matchResp[3];
            }
            else {
               return null; 
            }
        }
        else if (header_lines[i] === "") {
            throw new Error("found an extra CRLF or more somewhere in part of a 'header' (possibly trailing)");
        }
        else {
            var aHeader = header_lines[i].split(":");
            if (aHeader.length !== 2) {
                headerobj.headers[aHeader[0].trim()] = header_lines[i].substr(aHeader[0].length+1).trim();
            }
            else {
                headerobj.headers[aHeader[0].trim()] = aHeader[1].trim();
            }
        }
    }
    return headerobj;
}
module.exports._getHeaders = getHeaders;

function getBodyObj(chunk, cl) { //returns 'null' if content length is wrong or chunk lengths are wrong
    var bodyobj;
    if (cl === undefined) {
        bodyobj = getChunkedBody(chunk);
    }
    else {
        bodyobj = getCLBody(chunk, cl);
    }
    return bodyobj;
}
module.exports._getBodyObj = getBodyObj;

function getCLBody(chunk, cl) {
    var bodyobj = {content:chunk, contentLength:cl};
    if (chunk.length < cl) {
        return null;
    }
    else if (chunk.length > cl) {
        bodyobj.content = chunk.substring(0, cl);
        bodyobj.extra = chunk.substring(cl);
    }
    return bodyobj; 
}
module.exports._getCLBody = getCLBody;

function getChunkedBody(chunk) {
    var bodyobj = {chunks:[]},
        complete_chunk,
        parts = chunk.split("\r\n"),
        last_part = 0;
    // find the terminator, set up for call to parseChunklen
    for (var i = 0; i < parts.length; ++i) {
        if (parts[i] === "0") {
            break;
        }
    }
    if (i === parts.length) {
        console.log("getChunkedBody(chunk): no chunked terminator");
        return null;
    }
    bodyobj.extra = parts.slice(i+1, parts.length).join("\r\n");
    while (complete_chunk === undefined || complete_chunk.extra.length !== 0) {
        complete_chunk = parseChunklen(parts.slice(last_part,i));
        if (complete_chunk === null) {
            return null;
        }
        bodyobj.chunks.push(complete_chunk);
        last_part += complete_chunk.numparts;
    }
    return bodyobj;
}
module.exports._getChunkedBody = getChunkedBody;

// see RFC 7230 sec 4.1
function parseChunklen(chunk_parts) {
    var chunk_content;
    if (/[a-fA-F0-9]+ ?(.*)/.test(chunk_parts[0])) { // capturing chunked extension but doing nothing with it
        for (var i = 2; i <= chunk_parts.length; ++i) {
            chunk_content = chunk_parts.slice(1,i).join("\r\n");
            if (verifyChunk(chunk_parts[0], chunk_content)) {
                return { len:chunk_parts[0],
                         content:chunk_content,
                         extra:chunk_parts.slice(i,chunk_parts.length),
                         numparts:(i)
                       };
            }
        }
    }
    return null;
}
module.exports._parseChunklen = parseChunklen;

function verifyChunk(chunklen, content) {
    var len = parseInt("0x"+chunklen);
    if (content.length !== len) {
        return false;
    }
    return true;
}
module.exports._getChunkedBody = getChunkedBody;
