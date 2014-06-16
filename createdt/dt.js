var Promise = require("bluebird");
var TreeNode = require("tree-node");
var Set = require("./set.js");
var _ = require("underscore");
var debug = require("debug")("dt");
var configDB = require("config").DATABASE;
var jf = require("jsonfile");
/**
 * The decision tree class.
 * @param {Object} options The options
 * @class DecisionTree
 */
var DecisionTree = function(options) {
    options = options || {};
    var self = {
        attrs: []
    };

    var SPLIT_MAX = configDB.stopCriteria;

    /** 
     * For each attribute get the possible splits and saves them to self.attrs.
     * @param {Array} attributes The attributes.
     * @method Setup
     */
    self.Setup = function(attributes) {
        if (!attributes || attributes.length === 0)
            throw new Error("Number of attributes should be larger than 0.");

        _.each(attributes, function(attr, index) {
            if ((attr.type !== "disc" && attr.type !== "cont") || !attr.name) {
                throw new Error("Missing or invalid type and or name at index: " + index + ".");
            }

            //if a split is already given, use that
            if ( !! attr.split)
                self.attrs.push(attr);
            else {
                //for discrete values its easy to get all the possible splits
                if (attr.type === "disc") {
                    self.attrs.push(parseDiscAttr(attr));
                }
                //for continious values, get the min and max and calculate each possible split
                if (attr.type === "cont") {
                    self.attrs.push(self.parseContAttr(attr));
                }
            }
        });
    }

    /**
     * Gets all the distinct row values for the given attribute column name
     * @param {Object} attr An attribute object.
     * @return {Object} same object but with splits
     * @private
     * @methode parseDiscAttr
     */
    var parseDiscAttr = function(attr) {
        var names = options.db.execQuerySync({
            stmt: "SELECT DISTINCT(" + attr.name + ") FROM " + configDB.table + " WHERE id < " + configDB.hardLimit
        });

        attr.split = _.pluck(names, attr.name);
    }

    /**
     * Calculates the splits for the given attribute with name and numberSplits
     * @param {Object} attr An attribute object.
     * @return {Object} same object but with splits
     * @private
     * @methode parseContAttr
     */
    self.parseContAttr = function(attr) {
        if (!attr.numberSplits || attr.numberSplits <= 0)
            throw new Error("Specify number of splits for attribute: " + attr.name + " is either invalid or undefined.");

        var result = options.db.execQuerySync({
            stmt: "SELECT MIN(" + attr.name + ") as min, MAX(" + attr.name + ") as max FROM " + configDB.table + " WHERE id >= " + configDB.createStartId + " AND id <= " + configDB.createEndId
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

        var splits = [];
        var pair = {
            min: parts[0]
        };

        _.each(_.rest(parts), function(part) {
            pair.max = part;
            splits.push(pair);
            pair = {
                min: part
            }
        })

        attr.split = splits;
        return attr;
    }

    /**
     * Runs the decision tree algoritme
     * @return {TreeNode} The root of the builded decision tree.
     * @method Run
     */
    self.Run = function() {
        var set = new Set({
            attrs: self.attrs,
            filters: [],
            factory: self.factory
        });
        var root = new TreeNode();
        root.data({
            model: set
        })
        return self._Run(root);
    }

    /**
     * Checks if the node should become an end node
     * @param {TreeNode} node A node.
     * @return {boolean} True if the attributes is 0 or the entropy is 0 or if the sum is low enough.
     * @method shouldStop
     */
    self.shouldStop = function(node) {
        if (node.data("model").getAttrs().length === 0) {
            return true;
        }

        var e = node.data("model").entropy()
        if (e.entropy === 0 || e.sum < SPLIT_MAX) {
            return true;
        }

        return false;
    }

    /**
     * Runs the decision tree algoritme on the give node.
     * @return {TreeNode} A node of the decision tree.
     * @private
     * @method _Run
     */
    self._Run = function(node) {
        if (self.shouldStop(node)) {
            debug("creating end node");
            node.data("model").setClass();
            return node;
        }

        var e = node.data("model").entropy()

        var gains = [];
        _.each(node.data("model").getAttrs(), function(attr) {
            var gain = node.data("model").gain(attr);
            gains.push({
                gain: gain,
                attr: attr
            });
        });

        var highestGains = _.max(gains, function(g) {
            return g.gain;
        });

        //split by the attribute with the highest gain
        debug("splitting on: " + highestGains.attr.name);
        var sets = node.data("model").split(highestGains.attr)

        var childNodes = [];
        _.each(sets, function(set) {
            var childNode = new TreeNode();
            childNode.data({
                model: set
            });
            node.appendChild(childNode);
            childNode = self._Run(childNode);
        })

        return node
    }
    return self;
}

module.exports = DecisionTree;