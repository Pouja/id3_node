var js = require("jsonfile");
var _ = require("underscore");
var base = {
    name: "attr",
    type: "cont",
    numberSplits: 6
}
var data = [];
for (var i = 1; i <= 28; i++) {
    base.name = "attr" + i;
    data.push(_.extend({}, base));
}
js.writeFileSync("attr.json", data)