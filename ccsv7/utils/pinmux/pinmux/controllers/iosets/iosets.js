define(["require", "exports", "../../services/pinmuxRootScope", "../../services/pinmuxRouteParams", "../../services/data", "../../services/nav", "$scope", "../../services/extendScope"], function (require, exports, $rootScope, $routeParams, srvDeviceData, srvNav, $scope, extendScope) {
    "use strict";
    var ioSetScope = extendScope($scope, {
        peripherals: [],
        devicePins: {},
        peripheral: null,
        selectedIOSet: null,
        configureCurrentDevicePins: function () {
            srvNav.configurePins();
        },
        getIoSetButtonClass: function (ioSet) {
            if (ioSetScope.selectedIOSet.name == ioSet.name)
                return "listButton listButtonSelected";
            return "listButton";
        },
        ioSetClicked: function (ioSet) {
            ioSetScope.selectedIOSet = ioSet;
        },
        peripheralChanged: function (peripheral) {
            if (peripheral.ioSets && peripheral.ioSets.length > 0) {
                ioSetScope.selectedIOSet = peripheral.ioSets[0];
            }
            else {
                ioSetScope.selectedIOSet = null;
            }
        }
    });
    var peripheralName = $routeParams.peripheralId;
    srvDeviceData.getDeviceInfo($routeParams.boardId, $routeParams.deviceId, $routeParams.partId, $routeParams.packageId)
        .then(function (data) {
        for (var key in data.peripherals) {
            ioSetScope.peripherals.push(data.peripherals[key]);
        }
        ioSetScope.peripheral = data.peripherals[peripheralName];
        if (ioSetScope.peripheral) {
            for (var i = 0; i < ioSetScope.peripheral.ioSets.length; i++) {
                if (ioSetScope.peripheral.ioSets[i].name == $routeParams.ioSetId) {
                    ioSetScope.selectedIOSet = ioSetScope.peripheral.ioSets[i];
                }
            }
        }
        ioSetScope.devicePins = data.devicePins;
        $rootScope.data = data;
        return data;
    });
});
//# sourceMappingURL=iosets.js.map