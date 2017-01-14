/**
 *
 *
 * Oliver Sohm, 3/4/2016
 */

'use strict';

// third party
var dlogger = require('../logger')();
var async = require('async');
var request = require('request').defaults({forever: true});
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var querystring = require('querystring');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var unzip = require('unzip');
var exec = require('child_process').exec;

// our modules
var vars = require('../vars');
var query = require('../query');
var dbBuilderResources = require('../dbBuilder/resources');
var ProgressInfo = require('../progress').ProgressInfo;
var fsutils = require('./fsutils');

exports.bundlesProgressInfos = {};

exports.makeOfflineBundles = function(vidList, progressId, dbDevices, dbDevtools, dbOverviews, dbResources, dbPureBundles) {
    var vidArr = vidList.split(vars.BUNDLE_LIST_DELIMITER);
    var progressInfo = new ProgressInfo(6, vidArr.length, null, [/*files:*/0.1, 0.65, 0.2, /*metadata:*/0.01, 0.03, 0.01]);
    exports.bundlesProgressInfos[progressId] = progressInfo;
    async.eachSeries(vidArr, function(vid, callback) {
        makeOfflineBundle(vid, dbDevices, dbDevtools, dbOverviews, dbResources, dbPureBundles, progressInfo, callback);
    }, function(err) {
        if (progressInfo.cancel === true) {
            dlogger.info('makeOfflineBundles: Cancelling ' + progressId);
            delete exports.bundlesProgressInfos[progressId];
        } else {
            progressInfo.done = true;
            progressInfo.error = err;
            if (err) {
                dlogger.error('makeOfflineBundles: ' + JSON.stringify(err));
            }
            // [ Metadata_2.1 : the offlined package may be a hidden H/W package
            if (dbOverviews.hwPackagesID && dbResources.useHidden) {
                // update rexdb-split with hidden package info
                dbResources.useHidden(dbOverviews.hwPackagesID);
                dbResources.use(dbResources.using(), function(){});
            }
            // ]
        }
    });
};

exports.downloadBundleMetadata = function(vid, progressInfo, callback) {
    return downloadBundleFilesOrMetadata(vid, 'makeoffline', progressInfo, callback);
};

/**
 *
 * @param vid: versioned ID of the bundle
 * @param downloadOrMakeoffline: 'download' (download files) or 'makeoffline' (download metadata)
 * @param progressInfo
 * @param callback(err, dstPath): dstPath: path where the zip was extracted to
 */
function downloadBundleFilesOrMetadata(vid, downloadOrMakeoffline, progressInfo, callback) {
    var zipFilePath = '';
    var message = downloadOrMakeoffline === 'download' ? 'files' : 'metadata';
    async.waterfall([
        // request remote server to archive all assets of the bundle
        function (callback) {
            progressInfo.message = 'Archiving ' + message;
            progressInfo.progressId = generateProgressId();
            var qs = querystring.stringify({vid: vid, __TYPE__: 'true', progressId: progressInfo.progressId, os: vars.HOST});
            qs = qs.replace('__TYPE__', downloadOrMakeoffline);
            request.get({
                url: vars.REMOTESERVER_BASEURL + '/api/bundle?' + qs,
                headers: {'user-agent': vars.LOCALSERVER_USER_AGENT}, // remote server routing
            }, function (err, response, body) {
                if (err) {
                    callback(err);
                } else if (response.statusCode === 202) {
                    poll(progressInfo.progressId, callback);
                } else {
                    callback('getBundleFilesOrMetadata error: expected status code 202 but got ' + response.statusCode + ': ' + JSON.stringify(body));
                }
            });
            function poll(progressId, callback) {
                request.get({
                    url: vars.REMOTESERVER_BASEURL + '/api/downloadprogress/' + progressId,
                    headers: {'user-agent': vars.LOCALSERVER_USER_AGENT}, // remote server routing
                    json: true
                }, function (err, response, body) {
                    if (err) {
                        callback(err);
                    } else if (response.statusCode === 206) {
                        // not done yet
                        progressInfo.setStageWorked(body.progress, 100);
                        setTimeout(function () {
                            poll(progressId, callback);
                        }, 1000);
                    } else if (response.statusCode === 200) {
                        // done
                        progressInfo.stageDone();
                        if (body != null) {
                            callback(null, body);
                        } else {
                            callback('getBundleFilesOrMetadata error: no response body for /api/downloadprogress/');
                        }
                    } else {
                        callback('getBundleFilesOrMetadata error: expected status code 206 or 200 but got ' + response.statusCode);
                    }
                });
            }
        },
        // now download the archive (can be cancelled)
        // TODO: for now expecting a zip archive, it will fail if single unzipped file or NothingToDownload.txt since this is quite unlikely to happen for bundles.
        function (previousBody, callback) {
            progressInfo.message = 'Downloading ' + message;
            var total, worked = 0;
            zipFilePath = path.join(vars.DOWNLOADS_BASE_PATH,  'tmp_bundle_' + vid + '_' + downloadOrMakeoffline  + '_' + progressInfo.progressId + '.zip');
            //TODO WARN This only works because remote server locations don't start with http. Also because the fds server starts with http
            var zipLocation = previousBody.result;
            if(zipLocation.indexOf('http') === -1) {
                zipLocation = vars.REMOTESERVER_BASEURL + '/' + previousBody.result;
            }
            var theRequest = request.get({
                url:zipLocation,
                headers: {'user-agent': vars.LOCALSERVER_USER_AGENT}, // remote server routing
                strictSSL: false}); // using https to download from Akamai to prevent proxy virus scanners from disrupting download: Akamai server did not have a valid SSL certificate
            let calledback = false;
            theRequest
                .on('error', function (err) {
                    if (!calledback) {
                        calledback = true;
                        callback(err);
                    }
                })
                .on('response', function (res) {
                    if (res.statusCode === 200) {
                        total = parseInt(res.headers['content-length'], 10);
                    } else {
                        if (!calledback) {
                            calledback = true;
                            callback('getBundleFilesOrMetadata error: ' + res.req.url + ': expected status code 200 but got ' + res.statusCode);
                        }
                    }
                })
                .on('data', function (data) {
                    worked += data.length;
                    progressInfo.setStageWorked(worked, total);
                    progressInfo.canCancel = true;
                    if (progressInfo.cancel === true) {
                        theRequest.abort();
                        if (!calledback) {
                            calledback = true;
                            callback('CANCEL');
                        }
                    }
                })
                .pipe(fs.createWriteStream(zipFilePath)
                    .on('error', function (error) {
                        if (!calledback) {
                            calledback = true;
                            callback(error);
                        }
                    })
                    .on('finish', function () {
                        progressInfo.canCancel = false;
                        progressInfo.stageDone();
                        if (!calledback) {
                            calledback = true;
                            callback(null, total);
                        }
                    })
            );
        },
        // get the size of the downloaded the archive file (for progress)
        function (expectedSize, callback) {
            fs.stat(zipFilePath, function (err, stat) {
                if (err) {
                    callback(err);
                } else {
                    if(expectedSize !== stat.size) {
                        callback('Incomplete download: '+ vid);
                    } else {
                        callback(null, zipFilePath, stat.size);
                    }
                }
            });
        },
        // unzip the downloaded the archive: figure out dstPath
        function (zipFilePath, zipFileSize, callback) {
            progressInfo.message = 'Extracting ' + message;
            var dstPath;
            if (downloadOrMakeoffline === 'download') {
                dstPath = vars.CONTENT_BASE_PATH;
                setImmediate(function() {
                    callback(null, zipFilePath, zipFileSize, dstPath);
                });
            } else if (downloadOrMakeoffline === 'makeoffline') {
                dstPath = path.join(vars.DOWNLOADS_BASE_PATH, path.basename(zipFilePath, '.zip'));
                mkdirp(dstPath, function(err) {
                    if (err) {
                        callback('mkdirp error: ' + err);
                    } else {
                        callback(null, zipFilePath, zipFileSize, dstPath);
                    }
                });
            }
        },
        // unzip the downloaded the archive
        function (zipFilePath, zipFileSize, dstPath, callback) {
            progressInfo.message = 'Extracting ' + message;
            if (process.platform === 'win32') {
                // unzip.exe not handling long path names correctly on win
                var worked = 0;
                let calledback = false;
                fs.createReadStream(zipFilePath)
                    .on('data', function (data) {
                        worked += data.length;
                        progressInfo.setStageWorked(worked, zipFileSize);
                    })
                    .pipe(unzip.Extract({path: dstPath})
                        .on('error', function (err) {
                            if (!calledback) {
                                calledback = true;
                                callback('unzip error: ' + err);
                            }
                        })
                        .on('close', function () {
                            progressInfo.stageDone();
                            if (!calledback) {
                                calledback = true;
                                callback(null, dstPath);
                            }
                        })
                );
            } else {
                var unzipExec;
                if (process.platform === 'darwin') {
                    unzipExec = 'unzip'; // use the pre-installed one
                } else {
                    unzipExec = path.join(vars.BIN_BASE_PATH, 'unzip');
                }
                var cmd = unzipExec + ' -q -u -o ' + '\"' + zipFilePath + '\"' + ' -d ' + '\"' + dstPath + '\"';
                exec(cmd, function (err) {
                    if (err != null) {
                        dlogger.error('unzip cmd: ' + cmd);
                        dlogger.error('unzip exec error: ' + err);
                        callback(err);
                    } else {
                        progressInfo.stageDone();
                        callback(null, dstPath);
                    }
                });
            }
        }], function(err, dstPath) {
        fs.unlink(zipFilePath, function () {
            callback(err, dstPath);
        });
    });
}

function makeOfflineBundle(vid, dbDevices, dbDevtools, dbOverviews, dbResources, dbPureBundles, progressInfo, callback) {
    var dependentBundles = [];
    var dstPath;
    async.waterfall([
            // request remote server to archive and send all files of the bundle
            function(callback) {
                downloadBundleFilesOrMetadata(vid, 'download', progressInfo, function(err) {
                    callback(err);
                });
            },
            // get the metadata records for the bundle from the remote server
            function(callback) {
                downloadBundleFilesOrMetadata(vid, 'makeoffline', progressInfo, function(err, _dstPath) {
                    dstPath = _dstPath;
                    var data;
                    if (err) {
                        return callback(err);
                    }
                    try {
                        var jsonFiles = fsutils.readDirRecursive(dstPath, /.*\.json$/);
                        var text = fs.readFileSync(path.join(dstPath, jsonFiles[0]), 'utf8'); // there should be only one
                        data = JSON.parse(text);
                    } catch (err) {
                        return callback(err);
                    }
                    if (data == null) {
                        return callback(null, []);
                    }
                    dependentBundles = dependentBundles.concat(data.dependentBundles);
                    dbOverviews.insert(data.overviews, function() {
                        if (!vars.RELOCATE_PACKAGES) {
                            // if relocate needed, defer dbResource update until package info is available
                            dbResources.insert(data.resources, function() {
                                callback(null, data.resources);
                            });
                        } else {
                            callback(null, data.resources);
                        }
                    });
                });
            },
            // get the bundle definition itself and mark it as 'local'
            function(resources, callback) {
                var platform = vars.HOST;
                var qs = querystring.stringify({vid: vid});
                request.get({
                    url: vars.REMOTESERVER_BASEURL + '/api/bundle?' + qs,
                    headers: {'user-agent': vars.LOCALSERVER_USER_AGENT}, // remote server routing
                    json:true,
                    os:platform}, function (err, response, body) {
                    if (err) {
                        callback('makeOfflineBundle error: ' + err);
                    } else if (response.statusCode !== 200) {
                        callback('makeOfflineBundle error: expected status code 200 but got ' + response.statusCode);
                    } else if (body == null || typeof body !== 'object') {
                        callback('makeOfflineBundle error: expected body to be an object:' + JSON.stringify(body));
                    } else {
                        var bundleRecord = body;
                        bundleRecord.localPackagePath = path.join(vars.CONTENT_BASE_PATH, bundleRecord.packagePath);
                        bundleRecord.local = 'full';
                        upsertBundleRecord(bundleRecord, function() { callback(null, bundleRecord, resources); });
                    }
                });
            },
            // check if the bundle has a core dependency definition; this is a type of nested bundle and needs to be marked local too
            function(bundleRecord, resources, callback) {
                async.each(bundleRecord.coreDependencies, function (coreDep, callback) {
                    var platform = vars.HOST;
                    var qs = querystring.stringify({vid: coreDep.refId + vars.BUNDLE_ID_VERSION_DELIMITER + coreDep.version, os:platform});
                    request.get({
                        url: vars.REMOTESERVER_BASEURL + '/api/bundle?' + qs,
                        headers: {'user-agent': vars.LOCALSERVER_USER_AGENT}, // remote server routing
                        json: true
                    }, function (err, response, body) {
                        if (err) {
                            callback('makeOfflineBundle error: ' + err);
                        } else if (response.statusCode !== 200) {
                            callback('makeOfflineBundle error: expected status code 200 but got ' + response.statusCode);
                        } else {
                            body.local = 'full';
                            body.localPackagePath = path.join(vars.CONTENT_BASE_PATH, body.packagePath);
                            upsertBundleRecord(body, callback);
                        }
                    });
                }, function() {
                    setImmediate(callback, null, bundleRecord, resources);
                });
            },
            // relocate contents using local install path
            function(bundleRecord, resources, callback) {
                if(!vars.RELOCATE_PACKAGES) {
                    // no action
                    return setImmediate(callback);
                }
                var installPath = null;
                if(bundleRecord.installFolder != null) {
                    if (vars.HOST === 'win32') {
                        installPath = bundleRecord.installFolder.win;
                    }
                    else if (vars.HOST === 'linux') {
                        installPath = bundleRecord.installFolder.linux;
                    }
                    else if (vars.HOST === 'darwin') {
                        installPath = bundleRecord.installFolder.mac;
                    }
                }
                if (installPath == null) {
                    dbResources.insert(resources, function(err) {
                        callback(); // don't treat as error, just not relocating
                    });
                    return;
                }
                // modify resources
                for (var i = 0; i < resources.length; i++) {
                    var resource = resources[i];
                    if (resource.linkType === 'local') {
                        if (resource.link) {
                            resource.link = resource.link.replace(bundleRecord.packagePath, installPath);
                        }
                        if (resource._importProjectCCS) {
                            resource._importProjectCCS = resource._importProjectCCS.replace(bundleRecord.packagePath, installPath);
                        }
                        if (resource._createProjectCCS) {
                            resource._createProjectCCS = resource._createProjectCCS.replace(bundleRecord.packagePath, installPath);
                        }
                    }
                }
                dbResources.insert(resources, function(err) {
                    // relocate physical files
                    var srcLoc = path.join(vars.CONTENT_BASE_PATH, bundleRecord.packagePath);
                    var dstLoc = path.join(vars.CONTENT_BASE_PATH, installPath);
                    fsutils.move(srcLoc, dstLoc, vars.CONTENT_BASE_PATH, function (err) {
                        bundleRecord.localPackagePath = dstLoc;
                        upsertBundleRecord(bundleRecord, callback);
                    });
                });
            }
        ], function(err) {
            if (dstPath != null) {
                rimraf(dstPath, function(){});
            }
            findMissingBundles(function () {
                dbPureBundles.save(function () {
                    dbOverviews.save(function () {
                        dbResources.save(function () {
                            query.clearCaches();
                            callback(err);
                        });
                    });
                });
            });
        }
    );

    function upsertBundleRecord(bundleRecord, callback) {
        if (bundleRecord.resourceType === 'bundle') {
            dbPureBundles.upsert({_id: bundleRecord._id}, bundleRecord, callback);
        } else if (bundleRecord.resourceType === 'packageOverview' || bundleRecord.resourceType === 'categoryInfo') {
            dbOverviews.upsert({_id: bundleRecord._id}, bundleRecord, callback);
        } else {
            dbResources.upsert({_id: bundleRecord._id}, bundleRecord, callback);
        }
    }

    function findMissingBundles(callback) {
        var missingBundles = [];
        async.each(dependentBundles, function(dependentBundle, callback) {
            query.findBundle(dependentBundle.id, dependentBundle.version, dbOverviews, dbPureBundles, dbResources, function(err, bundle) {
                if (err) {
                    callback(err);
                } else if (bundle == null || (bundle != null && bundle.local !== 'full')) {
                    missingBundles.push(dependentBundle);
                    callback();
                } else {
                    callback();
                }
            });
        }, function(err) {
            if (err) {
                dlogger.error('find missing dependend bundles: ' + JSON.stringify(err));
            } else {
                progressInfo.result = missingBundles;
            }
            setImmediate(callback);
        });
    }
}

function generateProgressId() {
    // from http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js
    return crypto.randomBytes(20).toString('hex');
}