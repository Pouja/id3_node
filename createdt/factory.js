var configDB = require("config").DATABASE;
var Util = require("../common/util.js");
var debug = require("debug")("factory");

/**
 * ATTENTION
 * This class has some very very ugly code.
 * This class only uses native code and minimal amount of functions to achieve the highest performance.
 * This class loads all ids for each split.
 * @param {Database} database The database object.
 * @class Factory
 */
var Factory = function(database) {
    var self = {
        offset: configDB.createStartId,
        limit: configDB.bulk,
    };

    var map = [];
    var database = database;

    /**
     * @return The map with all the filters and ids.
     * @method getMap
     */
    self.getMap = function() {
        return map;
    }

    /**
     * Initializes the map with all possible splits for each attribute.
     * @param {Array} attributes The attributes.
     * @method loadMap
     */
    self.loadMap = function(attributes) {
        for (var attrIndex = 0; attrIndex < attributes.length; attrIndex++) {
            for (var splitIndex = 0; splitIndex < attributes[attrIndex].split.length; splitIndex++) {
                map.push({
                    type: attributes[attrIndex].type,
                    name: attributes[attrIndex].name,
                    value: attributes[attrIndex].split[splitIndex],
                    data: []
                });
            }
        }
    }

    /**
     * For each entry in map, init all the ids that match the split value
     * @method loadIds
     */
    self.loadIds = function() {
        //for every batch
        for (var batch = self.getNextBatch(); batch.length > 0; batch = self.getNextBatch()) {
            //for every row in batch
            for (var row = batch.pop(); row !== undefined; row = batch.pop()) {
                //for every filter in map
                for (var mapIndex = 0; mapIndex < map.length; mapIndex++) {
                    var filter = map[mapIndex];
                    //CONT
                    if (filter.type === "cont") {
                        //if the filter matches the row
                        if (row[filter.name] >= filter.value.min && filter.value.max >= row[filter.name]) {
                            var found = false;
                            //find the class with the ids that match this row
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
                    //DISC
                    if (filter.type === "disc") {
                        if (row[filter.name] === filter.value) {
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
    }

    /**
     * Initializes the factory.
     * This should be called before running the algoritme.
     * @method init
     */
    self.init = function(attributes) {
        self.loadMap(attributes);
        self.loadIds();
        self.orderMap();
    }

    /**
     * For each entry in map order the ids ascending.
     * @method orderMap
     */
    self.orderMap = function() {
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
        if (self.offset >= configDB.createEndId)
            return [];
        var queryString = "SELECT * FROM " + configDB.table + " LIMIT " + self.limit + " OFFSET " + self.offset;
        var result = database.execQuerySync({
            stmt: queryString
        });
        self.offset += configDB.bulk;

        return result;
    }

    /**
     * Gets all the ids for the given filters
     */
    self.getIds = function(filters) {
        var result = [];
        //if the filter legnth is 0, get all the ids for each possible class
        if (filters.length === 0) {
            //for each map entry
            for (var mapIndex = 0; mapIndex < map.length; mapIndex++) {
                //for each class
                for (var classIndex = 0; classIndex < map[mapIndex].data.length; classIndex++) {
                    var found = false;
                    for (var resultIndex = 0; resultIndex < result.length && !found; resultIndex++) {
                        if (result[resultIndex].class === map[mapIndex].data[classIndex].class) {
                            result[resultIndex].ids = Util.union(result[resultIndex].ids, map[mapIndex].data[classIndex].ids);
                            found = true;
                        }
                    }
                    if (!found) {
                        result.push({
                            class: map[mapIndex].data[classIndex].class,
                            ids: map[mapIndex].data[classIndex].ids
                        })
                    }
                }
            }
        } else {
            //get the intersection of each entry in map that match the filters
            for (var filterIndex = 0; filterIndex < filters.length; filterIndex++) {
                for (var mapIndex = 0; mapIndex < map.length; mapIndex++) {
                    var valid = filters[filterIndex].name === map[mapIndex].name;

                    if (filters[filterIndex].type === "disc") {
                        valid = valid && filters[filterIndex].value === map[mapIndex].value;
                    } else {
                        valid = valid && filters[filterIndex].value.min === map[mapIndex].value.min && filters[filterIndex].value.max === map[mapIndex].value.max;
                    }

                    if (valid) {
                        for (var classIndex = 0; classIndex < map[mapIndex].data.length; classIndex++) {
                            var found = false;
                            for (var resultIndex = 0; resultIndex < result.length && !found; resultIndex++) {
                                if (result[resultIndex].class === map[mapIndex].data[classIndex].class) {
                                    result[resultIndex].ids = Util.intersection(result[resultIndex].ids, map[mapIndex].data[classIndex].ids);
                                    found = true;
                                }
                            }
                            if (!found) {
                                result.push({
                                    class: map[mapIndex].data[classIndex].class,
                                    ids: map[mapIndex].data[classIndex].ids
                                })
                            }
                        }
                    }
                }
            }
        }
        return result;
    }
    return self;
}

module.exports = Factory;