define(["require", "exports", "$scope", "services/pinmuxRootScope", "services/pinmuxRouteParams", "services/fileList", "services/project", "services/analytics", "services/data", "services/style", "services/extendScope"], function (require, exports, $scope, $rootScope, $routeParams, srvFileList, srvProject, srvAnalytics, srvDeviceData, srvStyle, extendScope) {
    "use strict";
    var fileListScope = extendScope($scope, {
        showFileListView: true,
        showPopover: showPopover,
        hidePopover: hidePopover,
        popoverIsVisible: false,
        srvFileListVM: srvFileList.vm,
        filterFilesByCategory: filterFilesByCategory,
        srvStyle: srvStyle,
        getFileName: srvProject.getGeneratedFileName,
        openFile: openFile,
        numErrors: srvProject.initialNumErrors,
        getErrorsTitleText: getErrorsTitleText,
        downloadFiles: downloadFiles,
        downloadFile: downloadFile
    });
    function showPopover() {
        fileListScope.popoverIsVisible = true;
    }
    function hidePopover() {
        fileListScope.popoverIsVisible = false;
    }
    function filterFilesByCategory(option) {
        srvFileList.setSelectedCategory(option);
    }
    function openFile(fileEntry) {
        $rootScope.$emit("openCodeFile", fileEntry);
    }
    var unreg = $rootScope.$on("onErrorTextChanged", function (_event, numErrors) {
        fileListScope.numErrors = numErrors;
    });
    fileListScope.$on("$destroy", function () { return unreg(); });
    function getErrorsTitleText() {
        var areOris = fileListScope.numErrors === 1 ? "is" : "are";
        var errorStr = fileListScope.numErrors === 1 ? "error" : "errors";
        var toReturn = "There " + areOris + " " + fileListScope.numErrors + " " + errorStr;
        toReturn += " in your design. You can still generate files when errors exist,";
        toReturn += "but the files generated might not work in your system. Please consider fixing the errors first.";
        return toReturn;
    }
    function downloadFiles() {
        if (isNode()) {
            srvProject.generateHeader(fileListScope.srvFileListVM.fileListArray, fileListScope.srvFileListVM.fileCategorySelect);
        }
        else {
            srvAnalytics.record("downloadAllFiles", {
                "category": fileListScope.srvFileListVM.fileCategorySelect.value,
                "numRequirementsAdded": srvDeviceData.getNumRequirementsAdded(),
                "error": parseInt($rootScope.deviceRequirements.solution.errorText),
                "warning": parseInt($rootScope.deviceRequirements.solution.warningText),
                "gpioUsed": $rootScope.deviceRequirements.solution.gpioPinsUsed,
                "gpioTotal": $rootScope.deviceRequirements.solution.gpioPinsTotal
            });
            srvProject.downloadFiles(fileListScope.srvFileListVM.fileListArray, $routeParams.deviceId, fileListScope.srvFileListVM.fileCategorySelect);
        }
    }
    function downloadFile(fileEntry) {
        srvProject.downloadFile(fileEntry);
    }
    srvFileList.init();
});
//# sourceMappingURL=filelist.js.map