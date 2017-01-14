define(["require", "exports", "$q", "$http", "pinmuxRootScope", "requirements", "settings"], function (require, exports, q, http, rootScope, Requirement, srvSettings) {
    "use strict";
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
    function getObjFromIDProp(lookupMaps, idProp, value) {
        var lookupMapName = idProp.replace("ID", "s");
        var map = lookupMaps[lookupMapName];
        if (map != "undefined") {
            return map[value];
        }
        return null;
    }
    function updateWrapperReferences(lookupMaps, obj, i, makeArray) {
        var listName = i.replace("Wrapper", "s");
        obj[listName] = makeArray ? [] : {};
        for (var key in obj[i]) {
            for (var id in (obj[i])[key]) {
                var refObj = getObjFromIDProp(lookupMaps, id, ((obj[i])[key])[id]);
                if (makeArray) {
                    obj[listName].push(refObj);
                }
                else {
                    if (!(obj[listName])[refObj.name]) {
                        (obj[listName])[refObj.name] = refObj;
                    }
                }
            }
        }
        delete obj[i];
    }
    ;
    function updateIDReferences(obj, lookupMaps) {
        for (var i in obj) {
            if (endsWith(i, "ID")) {
                var refObj = getObjFromIDProp(lookupMaps, i, obj[i]);
                var newPropName = i.replace("ID", "");
                obj[newPropName] = refObj;
                delete obj[i];
            }
            else if (endsWith(i, "Wrapper")) {
                updateWrapperReferences(lookupMaps, obj, i, false);
            }
            else {
                if (typeof (obj[i]) === "undefined" || typeof (obj[i]) === "string" || typeof (obj[i]) === "boolean" || typeof (obj[i]) === "number") {
                    continue;
                }
                updateIDReferences(obj[i], lookupMaps);
            }
        }
    }
    ;
    function copyObj(source, dest) {
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                dest[prop] = source[prop];
            }
        }
    }
    ;
    function toNameMap(arr) {
        var map = {};
        for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
            var item = arr_1[_i];
            map[item.name] = item;
        }
        return map;
    }
    function walkGroupRequirements(requirement, action) {
        _.each(requirement.requirements, function (req) {
            action(req);
        });
    }
    function walkGPIOGroupRequirements(requirement, action) {
        _.each(requirement.requirements, function (req) {
            walkGroupRequirements(req, action);
        });
    }
    function walkRequirements(requirement, isGPIOGroup, action) {
        if (isGPIOGroup) {
            walkGPIOGroupRequirements(requirement, action);
        }
        else {
            walkGroupRequirements(requirement, action);
        }
    }
    function getBoardSignalName(devicePinName) {
        return devicePinName.split("/")[0].replace(".GPIO", "");
    }
    function createBoardPins(pinmuxFileData, headers, devicePackage, groupRequirements) {
        var boardPins = [];
        function addExternalComponent(requirement, isGPIOGroup) {
            walkRequirements(requirement, isGPIOGroup, function (currReq) {
                _.each(currReq.pinRequirements, function (pinReq) {
                    if (!pinReq.used)
                        return;
                    var packagePin = _.find(devicePackage.packagePin, {
                        ball: pinReq.solution.assignedToName
                    });
                    var boardPin = {
                        ball: getBoardSignalName(packagePin.devicePin.name),
                        devicePin: packagePin.devicePin,
                        packagePinBall: packagePin.ball
                    };
                    pinReq.assignedToName = boardPin.ball;
                    boardPins.push(boardPin);
                });
            });
        }
        _.each(headers, function (header) {
            _.each(header.pins, function (headerPin) {
                if (headerPin.ball) {
                    var packagePin = _.find(devicePackage.packagePin, {
                        ball: headerPin.ball
                    });
                    var boardPin = {
                        ball: headerPin.name,
                        devicePin: packagePin.devicePin,
                        packagePinBall: packagePin.ball,
                    };
                    boardPins.push(boardPin);
                }
            });
        });
        _.each(pinmuxFileData.deviceRequirements.groupRequirements, function (groupReq, key) {
            if (groupReq.requirements.length) {
                addExternalComponent(groupReq, key === "GPIO");
                groupRequirements[groupReq.name] = groupReq;
            }
        });
        return boardPins;
    }
    function augmentType(base, toAdd, toAddIfExists, toDeleteFromBase) {
        var temp = _.extend(base, toAdd);
        _.each(toAddIfExists, function (value, key) {
            if (value) {
                temp[key] = value;
            }
        });
        _.each(toDeleteFromBase, function (key) {
            delete base[key];
        });
        return temp;
    }
    function getAdaptedDeviceInfo(boardInfo, deviceInfo, partId, packageId, groupRequirements) {
        var versions = {
            data: deviceInfo.version || deviceInfo.timestamp,
            timestamp: deviceInfo.timestamp,
            tool: null,
            templates: null
        };
        var showIOSets = false;
        var showPreferredVoltage = Object.keys(deviceInfo.powerDomains).length > 0;
        var devicePins = {};
        var devicePackage = deviceInfo.packages[packageId];
        if (boardInfo) {
            devicePackage.packagePin = createBoardPins(boardInfo.base, boardInfo.headers, devicePackage, groupRequirements);
        }
        var packageDescription = devicePackage.packageDescription;
        _.each(devicePackage.packagePin, function (pp) {
            var packagePin = pp;
            var devicePin = pp.devicePin;
            copyObj(packagePin, devicePin);
            var newDevicePin = devicePin;
            newDevicePin.designSignalName = newDevicePin.name;
            newDevicePin.name = newDevicePin.ball;
            newDevicePin.pinMappings = [];
            delete newDevicePin.devicePin;
            devicePins[newDevicePin.ball] = newDevicePin;
        });
        var peripherals = {};
        var peripheralPins = {};
        var part = deviceInfo.parts[partId];
        _.each(part.peripherals, function (peripheral) {
            if (peripherals[peripheral.name]) {
                console.log("Duplicate peripheral found in part: " + peripheral.name + " with id: " + peripheral.id);
            }
            var adaptedIoSetGroup = [];
            if (typeof (peripheral.ioSetGroups) != "undefined") {
                showIOSets = true;
                if (peripheral.ioSetGroups.length > 1) {
                    console.log("Warning: Only accounting for the first IO set group");
                }
                var ioSetGroup = peripheral.ioSetGroups[0];
                if (typeof (ioSetGroup.ioSet) != "undefined") {
                    _.each(ioSetGroup.ioSet, function (ioSet) {
                        var isSetRules = {};
                        _.each(ioSet.ioSetRule, function (ioSetRule) {
                            isSetRules[ioSetRule.peripheralPin.name] = ioSetRule.devicePin.name;
                        });
                        var newIOSet = {
                            name: ioSet.name,
                            ioSetRules: isSetRules
                        };
                        adaptedIoSetGroup.push(newIOSet);
                    });
                }
            }
            var numPeripheralPinsPinnedOut = 0;
            _.each(peripheral.peripheralPins, function (peripheralPin) {
                var newPeripheralPin = peripheralPin;
                newPeripheralPin.peripheralName = peripheral.name;
                peripheralPins[newPeripheralPin.name] = newPeripheralPin;
                newPeripheralPin.pinMappings = [];
                var reverseMux = deviceInfo.reverseMuxes[newPeripheralPin.id];
                if (typeof (reverseMux) != "undefined") {
                    var muxSettings = reverseMux.muxSetting;
                    _.each(muxSettings, function (muxSetting) {
                        var devicePin = muxSetting.devicePin;
                        if (muxSetting.devicePin.devicePinType === "Default" && devicePin.ball) {
                            newPeripheralPin.pinMappings.push(devicePin);
                        }
                    });
                }
                if (typeof (newPeripheralPin.interfacePin) != "undefined") {
                    if (typeof (newPeripheralPin.interfacePin.pinMappings) === "undefined") {
                        newPeripheralPin.interfacePin.pinMappings = [];
                    }
                    newPeripheralPin.interfacePin.pinMappings.push(newPeripheralPin);
                }
                if (newPeripheralPin.pinMappings.length > 0) {
                    numPeripheralPinsPinnedOut++;
                }
            });
            var interfaces = null;
            if (peripheral.interface) {
                interfaces = {};
                interfaces[peripheral.interface.name] = peripheral.interface;
            }
            var newPeripheral = augmentType(peripheral, {
                ioSets: adaptedIoSetGroup
            }, {
                interfaces: interfaces ? interfaces : peripheral.interfaces
            }, ["interface", "ioSetGroups"]);
            peripherals[newPeripheral.name] = newPeripheral;
            _(peripheral.interfaces).each(function (perphInterface) {
                var newPerhInterface = perphInterface;
                newPerhInterface.isConfigurablesOnly = !perphInterface.interfacePins || !_(perphInterface.interfacePins).size();
                if (typeof (newPerhInterface.peripherals) === "undefined") {
                    newPerhInterface.peripherals = [];
                }
                if (numPeripheralPinsPinnedOut > 0 || newPerhInterface.isConfigurablesOnly) {
                    newPerhInterface.peripherals.push(newPeripheral);
                }
            });
        });
        var useCases = {};
        _(deviceInfo.useCases).each(function (useCase) {
            var perphInterface = useCase.interface;
            if (typeof (perphInterface.useCases) === "undefined") {
                perphInterface.useCases = {};
            }
            var useCasePins = {};
            var useCasePinSets = [];
            if (typeof (useCase.useCasePin) != "undefined") {
                useCasePins = toNameMap(useCase.useCasePin);
            }
            if (typeof (useCase.useCasePinSet) != "undefined") {
                _.each(useCase.useCasePinSet, function (useCasePinSet) {
                    var newUseCasePinSet = augmentType(useCasePinSet, {
                        useCasePins: toNameMap(useCasePinSet.useCasePin)
                    }, ["useCasePin"]);
                    useCasePinSets.push(newUseCasePinSet);
                });
            }
            var newUseCase = augmentType(useCase, {
                useCasePins: useCasePins,
                useCasePinSets: useCasePinSets
            }, ["useCasePin", "useCasePinSet"]);
            useCases[newUseCase.name] = newUseCase;
            perphInterface.useCases[newUseCase.name] = newUseCase;
        });
        _(deviceInfo.muxes).each(function (mux) {
            if (mux.devicePin) {
                mux.devicePin.mux = mux;
                delete mux.devicePin;
            }
        });
        _(devicePins).each(function (devicePin) {
            var pci = deviceInfo.pinCommonInfos[devicePin.id];
            if (undefined !== pci) {
                devicePin.controlRegisterOffset = pci.controlRegisterOffset;
                devicePin.pupdStateAfterHHV = pci.pupdStateAfterHHV;
                devicePin.pupdStateAfterHHV;
            }
        });
        var interfaces;
        var powerDomains;
        interfaces = toNameMap(_.values(deviceInfo.interfaces));
        powerDomains = toNameMap(_.values(deviceInfo.powerDomains));
        var gpioBalls = {};
        var isStandardGPIO = false;
        var gpioIface = _.find(interfaces, function (_iface, name) {
            return 0 === name.toUpperCase().search(/GPIO.*/);
        });
        if (gpioIface) {
            isStandardGPIO = (1 === _(gpioIface.interfacePins).size());
            _(gpioIface.peripherals).each(function (peripheral) {
                _(peripheral.peripheralPins).each(function (pin) {
                    var balls = _(pin.pinMappings).chain().pluck("ball").uniq().value();
                    isStandardGPIO = isStandardGPIO && (1 === _(balls).size() && !(balls[0] in gpioBalls));
                    _(balls).each(function (ball) {
                        gpioBalls[ball] = true;
                    });
                });
            });
            if (isStandardGPIO) {
                _(gpioIface.peripherals).each(function (peripheral) {
                    peripheral.isStandardGPIO = true;
                });
            }
            gpioIface.isStandardGPIO = isStandardGPIO;
            gpioIface.gpioBalls = gpioBalls;
        }
        return {
            versions: versions,
            showIOSets: showIOSets,
            showPreferredVoltage: showPreferredVoltage,
            devicePins: devicePins,
            peripherals: peripherals,
            peripheralPins: peripheralPins,
            packageDescription: packageDescription,
            useCases: useCases,
            interfaces: interfaces,
            powerDomains: powerDomains,
            isStandardGPIO: isStandardGPIO,
            templates: null,
        };
    }
    function getAdaptedDeviceDescription(discoveryRoot) {
        var devices = discoveryRoot.devices;
        var renames = {};
        _(devices).each(function (deviceDescription) {
            var packageDescriptionLookup = {};
            _(deviceDescription.package).each(function (pkg) {
                if (pkg.id) {
                    packageDescriptionLookup[pkg.id] = pkg;
                }
            });
            _(deviceDescription.part).each(function (part) {
                if (part.packageDescriptionWrapper) {
                    updateWrapperReferences({
                        packageDescriptions: packageDescriptionLookup
                    }, part, "packageDescriptionWrapper", true);
                }
                else {
                    part.packageDescriptions = deviceDescription.package;
                }
            });
            _(deviceDescription.legacyNames).each(function (legacyName) {
                renames[legacyName] = deviceDescription.name;
            });
        });
        var newDiscoveryRoot = augmentType(discoveryRoot, { renames: renames });
        return newDiscoveryRoot;
    }
    function loadDeviceData(boardId, jsonString, partId, packageId, groupRequirements) {
        var deviceInfoRaw = JSON.parse(jsonString);
        updateIDReferences(deviceInfoRaw, deviceInfoRaw);
        var deviceInfo = deviceInfoRaw;
        var boardDataPromise = (boardId !== "undefined" && typeof (boardId) !== "undefined") ? getBoardInfo(boardId) : q.when();
        return boardDataPromise.then(function (boardInfo) {
            return getAdaptedDeviceInfo(boardInfo, deviceInfo, partId, packageId, groupRequirements);
        });
    }
    function getDeviceData(boardId, deviceId, partId, packageId) {
        var deviceInfo;
        var groupRequirements = {};
        function getInitVersion(response) {
            if (response) {
                var versionObj = JSON.parse(response.data);
                return versionObj.version;
            }
            else {
                return deviceInfo.versions.timestamp;
            }
        }
        return http.get("deviceData/" + deviceId + "/" + deviceId + ".json")
            .then(function (response) {
            return loadDeviceData(boardId, response.data, partId, packageId, groupRequirements);
        }).then(function (newDeviceInfo) {
            deviceInfo = newDeviceInfo;
            deviceInfo.versions.tool = srvSettings.version;
            return http.get("deviceData/" + deviceId + "/" + "version.json");
        })
            .catch(function () {
            return;
        })
            .then(function (response) {
            deviceInfo.versions.data = getInitVersion(response);
        })
            .then(function () {
            return http.get("deviceData/" + deviceId + "/templates/version.json");
        })
            .catch(function () {
            return;
        })
            .then(function (response) {
            deviceInfo.versions.templates = getInitVersion(response);
            return http.get("deviceData/" + deviceId + "/templates/index.json");
        })
            .then(function (response) {
            var data = response.data;
            var templates = JSON.parse(data);
            deviceInfo.templates = {
                fileCategories: [],
                fileListArray: []
            };
            var fileCategories = deviceInfo.templates.fileCategories;
            var fileListArray = deviceInfo.templates.fileListArray;
            var xdtFileReadPromises = [];
            fileCategories.push({
                name: "All",
                value: "all",
                numFiles: 0
            });
            _.each(templates, function (templateFiles, outputType) {
                fileCategories.push({
                    name: outputType,
                    value: outputType,
                    numFiles: _(templateFiles).size()
                });
                _.each(templateFiles, function (templateFile) {
                    var promise = http.get("deviceData/" + deviceId + "/templates/" + templateFile).then(function (response) {
                        var outputFile = templateFile.substring(templateFile.lastIndexOf("/") + 1, templateFile.lastIndexOf("."));
                        fileListArray.push({
                            name: outputFile,
                            category: outputType,
                            template: response.data
                        });
                        fileCategories[0].numFiles++;
                    });
                    xdtFileReadPromises.push(promise);
                });
            });
            return q.all(xdtFileReadPromises).then(function () {
                return {
                    deviceData: deviceInfo,
                    groupRequirements: groupRequirements
                };
            });
        }).catch(function () {
            console.log("No templates loaded!");
            return {
                deviceData: deviceInfo,
                groupRequirements: groupRequirements
            };
        });
    }
    var currentCacheKey = null;
    var cachedPromise = null;
    function initDeviceRequirements(groupRequirements, isBoard) {
        rootScope.deviceRequirements = new Requirement.Device();
        rootScope.deviceRequirements.interfaceRequirementsMap = {};
        rootScope.deviceRequirements.groupRequirements = _.clone(groupRequirements);
        rootScope.deviceRequirements.isBoard = isBoard;
    }
    function getDeviceInfo(boardId, deviceId, partId, packageId) {
        var key = boardId + deviceId + partId + packageId;
        if (key === currentCacheKey) {
            return cachedPromise;
        }
        currentCacheKey = key;
        cachedPromise = getDeviceData(boardId, deviceId, partId, packageId).then(function (params) {
            var isBoard = (boardId !== "undefined" && typeof (boardId) !== "undefined");
            if (rootScope.$emit) {
                rootScope.$emit('onDeviceDisplayNameChanged', isBoard ? boardId : deviceId);
            }
            initDeviceRequirements(params.groupRequirements, isBoard);
            return params.deviceData;
        });
        return cachedPromise;
    }
    exports.getDeviceInfo = getDeviceInfo;
    function clearDeviceInfoCache() {
        currentCacheKey = null;
        cachedPromise = null;
    }
    exports.clearDeviceInfoCache = clearDeviceInfoCache;
    function getBoardInfo(boardId) {
        var boardInfo = {};
        return http.get("boardData/" + boardId + "/base.json").then(function (response) {
            var pinmuxFileData = JSON.parse(response.data);
            boardInfo.base = pinmuxFileData;
            return http.get("boardData/" + boardId + "/headers.json");
        })
            .then(function (response) {
            boardInfo.headers = JSON.parse(response.data);
            return boardInfo;
        });
    }
    exports.getBoardInfo = getBoardInfo;
    function getDeviceDescriptions() {
        return http.get("deviceData/devices.json").then(function (response) {
            var data = JSON.parse(response.data);
            return getAdaptedDeviceDescription(data);
        });
    }
    exports.getDeviceDescriptions = getDeviceDescriptions;
    function getBoardDescriptions() {
        return http.get("boardData/boards.json").then(function (response) {
            return JSON.parse(response.data);
        });
    }
    exports.getBoardDescriptions = getBoardDescriptions;
    function getNumRequirementsAdded() {
        var reqCounter = 0;
        _.each(rootScope.deviceRequirements.interfaceRequirementsMap, function (curInterface) {
            reqCounter += curInterface.requirements.length;
        });
        return reqCounter;
    }
    exports.getNumRequirementsAdded = getNumRequirementsAdded;
    function loadProject(jsonString) {
        var projectData;
        try {
            projectData = JSON.parse(jsonString);
        }
        catch (e) {
            return q.reject("Failed to load project data : Syntax error in the JSON data");
        }
        return getDeviceDescriptions().then(function (data) {
            projectData.deviceId = data.renames[projectData.deviceId] ? data.renames[projectData.deviceId] : projectData.deviceId;
            return getDeviceInfo(projectData.boardId, projectData.deviceId, projectData.partId, projectData.packageId);
        }).then(function (deviceData) {
            rootScope.deviceRequirements = Requirement.Adapt(projectData.deviceRequirements, deviceData.isStandardGPIO);
            rootScope.deviceRequirements.isLoad = true;
            return projectData;
        })
            .catch(function (error) {
            console.log(error.stack);
            throw "Failed to load project data : " + error.message;
        });
    }
    exports.loadProject = loadProject;
});
//# sourceMappingURL=data.js.map