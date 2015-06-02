var SHP = require("./lib/SimpleHttpParser");


//var parser = new SHP.SimpleHttpParser("test-data/packets/024.019.225.228.13836-096.126.115.201.00080");
//var parser = new SHP.SimpleHttpParser("test-data/packets/024.019.225.228.38222-096.126.115.201.00080");
//parser.init();
//var parser2 = new SHP.SimpleHttpParser("test-data/packets/096.126.115.201.00080-024.019.225.228.38222");
//parser2.init();
var parser3 = new SHP.SimpleHttpParser("test-data/packets/198.232.125.120.00080-192.168.031.201.55215");
parser3.init();

parser3.on('done', function(obj) {
    console.log(parser3.parsedMessages.length+" Messages")
    console.log(JSON.stringify(parser3, null, 2));
});

/*
var wiresharkparser = new SHP.SimpleHttpParser("test-data/wireshark.raw");
wiresharkparser.on('done', function(obj) {
    console.log(JSON.stringify(wiresharkparser, null, 2));
});

parser.on('done', function(obj) {
    console.log(JSON.stringify(parser, null, 2));
});

parser2.on('done', function(obj) {
    console.log(JSON.stringify(parser2, null, 2));
});*/
