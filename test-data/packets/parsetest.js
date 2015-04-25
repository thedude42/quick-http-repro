"use strict";
var fs = require("fs");

var rs = fs.createReadStream("096.126.115.201.00080-024.019.225.228.13836");


rs.on('data', function(chunk) {
  var chunkstr =  chunk.toString('ascii');
  var headBodyPieces = chunkstr.split("\r\n\r\n");
  var idx = chunkstr.search("\r\n\r\n");
  console.log("pieces: "+headBodyPieces.length);
  var offset = idx+4;
  while (idx != -1) {
    console.log("saw header separator at: "+offset);
    idx = chunkstr.slice(offset, chunk.length).search("\r\n\r\n");
    offset += idx+4;
    if (offset == chunk.length) {
        break;
    }
  }
  for (var i = 0; i < headBodyPieces.length; i++) {
    if (headBodyPieces[i].search("Host:") != -1) {
        console.log("message "+i+" is a request header");
    }
    else if (headBodyPieces[i].search("Content-Length") != -1 ||
            headBodyPieces[i].search("Transfer-Encoding") != -1 ||
            headBodyPieces[i].search(" 304 ") != -1) {
        console.log("message "+i+" is a response header");
    }
    else {
        console.log(["message ",i," is the body of message ",i-1].join(''));
    }
  }

});
