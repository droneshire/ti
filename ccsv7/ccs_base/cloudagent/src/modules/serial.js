/*jslint node: true */
"use strict";

var SerialPort = require("serialport");
var Q = require("q");

var logger = require("../logger");
var createModule = require("../module").createModule;

var setUpDisplayName = function(ports) {
	for (var i = 0; i < ports.length; ++i) {
		var port = ports[i];
		if (port.manufacturer) {
			port.displayName = port.comName + "(" + port.manufacturer + ")";
		} else if (port.pnpId) {
			port.displayName = port.comName + "(" + port.pnpId + ")";
		} else {
			port.displayName = port.comName;
		}
	}

};

var listPorts = function() {

	var deferred = Q.defer();

	SerialPort.list(function(err, ports) {
		if (err) {
			deferred.reject({
				message: err.toString()
			});
		} else {
			setUpDisplayName(ports);
			deferred.resolve({
				ports: ports
			});
		}
	});

	return deferred.promise;
};

var openPortCache = {};
var openPort = function(portInfo, serialOut, serialClose) {

	var deferred = Q.defer();

	try {
		// this could throw
		// create the serial port
		var serialPort = new SerialPort.SerialPort(portInfo.comName, portInfo, function(err) {

			if (err) {

				var msg = portInfo.comName + " could not be opened: " + err.toString();
				logger.info(msg);
				deferred.reject({
					message: msg
				});

			} else {

				serialPort.on("close", function() {
					logger.info("Serial port connection closed: " + portInfo.comName);
					openPortCache[portInfo.comName] = null;
					serialClose(portInfo);
				});

				serialPort.on("data", function(data) {
					serialOut(data);
				});

				openPortCache[portInfo.comName] = serialPort;
				deferred.resolve(portInfo);

			}
		});

	} catch (err) {
		logger.info(err);
		deferred.reject({
			message: err.stack
		});

	}

	return deferred.promise;

};


var writeToPort = function(portInfo, dataToWrite) {

	var deferred = Q.defer();

	var comName = portInfo.comName;
	var serialPort = openPortCache[comName];
	if (serialPort) {
		serialPort.write(dataToWrite, function(err) {
			if (err) {
				var msg = "Serial Write Failed: " + err.toString();
				logger.info(msg);
				deferred.reject({
					message: msg
				});
			} else {
				deferred.resolve(portInfo);
			}
		});

	} else {
		var msg = "Trying to write to a closed port: " + comName;
		logger.info(msg);
		deferred.reject({
			message: msg
		});
	}

	return deferred.promise;
};

var closePort = function(portInfo) {

	var deferred = Q.defer();

	var comName = portInfo.comName;
	var serialPort = openPortCache[comName];
	if (serialPort) {
		try {
			serialPort.close();
			openPortCache[portInfo.comName] = null;
			deferred.resolve(portInfo);
		} catch (err) {
			var msg = "Could not close serial port: " + err.toString();
			logger.info(msg);
			deferred.reject({
				message: msg
			});
		}
	} else {
		var msg = "Trying to close an already closed port: " + comName;
		logger.info(msg);
		deferred.reject({
			message: msg
		});
	}

	return deferred.promise;
};


module.exports = {

	name: "Serial",

	create: function(onClose) {

		return createModule(this.name, onClose)
			.then(function(serial) {

				serial.commands.list = listPorts;

				var serialOut = function(data) {
					serial.triggerEvent("serialout", {
						buffer: data
					});
				};

				var serialClose = function(portInfo) {
					serial.triggerEvent("serialClose", {
						port: portInfo
					});
				};

				serial.commands.open = function(portInfo) {
					return openPort(portInfo, serialOut, serialClose);
				};

				serial.commands.write = writeToPort;

				serial.commands.close = closePort;

				serial.onclose = function() {
					for(var comName in openPortCache) {
						openPortCache[comName].close();
					}
				};

				return {
					port: serial.getPort()
				};

			}

		);

	}

};