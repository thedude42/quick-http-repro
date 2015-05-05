"use strict";

var spawn = require("child_process").spawn,
    Args = require("commander"),
    fs = require("fs"),
    path = require("path"),
    crypto = require("crypto"),
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
    .option("-t --tcp-port [portnum]", "Port number to use in the http final application")
    .parse(process.argv);

var DEFAULT_FLOWDIR = "./flows",
    flowDir = Args.flowdir || DEFAULT_FLOWDIR,
    portnum = Args["tcp-port"] || 8000,
    TCPFLOW_READOPT = "-r",
    TEMPLATE_PATH = "./reproapp.tmpl.js";
;

if (!Args.flowdir) {
    console.log("No directory specified, using default: "+flowDir);
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
        tcpflowProcess.process.on("exit", function () {
            callback(null, flowDir);
        });
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
    var fileDictObj = {"files":[], parsed:{}};

    files.forEach(function(file) {
        if (! file.match(/^.+\.(js|xml|txt)/)) {
            fileDictObj.files.push(file);
        }
    });

    var parseDone = parsedDoneGuardCb(fileDictObj, callback);

    fileDictObj.files.forEach(function(file) {
        fileDictObj.parsed[file] = new SHP.SimpleHttpParser(path.resolve(process.cwd(), file));
        fileDictObj.parsed[file].on("done", parseDone);
    });

}

function parsedDoneGuardCb(fileDictObj, callback) {
    var count = 0,
        numFilesToParse = fileDictObj.files.length;
    return function() {
        count++;
        if (count == numFilesToParse) {
            console.log("** ALL FILES PARSE COMPLETE **");
            callback(null, fileDictObj);
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
// goal: per uri we need a set of headers, bodyStart, bodyEnd, and body file.
function makeTemplateValues(fileDictObj, callback) {
    var uriObjs = {},
        currentPair = {request:"", response:""},
        lastUri = "",
        absolutePath = "";
    for (var file in fileDictObj.parsed) {
        absolutePath = path.resolve(process.cwd(), file);
        if (fileDictObj.parsed[file].isWireshark) {
            for (var i = 0; i < fileDictObj.parsed[file].parsedMessages.length; i++) {
                if (fileDictObj.parsed[file].parsedMessages[i].type == "request") {
                    uriObjs[fileDictObj.parsed[file].parsedMessages[i].headerPart.uri] = {
                        "file":absolutePath, "bodyStart":0, "bodyEnd":0,
                        "responseHeaders":{}
                    }
                    lastUri = fileDictObj.parsed[file].parsedMessages[i].headerPart.uri;
                }
                else if (fileDictObj.parsed[file].parsedMessages[i].type == "response") {
                    if (lastUri === "") {
                        throw "Bad ordering of wireshark messages in file: "+file;
                    }
                    uriObjs[lastUri]["responseHeaders"] =  fileDictObj.parsed[file].parsedMessages[i].headerPart;
                    uriObjs[lastUri]["bodyStart"] = fileDictObj.parsed[file].parsedMessages[i].bodyOffset;
                    uriObjs[lastUri]["bodyEnd"] = fileDictObj.parsed[file].parsedMessages[i].bodyEnd;
                    uriObjs[lastUri]["functionName"] = crypto.createHash('sha1').update(lastUri).digest('hex');
                    lastUri = "";
                }
                else {
                    throw "missparsed HTTP message: "+JSON.stringify(fileDictObj.parsed[file].parsedMessages[i], null,2);
                }
            }
        }
        else { // not wireshark
            lastUri = ""; //reset this state variable that is wireshark specific
            if (fileDictObj.pairs == {}) {
                throw "no associated pairs for non-wireshark message, file: "+file;
            }
            for (var i = 0; i < fileDictObj.parsed[file].parsedMessages.length; i++) {
                if (fileDictObj.parsed[file].parsedMessages[i].type == "request") {
                    if (uriObjs[fileDictObj.parsed[file].parsedMessages[i].headerPart.uri]) {
                        continue;
                    }
                    uriObjs[fileDictObj.parsed[file].parsedMessages[i].headerPart.uri] = {
                        "file":absolutePath,
                        "bodyStart":fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].bodyOffset,
                        "bodyEnd":fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].bodyEnd,
                        "responseHeaders":fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].headerPart
                    }
                    uriObjs[fileDictObj.parsed[file].parsedMessages[i].headerPart.uri]["functionName"] = crypto.createHash('sha1').update(lastUri).digest('hex');
                }
                else if (fileDictObj.parsed[file].parsedMessages[i].type == "response") {
                    if (uriObjs[fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].headerPart.uri]) {
                        continue;
                    }
                    uriObjs[fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].headerPart.uri] = {
                        "file":absolutePath,
                        "bodyStart":fileDictObj.parsed[file].parsedMessages[i].bodyOffset,
                        "bodyEnd":fileDictObj.parsed[file].parsedMessages[i].bodyEnd,
                        "responseHeaders":fileDictObj.parsed[file].parsedMessages[i].headerPart
                    }
                    uriObjs[fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].headerPart.uri]["functionName"] = crypto.createHash('sha1').update(lastUri).digest('hex');
                }
                else {
                    throw "should not get here ever";
                }
            }
        }
    }
    callback(null, uriObjs);
}

async.waterfall([
    doTcpFlow,
    readDirectory,
    parseAndAgregate,
    makePairs,
    makeTemplateValues
], function(err, uriObjs) {
    if (err) {
        console.err("Some task failed: "+err);
        process.exit(1);
    }
    console.log(JSON.stringify(uriObjs, null, 2));
    throw "stopping here for now";
    // do templatization
    var source = "",
        templateFiller = {uris: uriObjs, portnum:appPort};
    // var source = TEMPLATE_SOURCE
    var tmplStream = fs.createReadStream(TEMPLATE_PATH);
    tmplStream.on('data', function(chunk) {
        source += chunk;
    });
    tmplStream.on('end', function() {
        var template = Handlebars.compile(source);
        functionText = template(templateFiller);
    });
});
