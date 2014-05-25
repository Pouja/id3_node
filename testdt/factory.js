var config = require("config").DATABASE;
var _ = require("underscore");

var Factory = function(options) {
    var self = {
        offset: 0,
        limit: config.bulk
    };

    var attributes = [];
    var database = options.db;

    /**
     * Sets all the attribute names from options.attributes.
     * Sets the number of entries in de table
     * @method init
     */
    self.init = function() {
        _.each(options.attributes, function(attr) {
            attributes.push(attr.name);
        })
        var result = database.execQuerySync({
            stmt: "SELECT COUNT(*) FROM " + config.testTable
        });
        self.maxCount = result;
    }

    /**
     * Retrieves the next number of entries from the database.
     * @method getNextBatch
     */
    self.getNextBatch = function() {
        if (self.offset !== 0 && self.limit > self.maxCount)
            return [];
        var queryString = _.reduce(attributes, function(memo, attr) {
            return memo += " " + attr + ",";
        }, "SELECT");
        queryString += " class FROM " + config.testTable + " LIMIT " + self.limit + " OFFSET " + self.offset + ";";

        var result = database.execQuerySync({
            stmt: queryString
        });
        self.offset = self.limit;
        self.limit += config.bulk;

        return result;
    }
    return self;
}

module.exports = Factory;