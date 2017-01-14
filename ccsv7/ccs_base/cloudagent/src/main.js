/*jslint node: true */
"use strict";

// All paths are calculated relative to root directory of local.js
process.chdir(__dirname);

var logger = require("./logger");
var agent = require("./host_agent");

logger.info("Staring directory : " + process.cwd());

agent.start().then(

	function(initParams) {
		console.log(JSON.stringify(initParams));
	},

	function(err) {
		console.log("Failed to start agent : " + err);
	}

);