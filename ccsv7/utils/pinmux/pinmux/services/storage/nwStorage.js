define(["require", "exports", "fsutil", "$q"], function (require, exports, fsutil, q) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var appDir = fsutil.getAppDir("TI_pinmux");
    var settingsFilePath = path.join(appDir, "pinmux.json");
    var corruptedSettingsFilePrefix = path.join(appDir, "pinmux.json.corrupted");
    function saveFile(filePath, data) {
        var deferred = q.defer();
        fs.writeFile(filePath, data, function (err) {
            var response = {
                path: filePath
            };
            if (err) {
                response.message = err.toString();
                deferred.reject(response);
            }
            else {
                deferred.resolve(response);
            }
        });
        return deferred.promise;
    }
    function openFile(filePath) {
        var deferred = q.defer();
        fs.readFile(filePath, "utf-8", function (err, data) {
            var response = {
                path: filePath,
                data: data
            };
            if (err) {
                response.message = err.toString();
                deferred.reject(response);
            }
            else {
                deferred.resolve(response);
            }
        });
        return deferred.promise;
    }
    function loadSettings() {
        return openFile(settingsFilePath).catch(function () {
            return {
                data: ""
            };
        });
    }
    function saveSettings(settingJSON) {
        return saveFile(settingsFilePath, settingJSON);
    }
    function backUpCorruptedSettings(fileData) {
        var index = 0;
        var path;
        do {
            index++;
            path = corruptedSettingsFilePrefix + index;
        } while (fs.existsSync(path));
        fs.writeFileSync(path, fileData);
    }
    var obj = {
        saveFile: saveFile,
        openFile: openFile,
        loadSettings: loadSettings,
        saveSettings: saveSettings,
        backUpCorruptedSettings: backUpCorruptedSettings
    };
    return obj;
});
//# sourceMappingURL=nwStorage.js.map