/*jslint node: true */
"use strict";


var spawn = require("child_process").spawn;
var Q = require("q");
var path = require("path");

var config = require("../config");
var logger = require("../logger");


var spawnDS = function(onClose) {

	logger.info("Starting DS!!!!!");

	var deferred = Q.defer();

	var execFile = "./DSLite";
	var workingDirPath = path.resolve(config.loadersRoot + "/ccs_base/DebugServer/bin");
	var params = [];

	logger.info("spawnDS : execFile = " + execFile + " args = " + params + " cwd = " + workingDirPath);
	var lp = spawn(execFile, params, {
		cwd: workingDirPath,
		detached: true
	});

	function stdoutHandler(data) {

		var dataStr = data.toString();
		logger.info("DS Lite : " + dataStr);

		if (dataStr.indexOf("Error") > -1) {
			logger.info(dataStr);
			deferred.reject({
				message: dataStr
			});
			return;
		}

		try {
			var dataObj = JSON.parse(dataStr);
			if (dataObj.port) {
				logger.info("Started DS Lite : " + dataStr);
				deferred.resolve(dataObj);
			}
		} catch (e) {
			// ignore non json data
		}
	}

	lp.stdout.on("data", stdoutHandler);

	lp.stderr.on("data", function(data) {
		deferred.reject({
			message: data.toString()
		});
	});

	lp.on("close", function() {
		logger.info("DSLite process : close event");
		onClose();
	});

	lp.on("exit", function() {
		logger.info("DSLite process : exit event");
	});

	lp.on("disconnect", function() {
		logger.info("DSLite process : disconnect event");
	});

	lp.on("error", function(err) {
		logger.info("DSLite process : error event" + err.toString());
		deferred.reject(err);
	});

	return deferred.promise
		.finally(function() {

			// Once the promise is complete, stop listending to stdout
			// This saves us from logging 1000's of ctools logging messages

			lp.stdout.removeListener("data", stdoutHandler);
		});
};



module.exports = {

	name: "DS",
	create: function(onClose) {
		return spawnDS(onClose);
	}
};