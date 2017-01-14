/*jslint node: true */
"use strict";

var fs = require("fs");
var path = require("path");

var isWin = /^win/.test(process.platform);
var isLinux = /^linux/.test(process.platform);
var isOSX = /^darwin/.test(process.platform);

var OS = "win";
if (isLinux) {
	OS = "linux";
} else if (isOSX) {
	OS = "osx";
}

module.exports = {
	installerOS: OS,
	deleteFolderRecursive: deleteFolderRecursive,
	mkdirRecursive: mkdirRecursive,
	isWin: isWin,
	isLinux: isLinux,
	isOSX: isOSX,
	osBitSize: process.env.OS_BIT_SIZE,
};

// delete non empty folders. Otherwise; node throws NONEMPTY error as per posix standard
function deleteFolderRecursive(path) {
	var files = [];
	if (fs.existsSync(path)) {
		files = fs.readdirSync(path);
		files.forEach(function(file) {
			var curPath = path + "/" + file;
			if (fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
}

// Create a folder, recursively creating subfolders as needed

function mkdirRecursive(dirPath) {

	try {
		fs.statSync(dirPath);
	} catch (e) {
		var dirs = dirPath.split(path.sep);
		var dir = dirs.shift();
		if ("win" !== OS) {
			dir = path.sep + dir;
		}
		do {
			dir = path.join(dir, dirs.shift());
			try {
				fs.mkdirSync(dir);
			} catch (e) {
				//dir wasn't made, something went wrong
				if (!fs.statSync(dir).isDirectory()) {
					throw new Error(e);
				}
			}
		}
		while (dirs.length);
	}
}