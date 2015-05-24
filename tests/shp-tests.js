"use strict";

var test = require("tape"),
    SHP = require("../lib/SimpleHttpParser"),
    testset = 0;

var testcase1 = new SHP.SimpleHttpParser("test-data/test-data/wireshark.raw");
var testcase2a = new SHP.SimpleHttpParser("test-data/packets/024.019.225.228.13836-096.126.115.201.00080");
var testcase2b = new SHP.SimpleHttpParser("test-data/packets/096.126.115.201.00080-024.019.225.228.13836");

test("\nSET "+ ++testset+" : Verify request types", function(t) {
    var stringCases = [
     { str:"GET / HTTP/1.1\r\n",type:"request" },
     { str:"HTTP/1.1 200 whatever\r\n",type:"response" },
     { str:"kjbkvjajkjkPOST / HTTP/1.1\r\n",type:"boundary" },
     { str:"kjbkvjajkjkPOST / HTTP/1.1foobar", type:"body" },
     { str:"kjfvjsdvk,HTTP/1.1 501 blues\r\nkjkjnger",type:"mangled" },
     { str:"",type:"empty"},
     { str:"jhfgkjhgkjhera\r\nkjnvkajkje",type:"body" }
    ];
    stringCases.forEach(function(s) {
        t.equals(testcase1.getMessageType(s.str), s.type);
    });
    t.end();
});

test("\nSET "+ ++testset+" : Verify headers", function(t) {
    var stringCases = [
     { str:"GET / HTTP/1.1\r\nfoo:ba:rrr\r\nbaz: \"kjhkjha\"",type:"request" },
     { str:"HTTP/1.1 200 OK\r\nhost::::::hi!\r\nkjhkjh: &*%$#hvjhbjd\\|''\"",type:"response" }
    ]
    stringCases.forEach(function(s) {
        var hObj = testcase1.parseHeaders(s.str);
        t.equals(hObj.type, s.type);
        t.ok(hObj.start, "has start line");
        t.ok(Object.keys(hObj.headers).length === 2, "expected headers, length");
    });
    t.end();
});

test("\nSET "+ ++testset+" : Verify body data", function(t) {
    var bodyCases = [
        { pieces:["\n\n\n\r\n","jkvfakjb","\r\n","\rmnmnkjnkjvw\n"],
          bodyObj:{bodyStr:"",numPieces:[],contentLength:28} },
        { pieces:["10\r\naksnfkdlebaneksn\r\n10\r\na\r\nb\r\n\r\nabehtbak\r\n0"],
          bodyObj:{bodyStr:"",numPieces:[]} }
    ]
    bodyCases.forEach(function(bodycase) {
        var bodyObj = testcase1.getBodyObj(bodycase.pieces, bodycase.bodyObj);
        t.ok(bodyObj === bodycase.bodyObj, "bodyObj is the same as was passed")
    });
    t.end();
});
