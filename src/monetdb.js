var Promise = require("bluebird");
var _ = require("underscore");
var odbc = require("odbc");
var debug = require("debug")("monetdb");
var debugErr = require("debug")("monetdb:error");

/**
 * Handles the connection to odbc
 * @param {String} options.connectionString The connection string for odbc.
 * @class monetdb
 */
var monetdb = function(options) {
    options = options || {};
    var self = {};
    var connectionString = options.connectionString || "DRIVER={monetdb};SERVER=localhost;UID=monetdb;PWD=monetdb;DATABASE=higgs_db";
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

module.exports = monetdb;