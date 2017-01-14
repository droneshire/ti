define(["require", "exports", "$scope", "services/config", "services/layout", "services/style", "services/toolTip", "$rootScope", "services/extendScope"], function (require, exports, $scope, srvConfig, srvLayout, srvStyle, srvToolTip, $rootScope, extendScope) {
    "use strict";
    var myRequirementsScope = extendScope($scope, {
        srvStyle: srvStyle,
        srvLayout: srvLayout,
        srvToolTip: srvToolTip,
        srvConfigVM: srvConfig.vm,
        interfaceClicked: interfaceClicked,
        addClicked: addClicked,
        removeAllRequirements: removeAllRequirements,
        removeRequirement: removeRequirement,
        requirementClicked: requirementClicked,
        numRemovable: numRemovable,
        interfaces: null
    });
    srvConfig.init().then(function () {
        myRequirementsScope.interfaces = srvConfig.getInterfaces();
        initStandardGPIOErrors();
    });
    function interfaceClicked(iface) {
        srvConfig.setSelected(iface);
    }
    ;
    function addClicked(iface) {
        srvConfig.addRequirement(iface);
    }
    ;
    function getRemovable() {
        if (!myRequirementsScope.srvConfigVM.selectedInterface)
            return [];
        var toRemove = _.filter(myRequirementsScope.srvConfigVM.selectedInterface.peripheralRequirements, function (req) {
            return req.isRemovable();
        });
        return toRemove;
    }
    function removeAllRequirements() {
        var toRemove = getRemovable();
        _.each(toRemove, function (req) {
            myRequirementsScope.removeRequirement(req);
        });
    }
    ;
    function removeRequirement(requirement) {
        srvConfig.removeRequirement(myRequirementsScope.srvConfigVM.selectedInterface, requirement);
    }
    ;
    function requirementClicked(requirement) {
        srvConfig.setSelected(myRequirementsScope.srvConfigVM.selectedInterface, requirement);
    }
    ;
    function initStandardGPIOErrors() {
        var standardGPIOIface = srvConfig.standardGPIOIface;
        if (standardGPIOIface) {
            _(standardGPIOIface.peripheralRequirements).forEach(function (uiStandardGPIOPeripheralReq) {
                var error = false;
                var warning = false;
                _(uiStandardGPIOPeripheralReq.peripheralRequirements).forEach(function (peripheralRequirement) {
                    error = error || peripheralRequirement.requirement.solution.errorText !== "";
                    warning = warning || peripheralRequirement.requirement.solution.warningText !== "";
                });
                uiStandardGPIOPeripheralReq.requirement.solution.errorText = error ? "Error" : "";
                uiStandardGPIOPeripheralReq.requirement.solution.warningText = warning ? "Warning" : "";
            });
        }
    }
    ;
    function numRemovable() {
        return getRemovable().length;
    }
    ;
    var unreg = $rootScope.$on("onSolveComplete", function () {
        initStandardGPIOErrors();
    });
    myRequirementsScope.$on("$destroy", function () { return unreg(); });
});
//# sourceMappingURL=myRequirements.js.map