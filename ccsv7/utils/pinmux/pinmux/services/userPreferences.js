define(["require", "exports", "$rootScope", "settings"], function (require, exports, $rootScope, srvSettings) {
    "use strict";
    var prefs = {};
    function addDropDownPref(name, description, options, defaultOptionIndex) {
        var pref = {
            type: "dropDown",
            name: name,
            options: options,
            description: description,
            selectedOption: options[defaultOptionIndex],
            save: function () {
                srvSettings.setUserPreference(name, pref.selectedOption.id);
            },
            notify: function () {
                $rootScope.$emit(name, pref);
            },
            getValue: function () {
                return pref.selectedOption.value;
            }
        };
        prefs[name] = pref;
    }
    function addPinSelectionDisplayName() {
        var optionName = "devicePinDisplayName";
        var description = "In pin selection drop down show";
        var options = [{
                id: 0,
                optionText: "pin numbers",
                value: ["ball"]
            }, {
                id: 1,
                optionText: "pin names",
                value: ["designSignalName"]
            }, {
                id: 2,
                optionText: "both",
                value: ["ball", "designSignalName"]
            }];
        var value = srvSettings.getUserPreference(optionName);
        var defaultOptionIndex = value ? value : 0;
        addDropDownPref(optionName, description, options, defaultOptionIndex);
    }
    ;
    function init() {
        addPinSelectionDisplayName();
        $rootScope.$emit("srvUserPrefsInitComplete");
    }
    exports.init = init;
    function get(prefName) {
        return prefs[prefName];
    }
    exports.get = get;
});
//# sourceMappingURL=userPreferences.js.map