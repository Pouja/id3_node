var monetdb = new require("./monetdb.js")();
var dt = new require("./dt.js")();
var Set = require("./set.js");

var debug = require("debug")("app");

monetdb.connectDB()
    .then(function() {
        var q = "SELECT min(attr1), max(attr2)";
        for (var i = 1; i <= 28; i++)
            q += ",min(attr" + i + "), max(" + i + ")";
        q += " FROM data";
        return monetdb.execQuery({
            stmt: q
        })
    })
    .then(function(result) {
        console.log(result)
        return monetdb.closeDB();
    })
    .then(function() {}, function(err) {
        console.error(err);
    })