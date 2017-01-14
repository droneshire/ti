/*jslint node: true */
"use strict";

var path = require("path");
var format = require("util").format;

var util = require("../../util/util");

var userMessages = (function() {


	var beginInstallationMsg = "Additional files need to be installed to support selected configuration. Starting Install Process.\n";
	var downloadErrorMsg = "Download and install of %s failed: %s\n";
	var endInstallationMsg = "Installation completed successfully.\n";
	var installingWinDriverMsg = "Installing Windows driver (please accept the UAC dialog): %s.\n";
	
	var proxyFilePath = path.resolve(path.join(__dirname, "..", "..", "util", "proxy.js"));
	var errorRemoteServerMsg = "An error occurred while retrieving information from the remote server. The most likely cause of this is incorrect proxy settings.\n";
	if (util.isLinux) {
		errorRemoteServerMsg += "Please ensure that the http_proxy env variable is set correctly or\n";
	}
	errorRemoteServerMsg += "To manually override the proxy settings see : " + proxyFilePath + "\n";
	errorRemoteServerMsg += "The Cloud IDE page needs to be refreshed for the changes to take effect\n";

	var unknownErrorMsg = "An unknown error occurred : %s.\n";
	var waitingForPackageMsg = "Installation still in progress for package: %s.\n";
	var installationFailedMsg = "Installation failed : %s.\n";

	return {
		beginInstallation: function() {
			return format(beginInstallationMsg);
		},

		downloadError: function(target, err) {
			return format(downloadErrorMsg, target, err);
		},

		endInstallation: function() {
			return format(endInstallationMsg);
		},

		installingWinDriver: function(component) {
			return format(installingWinDriverMsg, component);
		},

		remoteServerError: function() {
			return format(errorRemoteServerMsg);
		},

		unknownError: function(err) {
			return format(unknownErrorMsg, err);
		},

		waitingForPackage: function(component) {
			return format(waitingForPackageMsg, component);
		},

		installationFailed: function(err) {
			return format(installationFailedMsg, err);
		}

	};
}());

module.exports = userMessages;