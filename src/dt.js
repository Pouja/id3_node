var Promise = require("promise");

/**
 * The decision tree class.
 * @param {Object} options The options
 * @class DecisionTree
 */
var DecisionTree = function(options) {
    options = options || {};
    var self = {};
    self.attr = [];

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
            resolve();
        })
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

        })
    }
    return self;
}

module.exports = DecisionTree;