// Copyright (C) 2015-2016 Texas Instruments Incorporated - http://www.ti.com/
const util = require('util');
const djson = require('./djson');
const stringifier = new djson.Stringify(null, 4);
const dschema = require('./dschema');
const denum = require('./denum');
var fs = null; // set when needed by file drain
var path = null; // set when needed by file drain
var schema = null;
const spool = []; // messages are added here
const logs = {}; // a map of origins to logs
const flushers = []; // callbacks to call when flushed
var drain = undefined; // null to indicate no spool, else spool is pending
var opts = null;
var DEBUG = null; // set to console.log to debug, null otherwise.
var writableGroup = null;
var readableGroup = null;
var origin = null;
var tablePrefix = null;
var messageTable = null;
var jsonTablePrefix = null;
var alwaysToConsole = false; // always log messages to console (even if db)
var captureFrameInfo = false; // show frame information in messages

// simple tuning parameters:
const delay = 200; // ms: delay between message and log flush
const afterFailureDelay = 800; // ms
const afterDeadlockDelay = 300; // ms
const maxBatchSize = 512;
/**
 * The very last log that was flushed successfully (ie. confirmed committed
 * to storage).
 */
var lastFlushedLog = null;

// these are priorities corresponding to syslog.h, upt to DEBUG ...
// the other terms come from java.util.logging.
exports.PRIORITY = denum.cardinals(
    "EMERGENCY", // EMERG
    "ALERT",
    "CRITICAL", // CRIT
    "ERROR", // ERR
    "WARNING",
    "NOTICE",
    "INFO",
    "DEBUG",
    "FINE",
    "FINER",
    "FINEST");

// support coders coming from other environments ...
var FUNCTION_ALIASES = {
        "warning": [ "warn" ],
        "critical": [ "crit", "exception" ],
        "info": [ "information", "log" ],
        "fine": [ "trace" ],
        "finer": [ "tracefiner" ],
        "finest": [ "tracefinest" ],
        "emergency": [ "emerg" ],
        "alert": [ "fatal" ],
        "error": [ "err" ],
    };

// these are from syslog.h, but divided by 8 - remember to << 3 to syslog
exports.FACILITY = denum.cardinals(
    "KERN",
    "USER",
    "MAIL",
    "DAEMON",
    "AUTH",
    "SYSLOG",
    "LPR",
    "NEWS",
    "UUCP",
    "CRON",
    "AUTHPRIV",
    "FTP",
    "LOCAL0",
    "LOCAL1",
    "LOCAL2",
    "LOCAL3",
    "LOCAL4",
    "LOCAL5",
    "LOCAL6",
    "LOCAL7");


function configure(log, config, anOrigin, aTablePrefix,
        aWritableGroup, aReadableGroup, callback) {
    origin = anOrigin;

    if (config != null) {
        if (config.console) {
            alwaysToConsole = true;
        }

        if (config.indent != null) {
            stringifier.shift = config.indent;
        }

        if (config["indent-error"] != null) {
            stringifier.shiftError = config["indent-error"];
        }

        if (config.style == "loose") {
            stringifier.looseFrames = true;
            stringifier.looseTop = true;
            stringifier.looseNames = true;
        }
    }

    if ((config != null) && (config["base-path"] != null)) {
        drain = new FileDrain(config);

        flush(0, function () {
                callback(null);
            });
    }
    else if (aTablePrefix != null) {
        tablePrefix = aTablePrefix;
        exports.tablePrefix = aTablePrefix;
        messageTable = tablePrefix + "messages";
        jsonTablePrefix = tablePrefix + "json";
        writableGroup = aWritableGroup;
        readableGroup = aReadableGroup;

        exports.readableGroupProtected = readableGroup;

        dschema = require('./dschema');
        schema = require('./dlog_schema.json');

        if (writableGroup == null) {
            drain = null; // explicit null means no spool
            spool.splice(0, spool.length); // clear spool

            flush(0, function () {
                    callback(null);
                });
        }
        else {
            new Configure(log, callback).openConnection();
        }
    }
    else {
        drain = null; // explicit null means no spool
        spool.splice(0, spool.length); // clear spool

        flush(0, function () {
                callback(null);
            });
    }
}

function Configure(log, callback) {
    this.log = log;
    this.callback = callback;
    this.conn = null;
    this.errors = [];
}

Configure.prototype.close = function () {
    var self = this;

    if (this.conn != null) {
        this.conn.close(function (error) {
                self.conn = null; // clear it regardless

                if (error != null) {
                    self.errors.push(error);
                }

                self.close();
            });
    }
    else if (this.errors.length > 0) {
        this.callback(this.errors);
    }
    else {
        drain = new DBDrain();

        flush(0, self.callback);
    }
}

Configure.prototype.openConnection = function () {
    var self = this;

    writableGroup.openConnection(function (error, aConn) {
            if (error != null) {
                self.errors.push(error);
                self.close();
            }
            else {
                self.conn = aConn;
                self.maintainJSON();
            }
        });
}

Configure.prototype.maintainJSON = function () {
    var self = this;

    writableGroup.maintainSchema(this.conn, jsonTablePrefix,
        writableGroup.getJSONSchema(), true, // upgrade
        function (error, warnings) {
            for (var i = 0; i < warnings.length; i++) {
                self.log.warning(warnings[i]);
            }

            if (error != null) {
                self.errors.push(error);
                self.close();
            }
            else {
                self.maintainLogging();
            }
        });
}

Configure.prototype.maintainLogging = function () {
    var self = this;

    writableGroup.maintainSchema(this.conn, tablePrefix, schema, true,
        function (error, warnings) {
            for (var i = 0; i < warnings.length; i++) {
                self.log.vwarning(warnings[i]);
            }

            if (error != null) {
                self.errors.push(error);
                self.close();
            }
            else {
                self.close();
            }
        });
}

function notifyFlushers() {
    flushers.splice(0).forEach(function (flusher) {
            setImmediate(flusher);
        });
}

function flush(delay, callback) {
    if (callback != null) {
        flushers.push(callback);
    }

    if (spool.length == 0) {
        notifyFlushers(); // tell the flushers what's up
    }
    else if (drain == null) {
        // no db or file setup yet, stay unflushed
    }
    else {
        drain.startWithin(delay); // may advance
    }
}

function filterFrame(stack, name, loc) {
    var store;

    if (stack.list.length == 0) {
        store = true;
    }
    else if (stack.list.length == 2) {
        store = false;
    }
    else if (loc == "anonymous function") {
        store = false;
    }
    else {
        const ref = stack.list[0].loc;
        const l = Math.min(ref.length, loc.length);
        var i = 0;
        var c0;
        var c1;
        var seen = false;

        while ((i < l) && // either the characters are the same ...
                (((c0 = ref.charCodeAt(i)) === (c1 = loc.charCodeAt(i))) ||
                (seen && // or they are digits and we've seen a :
                (c0 >= 48) && (c0 < 58) && // range of digits
                (c1 >= 48) && (c1 < 58)))) { // range of digits
            if (c0 === 58) { // colon
                seen = true;
            }
            else if (c0 !== c1) {
                // must be a digit, so seen must remain true
            }
            else if ((c0 >= 48) && (c0 < 58)) {
                // is a digit - seen won't change
            }
            else {
                seen = false; // reset seen
            }

            i++;
        }

        if (i == l) {
            store = false;
        }
        else {
            store = !seen; // if we've seen a colon
        }
    }

    return (store);
}

function captureFrame() {
    // This is a hack - it executes slowly, so don't use in production.
    return (new djson.Stack(new Error("X").stack, filterFrame).list[1]);
}

function Logger(service, facility, priority) {
    this.service = service;
    this.facility = facility;
    this.priority = priority;
}

/*
    Set the priority on this logger.
*/
Logger.prototype.setPriority = function(priority) {
    this.priority = priority;
}
/*
    All logs are ultimately delivered with vmessage.
*/
Logger.prototype.vmessage = function(priority, args) {
    var message;

    if (priority <= this.priority) {
        message = new Message(Date.now(), priority, this.facility,
            origin, this.service, args);

        if (drain !== null) {
            // unless the drain has been explicitly initialized to null,
            // the message always goes to the spool
            spool.push(message);
        }

        if ((drain == null) || alwaysToConsole) {
            if (captureFrameInfo) {
                try {
                    message.frame = captureFrame();
                }
                catch (e) {
                    console.log("logger implementation failure", e);
                }
            }

            message.applyTo(console, console.log);
        }

        if (drain == null) {
            // do nothing here
        }
        else {
            drain.startWithin(delay); // may advance
        }
    }
    else {
        message = null;
    }

    return (message);
}

/*
    This sets up two functions for the given priority.  For example,
    if the priority is INFO, then it will set up functions:
    info(arg...) which calls vmessage(INFO,[args...]) and
    vinfo(args) which calls vmessage(INFO,args).
*/
Logger.prototype.defineFunctions = function(priority) {
    var varName = exports.PRIORITY.nameOf(priority);
    var name = varName.toLowerCase();

    Logger.prototype[name] = function () {
            var args = [];

            while (args.length < arguments.length) {
                args.push(arguments[args.length]);
            }

            return (this.vmessage(priority, args));
        };

    if (name in FUNCTION_ALIASES) {
        var self = this;

        FUNCTION_ALIASES[name].forEach(function (alias) {
                Logger.prototype[alias] = Logger.prototype[name];
            });
    }

    Logger.prototype["v" + name] = function () {
            var args;

            if ((arguments.length != 1) ||
                    !((args = arguments[0]) instanceof Array)) {
                throw new Error("v" + name + " requires exactly 1 array arg");
            }

            return (this.vmessage(priority, args));
        };
}

/*
    Sets up Logger.prototype.info, warning etc. 
    as well as vinfo, vwarning etc.
*/
for (var priority = 0; priority < exports.PRIORITY.list.length; priority++) {
    Logger.prototype.defineFunctions(priority);
}

function Message(stamp, priority, facility, origin, service, args) {
    this.stamp = stamp;
    this.priority = priority;
    this.facility = facility;
    this.origin = origin;
    this.service = service;
    this.args = args;
}

/*
    Used for writing to console reporting from remote systems.
*/
Message.prototype.applyFullTo = function(owner, fn) {
    fn.call(owner, new Date(this.stamp).toISOString(), 
        exports.PRIORITY.nameOf(this.priority),
        exports.FACILITY.nameOf(this.facility),
        this.origin,
        this.service,
        this.id == null ? "-" : this.id,
        stringifier.resultOfValue(null, this.args));
}

/*
    Used for writing to console reporting from local system,
    including when origin is not yet defined.
*/
Message.prototype.applyTo = function(owner, fn) {
    fn.call(owner, new Date(this.stamp).toISOString(), 
        exports.PRIORITY.nameOf(this.priority),
        exports.FACILITY.nameOf(this.facility),
        // do not display origin, its not valid until configure()
        this.service,
        (this.id != null ? this.id : // ids are only set on db stored things
        (this.frame == null ? "-" : // caller frames are never stored in db
        (this.frame.loc + ":" + this.frame.name + "()"))),
        stringifier.resultOfValue(null, this.args));
}

function Drain() {
    this.waiting = null;
    this.wakeup = 0;
    this.delay = 0;
    this.errors = [];
    this.span = 0;
    this.queued = false;
    this.failing = false;
    this.cancels = 0;
    this.invocations = 0; // used for debugging, counts invocations
}

Drain.prototype.startWithin = function (delay) {
    if (this.queued && (this.delay <= delay)) {
        // don't bother to check - just causes contention
    }
    else {
        var now = Date.now();
        var wake = now + delay;

        if (this.queued && (this.wakeup < wake)) {
            // don't bother to requeue
        }
        else if (this.queued && (this.waiting == null)) {
            // don't interrupt DB activity
        }
        else {
            if (this.waiting != null) {
                clearTimeout(this.waiting);
                this.waiting = null;
                this.cancels++;
            }

            var self = this;
            var hook = function () {
                    self.cancels = 0;
                    self.waiting = null;
                    self.beginAppend();
                };

            this.queued = true;
            this.wakeup = wake;
            this.delay = delay; // reporting delay, not actual delay

            if (delay <= 0) {
                delay = 1; // at least some delay
            }

            this.waiting = setTimeout(hook, delay);
        }
    }
}

Drain.prototype.resetAppend = function (deadlock) {
    this.errors = [];
    this.span = 0;
    this.queued = false;

    if (deadlock) {
        /*
            In the case of deadlocks, we don't really care, since
            they are a normal part of operation, so we don't increment
            the failing and we only wait the deadlock delay.  There
            is no alert to the console here.
        */

        this.startWithin(afterDeadlockDelay);
    }
    else {
        /*
            In the case of other failures, we should note it on the
            console - this likely indicates the start of a DB
            failover condition.  The delay after a failure is longer,
            since we don't want to hammer the infrastructure while
            failover is in place.  Note also, that the post failure
            delay increases linearly with the enumber of failures.  This
            is adequate for logging.
        */
        if (this.failing++ == 0) {
            console.log("log flushes failing;",
                "will message again on success");
        }

        this.startWithin(afterFailureDelay * this.failing);
    }
}

Drain.prototype.endAppend = function () {
    if (this.failing != 0) {
        console.log("log flushes now succeeeding after",
            this.failing, "failures (no messages lost)");
        this.failing = 0;
    }

    if (this.span > 0) {
        lastFlushedLog = spool[this.span - 1];
    }

    spool.splice(0, this.span); // remove all written log messages
    this.span = 0;

    if (spool.length > 0) {
        this.beginAppend(); // go again, immediately
    }
    else {
        this.queued = false;
        notifyFlushers();
    }
}

Drain.prototype.flushQueue = function () {
    var inserts = [];

    // readjust for whole spool to date, up to the maximum batch size
    this.span = Math.min(spool.length, maxBatchSize);

    for (var i = 0; i < this.span; i++) {
        var message = spool[i];

        // clean up origin of messages
        if (message.origin == null) {
            message.origin = origin;
        }

        inserts.push([message.stamp, message.priority, message.facility,
            message.origin, message.service]);
    }

    if (inserts.length == 0) {
        this.flushQueueCleanup();
    }
    else {
        this.flushQueueStart(inserts);
    }
}

function FileDrain(config) {
    fs = require('fs');
    path = require('path');

    this.basePath = config["base-path"];
    this.isoStampWidth = config["iso-stamp-width"];

    if (this.isoStampWidth == null) {
        this.isoStampWidth = 1;
    }
    else {
        this.isoStampWidth = Math.floor(1 * this.isoStampWidth);
    }

    this.isoStampWidth = Math.max(10, Math.min(23, this.isoStampWidth));

    this.filesToKeep = config["files-to-keep"];

    if (this.filesToKeep == null) {
        this.filesToKeep = 7;
    }
    else {
        this.filesToKeep = Math.floor(1 * this.filesToKeep);
    }

    this.filesToKeep = Math.max(2, Math.min(100, this.filesToKeep));

    var now = Date.now();
    var presentStamp = this.stampForUnixMS(now);
    var day2 = 1000 * 3600 * 24 * 2;
    var from = now - day2; // at least two days
    var to = now;

    while (from != to) {
        var mid = Math.floor((from + to) / 2);

        if (this.stampForUnixMS(mid) != presentStamp) {
            from = mid + 1;
        }
        else {
            to = mid;
        }
    }

    var begin = from;

    from = now;
    to = now + day2;

    while (from != to) {
        var mid = Math.ceil((from + to) / 2);

        if (this.stampForUnixMS(mid) != presentStamp) {
            to = mid - 1;
        }
        else {
            from = mid;
        }
    }

    var end = to;

    this.stampMS = end - begin + 1;

/* DEBUG trace
    console.log("cycling logs every", this.stampMS, "and keeping",
        this.filesToKeep, "files");
*/
}

FileDrain.prototype = new Drain();

FileDrain.prototype.beginAppend = function () {
    this.flushQueue(); // always ready, just flush queue
}

/**
 * This is called when the append file name changes (and on startup).
 */
FileDrain.prototype.flushQueueMaint = function () {
    var self = this;
    var dir = path.dirname(this.basePath);
    var begin = path.basename(this.basePath);
    var end = ".log";
    var acceptable = {};
    var now = Date.now();

    for (var i = -1; i < this.filesToKeep; i++) { // about a week
        acceptable[path.basename(this.fileNameForUnixMS(
            now - i * this.stampMS))] = false;
    }

    fs.readdir(dir, function (error, files) {
            if (error != null) {
                // just ignore it - we've already added the results
                self.flushQueueCleanup(null);
            }
            else {
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];

                    if (file.indexOf(begin) != 0) {
                        // ignore
                    }
                    else if (file.lastIndexOf(end) != file.length -
                            end.length) {
                        // ignore
                    }
                    else if (file in acceptable) {
                        // keep
                    }
                    else {
                        console.log("removing old log file", file);

                        fs.unlink(path.join(dir, file),
                            function (error) {
                                // ignore
                            });
                    }
                }

                self.lastFileName = self.fileName;
                self.flushQueueCleanup(null);
            }
        });
}

FileDrain.prototype.stampForUnixMS = function (ms) {
    return (new Date(ms).toISOString().substring(0,
            this.isoStampWidth));
}

FileDrain.prototype.fileNameForUnixMS = function (ms) {
    return (this.basePath + "-" + this.stampForUnixMS(ms) + ".log");
}

FileDrain.prototype.flushQueueStart = function (inserts) {
    var self = this;
    var text = "";

    this.fileName = this.fileNameForUnixMS(Date.now());

    for (var i = 0; i < this.span; i++) {
        var log = spool[i];

        if (this.consoleStyle) {
            text += 
                new Date(log.stamp).toISOString() +
                exports.PRIORITY.nameOf(log.priority) +
                exports.FACILITY.nameOf(log.facility) +
                log.service +
                stringifier.resultOfValue(null, log.args);
        }
        else {
            var slog = {
                    stamp: new Date(log.stamp).toISOString(), 
                    priority: exports.PRIORITY.nameOf(log.priority),
                    facility: exports.FACILITY.nameOf(log.facility),
                    service: log.service,
                    args: log.args
                };

            text += stringifier.resultOfValue(null, slog);
            text += ",\n";
        }
    }

    fs.appendFile(this.fileName, text, { encoding: "UTF-8" },
        function (error) {
            if (error != null) {
                self.flushQueueCleanup(error);
            }
            else if (self.lastFileName != self.fileName) {
                self.flushQueueMaint();
            }
            else {
                self.flushQueueCleanup(null);
            }
        });
}

FileDrain.prototype.flushQueueCleanup = function (error) {
    var self = this;

    if (error != null) {
        this.errors.push(error);
    }
    else if (this.errors.length > 0) {
        // ignore
    }

    if (this.writable != null) {
        /*
            Clearing the writable before the cancel and close
            is a robustness feature that kicks in when there
            are re-entrancy problems and ensures proper sequencing.
            In normal, correct operation, it can be deferred to the
            close callback.
        */
        var writable = this.writable;

        this.writable = null;

        writable.end(null, null, function (error) {
                if (error != null) {
                    self.errors.push(error);
                }

                self.flushQueueCleanup();
            });
    }
    else if (this.errors.length > 0) {
        this.resetAppend(false); // not a deadlock
    }
    else {
        this.endAppend();
    }
}

function DBDrain() {
    this.conn = null;
}

DBDrain.prototype = new Drain();

DBDrain.prototype.beginAppend = function () {
    var self = this;

    if (this.conn != null) {
        throw new Error("illegal state");
    }

    writableGroup.openTransaction(function (error, conn) {
            if (error != null) {
                self.errors.push(error);
                self.flushQueueCleanup();
            }
            else {
                self.conn = conn;
                self.flushQueue();
            }
        });
}

DBDrain.prototype.flushQueueCleanup = function (error) {
    var self = this;

    if (error != null) {
        this.errors.push(error);
    }
    else if (this.errors.length > 0) {
        // ignore
    }
    /*
    // use this to emulate DB failures
    else if (this.invocations++ % 10 < 3) {
        this.errors.push("force failure");
    }
    */

    if (this.conn != null) {
        /*
            Clearing the connection before the cancel and close
            is a robustness feature that kicks in when there
            are re-entrancy problems and ensures proper sequencing.
            In normal, correct operation, it can be deferred to the
            close callback.
        */
        var conn = this.conn;

        this.conn = null;

        if (this.errors.length > 0) {
            conn.cancel();
        }

        conn.close(function (error) {
                if (error != null) {
                    self.errors.push(error);
                }

                self.flushQueueCleanup();
            });
    }
    else if (this.errors.length > 0) {
        // this is created to check for deadlocks ...
        var queryError = writableGroup.queryErrors(this.errors);

        // reset, sleep and acquire conn ...
        this.resetAppend(queryError.deadlock);
    }
    else {
        this.endAppend();
    }
}

DBDrain.prototype.flushQueueJSON = function () {
    var self = this;
    var inserts = require('./dschema_sql').
        openDecompose(writableGroup, this.conn,
                jsonTablePrefix, function(error) {
            // always called with an error
            self.errors.push(error);
        });

    for (var i = 0; (i < this.span) && (this.errors.length == 0); i++) {
        var message = spool[i];

        inserts.sendArrayScope(message.jsonId, message.args);
    }

    inserts.close(function (error) {
            self.flushQueueCleanup(error);
        });
}

DBDrain.prototype.reapInserts = function () {
    /*
        This returns the first automatic insert id generated
        in the previous command in the same transaction.
        It needs to be captured and then inremented forward
        over the stored messages.
    */
    var self = this;

    writableGroup.reapLastInsert(this.conn, function (error, last) {
            if (error != null) {
                self.flushQueueCleanup(error);
            }
            else {
                for (var i = 0; i < self.span; i++) {
                    spool[i].jsonId = last++;
                }

                self.flushQueueJSON();
            }
        });
}

DBDrain.prototype.flushQueueStart = function (inserts) {
    var self = this;
    var query = this.conn.query("INSERT INTO " + messageTable +
        " (`stamp`, `priority`, `facility`, `origin`, `service`) " +
        "VALUES ?", [inserts]);

    query.on('error', function (error) {
            self.errors.push(error);
        });
    query.on('end', function (error) {
            if (error != null) {
                self.errors.push(error);
            }

            if (self.errors.length > 0) {
                console.log(self.errors, "while executing", query.sql);

                self.flushQueueCleanup();
            }
            else {
                self.reapInserts();
            }
        });
}

exports.logger = function (origin, facility) {
    var result;

    if (facility == null) { // either undefined or null
        facility = exports.FACILITY.DAEMON; // sort of unix service default
    }

    exports.FACILITY.ensureValid(facility);

    if (origin in logs) {
        result = logs[origin];

        if (result.facility !== facility) {
            throw new Error("inconsistent facility: " + facility +
                " != " + result.facility);
        }
    }
    else {
        result = new Logger(origin, facility, exports.PRIORITY.FINEST);

        logs[origin] = result;
    }

    return (result);
};

exports.isFlushed = function () {
        return (spool.length == 0);
    };
exports.flush = flush;
exports.console = function (opts) {
        alwaysToConsole = true;

        if (opts != null) {
            if (opts.frame) {
                captureFrameInfo = true;
            }
        }
        else {
            captureFrameInfo = true;
        }
    };
exports.configure = configure;
exports.getFlushedLogId = function () {
        return (lastFlushedLog != null ? lastFlushedLog.jsonId : null);
    };
exports.getFlushedLogStamp = function () {
        return (lastFlushedLog != null ? lastFlushedLog.stamp : null);
    };
exports.Message = Message; // really should be internal/protected

