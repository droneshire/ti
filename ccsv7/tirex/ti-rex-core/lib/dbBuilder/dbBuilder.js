'use strict';
require('rootpath')();

const fs = require('fs-extra');
const async = require('async');
const vars = require('lib/vars');

var macros; // macro store

/**
 * Refresh the database.
 *
 * @param {Object} config
 * @param {Log} log
 * @param {Array.String} contentPackages
 * @param {Object} dbs
 * @param {Boolean} clearAllData
 * @param callback(err)
 */
exports._refreshDatabase = function({log, contentPackages, dbs, clearAllData}, callback) {

    if (contentPackages.length === 0) {
        log.userLogger.info('No packages to refresh.');
        callback();
        return;
    }

    const {
        dbDevices,
        dbDevtools,
        dbResources,
        dbOverviews,
        dbPureBundles,
        dbDownloads
    } = dbs;

    var macrosBuilder = require('./macros');
    var devicesBuilder = require('./devices');
    var devtoolsBuilder = require('./devtools');
    var resourcesBuilder = require('./resources');

    log.userLogger.info('Refreshing databases. Please wait...');

    async.series([
        (callback) => {
            if (clearAllData === true) {
                devicesBuilder.clearLog();
                devtoolsBuilder.clearLog();
                resourcesBuilder.clearLog();
                macrosBuilder.clearLog();
                macros = {};
                async.eachSeries([
                    dbDevices,
                    dbDevtools,
                    dbResources,
                    dbOverviews,
                    dbPureBundles
                ], (dbItem, callback) => {
                    dbItem.remove({}, callback);
                }, callback);
            } else {
                // only clear resources, overviews, bundles and downloads (keep macros, devices, devtools)
                resourcesBuilder.clearLog();
                macros = {};
                async.eachSeries(contentPackages, (contentPackage, callback) => {
                    async.eachSeries([
                        dbResources,
                        dbOverviews,
                        dbPureBundles
                    ], (dbItem, callback) => {
                        dbItem.remove({
                            'package': contentPackage.name
                        }, callback); // TODO change to packageid
                    }, callback);
                }, err => setImmediate(callback, err));
            }
        },
        (callback) => {
            dbDownloads.remove({}, callback);
        },
        (callback) => {
            fs.remove(vars.DOWNLOADS_BASE_PATH, callback);
        },
        (callback) => {
            fs.ensureDir(vars.DOWNLOADS_BASE_PATH, callback);
        },
        (callback) => {
            async.eachSeries(contentPackages, (contentPackage, callback) => {
                macrosBuilder.refresh(contentPackage.path, macros, log, (err) => {
                    callback(err);
                });
            }, function(err) {
                if (!err) {
                    log.userLogger.info('Done refreshing macros.');
                }
                log.handleError(
                    arguments, callback,
                    {userMessage: 'An error occurred while refreshing macros'});
            });
        },
        (callback) => {
            if (!clearAllData) {
                return setImmediate(callback);
            }
            async.eachSeries(contentPackages, (contentPackage, callback) => {
                devicesBuilder.refresh(
                    contentPackage.path,
                    dbs.dbDevices,
                    macros[contentPackage.path],
                    log, (err) => {
                        callback(err);
                    });
            }, function(err) {
                if (!err) {
                    log.userLogger.info('Done refreshing devices.');
                }
                log.handleError(
                    arguments, callback,
                    {userMessage: 'An error occured while refreshing devices'});
            });
        },
        (callback) => {
            if (!clearAllData) {
                return setImmediate(callback);
            }
            async.eachSeries(contentPackages, (contentPackage, callback) => {
                devtoolsBuilder.refresh(
                    'main',
                    contentPackage.path,
                    dbs.dbDevtools,
                    dbs.dbDevices,
                    macros[contentPackage.path],
                    log,
                    callback);
            }, function(err) {
                if (!err) {
                    log.userLogger.info('Done refreshing devtools from \'main\' files.');
                }
                log.handleError(
                    arguments, callback,
                    {userMessage: 'An error occured while refreshing devtools'}
                );
            });
        },
        (callback) => {
            if (!clearAllData) {
                return setImmediate(callback);
            }
            async.eachSeries(contentPackages, (contentPackage, callback) => {
                devtoolsBuilder.refresh(
                    'aux',
                    contentPackage.path,
                    dbs.dbDevtools,
                    dbs.dbDevices,
                    macros[contentPackage.path],
                    log,
                    callback);
            }, function(err) {
                if (!err) {
                    log.userLogger.info('Done refreshing devtools from ' +
                                        '\'main\' and \'aux\' files.');
                }
                log.handleError(
                    arguments, callback,
                    {userMessage: 'An error occured while refreshing devtools'});
            });
        },
        (callback) => {
            async.eachSeries(contentPackages, (contentPackage, callback) => {
                resourcesBuilder.refresh(contentPackage.path,
                                         contentPackage.order,
                                         dbs.dbResources,
                                         dbs.dbOverviews,
                                         dbs.dbPureBundles,
                                         dbs.dbDevices,
                                         dbs.dbDevtools,
                                         macros[contentPackage.path],
                                         log,
                                         callback);
            }, function(err) {
                if (!err) {
                    log.userLogger.info('Done refreshing resources.');
                }
                log.handleError(arguments, callback,
                                {userMessage: 'An error occured while refreshing resources'});
            });
        },
        // save databases
        (callback) => {
            log.userLogger.info('Done refreshing all databases.');
            log.userLogger.info('Saving databases...');
            if (clearAllData) {
                dbs.dbDevices.save(function() {
                    dbs.dbDevtools.save(callback);
                });
            }
            else {
                setImmediate(callback);
            }
        },
        (callback) => {
            async.eachSeries([dbResources,
                              dbOverviews,
                              dbPureBundles,
                              dbDownloads], (dbItem, callback) => {
                                  dbItem.save(callback);
                              }, callback);
        }], (err) => {
            if (!err) {
                log.userLogger.info('Success!');
            }
            callback(err);
        });
};
