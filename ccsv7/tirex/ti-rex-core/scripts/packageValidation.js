'use strict';
require('rootpath')();

const fs = require('fs');
const path = require('path');
const fileValidation = require('scripts/singleJsonFileValidation');
const fsutils = require('lib/localserver/fsutils');
var folder;

/**
 * Reads a single file based on the file path
 * and validates the json file based on the type of metadata it is
 *
 * @param {string} filePath - The metadata directory.
 * @param {string} fileType - The type of metadata.
 * @param {function} callback
 */
function readSingleFiles(filePath, fileType, callback) {
    fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
            console.log('Missing required file: ' + filePath);
            process.exit(1);
        }
        console.log('file: ', filePath);
        var fileJson = fileValidation.parseJson(data);
        if (fileJson) {
            fileValidation.validateJsonSchema(fileJson, fileType);
            if (typeof callback === "function") {
                callback(fileJson);
            }
        }
    });
}

/**
 * Loops through all the files that matched the file path regex
 * and validates the json file based on the type of metadata it is
 *
 * @param {array} files - The metadata files.
 * @param {string} fileType - The type of metadata.
 * @param {boolean} isRequired - if the file is a required file
 */

function readMultipleFiles(files, fileType, isRequired) {
    if (isRequired && files.length === 0) {
        console.log('Missing required file: ' + fileType + '.tirex.json');
        process.exit(1);
    }
    files.forEach(function (file) {
        var filePath = path.join(folder,file);
        fs.readFile(filePath, 'utf8', function (err, data) {
            if (err) {
                process.exit(1);
            }
            console.log('file: ', filePath);
            var fileJson = fileValidation.parseJson(data);
            if (fileJson) {
                fileValidation.validateJsonSchema(fileJson, fileType);
            }
        });
    });
}

/**
 * Read and validates the content.tirex.json files for 3.0
 * Matches <any folder in pkg>/.metadata/.tirex/content.tirex.json
 * content.tirex.json can be prefixed with a string eg.myprefx.content.tirex.json
 * The prefix must not be 2.0_devtools or 2.0_devices for they are preserved for 2.1 metadata
 */
function readContentFiles() {
    if (process.platform === 'linux') {
        readMultipleFiles(fsutils.readDirRecursive(
            folder,
            /[^<>|"]*\.metadata\/\.tirex\/(?!2\.0_devices\.content\.tirex\.json)(?!2\.0_devtools\.content\.tirex\.json)\b([^\/<>|"]+[\.])*content\.tirex\.json$/), 'content');
    } else {
        readMultipleFiles(fsutils.readDirRecursive(
            folder,
            /[^<>|"]*\.metadata\\\.tirex\\(?!2\.0_devices\.content\.tirex\.json)(?!2\.0_devtools\.content\.tirex\.json)\b([^\/<>|"]+[\.])*content\.tirex\.json$/), 'content');
    }
}

/**
 * Read and validates the content.tirex.json files for 2.1 for compatibility
 * Matches <any folder in pkg>/.metadata/.tirex/2.0_devtools.content.tirex.json
 * or 2.0_devices.content.tirex.json
 */
function readOldContentFiles() {
    if (process.platform === 'linux') {
        readMultipleFiles(fsutils.readDirRecursive(
            folder,
            /[^<>|"]*\.metadata\/\.tirex\/2\.0_devices\.content\.tirex\.json$/), 'content');
        readMultipleFiles(fsutils.readDirRecursive(
            folder,
            /[^<>|"]*\.metadata\/\.tirex\/2\.0_devices\.content\.tirex\.json$/), 'content');
    } else {
        readMultipleFiles(fsutils.readDirRecursive(
            folder,
            /[^<>|"]*\.metadata\\\.tirex\\2\.0_devices\.content\.tirex\.json$/), 'content');
        readMultipleFiles(fsutils.readDirRecursive(
            folder,
            /[^<>|"]*\.metadata\\\.tirex\\2\.0_devtools\.content\.tirex\.json$/), 'content');
    }
}

function logErrorForInvalidFiles(allReg, matchReg, pkgRoot) {
    var files = fsutils.readDirRecursive(
        folder,
        allReg);
    files.forEach(function (file) {
        var filePath = path.join(folder, file);
        var res = filePath.match(matchReg);
        if (!res) {
            console.log('file: "' + filePath + "': ");
            if (pkgRoot) {
                if (process.plateform === 'linux') {
                    console.log('Not validated. This file should be placed inside "<pkg root>\\.metadata\\.tirex\\" folder. ');
                } else {
                    console.log('Not validated. This file should be placed inside "<pkg root>/.metadata/.tirex/" folder. ');
                }
            } else {
                if (process.plateform === 'linux') {
                    console.log('Not validated. This file should be placed inside "<any folder in pkg>\\.metadata\\.tirex\\" folder. ');
                } else {
                    console.log('Not validated. This file should be placed inside "<any folder in pkg>/.metadata/.tirex/" folder. ');
                }
            }
        }
    });
}

function readInvalidFiles() {
    if  (process.platform === 'linux') {
        logErrorForInvalidFiles(/[^<>|"]*([^\/<>|"]+[.])*content.tirex.json$/,
            /[^<>|"]*\.metadata\/\.tirex\/([^\/<>|"]+[.])*content.tirex.json$/, false);
        logErrorForInvalidFiles(/([^<>|"])+\/devices.tirex.json|devices.tirex.json$/,
            /\.metadata\/\.tirex\/devices.tirex.json$/, true);
        logErrorForInvalidFiles(/([^<>|"])+\/devtools.tirex.json|devtools.tirex.json$/,
            /\.metadata\/\.tirex\/devtools.tirex.json$/, true);
        logErrorForInvalidFiles(/([^<>|"])+\/package.tirex.json|package.tirex.json$/,
            /\.metadata\/\.tirex\/package.tirex.json$/, true);
    }else {
        logErrorForInvalidFiles(/[^<>|"]*([^\/<>|"]+[\.])*content.tirex.json$/,
            /[^<>|"]*\.metadata\\\.tirex\/([^\/<>|"]+[\.])*content.tirex.json$/, false);
        logErrorForInvalidFiles(/([^<>|"])+\\devices.tirex.json|devices.tirex.json$/,
            /\.metadata\\\.tirex\\devices.tirex.json$/, true);
        logErrorForInvalidFiles(/([^<>|"])+\\devtools.tirex.json|devtools.tirex.json$/,
            /\.metadata\\\.tirex\/devtools.tirex.json$/, true);
        logErrorForInvalidFiles(/([^<>|"])+\\package.tirex.json|package.tirex.json$/,
            /\.metadata\\\.tirex\\package.tirex.json$/, true);
    }
}

/**
 * Read and validates the devices.tirex.json files
 */
function readDeviceFile() {
    var deviceJsonPath = (process.platform === 'linux') ? path.join(folder,'.metadata/.tirex/devices.tirex.json') : path.join(folder,'.metadata\\.tirex\\devices.tirex.json');
    readSingleFiles(deviceJsonPath, 'devices');
}

/**
 * Read and validates the devtools.tirex.json files
 */
function readDevToolsFile () {
    var devtoolsJsonPath = (process.platform === 'linux') ? path.join(folder,'.metadata/.tirex/devtools.tirex.json') :  path.join(folder,'.metadata\\.tirex\\devtools.tirex.json');
    readSingleFiles(devtoolsJsonPath, 'devtools');
}

function readMetadataFiles(packageJson) {
    switch (packageJson[0].type) {
        case 'devices':
            readDeviceFile();
            break;
        case 'devtools':
            readDevToolsFile();
            break;
        default:
            if (packageJson[0].metadataVersion.match("^([2][.][0]?[1][.][0]{1,2})$" )) {
                readOldContentFiles();
            }
            break;
    }
    readContentFiles();
}


if (require.main === module) {
    // gets filename from the command line.
    // eg: node packageValidation.js testPackage/
    if (process.argv.length !== 3) {
        console.log('Usage: node ' + process.argv[1]+ 'PackageFolder');
        process.exit(1);
    }
    folder = process.argv[2];
    console.log('Note: "devices.tirex.json" and "devtools.tirex.json" files from Software packages will not be validate for Metadata of version 2.1.0.');
    var packageJsonPath = (process.platform === 'linux') ? path.join(folder,'.metadata/.tirex/package.tirex.json'): path.join(folder,'.metadata\\.tirex\\package.tirex.json');
    readInvalidFiles();
    readSingleFiles(packageJsonPath, 'package', function(packageJson) {
        readMetadataFiles(packageJson);
    });

}