
/**
 *
 * Device Database schema
 * ======================
 * @property {String} name (mandatory) (forced to uppercase, '/' converted to '_')
 * @property {String} parent (forced to uppercase, '/' converted to '_')
 * @property {String} description
 * @property {String} image
 * @property {Array} coreTypes: input only; flattened to coreTypes_name and coreTypes_id and then deleted
 *
 * the following fields will be added by the DB builder:
 * @property {Array} ancestors
 * @property {Array} children
 * @property {Array} coreTypes_name
 * @property {Array} coreTypes_id
 */

'use strict';

var path = require('path');
var async = require('async');
var semver = require('semver');

var vars = require('../vars');
var idHelper = require('./idHelper');
var preproc = require('./preproc');
var utils = require('./dbBuilderUtils');

const loggerDevices = {
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
 * Refresh device database
 *
 * @param dbDevices - the device database.
 * @param callback(err, logFile)
 */
exports.refresh = function(packagePath, dbDevices, packageMacros, log, callback) {
    loggerDevices.log = (type, message) => {
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
        utils.getPackageMetadata(packagePath, metadataDir, packageMacros,
            loggerDevices, function(err, vID, metadata) {
            if (err || !metadata) {
                return callback(err);
            }
            if(metadata.type !== vars.META_2_1_TOP_CATEGORY.devices.id) {
                //loggerDevices.log('info', 'Skipping devices');
                return callback(null);
            }
            var deviceFile = path.join(vars.CONTENT_BASE_PATH, packagePath,
                                       metadataDir, 'devices.tirex.json');
            preproc.processFile(deviceFile, packageMacros, loggerDevices, function(err, preprocResult) {
                if (err || !preprocResult) {
                    return callback(err);
                }
                exports._process(preprocResult.records, dbDevices,
                                 packagePath, metadataDir, vID, callback);
            });
        });
    });
};

/**
 * Update device database: process device metadata and insert into device DB
 *
 * @param dbDevices - the device database
 * @param callback(err, logFile)
 */
exports._process = function(deviceList, dbDevices, packagePath, metadataDir, header, callback) {
    // 1st pass
    // force all device names to upper case (to allow some latitude in how content providers specify
    // them across device tree and content db's)
    async.each(deviceList, function (deviceRecord, callback) {
        loggerDevices.log('debug', 'Processing device record ' + deviceRecord.name);
        //TODO need to pass the package header to the unique id generator
        //deviceRecord.packageVersion = packagePath.split(vars.PACKAGE_ID_VERSION_DELIMITER)[1];
        deviceRecord.packageVersion = header.packageVersion;
        deviceRecord._id = idHelper.createUuid(deviceRecord).idVal;
        deviceRecord.packageId = header.packageId;
        deviceRecord.packageUId = header.packageId + vars.PACKAGE_ID_VERSION_DELIMITER +
            header.packageVersion;

        if (deviceRecord.name == null) {
            loggerDevices.log('error', 'Device has no name field: ' + JSON.stringify(deviceRecord));
            return callback('Aborting due to error(s)'); // TODO: make messages consistent
        }
        if (deviceRecord.id == null) {
            if (semver.gte(header.metadataVersion, '2.1.0')) {
                deviceRecord.id = deviceRecord.name; // TODO: good for transition period, but need to enforce in future with below
                //loggerDevices.log('error', 'Device has no id field: ' + JSON.stringify(deviceRecord));
                //return callback('Aborting due to error(s)'); // TODO: make messages consistent
            }
        }

        deviceRecord.name = deviceRecord.name.toUpperCase().replace('/', '_');
        if ('parent' in deviceRecord) {
            deviceRecord.parent = deviceRecord.parent.toUpperCase().replace('/', '_');
        }
        setImmediate(callback);
    }, function (err) {
        if (err) {
            setImmediate(callback, err);
            return;
        }
        // 2nd pass: ancestors, children, image path
        async.each(deviceList, function (deviceRecord, callback) {
                // add in all device ancestors
                deviceRecord.ancestors = findDeviceAncestors(deviceRecord, deviceList, []);

                // add in all the device's immediate  children
                deviceRecord.children = findDeviceChildren(deviceRecord, deviceList);

                // prefix image path
                if ('image' in deviceRecord) {
                    // Metadata_2.1 : files are relative to the metadata
                    deviceRecord.image = path.join(packagePath, metadataDir, deviceRecord.image);
                }
                // [ REX-1061
                // prefix description link path
                if ('descriptionLocation' in deviceRecord) {
                    // Metadata_2.1 : files are relative to the metadata
                    deviceRecord.descriptionLocation = path.join(packagePath, metadataDir, deviceRecord.descriptionLocation);
                }
                // ]

                // flatten coreTypes (since rexdb can't query embedded objects)
                if (deviceRecord.coreTypes != null) {
                    deviceRecord.coreTypes_name = [];
                    deviceRecord.coreTypes_id = [];
                    for (var i = 0; i < deviceRecord.coreTypes.length; i++) {
                        var coreType = deviceRecord.coreTypes[i];
                        deviceRecord.coreTypes_name.push(coreType.name);
                        deviceRecord.coreTypes_id.push(coreType.id);
                    }
                    delete deviceRecord.coreTypes;
                } else {
                // if no coreTypes specified assume a single or homogeneous device with core id/name
                // being the same as device id/name
                // TODO: introduce device id
                    deviceRecord.coreTypes_name = [deviceRecord.name];
                    deviceRecord.coreTypes_id = [deviceRecord.name];
                }

                // add to database
                dbDevices.insert(deviceRecord, function (err, result) {
                    if (err) {
                        loggerDevices.log('error', 'An error with inserting a device record has ' +
                            'occurred: ' + JSON.stringify(err));
                    } else {
                        loggerDevices.log('debug', 'Inserted: ' + JSON.stringify(result));
                    }
                    callback(err);
                });
            },
            function (err) {
                loggerDevices.log('info', 'Created device database');
                setImmediate(callback, err);
            }
        );
    });
};

/**
 * Build array of ancestors recursively
 * @param {Object} deviceRecord - The device object
 * @param {Array} deviceList - The device list
 * @param {Array} ancestorNames - Ancestors already known
 * @return {Array} - List of ancestor names reflecting the hierarchy in the tree
 */
function findDeviceAncestors(deviceRecord, deviceList, ancestorNames) {
    if ('parent' in deviceRecord) {
        var parentRecord = findDeviceRecordByName(deviceRecord.parent, deviceList);
        if (parentRecord != null) {
            ancestorNames.splice(0, 0, parentRecord.name);
            ancestorNames = findDeviceAncestors(parentRecord, deviceList, ancestorNames);
        } else {
            loggerDevices.log('warning', 'Device parent ' + deviceRecord.parent +
                ' not found in device tree');
        }
    }
    return ancestorNames;
}

/**
 * Build array of device children for a given device
 * @param {Object} deviceRecord - The device object
 * @param {Array} deviceList - The device list
 * @return {Array} - List of children names
 */
function findDeviceChildren(deviceRecord, deviceList) {
    var childrenNames = [];

    for (var i = 0; i < deviceList.length; i++) {
        var childCandidate = deviceList[i];
        if (childCandidate.parent === deviceRecord.name) {
            childrenNames.push(childCandidate.name);
        }
    }

    if (childrenNames.length === 0) {
        return null;
    } else {
        return childrenNames;
    }
}

/**
 * Find a device record by device name
 * @param {String} deviceName - The device name
 * @param {Array} deviceList - The device list
 * @return {Object} - The found device object or null if not found
 */
function findDeviceRecordByName(deviceName, deviceList) {
    for (var i = 0; i < deviceList.length; i++) {
        if (deviceList[i].name === deviceName) {
            return deviceList[i];
        }
    }
    return null;
}

/**
 * Utility function
 *
 * @param dbDevices
 * @param deviceName
 * @param callback(err, bool, deviceRecord)
 */
exports.isDeviceVariant = function(dbDevices, deviceName, callback) {
    dbDevices.findOne({name: deviceName}, function(err, deviceRecord) {
        if (err) {
            //loggerResources.log('debug', 'Query error: ' + JSON.stringify(err));
            callback(err);
            return;
        }
        if (deviceRecord === null) {
            callback(null, false, null);
            return;
        }

        if (deviceRecord.children == null || deviceRecord.children.length === 0) {
            callback(null, true, deviceRecord);
        } else {
            callback(null, false, null);
        }
    });
};

/**
 *
 * @param dbDevices
 * @param deviceIds
 * @param callback(err, deviceNames)
 */
exports.getNames = function(dbDevices, deviceIds, callback) {
    dbDevices.find({id: {$in: deviceIds}}, function(err, devices) {
        if (err) {
            loggerDevices.log('debug', 'Query error: ' + JSON.stringify(err));
            return callback(err);
        }
        if (devices == null) {
            return callback(null, null);
        }
        let deviceNames = [];
        for (let i = 0; i < devices.length; i++) {
            deviceNames.push(devices[i].name);
        }
        callback(null, deviceNames);
    });
};
