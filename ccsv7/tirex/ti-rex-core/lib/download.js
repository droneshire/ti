/**
 * Remote server functions for Download and MakeOffline
 *
 * Oliver Sohm, 21/10/2015
 */

'use strict';

// third party
var logger = require('./logger')();
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var exec = require('child_process').exec;
var async = require('async');
var jsonStableStringify = require('json-stable-stringify');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
const request = require('request').defaults({forever: true});

// our modules
var vars = require('./vars');
var query = require('./query');
var jsonstream = require('./jsonstream');

var downloadQueue;
exports.downloadQueueProgress = []; // tracks the async.queue used for downloads

/**
 *  Queue Download Assets Task (for 'Download')
 *  Creates an zip archive of files based on the provided resource query
 *  If zip for the resource query already exists use that, otherwise create a new zip
 *  When the zip is ready calls back with a URL that the client can use to download the zip file.
 *
 * @param dbResources
 * @param dbDownloads
 * @param progressId
 * @param req
 */
exports.downloadAssets = function(dbResources, dbOverviews, dbPureBundles, dbDownloads, progressId, req) {
    var task = {
        req: req,
        normalizedQueries: query.makeNormalizedQueries(req.query),
        dbResources: dbResources,
        dbOverviews: dbOverviews,
        dbPureBundles: dbPureBundles,
        dbDownloads: dbDownloads,
        progressInfo: {id: progressId, active: false, totalToZip: 0, zipListFile: '', zipLogFile: '', result: '', done: false, message: ''},
        downloadFunction: function(callback) {
            _downloadAssets(task.req, task.normalizedQueries, task.dbResources, task.dbOverviews, task.dbPureBundles, task.dbDownloads, task.progressInfo, function(err, downloadURL) {
                task.progressInfo.done = true;
                if (!err) {
                    task.progressInfo.result = downloadURL.link;
                }
                callback();
            });
        }
    };
    queueDownload(task);

    // keep arguments independent of async.queue
    function _downloadAssets(req, normalizedQueries, dbResources, dbOverviews, dbPureBundles, dbDownloads, progressInfo, callback) {
        progressInfo.message = 'Preparing download';
        progressInfo.active = true;
        // get client info in case there are client OS-specific downloads
        var uaParserJs = require('ua-parser-js');
        var uaParser = new uaParserJs();
        uaParser.setUA(req.headers['user-agent']);
        var clientInfo = {OS: uaParser.getOS().name, arch: uaParser.getCPU().architecture};
        // id to check whether a zip for this RESOURCE QUERY exists already (note: this id is different from the id based on the FILE LIST!)
        var archiveId = crypto.createHash('sha1').update(jsonStableStringify(normalizedQueries.resourceQuery) +jsonStableStringify(clientInfo),'utf8').digest('hex');
        dbDownloads.findOne({'_id': archiveId}, function (err, cachedArchive) {
            if (err) {
                var errMsg = 'Download cache query error: ' + JSON.stringify(err);
                logger.error(errMsg);
                callback(errMsg);
                return;
            }
            if (cachedArchive != null) {
                callback(null, {link: 'api/download?file=' + encodeURIComponent(cachedArchive.value) + '&clientfile=' +
                    encodeURIComponent(cachedArchive.downloadFilename) + '.zip' + '&source=cache'});
            } else {
                // if zip doesn't already exist, run the query
                query.makeofflineOrDownloadQuery(dbResources, dbOverviews, dbPureBundles, req.query, function (err, data) {
                    if (err) {
                        var errMsg = 'Resource query error: ' + JSON.stringify(err);
                        logger.error(errMsg);
                        callback(errMsg);
                        return;
                    }
                    // build list of files to zip including includedFiles (don't download/zip any external links)
                    var fileList = exports.createFileList(data.resources.concat(data.overviews), clientInfo);
                    progressInfo.totalToZip = fileList.length;
                    createZipArchive(vars.CONTENT_BASE_PATH, fileList, vars.HOST, false, makeDownloadFilename(data.resources), archiveId, dbDownloads, progressInfo, callback);
                });
            }
        });
    }

    function makeDownloadFilename(resources) {
        // build a nice filename for the client
        var downloadFilename = 'tirex';
        if ('id' in req.query && resources != null) {
            // can assume only one result then
            downloadFilename += '_' + resources[0].name;
        } else {
            if ('device' in req.query) {
                downloadFilename += '_' + req.query.device;
            }
            if ('devtool' in req.query) {
                downloadFilename += '_' + req.query.devtool;
            }
            if ('path' in req.query) {
                downloadFilename += '_' + req.query.path.split(path.sep).pop();
            }
        }
        return downloadFilename.replace(/[^a-zA-Z0-9]+/g, ''); // only retain alpha-num chars to get valid file names across platforms;
    }
};

/**
 *  Queue Archive Files Task (for 'Make Available Offline')
 *  Creates a zip archive of files based on the provided file list
 *  If zip for the provided file list already exists use that, otherwise create a new zip
 *  When the zip is ready calls back with a URL that the client can use to download the zip file.
 *
 * @param fileList: files to zip (file paths must be relative to CONTENT_BASE_PATH)
 * @param dbDownloads
 * @param progressId: as provided by the client
 * @param os
 * @param isBundle:
 */
exports.archiveFiles = function(fileList, dbDownloads, progressId, os, isBundle) {
    var task = {
        fileList: fileList,
        os: os,
        isBundle: isBundle,
        dbDownloads: dbDownloads,
        progressInfo: {id: progressId, active: false, totalToZip: fileList.length, zipListFile: '', zipLogFile: '', result: '', done: false, message: ''},
        downloadFunction: function (callback) {
            _archiveFiles(task.fileList, task.dbDownloads, task.progressInfo, task.os, task.isBundle, function (err, downloadURL) {
                task.progressInfo.done = true;
                if (!err) {
                    task.progressInfo.result = downloadURL.link;
                }
                callback();
            });
        }
    };
    queueDownload(task);

    // keep independent of async.queue
    // TODO: should this be merged with _downloadResources? Two main differences: _archiveFiles doesn't do OS- specific downloads (it probably should...) or resource queries
    function _archiveFiles(fileList, dbDownloads, progressInfo, os, isBundle, callback) {
        progressInfo.message = 'Preparing download';
        progressInfo.active = true;
        var use_akami = (vars.REMOTE_BUNDLE_ZIPS !== '');
        if((isBundle)&&(use_akami)){
            var akami_link = vars.REMOTE_BUNDLE_ZIPS;
            var regexp = /.+[\/\\](.+)/;
            var match = regexp.exec( fileList[0] );
            if (match != null) {
                fileList[0] = fileList[0] + '/' + match[1];
            }
            else{
                fileList[0] = fileList[0] + '/' + fileList[0];
            }

            regexp = /(.+)[\/\\]$/;
            match = regexp.exec( fileList[0] );
            if (match != null) {
                fileList[0] = match[1];
            }

            var os_suffix = '';
            if((os.indexOf('Mac') !== -1) || (os.indexOf('darwin') !== -1)) {
                os_suffix = '__macos.zip';

            } else if((os.indexOf('Win') !== -1) || (os.indexOf('win') !== -1)) {
                os_suffix = '__win.zip';
            }
            else if((os.indexOf('Linux') !== -1) || (os.indexOf('linux') !== -1) ) {
                os_suffix = '__linux.zip';
            }
            akami_link = akami_link + fileList[0] + os_suffix;
            callback(null, { link: akami_link});
        }
        else {
            // id to check whether a zip for this FILE LIST exists already (note: this id is different from the id based on the RESOURCE QUERY!)
            var archiveId = crypto.createHash('sha1').update(jsonStableStringify(fileList) + jsonStableStringify(os), 'utf8').digest('hex');
            dbDownloads.findOne({'_id': archiveId}, function (err, cachedArchive) {
                if (err) {
                    var errMsg = 'Download cache query error: ' + JSON.stringify(err);
                    logger.error(errMsg);
                    callback(errMsg);
                    return;
                }
                if (cachedArchive != null) {
                    callback(null, {
                        link: 'api/download?file=' + encodeURIComponent(cachedArchive.value) + '&clientfile=' +
                            encodeURIComponent(cachedArchive.downloadFilename) + '.zip' + '&source=cache'
                    });
                } else {
                    var downloadFilename = 'tirex';
                    progressInfo.totalToZip = fileList.length;
                    createZipArchive(vars.CONTENT_BASE_PATH, fileList, os, isBundle, downloadFilename, archiveId, dbDownloads, progressInfo, callback);
                }
            });
        }
    }
};

/**
 *  Queue Archive Metadata Task (for 'Make Available Offline')
 *  Creates a zip archive of the results of the provided queries
 *  If zip for the provided metadata already exists use that, otherwise create a new zip
 *  When the zip is ready calls back with a URL that the client can use to download the zip file.
 *
 * @param queries: []
 * @param dbDownloads
 * @param progressId: as provided by the client
 * @param os
 * @param isBundle:
 */
exports.archiveMetadata = function(queries, dbResources, dbOverviews, dbPureBundles, dbDownloads, progressId) {
    var task = {
        queries: queries,
        dbResources: dbResources,
        dbOverviews: dbOverviews,
        dbPureBundles: dbPureBundles,
        dbDownloads: dbDownloads,
        progressInfo: {id: progressId, active: false, totalToZip: 0, zipListFile: '', zipLogFile: '', result: '', done: false, message: ''},
        downloadFunction: function (callback) {
            _archiveMetadata(task.queries, task.dbResources, task.dbOverviews, task.dbPureBundles, task.dbDownloads, task.progressInfo, function (err, downloadURL) {
                task.progressInfo.done = true;
                if (!err) {
                    task.progressInfo.result = downloadURL.link;
                }
                callback();
            });
        }
    };
    queueDownload(task);

    // keep independent of async.queue
    function _archiveMetadata(queries, dbResources, dbOverviews, dbPureBundles, dbDownloads, progressInfo, callback) {
        progressInfo.message = 'Preparing download';
        progressInfo.active = true;
        // id to check whether a zip for this FILE LIST exists already (note: this id is different from the id based on the RESOURCE QUERY!)
        var archiveId = crypto.createHash('sha1').update(jsonStableStringify(queries), 'utf8').digest('hex');
        dbDownloads.findOne({'_id': archiveId}, function (err, cachedArchive) {
            if (err) {
                var errMsg = 'Download cache query error: ' + JSON.stringify(err);
                logger.error(errMsg);
                return callback(errMsg);
            }
            if (cachedArchive != null) {
                callback(null, {link: 'api/download?file=' + encodeURIComponent(cachedArchive.value) + '&clientfile=' +
                encodeURIComponent(cachedArchive.downloadFilename) + '.zip' + '&source=cache'});
            } else {
                var downloadFilename = 'tirex_metadata';
                progressInfo.totalToZip = 1;
                runMakeOfflineQueries(queries, dbResources, dbOverviews, dbPureBundles, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return callback(err);
                    }
                    var jstream = new jsonstream(result);
                    var outfileName = archiveId + '.json';
                    mkdirp(path.join(vars.DOWNLOADS_BASE_PATH, archiveId), function (err) { // TODO: workaround: put in a folder so that it get`s zipped by createZipArchive()
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return callback(err);
                        }
                        var outfile = fs.createWriteStream(path.join(vars.DOWNLOADS_BASE_PATH, archiveId, outfileName));
                        jstream.pipe(outfile)
                            .on('error', function (error) {
                                logger.error('archiveMetadata error when writing json: ' + outfileName + ': ' + JSON.stringify(error));
                                callback(error);
                            })
                            .on('finish', function () {
                                logger.info('archiveMetadata writing json finished: ' + outfileName);
                                createZipArchive(vars.DOWNLOADS_BASE_PATH, [archiveId], null, null, downloadFilename, archiveId,
                                    dbDownloads, progressInfo, function(err, downloadURL) {
                                        rimraf(path.join(vars.DOWNLOADS_BASE_PATH, archiveId), function(){});
                                        callback(err, downloadURL);
                                    });
                            });
                    });
                });
            }
        });
    }
};

/**
 *
 * @param resourceQueries: []
 * @param dbResources
 * @param dbOverviews
 * @param dbPureBundles
 * @param callback(err, result)
 */
function runMakeOfflineQueries(resourceQueries, dbResources, dbOverviews, dbPureBundles, callback) {
    async.map(resourceQueries, (resourceQuery, callback) => {
            resourceQuery.makeoffline = 'true';
            query.makeofflineOrDownloadQuery(dbResources, dbOverviews, dbPureBundles, resourceQuery, callback);
        }, (err, results) => {
            if (err != null) {
                return setImmediate(callback, 'runMakeofflineQueries failed: ' + JSON.stringify(err));
            }
            if (results == null || results[0] == null) {
                return setImmediate(callback, null, {resources: [], overviews: [], dependentBundles: []});
            }
            var data = {
                resources: results[0].resources,
                overviews: results[0].overviews,
                dependentBundles: results[0].dependentBundles
            };
            for (var i = 1; i < results.length; i++) {
                data.resources = data.resources.concat(results[i].resources);
                data.overviews = data.overviews.concat(results[i].overviews);
                data.dependentBundles = data.dependentBundles.concat(results[i].dependentBundles);
            }
            setImmediate(callback, null, data);
        }
    );
}

function queueDownload(task) {
    logger.info('queuing archive files: progressId=' + task.progressInfo.id);
    exports.downloadQueueProgress.push(task.progressInfo);
    if (!downloadQueue) {
        downloadQueue = async.queue(function (task, callback) {
            logger.info('start processing download: progressId=' + task.progressInfo.id);
            task.downloadFunction(callback);
        }, 1);
    }
    downloadQueue.push(task);
    logger.info('number of pending downloads: ' +
        JSON.stringify(downloadQueue.length()));
}

/**
 * Creates a list of files for the provided records array. The returned array of files includes
 *   - resource location file paths
 *   - included files based on the .dependency file (optionally the .dependency file itself)
 *   - linkForDownloads based on client OS and architecture
 *   - NO external files or web pages
 *   - NO duplicates
 *
 * @param records
 * @param clientInfo
 * @returns {Array} file list
 */
exports.createFileList = function(records, clientInfo) {
    var files = {};
    for (var i = 0; i < records.length; i++) {
        var record = records[i];
        if (record.linkType === 'local' && record.link != null) {
            var link;
            if (record.linkForDownload != null) {
                link = exports.resolveDownloadLinkForOS(record.linkForDownload, clientInfo);
                if (link == null) {
                    logger.error('Download: Could not resolve host OS specific link for download. Update user-agent parser? Detected client OS: ' +
                        clientInfo.OS + ' ' + clientInfo.arch + '. Resource record: ' + JSON.stringify(record));
                }
            } else {
                link = record.link;
            }
            files[link] = true; // use file paths as keys to avoid duplicates

            if (record.image != null) {
                files[record.image] = true;
            }
            if (record.icon != null) {
                files[record.icon] = true;
            }
            if (record.license != null) {
                files[record.license] = true;
            }
            if (!record._extraOverview && record.includedFilesForDownload != null) {
                for (var j = 0; j < record.includedFilesForDownload.length; j++) {
                    files[record.includedFilesForDownload[j]] = true;
                }
            }
        }
    }

    return Object.keys(files);
};

/**
 * Creates a zip archive of the files in fileList and adds it to the download DB with the ID of
 * archiveId and client side file name of downloadFilename.
 *
 * When the zip is ready calls back with a URL that the client can use to download the zip file.
 *
 * @param basePath: base path for fileList
 * @param fileList: files to zip (relative to basePath)
 * @param downloadFilename: client side filename
 * @param archiveId: a unique ID for this archive
 * @param dbDownloads
 * @param progressInfo
 * @param callback(err, downloadURL)
 */
function createZipArchive(basePath, fileList, os, isBundle, downloadFilename, archiveId, dbDownloads, progressInfo, callback) {
    // create zip package
    var zipFileRel = downloadFilename + '_' + archiveId + '.zip';
    var zipFile = path.join(vars.DOWNLOADS_BASE_PATH, zipFileRel);
    var zipListFile = zipFile + '.list';
    var zipLogFile = zipFile + '.log';
    // for progress reporting
    progressInfo.zipListFile = zipListFile;
    progressInfo.zipLogFile = zipLogFile;
    // create file of files to zip
    async.eachSeries(fileList, function (file, callback) { // use eachSeries to prevent too many file handles open for appendFile
        fs.exists(path.join(basePath, file), function (fileExists) { // zip aborts if a file doesn't exist
            if (fileExists) {
                fs.appendFile(zipListFile, file + '\n', function (err) { // TODO might be better to use a writestream
                    if (err != null) {
                        logger.error('Download: appendFile error: ' + JSON.stringify(err));
                    }
                    callback(err);
                });
            } else {
                callback();
            }
        });
    }, function () {
        fs.exists(zipListFile, function (zipListFileExists) {
            if (zipListFileExists === false) {
                callback(null,  {link: 'api/download?file=' + 'NothingToDownload.txt' + '&source=local'});
            } else {
                // if there's only a single file to download don't zip it
                if (fileList.length === 1) {
                    fs.stat(path.join(basePath, fileList[0]), function (err, stats) {
                        if (err == null) {
                            if (stats.isFile() === true) {
                                callback(null, {link: 'api/download?file=' + encodeURIComponent(path.normalize(fileList[0])) + '&source=content'});
                            } else {
                                if(isBundle) {
                                    havePlatformSpecificZip(os, callback);
                                }
                                else{
                                    doZip(); // turned out to be a dir, zip it
                                }
                            }
                        } else {
                            logger.error('fs.stat: ' + JSON.stringify(err));
                            callback('fs.stat failed. See log for details.');
                        }
                    });
                } else { // more than a single file to download...
                    doZip();
                }
            }
        });

        function havePlatformSpecificZip(client_os, callback) {
            var cmd;
            var zip_from_repo_file;

            if (fileList[0].indexOf('/') > 0) {
                zip_from_repo_file =  'zips/' + fileList[0] +'/' +fileList[0].substring(fileList[0].indexOf('/')+1,fileList[0].length);
            }
            else {
                zip_from_repo_file =  'zips/' + fileList[0] + '/' + fileList[0];
            }

            const zip_from_repo_file_all = zip_from_repo_file + '__all.zip';
            if((client_os.indexOf('Mac') !== -1) || (client_os.indexOf('darwin') !== -1)) {
                zip_from_repo_file = zip_from_repo_file + '__macos.zip';

            } else if((client_os.indexOf('Win') !== -1) || (client_os.indexOf('win') !== -1)) {
                zip_from_repo_file = zip_from_repo_file + '__win.zip';
            }
            else if((client_os.indexOf('Linux') !== -1) || (client_os.indexOf('linux') !== -1) ) {
                zip_from_repo_file = zip_from_repo_file + '__linux.zip';
            }

            // James: use fs.copy
            if(vars.HOST.indexOf('darwin') !== -1) {
                cmd ='cp';
            }
            else if(vars.HOST.indexOf('linux') !== -1) {
                cmd ='cp';
            }
            else if(vars.HOST.indexOf('win') !== -1) {
                cmd ='copy';
            }

            fs.stat(vars.CONTENT_BASE_PATH + '/' + zip_from_repo_file, (err) => {
                const zip_from_repo_file_exists = !err;
                const use_all = fs.existsSync(vars.CONTENT_BASE_PATH + '/' + zip_from_repo_file_all);
                downloadFilename = (use_all ? zip_from_repo_file_all : zip_from_repo_file);

                if (!zip_from_repo_file_exists && !use_all) {
                    doZip();
                }
                else {
                    cmd = cmd + ' ' +  (use_all ? zip_from_repo_file_all :
                                        zip_from_repo_file) + ' ' + zipFile;
                    
                    exec(cmd, {'cwd': vars.CONTENT_BASE_PATH}, function (error, stdout, stderr) {
                        if (error !== null) {
                            logger.error('copy/cp cmd: ' + cmd);
                            logger.error('exec error: ' + error);
                            doZip();
                        } else {
                            // add zip package info to db
                            dbDownloads.insert([
                                {'_id': archiveId, 'value': zipFileRel, 'downloadFilename': downloadFilename}
                            ], function (err) {
                                if (err) {
                                    logger.warn('Error inserting to dbDownloads: ' + JSON.stringify(err));
                                }
                                dbDownloads.save((err) => {
                                    if (err) {
                                        callback(err);
                                        return;
                                    }
                                    callback(null,  {
                                        link: 'api/download?file=' + encodeURIComponent(zipFileRel) +
                                            '&clientfile=' + encodeURIComponent(downloadFilename) + '&source=cache'
                                    });
                                });
                            });
                        }
                    });
                }
            });
        }

        function doZip() {
            var zip;
            if (process.platform === 'darwin') {
                zip = 'zip'; // use the pre-installed one
            } else {
                zip = path.join(vars.BIN_BASE_PATH, 'zip');
            }
            var cmd = zip + ' ' + zipFile + ' -r -@ <' + zipListFile + ' >' + zipLogFile;
            exec(cmd, {'cwd': basePath}, function (error, stdout, stderr) {
                if (error) {
                    logger.error('zip cmd: ' + cmd);
                    logger.error('zip exec error: ' + error);
                    callback(error);
                    return;
                }
                // add zip package info to db
                dbDownloads.insert([
                    {'_id': archiveId, 'value': zipFileRel, 'downloadFilename': downloadFilename}
                ], function (err) {
                    if (err) {
                        logger.warn('Error inserting to dbDownloads: ' + JSON.stringify(err));
                    }
                    dbDownloads.save();
                    callback(null,  {link: 'api/download?file=' + encodeURIComponent(zipFileRel) +
                    '&clientfile=' + encodeURIComponent(downloadFilename) + '.zip' + '&source=cache'});
                });
            });
        }
    });
}

/**
 *
 * @param linkForDownload
 * @returns {*}
 */
exports.resolveDownloadLinkForOS = function(linkForDownload, clientInfo) {
    /*
     from https://github.com/faisalman/ua-parser-js:

     # Possible 'os.name'
     AIX, Amiga OS, Android, Arch, Bada, BeOS, BlackBerry, CentOS, Chromium OS, Contiki,
     Fedora, Firefox OS, FreeBSD, Debian, DragonFly, Gentoo, GNU, Haiku, Hurd, iOS,
     Joli, Linpus, Linux, Mac OS, Mageia, Mandriva, MeeGo, Minix, Mint, Morph OS, NetBSD,
     Nintendo, OpenBSD, OpenVMS, OS/2, Palm, PCLinuxOS, Plan9, Playstation, QNX, RedHat,
     RIM Tablet OS, RISC OS, Sailfish, Series40, Slackware, Solaris, SUSE, Symbian, Tizen,
     Ubuntu, UNIX, VectorLinux, WebOS, Windows [Phone/Mobile], Zenwalk

     # Possible 'cpu.architecture'
     68k, amd64, arm, arm64, avr, ia32, ia64, irix, irix64, mips, mips64, pa-risc,
     ppc, sparc, sparc64
     */

    // Always check specific archs first
    if (/Linux|CentOS|Fedora|FreeBSD|Debian|OpenBSD|SUSE|Ubuntu/.test(clientInfo.OS)) {
        if (linkForDownload.linux64 != null && /amd64/.test(clientInfo.arch)) {
            return linkForDownload.linux64;
        }
        if (linkForDownload.linux32 != null && /ia32/.test(clientInfo.arch)) {
            return linkForDownload.linux32;
        }
        if (linkForDownload.linux != null) {
            return linkForDownload.linux;
        }
    }
    if (/Windows/.test(clientInfo.OS)) {
        if (linkForDownload.win64 != null && /amd64/.test(clientInfo.arch)) {
            return linkForDownload.win64;
        }
        if (linkForDownload.win32 != null && /ia32/.test(clientInfo.arch)) {
            return linkForDownload.win32;
        }
        if (linkForDownload.win != null) {
            return linkForDownload.win;
        }
    }
    if (/Mac OS/.test(clientInfo.OS)) {
        if (linkForDownload.macos != null) {
            return linkForDownload.macos;
        }
    }
    if (linkForDownload.any != null) {
        return linkForDownload.any;
    }

    return null;
};
