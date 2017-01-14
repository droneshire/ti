define(["require", "exports", "../../services/data", "../../services/nav", "../../services/pinmuxRouteParams", "../../services/project", "../../services/pinmuxRootScope"], function (require, exports, srvDeviceData, srvNav, $routeParams, srvProject, pinmuxRootScope) {
    "use strict";
    srvNav.isEclipse = true;
    var timeout = setInterval(function () {
        if (eclipseGetDesignFileContents) {
            clearInterval(timeout);
            var designFileContent = eclipseGetDesignFileContents();
            pinmuxRootScope.$on("onSolveComplete", function () {
                eclipseOnSolveComplete();
            });
            srvDeviceData.loadProject(designFileContent).then(function (projectData) {
                srvNav.setRouteAndConfigurePins(projectData.boardId, projectData.deviceId, projectData.partId, projectData.packageId);
            });
            window["pinmuxGetJSONToSave"] = function () {
                srvProject.getJSONToSave($routeParams.boardId, $routeParams.deviceId, $routeParams.partId, $routeParams.packageId, pinmuxRootScope.deviceRequirements).then(function (pinmuxFileContents) {
                    eclipseGetJSONToSaveComplete(pinmuxFileContents);
                });
            };
        }
    }, 100);
});
//# sourceMappingURL=launchfromeclipse.js.map