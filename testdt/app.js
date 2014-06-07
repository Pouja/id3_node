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

if (!args[2])
    throw new Error("Specify output filename.");
if (!args[1])
    throw new Error("Specify json file for attributes.");
if (!args[0])
    throw new Error("Specify json file for decision tree data.");

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
        var mismatch = 0;
        while (batch.length !== 0) {
            _.each(batch, function(entry) {
                mismatch += (looper(root, entry)) ? 0 : 1;
            })
            batch = factory.getNextBatch();
        }
        jf.writeFileSync(args[2], "Number of mismatches: " + mismatch);
        return db.closeDB();
    })
    .then(function() {}, debugErr);