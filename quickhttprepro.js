"use strict";

var spawn = require("child_process").spawn,
    Args = require("commander"),
    fs = require("fs"),
    path = require("path"),
    crypto = require("crypto"),
    async = require("async"),
    SHP = require("./SimpleHttpParser")
;
Args
    .version("0.1.0")
    .option("-d --flowdir [directory]", "directory containing list of flows. default is  "+DEFAULT_FLOWDIR)
    .option("-w --wireshark", "causes the search for flows to expect one file per tcp connectioin. without this option we look for tcpflow style file names")
    .option("-p --pcap [filename]", "pcap file.  if omitted, the directory specified by --flowdir is consulted. the --wireshark argument is ignored")
    .option("--complete", "only dump complete flows (where we see handshake and close of the stream)")
    .option("-t --tcp-port [portnum]", "Port number to use in the http final application")
    .parse(process.argv);

var DEFAULT_FLOWDIR = "./flows",
    flowDir = Args.flowdir || DEFAULT_FLOWDIR,
    portnum = Args.tcpPort || 8000, // because commander turned tcp-port in to tcpPort !!
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
                    uriObjs[lastUri]["functionName"] = "f"+crypto.createHash('sha1').update(lastUri).digest('hex');
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
                        "file":path.resolve(process.cwd(), fileDictObj.pairs[file]),
                        "bodyStart":fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].bodyOffset,
                        "bodyEnd":fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].bodyEnd,
                        "responseHeaders":fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].headerPart
                    }
                    uriObjs[fileDictObj.parsed[file].parsedMessages[i].headerPart.uri]["functionName"] = "f"+crypto.createHash('sha1').update(fileDictObj.parsed[file].parsedMessages[i].headerPart.uri).digest('hex');
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
                    uriObjs[fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].headerPart.uri]["functionName"] = "f"+crypto.createHash('sha1').update(fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].headerPart.uri).digest('hex');
                }
                else {
                    throw "should not get here ever";
                }
            }
        }
    }
    callback(null, uriObjs);
}

function makeScript(uriObjs, callback) {
    var outscript = fs.createWriteStream("./repro.js", {encoding:"utf-8"});
    var scripBeginAndUriRouterStringPieces =[
        "\"use strict\";",
        "",
        "var server = require(\"http\").createServer(uriRouter),",
        "    fs = require(\"fs\");",
        "",
        "function uriRouter(req, resp) {",
        "    switch(req.url) {"
    ];
    var scriptUriHandlerFunctions = [""];
    console.log(JSON.stringify(uriObjs, null, 2));
    for (var uri in uriObjs) {
        scripBeginAndUriRouterStringPieces.
        push("        case \""+uri+"\":");
        scripBeginAndUriRouterStringPieces.
        push("            "+uriObjs[uri].functionName+"(req, resp);");
        scripBeginAndUriRouterStringPieces.
        push("            break;");
        scriptUriHandlerFunctions.
        push("function "+uriObjs[uri].functionName+"(req, resp) {");
        scriptUriHandlerFunctions.
        push("    req.on(\"end\", function() {");
        scriptUriHandlerFunctions.
        push("        var chunks = [], totalLen = 0;");
        scriptUriHandlerFunctions.
        push("        resp.writeHead("+uriObjs[uri].responseHeaders.status_code+", \""+
            uriObjs[uri].responseHeaders.status_message+"\", "+JSON.stringify(uriObjs[uri].responseHeaders.headers)+
            ");");
        if (uriObjs[uri].bodyStart) {
            scriptUriHandlerFunctions.
            push("        var body = fs.createReadStream(\""+uriObjs[uri].file+"\", {start:"+
                uriObjs[uri].bodyStart+", end:"+uriObjs[uri].bodyEnd+"});");
            scriptUriHandlerFunctions.
            push("        body.on(\"data\", function(chunk) {");
            scriptUriHandlerFunctions.
            push("            chunks.push(chunk);");
            scriptUriHandlerFunctions.
            push("            totalLen += chunk.length;");
            scriptUriHandlerFunctions.
            push("        });");
            scriptUriHandlerFunctions.
            push("        body.on(\"end\", function() {");
            scriptUriHandlerFunctions.
            push("            chunks = Buffer.concat(chunks, totalLen);");
            scriptUriHandlerFunctions.
            push("            resp.end(chunks);");
            scriptUriHandlerFunctions.
            push("        });");
        }
        else {
            scriptUriHandlerFunctions.
            push("        resp.end();");
        }
        scriptUriHandlerFunctions.
        push("    });");
        scriptUriHandlerFunctions.
        push("    req.resume()");
        scriptUriHandlerFunctions.
        push("}");
        scriptUriHandlerFunctions.
        push("");
    }
    scripBeginAndUriRouterStringPieces.push("    }");
    scripBeginAndUriRouterStringPieces.push("}");
    scriptUriHandlerFunctions.push("server.listen("+portnum+");");
    outscript.on("open", function() {
        outscript.write(scripBeginAndUriRouterStringPieces.join("\n"));
        outscript.write(scriptUriHandlerFunctions.join("\n"));
        outscript.end();
        callback(null, true);
    });
}

async.waterfall([
    doTcpFlow,
    readDirectory,
    parseAndAgregate,
    makePairs,
    makeTemplateValues,
    makeScript
], function(err, result) {
    if (err) {
        console.err("Some task failed: "+err);
        process.exit(1);
    }
    //console.log(JSON.stringify(uriObjs, null, 2));
    console.log("All tasks complete.");
    //console.log(JSON.stringify(Args, null, 2));
});
