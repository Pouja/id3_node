var debug = require("debug")("factory");
var _ = require("underscore");

/**
 * Constructor.
 * @param {Database} config.db The database.
 * @param {Number} config.startId The first id that is allowed to be retrieved.
 * @param {Number} config.endId The last id that is allowed to be retrieved.
 * @param {Number} config.bulk The number of records that is allowed to be retrieved each time.
 * @param {String} config.table The table name.
 */
var Factory = function(config) {
    this.database = config.db;
    this.offset = config.startId;
    this.endId = config.endId;
    this.limit = config.bulk;
    this.table = config.table;
}

/**
 * Retrieves the next number of entries from the database.
 * @method getNextBatch
 */
Factory.prototype.getNextBatch = function() {
    if (this.offset >= this.endId)
        return [];
    var queryString = "SELECT * FROM " + this.table + " LIMIT " + this.limit + " OFFSET " + this.offset;
    var result = this.database.execQuerySync({
        stmt: queryString
    });
    this.offset += this.limit;

    return result;
}

module.exports = Factory;