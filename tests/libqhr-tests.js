"use strict";

var test = require("tape"),
    fs = require("fs"),
    crypto = require("crypto"),
    through = require("through2"),
    exec = require("child_process").exec,
    reload = require('require-reload')(require),
    libqhr = require("../lib/libqhr"),
    defaultConfig = { flowDir:null,
                portnum:null,
                tcpflowReadopt:"",
                pcap:null
    };

test("validate test-data: http.pcap", function(t) {
    var httpsha = crypto.createHash("sha1");
    t.plan(1);
    fs.createReadStream("test-data/http.pcap")
    .on("data", function(chunk) {
        httpsha.update(chunk);
    })
    .on("end", function() {
        t.equals(httpsha.digest('hex'), "87d6f10180e7a7c5e9125c570d6ba6216de0fb6f");
        t.end();
    })
});

test("validate test-data: wireshark.raw", function(t) {
    var wiresharksha = crypto.createHash("sha1");
    t.plan(1);
    fs.createReadStream("test-data/wireshark.raw")
    .on("data", function(chunk) {
        wiresharksha.update(chunk);
    })
    .on("end", function() {
        t.equals(wiresharksha.digest('hex'), "a1d5e2129834b96842a8501bacecf348e092dbd4");
        t.end();
    })
});

test("\nargv test: -d, --complete and --tcp-port", function(t) {
    //reloadLibQHR();
    t.deepEquals(defaultConfig, libqhr.getArgsConfig());
    var testdir = "testdir";
    fs.mkdirSync(testdir);
    var args =  libqhr.processArgs(["argv[0]", "argv[1]", "-d", testdir, "--complete", "--tcp-port", "8100"]);
    t.equals(args.flowdir, testdir);
    t.equals(libqhr.getArgsConfig().flowDir, testdir);
    t.ok(args.complete);
    t.equals(args.tcpPort, "8100");
    fs.rmdirSync(testdir);

    t.end();
})

test("\nargv test: with -p only", function(t) {
    reloadLibQHR();
    t.deepEquals(defaultConfig, libqhr.getArgsConfig());
    console.log("Calling processArgs()");
    var args = libqhr.processArgs(["argv[0]", "argv[1]", "-p", "test.pcap"]);
    t.equal(args.pcap, "test.pcap");
    t.equal(libqhr.getArgsConfig().pcap, "test.pcap");
    t.equal(libqhr.getArgsConfig().flowDir, "flows");
    t.notOk(args.complete);
    fs.rmdirSync("flows");
    t.end();
});

test("\nargv test: -d and -p", function(t) {
    reloadLibQHR();
    t.deepEquals(defaultConfig, libqhr.getArgsConfig());
    var testdir = "testdir";
    fs.mkdirSync(testdir);
    var args = libqhr.processArgs(["argv[0]", "argv[1]", "-d", testdir, "-p", "test.pcap"]);
    t.equal(args.pcap, "test.pcap");
    t.equal(libqhr.getArgsConfig().pcap, "test.pcap");
    t.equals(args.flowdir, testdir);
    t.equals(libqhr.getArgsConfig().flowDir, testdir);
    t.notOk(args.complete);
    fs.rmdirSync(testdir);

    t.end();
});

test("\ntest doTcpflow, http.pcap", function(t) {
    reloadLibQHR();
    t.deepEquals(defaultConfig, libqhr.getArgsConfig());
    var testdir = "tcpflowTestDir";
    fs.mkdirSync(testdir);
    var args = libqhr.processArgs(["argv[0]", "argv[1]", "-d", testdir, "-p", "test-data/http.pcap"]);
    libqhr.doTcpFlow(function(err, result) {
        t.equals(err, null);
        t.equals(result, testdir);
        t.equals(libqhr.getArgsConfig().pcap, "test-data/http.pcap");
        t.equals(fs.readdirSync(testdir).length, 18);
        exec("rm -rf "+testdir, function(err) {
            if (err) {
                console.log(err);
                process.exit(1);
            }
            t.end();
        });
    })
});

test("\nparse a file: 096.126.115.201.00080-024.019.225.228.13836", function(t) {
    t.plan(5);
    reloadLibQHR();
    t.deepEquals(defaultConfig, libqhr.getArgsConfig());
    var testdir = "parseTestDir";
    fs.mkdirSync(testdir);
    libqhr.processArgs(["argv[0]", "argv[1]", "-d", testdir, "-p", "test-data/http.pcap"]);
    libqhr.doTcpFlow(function(err) {
        var files =[testdir+"/096.126.115.201.00080-024.019.225.228.13836"];
        libqhr.getParsedFiles(files, function(err, fileDictObj) {
            t.notOk(err);
            console.log(Object.keys(fileDictObj));
            t.equals(fileDictObj.files.length, 1);
            t.notOk(fileDictObj.parsed[testdir+"/096.126.115.201.00080-024.019.225.228.13836"]
            .isWireshark);
            exec("rm -rf "+testdir, function(err) {
                t.notOk(err);
                t.end();
            })
        });
    });
});

test("\nparse a file: wireshark.raw", function(t) {
    t.plan(5);
    reloadLibQHR();
    t.deepEquals(defaultConfig, libqhr.getArgsConfig());
    var testdir = "parseTestDir";
    fs.mkdirSync(testdir);
    libqhr.processArgs(["argv[0]", "argv[1]", "-d", testdir]);
    libqhr.doTcpFlow(function(err) {
        var files =["test-data/wireshark.raw"];
        libqhr.getParsedFiles(files, function(err, fileDictObj) {
            t.notOk(err);
            console.log(Object.keys(fileDictObj.parsed["test-data/wireshark.raw"]));
            t.equals(fileDictObj.files.length, 1);
            t.ok(fileDictObj.parsed["test-data/wireshark.raw"].isWireshark)
            console.log(fileDictObj.parsed.length)
            exec("rm -rf "+testdir, function(err) {
                t.notOk(err);
                t.end();
            })
        });
    });
});

function reloadLibQHR() {
    console.log("reloading libqhr")
    libqhr = reload("../lib/libqhr");
    libqhr._reloadCommander();
    //console.log("doing funky reload require thing")
    //reloadCommander = require('require-reload')(libqhr.requireCtxt);
    //console.log("attemptong to reload remote commander")
    //reloadCommander("commander");
}

function requireUncached(module){
    require.uncache(module);
}

require.uncache = function (moduleName) {
// Run over the cache looking for the files
// loaded by the specified module name
require.searchCache(moduleName, function (mod) {
    delete require.cache[mod.id];
});

// Remove cached paths to the module.
// Thanks to @bentael for pointing this out.
Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
    if (cacheKey.indexOf(moduleName)>0) {
        delete module.constructor._pathCache[cacheKey];
    }
});
};

/**
* Runs over the cache to search for all the cached
* files
*/
require.searchCache = function (moduleName, callback) {
// Resolve the module identified by the specified name
var mod = require.resolve(moduleName);

// Check if the module has been resolved and found within
// the cache
if (mod && ((mod = require.cache[mod]) !== undefined)) {
    // Recursively go over the results
    (function run(mod) {
        // Go over each of the module's children and
        // run over it
        mod.children.forEach(function (child) {
            run(child);
        });

        // Call the specified callback providing the
        // found module
        callback(mod);
    })(mod);
}
};
