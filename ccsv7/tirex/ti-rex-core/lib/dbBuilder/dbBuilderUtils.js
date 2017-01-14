'use strict';

var path = require('path');
var semver = require('semver');

var vars = require('../vars');
var preproc = require('./preproc');

/**
 * Get the package version and id.
 *
 * @param {string} packagePath
 * @param {string} metadataDir
 * @param packageMacros
 * @param {Object} logger
 * @param callback(err, vID)
 */
exports.getPackageVersionAndId = function(packagePath, metadataDir,
                                          packageMacros, logger,
                                          callback) {
    var packageFile = path.join(vars.CONTENT_BASE_PATH, packagePath,
                                metadataDir, 'package.tirex.json');
    preproc.processFile(packageFile, packageMacros, logger, function(err, preprocResult) {
        if (err || !preprocResult) {
            return callback(err);
        }
        var header = {
            'packageVersion': preprocResult.records[0].version,
            'packageId': preprocResult.records[0].id
        };
        return callback(null, header);
    });
};

/**
 * Get the package metadata.
 *
 * @param {string} packagePath
 * @param {string} metadataDir
 * @param packageMacros
 * @param {Object} logger
 * @param callback(err, vID, metadata)
 */
exports.getPackageMetadata = function(packagePath, metadataDir, packageMacros, logger, callback) {
    let packageFile = path.join(vars.CONTENT_BASE_PATH, packagePath, metadataDir, 'package.tirex.json');
    preproc.processFile(packageFile, packageMacros, logger, function(err, preprocResult) {
        if (err || !preprocResult) {
            return callback(err);
        }
        if(preprocResult != null && preprocResult.records.length > 0) {
            let packageMetadata = preprocResult.records[0];
            if(packageMetadata.metaDataVer == null) {
                // set to default version
                packageMetadata.metaDataVer = '1.0.0';
            }
            if(semver.lt(packageMetadata.metaDataVer, '2.1.0')) {
                // convert to new version
                packageMetadata.metaDataVer = '2.1.0';
                if (packageMetadata.type == null) {
                    packageMetadata.type = 'software'; // legacy full package
                }
            }
            let vID = {
                'packageVersion': packageMetadata.version,
                'packageId': packageMetadata.id
            };
            // default display name for packageType
            if(packageMetadata.type === vars.META_2_1_TOP_CATEGORY.software.id) {
                packageMetadata.typeName = vars.META_2_1_TOP_CATEGORY.software.text;
            }
            else if(packageMetadata.type === vars.META_2_1_TOP_CATEGORY.devices.id) {
                packageMetadata.typeName = vars.META_2_1_TOP_CATEGORY.devices.text;
            }
            else if(packageMetadata.type === vars.META_2_1_TOP_CATEGORY.devtools.id) {
                packageMetadata.typeName = vars.META_2_1_TOP_CATEGORY.devtools.text;
            }
            return callback(null, vID, packageMetadata);
        }
        return callback("Invalid package.tirex.json");
    });
};

