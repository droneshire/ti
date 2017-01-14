/*jslint node: true */
"use strict";

var Q = require("q");
var newPromise = Q;

var createModule = require("../module").createModule;
var createCloudInstaller = require("../installer/installer");
var config = require("../config");

var createEventData = function(eventID, progressData) {
	// change the progress into events to be consistent with ds
	var data = {
		name: "Installing Target Support ( First Time Only )",
		subActivity: progressData.message,
		id: eventID,
		isComplete: progressData.isComplete ? true : false,
		isFirstUpdate: progressData.isFirstUpdate ? true : false,
		percent: undefined !== progressData.percent ? progressData.percent : null
	};

	return data;
};

function createDesktopInstaller() {

	// Return an installer that does nothing

	function nothingToDo() {
		return newPromise();
	}

	return {
		addSupport: nothingToDo,
		purge: nothingToDo
	};
}

function createInstaller() {

	if (config.desktopMode) {
		return createDesktopInstaller();
	} else {
		return createCloudInstaller(config.cloudAgentInstallerServerURL);
	}
}

module.exports = {

	name: "TargetSupport",

	create: function(onClose) {

		// get cloudAgentInstallerServerURL from the config file set by the agent.setProperty call 
		// by the client
		var installer = createInstaller();

		var eventID = 0;

		return createModule(this.name, onClose).then(

			function(targetSupport) {

				targetSupport.commands.add = function(ccxmlFilePath, disableG2Override) {

					eventID++;

					return installer.addSupport(ccxmlFilePath, disableG2Override)
						.progress(function(progressData) {
							targetSupport.triggerEvent("progress", createEventData(eventID, progressData));
						});
				};

				targetSupport.commands.purge = function() {
					return installer.purge();
				};

				return {
					port: targetSupport.getPort()
				};

			}

		);

	}

};