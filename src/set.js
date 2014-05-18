var _ = require("underscore");
var Promise = require("bluebird");
var debug = require("debug")("set");

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
        numberSplits: 5,
        table: "data"
    })

    var self = {};

    //create private variables to prevent conflicts
    self.queryString = "SELECT 1;"
    self.filters = options.filters.slice(0);
    self.attrs = options.attrs.slice(0);
    self.database = options.db;

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
        self.queryString = self.queryString.replace("<table>", options.table);

        _.each(self.filters, function(filter) {
            self.queryString = self.queryString.replace("<filter>", filter.attr + " >= " + filter.min + " AND " + filter.attr + " <= " + filter.max + " AND <filter>");
        });

        self.queryString = self.queryString.replace("<filter>", "1=1");
    }

    self.BuildSelectQuery = function(selector) {
        return self.queryString.replace("<attributes>", selector);
    }

    self.Clone = function() {
        var newSettings = _.extend({}, {
            filters: self.filters,
            numberSplits: options.numberSplits,
            table: options.table,
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
        debug("calculateing gain for: " + attr);
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
    }

    /**
     * Calculates the entropy of this set.
     * @return a float
     */
    self.entropy = function() {
        debug("Calculating entropy for " + self.filters)
        ''
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
        return {
            entropy: E,
            sum: sum
        };
    }

    /**
     * Splits the set in the given attr
     * @return an array of sets
     */
    self.split = function(attr) {
        debug("making split for " + attr);
        //get max min of attr
        var getMax = self.BuildSelectQuery("MIN(" + attr + ") as min, MAX(" + attr + ") as max") + ";";
        var max = 1;
        var min = 0;

        var result = self.database.execQuerySync({
            stmt: getMax,
        })

        debug("retrieved maximum and minimum");
        max = result[0].max;
        min = result[0].min;
        var range = Math.abs(min) + Math.abs(max);
        var partRange = (options.numberSplits <= 0) ? 0 : range / (options.numberSplits + 1);
        var parts = [];

        //calculate the all the ranges
        parts.push(min);
        for (var i = 0; i < options.numberSplits; i++)
            parts.push(parts[parts.length - 1] + partRange);
        parts.push(max);

        //create the new sets
        var sets = [];
        for (var i = 0; i <= options.numberSplits; i++) {
            var newSet = self.Clone();
            newSet.filters.push({
                attr: attr,
                min: parts[i],
                max: parts[i + 1]
            });
            newSet.attrs = _.filter(newSet.getAttrs(), function(attribute) {
                return attribute != attr
            });
            newSet.BuildQuery();
            sets.push(newSet);
        }

        return sets;
    }

    self.BuildQuery();
    return self;
}
module.exports = Set;