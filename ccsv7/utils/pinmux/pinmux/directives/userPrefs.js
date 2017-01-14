define(["require", "exports"], function (require, exports) {
    "use strict";
    var directive = {
        restrict: "E",
        scope: true,
        transclude: false,
        bindToController: true,
        templateUrl: "views/user_preferences.html",
        controllerAs: "prefs",
        controller: "userPrefs"
    };
    return directive;
});
//# sourceMappingURL=userPrefs.js.map