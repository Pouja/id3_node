var monetdb = new require("./monetdb.js")();
var DecisionTree = new require("./dt.js");
var jf = require("jsonfile");

var debug = require("debug")("app");

var dt = new DecisionTree({
    attrN: 28,
    attrName: "attr",
    db: monetdb
})

monetdb.connectDB()
    .then(function() {
        return dt.Run();
    })
    .then(function(result) {
        jf.writeFileSync("file.json", result);
        return monetdb.closeDB();
    })
    .then(function() {}, function(err) {
        console.error(err);
    })