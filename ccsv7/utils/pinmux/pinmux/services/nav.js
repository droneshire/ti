define(["require", "exports", "$location", "$route", "analytics", "data"], function (require, exports, location, route, srvAnalytics, srvDeviceData) {
    "use strict";
    exports.scope = null;
    exports.isEclipse = false;
    exports.selectedInterfaceId = null;
    exports.selectedRequirementId = null;
    function setScope(value) {
        exports.scope = value;
    }
    exports.setScope = setScope;
    function initComplete() {
        if (exports.scope) {
            exports.scope.setInit(true);
        }
    }
    exports.initComplete = initComplete;
    function setInit(val) {
        if (exports.scope) {
            exports.scope.setInit(val);
        }
    }
    exports.setInit = setInit;
    function newConfigurePins(selectedBoard, selectedDevice, selectedPart, selectedPackage) {
        srvDeviceData.clearDeviceInfoCache();
        var boardId = selectedBoard ? selectedBoard.boardId : undefined;
        var deviceId = selectedDevice.name;
        var partId = selectedPart.partID;
        var packageId = selectedPackage.packageID;
        srvAnalytics.record("configuration", {
            "boardId": boardId,
            "deviceId": deviceId,
            "partId": partId,
            "packageId": packageId
        });
        configureCommon(boardId, deviceId, partId, packageId);
    }
    exports.newConfigurePins = newConfigurePins;
    function configureCommon(boardId, deviceId, partId, packageId) {
        var newLocation = "/config/" + boardId + "/" + deviceId + "/" + partId + "/" + packageId + "/" + exports.selectedInterfaceId + "/" + exports.selectedRequirementId;
        exports.selectedInterfaceId = null;
        exports.selectedRequirementId = null;
        if (location.path() != newLocation) {
            location.path(newLocation);
        }
        else {
            route.reload();
        }
    }
    function setRouteAndConfigurePins(boardId, deviceId, partId, packageId) {
        configureCommon(boardId, deviceId, partId, packageId);
    }
    exports.setRouteAndConfigurePins = setRouteAndConfigurePins;
    function configurePins() {
        var routeParams = route.current.params;
        configureCommon(routeParams.boardId, routeParams.deviceId, routeParams.partId, routeParams.packageId);
    }
    exports.configurePins = configurePins;
    function isWelcomePage() {
        return location.path().indexOf("default") > -1;
    }
    exports.isWelcomePage = isWelcomePage;
    function reloadPage() {
        srvDeviceData.clearDeviceInfoCache();
        configurePins();
    }
    exports.reloadPage = reloadPage;
    function configureVoltage(_selectedInterfaceId, _selectedRequirementId) {
        exports.selectedInterfaceId = _selectedInterfaceId;
        exports.selectedRequirementId = _selectedRequirementId;
        var routeParams = route.current.params;
        location.path("/powerdomains/" + routeParams.boardId + "/" + routeParams.deviceId + "/" + routeParams.partId + "/" + routeParams.packageId + "/");
    }
    exports.configureVoltage = configureVoltage;
    function configureIOSets(peripheralName, ioSetName, _selectedInterfaceId, _selectedRequirementId) {
        exports.selectedInterfaceId = _selectedInterfaceId;
        exports.selectedRequirementId = _selectedRequirementId;
        var routeParams = route.current.params;
        location.path("/iosets/" + routeParams.boardId + "/" + routeParams.deviceId + "/" + routeParams.partId + "/" + routeParams.packageId + "/" + peripheralName + "/" + ioSetName + "/");
    }
    exports.configureIOSets = configureIOSets;
});
//# sourceMappingURL=nav.js.map