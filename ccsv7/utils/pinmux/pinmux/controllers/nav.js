define(["require", "exports", "../services/pinmuxRootScope", "$scope", "../services/modals", "../services/data", "../services/project", "../services/nav", "../services/toolTip", "../services/settings", "../services/accountManagement", "../services/storage/cloudStorage", "../services/analytics", "toastr", "$timeout", "../services/pinmuxRouteParams", "../services/extendScope"], function (require, exports, $rootScope, $scope, srvModals, srvDeviceData, srvProject, srvNav, srvToolTip, srvSettings, srvUserAcctMgmt, srvCloudStorage, srvAnalytics, toastr, $timeout, $routeParams, extendScope) {
    "use strict";
    var navScope = extendScope($scope, {
        deviceDisplayName: null,
        paneConfig: {
            verticalDragMinHeight: 40
        },
        init: false,
        username: "",
        showPopup: false,
        isNode: isNode(),
        isEclipse: function () {
            return srvNav.isEclipse;
        },
        loadingInterfacees: true,
        autoSaverName: "_autosaver.pinmux",
        counter: 0,
        setInit: function (flag) {
            navScope.init = flag;
        },
        cloudFiles: [],
        load: function () {
            if (navScope.isNode) {
                srvProject.load();
            }
            else {
                $("#openProjectInputNav").one("change", function () {
                    $rootScope.$emit("nav.loading", true);
                    var selected_file = document.getElementById("openProjectInputNav").files[0];
                    var reader = new FileReader();
                    var failLoad = function (data) {
                        $rootScope.$emit("nav.error", "Error Opening File", data);
                        $rootScope.$emit("nav.loading", false);
                    };
                    reader.onloadend = function () {
                        srvAnalytics.record("loadLocalDesign", {
                            "fileName": selected_file.name
                        });
                        srvProject.openInBrowser(reader.result, selected_file.name, failLoad);
                        $("#openProjectInputNav").val("");
                    };
                    reader.readAsText(selected_file);
                });
                $("#openProjectInputNav").click();
            }
        },
        loadCloud: function () {
            srvCloudStorage.getFileList(".pinmux").then(function (response) {
                navScope.cloudFiles = JSON.parse(response.data);
                srvModals.fileList(navScope.cloudFiles, function (filename) {
                    function onSuccess(response) {
                        var failLoad = function (data) {
                            $rootScope.$emit("nav.error", "Error Opening File", data);
                            $rootScope.$emit("nav.loading", false);
                        };
                        srvAnalytics.record("loadCloudDesign", {
                            "fileName": filename
                        });
                        srvProject.openInBrowser(response.data, filename, failLoad);
                    }
                    function onFail() {
                        $rootScope.$emit("nav.loading", false);
                    }
                    srvCloudStorage.openFile(filename).then(onSuccess, onFail);
                });
            });
        },
        save: function () {
            if (navScope.isNode) {
                srvProject.saveAs($routeParams.boardId, $routeParams.deviceId, $routeParams.partId, $routeParams.packageId, $rootScope.deviceRequirements);
            }
            else {
                srvProject.getJSONToSave($routeParams.boardId, $routeParams.deviceId, $routeParams.partId, $routeParams.packageId, $rootScope.deviceRequirements)
                    .then(function (dataToSave) {
                    if (!srvProject.currentProjectFile) {
                        srvProject.currentProjectFile = $routeParams.deviceId + ".pinmux";
                    }
                    srvAnalytics.record("saveLocalDesign", {
                        "fileName": srvProject.currentProjectFile,
                        "numRequirementsAdded": srvDeviceData.getNumRequirementsAdded(),
                        "error": parseInt($rootScope.deviceRequirements.solution.errorText),
                        "warning": parseInt($rootScope.deviceRequirements.solution.warningText),
                        "gpioUsed": $rootScope.deviceRequirements.solution.gpioPinsUsed,
                        "gpioTotal": $rootScope.deviceRequirements.solution.gpioPinsTotal
                    });
                    srvProject.generateDownloadLink(srvProject.currentProjectFile, dataToSave, "text/pinmux");
                });
            }
        },
        saveCloudConfirmed: function (filename) {
            srvProject.getJSONToSave($routeParams.boardId, $routeParams.deviceId, $routeParams.partId, $routeParams.packageId, $rootScope.deviceRequirements)
                .then(function (dataToSave) {
                return srvCloudStorage.saveFile(filename, dataToSave);
            })
                .then(cloudSaveCallback);
        },
        saveCloud: function () {
            var filename = srvProject.currentProjectFile ? srvProject.currentProjectFile : ($routeParams.deviceId + ".pinmux");
            filename = filename.replace(".pinmux", "");
            srvModals.saveFile(filename, function (filename) {
                var filenameWithExt = filename + ".pinmux";
                srvAnalytics.record("saveCloudDesign", {
                    "fileName": filenameWithExt,
                    "numRequirementsAdded": srvDeviceData.getNumRequirementsAdded(),
                    "error": parseInt($rootScope.deviceRequirements.solution.errorText),
                    "warning": parseInt($rootScope.deviceRequirements.solution.warningText),
                    "gpioUsed": $rootScope.deviceRequirements.solution.gpioPinsUsed,
                    "gpioTotal": $rootScope.deviceRequirements.solution.gpioPinsTotal
                });
                navScope.saveCloudConfirmed(filenameWithExt);
            });
        },
        saveAs: function () {
            srvProject.saveAs($routeParams.boardId, $routeParams.deviceId, $routeParams.partId, $routeParams.packageId, $rootScope.deviceRequirements);
        },
        srvToolTip: srvToolTip,
        getVersion: function () {
            return srvSettings.version;
        },
        reset: function () {
            srvModals.confirm("Start New Design", "All unsaved progress will be lost. Do you wish to continue?", function () {
                srvProject.reset();
                srvNav.reloadPage();
            });
        },
        openLink: function (link, target, location) {
            if (navScope.isNode) {
                require("nw.gui").Shell.openItem(link);
            }
            else {
                srvAnalytics.record("openLink", {
                    "link": link,
                    "location": location
                });
                window.open(link, target);
            }
        },
        showDeviceSelection: false,
        deviceConfigChildHasFocus: false,
        inDeviceConfigContainer: false,
        setInDeviceConfigContainer: function (val) {
            navScope.inDeviceConfigContainer = val;
            navScope.showDeviceSelection = navScope.inDeviceConfigContainer || navScope.deviceConfigChildHasFocus;
        },
        deviceConfigChildSetFocus: function (val) {
            navScope.deviceConfigChildHasFocus = val;
            navScope.showDeviceSelection = navScope.inDeviceConfigContainer || navScope.deviceConfigChildHasFocus;
        },
        inShowPrefsContainer: false,
        prefsChildHasFocus: false,
        showPrefs: false,
        setInPrefsContainer: function (val) {
            navScope.inShowPrefsContainer = val;
            navScope.showPrefs = navScope.inShowPrefsContainer || navScope.prefsChildHasFocus;
        },
        userPrefsChildSetFocus: function (val) {
            navScope.prefsChildHasFocus = val;
            navScope.showPrefs = navScope.inShowPrefsContainer || navScope.prefsChildHasFocus;
        },
        showTIToolsMenu: false,
        hideMenuTimeout: null,
        showAppMenu: function () {
            if (!navScope.isNode) {
                if ($(window).width() > 720) {
                    clearInterval(navScope.hideMenuTimeout);
                    navScope.showTIToolsMenu = true;
                }
            }
        },
        hideAppMenu: function (timeout) {
            if ($(window).width() > 720) {
                navScope.hideMenuTimeout = setInterval(function () {
                    navScope.showTIToolsMenu = false;
                    clearInterval(navScope.hideMenuTimeout);
                    $scope.$digest();
                }, timeout);
            }
        },
        getNavTILogoClass: function () {
            if (navScope.isNode) {
                return "";
            }
            return navScope.showTIToolsMenu ? "navMenuListLiActive" : "navMenuListLi";
        },
        showActionHam: false,
        showHideActionHam: function () {
            navScope.showActionHam = !navScope.showActionHam;
        },
        srvSettings: srvSettings,
        isNav: true,
        showPopUp: null,
        hidePopUp: null,
        getNWSaveAsPath: function () {
            return srvProject.currentProjectFile ? srvProject.currentProjectFile : $routeParams.deviceId + ".pinmux";
        }
    });
    var unRegDeviceDisplayNameChanged = $rootScope.$on("onDeviceDisplayNameChanged", function (_event, data) {
        navScope.deviceDisplayName = data;
    });
    var unRegNavError = $rootScope.$on("nav.error", function (_event, title, data) {
        srvModals.message(title, [data], [], "error");
        navScope.loadingInterfacees = false;
    });
    function getUsernameCallback(response) {
        navScope.username = JSON.parse(response.data).uid;
        if (typeof io !== "undefined" && navScope.username !== "") {
            var socket_1 = new io.connect(location.origin);
            var logOutMessage_1 = "Your user account has been logged out (inactive or logged out from another app), and your \n\t\t\t\t\t\t\tcurrent Pinmux session has been disconnected., Please refresh your browser to re-login \n\t\t\t\t\t\t\tto continue using the tool. If there are any unsaved changes, please save it locally first.";
            socket_1.on("logout", function () {
                srvModals.message("Logout Notice", [logOutMessage_1], [], "error")
                    .then(function () {
                    navScope.username = "";
                    $rootScope.username = "";
                });
            });
            socket_1.on('asklogout', function (data) {
                var iframe = document.getElementById("authIFrame");
                iframe.src = "/logout?reason=" + data.reason;
            });
            socket_1.on("preparelogout", function () {
                socket_1.emit("logoutready");
            });
        }
    }
    if (!navScope.isNode) {
        srvUserAcctMgmt.getUserInfo().then(getUsernameCallback);
    }
    srvNav.setScope(navScope);
    var unRegSolveComplete = $rootScope.$on("onSolveComplete", function () {
        navScope.counter++;
        if (((navScope.counter % 5) === 0) && (navScope.username !== "")) {
            navScope.saveCloudConfirmed(navScope.autoSaverName);
            navScope.counter = 0;
        }
    });
    function cloudSaveCallback(response) {
        var filename = response.path;
        if (response.message) {
            srvModals.message("Save file failed!", [response.message], [], "error");
        }
        else if (filename !== navScope.autoSaverName) {
            toastr.success(filename + " was saved successfully to your Cloud Storage.", "Cloud Save");
            srvProject.currentProjectFile = filename;
        }
    }
    (function () {
        var timer;
        if ((typeof require === "function") && process.env.PINMUX_TEST_ENABLED) {
            var timeout = 1000;
            navScope.showPopUp = function (prop) {
                $timeout.cancel(timer);
                navScope[prop] = true;
            };
            navScope.hidePopUp = function (prop) {
                timer = $timeout(function () {
                    navScope[prop] = false;
                }, timeout);
            };
        }
        else {
            navScope.showPopUp = function (prop) {
                navScope[prop] = true;
            };
            navScope.hidePopUp = function (prop) {
                navScope[prop] = false;
            };
        }
    })();
    $scope.$on("$destroy", function () {
        unRegDeviceDisplayNameChanged();
        unRegNavError();
        unRegSolveComplete();
    });
});
//# sourceMappingURL=nav.js.map