/*jslint node: true */
"use strict";

// Handle installing osx packges. This is specific to the G2 MSP's. The packages are not downloaded
// they are included in the main installer. If needed ( i.e using G2 ) devices; they will be installed.

var path = require("path");
var exec = require("child_process").exec;
var fs = require("fs");
var Q = require("q");
var chmodr = require("chmodr");

var logger = require("../logger");


// If offline mode. Just dump a .sh file to do the install
var installOffline = function(pkgDirPath, componentName) {

	var deferred = Q.defer();

	var installScript = path.join(pkgDirPath, componentName + ".sh");
	var script = "open -W " + componentName;
	fs.writeFileSync(installScript, script);
	chmodr.sync(installScript, parseInt("755", 8));
	deferred.resolve(componentName);

	return deferred.promise;
};

var install = function(cmd, componentName) {

	var deferred = Q.defer();

	logger.info("Running command : " + cmd);
	exec(cmd, function(err, stdout, stderr) {

		if (stdout)
			logger.info("stdout = " + stdout.toString());
		if (stderr)
			logger.info("stderr = " + stderr.toString());

		logger.info("Mandeep : " + err);
		if (err) {
			deferred.reject(err.toString());
		} else {
			deferred.resolve(componentName);
		}

	});

	return deferred.promise;
};

var installPkg = function() {

	return function(componentInfo) {

		var componentName = componentInfo.name;

		var pkgDirPath = path.join(__dirname, "..", "..", "pkgs");
		componentName = "MSP430LPCDC";

		if (this.isOffline()) {
			return installOffline(pkgDirPath, componentName);
		} else {

			var pkgToInstall = path.join(pkgDirPath, componentName);
			var cmd = "open -W " + pkgToInstall + ".pkg";
			return install(cmd, componentName);
		}

	};
};

module.exports = function() {

	var _quiet = false;
	var _offline = false;

	return {
		install: installPkg(),
		quiet: function() {
			_quiet = true;
			return this;
		},
		offline: function() {
			_offline = true;
			return this;
		},
		isOffline: function() {
			return _offline;
		},
		isQuiet: function() {
			return _quiet;
		}
	};

};