define(["require", "exports", "$scope", "services/config", "services/toolTip", "services/pinmuxRootScope", "toastr", "services/extendScope"], function (require, exports, $scope, srvConfig, srvToolTip, $rootScope, toastr, extendScope) {
    "use strict";
    var requirementConfigGPIOScope = extendScope($scope, {
        srvConfigVM: srvConfig.vm,
        srvToolTip: srvToolTip,
        numOfGPIOPinsApplyError: "",
        numberOfGPIOOptions: [],
        numOfGPIOPinsApply: numOfGPIOPinsApply,
    });
    function getSelectedRequirement() {
        return requirementConfigGPIOScope.srvConfigVM.selectedRequirement;
    }
    function numOfGPIOPinsApply() {
        try {
            requirementConfigGPIOScope.numOfGPIOPinsApplyError = "";
            getSelectedRequirement().numOfGPIOPinsApply();
            $rootScope.onSolve();
        }
        catch (error) {
            toastr.error(error.message);
        }
    }
    ;
    srvConfig.init().then(function () {
        var standardGPIOIface = srvConfig.standardGPIOIface;
        requirementConfigGPIOScope.numberOfGPIOOptions = _.range(1, standardGPIOIface.maxAllowed + 1);
    });
    requirementConfigGPIOScope.$watch("srvConfigVM.selectedRequirement.requirement.name", function (newValue, oldValue) {
        if (!angular.equals(newValue, oldValue)) {
            _.each(getSelectedRequirement().peripheralRequirements, function (uiChildPerphReq) {
                uiChildPerphReq.requirement.parentReqName = newValue;
            });
            $rootScope.onSolve();
        }
    });
});
//# sourceMappingURL=requirementConfigGPIO.js.map