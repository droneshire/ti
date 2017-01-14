// Copyright (C) 2015-2016 Texas Instruments Incorporated - http://www.ti.com/
/*
    NOTE: dschema is used by the logging subssystem: don't add logging to it,
    except in a controlled manner (see RetryManager for an example).
*/
const Q = require('q');
const util = require('util');
const denum = require('./denum');
const djson = require('./djson');
const dsearch = require('./dsearch');
const events = require('events');
const dlog = require('./dlog');
const schemaTableName = "dinfra_schema";
const TRACE = null; // set to console.log for trace
const QTRACE = null; // set to console.log for query trace
const PTRACE = null; // set to console.log for cache emitter trace

// these govern the transaction isolation level of a 
exports.ACCESS = denum.cardinals(
    "WRITABLE",
    "READABLE",
    "WAREHOUSE");

/**
 * These are only thrown if the caller fails to provide a callback,
 * or there is a re-entrancy problem with multiple events where one
 * was expected.  Subclasses of this can be thrown under other
 * circumstances however.
 */
util.inherits(ConnectionError, denum.ExtendError);

function ConnectionError(message) {
    denum.ExtendError.call(this, message);
}

exports.ConnectionError = ConnectionError;

function EfficientDelete(tableName, fieldName) {
    this.tableName = tableName;
    this.primaryFieldName = fieldName;
}

EfficientDelete.prototype.withLeftJoin = function (tableName, fieldName) {
    throw new denum.UnsupportedError();
}

EfficientDelete.prototype.applyQuery = function (conn, valueArray, callback) {
    throw new denum.UnsupportedError();
}

exports.EfficientDelete = EfficientDelete;

/*
    Because we use 64 bit integers a lot for timestamps.
*/
exports.dateAsLong = function(date) {
        if (date == null) {
            date = 0;
        }
        else if (typeof(date) == "number") {
            // fine
        }
        else if (typeof(date) == "string") {
            // fine
            date = Date.parse(date).getTime();
        }
        else if (date instanceof Date) {
            date = date.getTime();
        }
        else {
            throw new TypeError("unsupported conversion " + typeof(date) +
                " " + date.constructor.name);
        }

        return (date);
    };

/**
 * Generally only one of these is created for use by dinfra,
 * but the pattern should be that more than one is possible, not singleton.
 * Summary data will be written to the logger about retry attempts and
 * so forth - this saves excesss log messages being written for every
 * single attempt.
 */
function RetryManager(writableGroup, logger,
        recoverPriority, failurePriority) {
    this.logger = logger;
    this.writableGroup = writableGroup;
    this.recoverPriority = recoverPriority;
    this.failurePriority = failurePriority;
    this.startingDelay = 40; // start with this delay
    this.maxDelay = 3000; // fail after this
    this.flushTimeout = 5000; // flush after this inactivity
    this.reports = {};
    this.waiting = null;
    this.started = 0;
    this.finished = 0;
}

/**
 * Create a new retry handler for a specific transaction replay.
 * The purpose is just a text string explaining the purpose of
 * the retry.
 */
RetryManager.prototype.newRetryHandler = function (purpose) {
    return (new RetryHandler(this, purpose));
}

/**
 * Schedule a private flush (or execute if ready).
 */
RetryManager.prototype.flushPrivate = function() {
    if (this.finished == 0) {
        this.finished = Date.now();
    }

    var summary = {
            concurrency: 0,
            contention: 0,
            failures: 0,
            duration: this.finished - this.started,
            deferral: 0
        };
    var messages = [
            "retry-manager",
            null,
            summary,
            null
        ];

    for (var purpose in this.reports) {
        var report = this.reports[purpose];

        if (report.failures > 0) {
            summary.failures += report.failures;
            messages.push(purpose);
        }

        summary.contention += report.errors.length;
        summary.deferral += report.deferral;
        summary.concurrency++;
    }

    var priority;

    if (summary.failures > 0) {
        priority = this.failurePriority;
        messages[1] = "has failures";
        messages[3] = "failed purposes follow";
    }
    else {
        priority = this.recoverPriority;
        messages[1] = "all retries successful";
        messages.splice(3, messages.length); // delete spare slot
    }

    this.logger.vmessage(priority, messages);
    this.started = 0; // reset started
    this.finished = 0; // reset finished
    this.reports = {}; // clear reports
}

/**
 * Schedule the private flush part (or execute if now).
 */
RetryManager.prototype.schedulePrivate = function(now) {
    var timeout = this.finished + this.flushTimeout - now;

    if (timeout <= 0) {
        if (this.waiting != null) {
            clearTimeout(this.waiting);
            this.waiting = null;
        }

        this.flushPrivate();
    }
    else {
        if (this.waiting == null) {
            var self = this;

            this.waiting = setTimeout(function () {
                    self.waiting = null;
                    self.pendingPrivate();
                }, timeout);
        }
    }
}

/**
 * This just calls schedule private with the current date-time in millis.
 */
RetryManager.prototype.pendingPrivate = function() {
    this.schedulePrivate(Date.now());
}

/**
 * This will cancel any pending flush and flush the retry manager
 * immediately - note it has no effect on open handlers.
 */
RetryManager.prototype.flush = function () {
    if (this.started != 0) {
        this.finished = 0; // clear the activity ...
        this.pendingPrivate(); // ... to cause an immediate flush.
    }
}

RetryManager.prototype.flushHandlerPrivate = function (handler) {
    if (handler.errors.length > 0) {
        this.finished = Date.now();

        if (this.started == 0) {
            this.started = handler.started;
        }
        else {
            this.started = Math.min(handler.started, this.started);
        }

        var report = this.reports[handler.purpose];

        if (report == null) {
            this.reports[handler.purpose] = report = {
                    failures: 0, // number of total failures reported
                    deferral: 0, // total time deferred (overlapping)
                    errors: [] // specific errors reported
                };
        }

        if (handler.failed) {
            report.failures++;
        }

        handler.errors.forEach(function (error) {
                report.errors.push(error);
            });

        report.deferral += handler.deferral;

        this.schedulePrivate(this.finished);
    }
}

function RetryHandler(manager, purpose) {
    this.manager = manager;
    this.purpose = purpose;
    this.lastDelay = manager.startingDelay / 2; // it will be doubled anyway
    this.firstFailed = 0;
    this.maxDelay = manager.maxDelay; // as long as we should wait
    this.errors = [];
    this.fixups = [];
    this.deferral = 0;
    this.started = Date.now();
    this.waiting = null;
    this.retryFunction = null;
    this.failureFunction = null;
}

/** 
 * Send the summary data to the manager - the manager might not flush
 * immediately though.
 */
RetryHandler.prototype.flush = function () {
    this.manager.flushHandlerPrivate(this);

    this.errors = []; // reset errors
    this.deferral = 0; // clear accumulated deferral MS
    this.failed = false;
    this.fixups = []; // a list of fixup functions to call
}

/**
 * Add a function that will rewind accumulated state changes.
 */
RetryHandler.prototype.withRewindFunction = function (fn) {
    this.fixups.push(fn);

    return (this);
}

RetryHandler.prototype.withRewindProperty = function (owner, name, value) {
    var present = (name in owner);
    var prior;

    if (present) {
        prior = owner[name];
    }
    else {
        prior = undefined; // lint
    }

    owner[name] = value;

    return (this.withRewindFunction(function () {
            if (!present) {
                delete owner[name];
            }
            else {
                owner[name] = prior;
            }
        }));
}

RetryHandler.prototype.withRewindPush = function (owner, value) {
    owner.push(value);

    return (this.addRewindFunction(function () {
            owner.pop(); // maybe a little cheap ...
        }));
}

/**
 * The retryFunction will get automatically scheduled by handleError()
 * when a retry should be attempted.  Some retry function must be
 * registered before handleError() is called.
 */
RetryHandler.prototype.withRetryFunction = function (retryFunction) {
    this.retryFunction = retryFunction;

    return (this);
}

/**
 * The failureFunction will get automatically called by handleError()
 * when retries have been exhausted.  Failure functions are optional.
 */
RetryHandler.prototype.withFailureFunction = function (failureFunction) {
    this.failureFunction = failureFunction;

    return (this);
}

/**
 * Handles a deadlock error by interacting with the retry manager.
 * If the operation can be retried, this will return null, and
 * schedule the retry at a future time.  If the operation should
 * not be retried, then an error is returned; and, if a failure
 * function has been registered, it will be called with the error.
 */
RetryHandler.prototype.handleError = function (error) {
    if (error != null) {
        this.errors.push(error);

        if (this.firstFailed == 0) {
            this.firstFailed = Date.now();
        }

        this.lastDelay *= 1.0 + Math.random();
    }

    var fixupErrors = [];

    // rewind the fixups (from the end, backwards)
    while (this.fixups.length > 0) {
        try {
            this.fixups.splice(this.fixups.length - 1)[0]();
        }
        catch (e) {
            fixupErrors.push(e);
        }
    }

    if (fixupErrors.length > 0) {
        // this is a serious situation - runtime state compromised,
        // have to bail ...
        throw this.manager.writableGroup.queryErrors(fixupErrors, null);
    }

    if (this.lastDelay < this.maxDelay) {
        this.deferral += this.lastDelay;
        this.waiting = setTimeout(this.retryFunction, this.lastDelay);

        error = null;
    }
    else {
        error = this.manager.writableGroup.queryErrors(this.errors, null);
        this.failed = true;

        this.flush();

        if (this.failureFunction) {
            this.failureFunction();
        }
    }

    return (error);
}

/** 
 * This is optional, but a good idea when you're done with a retry handler.
 */
RetryHandler.prototype.close = function () {
    this.flush();
}

function LandscapeConnector(primaryEngine, logger) {
    denum.constantProperty(this, "primaryEngine", primaryEngine);
    denum.constantProperty(this, "logger", logger);
}

LandscapeConnector.prototype.defineGroup = function (access, defaults) {
    return (this.primaryEngine.newConnectionGroup(access, defaults));
}

LandscapeConnector.prototype.flush = function (callback) {
    this.primaryEngine.flush(callback);
}

LandscapeConnector.prototype.close = function (callback) {
    this.primaryEngine.close(callback);
}

/**
 * DatabaseEngine is extended by classes in dschema_*.js by type name. 
 * Intermediate abstract implementations also exist.
 */
function DatabaseEngine(opts, logger) {
    this.opts = opts;
    this.logger = logger;
}

/**
 * Allocate a new connection group for the specified type of access
 * and using the given defaults.  This must be implemented by providers.
 */
DatabaseEngine.prototype.newConnectionGroup = function (access, defaults) {
    throw new denum.UnsupportedError();
}

/**
 * Close the database engine - can be a nop.
 */
DatabaseEngine.prototype.close = function (callback) {
    if (callback != null) {
        callback();
    }
}

exports.DatabaseEngine = DatabaseEngine; // provider use only

function ConnectionGroup(databaseEngine, access, defaults) {
    if (databaseEngine == null) {
        throw new RangeError("need databaseEngine");
    }

    if (access == null) {
        throw new RangeError("need access");
    }

    if (defaults == null) {
        throw new RangeError("need defaults");
    }

    denum.constantProperty(this, "databaseEngine", databaseEngine);
    denum.constantProperty(this, "access", access);
    denum.constantProperty(this, "logger", databaseEngine.logger);

    this.defaults = denum.configOverlay(defaults, {}); // shallow object copy
    this.queryExprFactory = new QueryExprFactory();

    if (this.defaults.user == null) {
        this.defaults.user = process.env.USER;
    }
}

ConnectionGroup.prototype.addCandidate = function (name, overrides) {
    throw new denum.UnsupportedError();
}

ConnectionGroup.prototype.openConnection = function (callback) {
    throw new denum.UnsupportedError();
}

ConnectionGroup.prototype.openTransaction = function (callback) {
    throw new denum.UnsupportedError();
}

/**
 * Used to dump the contents of a collection - for debugging only.
 * Syntax of output could be engine specific.
 */
ConnectionGroup.prototype.rawCollectionDump = function (stream, collection,
        callback) {
    throw new denum.UnsupportedError();
}

/**
 * Attempts to take a set of errors discovered during a query
 * and return a QueryError object with a rational structure for logging.
 * This is also critical to deadlock reporting.  See QueryError().
 * Note that this will return null if errors is null, undefined or
 * an empty list (Array).
 */
ConnectionGroup.prototype.queryErrors = function (errors, query) {
        throw new denum.UnsupportedError();
    };

/**
 * Maintains a database according to the schema <schema>,
 * with table names prefixed with <tablePrefix>.  Once
 * complete, callback(error, warnings) is called (warnings
 * is an array).  Update can be either true or false.  If
 * update is true, then maintain will attempt to modify
 * tables that already exist, if necessary, otherwise
 * maintain will only create tables and report warnings
 * on differences.  The <conn> should be a connection
 * that was opened with the ConnectionGroup.
 */
ConnectionGroup.prototype.maintainSchema = function (conn, tablePrefix,
        schema, upgrade, callback) {
    throw new denum.UnsupportedError();
}

/**
 * Return the schema used for maintaining JSON/BSON+ on this connection group.
 */
ConnectionGroup.prototype.getJSONSchema = function () {
    throw new denum.UnsupportedError();
}

/**
 * Destroy a schema by table prefix or similar.
 */
ConnectionGroup.prototype.destroySchema = function (conn, tablePrefix,
        callback) {
    throw new denum.UnsupportedError();
}

ConnectionGroup.prototype.reapLastInsert = function (conn, callback) {
    throw new denum.UnsupportedError();
}

/**
 * Create a retry manager suitable for the connection group.  Generally
 * only used on writable groups for transaction driven connections.
 */
ConnectionGroup.prototype.newRetryManager = function (logger,
        recoverPriority, failurePriority) {
    return (new RetryManager(this, logger, recoverPriority, failurePriority));
}

ConnectionGroup.prototype.newQueryJSONProtected = function (mainTablePrefix,
        mainSuffix, mainKeyField, jsonInfix) {
    throw new denum.UnsupportedError();
}

exports.ConnectionGroup = ConnectionGroup;

function SchemaUpgrade(writableGroup, lease, service, tablePrefix, callback) {
    this.writableGroup = writableGroup;
    this.lease = lease;
    this.service = service;
    this.tablePrefix = tablePrefix;
    this.callback = callback;
    this.errors = [];
    this.logger = dlog.logger("dinfra-upgrade");
}

/**
 * This is a convenience method (mostly used in testing), that allows
 * you to destroy all the tables that begin with a given prefix (concatenated
 * from this.tablePrefix and destroyInfix).  It will also delete any
 * versioning records held in dinfra_schema that use that EXACT prefix.
 */
SchemaUpgrade.prototype.destroy = function (destroyInfix, callback) {
    var self = this;

    exports.destroy(this.conn, this.tablePrefix + destroyInfix,
        function (error) {
            if (error != null) {
                callback(error);
            }
            else {
                self.conn.query('DELETE FROM `' + tablePrefix + 'schema`' +
                    ' WHERE `prefix` = ?',
                    [self.tablePrefix + destroyInfix],
                    callback);
            }
        });
}

SchemaUpgrade.prototype.openConnPrivate = function () {
    var self = this;

    this.writableGroup.openConnection(function (error, conn) {
            if (error != null) {
                self.closePrivate(error);
            }
            else {
                self.conn = conn;

                var callback = self.callback;

                self.callback = null;

                callback(null, self);
            }
        });
}

/**
 * For any open schema upgrade, the connection is non-null
 * and can be used for any purpose by the user.
 */
SchemaUpgrade.prototype.connection = function () {
    return (this.conn);
}

/**
 * Tell me the version of some schema by infix - callback(error, version).
 */
SchemaUpgrade.prototype.version = function (tableInfix, callback) {
    if (callback === undefined) {
        return (Q.ninvoke(this, 'version', tableInfix)); // shortcut to Q
    }

    if (!(callback instanceof Function)) {
        throw new Error("illegal callback");
    }

    var self = this;
    var q = this.conn.query("SELECT t0.version AS version FROM " +
            schemaTableName + " t0" + // for dinfra_
            " WHERE t0.prefix = ?",
            [this.tablePrefix + tableInfix], // for this upgrade ...
        function (error, rows) {
            if (error != null) {
                callback(error);
            }
            else {
                var version;

                if (rows.length == 1) {
                    version = rows[0].version;

                    if (version == "initial") { // special version word
                        version = null;
                    }
                    else if (version == "") {
                        version = null;
                    }
                    else {
                        // lets hope version is valid
                    }
                }
                else {
                    version = null;
                }

                callback(null, version);
            }
        });
}


/**
 * Upgrade a schema, using an upgradePrefix generated by concatenating
 * this.tablePrefix with the provided tableInfix.  The upgradePrefix 
 * must have a version that compares as the same or later to the
 * current version, if one exists.  Otherwise, it will not upgrade,
 * and will warn that it did not. 
 */
SchemaUpgrade.prototype.upgrade = function (tableInfix, schema, callback) {
    if (callback === undefined) {
        return (Q.ninvoke(this, "upgrade", tableInfix, schema));
    }

    if (!(callback instanceof Function)) {
        throw new Error("callback is invalid");
    }

    if (schema.version == null) {
        throw new Error("no schema.version");
    }

    if (schema.version == "initial") {
        throw new Error("illegal schema.version");
    }

    if (schema.version == "") {
        throw new Error("invalid schema.version");
    }

    var self = this;

    this.version(tableInfix, function (error, version) {
            var convert = null;

            if (error != null) {
                callback(error);
            }
            else if (denum.compareVersions(schema.version, version) < 0) {
                self.logger.warning("the database schema",
                    self.tablePrefix + tableInfix,
                    "is currently at version", version, "-",
                    "will not attempt to apply bundled schema version",
                    schema.version);

                callback(null);
            }
            /*
                When a schema contains a "convert" section, then the
                version we're converting from needs to appear in that
                section in order for conversion to be supported.
            */
            else if ((schema.convert != null) && (version != null) &&
                        (version != schema.version) &&
                        !(convert = (schema.convert[version]))) {
                self.logger.critical("the database schema",
                    self.tablePrefix + tableInfix,
                    "is currently at version", version,
                    " - cannot convert to bundled schema version,",
                    schema.version,
                    "due to lack of explicit converter support");

                callback(new Error("database conversion support required"));
            }
            else {
                self.callback = callback;
                self.upgradeSchema = schema;
                self.upgradePrefix = self.tablePrefix + tableInfix;

                if (version == null) {
                    version = "initial";
                }

                var q = self.conn.query("INSERT INTO " +
                        schemaTableName + "" + // dinfra_ prefix
                        " (prefix, version, upgrade_version) " +
                        " VALUES (?, ?, ?)" +
                        " ON DUPLICATE KEY UPDATE " +
                        " upgrade_version = ?",
                        [
                            self.upgradePrefix,
                            version,
                            schema.version,
                            schema.version,
                        ],
                    function (error) {
                        if (error != null) {
                            log.error("record version failed", q.sql, error);
                            self.upgradeTerminatePrivate(error);
                        }
                        else {
                            self.upgradeConvert = convert;
                            self.upgradePrePrivate();
                        }
                    });
                }
        });

    return (undefined);
}

SchemaUpgrade.prototype.upgradeTerminatePrivate = function (error) {
    if (error != null) {
        this.errors.push(error);
    }

    if (this.errors.length > 0) {
        error = this.errors;
        this.errors = [];
    }
    else {
        error = null; // actually redundant, but we do it for form
    }

    var callback = this.callback;

    this.callback = null;

    callback(error);
}

SchemaUpgrade.prototype.upgradeConfirmPrivate = function () {
    var self = this;
    var query;

    query = self.conn.query("UPDATE " +
            schemaTableName + "" + // dinfra_ prefix
            " SET upgrade_version = null, " +
            " version = ?" +
            " WHERE prefix = ?",
            [
                self.upgradeSchema.version,
                self.upgradePrefix
            ],
        function (error, rows) {
            if (error != null) {
                error = self.manager.writableGroup.
                    queryErrors(error, query);
            }

            self.upgradeTerminatePrivate(error); // may be null
        });
}

SchemaUpgrade.prototype.convertFunctionPrivate = function (label) {
    var descrip;
    var fn;

    if (!this.upgradeConvert) {
        fn = null;
    }
    else if (!(descrip = this.upgradeConvert[label])) {
        fn = null;
    }
    else {
        fn = require(descrip.file)[descrip.function];

        if (typeof(fn) != "function") {
            throw new Error("function " + descrip.function +
                " not present in " + descrip.file);
        }
    }

    return (fn);
}

SchemaUpgrade.prototype.upgradePrePrivate = function () {
    var fn = this.convertFunctionPrivate("pre");

    if (fn == null) {
        this.upgradeMaintainPrivate();
    }
    else {
        var self = this;

        fn(this, function (error) {
                if (error != null) {
                    self.upgradeTerminatePrivate(error);
                }
                else {
                    self.upgradeMaintainPrivate();
                }
            });
    }
}

SchemaUpgrade.prototype.upgradePostPrivate = function () {
    var fn = this.convertFunctionPrivate("post");

    if (fn == null) {
        this.upgradeConfirmPrivate();
    }
    else {
        var self = this;

        fn(this, function (error) {
                if (error != null) {
                    self.upgradeTerminatePrivate(error);
                }
                else {
                    self.upgradeConfirmPrivate(error);
                }
            });
    }
}

SchemaUpgrade.prototype.upgradeMaintainPrivate = function () {
    var self = this;

    this.writableGroup.maintainSchema(this.conn,
        this.upgradePrefix, this.upgradeSchema, true, // upgrades!!!
        function (error, warnings) {
            if (warnings != null) {
                for (var i = 0; i < warnings.length; i++) {
                    self.lease.logger.warning("upgrade",
                        self.upgradePrefix, "warning", i,
                        warnings[i]);
                }
            }

            if (error != null) {
                self.upgradeTerminatePrivate(error);
            }
            else {
                self.upgradePostPrivate();
            }
        });
}

/**
 * Close can be called on a schema upgrade in order to close
 * the upgrade and collect an errors through a callback.
 */
SchemaUpgrade.prototype.closePrivate = function (error) {
    var self = this;

    if (error != null) {
        if (error instanceof Function) {
            throw new Error("bad interface use:" +
                " error is a function");
        }

        this.errors.push(error);
    }

    if (this.conn != null) {
        this.conn.close(function (error) {
                self.conn = null;
                self.closePrivate(error);
            });
    }
    else if (this.lease != null) {
        this.lease.close(function (error) {
                self.lease = null;
                self.closePrivate(error);
            });
    }
    else if (this.errors.length > 0) {
        if (this.callback == null) {
            throw new Error(this.errors);
        }

        this.callback(this.errors);
    }
    else {
        if (this.callback == null) {
            // ignore
        }
        else {
            this.callback(null);
        }
    }
}

SchemaUpgrade.prototype.close = function (callback) {
    if (callback === undefined) {
        return (Q.ninvoke(this, "close"));
    }

    if (callback != null) {
        if (!(callback instanceof Function)) {
            throw new Error("bad interface use: callback is not a function");
        }

        if (this.callback != null) {
            throw new Error("bad interface use:" +
                " schema upgrade close(callback) called" +
                " with existing callback");
        }
    }

    // clears callback - important
    this.callback = callback;

    this.closePrivate(null);

    return (undefined);
}

exports.SchemaUpgrade = SchemaUpgrade;

exports.newLandscapeConnector = function (opts, logger) {
        var type = opts.type;

        if (type == null) {
            throw new RangeError("need type in options");
        }
        else if (type == "file") {
            // there are two types of file db ...
            try {
                require.resolve('./dschema_level.js');

                type = "level";
            }
            catch (e) {
                type = "simple";
            }
        }
        else {
            // type remains the same
        }

        if (logger == null) {
            throw new RangeError("need logger");
        }

        var gen = require("./dschema_" + type + ".js");

        if (gen.newDatabaseEngine == null) {
            throw new TypeError("schema module '" + type + "' resolves " +
                "but does not implement newDatabaseEngine");
        }

        return (new LandscapeConnector(gen.newDatabaseEngine(opts, logger),
            logger));
    };


/**
 * This is the base class for INTERNAL query support that integrates
 * JSON/BSON+ trees into the returned objects and provides
 * filtering over the same.  Not all implementations need
 * to use this.
 */
util.inherits(QueryJSON, events.EventEmitter);

function QueryJSON(connGroup) {
    events.EventEmitter.call(this);

    this.connGroup = connGroup;
}

/**
 * Set the batch size (if used by the implementation).
 * A batch size of 0 means perform no batching.
 */
QueryJSON.prototype.withBatchSize = function (batchSize) {
    // just ignore for base classes - really only matters for mysql

    return (this);
}

/**
 * Allows simple conditional processing on whether the value is a regular
 * expression or a string (and maybe later we'll support arrays here too).
 * The length is optional, and is used in those cases where there is a
 * fixed field length limit.
 */
QueryJSON.prototype.withPropertyMatch = function (property, value, length) {
    if (value instanceof RegExp) {
        this.withPropertyPattern(property, value, length);
    }
    else {
        this.withPropertyEQ(property, value, length);
    }

    return (this);
}

exports.QueryJSON = QueryJSON;

util.inherits(Query, events.EventEmitter);

/**
 * This is a general class for EXPOSED query support.
 */
function Query(connGroup, mainTablePrefix, mainSuffix, mainKeyField) {
    events.EventEmitter.call(this);

    this.connGroup = connGroup;
    this.mainTablePrefix = mainTablePrefix;
    this.mainSuffix = mainSuffix;
    this.mainKeyField = mainKeyField;

    if (mainKeyField == null) {
        throw new RangeError("mainKeyField");
    }
}

exports.Query = Query;

var defaultQueryExprFactory = new QueryExprFactory();

exports.defaultQueryExprFactory = defaultQueryExprFactory;

util.inherits(JSONQuery, Query);

/**
 * This is a general class for EXPOSED query support that utilizes
 * standard JSON support.  These classes are overridden for the
 * the exposed query API extensions, not for the storage provider.
 */
function JSONQuery(connGroup, mainTablePrefix, mainSuffix,
        mainKeyField, jsonInfix) {
    Query.call(this, connGroup, mainTablePrefix, mainSuffix, mainKeyField);

    this.f = defaultQueryExprFactory;

    if (jsonInfix == null) {
        throw new RangeError("jsonInfix");
    }

    this.relayListeners = false; // optional, turned on by next.
    this.jsonInfix = jsonInfix;
    this.expr = this.f.true();
    this.fixedConn = null;
    this.fixedLocking = false;
}

JSONQuery.prototype.newQueryJSON = function() {
    return (this.connGroup.newQueryJSONProtected(this.mainTablePrefix,
        this.mainSuffix, this.mainKeyField, this.jsonInfix));
}

JSONQuery.prototype.buildQueryJSON = function () {
    if (this.queryJSON == null) {
        this.queryJSON = this.newQueryJSON();

        if (this.fixedConn != null) {
            this.queryJSON.withFixedConn(this.fixedConn, this.fixedLocking);
        }

        this.queryJSON.withQueryExpr(this.expr);
    }

    return (this.queryJSON);
}

/**
 * For when we want to provide a connection, rather than a conngroup,
 * if locking, this this will perform a query for update.
 */
JSONQuery.prototype.withFixedConn = function (conn, locking) {
    this.fixedConn = conn;
    this.fixedLocking = locking;

    return (this);
}

/**
 * This is supported by default for all JSONQuery extenders.  This
 * will match any valuePattern or value string in the named JSON field.
 * This will not match header record fields.
 */
JSONQuery.prototype.withFieldValue = function (fieldPattern, valuePattern) {
    var f = this.f;
    var selectors = [];

    if (fieldPattern instanceof Array) {
        fieldPattern.forEach(function (fieldName) {
                selectors.push(f.property(fieldName));
            });
    }
    else {
        selectors.push(f.property(fieldPattern));
    }

    var expr = f.false();

    selectors.forEach(function (selector) {
            if (valuePattern instanceof Array) {
                valuePattern.forEach(function (valueText) {
                        expr = f.or(expr, f.eq(selector, valueText));
                    });
            }
            else if (valuePattern instanceof RegExp) {
                expr = f.match(selector, valuePattern);
            }
            else if (valuePattern == null) {
                expr = f.exists(selector);
            }
            else {
                expr = f.eq(selector, valuePattern);
            }
        });

    this.withQueryExpr(expr);

    return (this);
}

/**
 * With a query expression, as generated by a QueryExprFactory.
 */
JSONQuery.prototype.withMongoExpr = function (expr) {
    this.withQueryExpr(this.f.fromMongo(expr));

    return (this);
}

/**
 * With a query expression, as generated by a QueryExprFactory.
 */
JSONQuery.prototype.withQueryExpr = function (expr) {
    var f = this.f;

    if (this.queryJSON != null) {
        throw new denum.StateError(
            "query has been started - can't add expressions");
    }

    this.expr = f.and(this.expr, expr);

    return (this);
}

/**
 * Set the batch size of the query - generally, don't use this.
 * The default batch sizes provided by the infrastructure should
 * be properly set for balanced individual and aggregate performance
 * by the underlying implementation.  Changing it can cause problems
 * for other users/services due to locking behaviour and data scale. 
 */
JSONQuery.prototype.withBatchSize = function (batchSize) {
    this.buildQueryJSON().withBatchSize(batchSize);

    return (this);
}

JSONQuery.prototype.withNoBatching = function () {
    this.buildQueryJSON().withBatchSize(0);

    return (this);
}

JSONQuery.prototype.stop = function () {
    this.buildQueryJSON().stop();
}

JSONQuery.prototype.next = function () {
    if (!this.relayListeners) {
        this.relayListeners = true;

        var self = this;

        /*
            Relay the lower level listeners into the
            the upper layer.
        */
        this.buildQueryJSON().
            on('error', function (error) {
                self.emit('error', error);
            }).
            on('result', function (result) {
                self.emit('result', result);
            }).
            on('end', function () {
                self.emit('end');
            });

        if (this.listeners('slow').length > 0) {
            this.queryJSON.on('slow', function (result) {
                    self.emit('slow', result);
                });
        }
    }

    this.buildQueryJSON().next();
}

JSONQuery.prototype.invoke = function (callback) {
    var self = this;

    if (callback === undefined) { // do not match null
        return (new Q.Promise(function (resolved, reject, notify) {
                var stop = false;

                self.invoke(function (error, result) {
                        if (stop) {
                            // don't send anything back
                        }
                        else if (error != null) {
                            reject(error);
                            stop = true; // stop
                        }
                        else if (result == null) {
                            resolved(null);
                            stop = true; // stop
                        }
                        else if (self.stopped) {
                            stop = true; // stop (should not really get here)
                        }
                        else {
                            notify(result);
                        }

                        return (stop);
                    });
            }));
    }

    if (callback == null) {
        throw new RangeError("callback cannot be null");
    }

    /*
        Note: 'this' is in the following handlers of course
        refers to this.queryJSON.
    */
    this.buildQueryJSON().on('result', function (result) {
            if (callback == null) {
                // ignore
            }
            else if (callback(null, result)) {
                this.stop();
            }
            else {
                this.next();
            }
        }).
        on('error', function (error) {
            if (callback == null) {
                // ignore
            }
            else {
                var ccallback = callback;

                callback = null; // clear the callback on error

                ccallback(error);
            }
        }).
        on('end', function () {
            if (callback == null) {
                // ignore
            }
            else {
                var ccallback = callback;

                callback = null; // clear the callback on end

                ccallback(null, null);
            }
        }).
        next();
}

/**
 * Get the first result, and ignore the rest.  Calls back as
 * callback(error, result).
 */
JSONQuery.prototype.invokeFirstResult = function (callback) {
    if (callback === undefined) { // do not match null
        var self = this;

        return (new Q.Promise(function (resolved, reject, notify) {
                var stop = false;

                self.invokeFirstResult(function (error, result) {
                        if (error != null) {
                            reject(error);
                        }
                        else {
                            resolved(result);
                        }
                    });
            }));
    }

    var result = null;
    var error = null; 

    /*
        Relay the lower level listeners into the
        the upper layer.
    */
    this.buildQueryJSON().
        on('error', function (anError) {
            if (callback != null) {
                callback(error, result);
            }
        }).
        on('result', function (aResult) {
            result = aResult;
            this.stop();
        }).
        on('end', function () {
            if (callback != null) {
                callback(error, result);
            }
        }).
        next();
}

/**
 * Get all of the results, and assume it is scalable.  Calls back as
 * callback(error, results), where results is an array.
 */
JSONQuery.prototype.invokeAllResults = function (callback) {
    if (callback === undefined) { // do not match null
        var self = this;

        return (new Q.Promise(function (resolved, reject, notify) {
                self.invokeAllResults(function (error, result) {
                        if (error != null) {
                            reject(error);
                        }
                        else {
                            resolved(results);
                        }
                    });
            }));
    }

    /*
        Relay the lower level listeners into the
        the upper layer.
    */
    var query = this.buildQueryJSON();
    var results = [];
    var error = null; 

    if (query instanceof CachedQueryEmitter) {
        if (!query.cachedQuery.cached) {
            query.stop(); // discard this query

            var self = this;

            query.cachedQuery.once('cached', function () {
                    self.invokeAllResults(callback);
                });

            return;
        }

        if (query.results == null) {
            query.buildScanResults();
        }

        var expr = query.expr;
        var index = 0;

        while (index < query.results.length) {
            var result = query.results[index++];

            if (expr.test(result)) {
                results.push(result);
            }
        }

        if (callback != null) {
            callback(null, results);
        }
    }
    else {
        query.on('error', function (anError) {
                if (callback != null) {
                    callback(error, result);
                }
            }).
            on('result', function (aResult) {
                results.push(aResult);
                this.next();
            }).
            on('end', function () {
                if (callback != null) {
                    callback(error, results);
                }
            }).
            next();
    }
}

/**
 * Get exactly one result, callback(error, result), where the
 * result is null if not matched, and an error is raised if there was
 * more than one.
 */
JSONQuery.prototype.invokeOneResult = function (callback) {
    if (callback === undefined) { // do not match null
        var self = this;

        return (new Q.Promise(function (resolved, reject, notify) {
                self.invokeAllResults(function (error, result) {
                        if (error != null) {
                            reject(error);
                        }
                        else {
                            resolved(results);
                        }
                    });
            }));
    }

    var query = this.buildQueryJSON();
    var result = null;
    var error = null; 

    if (query instanceof CachedQueryEmitter) {
        if (!query.cachedQuery.cached) {
            query.stop(); // discard this query

            var self = this;

            query.cachedQuery.once('cached', function () {
                    self.invokeAllResults(callback);
                });

            return;
        }

        if (query.results == null) {
            query.buildScanResults();
        }

        var expr = query.expr;
        var index = 0;

        while (index < query.results.length) {
            var aResult = query.results[index++];

            if (!expr.test(aResult)) {
                // ignore
            }
            else if (result == null) {
                result = aResult;
            }
            else {
                error = new Error("multiple results");
                break;
            }
        }

        if (callback != null) {
            callback(error, result);
        }
    }
    else {
        /*
            Relay the lower level listeners into the
            the upper layer.
        */
        query.
            on('error', function (anError) {
                if (callback != null) {
                    callback(error, result);
                }
            }).
            on('result', function (aResult) {
                if (result == null) {
                    result = aResult;
                    this.next();
                }
                else {
                    error = new Error("too many results: expected at most one");
                    this.stop();
                }
            }).
            on('end', function () {
                if (callback != null) {
                    callback(error, result);
                }
            }).
            next();
    }
}

exports.JSONQuery = JSONQuery;

function QueryExpr(factory) {
    if (!(factory instanceof QueryExprFactory)) {
        throw new RangeError("invalid factory: " + factory);
    }

    this.factory = factory;
}

/**
 * Return true if this expression is exactly equal to another
 * expression (not just equivalent semantically).  This does
 * not consider the value of the factory, but does consider
 * all other parameters and their sequence.
 */
QueryExpr.prototype.equals = function (expr) {
    throw new Error("implement " + this.constructor.name + ".equals()");
}

QueryExpr.prototype.applyAndArrays = function (fnName, leftArray, rightArray) {
    var length = leftArray.length;
    var result;

    if (length != rightArray.length) {
        result = false;
    }
    else {
        var index = 0;

        while ((index < length) &&
                leftArray[index][fnName](rightArray[index])) {
            index++;
        }

        result = (index == length);
    }

    return (result);
}

/**
 * Transform this expression as a depth first traversal
 * of all internal expressions, passed through fn.
 */
QueryExpr.prototype.transform = function (fn) {
    throw new Error("implement " + this.constructor.name + ".transform()");
}

/**
 * This is valid only for ConditionQueryExpr implementations.
 */
QueryExpr.prototype.test = function (value) {
    throw new Error("invalid " + this.constructor.name + ".test()");
}

/**
 * This is valid only for SelectQueryExpr implementations.
 */
QueryExpr.prototype.testApply = function (value, fn) {
    throw new Error("invalid " + this.constructor.name + ".testApply");
}


QueryExpr.prototype.toString = function () {
    throw new Error("implement " + this.constructor.name + ".toString()");
}

exports.QueryExpr = QueryExpr;

util.inherits(ValueQueryExpr, QueryExpr)

function ValueQueryExpr(factory) {
    QueryExpr.call(this, factory);
}

exports.ValueQueryExpr = ValueQueryExpr;

/**
 * A SelectQueryExpr is the base of all <selector> types,
 * it has one field, which should be set by upper level
 * constructors after initialization: tailProperty - this
 * should be the name of the final property being exactly
 * matched by the select, in the case where there is only
 * one and it is known.  It should be null otherwise.
 */
util.inherits(SelectQueryExpr, ValueQueryExpr)

function SelectQueryExpr(factory) {
    ValueQueryExpr.call(this, factory);
}

/**
 * If testApplyOver is called, it will use this function
 * to determine if the node matches the context.  In the case
 * of a property, name will be a string, otherwise null.
 * In the case of an array item, index will be cardinal, otherwise -1.
 * The value will always be whatever the value of the property or
 * array item is.  Most implementations will ignore the value.
 * The implementation should return either true or false.
 */
SelectQueryExpr.prototype.testMatch = function (name, index, value) {
    throw new Error("implement " + this.constructor.name + ".testMatch");
}

/**
 * Applies testMatch to the value's children until such a call returns true. 
 * If deep is true, this will implement recursively, otherwise it will
 * just perform a shallow check against the immediate children.
 * This is an internal function: testApplyOver should only be called
 * either from itself, or from the PathQueryExpr implementation.  In
 * all other cases, the correct method to call is testApply(), which
 * is automatically deep or shallow according to the implementation.
 */
SelectQueryExpr.prototype.testApplyOver = function (deep, value, fn) {
    var result = undefined;

    if (value instanceof Array) {
        for (var index = 0; index < value.length; index++) {
            if (this.testMatch(null, index, value[index])) {
                result = fn(value[index]);

                if (result !== undefined) {
                    break;
                }
            }

            if (deep) {
                result = this.testApplyOver(deep, value[index], fn);

                if (result !== undefined) {
                    break;
                }
            }
        }
    }
    else if (value instanceof Object) {
        for (var name in value) {
            if (this.testMatch(name, -1, value[name])) {
                result = fn(value[name]);

                if (result !== undefined) {
                    break;
                }
            }

            if (deep) {
                result = this.testApplyOver(deep, value[name], fn);

                if (result !== undefined) {
                    break;
                }
            }
        }
    }

    return (result);
}

/**
 * Apply the fn to each result from the select over the value,
 * until some fn returns non-undefined.  Return whatever that
 * value is, otherwise return undefined.  When a selector appears
 * in a conditional, it is always this function that is called,
 * however, when a selector appears as part of a path, 
 * testApplyOver is called.
 */
SelectQueryExpr.prototype.testApply = function (value, fn) {
    throw new Error("implement " + this.constructor.name + ".testApply");
}

exports.SelectQueryExpr = SelectQueryExpr;

util.inherits(RecordQueryExpr, SelectQueryExpr)

function RecordQueryExpr(factory, field) {
    SelectQueryExpr.call(this, factory);

    this.field = field;
    this.root = null;
    this.record = this;
    this.tailProperty = field;
}

RecordQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof RecordQueryExpr) && (this.field == expr.field));
}

RecordQueryExpr.prototype.transform = function (fn) {
    return (fn(new RecordQueryExpr(this.factory, this.field)));
}

RecordQueryExpr.prototype.testApply = function (value, fn) {
    if (value instanceof Array) {
        return (undefined); // shortcut arrays
    }

    if (value instanceof Object) { // ensure objects only
        if (this.field in value) {
            return (fn(value[this.field]));
        }
    }

    return (undefined);
}

RecordQueryExpr.prototype.toString = function () {
    return ("@@" + this.field);
}

exports.RecordQueryExpr = RecordQueryExpr;

/**
 * Paths are selectors, but they are not segments: this is intentional,
 * a path is a flat list of segments, it should not
 * contain other paths.
 */
util.inherits(PathQueryExpr, SelectQueryExpr)

function PathQueryExpr(factory, segments) {
    SelectQueryExpr.call(this, factory);

    this.segments = segments; // factory-generated array, always OK to use 

    // these should be checked though to catch likely errors
    segments.forEach(function (segment) {
            if (segment == null) {
                throw new RangeError("null"); 
            }

            if (segment.constructor == null) {
                throw new RangeError("not a segment: " + segment);
            }

            if (!(segment instanceof SegmentQueryExpr)) {
                throw new RangeError("not a segment: " + segment +
                    " is a " + segment.constructor.name);
            }
        });

    if (this.segments.length > 0) {
        this.root = this.segments[0].root;
        this.record = this.segments[0].record;
        this.tailProperty = this.segments[this.segments.length - 1].
            tailProperty;
    }
    else {
        this.root = null;
        this.record = null;
        this.tailProperty = null;
    }
}

PathQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof PathQueryExpr) &&
        this.applyAndArrays("equals", this.segments, expr.segments));
}

PathQueryExpr.prototype.transform = function (fn) {
    var segments = [];
    var f = this.factory;

    this.segments.forEach(function (segment) {
            segments.push(f.import(segment));
        });

    var expr;

    if (segments.length == 1) {
        expr = segments[0];
    }
    else {
        expr = fn(new PathQueryExpr(this.factory, segments));
    }

    return (expr);
}

/**
 * Builds a chain of functions, so that functions do not need
 * be created multiple times during invocation.
 * @todo performance of this could be improved with per
 * application re-use.
 */
PathQueryExpr.prototype.createApplyFn = function (i, fn) {
   var result;

   if (i < 0) {
        result = fn;
   }
   else {
        var segment = this.segments[i];

        if (i == 0) {
            result = this.createApplyFn(i - 1, function (value) {
                    if (TRACE) {
                        TRACE("PathQueryExpr.segment", i, "value", value);
                    }

                    return (segment.testApply(value, fn));
                });
        }
        else {
            result = this.createApplyFn(i - 1, function (value) {
                    if (TRACE) {
                        TRACE("PathQueryExpr.segment", i, "value", value);
                    }

                    // if this throws, it means an invalid segment 
                    // (probably a path in a path, which is not good
                    return (segment.testApplyOver(false, value, fn));
                });
        }
   }

   return (result);
}

PathQueryExpr.prototype.testApplyOver = function (deep, value, fn) {
    throw new denum.StateError("invalid call");
}

PathQueryExpr.prototype.testApply = function (value, fn) {
    return (this.createApplyFn(this.segments.length - 1, fn)(value));
}

PathQueryExpr.prototype.toString = function () {
    var result = "";
    var sep = "";

    this.segments.forEach(function (item) {
            result += sep + item.toString();
            sep = ".";
        });

    return (result);
}

exports.PathQueryExpr = PathQueryExpr;

util.inherits(SegmentQueryExpr, SelectQueryExpr)

function SegmentQueryExpr(factory) {
    SelectQueryExpr.call(this, factory);
}

exports.SegmentQueryExpr = SegmentQueryExpr;

util.inherits(PropertyQueryExpr, SegmentQueryExpr)

function PropertyQueryExpr(factory, name) {
    SegmentQueryExpr.call(this, factory);

    if (name instanceof RegExp) {
        this.name = null;
        this.pattern = name;
    }
    else {
        this.name = name;
        this.pattern = null;
    }

    this.root = null;
    this.record = null;
    this.tailProperty = this.name; // can be null - don't use pattern
}

PropertyQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof PropertyQueryExpr) &&
        (this.name == expr.name));
}

PropertyQueryExpr.prototype.transform = function (fn) {
    return (fn(this));
}

PropertyQueryExpr.prototype.testMatch = function (name, index, value) {
    return ((name == null) ? false :
        ((this.name != null) ? (this.name == name) :
        ((this.pattern != null) ? this.pattern.test(name) :
        true)));
}

PropertyQueryExpr.prototype.testApply = function (value, fn) {
    return (this.testApplyOver(true, value, fn));
}

PropertyQueryExpr.prototype.toString = function () {
    return ((this.name != null) ? "'" + this.name + "'" :
        ((this.pattern != null) ? "" + pattern :
        "*"));
}

exports.PropertyQueryExpr = PropertyQueryExpr;

util.inherits(IndexQueryExpr, SegmentQueryExpr)

function IndexQueryExpr(factory, number) {
    SegmentQueryExpr.call(this, factory);

    this.number = number;
    this.root = null;
    this.record = null;
    this.tailProperty = null;
}

IndexQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof IndexQueryExpr) &&
        (this.number == expr.number));
}

IndexQueryExpr.prototype.transform = function (fn) {
    return (fn(new IndexQueryExpr(this.factory, this.number)));
}

IndexQueryExpr.prototype.testMatch = function (name, index, value) {
    var result;

    if (index < 0) {
        result = false;
    }
    else if (this.number === null) {
        result = true;
    }
    else if (this.number === index) {
        result = true;
    }
    else {
        result = false;
    }

    return (result);
}

IndexQueryExpr.prototype.testApply = function (value, fn) {
    return (this.testApplyOver(true, value, fn));
}

IndexQueryExpr.prototype.toString = function () {
    return (this.number === null ? "#" : "" + this.number);
}

exports.IndexQueryExpr = IndexQueryExpr;

util.inherits(RootQueryExpr, SegmentQueryExpr)

function RootQueryExpr(factory) {
    SegmentQueryExpr.call(this, factory);

    this.root = this;
    this.record = null;
    this.tailProperty = null;
}

RootQueryExpr.prototype.equals = function (expr) {
    return (expr instanceof RootQueryExpr);
}

RootQueryExpr.prototype.transform = function (fn) {
    return (fn(new RootQueryExpr(this.factory)));
}

/**
 * For the root expression, we just apply the function to the value,
 * and we never look at whether it is deep or shallow.
 */
RootQueryExpr.prototype.testApplyOver = function (deep, value, fn) {
    return (fn(value));
}

/**
 * Just shortcut the testApplyOver decision making here, since
 * we know what we're going to do.
 */
RootQueryExpr.prototype.testApply = function (value, fn) {
    return (fn(value));
}

RootQueryExpr.prototype.toString = function () {
    return ("@");
}

exports.RootQueryExpr = RootQueryExpr;

/**
 * Note: this isn't really implemented yet because
 * there is no real performant solution for MySQL.
 * We could implement it by just treating the
 * prefix as an exists(selector) and ANDING it
 * with the lower selector pattern, then handling
 * the rest in post-processing.  Something to consider.
 */
util.inherits(DescendQueryExpr, SegmentQueryExpr)

function DescendQueryExpr(factory) {
    SegmentQueryExpr.call(this, factory);

    this.root = null;
    this.record = null;
    this.tailProperty = null;
}

DescendQueryExpr.prototype.equals = function (expr) {
    return (expr instanceof DescendQueryExpr);
}

DescendQueryExpr.prototype.transform = function (fn) {
    return (fn(new DescendQueryExpr(this.factory)));
}

/**
 * Descend matches everything all the time.
 */
DescendQueryExpr.prototype.testMatch = function (name, index, value) {
    return (true);
}

/**
 * Descend overrides the deep parameter so that it always applies.
 */
DescendQueryExpr.prototype.testApplyOver = function (deep, value, fn) {
    return (SegmentQueryExpr.prototype.testApplyOver.call(this,
        true, value, fn));
}

DescendQueryExpr.prototype.testApply = function (value, fn) {
    // always apply deep
    return (SegmentQueryExpr.prototype.testApplyOver.call(this,
        true, value, fn));
}

DescendQueryExpr.prototype.toString = function () {
    return ("**");
}

exports.DescendQueryExpr = DescendQueryExpr;

util.inherits(ConditionQueryExpr, QueryExpr)

function ConditionQueryExpr(factory) {
    QueryExpr.call(this, factory);
}

/**
 * Should return true if value passes the test of this
 * expression.  If selectors are involved and no record
 * to apply the condition to is found, then the test
 * should return undefined, rather than false.  This is
 * used in negation to identify whether a comparison
 * failed or no matching record was found.
 */
ConditionQueryExpr.prototype.test = function (value) {
    throw new Error("implement " + this.constructor.name + ".test()");
}

exports.ConditionQueryExpr = ConditionQueryExpr;

util.inherits(ExistsQueryExpr, ConditionQueryExpr)

function ExistsQueryExpr(factory, selector) {
    ConditionQueryExpr.call(this, factory);

    this.selector = selector;
}

ExistsQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof ExistsQueryExpr) &&
        this.selector.equals(expr.selector));
}

ExistsQueryExpr.prototype.transform = function (fn) {
    return (fn(new ExistsQueryExpr(this.factory,
        this.selector.transform(fn))));
}

ExistsQueryExpr.prototype.test = function (value) {
    return (this.selector.testApply(value, function () {
            return (true); // return true for any result
        }) === true);
}

ExistsQueryExpr.prototype.toString = function () {
    return ("exists(" + this.selector + ")");
}

exports.ExistsQueryExpr = ExistsQueryExpr;

util.inherits(TypeQueryExpr, ConditionQueryExpr)

function TypeQueryExpr(factory, selector, type) {
    ConditionQueryExpr.call(this, factory);

    this.selector = selector;
    this.type = type;
}

TypeQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof TypeQueryExpr) &&
        this.selector.equals(expr.selector));
}

TypeQueryExpr.prototype.transform = function (fn) {
    return (fn(new TypeQueryExpr(this.factory,
        this.selector.transform(fn), this.type)));
}

TypeQueryExpr.prototype.test = function (value) {
    var self = this;

    return (this.selector.testApply(value, function (result) {
            var type = self.type;

            if (type === djson.TYPE.UNDEFINED) {
                if (result === undefined) {
                    result = true;
                }
                else {
                    result = undefined;
                }
            }
            else if (type === djson.TYPE.NULL) {
                if (result === null) {
                    result = true;
                }
                else {
                    result = undefined;
                }
            }
            else {
                throw new denum.UnsupportedError("type=" + self.type);
            }

            return (result);
        }) === true);
}

TypeQueryExpr.prototype.toString = function () {
    return ("type(" + this.selector + ", " + this.type + ")");
}

exports.TypeQueryExpr = TypeQueryExpr;

util.inherits(TrueQueryExpr, ConditionQueryExpr)

function TrueQueryExpr(factory) {
    ConditionQueryExpr.call(this, factory);
}

TrueQueryExpr.prototype.equals = function (expr) {
    return (expr instanceof TrueQueryExpr);
}

TrueQueryExpr.prototype.test = function () {
    return (true);
}

TrueQueryExpr.prototype.transform = function (fn) {
    return (fn(new TrueQueryExpr(this.factory)));
}

TrueQueryExpr.prototype.toString = function () {
    return ("true");
}

exports.TrueQueryExpr = TrueQueryExpr;

util.inherits(FalseQueryExpr, ConditionQueryExpr)

function FalseQueryExpr(factory) {
    ConditionQueryExpr.call(this, factory);
}

FalseQueryExpr.prototype.equals = function (expr) {
    return (expr instanceof FalseQueryExpr);
}

FalseQueryExpr.prototype.test = function () {
    return (false);
}

FalseQueryExpr.prototype.transform = function (fn) {
    return (fn(new FalseQueryExpr(this.factory)));
}

FalseQueryExpr.prototype.toString = function () {
    return ("false");
}

exports.FalseQueryExpr = FalseQueryExpr;

util.inherits(AndQueryExpr, ConditionQueryExpr)

function AndQueryExpr(factory, conditions) {
    ConditionQueryExpr.call(this, factory);

    this.conditions = conditions;
}

AndQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof AndQueryExpr) &&
        this.applyAndArrays("equals", this.conditions, expr.conditions));
}

AndQueryExpr.prototype.transform = function (fn) {
    var conditions = [];

    this.conditions.forEach(function (condition) {
            conditions.push(condition.transform(fn));
        });

    return (fn(new AndQueryExpr(this.factory, conditions)));
}

AndQueryExpr.prototype.test = function (value) {
    var result = true;
    var index = 0;

    while (result && (index < this.conditions.length)) {
        if (this.conditions[index++].test(value) !== true) {
            result = false;
        }
    }

    return (result);
}

AndQueryExpr.prototype.toString = function () {
    var result = "(";
    var sep = "";

    this.conditions.forEach(function (condition) {
            result += sep + condition.toString();
            sep = " && ";
        });

    result += ")";

    return (result);
}

exports.AndQueryExpr = AndQueryExpr;

util.inherits(OrQueryExpr, ConditionQueryExpr)

function OrQueryExpr(factory, conditions) {
    ConditionQueryExpr.call(this, factory);

    this.conditions = conditions;
}

OrQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof OrQueryExpr) &&
        this.applyAndArrays("equals", this.conditions, expr.conditions));
}

OrQueryExpr.prototype.transform = function (fn) {
    var conditions = [];

    this.conditions.forEach(function (condition) {
            conditions.push(condition.transform(fn));
        });

    return (fn(new OrQueryExpr(this.factory, conditions)));
}

OrQueryExpr.prototype.test = function (value) {
    var result = false;
    var index = 0;

    while (!result && (index < this.conditions.length)) {
        if (this.conditions[index++].test(value) === true) {
            result = true;
        }
    }

    return (result);
}

OrQueryExpr.prototype.toString = function () {
    var result = "(";
    var sep = "";

    this.conditions.forEach(function (condition) {
            result += sep + condition.toString();
            sep = " || ";
        });

    result += ")";

    return (result);
}

exports.OrQueryExpr = OrQueryExpr;

util.inherits(InQueryExpr, ConditionQueryExpr)

function InQueryExpr(factory, selector, choices) {
    ConditionQueryExpr.call(this, factory);

    this.selector = selector;
    this.choices = choices;
}

InQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof InQueryExpr) &&
        this.selector.equals(expr.selector) &&
        this.applyAndArrays("equals", this.choices, expr.choices));
}

InQueryExpr.prototype.transform = function (fn) {
    var choices = [];

    this.choices.forEach(function (choice) {
            choices.push(choice.transform(fn));
        });

    return (fn(new InQueryExpr(this.factory, this.selector.transform(fn),
        choices)));
}

InQueryExpr.prototype.test = function (value) {
    var self = this;

    return (this.selector.testApply(value, function (result) {
            if (result instanceof Array) {
                return (undefined);
            }

            if (result instanceof Object) {
                return (undefined);
            }

            var index = 0;

            while (index < self.choices.length) {
                var choice = self.choices[index++];

                if (choice.value == result) {
                    return (true);
                }
            }

            return (undefined);
        }) === true);
}

InQueryExpr.prototype.toString = function () {
    var s = "";
    var sep = "";

    this.choices.forEach(function (choice) {
            s += sep + choice.toString();
            sep = ", ";
        });

    return ("in(" + this.selector + ", [" + s + "])");
}

exports.InQueryExpr = InQueryExpr;

util.inherits(NotQueryExpr, ConditionQueryExpr)

function NotQueryExpr(factory, condition) {
    ConditionQueryExpr.call(this, factory);

    this.condition = condition;
}

NotQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof NotQueryExpr) &&
        this.condition.equals(expr.condition));
}

NotQueryExpr.prototype.transform = function (fn) {
    return (fn(new NotQueryExpr(this.factory, this.condition.transform(fn))));
}

NotQueryExpr.prototype.test = function (value) {
    var result = this.condition.test(value);

    if (result === true) {
        result = false;
    }
    else if (result === false) {
        result = true;
    }
    else {
        result = null;
    }

    return (result);
}

NotQueryExpr.prototype.toString = function () {
    return ("not(" + this.condition.toString() + ")");
}

exports.NotQueryExpr = NotQueryExpr;

util.inherits(PrefixQueryExpr, ConditionQueryExpr)

function PrefixQueryExpr(factory, selector, prefix) {
    ConditionQueryExpr.call(this, factory);

    this.selector = selector;
    this.prefix = prefix;
}

PrefixQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof PrefixQueryExpr) &&
        (this.prefix == expr.prefix));
}

PrefixQueryExpr.prototype.transform = function (fn) {
    return (fn(new PrefixQueryExpr(this.factory, this.selector.transform(fn),
        this.prefix)));
}

PrefixQueryExpr.prototype.test = function (value) {
    var self = this;

    return (this.selector.testApply(value, function (result) {
            if (result.indexOf(self.prefix) == 0) {
                return (true);
            }

            return (undefined);
        }) === true);
}

PrefixQueryExpr.prototype.toString = function () {
    return ("" + this.selector.toString() +
        " starts-with " + this.prefix);
}

exports.PrefixQueryExpr = PrefixQueryExpr;

util.inherits(MatchQueryExpr, ConditionQueryExpr)

function MatchQueryExpr(factory, selector, pattern) {
    ConditionQueryExpr.call(this, factory);

    this.selector = selector;
    this.pattern = pattern;
}

MatchQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof MatchQueryExpr) &&
        (this.pattern.pattern == expr.pattern.pattern));
}

MatchQueryExpr.prototype.transform = function (fn) {
    return (fn(new MatchQueryExpr(this.factory, this.selector.transform(fn),
        this.pattern)));
}

MatchQueryExpr.prototype.test = function (value) {
    var self = this;

    return (this.selector.testApply(value, function (result) {
            if (self.pattern.test(result)) {
                return (true);
            }

            return (undefined);
        }) === true);
}

MatchQueryExpr.prototype.toString = function () {
    return ("" + this.selector.toString() +
        " matches " + this.pattern);
}

exports.MatchQueryExpr = MatchQueryExpr;

util.inherits(CompareQueryExpr, ConditionQueryExpr)

function CompareQueryExpr(factory, op, left, right) {
    ConditionQueryExpr.call(this, factory);

    this.op = op;
    this.left = left;
    this.right = right;
}

CompareQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof CompareQueryExpr) &&
        (this.op == expr.op) &&
        this.left.equals(expr.left) &&
        this.right.equals(expr.right));
}

CompareQueryExpr.prototype.transform = function (fn) {
    return (fn(new CompareQueryExpr(this.factory, this.op,
        this.left.transform(fn),
        this.right.transform(fn))));
}

/**
 * This is just a simple way of mapping operators to valid results.
 * Its invariant.
 */
CompareQueryExpr.prototype.opMap = {
        "<": { lt: true },
        "<=": { lt: true, eq: true },
        "=": { eq: true },
        "!=": { invalid: true, lt: true, gt: true },
        ">=": { gt: true, eq: true },
        ">": { gt: true },
    };

CompareQueryExpr.prototype.compare = function (left, right) {
    var result = true; // comparable
    var ltype = typeof(left);
    var rtype = typeof(right);

    /*
        Coerce to either both strings or both numbers.
    */
    if (ltype === "string") {
        if (rtype === "string") {
            // no coercion
        }
        else if (rtype === "number") {
            right = "" + right;
        }
        else if (rtype === "boolean") {
            right = "" + right;
        }
        else if (right instanceof Date) {
            right = right.toISOString();
        }
        else {
            result = false;
        }
    }
    else if (ltype === "number") {
        if (rtype === "string") {
            left = "" + left;
        }
        else if (rtype === "number") {
            // no coercion
        }
        else if (rtype === "boolean") {
            right = right ? 1 : 0;
        }
        else if (right instanceof Date) {
            right = right.getTime();
        }
        else {
            result = false;
        }
    }
    else if (ltype === "boolean") {
        if (rtype === "string") {
            left = "" + left;
        }
        else if (rtype === "number") {
            left = left ? 1 : 0;
        }
        else if (rtype === "boolean") {
            left = left ? 1 : 0;
            right = right ? 1 : 0;
        }
        else if (right instanceof Date) {
            right = right.getTime();
        }
        else {
            result = false;
        }
    }
    else if (left instanceof Date) {
        if (rtype === "string") {
            left = left.toISOString();
        }
        else if (rtype === "number") {
            left = left.getTime();
        }
        else if (rtype === "boolean") {
            left = left.getTime();
            right = right ? 1 : 0;
        }
        else if (right instanceof Date) {
            left = left.getTime();
            right = right.getTime();
        }
        else {
            result = false;
        }
    }
    else if (left instanceof Buffer) {
        if (right instanceof Buffer) {
            var length = Math.min(left.length, right.length);
            var index = 0;

            while ((index < length) &&
                    ((result = (left[index] - right[index])) === 0)) {
                index++;
            }

            if (index !== length) {
                // result is valid
            }
            else if (right.length > left.length) {
                result = -1;
            }
            else {
                result = 1;
            }
        }
        else {
            result = false;
        }
    }
    else {
        result = false; // incomparable
    }

    if (result === false) { // incomparable
        // note implications for total order
    }
    else if (result !== true) { // precomputed, don't check
        // have valid result
    }
    else {
        if (left === right) {
            result = "eq";
        }
        else if (left < right) {
            result = "lt";
        }
        else if (left > right) {
            result = "gt";
        }
        else {
            result = "invalid";
        }

        result = result in this.opMap[this.op]; // get result from map
    }

    if (TRACE) {
        TRACE("CompareQueryExpr.compare",
            left, this.op, right, "yields", result);
    }

    return (result);
}

CompareQueryExpr.prototype.test = function (value) {
    var self = this;
    var result = undefined;
    var found = false;

    if ((this.left instanceof SelectQueryExpr) && 
            (this.right instanceof SelectQueryExpr)) {
        // GACK! Cartesian product.
        result = this.left.testApply(value, function (result) {
                if (result instanceof Array) {
                    return (undefined);
                }

                if ((result instanceof Object) &&
                        !(result instanceof Buffer) &&
                        !(result instanceof Date)) {
                    return (undefined);
                }

                return (self.right.testApply(value, function (result2) {
                        if (result2 instanceof Array) {
                            return (undefined);
                        }

                        if ((result2 instanceof Object) &&
                                !(result2 instanceof Buffer) &&
                                !(result2 instanceof Date)) {
                            return (undefined);
                        }

                        found = true;

                        if (self.compare(result, result2)) {
                            return (true);
                        }

                        return (undefined);
                    }));
            });
    }
    else if (this.left instanceof SelectQueryExpr) {
        result = this.left.testApply(value, function (result) {
                if (result instanceof Array) {
                    return (undefined);
                }

                if ((result instanceof Object) &&
                        !(result instanceof Buffer) &&
                        !(result instanceof Date)) {
                    return (undefined);
                }

                found = true;

                if (self.compare(result, self.right.value)) {
                    return (true);
                }

                return (undefined);
            });
    }
    else if (this.right instanceof SelectQueryExpr) {
        result = this.right.testApply(value, function (result) {
                if (result instanceof Array) {
                    return (undefined);
                }

                if ((result instanceof Object) &&
                        !(result instanceof Buffer) &&
                        !(result instanceof Date)) {
                    return (undefined);
                }

                found = true;

                if (self.compare(result, self.left.value)) {
                    return (true);
                }

                return (undefined);
            });
    }
    else {
        result = this.compare(this.left.value, this.right.value);
    }

    if (result === undefined) {
        if (found) {
            result = false;
        }
    }

    return (result);
}

CompareQueryExpr.prototype.toString = function () {
    return ("" + this.left.toString() +
        " " + this.op +
        " " + this.right.toString());
}

exports.CompareQueryExpr = CompareQueryExpr;

util.inherits(LiteralQueryExpr, ValueQueryExpr);

function LiteralQueryExpr(factory, type, value) {
    ValueQueryExpr.call(this, factory);

    this.type = type;
    this.value = value;
}

LiteralQueryExpr.prototype.transform = function (fn) {
    return (fn(new this.constructor(this.factory, this.value)));
}

LiteralQueryExpr.prototype.equals = function (expr) {
    return ((expr instanceof LiteralQueryExpr) &&
        (this.type == expr.type) &&
        (this.value == expr.value));
}

exports.LiteralQueryExpr = LiteralQueryExpr;

util.inherits(StringQueryExpr, LiteralQueryExpr);

function StringQueryExpr(factory, value) {
    LiteralQueryExpr.call(this, factory, "string", value);
}

StringQueryExpr.prototype.toString = function () {
    return ("\"" + this.value + "\"");
}

exports.StringQueryExpr = StringQueryExpr;

util.inherits(NumberQueryExpr, LiteralQueryExpr);

function NumberQueryExpr(factory, value) {
    LiteralQueryExpr.call(this, factory, "number", value);
}

NumberQueryExpr.prototype.toString = function () {
    return ("" + this.value);
}

exports.NumberQueryExpr = NumberQueryExpr;

util.inherits(BufferQueryExpr, LiteralQueryExpr);

function BufferQueryExpr(factory, value) {
    LiteralQueryExpr.call(this, factory, "buffer", value);
}

BufferQueryExpr.prototype.toString = function () {
    return ("binary(" + this.value.toString("hex") + ")");
}

exports.BufferQueryExpr = BufferQueryExpr;

util.inherits(BooleanQueryExpr, LiteralQueryExpr);

function BooleanQueryExpr(factory, value) {
    LiteralQueryExpr.call(this, factory, "boolean", value);
}

BooleanQueryExpr.prototype.toString = function () {
    return ("" + this.value);
}

exports.BooleanQueryExpr = BooleanQueryExpr;

util.inherits(DateQueryExpr, LiteralQueryExpr);

function DateQueryExpr(factory, value) {
    LiteralQueryExpr.call(this, factory, "date", value);
}

DateQueryExpr.prototype.toString = function () {
    return (this.value);
}

exports.DateQueryExpr = DateQueryExpr;

function QueryExprFactory() {
    this.defaultAnalyzer = dsearch.LATIN1_ANALYZER;
}

QueryExprFactory.prototype.UNDEFINED = djson.TYPE.UNDEFINED;
QueryExprFactory.prototype.NULL = djson.TYPE.NULL;

QueryExprFactory.prototype.and = function (args) {
    var never = false;
    var conditions = [];

    if (arguments.length < 2) {
        throw new RangeError("need at least two arguments");
    }

    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        var type = typeof(arg);

        if (type == "boolean") {
            if (never) {
                // already never
            }
            else if (!arg) {
                never = true;
                conditions = [new FalseQueryExpr(this)];
            }
            else {
                // continue, but don't add to result
            }
        }
        else if (arg instanceof ConditionQueryExpr) {
            if (never) {
                // already never
            }
            else if (arg instanceof FalseQueryExpr) {
                never = true;
                conditions = [arg];
            }
            else if (arg instanceof TrueQueryExpr) {
                // continue, but don't add to result
            }
            else if (arg instanceof AndQueryExpr) {
                conditions.push.apply(conditions, arg.conditions);
            }
            else {
                conditions.push(arg);
            }
        }
        else {
            if ((type == "object") && arg && arg.constructor) {
                type = arg.constructor.name;
            }

            throw new RangeError("argument " + i +
                " must be a dschema query condition, string or number," +
                " not " + type + ": " + arg);
        }
    }

    var result;

    if (conditions.length == 0) {
        result = new TrueQueryExpr(this);
    }
    else if (conditions.length == 1) { // also selects never
        result = conditions[0];
    }
    else {
        result = new AndQueryExpr(this, conditions);
    }

    return (result);
}

QueryExprFactory.prototype.or = function (args) {
    var always = false;
    var conditions = [];

    if (arguments.length < 2) {
        throw new RangeError("need at least two arguments");
    }

    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        var type = typeof(arg);

        if (type == "boolean") {
            if (always) {
                // already always
            }
            else if (arg) {
                always = true;
                conditions = [new TrueQueryExpr(this)];
            }
            else {
                // continue, but don't add to result
            }
        }
        else if (arg instanceof ConditionQueryExpr) {
            if (always) {
                // already always
            }
            else if (arg instanceof TrueQueryExpr) {
                always = true;
                conditions = [arg];
            }
            else if (arg instanceof FalseQueryExpr) {
                // continue, but don't add to result
            }
            else if (arg instanceof OrQueryExpr) {
                conditions.push.apply(conditions, arg.conditions);
            }
            else {
                conditions.push(arg);
            }
        }
        else {
            if ((type == "object") && arg && arg.constructor) {
                type = arg.constructor.name;
            }

            throw new RangeError("argument " + i +
                " must be a dschema query expression, string or number, " +
                "not " + type + ": " + arg);
        }
    }

    var result;

    if (conditions.length == 0) {
        result = new TrueQueryExpr(this);
    }
    else if (conditions.length == 1) { // also selects never
        result = conditions[0];
    }
    else {
        result = new OrQueryExpr(this, conditions);
    }

    return (result);
}

/**
 * Coerce the argument into some sort of value.
 */
QueryExprFactory.prototype.value = function (arg) {
    if (arguments.length != 1) {
        throw new RangeError("expects exactly one argument");
    }

    var type = typeof(arg);

    if (type == "string") {
        arg = new StringQueryExpr(this, arg);
    }
    else if (type == "number") {
        arg = new NumberQueryExpr(this, arg);
    }
    else if (type == "boolean") {
        arg = new BooleanQueryExpr(this, arg);
    }
    else if (arg instanceof Buffer) {
        arg = new BufferQueryExpr(this, arg);
    }
    else if (arg instanceof Date) {
        arg = new DateQueryExpr(this, arg);
    }
    else if (arg instanceof ValueQueryExpr) {
        // stays as is
    }
    else {
        throw new RangeError("argument must be a dschema query value: " +
            arg + " typeof=" + type +
            " " + (arg != null ? arg.constructor.name : ""));
    }

    return (arg);
}

QueryExprFactory.prototype.compare = function (op, left, right) {
    var result;

    if (arguments.length != 3) {
        throw new RangeError("expects exactly three arguments");
    }

    if (op == "=") {
    }
    else if (op == ">=") {
    }
    else if (op == "<=") {
    }
    else if (op == "<") {
    }
    else if (op == ">") {
    }
    else if (op == "!=") {
    }
    else {
        throw new RangeError("argument " + "op" +
            " must be a comparison operator");
    }

    for (var i = 1; i < arguments.length; i++) {
        var arg = this.value(arguments[i]);

        if (i == 1) {
            left = arg;
        }
        else {
            right = arg;
        }
    }

    return (new CompareQueryExpr(this, op, left, right));
}

QueryExprFactory.prototype.lt = function (left, right) {
    if (arguments.length != 2) {
        throw new RangeError("expects exactly two arguments");
    }

    return (this.compare("<", left, right));
}

QueryExprFactory.prototype.lte = function (left, right) {
    if (arguments.length != 2) {
        throw new RangeError("expects exactly two arguments");
    }

    return (this.compare("<=", left, right));
}

QueryExprFactory.prototype.gt = function (left, right) {
    if (arguments.length != 2) {
        throw new RangeError("expects exactly two arguments");
    }

    return (this.compare(">", left, right));
}

QueryExprFactory.prototype.gte = function (left, right) {
    if (arguments.length != 2) {
        throw new RangeError("expects exactly two arguments");
    }

    return (this.compare(">=", left, right));
}

QueryExprFactory.prototype.eq = function (left, right) {
    if (arguments.length != 2) {
        throw new RangeError("expects exactly two arguments");
    }

    return (this.compare("=", left, right));
}

QueryExprFactory.prototype.ne = function (left, right) {
    if (arguments.length != 2) {
        throw new RangeError("expects exactly two arguments");
    }

    return (this.compare("!=", left, right));
}

QueryExprFactory.prototype.record = function (key) {
    var result;

    if (arguments.length != 1) {
        throw new RangeError("expects exactly one argument");
    }

    if (typeof(key) != "string") {
        throw new RangeError("expects a simple string argument");
    }

    result = new RecordQueryExpr(this, key);

    return (result);
}

QueryExprFactory.prototype.root = function (arg) {
    var result;

    if (arguments.length != 0) {
        var args = [new RootQueryExpr(this)];

        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        result = this.path.apply(this, args);
    }
    else {
        result = new RootQueryExpr(this);
    }

    return (result);
}

QueryExprFactory.prototype.false = function () {
    if (arguments.length != 0) {
        throw new RangeError("expects no arguments");
    }

    return (new FalseQueryExpr(this));
}

QueryExprFactory.prototype.true = function () {
    if (arguments.length != 0) {
        throw new RangeError("expects no arguments");
    }

    return (new TrueQueryExpr(this));
}

QueryExprFactory.prototype.not = function (expr) {
    var result;

    if (arguments.length != 1) {
        throw new RangeError("expects exactly one argument");
    }

    if (expr instanceof NotQueryExpr) {
        result = expr.condition;
    }
    else if (expr instanceof FalseQueryExpr) {
        result = new TrueQueryExpr(this);
    }
    else if (expr instanceof TrueQueryExpr) {
        result = new FalseQueryExpr(this);
    }
    else if (expr instanceof ConditionQueryExpr) {
        result = new NotQueryExpr(this, expr);
    }
    else {
        throw new RangeError("argument" +
            " must be a dschema query condition");
    }

    return (result);
}

QueryExprFactory.prototype.prefix = function (expr, prefix) {
    if (arguments.length != 2) {
        throw new RangeError("needs exactly two arguments");
    }

    if (!(expr instanceof SelectQueryExpr)) {
        throw new RangeError("first must be a query select expression");
    }

    if (typeof(prefix) != "string") {
        throw new RangeError("second argument must be a string");
    }

    return (new PrefixQueryExpr(this, expr, prefix));
}

QueryExprFactory.prototype.match = function (expr, pattern) {
    if (arguments.length != 2) {
        throw new RangeError("needs exactly two arguments");
    }

    if (!(expr instanceof SelectQueryExpr)) {
        throw new RangeError("first must be a query select expression");
    }

    if (!(pattern instanceof RegExp)) {
        throw new RangeError("second must be a regular expression");
    }

    return (new MatchQueryExpr(this, expr, pattern));
}

QueryExprFactory.prototype.property = function (name) {
    if (arguments.length == 0) {
        name = null;
    }
    else if (arguments.length != 1) {
        throw new RangeError("too many arguments");
    }
    else if (typeof(name) == "string") {
        // OK
    }
    else if (name == null) {
        // OK - wildcard
    }
    else if (name instanceof RegExp) {
        // OK - pattern
    }
    else {
        throw new RangeError("argument must be a string or regular expr: " +
            " name=" + name +
            " typeof(name)=" + typeof(name));
    }

    return (new PropertyQueryExpr(this, name));
}

QueryExprFactory.prototype.index = function (number) {
    if (arguments.length == 0) {
        number = null;
    }
    else if (arguments.length != 1) {
        throw new RangeError("too many arguments");
    }
    else if ((typeof(number) == "number") &&
            (Math.floor(number) == number) &&
            (number >= 0)) {
        // OK
    }
    else {
        throw new RangeError("argument must be a cardinal number");
    }

    return (new IndexQueryExpr(this, number));
}

QueryExprFactory.prototype.descend = function () {
    return (new DescendQueryExpr(this));
}

/**
 * type(selector, name) evaluates to true if there is
 * an instance of the selector of the given type.
 */
QueryExprFactory.prototype.type = function (selector, type) {
    if (arguments.length != 2) {
        throw new RangeError("needs exactly two arguments");
    }

    if (selector instanceof SelectQueryExpr) {
        // good
    }
    else {
        throw new RangeError("selector must be a dschema query selector");
    }

    if (typeof(type) == "number") {
        // good
    }
    else {
        throw new RangeError("type must be a djson.TYPE number");
    }

    return (new TypeQueryExpr(this, selector, type));
}

QueryExprFactory.prototype.exists = function (selector) {
    if (arguments.length != 1) {
        throw new RangeError("need exactly one argument");
    }

    if (selector instanceof SelectQueryExpr) {
        // good
    }
    else {
        throw new RangeError("argument must be a dschema query selector");
    }

    return (new ExistsQueryExpr(this, selector));
}

QueryExprFactory.prototype.in = function (left, rights) {
    if (arguments.length != 2) {
        throw new RangeError("this method requires two arguments"); 
    }

    if (!(left instanceof SelectQueryExpr)) {
        throw new RangeError("left argument must be a selector expression"); 
    }

    if (!(rights instanceof Array)) {
        throw new RangeError("right argument must be an array"); 
    }

    var choices = [];
    var self = this;

    rights.forEach(function (right) {
            if (right instanceof LiteralQueryExpr) {
                choices.push(right);
            }
            else if (typeof(right) == "string") {
                choices.push(new StringQueryExpr(self, right));
            }
            else {
                throw new RangeError("right item must be a string or literal"); 
            }
        });

    var result;

    if (choices.length == 0) {
        result = this.false();
    }
    else if (choices.length == 1) {
        result = this.eq(left, choices[0]);
    }
    else {
        result = new InQueryExpr(this, left, choices);
    }

    return (result);
}

QueryExprFactory.prototype.path = function (args) {
    var segments = [];

    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        var type = typeof(arg);

        if (type == "string") {
            segments.push(this.property(arg));
        }
        else if (type == "number") {
            segments.push(this.index(arg));
        }
        else if (arg instanceof PathQueryExpr) {
            if (arg.root && segments.length != 0) {
                throw new RangeError("argument " + i +
                    " root query segment must be first in path");
            }

            segments.push.apply(segments, arg.segments);
        }
        else if ((arg instanceof RootQueryExpr) && (segments.length != 0)) {
            throw new RangeError("argument " + i +
                " root query segment must be first in path");
        }
        else if (arg instanceof SelectQueryExpr) {
            if ((segments.length == 1) &&
                    (segments[0] instanceof RootQueryExpr) &&
                    (arg instanceof DescendQueryExpr)) {
                segments.pop();
            }
            else if ((segments.length == 0) &&
                    (arg instanceof DescendQueryExpr)) {
                // do nothing
            }
            else {
                segments.push(arg);
            }
        }
        else {
            throw new RangeError("argument " + i +
                " must be a dschema query expression, string or number, not " +
                typeof(arg) + ": " + arg);
        }
    }

    var result;

    if (segments.length == 1) {
        result = segments[0];
    }
    else {
        result = new PathQueryExpr(this, segments);
    }

    return (result);
}

/**
 * Performs a proper deep clone of an expression, by using the
 * expression transformer.
 */
QueryExprFactory.prototype.import = function (expr) {
    return (expr.transform(function (expr) { return (expr); }));
}

/**
 * Reframes the interpretation of bare selectors and roots
 * so that the expression is relative to the passed selector.
 */
QueryExprFactory.prototype.reframe = function (expr, selector) {
    var self = this;

    /*
        Note the expr provided to the closure here has already been cloned,
        so does not need to be cloned again if re-used in any way.  However,
        the selector provided to this outer method DOES need to be cloned
        each time it is re-used.
    */
    return (expr.transform(function (expr) {
            if (!(expr instanceof SelectQueryExpr)) {
                // keep deep-cloned expression
            }
            else if (expr.record != null) {
                // keep deep-cloned expression
            }
            else if (expr.root == null) {
                expr = self.path(self.import(selector),
                    self.descend(), expr);
            }
            else {
                var segments = [self.import(selector)];

                if (expr instanceof RootQueryExpr) {
                    // ignore - selector replaces
                }
                else if (expr instanceof PathQueryExpr) {
                    expr.segments.forEach(function (segment) {
                            if (segment instanceof RootQueryExpr) {
                                // ignore - selector replaces
                            }
                            else {
                                segments.push(segment);
                            }
                        });
                }
                else {
                    throw new denum.StateError("invalid selector: " + expr);
                }

                expr = self.path.apply(self, segments);
            }

            return (expr);
        }));
}

QueryExprFactory.prototype.fromMongoValue = function (mongo) {
    var result;

    if (mongo instanceof Array) {
        result = [];

        var self = this;

        mongo.forEach(function (item) {
                result.push(self.fromMongoValue(item));
            });
    }
    else if ((mongo instanceof Object) && !(mongo instanceof Date)) {
        throw new Error("invalid mongo value: " + mongo);
    }
    else {
        result = this.value(mongo);
    }

    return (result);
}

QueryExprFactory.prototype.fromMongoDeep = function (path, value, fn) {
    var f = this;
    var result;

    if (fn instanceof Function) {
        result = f.or(fn(path, value),
            fn(f.path(path, f.index()), value),
            fn(f.path(path, f.index(), f.index()), value));
    }
    else if (fn === true) {
        if (value == null) {
            result = f.or(f.not(f.exists(path)),
                f.type(path, f.UNDEFINED),
                f.type(path, f.NULL),
                f.type(f.path(path, f.index()), f.UNDEFINED),
                f.type(f.path(path, f.index()), f.NULL),
                f.type(f.path(path, f.index(), f.index()), f.UNDEFINED),
                f.type(f.path(path, f.index(), f.index()), f.NULL));
        }
        else {
            result = f.or(f.eq(path, f.value(value)),
                f.eq(f.path(path, f.index()), f.value(value)),
                f.eq(f.path(path, f.index(), f.index()), f.value(value)));
        }
    }
    else if (fn === false) {
        result = f.or(f.not(f.exists(path)),
            f.ne(path, f.value(value)),
            f.ne(f.path(path, f.index()), f.value(value)),
            f.ne(f.path(path, f.index(), f.index()), f.value(value)));
    }
    else {
        throw new RangeError("invalid sub handler " + fn);
    }

    return (result);
}

QueryExprFactory.prototype.fromMongoPath = function (path, mongo) {
    var result;
    var f = this;

    if (mongo instanceof Array) {
        // exact array
        var results = [true, true];

        mongo.forEach(function (item, index) {
                results.push(f.eq(f.path(path, f.index(index)),
                    f.fromMongoValue(item)));
            });

        result = f.and.apply(f, results);
    }
    else if (mongo instanceof RegExp) {
        result = f.fromMongoDeep(path, mongo,
            function (path, value) {
                return (f.match(path, value));
            });
    }
    else if ((mongo instanceof Object) && !(mongo instanceof Date)) {
        var last = f.true();

        for (var property in mongo) {
            var value = mongo[property];

            if (property == "$eq") {
                result = f.eq(path, f.fromMongoValue(value));
            }
            else if (property == "$gt") {
                result = f.gt(path, f.fromMongoValue(value));
            }
            else if (property == "$gte") {
                result = f.gte(path, f.fromMongoValue(value));
            }
            else if (property == "$lte") {
                result = f.lte(path, f.fromMongoValue(value));
            }
            else if (property == "$lt") {
                result = f.lt(path, f.fromMongoValue(value));
            }
            else if (property == "$ne") {
                result = f.ne(path, f.fromMongoValue(value));
            }
            else if ((property == "$in") || (property == "$nin")) {
                var items = [];
                var nulls = false;

                value.forEach(function (item) {
                        if (item == null) {
                            nulls = true;
                        }
                        else {
                            items.push(item);
                        }
                    });

                if (items.length > 0) {
                    result = f.fromMongoDeep(path,
                            items,
                            function (path, value) {
                                return (f.in(path, value));
                            },
                            true);
                }
                else {
                    result = false;
                }

                if (nulls) {
                    result = f.or(result, f.fromMongoDeep(path, null, true));
                }

                if (property == "$nin") {
                    result = f.not(result);
                }
            }
            else if (property == "$not") {
                if (typeof(value) == "string") {
                    result = f.fromMongoDeep(path, value, false);
                }
                else {
                    result = f.not(f.fromMongoPath(path, value));
                }
            }
            else if (property == "$or") {
                result = f.false();

                value.forEach(function (item) {
                        result = f.or(result, f.fromMongoPath(path, item));
                    });
            }
            else if (property == "$and") {
                result = f.true();

                value.forEach(function (item) {
                        result = f.and(result, f.fromMongoPath(path, item));
                    });
            }
            else if (property == "$nor") {
                result = f.false();

                value.forEach(function (item) {
                        result = f.or(result, f.fromMongoPath(path, item));
                    });

                result = f.not(result);
            }
            else if (property == "$exists") {
                result = f.exists(f.path(path, value));
            }
            else if (property == "$regex") {
                result = f.match(f.path(path, value));
            }
            else if (property == "$elemMatch") {
                result = f.fromMongoPath(f.path(path, f.index()), value);
            }
            else if (property == "$text") {
                var search = null;

                for (var name in value) {
                    if (name == "$search") {
                        search = value[name];
                    }
                    else {
                        throw new RangeError("unsupported mongo $text expr " +
                            JSON.stringify(value));
                    }
                }

                if (typeof(search) != "string") {
                    throw new RangeError("unsupported mongo $text expr " +
                        JSON.stringify(value));
                }

                // no locale opts for now
                result = f.text(f.defaultAnalyzer, search, {});
            }
            else if (property == "$deepEXT") {
                result = f.fromMongoPath(f.path(path, f.descend()), value);
            }
            else if (property == "$prefixEXT") {
                result = f.fromMongoDeep(path, value,
                    function (path, value) {
                        return (f.prefix(path, value));
                    });
            }
            else if (property.indexOf("$") == 0) {
                throw new Error("unsupported mongo expr: " + property);
            }
            else {
                result = f.fromMongoPath(f.path(path, property),
                    mongo[property]);
            }

            last = f.and(last, result);
        }

        result = last;
    }
    else if (path.tailProperty) {
        if (mongo == null) {
            result = f.or(f.not(f.exists(path)),
                f.type(path, f.UNDEFINED),
                f.type(path, f.NULL),
                f.type(f.path(path, f.index()), f.UNDEFINED),
                f.type(f.path(path, f.index()), f.NULL),
                f.type(f.path(path, f.index(), f.index()), f.UNDEFINED),
                f.type(f.path(path, f.index(), f.index()), f.NULL));
        }
        else {
            result = f.or(f.eq(path, f.value(mongo)),
                    f.eq(f.path(path, f.index()), f.value(mongo)),
                    f.eq(f.path(path, f.index(), f.index()), f.value(mongo)));
        }
    }
    else {
        result = f.eq(path, f.value(mongo));
    }

    return (result);
}

/**
 * Text is only available if the target document was authored with
 * text support with the same analyzer.  See Analyzer for opts.
 */
QueryExprFactory.prototype.text = function (analyzer, text, opts) {
    var tokens = analyzer.analyze(text, opts);
    var f = this;
    var result = f.true();

    tokens.forEach(function (token) {
            result = f.and(result, f.prefix(f.root("search",
                analyzer.name, analyzer.version, "tokens",
                f.index()), token));
        });

    return (result);
}

QueryExprFactory.prototype.fromMongo = function (mongo) {
    return (this.fromMongoPath(this.root(), mongo));
}

exports.QueryExprFactory = QueryExprFactory;

util.inherits(CachedQueryEmitter, events.EventEmitter);

function CachedQueryEmitter(cachedQuery, expr) {
    events.EventEmitter.call(this);

    this.cachedQuery = cachedQuery;
    this.index = 0;
    this.expr = expr;
    this.results = null;
    this.id = CachedQueryEmitter.prototype.seqCount++;
    this.finished = false;
    this.scanned = 0;
    this.returned = 0;
}

CachedQueryEmitter.prototype.buildScanResults = function () {
    if (QTRACE != null) {
        QTRACE("" + Date.now() + " " +
            this + " buildScanResults()");
    }

    var map = this.prepareMatch(this.expr, null);

    if (map == null) {
        this.results = this.cachedQuery.results;
    }
    else {
        this.results = [];

        for (var id in map) {
            this.results.push(map[id]);
        }
    }
}

/**
 * Takes a QueryExpr 'expr' and a map of ids to records 'within'.
 * The function must not modify within, but may return it.
 * The returned value indicates the new set of results that were filtered
 * from the passed within.  Within may be null, in which case it indicates
 * that all of the records in the cached query are candidates.
 */
CachedQueryEmitter.prototype.prepareMatch = function (expr, within) {
    var selects;

    if (PTRACE) {
        PTRACE("prepare", expr.toString(), within != null);
    }

    if (expr instanceof AndQueryExpr) {
        var index = 0;

        while (index < expr.conditions.length) {
            within = this.prepareMatch(expr.conditions[index], within);

            index++;
        }

        selects = within;

        if (PTRACE) {
            PTRACE("-->prepare and", index);
        }
    }
    else if (expr instanceof OrQueryExpr) {
        var index = 0;
        var own = false;

        selects = null;

        while (index < expr.conditions.length) {
            var sub = this.prepareMatch(expr.conditions[index], within);

            if (sub === within) {
                selects = within;
                break; // no change
            }
            else if (selects === null) {
                // use the provided result set
                selects = sub;
            }
            else {
                if (!own) {
                    var nselects = {};

                    // join the two results sets
                    for (var id in selects) {
                        nselects[id] = selects[id];
                    }

                    own = true;
                    selects = nselects;
                }

                // join the two results sets
                for (var id in sub) {
                    selects[id] = sub[id];
                }
            }

            index++;
        }

        if (selects == null) {
            selects = within;
        }

        if (PTRACE) {
            PTRACE("-->prepare or", index);
        }
    }
    else if (expr instanceof CompareQueryExpr) {
        if (expr.op = "=") {
            var lookup = null;

            if (expr.left instanceof LiteralQueryExpr) {
                if (expr.right instanceof LiteralQueryExpr) {
                    // ignore
                }
                else {
                    lookup = expr.left.value;
                }
            }
            else if (expr.right instanceof LiteralQueryExpr) {
                lookup = expr.right.value;
            }
            else {
                // ignore
            }

            if (lookup != null) {
                var map = this.cachedQuery.map[lookup];

                if (map == null) {
                    // empty set selected, lookup failed
                    selects = {};
                }
                else if (within == null) {
                    selects = map;
                }
                else {
                    selects = {};

                    for (var id in map) {
                        if (id in within) {
                            selects[id] = within[id];
                        }
                    }
                }
            }
            else {
                selects = within; // requires a sub scan
            }
        }
        else {
            selects = within; // requires a sub scan
        }

        if (PTRACE) {
            PTRACE("-->prepare compare", selects != within);
        }
    }
    else if (expr instanceof PrefixQueryExpr) {
        selects = within; // requires a sub scan

        if (PTRACE) {
            PTRACE("-->prepare prefix");
        }
    }
    else if (expr instanceof ExistsQueryExpr) {
        selects = within; // requires a sub scan

        if (PTRACE) {
            PTRACE("-->prepare exists");
        }
    }
    else {
        selects = within; // most likely requires a sub scan

        if (PTRACE) {
            PTRACE("-->prepare other", expr.constructor.name);
        }
    }

    return (selects);
}

CachedQueryEmitter.prototype.stop = function () {
    if (QTRACE != null) {
        QTRACE("" + Date.now() + " " + this + " stop() called");
    }

    if (this.finished) {
        // ignore
    }
    else {
        if ((this.scanned > this.returned + 10) &&
                (this.scanned > this.returned * 3)) {
            if (this.listeners('slow').length > 0) {
                this.emit('slow', {
                        scanned: this.scanned,
                        returned: this.returned,
                        query: this.expr.toString(),
                        plan: this.lookups ?
                        "lookup" + JSON.stringify(this.lookups) : "scan",
                    });
            }
        }

        this.finished = true;
        this.emit('end');
    }
}

CachedQueryEmitter.prototype.next = function () {
    var self = this;

    if (this.finished) {
        throw new Error("next() after stop() or emit('end')");
    }
    else if (!this.cachedQuery.cached) {
        if (QTRACE != null) {
            QTRACE("" + Date.now() + " " +
                this + " next() waiting on true query completion");
        }

        this.cachedQuery.once('cached', function () {
                self.next();
            });
    }
    else if (this.results == null) {
        this.buildScanResults();

        this.scanned = this.results.length;
        this.next();
    }
    else {
        if (QTRACE != null) {
            QTRACE("" + Date.now() + " " + this + " next() queueing result");
        }

        var results = this.results;
        var expr = this.expr;

        while ((this.index < results.length) &&
                !expr.test(results[this.index])) {
            this.index++;
        }

        if (this.index < results.length) {
            var result = results[this.index++];

            if (QTRACE != null) {
                QTRACE("" + Date.now() + " " + this + " emit('result') " +
                    result.id + " " + result.name);
            }

            this.returned++;

            setImmediate(function () {
                    self.emit('result', result);
                });
        }
        else if (this.cachedQuery.errors.length > 0) {
            if (QTRACE != null) {
                QTRACE("" + Date.now() + " " + this + " emit('error')");
            }

            this.emit('error', this.cachedQuery.errors[0]);
        }
        else {
            if (QTRACE != null) {
                QTRACE("" + Date.now() + " " + this + " emit('end')");
            }

            this.stop();
        }
    }
}

CachedQueryEmitter.prototype.seqCount = 0;

CachedQueryEmitter.prototype.toString = function () {
    return ("CachedQuery " + this.cachedQuery.id + " Emitter " + this.id);
}

util.inherits(CachedQuery, events.EventEmitter);

function CachedQuery(expr, query) {
    events.EventEmitter.call(this);

    this.expr = expr;
    this.query = query;
    this.errors = [];
    this.results = [];
    this.map = {};
    this.cached = false;
    this.id = CachedQuery.prototype.seqCount++;

    if (QTRACE) {
        QTRACE("" + Date.now() + " " + this + " new " + expr.toString());
    }

    var self = this;

    query.on('error', function (error) {
            self.cached = true;
            self.errors.push(error);
            self.emit('cached');
        }).
        on('result', function (result) {
            self.addRecord(result);
            this.next();
        }).
        on('end', function () {
            self.cached = true;
            self.emit('cached');
        }).
        next();
}

CachedQuery.prototype.seqCount = 0;

CachedQuery.prototype.toString = function () {
    return ("CachedQuery " + this.id);
}

function cacheComparator(left, right) {
    var result;

    if (left == null) {
        result = 1;
    }
    else if (right == null) {
        result = -1;
    }
    else if (left.id === right.id) {
        result = 0;
    }
    else if (left.id > right.id) {
        result = -1;
    }
    else if (left.id < right.id) {
        result = 1;
    }
    else {
        throw new denum.StateError();
    }

    return (result);
}

CachedQuery.prototype.indexNode = function (record, result, adding) {
    if (result instanceof Array) {
        for (var i = 0; i < result.length; i++) {
            this.indexNode(record, result[i], adding);
        }
    }
    else if (result instanceof Object) {
        for (var name in result) {
            this.indexNode(record, result[name], adding);
        }
    }
    else if (result == null) {
        // ignore
    }
    else {
        var type = typeof(result);

        if (type === "string") {
            // no change
        }
        else {
            result = "" + result;
        }

        if (adding) {
            if (!(result in this.map)) {
                this.map[result] = {};
            }

            this.map[result][record.id] = record;
        }
        else {
            if (!(result in this.map)) {
                // ignore
            }
            else {
                delete this.map[result][record.id];
            }
        }
    }
}

CachedQuery.prototype.addRecord = function (result) {
    denum.binarySort(this.results, result, cacheComparator);
    this.indexNode(result, result, true);
}

CachedQuery.prototype.hasId = function (id) {
    return (denum.binarySearch(this.results, { id: id },
        cacheComparator) >= 0);
}

CachedQuery.prototype.editRecord = function (id, result) {
    var index = denum.binarySearch(this.results, { id: id }, cacheComparator);

    if (index >= 0) {
        var oldResult = this.results.splice(index, 1);

        this.indexNode(oldResult, oldResult, false);
    }
    else {
        index = 1 - index;
    }

    if (result != null) {
        this.results.splice(index, 0, result);

        this.indexNode(result, result, true);
    }
}

CachedQuery.prototype.newResultEmitter = function (expr) {
    return (new CachedQueryEmitter(this, expr));
}

CachedQuery.prototype.editRecord = function (id, result) {
    var index = denum.binarySearch(this.results, { id: id }, cacheComparator);

    if (index >= 0) {
        var oldResult = this.results.splice(index, 1);

        this.indexNode(oldResult, oldResult, false);
    }
    else {
        index = 1 - index;
    }

    if (result != null) {
        this.results.splice(index, 0, result);

        this.indexNode(result, result, true);
    }
}

exports.CachedQuery = CachedQuery;

