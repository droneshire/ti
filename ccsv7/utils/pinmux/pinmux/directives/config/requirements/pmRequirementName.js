define(["require", "exports"], function (require, exports) {
    "use strict";
    var directive = {
        restrict: "E",
        templateUrl: "views/config/requirements/requirement_name.html",
        scope: {
            displayCurrentValidationErrorWarning: "=",
            inputId: "="
        },
        controller: "requirementName"
    };
    return directive;
});
//# sourceMappingURL=pmRequirementName.js.map