var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "requirements", "utils", "userPreferences", "uiConfigurables"], function (require, exports, Requirement, util, srvUserPrefs, UI_Configurables) {
    "use strict";
    var Selection = (function () {
        function Selection(value) {
            this.value = value;
            this.enabled = true;
        }
        Selection.prototype.isAny = function () {
            return false;
        };
        Selection.prototype.getDisplay = function () {
            return this.value;
        };
        return Selection;
    }());
    exports.Selection = Selection;
    var SelectionWithPeripherals = (function (_super) {
        __extends(SelectionWithPeripherals, _super);
        function SelectionWithPeripherals(name, peripheralNames) {
            _super.call(this, name);
            this.peripheralNames = peripheralNames;
        }
        SelectionWithPeripherals.prototype.peripheralChanged = function (peripheralNames) {
            this.enabled = false;
            for (var i = 0; i < this.peripheralNames.length; i++) {
                var parenetPeripheralName = this.peripheralNames[i];
                for (var k = 0; k < peripheralNames.length; k++) {
                    var peripheralName = peripheralNames[k];
                    this.enabled = (parenetPeripheralName == peripheralName) || (peripheralName == util.Const.ANY) || (this.value == util.Const.ANY);
                    if (this.enabled)
                        break;
                }
                if (this.enabled)
                    break;
            }
        };
        return SelectionWithPeripherals;
    }(Selection));
    var DevicePinSelection = (function (_super) {
        __extends(DevicePinSelection, _super);
        function DevicePinSelection(devicePin, peripheralNames) {
            _super.call(this, devicePin.name, peripheralNames);
            this.devicePin = devicePin;
        }
        DevicePinSelection.prototype.getDisplay = function () {
            var _this = this;
            var displayProps = srvUserPrefs.get("devicePinDisplayName").getValue();
            var val = _.map(displayProps, function (prop) {
                return _this.devicePin[prop];
            }).join("/");
            return val;
        };
        return DevicePinSelection;
    }(SelectionWithPeripherals));
    var PeripheralSelection = (function (_super) {
        __extends(PeripheralSelection, _super);
        function PeripheralSelection(peripheralName) {
            _super.call(this, peripheralName, [peripheralName]);
        }
        return PeripheralSelection;
    }(SelectionWithPeripherals));
    var VoltageSelection = (function (_super) {
        __extends(VoltageSelection, _super);
        function VoltageSelection(voltageValue) {
            _super.call(this, voltageValue);
        }
        return VoltageSelection;
    }(Selection));
    var UseCaseSelection = (function (_super) {
        __extends(UseCaseSelection, _super);
        function UseCaseSelection(name, description) {
            _super.call(this, name);
            this.description = description;
        }
        UseCaseSelection.prototype.getDisplay = function () {
            return this.description;
        };
        return UseCaseSelection;
    }(Selection));
    var MultiPinCountSelection = (function (_super) {
        __extends(MultiPinCountSelection, _super);
        function MultiPinCountSelection(count) {
            _super.call(this, count.toString());
        }
        return MultiPinCountSelection;
    }(Selection));
    var AnySelection = (function (_super) {
        __extends(AnySelection, _super);
        function AnySelection(requirement) {
            _super.call(this, util.Const.ANY);
            this.requirement = requirement;
        }
        AnySelection.prototype.isAny = function () {
            return true;
        };
        AnySelection.prototype.getDecorated = function (base, decorator) {
            var decorated = base;
            if (decorator && decorator !== "") {
                decorated += "(" + decorator + ")";
            }
            return decorated;
        };
        return AnySelection;
    }(Selection));
    var VoltageAnySelection = (function (_super) {
        __extends(VoltageAnySelection, _super);
        function VoltageAnySelection(requirement) {
            _super.call(this, requirement);
        }
        VoltageAnySelection.prototype.getDisplay = function () {
            return this.getDecorated(this.value, this.requirement.voltageSolution.assignedToName);
        };
        return VoltageAnySelection;
    }(AnySelection));
    var PeripheralAnySelection = (function (_super) {
        __extends(PeripheralAnySelection, _super);
        function PeripheralAnySelection(requirement) {
            _super.call(this, requirement);
        }
        PeripheralAnySelection.prototype.getDisplay = function () {
            return this.getDecorated(this.value, this.requirement.peripheralSolution.assignedToName);
        };
        return PeripheralAnySelection;
    }(AnySelection));
    var DevicePinAnySelection = (function (_super) {
        __extends(DevicePinAnySelection, _super);
        function DevicePinAnySelection(requirement, devicePinSelections) {
            _super.call(this, requirement);
            this.devicePinSelections = devicePinSelections;
        }
        DevicePinAnySelection.prototype.getDisplay = function () {
            var solution = this.requirement.solution;
            var foundSelection = _.find(this.devicePinSelections, function (devicePinSelection) {
                return devicePinSelection.value === solution.assignedToName;
            });
            var decorator = foundSelection ? foundSelection.getDisplay() : "";
            return this.getDecorated(this.value, decorator);
        };
        return DevicePinAnySelection;
    }(AnySelection));
    function createInterfaces(deviceData, deviceRequirements, loadErrors) {
        var uiInterfaces = [];
        var isLoad = deviceRequirements.isLoad || deviceRequirements.isBoard;
        _.each(deviceData.interfaces, function (interfaceData) {
            var uiInterface;
            if (interfaceData.isStandardGPIO) {
                var groupRequirement = deviceRequirements.groupRequirements[interfaceData.name];
                if (!groupRequirement) {
                    groupRequirement = new Requirement.GPIOGroup(interfaceData.name);
                    deviceRequirements.groupRequirements[interfaceData.name] = groupRequirement;
                }
                var flatInterfaceRequirement = new Requirement.Group(interfaceData.name);
                deviceRequirements.interfaceRequirementsMap[interfaceData.name] = flatInterfaceRequirement;
                uiInterface = new StandardGPIOInterface(interfaceData, flatInterfaceRequirement, groupRequirement, isLoad);
            }
            else {
                var groupRequirement = deviceRequirements.groupRequirements[interfaceData.name];
                if (!groupRequirement) {
                    groupRequirement = new Requirement.Group(interfaceData.name);
                    deviceRequirements.groupRequirements[interfaceData.name] = groupRequirement;
                }
                var interfaceRequirement = groupRequirement;
                deviceRequirements.interfaceRequirementsMap[interfaceData.name] = interfaceRequirement;
                uiInterface = new Interface(interfaceData, interfaceRequirement, isLoad, loadErrors);
            }
            uiInterfaces.push(uiInterface);
        });
        return uiInterfaces;
    }
    exports.createInterfaces = createInterfaces;
    ;
    function initDefaultPeripheralRequirments(uiInterface) {
        var iface = uiInterface.interfaceData;
        _.each(iface.peripherals, function (peripheral) {
            if (peripheral.default) {
                var uiReq = uiInterface.addRequirement();
                uiReq.requirement.assignedToName = peripheral.name;
                uiReq.requirement.removable = peripheral.removable;
            }
        });
    }
    function createPeripheralRequirement(parentInterface, requirementID, parentRequirementID, parentRequirementName) {
        var req = new Requirement.Peripheral(requirementID, parentInterface.name, parentRequirementID, parentRequirementName);
        var uiReq = new PeripheralRequirement(parentInterface, req, false);
        return uiReq;
    }
    function findAndRemovePeripheralRequirement(iface, uiRequirement) {
        var removeIndex = -1;
        for (var i = 0; i < iface.peripheralRequirements.length; i++) {
            if (uiRequirement === iface.peripheralRequirements[i]) {
                removeIndex = i;
                break;
            }
        }
        iface.peripheralRequirements.splice(removeIndex, 1);
        return removeIndex;
    }
    ;
    function findToSelectAfterRemove(iface, removeIndex) {
        var toSelect;
        if (iface.peripheralRequirementsLength() > 0) {
            var index = removeIndex === 0 ? 0 : removeIndex - 1;
            toSelect = iface.peripheralRequirements[index];
        }
        return toSelect;
    }
    ;
    function findReqById(iface, reqId) {
        var foundReq = _.find(iface.peripheralRequirements, function (req) {
            return req.requirement.id === reqId;
        });
        return foundReq;
    }
    var Interface = (function () {
        function Interface(interfaceData, interfaceRequirement, isLoad, loadErrors) {
            var _this = this;
            this.interfaceData = interfaceData;
            this.interfaceRequirement = interfaceRequirement;
            this.maxAllowed = 0;
            this.peripheralRequirements = [];
            this.uiHeaderConfigurables = {};
            this.interfaceData = interfaceData;
            if (this.interfaceData.peripherals !== undefined) {
                this.maxAllowed = this.interfaceData.peripherals.length;
            }
            this.name = interfaceData.name;
            var reqsToRemove = [];
            _.each(this.interfaceRequirement.requirements, function (req) {
                try {
                    var uiPeripheralReq = new PeripheralRequirement(_this, req, isLoad);
                    _this.peripheralRequirements.push(uiPeripheralReq);
                }
                catch (error) {
                    if (isLoad) {
                        reqsToRemove.push(req);
                        loadErrors.push(error);
                    }
                }
            });
            this.interfaceRequirement.requirements = _.difference(this.interfaceRequirement.requirements, reqsToRemove);
            if (!isLoad) {
                initDefaultPeripheralRequirments(this);
            }
        }
        ;
        Interface.prototype.addRequirement = function () {
            if (this.interfaceRequirement.requirements.length == this.maxAllowed)
                return null;
            var uiReq = this.createRequirement();
            this.peripheralRequirements.push(uiReq);
            this.interfaceRequirement.requirements.push(uiReq.requirement);
            this.interfaceRequirement.requirementsNameIndex++;
            return uiReq;
        };
        Interface.prototype.createRequirement = function () {
            var requirementName = "My" + this.interfaceData.name;
            requirementName = requirementName.concat(this.interfaceRequirement.requirementsNameIndex.toString());
            return createPeripheralRequirement(this, requirementName);
        };
        Interface.prototype.removeRequirement = function (uiRequirement) {
            if (this.peripheralRequirements.length === 0 || (!uiRequirement || !uiRequirement.isRemovable()))
                return null;
            var removeIndex = findAndRemovePeripheralRequirement(this, uiRequirement);
            var removed = this.interfaceRequirement.requirements.splice(removeIndex, 1);
            if (removed.length > 0) {
                var solution = this.interfaceRequirement.solution;
                var numRemoved = removed[0].nonSolverSolution.errorDetailsText.length;
                var nonSolverErrorCount = solution.nonSolverErrorCount - numRemoved;
                util.AddNonSolverSummary(solution, nonSolverErrorCount);
            }
            return findToSelectAfterRemove(this, removeIndex);
        };
        Interface.prototype.peripheralRequirementsLength = function () {
            return this.peripheralRequirements.length;
        };
        Interface.prototype.findReqById = function (id) {
            return findReqById(this, id);
        };
        return Interface;
    }());
    exports.Interface = Interface;
    function initGPIOHeaderItems(uiGPIOPeripheralReq) {
        _(uiGPIOPeripheralReq.singlePinRequirements).each(function (uiPinReq) {
            addHeaderItem(uiGPIOPeripheralReq, uiPinReq, uiGPIOPeripheralReq.requirement);
        });
    }
    ;
    var StandardGPIOInterface = (function () {
        function StandardGPIOInterface(interfaceData, interfaceRequirement, groupRequirement, isLoad) {
            var _this = this;
            this.interfaceData = interfaceData;
            this.interfaceRequirement = interfaceRequirement;
            this.groupRequirement = groupRequirement;
            this.maxAllowed = 0;
            this.peripheralRequirements = [];
            if (this.interfaceData.peripherals !== undefined) {
                this.maxAllowed = this.interfaceData.peripherals.length;
            }
            this.name = interfaceData.name;
            this.interfaceRequirement.solution = this.groupRequirement.solution;
            this.multiPeripheralRequirements = this.groupRequirement.requirements;
            this.peripheralRequirements = [];
            _.each(this.multiPeripheralRequirements, function (multiPeripheralRequirement) {
                var uiPeripheralReq = new StandardGPIOPeripheraRequirement(_this, multiPeripheralRequirement, isLoad);
                _this.peripheralRequirements.push(uiPeripheralReq);
            });
        }
        StandardGPIOInterface.prototype.addRequirement = function () {
            var uiReq = this.createRequirement();
            this.peripheralRequirements.push(uiReq);
            _(uiReq.peripheralRequirements).each(function (peripheralRequirement) {
                uiReq.addPeripheralRequirement(peripheralRequirement.requirement);
            });
            this.groupRequirement.requirements.push(uiReq.requirement);
            this.groupRequirement.requirementsNameIndex++;
            return uiReq;
        };
        StandardGPIOInterface.prototype.peripheralRequirementsLength = function () {
            var toRet = _.reduce(this.peripheralRequirements, function (prevVal, curVal) {
                return prevVal + curVal.peripheralRequirements.length;
            }, 0);
            return toRet;
        };
        StandardGPIOInterface.prototype.createRequirement = function () {
            var requirementName = "My" + this.interfaceData.name;
            requirementName = requirementName.concat(this.groupRequirement.requirementsNameIndex.toString());
            var req = new Requirement.Group(requirementName);
            var uiReq = new StandardGPIOPeripheraRequirement(this, req, false);
            return uiReq;
        };
        ;
        StandardGPIOInterface.prototype.removeRequirement = function (uiRequirement) {
            if (this.peripheralRequirements.length === 0 || (!uiRequirement || !uiRequirement.isRemovable()))
                return null;
            var removeIndex = findAndRemovePeripheralRequirement(this, uiRequirement);
            var groupRequirementRemoveIndex = _.findIndex(this.groupRequirement.requirements, function (requirement) {
                return requirement === uiRequirement.requirement;
            });
            var removedGroupRequirement = this.groupRequirement.requirements.splice(groupRequirementRemoveIndex, 1)[0];
            this.interfaceRequirement.requirements = _.without.apply(_, [this.interfaceRequirement.requirements].concat(removedGroupRequirement.requirements));
            return findToSelectAfterRemove(this, removeIndex);
        };
        StandardGPIOInterface.prototype.findReqById = function (id) {
            return findReqById(this, id);
        };
        return StandardGPIOInterface;
    }());
    exports.StandardGPIOInterface = StandardGPIOInterface;
    function setUpUseCaseSelections(peripheralRequirement) {
        var selections = [];
        _.each(peripheralRequirement.parentInterface.interfaceData.useCases, function (useCase) {
            var useCaseSelection = new UseCaseSelection(useCase.name, useCase.description);
            selections.push(useCaseSelection);
            if (peripheralRequirement instanceof PeripheralRequirement) {
                if (useCase.name == peripheralRequirement.requirement.selectedUseCase) {
                    peripheralRequirement.useCaseSelection = useCaseSelection;
                }
            }
        });
        peripheralRequirement.useCaseSelections = _(selections).sortBy('description');
    }
    var NOPSelectionFilter = (function () {
        function NOPSelectionFilter() {
        }
        NOPSelectionFilter.prototype.changePeripheral = function (_selection) { };
        ;
        return NOPSelectionFilter;
    }());
    var StandardGPIOPeripheraRequirement = (function () {
        function StandardGPIOPeripheraRequirement(parentInterface, requirement, isLoad) {
            var _this = this;
            this.parentInterface = parentInterface;
            this.requirement = requirement;
            this.peripheralRequirements = [];
            this.singlePinRequirements = [];
            this.peripheralSelectionFilter = new NOPSelectionFilter();
            this.useCaseSelections = [];
            this.uiHeaderConfigurables = {};
            if (!this.requirement.numOfGPIOPins) {
                this.requirement.numOfGPIOPins = 1;
                var peripheralRequirement = createPeripheralRequirement(this.parentInterface, Requirement.uniqueInternalReqName(this.requirement), this.requirement.id, this.requirement.name);
                this.addUIPeripheralRequirement(peripheralRequirement);
                initGPIOHeaderItems(this);
            }
            _.each(this.requirement.requirements, function (req) {
                var uiPeripheralReq = new PeripheralRequirement(_this.parentInterface, req, isLoad);
                _this.addUIPeripheralRequirement(uiPeripheralReq);
                _this.parentInterface.interfaceRequirement.requirements.push(req);
                initGPIOHeaderItems(_this);
            });
            setUpUseCaseSelections(this);
        }
        StandardGPIOPeripheraRequirement.prototype.isRemovable = function () {
            return true;
        };
        StandardGPIOPeripheraRequirement.prototype.addUIPeripheralRequirement = function (uiPeripheralRequirement) {
            this.peripheralRequirements.push(uiPeripheralRequirement);
            this.singlePinRequirements = this.singlePinRequirements.concat(uiPeripheralRequirement.singlePinRequirements);
        };
        ;
        StandardGPIOPeripheraRequirement.prototype.addPeripheralRequirement = function (peripheralRequirement) {
            this.parentInterface.interfaceRequirement.requirements.push(peripheralRequirement);
            this.requirement.requirements.push(peripheralRequirement);
        };
        ;
        StandardGPIOPeripheraRequirement.prototype.addGPIOPins = function (numOfGPIOPinsToAdd) {
            for (var i = 0; i < numOfGPIOPinsToAdd; i++) {
                var peripheralRequirement = createPeripheralRequirement(this.parentInterface, Requirement.uniqueInternalReqName(this.requirement), this.requirement.id, this.requirement.name);
                this.addUIPeripheralRequirement(peripheralRequirement);
                this.addPeripheralRequirement(peripheralRequirement.requirement);
            }
        };
        ;
        StandardGPIOPeripheraRequirement.prototype.removeGPIOPins = function (numOfGPIOPinsToRemove) {
            var removeIndex = (-numOfGPIOPinsToRemove);
            var removedPeripheralRequirements = this.peripheralRequirements.splice(removeIndex, numOfGPIOPinsToRemove);
            var pinRequirementsToRemove = [];
            var peripheralReqsToRemove = [];
            _.each(removedPeripheralRequirements, function (uiPeripheralReq) {
                pinRequirementsToRemove = pinRequirementsToRemove.concat(uiPeripheralReq.singlePinRequirements);
                peripheralReqsToRemove = peripheralReqsToRemove.concat(uiPeripheralReq.requirement);
            });
            this.singlePinRequirements = _.without.apply(_, [this.singlePinRequirements].concat(pinRequirementsToRemove));
            var newRequirements = _.without.apply(_, [this.parentInterface.interfaceRequirement.requirements].concat(peripheralReqsToRemove));
            this.parentInterface.interfaceRequirement.requirements = newRequirements;
            newRequirements = _.without.apply(_, [this.requirement.requirements].concat(peripheralReqsToRemove));
            this.requirement.requirements = newRequirements;
        };
        StandardGPIOPeripheraRequirement.prototype.numOfGPIOPinsApply = function () {
            var currentllyUsedExcludingThisRequirement = this.parentInterface.peripheralRequirementsLength() - this.peripheralRequirements.length;
            var gpiosAvailable = this.parentInterface.maxAllowed - currentllyUsedExcludingThisRequirement;
            if (this.requirement.numOfGPIOPins > gpiosAvailable) {
                throw new Error("Not enough GPIO pins available. Max available is " + gpiosAvailable);
            }
            if (this.requirement.numOfGPIOPins === this.peripheralRequirements.length) {
                throw new Error("No change in the number of GPIO pins requested");
            }
            if (this.requirement.numOfGPIOPins > this.peripheralRequirements.length) {
                this.addGPIOPins(this.requirement.numOfGPIOPins - this.peripheralRequirements.length);
            }
            else {
                this.removeGPIOPins(this.peripheralRequirements.length - this.requirement.numOfGPIOPins);
            }
            initGPIOHeaderItems(this);
        };
        ;
        StandardGPIOPeripheraRequirement.prototype.useCaseChanged = function (_arg) {
            if (_arg === void 0) { _arg = false; }
        };
        StandardGPIOPeripheraRequirement.prototype.applySelectAll = function () {
            var _this = this;
            _.each(this.peripheralRequirements, function (peripheralRequirement) {
                peripheralRequirement.selectAll = _this.selectAll;
                peripheralRequirement.applySelectAll();
            });
        };
        return StandardGPIOPeripheraRequirement;
    }());
    exports.StandardGPIOPeripheraRequirement = StandardGPIOPeripheraRequirement;
    function createPeripheralSelectionGroup(perphReq) {
        var selectionGroup = new PeripheralRequirement.SelectionGroup(perphReq);
        _(perphReq.peripheralSelections).each(function (peripheralSelection) {
            selectionGroup.addSelection(peripheralSelection);
            if (perphReq.requirement.selectedInstance === peripheralSelection.value) {
                perphReq.peripheralSelection = peripheralSelection;
                perphReq.peripheralSelectionFilter.setOverride(perphReq.peripheralSelection);
            }
        });
        return selectionGroup;
    }
    function addHeaderItem(uiPeripheralRequirement, uiPinRequirement, requirement) {
        var headerItems = uiPeripheralRequirement.uiHeaderConfigurables;
        requirement.pinConfigurablesHeader = requirement.pinConfigurablesHeader || {};
        var model = requirement.pinConfigurablesHeader;
        _(uiPinRequirement.uiConfigurables).each(function (uiConfigurable) {
            var name = uiConfigurable.configurable.name;
            var headerItem = headerItems[name];
            if (!headerItem) {
                var headerConfigurable = _.clone(uiConfigurable.configurable);
                headerItem = new UI_Configurables.ConfigurableHeader(model, headerConfigurable);
                headerItems[name] = headerItem;
            }
            headerItem.childUIConfigurables.push(uiConfigurable);
        });
    }
    var PeripheralRequirement = (function () {
        function PeripheralRequirement(parentInterface, requirement, isLoad) {
            this.parentInterface = parentInterface;
            this.requirement = requirement;
            this.singlePinRequirements = [];
            this.multiPinRequirement = null;
            this.peripheralSelections = [];
            this.voltageSelections = [];
            this.useCaseSelections = [];
            this.useCaseSelection = null;
            this.peripheralSelection = null;
            this.voltageSelection = null;
            this.reverseSort = false;
            this.uiHeaderConfigurables = {};
            this.selectAll = true;
            this.peripheralSelectionFilter = null;
            if (!this.requirement.nonSolverSolution) {
                this.requirement.nonSolverSolution = new Requirement.Solution();
            }
            this.anyVoltageSelection = new VoltageAnySelection(requirement);
            this.anyPeripheralSelection = new PeripheralAnySelection(requirement);
            this.peripheralSelections.push(this.anyPeripheralSelection);
            this.voltageSelections.push(this.anyVoltageSelection);
            this.setUpSelections();
            this.useCaseChanged(isLoad);
            if (typeof this.requirement.isNameInvalid === "undefined") {
                this.requirement.isNameValid = true;
            }
        }
        PeripheralRequirement.prototype.isRemovable = function () {
            return _.isUndefined(this.requirement.removable) || this.requirement.removable;
        };
        ;
        PeripheralRequirement.prototype.setUpSelections = function () {
            var _this = this;
            var peripherals = this.parentInterface.interfaceData.peripherals;
            var addPowerDomainValues = {};
            _.each(peripherals, function (perph) {
                var peripheralSelection = new PeripheralSelection(perph.name);
                _this.peripheralSelections.push(peripheralSelection);
                if (_this.requirement.selectedInstance === perph.name) {
                    _this.peripheralSelection = peripheralSelection;
                }
                _.each(perph.peripheralPins, function (peripheralPin) {
                    _.each(peripheralPin.pinMappings, function (devicePin) {
                        if (devicePin.powerDomain && devicePin.powerDomain.powerValue) {
                            _.each(devicePin.powerDomain.powerValue, function (powerValue) {
                                if (powerValue && powerValue !== "" && !addPowerDomainValues[powerValue]) {
                                    addPowerDomainValues[powerValue] = powerValue;
                                    var voltageSelection = new VoltageSelection(powerValue);
                                    _this.voltageSelections.push(voltageSelection);
                                    if (_this.requirement.selectedVoltage == powerValue) {
                                        _this.voltageSelection = voltageSelection;
                                    }
                                }
                            });
                        }
                    });
                });
            });
            if (!this.peripheralSelection) {
                this.peripheralSelection = this.anyPeripheralSelection;
            }
            if (!this.voltageSelection) {
                this.voltageSelection = this.anyVoltageSelection;
            }
            if (!this.requirement.selectedUseCase) {
                this.requirement.selectedUseCase = this.parentInterface.interfaceData.name + "_0";
            }
            setUpUseCaseSelections(this);
            if (!this.useCaseSelection)
                this.useCaseSelection = this.useCaseSelections[0];
        };
        PeripheralRequirement.prototype.loadError = function (message) {
            return new Error(this.parentInterface.name + "/" + this.requirement.name + " : " + message);
        };
        PeripheralRequirement.prototype.useCaseChanged = function (isLoad) {
            var _this = this;
            if (isLoad === void 0) { isLoad = false; }
            var selectedUseCase = this.parentInterface.interfaceData.useCases[this.useCaseSelection.value];
            if (!selectedUseCase)
                throw this.loadError("Use case " + this.useCaseSelection.value + " not found");
            if (!_.isEqual(this.requirement.selectedUseCase, selectedUseCase.name) || this.requirement.pinRequirements.length === 0) {
                this.requirement.selectedUseCase = selectedUseCase.name;
                this.requirement.pinRequirements = [];
                _.each(selectedUseCase.useCasePins, function (useCasePin) {
                    var pinReq = new Requirement.Pin(useCasePin);
                    _this.requirement.pinRequirements.push(pinReq);
                });
                if (selectedUseCase.useCasePinSets.length > 1) {
                    console.log("TODO: UI does not support multiple pin sets");
                }
                _.each(selectedUseCase.useCasePinSets, function (useCasePinSet) {
                    var multiPinChildRequirements = [];
                    _.each(useCasePinSet.useCasePins, function (useCasePin) {
                        var pinReq = new Requirement.Pin(useCasePin);
                        multiPinChildRequirements.push(pinReq);
                    });
                    var multiPinReq = new Requirement.MultiPin(useCasePinSet.defaultCount, multiPinChildRequirements);
                    _this.requirement.pinRequirements.push(multiPinReq);
                });
            }
            this.initUIPins(isLoad);
        };
        ;
        PeripheralRequirement.prototype.applySelectAll = function () {
            var _this = this;
            _.each(this.singlePinRequirements, function (req) {
                req.setUsed(_this.selectAll);
            });
        };
        PeripheralRequirement.prototype.initUIPins = function (isLoad) {
            var _this = this;
            this.multiPinRequirement = null;
            this.singlePinRequirements = [];
            this.uiHeaderConfigurables = {};
            this.peripheralSelectionFilter = new PeripheralRequirement.SelectionFilter();
            var useCase = this.parentInterface.interfaceData.useCases[this.requirement.selectedUseCase];
            _.each(this.requirement.pinRequirements, function (pinRequirement) {
                if (!Requirement.isMultiPin(pinRequirement)) {
                    var useCasePin = useCase.useCasePins[pinRequirement.name];
                    if (!useCasePin) {
                        throw _this.loadError("Can't find pin  " + pinRequirement.name + " of " + useCase.description);
                    }
                    var uiPinReq = new PinRequirement(useCasePin, pinRequirement, _this.peripheralSelectionFilter, isLoad);
                    addHeaderItem(_this, uiPinReq, _this.requirement);
                    _this.singlePinRequirements.push(uiPinReq);
                }
                else {
                    var multiPinChildRequirements = pinRequirement.pinRequirements;
                    var uiMultiPinChildRequirements_1 = [];
                    _.each(multiPinChildRequirements, function (childPinReq) {
                        var useCasePin = useCase.useCasePinSets[0].useCasePins[childPinReq.name];
                        if (!useCasePin) {
                            throw _this.loadError("Can't find use case pin  " + childPinReq.name + " of " + useCase.description);
                        }
                        var uiPinReq = new PinRequirement(useCasePin, childPinReq, _this.peripheralSelectionFilter, isLoad);
                        addHeaderItem(_this, uiPinReq, _this.requirement);
                        uiMultiPinChildRequirements_1.push(uiPinReq);
                    });
                    var uiMultiPinReq = new MultiPinRequirement(pinRequirement, uiMultiPinChildRequirements_1);
                    _this.multiPinRequirement = uiMultiPinReq;
                }
            });
            var selectionGroup = createPeripheralSelectionGroup(this);
            this.peripheralSelectionFilter.addSelectionGroup(selectionGroup);
            this.peripheralSelectionFilter.notifySelectionGroups();
            this.uiConfigurables = UI_Configurables.createUIConfigurables(this.requirement, this.parentInterface.interfaceData.configurables, useCase.configurables, isLoad);
        };
        PeripheralRequirement.prototype.isOverridden = function () {
            return !this.peripheralSelection.isAny();
        };
        return PeripheralRequirement;
    }());
    exports.PeripheralRequirement = PeripheralRequirement;
    var PinRequirement = (function () {
        function PinRequirement(useCasePin, requirement, peripheralSelectionFilter, isLoad) {
            this.requirement = requirement;
            this.peripheralSelectionFilter = peripheralSelectionFilter;
            this.devicePinSelections = [];
            this.devicePinSelection = null;
            this.anyDevicePinSelection = null;
            var interfacePin = useCasePin.interfacePin;
            this.sortKey = useCasePin.interfacePin.name;
            this.requirement = requirement;
            this.devicePinSelections = [];
            this.devicePinSelection = null;
            this.anyDevicePinSelection = null;
            if (!isLoad) {
                this.requirement.used = !(useCasePin.optional);
            }
            this.uiConfigurables = UI_Configurables.createUIConfigurables(requirement, interfacePin.configurables, useCasePin.configurables, isLoad);
            this.setUpPinSelections(interfacePin);
        }
        PinRequirement.prototype.setUsed = function (value) {
            this.requirement.used = value;
            if (!this.requirement.used) {
                util.ClearSolution(this.requirement.solution);
            }
        };
        PinRequirement.prototype.isOverridden = function () {
            return !this.devicePinSelection.isAny();
        };
        PinRequirement.prototype.getDisplayName = function () {
            var displayName = this.requirement.name;
            if (this.requirement.solution.nameDecoratorText !== "") {
                displayName = displayName + "(" + this.requirement.solution.nameDecoratorText + ")";
            }
            return displayName;
        };
        PinRequirement.prototype.setUpPinSelections = function (interfacePin) {
            var _this = this;
            var devicePinSelections = {};
            var peripheralPins = interfacePin.pinMappings;
            var selectionGroup = new PeripheralRequirement.SelectionGroup(this);
            if (peripheralPins) {
                this.peripheralSelectionFilter.addSelectionGroup(selectionGroup);
                _.each(peripheralPins, function (peripheralPin) {
                    if (peripheralPin.pinMappings) {
                        _(peripheralPin.pinMappings).each(function (devicePin) {
                            var devicePinName = devicePin.name;
                            if (!devicePinSelections[devicePinName]) {
                                var devicePinSelection = new DevicePinSelection(devicePin, [peripheralPin.peripheralName]);
                                _this.devicePinSelections.push(devicePinSelection);
                                selectionGroup.addSelection(devicePinSelection);
                                devicePinSelections[devicePinName] = devicePinSelection;
                            }
                            else {
                                devicePinSelections[devicePinName].peripheralNames.push(peripheralPin.peripheralName);
                            }
                        });
                    }
                });
            }
            _.each(devicePinSelections, function (devicePinSelection) {
                if (devicePinSelection.value == _this.requirement.assignedToName) {
                    _this.devicePinSelection = devicePinSelection;
                    _this.peripheralSelectionFilter.setOverride(_this.devicePinSelection);
                }
            });
            this.anyDevicePinSelection = new DevicePinAnySelection(this.requirement, this.devicePinSelections);
            selectionGroup.addSelection(this.anyDevicePinSelection);
            this.devicePinSelections.push(this.anyDevicePinSelection);
            if (!this.devicePinSelection) {
                this.devicePinSelection = this.anyDevicePinSelection;
            }
        };
        return PinRequirement;
    }());
    exports.PinRequirement = PinRequirement;
    var MultiPinRequirement = (function () {
        function MultiPinRequirement(requirement, pinRequirements) {
            this.requirement = requirement;
            this.pinRequirements = pinRequirements;
            this.multiPinCountSelections = [];
            this.multiPinCountSelection = null;
            this.setUpSelections();
            this.selectAll = this.requirement.used;
        }
        MultiPinRequirement.prototype.applyCount = function () {
            this.requirement.count = Number(this.multiPinCountSelection.value);
        };
        MultiPinRequirement.prototype.applySelectAll = function () {
            var _this = this;
            this.requirement.used = this.selectAll;
            _.each(this.pinRequirements, function (req) {
                req.setUsed(_this.selectAll);
            });
        };
        MultiPinRequirement.prototype.setUpSelections = function () {
            var index = this.requirement.defaultCount;
            var endIndex = this.requirement.pinRequirements.length;
            for (; index <= endIndex; index++) {
                var selection = new MultiPinCountSelection(index);
                this.multiPinCountSelections.push(selection);
                if (index === this.requirement.count) {
                    this.multiPinCountSelection = selection;
                }
            }
        };
        return MultiPinRequirement;
    }());
    exports.MultiPinRequirement = MultiPinRequirement;
    var PeripheralRequirement;
    (function (PeripheralRequirement) {
        function isAnySelection(selection) {
            return selection.isAny == selection.isAny();
        }
        var SelectionFilter = (function () {
            function SelectionFilter() {
                this.peripheralNames = [util.Const.ANY];
                this.selectionGroups = [];
                this.overriddenSelections = {};
                this.numOfOverrides = 0;
            }
            SelectionFilter.prototype.changePeripheral = function (selection) {
                this.setOverride(selection);
                this.notifySelectionGroups();
            };
            SelectionFilter.prototype.setOverride = function (selection) {
                var _this = this;
                if (selection.isAny()) {
                    delete this.overriddenSelections[selection.groupID];
                }
                else {
                    this.overriddenSelections[selection.groupID] = selection;
                }
                this.numOfOverrides = _(this.overriddenSelections).size();
                if (this.numOfOverrides === 0) {
                    this.peripheralNames = [util.Const.ANY];
                    return;
                }
                this.peripheralNames = [];
                var peripheralNames = {};
                _.each(this.overriddenSelections, function (overriddenSelection) {
                    if (!isAnySelection(overriddenSelection)) {
                        _.each(overriddenSelection.peripheralNames, function (peripheralName) {
                            peripheralNames[peripheralName] = peripheralName;
                        });
                    }
                });
                _.each(peripheralNames, function (peripheralName) {
                    var isPeripheralNameInAllSelections = false;
                    for (var key in _this.overriddenSelections) {
                        var isPeripheralInSelection = false;
                        var overriddenSelection = _this.overriddenSelections[key];
                        if (!isAnySelection(overriddenSelection)) {
                            for (var i = 0; i < overriddenSelection.peripheralNames.length; i++) {
                                if (peripheralName == overriddenSelection.peripheralNames[i]) {
                                    isPeripheralInSelection = true;
                                    break;
                                }
                            }
                        }
                        isPeripheralNameInAllSelections = isPeripheralInSelection;
                        if (!isPeripheralNameInAllSelections)
                            break;
                    }
                    if (isPeripheralNameInAllSelections) {
                        _this.peripheralNames.push(peripheralName);
                    }
                });
                ;
            };
            SelectionFilter.prototype.notifySelectionGroups = function () {
                var _this = this;
                _.each(this.selectionGroups, function (selectionGroup) {
                    selectionGroup.peripheralChanged(_this.peripheralNames, _this.numOfOverrides);
                });
            };
            ;
            SelectionFilter.prototype.addSelectionGroup = function (addSelectionGroup) {
                this.selectionGroups.push(addSelectionGroup);
            };
            return SelectionFilter;
        }());
        PeripheralRequirement.SelectionFilter = SelectionFilter;
        var SelectionGroup = (function () {
            function SelectionGroup(parentReq) {
                this.parentReq = parentReq;
                this.selections = [];
                this.groupID = SelectionGroup.groupID++;
            }
            SelectionGroup.prototype.addSelection = function (selection) {
                selection.groupID = this.groupID;
                this.selections.push(selection);
            };
            SelectionGroup.prototype.peripheralChanged = function (peripheralNames, numOfOverrides) {
                if (numOfOverrides == 1 && this.parentReq.isOverridden())
                    peripheralNames = [util.Const.ANY];
                this.notifySelections(peripheralNames);
            };
            SelectionGroup.prototype.notifySelections = function (peripheralNames) {
                _.each(this.selections, function (selection) {
                    if (!isAnySelection(selection)) {
                        if (selection.peripheralChanged) {
                            selection.peripheralChanged(peripheralNames);
                        }
                    }
                });
            };
            SelectionGroup.groupID = 0;
            return SelectionGroup;
        }());
        PeripheralRequirement.SelectionGroup = SelectionGroup;
    })(PeripheralRequirement = exports.PeripheralRequirement || (exports.PeripheralRequirement = {}));
});
//# sourceMappingURL=ui.js.map