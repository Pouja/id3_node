var _ = require("underscore");
var Promise = require("promise");
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

    var queryString = "SELECT 1;"
    var filters = options.filters.slice(0);
    var database = options.db;

    self.getFilters = function() {
        return filters.slice(0);
    }

    var BuildQuery = function() {
        queryString = "SELECT <attributes> FROM <table> WHERE <filter>";
        queryString = queryString.replace("<table>", options.table);
        queryString = (filters.length === 0) ? queryString.replace("<filter>", "1=1") : queryString.replace("<attributes>", _.reduceRight(filters, function(a, b) {
            return a += "AND" + b.attr + " >= " + b.min + " AND " + b.attr + " <= " + b.max;
        }));
    }

    self.BuildSelectQuery = function(selector) {
        return queryString.replace("<attributes>", selector);
    }

    self.AddFilter = function(filter) {
        filters.push(filter);
        BuildQuery();
    }

    self.Clone = function() {
        var newSettings = _.extend({}, {
            filters: filters,
            numberSplits: options.numberSplits,
            table: options.table,
            attrs: options.attr,
            db: database
        });
        return new Set(newSettings);
    }

    /**
     * Calculates the gain of this set for the given attribute
     * @return a float
     */
    self.gain = function(attr) {

        return new Promise(function(resolve, reject) {
            var gain = 0;
            var count = 0;
            var maxCount = 0;

            var handleS_v = function(entropySet) {
                gain -= entropySet.sum / currentTotal * entropySet.entropy;
                if (count >= maxCount)
                    resolve(gain);
                else
                    count++;
            }

            var currentTotal = 0;
            self.entropy()
                .then(function(result) {
                    currentTotal = result.sum;
                    gain = result.entropy;
                    return self.split(attr);
                })
                .then(function(sets) {
                    maxCount = sets.length;
                    _.each(sets, function(set) {
                        set.entropy().then(function(result) {
                            handleS_v(result);
                        })
                    })
                }, reject)
        })
    }

    /**
     * Calculates the entropy of this set.
     * @return a float
     */
    self.entropy = function() {
        var log2 = function(n) {
            return Math.log(n) / Math.log(2);
        }

        return new Promise(function(resolve, reject) {
            var query = self.BuildSelectQuery("COUNT(class) as count_class");
            query += " GROUP BY class;"
            database.execQuery({
                stmt: query
            })
                .then(function(result) {
                    var sum = _.reduce(result, function(subsum, entry) {
                        return subsum + entry.count_class;
                    }, 0);
                    var E = _.reduce(result, function(subsum, entry) {
                        return subsum - ((entry.count_class / sum) * log2(entry.count_class / sum));
                    }, 0)
                    resolve({
                        entropy: E,
                        sum: sum
                    });
                }).then(function() {}, reject)
        })
    }

    /**
     * Splits the set in the given attr
     * @return an array of sets
     */
    self.split = function(attr) {
        //get max min of attr
        var getMax = self.BuildSelectQuery("MIN(?) as min, MAX(?) as max");
        var max = 1;
        var min = 0;
        return new Promise(function(resolve, reject) {
            database.execQuery({
                stmt: getMax,
                params: [attr, attr]
            })
                .then(function(result) {
                    debug("retrieved maximum and minimum");
                    max = result[0].max;
                    min = result[0].min;
                    var range = Math.abs(min) + Math.abs(max);
                    var partRange = (options.numberSplits <= 0) ? 0 : range / (options.numberSplits + 1);
                    var parts = [];

                    parts.push(min);
                    for (var i = 0; i < options.numberSplits; i++)
                        parts.push(parts[parts.length - 1] + partRange);
                    parts.push(max);

                    var sets = [];
                    for (var i = 0; i <= options.numberSplits; i++) {
                        var newSet = self.Clone();
                        newSet.AddFilter({
                            attr: attr,
                            min: parts[i],
                            max: parts[i + 1]
                        });

                        sets.push(newSet);
                    }

                    resolve(sets);
                }).then(function() {}, reject)
        })

    }

    BuildQuery();
    return self;
}
module.exports = Set;