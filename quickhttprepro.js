"use strict";

var spawn = require("child_process").spawn,
    Args = require("commander"),
    fs = require("fs"),
    async = require("async"),
    Handlebars = require("handlebars"),
    SHP = require("SimpleHttpParser")
;
Args
    .version("0.0.1")
    .option("-d --flowdir [directory]", "directory containing list of flows. default is  "+DEFAULT_FLOWDIR)
    .option("-w --wireshark", "causes the search for flows to expect one file per tcp connectioin. without this option we look for tcpflow style file names")
    .option("-p --pcap [filename]", "pcap file.  if omitted, the directory specified by --flowdir is consulted. the --wireshark argument is ignored"),
    .option("--complete", "only dump complete flows (where we see handshake and close of the stream)")
    .parse(process.argv);

var DEFAULT_FLOWDIR = "./flows",
    flowDir = Args.flowdir || DEFAULT_FLOWDIR,
    TCPFLOW_READOPT = "-r"
    asyncList = [],
    TEMPLATE_PATH = "/home/johnny/working/node/reproapp.tmpl.js";
;

if (Args.wireshark && !Args.flowdir) {
    console.err("Must specify --flowdir with --wireshark option");
    process.exit(1);
}

if(Args.flowdir &&
   Args.wireshark &&
   !fs.existsSync(Args.flowdir)) {
        console.err("Argument 'flowdir': "+Args.flowdir+" DOES NOT EXIST");
        process.exit(1);
    }
}

if (Args.pcap && fs.existsSync(Args.pcap);
    asyncList.push(doTcpFlow);
}
else {
    console.err("could not stat "+Args.pcap+" :"+err);
    process.exit(1);
}

if (Args.complete) {
    TCPFLOW_READOPT = "-R"
}

function doTcpFlow(callback) {
    var tcpflowChild = spawn('tcpflow', ['-o', tcpflowDir, TCPFLOW_READOPT, Args.pcap]);
    callback(null, tcpflowDir);
}

function parseFlows(callback) {
    var fileDictObj = {files:{}, pairs:{}};
    process.chdir(flowdir);
    fs.readdir(flowdir, function(flowlist) {
        flowlist.forEach(function(flowfile) {
            var parser = SHP.SimpleHttpParser(flowfile);
            fileDictObj.files[flowfile] = {
                messages:parser.parsedMessages, wireshark:parser.isWireshark
            };
        }
        var referenceTable = [],
            pairs = {};
        for (var i = 0; i < flowlist.length; i++) {
            if (fileDictObj[flowlist[i]].isWireshark) {
                // this file had no related pair, mark and skip
                // why am I doing this? because I think I'm clever.. marking is not actually necessary
                referenceTable[i] = true;
                continue;
            }
            else if (referenceTable[i]) {
                continue;
            }
            var currentPrefix = flowlist[i].split("-")[0];
            for(var j = i+1; j < flowlist.length; j++) {
                if (referenceTable[j]) {
                    continue;
                }
                if (flowlist[j].search("-"+currentPrefix) != -1) {
                    pairs[flowlist[i]] = flowlist[j];
                    pairs[flowlist[j]] = flowlist[i];
                    referenceTable[i] = true;
                    referenceTable[j] = true;
                }
            }
        }
        fileDictObj.pairs = pairs;
        callback(null, fileDictObj);
    });
}

function makeTemplateValues(fileDictObj, callback) {
    var uriObjs = {uris:[]};
    for (file in fileDictObj.files) {
        if (fileDictObj.pairs != {} && fileDictObj[file].indexOf(file) != -1) {
    // 'file' is the key for one list of HTTP messages,
    // the other key is parsedFiles.pairs[file]
    // we know one file has the requests and the other has the responses
            if (fileDictObj.files[file].messages.length != fileDictObj.files[fileDictObj.pairs[file]].messages.length) {
                throw "mismatch on number of request vs response objects in files:\n "+file+" : "+fileDictObj.pairs[file];
            }
            for (var i = 0; i < fileDictObj.files[file].messages.length; i++) {
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
