/**
 * rexlog - simple logger
 *
 * osohm, 8/12/2014
 */

'use strict';

var fs = require('fs');
var path = require('path');
var req;
var res;

var levels = {
    off: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,

    // ti_logger alternatives:
    trace: 4,
    tracefiner: 5,
    tracefinest: 6
};

var configFile = path.join('config', 'rexlog.json');

module.exports = RexLog; // object that's returned by a require call

// 'static', i.e. accessible by all instances of Rexlog
RexLog.transports = null;

/**
 * Add transports defined in rexlog.json and another transport, if provided.
 *
 * Transports configs in the json file are only read once. Changing transport configs in the file will NOT affect
 * the current configuration.
 *
 * @param name - name of the transport provided in the 'transport' argument
 * @param transport - object with the following properties:
 *      @property {String} filename or null
 *      @property {Number} maxFileSize: in bytes, null - no limit (default)
 */
RexLog.addTransports = function(name, transport) {
    // initially add all transports defined in the json file
    if (RexLog.transports == null) {
        var json = fs.readFileSync(configFile, 'utf8');
        var configs = JSON.parse(json);
        RexLog.transports = configs['transports'];
    }

    // add the provided transport, if it exists
    if (transport != null) {
        RexLog.transports[name] = transport;
    }
}

/**
 * Create a new logger. If just a name is provided the configuration options are read from rexlog.json.
 *
 * Changing the json file during run-time will re-configure the logger.
 *
 *  @param {String} name: logger name
 *  @param {Object} config: e.g. { transport: 'myLogFile', level: 'verbose', console: false }
 *      @property {String} transport: name of the transport to use
 *      @property {String} level: off, error, warn, info, verbose (or trace), debug (or tracefiner)
 *      @property {Boolean} console: true (default), false
 *
 * @constructor
 */
function RexLog(name, loggerConfig) {
    var that = this;
    this.name = name;
    if (loggerConfig == null) {
        this.readLoggerConfig(name);
        fs.watch(configFile, {persistent: true}, function () {
            that.readLoggerConfig(name);
        });
    } else {
        this.config = loggerConfig;
    }

}

RexLog.setReq = function(_req) {
    req = _req;
}

RexLog.setRes = function(_res) {
    res = _res;
}

RexLog.prototype.readLoggerConfig = function(name) {
    var json = fs.readFileSync(configFile, 'utf8');
    var configs = JSON.parse(json);
    this.config = configs['loggers'][name];
    this.transport = RexLog.transports[this.config.transport];   // get the associated transport
}

/**
 * Log API (winston compatible signature)
 * @param {String} log level
 * @param {String} message
            });
 */
RexLog.prototype.log = function(level, msg) {
    if (this.config.level !== 0 && levels[level] <= levels[this.config.level]) {
        // construct log message
        var date = new Date();
        var timestamp = date.toString();
        var logMsg = timestamp + ' ' + this.name + ' ' + level + ': ' + msg; // TODO: consider using util.format for better performance?

        // check max file size if configured (TODO: not tested yet)
        if (this.transport.maxFileSize != null && (this.transport.timeLastFileSizeCheck == null || (date.getTime() - this.transport.timeLastFileSizeCheck) > 5000)) {
            this.transport.timeLastFileSizeCheck = date.getTime();
            var stat = fs.statSync(this.transport.filename);
            if (stat.size > this.transport.maxFileSize) {
                logMsg = 'Maximum configured file size of ' + this.transport.maxFileSize + ' exceeded.';
                this.transport.maxSizeExceeded = true;
                return;
            }
        }

        // write log message
        if (this.config.console == null || this.config.console === true) {
            console.log(logMsg);
        }
        if (this.transport.filename != null && (this.transport.maxSizeExceeded == null || this.transport.maxSizeExceeded === false)) {
            fs.appendFileSync(this.transport.filename, logMsg + '\n');
        }
        if (req && res) {
            if(req.headers.accept === "text/event-stream") {
                res.write('data: ' + JSON.stringify({msg: logMsg + '\n', lvl: level}) + '\n\n');
            } else {
                res.write(logMsg + '\n');
            }
        }
    }
};

/**
 * Clear log
 */
RexLog.prototype.clear = function() {
    try {
        fs.unlinkSync(this.transport.filename);
    } catch (err) {
        // ignore
    }
    fs.appendFileSync(this.transport.filename, ''); // don't delete, just clear
};
