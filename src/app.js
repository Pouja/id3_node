var db = new require("./database.js")();
var DecisionTree = new require("./dt.js");
var jf = require("jsonfile");

var debug = require("debug")("app");
var debugErr = require("debug")("app:error");

var args = process.argv.slice(2);

if (!args[0])
    throw new Error("Specify output filename.");
if (!args[1])
    throw new Error("Specify json file for attributes.");

var dt = new DecisionTree({
    nAttrs: config.numberAttributes,
    db: db
})

dt.Setup(jf.readFileSync(args[1]));

db.connectDB()
    .then(function() {
        debug("starting to run decision tree algoritme.");
        var root = dt.Run();
        debug("finished creating decision tree.");
        debug("Saving to: " + args[0]);
        jf.writeFileSync(args[0], root.json);
        return db.closeDB();
    })
    .then(function() {}, debugErr)