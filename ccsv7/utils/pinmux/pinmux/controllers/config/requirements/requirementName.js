define(["require", "exports", "$scope", "services/pinmuxRootScope", "services/config", "services/toolTip", "services/extendScope"], function (require, exports, $scope, $rootScope, srvConfig, srvToolTip, extendScope) {
    "use strict";
    extendScope($scope, {
        srvToolTip: srvToolTip,
        srvConfigVM: srvConfig.vm,
        onChange: function () { return $rootScope.onSolve(); }
    });
});
//# sourceMappingURL=requirementName.js.map