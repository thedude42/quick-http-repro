#!/usr/bin/env node

"use strict";

var async = require("async"),
    qhr = require("./lib/libqhr")
;

qhr.processArgs(process.argv);

async.waterfall([
    qhr.doTcpFlow,
    qhr.readDirectory,
    qhr.parseAndAgregate,
    qhr.makePairs,
    qhr.makeTemplateValues,
    qhr.makeScript
], function(err, result) {
    if (err) {
        console.err("Some task failed: "+err);
        process.exit(1);
    }
    //console.log(JSON.stringify(uriObjs, null, 2));
    console.log("All tasks complete.");
    //console.log(JSON.stringify(Args, null, 2));
});
