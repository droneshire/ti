/*jslint node: true */
"use strict";

var path = require("path");
var Q = require("q");

var logger = require("../logger");
var util = require("../../util/util");
var config = require("../config");
var createModule = require("../module").createModule;


var userMessages = (function() {
	return {
		loadFailed: function() {
			return "\nPlease power cycle the device and try again\n";
		}
	};
}());

var platform = (function() {

	var ext = util.isWin ? ".exe" : "";

	return {
		ext: ext,
		loadersDirPath: config.loadersRoot,
		isWin: util.isWin,
		isLinux: util.isLinux
	};

}());


var mspdebugSpec = (function() {

	var checkError = function(err) {
		if (err) {
			return false;
		} else {
			return true;
		}
	};

	return {
		execFile: "./mspdebug" + platform.ext,
		workingDirPath: path.resolve(platform.loadersDirPath + "/ccs_base/DebugServer/bin"),
		getLoadProgramArgs: function(filePath) {
			return ["rf2500", "--force-reset", "erase", "load " + filePath];
		},
		success: checkError,
		diagnosticInfo: function(stderr) {
			if (util.isOSX && -1 !== stderr.toString().indexOf("can't claim interface: Permission denied")) {
				return "Try running the following as root: " + path.resolve(platform.loadersDirPath + "/ccs_base/DebugServer/drivers/install_ez430rf2500.kext.sh") + "\n\n";
			}

		}
	};
}());



var makeLoader = function(spec) {

	var exec = require("child_process").execFile;
	if (platform.isLinux) {
		// set the ld library path to include current directory.. needed for msp430
		process.env.LD_LIBRARY_PATH = ".";
	}

	var loadProgramExec = function(filePath) {

		var deferred = Q.defer();

		deferred.notify("Flashing Device...\n");
		logger.info("Programming File -> " + filePath);
		logger.info("Util -> " + spec.execFile);
		logger.info("Args -> " + spec.getLoadProgramArgs(filePath));
		logger.info("Working Dir ->" + spec.workingDirPath);

		exec(spec.execFile, spec.getLoadProgramArgs(filePath), {
			cwd: spec.workingDirPath
		}, function(err, stdout, stderr) {
			var message = "err : " + (err ? err.toString() : "none") + " stdout: " + stdout + " stderr : " + stderr;
			logger.info(message);
			if (spec.success(err, stdout)) {
				deferred.notify("Flash Successful!\n");
				deferred.resolve();
			} else {
				var errormsg = "Flash Failed : " + stderr + "\n\n";

				if (spec.diagnosticInfo) {
					errormsg += spec.diagnosticInfo(err, stderr);
				}

				errormsg += userMessages.loadFailed();
				deferred.reject(errormsg);
			}
		});

		return deferred.promise;
	};

	return {
		loadProgram: function(filePath) {
			return loadProgramExec(filePath);
		}
	};
};

var mspdebugLoader = null;

var getLoader = function(loader) {

	if (loader === "mspdebug") {
		if (mspdebugLoader === null) {
			mspdebugLoader = makeLoader(mspdebugSpec);
		}
		return mspdebugLoader;
	}

	throw "Unsupported Loader: " + loader;

};

var loadProgram = function(loaderType, filePath) {
	var loader = getLoader(loaderType);
	return loader.loadProgram(filePath);
};


module.exports = {

	name: "Flash",

	create: function(onClose) {

		return createModule(this.name, onClose).then(
			function(flash) {

				flash.commands.loadProgram = function(loaderType, filePath) {
					logger.info("loadProgram -> loaderType: " + loaderType + " filePath : " + filePath);
					return loadProgram(loaderType, filePath);
				};

				return {
					port: flash.getPort()
				};
			}
		);

	}

};