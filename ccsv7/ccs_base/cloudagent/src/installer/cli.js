/*jslint node: true */
"use strict";

var Q = require("q");
var util = require("../../util/util");

// a host id is passed as a part of the installer name when doing a command line install
// that Id could than be used to look up an actual host
var knownHosts = {
	host1: "ccs.ti.com",
	host2: "dev.ti.com",
	host3: "tgdccscloud.toro.design.ti.com"
};

function createOptions(cmdArgs) {

	// what is the expected type of paramaters; other wise assume string 
	var optionTypes = {
		offline: "Boolean",
		quiet: "Boolean"
	};
	var processedOptions = {};

	var lastOption = null;
	for (var i = 0; i < cmdArgs.length; i++) {

		var value = cmdArgs[i];

		if (value.indexOf("--") === 0) {
			lastOption = value.replace("--", "");
		} else {
			if (lastOption !== null) {
				if (optionTypes[lastOption] === "Boolean") {
					processedOptions[lastOption] = Boolean(value);
				} else {
					processedOptions[lastOption] = value;
				}
			}
			lastOption = null; // go on to the next option
		}
	}

	// do some special processing to extract the host and target from the installer exec name
	if (processedOptions.installer && util.isWin) {

		var parts = processedOptions.installer.split("__");
		// get rid of the installer option
		delete processedOptions.installer;
		// only do something if the name is in the valid format.
		// otherwise we can just ignore doing the install because it is not coming from a production server	
		if (parts.length === 3) {

			processedOptions.host = knownHosts["host" + parts[1]];

			if (!processedOptions.host) { // it is not a known host, than assume it is the actual host name
				processedOptions.host = parts[1];
			}

			processedOptions.host = "http://" + processedOptions.host;

			processedOptions.winDrivers = parts[2].replace(".exe", "");
		}
	}

	return processedOptions;

}


var options = createOptions(process.argv);

try {
	var installer = require("./installer")(options.host + "/ticloudagent", options);
} catch (err) {
	console.log(err.toString());
	process.exit(1);
}


// have to do some manually clean up 
// the logger keeps the event loop up,
// so the errors don't propagate to the env
// we have to manually  process.exit
function exitProcess(errCode) {

	// HACK: can't flush std, the correct approach is to not have
	// to process exit, but let node automatically exit when the event
	// loop becomes empty, but because of the logger issue we can't do that

	return Q.delay(5000)
		.then(function() {
			process.exit(errCode);
		});
}

function fail(e) {
	console.log(e);
	exitProcess(1);
}

function finished() {
	console.log("Finished");
	exitProcess(0);
}

function progress(msgObj) {
	console.log(msgObj.message);
}

if (options.clean) {

	console.log("Purging Target Support DB");
	installer.purge()
		.progress(progress)
		.then(finished)
		.fail(fail)
		.done();

} else if (options.winDrivers) {

	console.log("Installing windows drivers for " + options.winDrivers);
	installer.installWinDrivers(options.winDrivers)
		.progress(progress)
		.then(finished)
		.fail(fail)
		.done();

} else if (options.target) {

	console.log("Installing support for " + options.target);
	installer.addSupport(options.target)
		.progress(progress)
		.then(finished)
		.fail(fail)
		.done();

} else if (options.generateDesktopInstall) {

	var categoriesDesc = options.categories ? "the categories " + options.categories.join(",") : "all categories";
	var versionDesc = options.version || "LATEST";
	console.log("Generating desktop install with " + categoriesDesc + " for version " + versionDesc);
	if (options.os) {
		console.log("Overriding OS to be " + options.os);
	}
	installer.generateDesktopInstall(options.categories, options.version, options.os)
		.progress(progress)
		.then(finished)
		.fail(fail)
		.done();

} else {
	console.error("no valid command line parameter passed");
	fail();
}