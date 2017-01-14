/**
 *
 * osohm, 7/12/2016
 */

'use strict';

var logger = require('../../lib/logger')();
var fse = require('fs-extra');
var path = require('path');
var async = require('async');

var rexdb = require('./rexdb');

var UNLOADED = 'UNLOADED';
var ALL = 'ALL';

/**
 * Constructor
 * @param {String} dir to put the individual DB files (abs. path)
 * @constructor
 */
function RexDBSplit(dir) {
    // fields
    this.dir = dir;
    this.dbs = {};
    this.lastPackageUIdsToUse = [];
    this.hiddenPackageUIdsToUse = [];   // Metadata_2.1 : hidden H/W packages
    fse.ensureDirSync(dir);
}

module.exports = RexDBSplit; // object that's returned by a require call

/**
 *
 * @param {Array} packageUIdsToUse
 * @param callback
 */
RexDBSplit.prototype.using = function() {
    return this.lastPackageUIdsToUse;
};

/**
 *
 * @param {Array} packageUIdsToUse
 * @param callback
 */
RexDBSplit.prototype.use = function(packageUIdsToUse, callback) {
    logger.info('DB: use() called with' + JSON.stringify(packageUIdsToUse));
    var that = this;
    this.lastPackageUIdsToUse = packageUIdsToUse;
    // unload packages
    async.eachOf(this.dbs, function (db, key, callback) {
        if (db != null && db !== UNLOADED) {
            if (packageUIdsToUse.indexOf(key) === -1 &&
                    that.hiddenPackageUIdsToUse.indexOf(key) === -1) {  // Metadata_2.1 : hidden H/W pacakges
                logger.info('DB: Unloading ' + key);
                db.remove({}, function() {
                    that.dbs[key] = UNLOADED;
                    callback();
                });
            } else {
                setImmediate(callback);
            }
        } else {
            setImmediate(callback);
        }
    }, function() {
        // load packages
        // [ Metadata_2.1 : append hidden H/W pacakges
        packageUIdsToUse.push(...that.hiddenPackageUIdsToUse);
        // ]
        for (var i = 0; i < packageUIdsToUse.length; i++) {
            var packageUId = packageUIdsToUse[i];
            if (that.dbs[packageUId] == null || that.dbs[packageUId] === UNLOADED) {
                var dbFile = path.join(that.dir, packageUId);
                if (fse.existsSync(dbFile) === true) {
                    logger.info('DB: Loading ' + packageUId);
                    that.dbs[packageUId] = new rexdb(dbFile);
                }
            }
        }
        logger.info('DB: status ' + JSON.stringify(that.dbs, function (key, value) {
                if (key !== '' && typeof value === 'object') {
                    return 'LOADED';
                }
                return value;
            }));
        callback();
    });
};

/**
 *
 * @param callback
 */
RexDBSplit.prototype.useAll = function(callback) {
    logger.info('DB: useAll() called');
    this.lastPackageUIdsToUse = [ALL];
    var that = this;
    fse.readdir(this.dir, function(err, files) {
        if (err || files == null) {
            logger.info('DB: useAll() error: ', err);
            return callback(err);
        }
        for (var i = 0; i < files.length; i++) {
            if (path.extname(files[i]) !== '.index') {
                var packageUId = files[i];
                var dbFile = path.join(that.dir, packageUId);
                logger.info('DB: Loading ' + packageUId);
                that.dbs[packageUId] = new rexdb(dbFile);
            }
        }
        callback();
    });
};

/**
 * Save the individual databases currently loaded in memory, then call use() to remove any packages
 * that might have been loaded during a previous insert/update/upsert
 * @param {Function} callback(err)
 */
RexDBSplit.prototype.save = function(callback) {
    var that= this;
    async.eachOf(this.dbs, function (db, key, callback) {
        if (db != null && db !== UNLOADED) {
            db.save(callback);
        } else {
            callback();
        }
    }, function(err) {
        if (that.lastPackageUIdsToUse[0] !== ALL ) {
            that.use(that.lastPackageUIdsToUse, callback);
        } else {
            setImmediate(callback);
        }
    });
};

/**
 * Insert single document or array of documents.
 *
 * If a package DB is not loaded, it will be loaded.
 * If a package DB doesn't exist, it will be created
 *
 *  * _id field is optional; if present it will be indexed
 *
 * @param {Array} newDocs
 * @param {Function} callback
 */
RexDBSplit.prototype.insert = function(newDocs, callback) {
    var that = this;
    async.each(newDocs, function(doc, callback) {
        if (doc == null) {
            return callback('RexDBSplit.insert: doc is null/undefined');
        }
        if (doc.packageUId == null) {
            return callback('RexDBSplit.insert: doc.packageUId is null/undefined');
        }
        if (that.dbs[doc.packageUId] == null || that.dbs[doc.packageUId] === UNLOADED) {
            logger.info('RexDBSplit: insert(): creating new DB ' + doc.packageUId);
            that.dbs[doc.packageUId] = new rexdb(path.join(that.dir, doc.packageUId));
        }
        that.dbs[doc.packageUId].insert(doc, callback);
    }, callback);
};

/**
 * Update a single document
 *
 * If a package DB is not loaded, it will be loaded.
 * If a package DB doesn't exist, it will fail.
 *
 * @param {Object} query: only '_id' is supported
 * @param {Object} record: the updated record to put (the whole record is replaced with the updated record)
 * @param {Function} callback(err)
 */
RexDBSplit.prototype.update = function(query, record, callback) {
    var that = this;
    setImmediate(function() {
        if (record == null) {
            return callback('RexDBSplit.update: record is null/undefined');
        }
        if (record.packageUId == null) {
            return callback('RexDBSplit.update: record.packageUId is null/undefined');
        }
        if (that.dbs[record.packageUId] == null) {
            return callback('RexDBSplit.update: ' + record.packageUId + ' doesn`t exist');
        }
        if (that.dbs[record.packageUId] === UNLOADED) {
            logger.info('RexDBSplit: update(): creating new DB ' + record.packageUId);
            that.dbs[record.packageUId] = new rexdb(path.join(that.dir, record.packageUId));
        }
        that.dbs[record.packageUId].update(query, record, callback);
    });
};

/**
 * Update or insert a single document
 *
 * If a package DB is not loaded, it will be loaded.
 * If a package DB doesn't exist, it will be created.
 *
 * @param {Object} query: only '_id' is supported
 * @param {Object} record: the updated record to put (the whole record is replaced with the updated record or a new one is created if none is found)
 * @param {Function} callback(err)
 */
RexDBSplit.prototype.upsert = function(query, record, callback) {
    var that = this;
    setImmediate(function() {
        if (record == null) {
            return callback('RexDBSplit.upsert: record is null/undefined');
        }
        if (record.packageUId == null) {
            return callback('RexDBSplit.upsert: record.packageUId is null/undefined');
        }
        if (that.dbs[record.packageUId] == null || that.dbs[record.packageUId] === UNLOADED) {
            logger.info('RexDBSplit: upsert(): creating new DB ' + record.packageUId);
            that.dbs[record.packageUId] = new rexdb(path.join(that.dir, record.packageUId));
        }
        that.dbs[record.packageUId].upsert(query, record, callback);
    });
};

/**
 * Remove a SINGLE specified package or ALL packages
 * In the query either specify packageId/packageVersion or packageUId; or {} to remove all packages
 *
 * If a package DB is not loaded, it will NOT be loaded.
 *
 * @param {Object} query
 * @param {Function} callback
 * @api public
 */
RexDBSplit.prototype.remove = function(query, callback) {
    var that = this;
    if (Object.keys(query).length !== 0) { // i.e. query is {}
        if ((query.packageId != null && query.packageVersion == null) ||
            (query.packageId == null && query.packageVersion != null) ||
            (query.packageId == null && query.packageVersion == null && query.packageUId == null)) {
            throw('RexDBSplit: Remove only works with entire packages. Either speciy packageId/packageVersion or packageUId');
        }
    }
    if (Object.keys(query).length === 0) { // i.e. query is {}
        // remove ALL packages
        // remove all loaded packages from memory
        async.eachOf(this.dbs, function (db, key, callback) {
            if (db != null && db !== UNLOADED) {
                db.remove({}, callback);
            } else {
                callback();
            }
        }, function() {
            // now remove all DB files
            that.dbs = {};
            fse.emptyDir(that.dir, function(err) {
                callback(err);
            });
        });
    } else {
        // remove SINGLE package
        var packageUId;
        if (query.packageUId != null) {
            packageUId = query.packageUId;
        } else {
            packageUId = query.packageId + '__' + query.packageVersion;
        }
        if (this.dbs[packageUId] != null) {
            // remove DB file and index file
            fse.unlink(path.join(that.dir, packageUId), function(err) {
                fse.unlink(path.join(that.dir, packageUId, '.index'), function(err) {
                    // remove from memory if loaded
                    if (that.dbs[packageUId] !== UNLOADED) {
                        that.dbs[packageUId].remove({}, function () {
                            delete that.dbs[packageUId];
                            callback(err);
                        });
                    } else {
                        delete that.dbs[packageUId];
                        callback(err);
                    }
                });
            });
        } else {
            setImmediate(callback);
        }
    }
};

/**
 *
 * @param {Object} query
 * @param {Boolean} findOne
 * @param {Function} callback(err, Array:results)
 * @api private
 */
RexDBSplit.prototype._findInCache = function(query, findOne, callback) {
    var allResults = [];
    async.eachOf(this.dbs, function (db, key, callback) {
        if (db != null && db !== UNLOADED) {
            db._findInCache(query, findOne, function(err, result) {
                if (err == null && result != null && result.length > 0) {
                    allResults = allResults.concat(result);
                    if (findOne === true) {
                        return callback('earlyexit');
                    }
                }
                callback(err);
            });
        } else {
            setImmediate(callback);
        }
    }, function(err) {
        if (err === 'earlyexit') {
            err = null;
        }
        setImmediate(callback, err, allResults);
    });
};

/**
 *
 * @param {Object} query
 * @param {Function} callback(err, Array:results)
 * @api public
 */
RexDBSplit.prototype.find = function(query, callback) {
    var that = this;
    this._findInCache(query, false, function(err, results) {
        callback(err, that.deepCopy(results));

    });
};

/**
 * Faster and less memory intensive find() avoiding the deep copy
 * The results cannot be modified, if attempted a freeze exception is thrown
 *
 * @param {Object} query
 * @param {Function} callback(err, Array:results)
 * @api public
 */
RexDBSplit.prototype.findNoDeepCopy = function(query, callback) {
    this._findInCache(query, false, function(err, results) {
        callback(err, results == null ? null : Object.freeze(results));

    });
};

/**
 *
 * @param {Object} query
 * @param {Function} callback(err, Object: result)
 * @api public
 */
RexDBSplit.prototype.findOne = function(query, callback) {
    var that = this;
    this._findInCache(query, true, function(err, results) {
        if (results.length === 0) {
            callback(err, null);
        } else {
            callback(err, that.deepCopy(results[0]));
        }
    });
};

/**
 * Based on http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-an-object/5344074#5344074
 * Note: it doesn't copy functions, Date and Regex's
 * @param obj
 * @returns {*}
 */
RexDBSplit.prototype.deepCopy = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

// [ Metadata_2.1 : hidden H/W pacakges
/**
 *
 */
RexDBSplit.prototype.usingHidden = function() {
    return this.hiddenPackageUIdsToUse;
};

/**
 *
 * @param {Array} packageUIdsToUse
 */
RexDBSplit.prototype.useHidden = function(packageUIdsToUse) {
    if(packageUIdsToUse == null) {
        packageUIdsToUse = [];
    }
    this.hiddenPackageUIdsToUse = packageUIdsToUse;
};
// ]