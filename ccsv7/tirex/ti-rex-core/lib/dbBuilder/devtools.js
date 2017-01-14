/**
 *
 * Devtool Database schema
 * ======================
 * @property {String} name (mandatory)
 * @property {String} description
 * @property {String} image
 * @property {String} description
 * @property {Array} devices: list of devices that can be used with this devtool
 * @property {Array} connections: list of names of the connection XML files, as it appears in the
 *                   <ccs>\ccsv6\ccs_base\common\targetdb\connections\ directory. The first entry will be used as the default.
 * @property {Array} energiaBoards
 *      @property {String} id
 *      @property {String} description
 */

'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var semver = require('semver');

var vars = require('../vars');
var idHelper = require('./idHelper');
var preproc = require('./preproc');
var utils = require('./dbBuilderUtils');
const devices = require('./devices');

const loggerDevtools = {
    log: function() {

    }
};


/**
 * Clear log
 */
exports.clearLog = function() {
    return;
};

/**
 * Refresh devtools database - IMPORTANT: Any main files MUST BE parsed FIRST, followed by the aux files.
 *
 * @param mainOrAux: main devtool tree files add new records whereas aux files only can update existing records with new fields.
 *  Aux files restrictions:
 *      - an aux file cannot add records
 *      - an aux file cannot contain fields that are already specified in another main or aux json file.
 *  Any entry and/or field that doesn’t conform will be rejected.
 * @param packagePath
 * @param dbDevtools - the dev tools database.
 * @param callback(err, logFile)
 */
exports.refresh = function(mainOrAux,
                           packagePath,
                           dbDevtools,
                           dbDevices,
                           packageMacros,
                           log,
                           callback) {
    loggerDevtools.log = (type, message) => {
        if (type === 'debug') {
            return;
        }
        if (log.userLogger[type]) {
            log.userLogger[type](message);
        }
        else {
            log.userLogger.info(message);
        }
    };
    
    vars.getMetadataDir(packagePath, function(metadataDir) {
        // [ Metadata_2.1 : Check package type before refreshing
        utils.getPackageMetadata(packagePath, metadataDir, packageMacros, loggerDevtools, function(err, vID, metadata) {
            if (err || !metadata) {
                return callback(err);
            }
            if(metadata.type !== vars.META_2_1_TOP_CATEGORY.devtools.id) {
                //loggerDevices.log('info', 'Skipping devtools');
                return callback(null);
            }
            var devtoolsFileName = (mainOrAux === 'main')?
                'devtools.tirex.json' : 'devtools-aux.tirex.json';
            var devtoolsFile = path.join(vars.CONTENT_BASE_PATH, packagePath,
                                         metadataDir, devtoolsFileName);
            preproc.processFile(devtoolsFile, packageMacros, loggerDevtools, function(err, preprocResult) {
                if (err || !preprocResult) {
                    return callback(err);
                }
                exports._process(preprocResult.records, packagePath, metadataDir, dbDevtools,
                                 dbDevices, mainOrAux, vID, callback);
            });
        });
    });
};

exports._process = function (devtoolList, packagePath, metadataDir, dbDevtools, dbDevices, mainOrAux, header, callback) {
    async.eachSeries(devtoolList, function (devtoolRecord, callback) {
        devtoolRecord.packageVersion = header.packageVersion;
        devtoolRecord._id = idHelper.createUuid(devtoolRecord).idVal;
        devtoolRecord.packageId = header.packageId;
        devtoolRecord.packageUId = header.packageId + vars.PACKAGE_ID_VERSION_DELIMITER + header.packageVersion;

        if (devtoolRecord.name == null) {
            loggerDevtools.log('error', 'Devtool has no name field: ' + JSON.stringify(devtoolRecord));
            return callback('Aborting due to error(s)'); // TODO: make messages consistent
        }
        if (devtoolRecord.id == null) {
            if (semver.gte(header.metadataVersion, '2.1.0')) {
                devtoolRecord.id = devtoolRecord.name; // TODO: good for transition period, but need to enforce in future with below
                //loggerDevtools.log('error', 'Devtool has no id field: ' + JSON.stringify(devtoolRecord));
                //return callback('Aborting due to error(s)'); // TODO: make messages consistent
            }
        }

        // prefix image path or remove if file doesn't exist (UI should display a default image in this case)
        if ('image' in devtoolRecord) {
            // Metadata_2.1 : files are relative to the metadata
            devtoolRecord.image = path.join(packagePath, metadataDir, devtoolRecord.image);
            if (fs.existsSync(path.join(vars.CONTENT_BASE_PATH, devtoolRecord.image)) === false) {
                delete devtoolRecord.image;
            }
        }
        // [ REX-1061
        // prefix link path or remove if file doesn't exist (UI should display description in this case)
        if ('descriptionLocation' in devtoolRecord) {
            // Metadata_2.1 : files are relative to the metadata
            devtoolRecord.descriptionLocation = path.join(packagePath, metadataDir, devtoolRecord.descriptionLocation);
            if (fs.existsSync(path.join(vars.CONTENT_BASE_PATH, devtoolRecord.descriptionLocation)) === false) {
                delete devtoolRecord.descriptionLocation;
            }
        }
        // ]

        async.series([
            (callback) => {
                // look up device names based on IDs
                if (devtoolRecord.devices != null) {
                    devices.getNames(dbDevices, devtoolRecord.devices, (err, deviceNames) => {
                        devtoolRecord.devices = deviceNames;
                        callback(err);
                    });
                } else {
                    setImmediate(callback);
                }
            },
            (callback) => {
                // check if there's an existing record for this devtool
                dbDevtools.findOne({
                    name: devtoolRecord.name,
                    packageUId: devtoolRecord.packageUId
                }, function (err, existingDevtoolRecord) {
                    if (err) {
                        loggerDevtools.log('error', 'An error with inserting a devtool record has occurred: ' + JSON.stringify(err));
                        return callback(err);
                    }
                    // process main devtool tree files
                    if (mainOrAux === 'main') {
                        if (existingDevtoolRecord != null) {
                            loggerDevtools.log('error', 'A main tree file cannot override existing records. Skipping record, offending record: ' + JSON.stringify(devtoolRecord));
                            callback(err);
                            return;
                        }
                        // add to database
                        dbDevtools.insert(devtoolRecord, function (err, result) {
                            if (err) {
                                loggerDevtools.log('error', 'An error with inserting a devtool record has occurred: ' + JSON.stringify(err));
                            } else {
                                loggerDevtools.log('debug', 'Inserted: ' + JSON.stringify(result));
                            }
                            callback(err);
                        });
                    }
                    // process auxiliary devtool tree files
                    else if (mainOrAux === 'aux') {
                        if (existingDevtoolRecord == null) {
                            loggerDevtools.log('error', 'An aux tree file cannot add new records. Skipping record. File: ' + file +
                                ', offending record: ' + JSON.stringify(devtoolRecord));
                            callback(err);
                            return;
                        }
                        // add the new properties from the aux file
                        for (var newProp in devtoolRecord) {
                            if (newProp === '_id' || newProp === 'name' || newProp === 'packageId' || newProp === 'packageUId' || newProp === 'packageVersion') {
                                continue;
                            }
                            else if (existingDevtoolRecord.hasOwnProperty(newProp)) {
                                loggerDevtools.log('error', 'An aux file cannot override existing properties. Skipping property. File: ' + file +
                                    ', record: ' + JSON.stringify(devtoolRecord) + ', offending property: ' + newProp);
                            } else {
                                existingDevtoolRecord[newProp] = devtoolRecord[newProp];
                            }
                        }
                        // update database
                        dbDevtools.update({_id: existingDevtoolRecord._id}, existingDevtoolRecord, function (err) {
                            if (err) {
                                loggerDevtools.log('error', 'An error with updating a devtool record has occurred: ' + JSON.stringify(err));
                            }
                            callback(err);
                        });
                    } else {
                        loggerDevtools.log('error', 'Tree file must be either main or aux. Not recognized: ' + mainOrAux);
                        return callback(err);
                    }
                });
            }], callback);
    }, function (err) {
        loggerDevtools.log('info', 'Created devtool database');
        setImmediate(callback, err);
    });
};

/**
 *
 * @param dbDevtools
 * @param devtoolIds
 * @param callback(err, devtoolNames)
 */
exports.getNames = function(dbDevtool, devtoolIds, callback) {
    dbDevtool.find({id: {$in: devtoolIds}}, function(err, devtools) {
        if (err) {
            loggerDevtools.log('debug', 'Query error: ' + JSON.stringify(err));
            return callback(err);
        }
        if (devtools == null) {
            return callback(null, null);
        }
        let devtoolNames = [];
        for (let i = 0; i < devtools.length; i++) {
            devtoolNames.push(devtools[i].name);
        }
        callback(null, devtoolNames);
    });
};
