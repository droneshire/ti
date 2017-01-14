// Copyright (C) 2016 Texas Instruments Incorporated - http://www.ti.com/
const util = require('util');
const stream = require('stream');
const fs = require('fs');
const node_path = require('path');
const denum = require('./denum');
const djson = require('./djson');
const dschema = require('./dschema');
const dschema_file = require('./dschema_file');
const EventEmitter = require('events').EventEmitter;
const TRACE = null; // console.log; // set to console.log to get TRACE

util.inherits(SimpleDatabaseEngine, dschema_file.FileDatabaseEngine);

function SimpleDatabaseEngine(opts, logger) {
    dschema_file.FileDatabaseEngine.call(this, opts, logger);

    this.collections = {};
}

SimpleDatabaseEngine.prototype.newConnectionGroup = function (access,
        overrides) {
    return (new SimpleConnectionGroup(this, access, overrides));
}

SimpleDatabaseEngine.prototype.openCollection = function (name, baseName,
        callback) {
    if (name == null) {
        throw new RangeError("collection name cannot be null");
    }

    var fileName = baseName + ".json.gz";
    var collection = this.collections[name];

    if (collection == null) {
        collection = new SimpleCollection(this, name, fileName);

        this.collections[name] = collection;
    }

    var originalCallback = callback;

    callback = function (error) {
            if (error != null) {
                collection = null;
            }

            originalCallback(error, collection);
        };

    if (collection.available) {
        collection.open(callback);
    }
    else {
        collection.on('available', function () {
                collection.open(callback);
            });
    }
}

SimpleDatabaseEngine.prototype.flush = function (callback) {
    var subject = null;

    for (var name in this.collections) {
        subject = name;
        break;
    }

    if (subject == null) {
        if (callback != null) {
            callback();
        }
    }
    else {
        var collection = this.collections[subject];
        var self = this;

        delete this.collections[subject];

        collection.flush(function (error) {
                if (error != null) {
                    if (callback != null) {
                        callback(error);
                    }
                    else {
                        throw error;
                    }
                }
                else {
                    self.flush(callback); // go back and find more to flush
                }
            });
    }
}

SimpleDatabaseEngine.prototype.close = function (callback) {
    this.flush(callback);
}

util.inherits(SimpleCollection, dschema_file.FileCollection);

function SimpleCollection(engine, name, fileName) {
    dschema_file.FileCollection.call(this, engine, name, fileName);

    this.available = false;
    this.changesMade = 0;
    this.changesWritten = 0;
    this.syncTimeoutId = null;
    this.syncTimeout = 200;
    this.accessors = 0;
    this.flushers = [];
    this.flushing = false;
    this.records = null;

    var self = this;

    djson.loadGZJSONPath(this.fileName, {}, function (error, json) {
            // ignore - error.code == ENOENT // @todo urgent - log?
            if (error != null) {
                if (error.code == "ENOENT") {
                    // ignore
                }
                else {
                    engine.logger.warning("invalid", fileName, error);
                }
            }

            if (json == null) {
                json = { };
            }

            if (json.records == null) {
                json.records = [];
            }

            self.records = json.records;
            self.available = true;
            self.emit('available', true);
        });
}

SimpleCollection.prototype.markChanged = function () {
    this.changesMade++;
}

SimpleCollection.prototype.open = function (callback) {
    if (TRACE) {
        TRACE("open", this.fileName, this.accessors);
    }

    this.accessors++;

    setImmediate(callback);
}

SimpleCollection.prototype.insert = function (record, callback) {
    if (callback == null) {
        throw new RangeError();
    }

    record.id = this.records.length;

    this.records.push(record);

    this.markChanged();

    setImmediate(callback, null, record);
}

SimpleCollection.prototype.delete = function (ids, callback) {
    if (callback == null) {
        throw new RangeError();
    }

    if (!(ids instanceof Array)) {
        ids = [ids];
    }

    var self = this;

    ids.forEach(function (id) {
            self.records[1 * id] = null;
        });

    setImmediate(callback, null);
}

SimpleCollection.prototype.fetch = function (id, callback) {
    if (callback == null) {
        throw new RangeError();
    }

    setImmediate(callback, null, this.records[id]);
}

SimpleCollection.prototype.update = function (id, update, callback) {
    if (callback == null) {
        throw new RangeError();
    }

    var record = this.records[id];

    if (record != null) {
        for (var a in update) {
            record[a] = update[a];
        }

        this.markChanged();
    }

    setImmediate(callback, null, record);
}

SimpleCollection.prototype.close = function (callback) {
    --this.accessors;

    if (TRACE) {
        TRACE("close", this.fileName, this.accessors);
    }

    if (callback == null) {
        throw new Error("must provide a callback to this");
    }

    if (this.accessors == 0) {
        if (this.changesMade != this.changesWritten) {
            this.flush(callback);
        }
        else {
            setImmediate(callback);
        }
    }
    else {
        setImmediate(callback);
    }
}

SimpleCollection.prototype.flush = function (callback) {
    if (TRACE) {
        TRACE('flush', this.fileName);
    }

    if (callback != null) {
        this.flushers.push(callback);
    }

    if (this.flushing) {
        // let it keep doing its thing
    }
    else if ((this.changesMade == this.changesWritten) || this.flushError) {
        var flushers = this.flushers;
        var flushError = this.flushError;

        this.flushers = [];
        this.flushError = null;

        flushers.forEach(function (flusher) {
                flusher(flushError);
            });
    }
    else {
        var self = this;
        var changesFlushed = this.changesMade;

        this.flushing = true;

        var fileName = this.fileName + "_new";

        djson.saveGZJSONPath(fileName, { records: self.records }, {},
            function (error, json) {
                if (error != null) {
                    self.flushError = error;
                    self.flushing = false;

                    self.flush(); // flush again to inform everyone
                }
                else {
                    fs.unlink(self.fileName,
                        function (error) {
                            // can ignore unlink errors (ENOENT etc.)
                            fs.rename(fileName, self.fileName,
                                function (error) {
                                    if (error != null) {
                                        self.flushError = error;
                                    }
                                    else {
                                        self.changesWritten =
                                            changesFlushed;
                                    }

                                    self.flushing = false;

                                    // flush again to inform everyone
                                    self.flush();
                                });
                        });
                }
            });
    }
}

SimpleCollection.prototype.toString = function () {
    return (this.name);
}

exports.SimpleDatabaseEngine = SimpleDatabaseEngine;

util.inherits(SimpleConnectionGroup, dschema_file.FileConnectionGroup);

function SimpleConnectionGroup(databaseEngine, access, defaults) {
    dschema_file.FileConnectionGroup.call(this, databaseEngine,
        access, defaults);
}

SimpleConnectionGroup.prototype.openConnection = function (callback) {
    var self = this;

    if (callback === undefined) { // do not match null
        return (Q.ninvoke(self, "openConnection")); // shortcut to Q
    }

    setImmediate(callback, null, new SimpleConnection(this, false));

    return (undefined);
}

SimpleConnectionGroup.prototype.openTransaction = function (callback) {
    var self = this;

    if (callback === undefined) { // do not match null
        return (Q.ninvoke(self, "openTransaction")); // shortcut to Q
    }

    setImmediate(callback, null, new SimpleConnection(this, true));

    return (undefined);
}

SimpleConnectionGroup.prototype.newQueryJSONProtected =
        function (mainTablePrefix, mainSuffix, mainKeyField, jsonInfix) {
    return (new SimpleQueryJSON(this, mainTablePrefix, mainSuffix,
        mainKeyField, jsonInfix));
}

/**
 * SimpleQueryJSON changes the way that the parameters are interpreted
 * so that they fit our file model better, rather than SQL.
 */
util.inherits(SimpleQueryJSON, dschema.QueryJSON);

function SimpleQueryJSON(connGroup, collectionName, ignorableSuffix,
        keyPropertyName, jsonPropertyName) {
    dschema.QueryJSON.call(this, connGroup);

    this.collectionName = collectionName;
    this.keyPropertyName = keyPropertyName;
    this.jsonPropertyName = jsonPropertyName;
    this.selectFields = [];
    this.filters = [];
    this.index = -1; // fast fail
    this.conn = null;
    this.collection = null;
    this.connRequested = false;
    this.finished = false;
    this.waitNext = true;
    this.orderBy = null;
    this.orderAscending = false;
    this.resultRecords = null;
}

SimpleQueryJSON.prototype.withSelectField = function (name, alias, tableAlias) {
    if (alias == null) {
        alias = name;
    }

    this.selectFields.push({
            alias: alias,
            name: name,
        });

    return (this);
}

SimpleQueryJSON.prototype.withOrderBy = function (field, ascending) {
    this.orderBy = field;
    this.orderAscending = ascending;

    return (this);
}

SimpleQueryJSON.prototype.matchJSON = function (name, json, fn) {
    var result = false;

    if (json instanceof Array) {
        var jindex = 0;

        while ((jindex < json.length) &&
                !(result = this.matchJSON(undefined, json[jindex], fn))) {
            jindex++;
        }
    }
    else if (json instanceof Object) {
        for (var name in json) {
            if (result = this.matchJSON(name, json[name], fn)) {
                break;
            }
        }
    }
    else {
        result = fn(name, json);
    }

    return (result);
}

SimpleQueryJSON.prototype.stop = function () {
    if (this.collection != null) {
        this.index = getBuiltRecordsPrivate().length;
        this.waitNext = false;
        this.queueNext();
    }
}

SimpleQueryJSON.prototype.getResultRecordsPrivate = function () {
    if (this.resultRecords != null) {
        // got them
    }
    else if (this.collection == null) {
        // waiting
    }
    else if (this.orderBy == null) {
        this.resultRecords = this.collection.records;
    }
    else {
        var orderBy = this.orderBy;
        var flip = this.orderAscending ? 1 : -1;

        function comparator(left, right) {
                var result = flip;

                if (left[orderBy] < right[orderBy]) {
                    result *= -1;
                }
                else if (left[orderBy] > right[orderBy]) {
                    result *= 1;
                }
                else {
                    result = 0;
                }

                return (result);
            };

        var records = this.resultRecords = [];

        this.collection.records.forEach(function (record) {
                denum.binarySort(records, record, comparator);
            });
    }

    return (this.resultRecords);
}

SimpleQueryJSON.prototype.queueNext = function () {
    var self = this;

    if (this.waitNext) {
        // do nothing
    }
    else if (this.finished) {
        // nothing further
    }
    else if (!this.connRequested) {
        this.connRequested = true;
        this.connGroup.openConnection(function (error, conn) {
                if (error != null) {
                    callback(error);
                }
                else {
                    conn.openCollectionProtected(self.collectionName,
                        function (error, collection) {
                            if (error != null) {
                                conn.close(function () {
                                        callback(error);
                                    });
                            }
                            else if (collection == null) {
                                throw new denum.
                                    StateError("collection is null");
                            }
                            else {
                                self.conn = conn;
                                self.collection = collection;
                                self.index = 0;
                                self.queueNext();
                            }
                        });
                }
            });
    }
    else if ((records = this.getResultRecordsPrivate()) == null) {
        // collecting or sort pending - wait
    }
    else {
        var self = this;

        while (!this.waitNext && (this.index >= 0) &&
                (this.index < records.length)) {
            var findex = 0;
            var filters = this.filters;
            var fend = filters.length;
            var record = records[this.index];

            if (record == null) {
                this.index++;
                continue;
            }

            while ((findex < fend) && filters[findex].call(this, record)) {
                findex++;
            }

            this.index++;

            if (findex == fend) {
                var info = {};

                this.selectFields.forEach(function (field) {
                        info[field.alias] = record[field.name];
                    });

                info[this.jsonPropertyName] = record[this.jsonPropertyName];

                this.waitNext = true;

                self.emit('result', info);
            }
        }

        if (!this.waitNext){
            this.waitNext = true;

            this.conn.close(function (error) {
                    self.finished = true;
                    self.conn = null;
                    self.collection = null;
                    self.emit('end');
                });
        }
    }
}

SimpleQueryJSON.prototype.next = function () {
    if (this.waitNext) {
        this.waitNext = false;

        var self = this;

        setImmediate(function() {
                self.queueNext();
            });
    }
}

util.inherits(SimpleConnection, dschema_file.FileConnection);

function SimpleConnection(connGroup, transacting) {
    dschema_file.FileConnection.call(this, connGroup, transacting);
}

exports.newDatabaseEngine = function (opts, logger) {
        return (new SimpleDatabaseEngine(opts, logger));
    };
