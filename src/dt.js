var Promise = require("bluebird");
var TreeNode = require("tree-node");
var Set = require("./set.js");
var _ = require("underscore");
var debug = require("debug")("dt");
var configDB = require("config").DATABASE;

/**
 * The decision tree class.
 * @param {Object} options The options
 * @class DecisionTree
 */
var DecisionTree = function(options) {
    options = options || {};
    var self = {};
    self.attrs = [];
    var root = new TreeNode();

    /** 
     * Initialises the class.
     * @return {Promise}
     * @async
     * @method Setup
     */
    self.Setup = function(attributes) {
        if (!attributes || attributes.length === 0)
            throw new Error("Number of attributes should be larger than 0.");

        _.each(attributes, function(attr, index) {
            if ((attr.type !== "disc" && attr.type !== "cont") || !attr.name) {
                throw new Error("Missing or invalid type and or name at index: " + index + ".");
            }

            if ( !! attr.split)
                self.attrs.push(attr);
            else {
                if (attr.type === "disc") {

                    var names = options.db.execQuerySync({
                        stmt: "SELECT DISCTINT(" + attr.name + ") FROM " + configDB.table
                    });
                    attr.split = names[0];
                    self.attrs.push(attr);
                }

                if (attr.type === "cont") {
                    if (!attr.numberSplits || attr.numberSplits <= 0)
                        throw new Error("Specify number of splits for attribute: " + attr.name + " is either invalid or undefined.");

                    var result = options.db.execQuerySync({
                        stmt: "SELECT MIN(" + attr.name + ") as min, MAX(" + attr.name + ") as max FROM " + configDB.table
                    });
                    max = result[0].max;
                    min = result[0].min;
                    var range = Math.abs(min) + Math.abs(max);
                    var partRange = (attr.numberSplits <= 0) ? 0 : range / (attr.numberSplits + 1);
                    var parts = [];

                    //calculate the all the ranges
                    parts.push(min);
                    for (var i = 0; i < attr.numberSplits; i++)
                        parts.push(parts[parts.length - 1] + partRange);
                    parts.push(max);

                    attr.split = parts;
                    self.attrs.push(attr);
                }
            }
        });
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
        debug("next node");
        if (node.data("model").getAttrs().length === 0)
            return node;

        var e = node.data("model").entropy()
        debug("got entropy")

        if (e.entropy === 0)
            return node

        var gains = [];
        _.each(node.data("model").getAttrs(), function(attr) {
            var gain = node.data("model").gain(attr);
            debug("got gain for: " + attr.name)
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