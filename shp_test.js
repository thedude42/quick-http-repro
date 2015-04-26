var SHP = require("./SimpleHttpParser");
//var parser = new SHP.SimpleHttpParser("packets/024.019.225.228.13836-096.126.115.201.00080");
var parser = new SHP.SimpleHttpParser("test-data/packets/096.126.115.201.00080-024.019.225.228.13836");
var wiresharkparser = new SHP.SimpleHttpParser("test-data/wireshark.raw");

parser.on('done', function(obj) {
    console.log(JSON.stringify(parser, null, 2));
});
