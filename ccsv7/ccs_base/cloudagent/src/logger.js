/*jslint node: true */
"use strict";

var path = require("path");

var LOG_DISABLE = false;

if (LOG_DISABLE) {
	module.exports = {
		info: function(msg) {
			console.log(msg);
		}
	};
} else {
	// wrap the logger
	var logger = require("ti-logger")(path.join(__dirname, "log-config.json"));
	module.exports = logger;
}