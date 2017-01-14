/*jslint node: true */
"use strict";

var VERSION = "4.1";

var Q = require("q");
var fs = require("fs");
var path = require("path");

var logger = require("./logger");
var createModule = require("./module").createModule;
var config = require("./config");

var newPromise = Q;

function start() {

	logger.info("Starting Agent!");

	return createModule("Agent")
		.then(function onModuleCreated(agent) {

			// load submodules from default location
			var moduleJSFiles = fs.readdirSync(path.join(__dirname, "modules"));
			for (var i = 0; i < moduleJSFiles.length; i++) {
				// define submodules
				try {
					var subModuleDef = require("./modules/" + moduleJSFiles[i]);
					logger.info("Discovered Module : " + subModuleDef.name);
					agent.subModules[subModuleDef.name] = subModuleDef;
				} catch (err) {
					logger.info("Failed to load module : " + moduleJSFiles[i] + " : " + err.stack);
				}
			}


			agent.commands.addConfigProperty = function addConfigProperty(name, value) {

				config[name] = value;
				logger.info("Setting property " + name + " : " + value);

				return newPromise();
			};

			agent.commands.registerModule = function registerModule(moduleName, modulePort) {
				agent.subModules[moduleName] = {
					name: moduleName,
					create: function() {
						return newPromise({
							"port": modulePort
						});
					}
				};
				return newPromise();
			};

			return agent.getPort();
		})
		.then(function onPortFetched(port) {
			logger.info("Agent main module running on port " + port);
			return {
				port: port,
				version: VERSION
			};
		});
}

module.exports.start = start;