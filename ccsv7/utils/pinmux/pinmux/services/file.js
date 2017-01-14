define(["require", "exports", "storage/storage"], function (require, exports, srvStorage) {
    "use strict";
    function saveFile(filePath, data, callback) {
        srvStorage.saveFile(filePath, data)
            .then(function (ret) {
            callback(ret);
        }, function (ret) {
            callback(ret, ret);
        });
    }
    function loadFile(filePath, callback) {
        srvStorage.openFile(filePath)
            .then(function (ret) {
            callback(ret.data, ret);
        }, function (ret) {
            callback(ret.data, ret, ret);
        });
    }
    var currentHandlers = {};
    function showChooser(chooser, type, newHandler) {
        chooser.value = null;
        var oldHandler = currentHandlers[type];
        if (oldHandler) {
            chooser.removeEventListener("change", oldHandler, false);
        }
        currentHandlers[type] = newHandler;
        chooser.addEventListener("change", newHandler, false);
        chooser.click();
    }
    exports.browseAndSave = function (data, callback) {
        var chooser = document.querySelector("#fileSaveDialog");
        var CallbackThisHelper = (function () {
            function CallbackThisHelper() {
            }
            CallbackThisHelper.prototype.theCallback = function () {
                var filePath = this.value;
                saveFile(filePath, data, callback);
            };
            return CallbackThisHelper;
        }());
        showChooser(chooser, "browseAndSave", new CallbackThisHelper().theCallback);
    };
    function save(data, fileInfo, callback) {
        saveFile(fileInfo.path, data, callback);
    }
    exports.save = save;
    function load(fileInfo, callback) {
        loadFile(fileInfo.path, callback);
    }
    exports.load = load;
    exports.browseAndLoad = function (callback) {
        var chooser = document.querySelector("#fileLoadDialog");
        var CallbackThisHelper = (function () {
            function CallbackThisHelper() {
            }
            CallbackThisHelper.prototype.theCallback = function () {
                var filePath = this.value;
                loadFile(filePath, callback);
            };
            return CallbackThisHelper;
        }());
        showChooser(chooser, "browseAndLoad", new CallbackThisHelper().theCallback);
    };
    exports.browseFolder = function (callback) {
        var chooser = document.querySelector("#chooseDirDialog");
        var CallbackThisHelper = (function () {
            function CallbackThisHelper() {
            }
            CallbackThisHelper.prototype.theCallback = function () {
                var filePath = this.value;
                callback({
                    path: filePath
                }, null);
            };
            return CallbackThisHelper;
        }());
        showChooser(chooser, "browse", new CallbackThisHelper().theCallback);
    };
    if (isNode() && process.env.PINMUX_TEST_ENABLED) {
        var path_1 = require("path");
        var saveLoadTestFilePath_1 = path_1.join(path_1.dirname(process.execPath), "saveloadIPC");
        var readSaveLoadTestFile_1 = function () {
            var fs = require("fs");
            return fs.readFileSync(saveLoadTestFilePath_1, "utf-8");
        };
        exports.browseAndSave = function (data, callback) {
            var filePath = readSaveLoadTestFile_1();
            saveFile(filePath, data, callback);
        };
        exports.browseAndLoad = function (callback) {
            var filePath = readSaveLoadTestFile_1();
            loadFile(filePath, callback);
        };
        exports.browseFolder = function (callback) {
            var filePath = readSaveLoadTestFile_1();
            callback({
                path: filePath
            }, null);
        };
    }
});
//# sourceMappingURL=file.js.map