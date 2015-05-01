"use strict";

var spawn = require("child_process").spawn,
    Args = require("commander"),
    fs = require("fs"),
    path = require("path"),
    async = require("async"),
    Handlebars = require("handlebars"),
    SHP = require("./SimpleHttpParser")
;
Args
    .version("0.0.1")
    .option("-d --flowdir [directory]", "directory containing list of flows. default is  "+DEFAULT_FLOWDIR)
    .option("-w --wireshark", "causes the search for flows to expect one file per tcp connectioin. without this option we look for tcpflow style file names")
    .option("-p --pcap [filename]", "pcap file.  if omitted, the directory specified by --flowdir is consulted. the --wireshark argument is ignored")
    .option("--complete", "only dump complete flows (where we see handshake and close of the stream)")
    .parse(process.argv);

var DEFAULT_FLOWDIR = "./flows",
    flowDir = Args.flowdir || DEFAULT_FLOWDIR,
    TCPFLOW_READOPT = "-r",
    TEMPLATE_PATH = "/home/johnny/working/node/reproapp.tmpl.js";
;

if (!Args.flowdir) {
    console.log("No directory specified, using default: ./flowdir");
    if (! fs.existsSync(flowDir)) {
        fs.mkdirSync(flowDir);
    }
}

if(Args.flowdir && !fs.existsSync(Args.flowdir)) {
    console.error("Argument 'flowdir': "+Args.flowdir+" DOES NOT EXIST");
    process.exit(1);
}

if (Args.pcap && fs.existsSync(Args.pcap)) {
    asyncList.push(doTcpFlow);
}

if (Args.complete) {
    TCPFLOW_READOPT = "-R"
}


function doTcpFlow(callback) {
    if (Args.pcap) {
        var tcpflowChild = spawn('tcpflow', ['-o', flowDir, TCPFLOW_READOPT, Args.pcap]);
        tcpflowProcess.process.on("exit", callback(null, flowDir);
    }
    else {
        callback(null, flowDir);
    }
}

function readDirectory(dir, callback) {
    fs.readdir(dir, function(err, files) {
        process.chdir(dir);
        callback(null, files);
    });
}

function parseAndAgregate(files, callback) {
    var fileDictObj = {fileList:[], parsed:{}},
        parseDone = parsedDoneGuardCb(fileDictObj, callback);

    files.forEach(function(file) {
        if (! file.match(/^.+\.(js|xml|txt)/)) {
            fileDictObj.fileList.push(file);
        }
    });
    fileDictObj.fileList.forEach(function(file) {
        fileDictObj.parsed[file] = new SHP.SimpleHttpParser(path.resolve(process.cwd(), file));
        fileDictObj.parsed[file].on("done", parseDone);
    });

}

function parsedDoneGuardCb(fileDictObj, callback) {
    var count = 0,
        numFilesToParse = fileDictObj.files.length;
    return function() {
        count++;
        if (count == numParsingFiles) {
            console.log("Completed, expect fall through");
            callback(null, agregateObj);
        }
    }
}

function makePairs(fileDictObj, callback) {
    var referenceTable = [], // keeps track of when files have been added to a pair
        files = fileDictObj.files,
        pairs = {};
    for (var i = 0; i < files.length; i++) {
        var currentPrefix = files[i].split("-")[0];
        if (referenceTable[i]) {
            continue;
        }
        referenceTable[i] = true;
        if (fileDictObj.parsed[files[i]].isWireshark) { //no pairs for wireshark flows
            continue;
        }
        for(var j = i+1; j < files.length; j++) {
            if (referenceTable[j]) {
                continue;
            }
            if (files[j].search("-"+currentPrefix) != -1) {
                pairs[files[i]] = files[j];
                pairs[files[j]] = files[i];
                referenceTable[j] = true;
            }
        }
    }
    fileDictObj.pairs = pairs;
    callback(null, fileDictObj);
}

//TODO: evaluate how to use the current version of fileDictObj to fill out the template values
function makeTemplateValues(fileDictObj, callback) {
    var uriObjs = {uris:[]};
    for (var file in fileDictObj.files) {
        if (fileDictObj.pairs != {}) {
    // 'file' is the key for one list of HTTP messages,
    // the other key is parsedFiles.pairs[file]
    // we know one file has the requests and the other has the responses
            console.log("fileDictObj["+file+"] : "+JSON.stringify(fileDictObj.files[file],null,2));
            console.log("pairs: "+JSON.stringify(fileDictObj.pairs,null,2));
            if (fileDictObj.files[file].parsedMessages.length != fileDictObj.files[fileDictObj.pairs[file]].parsedMessages.length) {
                throw "mismatch on number of request vs response objects in files:\n "+file+" : "+fileDictObj.pairs[file];
            }
            for (var i = 0; i < fileDictObj.files[file].messages.length; i++) {
                throw "unimplemented, TODO: pick up from here";

            }
        }
        else if (fileDictObj.pairs == {}) {
            // do wireshark thing
        }
        else {
            throw "file "+file+" does not have an associated pair";
        }
    }
}

asyncList.push(parseFlows);
asyncList.push(makeTemplateValues);

async.waterfall([
    doTcpFlow,
    readDirectory,
    parseAndAgregate,
    makePairs,
    makeTemplateValues
], function(err, templateFiller) {
    if (err) {
        console.err("Some task failed: "+err);
        process.exit(1);
    }
    // do templatization
    var source = "";
    // var source = TEMPLATE_SOURCE
    var tmplStream = fs.createReadStream(TEMPLATE_PATH);
    tmplStream.on('data', function(chunk) {
        source += chunk;
    });
    tmplStream.on('end', function() {
        var template = Handlebars.compile(source);
        functionText = template(templateFiller);
    })
});
