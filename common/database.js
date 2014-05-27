var Promise = require("bluebird");
var _ = require("underscore");
var odbc = require("odbc");
var debug = require("debug")("database");
var debugErr = console.error;
var config = require("config").DATABASE;
/**
 * Handles the connection to odbc
 * @param {String} options.connectionString The connection string for odbc.
 * @class database
 */
var database = function(options) {
    options = options || {};
    var self = {};
    var connectionString = config.connectionString;
    var db = options.db || odbc();

    /**
     * Connects to the database.
     * @return {Promise}
     * @method connectDB
     * @async
     */
    self.connectDB = function() {
        return new Promise(function(resolve, reject) {
            db.open(connectionString, function(err) {
                if (err) {
                    debugErr(err);
                    reject(err);
                } else {
                    debug("Connected to database.");
                    resolve();
                }
            });
        })
    }

    /**
     * Executes a query.
     * @param {String} query.stmt (Optional) The query string.
     * @param {Array} query.params (Optional) The parameters for the query string.
     * @return {Promise}
     * @async
     * @method execQuery
     */
    self.execQuery = function(query) {
        query = query || {};
        _.defaults(query, {
            stmt: "SELECT 1;",
            params: []
        })
        debug("Executing query: " + query.stmt);
        return new Promise(function(resolve, reject) {
            db.query(query.stmt, query.params, function(err, result) {
                if (err) {
                    debugErr(err);
                    reject(err);
                } else {
                    debug("Query executed.")
                    resolve(result);
                }
            })
        })
    }

    /**
     * Executing a query sync
     * @param {String} query.stmt (Optional) The query string.
     * @param {Array} query.params (Optional) The parameters for the query string.
     * @return {Array} results
     * @method execQuerySync
     */
    self.execQuerySync = function(query) {
        query = query || {};
        _.defaults(query, {
            stmt: "SELECT 1;",
            params: []
        })
        debug("Executing query (sync): " + query.stmt + ".")
        if (query.params.length > 0)
            debug("With parameters: " + query.params + ".");
        var result = db.querySync(query.stmt, query.params);
        debug("Executing query, done.");
        return result;
    }

    /**
     * Closes the connection to the database.
     * @return {Promise}
     * @async
     * @method closeDB
     */
    self.closeDB = function() {
        return new Promise(function(resolve, reject) {
            db.close(function() {
                debug("Closing connection.");
                resolve();
            })
        })
    }

    return self;
}

module.exports = database;