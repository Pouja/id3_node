var _ = require("underscore");
var configDB = require("config").DATABASE;
var Util = require("../common/util.js");
var debug = require("debug")("factory");

var Factory = function(database) {
    var self = {};
    var map = [];
    var database = database;
    /**
     * Retrieves all the ids for each possible split
     */
    self.init = function(attributes) {
        _.each(attributes, function(attr) {
            _.each(attr.split, function(split) {
                var filter = {
                    type: attr.type,
                    name: attr.name,
                    value: split
                }
                var queryString = self.BuildQuery(filter);
                var result = database.execQuerySync({
                    stmt: queryString
                });
                filter.data = groupClasses(result);
                map.push(filter);
            })
        })
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


    /**
     * sums the classes togheter in the given list.
     */
    var groupClasses = function(list) {
        var out = [];
        _.each(list, function(item) {
            var found = _.find(out, function(c) {
                if (c.class === item.class) {
                    c.ids.push(item.id)
                    return true;
                }
            })
            if (!found) {
                out.push({
                    class: item.class,
                    ids: [item.id]
                })
            }
        })
        return out;
    }
    return self;
}

module.exports = Factory;