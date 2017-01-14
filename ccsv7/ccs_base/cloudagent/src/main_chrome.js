/*jslint node: true */
"use strict";

// All paths are calculated relative to root directory of local.js
process.chdir(__dirname);

var logger = require("./logger");
var agent = require("./host_agent");


logger.info("Staring directory : " + process.cwd());

agent.start().then(

	function(initParams) {
		var message = initParams;
		var len = new Buffer(4);
		var buf = new Buffer(JSON.stringify(message));

		len.writeUInt32LE(buf.length, 0);
		logger.info("len=");
		logger.info(len);
		logger.info("buf=");
		logger.info(buf);
		process.stdout.write(len.toString());
		process.stdout.write(buf.toString());
	}

);