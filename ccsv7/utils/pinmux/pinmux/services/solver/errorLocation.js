define(["require", "exports", "requirements", "utils", "choices"], function (require, exports, Requirement, util, choices) {
    "use strict";
    function init(deviceData) {
        findRelatedPeripherals(deviceData);
    }
    exports.init = init;
    var relationsMap = {};
    function findRelatedPeripherals(deviceData) {
        var relationsMapArray = _.mapObject(deviceData.interfaces, function (iface) {
            return _.chain(iface.peripherals)
                .map(function (peripheral) {
                return _.keys(peripheral.interfaces);
            })
                .flatten()
                .uniq()
                .value();
        });
        function findAdditional() {
            return !_.find(relationsMapArray, function (iface, name) {
                return _.find(iface, function (relatedIface) {
                    var additional = _.difference(relationsMapArray[relatedIface], iface);
                    if (!_.isEmpty(additional)) {
                        relationsMapArray[name] = _.union(relationsMapArray[relatedIface], iface);
                        return true;
                    }
                    return false;
                });
            });
        }
        while (!findAdditional())
            ;
        relationsMap = _.mapObject(relationsMapArray, function (value) {
            return _.sortBy(value).join("_");
        });
    }
    var SavedSolution = (function () {
        function SavedSolution(deviceRequirements, ignoreSolutions, previousAssignments) {
            var _this = this;
            this.peripherals = {};
            this.relatedPeripherals = {};
            if (!ignoreSolutions) {
                this.assignments = {};
            }
            if (deviceRequirements) {
                _.each(deviceRequirements.interfaceRequirementsMap, function (interfaceReq, interfaceName) {
                    if (interfaceReq.requirements.length > 0) {
                        interfaceName = relationsMap[interfaceName];
                        _this.relatedPeripherals[interfaceName] = _this.relatedPeripherals[interfaceName] || [];
                        _.each(interfaceReq.requirements, function (peripheralReq) {
                            var peripheral = new SavedPeripheralRequirement(peripheralReq, _this, ignoreSolutions, previousAssignments);
                            _this.peripherals[peripheral.name] = peripheral;
                            _this.relatedPeripherals[interfaceName].push(peripheral);
                        }, _this);
                    }
                }, this);
            }
        }
        SavedSolution.prototype.compare = function (deviceRequirements) {
            var newSolution = new SavedSolution(deviceRequirements, true, this.assignments);
            var changedPreviouslyValidItem = false;
            _.each(this.peripherals, function (origPeripheral, peripheral) {
                if (!origPeripheral.isError) {
                    var newPeripheral_1 = newSolution.peripherals[peripheral];
                    if (newPeripheral_1) {
                        newPeripheral_1.isAssigned = true;
                        _.each(origPeripheral.assignedPins.pins, function (_obj, pin) {
                            var newPin = newPeripheral_1.unknownPins.pins[pin];
                            if (newPin) {
                                newPeripheral_1.assignedPins.pins[pin] = newPin;
                                delete newPeripheral_1.unknownPins.pins[pin];
                            }
                            else {
                                changedPreviouslyValidItem = true;
                            }
                        });
                    }
                    else {
                        changedPreviouslyValidItem = true;
                    }
                }
            });
            if (!changedPreviouslyValidItem) {
                _.each(this.peripherals, function (origPeripheral, peripheral) {
                    var newPeripheral = newSolution.peripherals[peripheral];
                    if (newPeripheral) {
                        if (origPeripheral.isError) {
                            newPeripheral.isError = true;
                        }
                        else {
                            _.each(origPeripheral.assignedPins.pins, function (_obj, pin) {
                                var newPin = newPeripheral.unknownPins.pins[pin];
                                if (newPin) {
                                    newPeripheral.errorPins.pins[pin] = newPin;
                                    delete newPeripheral.unknownPins.pins[pin];
                                }
                            });
                        }
                    }
                });
            }
            return newSolution;
        };
        SavedSolution.prototype.findValidSolution = function (solve) {
            this.assumeUnassignedAreErrors();
            this.validateUnknowns(solve);
        };
        SavedSolution.prototype.assumeUnassignedAreErrors = function () {
            _.each(this.peripherals, function (peripheral) {
                peripheral.assumeUnassignedAreErrors();
            });
        };
        SavedSolution.prototype.validateUnknowns = function (solve) {
            var _this = this;
            _.each(this.relatedPeripherals, function (relatedPeripherals) {
                var hasOverridesToTest = _.reduce(relatedPeripherals, function (result, relatedPeripheral) {
                    return relatedPeripheral.assumeNoErrorsInOverrides() || result;
                }, false);
                if (hasOverridesToTest) {
                    if (!solve()) {
                        _.each(relatedPeripherals, function (relatedPeripheral) {
                            relatedPeripheral.markNonOverridesUnknown();
                        });
                        _.each(_this.peripherals, function (peripheral) {
                            peripheral.markErrorsAsUnknown();
                        });
                        _.each(relatedPeripherals, function (relatedPeripheral) {
                            relatedPeripheral.validate(solve, true);
                        });
                    }
                    else {
                        _.each(relatedPeripherals, function (relatedPeripheral) {
                            relatedPeripheral.markOverridesAssigned();
                        });
                    }
                }
            }, this);
            _.each(this.peripherals, function (peripheral) {
                peripheral.validate(solve);
            });
        };
        return SavedSolution;
    }());
    exports.SavedSolution = SavedSolution;
    var SavedPeripheralRequirement = (function () {
        function SavedPeripheralRequirement(peripheralReq, solution, ignoreSolutions, previousAssignments) {
            var _this = this;
            this.peripheralReq = peripheralReq;
            this.errorPins = new PinCollection();
            this.unknownPins = new PinCollection();
            this.assignedPins = new PinCollection();
            this.isAssigned = false;
            this.name = peripheralReq.id + " (" + peripheralReq.selectedInstance + ")";
            this.isError = !ignoreSolutions && "" !== peripheralReq.peripheralSolution.errorText;
            _.each(peripheralReq.pinRequirements, function (pinReq) {
                if (pinReq.used) {
                    var pin = void 0;
                    if (Requirement.isMultiPin(pinReq)) {
                        pin = new SavedMultiPinRequirement(pinReq, solution, _this.name, peripheralReq.id);
                    }
                    else {
                        pin = new SavedPinRequirement(pinReq, solution, _this.name, previousAssignments, peripheralReq.id);
                    }
                    if (ignoreSolutions) {
                        _this.unknownPins.pins[pin.name] = pin;
                    }
                    else if ("" === pinReq.solution.errorText) {
                        _this.assignedPins.pins[pin.name] = pin;
                    }
                    else {
                        _this.errorPins.pins[pin.name] = pin;
                    }
                }
            }, this);
            this.id = peripheralReq.id;
        }
        SavedPeripheralRequirement.prototype.hasAssignedPins = function () {
            return !_.isEmpty(this.assignedPins.pins);
        };
        SavedPeripheralRequirement.prototype.assumeUnassignedAreErrors = function () {
            if (!this.isAssigned) {
                choices.assumeError(this.id);
            }
            this.errorPins.assumeError();
            this.unknownPins.assumeError();
        };
        SavedPeripheralRequirement.prototype.assumeNoErrorsInOverrides = function () {
            if (this.unknownPins.assumeNoError(true) || util.Const.ANY !== this.peripheralReq.selectedInstance) {
                choices.assumeNoError(this.id);
                return true;
            }
            return false;
        };
        SavedPeripheralRequirement.prototype.markNonOverridesUnknown = function () {
            this.assignedPins.assumeError(false);
            this.assignedPins.moveTo(this.unknownPins, false);
            if ((util.Const.ANY === this.peripheralReq.selectedInstance || !this.isAssigned) && !this.hasAssignedPins()) {
                choices.assumeError(this.id);
                this.unknownPins.assumeError(true);
            }
        };
        SavedPeripheralRequirement.prototype.markErrorsAsUnknown = function () {
            this.isError = false;
            this.errorPins.moveTo(this.unknownPins);
        };
        SavedPeripheralRequirement.prototype.markOverridesAssigned = function () {
            this.unknownPins.moveTo(this.assignedPins, true);
        };
        SavedPeripheralRequirement.prototype.validate = function (solve, overridesOnly) {
            if ((!this.isError && this.unknownPins.assumeNoError(overridesOnly)) ||
                (overridesOnly && util.Const.ANY !== this.peripheralReq.selectedInstance) ||
                (!this.isAssigned && !overridesOnly)) {
                choices.assumeNoError(this.id);
                if (!solve()) {
                    this.unknownPins.assumeError();
                    if (this.hasAssignedPins() || solve()) {
                        this.unknownPins.validate(this.assignedPins, this.errorPins, solve, overridesOnly);
                    }
                    else {
                        choices.assumeError(this.id);
                        this.isError = true;
                    }
                }
                else {
                    this.unknownPins.moveTo(this.assignedPins, overridesOnly);
                }
            }
        };
        return SavedPeripheralRequirement;
    }());
    var PinCollection = (function () {
        function PinCollection() {
            this.pins = {};
        }
        PinCollection.prototype.forEach = function (ifOverride, func) {
            var applied = false;
            _.each(this.pins, function (pin, pinName) {
                if (undefined === ifOverride || ifOverride === pin.isOverride()) {
                    applied = true;
                    func(pin, pinName);
                }
            });
            return applied;
        };
        PinCollection.prototype.assumeError = function (ifOverride) {
            return this.forEach(ifOverride, function (pin) {
                pin.assumeError();
            });
        };
        PinCollection.prototype.assumeNoError = function (ifOverride) {
            return this.forEach(ifOverride, function (pin) {
                pin.assumeNoError();
            });
        };
        PinCollection.prototype.moveTo = function (toCollection, ifOverride) {
            var _this = this;
            return this.forEach(ifOverride, function (pin, pinName) {
                delete _this.pins[pinName];
                toCollection.pins[pinName] = pin;
            });
        };
        PinCollection.prototype.validate = function (onSuccess, onFailure, solve, ifOverride) {
            var _this = this;
            return this.forEach(ifOverride, function (pin, pinName) {
                delete _this.pins[pinName];
                if (pin.validate(solve)) {
                    onSuccess.pins[pinName] = pin;
                }
                else {
                    onFailure.pins[pinName] = pin;
                }
            });
        };
        return PinCollection;
    }());
    var SavedPinRequirement = (function () {
        function SavedPinRequirement(pinReq, solution, peripheralName, previousAssignments, peripheralId) {
            this.pinReq = pinReq;
            this.solution = solution;
            this.name = pinReq.interfacePinName + " (" + pinReq.assignedToName + ")";
            if (solution.assignments && "" === pinReq.solution.errorText && "" !== pinReq.solution.assignedToName) {
                solution.assignments[pinReq.solution.assignedToName] = {
                    peripheralName: peripheralName,
                    pinName: this.name
                };
            }
            if (previousAssignments && this.isOverride()) {
                this.possibleConflict = previousAssignments[this.pinReq.assignedToName];
            }
            this.id = peripheralId + "->" + pinReq.interfacePinName;
        }
        SavedPinRequirement.prototype.assumeError = function () {
            choices.assumeError(this.id);
        };
        SavedPinRequirement.prototype.assumeNoError = function () {
            choices.assumeNoError(this.id);
        };
        SavedPinRequirement.prototype.validate = function (solve) {
            this.assumeNoError();
            if (!solve()) {
                if (this.isOverride() && this.possibleConflict) {
                    var conflictPeripheral = this.solution.peripherals[this.possibleConflict.peripheralName];
                    if (conflictPeripheral) {
                        var conflictPin = conflictPeripheral.assignedPins.pins[this.possibleConflict.pinName];
                        if (conflictPin && !conflictPin.isOverride()) {
                            conflictPin.assumeError();
                            if (solve()) {
                                conflictPeripheral.errorPins.pins[this.possibleConflict.pinName] = conflictPin;
                                delete conflictPeripheral.assignedPins.pins[this.possibleConflict.pinName];
                                return true;
                            }
                            else {
                                conflictPin.assumeNoError();
                            }
                        }
                    }
                }
                this.assumeError();
                return false;
            }
            return true;
        };
        SavedPinRequirement.prototype.isOverride = function () {
            return this.pinReq.assignedToName !== util.Const.ANY;
        };
        return SavedPinRequirement;
    }());
    var SavedMultiPinRequirement = (function () {
        function SavedMultiPinRequirement(pinReq, solution, peripheralName, peripheralId) {
            var _this = this;
            this.pinReq = pinReq;
            this.subPinIds = [];
            this.name = pinReq.count + " of";
            _.each(this.pinReq.pinRequirements, function (subPin) {
                if (subPin.used) {
                    _this.name += " " + subPin.interfacePinName + " (" + subPin.assignedToName + ")";
                    _this.subPinIds.push(peripheralId + "->Multi->" + subPin.interfacePinName);
                    if (solution.assignments && "" === subPin.solution.errorText && "" !== subPin.solution.assignedToName) {
                        solution.assignments[subPin.solution.assignedToName] = {
                            peripheralName: peripheralName,
                            pinName: _this.name
                        };
                    }
                }
            }, this);
            this.id = peripheralId + "->Multi";
        }
        SavedMultiPinRequirement.prototype.assumeError = function () {
            choices.assumeError(this.id);
            _.each(this.subPinIds, function (id) {
                choices.assumeError(id);
            }, this);
        };
        SavedMultiPinRequirement.prototype.assumeNoError = function () {
            choices.assumeNoError(this.id);
            _.each(this.subPinIds, function (id) {
                choices.assumeNoError(id);
            }, this);
        };
        SavedMultiPinRequirement.prototype.validate = function (solve) {
            this.assumeNoError();
            if (!solve()) {
                this.assumeError();
                _.each(this.subPinIds, function (id) {
                    choices.assumeNoError(id);
                    if (!solve()) {
                        choices.assumeError(id);
                    }
                }, this);
                return false;
            }
            return true;
        };
        SavedMultiPinRequirement.prototype.isOverride = function () {
            return false;
        };
        return SavedMultiPinRequirement;
    }());
});
//# sourceMappingURL=errorLocation.js.map