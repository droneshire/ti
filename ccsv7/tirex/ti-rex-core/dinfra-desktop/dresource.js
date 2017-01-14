// Copyright (C) 2016 Texas Instruments Incorporated - http://www.ti.com/
const Q = require('q');
const util = require('util');
const stream = require('stream');
const events = require('events');
const crypto = require('crypto');
const zlib = require('zlib');
const djson = require('./djson');
const denum = require('./denum');
const dschema = require('./dschema');
const dfile = require('./dfile');
const dinfra = require('./dinfra');
const TRACE = null; // console.log; // set to console.log for trace

const CHANGE_INITIAL = 0; // the change step to begin with
const CHANGE_FIXED = -1; // do not change this further
const CHANGE_NOMINAL = -2; // this has no blocks of its own
const CHANGE_TERMINATED = -3; // this indicates a deleted node

exports.RTYPE = denum.cardinals(
    "FILE", // its a file resource (may be sparse, nominal and/or hard-linked)
    "DIR", // its directory resource (name must end in /).
    "LINK"); // its a symbolic link to some other entry

exports.VTYPE = denum.cardinals(
    "PREV", // previous version chain
    "SPARSE"); // sparse stack chain

var resourceManager = null;
const resourceTablePrefix = "dinfra_resource";
const resourceMetaTablePrefix = resourceTablePrefix + "meta";

exports.resourceTablePrefix = resourceTablePrefix;
exports.resourceMetaTablePrefix = resourceMetaTablePrefix;
exports.CHANGE_INITIAL = CHANGE_INITIAL;
exports.CHANGE_FIXED = CHANGE_FIXED;
exports.CHANGE_NOMINAL = CHANGE_NOMINAL;
exports.CHANGE_TERMINATED = CHANGE_TERMINATED;

function ResourceManager(logger, writableGroup, readableGroup, retryManager,
        encryptManager, opts) {
    if (logger == null) {
        throw new RangeError("need logger");
    }

    /* writableGroup can be null when we're in read-only mode ...
    if (writableGroup == null) {
        throw new RangeError("need writableGroup");
    }
    */

    if (readableGroup == null) {
        throw new RangeError("need readableGroup");
    }

    if (opts == null) {
        throw new RangeError("need opts");
    }

    this.logger = logger;
    this.writableGroup = writableGroup;
    this.readableGroup = readableGroup;
    this.retryManager = retryManager;
    this.encryptManager = encryptManager;
    this.opts = opts;
    this.supportsVersions = false; // overriden by SQL impl
    this.queryCache = [];
}

ResourceManager.prototype.getResourceSchema = function () {
    throw new denum.UnsupportedError();
}

ResourceManager.prototype.openResource = function (name, opts, callback) {
    throw new denum.UnsupportedError();
}

ResourceManager.prototype.newResourceQuery = function () {
    throw new denum.UnsupportedError();
}

ResourceManager.prototype.newResourceFS = function (prefix, opts) {
    var dresourcefs = require('./dresourcefs');

    return (new dresourcefs.ResourceFS(this, prefix, opts));
}

ResourceManager.prototype.newResourceImporter = function (localTreePath,
        resourcePrefix) {
    return (new ResourceImporter(this, localTreePath, resourcePrefix));
}

ResourceManager.prototype.createArchiveQueryHandler = function (writable,
        opts) {
    if (opts == null) {
        throw new RangeError("opts must be provided");
    }

    if (opts.format != "file") {
        throw new denum.UnsupportedError("opts.format=" + opts.format);
    }

    if (opts.content !== false) {
        throw new denum.UnsupportedError("opts.content=" + opts.content);
    }

    var transform = null;

    if (opts.transform != null) {
        if (!(opts.transform instanceof Function)) {
            throw new RangeError("opts.transform must be a function");
        }

        transform = opts.transform;
    }

    var callback = function (error) {
            if (error != null) {
                writable.emit('error', error);
            }
        };
    var zstream = zlib.createGzip().
        on('error', function (error) {
            callback(error);
            callback = function () {}; // do nothing
        });

    zstream.pipe(writable);

    var writer = new djson.Streamer(zstream, null, { tree: true });
    var outerFake = {};
    var resourcesFake = [];
    var lastInfo = null;

    writer.beginMap(null, outerFake);
    writer.beginNamed(null, "records");
    writer.beginList(null, resourcesFake);

    var idCount = 0;

    return (function (error, rinfo) {
            if (error != null) {
                callback(error);
                callback = function () {}; // do nothing
            }
            else if (rinfo == null) {
                if (lastInfo != null) {
                    writer.sendValue(null, lastInfo, true); // the last
                }

                writer.endList(null, resourcesFake, false);
                writer.endNamed(null, "resources", true);
                writer.endMap(null, outerFake, true);

                writer.flush(function (error) {
                        if (error != null) {
                            callback(error);
                            callback = function () {}; // do nothing
                        }
                        else {
                            zstream.end(null, null, function (error) {
                                    callback(error);
                                    callback = function () {}; // do nothing
                                });
                        }
                    });
            }
            else {
                if (lastInfo != null) {
                    writer.sendValue(null, lastInfo, false); // not the last
                }

                // do not use names from origin rinfo
                var id = idCount++;
                var info = {
                        id: id,
                        name: rinfo.name,
                        version: null, // because archives are flat
                        encryption: null, // no encryption
                        material: null, // no encryption key
                        type: rinfo.type, // these copy from origin ...
                        size: rinfo.size,
                        modified: rinfo.modified,
                        created: rinfo.created,
                        change: rinfo.change,
                        meta: rinfo.meta,
                    };

                if (transform !== null) {
                    info = transform(info);
                }

                if (info != null) {
                    lastInfo = info;
                }
            }
        });
}

ResourceManager.prototype.writeArchiveTo = function (writable,
        pathPrefix, opts) {
    this.newResourceQuery().
        withNamePrefix(pathPrefix).
        invoke(this.createArchiveQueryHandler(writable, opts));
}

ResourceManager.prototype.findCachedQuery = function (path, expr) {
    var index = this.queryCache.length;

    while ((--index >= 0) &&
        (path.indexOf(this.queryCache[index].path) != 0));

    return ((index >= 0) ? this.queryCache[index] : null);
}

ResourceManager.prototype.updateCachedQueries = function (resource) {
    if (this.queryCache.length == 0) {
        // do nothing
    }
    else {
        var index = this.queryCache.length;

        while (--index >= 0) {
            var cachedQuery = this.queryCache[index];

            if (cachedQuery.hasId(resource.id) ||
                    cachedQuery.expr.test(resource)) {
                // cachedQuery.editResult(resource.id, resource);
                // invalidate cache
                this.queryCache.splice(index, 0);
            }
        }
    }
}

ResourceManager.prototype.rebuildCachedQuery = function (path, expr) {
    var index = this.queryCache.length;

    while ((--index >= 0) &&
        (path.indexOf(this.queryCache[index].path) != 0));

    if (index >= 0) {
        this.queryCache.splice(index, 1); // remove the old one.
    }

    var cachedQuery = new dschema.CachedQuery(expr,
        this.newResourceQuery().
        withNoAssumptions().
        withQueryExpr(expr));

    cachedQuery.path = path;

    this.queryCache.push(cachedQuery);

    return (cachedQuery);
}

exports.ResourceManager = ResourceManager;

function Resource(manager, name, opts) {
    if (!(manager instanceof ResourceManager)) {
        throw new RangeError("illegal type " + typeof(manager));
    }

    if (typeof(name) != "string") {
        throw new RangeError("illegal type " + typeof(name));
    }

    /* @todo urgent check with githubagent usage first ...
    if (name.indexOf("/") != 0) {
        // @todo urgent check name is not longer than resource name/store
        throw new RangeError("illegal name " + name);
    }
    */

    this.manager = manager;

    this.id = null;
    this.lock = null;
    this.contentIds = null;
    this.size = 0;
    this.name = name;
    this.callback = null;
    this.blockSize = 32768;
    this.errors = [];
    this.create = false;
    this.writable = false;
    this.created = opts.created || Date.now();
    this.modified = opts.modified || this.created;
    this.master = null; // unversioned record
    this.versions = { }; // available version records by version
    this.relations = []; // generalized relationships between resources
    this.idVersionMap = { }; // available version records by id
    this.last_version = null;
    this.next_versions = [];
    this.latest_version = null;
    this.change = CHANGE_INITIAL;
    this.original = this.change;
    this.metaChanged = false;
    this.encryption = null; // no encryption
    this.symKeyBuffer = null;
    this.ivBuffer = null;
    this.slow = 0; // ms to wait after read or write - used for testing
    this.seqId = Resource.prototype.seqCount++;

    // BEGIN special initializations from opts
    // initialized only for creates
    this.type = opts.type;
    this.version = opts.version; // get the specific version, then my version
    // can be used for more than creates
    this.latest = opts.latest; // get the latest
    this.prev_version = opts.branch;
    // END special initializations from opts

    this.opts = opts; // mutable copy - doesn't affect caller.
    this.create = !!opts.create;
    this.writable = !!opts.writable;
    this.executable = !!opts.executable;
    this.meta = opts.meta; // worst case, a shallow copy of caller's
    this.conn = null; // always initialize to null
    this.call = "open"; // create is an implicit open
    this.closed = false; // true when close() has been called
    this.destroyOnClose = null; // internally used to destroy resources by id. 
    this.relinkList = []; // internally used to relink resources. 
    this.keepConn = false; // keep a connection
    this.intentToClose = false; // consider how to react on failure
    this.singleConn = null; // place to keep when we keep a connection
    this.closeConn = true; // are we responsible for closing this connection?
    this.flushSummaryData = false;
    this.metaChanged = false;
    this.dependent = !!opts.dependent; // ie. not retryable

    if (this.opts.connection == null) {
        // do nothing
    }
    else if (this.opts.connection === true) {
        this.keepConn = true;
        this.closeConn = true;
    }
    else { // assume its an object
        this.keepConn = true;
        this.singleConn = this.opts.connection;
        this.closeConn = false;
    }

    denum.getterProperty(this, "link", function () {
            return (this.getMeta("link")); // @todo check and revise
        });
}

Resource.prototype.seqCount = 0;

Resource.prototype.acquireConnPrivate = function (owner, name, callback) {
    var self = this;

    this.intentToClose = false;

    if (this.singleConn != null) {
        this.conn = this.singleConn;
        callback(null);
        return;
    }

    owner[name].call(owner, function (error, conn) {
            if (error == null) {
                self.conn = conn;

                if (self.keepConn) {
                    self.singleConn = conn;
                }
            }

            if (callback != null) {
                callback(error);
            }
        });
}

Resource.prototype.cancelConnPrivate = function () {
    if (this.conn != null) { // shouldn't happen, but in case ...
        if (this.conn.transacting) { // only cancel when transacting
            if (this.closeConn) { // only cancel if we're responsible for close
                this.conn.cancel();
            }
        }
    }
}

Resource.prototype.releaseConnPrivate = function (callback) {
    var conn = this.conn;

    this.conn = null;

    if (!this.closeConn) {
        callback(null); // don't close it ever
    }
    else if (this.keepConn && !this.intentToClose) {
        callback(null); // don't close it yet
    }
    else {
        if (this.singleConn != null) {
            this.singleConn = null;
        }

        conn.close(callback);
    }
}

/**
 * Use this in non-private calls to register a callback and record
 * the called function name.  This should be called after all other
 * checks that can throw errors.
 */
Resource.prototype.openCallPrivate = function (name, callback) {
    if (name == null) {
        throw new Error("openCallPrivate() with no valid name"); 
    }

    if (this.call != null) {
        throw new Error("called " + name + " in pending call " + this.call);
    }

    this.call = name;
    this.callback = callback; // may be null or undefined
}

/**
 * Completes any openCallPrivate() - will invoke the callback with the
 * parameters provided, if one is registered.
 */
Resource.prototype.closeCallPrivate = function (result) {
    if (this.call == null) {
        throw new Error("closeCallPrivate() with no pending call");
    }

    this.call = null;

    var callback = this.callback;

    if (callback != null) {
        this.callback = null; // clear the callback

        if (this.errors.length > 0) {
            callback(this.errors, result);
        }
        else {
            callback(null, result);
        }
    }
}

/**
 * Get a particular root meta key.  This is preferable
 * to this.meta[key] because it handles a null meta.
 * It also matches setMeta, which is more appropriate for
 * application use.  There is no way of distinguishing
 * between an undefined value, a missing key or a missint meta:
 * all will return undefined.  Note that the meta key 'headers'
 * is reserved for storing MIME and HTTP headers - its better
 * to use getHeaders() or getHeader(key) to access those, since
 * that deals with missing objects and case folding.
 */
Resource.prototype.getMeta = function(key) {
    return (this.meta != null ? this.meta[key] : undefined);
}

/**
 * Sets a root meta key to a value, or if the value is
 * undefined, removes that value.  Note that this is distinct
 * from setHeader which has very different semantics.
 * See also notes on getMeta().
 */
Resource.prototype.setMeta = function(key, value) {
    if (!this.writable) {
        throw new Error("illegal state: resource not opened for writing");
    }

    if (value === undefined) { // undefined only!!
        if (this.meta != null) {
            delete this.meta[key];
            this.metaChanged = true; // flush on close
        }
    }
    else {
        if (this.meta == null) { // or undefined
            this.meta = {};
        }

        this.meta[key] = value;
        this.metaChanged = true; // flush on close
    }
}

/**
 * Set the search content for a resource.
 */
Resource.prototype.setSearch = function(state) {
    if (!(state instanceof dsearch.State)) {
        throw new RangeError("state argument must come from an analyzer");
    }

    setMeta("search", state.asSearchJSONProtected());
}

Resource.prototype.setCreated = function(created) {
    if (typeof(created) != "number") {
        throw new RangeError();
    }

    if (this.change < 0) {
        throw new denum.StateError();
    }

    if (this.created != created) {
        this.created = created;
        this.change++; // flush on close
    }
}

Resource.prototype.setModified = function(modified) {
    if (typeof(modified) != "number") {
        throw new RangeError();
    }

    if (this.change < 0) {
        throw new denum.StateError();
    }

    if (this.modified != modified) {
        this.modified = modified;
        this.change++; // flush on close
    }
}

Resource.prototype.setExecutable = function(executable) {
    if (this.change < 0) {
        throw new denum.StateError();
    }

    if (this.executable != !!executable) {
        this.executable = !!executable; // coerce to boolean
        this.change++; // flush on close
    }
}

/**
 * Returns a copy of the headers.  Will overlay onto passed headers
 * if provided.  Note that headers are always string value pairs and
 * are compared caseless, which is a bit different to object properties.
 */
Resource.prototype.getHeaders = function(headers) {
    if (headers == null) {
        headers = {};
    }

    if ((this.meta != null) && (this.meta.headers != null)) {
        for (var a in this.meta.headers) {
            headers[a] = "" + this.meta.headers[a];
        }
    }

    return (headers);
}

/**
 * This updates some specific meta headers derivable from
 * the resource header values.
 */
Resource.prototype.updateHeaders = function () {
    if (this.type == exports.RTYPE.FILE) {
        /**
         * This can end up being redundant if a content-length
         * header already existed prior to the close, but it
         * will not cause a lot of extra churn.
         */
        this.setHeader("Content-Length", this.size);
    }

    var date = new Date(this.modified);

    this.setHeader("Last-Modified", denum.rfc822Date(date));
}

/**
 * Set a MIME (eg. Content-Type) or HTTP (eg. ETag) header for the
 * resource.  Note that the key and value will both be coerced to
 * strings.  The key cannot be null, undefined or empty.  Keys
 * are folded to lower case ASCII.  A null or undefined value will
 * remove that header.
 */
Resource.prototype.setHeader = function(key, value) {
    if (!this.writable) {
        throw new Error("illegal state: resource not opened for writing");
    }

    if (key == null) {
        throw new Error("key cannot be null or undefined");
    }

    key = "" + key; // coerce string

    if (key == "") {
        throw new Error("key cannot be empty");
    }

    key = key.toLowerCase(); // no locale

    if (this.meta == null) {
        this.meta = {};
    }

    if (this.meta.headers == null) {
        // this technically changes the meta,
        // but its not important enough
        // force a flush of on resource close.
        this.meta.headers = {};
    }

    if (value == null) { // or undefined
        if (key in this.meta.headers[key]) {
            delete this.meta.headers[key];
            this.metaChanged = true; // flush on close
        }
    }
    else {
        value = "" + value; // cast to string

        if (this.meta.headers[key] != value) {
            this.meta.headers[key] = value;
            this.metaChanged = true; // flush on close
        }
    }
}

/**
 * Return a header by key - the key cannot be null, undefined or empty.
 * It will be case folded to lower case ASCII.  The result will be
 * undefined.  Generally, results should be non-null strings if the
 * interface has been used to maintain them.
 */
Resource.prototype.getHeader = function(key) {
    if (key == null) {
        throw new Error("key cannot be null or undefined");
    }

    key = "" + key; // coerce string

    if (key == "") {
        throw new Error("key cannot be empty");
    }

    key = key.toLowerCase(); // no locale

    var value;

    if (this.meta == null) {
        value = undefined;
    }
    else if (this.meta.headers == null) {
        value = undefined;
    }
    else {
        value = this.meta.headers[key];
    }

    return (value);
}

/**
 * This is used to clean up after creates, destroys and header/meta-data
 * changes: so it serves many purposes.  Internal use only.
 */
Resource.prototype.closePrivate = function (error) {
    if (TRACE) {
        TRACE("dresource closePrivate", this.errors.length, error);
    }

    var self = this;

    if (error != null) {
        this.errors.push(error);
    }

    if (this.conn != null) {
        /*
            If the resource has no id, it wasn't found.
            If it wasn't found or there are errors, then
            we treat that as though close was called.  This
            cleans up the connection properly, including
            cancelling the TX if needed.  But we can't do
            this if the resource open was a dependent one,
            we should just continue normally in that case.
        */
        if (this.closed || (!this.dependent && ((this.id == null) ||
                (this.errors.length > 0)))) {
            this.intentToClose = true;
        }

        if (this.keepConn && this.closeConn && this.intentToClose) {
            // indicate we should close the single conn
            this.keepConn = false;
        }

        if (this.errors.length > 0) {
            this.cancelConnPrivate();

            this.releaseConnPrivate(function (error) {
                    self.closePrivate(error);
                });
        }
        else if (this.destroyOnClose != null) {
            this.destroyPrivate();
        }
        else if (this.flushSummaryData && (this.change != this.original)) {
            this.updateHeaderPrivate();
        }
        else if (this.flushSummaryData && this.metaChanged) {
            this.updateMetaPrivate();
        }
        else {
            if (this.flushSummaryData) {
                /*
                    We often won't have a retry handler when
                    flushSummaryData is false - the reason usually
                    being that it is likely a block write ...
                */
                this.retryHandler.withRewindProperty(this,
                    "flushSummaryData", false);
            }

            this.releaseConnPrivate(function (error) {
                    self.closePrivate(error);
                });
        }
    }
    else if (this.lock != null) {
        var lock = this.lock;

        this.lock = null;

        lock.close();

        this.closePrivate(null);
    }
    else if (this.errors.length > 0) {
        var queryError = this.manager.writableGroup.queryErrors(this.errors);

        /* @todo analyze if this is the right solution - error could be parent
        if (!this.dependent && this.create && queryError.duplicate) {
            if (this.callback == null) {
                log.warning("ignored errors", this.errors);
            }
            else {
                this.opts.create = false;
                this.manager.openResource(this.name, this.opts, this.callback);
            }
        }
        else
        */
        if (!this.dependent && (queryError.deadlock ||
                queryError.lockwait ||
                queryError.duplicate)) {
            if (this.retryHandler == null) {
                this.retryHandler = this.manager.retryManager.newRetryHandler(
                    "resource close retry on " + this.name).
                    withRetryFunction(function () {
                        self.closePrivate(null);
                    }).
                    withFailureFunction(function (error) {
                        self.callback(error);
                    });
            }

            this.errors = []; // reset errors

            this.retryHandler.handleError(queryError);
        }
        else {
            if (this.retryHandler != null) {
                this.retryHandler.close();
                this.retryHandler = null;
            }

            if (this.callback != null) {
                this.callback(queryError);
            }
            else {
                log.warning("ignored errors", this.errors);
            }
        }
    }
    else if (this.flushSummaryData ||
            (this.destroyOnClose != null)) {
        /*
            Do not re-use the prior handler, and do not
            reset the handler with each flush...
            Logic here is a little tricky: this doesn't need
            to check because there should never have been
            a retry handler on entry here - the conditions
            should only be allowed to occur prior to closePrivate()
            when there hasn't been any attempt yet to start a flush ...
            logic might be less sound than we think.

            @todo urgent pay attention - this is probably wrong
        */
        this.retryHandler = this.manager.retryManager.newRetryHandler(
            "resource close retry on " + this.name).
            withRetryFunction(function () {
                self.closePrivate(null);
            }).
            withFailureFunction(function (error) {
                self.callback(error);
            });

        this.acquireConnPrivate(this.manager.writableGroup,
            "openTransaction",
            function (error) {
                self.closePrivate(error);
            });
    }
    else {
        // always clear the retry handler at this point,
        // since we don't want rewinds covering multiple transactions
        if (this.retryHandler != null) {
            this.retryHandler.close();
            this.retryHandler = null;
        }

        // this is the only place we return to the caller
        if (this.closed) { // close was called.
            if (this.writable) {
                this.manager.updateCachedQueries(this);
            }
        }

        if (this.id == null) {
            this.closeCallPrivate(null); // don't return missing
        }
        else if ((this.change == CHANGE_TERMINATED) &&
                !this.create &&
                !this.opts.termination) {
            // don't return terminated, except when either
            // creating them or specifically looking for them
            this.closeCallPrivate(null);
        }
        else {
            this.closeCallPrivate(this);
        }
    }
}

Resource.prototype.getParentName = function () {
    var i = this.name.lastIndexOf('/');

    if (i < 0) {
        i = 0;
    }

    return (this.name.substring(0, i));
}

Resource.prototype.getSegment = function () {
    var i = this.name.lastIndexOf('/');

    if (i < 0) {
        i = 0;
    }
    else {
        i++; // skip over /
    }

    return (this.name.substring(i));
}

Resource.prototype.ensureParentsPrivate = function() {
    throw new Error();
}

Resource.prototype.close = function (callback) {
    if (callback === undefined) {
        return (Q.ninvoke(this, "close"));
    }

    if (this.closed) {
        // preserve details and stack trace ...
        var error = new Error("resource closed twice: " + this.name);

        this.manager.logger.warning("resource closed twice",
            {
                name: this.name,
                id: this.id,
                size: this.size,
                version: this.version
            },
            error);

        callback(error);
    }
    else {
        this.closed = true;

        if ((this.change != this.original) || this.metaChanged) {
            this.flushSummaryData = true;
        }

        this.openCallPrivate("close", callback);

        if (this.retryHandler == null) {
            var self = this;

            this.retryHandler = this.manager.retryManager.newRetryHandler(
                "resource close retry on " + this.name).
                withRetryFunction(function () {
                    self.closePrivate(null);
                }).
                withFailureFunction(function (error) {
                    self.callback(error);
                });
        }

        this.closePrivate(null);
    }

    return (undefined);
}

Resource.prototype.createEncryptPrivate = function() {
    var self = this;

    if (!this.opts.encrypt) {
        self.createPrivate();
        return;
    }

    this.manager.encryptManager.storeBlockKey(this.conn, resourceTablePrefix,
        function (error, symKeyId, symKeyBuffer, ivBuffer) {
            if (error != null) {
                self.closePrivate(error);
            }
            else {
                self.retryHandler.
                    withRewindProperty(self, "encryption", symKeyId).
                    withRewindProperty(self, "symKeyBuffer", symKeyBuffer).
                    withRewindProperty(self, "ivBuffer", ivBuffer);

                self.createPrivate();
            }
        });
}

Resource.prototype.destroyPrivate = function() {
    var self = this;
    var versionsToDestroy = {};

    for (var i = 0; i < this.destroyOnClose.length; i++) {
        var record = this.idVersionMap[this.destroyOnClose[i]];

        if (record != null) {
            versionsToDestroy[record.version] = record.prev_version;
        }
    }

    for (var version in versionsToDestroy) {
        var pversion = version;

        while ((pversion = versionsToDestroy[pversion]) in versionsToDestroy) {
            // chain
        }

        versionsToDestroy[version] = pversion;
    }

    for (var id in this.idVersionMap) {
        var record = this.idVersionMap[id];

        if (record.version in versionsToDestroy) {
            // just ignore resources being deleted
        }
        else if (!(record.prev_version in versionsToDestroy)) {
            // doesn't need fixing
        }
        else {
            this.relinkList.push({
                    id: id,
                    oldValue: record.prev_version,
                    newValue: versionsToDestroy[record.prev_version],
                });
        }
    }

    this.deleteByIdsPrivate(this.destroyOnClose,
        function (error) {
            if (error != null) {
                self.closePrivate(self.manager.writableGroup.
                    queryErrors(error, query));
            }
            else {
                self.destroyOnClose = null;

                self.closePrivate(null);
            }
        });
}

/**
 * Different resource implementations delete things in different
 * was, so this hook is provided to allow for that.
 */
Resource.prototype.deleteByIdsPrivate = function (ids, callback) {
    throw new denum.UnsupportedError();
}

/**
 * Used to create an initial record internally.
 */
Resource.prototype.createPrivate = function() {
    throw new denum.UnsupportedError();
}

/**
 * Returns true if for this file, the version belongs to the
 * branch or is the branch version.
 */
Resource.prototype.isVersionOfBranch = function(version, branch) {
    var result = false;

    while ((version != null) && !result) {
        if (version == branch) {
            result = true;
        }
        else {
            version = this.versions[version].prev_version;
        }
    }

    return (result);
}

Resource.prototype.summaryPrivate = function() {
    if (TRACE) {
        TRACE("dresource summaryPrivate");
    }

    var self = this;

    this.last_versions = [];
    this.latest_version = null;
    this.contentIds = []; // reset the content id list

    var tt = null;

    try {
        for (var version in this.versions) {
            var record = this.versions[version];

            for (var relationIndex = 0;
                    relationIndex < record.relations.length;
                    relationIndex++) {
                var relation = record.relations[relationIndex];

                if (relation.vtype == exports.VTYPE.PREV) {
                    var precord;

                    if (relation.via_id != relation.to_id) {
                        // this is an inferred relation, ignore it
                    }
                    else if (precord = this.idVersionMap[relation.from_id]) {
                        if (precord.next_versions == null) {
                            precord.next_versions = [];
                        }

                        precord.next_versions.push(version);

                        if (record.prev_version != null) {
                            throw new Error("multiple prev versions " +
                                version +
                                " has " + record.prev_version +
                                " and " + precord.prev_version +
                                " on " + this.name);
                        }

                        record.prev_version = precord.version;
                    }
                }
                else if (relation.vtype == exports.VTYPE.SPARSE) {
                    if (record.sparse == null) {
                        record.sparse = [];
                    }

                    while (record.sparse.length < relation.steps) {
                        record.sparse.push(null);
                    }

                    record.sparse[relation.steps - 1] = relation.from_id;
                }
                else {
                    // unsupported relation type
                }
            };
        }

        for (var version in this.versions) {
            var record = this.versions[version];

            if (record.next_versions == null) {
                this.last_versions.push(version);
            }
        }

        var chosen = null;

        for (var i = 0; i < this.last_versions.length; i++) {
            var candidate = this.versions[this.last_versions[i]];

            if ((this.prev_version != null) &&
                    !this.isVersionOfBranch(candidate.version,
                    this.prev_version)) {
                // ignore latest with wrong branch
            }
            else if (chosen == null) {
                chosen = candidate;
            }
            else if (1 * candidate.id > 1 * chosen.id) {
                chosen = candidate; // @todo there is a better way than this
            }
            else {
                // ignore candidate
            }
        }

        if (chosen != null) {
            this.latest_version = chosen.version;
        }

        chosen = null;

        if (this.latest) {
            if (this.latest_version != null) {
                chosen = this.versions[this.latest_version];
            }
            else {
                chosen = this.master; // may be null
            }
        }
        else if (this.version == null) {
            if (this.latest_version != null) {
                chosen = this.latest_version;
            }
            else {
                chosen = this.master; // may be null
            }
        }
        else {
            if (this.version in this.versions) {
                chosen = this.versions[this.version];
            }
            else {
                chosen = null;
            }
        }

        if (chosen != null) {
            this.id = chosen.id;

            /*
                Note: we can have a sparse without a sparse_version
                and sparse_name, since these are actually only populated
                if the sparse resource name is the same.
            */
            this.sparse_version = null;
            this.sparse_name = null;

            if (chosen.change != CHANGE_NOMINAL) {
                this.contentIds.push(chosen.id);
            }

            if (chosen.sparse != null) {
                for (var sparseIndex = 0;
                        sparseIndex < chosen.sparse.length;
                        sparseIndex++) {
                    var sparse = chosen.sparse[sparseIndex];

                    if ((sparseIndex == 0) && (sparse in this.idVersionMap)) {
                        this.sparse_version = this.
                            idVersionMap[sparse].version;
                        this.sparse_name = this.name; // always the same
                    }

                    this.contentIds.push(sparse);
                }
            }

            this.version = chosen.version;
            this.size = chosen.size;
            this.type = chosen.type;
            this.next_versions = chosen.next_versions;
            this.prev_version = chosen.prev_version;
            this.change = chosen.change;
            this.original = chosen.change;
            this.created = chosen.created;
            this.modified = chosen.modified;
            this.adjusted = chosen.adjusted;
            this.executable = chosen.executable;
            this.encryption = chosen.encryption;

            if (chosen.relations == null) {
                this.relations = [];
            }
            else {
                this.relations = chosen.relations.slice();
            }

            this.meta = chosen.meta;

            if (this.manager.encryptManager) {
                // extra step required later
                this.symKeyBuffer = chosen.material;

                if (this.symKeyBuffer != null) {
                    // @todo urgent make this lazy create
                    this.ivBuffer = new Buffer(this.manager.
                        encryptManager.blockIVSize);
                }
            }
        }
    }
    catch (e) {
        tt = e;
    }

    if (TRACE) {
        TRACE("dresource summaryPrivate chosen", chosen);
    }

    if (tt != null) {
        this.closePrivate(tt);
    }
    else if (this.id != null) {
        if ((this.writable && this.change < 0) &&
                !this.opts.termination) {
            this.closePrivate(new Error("immutable resource"));
        }
        else if ((this.change == CHANGE_TERMINATED) &&
                !this.opts.termination) {
            this.closePrivate(null);
        }
        else {
            if (self.change == CHANGE_TERMINATED) {
                self.terminated = true;
            }
            else if (self.change == CHANGE_NOMINAL) {
                self.nominal = true;
            }
            else if (self.change == CHANGE_FIXED) {
                self.fixed = true;
            }

            this.closePrivate();
        }
    }
    else if (!this.create) {
        this.closePrivate(null);
    }
    else if ((this.prev_version != null) &&
            !(this.prev_version in this.versions)) {
        this.closePrivate("invalid previous version: " + this.prev_version);
    }
    else {
        if (this.retryHandler == null) {
            this.retryHandler = this.manager.retryManager.newRetryHandler(
                "resource open retry on " + this.name).
                withRetryFunction(function () {
                    self.openRetryPrivate();
                }).
                withFailureFunction(function (error) {
                    self.callback(error);
                });
        }

        if (this.prev_version == null) {
            this.retryHandler.
                withRewindProperty(this, "prev_version", this.latest_version);
        }

        var prev = this.versions[this.prev_version];

        /*
            Fill up this relations, using any previous
            relations if possible.  Use null as a placeholder
            for entries where our eventual id will go.
        */
        this.relations = [];

        if (prev != null) {
            for (var relationIndex = 0;
                    relationIndex < prev.relations.length;
                    relationIndex++) {
                var prelation = prev.relations[relationIndex];

                if (prelation.vtype == exports.VTYPE.PREV) {
                    this.relations.push({
                            from_id: prelation.from_id, // verbatim
                            vtype: prelation.vtype, // verbatim
                            steps: prelation.steps + 1, // increment
                            via_id: prelation.to_id, // NOT via_id
                            to_id: null, // filled in after reapPrivate
                        });
                }
            }

            this.relations.push({
                    from_id: prev.id,
                    vtype: exports.VTYPE.PREV,
                    steps: 1, // initialize
                    via_id: null, // filled in after reapPrivate
                    to_id: null, // filled in after reapPrivate
                });
        }

        if (this.opts.nominal) {
            // wind back before any other previous versions
            while (prev.change == CHANGE_NOMINAL){
                prev = this.versions[prev.prev_version];
            }

            this.relations.push({
                    from_id: prev.id,
                    vtype: exports.VTYPE.SPARSE,
                    steps: 1, // initialize
                    via_id: null, // filled in after reapPrivate
                    to_id: null, // filled in after reapPrivate
                });

            this.retryHandler.
                // indicates wholly nominal 
                withRewindProperty(this, "change", CHANGE_NOMINAL).
                withRewindProperty(this, "sparse_name", this.name).
                withRewindProperty(this, "sparse_version",
                    this.idVersionMap[prev.id].version).
                withRewindProperty(this, "size", prev.size).
                withRewindProperty(this, "created", prev.created).
                withRewindProperty(this, "modified", prev.modified);
        }
        else {
            this.retryHandler.
                withRewindProperty(this, "size", 0).
                withRewindProperty(this, "created", Date.now()).
                withRewindProperty(this, "modified", this.created).
                withRewindProperty(this, "executable", this.executable);
        }

        if (this.opts.delete) {
            this.retryHandler.
                // indicates logical delete
                withRewindProperty(this, "change", CHANGE_TERMINATED);
        }

        this.retryHandler.
            withRewindProperty(this, "metaChanged", true);

        this.ensureParentsPrivate();
    }
}

Resource.prototype.statPrivate = function() {
    var self = this;

    if (TRACE) {
        TRACE("dresource statPrivate");
    }

    /*
        Really important to clear these three maps/lists here since
        deadlock retries can change the contents between iterations
        (in some implementations).
    */
    this.versions = {};
    this.relations = [];
    this.idVersionMap = {};

    var query = this.manager.newResourceQuery().
        withFixedConn(this.conn, this.writable). // writable -> for update
        withNoAssumptions(). // ie. get everything related to the name.
        withName(this.name); // note: may also use a name hash internally

    /*
        Do not resolve sparse versions - we synthesize this information
        from the entire result set, rather than get the DB to do the
        extra join on it.  The sparse_version and sparse_name results
        are kind of legacy, but needed by Uniflash - may end up asking
        them to be factored out at some point for a better solution.
    */
    query.featureSparseVersions = false;
    query.featureEncryptDetails = true;

    query.invoke(function (error, record) {
            if (TRACE) {
                TRACE("dresource statPrivate -> ", error, record);
            }

            if (error != null) {
                self.closePrivate(error);
            }
            else if (record == null) {
                self.summaryPrivate();
            }
            else if (record.version != null) {
                self.versions[record.version] = record;
                self.idVersionMap[record.id] = record;
            }
            else {
                self.master = record;
            }
        });
}

/**
 * Return a map of versions to previous versions.
 * If non-empty, then the closure (transitive application
 * of previous version) will lead back to exactly one
 * version (the first version).
 */
Resource.prototype.mapVersions = function() {
    var map = {};

    for (var version in this.versions) {
        map[version] = this.versions[version].prev_version;
    }

    return (map);
}

/**
 * Called by the provider framework after creating a new
 * Resource subclass instance.
 */
Resource.prototype.openPrivate = function (callback) {
    this.callback = callback;

    this.openRetryPrivate();
}

/**
 * This gets called when a resource is opened, but also
 * whenever the open fails and needs to be retried.  This
 * can happen in the case of creates.
 */
Resource.prototype.openRetryPrivate = function () {
    var self = this;

    if (this.create || this.writable) {
        this.acquireConnPrivate(this.manager.writableGroup, "openTransaction",
            function (error) {
                if (error != null) {
                    self.closePrivate(error);
                }
                else {
                    self.statPrivate();
                }
            });
    }
    else {
        this.acquireConnPrivate(this.manager.readableGroup, "openTransaction",
            function (error) {
                if (error != null) {
                    self.closePrivate(error);
                }
                else {
                    self.statPrivate();
                }
            });
    }
}

/** 
 * Sent during resource close to update the JSON meta data
 */
Resource.prototype.updateMetaPrivate = function () {
    throw new denum.UnsupportedError();
}

Resource.prototype.updateHeaderPrivate = function () {
    throw new denum.UnsupportedError();
}

/**
 * Change the size of this resource.
 */
Resource.prototype.setSize = function (size) {
    var self = this;

    if (size == this.size) {
        // do nothing
    }
    else if (this.change < 0) {
        throw new Error("immutable resource");
    }
    else {
        this.size = size;
        this.change++;

        if ((this.meta != null) && (this.meta.headers != null) &&
                (this.meta.headers["content-length"] != null)) {
            // This will cause a meta-data flush eventually.
            // Note: size will be coerced to a string in the header.
            this.updateHeaders();
        }
    }
}

/**
 * Allocate the kind of buffer that you should use for read and
 * write blocks.
 */
Resource.prototype.allocBuffer = function () {
    var buffer = new Buffer(this.blockSize);

    buffer.fill(0);

    return (buffer);
}

/**
 * Returns true if this versioned resource is a logical delete.
 */
Resource.prototype.isTermination = function() {
    return (this.change == CHANGE_TERMINATED);
}

/**
 * Returns true if this resource has modifiable content.
 * Note: metadata is always modifiable.
 */
Resource.prototype.isModifiable = function() {
    return (this.change >= 0);
}

/**
 * Return true if this versioned resource is nominal - and has no
 * content of its own.
 */
Resource.prototype.isNominal = function() {
    return (this.change == CHANGE_NOMINAL);
}

Resource.prototype.openReadable = function (opt, callback) {
    throw new denum.UnsupportedError();
}

/**
 * Similar to fs.readFile - calls callback(err, Buffer) if encoding
 * is null, or callback(err, String) otherwise.
 */
Resource.prototype.readContent = function (encoding, callback) {
    if (callback === undefined) {
        return (Q.nfcall(this, encoding)); // shortcut to Q
    }

    var self = this;
    var readable = this.openReadable();
    var result = new Buffer(0);

    readable.on('data', function (buf) {
            result = Buffer.concat([result, buf]); // slow lazy sloppy
        });
    readable.on('error', function (error) {
            callback(error);
        });
    readable.on('end', function () {
            if (encoding != null) {
                try {
                    // we concat this because Buffer sometimes lies
                    result = "" + result.toString(encoding);
                }
                catch (e) {
                    callback(e);
                }
            }
            else {
                // no transform needed
            }

            callback(null, result);
        });
}

/**
 * Supported options:
 * etag: true - provide an etag header
 * headers: true - update last-modified and content-length headers
 * to align with resource.
 */
Resource.prototype.openWritable = function (opt, callback) {
    throw new denum.UnsupportedError();
}

/**
 * Similar to fs.writeFile - calls callback(err) when done
 */
Resource.prototype.writeContent = function (chunk, encoding, callback) {
    if (callback === undefined) {
        return (Q.nfcall(this, chunk, encoding)); // shortcut to Q
    }

    var self = this;

    this.openWritable().end(chunk, encoding, callback);
}

exports.Resource = Resource;

util.inherits(ResourceQuery, dschema.JSONQuery);

function ResourceQuery(manager) {
    if (!(manager instanceof ResourceManager)) {
        throw new RangeError("need ResourceManager");
                
    }

    dschema.JSONQuery.call(this, manager.readableGroup,
        resourceTablePrefix, "headers", "id", "meta");

    this.manager = manager;

    /*
        IMPORTANT NOTE: resource_sql adds a left join to this,
        while resource_file doesn't, because it doesn't support nominal
        versions or sparse content.
    */

    this.featureTerminations = false;
    this.featureAllVersions = false;
    this.featureAssumptions = true;
    this.featureAllTypes = false;
    this.explicitLatestVersion = false;
    this.explicitVersionQuery = false;
}

ResourceQuery.prototype.buildQueryJSON = function() {
    if (this.queryJSON != null) {
        // ignore
    }
    else if (this.cachedQuery != null) {
        this.queryJSON = this.cachedQuery.newResultEmitter(
            this.f.reframe(this.expr, this.f.root("meta")));
    }
    else {
        dschema.JSONQuery.prototype.buildQueryJSON.call(this);
    }

    return (this.queryJSON);
}

ResourceQuery.prototype.newQueryJSON = function() {
    return (dschema.JSONQuery.prototype.newQueryJSON.call(this).
        withSelectField("id").
        withSelectField("type").
        withSelectField("name").
        withSelectField("version").
        withSelectField("size").
        withSelectField("change").
        withSelectField("created").
        withSelectField("modified").
        withSelectField("adjusted").
        withSelectField("executable").
        withSelectField("encryption"));
}

ResourceQuery.prototype.withNoAssumptions = function (type) {
    this.featureAssumptions = false;
    this.featureTerminations = true;
    this.featureAllVersions = true;
    this.featureAllTypes = true;

    return (this);
}

/**
 * This filter allows terminations to appear in the result set.
 */
ResourceQuery.prototype.withTerminations = function () {
    this.featureTerminations = true;

    return (this);
}

/**
 * This filter allows all types to appear in the result set (not just files).
 */
ResourceQuery.prototype.withAllTypes = function () {
    this.featureAllTypes = true;

    return (this);
}

/**
 * This filter allows all versions to appear in the result set.
 */
ResourceQuery.prototype.withAllVersions = function () {
    this.featureAllVersions = true;

    return (this);
}

/**
 * This is just to make older code still run - its the inverse
 * of withAllVersions and is technically no longer needed since
 * its the default.
 */
ResourceQuery.prototype.withLatestVersion = function () {
    this.featureAllVersions = false;
    this.explicitLatestVersion = true;

    return (this);
}

/**
 * Reset the type filtering and choose just a specific type.
 * Note that this cannot be undone by using withAllTypes().
 */
ResourceQuery.prototype.withType = function (type) {
    var f = this.f;

    this.featureAllTypes = true;
    this.withQueryExpr(f.eq(f.record("type"), type));

    return (this);
}

ResourceQuery.prototype.withModifiedSince = function (date) {
    var f = this.f;

    this.withQueryExpr(f.gte(f.record("modified"), dschema.dateAsLong(date)));

    return (this);
}

ResourceQuery.prototype.withModifiedBefore = function (date) {
    var f = this.f;

    this.withQueryExpr(f.lt(f.record("modified"), dschema.dateAsLong(date)));

    return (this);
}

ResourceQuery.prototype.withCreatedSince = function (date) {
    var f = this.f;

    this.withQueryExpr(f.gte(f.record("created"), dschema.dateAsLong(date)));

    return (this);
}

ResourceQuery.prototype.withCreatedBefore = function (date) {
    var f = this.f;

    this.withQueryExpr(f.lt(f.record("created"), dschema.dateAsLong(date)));

    return (this);
}

ResourceQuery.prototype.withName = function (path) {
    var f = this.f;

    this.withQueryExpr(f.eq(f.record("name"), path));

    return (this);
}

/**
 * Query resource by a name prefix.  If your result set is small, but
 * very frequently queried, you can nominate to cache it by passing
 * true for the cache parameter.  Otherwise omit that parameter.
 */
ResourceQuery.prototype.withNamePrefix = function (prefix, cache) {
    var f = this.f;

    var cacheableExpr = f.prefix(f.record("name"), prefix);

    if (cache === true) {
        // special magic
        this.cachedQuery = this.manager.rebuildCachedQuery(prefix,
            cacheableExpr);
    }
    else if (cache == null) {
        this.cachedQuery = this.manager.findCachedQuery(prefix, cacheableExpr);
    }
    else {
        throw new denum.UnsupportedError("unsupported cache param " + cache);
    }

    // the regular way
    this.withQueryExpr(cacheableExpr);

    return (this);
}

ResourceQuery.prototype.withNamePrefixes = function (prefixes) {
    var f = this.f;
    var expr = f.false();

    prefixes.forEach(function (prefix) {
            expr = f.or(expr, f.prefix(f.record("name"), prefix));
        });

    this.withQueryExpr(expr);

    return (this);
}

ResourceQuery.prototype.withParentName = function (parent) {
    var f = this.f;

    this.withQueryExpr(f.prefix(f.record("parentname"), parent));

    return (this);
}

ResourceQuery.prototype.withNamePattern = function (pathPattern) {
    var f = this.f;

    this.withQueryExpr(f.match(f.record("name"), pathPattern));

    return (this);
}

ResourceQuery.prototype.withVersionBefore = function (version) {
    throw new denum.UnsupportedError();

    this.explicitVersionQuery = true; // impl MUST do this

    return (this);
}

ResourceQuery.prototype.withVersionUpTo = function (version) {
    throw new denum.UnsupportedError();

    this.explicitVersionQuery = true; // impl MUST do this

    return (this);
}

ResourceQuery.prototype.withVersionFrom = function (version) {
    throw new denum.UnsupportedError();

    this.explicitVersionQuery = true; // impl MUST do this

    return (this);
}

ResourceQuery.prototype.withVersionAfter = function (version) {
    throw new denum.UnsupportedError();

    this.explicitVersionQuery = true; // impl MUST do this

    return (this);
}

ResourceQuery.prototype.withVersion = function (version) {
    if (version !== null) {
        throw new denum.UnsupportedError();
    }

    this.explicitVersionQuery = true; // impl MUST do this

    return (this);
}

ResourceQuery.prototype.withPrevVersion = function (version) {
    throw new denum.UnsupportedError();

    this.explicitVersionQuery = true; // impl MUST do this

    return (this);
}

ResourceQuery.prototype.withOrderByName = function (ascending) {
    this.buildQueryJSON().withOrderBy("name", ascending);

    return (this);
}

ResourceQuery.prototype.withOrderBySegment = function (ascending) {
    this.buildQueryJSON().withOrderBy("segment", ascending);

    return (this);
}

exports.ResourceQuery = ResourceQuery;

exports.newResourceManager = function (logger, writableGroup,
            readableGroup, retryManager, encryptManager, opts) {
        return (require("./dresource_" + opts.type + ".js").
            newResourceManager(logger, writableGroup, readableGroup,
            retryManager, encryptManager, opts));
    };

/** 
 * The ResourceImporter wraps up most of the boilerplate logic
 * required to update a resource tree from a filesystem tree.
 * Create a new resource importer by calling
 * {@link dinfra.newResourceImporter}(filePath, resourcePrefix).
 * The code in eg/resource-importer.js provides an example of
 * typical usage.
 *
 * @class ResourceImporter
 * @extends EventEmitter
 */
util.inherits(ResourceImporter, events.EventEmitter);

/**
 * This is the internal (private) constructor for the ResourceImporter.
 * Don't use this, use {@link dinfra.newResourceImporter}().
 *
 * @constructs ResourceImporter
 * @private
 * @param {ResourceManager} manager - the resource manager to use
 * @param {string} localTreePath - the filesystem tree path prefix
 * @param {string} resourcePrefix - the resource layer tree path prefix
 */
function ResourceImporter(manager, localTreePath, resourcePrefix) {
    events.EventEmitter.call(this);

    var self = this;

    this.manager = manager;
    this.start = Date.now();
    this.resourcePrefix = resourcePrefix;
    this.lexicalOrder = false; // leave off: mostly used for benchmarking
    this.fileStepper =
        new dfile.FileTreeStepper(localTreePath, this.lexicalOrder).
        on('error', function (error) {
            self.emit('error', error);
        }).
        on('end', function (error) {
            if (TRACE) {
                TRACE("dresource importer end files");
            }

            self.waitFile = false;
            self.endFiles = true;
            self.queueNext();
        }).
        on('result', function (path, stat) {
            if (TRACE) {
                TRACE("dresource importer file result", path);
            }

            self.path = path;
            self.stat = stat;
            self.waitFile = false;
            self.queueNext();
        });
    this.resourceStepper =
        new ResourceStepper(manager, resourcePrefix, this.lexicalOrder).
        on('error', function (error) {
                /**
                 * An error event is called when an error occurs.
                 * No further 'end' or 'result' events are expected
                 * after an error.
                 * @event ResourceImporter#event:error
                 * @param {object} error - the details of the error
                 */
            self.emit('error', error);
        }).
        on('end', function (error) {
            if (TRACE) {
                TRACE("dresource importer end resources");
            }

            self.waitInfo = false;
            self.endInfos = true;
            self.queueNext();
        }).
        on('result', function (path, info) {
            if (TRACE) {
                TRACE("dresource importer resource result", path);
            }

            self.info = info;
            self.rpath = path;
            self.waitInfo = false;
            self.queueNext();
        });
    this.jobs = new dinfra.Jobs().
        on('error', function (error) {
            self.emit('error', error);
        });
    this.info = null;
    this.rpath = null;
    this.stat = null;
    this.path = null;
    this.endFiles = false;
    this.endInfos = false;
    this.lastInfos = false;
    this.resourcesCreated = 0;
    this.resourcesModified = 0;
    this.resourcesDeleted = 0;
    this.contentWritten = 0;
    this.entriesProcessed = 0;
    this.waitNext = true; // waiting for the caller to invoke next()
    this.waitFile = false; // waiting for the fileStepper to queueNext()
    this.waitInfo = false; // waiting for the resourceStepper to queueNext()
    this.extensions = []; // extensions to check for
}

/**
 * Derives an optional Content-Type header given a full resource path name.
 * It is always preferable to provide an explicit content type rather than
 * rely on this.
 */
ResourceImporter.prototype.deriveContentType = function (path) {
    var i = 0;
    var extension = null;

    while ((i < this.extensions.length) &&
            !((path.indexOf((extension = this.extensions[i]).prefix) == 0) &&
            extension.pattern.test(path))) {
        extension = null;
        i++;
    }

    return (extension ? extension.type : null);
}

/**
 * Add a content-type default for the given resource path prefix of
 * and pattern.  If pattern is not a regular expression, it will be
 * treated as a simple text suffix to match.  The type should be
 * a full valid MIME content-type header.
 */
ResourceImporter.prototype.addExtensionMapping = function (prefix,
        pattern, type) {
    if (pattern instanceof RegExp) {
        // OK
    }
    else {
        pattern = new RegExp(denum.escapeRegExp(pattern) + "$");
    }

    this.extensions.push({ prefix: prefix, pattern: pattern, type: type });
}

/**
 * Add a map of text suffixes to content-types as extension mappings
 * for the given prefix (via addExtensionMapping).
 */
ResourceImporter.prototype.addExtensionMap = function (prefix, map) {
    for (var text in map) {
        this.addExtensionMapping(prefix, text, map[text]);
    }
}

/**
 * @private
 */
ResourceImporter.prototype.deriveOpEvent = function (event) {
    if (event.stat == null) {
        event.op = "destroy";
    }
    // this logic repeated in block above - edit to match
    else if (event.stat.isDirectory()) {
        event.op = "ignore";
    }
    else if (event.stat.isSymbolicLink()) {
        event.op = "ignore";
    }
    else if (event.info == null) {
        event.op = "import";
    }
    else if (event.etag != null) {
        if (event.info.meta &&
                event.info.meta.headers && 
                (event.etag == event.info.meta.headers.etag)) {
            event.op = "skip";
        }
        else {
            event.op = "update";
        }
    }
    else if (event.info.modified != event.stat.mtime.getTime()) {
        event.op = "compare";
    }
    else if (event.info.size != event.stat.size) {
        event.op = "compare";
    }
    else {
        event.op = "skip";
    }
}

/**
 * Attempt to match and drive the next entry.
 * @private
 */
ResourceImporter.prototype.queueNext = function () {
    if (TRACE) {
        TRACE("dresource importer queue");
    }

    if (this.waitNext) {
        // wait until the consumer calls next()
        if (TRACE) {
            TRACE("dresource importer   wait consumer");
        }
    }
    else if (!this.endInfos && (this.info == null)) {
        if (!this.waitInfo) {
            // do nothing
            if (TRACE) {
                TRACE("dresource importer   call resourceStepper next");
            }

            this.waitInfo = true;

            this.resourceStepper.next();
        }
        else {
            if (TRACE) {
                TRACE("dresource importer   wait resourceStepper");
            }
        }
    }
    else if (!this.endFiles && (this.stat == null)) {
        if (!this.waitFile) {
            if (TRACE) {
                TRACE("dresource importer   call fileStepper next");
            }

            this.waitFile = true;
            this.fileStepper.next();
        }
        else {
            if (TRACE) {
                TRACE("dresource importer   wait fileStepper");
            }
        }
    }
    else if ((this.info == null) && (this.stat == null)) {
        if (TRACE) {
            TRACE("dresource importer   end both");
        }

        if (this.endQueued) {
            // ignore
        }
        else {
            this.endQueued = true;

            var self = this;

            this.jobs.drain(function () {
                    /**
                     * An end event is called when there are no
                     * more synchronization items and the
                     * internal jobs queue has been exhausted.
                     *
                     * @event ResourceImporter#event:end
                     */
                    self.emit('end', null);
                });
        }
    }
    else {
        if (TRACE) {
            TRACE("dresource importer   item");
        }

        var event = {
            };

        if (this.stat == null) {
            event.path = this.rpath;
            event.info = this.info;
        }
        else if (this.info == null) {
            event.path = this.path;
            event.stat = this.stat;
        }
        else if (this.path < this.rpath) {
            event.stat = this.stat;
            event.etag = this.etag; // can be null for many reasons
        }
        else if (this.path > this.rpath) {
            event.info = this.info;
        }
        else {
            event.stat = this.stat;
            event.etag = this.etag; // can be null for many reasons
            event.info = this.info;
        }

        if (event.info) {
            event.path = this.rpath;
        }
        else {
            event.path = this.path;
        }

        this.deriveOpEvent(event);

        if ((event.op == "compare") && (event.etag == null)) {
            var self = this;
            var stream = this.fileStepper.openReadable(event.path);
            var hash = crypto.createHash("sha1");

            // pause the delivery for now
            this.waitNext = true;

            stream.
                on('error', function (error) {
                    self.emit('error', error);
                }).
                on('data', function (data) {
                    hash.update(data);
                }).
                on('end', function () {
                    self.etag = '"' + hash.digest('hex') + '"';
                }).
                // Very important to do the queue next on the end,
                // otherwise you can end up with too many open files.
                on('close', function () {
                    // unpause the delivery (just wrap around into this
                    // function again).
                    self.waitNext = false;

                    self.queueNext();
                });
        }
        else {
            if (event.stat != null) {
                // clear the prior file stream entry to prime next
                this.path = null;
                this.stat = null;
                this.etag = null;
            }

            if (event.info != null) {
                // clear the prior resource stream entry to prime next
                this.rpath = null;
                this.info = null;
            }

            this.waitNext = true;
            this.entriesProcessed++;

            /**
             * A result event is called for each synchronization item that the
             * importer discovers.  The op property
             * recommends what to do:
             *
             * "skip" means do nothing;
             *
             * "import" means create a new resource;
             *
             * "destroy" means terminate an old resource;
             *
             * "update" means update an existing resource.
             *
             * You can often just pass your result event directly to
             * ResourceImporter#applyStatEvent, which will automatically
             * perform the suggested operation with internal paralellism,
             * including calling ResourceImporter#next appropriately.
             * 
             *
             * @event ResourceImporter#event:result
             * @property {string} path -
             * the relative path in both trees (starts with /)
             * @property {string} op -
             * the kind of synchronization we recommend you do
             * @property {string} info -
             * the resource information from the resource layer (null
             * if the path is not in the resource layer)
             * @property {string} stat -
             * the file information from the file system (null
             * if the path is not in the resource layer)
             * @property {string} etag -
             * the etag calculated for the file (null if the file hash
             * did not need to be calculated)
             */
            this.emit('result', event);
        }
    }
}

/**
 * Use next() to ask the importer for the next item to synchronize.
 * If there is another item to synchronize, it will be notified with
 * the [result]{@link ResourceImporter#event:result} event, otherwise the
 * [end]{@link ResourceImporter#event:end} event
 * will be raised.
 */
ResourceImporter.prototype.next = function () {
    this.waitNext = false;
    this.queueNext();
}

/**
 * Call applyStatEvent() to ask the importer to perform the synchronization
 * suggested by the [result]{@link ResourceImporter#event:result}.  The importer
 * will perform the operation with concurrency.  It will manage the calling
 * of [next()]{@link ResourceImporter#next} at appropriate times to keep
 * jobs going in parallel.  Do not call next() if you call applyStatEvent.
 * @param event - a result event object.
 */
ResourceImporter.prototype.applyStatEvent = function (event) {
    var fn = null;

    if (event.op == "import") {
        fn = this.applyImport;
    }
    else if (event.op == "update") {
        fn = this.applyUpdate;
    }
    else if (event.op == "destroy") {
        fn = this.applyDestroy;
    }
    else {
        fn = null; // do nothing
    }

    if (fn != null) {
        // this is something we make a job for.
        var self = this;

        this.jobs.submit(function (callback) {
                /*
                    This will callback to the jobs handler when the
                    job has completed.
                */
                fn.call(self, event, callback);
            },
            function (error) {
                /*
                    The jobs handler will call this when there is space in
                    the queue again.
                */
                if (error != null) {
                    self.emit('error', error);
                }
                else {
                    self.next();
                }
            });
    }
    else {
        // move to the next immediately, don't make a job for this
        this.next();
    }
}

ResourceImporter.prototype.applyResourceDefaults =
        function (event, resource, callback) {
    //reset the modified time to the origin file time.
    resource.setModified(event.stat.mtime.getTime());
    resource.setExecutable((event.stat.mode & 0100) != 0);

    if (resource.getHeader("Content-Type") == null) {
        var type = this.deriveContentType(resource.name);

        if (type != null) {
            resource.setHeader("Content-Type", type);
        }
    }

    callback();
}

ResourceImporter.prototype.applyImportResource =
        function (event, resource, callback) {
    var self = this;
    var writable = resource.openWritable({
            etag: true,
            headers: true,
            created: event.stat.mtime.getTime(),
        });
    var readable = this.fileStepper.openReadable(event.path);

    readable.pipe(writable).
        on('error', function (error) {
            callback(error);
        }).
        on('finish', function () {
            self.resourcesCreated++;
            self.contentWritten += resource.size;

            self.applyResourceDefaults(event, resource,
                function (error) {
                    if (error != null) {
                        callback(error);
                    }
                    else {
                        resource.close(callback);
                    }
                });
        });
}

ResourceImporter.prototype.applyImport = function (event, callback) {
    var self = this;

    dinfra.openResource(this.resourcePrefix + event.path, {
            create: true,
        },
        function (error, resource) {
            if (error != null) {
                console.log("ERROR", error.stack);
                self.emit('error', error);
            }
            else if (resource == null) {
                // @todo urgent fix
                throw new Error("create resource cannot be null: " +
                    event.path);
            }
            else {
                self.applyImportResource(event, resource, callback);
            }
        });
}

ResourceImporter.prototype.applyUpdateResource =
        function (event, resource, callback) {
    var self = this;
    var writable = resource.openWritable({
            etag: true,
            headers: true,
            created: event.stat.mtime.getTime(),
        });
    var readable = this.fileStepper.openReadable(event.path);

    readable.pipe(writable).
        on('error', function (error) {
            callback(error);
        }).
        on('finish', function () {
            self.resourcesUpdated++;
            self.contentWritten += resource.size;

            //reset the modified time to the origin file time.
            resource.setModified(event.stat.mtime.getTime());
            resource.setExecutable((event.stat.mode & 0100) != 0);

            resource.close(function (error) {
                    callback(error);
                });
        });
}

ResourceImporter.prototype.applyUpdate = function (event, callback) {
    var self = this;

    dinfra.openResource(this.resourcePrefix + event.path, {
            writable: true,
        },
        function (error, resource) {
            if (error != null) {
                console.log("ERROR", error.stack);
                self.emit('error', error);
            }
            else if (resource == null) {
                // @todo urgent fix
                throw new Error("existing resource cannot be null: " +
                    event.path);
            }
            else {
                self.applyUpdateResource(event, resource, callback);
            }
        });
}

ResourceImporter.prototype.applyDestroy = function (event, callback) {
    dinfra.destroyResource(this.resourcePrefix + event.path, null, callback);
}

/**
 * Generate some statistics, including job concurrency, processing
 * rates and so on.
 */
ResourceImporter.prototype.generateStats = function () {
    var stats = this.jobs.generateStats();
    var elapsed = stats.elapsed.value;

    stats.entries = { value: this.entriesProcessed, measure: "" };
    stats.created = { value: this.resourcesCreated, measure: "" };
    stats.wrote = { value: this.contentWritten, measure: "" };
    stats.contentRate = { value: Math.floor(this.contentWritten /
            elapsed) / 1e3, measure: "MB/s"
        };
    stats.entryRate = { value: Math.floor(this.entriesProcessed /
                (elapsed / 1e3)), measure: "/s" };

    return (stats);
}

util.inherits(ResourceStepper, events.EventEmitter);

function ResourceStepper(manager, resourcePrefix, lexicalOrder) {
    events.EventEmitter.call(this);

    this.manager = manager;
    this.queries = []; // a list of tree-traversal queries
    this.ahead = {}; // a map of current lookahead queries
    this.count = 0; // count of current lookahead queries
    this.limit = 10; // limit of lookahead queries
    this.dirs = []; // known dirs available for look-ahead (sorted)
    this.waitNext = true;
    this.resourcePrefix = resourcePrefix;
    this.prefixLength = resourcePrefix.length;
    this.lexicalOrder = !!lexicalOrder;

    this.pushQueryPrivate(resourcePrefix);
}

ResourceStepper.prototype.endPrivate = function () {
    /*
        Pop all completed queries.
    */
    while ((this.queries.length > 0) &&
            this.queries[this.queries.length - 1] == null) {
        this.queries.pop();
    }

    if (this.waitNext) {
        // do nothing
    }
    else {
        this.waitNext = true;
        this.next();
    }
}

ResourceStepper.prototype.next = function () {
    if (this.waitNext) {
        this.waitNext = false;

        if (this.queries.length == 0) {
            this.emit('end');
        }
        else {
            this.queries[this.queries.length - 1].next();
        }
    }
}

ResourceStepper.prototype.postResultPrivate = function (result) {
    var path = result.name.substring(this.prefixLength);

    this.waitNext = true;

    if (!this.lexicalOrder) {
        if (result.type == exports.RTYPE.DIR) {
            this.pushQueryPrivate(result.name);
        }
    }

    this.emit('result', path, result);
}

ResourceStepper.prototype.pushQueryPrivate = function (parentName) {
    var query = this.ahead[parentName];

    if (query == null) {
        query = new ResourceStepperQuery(this, parentName);
    }
    else {
        var index = denum.stringSearch(this.dirs, parentName);

        if (index >= 0) {
            this.dirs.splice(index, 1);
        }
    }

    query.joinTree();
}

ResourceStepper.prototype.queueAhead = function () {
    while ((this.dirs.length > 0) && (this.count < this.limit)) {
        new ResourceStepperQuery(this, this.dirs.splice(0, 1)[0]);
    }
}

function ResourceStepperQuery(stepper, parentName) {
    this.stepper = stepper;
    this.query = stepper.manager.newResourceQuery();
    this.parentName = parentName;
    this.depth = -1; // not pushed yet
    this.cache = [];
    this.index = 0;
    this.limit = 3; // item look-ahead limit
    this.waitNext = true;
    this.ended = false;

    stepper.ahead[parentName] = this;
    stepper.count++; // one for each extant query

    if (stepper.lexicalOrder) {
        this.query.
            withNoBatching().
            withNamePrefix(parentName).
            withOrderByName(true); // ascending
    }
    else {
        this.query.
            withParentName(parentName).
            withOrderBySegment(true); // ascending
    }

    var self = this;

    this.query.
        withAllTypes().
        on('error', function (error) {
            self.stepper.emit('error', error);
        }).
        on('result', function (result) {
            self.onResult(result);
        }).
        on('end', function () {
            self.onEnd();
        }).
        next(); // kick it off
}

ResourceStepperQuery.prototype.joinTree = function () {
    delete this.stepper.ahead[this.parentName];

    this.depth = this.stepper.queries.length;
    this.stepper.queries.push(this);
}

ResourceStepperQuery.prototype.onEnd = function () {
    if (!this.ended) {
        this.ended = true;

        if (this.depth < 0) {
            --this.stepper.count;
        }

        this.stepper.queueAhead();
        this.queueNext();
    }
}

ResourceStepperQuery.prototype.onResult = function (result) {
    this.cache.push(result);

    if (this.cache.length < this.limit) {
        this.query.next(); // consume more results into the look-ahead cache
    }

    if (!this.stepper.lexicalOrder) {
        if (result.type == exports.RTYPE.DIR) {
            denum.stringSort(this.stepper.dirs, result.name);
        }
    }

    this.queueNext();
}

ResourceStepperQuery.prototype.queueNext = function () {
    if (this.waitNext) {
        // keep queued
    }
    else if (this.index < this.cache.length) {
        this.waitNext = true;
        this.stepper.postResultPrivate(this.cache[this.index++]);

        if (this.index >= (this.limit >> 1)) { // at half limit
            if (!this.ended) {
                if (this.cache.length >= this.limit) {
                    this.query.next();
                }
            }

            this.cache.splice(0, this.index);

            this.index = 0;
        }
    }
    else if (this.ended) {
        if (this.depth >= 0) {
            this.stepper.queries[this.depth] = null;
        }

        this.stepper.endPrivate();
    }
    else {
        // keep waiting for more results
    }
}

ResourceStepperQuery.prototype.next = function () {
    this.waitNext = false;
    this.queueNext();
}

exports.ResourceStepper = ResourceStepper;

