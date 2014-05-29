var _ = require("underscore");

var looper = function(node, entry) {
    if (node.data("model").class !== undefined) {
        return match(node, entry) && node.data("model").class === entry.class;
    }
    return _.some(node._childs, function(child) {
        if (match(child, entry)) {
            return looper(child, entry)
        }
        return false;
    })
}

var match = function(node, entry) {
    var filters = node.data("model").filters;
    return _.every(filters, function(filter) {
        if (filter.type === "disc") {
            return entry[filter.name] === filter.value;
        }
        if (filter.type === "cont")
            return entry[filter.name] >= filter.value.min && entry[filter.name] <= filter.value.max;
    })
}

module.exports.looper = looper;
module.exports.match = match;