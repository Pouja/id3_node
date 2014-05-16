var Promise = require("bluebird");
var TreeModel = require("tree-model");
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
    var tree = new TreeModel();
    var root;

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
        root = tree.parse(set);
        return Run(root);
    }

    /**
     * Runs the decision tree algoritme on the give node.
     * @return {Promise} The first argument is a node of the decision tree.
     * @async
     * @private
     * @method Run
     */
    var Run = function(node) {
        //calc the entropy
        var e = node.model.entropy()
        debug("got entropy")

        if (e.entropy === 0)
            return node
        else {
            var results = [];
            _.each(node.model.getAttrs(), function(attr) {
                results.push(node.model.gain(attr));
                debug("got gain for: " + attr)
            })
        }
        debug("got gains")
        var gains = [];
        _.each(results, function(g) {
            gains.push({
                gain: g,
                attr: attr
            });
        })
        var sortedGains = _.sortBy(gains, function(g) {
            return g.gain;
        });
        sortedGains.reverse();
        //split by the attribute with the highest gain
        var sets = node.model.split(sortedGains[0].attr)

        debug("splitted the set")
        var childNodes = [];
        _.each(sets, function(set) {
            var childNode = tree.parse(set);
            node.addChild(self.Run(childNode))
        })

        //resolve the node
        return node
    }
    return self;
}

module.exports = DecisionTree;