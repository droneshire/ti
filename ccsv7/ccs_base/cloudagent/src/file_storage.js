/*jslint node: true */
"use strict";

// Object for storing downloaded files on the local drive
var fs = require("fs");
var os = require("os");
var path = require("path");

var tempFileDir = path.join(os.tmpdir(), "ti_cloud_storage");

if (!fs.existsSync(tempFileDir))
    fs.mkdirSync(tempFileDir);

var tempFileStorage = {

    write: function(fileName, base64Data) {

        var destFilePath = path.normalize(path.join(tempFileDir, fileName));

        // make sure the path is still inside the temp dir
        var relativeToTemp = path.relative(tempFileDir, destFilePath);
        if (relativeToTemp.indexOf("..") > -1)
            throw "Invalid Path : " + destFilePath;

        var buf = new Buffer(base64Data, "base64"); //  decode base 64 data

        fs.writeFileSync(destFilePath, buf);

        return destFilePath;
    }
};

module.exports = tempFileStorage;