/*jslint node: true */
"use strict";

var Q = require("q");

var createModule = require("../module").createModule;
var fileStorage = require("../file_storage");


/**
 *   Decode and write base64Data to file
 *   Data is a "TEMP" directory
 *   @fileName - Name of the file where the data should be stored
 *   @parentDir - Name of the directory under the "TEMP" where the file should be stored
 *   @base64Data - Data to be decoded and stored
 *
 */
var writeFile = function(fileName, base64Data) {

    var deferred = Q.defer();

    try {
        var destFilePath = fileStorage.write(fileName, base64Data);
        deferred.resolve({
            path: destFilePath
        });
    } catch (e) {
        deferred.reject(e);
    }

    return deferred.promise;
};

module.exports = {

    name: "File",

    create: function(onClose) {
        return createModule(this.name, onClose).then(

            function(file) {

                file.commands.write = writeFile;

                return {
                    port: file.getPort()
                };
            }


        );
    }

};