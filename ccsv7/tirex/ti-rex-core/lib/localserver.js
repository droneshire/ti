/**
 * Functions needed by local server only
 *
 * 2/11/2015
 */
/*jshint bitwise: false*/

'use strict';

var logger = require('./logger')();

// third party
var async = require('async');
var request = require('request').defaults({forever: true});
var fs = require('fs-extra');
var mkdirp = require('mkdirp');
//var spawn = require('child_process').spawn;
var path = require('path');
var urlParser = require('url');
var htmlparser2 = require('htmlparser2');
var unzip = require('unzip');
var ti_util = require('ti_util');

// our modules
var vars = require('./vars');
var state = require('./state');
var query = require('./query');
var rexdb = require('../rexdb/lib/rexdb');
var fsutils = require('./localserver/fsutils');
var lsBundles = require('./localserver/bundles');
var ProgressInfo = require('./progress').ProgressInfo;
var dbBuilderResources = require('./dbBuilder/resources');
const pathHelpers = require('./path-helpers');

var serverState = state.ServerState;

// debug
var debug = false;
var srcname = 'localserver';
function debugtrace(msg) {
    if(debug) {
        logger.trace(srcname, msg);
        //logger.info(srcname, msg);
    }
}
function logError(err) {
    logger.error(srcname, err);
}
function logInfo(info) {
    logger.info(srcname, info);
}

// Set up environment for Request
if(vars.HTTP_PROXY != null) {
    process.env.HTTP_PROXY = vars.HTTP_PROXY;
    logInfo('http_proxy: '+ process.env.HTTP_PROXY);
}
else {
    delete process.env.HTTP_PROXY;
}
if(vars.HTTPS_PROXY != null) {
    process.env.HTTPS_PROXY = vars.HTTPS_PROXY;
    logInfo('https_proxy: '+ process.env.HTTPS_PROXY);
}
else {
    delete process.env.HTTPS_PROXY;
}

if (vars.NO_PROXY != null) {
    process.env.NO_PROXY = vars.NO_PROXY;
}
else {
    delete process.env.NO_PROXY;
}

// ----------  ----------

module.exports = Localserver;
function Localserver() { // TODO: Oliver: should localserver not be a singleton?
}

Localserver.prototype.init = function(vars, dbs, myHttpPort, callback) {

    logInfo('Starting up local server ...');
    this.dbLocation = vars.DB_BASE_PATH;
    fsutils.makeDir(this.dbLocation);
    this.dbs = dbs;
    this.contentLocation = vars.CONTENT_BASE_PATH;
    fsutils.makeDir(this.contentLocation);
    this.myHttpPort = myHttpPort;

    this.contentPackagesConfigPath = path.dirname(vars.contentPackagesConfig);
    this.remoteAddr = vars.REMOTESERVER_BASEURL;
    vars.LOCALSERVER_USER_AGENT = 'TirexServer/'+serverState.version + ' (' + vars.HOST + ')';
    this.userAgent = vars.LOCALSERVER_USER_AGENT;

    this.makeofflineMonitors = [];  // list of make offline progress monitors

    this.dbRemotePackages = new rexdb(path.join(vars.DB_BASE_PATH, 'packages.db'));
    this.lppRemote = new LocalPrivatePackages(path.join(vars.DB_BASE_PATH, '_packages.db'));
    this.ccsAdapter = new CCSAdapter(this.myHttpPort); // this has to go before packageImporter
    this.packageImporter = new PackageImporter(this);

    logInfo('Connecting to remote server host: ' + vars.REMOTESERVER_BASEURL);
    this.testRemoteConnection(function(connected) { // test remote connection
        if(connected) { // always scan at startup
            //logInfo('Scanning local contents ...');
            //this.packageImporter.scan(function () {
                logInfo('Connected to remote server host: ' + vars.REMOTESERVER_BASEURL);
                callback(connected);
            //});
        }
        else {
            logInfo('Cannot connect to remote server host: ' + vars.REMOTESERVER_BASEURL);
            // [ TIREX_3.0 - remote server can reject communications even physical connection is established
            if(serverState.remoteServerRejected) {
                logInfo('Reason: ' + serverState.remoteServerRejected);
            }
            // ]
            callback(connected);
        }
    });
};

// ---------- private functions ----------
function _isStatusOK(status) {
    // HTTP status checking, null status as OK by default
    return (status == null || status === 200);
}
/*
 * convert http callback into node style callback
 */
function _callbackX(error, response, body, callback) {
    if(error) {
        var msg = 'Remote request error: ' + error;
        logError(msg);
        callback(error, 500);
    }
    else {
        if(_isStatusOK(response.statusCode)) {
            callback(body, 200);
        }
        else if(response.statusCode === 202) {
            callback(body, response.statusCode);
        }
        else if(response.statusCode === 206) {
            callback(body, response.statusCode);
        }
        else {
            logError(body);
            callback(body, response.statusCode);
        }
    }
}
Localserver.prototype._unpack = function (zipFile, dest, progressMon, numFiles, callback) {
    debugtrace('=> unpack() : ' + zipFile);

    try {
        var stat = fs.statSync(zipFile);
    } catch (err) {
        setImmediate(function() {
            callback('unzip error: ' + err);
        });
        return;
    }

    var fstream = fs.createReadStream(zipFile);
    var zip = unzip.Extract({ path: dest });
    fstream.pipe(zip);
    fstream.on('close', function() {
        debugtrace('<= unpack()');
        callback(null);
    });
    fstream.on('error', function(err) {
        debugtrace('unpack() error: ' + err);
        callback('unzip error: ' + err);
    });
    var bytesRead = 0;

    if(progressMon) {
        fstream.on('data', function (chunk) {
            bytesRead += chunk.length;
            var _subProgress = bytesRead / stat.size;
            progressMon.setWorked(_subProgress);
        });
    }
};
Localserver.prototype._archiveAndDownloadContents = function(fileList, tempZipFileName, progressMon, relocate, callback) {
    var self = this;
    var err;
    var numFiles = fileList.length;
    var filepath = path.join(vars.DOWNLOADS_BASE_PATH, tempZipFileName);

    debugtrace('=> archiveAndDownloadContents()');

    // Optimization: if the zip file is available, use it instead of download a new one
    if(fs.existsSync(filepath)) {
        self._unpack(filepath, vars.CONTENT_BASE_PATH, progressMon, numFiles, function(err) {
            debugtrace('<= archiveAndDownloadContents()');
            callback(err);
        });
        return;
    }

    this.remotePostArchive(fileList, progressMon, function(result, status) {
        if(_isStatusOK(status) === false) {
            // error
            logError('_archiveAndDownloadContents: ' + result);
            callback(result);
            return;
        }
        if(result.error) {
            logError('_archiveAndDownloadContents: ' + result.error.message);
            callback(result.error.message);
            return;
        }
        if(result.indexOf('NothingToDownload.txt') !== -1) {
            // Nothing to download
            err = 'failed to find target files';
            logError(err);
            callback(err);
            return;
        }

        // start downloading

        // check if it is just a content file, not zip
        var _urlParts = urlParser.parse(result, true);
        var _isContent = _urlParts.query.source === 'content';
        if(_isContent) {
            // just copy
            filepath = path.join(vars.CONTENT_BASE_PATH, fileList[0]);
            fsutils.makeDir(path.dirname(filepath)); // make sure the directory exist
        }

        self.remoteDownload(result, filepath, progressMon, function (result, status) {
            if(_isStatusOK(status) === false) {
                callback('failed to down target files');
                return;
            }
            //
            if( !_isContent ) {
                // need unzip
                self._unpack(filepath, vars.CONTENT_BASE_PATH, progressMon, numFiles, function(err) {
                    if(relocate) {
                        async.each(fileList, function(file, callback) {
                            var pkg = self.lppRemote.findByLink(file);
                            if(pkg) {
                                var from = path.join(vars.CONTENT_BASE_PATH, file);
                                var installPath = self.lppRemote.getInstallPath(pkg, false, false);
                                if(installPath) {
                                    var to = file.replace(pkg.packagePath, installPath);
                                    to = path.join(vars.CONTENT_BASE_PATH, to);
                                    fsutils.move(from, to, vars.CONTENT_BASE_PATH, function (err) {
                                        callback(err);
                                    });
                                }
                                else {
                                    setImmediate(callback);
                                }
                            }
                            else {
                                setImmediate(callback);
                            }
                        }, function(err) {
                            debugtrace('<= archiveAndDownloadContents()');
                            callback(err);
                        });
                    }
                    else {
                        debugtrace('<= archiveAndDownloadContents()');
                        callback(err);
                    }
                });
            }
            else {
                if(relocate) {
                    var pkg = self.lppRemote.findByLink(fileList[0]);
                    if(pkg) {
                        var from = path.join(vars.CONTENT_BASE_PATH, fileList[0]);
                        var installPath = self.lppRemote.getInstallPath(pkg, false, false);
                        if(installPath) {
                            var to = fileList[0].replace(pkg.packagePath, installPath);
                            to = path.join(vars.CONTENT_BASE_PATH, to);
                            fsutils.move(from, to, vars.CONTENT_BASE_PATH, function (err) {
                                debugtrace('<= archiveAndDownloadContents()');
                                callback(err);
                            });
                        }
                        else {
                            callback(null);
                        }
                    }
                    else {
                        callback(null);
                    }
                }
                else {
                    debugtrace('<= archiveAndDownloadContents()');
                    callback(null);
                }
            }
        });
    });
};

// ---------- utilities ----------

Localserver.prototype.remoteGet = function(req, callback) {
    var url = this.remoteAddr + req;
    debugtrace('=> remoteGet() : ' + url);
    request(
        {   method: 'GET',
            uri: url,
            headers: {'user-agent': this.userAgent},
            json: true
        }, function(error, response, body) {
            debugtrace('<= remoteGet()');
            _callbackX(error, response, body, callback);
        }
    );
};

Localserver.prototype.remotePostArchive = function(fileList, progressMon, callback) {
    var url = this.remoteAddr + '/api/archivefiles';

    debugtrace('=> remotePostArchive() : ' + url);
    if(progressMon) {
        // polled by client
        url += '?progressId=' + progressMon.id;
    }
    else {
        // self polling
        var uuid = newUuid();
        url += '?progressId=' + uuid;
        var self = this;
    }

    request(
    {   method: 'POST',
        uri: url,
        headers: {'user-agent': this.userAgent},
        body: fileList,
        json: true
    }, function(error, response, body) {
        //
        if(progressMon == null) {
            if(response.statusCode === 202) {
                // need polling
                pollProgress();
            }
            else {
                // done or error
                debugtrace('<= remotePostArchive()');
                _callbackX(error, response, body, callback);
            }
        }
        else {
            debugtrace('<= remotePostArchive()');
            _callbackX(error, response, body, callback);
        }
    });
    function pollProgress() {
        self.remoteDownloadProgress(uuid, function (result, status) {
            if(status === 206) {
                // poll
                if (this) {
			// James: temp patch
                    // James: note after moving to nodev6 I noticed sometimes this is called at startup with
                    // this = undefined, so I put this safegaurd here for now.
                    setTimeout(this, 1000);
                }
            }
            else {
                // done or error
                debugtrace('<= remotePostArchive()');
                callback(result.result, status);
            }
        });
    }

};

Localserver.prototype.remoteDownload = function(link, dest, progressMon, callback) {
    var ws = fs.createWriteStream(dest, {flags: 'w'});
    var url = this.remoteAddr + '/' + link;

    if(link.indexOf('http')>=0) {
        // if external link, don't go to remote tirex server, go strict to external site
        url = link;
    }

    debugtrace('=> remoteDownload() : ' + url);

    if(progressMon) {
        url += '&progressId=' + progressMon.id;
    }

    var req = request.get(
        {
            url: url,
            headers: {'user-agent': this.userAgent},
        }
    );
    req.pipe(ws);
    ws.on('finish', function() {
        // callback after the stream is finished
        if(ws.bytesWritten != expected) {
            // REX-844 file size check
            callback('Incomplete download: '+dest, 500);
        }
        else {
            callback(link);
        }
    });
    req.on('error', function(error) {
        // ignore the last chunk of data
        callback(error, 500);
    });
    req.on('data', function(data) {
        if(progressMon && expected > 0) {
            var _subProgress = (data.length + ws.bytesWritten) / expected;
            progressMon.setWorked(_subProgress);
        }
    });

    // get the expected total size from the header
    var expected = 0;
    req.on('response', function(res) {
        expected = res.headers['content-length'];
    });
};

Localserver.prototype.remoteDownloadProgress = function(id, callback) {
    var url = '/api/downloadprogress/' + id;
    this.remoteGet(url, callback);
};

/*
 * ex: /energia/energia__17.00.00.00/reference/img/EnergiaSymbol.png
 */
Localserver.prototype.translateContentPath = function(cpath) {
    return _translateContentPath(cpath);
};
function _translateContentPath(cpath) {
    var result;
    var afilepath = decodeURIComponent(cpath);
    if(afilepath.charAt(0)==='/') {
        // remove the leading separator
        afilepath = afilepath.substr(1);
    }
    if(path.normalize(afilepath + '/') === path.normalize(path.resolve(afilepath) + '/')) {
        // is an absolute path
        result = afilepath;
    }
    else {
        result = path.join(vars.CONTENT_BASE_PATH, afilepath);  // relative to content base
        if(vars.RELOCATE_PACKAGES) {
            var pkgHdr = this.lppRemote.findByLink(afilepath);
            if (pkgHdr) {
                // relative to content base with install path name
                var installPath = this.lppRemote.getInstallPath(pkgHdr, false, false);
                if(installPath) {
                    afilepath = afilepath.replace(pkgHdr.packagePath, installPath);
                }
                result = path.join(vars.CONTENT_BASE_PATH, afilepath);
            }
        }
    }
    return result;
}

/*
 * ex: "//{ccs-url}/ide/api/ccsserver/importProject?location=@ti-rex-content/ti-rtos_tivac/ti-rtos_tivac__2.16.00.08/resources/..."
 */
Localserver.prototype.translateProjectAPI = function(cpath) {
    if(vars.RELOCATE_PACKAGES) {
        // replace remote packagePath with localInstall path
        var pkgHdr = this.lppRemote.findByLinkWithEmbeddedPath(cpath);
        if (pkgHdr && pkgHdr.packagePath) {
            var local = this.lppRemote.getInstallPath(pkgHdr, false, false);
            if (local) {
                cpath = cpath.replace(pkgHdr.packagePath, local);
            }
        }
    }
    // translate into valid CCS path
    return this.ccsAdapter.translateProjectPath(cpath);
};

function getHtmlSubfolder(htmlFile) {
    var folder = null;

    /*
     * MS Word style HTML file
     * Ex: hello.htm, sub-folder -> hello_files;
     */
    var idx = htmlFile.lastIndexOf('.htm');
    if( idx > 0) {
        folder = htmlFile.slice(0, idx);
        folder = folder.concat('_files');
    }
    return folder;
}

// ---------- progress & offline utilities ----------
Localserver.prototype.getOfflineProgressInfo = function(id) {
    for (var i = 0; i < this.makeofflineMonitors.length; i++) {
        var progressMon = this.makeofflineMonitors[i];
        if (progressMon.id === id) {
            return progressMon;
        }
    }
    return null;
};
Localserver.prototype.getOfflineProgress = function(progressMon, callback) {
    if(progressMon.done) {
        this.makeofflineMonitors.splice(this.makeofflineMonitors.indexOf(progressMon), 1);
        callback({task:''});
        return;
    }
    progressMon.getProgress(callback);
};

Localserver.prototype._progressStart = function(progressMon) {
    // register
    progressMon.done = false;
    this.makeofflineMonitors.push(progressMon);
};
Localserver.prototype._progressEnd = function(progressMon) {
    // un-register
    progressMon.done = true;
};

/**
 * Generate a UUID for remote progress with same format as tirex client
 *   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * Copied from client side rex.js.
 */
function newUuid() { // TODO Oliver: is there a simpler way of doing this?
    var s = [];
    var hexDigits = '0123456789abcdef';
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = '-';
    return s.join('');
}
/*
 * parameters: progressId, name, remote, func, funcParent, server
 */
function Progress(params) {  // TODO: Oliver: Could Progress() be moved to a separate file?
    if(params.progressId) {
        this.id = params.progressId;
    }
    this.name = params.name;
    this.remote = false;
    if(params.remote) {
        this.remote = params.remote;
    }
    if(params.func) {
        this.func = params.func;
        this.funcParent = params.funcParent;
    }
    if(params.server) {
        this.server = params.server;
    }
    if(params.completionCallback) {
        this.setCompletionCallback(params.completionCallback);
    }
    this.independentChild = false;
    if(params.independentChild) {
        this.independentChild = params.independentChild;
    }
    this.total = 1;
    this.budget = 1;
    this.children = [];
    this.worked = 0;
    this.activeChild = -1;
    this.running = false;
    //
    this._pp = 0;   // private percent progress as integer

    this._refreshTotal = function() {
        // only update if there are children
        if(this.hasChildren()) {
            this.total = 0;
            this.budget = 0;
            for (var i = 0; i < this.children.length; i++) {
                this.children[i]._refreshTotal();
                this.total += this.children[i].total;
                this.budget += this.children[i].budget;
            }
        }
    };
    this._refreshWorked = function() {
        // only update if there are children
        if(this.hasChildren()) {
            this.worked = 0;
            for (var i = 0; i < this.children.length; i++) {
                this.children[i]._refreshWorked();
                this.worked += this.children[i].worked;
            }
        }
    };
    this.addChild = function(child, budget) {
        if(child) {
            if(!child.id) {
                child.id = this.id; // default to parent ID
            }
            if(!child.server) {
                child.server = this.server;
            }
            child.budget = budget;
            this.children.push(child);
            child.parent = this;
        }
    };
    this.start = function() {
        this.worked = 0;
        this.activeChild = -1;
        this.error = null;

        if(this.hasChildren()) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].worked = 0;
            }
            this.activeChild = 0;
            this.children[0].start();
        }
        this._refreshTotal();
        this.running = true;
        this._pp = 0;
        // register with server if this is the root
        if(!this.parent) {
            this.server._progressStart(this);
        }
        return this.currentChild();
    };
    this.end = function() {
        if(!this.running) {
            return;
        }
        this.worked = this.total;
        if(this.hasChildren()) {
            this.activeChild = -1;
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].end();
            }
        }
        this.running = false;

        // un-register with server if this is the root
        if(!this.parent) {
            this.server._progressEnd(this);
        }

    };
    this.setCompletionCallback = function(cb) {
        if(cb == null) {
            // remove
            delete this.completionCallback;
        }
        else {
            // set
            this.completionCallback = cb;
        }
    };
    this.hasChildren = function() {
        return this.children && this.children.length > 0;
    };
    this.currentChild = function() {
        if(this.hasChildren() && this.activeChild >= 0) {
            return this.children[this.activeChild];
        }
        return null;
    };
    this.nextChild = function() {
        if(this.hasChildren && !this.currentChild()) {
            this.start();
            return this.currentChild();
        }

        if(this.hasChildren) {
            if(this.currentChild()) {
                this.currentChild().end();
            }
            this.activeChild++;
            if (this.activeChild >= this.children.length) {
                this.activeChild = -1;
            }
            else {
                this.currentChild().start();
            }
        }
        return this.currentChild();
    };
    this.setTotal = function(total) {
        if(this.currentChild()) {
            this.currentChild().setTotal(total);
            return;
        }

        this.total = total;
        this.worked = 0;    // reset worked
    };
    this.setWorked = function(worked) {
        if(!this.running) {
            return 0;
        }
        if(this.currentChild()) {
            var deltap = this.currentChild().setWorked(worked);
            if(deltap !== 0) {
                this.getWorkedPercent();
            }
            return deltap;
        }

        var lastReported = this._pp;
        this.worked = worked;
        if(this.worked > this.total) {
            this.worked = this.total;
        }
        else if(this.worked < 0) {
            this.worked = 0;
        }
        var p = this.getWorkedPercent();
        var dp = 0;
        if(p !== lastReported) {
            dp = p - lastReported;
        }
        return dp;
    };
    this.getWorkedPercent = function() {
        this._refreshWorked();
        var progress = this.worked / this.total * 100.0;
        if(this.hasChildren()) {
            var budgetUsed = 0;
            for (var i = 0; i < this.children.length; i++) {
                budgetUsed += this.children[i].getWorkedPercent() / 100.0 * this.children[i].budget;
            }
            progress = budgetUsed / this.budget * 100.0;
        }
        if(progress >= 100) {
            progress = 99;  // only set to 100 when end() is called
        }
        progress = progress | 0;  // make it integer only  // TODO: Oliver: why bitwise OR with 0?

        if(progress !== this._pp) {
            this._pp = progress;    // last reported
        }

        return progress;
    };

    this.updateRemote = function(callback) {
        // get from remote server
        var self = this;
        if(self.completionCallback == null) {
            callback(0);    // not ready
            return;
        }
        this.server.remoteDownloadProgress(this.id, function (result, status) {
            var subProgress = 100; // default
            if (_isStatusOK(status)) {
                subProgress = result.progress;
                self.setWorked(subProgress);
                // call back for completion, worked should be 100%
                if(result.result) {
                    self.archiveLink = result.result;
                }
                if(self.completionCallback) {
                    self.completionCallback();
                }
                callback(self.getWorkedPercent());
            }
            else if(status === 206) {
                subProgress = result.progress;
                self.setWorked(subProgress);
                callback(self.getWorkedPercent());
            }
            else if(status === 500) {
                // TODO - error?
                callback(self.getWorkedPercent());
            }
        });
    };
    this.getProgress = function(callback) {
        var child = this.currentChild();
        var self = this;
        var childName = this.name;
        if(child) {
            childName = child.name;
            while (child.currentChild()) {
                child = child.currentChild();
                childName = childName + ': ' + child.name;
            }
        }
        if(child && child.remote && this.server) {
            this.updateRemote(function (/*result, status*/) {
                callback({task:childName,progress:self.getWorkedPercent()});
            });
        }
        else {
            callback({task:childName,progress:this.getWorkedPercent()});
        }
    };

    this.execute = function(callback) {
        var active;
        var self = this;
        async.whilst(
            function () {
                active = self.nextChild();
                if(active) {
                    debugtrace('Progress.execute(): ' + self.name + ' -> ' + active.name);
                }
                else {
                    debugtrace('Progress.execute(): ' + self.name + ' -> null');
                }
                return active != null;
            },
            function (callback) {
                if(active.func) {
                    active.func.call(active.funcParent, function(err) {
                        if(err && self.independentChild === true) {
                            err = null; // ignore the error and let other child to execute
                        }
                        callback(err);
                    });
                }
                else if(active.execute) {
                    active.execute.call(active, function(err) {
                        if(err && self.independentChild === true) {
                            err = null; // ignore the error and let other child to execute
                        }
                        callback(err);
                    });
                }
            },
            function (err, result) {
                // done
                if (err) {
                    self.end(result);
                    self.error = err;
                }
                else {
                    self.end();
                }
                setImmediate(callback, err, result);
            }
        );
    };
}

function OfflineTransaction(parentServer, req, res) { // TODO: Oliver: Is parentServer needed? Isn't this always the same as localserver?
    this.parentServer = parentServer;   // parent server
    this.mappedPath = [];

    // Prepare
    this.prepare = function(callback) {
        callback(null);
    };

    // Collect, remote
    this.collectInfo = function(callback) {
        debugtrace('=> offlineCollectInfo()');
        var self = this;

        if(self.transaction.req.query.path && self.transaction.req.query.path.indexOf('/') === -1) {
            // whole package
            var pkgHdr = self.parentServer.lppRemote.findByQueryPath(self.transaction.req.query.path, self.transaction.req.query.package);
            if(pkgHdr) {
                self.transaction.nodeInfo.type = 'package';
                self.transaction.nodeInfo.packageHeader = pkgHdr;
                self.mappedPath.push({remote: pkgHdr.packagePath, local:self.parentServer.lppRemote.mapRemoteToInstallPath(pkgHdr.packagePath, false)});
            }
        }

        parentServer.remoteGet(self.transaction.req.originalUrl, function (result, status) {
            debugtrace('<= offlineCollectInfo()');
            if (_isStatusOK(status)) {
                self.transaction.resources = result.resources;
                self.transaction.overviews = result.overviews;

                var dependentBundles = [];
                async.each(result.dependentBundles, function(dependentBundle, callback) {
                    query.findBundle(dependentBundle.id, dependentBundle.version, parentServer.dbs.dbOverviews, parentServer.dbs.dbPureBundles, parentServer.dbs.dbResources, function(err, bundle) {
                        if (err) {
                            callback(err);
                        } else if (bundle == null || (bundle != null && bundle.local !== 'full')) {
                            dependentBundles.push(dependentBundle);
                            callback();
                        } else {
                            callback();
                        }
                    });
                }, function(err) {
                    if (err) {
                        logger.error('find dependend bundles: ' + JSON.stringify(err));
                    } else {
                        self.transaction.progressMon.result = dependentBundles;
                    }
                    callback(err, self.transaction);
                });
            }
            else {
                callback(status, self.transaction);
            }
        });
    };

    // Pre-process, local
    this.preprocess = function(callback) {
        debugtrace('=> offlinePreprocess()');
        var self = this;

        //var _resourcesToBeAddedID = [];
        var _fileList = [];
        var _resourcesToBeAdded = [];
        var _overviewsToBeAdded = [];
        var _pdfLinksToBeAdded = [];
        var _extLinksToBeAdded = [];

        async.series([
            function (callback) {
                var _currentPackagePath = null;
                var _mappedPackagePathAbs = null;
                var _mappedPackagePathRel = null;
                async.each(self.transaction.resources, function (resource, callback) {
                    parentServer.dbs.dbResources.findOne({_id: resource._id}, function (err, result) {
                        if (!result) {
                            // new local item
                            if(self.transaction.nodeInfo.type !== 'package') {
                                if (resource.linkType === 'local' && resource.link) {
                                    if (_fileList.indexOf(resource.link) < 0) {
                                        _fileList.push(resource.link);
                                    }
                                }
                                if (resource.includedFilesForDownload != null) {
                                    for (var i = 0; i < resource.includedFilesForDownload.length; i++) {
                                        _fileList.push(resource.includedFilesForDownload[i]);

                                    }
                                }
                            }
                            //if(_resourcesToBeAddedID.indexOf(resource._id) < 0) {
                            //    _resourcesToBeAddedID.push(resource._id);
                            if(vars.RELOCATE_PACKAGES) {
                                if (resource.linkType === 'local') {
                                    if (resource.packagePath !== _currentPackagePath) {
                                        _currentPackagePath = resource.packagePath;
                                        _mappedPackagePathAbs = self.parentServer.lppRemote.mapRemoteToInstallPath(_currentPackagePath, false);
                                        _mappedPackagePathRel = self.parentServer.lppRemote.mapRemoteToInstallPath(_currentPackagePath, true);
                                        self.mappedPath.push({
                                            remote: _currentPackagePath,
                                            local: _mappedPackagePathAbs
                                        });
                                    }
                                    if (resource.link) {
                                        resource.link = resource.link.replace(_currentPackagePath, _mappedPackagePathAbs);
                                    }
                                    if (resource._importProjectCCS) {
                                        resource._importProjectCCS = resource._importProjectCCS.replace(_currentPackagePath, _mappedPackagePathRel);
                                    }
                                    if (resource._createProjectCCS) {
                                        resource._createProjectCCS = resource._createProjectCCS.replace(_currentPackagePath, _mappedPackagePathRel);
                                    }
                                }
                            }
                                _resourcesToBeAdded.push(resource);
                                // external link
                                if (resource.linkType === 'external') {
                                    // pdf
                                    if ((resource.link.indexOf('.pdf') >= 0) || (resource.link.indexOf('lit/pdf') >= 0)) {
                                        _pdfLinksToBeAdded.push(resource.link);
                                    }
                                    else {
                                        _extLinksToBeAdded.push(resource.link);
                                    }
                                }
                            //}
                            //else {
                            //    console.log("duplicated resource: "+resource.name);
                            //}
                        }
                        callback();
                    });
                }, function (/*err*/) {
                    setImmediate(callback);
                });
            },
            function (callback) {
                var _currentPackagePath = null;
                var _mappedPackagePathAbs = null;
                async.each(self.transaction.overviews, function (overview, callback) {

                    parentServer.dbs.dbOverviews.findOne({_id: overview._id}, function (err, result) {
                        if (!result) {
                            // new local item

                            // [ REX-662
                            if(overview.resourceType === 'packageOverview') {
                                if(self.transaction.nodeInfo.type === 'package') {
                                    overview.local = 'full';
                                }
                                else {
                                    overview.local = 'partial';
                                }
                                if(vars.RELOCATE_PACKAGES) {
                                    overview.localPackagePath = self.parentServer.lppRemote.mapRemoteToInstallPath(overview.packagePath, false);
                                }
                                else {
                                    overview.localPackagePath = path.join(vars.CONTENT_BASE_PATH, overview.packagePath);
                                }
                            }
                            // ]

                            if(vars.RELOCATE_PACKAGES) {
                                if (overview.packagePath !== _currentPackagePath) {
                                    _currentPackagePath = overview.packagePath;
                                    _mappedPackagePathAbs = self.parentServer.lppRemote.mapRemoteToInstallPath(_currentPackagePath, false);
                                }
                            }

                            _overviewsToBeAdded.push(overview);
                            // check if it has image file
                            if(self.transaction.nodeInfo.type !== 'package') {
                                var _imgpath;
                                if (overview.image) {
                                    _imgpath = overview.image;
                                    if(_fileList.indexOf(_imgpath) < 0) {
                                        _fileList.push(_imgpath);
                                        if(vars.RELOCATE_PACKAGES) {
                                            //overview.image = overview.image.replace(_currentPackagePath, _mappedPackagePathAbs);
                                        }
                                    }
                                }
                                if (overview.icon) {
                                    _imgpath = overview.icon;
                                    if(_fileList.indexOf(_imgpath) < 0) {
                                        _fileList.push(_imgpath);
                                    }
                                    if(vars.RELOCATE_PACKAGES) {
                                        //overview.icon = overview.icon.replace(_currentPackagePath, _mappedPackagePathAbs);
                                    }
                                }
                                if (overview.description) {
                                    var parser = new htmlparser2.Parser({
                                        onopentag: function(name, attribs){
                                            if(name === 'img') {
                                                var src = attribs.src;
                                                if(src) {
                                                    var urlParts = urlParser.parse(src, true);
                                                    if(urlParts.protocol === null) {
                                                        _imgpath = urlParts.path;
                                                        if(_imgpath) {
                                                            if(_fileList.indexOf(_imgpath) < 0) {
                                                                _fileList.push(_imgpath);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        /*
                                         * Other handlers may be needed:
                                         *    ontext: function(text){}
                                         *    onclosetag: function(tagname){)
                                         */
                                    }, {decodeEntities: true});
                                    parser.write(overview.description);
                                }
                                if (overview.linkType === 'local' && overview.link) {
                                    var _overviewLink = overview.link;
                                    _fileList.push(_overviewLink);
                                    var _subfolder = getHtmlSubfolder(_overviewLink);
                                    if(_subfolder) {
                                        _fileList.push(_subfolder);
                                    }
                                }
                                if (!overview._extraOverview && overview.includedFilesForDownload != null) {
                                    for (var i = 0; i < overview.includedFilesForDownload.length; i++) {
                                        _fileList.push(overview.includedFilesForDownload[i]);
                                    }
                                }
                            }
                        }
                        callback();
                    });
                }, function (/*err*/) {
                    setImmediate(callback());
                });
            }
        ], function (err/*, result*/) {
            self.transaction.fileList = _fileList;
            self.transaction.resourcesToBeAdded = _resourcesToBeAdded;
            self.transaction.overviewsToBeAdded = _overviewsToBeAdded;
            self.transaction.pdfLinksToBeAdded = _pdfLinksToBeAdded;
            self.transaction.extLinksToBeAdded = _extLinksToBeAdded;
            debugtrace('<= offlinePreprocess()');
            callback(err, self.transaction);
        });
    };

    // Archive, remote
    this.archive = function(callback) {
        debugtrace('=> offlineArchive()');
        var self = this;

        if(self.transaction.nodeInfo.type === 'package') {
            self.transaction.fileList = [];
            self.transaction.fileList.push(self.transaction.nodeInfo.packageHeader.packagePath);
        }
        if(self.transaction.fileList.length === 0) {
            // nothing to download
            setImmediate(function() {
                debugtrace('<= offlineArchive()');
                callback(null, self.transaction);
            });
            return;
        }

        parentServer.remotePostArchive(self.transaction.fileList, self.transaction.progressMon, function(result, status) { // TODO: Oliver: change to polling
            var err;
            if (status === 202) {
                // wait for completion
                if(self.transaction.progressMon) {
                    self.transaction.progressMon.setCompletionCallback(function() {
                        // done
                        self.transaction.progressMon.setCompletionCallback(null);  // remove CB
                        debugtrace('<= offlineArchive()');
                        self.transaction.archiveLink = self.transaction.progressMon.archiveLink;
                        callback(null, self.transaction);
                    });
                }
                return;
            }
            else if (_isStatusOK(status) === false) {
                // error
                err = '_archiveContents: ' + result;
            }
            else if (result.error) {
                err = '_archiveContents: ' + result.error.message;
            }
            else if (result.link.indexOf('NothingToDownload.txt') !== -1) {
                // Nothing to download
                err = 'failed to find target files';
            }
            debugtrace('<= offlineArchive()');
            if(err) {
                logError(err);
                callback(err);
            }
            else {
                self.transaction.archiveLink = result.link;
                callback(null, self.transaction);
            }
        });
    };

    // Download from remote to local
    this.download = function(callback) {
        debugtrace('=> offlineDownload()');
        var self = this;

        if(!self.transaction.archiveLink) {
            // nothing to download
            debugtrace('   nothing to download');
            debugtrace('<= offlineDownload()');
            setImmediate(function() {
                callback(null, self.transaction);
            });
            return;
        }

        self.transaction.archiveFile = path.join(vars.DOWNLOADS_BASE_PATH, 'download_'+self.transaction.progressMon.id+'.zip');

        // check if it is just a content file, not zip
        var _urlParts = urlParser.parse(self.transaction.archiveLink, true);
        var _isContent = _urlParts.query.source === 'content';
        if(_isContent) {
            // just copy
            self.transaction.archiveFile = path.join(vars.CONTENT_BASE_PATH, self.transaction.fileList[0]);
            fsutils.makeDir(path.dirname(self.transaction.archiveFile)); // make sure the directory exist
        }

        parentServer.remoteDownload(self.transaction.archiveLink, self.transaction.archiveFile, self.transaction.progressMon, function (result, status) { // TODO: Oliver: change to polling
            var err;
            if(_isStatusOK(status) === true) {  // 200
                debugtrace('<= offlineDownload()');
                callback(err, self.transaction);
            }
            else if(status === 202) {
                // wait for completion
                if(self.transaction.progressMon) {
                    // polled by client
                    self.transaction.progressMon.setCompletionCallback(function () {
                        // done
                        self.transaction.progressMon.setCompletionCallback(null);  // remove CB
                        debugtrace('<= offlineDownload()');
                        callback(err, self.transaction);
                    });
                }
                else {
                    // TODO - need polling
                }
            }
            else {
                // other
                err = 'failed to down target files';
                debugtrace('<= offlineDownload()');
                callback(err, self.transaction);
            }

        });
    };

    // Unpack, local
    this.unpack = function(callback) {
        debugtrace('=> offlineUnpack()');
        var self = this;

        if(!self.transaction.archiveLink) {
            // nothing to unpack
            debugtrace('   nothing to unpack');
            debugtrace('<= offlineDownload()');
            setImmediate(function() {
                callback(null, self.transaction);
            });
            return;
        }

        var _urlParts = urlParser.parse(self.transaction.archiveLink, true);
        if(_urlParts.query.source === 'content') {
            debugtrace('<= offlineUnpack()');
            setImmediate(function() {
                callback(null, self.transaction);
            });
            return;
        }

        parentServer._unpack(self.transaction.archiveFile, vars.CONTENT_BASE_PATH, self.transaction.progressMon, self.transaction.fileList.length, function (err) {
            fsutils.removeFile(self.transaction.archiveFile, false, null);
            debugtrace('<= offlineUnpack()');
            callback(err, self.transaction);
        });
    };

    // Post-process, local
    this.postprocess = function(callback) {
        debugtrace('=> offlinePostprocess()');
        var self = this;

        async.series([
            function(callback) {
                // move the folder to install path
                if(vars.RELOCATE_PACKAGES) {
                    async.eachSeries(self.mappedPath, function(p, callback) {
                        var _pkgpath = path.join(vars.CONTENT_BASE_PATH, p.remote);
                        fsutils.move(_pkgpath, p.local, vars.CONTENT_BASE_PATH, function (err) {
                            callback(err);
                        });
                    }, function(err) {
                        setImmediate(callback, err);
                    });
                }
                else {
                    setImmediate(callback);
                }
            },
            function(callback) {
                // update overviews DB
                if (self.transaction.overviews.length > 0) {
                    parentServer.dbs.dbOverviews.insert(self.transaction.overviews, function() {
                        parentServer.dbs.dbOverviews.save(function(err) {
                            callback(err);
                        });
                    });
                }
                else {
                    setImmediate(callback);
                }
            },
            function(callback) {
                // update resources DB
                if (self.transaction.resources.length > 0) {
                    parentServer.dbs.dbResources.insert(self.transaction.resources, function() {
                        parentServer.dbs.dbResources.save(function (err) {
                            debugtrace('<= offlinePostprocess()');
                            callback(err, self.transaction);
                        });
                    });
                }
                else {
                    setImmediate(callback);
                }
            }
        ], function(err) {
            setImmediate(function() {
                debugtrace('<= offlinePostprocess()');
                callback(err, self.transaction);
            });
        });
    };

    var progressMon= new Progress({progressId: req.query.progressId, /*res:res,*/ name:'Make Offline', server:parentServer});
    progressMon.addChild(new Progress({name: 'Preparing', func: this.prepare, funcParent: this}), 5);
    progressMon.addChild(new Progress({name: 'Collecting', func: this.collectInfo, funcParent: this, remote: true}), 5);
    progressMon.addChild(new Progress({name: 'Filtering', func: this.preprocess, funcParent: this}), 5);
    progressMon.addChild(new Progress({name: 'Archiving', func: this.archive, funcParent: this, remote: true}), 25);
    progressMon.addChild(new Progress({name: 'Downloading', func: this.download, funcParent: this}), 25);
    progressMon.addChild(new Progress({name: 'Unpacking', func: this.unpack, funcParent: this}), 25);
    progressMon.addChild(new Progress({name: 'Updating', func: this.postprocess, funcParent: this}), 10);

    this.transaction = {
        req: req,
        res: res,
        //
        progressMon: progressMon,
        nodeInfo: {type: 'container'}
    };
}

// ---------- main exports ----------

/**
 * Test connection with remote server.
 *
 * @param callback
 */
Localserver.prototype.testRemoteConnection = function(callback) {
    var url = '/api/serverstate';
    //var url = '/api/getLastRefreshTime';
    var self = this;
    this.remoteGet(url, function(result, status) {
        // default to disconnected
        self.remoteServerConnected = false;
        delete serverState.remoteServerVersion;
        delete serverState.remoteServerRejected;
        if(_isStatusOK(status)) {
            if(result.version) {
                serverState.remoteServerVersion = result.version;
            }
            // [ TIREX_3.0 - check for rejected connection from remote server
            if(result.rejected) {
                serverState.remoteServerRejected = result.rejected; // text message
                callback(self.remoteServerConnected);
            }
            else {
                if (self.remoteServerConnected !== true) {
                    // treat like new connection
                    self.syncRemoteServer(false, function (err, msg) {
                        if (err) {
                            logger.error(err);
                        }
                        // continue with connected = true, even if we have an error
                        self.remoteServerConnected = true;
                        callback(self.remoteServerConnected);
                    });
                }
                else {
                    self.remoteServerConnected = true;
                    callback(self.remoteServerConnected);
                }
            }
        }
        else {
            callback(self.remoteServerConnected);
        }
    });
};

/**
 * Make resources offline.
 *
 * @param req
 * @param res
 */
Localserver.prototype.makeofflineResources = function(req, res) {
    var url = req.originalUrl ;
    var self = this;

    debugtrace('=> makeofflineResources() : ' + url);

    var xoffline = new OfflineTransaction(this, req);
    var _progressMon = xoffline.transaction.progressMon;

    _progressMon.start();
    async.waterfall([
        function (callback) {
            xoffline.prepare(callback);
        },
        function (callback) {
            _progressMon.nextChild();
            xoffline.collectInfo(callback);
        },
        function (transaction, callback) {
            _progressMon.nextChild();
            xoffline.preprocess(callback);
        },
        function (transaction, callback) {
            _progressMon.nextChild();
            xoffline.archive(callback);
        },
        function (transaction, callback) {
            _progressMon.nextChild();
            xoffline.download(callback);
        },
        function (transaction, callback) {
            _progressMon.nextChild();
            xoffline.unpack(callback);
        },
        function (transaction, callback) {
            _progressMon.nextChild();
            xoffline.postprocess(callback);
        }
    ], function (err, result) {
        // done
        if(_progressMon) {
            if(err) {
                _progressMon.end(result);
                _progressMon.error = err;
            }
            else {
                _progressMon.end();
            }
        }
        query.clearCaches();

        // notify CCS
        // let the client determine when to tick CCS
        //if(xoffline.transaction.nodeInfo.type === 'package') {
        //    if(self.ccsAdapter.isEnabled()) {
        //        self.ccsAdapter.notifyRefUpdate();
        //    }
        //}

        if(err) {
            debugtrace('(***) error: ' + err + ' / result: ' + result);
        }
        debugtrace('<= makeofflineResources()');
    });
    if(res) {
        res.send(202);
    }
};

Localserver.prototype.removeofflineResources = function(req, res) {
    // TODO
    // Workaround flag: remove whole package instead of removing individual physical resources.
    // A physical resource may have multiple parents, the file can be removed only if all the parents are removed.
    var _workaround_remove_whole_package = true;

    var url = req.originalUrl ;
    var self = this;
    var progressId = req.query.progressId;

    // packageName used for special handling of package level download
    var packageName = null;
    var packagePath = null;
    var packageVer = null;
    var packageId = null;
    var packageUid = null;

    debugtrace('=> removeofflineResources() : ' + url);
    if(res) {
        res.send(202);
    }
    var progressMon= new Progress({progressId: progressId, name:'Removing offline resources', server:this});
    progressMon.setTotal(100);
    progressMon.start();
    var worked = 0;
    async.waterfall([
        function (callback) {
            // pre-process
            // [
            progressMon.name = 'Preparing...';
            if(req.query.path && req.query.path.indexOf('/') === -1) {
                // package node
                packageName = req.query.path;
                callback();
            }
            else if (_workaround_remove_whole_package) {
                if (req.query.path) {
                    // by path
                    var elms = req.query.path.split('/');
                    if (elms.length > 1) {
                        packageName = elms[0];
                        // [ Metadata_2.1 : the package is 1 level down from top node
                        if(vars.META_2_1_TOP_CATEGORY.getByText(packageName) != null) {
                            packageName = elms[1];
                        }
                        // ]
                    }
                    else {
                        packageName = req.query.path;
                    }
                    callback();
                }
                else if (req.query.id) {
                    // by id, single resource {
                    self.dbs.dbResources.findOne({_id: req.query.id}, function (err, result) {
                        if (result) {
                            // found
                            packageName = result.root0;
                            // packageVer = result.packageVersion;
                        }
                        callback();
                    });
                }
            }
            else {
                callback();
            }
            // ]
        },
        function (callback) {
            progressMon.name = 'Inspecting contents';
            worked += 10;
            progressMon.setWorked(worked);

            if(packageName) {
                // whole package
                var _result = {resources: [], overviews: []};
                self.dbs.dbOverviews.find({resourceType: 'packageOverview'}, function (err, _packages) {
                    for(var np = 0; np<_packages.length; np++) {
                        var pkg = _packages[np];
                        for(var nc=0; nc<pkg.rootCategory.length; nc++) {
                            var cat = pkg.rootCategory[nc];
                            if(cat === packageName) {
                                packagePath = pkg.packagePath;
                                packageVer = pkg.version;
                                packageId = pkg.packageId;
                                packageUid = pkg.packageUId;
                                break;
                            }
                        }
                        if(packageUid) {
                            _result.overviews.push(pkg);
                            break;
                        }
                    }
                    callback(null, _result);
                });
            }
            else {
                // query - get a list of resources [and overviews]
                query.makeofflineOrDownloadQuery(self.dbs.dbResources, self.dbs.dbOverviews, self.dbs.dbPureBundles, req.query, function (err, result) {
                    callback(err, result);
                });
            }
        },
        function (result, callback) {
            progressMon.name = 'Preparing file list';
            worked += 10;
            progressMon.setWorked(worked);
            // pre-process
            var _resources = result.resources;
            var _overviews = result.overviews;
            var _fileList = [];
            var _resourcesToBeRemoved = [];
            var _overviewsToBeRemoved = [];

            async.series([
                function (callback) {
                    async.each(_resources, function (resource, callback) {
                        if(resource == null) {
                            // invalid item
                            logError('Corrupted resource list from server.');
                            setImmediate(callback());
                        }
                        else {
                            self.dbs.dbResources.findOne({_id: resource._id}, function (err, result) {
                                if (result) {
                                    // existed item
                                    if (resource.linkType === 'local' && resource.link && packageName === null) {
                                        if (_fileList.indexOf(resource.link) < 0) {
                                            _fileList.push(resource.link);
                                        }
                                    }
                                    _resourcesToBeRemoved.push(resource);
                                }
                                callback();
                            });
                        }
                    }, function (err) {
                        setImmediate(callback, err);
                    });
                },
                function (callback) {
                    async.each(_overviews, function (overview, callback) {
                        // remove whole package
                        if(packageName && !packagePath) {
                            if(overview.resourceType === 'packageOverview') {
                                for(var ci=0; ci<overview.rootCategory.length; ci++) {
                                    var cat = overview.rootCategory[ci];
                                    if(cat === packageName) {
                                        packagePath = overview.packagePath;
                                        packageVer = overview.version;
                                        if(overview.packageId != null) {
                                            packageId = overview.packageId;
                                        }
                                        else {
                                            packageId = overview.package;   // TODO dev only, before packageId added to DBs
                                        }
                                    }
                                }
                            }
                        }

                        if(overview == null) {
                            // invalid item
                            logError('Corrupted overview list from server.');
                            setImmediate(callback);
                        }
                        else {
                            self.dbs.dbOverviews.findOne({_id: overview._id}, function (err, result) {
                                if (result) {
                                    // existed item
                                    _overviewsToBeRemoved.push(overview);
                                }
                                callback();
                            });
                        }
                    }, function (err) {
                        setImmediate(callback, err);
                    });
                }
            ], function (err) {
                callback(err, _fileList, _resourcesToBeRemoved, _overviewsToBeRemoved);
            });
        },
        function (fileList, resources, overviews, callback) {
            // check for shared & referenced files which should not be deleted

            progressMon.name = 'Deleting files';
            worked += 10;
            progressMon.setWorked(worked);
            // delete whole package
            if(packageName && packagePath) {
                var fpath = self.translateContentPath(packagePath); // TODO: should check localPackagePath and keep contents outside tirex-contents un-touched,
                //rimraf(fpath, function(err) {
                //    if(err) {
                //        logError('removeofflineResources: ' + err);
                //    }
                //});
                //if(overviews.length>0 && overviews[0].localPackagePath != null) {
                //    if(path.normalize(overviews[0].localPackagePath).toLowerCase().indexOf(vars.CONTENT_BASE_PATH.toLowerCase()) >= 0) {
                //        // under managed tirex-content
                //        fpath = overviews[0].localPackagePath;
                //    }
                //}
                //fsutils.removeFile(fpath, true, vars.CONTENT_BASE_PATH);
                fileList = [];
            }

            // delete physical files
            for(var i=0; i<fileList.length; i++) {
                var filepath = self.translateContentPath(fileList[i]);
                    fsutils.removeFile(filepath, true, vars.CONTENT_BASE_PATH);
            }

            // keep overviews untouched?

            // remove resources
            if(packageId && packageVer) {
                // full package
                self.dbs.dbResources.remove({packageId: packageId, packageVersion: packageVer}, function () {
                    self.dbs.dbOverviews.remove({packageId: packageId, packageVersion: packageVer}, function () {
                        self.dbs.dbPureBundles.remove({packageId: packageId, packageVersion: packageVer}, function () {
                            if(overviews.length>0 && overviews[0].localPackagePath != null) {
                                if(path.normalize(overviews[0].localPackagePath).toLowerCase().indexOf(vars.CONTENT_BASE_PATH.toLowerCase()) >= 0) {
                                    // under managed tirex-content
                                    fpath = overviews[0].localPackagePath;
                                }
                            }
                            if(fpath) {
                                fs.remove(fpath, function (err) {
                                    logError(err);
                                    callback(null, resources, overviews);   // discard the error and continue
                                });
                            }
                        });
                    });
                });
                // imported packages
                self.packageImporter.packageImported(packageId, packageVer, false);
            }
            else {
                async.each(resources, function (resource, callback) {
                    self.dbs.dbResources.remove({_id: resource._id}, function (/*err, result*/) {
                        callback();
                    });
                }, function () {
                    setImmediate(callback, null, resources, overviews);
                    // ...
                });
            }
        },
        function (resources, overviews, callback) {
            // post-process
            progressMon.name = 'Updating DB';
            worked += 10;
            progressMon.setWorked(worked);
            self.dbs.dbResources.save(function(err) {
                if(packageName && packagePath) {    // deleted whole package in file system
                    self.dbs.dbOverviews.save(function(err) {
                        self.dbs.dbPureBundles.save(function (err) {
                            progressMon.name = 'Synchronizing with remote server';
                            // force syncRemoteServer to get back some assets
                            self.syncRemoteServer(true, function () {
                                callback();
                            });
                        });
                    });
                }
                else {
                    self.dbs.dbDevices.save(function(err) {
                        self.dbs.dbDevtools.save(function(err) {
                            callback();
                        });
                    });
                }
            });
        }
    ], function () {
        progressMon.name = 'Finishing';
        worked = 90;
        progressMon.setWorked(worked);
        // done
        query.clearCaches();

        // notify CCS
        // let the client determine when to tick CCS
        //if(packageName && packagePath) {
        //    if(self.ccsAdapter.isEnabled()) {
        //        self.ccsAdapter.notifyRefUpdate();
        //    }
        //}

        debugtrace('<= removeofflineResources()');

        progressMon.end();
    });

};

/*
 * TODO
 * - support 'remove' & 'replace'?
 *
 */
/**
 * Synchronize local server with remote server
 */
Localserver.prototype.syncRemoteServer = function(forced, callback) { // TODO: Oliver: Would syncProductTree be a better name?
    var self = this;

    cleanupDownloads();
    async.series([
        function(callback) {
            // synchronize Packages first
            syncDB('/api/packages', self.dbRemotePackages, true, false, function(err, changed, result) {
                callback(err, changed);
            });
        },
        function(callback) {
            // synchronize Devices
            syncDB('/api/devices', self.dbs.dbDevices, forced, true, function(err, changed) {
                callback(err, changed);
            });
        },
        function(callback) {
            // synchronize DevTools
            syncDB('/api/devtools', self.dbs.dbDevtools, forced, true, function(err, changed) {
                callback(err, changed);
            });
        },
        function(callback) {
            // synchronize CCS discovered packages
            self.ccsAdapter.getDiscoveredProducts(callback);
        }
    ], function(err, result) {
        if (err) {
            var msg = 'Inserting device or devtool records for offline use : ' + JSON.stringify(err);
            logError(msg);
            callback(err, msg);
        } else {
            callback();
        }
    });

    function cleanupDownloads() {
        var base = vars.DOWNLOADS_BASE_PATH;
        var files = fs.readdirSync(base);
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if(file.indexOf('images.zip') == file.length-10) {
                // ended with 'images.zip'
                continue;
            }
            fsutils.removeFile(path.join(base, file), false, null);
        }
    }
    function syncDB(remoteUrl, localDB, forced, loadImages, callback) {
        var images = [];
        var changed = false;
        // get the DB
        self.remoteGet(remoteUrl, function(result, status) {
            if( _isStatusOK(status) ) {
                // the DB won't change often
                if(forced || (localDB.documents.length !== result.length)) {  // TODO: Oliver: 'documents' is a private object and shouldn't be accessed in this way
                    // simply replace the whole DB instead of update item by item
                    // i.e. remove all and add all
                    changed = true;
                    localDB.remove({}, function() {
                        for (var i = 0; i < result.length; i++) {
                            var item = result[i];
                            if(item.image) {
                                images.push(item.image);
                            }
                        }
                        localDB.insert(result, function(err){
                            if(!err) {
                                // make sure the file is saved
                                localDB.save(function(err) {
                                    //
                                    if(localDB === self.dbRemotePackages) {
                                        // make a private copy for sync operations
                                        self.lppRemote.clear();
                                        self.lppRemote.insert(result);
                                    }

                                    // get other required file which not in the result
                                    // (1) image files
                                    if(loadImages && images.length > 0) { // Metadata_2.1 : put back forced image download, H/W complete packages are not downloaded by default
                                        if(localDB.documents.length !== result.length) {
                                            // remove cached image zip file
                                            fsutils.removeFile(path.join(vars.DOWNLOADS_BASE_PATH, localDB.dbName+'images.zip'), false, null);
                                        }
                                        self._archiveAndDownloadContents(images, localDB.dbName+'images.zip', null, vars.RELOCATE_PACKAGES, function(err) {
                                            callback(err, changed, result);
                                        });
                                    }
                                    else {
                                        callback(null, changed, result);
                                    }
                                });
                            }
                            else {
                                // error
                                callback(err, changed);
                            }
                        });
                    });
                }
                else {
                    // assuming no change if length doesn't change
                    callback(null);
                }
            }
            else {
                // error
                callback(result);
            }
        });
    }
};

/**
 * Query for browsing
 *
 * @param req
 * @param res
 * @param callback
 */
Localserver.prototype.doQuery = function(req, res, callback) {
    var that = this;
    async.waterfall([
        // made-offline content query
        function (callback) {
            if (serverState.useOfflineContent === true) {
                query.doQuery(that.dbs.dbResources, that.dbs.dbOverviews, that.dbs.dbDevices, that.dbs.dbDevtools, that.dbs.dbDownloads, req, res, function (err, result) {
                    callback(err, result);
                });
            } else {
                setImmediate(function() {
                    callback(null, []);
                });
            }
        },
        // remote content query
        function(resultOffline, callback) {
            if (serverState.useRemoteContent === true) {
                request({method: 'GET', uri: vars.REMOTESERVER_BASEURL + req.originalUrl, headers: {'user-agent': that.userAgent}, json: true},
                    function(err, response, body) {
                        callback(err, resultOffline, body);
                });
            } else {
                setImmediate(function() {
                    callback(null, resultOffline, []);
                });
            }
        }
    ], function(err, resultOffline, resultRemote) {
        if (err) {
            callback(err);
            return;
        }
        // tag remote nodes with offline true, false, partial
        if (serverState.useRemoteContent === true) {
            for (var o = 0; o < resultOffline.length; o++) { // offline nodes
                var nodeOffline = resultOffline[o];
                for (var r = 0; r < resultRemote.length; r++) { // remote nodes
                    var nodeRemote = resultRemote[r];
                    if (nodeRemote.text === nodeOffline.text) {
                        if (nodeRemote.type === 'resource') {
                            nodeRemote.offline = 'true';
                        } else if (nodeRemote.type === 'folder') {
                            if (nodeRemote.numChildrenLocal === nodeOffline.numChildrenLocal) {
                                nodeRemote.offline = 'true';
                            } else {
                                nodeRemote.offline = 'partial';
                            }
                        }
                    }
                }
            }
            // [ REX-1052
            // Filter out 'downloadOnly packages
            /* Revised, no need to filter
            resultRemote = resultRemote.filter(function (nodeRemote) {
                if (nodeRemote.type === 'folder') {
                    let _lpkg;
                    if (that.dbs.dbOverviews._findSWPackageByUid) {
                        _lpkg = that.dbs.dbOverviews._findSWPackageByUid(nodeRemote.packageUId);
                    }
                    // else {
                    //     _lpkg = that.dbs.dbOverviews.findOneSync({packageUId: nodeRemote.packageUId});
                    // }
                    if (_lpkg && _lpkg.local === 'full') {
                        // always show if the packages is already installed locally
                        return true;
                    }
                    let found = that.lppRemote.findByUID(nodeRemote.packageUId);
                    if(found.idx>=0 && found.pkg.restrictions && (found.pkg.restrictions.indexOf(vars.METADATA_PKG_DOWNLOAD_ONLY) >= 0)) {
                        return false;
                    }
                }
                return true;
            });
            */
            // ]
            callback(null, resultRemote);
        } else if (serverState.useOfflineContent === true) {
            callback(null, resultOffline);
        }
    });
};

// ---------- For future developments / non-production codes ----------

/**
 * To get lists of local image assets, html links, pdf links.
 *
 * @param files
 * @param recursive
 * @param callback
 */
/*
Localserver.prototype.getHTMLAssetsAndLinks = function(files, recursive, callback) {
    var htmlFilesPending = [];
    var htmlFilesAdded = [];
    var pdfFilesAdded = [];
    var imageFilesAdded = [];
    var unknownFilesAdded = [];
    //var rootDir = '';

    htmlFilesPending = htmlFilesPending.concat(files);
    async.whilst(
        function() {
            // temp
            if(htmlFilesAdded.length > 1000) {
                return false;
            }

            return htmlFilesPending.length > 0;
        },
        function(callback) {
            var file = htmlFilesPending.splice(0,1)[0];
            if(htmlFilesAdded.indexOf(file) >= 0) {
                console.log('duplicated: '+file);
                callback(null);
                return;
            }
            htmlFilesAdded.push(file);
            _singlePass(file, function (err, htmlFiles, pdfFiles, imageFiles, webLinks, unknownFiles) {
                if (!err) {
                    var i;
                    for(i=0; i<htmlFiles.length; i++) {
                        var html = htmlFiles[i];
                        if(htmlFilesAdded.indexOf(html) >= 0 || htmlFilesPending.indexOf(html) >= 0) {
                            continue;
                        }
                        htmlFilesPending.push(html);
                    }
                    for(i=0; i<pdfFiles.length; i++) {
                        var pdf = pdfFiles[i];
                        if(pdfFilesAdded.indexOf(pdf) < 0) {
                            pdfFilesAdded.push(pdf);
                        }
                    }
                    for(i=0; i<imageFiles.length; i++) {
                        var img = imageFiles[i];
                        if(imageFilesAdded.indexOf(img) < 0) {
                            imageFilesAdded.push(img);
                        }
                    }
                    for(i=0; i<unknownFiles.length; i++) {
                        var unknown = unknownFiles[i];
                        if(unknownFilesAdded.indexOf(unknown) < 0) {
                            unknownFilesAdded.push(unknown);
                        }
                    }
                    callback(null);
                }
                else {
                    console.log('htmlParser err: '+err);
                }
            });
        },
        function(err) {
            // done
            callback(err, htmlFilesAdded, pdfFilesAdded, imageFilesAdded, unknownFilesAdded);
        }
    );

    function _singlePass(file, callback) {
        var htmlFiles = [];
        var pdfFiles = [];
        var imageFiles = [];
        var unknownFiles = [];
        var webLinks = [];
        var rootDir = path.dirname(file);

        var parser = new htmlparser2.Parser({
            onopentag: function(name, attribs){
                var urlParts;
                if(name === 'a'){
                    var href = attribs.href;
                    if(href) {
                        urlParts = urlParser.parse(href, true);

                        if(urlParts.protocol === null) {
                            var urlpath = urlParts.path;
                            if( urlpath ) {
                                if(urlpath.lastIndexOf('.htm') > 0) {
                                    htmlFiles.push(path.join(rootDir, urlpath));
                                }
                                else if(urlpath.lastIndexOf('.pdf') > 0) {
                                    pdfFiles.push(path.join(rootDir, urlpath));
                                }
                                else {
                                    unknownFiles.push(path.join(rootDir, urlpath));
                                }
                            }
                        }
                        else {
                            if(urlParts.protocol === 'http:' || urlParts.protocol === 'https:') {
                                webLinks.push(href);
                            }
                            // protocols: 'file:', 'javascript:', ...
                        }
                    }
                }
                else if(name === 'img') {
                    var src = attribs.src;
                    if(src) {
                        urlParts = urlParser.parse(src, true);
                        if(urlParts.protocol === null) {
                            imageFiles.push(path.join(rootDir,urlParts.path));
                        }
                        else {
                            // protocols: 'data:', ...
                        }
                    }
                }
            }
            //
            // Other handlers may be needed:
            //    ontext: function(text){}
            //    onclosetag: function(tagname){)
        }, {decodeEntities: true});

        try {
            fs.createReadStream(file)
                .on('data', function (chunk) {
                    parser.write(chunk);
                })
                .on('end', function (chunk) {
                    parser.end(chunk);
                    callback(null, htmlFiles, pdfFiles, imageFiles, webLinks, unknownFiles);
                })
                .on('error', function (err) {
                    if(err.code === 'ENOENT') {
                        callback(null, htmlFiles, pdfFiles, imageFiles, webLinks, unknownFiles);
                    }
                    else {
                        callback(err);
                    }
                });
        } catch (err) {
            callback(err);
        }
    }
};
*/

/*
 * package headers
 * [ { name:
 *     resourceType: 'package'
 *     version:
 *     path:
 *     rootCategory:
 *     description:
 *     image:
 *     package: (*1)
 *     id: (*2)
 *   }
 * ]
 * notes:
 *   (*1) instead of using 'name' + 'resourceType: 'package', some old one just use 'package'
 *   (*2) new field suggested on Feb.24,2016
 */
function PackageImporter(server) {
    this.server = server;
    this.packageSearchPaths = new PackageSearchPaths(server);

    var LocalState = {
        NEW : 'new',             // new, ready for import
        REMOVED : 'removed',     // remove previously imported, need to remove from overviews.db as well
        DELETED : 'deleted',     // remove non-imported, no longer can import
        IMPORTED : 'imported',   // import into rex, mark as local and assign local path in file system
        DUPLICATED : 'duplicated' // error: duplicated, need error handler
    };
    var MetadataFile = {
        PACKAGE : 'package.tirex.json',
        METAROOT : '.metadata',
        TIREXROOT : '.tirex'
    }

    //var dbDiscoveredFile = path.join(vars.DB_BASE_PATH, '_discoveredpackages.db');
    //this.lppDiscovered = new LocalPrivatePackages(dbDiscoveredFile);
    this.lppDiscovered = new LocalPrivatePackages(null);
    this.listPR = [];

    this.scan = function (callback) {
        debugtrace('=> PackageImporter.scan()');
        this.lppDiscovered.clear();
        //this.listPR = this._scanPhysicalRemoved();
        //var listLC = this._scanLocal();
        var listLC;

        var self = this;
        async.series([
            function(callback) {
                self.server.dbs.dbOverviews.find({resourceType: 'packageOverview'}, function (err, packages) {
                    // self.listPR = self._scanPhysicalRemoved(self.lppDiscovered.pkgs);
                    self.listPR = self._scanPhysicalRemoved(packages);
                    var removedOfflinePkgs = self._scanPhysicalRemovedOffline(packages);
                    for(var i=0; i<removedOfflinePkgs.length; i++) {
                        self.listPR.push(removedOfflinePkgs[i]);
                    }
                    callback();
                });
            },
            function(callback) {
                // removed items
                var _listPR = [];
                async.each(self.listPR, function (pkg, callback) {
                    self.lppDiscovered.removeByVID(pkg.id, pkg.version);
                    if (pkg.localState === LocalState.REMOVED) {
                        // clean up bundlesDB & resourcesDB
                        var removePkg = {packageId: pkg.id, packageVersion: pkg.version};
                        self.server.dbs.dbOverviews.remove(removePkg, function () {
                            self.server.dbs.dbPureBundles.remove(removePkg, function () {
                                self.server.dbs.dbResources.remove(removePkg, function () {
                                    callback();
                                });
                            });
                        });
                        _listPR.push(pkg)
                    }
                    else {
                        setImmediate(callback);
                    }
                }, function (err) {
                    self.listPR = _listPR;
                    self.server.dbs.dbOverviews.save(function () {
                        self.server.dbs.dbPureBundles.save(function () {
                            self.server.dbs.dbResources.save(function () {
                                query.clearCaches();
                                callback(err);
                            });
                        });
                    });
                });
            },
            function(callback) {
                // discovered items
                self.server.dbs.dbOverviews.find({resourceType: 'packageOverview'}, function (err, packages) {
                    listLC = self._scanLocal(packages);
                    async.each(listLC, function (pkg, callback) {
                        self.updateDiscoveredDB(pkg);
                        setImmediate(callback);
                    }, function (err) {
                        setImmediate(callback, err);
                    });
                });
            }
        ], function(err) {
            debugtrace('<= PackageImporter.scan()');
            // return new and removed packages only
            var newPkgs = self.getNewPackages();
            var removedPkgs = self.listPR;
            callback({removed:removedPkgs, added:newPkgs});
        });
    };
    this._isTirexContent = function(filePath) {
        if(!filePath) {
            return false;
        }
        var p1 = filePath;
        var tirex_content_base = vars.CONTENT_BASE_PATH;
        if(vars.HOST === 'win32') {
            p1 = p1.toLowerCase();
            tirex_content_base = tirex_content_base.toLowerCase();
        }
        return (pathHelpers.normalize(p1).indexOf(pathHelpers.normalize(tirex_content_base)) === 0);
    };
    this._scanLocal = function (localPackages) {
        var result = [];
        var foundTirexFiles = [];
        var foundMappedHeader = [];

        // scan for externally downloaded packages
        var spaths = this.packageSearchPaths.paths;
        for (var i = 0; i < spaths.length; i++) {
            var spath = path.normalize(spaths[i]);
            this._findFile(spath, null, foundMappedHeader, 0, 3, false);
        }
        // scan for tirex-content downloaded full packages
        this._findFile(vars.CONTENT_BASE_PATH, foundTirexFiles, null, 0, 5, true);

        // with local tirex metadata files
        for (var j=0; j < foundTirexFiles.length; j++) {
            var file = foundTirexFiles[j];
            var dir = path.dirname(file);
            var packageHeader = this._readHeader(file);
            if (packageHeader.resourceType === 'package' && packageHeader.name != null) {
                // convert to old style for compatibility, may not needed
                packageHeader.package = packageHeader.name;
            }
            else if (packageHeader.package != null) {
                // convert from old style for compatibility
                packageHeader.resourceType = 'package';
                packageHeader.name = packageHeader.package;
            }
            if(packageHeader.id == null) {
                // TODO - for dev only if packageId not added yet
                packageHeader.id = packageHeader.name;
            }

            var ptokens = dir.split(path.sep);
            var plen = ptokens.length;
            if( plen >= 3 && ptokens[plen-2] === MetadataFile.METAROOT && ptokens[plen-1] === MetadataFile.TIREXROOT ) {
                // for case package.json locates in .metadata/.tirex
                packageHeader.localPackagePath = path.dirname(path.dirname(dir));   // grand parent dir
            }
            else {
                // for case package.json locates in root
                packageHeader.localPackagePath = dir;
            }
//            packageHeader.localmeta = true;   // TODO - support offline import with metadata

            if(localPackages) {
                for(i=0; i<localPackages.length; i++) {
                    var localPackage = localPackages[i];
                    if(packageHeader.id == localPackage.id && packageHeader.version == localPackage.version) {
                        // local content downloaded by tirex
                        packageHeader = null;
                        break;
                    }
                }
            }
            if(packageHeader) {
                if(this.server.lppRemote.findByVID(packageHeader.id, packageHeader.version)) {
                    // add if exists in remote server
                    result.push(packageHeader);
                    //this.updateDiscoveredDB(packageHeader);
                }
            }
        }

        // remote tirex metadata
        for (var k=0; k < foundMappedHeader.length; k++) {
            var hdr = foundMappedHeader[k];
            //hdr.package = hdr.name; // convert to old style for compatibility, may not needed
            if(localPackages) {
                for(i=0; i<localPackages.length; i++) {
                    var localPackage = localPackages[i];
                    if(hdr.id == localPackage.id && hdr.version == localPackage.version) {
                        // local content known by tirex
                        hdr = null;
                        break;
                    }
                }
            }
            if(hdr) {
                result.push(hdr);
                //this.updateDiscoveredDB(hdr);
            }
        }

        // CCS discovered products
        // Ex:
        // [
        //    {"id":"com.ti.rtsc.TIRTOSsimplelink","location":"C:/TI/tirtos_simplelink_2_13_00_06","name":"TI-RTOS for SimpleLink Wireless MCUs","version":"2.13.0.06"},
        //    {"id":"com.ti.rtsc.XDCtools","location":"E:/CCS/6.2.0.00014/xdctools_3_31_00_24_core","name":"XDCtools","version":"3.31.0.24_core"}
        // ]
        var _lppCCS = this.server.ccsAdapter.lppCCS;
        if(_lppCCS != null) {
            for(i=0; i<_lppCCS.pkgs.length; i++) {
                var ccsPkgHdr = _lppCCS.pkgs[i];
                var _ccsloc = path.normalize(ccsPkgHdr.location).toLowerCase();
                if(this._isTirexContent(_ccsloc)) {
                    // under tirex managed folder
                    continue;
                }
                if(localPackages) {
                    var exists = false;
                    for(j=0; j<localPackages.length; j++) {
                        var localPackage = localPackages[j];
                        var localPkgPath = path.normalize(localPackage.localPackagePath).toLowerCase();
                        if( (ccsPkgHdr.id == localPackage.id && ccsPkgHdr.version == localPackage.version) || (_ccsloc == localPkgPath)) {
                            // local content known by tirex
                            exists = true;
                            break;
                        }
                    }
                    if(exists === true) {
                        continue;
                    }
                }
                var phdr = this.server.lppRemote.findByDir(path.basename(ccsPkgHdr.location));
                if(phdr != null) {
                    // valid
                    phdr.localPackagePath = ccsPkgHdr.location; // TODO - handle case
                    result.push(phdr);
                    //this.updateDiscoveredDB(phdr);
                }
            }
        }

        return result;
    };
    this._scanPhysicalRemoved = function(pkgs) {
        var result = [];
        for(var i=0; i<pkgs.length; i++) {
            var dPkgHdr = pkgs[i];
            if(!dPkgHdr) {  // null object
                continue;
            }
            var dir = dPkgHdr.localPackagePath;
            if(dir) {
                if(this._isTirexContent(dir)) {
                    // no need to scan into tirex-content folder
                    continue;
                }
                try {
                    fs.statSync(dir).isDirectory();
                } catch (err) {
                    // not exists, tag it
                    //delete dPkgHdr.localPackagePath;
                    //if(dPkgHdr.localState === LocalState.IMPORTED) {
                    //    dPkgHdr.localState = LocalState.REMOVED;
                    //    result.push(dPkgHdr);
                    //}
                    //else if(dPkgHdr.localState === LocalState.NEW) {
                    //    dPkgHdr.localState = LocalState.DELETED;
                    //    result.push(dPkgHdr);
                    //}
                    dPkgHdr.localState = LocalState.REMOVED;
                    result.push(dPkgHdr);
                }
            }
        }
        return result;
    };
    this._scanPhysicalRemovedOffline = function(packages) {
        var result = [];
        for(var i=0; i<packages.length; i++) {
            var dPkg = packages[i];
            if(!dPkg || dPkg.local !== 'full' ) {  // null object
                continue;
            }
            var dir = dPkg.localPackagePath;
            if(dir) {
                if( !this._isTirexContent(dir) ) {
                    // no need to scan outside tirex-content folder
                    continue;
                }
                try {
                    var filepath = path.join(dir, MetadataFile.PACKAGE);    // 'package.tirex.json'
                    fs.statSync(filepath);
                    continue;
                } catch (err) {
                }
                // not exists, try other location
                try {
                    // '.../.metadata/.tirex/package.tirex.json'
                    filepath = path.join(dir, MetadataFile.METAROOT, MetadataFile.TIREXROOT, MetadataFile.PACKAGE);
                    fs.statSync(filepath);
                    continue;
                } catch (err) {
                }
                // not exists
                dPkg.localState = LocalState.REMOVED;
                result.push(dPkg);
            }
        }
        return result;
    };
    this.updateDiscoveredDB = function(packageHeader) {
        // TODO - async operation & multiple (use find() instead of findOne())
        // TODO - handle all potential conflicts and ...
        var existedPackage = this.lppDiscovered.findByVID(packageHeader.id, packageHeader.version);
        var existedLocation = this.lppDiscovered.findByLocalPackagePath(packageHeader.localPackagePath);
        if (existedLocation == null && existedPackage == null) {
            // new
            packageHeader.localState = LocalState.NEW;
            this.lppDiscovered.insert(packageHeader);
        }
        else if (existedLocation == null && existedPackage != null) {
            // conflicts: multiple locations?
            if(existedPackage.localState === LocalState.REMOVED) {
                packageHeader.localState = LocalState.NEW;
                this.lppDiscovered.insert(packageHeader);
            }
            else {
                packageHeader.localState = LocalState.DUPLICATED;
            }
        }
        else if (existedLocation != null && existedPackage == null) {
            // conflicts: multiple packages at same locations?
            existedPackage = packageHeader;
        }
        else {
            // already exist
        }
    };
    this.getNewPackages = function () {
        var newPackages = [];
        var docs = this.lppDiscovered.pkgs;
        for (var i = 0; i < docs.length; i++) {
            var doc = docs[i];
            if (doc && doc.localState === LocalState.NEW) {
                newPackages.push(doc);
            }
        }
        return newPackages;
    };
    this.getPackageByVersion = function (pkgId, version) {
        return this.lppDiscovered.findByVID(pkgId, version);
    };
    this.getPackageLocalPath = function (pkgId, version) {
        var p = this.getPackageByVersion(pkgId, version);
        if (p) {
            return p.localPackagePath;
        }
        return null;
    };
    this.setPackageState = function (id, version, state) {
        // read-modify-write
        var p = this.lppDiscovered.findByVID(id, version);
        if(p) {
            p.localState = state;
            this.lppDiscovered.insert(p);
        }
    };
    this.packageImported = function(pkgId, version, flag) {
        if(flag) {
            this.setPackageState(pkgId, version, LocalState.IMPORTED);
        }
        else {
            this.setPackageState(pkgId, version, LocalState.NEW);
        }
        // TODO - mark overviews.db as well?
    };
    this._findFile = function (dir, foundTirexFiles, foundMappedHeader, level, maxLevel, scanTirexContentFolder) {
        /*
         *  Search sequence
         *    - package.tirex.json
         *    - known folder name for packages without metadata
         *    - sub-folders
         */
        var myLevel = level+1;
        if(myLevel > maxLevel) {
            // too deep, stop
            return;
        }
        //debugtrace('... scanning: '+dir);

        if (fs.existsSync(dir) === false) {
            // invalid dir
            return;
        }

        if( !scanTirexContentFolder ) {
            if (this.lppDiscovered._comparePath(dir, vars.CONTENT_BASE_PATH)) {
                // tirex content path, skip
                return;
            }
        }

        var hdr = this.server.lppRemote.findByDir(path.basename(dir));
        if(foundMappedHeader) {
            if (hdr != null) {
                // found known folder
                hdr.localPackagePath = dir;
                foundMappedHeader.push(hdr);
                return true;   // assuming no subpackages
            }
        }

        if(foundTirexFiles && hdr != null) {
            // optimized for special case:
            // root folder is a known package installFolder and has package.tirex,json in .metadata/.tirex.
            var pkgMetaFilepath = path.join(dir, MetadataFile.PACKAGE);
            if (fs.existsSync(pkgMetaFilepath) === true) {
                foundTirexFiles.push(pkgMetaFilepath);
                return true;   // found package.tirex.json
            }
            pkgMetaFilepath = path.join(dir, MetadataFile.METAROOT, MetadataFile.TIREXROOT, MetadataFile.PACKAGE);
            if (fs.existsSync(pkgMetaFilepath) === true) {
                foundTirexFiles.push(pkgMetaFilepath);
                return true;   // found package.tirex.json
            }

            return;
        }

        var files = fs.readdirSync(dir);
        var subdirs = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var filepath = path.join(dir, file);
            if (foundTirexFiles && file === MetadataFile.PACKAGE) { // 'package.tirex.json'
                foundTirexFiles.push(filepath);
                return true;   // found package.tirex.json
            }
            else {
                var stat = fs.lstatSync(filepath);   // be aware of shortcut / symbolic link
                if (stat.isDirectory()) {
                    subdirs.push(filepath);
                }
            }
        }

        // keep searching sub-folders
        for (var j = 0; j < subdirs.length; j++) {
            var found = this._findFile(subdirs[j], foundTirexFiles, foundMappedHeader, myLevel, maxLevel, scanTirexContentFolder);
        }
    };
    this._readHeader = function (file) {
        var header = null;
        try {
            var d = fs.readFileSync(file, 'utf8');
            var contents = JSON.parse(d);
            if (Array.isArray(contents)) {
                // first record is the package header
                if (contents.length > 0) {
                    header = contents[0];
                }
            }
            else {
                // single record, the whole object is the header
                header = contents;
            }
            if(header != null) {
                // maintain compatibility with old formats:
                if (header.resourceType === 'package' && header.name != null) {
                    // "resourceType" + "name" fields.
                    header.package = header.name;
                }
                else if (header.package != null) {
                    // "package" field only
                    header.resourceType = 'package';
                    header.name = header.package;
                }
                if(header.id == null) {
                    // missing "id", use "name" as default
                    header.id = header.name;
                }
            }
        } catch (err) {
            logError('Error reading ' + this.filename + ' : ' + err.message);
        }
        return header;
    };
    this.importAll = function(progressId, res) {
        this.import(this.getNewPackages(),progressId, res);
    };
    this.import = function(packages, progressId, res) {

        debugtrace('=> PackageImporter.import()');

        var progressMon= new Progress({progressId: progressId, name:'Import offline packages', server:server, independentChild:true});
        var budget  = 100 / packages.length;
        for(var i=0; i<packages.length; i++) {
            var pkg = packages[i];
            var param = {};

            param.pkgId = pkg.id;
            param.pkgVersion = pkg.version;
            param.pkgName = pkg.name;
            param.pkgUuid = pkg.id + vars.BUNDLE_ID_VERSION_DELIMITER + pkg.version;
            param.progressId = progressId;
            param.url = '/api/resources?makeoffline=true' + '&' + 'package='+encodeURIComponent(param.pkgUuid);
            param.pkgHeader = pkg;
            if(pkg.localmeta) {
                param.localmeta = pkg.localmeta;
            }
            if(progressId) {
                param.url = param.url + '&' + 'progressId=' + progressId;
            }

            var xoffline = new ImportPackageTransaction(this, param);
            progressMon.addChild(xoffline.transaction.progressMon, budget);
        }
        query.clearCaches();
        progressMon.execute(function(err, result) {
            // done
            if (err) {
                debugtrace('(***) error: ' + err + ' / result: ' + result);
            }
            debugtrace('<= PackageImporter.import()');
        });
        if(res) {
            res.send(202);
        }
    };

    this.getSearchPaths = function() {
        return this.packageSearchPaths.getPaths();
    };

    this.addSearchPath = function (inpaths, notify) {
        this.packageSearchPaths.addPath(inpaths, notify);
    };

    this.removeSearchPath = function (inpaths, notify) {
        this.removeDiscoveredNewPackages();
        this.packageSearchPaths.removePath(inpaths, notify);
    };

    this.removeDiscoveredNewPackages = function() {
        var newPackages = this.getNewPackages();
        for(var i=0; i<newPackages.length; i++) {
            var pkg = newPackages[i];
            this.lppDiscovered.removeByVID(pkg.id, pkg.version);
        }
    };

    /*
     * search paths file
     * [
     *   path1,
     *     :
     *   pathN
     * ]
     */
    function PackageSearchPaths(server) {
        this.server = server;
        this._init = function () {
            //var _dir = server.contentPackagesConfigPath;
            var _dir = vars.USER_CONFIG_PATH;
            this.paths = [];
            // TODO - may want to save search paths (together with other configurations) to user folder instead of install folder
            this.searchfile = path.join(_dir, 'searchpaths.json');
            // TODO - no longer needed after the info is embedded in package.tirex.json
            //this.packagemaps = [];
            //this.mapfile    = path.join(_dir, 'packagemaps.json');
            this.read();
        };
        this.read = function () {
            // read search paths file
            if (this.searchfile == null) {
                logInfo('searchpaths.json path not defined');
            }
            else {
                try {
                    var data = fs.readFileSync(this.searchfile, 'utf8');
                    var fpaths = JSON.parse(data);
                    for (var d = 0; d < fpaths.length; d++) {
                        this.paths.push(path.normalize(fpaths[d]));
                    }
                } catch (err) {
                    if(err.code === 'ENOENT') {
                        // first time
                        this.paths = this.getDefaultSearchPaths();
                    }
                    else {
                        logInfo('Error reading ' + this.searchfile + ' : ' + err.message);
                    }
                }
            }

            // Add CCS to search path
            if(this.server.ccsAdapter.isEnabled()) {
                var ccsRoot = this.server.ccsAdapter.ccsRoot;
                if(ccsRoot != null) {
                    var ccsSearchPath = path.resolve(ccsRoot,'../');    // one level up from ccsv6.
                    if(this.paths.indexOf(ccsSearchPath) === -1) {
                        this.paths.push(ccsSearchPath);
                    }
                }
            }
        };
        this.write = function () {
            if (this.searchfile == null || this.paths == null) {
                logError('cannot write searchpaths.json');
            }
            else {
                try {
                    var d = JSON.stringify(this.paths);
                    fs.writeFileSync(this.searchfile, d, 'utf8');
                } catch (err) {
                    logError('Error writing ' + this.searchfile + ' : ' + err.message);
                }
            }
        };
        this.findSearchPathIndex = function (path) {
            for (var i = 0; i < this.paths.length; i++) {
                var searchPath = this.paths[i];
                if (searchPath === path) {
                    return i;
                }
            }
            return -1;
        };
        this.addPath = function (inpaths, notify) {
            return this._addOrRemovePath(inpaths, notify, false);
        };
        this.removePath = function (inpaths, notify) {
            return this._addOrRemovePath(inpaths, notify, true);
        };
        this._addOrRemovePath = function (inpaths, notify, remove) {
            if (this.paths == null) {
                this.read();
            }

            var apaths = [];
            if (Array.isArray(inpaths)) {
                apaths = inpaths;
            }
            else {
                apaths.push(inpaths);   // single item
            }

            for(var i=0; i<apaths.length; i++) {
                var apath = path.normalize(apaths[i]);
                var pathIdx = this.findSearchPathIndex(apath);
                // remove the existing one
                if (pathIdx >= 0) {
                    this.paths.splice(pathIdx, 1);
                }
                if (!remove) {   // add
                    if (fs.existsSync(apath)) {
                        this.paths.push(apath);
                    }
                }
            }

            this.write();

            if(this.server.ccsAdapter.isEnabled()) {
                //this.server.ccsAdapter.updateExtRef(this.paths, true);
                this.server.ccsAdapter.updateExtRef(this.paths, false);
            }
        };
        this.getPaths = function() {
            // TODO - the path object in file may have different format such as {"path":"...","recursive":true}
            //        i.e. may need to extract the paths into an array before returning.
            return this.paths;
        };
        this.getDefaultSearchPaths = function() {
            if(vars.HOST === 'win32') {
                return ["c:\\ti"];
            }
            else if(vars.HOST === 'linux') {
                return ["/opt/ti"]; // sudo
            }
            else if(vars.HOST === 'darwin') {
                return ["/Applications/ti"];
            }
        };
        // init
        this._init();

    }

    function ImportPackageTransaction(parent, param) {
        this.parent = parent;   // parent PackageImporter
        this.importPackageName = param.pkgName;
        this.importPackageId = param.pkgId;
        this.importPackageVersion = param.pkgVersion;
        this.importPackageUuid = param.pkgUuid;
        this.importPackageLocalPath = parent.getPackageLocalPath(this.importPackageId, this.importPackageVersion);
        this.reqUrl = param.url;
        this.importPackageHeader = param.pkgHeader;
        if(param.localmeta) {
            this.localmeta = param.localmeta;
        }

        // Prepare
        this.prepare = function(callback) {
            callback(null);
        };

        // Collect, remote
        this.collectInfo = function(callback) {
            debugtrace('=> importCollectMetadata()');
            var self = this;

            if(this.localmeta) {
                var dbBuilder = require('./dbBuilder/dbBuilder');
                var p = [{
                    name : self.importPackageUuid,
                    path : self.importPackageLocalPath,
                    order : 1
                }];
                dbBuilder._refreshDatabase(null, null, p, self.parent.server.dbs, false, function () {

                    callback(null);
                });
            }
            else {
                /*
                parent.server.remoteGet(self.reqUrl, function (result, status) {
                    debugtrace('<= importCollectMetadata()');
                    if (_isStatusOK(status)) {
                        self.transaction.resources = result.resources;
                        self.transaction.overviews = result.overviews;
                        callback(null);
                    }
                    else {
                        callback(status);
                    }
                });
                */
                var progressInfo = new ProgressInfo(1, 1, null);    // dump
                debugtrace('... downloadBundleMetadata()');
                lsBundles.downloadBundleMetadata(this.importPackageUuid, progressInfo, function(err, _dstPath) {
                    if(err) {
                        if(_dstPath) {
                            fsutils.removeFile(_dstPath, false, null);
                        }
                        return callback(err);
                    }

                    self.transaction.dstPath = _dstPath;
                    try {
                        var jsonFiles = fsutils.readDirRecursive(_dstPath, /.*\.json$/);
                        var text = fs.readFileSync(path.join(_dstPath, jsonFiles[0]), 'utf8'); // there should be only one
                        var data = JSON.parse(text);
                        if(_dstPath) {
                            fsutils.removeFile(_dstPath, false, null);
                        }
                        if (data == null) {
                            return callback(null);
                        }
                        self.transaction.overviews = data.overviews;
                        self.transaction.resources = data.resources;
                    } catch (err) {
                        if(_dstPath) {
                            fsutils.removeFile(_dstPath, false, null);
                        }
                        return callback(err);
                    }

                    callback(null);
                });
            }
        };

        this.preprocess = function(callback) {
            debugtrace('=> importPreprocess()');
            var self = this;

            if(this.localmeta) {
                callback(null);
                return;
            }

            var _fileList = [];
            var _resourcesToBeAdded = [];
            var _overviewsToBeAdded = [];
            var _pdfLinksToBeAdded = [];
            var _extLinksToBeAdded = [];

            async.series([
                // function (callback) {
                //     // TODO - remove local offline contents from default location and clean up the DB
                //     callback();
                // },
                function (callback) {
                    //_overviewsToBeAdded = self.transaction.overviews;
                    // package info
                    async.each(self.transaction.overviews, function (overview, callback) {
                        if (overview.resourceType === 'packageOverview' && overview.packageId === self.importPackageId) {
                            if (overview.version === self.importPackageVersion) {
                                self.importRemotePackagePath = overview.packagePath;
                                self.transaction.nodeInfo.packagePath = overview.packagePath;
                                // modify the incoming overview record
                                overview.local = 'full';  // tag it as local
                                //overview.packagePath = self.importPackageLocalPath; // set to local absolute path
                                overview.localPackagePath = self.importPackageLocalPath; // set to local absolute path
                            }
                        }

                        // TODO - modify all the relative links to absolute? image, local link, icon, etc.
                        _overviewsToBeAdded.push(overview);

                        setImmediate(callback);
                    }, function (err) {
                        setImmediate(callback, err);
                    });
                },
                function (callback) {
                    async.each(self.transaction.resources, function (resource, callback) {
                        // change from relative to absolute path before adding
                        var _relbase = self.importRemotePackagePath;
                        if(resource.link) {
                            var _link = resource.link.replace(/\\/g, '/');
                            _link = _link.replace(_relbase, self.importPackageLocalPath);
                            resource.link = _link;
                        }

                        _relbase = vars.CCS_CLOUD_IMPORT_PATH +'/' + self.importRemotePackagePath;
                        if(resource._importProjectCCS) {
                            var _ccsImportProject = resource._importProjectCCS.replace(/\\/g, '/');
                            _ccsImportProject = _ccsImportProject.replace(_relbase, self.importPackageLocalPath);
                            resource._importProjectCCS = _ccsImportProject;
                        }

                        if(resource._createProjectCCS) {
                            var _createProjectCCS = resource._createProjectCCS.replace(/\\/g, '/');
                            _createProjectCCS = _createProjectCCS.replace(_relbase, self.importPackageLocalPath);
                            resource._createProjectCCS = _createProjectCCS;
                        }

                        _resourcesToBeAdded.push(resource);
                        setImmediate(callback);
                    }, function (err) {
                        setImmediate(callback, err);
                    });
                },
                function (callback) {
                    // remove old overview records
                    parent.server.dbs.dbOverviews.remove({packageId: self.importPackageId, packageVersion: self.importPackageVersion}, function() {
                        callback();
                    });
                },
                function (callback) {
                    // remove old resource records
                    parent.server.dbs.dbResources.remove({packageId: self.importPackageId, packageVersion: self.importPackageVersion}, function() {
                        callback();
                    });
                }
            ], function (err) {
                self.transaction.fileList = _fileList;
                self.transaction.resourcesToBeAdded = _resourcesToBeAdded;
                self.transaction.overviewsToBeAdded = _overviewsToBeAdded;
                self.transaction.pdfLinksToBeAdded = _pdfLinksToBeAdded;
                self.transaction.extLinksToBeAdded = _extLinksToBeAdded;
                debugtrace('<= importPreprocess()');
                callback(err);
            });
        };

        // Post-process, local
        this.postprocess = function(callback) {
            debugtrace('=> importPostprocess()');
            var self = this;

            if(this.localmeta) {
                callback(null);
                return;
            }

            async.series([
                function(callback) {
                    // update discovered package DB
                    debugtrace('... updating discovered package DB');
                    if(self.importPackageId && self.importPackageVersion) {
                        parent.packageImported(self.importPackageId, self.importPackageVersion, true);
                    }
                    callback();
                },
                function(callback) {
                    // update overviews DB
                    debugtrace('... updating overviews DB');
                    if (self.transaction.overviews.length > 0) {
//                        parent.server.dbs.dbOverviews.insertOrSkipSync(self.transaction.overviews);
                        parent.server.dbs.dbOverviews.insert(self.transaction.overviews, function() {
                            parent.server.dbs.dbOverviews.save(function (err) {
                                callback(err);
                            });
                        });
                    }
                    else {
                        callback();
                    }
                },
                function(callback) {
                    // update resources DB
                    debugtrace('... updating resources DB');
                    if (self.transaction.resources.length > 0) {
//                        parent.server.dbs.dbResources.insertOrSkipSync(self.transaction.resources);
                        parent.server.dbs.dbResources.insert(self.transaction.resources, function() {
                            // assume that newly imported packages are going to be shown in tirex tree, i.e. keep them in the use list
                            var packagesUsing = parent.server.dbs.dbResources.using();
							packagesUsing.push(self.importPackageId + vars.BUNDLE_ID_VERSION_DELIMITER + self.importPackageVersion);
                            parent.server.dbs.dbResources.use(packagesUsing, function() {
                                parent.server.dbs.dbResources.save(function(err) {
                                    callback(err);
                                });
                            });
                        });
                    }
                    else {
                        callback();
                    }
                }
            ], function(err) {
                debugtrace('<= importPostprocess()');
                callback(err);
            });
        };

        // execute all the functions
        this.execute = function(callback) {
            this.transaction.progressMon.execute(callback);
        };

        var progressMon = new Progress({progressId: param.progressId, name:'Importing package: '+this.importPackageId+'__'+this.importPackageVersion, server:server});
        progressMon.addChild(new Progress({name: 'Preparing', func: this.prepare, funcParent: this}), 5);
        progressMon.addChild(new Progress({name: 'Collecting', func: this.collectInfo, funcParent: this, remote: true}), 80);
        progressMon.addChild(new Progress({name: 'Filtering', func: this.preprocess, funcParent: this}), 10);
        progressMon.addChild(new Progress({name: 'Updating', func: this.postprocess, funcParent: this}), 5);

        this.transaction = {
            //
            progressMon: progressMon,
            nodeInfo: {type: 'container'}
        };
    }
}

function CCSAdapter(myHttpPort) {
    var CCS_REDISCOVER_PRODUCTS_API = 'rediscoverProducts';
    var CCS_GET_PRODUCTS_API = 'getProducts';
    var CCS_REGISTER_LISTENER_API = 'registerListener';
    // init
    if(vars.CCS_LOCALPORT != null) {
        this.localPort = vars.CCS_LOCALPORT;
        this.localAddr = 'http://localhost:' + this.localPort + '/';
        this.lppCCS = new LocalPrivatePackages(null);
        this.myHttpPort = myHttpPort;

        var _ccsRoot = path.resolve(vars.BIN_BASE_PATH,'../../../'); // installed at ...ccsRoot/tirex/ti-rex-core/bin
        if (fs.existsSync(_ccsRoot)) {
            var children = fs.readdirSync(_ccsRoot);
            if(children.indexOf('ccs_base') !== -1) {
                this.ccsRoot = _ccsRoot;
            }
        }
        logInfo('CCS host: '+ this.localAddr);
    }

    this.isEnabled = function() {
        return this.localPort != null;
    };

    /*
     * Example:
     *    replace "//tgdccscloud.toro.design.ti.com/ide/api/ccsserver"
     *    by "http://localhost:58538"
     */
    this.translateProjectPath = function(cpath) {
        if(!this.isEnabled()) {    // no CCS
            return cpath;
        }
        var cloudAddr = new RegExp( '.*/ide/api/ccsserver/', 'g');
        return cpath.replace(cloudAddr, this.localAddr);
    };

    this.notifyRefUpdate = function() {
        if(!this.isEnabled()) {    // no CCS
            return ;
        }
        var url = this.localAddr + CCS_REDISCOVER_PRODUCTS_API;
        request.get(url, function() {
            // catch and ignore any error
        });
    };

    this.getDiscoveredProducts = function(callback) {
        var self = this;
        if(!this.isEnabled()) {    // no CCS
            callback();
        }
        else {
            var url = this.localAddr + CCS_GET_PRODUCTS_API;
            request.get(url, function(err, result) {
                if(err == null && result.statusCode === 200) {
                    self.lppCCS.clear();
                    self.lppCCS.insert(JSON.parse(result.body));
                }
                callback();
            });
        }
    };

    this.registerListener = function(myHttpPort, callback) {
        var self = this;
        if(!this.isEnabled()) {    // no CCS
            callback();
        }
        else {
            if(serverState.ccs == null) {
                serverState.ccs = {};
            }
            // register products changed event
            // Ex: http://localhost:61895/registerListener?portNumber=3001&path=ccsEvent
            var url = this.localAddr + CCS_REGISTER_LISTENER_API;
            url += '?localPort='+myHttpPort + '&path=ccsEvent';
            request.get(url, function(err, result) {
                callback();
            });
        }
    };
    this.onEvent = function(req, res) {
        if(this.isEnabled()) {
            if (req.query.name === 'productsChanged') {
                this.getDiscoveredProducts(function() {
                    serverState.ccs.productsChanged = true;
                });
            }
        }
        res.send(200);
    };
    this.onClearEvent = function(req, res) {
        if(this.isEnabled()) {
            if (req.query.name === 'productsChanged') {
                delete serverState.ccs.productsChanged;
            }
        }
        res.send(200);
    };

    this.updateExtRef = function(paths, notify) {
        // write to file TIREX_2
        var ccsExtRefDir = path.join(ti_util.getUserHome(), 'ti/CCSExternalReferences');
        if (fs.existsSync(ccsExtRefDir) === false) {
            mkdirp.sync(ccsExtRefDir);
        }
        var tirex_2_file = path.join(ccsExtRefDir, 'TIRex_2');
        var token = 'ti-rex-content';
        var token2 = 'ti-products[TI_PRODUCTS_DIR]';
        var token3 = 'searchpath';
        // default tirex content path
        var body = token + '=' + path.normalize(vars.CONTENT_BASE_PATH) + '\n';
        // default product path
        body = body + token2 + '=' + path.normalize(vars.CONTENT_BASE_PATH) + '\n';
        // builtin
        var searchBase = token3 + '=' + vars.CONTENT_BASE_PATH;
        body = body + path.join(searchBase) + '\n';
        //body = body + path.join(searchBase, 'ti-rtos_cc13xx_cc26xx') + '\n';
        //body = body + path.join(searchBase, 'ti-rtos_cc32xx') + '\n';
        //body = body + path.join(searchBase, 'ti-rtos_msp43x') + '\n';
        //body = body + path.join(searchBase, 'ti-rtos_tivac') + '\n';
        //body = body + path.join(searchBase, 'energia') + '\n';
        //body = body + path.join(searchBase, 'mspware') + '\n';
        //body = body + path.join(searchBase, 'xdctools') + '\n';
        // additional specified paths
        for (var i = 0; i < paths.length; i++) {
            var spath = path.normalize(paths[i]);
            //body = body + token2 + '=' + spath + '\n';
            body = body + token3 + '=' + spath + '\n';
        }
        // write file
        fs.writeFileSync(tirex_2_file, body);
        // notify CCS
        if(notify) {
            this.notifyRefUpdate();
        }
    };
    function _resolvePath(_urlObjField) {
        let _paths = _urlObjField.split(';');
        _urlObjField = '';
        for (let i=0; i<_paths.length; i++) {
            if(_paths[i].startsWith('/content/')) {
                _paths[i] = _paths[i].slice('/content/'.length);
                _paths[i] = _translateContentPath(_paths[i]);
            }
            _urlObjField += _paths[i];
            if (i !== _paths.length-1) {
                _urlObjField += ';';
            }
        }
        return _urlObjField;
    }
    this.redirectAPI = function(from, to, req, res) {
        if (this.isEnabled() === false) {
            res.send(404);
            return;
        }
        var _urlObj = urlParser.parse(req.url, true);
        // assign host
        delete _urlObj.host;
        _urlObj.protocol = 'http:';
        _urlObj.hostname = 'localhost';
        _urlObj.port = this.localPort;

        // special handling:
        //   resolve tirex content path in importProject
        //   /importProject?location=[_semicolon_separated_paths_]&deviceId=[_id_]&cookie=[_string_]&openFile=[_single_filename_]&queryLocation=[true/false]
        if (_urlObj.pathname.indexOf('importProject') >= 0 && _urlObj.query.location) {
            delete _urlObj.search;  // remove so that it will be reconstructed in format()
            _urlObj.query.location = _resolvePath(_urlObj.query.location);
        }
        //   resolve tirex content path in importSketch
        //   /importSketch?sketchFile=[_filename_]&boardId=[_id_]
        else if (_urlObj.pathname.indexOf('importSketch') >= 0 && _urlObj.query.sketchFile) {
            delete _urlObj.search;  // remove so that it will be reconstructed in format()
            _urlObj.query.sketchFile = _resolvePath(_urlObj.query.sketchFile);
        }
        //   resolve tirex content path in createProject
        //   /createProject?projectName=[_name_]&deviceId=[_id_]&copyFiles=[_source_files_]
        else if (_urlObj.pathname.indexOf('createProject') >= 0 && _urlObj.query.copyFiles) {
            delete _urlObj.search;  // remove so that it will be reconstructed in format()
            _urlObj.query.copyFiles = _resolvePath(_urlObj.query.copyFiles);
        }

        // modify pathname, replace [from] to [to] if defined
        if (from) {
            _urlObj.pathname = _urlObj.pathname.slice(from.length);
        }
        if (to) {
            _urlObj.pathname = urlParser.resolve(to, _urlObj.pathname);
        }
        // send
        var newUrl = urlParser.format(_urlObj);
        //res.redirect(newUrl);
        request.get(newUrl, function(err, result) {
            if(result == null) {
                res.send(500, 'CCS not responding.')
            }
            else {
                res.send(result.statusCode, result.body);
            }
        });
    };

    // register with CCS
    this.registerListener(this.myHttpPort, function(){});
}

/*
 * private local package collection and utility
 */
function LocalPrivatePackages(file) {
    this.file = file;
    // James: temp patch
    this.name = path.basename(this.file || '');
    this.pkgs = [];

    this.load = function() {
        // clear
        this.pkgs = [];
        if (this.file === null) {
            return;
        }
        try {
            var data = fs.readFileSync(this.file, 'utf8');
            this.pkgs = JSON.parse(data);
        } catch (err) {
            if(err.code !== 'ENOENT') {
                logInfo('Error reading ' + this.file + ' : ' + err.message);
            }
        }

    };
    this.save = function() {
        if (this.file === null) {
            return;
        }
        try {
            var d = JSON.stringify(this.pkgs);
            fs.writeFileSync(this.file, d, 'utf8');
        } catch (err) {
            logError('Error writing ' + this.file + ' : ' + err.message);
        }
    };
    this.insertOne = function(newPkg) {
        if(!newPkg.packageUid && newPkg.id && newPkg.version) {
            // construct UID by id & version
            newPkg.packageUid = newPkg.id + vars.BUNDLE_ID_VERSION_DELIMITER + newPkg.version;
        }
        if(newPkg.packageUid) {
            // has UID
            var found = this.findByUID(newPkg.packageUid);
            if (found.idx >= 0) {
                this.pkgs[found.idx] = newPkg;
            }
            else {
                this.pkgs.push(newPkg);
            }
        }
        else {
            // no UID
            var idx = this.pkgs.indexOf(newPkg);
            if(idx>=0) {
                this.pkgs[idx] = newPkg;
            }
            else {
                this.pkgs.push(newPkg);
            }
        }
        this.flush();
    };
    this.insert = function(newPkgs) {
        if (Array.isArray(newPkgs)) {
            for (var i = 0; i < newPkgs.length; i++) {
                this.insertOne(newPkgs[i]);
            }
        } else {
            this.insertOne(newPkgs);
        }
    };
    this.clear = function() {
        this.pkgs = [];
        this.flush();
    };
    this.flush = function() {
        this.save();
    };
    /*
     * Remove package by unique ID.
     */
    this.removeByUID = function(uid) {
        var found = this.findByUID(uid);
        if(found.idx >= 0) {
            this.pkgs.splice(found.idx, 1);
            this.flush();
        }
    };
    /*
     * Remove package by versioned ID.
     */
    this.removeByVID = function(id, version) {
        this.removeByUID(id + vars.BUNDLE_ID_VERSION_DELIMITER + version);
    };
    /*
     * Find package by a given property.
     */
    this.findByProperty = function(key, value) {
        for(var i=0; i<this.pkgs.length; i++) {
            var pkg = this.pkgs[i];
            if(pkg[key] == value) {
                return {idx: i, pkg: pkg};
            }
        }
        return {idx: -1, pkg: null};
    };
    /*
     * Find package by package unique ID.
     */
    this.findByUID = function(uid) {
        return this.findByProperty('packageUid', uid);
    };
    /*
     * Find package by versioned ID.
     */
    this.findByVID = function(id, version) {
        for(var i=0; i<this.pkgs.length; i++) {
            var pkg = this.pkgs[i];
            if(pkg.id === id && pkg.version === version) {
                return pkg;
            }
        }
        return null;
    };
    /*
     * Find the package by package-path used in the cloud server.
     */
    this.findByPackagePath = function(pkgpath) {
        return this.findByProperty('packagePath', pkgpath).pkg;
    };
    this._comparePath = function(p1, p2) {
        if(!p1 || !p2) {
            return false;
        }
        p1 = path.normalize(p1);
        p2 = path.normalize(p2);
        if(vars.HOST === 'win32') {
            p1 = p1.toLowerCase();
            p2 = p2.toLowerCase();
        }
        return p1 == p2;
    };
    /*
     * Find the package by local physical package path.
     */
    this.findByLocalPackagePath = function(path) {
        for(var i=0; i<this.pkgs.length; i++) {
            var pkg = this.pkgs[i];
            if(this._comparePath( pkg['localPackagePath'], path)) {
                return pkg;
            }
        }
        return null;
    };
    /*
     * Find the package by directory. Used for scanning local installed package.
     */
    this.findByDir = function(dir) {
        if(dir == null) {
            return null;
        }
        for (var i = 0; i < this.pkgs.length; i++) {
            var pkg = this.pkgs[i];
            var installpath = this.getInstallPath(pkg, false, true);
            if (installpath == null && pkg.packagePath != null) {
                // no install path specified, use the last part of packagePath
                installpath = path.basename(pkg.packagePath);
            }
            if (installpath) {
                if(this._comparePath(path.basename(installpath), dir)) {
                    return JSON.parse(JSON.stringify(pkg)); // return a copy
                }
            }
        }
        return null;
    };
    /*
     * Find the package matches the query path, the category.
     */
    this.findByQueryPath = function(queryPath, queryPackage) {
        var packageFilters = [];
        if (queryPackage) {
            var pkgIds = queryPackage.split(vars.BUNDLE_LIST_DELIMITER);
            for (var d = 0; d < pkgIds.length; d++) {
                var vids = pkgIds[d].split(vars.BUNDLE_ID_VERSION_DELIMITER);
                packageFilters[vids[0]] = vids[1];
            }
        }
        for (var i=0; i<this.pkgs.length; i++) {
            var pkg = this.pkgs[i];
            for (var ci=0; ci<pkgHdr.rootCategory.length; ci++) {
                var cat = pkg.rootCategory[ci];
                if (cat === queryPath) {
                    // matched category
                    if(pkg.packageVersion === packageFilters[pkg.packageId]) {
                        // matched VID
                        return pkg;
                    }
                }
            }
        }
        // Not found
        return null;
    };
    /*
     * Find the package by content link.
     * Extract the leading package path and find the package accordingly.
     * Ex: cc26xx_bluetooth_smart/cc26xx_bluetooth_smart__2.01.00.44423/Projects/...
     *     find the package with path "cc26xx_bluetooth_smart/cc26xx_bluetooth_smart__2.01.00.44423"
     */
    this.findByLink = function(link) {
        for (var i=0; i<this.pkgs.length; i++) {
            var pkg = this.pkgs[i];
            if(link.indexOf(pkg.packagePath)==0) {  // starts with
                return pkg;
            }
        }
        // Not found
        return null;
    };
    /*
     * Find the package by link with embedded packagePath anywhere.
     * Extract the embedded package path and find the package accordingly.
     * Ex: "//{ccs-url}/ide/api/ccsserver/importProject?location=@ti-rex-content/ti-rtos_tivac/ti-rtos_tivac__2.16.00.08/resources/..."
     *     find the package with path "ti-rtos_tivac/ti-rtos_tivac__2.16.00.08"
     */
    this.findByLinkWithEmbeddedPath = function(link, leading) {
        for (var i=0; i<this.pkgs.length; i++) {
            var pkg = this.pkgs[i];
            var idx = link.indexOf(pkg.packagePath);
            if (idx >= 0) {
                // found
                if(leading) {
                    // only starts with packagePath
                    if(idx === 0) {
                        return pkg;
                    }
                }
                else {
                    // anywhere
                    return pkg;
                }
            }
        }
        // Not found
        return null;
    };
    /*
     * Map the package path (used in cloud) to the default install path (used in desktop)
     */
    this.mapRemoteToInstallPath = function(packagePath, relative) {
        var mapped = null;
        // find the package
        var pkg = this.findByPackagePath(packagePath);
        if(pkg) {
            // get the install path
            var installpath = this.getInstallPath(pkg, false, true);
            if(installpath) {
                // Maintaint the package path but replace the basename
                //var basename = path.basename(installpath);
                //var lastSep = packagePath.lastIndexOf('/');
                // mapped = packagePath.substring(0, lastSep+1) + basename;

                // Just use the provided install path
                mapped = installpath;

                // Prepend with local content base path.
                if(!relative) {
                    mapped = path.join(vars.CONTENT_BASE_PATH, mapped); // ex: c:/ti/tirex-content/energia/...
                }
            }
            else {
                // no mapping
                mapped = packagePath;
                if(!relative) {
                    mapped = path.join(vars.CONTENT_BASE_PATH, mapped); // ex: c:/ti/tirex-content/energia/...
                }
            }
        }
        return mapped;
    };
    this.findRemovedFromFileSystem = function() {

    };
    /*
     * Get the OS specific default install path
     */
    this.getInstallPath = function(pkg, tolower, normalize) {
        var installpath = null;
        if(!pkg) {
            return installpath;
        }
        if(pkg.installFolder != null) {
            if(vars.HOST === 'win32') {
                installpath = pkg.installFolder.win;
            }
            else if(vars.HOST === 'linux') {
                installpath = pkg.installFolder.linux;
            }
            else if(vars.HOST === 'darwin') {
                installpath = pkg.installFolder.mac;
            }
        }
        if(installpath) {
            if(normalize) {
                installpath = path.normalize(installpath.replace(/\\/g, '/'));
            }
            if(tolower) {
                installpath = installpath.toLowerCase();
            }
        }
        return installpath;
    };

    this.load();
}
// ]
