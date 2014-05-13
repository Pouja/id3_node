var Promise = require("promise");
var TreeModel = require("tree-model");
var Set = require("./set.js");
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
                filters: []
            });
            root = tree.parse(set);
            return Run(tree);
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
            //called when all gains are calculated
            var handleGains = function(gains) {
                var sortedGains = _.sortBy(gains, function(g) {
                    return g.gain;
                });
                sortedGains.reverse();

                //split by the attribute with the highest gain
                node.split(sortedGains[0].attr)
                    .then(function(sets) {
                        _.each(sets, function(set) {
                            var childNode = tree.parse(set);
                            node.addChild(childNode);

                        })
                    }, reject)
            }

            var count = 0;
            var gains = [];

            node.entropy()
                .then(function(e) {
                    if (e.entropy === 0)
                        resolve()
                    else {
                        _.each(node.getAttrs(), function(attr) {
                            node.gain(attr)
                                .then(function(g) {
                                    gains.push({
                                        gain: g,
                                        attr: attr
                                    });
                                    count++;
                                    if (count >= node.getAttrs().length)
                                        handleGains(gains);
                                }, reject)
                        })
                    }
                }, reject)
        })
    }
    return self;
}

module.exports = DecisionTree;