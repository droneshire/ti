/*jslint node: true */
"use strict";

var sockets = require("./sockets");
var logger = require("./logger");

var Q = require("q");
var newPromise = Q;

function createModule(name, onClose) {

	var port = null;
	var wss = null;
	var createdSubModules = {};

	function log(msg) {
		logger.info("Module( " + name + " )->" + msg.substring(0, 1024));
	}

	function createResponseHandler(type, msgData, ws) {
		return function(data) {

			var obj = {
				data: data
			};

			obj[type] = msgData.id;
			var toSend = JSON.stringify(obj);
			log(toSend);
			try {
				ws.send(toSend);
			} catch (e) {
				log("Failed to send: " + e);
			}
		};
	}

	var moduleObj = {

		commands: { // basic commands available for each submodule

			listSubModules: function listSubModules() {

				var subModules = this.subModules;
				var subModuleNames = [];
				for (var subModule in subModules) {
					if (subModules.hasOwnProperty(subModule)) {
						subModuleNames.push(subModule);
					}
				}

				var retObj = {
					subModules: subModuleNames
				};

				return newPromise(retObj);
			},

			createSubModule: function createSubModule(subModuleName) {

				// Check if we already have created this module

				if (createdSubModules[subModuleName]) {
					log("Returning cached value");
					return createdSubModules[subModuleName];
				}

				// This sub module has not been created yet

				log("Creating new module");
				var subModuleDefinition = this.subModules[subModuleName];
				createdSubModules[subModuleName] = subModuleDefinition.create(cleanupSubModule, createSubSubModule);
				return createdSubModules[subModuleName];

				function cleanupSubModule() {
					delete createdSubModules[subModuleName];
				}

				function createSubSubModule(subModuleName) {
					return createSubModule.call(moduleObj, subModuleName);
				}
			},

			listCommands: function listCommands() {

				var commands = this.commands;

				var commandNames = [];
				for (var command in commands) {
					if (commands.hasOwnProperty(command)) {
						commandNames.push(command);
					}
				}

				var retObj = {
					commands: commandNames
				};

				return newPromise(retObj);
			}
		},

		subModules: {},

		triggerEvent: function triggerEvent(eventName, eventData) {

			var obj = {
				event: eventName,
				data: eventData
			};

			var toSend = JSON.stringify(obj);
			log(toSend);
			wss.clients.forEach(function each(client) {
				client.send(toSend);
			});
		},

		getPort: function getPort() {
			return port;
		}
	};

	// init sets up the web socket communication and sets up support for RPC calls 
	// init must be resolved before any other function 

	return sockets.createWSServer()
		.then(function setUpServer(_wss) {

			wss = _wss;

			log("Web socket server started!");

			// handle opening a websocket connection
			wss.on("connection", function(ws) {

				ws.on("message", function onMessage(message) {

					log(message);
					var msgData = JSON.parse(message);
					var command = moduleObj.commands[msgData.command];
					var errorHandler = createResponseHandler("error", msgData, ws);

					if (command) {
						var responseHandler = createResponseHandler("response", msgData, ws);

						try {
							command.apply(moduleObj, msgData.data).done(responseHandler, errorHandler);
						} catch (err) {
							errorHandler({
								message: err.stack
							});
						}

					} else {
						var msg = "Command not defined : " + command;
						errorHandler({
							message: msg
						});
					}
				});

				ws.on("close", function onSocketClose() {

					log("Socket closed");

					if (wss.clients.length === 0) {
						if (moduleObj.onclose) {
							moduleObj.onclose();
						}

						if (onClose) {
							onClose();
						}
						wss._server.close();
					}
				});

			});

			wss.on("close", function onServerClose() {
				log("Web socket server closed. Exiting Module");
			});

			// set the port
			port = wss._server.address().port;

			return moduleObj;
		});
}

module.exports.createModule = createModule;