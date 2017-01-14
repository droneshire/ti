/*jslint node: true */
"use strict";

var fs = require("fs");
var Q = require("q");

var logger = require("../logger");
var util = require("../../util/util");
var userMessages = require("./user_messages");
var config = require("../config");
var remoteServerModule = require("./remote_server");
var dbModule = require("./db");


var createInstaller = function(userDataRoot, remoteServer, db, options) {

	if (!options)
		options = {};

	var installHandlers = {
		windriver: require("./install_dpinst")(userDataRoot, remoteServer),
		osxpkg: require("./install_osx_pkg")(userDataRoot, remoteServer)
	};

	for (var key in installHandlers) {

		var handler = installHandlers[key];
		if (options.quiet)
			handler.quiet();

		if (options.offline)
			handler.offline();
	}

	var installFiles = function(fetchInstallInfo, os) {
		// keep an outer promise so we can pump out notify messages
		var deferred = Q.defer();

		var drivers;

		// lets check with the server the target is supported
		fetchInstallInfo()
			.then(function(installInfo) {

				// target is supported so we can begin the installation process
				deferred.notify({
					message: userMessages.beginInstallation(),
					isFirstUpdate: true
				});
				logger.info(userMessages.beginInstallation());

				drivers = installInfo.drivers;
				return installInfo.files;

			})
			.then(function(filesNeeded) {

				// Use the database cache to determine what files we are missing

				return db.getFilesToInstall(filesNeeded);
			})
			.then(function(filesMissing) {

				// Install missing files

				return remoteServer.downloadFiles(filesMissing, os)
					.progress(function(progressData) {
						deferred.notify(progressData);
					})
					.thenResolve(filesMissing);
			})
			.then(function(filesInstalled) {

				// Add the newly installed files to the database

				return db.filesInstalled(filesInstalled);
			})
			.then(function() {

				// Determine if there are drivers we need to register

				drivers = db.registrationNeeded(drivers);
				if (0 !== drivers.length) {
					deferred.notify({
						message: userMessages.installingWinDriver(drivers.join(", "))
					});
					return installHandlers.windriver.install(drivers)
						.then(function() {
							return db.driverRegistered(drivers);
						});
				}
			})
			.then(function() {

				// all components installed successfully

				deferred.notify({
					message: userMessages.endInstallation(),
					isComplete: true
				});
				deferred.resolve();
			})
			.catch(function(err) {

				// Something went wrong

				deferred.notify({
					message: userMessages.installationFailed(err),
					isComplete: true
				});
				logger.info(err);

				if (err && err.stack) {
					logger.info(err.stack);
				}

				deferred.reject({
					message: userMessages.installationFailed(err)
				});
			})
			.done();

		return deferred.promise;
	};

	return {

		// Full target support based on a ccxml file
		addSupport: function(ccxmlFilePath, disableG2Override) {

			var loader = "dslite";
			var fetchFunction = getSupportingFiles;
			disableG2Override = disableG2Override || false;

			if (!disableG2Override && isG2Device(ccxmlFilePath)) {
				loader = "mspdebug";
				fetchFunction = getMspdebugFiles;
			}

			return installFiles(fetchFunction)
				.thenResolve(loader);

			function getSupportingFiles() {
				return remoteServer.getSupportingFiles(ccxmlFilePath);
			}

			function getMspdebugFiles() {
				return remoteServer.getFilesByCategory(["mspdebug"]);
			}

			function isG2Device(ccxmlFilePath) {
				if (!util.isWin) {
					var contents = fs.readFileSync(ccxmlFilePath).toString();
					var match = contents.match(/<instance.*href="devices\/MSP430G2(553|452)\.xml"/);
					if (match) {
						logger.info("Overridding support to download mspdebug");
						return true;
					}
				}
				return false;
			}
		},

		// Windows drivers installation based on a connection id
		installWinDrivers: function(connectionID) {
			return installFiles(function() {
				return remoteServer.getFilesByCategory([connectionID]);
			});
		},

		// Generates an install based on a cloud instance
		// If version is undefined, the current stable version is used
		// If categories is undefined, all categories are fetched
		// If os is undefined, the current OS's files are fetched
		generateDesktopInstall: function(categories, version, os) {
			return remoteServer.generateDesktopDB(version, os)
				.then(function() {
					return installFiles(function() {
						return remoteServer.getFilesByCategory(categories, version, os);
					}, os);
				});
		},

		purge: function() {

			var deferred = Q.defer();
			deferred.resolve();

			db.purge();

			return deferred.promise;
		}
	};
};


// create an installer obj
module.exports = function(cloudAgentInstallerServerURL, options) {

	var remoteServer = remoteServerModule(cloudAgentInstallerServerURL);
	var db = dbModule(config.userDataRoot, config.loadersRoot);
	var installer = createInstaller(config.userDataRoot, remoteServer, db, options);

	return installer;
};