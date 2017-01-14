define(["require", "exports", "$scope", "services/config", "services/layout", "services/style", "services/toolTip", "services/pinmuxRootScope", "services/analytics", "services/extendScope"], function (require, exports, $scope, srvConfig, srvLayout, srvStyle, srvToolTip, $rootScope, srvAnalytics, extendScope) {
    "use strict";
    var requirementPinsScope = extendScope($scope, {
        srvStyle: srvStyle,
        srvLayout: srvLayout,
        srvToolTip: srvToolTip,
        srvConfigVM: srvConfig.vm,
        peripheralSelectAllPins: peripheralSelectAllPins,
        multiPinSelectAllPins: multiPinSelectAllPins,
        multiPinCountChanged: multiPinCountChanged,
        pinUsedChanged: pinUsedChanged,
        pinChanged: pinChanged,
        headerItemClicked: headerItemClicked
    });
    function peripheralSelectAllPins() {
        requirementPinsScope.srvConfigVM.selectedRequirement.applySelectAll();
        $rootScope.onSolve();
    }
    ;
    function multiPinSelectAllPins(multiPinReq) {
        multiPinReq.applySelectAll();
        $rootScope.onSolve();
    }
    ;
    function multiPinCountChanged(multiPinReq) {
        multiPinReq.applyCount();
        $rootScope.onSolve();
    }
    ;
    function pinUsedChanged(pinReq) {
        pinReq.setUsed(pinReq.requirement.used);
        $rootScope.onSolve();
    }
    ;
    function pinChanged(pinReq, selection) {
        pinReq.devicePinSelection = selection;
        pinReq.requirement.assignedToName = pinReq.devicePinSelection.value;
        requirementPinsScope.srvConfigVM.selectedRequirement.peripheralSelectionFilter.changePeripheral(pinReq.devicePinSelection);
        $rootScope.onSolve();
        srvAnalytics.record("pinOverride", {
            "pinValue": pinReq.requirement.assignedToName,
            "pinName": pinReq.requirement.name,
            "requirementName": requirementPinsScope.srvConfigVM.selectedRequirement.requirement.name,
            "interfaceName": requirementPinsScope.srvConfigVM.selectedInterface.name
        });
    }
    ;
    function headerItemClicked(headerItem) {
        headerItem.applyChange();
        $rootScope.$emit("openCodeFile");
    }
    ;
});
//# sourceMappingURL=requirementPins.js.map