define(["require", "exports", "../../services/pinmuxRootScope", "../../services/nav", "../../services/layout", "../../services/style", "../../services/config", "$scope", "../../services/extendScope"], function (require, exports, $rootScope, srvNav, srvLayout, srvStyle, srvConfig, $scope, extendScope) {
    "use strict";
    var configScope = extendScope($scope, {
        srvLayout: srvLayout,
        srvStyle: srvStyle,
        initializingConfigSrv: true,
        srvConfigVM: srvConfig.vm,
        codePreviewViewStatus: false,
        isStandardGPIO: false,
        getAvailableLabelClass: function (counter) {
            if (counter > 0) {
                return "label label-info";
            }
            return "label label-default";
        },
        setProgressInterval: function () {
            var progressIntervalEvent = setInterval(function () {
                var newProgress = parseInt($("#loadingProgressBar").attr("aria-valuenow")) + 20;
                if (newProgress <= 95 && configScope.initializingConfigSrv) {
                    $("#loadingProgressBar").css("width", newProgress + "%").attr("aria-valuenow", newProgress);
                }
                else {
                    clearInterval(progressIntervalEvent);
                }
            }, 500);
        }
    });
    srvConfig.init().then(function () {
        srvNav.initComplete();
        configScope.initializingConfigSrv = false;
        $rootScope.data = srvConfig.getDeviceData();
    });
    var unRegNavLoading = $rootScope.$on("nav.loading", function (_event, data) {
        configScope.initializingConfigSrv = data;
        if (data) {
            configScope.setProgressInterval();
            $scope.$digest();
        }
        else {
            $("#loadingProgressBar").css("width", "55%").attr("aria-valuenow", "55");
        }
    });
    var unRegSolveComplete = $rootScope.$on("onSolveComplete", function () {
        $rootScope.$emit("openCodeFile");
    });
    $scope.$watch("srvConfigVM.selectedInterface", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            configScope.isStandardGPIO = newValue.interfaceData.isStandardGPIO;
        }
        return;
    });
    var unRegCodeFileOpened = $rootScope.$on("codeFileOpened", function () {
        configScope.codePreviewViewStatus = true;
    });
    var unRegCodeFileClosed = $rootScope.$on("codeFileClosed", function () {
        configScope.codePreviewViewStatus = false;
    });
    $scope.$on("$destroy", function () {
        srvConfig.reset();
        unRegCodeFileClosed();
        unRegCodeFileOpened();
        unRegSolveComplete();
        unRegNavLoading();
    });
});
//# sourceMappingURL=config.js.map