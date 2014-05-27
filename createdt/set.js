var _ = require("underscore");
var Promise = require("bluebird");
var debug = require("debug")("set");
var configDB = require("config").DATABASE;

/**
 * Represents a (sub)set of the data.
 * @param {Object} options The options
 * @class Set
 */
var Set = function(options) {

    _.defaults(options, {
        attrs: [],
        filters: [],
    })

    var self = {};
    self.filters = options.filters.slice(0);
    self.attrs = options.attrs.slice(0);
    self.factory = options.factory;
    self._entropy = undefined;

    /**
     * @return Array The attributes
     * @method getAttrs
     */
    self.getAttrs = function() {
        return self.attrs.slice(0);
    }

    /**
     * @return Array The filters
     * @method getFilters
     */
    self.getFilters = function() {
        return self.filters.slice(0);
    }

    /**
     * Clones himself
     * @return {Set} a clone of this.
     * @method Clone
     */
    self.Clone = function() {
        var newSettings = _.extend({}, {
            filters: self.filters,
            attrs: self.attrs,
            factory: self.factory
        });
        return new Set(newSettings);
    }

    /**
     * Calculates the gain of this set for the given attribute.
     * @return a float
     */
    self.gain = function(attr) {
        debug("calculating gain for: " + attr.name);
        var result = self.entropy()
        var currentTotal = result.sum;
        var gain = result.entropy;

        var sets = self.split(attr);
        var entropies = [];

        _.each(sets, function(set) {
            entropies.push(set.entropy());
        })

        _.each(entropies, function(entropySet) {
            gain -= entropySet.sum / currentTotal * entropySet.entropy;
        })
        return gain;
    }

    /**
     * Calculates the entropy of this set.
     * And sets the _entropye.
     * @return {Object.entropy} the entropy of this set.
     * @return {Object.sum} The count of how many entries are for the filters.
     * @method entropy
     */
    self.entropy = function() {
        if (self._entropy !== undefined)
            return self._entropy;

        debug("Calculating entropy for " + _.pluck(self.filters, 'name'));

        var log2 = function(n) {
            return Math.log(n) / Math.log(2);
        }
        var result = self.factory.getIds(self.filters);

        var sum = _.reduce(result, function(subsum, entry) {
            return subsum + entry.ids.length;
        }, 0);

        var E = _.reduce(result, function(subsum, entry) {
            if (entry.ids.length === 0)
                return subsum;
            else
                return subsum - ((entry.ids.length / sum) * log2(entry.ids.length / sum));
        }, 0)

        self._entropy = {
            entropy: E,
            sum: sum
        }
        return self._entropy;
    }

    /**
     * Splits the set in the given attribute.split
     * @return {Array} An array of sets
     * @method split
     */
    self.split = function(attr) {
        debug("making split for " + attr.name);
        var sets = []
        _.each(attr.split, function(s) {
            var newSet = self.Clone();
            newSet.attrs = _.filter(newSet.attrs, function(a) {
                return a.name != attr.name;
            })
            newSet.filters.push({
                type: attr.type,
                name: attr.name,
                value: s
            });
            sets.push(newSet);
        })
        return sets;
    }

    /**
     * Sets the class for this node.
     * @method setClass
     */
    self.setClass = function() {
        var result = self.factory.getIds(self.filters);
        if (_.every(result, function(item) {
            return item.ids.length === 0
        })) {
            self.class = "unknown";
        } else {
            var max = _.max(result, function(item) {
                return item.ids.length;
            })
            self.class = max.class;
        }
        debug("setting class: " + self.class + " for this node.");
    }

    self.toJSON = function() {
        return {
            entropy: self._entropy,
            filters: self.filters,
            class: self.class
        }
    }

    return self;
}
module.exports = Set;