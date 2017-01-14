define(["require", "exports", "services/userPreferences", "$rootScope"], function (require, exports, srvUserPrefs, $rootScope) {
    "use strict";
    exports.devicePinDisplayNamePref = srvUserPrefs.get("devicePinDisplayName");
    $rootScope.$on("srvUserPrefsInitComplete", function () {
        exports.devicePinDisplayNamePref = srvUserPrefs.get("devicePinDisplayName");
    });
    function dropDownSelectionChanged(pref) {
        pref.save();
        pref.notify();
    }
    exports.dropDownSelectionChanged = dropDownSelectionChanged;
});
//# sourceMappingURL=userPrefs.js.map