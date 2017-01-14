define(["require", "exports", "$scope", "services/data", "services/pinmuxRouteParams", "services/pinmuxRootScope", "services/style", "services/config", "services/pinview", "services/extendScope"], function (require, exports, $scope, srvDeviceData, $routeParams, $rootScope, srvStyle, srvConfig, PinView, extendScope) {
    "use strict";
    var pinviewScope = extendScope($scope, {
        srvConfigVM: srvConfig.vm,
        numGPIO: 0,
        numGPIOLeft: 0,
        srvStyle: srvStyle,
    });
    srvDeviceData.getDeviceInfo($routeParams.boardId, $routeParams.deviceId, $routeParams.partId, $routeParams.packageId).then(function (data) {
        pinviewScope.numGPIO = $rootScope.deviceRequirements.solution.gpioPinsTotal;
        var gpioUsed = $rootScope.deviceRequirements.solution.gpioPinsUsed;
        if (isNaN(gpioUsed)) {
            gpioUsed = 0;
        }
        pinviewScope.numGPIOLeft = $rootScope.deviceRequirements.solution.gpioPinsTotal - gpioUsed;
        var showExtendedPinTypes = ($routeParams.deviceId.substring(0, 3) === "F28") ? true : false;
        var rowColumnInverted = showExtendedPinTypes;
        var showWarningPins = ($routeParams.deviceId.substring(0, 2) === "AM");
        var isBoard = $routeParams.boardId !== "undefined";
        PinView.init(data, $rootScope.deviceRequirements, "", showExtendedPinTypes, showWarningPins, rowColumnInverted, isBoard);
        pinviewScope.$on("$destroy", function () {
            PinView.destroy();
        });
        var unreg = $rootScope.$on("onSolveComplete", function (_event, deviceRequirements) {
            pinviewScope.numGPIOLeft = deviceRequirements.solution.gpioPinsTotal - deviceRequirements.solution.gpioPinsUsed;
        });
        pinviewScope.$on("$destroy", function () { return unreg(); });
        pinviewScope.$watch("srvConfigVM.selectedRequirement", function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                PinView.redraw(newValue.requirement.id);
            }
        });
        var unreg2 = $rootScope.$on("onSolveComplete", function () {
            var reqId = pinviewScope.srvConfigVM.selectedRequirement ? pinviewScope.srvConfigVM.selectedRequirement.requirement.id : null;
            PinView.redraw(reqId);
        });
        pinviewScope.$on("$destroy", function () { return unreg2(); });
    });
});
//# sourceMappingURL=pinview.js.map