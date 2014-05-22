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
    if (options.db === undefined || options.db === null)
        throw new Error("database should be passed to options.");

    _.defaults(options, {
        attrs: [],
        filters: [],
    })

    var self = {};

    //create private variables to prevent conflicts
    self.queryString = "SELECT 1;"
    self.filters = options.filters.slice(0);
    self.attrs = options.attrs.slice(0);
    self.database = options.db;
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
     * Builds the query
     */
    self.BuildQuery = function() {
        self.queryString = "SELECT <attributes> FROM <table> WHERE <filter>";
        self.queryString = self.queryString.replace("<table>", configDB.table);
        _.each(self.filters, function(filter) {
            if (filter.type === "cont")
                self.queryString = self.queryString.replace("<filter>", filter.name + " >= " + filter.value.min + " AND " + filter.name + " <= " + filter.value.max + " AND <filter>");
            else if (filter.type === "disc")
                self.queryString = self.queryString.replace("<filter>", filter.name + " = " + filter.value + "AND <filter>");
        });

        self.queryString = self.queryString.replace("<filter>", "1=1");
    }

    self.BuildSelectQuery = function(selector) {
        return self.queryString.replace("<attributes>", selector);
    }

    self.Clone = function() {
        var newSettings = _.extend({}, {
            filters: self.filters,
            attrs: self.attrs,
            db: self.database
        });
        return new Set(newSettings);
    }

    /**
     * Calculates the gain of this set for the given attribute
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
     * @return a float
     */
    self.entropy = function() {
        if (self._entropy !== undefined)
            return self._entropy;
        debug("Calculating entropy for " + _.pluck(self.filters, 'name'));

        var log2 = function(n) {
            return Math.log(n) / Math.log(2);
        }

        var query = self.BuildSelectQuery("COUNT(class) as count_class");
        query += " GROUP BY class;"

        var result = self.database.execQuerySync({
            stmt: query
        })

        var sum = _.reduce(result, function(subsum, entry) {
            return subsum + entry.count_class;
        }, 0);

        var E = _.reduce(result, function(subsum, entry) {
            return subsum - ((entry.count_class / sum) * log2(entry.count_class / sum));
        }, 0)

        self._entropy = {
            entropy: E,
            sum: sum
        }
        return self._entropy;
    }

    /**
     * Splits the set in the given attr
     * @return an array of sets
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
            newSet.BuildQuery();
            sets.push(newSet);
        })
        return sets;
    }

    self.BuildQuery();
    return self;
}
module.exports = Set;