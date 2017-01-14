/*jslint node: true */
"use strict";

var path = require("path");
var fs = require("fs");

var util = require("../../util/util");
var logger = require("../logger");

function readConfigFile(fileName) {
	try {
		return JSON.parse(fs.readFileSync(fileName, "utf8"));
	} catch (err) {
		logger.info("Could not open fileName: " + err);
	}
	return {};
}

function createDB(userDir, loadersDir) {

	var dbRoot = path.join(userDir, "db");
	if (!fs.existsSync(dbRoot)) {
		logger.info("Creating db dir : " + dbRoot);
		fs.mkdirSync(dbRoot);
	}

	// What files and versions have been installed

	var installedFilesJsonFile = path.join(dbRoot, "installedFiles.json");

	// Which drivers have been registered

	var installedDriversJsonFile = path.join(dbRoot, "installedDrivers.json");	

	var installedFiles = readConfigFile(installedFilesJsonFile);
	var installedDrivers = readConfigFile(installedDriversJsonFile);

	// Return the set of files that are not already installed, and thus need to
	// be installed, based on the passed in file set and what we already have
	// installed

	function getFilesToInstall(fileSet) {

		var filesToInstall = [];
		fileSet.forEach(function(file) {
			if (installedFiles[file.name] !== file.version) {
				filesToInstall.push(file);
			}
		});
		return filesToInstall;
	}

	// Notification that the following files were successfully installed
	// Update our list of installed files, and if any of them are in a 
	// folder that needs to be registered, then marke that folder invalid

	function filesInstalled(fileSet) {
		fileSet.forEach(function(file) {
			installedFiles[file.name] = file.version;
			if (file.name.split("/")[0] in installedDrivers) {
				installedDrivers[file.name.split("/")[0]] = false;
			}
		});
		fs.writeFileSync(installedFilesJsonFile, JSON.stringify(installedFiles, null, "\t"));
		fs.writeFileSync(installedDriversJsonFile, JSON.stringify(installedDrivers, null, "\t"));
	}

	// Indicate if the given path has been previously registered
	// driverPath is undefined if there are no drivers to install
	// (mac/linux)

	function registrationNeeded(driverPaths) {
		driverPaths = driverPaths || [];
		logger.info("registrationNeeded = " + driverPaths.join(","));
		return driverPaths.filter(function(driverPath) {
			return !installedDrivers[driverPath];
		});
	}

	// Notification that the given path has been successfully registered

	function driverRegistered(driverPaths) {

		driverPaths.forEach(function(driverPath) {
			installedDrivers[driverPath] = true;
		});
		fs.writeFileSync(installedDriversJsonFile, JSON.stringify(installedDrivers, null, "\t"));
	}

	// Delete all information in the database so we start clean

	function purge() {

		util.deleteFolderRecursive(dbRoot);
		util.deleteFolderRecursive(loadersDir);

		// recreate the folders
		fs.mkdirSync(dbRoot);

		installedFiles = {};
	}

	return {

		getFilesToInstall: getFilesToInstall,
		filesInstalled: filesInstalled,
		registrationNeeded: registrationNeeded,
		driverRegistered: driverRegistered,
		purge: purge
	};
}

module.exports = function(userDataRoot, loadersRoot) {
	return createDB(userDataRoot, loadersRoot);
};