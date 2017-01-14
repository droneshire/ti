'use strict';
require('rootpath')();

const async = require('async');
const fs = require('fs-extra');
const path = require('path');

const vars = require('lib/vars');
const query = require('lib/query');

/**
 * Manages DB Refreshes.
 */
class RefreshManger {
    /**
     * Create a refresh manager.
     *
     * @param {Object} dbs
     */
    constructor({dbs}) {
        this._contentPackagesConfigFile = vars.contentPackagesConfig;
        this._dbs = dbs;
        this._refreshQueue = async.queue((config, callback) => {
            this._refreshTask(config, callback);
        });
    }

    /**
     * Refresh the database.
     *
     * @param {Object} args
     *  @param {Log} args.log
     *  @param {Array.String} args.packagesNames
     *  @param {Boolean} args.refreshAll
     *  @param {Boolean} args.clearAllData
     * @param callback(err)
     * 
     */
    refreshDatabase(config, callback=(()=>{})) {
        const {log} = config;
        
        log.debugLogger.info('queuing refresh');
        this._refreshQueue.push(config, (err) => {
            log.debugLogger.info('finished processing refresh: ' +
                                 JSON.stringify(err));
            callback(err);
        });
    }

    /**
     * @returns {Boolean} isRefreshing
     */
    isRefreshing() {
        return this._refreshQueue.running() > 0;
    }
    

    /**
     * Handle a refresh task.
     *
     * @param {Object} config - same as refreshDatabase.
     * @param callback(err)
     */
    _refreshTask({log, packageNames = null, refreshAll = true, clearAllData = true}, callback) {
        // James: can't we deduce if packageName is null then refresh all should be true?
        log.debugLogger.info('start processing refresh');
        async.waterfall([
            (callback) => {
                if (refreshAll) {
                    this._refreshAll({log, clearAllData}, callback);
                }
                else {
                    this._refreshPackages({log, clearAllData, packageNames}, callback);
                }
            },
            (contentPackages, callback) => {
                this._refreshDatabaseInternal({log, contentPackages, clearAllData}, callback);
            }
        ], (err) => {
            if (err) {
                log.userLogger.info('Done: Database was not refreshed');
            }
            callback(err);
        });
    }

    /**
     * Refresh everything in the contentPackagesConfigFile.
     *
     * @param {Object} config
     * @param {Log} log
     * @param {Boolean} clearAllData
     * @param callback(err, contentPackages) - where contentPackages is a list
     * of the packages relative to vars.CONTENT_BASE_PATH.
     */
    _refreshAll({log, clearAllData}, callback) {
        log.debugLogger.info('Refresh All');
        fs.readJSON(this._contentPackagesConfigFile, (err, packages) => {
            if (err) {
                const msg = 'Failed to read and parse ' +
                      this._contentPackagesConfigFile + ': ' + err.message;
                log.userLogger.error(msg);
                callback(err);
                return;
            }
            const packageObjects = packages.map((pkg, idx) => {
                return { path: pkg, order: idx};
            });
            async.map(packageObjects, (pkg, callback) => {
                fs.stat(path.join(vars.CONTENT_BASE_PATH, pkg.path), (err, stats) => {
                    if (err) {
                        log.userLogger.error('Package path not found: ' + pkg.path);
                        // skip packages with a non-existent path
                        callback();
                        return;
                    }
                    callback(err, pkg);
                });
            }, (err, result) => {
                callback(err, result.filter((item) => {
                    return item;
                }));
            });
        });
    }

    /**
     * Refresh the specified packages.
     *
     * @param {Object} config
     *  @param {Log} log
     *  @param {Boolean} clearAllData
     *  @param {Array.String} packageNames
     * @param callback(err, contentPackages) - where contentPackages is a list 
     *  of the packages relative to vars.CONTENT_BASE_PATH.
     */
    _refreshPackages({log, clearAllData, packageNames}, callback) {
        const {dbOverviews} = this._dbs;

        log.debugLogger.info('Refresh Specific');
        async.mapSeries(packageNames, (packageName, callback) => {
            dbOverviews.findOne({'package': packageName, 'resourceType': 'packageOverview'},
                (err, packageOverview) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    if (!packageOverview) {
                        const userMsg = 'Error: Package ' + packageName +
                            ' doesn\'t exist. To get a list of existing ' +
                            'packages use api/packages';
                        log.userLogger.error(userMsg);
                        callback(null, null);
                    }
                    else {
                        callback(null, {
                            name: packageOverview.package,
                            path: packageOverview.packagePath
                        });
                    }
                });
        }, (err, results) => {
            setImmediate(callback, err, results.filter(item => item != null));
        });
    }

    _refreshDatabaseInternal({log, contentPackages, clearAllData}, callback) {
        var dbBuilder = require('lib/dbBuilder/dbBuilder');
        dbBuilder._refreshDatabase({
            log,
            contentPackages,
            dbs: this._dbs,
            clearAllData}, () => {
                log.debugLogger.info('Clearing all caches');
                query.clearCaches();
                callback();
            });
    }
} exports.RefreshManager = RefreshManger;
