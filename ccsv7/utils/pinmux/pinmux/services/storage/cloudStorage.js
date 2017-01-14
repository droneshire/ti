define(["require", "exports", "$http"], function (require, exports, http) {
    "use strict";
    var defaultWorkspace = "/workspaceserver/pinmux/default";
    function saveFile(myFilename, myFiledata) {
        var formattedName = encodeURIComponent(myFilename);
        var toRet = {
            path: myFilename,
        };
        return http({
            url: defaultWorkspace + "/" + formattedName,
            method: 'PUT',
            data: myFiledata,
            headers: {
                "Content-Type": "application/text"
            }
        })
            .then(function () {
            return toRet;
        }).catch(function (response) {
            toRet.message = response.data;
            return toRet;
        });
    }
    function openFile(myFilename) {
        var formattedName = encodeURIComponent(myFilename);
        var toRet = {
            path: myFilename,
            data: null
        };
        return http.get(defaultWorkspace + "/" + formattedName)
            .then(function (response) {
            toRet.data = response.data;
            return toRet;
        }, function (response) {
            toRet.message = response.data;
            return toRet;
        });
    }
    var settingsFile = "pinmux.json";
    function loadSettings() {
        return openFile(settingsFile);
    }
    function saveSettings(settingJSON) {
        return saveFile(settingsFile, settingJSON);
    }
    function getFileList(filter) {
        var formattedFilter = encodeURIComponent(filter);
        return http.get(defaultWorkspace + "?command=list&filter=" + formattedFilter);
    }
    function deleteFile(myFilename) {
        var formattedName = encodeURIComponent(myFilename);
        return http.delete(defaultWorkspace + "/" + formattedName);
    }
    var obj = {
        saveFile: saveFile,
        openFile: openFile,
        loadSettings: loadSettings,
        saveSettings: saveSettings,
        getFileList: getFileList,
        deleteFile: deleteFile
    };
    return obj;
});
//# sourceMappingURL=cloudStorage.js.map