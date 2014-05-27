var _ = require("underscore");
var configDB = require("config").DATABASE;
var Util = require("../common/util.js");
var debug = require("debug")("factory");

var Factory = function(database) {
    var self = {
        offset: 0,
        limit: configDB.bulk
    };

    var map = [];
    var database = database;
    var attributesNames = [];
    /**
     * Retrieves all the ids for each possible split
     */
    self.init = function(attributes) {

        var result = database.execQuerySync({
            stmt: "SELECT COUNT(*) as count FROM " + configDB.table
        });
        self.maxCount = result[0].count * 0.01;

        for (var attrIndex = 0; attrIndex < attributes.length; attrIndex++) {
            for (var splitIndex = 0; splitIndex < attributes[attrIndex].split.length; splitIndex++) {
                map.push({
                    type: attributes[attrIndex].type,
                    name: attributes[attrIndex].name,
                    value: attributes[attrIndex].split[splitIndex],
                    data: []
                });
            }
            attributesNames.push(attributes[attrIndex].name)
        }

        for (var batch = self.getNextBatch(); batch.length > 0; batch = self.getNextBatch()) {
            for (var row = batch.pop(); row !== undefined; row = batch.pop()) {
                for (var mapIndex = 0; mapIndex < map.length; mapIndex++) {
                    var filter = map[mapIndex];
                    if (filter.type === "cont") {
                        if (row[filter.name] >= filter.value.min && filter.value.max <= row[filter.name]) {
                            var found = false;
                            for (var j = 0; j < filter.data.length; j++) {
                                if (filter.data[j].class === row['class']) {
                                    filter.data[j].ids.push(row['id']);
                                    found = true;
                                }
                            }
                            if (!found) {
                                filter.data.push({
                                    class: row['class'],
                                    ids: [row['id']]
                                })
                            }
                        }
                    }
                    if (filter.type === "disc") {
                        if (row[filter.name] == filter.value) {
                            var found = false;
                            for (var j = 0; j < filter.data.length; j++) {
                                if (filter.data[j].class === row['class']) {
                                    filter.data[j].ids.push(row['id']);
                                    found = true;
                                }
                            }
                            if (!found) {
                                filter.data.push({
                                    class: row['class'],
                                    ids: [row['id']]
                                })
                            }
                        }
                    }
                }
            }
        }

        for (var mapIndex = 0; mapIndex < map.length; mapIndex++) {
            for (var classIndex = 0; classIndex < map[mapIndex].data.length; classIndex++) {
                map[mapIndex].data[classIndex].ids.sort(function(a, b) {
                    return a - b;
                })
            }
        }
    }

    /**
     * Retrieves the next number of entries from the database.
     * @method getNextBatch
     */
    self.getNextBatch = function() {
        if (self.offset !== 0 && self.limit > self.maxCount)
            return [];
        var queryString = "SELECT * FROM " + configDB.table + " LIMIT " + self.limit + " OFFSET " + self.offset + ";";

        var result = database.execQuerySync({
            stmt: queryString
        });
        self.offset = self.limit;
        self.limit += configDB.bulk;

        return result;
    }

    /**
     * Sets the table name for the query and the where clauses.
     * @method BuildQuery
     */
    self.BuildQuery = function(filter) {
        var queryString = "SELECT id, class FROM <table> WHERE <filter> ORDER BY id ASC;";
        queryString = queryString.replace("<table>", configDB.table);
        if (filter.type === "cont")
            queryString = queryString.replace("<filter>", filter.name + " >= " + filter.value.min + " AND " + filter.name + " <= " + filter.value.max + " AND <filter>");
        else if (filter.type === "disc") {
            queryString = queryString.replace("<filter>", filter.name + " = '" + filter.value + "' AND <filter>");
        };
        queryString = queryString.replace("<filter>", "1=1");
        return queryString;
    }

    /**
     * Gets all the ids for the given filters
     */
    self.getIds = function(filters) {
        var result = [];
        if (filters.length === 0) {
            _.each(map, function(f) {
                _.each(f.data, function(c) {
                    var r = _.find(result, function(rs) {
                        return rs.class === c.class;
                    })

                    if ( !! r) {
                        r.ids = Util.union(r.ids, c.ids);
                    } else {
                        result.push({
                            class: c.class,
                            ids: c.ids
                        })
                    }
                })
            })
        } else {
            _.each(filters, function(filter) {
                _.each(map, function(f) {
                    if (f.name === filter.name && f.value === filter.value) {
                        _.each(f.data, function(c) {
                            var r = _.find(result, function(rs) {
                                return rs.class === c.class;
                            })

                            if ( !! r) {
                                r.ids = Util.intersection(r.ids, c.ids);
                            } else {
                                result.push({
                                    class: c.class,
                                    ids: c.ids
                                })
                            }
                        })
                    }
                })
            })
        }
        return result;
    }
    return self;
}

module.exports = Factory;