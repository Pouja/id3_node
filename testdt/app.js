var jf = require("jsonfile");
var _ = require("underscore");
var debug = require("debug")("app");
var debugErr = require("debug")("app:error");
var Tree = require("tree-node");
var config = require("config").DATABASE;

var db = new require("../common/database.js")();
var Factory = require("../common/factory.js");
var looper = require("./looper.js").looper;

var args = process.argv.slice(2);

if (!args[1])
    throw new Error("Specify json file for attributes.");
if (!args[0])
    throw new Error("Specify json file for decision tree data.");

var mismatch = {
    tp: 0,
    fp: 0,
    fn: 0,
    tn: 0
};

var processResult = function(match, actual, predicted) {
    if (match === true && actual === predicted) {
        if (actual === 0) {
            mismatch.tn++;
        } else {
            mismatch.tp++;
        }
    } else {
        if (predicted === 1) {
            mismatch.fp++;
        } else {
            mismatch.fn++;
        }
    }
}

db.connectDB()
    .then(function() {
        var factory = new Factory({
            db: db,
            startId: config.testStartId,
            endId: config.testEndId,
            table: config.table,
            bulk: config.bulk
        })

        var root = new Tree();
        root.reborn(jf.readFileSync(args[0]));

        var batch = factory.getNextBatch();
        while (batch.length !== 0) {
            _.each(batch, function(entry) {
                looper(root, entry, processResult)
            })
            batch = factory.getNextBatch();
        }
        console.log(mismatch);
        return db.closeDB();
    })
    .then(function() {}, debugErr);