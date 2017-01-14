define(["require", "exports", "$http", "storage/storage", "$injector"], function (require, exports, http, srvStorage, injector) {
    "use strict";
    var settings = {
        recentProjects: [],
        lastSavedDesignFile: null,
        lastGenerateDir: null,
        userPreferences: null
    };
    function saveSettings() {
        var settingsJSON = JSON.stringify(settings);
        return srvStorage.saveSettings(settingsJSON);
    }
    ;
    var MAX_RECENT = 10;
    function addRecent(filePath) {
        var tempRecentProjects = [];
        tempRecentProjects.push(filePath);
        for (var i = 1; i < MAX_RECENT; i++) {
            if (settings.recentProjects[i - 1]) {
                if (filePath !== settings.recentProjects[i - 1]) {
                    tempRecentProjects.push(settings.recentProjects[i - 1]);
                }
            }
            else {
                break;
            }
        }
        settings.recentProjects = tempRecentProjects;
        return saveSettings();
    }
    exports.addRecent = addRecent;
    function setLastSavedProjectFile(value) {
        settings.lastSavedDesignFile = value;
    }
    exports.setLastSavedProjectFile = setLastSavedProjectFile;
    function getLastSavedProjectFile() {
        return settings.lastSavedDesignFile;
    }
    exports.getLastSavedProjectFile = getLastSavedProjectFile;
    function setLastGenerateDir(value) {
        settings.lastGenerateDir = value;
        return saveSettings();
    }
    exports.setLastGenerateDir = setLastGenerateDir;
    function getLastGenerateDir() {
        return settings.lastGenerateDir;
    }
    exports.getLastGenerateDir = getLastGenerateDir;
    var initPromise = null;
    function init() {
        if (!initPromise) {
            initPromise = srvStorage.loadSettings().then(function (response) {
                if (!response.message && response.data && response.data !== "") {
                    try {
                        settings = JSON.parse(response.data);
                    }
                    catch (e) {
                        srvStorage.backUpCorruptedSettings(response.data);
                    }
                }
                if (!settings.userPreferences) {
                    settings.userPreferences = {};
                }
                if (!settings.recentProjects) {
                    settings.recentProjects = [];
                }
                injector.get("userPreferences").init();
                return http.get("version.txt").then(function (response) {
                    exports.version = response.data.replace(/(\r\n|\n|\r)/gm, "");
                });
            });
        }
        return initPromise;
    }
    exports.init = init;
    function setUserPreference(name, value) {
        settings.userPreferences[name] = value;
        return saveSettings();
    }
    exports.setUserPreference = setUserPreference;
    function getUserPreference(name) {
        return settings.userPreferences[name];
    }
    exports.getUserPreference = getUserPreference;
    function getRecentProjects() {
        return settings.recentProjects;
    }
    exports.getRecentProjects = getRecentProjects;
});
//# sourceMappingURL=settings.js.map