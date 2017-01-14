define(["require", "exports", "$q", "pinmuxRootScope", "data", "settings", "file", "codeGenerator", "analytics", "toastr", "nav"], function (require, exports, q, rootScope, srvDeviceData, srvSettings, srvFile, CodeGenerator, srvAnalytics, toastr, srvNav) {
    "use strict";
    exports.currentProjectFile = null;
    exports.unSaved = true;
    exports.initialNumErrors = 0;
    function reset() {
        exports.currentProjectFile = null;
        exports.unSaved = true;
    }
    exports.reset = reset;
    function prettyJSON(toJsonObj) {
        var val = JSON.stringify(toJsonObj, function (_key, value) {
            return value;
        }, "\t");
        return val;
    }
    function getJSONToSave(boardId, deviceId, partId, packageId, deviceRequirements) {
        return srvDeviceData.getDeviceInfo(boardId, deviceId, partId, packageId)
            .then(function (deviceData) {
            var toJsonObj = {
                boardId: boardId,
                deviceId: deviceId,
                partId: partId,
                packageId: packageId,
                deviceRequirements: deviceRequirements,
                versions: deviceData.versions,
            };
            var interfaceRequirementsMap = deviceRequirements.interfaceRequirementsMap;
            delete deviceRequirements.interfaceRequirementsMap;
            var jsonString;
            try {
                jsonString = prettyJSON(toJsonObj);
            }
            finally {
                deviceRequirements.interfaceRequirementsMap = interfaceRequirementsMap;
            }
            return jsonString;
        });
    }
    exports.getJSONToSave = getJSONToSave;
    function saveCommon(boardId, deviceId, partId, packageId, deviceRequirements, path, ask) {
        getJSONToSave(boardId, deviceId, partId, packageId, deviceRequirements).then(function (data) {
            var onCompleted = function (fileInfo, errorInfo) {
                if (errorInfo) {
                    toastr.error(errorInfo.message);
                }
                if (fileInfo.path) {
                    exports.currentProjectFile = fileInfo.path;
                    exports.unSaved = false;
                    srvSettings.addRecent(exports.currentProjectFile);
                    srvSettings.setLastSavedProjectFile(exports.currentProjectFile);
                    toastr.success("Saved");
                }
            };
            if (ask) {
                srvFile.browseAndSave(data, onCompleted);
            }
            else {
                toastr.info("Saving...");
                srvFile.save(data, {
                    path: path,
                }, onCompleted);
            }
        }).catch(function (e) {
            toastr.error("Failed to create data:" + e);
        });
    }
    function saveAsLocal(boardId, deviceId, partId, packageId, deviceRequirements) {
        saveCommon(boardId, deviceId, partId, packageId, deviceRequirements, null, true);
    }
    exports.saveAs = saveAsLocal;
    function save(boardId, deviceId, partId, packageId, deviceRequirements) {
        if (exports.currentProjectFile === null) {
            return saveAsLocal(boardId, deviceId, partId, packageId, deviceRequirements);
        }
        else {
            return saveCommon(boardId, deviceId, partId, packageId, deviceRequirements, exports.currentProjectFile, false);
        }
    }
    exports.save = save;
    function load(path) {
        var deferred = q.defer();
        function onCompleted(returnData, fileInfo, errorInfo) {
            if (errorInfo) {
                deferred.reject(errorInfo.message);
                rootScope.$digest();
            }
            else if (returnData) {
                var data_1 = returnData;
                var onLoadComplete = function (projectData) {
                    deferred.resolve();
                    var newFilePath = fileInfo ? fileInfo.path : path;
                    exports.unSaved = false;
                    exports.currentProjectFile = newFilePath;
                    srvSettings.addRecent(newFilePath);
                    srvNav.setRouteAndConfigurePins(projectData.boardId, projectData.deviceId, projectData.partId, projectData.packageId);
                };
                var onLoadFailed = function (error) {
                    toastr.error(error);
                    deferred.reject(error);
                };
                srvDeviceData.loadProject(data_1)
                    .then(onLoadComplete, onLoadFailed);
            }
        }
        if (path) {
            srvFile.load({
                path: path,
            }, onCompleted);
        }
        else {
            srvFile.browseAndLoad(onCompleted);
        }
        return deferred.promise;
    }
    exports.load = load;
    function openInBrowser(returnData, filename, errorCallback) {
        var data = returnData;
        function onLoadComplete(projectData) {
            var newFilePath = filename;
            exports.unSaved = false;
            srvSettings.addRecent(newFilePath);
            if (filename !== "_autosaver.pinmux") {
                exports.currentProjectFile = newFilePath;
            }
            srvNav.setRouteAndConfigurePins(projectData.boardId, projectData.deviceId, projectData.partId, projectData.packageId);
        }
        srvDeviceData.loadProject(data).then(onLoadComplete, errorCallback);
    }
    exports.openInBrowser = openInBrowser;
    var errorOccurred = false;
    function onErrorOccurred(message) {
        if (!errorOccurred) {
            toastr.error(message);
            errorOccurred = true;
        }
    }
    function generateHeader(fileList, selectedCategory) {
        function onFolderSelected(outputFolder, errorInfo) {
            if (errorInfo) {
                toastr.error(errorInfo.message);
                return;
            }
            srvSettings.setLastGenerateDir(outputFolder.path);
            function onTemplateWritten(_fileInfo, errorInfo2) {
                if (errorInfo2) {
                    onErrorOccurred(errorInfo2.message);
                }
            }
            _.each(fileList, function (curFile) {
                if (selectedCategory.value === "all" || curFile.category === selectedCategory.value) {
                    var fileName = curFile.name;
                    try {
                        var outputData = generateCode(curFile.template);
                        srvFile.save(outputData, {
                            path: outputFolder.path + "/" + fileName,
                        }, onTemplateWritten);
                    }
                    catch (err) {
                        onErrorOccurred("Generating " + fileName + " failed: " + err);
                    }
                }
            });
        }
        srvFile.browseFolder(onFolderSelected);
    }
    exports.generateHeader = generateHeader;
    function isSafari() {
        return navigator.userAgent.indexOf("Safari") !== -1 && navigator.userAgent.indexOf("Chrome") === -1;
    }
    function generateDownloadLink(name, content, myType) {
        if (isSafari() && (myType === "application/zip")) {
            var a = document.createElement("a");
            a.setAttribute("href", "data:application/zip;base64," + content);
            a.setAttribute("download", name);
            a.click();
        }
        else {
            var fileNameToSaveAs = name;
            var textToWrite = content;
            var textFileAsBlob = new Blob([textToWrite], {
                type: myType,
            });
            saveAs(textFileAsBlob, fileNameToSaveAs);
        }
    }
    exports.generateDownloadLink = generateDownloadLink;
    function downloadFiles(fileList, deviceId, selectedCategory) {
        var zip;
        if (selectedCategory.numFiles > 1) {
            zip = new JSZip();
        }
        fileList.forEach(function (curFile) {
            var outputData = generateCode(curFile.template);
            if (selectedCategory.value === "all" || curFile.category === selectedCategory.value) {
                var fileName = curFile.name;
                if (selectedCategory.numFiles === 1) {
                    var fileType = "text/plain";
                    if (curFile.category === "csv") {
                        fileType = "text/csv";
                    }
                    generateDownloadLink(fileName, outputData, fileType);
                    return;
                }
                else {
                    zip.file(fileName, outputData);
                }
            }
        });
        if (zip) {
            var content = void 0;
            if (isSafari()) {
                content = zip.generate({
                    type: "base64",
                });
            }
            else {
                content = zip.generate({
                    type: "blob",
                });
            }
            var zipFileName = deviceId + "_" + selectedCategory.value + "_output.zip";
            generateDownloadLink(zipFileName, content, "application/zip");
        }
    }
    exports.downloadFiles = downloadFiles;
    function generateCode(template) {
        var codeGenerator = new CodeGenerator(rootScope.deviceRequirements, rootScope.data, srvSettings.version);
        try {
            return codeGenerator.generate(template);
        }
        catch (err) {
            rootScope.$emit("nav.error", "Code Generation Error", err.message);
        }
    }
    exports.generateCode = generateCode;
    function downloadFile(fileEntry) {
        srvAnalytics.record("downloadFile", {
            error: parseInt(rootScope.deviceRequirements.solution.errorText, 10),
            fileName: fileEntry.name,
            gpioTotal: rootScope.deviceRequirements.solution.gpioPinsTotal,
            gpioUsed: rootScope.deviceRequirements.solution.gpioPinsUsed,
            numRequirementsAdded: srvDeviceData.getNumRequirementsAdded(),
            warning: parseInt(rootScope.deviceRequirements.solution.warningText, 10),
        });
        var outputData = generateCode(fileEntry.template);
        var fileType = "text/plain";
        if (fileEntry.category === "cvs") {
            fileType = "text/csv";
        }
        var fileName = fileEntry.name;
        generateDownloadLink(fileName, outputData, fileType);
    }
    exports.downloadFile = downloadFile;
    function setRequirementsChanged() {
        exports.unSaved = true;
    }
    exports.setRequirementsChanged = setRequirementsChanged;
    function getGeneratedFileName(fileEntry) {
        return fileEntry.name;
    }
    exports.getGeneratedFileName = getGeneratedFileName;
});
//# sourceMappingURL=project.js.map