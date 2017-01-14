/*jslint node: true */
"use strict";


var path = require("path");
var fs = require("fs");
var zlib = require("zlib");
var PassThrough = require("stream").PassThrough;
var Q = require("q");
var request = require("request");

var util = require("../../util/util");
var proxyfinder = require("../../util/find_proxy");
var logger = require("../logger");
var userMessages = require("./user_messages");
var config = require("../config");
var fileInstaller = require("./install_file");
var promisePipe = require("./promise_pipe");


// remote server prototype object
function createRemoteServer(cloudAgentInstallerServerURL) {

	if (!cloudAgentInstallerServerURL)
		throw "cloudAgentInstallerServerURL must be defined!";

	var getProxy = (function() {

		var proxyPromise;
		return getProxyImpl;

		function getProxyImpl() {
			if (undefined === proxyPromise) {
				proxyPromise = Q.defer();
				proxyfinder.get(function(proxy) {

					logger.info("installer.js using proxy: " + proxy);

					// append http if needed
					if (proxy !== "" && proxy.indexOf("http") < 0) {
						proxy = "http://" + proxy;
					}

					proxyPromise.resolve(proxy);
				}, cloudAgentInstallerServerURL);
			}
			return proxyPromise.promise;
		}

	}());

	function requestJSONFromServer(url, body, get) {

		var fetchType = get ? "get" : "post";
		return getProxy()
			.then(function(proxy) {
				var deferred = Q.defer();
				request[fetchType]({
					url: url,
					rejectUnauthorized: false,
					proxy: proxy,
					body: body
				}, function(error, response, resultBody) {

					if (!error && response.statusCode === 200) {
						logger.info(resultBody);
						deferred.resolve(JSON.parse(resultBody));
					} else {
						deferred.reject(userMessages.remoteServerError());
					}
				});

				return deferred.promise;
			});
	}

	var downloadFile = (function() {

		var componentPathAPIUrl = cloudAgentInstallerServerURL + "/getFile/";

		function getComponentPath(file, version, os) {
			os = os || util.installerOS;
			var fileComponents = file.split("/");
			fileComponents.push(encodeURIComponent(fileComponents.pop()));
			return componentPathAPIUrl + os + "/" + fileComponents.join("/") + "/" + version;
		}

		function getDestinationName(file) {
			return path.join(config.loadersRoot, file);
		}

		return function(file, version, os) {

			var url = getComponentPath(file, version, os);

			return getProxy().then(function(proxy) {
				var deferred = Q.defer();
				var destinationName = getDestinationName(file);
				util.mkdirRecursive(path.dirname(destinationName));

				logger.info("Downloading " + file);
				request.get({
						url: url,
						rejectUnauthorized: false,
						proxy: proxy,
						headers: {
							"accept-encoding": "gzip"
						}
					})
					.on("error", function(err) {
						deferred.reject(userMessages.downloadError(file, err));
					})
					.on("response", function(response) {
						if (response.statusCode === 200) {
							var permissions = response.headers["x-ticloudagent-permissions"];

							// Pipe the resonse through an unzipper (if 
							// necessary) and then to the file system

							var transform;
							if(response.headers["content-encoding"] === "gzip") {
								transform = zlib.createGunzip();
							} else {
								transform = new PassThrough();
							}

							promisePipe(
									response,
									transform,
									fileInstaller.createWriteStream(destinationName, permissions))
								.then(function() {
									deferred.resolve();
								})
								.catch(function(err) {
									deferred.reject(userMessages.downloadError(file, err));
								})
								.done();
						} else {
							deferred.reject(userMessages.downloadError(file, "status code: " + response.statusCode));
						}
					});


				return deferred.promise;

			});
		};
	}());

	function osTypeData(os) {
		var path = "os=" + ( os ? os : util.installerOS );
		if (undefined !== util.osBitSize && undefined === os) {
			path += "&bitSize=" + util.osBitSize;
		}
		return path;
	}

	return {

		// get the install info data
		getSupportingFiles: function getSupportingFiles(ccxmlFilePath) {

			var path = cloudAgentInstallerServerURL + "/getSupportingFiles?" + osTypeData();

			logger.info("Getting install info: " + path);
			return requestJSONFromServer(path, fs.readFileSync(ccxmlFilePath).toString());
		},

		// Fetch files by their category and database version
		// If version is undefined, the current stable version is used
		// If categories is undefined, all categories are fetched
		getFilesByCategory: function getFilesByCategory(categories, version, os) {

			var path = cloudAgentInstallerServerURL + "/getFilesByCategory?" + osTypeData(os);
			if (categories) {
				path += "&categories=" + categories.join(",");
			}
			if (version) {
				path += "&version=" + version;
			}

			logger.info("Getting file info by category: " + path);
			return requestJSONFromServer(path, undefined, true);
		},

		// Creates the dinfra_resource.json.gz file for the specified version
		// This file is what is used by the desktop version of dinfra to 
		// simulate resource queries
		generateDesktopDB: function generateDesktopDB(version, os) {

			os = os || util.installerOS;
			var url = cloudAgentInstallerServerURL + "/generateDesktopDB?";
			url += "os=" + os;
			if (version) {
				url += "&version=" + version;
			}

			logger.info("Generating desktop dinfra: " + url);
			var file = "dinfra_resource.json.gz";
			return getProxy()
				.then(function(proxy) {
					var deferred = Q.defer();
					var filePath = path.join(config.loadersRoot, "..", "..", "..", file);

					request.get({
						url: url,
						rejectUnauthorized: false,
						proxy: proxy,
						headers: {
							"accept-encoding": "gzip"
						}
					})
					.on("error", function(err) {
						deferred.reject(err);
					})
					.on("response", function(response) {
						if (response.statusCode === 200) {
							var transform;
							if(response.headers["content-encoding"] !== "gzip") {
								transform = zlib.createGzip();
							} else {
								transform = new PassThrough();
							}

							promisePipe(
									response,
									transform,
									fs.createWriteStream(filePath))
								.then(function() {
									deferred.resolve();
								})
								.catch(function(err) {
									deferred.reject(err);
								})
								.done();
						} else {
							deferred.reject("server responded with status code " + response.statusCode);
						}
					});

					return deferred.promise;
				})							
				.catch(function(err) {
					throw userMessages.downloadError(file, err);
				});
		},

		downloadFiles: function downloadFiles(files, os) {

			var deferred = Q.defer();

			logger.info("Downloading " + files.length + " files");
			var downloads = [];
			var index = 0;

			function downloadNext() {
				if (files.length > index && !deferred.promise.isRejected()) {
					var file = files[index++];
					return downloadFile(file.name, file.version, os)
						.then(function() {
							deferred.notify({
								message: file.name,
								percent: Math.floor(index * 100 / files.length)
							});
							return downloadNext();
						});
				}
			}

			// We only download 10 at a time.  Our server seems to handle 
			// downloading all of them at once, but if we scale up the number
			// of users...?  Plus, it doesn't seem to give much benefit to 
			// download all at once...

			for (var i = 0; i < 10; ++i) {
				downloads.push(downloadNext());
			}
			Q.all(downloads)
				.then(function() {
					deferred.resolve();
				})
				.catch(function(err) {
					deferred.reject(err);
				})
				.done();
			return deferred.promise;
		}
	};
}


module.exports = createRemoteServer;