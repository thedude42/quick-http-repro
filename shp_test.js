var SHP = require("./SimpleHttpParser"),
    fs = require("fs"),
    path = require("path"),
    async = require("async");


var parserJobs = 0,
    completedJobs = 0;
/*
function readDirectory(dir, callback) {
    fs.readdir(dir, function(err, files) {
        process.chdir(dir);
        callback(null, files);
    });
}

function makeAgregateObject(files, callback) {
    var agregateObj = {fileList:[], parsed:{}},
        parseDone = parseCompleteCb(agregateObj, callback);

    files.forEach(function(file) {
        if (! file.match(/^.+\.(js|xml|txt)/)) {
            agregateObj.fileList.push(file);
        }
    });
    agregateObj.fileList.forEach(function(file) {
        agregateObj.parsed[file] = new SHP.SimpleHttpParser(path.resolve(process.cwd(), file));
        agregateObj.parsed[file].on("done", parseDone);
    });

}

function parseCompleteCb(agregateObj, callback) {
    var count = 0;
    return function() {
        count++;
        console.log("ParseComplete callback count: "+count);
        console.log("fileList len: "+agregateObj.fileList.length);
        if (count == agregateObj.fileList.length) {
            console.log("Completed, expect fall through");
            callback(null, agregateObj);
        }
    }
}

async.waterfall([
    function(callback) {
        callback(null, "test-data/packets/");
    },
    readDirectory,
    makeAgregateObject
], function(err, result) {
    console.log("wtf mate");
    if (err) {
        console.log("whoops, got err on final waterfall callback");
    }
    else {
        console.log("done: "+JSON.stringify(result, null, 2));
    }
});
*/

/*
var parser = new SHP.SimpleHttpParser("packets/024.019.225.228.13836-096.126.115.201.00080");
var parser = new SHP.SimpleHttpParser("096.126.115.201.00080-024.019.225.228.13836");
*/
var wiresharkparser = new SHP.SimpleHttpParser("test-data/wireshark.raw");
wiresharkparser.on('done', function(obj) {
    console.log(JSON.stringify(wiresharkparser, null, 2));
});
/*
parser.on('done', function(obj) {
    console.log(JSON.stringify(parser, null, 2));
});
*/
