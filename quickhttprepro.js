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
    asyncList = [],
    TEMPLATE_PATH = "/home/johnny/working/node/reproapp.tmpl.js";
;

if (!Args.flowdir) {
    console.log("No directory specified, using default: ./flowdir");
    if (! fs.existsSync(flowDir)) {
        fs.mkdirSync(flowDir);
    }
}

if(Args.flowdir && Args.wireshark && !fs.existsSync(Args.flowdir)) {
    console.error("Argument 'flowdir': "+Args.flowdir+" DOES NOT EXIST");
    process.exit(1);
}

if (Args.pcap && fs.existsSync(Args.pcap)) {
    asyncList.push(doTcpFlow);
}

if (Args.complete) {
    TCPFLOW_READOPT = "-R"
}

/* TODO: welcome to hell

    Originally I aproached this whole thing synchronously.  then I built the SimpleHttpParser object
    as an asynchronous file parser.  now I need to re-design.

*/
function doTcpFlow(callback) {
    var tcpflowChild = spawn('tcpflow', ['-o', tcpflowDir, TCPFLOW_READOPT, Args.pcap]);
    callback(null, {process:tcpflowChild, dir:tcpflowDir});
}

function parseFlows(tcpflowProcess, callback) {
    if (!callback) {
        callback = tcpflowProcess;
        tcpflowProcess = undefined;
    }
    var fileDictObj = {files:{}, pairs:{}};
    if (tcpflowProcess) {
        tcpflowProcess.process.on("exit", parseFlowFilesInDir(callback, fileDictObj));
    }
    else {
        parseFlowFilesInDir(callback, fileDictObj)();
    }
}

function parseFlowFilesInDir(callback, fileDictObj) {
//TODO: provide a well thought out comment to document what is happening here... if it works
    return function() {
        process.chdir(flowDir);
        fs.readdir(process.cwd(), function(err, flowlist) {
            if (err) {
                console.error("Could not read flows from directory "+flowDir+"\n"+err);
                process.exit(1);
            }
            for (var i = 0; i < flowlist.length; i++) {
                var referenceTable = [], // keeps track of when files have been added to a pair
                    pairs = {};
                if (! flowlist[i].match(/^.+\.(txt|js|xml)$/)) {
                    var parser = new SHP.SimpleHttpParser(path.resolve(process.cwd(), flowlist[i]));
                    fileDictObj.files[flowlist[i]] = parser;
                    console.log("assigned parser object to file dict: "+flowlist[i]);

                    fileDictObj.files[flowlist[i]].on("done", function() {
                        console.log("filedict at callback:\n"+JSON.stringify(fileDictObj,null,2));
                        var idx = i;
                        return function() {
                            if (fileDictObj.files[flowlist[idx]].parser.isWireshark) {
                        // this file had no related pair, mark and skip
                        // why am I doing this? because I think I'm clever.. marking is not actually necessary
                                referenceTable[idx] = true;
                            }
                            var currentPrefix = flowlist[idx].split("-")[0];
                        };
                        for(var j = idx+1; j < flowlist.length; j++) {
                            if (referenceTable[j]) {
                                continue;
                            }
                            if (flowlist[j].search("-"+currentPrefix) != -1) {
                                pairs[flowlist[idx]] = flowlist[j];
                                pairs[flowlist[j]] = flowlist[i];
                                referenceTable[idx] = true;
                                referenceTable[j] = true;
                            }
                        }
                    });
                }
            }
            fileDictObj.pairs = pairs;
            callback(null, fileDictObj);
        });
    };
}


//TODO: async hell: this function is called when other callbacks need to complete.
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
                // regex .exec match on messages[i].headerPart.start to get either status or uri
                // depending on messages[i].type
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

async.waterfall(asyncList, function(err, templateFiller) {
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
