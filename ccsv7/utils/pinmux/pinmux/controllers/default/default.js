define(["require", "exports", "$scope", "../../services/pinmuxRootScope", "../../services/modals", "$modal", "../../services/project", "../../services/nav", "../../services/settings", "../../services/update", "../../services/storage/cloudStorage", "../../services/analytics", "../../services/utils", "../../services/extendScope"], function (require, exports, $scope, pinmuxRootScope, modals, $modal, srvProject, srvNav, srvSettings, srvUpdate, srvCloudStorage, srvAnalytics, util, extendScope) {
    "use strict";
    var defaultScope = extendScope($scope, {
        loadingProject: false,
        loading: true,
        isNode: isNode(),
        cloudFiles: [],
        cloudFilesSize: 0,
        getTriangleGlyphClass: function (hide) {
            if (hide) {
                return "glyphicon glyphicon-triangle-right";
            }
            else {
                return "glyphicon glyphicon-triangle-bottom";
            }
        },
        loadCloudFile: function (filename) {
            pinmuxRootScope.$emit("nav.loading", true);
            srvCloudStorage.openFile(filename)
                .then(function (response) {
                var fileData = response.data;
                var failLoad = function (data) {
                    pinmuxRootScope.$emit("nav.error", "Cloud Open Error", data);
                    pinmuxRootScope.$emit("nav.loading", false);
                };
                srvAnalytics.record("loadCloudDesign", {
                    "fileName": filename
                });
                srvProject.openInBrowser(fileData, filename, failLoad);
            })
                .catch(function () {
                pinmuxRootScope.$emit("nav.loading", false);
            });
        },
        load: function () {
            if (defaultScope.isNode) {
                srvProject.load();
            }
            else {
                $("#openProjectInput").one("change", function () {
                    pinmuxRootScope.$emit("nav.loading", true);
                    var selected_file = document.getElementById("openProjectInput").files[0];
                    var reader = new FileReader();
                    var failLoad = function (data) {
                        pinmuxRootScope.$emit("nav.error", "Error Opening File", data);
                        pinmuxRootScope.$emit("nav.loading", false);
                    };
                    reader.onloadend = function () {
                        srvAnalytics.record("loadLocalDesign", {
                            "fileName": selected_file.name
                        });
                        srvProject.openInBrowser(reader.result, selected_file.name, failLoad);
                        $("#openProjectInput").val("");
                    };
                    reader.readAsText(selected_file);
                });
                $("#openProjectInput").click();
            }
        },
        loadFromFile: function (filePath) {
            defaultScope.loadingProject = true;
            srvProject.load(filePath);
        },
        areSettingNew: true,
        recentProjects: [],
        updatesSupported: srvUpdate.supported(),
        checkingForUpdates: false,
        updatesFound: false,
        installUpdates: function () {
            modals.confirm("Install Update!", "Exiting application to install available updates. Do you wish to continue?", function () {
                srvUpdate.install();
            });
        },
        deleteCloudFile: function (filename) {
            var modalInstance = $modal.open({
                templateUrl: "deleteConfirmModal.html",
                controller: "ConfirmDeleteModalInstanceCtrl",
                size: "sm",
                resolve: {
                    filename: function () {
                        return filename;
                    }
                }
            });
            modalInstance.result.then(function (filename) {
                function onSuccess() {
                    srvCloudStorage.getFileList(".pinmux").then(getFileListSuccess);
                }
                function onFail(error) {
                    alert("Error: " + error);
                }
                srvCloudStorage.deleteFile(filename).then(onSuccess, onFail);
            }, function () {
            });
        },
        openLink: function (link) {
            if (defaultScope.isNode) {
                require("nw.gui").Shell.openItem(link);
            }
            else {
                srvAnalytics.record("openLink", {
                    "link": link
                });
                window.open(link, "_blank");
            }
        }
    });
    srvNav.setInit(false);
    function getFileListSuccess(response) {
        defaultScope.cloudFiles = JSON.parse(response.data);
        _.each(defaultScope.cloudFiles, function (file) {
            defaultScope.cloudFilesSize += file.size;
        });
    }
    if (!defaultScope.isNode) {
        srvCloudStorage.getFileList(".pinmux").then(getFileListSuccess);
    }
    if (defaultScope.isNode) {
        var recentProjectsList = srvSettings.getRecentProjects();
        defaultScope.areSettingNew = recentProjectsList.length === 0;
        if (!defaultScope.areSettingNew) {
            for (var i = 0; i < recentProjectsList.length; i++) {
                var projectPath = recentProjectsList[i];
                var fileName = util.getFileName(projectPath);
                defaultScope.recentProjects.push({
                    path: projectPath,
                    description: fileName
                });
            }
        }
    }
    if (defaultScope.updatesSupported) {
        defaultScope.checkingForUpdates = true;
        srvUpdate.available(function (value) {
            defaultScope.checkingForUpdates = false;
            defaultScope.updatesFound = value;
            if (!$scope.$$phase)
                $scope.$digest();
        });
    }
});
//# sourceMappingURL=default.js.map