"use strict";

var test = require("tape"),
    path = require("path"),
    httpstream = require("../lib/httpstreamer"),
    testsetnum = 0;

console.log("Loaded modules for testing httpstreamer.js");

++testsetnum;
test("TEST SET #"+testsetnum+": chunk message handling", function(t) {
    var chunkedbody1 = "10\r\n0123456789abcdef\r\n0\r\nGET / HTTP/1.1\r\nHost: foo",
        badchunkedbody1 = "f\r\nhellofuck\r\n0\r\n",
        badchunkedbody2 = "10\r\n0123456789abcdef\r\n",
        chunkedbody2 = "10\r\n0123456789abcdef\r\n4\r\nfuck\r\n0\r\nGET / HTTP/1.1\r\nHost: foo",
        testobj;
    
    testobj = httpstream._parseChunklen(chunkedbody1.split("\r\n"));
    t.ok(testobj !== null, "Validating chunked body parts (split on CRLF)");
    testobj = httpstream._getChunkedBody(chunkedbody1);
    t.ok(testobj !== null, "Parsing valid whole chunked body");
    t.equals(testobj.chunks[0].content, "0123456789abcdef", "Expected content seen");
    t.ok(testobj.extra === "GET / HTTP/1.1\r\nHost: foo", "Next request headers show up properly");
    testobj = httpstream._getChunkedBody(badchunkedbody2);
    t.ok(testobj === null, "Parsing object with missing chunk terminator returns 'null'");
    testobj = httpstream._getChunkedBody(badchunkedbody1);
    t.ok(testobj === null, "Parsing chunk with bad length returns 'null'");
    testobj = httpstream._getChunkedBody(chunkedbody2);
    t.ok(testobj !== null, "Multi-chunk body parsed");
    t.equals(testobj.chunks.length, 2, "Correct number of chunks seen");
    t.equals(testobj.chunks[1].content, "fuck", "Expected chunk content seen");
    t.end();
});

++testsetnum;
test("TEST SET #"+testsetnum+": Content-Length body handling", function(t) {
    var bodystr1 = "foobar",
        goodcl = 6, badcl = 7,
        bodystr2 = "foobarGET / HTTP/1.2\r\nHost: foo", 
        testobj;
    testobj = httpstream._getBodyObj(bodystr1, goodcl);
    t.ok(testobj !== null, "Body object contructed");
    t.equals(testobj.extra, undefined, "No extra content seen on stream");
    t.equals(testobj.content, "foobar", "Correct content seen");
    testobj = httpstream._getBodyObj(bodystr1, badcl);
    t.equals(testobj, null, "Returned 'null' for incorrect content length");
    testobj = httpstream._getBodyObj(bodystr2, goodcl);
    t.ok(testobj !== null, "Body object contructed");
    t.equals(testobj.extra, "GET / HTTP/1.2\r\nHost: foo", "Correct extra content");
    t.equals(testobj.content, "foobar", "Correct content seen");
    t.end();
});

++testsetnum;
test("TEST SET #"+testsetnum+": header parsing", function(t) {
    var chunkedbody1 = "10\r\n0123456789abcdef\r\n0\r\nGET / HTTP/1.1\r\nHost: foo",
        responseheaders = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: 20",
        requestheaders = "PUT /foo/bar HTTP/1.1\r\nHost: foo\r\nContent-Length: 42",
        testobj;
    testobj = httpstream._getHeaders(chunkedbody1);
    t.equals(testobj, null, "non-header chunk returns 'null'");
    testobj = httpstream._getHeaders(responseheaders);
    t.ok(testobj !== null, "Header object created successfully");
    t.equals(testobj.type, "response", "Header data recognized as response");
    t.equals(testobj.headers["Content-Length"], "20", "Correct header value parsed");
    testobj = httpstream._getHeaders(requestheaders);
    t.ok(testobj !== null, "Header object created successfully");
    t.equals(testobj.type, "request", "Header data recognized as request");
    t.end();
});
