var _ = require("underscore");

/**
 * Walks the whole tree and checks if there is a branch that matches the entry.
 * @param {TreeNode} node The node to be walked.
 * @param {Object} entry A object with attributes that should match a branch in the tree.
 * @return {boolean} true iff there is a branch that matches the entry.
 * @methode walk
 */
var walk = function(node, entry) {
    if (node.data("model").class !== undefined) {
        return match(node, entry) && node.data("model").class === entry.class;
    }

    return _.some(node._childs, function(child) {
        if (match(child, entry)) {
            return walk(child, entry)
        }
        return false;
    })
}

/**
 * Checks if the current node has filters that matches the entry.
 * @param {TreeNode} node The node.
 * @param {Object} entry The entry object.
 * @return {boolean}
 * @methode match
 */
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

module.exports.walk = walk;
module.exports.match = match;