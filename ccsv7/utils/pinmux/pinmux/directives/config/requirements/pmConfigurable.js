define(["require", "exports"], function (require, exports) {
    "use strict";
    var directive = {
        restrict: "E",
        templateUrl: "views/config/requirements/configurable.html",
        scope: {
            uiConfigurable: "=",
            onInvalid: "=",
            onValid: "=",
            displayCurrentErrorWarning: "="
        },
        controllerAs: 'vm',
        bindToController: true,
        controller: "configurable"
    };
    return directive;
});
//# sourceMappingURL=pmConfigurable.js.map