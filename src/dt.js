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
    self.attr = [];
    var tree = new TreeModel();
    var root;

    /** 
     * Initialises the class.
     * @return {Promise}
     * @async
     * @method Setup
     */
    self.Setup = function() {
        return new Promise(function(resolve, reject) {
            for (var i = 0; i < options.nAttrs; i++)
                self.attr.push(options.attrName + i);
            resolve();
        })
    }

    /**
     * Runs the decision tree algoritme
     * @return {Promise} The first argument is the root of the builded decision tree.
     * @method Run
     * @async
     */
    self.Run = function() {
        return new Promise(function(resolve, reject) {
            var set = new Set({
                attrs: self.attrs,
                filters: [],
                db: options.db
            });
            root = tree.parse(set);
            return Run(root);
        }).then(resolve, reject);
    }

    /**
     * Runs the decision tree algoritme on the give node.
     * @return {Promise} The first argument is a node of the decision tree.
     * @async
     * @private
     * @method Run
     */
    var Run = function(node) {
        return new Promise(function(resolve, reject) {
            //calc the entropy
            node.model.entropy()
                .then(function(e) {
                    if (e.entropy === 0)
                        resolve(node)
                    else {
                        var fCalls = [];
                        _.each(node.model.getAttrs(), function(attr) {
                            fCalls.push(node.model.gain);
                        })

                        //calc all the gains
                        return Promise.all(fCalls);
                    }
                }).then(function(results) {
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
                    return node.model.split(sortedGains[0].attr)
                }).then(function(sets) {
                    var fCalls = [];
                    _.each(sets, function(set) {
                        var childNode = tree.parse(set);
                        fCalls.push(function() {
                            self.Run(childNode)
                        })
                    })
                    //recursively call Run on each child node
                    return Promise.all(fCalls);
                }).then(function(childNodes) {
                    //add each child node to this node
                    _.each(childNodes, function(childNode) {
                        node.addChild(childNode)
                    })
                    //resolve the node
                    resolve(node);
                }, reject)
        })
    }
    return self;
}

module.exports = DecisionTree;