define(["require", "exports", "data", "pinmuxRouteParams", "solver/solver", "pinmuxRootScope", "ui", "analytics", "$filter", "utils", "modals"], function (require, exports, srvDeviceData, $routeParams, srvSolver, $rootScope, ui, srvAnalytics, $filter, util, srvModals) {
    "use strict";
    var deviceData = null;
    var interfaces = null;
    var ConfigVM = (function () {
        function ConfigVM() {
            var _this = this;
            this.displayCurrentErrorWarning = function (category, pinName, text, type) {
                var currentErrorWarning = {
                    category: category,
                    interfaceName: _this.selectedInterface.name,
                    requirementID: _this.selectedRequirement.requirement.id,
                    pinName: pinName,
                    text: text,
                    type: type
                };
                $rootScope.$emit("displayCurrentErrorWarning", currentErrorWarning);
            };
        }
        return ConfigVM;
    }());
    exports.vm = new ConfigVM();
    var cachedDeviceInfo;
    var cachedInit;
    function reset() {
        cachedDeviceInfo = null;
        cachedInit = null;
    }
    exports.reset = reset;
    function init() {
        var deviceInfo = srvDeviceData.getDeviceInfo($routeParams.boardId, $routeParams.deviceId, $routeParams.partId, $routeParams.packageId);
        if (cachedDeviceInfo !== deviceInfo) {
            cachedDeviceInfo = deviceInfo;
            cachedInit = cachedDeviceInfo.then(function (newDeviceData) {
                var deviceRequirements = $rootScope.deviceRequirements;
                return srvSolver.initData(newDeviceData, deviceRequirements).then(function () {
                    var loadErrors = [];
                    deviceData = newDeviceData;
                    var unSortedInterfaces = ui.createInterfaces(deviceData, deviceRequirements, loadErrors);
                    if (!deviceRequirements.isLoad) {
                        $rootScope.onSolve();
                    }
                    var predicate = $rootScope.natural("name");
                    interfaces = $filter("orderBy")(unSortedInterfaces, predicate);
                    var selectedInterface = _.find(interfaces, function (iface) {
                        return iface.name === $routeParams.selectedInterfaceId;
                    });
                    if (!selectedInterface) {
                        selectedInterface = interfaces[0];
                    }
                    var selectedRequirement = selectedInterface.findReqById($routeParams.selectedRequirementId);
                    selectedRequirement = findRequirementToSelectIfNeeded(selectedInterface, selectedRequirement);
                    exports.vm.selectedInterface = selectedInterface;
                    exports.vm.selectedRequirement = selectedRequirement;
                    var temp = _.find(interfaces, function (iface) {
                        return iface.interfaceData.isStandardGPIO;
                    });
                    if (temp && temp instanceof ui.StandardGPIOInterface) {
                        exports.standardGPIOIface = temp;
                    }
                    if (loadErrors.length) {
                        var message = "Unable to load the following requirements due to device data changes. ";
                        message += "Please review your design!.";
                        var detailMsgs = _(loadErrors).map(function (error) {
                            return error.message;
                        });
                        srvModals.message("Errors loading design file", [message], detailMsgs, "error");
                    }
                });
            });
        }
        return cachedInit;
    }
    exports.init = init;
    function findRequirementToSelectIfNeeded(iface, req) {
        if (!req) {
            if (iface.peripheralRequirementsLength() === 0) {
                req = iface.createRequirement();
            }
            else {
                req = iface.peripheralRequirements[0];
            }
        }
        return req;
    }
    function getInterfaces() {
        return interfaces;
    }
    exports.getInterfaces = getInterfaces;
    ;
    function getDeviceData() {
        return deviceData;
    }
    exports.getDeviceData = getDeviceData;
    ;
    function setSelected(iface, req) {
        exports.vm.selectedInterface = iface;
        exports.vm.selectedRequirement = findRequirementToSelectIfNeeded(iface, req);
    }
    exports.setSelected = setSelected;
    ;
    function setSelectedByName(ifaceName, reqId) {
        var foundIface = _.find(interfaces, function (iface) {
            return iface.name === ifaceName;
        });
        if (foundIface) {
            var foundReq = foundIface.findReqById(reqId);
            exports.vm.selectedInterface = foundIface;
            exports.vm.selectedRequirement = findRequirementToSelectIfNeeded(foundIface, foundReq);
        }
    }
    exports.setSelectedByName = setSelectedByName;
    ;
    function addRequirement(iface) {
        var req = iface.addRequirement();
        if (req) {
            srvAnalytics.record("interfaceAdded", {
                "interfaceName": iface.name
            });
            setSelected(iface, req);
            if (req) {
                $rootScope.onSolve();
            }
        }
    }
    exports.addRequirement = addRequirement;
    function removeRequirement(iface, requirement) {
        var newReq = iface.removeRequirement(requirement);
        setSelected(iface, newReq);
        $rootScope.onSolve();
    }
    exports.removeRequirement = removeRequirement;
    function updateSummaries(solutions, incr) {
        _(solutions).each(function (solution) {
            var count = incr ? ++solution.nonSolverErrorCount : --solution.nonSolverErrorCount;
            util.AddNonSolverSummary(solution, count);
        });
    }
    function onConfigurableInvalid(uiRequirement, errorText) {
        addConfigurableError(uiRequirement, errorText);
        $rootScope.$emit('onGenerateConfigErrorWarningList');
    }
    exports.onConfigurableInvalid = onConfigurableInvalid;
    ;
    function addConfigurableError(uiRequirement, errorText) {
        var iface = uiRequirement.parentInterface;
        util.AddErrorToSolution(uiRequirement.requirement.nonSolverSolution, "Validation");
        util.AddErrorDetailsToSolution(uiRequirement.requirement.nonSolverSolution, errorText);
        updateSummaries([uiRequirement.requirement.solution, iface.interfaceRequirement.solution], true);
    }
    exports.addConfigurableError = addConfigurableError;
    function removeConfigurableError(uiRequirement, errorText) {
        var iface = uiRequirement.parentInterface;
        var nonSolverSolution = uiRequirement.requirement.nonSolverSolution;
        util.RemoveErrorDetailsToSolution(nonSolverSolution, errorText);
        if (nonSolverSolution.errorDetailsText.length === 0) {
            util.ClearSolution(nonSolverSolution);
        }
        updateSummaries([uiRequirement.requirement.solution, iface.interfaceRequirement.solution], false);
    }
    exports.removeConfigurableError = removeConfigurableError;
    function onConfigurableValid(uiRequirement, errorText) {
        removeConfigurableError(uiRequirement, errorText);
        $rootScope.$emit('onGenerateConfigErrorWarningList');
    }
    exports.onConfigurableValid = onConfigurableValid;
});
//# sourceMappingURL=config.js.map