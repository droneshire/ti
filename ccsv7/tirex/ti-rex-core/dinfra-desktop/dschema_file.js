// Copyright (C) 2016 Texas Instruments Incorporated - http://www.ti.com/
const Q = require('q'); // promise library
const util = require('util');
const stream = require('stream');
const fs = require('fs');
const node_path = require('path');
const denum = require('./denum');
const djson = require('./djson');
const dschema = require('./dschema');
const EventEmitter = require('events').EventEmitter;
const TRACE = null; // console.log; // set to console.log to get TRACE

/**
 * Provide with the SQL query (or string), and a list of related errors.
 */
util.inherits(FileQueryError, dschema.ConnectionError);

function FileQueryError(query, errors) {
    dschema.ConnectionError.call(this,
        FileQueryError.prototype.formatQueryStatic(query));

    if (errors == null) {
        errors = [];
    }
    else if (errors instanceof Array) {
        // good
    }
    else {
        errors = [errors];
    }

    this.errors = errors;
}

/**
 * Just a bit of processing to ensure the logged SQL isn't huge,
 * and to provide some context.
 */
FileQueryError.prototype.formatQueryStatic = function (query) {
    var message;

    if (query == null) {
        message = "";
    }
    else if (typeof(query) == "string") {
        message = query;
    }
    else if (query.expr == null) {
        message = "" + query;
    }
    else {
        message = query.expr.toString();

        if (message.length > 1024) { // keep it smaller than a page
            message = message.substring(0, 1020) + " ..."; // 1024 chars
        }

        message = "error in: " + message;
    }

    return (message);
}

util.inherits(FileDatabaseEngine, dschema.DatabaseEngine);

function FileDatabaseEngine(opts, logger) {
    dschema.DatabaseEngine.call(this, opts, logger);

    // these two dirs must have been created on install
    // and must be readable/writable/traversable
    fs.statSync(this.opts.path);
    fs.statSync(this.opts.path + "/content");
}

FileDatabaseEngine.prototype.newConnectionGroup = function (access,
        overrides) {
    throw new denum.UnsupportedError();
}

exports.FileDatabaseEngine = FileDatabaseEngine;

util.inherits(FileCollection, EventEmitter);

function FileCollection(engine, name, fileName) {
    EventEmitter.call(this);

    this.engine = engine;
    this.name = name;
    this.fileName = fileName;
}

/**
 * Open the collection (called by an accessor).
 */
FileCollection.prototype.open = function (callback) {
    throw new denum.UnsupportedError();
}

/**
 * Insert a record into the collection.
 */
FileCollection.prototype.insert = function (record, callback) {
    throw new denum.UnsupportedError();
}

/**
 * Fetch a record from the collection (by id).
 */
FileCollection.prototype.fetch = function (id, callback) {
    throw new denum.UnsupportedError();
}

/**
 * Update a record in the collection (by id).
 */
FileCollection.prototype.update = function (id, update, callback) {
    throw new denum.UnsupportedError();
}

/**
 * Close the collection (called by an accessor, can be called multiply).
 */
FileCollection.prototype.close = function (callback) {
    throw new denum.UnsupportedError();
}

/**
 * Flush any changes to the collection.
 */
FileCollection.prototype.flush = function (callback) {
    throw new denum.UnsupportedError();
}

FileCollection.prototype.toString = function () {
    return (this.name);
}

exports.FileCollection = FileCollection;

util.inherits(FileConnectionGroup, dschema.ConnectionGroup);

function FileConnectionGroup(databaseEngine, access, defaults) {
    dschema.ConnectionGroup.call(this, databaseEngine, access, defaults);
}

/**
 * This has been written to be especially tolerant of parallel creates.
 */
FileConnectionGroup.prototype.ensureDirsFor = function (name, callback) {
    var self = this;
    var path = node_path.dirname(name);

    fs.mkdir(path, function (error) {
            if (error == null) {
                callback(null);
            }
            else if (error.code == "ENOENT") {
                self.ensureDirsFor(path, function (error) {
                        if (error != null) {
                            callback(error);
                        }
                        else {
                            // retry
                            self.ensureDirsFor(name, callback);
                        }
                    });
            }
            else if (error.code == "EEXIST") {
                callback(null); // fine
            }
            else {
                callback(error);
            }
        });
}

exports.FileConnectionGroup = FileConnectionGroup;

function FileConnectionGroup(databaseEngine, access, defaults) {
    dschema.ConnectionGroup.call(this, databaseEngine, access, defaults);
}

FileConnectionGroup.prototype.queryErrors = function (errors, query) {
    // no deadlocks to account for in this provider
    var result;

    if (errors == null) {
        result = null;
    }
    else if (errors instanceof Array) {
        if (errors.length == 0) {
            result = null;
        }
        else {
            result = new FileQueryError(query, errors);
        }
    }
    else {
        result = new FileQueryError(query, errors);
    }

    return (result);
}

FileConnectionGroup.prototype.addCandidate = function (name, overrides) {
    // NOP
}

FileConnectionGroup.prototype.openConnection = function (callback) {
    throw new denum.UnsupportedError();
}

FileConnectionGroup.prototype.openTransaction = function (callback) {
    throw new denum.UnsupportedError();
}

FileConnectionGroup.prototype.maintainSchema = function (conn, tablePrefix,
        schema, upgrade, callback) {
    // do nothing
    setImmediate(callback);
}

FileConnectionGroup.prototype.destroySchema = function (conn, tablePrefix,
        callback) {
    throw new denum.UnsupportedError();
}

FileConnectionGroup.prototype.getJSONSchema = function () {
    throw new denum.UnsupportedError();
}

FileConnectionGroup.prototype.reapLastInsert = function (conn, callback) {
    throw new denum.UnsupportedError();
}

FileConnectionGroup.prototype.newQueryJSONProtected =
        function (mainTablePrefix, mainSuffix, mainKeyField, jsonInfix) {
    return (new FileQueryJSON(this, mainTablePrefix, mainSuffix,
        mainKeyField, jsonInfix));
}

/**
 * A FileConnection is similar to a database connection in concept:
 * it is in essence a connection to a JSON style DB, so it is a little
 * bit of a misnomer.  Implementations are expected to override FileConnection
 * to provide query features.  The methods are however, completely different
 * at this point in time.
 * @todo urgent reconsider - may be no need to override here if
 * we abstract query in this module instead.
 */
function FileConnection(connGroup, transacting) {
    this.connGroup = connGroup;
    this.transacting = transacting;
    this.collections = {}; // by name
}

FileConnection.prototype.openCollectionProtected = function (name,
        callback) {
    var collection = this.collections[name];

    if (collection != null) {
        setImmediate(callback, null, collection);
    }
    else {
        var self = this;

        this.connGroup.databaseEngine.openCollection(name,
            this.connGroup.defaults.path + "/" + name,
            function (error, collection) {
                if (error != null) {
                    callback(error);
                }
                else {
                    self.collections[name] = collection;
                    callback(null, collection);
                }
            });
    }
}

FileConnection.prototype.insert = function (collectionName,
        record, callback) {
    this.openCollectionProtected(collectionName,
        function (error, collection) {
            if (error != null) {
                callback(error);
            }
            else {
                collection.insert(record, callback);
            }
        });
}

FileConnection.prototype.delete = function (collectionName, ids,
        callback) {
    this.openCollectionProtected(collectionName,
        function (error, collection) {
            if (error != null) {
                callback(error);
            }
            else {
                collection.delete(ids, callback);
            }
        });
}

FileConnection.prototype.fetch = function (collectionName, id,
        callback) {
    this.openCollectionProtected(collectionName,
        function (error, collection) {
            if (error != null) {
                callback(error);
            }
            else {
                collection.fetch(id, callback);
            }
        });
}

FileConnection.prototype.update = function (collectionName, id,
        record, callback) {
    this.openCollectionProtected(collectionName,
        function (error, collection) {
            if (error != null) {
                callback(error);
            }
            else {
                collection.update(id, record, callback);
            }
        });
}

FileConnection.prototype.cancel = function () {
    this.cancelled = true; // possible to wind back?
}

FileConnection.prototype.close = function (callback) {
    var count = 0;
    var errors = [];

    this.connGroup = null; // invalidate the connGroup, should disable it

    for (var name in this.collections) {
        var collection = this.collections[name];

        count++;

        collection.flush(function (error) {
                --count;

                if (error != null) {
                    errors.push(error);
                }

                if (count != 0) {
                    // wait for countdown
                }
                else if (callback == null) {
                    // ignore
                }
                else {
                    var ncallback = callback;

                    callback = null;

                    if (errors.length != 0) {
                        ncallback(errors[0]);
                    }
                    else {
                        ncallback(); // all good
                    }
                }
            });
    }

    if (count == 0) {
        if (callback != null) {
            var ncallback = callback;

            callback = null;

            ncallback();
        }
    }
}

exports.FileConnection = FileConnection;

