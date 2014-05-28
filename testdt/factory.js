var config = require("config").DATABASE;
var _ = require("underscore");

var Factory = function(options) {
    var self = {
        offset: config.testStartId,
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
    }

    /**
     * Retrieves the next number of entries from the database.
     * @method getNextBatch
     */
    self.getNextBatch = function() {
        var queryString = _.reduce(attributes, function(memo, attr) {
            return memo += " " + attr + ",";
        }, "SELECT");
        queryString += " class FROM " + config.table + " WHERE id >= " + config.testStartId + " AND id <= " + config.testEndId + " LIMIT " + self.limit + " OFFSET " + self.offset + ";";

        var result = database.execQuerySync({
            stmt: queryString
        });
        self.offset += config.bulk;

        return result;
    }
    return self;
}

module.exports = Factory;