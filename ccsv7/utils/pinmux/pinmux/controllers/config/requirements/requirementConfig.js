define(["require", "exports", "$scope", "services/config", "services/layout", "services/style", "services/toolTip", "services/pinmuxRootScope", "services/analytics", "services/nav", "services/extendScope"], function (require, exports, $scope, srvConfig, srvLayout, srvStyle, srvToolTip, $rootScope, srvAnalytics, srvNav, extendScope) {
    "use strict";
    var requirementConfigScope = extendScope($scope, {
        srvStyle: srvStyle,
        srvLayout: srvLayout,
        srvToolTip: srvToolTip,
        srvConfigVM: srvConfig.vm,
        useCaseChanged: useCaseChanged,
        showIOSets: false,
        showPreferredVoltage: false,
        powerDomainSettingsEnabled: false,
        showUserPeripheralRow: showUserPeripheralRow,
        viewIOSets: viewIOSets,
        displayCurrentValidationErrorWarning: displayCurrentValidationErrorWarning,
        onVoltageChanged: onVoltageChanged,
        configurePowerDomains: configurePowerDomains,
        peripheralChanged: peripheralChanged,
        onConfigurableInvalid: onConfigurableInvalid,
        onConfigurableValid: onConfigurableValid
    });
    function useCaseChanged() {
        var peripheralReq = getSelectedRequirement();
        peripheralReq.useCaseChanged();
        $rootScope.onSolve();
        srvAnalytics.record("useCaseChanged", {
            "useCaseName": getSelectedRequirement().useCaseSelection.getDisplay(),
            "interfaceName": requirementConfigScope.srvConfigVM.selectedInterface.name
        });
    }
    function showUserPeripheralRow(uiPeriperialReq) {
        if (!uiPeriperialReq)
            return false;
        var show = uiPeriperialReq.parentInterface.interfaceData.showUsePeripheral &&
            (uiPeriperialReq.peripheralSelections && uiPeriperialReq.peripheralSelections.length > 2);
        return show;
    }
    function getSelectedRequirement() {
        return requirementConfigScope.srvConfigVM.selectedRequirement;
    }
    function viewIOSets() {
        var peripheralName = getSelectedRequirement().requirement.peripheralSolution.assignedToName;
        var ioSetName = getSelectedRequirement().requirement.peripheralSolution.ioSet;
        if (peripheralName === "") {
            peripheralName = undefined;
        }
        srvNav.configureIOSets(peripheralName, ioSetName, requirementConfigScope.srvConfigVM.selectedInterface.name, getSelectedRequirement().requirement.id);
    }
    function displayCurrentValidationErrorWarning() {
        requirementConfigScope.srvConfigVM.displayCurrentErrorWarning('peripheral', '', getSelectedRequirement().requirement.nonSolverSolution.errorText, 'error');
    }
    function onVoltageChanged() {
        getSelectedRequirement().requirement.selectedVoltage
            = getSelectedRequirement().voltageSelection.value;
        if ($rootScope.deviceRequirements.powerDomainSettings || getSelectedRequirement().voltageSelection.isAny()) {
            $rootScope.onSolve();
        }
        else {
            getSelectedRequirement().requirement.voltageSolution.errorText = "Voltage domains not configured";
        }
    }
    function configurePowerDomains() {
        srvNav.configureVoltage(requirementConfigScope.srvConfigVM.selectedInterface.name, getSelectedRequirement().requirement.id);
    }
    function peripheralChanged(peripheralReq, selection) {
        peripheralReq.peripheralSelection = selection;
        peripheralReq.requirement.selectedInstance = peripheralReq.peripheralSelection.value;
        peripheralReq.peripheralSelectionFilter.changePeripheral(peripheralReq.peripheralSelection);
        $rootScope.onSolve();
        srvAnalytics.record("usePeriperialChanged", {
            usePeriperialName: peripheralReq.requirement.selectedInstance,
            requirementName: peripheralReq.requirement.name,
            interfaceName: peripheralReq.parentInterface.name
        });
    }
    function onConfigurableInvalid(errorText) {
        srvConfig.onConfigurableInvalid(getSelectedRequirement(), errorText);
    }
    function onConfigurableValid(errorText) {
        srvConfig.onConfigurableValid(getSelectedRequirement(), errorText);
    }
    srvConfig.init().then(function () {
        var deviceData = srvConfig.getDeviceData();
        requirementConfigScope.showIOSets = deviceData.showIOSets;
        requirementConfigScope.showPreferredVoltage = deviceData.showPreferredVoltage;
        requirementConfigScope.powerDomainSettingsEnabled = $rootScope.deviceRequirements.powerDomainSettingsEnabled;
    });
});
//# sourceMappingURL=requirementConfig.js.map