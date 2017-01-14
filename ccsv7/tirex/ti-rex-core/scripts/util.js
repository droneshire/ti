'use strict';
require('rootpath')();

const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const async = require('async');

const projectRoot = path.join(__dirname, '..'); exports.projectRoot = projectRoot;

// Log files
exports.remoteServerLog = path.join(projectRoot, 'logs', 'remoteserver.log');
exports.localServerLog = path.join(projectRoot, 'logs', 'localserver.log');
exports.webdriverLog = path.join(projectRoot, 'logs', 'webdriver.log');
exports.protractorLog = path.join(projectRoot, 'logs', 'protactor.log');
exports.mochaLog = path.join(projectRoot, 'logs', 'mocha.log');

// Ports
exports.remoteServerDebugPort = 6000;
exports.localServerDebugPort = 6001;

exports.backendJsItems = ['app.js', 'lib', 'rexdb'].map((item) => {
    return path.join(projectRoot, item);
});

exports.jsDocFolder = path.join(projectRoot, 'api-docs');
exports.mochaReportFolder = path.join(projectRoot, 'mochawesome-reports');

/**
 * Clears the log file and opens a writeable stream to write to the log.
 *
 * @param {String} log 
 * @param callback(err, logStream)
 */
exports.setupLog = function(log, callback) {
    async.series([(callback) => {
        fs.outputFile(log, '', callback);
    }, (callback) => {
        const logStream = fs.createWriteStream(log);
        let callbackCalled = false;
        logStream.on('open', () => {
            if (!callbackCalled) {
                callbackCalled = true;
                callback(null, logStream);
            }
        });
        logStream.on('error', (err) => {
            if (!callbackCalled) {
                callbackCalled = true;
                callback(err);
            }
        });
    }], (err, [_, logstream]) => {
        callback(err, logstream);
    });    
};

/**
 * Simplifies process management
 *
 */
exports.ProcessManager = class ProcessManager {
    constructor() {
        this._childProcesses = [];
        process.once('exit', () => {
            this._childProcesses.map((child) => {
                child.kill();
            });
        });
    }

    /**
     * Register process and redirect to out.
     *
     * @param {Object} args
     *  @param {Object} args.child - An object returned by a child_process function
     *   i.e require('child_processes').spawn(..)
     *  @param {stream.Writeable} args.out - The stream to write the 
     *   processes output to.
     *  @param {String} name 
     *  @param {Boolean} exitMessage - if false suppress the exit code message
     */
    addProcess({child, out, name='', exitMessage=true}) {
        this._childProcesses.push(child);
        ProcessManager._redirectProcessOutput({
            child,
            out,
            name,
            exitMessage
        });
    }

    /**
     * Redirect the processes output to the write stream 
     *
     * @param {Object} p - An object returned by a child_process function
     *  i.e require('child_processes').spawn(..)
     * @param {stream.Writeable} out - The stream to write the processes output to
     *
     */
    static _redirectProcessOutput({child, out, name, exitMessage}) {
        child.stdout.pipe(out);
        child.stderr.pipe(out);
        child.on('error', (err) => {
            out.write(err);
        });
        child.on('close', (code) => {
            if (exitMessage) {
                out.write(`${name} exited with code ${code}\n`);
            }
        });
        // received when nodemon restarts our script
        process.once('SIGUSR2', (code) => {
            child.kill();
        });
    }
};

/**
 * Resolves the path relative to the current working directory. This also handles ~ in paths.
 * 
 * @param {String} p - The path to resolve.
 *
 * @returns {String} resolvedPath - The absolute resolved path.
 */
exports.resolvePath = function(p) {
    if (path.isAbsolute(p)) {
        return p;
    }
    else {
        const homeResolved = p.replace('~', os.homedir());
        const absPath = path.join(process.cwd(), homeResolved);
        return path.normalize(absPath);
    }
};
