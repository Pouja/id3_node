var db = new require("../common/database.js")();
var DecisionTree = new require("./dt.js");
var jf = require("jsonfile");
var _ = require("underscore");
var Factory = require("./factory.js");
var config = require("config").DATABASE;
var debug = require("debug")("app");
var debugErr = require("debug")("app:error");

var args = process.argv.slice(2);

if (!args[0])
    throw new Error("Specify output filename.");
if (!args[1])
    throw new Error("Specify json file for attributes.");

debug("Writing result tree to: " + args[0]);

var dt = new DecisionTree({
    db: db
})

var factory = new Factory({
    db: db,
    startId: config.createStartId,
    endId: config.createEndId,
    table: config.table,
    bulk: config.bulk
});

db.connectDB()
    .then(function() {
        debug("Loading attributes from file: " + args[1]);
        dt.Setup(jf.readFileSync(args[1]));

        debug("Initalizing factory.");
        factory.init(dt.attrs);
        dt.factory = factory;

        debug("starting to run decision tree algoritme.");
        var root = dt.Run();
        debug("finished creating decision tree.");

        debug("Saving to: " + args[0]);
        jf.writeFileSync(args[0], root.json);

        return db.closeDB();
    })
    .then(function() {}, console.error)