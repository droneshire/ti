/*jslint node: true */
"use strict";

// Code to pipe streams together and return a promise that is resolved when the
// piping is complete.  Any error at any point results in the promise being 
// rejected

var Q = require("q");

module.exports = function() {

	var deferred = Q.defer();
				
	// Convert to real array

	var streams = Array.prototype.slice.call(arguments);

	// Handle errors on each, then pipe to the next.
	
	streams
		.reduce( function(current, next) {
			return current
				.on("error", function(err) {
					deferred.reject(err);
				})
				.pipe(next);
		})

		// At the end, handle the last error + the "finish" to resolve the 
		// promise.

		.on("error", function(err) {
			deferred.reject(err);
		})
		.on("finish", function() {
			deferred.resolve();
		});

	return deferred.promise;
};