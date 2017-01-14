'use strict';
require('rootpath')();

const async = require('async');
const fs = require('fs-extra');
const path = require('path');

const vars = require('lib/vars');
const helpers = require('lib/helpers');
const logging = require('lib/logging');
const pathHelpers = require('lib/path-helpers');
const PackageManager = require('lib/package-manager');

const clearContentPackagesConfig = true;

/**
 * For staging submissions.
 * Note: the methods of this class always take / return absolute paths.
 */
class StagingManager {
    /**
     * @typedef {Object} StagingManager~Package
     * @property {Array.String} assets - Links to the zips associated with this package.
     * @property {String} email - An optional csv list of emails to send the results of submitting the package to.
     */

    /**
     * 
     * 
     */
    constructor() {
        this._contentFolder = vars.CONTENT_BASE_PATH;
        this._zipFolder = vars.zipsFolder;
        this._packageManager = new PackageManager(
            vars.contentPackagesConfig,
            vars.packageManagerFile,
            this._contentFolder);
        this._processHandoffQueue = async.queue((args, callback) => {
            this._processHandoff(args, callback);
        });
    }

    /**
     * @callback StagingManager~uploadPackageCallback
     * @param {Error} error
     * @param {Object} result
     * @param {PackageManager~Entry} result.entry
     * @param {String} result.contentFolder
     * @param {String} result.handoffSubfolder
     */
    
    /**
     * Upload the package.
     * 
     * @public
     * @param {StagingManager~Package} package - The package metadata for uploading.
     * @param {Rex} rex
     * @param {StagingManager~uploadPackageCallback} callback
     */
    uploadPackage(pkg, rex, callback=(() => {})) {
        const accumArgs = new Args();
        async.waterfall([(callback) => {
            this._preUpload(pkg, rex, callback);
        }, (args, callback) => {
            accumArgs.addArgs(args);
            this._upload(accumArgs.args, callback);
        }, (args, callback) => {
            accumArgs.addArgs(args);
            this._processHandoffQueue.push(accumArgs.args, callback);
        }, (args, callback) => {
            accumArgs.addArgs(args);
            this._postHandoff(accumArgs.args, callback);
        }], (err, args={}) => {
            accumArgs.addArgs(args);
            const {downloadFolder, extractFolder, log} = accumArgs.args;
            if (!log || !downloadFolder || !extractFolder) {
                callback(err);
                return;
            }
            log.handleError([err], (err) => {
                this._cleanup({
                    downloadFolder,
                    extractFolder,
                    log,
                    err
                }, (err) => {
                    log.closeLoggers();
                    if (err) {
                        callback(err);
                        return;
                    }
                    const {entry, handoffSubfolder} = accumArgs.args;
                    fs.realpath(this._contentFolder, (err, contentFolder) => {
                        // resolve the path (may be a link to a shared drive)
                        if (err) {
                            callback(err);
                            return;
                        }
                        const returnVal = {
                            entry,
                            contentFolder,
                            handoffSubfolder
                        };
                        callback(err, returnVal); 
                    });
                });
            }, {debugMessage: 'An error occurred while uploading package',
                userMessage: 'Package failed to upload'});
        });
    }

    /**
     * @private
     * @callback StagingManager~_preUploadCallback
     * @param {Error} error
     * @param {Object} result
     * @param {String} result.extractFolder
     * @param {String} result.downloadFolder
     * @param {String} result.handoffSubfolder - The subfolder in both extractFolder and downloadFolder which only contains content for the current handoff.
     * @param {String} result.assets
     * @param {Log} result.log
     * @param {Rex} result.rex
     * @param {Boolean} result.mergeContentPackageConfigFile
     */
    
    /**
     * Pre-upload phase
     *
     * @private
     * @param {Object} args
     *  @param {Object} args.package - The package metadata for uploading.
     *  @param {Rex} args.rex
     * @param {StagingManager~_preUploadCallback} callback
     */
    _preUpload({assets, email}, rex, callback) {
        const submissionId = helpers.getRandomInt(0, 100000);
        const log = new logging.Log({
            userLogger:
            rex.loggerManager.createLogger(`upload:-${submissionId}user`),
            debugLogger:
            rex.loggerManager.createLogger(`upload:${submissionId}-debug`)
        });
        StagingManager._emailResults({email}, log);
        if (!assets) {
            log.userLogger.error('Missing field in submission');
            // wait until the message goes through
            log.userLogger.once('data', () => {
                log.closeLoggers();
                callback('Invalid submission');
            });
            return;
        }
        async.waterfall([
            (callback) => { // get a unique folder to extract to
                const folderPrefix = `submission;${submissionId}`;
                pathHelpers.getUniqueFolderPath(
                    path.join(this._contentFolder, folderPrefix),
                    (err, extractFolder, handoffSubfolder) => {
                        callback(err, {handoffSubfolder, extractFolder});
                    });
            }, ({extractFolder, handoffSubfolder}, callback) => { // ensure the download folder does not exist
                const downloadFolder = path.join(this._zipFolder,
                                                 handoffSubfolder);
                fs.remove(downloadFolder, (err) => {
                    callback(
                        err,
                        {downloadFolder, extractFolder, handoffSubfolder}
                    );
                });
            }, ({downloadFolder, extractFolder, handoffSubfolder}, callback) => {
                async.each(
                    [downloadFolder, extractFolder], fs.ensureDir, (err) => {
                        callback(err, {
                            extractFolder,
                            downloadFolder,
                            handoffSubfolder,
                            assets,
                            log,
                            rex,
                            mergeContentPackageConfigFile:
                            !clearContentPackagesConfig
                        });
                    });
            }
        ], callback);
    }

    /**
     * @private
     * @callback StagingManager~_uploadCallback
     * @param {Error} error
     * @param {Object} result
     * @param {String} result.topLevelItems
     * @param {String} result.zips
     */
    
    /**
     * Upload phase
     *
     * @private
     * @param {Object} args
     *  @param {Array.String} args.assets - The urls to download
     *  @param {String} args.downloadFolder - The folder to download to
     *  @param {String} args.extractFolder - The folder to extract to
     *  @param {Log} args.log
     * @param {StagingManager~_uploadCallback} callback
     */
    _upload({assets,
             downloadFolder,
             extractFolder,
             log}, callback) {
        async.map(assets, (asset, callback) => {
            StagingManager._downloadAndExtractAsset({
                asset,
                extractFolder,
                downloadFolder,
                log
            }, callback);
        }, (err, result) => {
            if (err) {
                callback(err);
                return;
            }
            // each item in result is in the format
            // [topLevelItems, zipFile]
            // or an empty list if we wish to skip that asset
            
            const validItems = result.filter((item) => {
                return item;
            });
            const topLevelItems = validItems.reduce(
                (accum, {topLevelItems}) => {
                    return accum.concat(topLevelItems);
                }, []);
            const zips = validItems.reduce(
                (accum, {zip}) => {
                    return accum.concat([zip]);
                }, []); 
            callback(err, {topLevelItems, zips});
        });
    }

    /**
     * @private
     * @callback StagingManager~_processHandoffCallback
     * @param {Error} error
     * @param {Object} result
     * @param {String} result.packageFolders
     * @param {String} result.processedZips
     */
    
    /**
     * Process the handoff submission.
     *
     * @private
     * @param {Object} args
     *  @param {Array.String} args.topLevelItems - The list of submitted items, which contains files and folders. 
     *  @param {Array.String} args.zips
     *  @param {String} args.downloadFolder
     *  @param {String} args.extractFolder
     *  @param {Log} args.log
     *  @param {Rex} args.rex
     *  @param {Boolean} args.mergeContentPackageConfigFile
     * @param {StagingManager~_processHandoffCallback} callback
     */
    _processHandoff({topLevelItems,
                     zips,
                     downloadFolder,
                     extractFolder,
                     log,
                     rex,
                     mergeContentPackageConfigFile}, callback) {
        async.waterfall([(callback) => {
            // can be moved into a pre handoff phase
                PackageManager.getPackageFolders(topLevelItems, callback);
        }, (packageFolders, callback) => { // add to the packages file & setup the zips
            const relPackageFolders = packageFolders.map((pkg) => {
                return pathHelpers.getRelativePath(pkg, this._contentFolder);
            });
            log.userLogger.info(
                'Packages were discovered in the following folders: ' +
                    relPackageFolders);
            async.parallel([
                (callback) => {
                    this._packageManager.updatePackagesFile({
                        addPackageFolders: relPackageFolders,
                        log,
                        mergeWithExisting: mergeContentPackageConfigFile
                    }, callback);
                }, (callback) => {
                    // can be moved into a pre handoff phase
                    PackageManager.zipsMirrorPackageFolderStructure({
                        downloadFolder, extractFolder, zips, packageFolders
                    }, callback);
                }
            ], (err, [_, newZips]) => {
                callback(err, {newZips, relPackageFolders, packageFolders});
            });
        }, (args, callback) => { // refresh
            rex.refreshManager.refreshDatabase({log}, (err) => {
                args['passedPackageFolders'] = [];
                callback(err, args);
            });
        }, ({passedPackageFolders, newZips, relPackageFolders, packageFolders},
            callback) => {
                // TODO - ideally refreshDatabase should pass a list of packageFolder's that passed.
                // for now let's assume everything passed (we should filter based on what passed, after we do the TODO).
                this._packageManager.updatePackagesFile({
                    removePackageFolders: relPackageFolders,
                    log,
                    mergeWithExisting: true
                }, (err) => {
                    callback(err, {
                        packageFolders,
                        processedZips: newZips
                    });
                });
            }], callback);
    }

    /**
     * @private
     * @callback StagingManager~_postHandoffCallback
     * @param {Error} error
     * @param {Object} result
     * @param {Object} result.entry 
     */
    
    /**
     * Post-handoff phase.
     *
     * @private
     * @param {Object} args
     *  @param {Array.String} args.packageFolders
     *  @param {Array.String} args.topLevelItems - topLevelItems we extracted.
     *  @param {Log} args.log
     *  @param {Array.String} processedZips - The zips setup to mirror the package folder structure
     * @param {StagingManager~_postHandoffCallback} callback
     */
    _postHandoff({packageFolders,
                  topLevelItems,
                  log,
                  processedZips}, callback) {
        async.parallel([
            (callback) => { // update the package (or add it if it's new)
                async.waterfall([(callback) => {
                    const relZips = processedZips.map((zip) => {
                        const relZipFolder = pathHelpers.getRelativePath(
                            path.dirname(zip), this._contentFolder);
                        return path.join(relZipFolder, path.basename(zip));
                    });
                    const relPackageFolders = packageFolders.map((pkg) => {
                        return pathHelpers.getRelativePath(pkg,
                                                           this._contentFolder);
                    });
                    if (packageFolders.length === 0) {
                        log.userLogger.error('nothing to handoff');
                        callback('packageFolders is empty');
                        return;
                    }
                    PackageManager.getPackageInfo(
                        packageFolders[0], (err, {name, version}={}) => {
                            if (err) {
                                callback(err);
                                return;
                            }
                            callback(err, {
                                name,
                                version,
                                content: relPackageFolders,
                                zips: relZips
                            });
                        });
                }, (entry, callback) => {
                    this._packageManager.updatePackage({entry, log}, (err) => {
                        callback(err, entry);
                    });
                }], callback);
            }, (callback) => { // cleanup the submission
                StagingManager.cleanupSubmission({
                    topLevelItems,
                    packageFolders
                }, callback);
            }], (err, [entry]=[]) => {
                if (err) {
                    callback(err);
                    return;
                }
                callback(err, {entry});
            });
    }

    /**
     * Cleanup phase
     *
     * @private
     * @param {Object} args
     *  @param {Array.String} args.downloadFolder
     *  @param {Array.String} args.extractFolder
     *  @param {Log} args.log
     *  @param {String} args.err - Any error that may have occurred
     * @param {ErrorCallback} callback
     */
    _cleanup({downloadFolder,
              extractFolder,
              log,
              err}, callback) {
        async.parallel([
            // remove the folders we extracted and downloaded
            // to on error
            // TODO potentially extend updatePackage to remove an entry
            // and its associated content (already does so for a replace)
            // TODO we can periodcally scan the packagemanager file for content folders and then remove anything outside of it
            // also sync the packagesfile with those content folders
            (callback) => {
                if (err) {
                    fs.remove(extractFolder, callback);
                }
                else {
                    setImmediate(callback);
                }
            }, (callback) => {
                if (err) {
                    fs.remove(downloadFolder, callback);
                }
                else {
                    setImmediate(callback);
                }
            }
        ], (err2) => {
            if (!err && !err2) {
                log.userLogger.info('Submission Successful');
            }
            callback(err || err2);
        });
    }

    /**
     * @private
     * @callback StagingManager~_downloadAndExtractAssetCallback
     * @param {Error} error
     * @param {Object} result
     * @param {Array.String} result.topLevelItems - all the top level files / folders that were extracted.
     * @param {String} result.zip
     */

    /**
     * Download and extract the asset at the given url.
     *
     * @private
     * @param {Object} args
     *  @param {String} args.asset - The url to the asset (a zip file).
     *  @param {String} args.extractFolder - The folder to extract the asset to.
     *  @param {String} args.downloadFolder - The folder to download the zip to.
     *  @param {Log} args.log
     * @param {StagingManager~_downloadAndExtractAssetCallback} callback
     */
    static _downloadAndExtractAsset({asset,
                                     extractFolder,
                                     downloadFolder,
                                     log}, callback) {
        async.waterfall([(callback) => {
            helpers.downloadFile(
                asset, downloadFolder, function() {
                    log.handleError(arguments, callback,
                                    {userMessage: 'Failed to download ' +
                                     asset});
                });
        }, (zip, callback) => {
            if (zip.indexOf('__linux') > -1 || zip.indexOf('__all') > -1) {
                // don't extract other platform zips
                // since we don't handle it in tirex anyways
                helpers.extract(
                    zip, extractFolder, (err, topLevelItems) => {
                        log.handleError([err, {topLevelItems, zip}], callback,
                                        {userMessage: 'Failed to extract ' +
                                         zip});
                    });
            }
            else {
                callback(null, {topLevelItems: [], zip});
            }
        }], callback); 
    }

    /**
     * Email the results of a submission
     *
     * @private
     * @param {Object} args
     *  @param {String} args.email - may be a csv list
     * @param {Log} log
     */
    static _emailResults({email}, log) {
        let messageBody = '';
        log.userLogger.on('data', (message) => {
            messageBody += transformLogMessage(message);
        });
        log.userLogger.on('close', () => {
            helpers.email({
                sender: `no-reply@ti.com`,
                receiver: `${email},tirex-content-handoff@list.ti.com`,
                subject: `Submission Results`,
                payload: messageBody});
        });

        /**
         * Prepare the message for the email.
         *
         * @param {Buffer} message - A log message.
         *
         * @returns {String} formatedMessage - The formatted result.
         *
         */
        function transformLogMessage(message) {
            const {data, type, tags} = JSON.parse(message.toString());
            const typeColors = {
                'info': 'orange',
                'error': 'red'
            };
            return `<b style="color: ${typeColors[type] || "black"}">[${type.toUpperCase()}] </b> ${data} <br>`;
        }
    }

    /**
     * Remove any topLevelItems we did not push (if we pushed a subfolder we currently keep the entire topLevelItem)
     *
     * @private
     * @param {Object} args
     *  @param {Array.String} args.topLevelItems
     *  @param {Array.String} args.packageFolders
     * @param {ErrorCallback} callback
     */
    static cleanupSubmission({topLevelItems,
                              packageFolders}, callback) {
        const toRemove = topLevelItems.filter((topLevelItem) => {
	    return packageFolders.filter((packageFolder) => {
                return (pathHelpers.normalize(packageFolder) ===
                        pathHelpers.normalize(topLevelItem)) ||
                    pathHelpers.isSubfolder(packageFolder, topLevelItem);
            }).length === 0;
        });
        async.each(toRemove, (item, callback) => {
            fs.remove(item, callback);
        }, callback);
    }
} module.exports = StagingManager;

class Args {
    constructor() {
        this.args = {};
    }

    /**
     * Adds new args to the args.
     * Note: you cannot override an arg, or add one that already exists.
     * The latter will throw an error, while the former won't have an effect.
     *
     * @param {Object} newArgs
     */
    addArgs(newArgs) {
        Object.keys(newArgs).map((key) => {
            this._addArg(key, newArgs[key]);
        });
    }

    _addArg(arg, argValue) {
        Object.defineProperty(this.args, arg, {
            value: argValue
        });
    }
}

