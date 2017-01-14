/**
 * Created by auser on 21/04/16.
 *
 * Usage: var rexdb = require
 */

'use strict';

var async = require('async');
var dinfra;

var TIREX_PREFIX = '/tirex';

exports.setDinfra = function (theDinfra) {
    dinfra = theDinfra;
    return this;
};

function makePath(dbpath) {
    return TIREX_PREFIX + '/' + dbpath;
}

function makeKey(dbpath, _id) {
    return makePath(dbpath) + '/' + _id;
}

/**
 * Creates new records if they don't already exist
 *
 * @param dbpath: without leading and trailing '/'s
 * @param records: must have an _id field
 * @param callback(error)
 */
exports.insert = function (dbpath, records, callback) {
    async.each(records, function(record, callback) {
        _insertOne(dbpath, record, callback);
    }, (err) => setImmediate(callback, err));
};


/**
 * Update existing records
 *
 * @param dbpath: without leading and trailing '/'s
 * @param records: must have an _id field
 * @param callback(error)
 */
exports.update = function (dbpath, records, callback) {
    async.each(records, function(record, callback) {
        _updateOne(dbpath, record, callback);
    }, (err) => setImmediate(callback, err));
};

/**
 * Update or insert records if they don't exist
 *
 * @param dbpath: without leading and trailing '/'s
 * @param records: must have an _id field
 * @param callback(error)
 */
exports.upsert = function (dbpath, records, callback) {
    async.each(records, function(record, callback) {
        _upsertOne(dbpath, record, callback);
    }, (err) => setImmediate(callback, err));
};

/**
 * Creates a new record if it doesn't already exist
 *
 * @param dbpath: without leading and trailing '/'s
 * @param record: must have an _id field
 * @param callback(error)
 * @private
 */
function _insertOne(dbpath, record, callback) {
    if (record == null) {
        return callback('Error inserting record: record is null');
    }
    if (record._id == null) {
        return callback('Error inserting record: record does not have an _id: ' + JSON.stringify(record));
    }
    dinfra.openResource(makeKey(dbpath, record._id), {create: true}, function (error, resource) {
        if (error != null) {
            callback(error);
        } else if (resource == null) {
            error = 'Could not create record';
            callback(error);
        } else {
            resource.setMeta('tirex', record);
            resource.close(function (error) {
                callback(error);
            });
        }
    });
}

/**
 * Update an existing record
 *
 * @param dbpath: without leading and trailing '/'s
 * @param record: must have an _id field
 * @param callback(error)
 * @private
 */
function _updateOne(dbpath, record, callback) {
    if (record == null) {
        return callback('Error updating record: record is null');
    }
    if (record._id == null) {
        return callback('Error updating record: record does not have an _id: ' + JSON.stringify(record));
    }
    dinfra.openResource(makeKey(dbpath, record._id), {writable: true}, function (error, resource) {
        if (error != null) {
            callback(error);
        } else if (resource == null) {
            callback('Error updating record: record not found, _id =' + JSON.stringify(record._id));
        } else {
            resource.setMeta('tirex', record);
            resource.close(function (error) {
                callback(error);
            });
        }
    });
}

/**
 * Update or insert a record if it doesn't exist
 *
 * @param dbpath: without leading and trailing '/'s
 * @param record: must have an _id field
 * @param callback(error)
 * @private
 */
function _upsertOne(dbpath, record, callback) {
    if (record == null) {
        return callback('Error upserting record: record is null');
    }
    if (record._id == null) {
        return callback('Error upserting record: record does not have an _id: ' + JSON.stringify(record));
    }
    dinfra.queryResources().withName(makeKey(dbpath, record)).invoke(function (error, result) {
        if (error != null) {
            return callback(error);
        }
        if (result != null) {
            _updateOne(dbpath, record, function (error) {
                callback(error);
            });
        } else {
            _insertOne(dbpath, record, function (error) {
                callback(error);
            });
        }
    });
}

/**
 * Find all records in the given dbpath
 *
 * @param dbpath: without leading and trailing '/'s
 * @param callback(error, result): will be called once for each result; if no more results 'result' is null; return false to get more results, return true to stop
 */
exports.findAll = function (dbpath, callback) {
    dinfra.queryResources().withNamePrefix(makePath(dbpath)).invoke(function (error, result) {
        return callback(error, result != null ? result.meta.tirex : null);
    });
};

exports.findAllToArray = function (dbpath, callback) {
    var results = [];
    exports.findAll(dbpath, function(error, result) {
        if (error != null) {
            callback(error);
            return true;
        } else if (result == null) {
            callback(null,  results);
            return true;
        } else {
            results.push(result);
            return false; // ask for next result
        }
    });
};

/**
 *
 * @param dbpath
 * @param callback
 */
exports.deleteAll = function (dbpath, callback) {
    var query = dinfra.queryResources().withNamePrefix(makePath(dbpath));
    query.on('error', function(error) {
        callback(error);
    });
    query.on('result', function(result) {
        dinfra.destroyResource(result.name, null, function (error) {
            if (error != null) {
                return callback(error);
            }
            query.next();
        });
    });
    query.on('end', function() {
        callback();
    });
    query.next();
};
