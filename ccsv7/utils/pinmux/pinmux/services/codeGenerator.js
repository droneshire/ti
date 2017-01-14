define(["require", "exports", "requirements", "utils"], function (require, exports, Requirement, util) {
    "use strict";
    function isWin() {
        if (typeof process !== "undefined") {
            return /^win/.test(process.platform);
        }
        else {
            return navigator.appVersion.indexOf("Win") !== -1;
        }
    }
    ;
    return (function () {
        function CodeGenerator(deviceRequirements, deviceData, version) {
            var _this = this;
            this.deviceData = deviceData;
            this.version = version;
            this.assignments = [];
            this.assignmentErrors = [];
            this.peripheralConfigurables = [];
            this.peripheralConfigurations = {};
            this.selectedUseCases = {};
            _.each(deviceRequirements.interfaceRequirementsMap, function (interfaceReq, interfaceName) {
                _.each(interfaceReq.requirements, function (peripheralReq) {
                    _this.selectedUseCases[peripheralReq.name] = deviceData.useCases[peripheralReq.selectedUseCase];
                    _this.createPinAssignemntObjs(peripheralReq.pinRequirements, deviceRequirements, interfaceName, peripheralReq);
                });
            });
            _.chain(deviceRequirements.groupRequirements)
                .pluck("requirements")
                .flatten()
                .each(function (requirement) {
                if (requirement.configurables && requirement.peripheralSolution.assignedToName !== "") {
                    var peripheralName = requirement.peripheralSolution.assignedToName;
                    _this.peripheralConfigurations[peripheralName] = requirement.configurables;
                    _this.peripheralConfigurables.push({
                        configurables: requirement.configurables,
                        interfaceName: requirement.interfaceName,
                        peripheral: requirement.peripheralSolution.assignedToName,
                        requirementName: requirement.name,
                    });
                }
            });
        }
        CodeGenerator.prototype.generate = function (templateData) {
            _.templateSettings.evaluate = /%%\{([\s\S]+?)%%\}\r?\n/g;
            templateData = templateData.replace(/^%\n/gm, "");
            templateData = templateData.replace(/^%(?![%\{\}])([\s\S]+?)\n/gm, "%%{$1\n%%}\n");
            _.templateSettings.interpolate = /`([\s\S]+?)`/g;
            var preCompiled = null;
            try {
                preCompiled = _(templateData).template();
                var text = preCompiled({
                    assignmentErrors: this.assignmentErrors,
                    assignments: this.assignments,
                    deviceData: this.deviceData,
                    peripheralConfigurables: this.peripheralConfigurables,
                    peripheralConfigurations: this.peripheralConfigurations,
                    selectedUseCases: this.selectedUseCases,
                    version: this.version,
                });
                text = text.replace(/\r\n/g, "\n");
                if (isWin()) {
                    text = text.replace(/\n/g, "\r\n");
                }
                return text;
            }
            catch (err) {
                if (undefined !== err.source) {
                    console.log("Source:\n" + err.source);
                }
                else if (null !== preCompiled) {
                    console.log("Source:\n" + preCompiled.source);
                }
                throw err;
            }
        };
        CodeGenerator.prototype.createPinAssignemntObjs = function (pinRequirements, deviceRequirements, interfaceName, peripheralReq) {
            var _this = this;
            _.chain(pinRequirements)
                .filter(function (pinReq) { return pinReq.used; })
                .each(function (pinReq) {
                if (!Requirement.isMultiPin(pinReq)) {
                    _this.createAssignmentObj(deviceRequirements, interfaceName, peripheralReq, pinReq);
                }
                else {
                    _this.createPinAssignemntObjs(pinReq.pinRequirements, deviceRequirements, interfaceName, peripheralReq);
                }
            });
        };
        CodeGenerator.prototype.addLegacyConfigurables = function (interfaceName, pinReq, assignment) {
            var interfacePin = _.find(this.deviceData.interfaces[interfaceName].interfacePins, {
                name: pinReq.interfacePinName,
            });
            _.each(interfacePin.configurables, function (configurable) {
                if (util.isLegacy(configurable)) {
                    if (util.isDropDown(configurable)) {
                        var selectedOption_1 = pinReq.configurables[configurable.name];
                        _.each(configurable.options, function (option) {
                            assignment[option.name] = option.name === selectedOption_1.name;
                        });
                    }
                    else if (util.isCheckBox(configurable)) {
                        assignment[configurable.name] = pinReq.configurables[configurable.name];
                    }
                }
            });
        };
        CodeGenerator.prototype.createAssignmentObj = function (deviceRequirements, interfaceName, peripheralReq, pinReq) {
            var warning = pinReq.solution.warningText;
            var configurables = pinReq.configurables;
            if (pinReq.solution.assignedToName !== "") {
                var assignment_1 = {
                    configurables: configurables,
                    devicePin: this.deviceData.devicePins[pinReq.solution.assignedToName],
                    interfaceName: interfaceName,
                    peripheral: this.deviceData.peripherals[peripheralReq.peripheralSolution.assignedToName],
                    peripheralPin: this.deviceData.peripheralPins[pinReq.solution.nameDecoratorText],
                    requirementName: peripheralReq.parentReqName ? peripheralReq.parentReqName : peripheralReq.name,
                    useCase: this.deviceData.useCases[peripheralReq.selectedUseCase].description,
                    warning: warning,
                };
                if (deviceRequirements.powerDomainSettingsEnabled) {
                    assignment_1.powerSetting = deviceRequirements.powerDomainSettings[assignment_1.devicePin.powerDomain.name];
                    assignment_1.requiredVoltageLevel = peripheralReq.voltageSolution.assignedToName;
                }
                if (peripheralReq.peripheralSolution.ioSet) {
                    assignment_1.ioSet = peripheralReq.peripheralSolution.ioSet;
                }
                assignment_1.muxMode = _.find(assignment_1.devicePin.mux.muxSetting, function (muxSetting) { return muxSetting.peripheralPin === assignment_1.peripheralPin; }).mode;
                this.addLegacyConfigurables(interfaceName, pinReq, assignment_1);
                this.assignments.push(assignment_1);
            }
            else if (pinReq.solution.errorText !== "") {
                var assignment = {
                    configurables: configurables,
                    error: pinReq.solution.errorText,
                    warning: warning,
                };
                this.addLegacyConfigurables(interfaceName, pinReq, assignment);
                this.assignmentErrors.push(assignment);
            }
        };
        return CodeGenerator;
    }());
});
//# sourceMappingURL=codeGenerator.js.map