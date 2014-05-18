var monetdb = new require("./monetdb.js")();
var DecisionTree = new require("./dt.js");
var jf = require("jsonfile");

var debug = require("debug")("app");

var dt = new DecisionTree({
    nAttrs: 28,
    attrName: "attr",
    db: monetdb
})
dt.Setup();
monetdb.connectDB()
    .then(function() {
        var root = dt.Run();
        jf.writeFileSync("file2.json", root.json);
        return monetdb.closeDB();
    })
    .then(function() {}, function(err) {
        console.error(err);
    })