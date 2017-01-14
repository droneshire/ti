/*jslint node: true */
"use strict";

var execFile = require("child_process").execFile;

var util = require("./util");
var logger = require("./../src/logger");
var proxyOverride = require("./proxy").proxy;

logger.info("Overridden Proxy = " + proxyOverride);


var utilDirPath = __dirname;

// default def
var findProxy = function(callback) {
  return callback(proxyOverride);
};

if (util.isWin) {

  findProxy = function(callback, url) {
    logger.info("Looking up proxy settings for url " + url);
    execFile("./lsproxy.exe", [url], {
      cwd: utilDirPath
    }, function(err, data) {
      if (err) {
        logger.info("Proxy look up failed : " + url);
        logger.info(err);
      } else {
        logger.info("Setting proxy to " + data);
      }
      callback(data);
    });
  };

} else if (util.isOSX) {

  var findProxy = function(callback, url) {
    logger.info("Looking up proxy settings for url " + url);
    execFile("./proxyfinder.sh", [url], {
      cwd: utilDirPath
    }, function(err, data) {
      var cleanData = data.trim().replace(/^\s+|\s+$/g, "");
      callback(cleanData);
    });
  };

} else {
  findProxy = function(callback) {
    if (process.env.http_proxy) {
      callback(process.env.http_proxy);
    } else {
      callback(proxyOverride);
    }
  };
}

exports.get = function(callback, url) {

  // clean up url by removing the query string
  url = url.split("?")[0];

  if (proxyOverride !== "") {
    if (proxyOverride === "DIRECT") { // if direct bypass all settings
      logger.info("Proxy is direct");
      callback("");
    } else {
      callback(proxyOverride);
    }
  } else {
    findProxy(callback, url);
  }

};