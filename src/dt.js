var Promise = require("bluebird");
var TreeNode = require("tree-node");
var Set = require("./set.js");
var _ = require("underscore");
var debug = require("debug")("dt");
/**
 * The decision tree class.
 * @param {Object} options The options
 * @class DecisionTree
 */
var DecisionTree = function(options) {
    options = options || {};
    var self = {};
    var attrs = [];
    var root = new TreeNode();

    /** 
     * Initialises the class.
     * @return {Promise}
     * @async
     * @method Setup
     */
    self.Setup = function() {
        for (var i = 1; i <= options.nAttrs; i++)
            attrs.push(options.attrName + i);
    }

    /**
     * Runs the decision tree algoritme
     * @return {Promise} The first argument is the root of the builded decision tree.
     * @method Run
     * @async
     */
    self.Run = function() {
        var set = new Set({
            attrs: attrs,
            filters: [],
            db: options.db
        });
        root.data({
            model: set
        })
        return _Run(root);
    }

    /**
     * Runs the decision tree algoritme on the give node.
     * @return {Promise} The first argument is a node of the decision tree.
     * @async
     * @private
     * @method Run
     */
    var _Run = function(node) {
        if (node.data("model").getAttrs().length === 0)
            return node;

        var e = node.data("model").entropy()
        debug("got entropy")

        if (e.entropy === 0)
            return node

        var gains = [];
        _.each(node.data("model").getAttrs(), function(attr) {
            var gain = node.data("model").gain(attr);
            debug("got gain for: " + attr)
            gains.push({
                gain: gain,
                attr: attr
            });
        });
        debug("got gains")

        var sortedGains = _.sortBy(gains, function(g) {
            return g.gain;
        });
        sortedGains.reverse();
        //split by the attribute with the highest gain
        var sets = node.data("model").split(sortedGains[0].attr)

        debug("splitted the set")
        var childNodes = [];
        _.each(sets, function(set) {
            var childNode = new TreeNode();
            childNode.data({
                model: set
            });
            childNode = _Run(childNode);
            node.appendChild(childNode);
        })

        //resolve the node
        return node
    }
    return self;
}

module.exports = DecisionTree;