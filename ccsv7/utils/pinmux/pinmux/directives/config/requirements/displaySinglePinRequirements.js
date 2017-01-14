define(["require", "exports"], function (require, exports) {
    "use strict";
    var directive = {
        restrict: "A",
        templateUrl: "views/config/requirements/pinrequirement.html",
        scope: {
            pinRequirements: "=",
            pinChanged: "=",
            pinUsedChanged: "=",
            srvToolTip: "=",
            reverseSort: "=",
            displayCurrentErrorWarning: "="
        },
        controller: [PinRequirementCtrl]
    };
    function PinRequirementCtrl() {
    }
    return directive;
});
//# sourceMappingURL=displaySinglePinRequirements.js.map