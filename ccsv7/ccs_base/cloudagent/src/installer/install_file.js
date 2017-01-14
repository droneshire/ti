/*jslint node: true */
"use strict";

// Factory for a write stream based on the file type

var fs = require("fs");
var stream = require("stream");
var util = require("../../util/util");

module.exports = {
	createWriteStream: createWriteStream
};

// Creates the base stream object

function createWriteStream(filePath, permissions) {
	if (!isLink(permissions)) {
		return createFileStream(filePath, permissions);
	} else {
		return createLinkStream(filePath);
	}
}

// True if the file is to be a symlink

function isLink(permissions) {
	// 120### is the magic unix-permissions number for a symlink

	return /120[0-7]{3}/.test(permissions);
}

// Create a regular file stream, but in the linux/mac case, chmod it

function createFileStream(filePath, permissions) {
	var fileStream = fs.createWriteStream(filePath)
		.on("finish", function() {
			if (!util.isWin && permissions) {
				try {
					fs.chmodSync(filePath, parseInt(permissions, 8));
				} catch (e) {
					fileStream.emit("error", e);
				}
			}
		});
	return fileStream;
}

function createLinkStream(filePath) {
	// Create a custom stream to fill up a buffer and use that data as the 
	// destination a symlink will point to

	var linkStream = new stream.Writable();
	var fileLinkedTo = "";
	linkStream._write = function(chunk, encoding, done) {
		fileLinkedTo += chunk;
		done();
	};
	linkStream.on("finish", function() {
		try {

			// Try to delete the file if in case it's alredy there

			try {
				fs.unlinkSync(filePath);
			} catch (e) {}

			// Now create the symlink

			fs.symlinkSync(fileLinkedTo, filePath);
		} catch (e) {
			linkStream.emit("error", e);
		}
	});
	return linkStream;
}