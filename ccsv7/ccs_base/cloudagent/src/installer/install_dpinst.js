/*jslint node: true */
"use strict";

// handle installing zip packages that are windows drivers and require use of dpinst

var path = require("path");
var exec = require("child_process").exec;
var fs = require("fs");
var Q = require("q");
var newPromise = Q;

var logger = require("../logger");
var config = require("../config");

var isOSWin64 = function() {
	return process.arch === "x64" || process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432");
};

var dpInstExec = isOSWin64() ? "dpinst_64_eng.exe" : "dpinst_86_eng.exe";
var dpInstExecFullPath = path.resolve(path.join(__dirname, "..", "..", "drivers", dpInstExec));

var _quiet = false;
var _offline = false;

// in offline mode we just copy over the driver files and generate a script to be run
// later to install the drivers
var installOffline = function(driversToInstall) {

	var script = "@echo OFF\n";
	script += "reg Query \"HKLM\\Hardware\\Description\\System\\CentralProcessor\\0\" | find /i \"x86\" > NUL && set OS=32BIT || set OS=64BIT\n";

	// create install scripts for both 32 bit and 64 bit drivers.
	driversToInstall.forEach(function(driver) {
		script += "if %OS%==32BIT dpinst_32_eng.exe /SW /SA /path %~dp0/" + driver + "\n";
		script += "if %OS%==64BIT dpinst_64_eng.exe /SW /SA /path %~dp0/" + driver + "\n";
		script += 'SET hex=%=exitcode%"\n';
		script += 'SET result=%hex:~0,1%\n';		
		script += 'if %result% geq 8 exit 1\n';	
	});
	fs.writeFileSync(path.join(config.loadersRoot, "install_drivers.bat"), script);
	return newPromise();
};

var install = function(driversToInstall) {

	var deferred = Q.defer();

	var cmd = dpInstExecFullPath + " /path \"" + path.join(config.loadersRoot, driversToInstall) + "\"";

	if (_quiet) {
		cmd += " /c /SW /SA";
	}

	logger.info("Running command : " + cmd);
	exec(cmd, function(err, stdout, stderr) {
		// Running this exec command  returns an error code
		// unless we are running tests; in which case dp inst is repalced with an echo command
		// we have account for that below by ignoring any exceptions from trying to parse the code

		var codeNum = "9999999";
		try {
			codeNum = parseInt(err.code);
		} catch (e) {
			// when running tests the process does not return an error with a code, so we have to ignore the exception
		}

		logger.info("RetCode = " + codeNum);
		if (stdout)
			logger.info("stdout = " + stdout.toString());
		if (stderr)
			logger.info("stderr = " + stderr.toString());

		// when running in quiet mode; we ignore all error codes because depending on if you are running as admin or not
		// a UAC dialog pops up and the code return corresponds to if the user accepted that or not.. otherwise the code
		// corresponds to the result of the DPInst command.
		// we run quiet mode.. as Admin in the main installer
		// we run non quiet mode.. when the IDE needs additional components installed.
		// don't check return codes for now. assume successful () : bug ( 11198 )
		logger.info("DPInst Run Successfully Ret Code: 0x" + codeNum.toString(16));
		deferred.resolve();

	});

	return deferred.promise;
};

var installDPInst = function(driversToInstall) {
	if (_offline) {
		return installOffline(driversToInstall);
	} else {
		return installNext(driversToInstall, 0);
	}

	function installNext(drivers, index) {
		return install(drivers[index])
			.then(function() {
				++index;
				if(index !== drivers.length) {
					return installNext(drivers, index);
				}
			});
	}
};

module.exports = function() {

	return {
		install: installDPInst,
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