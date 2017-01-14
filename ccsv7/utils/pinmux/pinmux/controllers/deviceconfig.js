define(["require", "exports", "../services/project", "../services/data", "../services/nav", "../services/analytics", "../services/extendScope", "$scope"], function (require, exports, srvProject, srvDeviceData, srvNav, srvAnalytics, extendScope, $scope) {
    "use strict";
    var directiveScope = $scope;
    var deviceConfigScope = extendScope($scope, {
        loading: true,
        isBoard: false,
        devices: null,
        selectedDeviceDescription: null,
        selectedPart: null,
        selectedPackage: null,
        boards: null,
        selectedBoard: null,
        idPreFix: null,
        configurePins: function () {
            srvProject.reset();
            srvAnalytics.record("newDesign");
            srvNav.newConfigurePins(deviceConfigScope.selectedBoard, deviceConfigScope.selectedDeviceDescription, deviceConfigScope.selectedPart, deviceConfigScope.selectedPackage);
        },
        getDropdownClass: function () {
            if (isNode()) {
                return "dropdown";
            }
            return "";
        }
    });
    var deviceData;
    srvDeviceData.getDeviceDescriptions().then(function (data) {
        deviceData = data;
        deviceConfigScope.devices = data.devices;
        deviceConfigScope.selectedDeviceDescription = deviceConfigScope.devices[0];
        deviceConfigScope.selectedPart = deviceConfigScope.selectedDeviceDescription.part[0];
        deviceConfigScope.selectedPackage = deviceConfigScope.selectedPart.packageDescriptions[0];
        return srvDeviceData.getBoardDescriptions();
    }).then(function (boards) {
        deviceConfigScope.boards = boards;
        deviceConfigScope.boards.unshift({
            boardId: undefined,
            name: "N/A",
            link: undefined,
            deviceId: undefined,
            partId: undefined,
            packageId: undefined
        });
        deviceConfigScope.selectedBoard = boards[0];
    }).then(function () {
        deviceConfigScope.loading = false;
    });
    $scope.$watch("selectedBoard", function (newSelectedBoard) {
        if (newSelectedBoard && newSelectedBoard.boardId) {
            deviceConfigScope.selectedDeviceDescription = _.find(deviceData.devices, {
                name: newSelectedBoard.deviceId
            });
            deviceConfigScope.selectedPart = _.find(deviceConfigScope.selectedDeviceDescription.part, {
                partID: newSelectedBoard.partId
            });
            deviceConfigScope.selectedPackage = _.find(deviceConfigScope.selectedDeviceDescription.package, {
                packageID: newSelectedBoard.packageId
            });
            deviceConfigScope.isBoard = true;
        }
        else {
            deviceConfigScope.isBoard = false;
        }
    }, true);
    $scope.$watch("selectedDeviceDescription", function (newSelectedDeviceDescription) {
        if (newSelectedDeviceDescription)
            deviceConfigScope.selectedPart = newSelectedDeviceDescription.part[0];
    }, true);
    $scope.$watch("selectedPart", function (newSelectedPart) {
        if (newSelectedPart)
            deviceConfigScope.selectedPackage = newSelectedPart.packageDescriptions[0];
    }, true);
    deviceConfigScope.idPreFix = directiveScope.isNav ? "nav" : "main";
});
//# sourceMappingURL=deviceconfig.js.map