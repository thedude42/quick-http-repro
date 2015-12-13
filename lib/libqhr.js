"use strict";

var Args = require("commander"),
    reload = require('require-reload')(require),
    fs = require("fs"),
    spawn = require("child_process").spawn,
    path = require("path"),
    SHP = require("./SimpleHttpParser"),
    crypto = require("crypto"),
    DEFAULT_FLOWDIR = "flows",
    config = { flowDir:null,
                portnum:null,
                tcpflowReadopt:"",
                pcap:null
    },
    DEFAULT_PORT = 8000
;
module.exports.getArgsConfig = function getArgsConfig() {
    return config;
};

// supports testing
module.exports._reloadCommander = function _reloadCommander() {
    Args = reload("commander");
};

module.exports.processArgs = function processArgs(argv) {
    Args
        .version("0.1.0")
        .option("-d --flowdir [directory]", "directory containing list of flows. default is  "+DEFAULT_FLOWDIR)
        .option("-p --pcap [filename]", "pcap file.  if omitted, the directory specified by --flowdir is consulted. the --wireshark argument is ignored")
        .option("--complete", "only dump complete flows (where we see handshake and close of the stream)")
        .option("-t --tcp-port [portnum]", "Port number to use in the http final application")
        .option("-n --names", "generate hosts file from Host header values")
        .parse(argv);

    config.flowDir = Args.flowdir || DEFAULT_FLOWDIR;
    config.portnum = Args.tcpPort || DEFAULT_PORT; // because commander turned tcp-port in to tcpPort !!
    config.tcpflowReadopt = "-r";
    config.pcap = Args.pcap;
    config.hosts = Args.names;


    if (!Args.flowdir) {
        console.log("No directory specified, using default: "+config.flowDir);
        if (! fs.existsSync(config.flowDir)) {
            fs.mkdirSync(config.flowDir);
        }
    }

    if(Args.flowdir && !fs.existsSync(Args.flowdir)) {
        console.error("Argument 'flowdir': "+Args.flowdir+" DOES NOT EXIST");
        process.exit(1);
    }

    if (Args.complete) {
        config.tcpflowReadopt = "-R";
    }
    return Args; // for tests
};

module.exports.doTcpFlow = function doTcpFlow(callback) {
    if (config.pcap) {
        spawn("which", ["tcpflow"])
        .on("error", function(err) {
            console.log(err);
            console.log("tcpflow program is not in the users path.  Can't process pcap.");
            process.exit(1);
        });
        spawn("tcpflow", ["-o", config.flowDir, config.tcpflowReadopt, config.pcap])
        .on("error", function(err) {
            console.log(err);
            process.exit(1);
        })
        .on("exit", function () {
            callback(null, config.flowDir);
        });
    }
    else {
        callback(null, config.flowDir);
    }
};

module.exports.readDirectory = function readDirectory(dir, callback) {
    fs.readdir(dir, function(err, files) {
        process.chdir(dir);
        callback(null, files);
    });
};

module.exports.getParsedFiles = function getParsedFiles(files, callback) {
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

};

module.exports.makePairs = function makePairs(fileDictObj, callback) {
    var referenceTable = [], // keeps track of when files have been added to a pair
        files = fileDictObj.files,
        pairs = {};
    for (var i = 0; i < files.length; i++) {
        var socketTuple = files[i].split("-");
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
            if (files[j] === socketTuple[1]+"-"+socketTuple[0]) {
                pairs[files[i]] = files[j];
                pairs[files[j]] = files[i];
                referenceTable[j] = true;
            }
        }
    }
    fileDictObj.pairs = pairs;
    callback(null, fileDictObj);
};

// TODO: include request headers in uriObjs
module.exports.makeSourceData = function makeTemplateValues(fileDictObj, callback) {
    var uriObjs = {},
        absolutePath = "";
    for (var file in fileDictObj.parsed) {
        if (fileDictObj.parsed[file].isWireshark) {
            populateWiresharkObjs(file, fileDictObj, uriObjs);
        }
        else { // not wireshark
            populateTcpflowObjs(file, fileDictObj, uriObjs);
        }
    }
    callback(null, uriObjs);
};

function populateWiresharkObjs(file, fileDictObj, uriObjs) {
    var lastUri = "",
    absolutePath = path.resolve(process.cwd(), file);
    for (var i = 0; i < fileDictObj.parsed[file].parsedMessages.length; i++) {
        if (fileDictObj.parsed[file].parsedMessages[i].type == "request") {
            uriObjs[fileDictObj.parsed[file].parsedMessages[i].headerPart.uri] = {
                "file":absolutePath,
                "bodyStart":0,
                "bodyEnd":0,
                "responseHeaders":{},
                "requestHeaders":fileDictObj.parsed[file].parsedMessages[i].headerPart.heders
            };
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

function populateTcpflowObjs(currFile, fileDictObj, uriObjs) {
    var file = currFile,
        absolutePath,
        uri,
        rqstHeaders;
    if (fileDictObj.pairs == {}) {
        throw "no associated pairs for non-wireshark message, file: "+file;
    }
    for (var i = 0; i < fileDictObj.parsed[file].parsedMessages.length; i += 1) {
        if (fileDictObj.parsed[file].parsedMessages[i].type == "request") {
            uri = fileDictObj.parsed[file].parsedMessages[i].headerPart.uri;
            rqstHeaders = fileDictObj.parsed[file].parsedMessages[i].headerPart;
            // must be done last
            file = fileDictObj.pairs[file];
        }
        else {
            uri = fileDictObj.parsed[fileDictObj.pairs[file]].parsedMessages[i].headerPart.uri;
        }
        absolutePath = path.resolve(process.cwd(), file);
        uriObjs[uri] = {
            "file":absolutePath,
            "bodyStart":fileDictObj.parsed[file].parsedMessages[i].bodyOffset,
            "bodyEnd":fileDictObj.parsed[file].parsedMessages[i].bodyEnd,
            "responseHeaders":fileDictObj.parsed[file].parsedMessages[i].headerPart,
            "chunks":fileDictObj.parsed[file].parsedMessages[i].chunkMessages
        };
        uriObjs[uri]["functionName"] = "f"+crypto.createHash('sha1').update(uri).digest('hex');
    }
}

module.exports.makeHosts = function makeHosts(uriObjs, callback) {
    if (! config.names) {
        callback(null, true);
    }
    console.log("TODO: build hosts file");


    callback(null, true);
};

// TODO: insert comment for each switch case URI for the curl command that will
//       replicate the client code (must fix makeTemplateValues to include request headers)
module.exports.makeScript = function makeScript(uriObjs, callback) {
    var outscript = fs.createWriteStream("repro.js", {encoding:"utf-8"});
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
    scriptUriHandlerFunctions.push("server.listen("+config.portnum+");");
    outscript.on("open", function() {
        outscript.write(scripBeginAndUriRouterStringPieces.join("\n"));
        outscript.write(scriptUriHandlerFunctions.join("\n"));
        outscript.end();
        callback(null, uriObjs);
    });
};

var chunkfixer = 'function doChunkStream(chunks, resp) {\n    var splitChunks = chunks.toString("ascii").split("\\r\\n"),\n    i = 0,\n    contentStart = 0, contentEnd = -2,\n    currentLen;\n    splitChunks.pop();\n    splitChunks.pop();\n    //console.log(splitChunks)\n    while (i < splitChunks.length) {\n        if (splitChunks[i] === "0" && i === splitChunks.length - 1) {\n            //console.log("ended")\n            resp.end();\n            i += 1;\n            continue;\n        }\n        else if (splitChunks[i+1] === splitChunks.length -1) {\n            throw "unimplemented: chunk extension";\n        }\n        else if (/^[0-9a-fA-F]+$/.test(splitChunks[i])) {\n            currentLen = splitChunks[i];\n            contentStart = contentEnd + splitChunks[i].length + 4;\n            contentEnd = contentStart + parseInt("0x"+currentLen, 16);\n            i += 2;\n        }\n        else {\n            contentEnd += 2+splitChunks[i].length;\n            i += 1;\n        }\n        //console.log("i: "+i+" chunklen: "+parseInt("0x"+currentLen, 16)+" contentlen: "+(contentEnd - contentStart))\n        if (parseInt("0x"+currentLen, 16) === contentEnd-contentStart) {\n            resp.write(chunks.slice(contentStart, contentEnd));\n        }    }\n    //console.log("OUT OF LOOP: i: "+i+" chunklen: "+parseInt("0x"+currentLen, 16));\n}';

function doChunkStream(chunks, resp) {
    var splitChunks = chunks.toString("ascii").split("\r\n"),
    i = 0,
    contentStart = 0, contentEnd = -2,
    currentLen;
    splitChunks.pop();
    splitChunks.pop();
    console.log(splitChunks);
    while (i < splitChunks.length) {
        if (splitChunks[i] === "0" && i === splitChunks.length - 1) {
            console.log("ended");
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
        console.log("i: "+i+" chunklen: "+parseInt("0x"+currentLen, 16)+" contentlen: "+(contentEnd - contentStart));
        if (parseInt("0x"+currentLen, 16) === contentEnd-contentStart) {
            resp.write(chunks.slice(contentStart, contentEnd));
        }
    }
    console.log("OUT OF LOOP: i: "+i+" chunklen: "+parseInt("0x"+currentLen, 16));
}

function parsedDoneGuardCb(fileDictObj, callback) {
    var count = 0,
        callbackParam = fileDictObj,
        numFiles = fileDictObj.files.length;
    return function() {
        count += 1;
        if (count === numFiles) {
            console.log("** ALL FILES PARSE COMPLETE **");
            callback(null, fileDictObj);
        }
        else if (count > numFiles) {
            throw new Error("WTF why are we still getting called?");
        }
    };
}
