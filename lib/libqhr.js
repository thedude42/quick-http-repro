"use strict";

var Args = require("commander"),
    fs = require("fs"),
    spawn = require("child_process").spawn,
    path = require("path"),
    SHP = require("./SimpleHttpParser"),
    crypto = require("crypto"),
    DEFAULT_FLOWDIR = "flows",
    flowDir,
    portnum,
    DEFAULT_PORT = 8000,
    TCPFLOW_READOPT = "";

module.exports.processArgs = function processArgs(argv) {
    Args
        .version("0.1.0")
        .option("-d --flowdir [directory]", "directory containing list of flows. default is  "+DEFAULT_FLOWDIR)
        .option("-w --wireshark", "causes the search for flows to expect one file per tcp connectioin. without this option we look for tcpflow style file names")
        .option("-p --pcap [filename]", "pcap file.  if omitted, the directory specified by --flowdir is consulted. the --wireshark argument is ignored")
        .option("--complete", "only dump complete flows (where we see handshake and close of the stream)")
        .option("-t --tcp-port [portnum]", "Port number to use in the http final application")
        .parse(argv);

    flowDir = Args.flowdir || path.resolve(process.cwd(), DEFAULT_FLOWDIR);
    portnum = Args.tcpPort || DEFAULT_PORT; // because commander turned tcp-port in to tcpPort !!
    TCPFLOW_READOPT = "-r";

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

    if (Args.complete) {
        TCPFLOW_READOPT = "-R"
    }
}

module.exports.doTcpFlow = function doTcpFlow(callback) {
    if (Args.pcap) {
        spawn("which", ["tcpflow"])
        .on("error", function(err) {
            console.log(err);
            console.log("tcpflow program is not in the users path.  Can't process pcap.");
            process.exit(1);
        });
        spawn("tcpflow", ["-o", flowDir, TCPFLOW_READOPT, Args.pcap])
        .on("error", function(err) {
            console.log(err);
        })
        .on("exit", function () {
            callback(null, flowDir);
        });
    }
    else {
        callback(null, flowDir);
    }
}

module.exports.readDirectory = function readDirectory(dir, callback) {
    fs.readdir(dir, function(err, files) {
        process.chdir(dir);
        callback(null, files);
    });
}

module.exports.parseAndAgregate = function parseAndAgregate(files, callback) {
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
        fileDictObj.parsed[file].init();
    });

}

module.exports.makePairs = function makePairs(fileDictObj, callback) {
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

// TODO: include request headers in uriObjs
module.exports.makeTemplateValues = function makeTemplateValues(fileDictObj, callback) {
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
                    uriObjs[lastUri]["chunks"] = fileDictObj.parsed[file].parsedMessages[i].chunkMessages;
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
                        "responseHeaders":fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].headerPart,
                        "chunks":fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].chunkMessages
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
                        "responseHeaders":fileDictObj.parsed[file].parsedMessages[i].headerPart,
                        "chunks":fileDictObj.parsed[file].parsedMessages[i].chunkMessages
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

// TODO: insert comment for each switch case URI for the curl command that will
//       replicate the client code (must fix makeTemplateValues to include request headers)
module.exports.makeScript = function makeScript(uriObjs, callback) {
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
    //console.log(JSON.stringify(uriObjs, null, 2));
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
            if (uriObjs[uri].chunks === undefined) {
                scriptUriHandlerFunctions.
                push("            resp.end(chunks);");
            }
            else {
                scriptUriHandlerFunctions.
                push("            doChunkStream(chunks, resp);");
            }
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
    scriptUriHandlerFunctions.
    push("");
    scriptUriHandlerFunctions.
    push(chunkfixer);
    scriptUriHandlerFunctions.
    push("");
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

var chunkfixer = 'function doChunkStream(chunks, resp) {\n    var splitChunks = chunks.toString("ascii").split("\\r\\n"),\n    i = 0,\n    contentStart = 0, contentEnd = -2,\n    currentLen;\n    splitChunks.pop();\n    splitChunks.pop();\n    console.log(splitChunks)\n    while (i < splitChunks.length) {\n        if (splitChunks[i] === "0" && i === splitChunks.length - 1) {\n            console.log("ended")\n            resp.end();\n            i += 1;\n            continue;\n        }\n        else if (splitChunks[i+1] === splitChunks.length -1) {\n            throw "unimplemented: chunk extension";\n        }\n        else if (/^[0-9a-fA-F]+$/.test(splitChunks[i])) {\n            currentLen = splitChunks[i];\n            contentStart = contentEnd + splitChunks[i].length + 4;\n            contentEnd = contentStart + parseInt("0x"+currentLen, 16);\n            i += 2;\n        }\n        else {\n            contentEnd += 2+splitChunks[i].length;\n            i += 1;\n        }\n        console.log("i: "+i+" chunklen: "+parseInt("0x"+currentLen, 16)+" contentlen: "+(contentEnd - contentStart))\n        if (parseInt("0x"+currentLen, 16) === contentEnd-contentStart) {\n            resp.write(chunks.slice(contentStart, contentEnd));\n        }    }\n    console.log("OUT OF LOOP: i: "+i+" chunklen: "+parseInt("0x"+currentLen, 16));\n}';

function doChunkStream(chunks, resp) {
    var splitChunks = chunks.toString("ascii").split("\r\n"),
    i = 0,
    contentStart = 0, contentEnd = -2,
    currentLen;
    splitChunks.pop();
    splitChunks.pop();
    console.log(splitChunks)
    while (i < splitChunks.length) {
        if (splitChunks[i] === "0" && i === splitChunks.length - 1) {
            console.log("ended")
            resp.end();
            i += 1;
            continue;
        }
        else if (splitChunks[i+1] === splitChunks.length -1) {
            throw "unimplemented: chunk extension";
        }
        else if (/^[0-9a-fA-F]+$/.test(splitChunks[i])) {
            currentLen = splitChunks[i];
            contentStart = contentEnd + splitChunks[i].length + 4;
            contentEnd = contentStart + parseInt("0x"+currentLen, 16);
            i += 2;
        }
        else {
            contentEnd += 2+splitChunks[i].length;
            i += 1;
        }
        console.log("i: "+i+" chunklen: "+parseInt("0x"+currentLen, 16)+" contentlen: "+(contentEnd - contentStart))
        if (parseInt("0x"+currentLen, 16) === contentEnd-contentStart) {
            resp.write(chunks.slice(contentStart, contentEnd));
        }
    }
    console.log("OUT OF LOOP: i: "+i+" chunklen: "+parseInt("0x"+currentLen, 16));
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
