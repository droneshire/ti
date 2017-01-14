'use strict';
require('rootpath')();

const Readable = require('stream').Readable;

const dlog = require('dinfra-desktop/dlog');

/**
 * For Managing Loggers
 */
class LoggerManager {
    constructor(dinfraLogger) {
        this._dinfraLogger = dinfraLogger;
    }

    /**
     * Creates a Logger object.
     *
     * @param {String} name
     * @param {Object} config
     *  @param {Boolean} config.save - if true, save the logs sent to this logger in the db.
     *
     * @returns {Logger} logger
     */
    createLogger(name, {save}={}) {
        // TODO - pipe logger to a db entry if save is true
        
        return new Logger(name, this._dinfraLogger);
    }
    
} exports.LoggerManager = LoggerManager;

/**
 * A thin wrapper around the dinfra logger. Supports the same methods as the dinfra logger. Also this is a stream.Readable.
 */
class Logger extends Readable {

    /**
     * @param {String} name
     * @param {Object} dinfraLogger
     */
    constructor(name, dinfraLogger) {
        super();
        this._name = name;
        this._dinfraLogger = dinfraLogger;

        // create log functions which map to dlog functions
        dlog.PRIORITY.list.map((_, idx) => {
            this._createLogFunction(idx);
        });
    }

    /**
     * Get the logger name
     *
     * @returns {Boolean} name
     */
    getName() {
        return this._name;
    }

    /**
     * Closes the Readable, emitting a close event
     */
    close() {
        this.push(null);
        this.emit('close');
    }

    /**
     * Creates a log function, which mirrors one in the dinfraLogger.
     *
     * @private
     * @param {Integer} priority
     */
    _createLogFunction(priority) {
        const varName = dlog.PRIORITY.nameOf(priority);
        const name = varName.toLowerCase();

        // needs to be done for each instance
        // (need to attach this._name to dinfraLog message)
        this[name] = (message, tags=[]) => {
            message = message + '\n';
            this._dinfraLogger[name]({
                name: this._name,
                message,
                tags
            });

            // null is interpreted as EOF, which will close the steam
            if (message) {
                // We might want to send more info - possibly the entire dinfraLog
                // entry - to the readstream (useful for filtering by log level,
                // tags, etc).
                this.push(JSON.stringify({data: message,
                                          type: name,
                                          tags}));
            }
        };
    }

    _read() {
        // do nothing, required by Readable
    }
}

/**
 * Standardizes the use of loggers.
 * 
 */
class Log {

    /**
     * @param {Logger} userLogger - For user friendly messages
     * @param {Logger} debugLogger - For debugging (not for users)
     */
    constructor({userLogger,
                 debugLogger}) {
        this.userLogger = userLogger;
        this.debugLogger = debugLogger;
    }

    /**
     * Handle an error (if there is one)
     * 
     * @param {Array} callbackArgs - The first arg must be the error.
     * @param {Function} callback - Will be called with callbackArgs.
     * @param {Object} config
     *  @param {String} config.userMessage
     *  @param {String} config.debugMessage
     */
    handleError(callbackArgs, callback, {userMessage,
                                         debugMessage}={}) {
        const [err] = callbackArgs;
        if (!err) {
            setImmediate(() => {
                callback.apply(callback, callbackArgs);
            });
            return;
        }
        if (userMessage) {
            this.userLogger.error(userMessage);
        }
        if (debugMessage) {
            this.debugLogger.error(debugMessage);
        }
        // could attach long stacktrace, or include the logger.getName()
        this.debugLogger.error(err);
        setImmediate(() => {
            callback.apply(callback, callbackArgs);
        });
    }

    /**
     * Close the loggers
     * 
     */
    closeLoggers() {
        this.userLogger.close();
        this.debugLogger.close();
    }
    
} exports.Log = Log;

if (require.main === module) {
    
}
