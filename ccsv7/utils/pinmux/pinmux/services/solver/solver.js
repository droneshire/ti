define(["require", "exports", "glucose", "debug", "choices", "errorLocation", "requirements", "utils", "$q", "glucoseFunctions", "clauses", "choiceFactories"], function (require, exports, Module, debug, choices, ErrorLocation, Requirement, util, q, glucose, clauses, Choices) {
    "use strict";
    var logicError = debug.logicError;
    var deviceData = null;
    var lastSolution = null;
    var numGPIOBalls = 0;
    var gpioBalls = {};
    var peripheralChoices = null;
    var pinChoices = null;
    var ioSetChoices = null;
    var multiPinChoices = null;
    var powerChoices = null;
    function saveSolution(deviceRequirements) {
        lastSolution = new ErrorLocation.SavedSolution(deviceRequirements);
    }
    function init(dData, deviceRequirements) {
        deviceData = dData;
        ErrorLocation.init(deviceData);
        saveSolution(deviceRequirements);
        gpioBalls = {};
        var isStandardGPIO = false;
        var gpioIface = _.find(deviceData.interfaces, function (_iface, name) {
            return 0 === name.toUpperCase().search(/GPIO.*/);
        });
        if (gpioIface) {
            isStandardGPIO = gpioIface.isStandardGPIO;
            gpioBalls = gpioIface.gpioBalls;
        }
        numGPIOBalls = _.size(gpioBalls);
        var errInt = parseInt(deviceRequirements.solution.errorText);
        var warningInt = parseInt(deviceRequirements.solution.warningText);
        var gpioPinsUsed = deviceRequirements.solution.gpioPinsUsed;
        if (isNaN(errInt)) {
            errInt = 0;
        }
        if (isNaN(warningInt)) {
            warningInt = 0;
        }
        if (isNaN(gpioPinsUsed)) {
            gpioPinsUsed = 0;
        }
        util.AddSummaryToSolution(deviceRequirements.solution, errInt, warningInt, gpioPinsUsed, numGPIOBalls);
        if (isStandardGPIO) {
            _.each(deviceData.interfaces, function (iface) {
                _.each(iface.interfacePins, function (pin) {
                    var interfacePinMapping = pin.pinMappings || [];
                    pin.restrictsGPIO = false;
                    for (var i = 0; i < interfacePinMapping.length && !pin.restrictsGPIO; ++i) {
                        var peripheralPinMapping = interfacePinMapping[i].pinMappings;
                        for (var j = 0; j < peripheralPinMapping.length && !pin.restrictsGPIO; ++j) {
                            if (peripheralPinMapping[j].ball in gpioBalls) {
                                pin.restrictsGPIO = true;
                            }
                        }
                    }
                });
            });
        }
        _.each(deviceData.peripherals, function (peripheral, peripheralName) {
            _.each(peripheral.peripheralPins, function (pin, pinName) {
                var ioSetChoices = _.chain(peripheral.ioSets)
                    .pluck("ioSetRules")
                    .pluck(pinName)
                    .reject(function (ball) {
                    return undefined === ball;
                })
                    .value();
                if (!_.isEmpty(ioSetChoices)) {
                    _.each(pin.pinMappings, function (mapping) {
                        if (!_.contains(ioSetChoices, mapping.ball)) {
                            console.log(peripheralName + "->" + pinName + "->" + mapping.ball + " is excluded by all IO sets");
                            mapping.excludedInEveryIOSet = true;
                        }
                    });
                }
            });
        });
        if (debug.summarizeData) {
            console.log("Peripherals: " + Object.keys(deviceData.peripherals).length);
            console.log("Peripheral pins: " + Object.keys(deviceData.peripheralPins).length);
            console.log("Device pins: " + Object.keys(deviceData.devicePins).length);
            var numIOSets = 0;
            var keys = Object.keys(deviceData.peripherals);
            for (var i = 0; i < keys.length; ++i) {
                numIOSets += deviceData.peripherals[keys[i]].ioSets.length;
            }
            console.log("IO Sets: " + numIOSets);
            var numMappings_1 = 0;
            var numSolutions_1 = 1;
            _.each(deviceData.devicePins, function (devicePin) {
                if (undefined !== devicePin.mux) {
                    numMappings_1 += devicePin.mux.muxSetting.length;
                    if (0 !== devicePin.mux.muxSetting.length) {
                        numSolutions_1 *= devicePin.mux.muxSetting.length;
                    }
                }
            });
            console.log("Possible mappings: " + numMappings_1);
            console.log("Total possible solutions: " + numSolutions_1);
        }
    }
    function resetChoices(deviceRequirements) {
        choices.reset(numGPIOBalls);
        peripheralChoices = new Choices.PeripheralChoices();
        pinChoices = new Choices.PinChoices();
        ioSetChoices = new Choices.IOSetChoices(pinChoices);
        multiPinChoices = new Choices.MultiPinChoices(pinChoices);
        powerChoices = new Choices.PowerChoices(pinChoices, deviceRequirements.powerDomainSettings, deviceRequirements.powerDomainSettingsEnabled);
    }
    function determinePeripheralChoices(interfaceName, peripheralReq) {
        return _.chain(deviceData.interfaces[interfaceName].peripherals)
            .map(function (peripheral) {
            return peripheralChoices.newChoice(peripheral, peripheralReq);
        })
            .compact()
            .value();
    }
    function getInterfacePinMappings(interfaceName, pinName) {
        var mappings = deviceData.interfaces[interfaceName].interfacePins[pinName].pinMappings || [];
        return _.filter(mappings, function (mappings) {
            return !_.isEmpty(mappings.pinMappings);
        });
    }
    function determinePinChoices(interfaceName, peripheralReq, thisInterfacePerfChoices) {
        function determinePinChoice(pinMappingRequirement, pinChoiceFactory) {
            var choiceCreated = false;
            var peripheralPins = getInterfacePinMappings(interfaceName, pinMappingRequirement.interfacePinName);
            _.each(peripheralPins, function (peripheralPin) {
                var peripheralChoice = _.find(thisInterfacePerfChoices, function (peripheralChoice) {
                    return peripheralChoice.peripheral.name === peripheralPin.peripheralName;
                });
                if (peripheralChoice) {
                    _.chain(peripheralPin.pinMappings).unique().each(function (devicePin) {
                        choiceCreated = pinChoiceFactory.newChoice(peripheralChoice, peripheralPin, devicePin, pinMappingRequirement) || choiceCreated;
                    });
                }
            });
            if (!choiceCreated && !_.isEmpty(peripheralPins)) {
                util.ClearSolution(pinMappingRequirement.solution);
                util.AddErrorToSolution(pinMappingRequirement.solution, "Pin conflict");
            }
        }
        function determineMultiPinChoices(multiPinReq, pinChoiceFactory) {
            _.each(multiPinReq.pinRequirements, function (pinMappingRequirement) {
                if (pinMappingRequirement.used) {
                    determinePinChoice(pinMappingRequirement, pinChoiceFactory);
                }
            });
        }
        _.each(peripheralReq.pinRequirements, function (pinMappingRequirement) {
            if (pinMappingRequirement.used) {
                if (Requirement.isMultiPin(pinMappingRequirement)) {
                    determineMultiPinChoices(pinMappingRequirement, multiPinChoices.newPinChoiceFactory(peripheralReq, pinMappingRequirement));
                }
                else {
                    determinePinChoice(pinMappingRequirement, pinChoices);
                }
            }
        });
    }
    function determineIOSetChoices(perfChoices) {
        for (var perfChoiceIndex = 0; perfChoiceIndex < perfChoices.length; ++perfChoiceIndex) {
            var perfChoice = perfChoices[perfChoiceIndex];
            var peripheral = perfChoice.peripheral;
            for (var ioSetIndex = 0; ioSetIndex < peripheral.ioSets.length; ++ioSetIndex) {
                ioSetChoices.newChoice(perfChoice, peripheral.ioSets[ioSetIndex]);
            }
        }
    }
    function determineChoices(deviceRequirements) {
        var keys = Object.keys(deviceRequirements.interfaceRequirementsMap);
        for (var key = 0; key < keys.length; ++key) {
            var interfaceName = keys[key];
            var interfaceReq = deviceRequirements.interfaceRequirementsMap[interfaceName];
            for (var peripheralRequirementIndex = 0; peripheralRequirementIndex < interfaceReq.requirements.length; ++peripheralRequirementIndex) {
                var peripheralReq = interfaceReq.requirements[peripheralRequirementIndex];
                if (peripheralReq.used) {
                    var thisInterfacePerfChoices = determinePeripheralChoices(interfaceName, peripheralReq);
                    determinePinChoices(interfaceName, peripheralReq, thisInterfacePerfChoices);
                    determineIOSetChoices(thisInterfacePerfChoices);
                    powerChoices.addRestrictions(thisInterfacePerfChoices, peripheralReq);
                }
            }
        }
    }
    function generateClauses() {
        clauses.reset();
        peripheralChoices.generateClauses();
        pinChoices.generateClauses();
        ioSetChoices.generateClauses();
        multiPinChoices.generateClauses();
        powerChoices.generateClauses();
        clauses.apply();
        choices.initializeAssumptions();
    }
    function minimizePowerWarnings() {
        var solved = true;
        var keys = Object.keys(powerChoices.warnings);
        for (var key = 0; key < keys.length; ++key) {
            var warningId = keys[key];
            choices.assumeNoWarning(warningId);
            solved = choices.solve();
            if (!solved) {
                choices.assumeWarning(warningId);
            }
        }
        if (!solved) {
            solved = choices.solve();
        }
        return solved;
    }
    function findValidSolution(deviceRequirements) {
        var solutionDifference = lastSolution.compare(deviceRequirements);
        var solved = false;
        var solve = function () {
            solved = choices.solve();
            return solved;
        };
        solutionDifference.findValidSolution(solve);
        if (!solved) {
            if (!solve()) {
                console.log("increasing budget to get a valid solution");
                glucose.setBudget(-1, -1, -1);
                solve();
            }
        }
        return solved;
    }
    function applySolution(solved, devicePinMap) {
        if (solved) {
            choices.apply(glucose.getSolution(), devicePinMap);
        }
    }
    function getIOSet(ioSet, peripheral) {
        var ioSets = deviceData.peripherals[peripheral].ioSets;
        for (var i = 0; i < ioSets.length; ++i) {
            if (ioSet === ioSets[i].name) {
                return ioSets[i].ioSetRules;
            }
        }
        return null;
    }
    function isSignalInAnyIOSet(peripheral, peripheralPin) {
        var ioSets = deviceData.peripherals[peripheral].ioSets;
        for (var i = 0; i < ioSets.length; ++i) {
            if (peripheralPin in ioSets[i].ioSetRules) {
                return true;
            }
        }
        return false;
    }
    function addPeripheralErrorDetails(peripheralReq, interfaceRequirements) {
        var choices = [peripheralReq.selectedInstance];
        if (util.Const.ANY === peripheralReq.selectedInstance) {
            choices = _.pluck(deviceData.interfaces[peripheralReq.interfaceName].peripherals, "name");
        }
        _.each(choices, function (peripheralChoice) {
            var found = _.find(deviceData.peripherals[peripheralChoice].interfaces, function (_interfaceObj, interfaceName) {
                return _.find(interfaceRequirements[interfaceName].requirements, function (ifaceRequirement) {
                    if (ifaceRequirement.peripheralSolution.assignedToName === peripheralChoice) {
                        util.AddErrorDetailsToSolution(peripheralReq.peripheralSolution, peripheralChoice +
                            " is already in use by requirement " + ifaceRequirement.name);
                        return true;
                    }
                    return false;
                });
            });
            if (!found) {
                logicError("Peripheral " + peripheralChoice + " appears to be a valid assignment " + peripheralReq.name + " but wasn't found by glucose");
            }
        });
    }
    function addMultiPinErrorDetails(interfaceName, pinReq, peripheralReq, devicePinMap, interfaceRequirements) {
        if (pinReq.solution.errorText === Choices.MultiPinChoices.Error.errorText) {
            for (var i = 0; i < pinReq.pinRequirements.length; ++i) {
                var subPin = pinReq.pinRequirements[i];
                if (subPin.used && "" === subPin.solution.assignedToName) {
                    util.AddErrorToSolution(subPin.solution, "Pin conflict");
                    addPinErrorDetails(interfaceName, subPin, peripheralReq, devicePinMap, interfaceRequirements);
                }
            }
        }
    }
    function addPinErrorDetails(interfaceName, pinReq, peripheralReq, devicePinMap, interfaceRequirements) {
        if (Requirement.isMultiPin(pinReq)) {
            addMultiPinErrorDetails(interfaceName, pinReq, peripheralReq, devicePinMap, interfaceRequirements);
        }
        else {
            var choices_1 = {};
            var chosenPeripheral_1 = peripheralReq.peripheralSolution.assignedToName;
            var isStandardGPIO_1 = deviceData.interfaces[interfaceName].isStandardGPIO;
            if (isStandardGPIO_1 && pinReq.assignedToName === util.Const.ANY) {
                util.AddErrorDetailsToSolution(pinReq.solution, "No free GPIO pins are available");
            }
            else {
                var interfacePinMappings = getInterfacePinMappings(interfaceName, pinReq.interfacePinName);
                _.each(interfacePinMappings, function (peripheralPin) {
                    _.each(peripheralPin.pinMappings, function (devicePin) {
                        if (pinReq.assignedToName === util.Const.ANY || pinReq.assignedToName === devicePin.ball) {
                            var choice = choices_1[devicePin.ball];
                            if (!choice) {
                                choice = choices_1[devicePin.ball] = {
                                    validPeripheral: false,
                                    validPeripheralsInUse: true,
                                    excludedInEveryIOSet: devicePin.excludedInEveryIOSet,
                                    peripheralConflicts: []
                                };
                            }
                            if (!choice.excludedInEveryIOSet) {
                                if (peripheralPin.peripheralName !== chosenPeripheral_1 && !isStandardGPIO_1) {
                                    var intsToTest_1 = _.keys(deviceData.peripherals[peripheralPin.peripheralName].interfaces);
                                    var filtered = _.filter(interfaceRequirements, function (_interfaceReq, name) {
                                        return _.contains(intsToTest_1, name);
                                    });
                                    var newConflict = _.chain(filtered)
                                        .pluck("requirements")
                                        .flatten()
                                        .find(function (peripheralReq) {
                                        return peripheralReq.peripheralSolution.assignedToName === peripheralPin.peripheralName;
                                    })
                                        .value();
                                    if (newConflict) {
                                        choice.peripheralConflicts = choice.peripheralConflicts.concat(newConflict);
                                    }
                                    else {
                                        choice.validPeripheralsInUse = false;
                                    }
                                }
                                else {
                                    choice.validPeripheral = true;
                                    if (peripheralReq.peripheralSolution.ioSet) {
                                        var ioSetRules = getIOSet(peripheralReq.peripheralSolution.ioSet, chosenPeripheral_1);
                                        if (peripheralPin.name in ioSetRules) {
                                            if (ioSetRules[peripheralPin.name] !== devicePin.ball) {
                                                choice.invalidIOSet = true;
                                            }
                                        }
                                        else if (isSignalInAnyIOSet(chosenPeripheral_1, peripheralPin.name)) {
                                            choice.invalidIOSet = true;
                                        }
                                    }
                                }
                                if (devicePinMap[devicePin.ball]) {
                                    choice.inUseBy = devicePinMap[devicePin.ball].requirementName + ", pin " + devicePinMap[devicePin.ball].interfacePin;
                                }
                            }
                        }
                    });
                });
                _.each(choices_1, function (choice, ball) {
                    var errorText = "";
                    if (choice.excludedInEveryIOSet) {
                        errorText = ball + " can never be selected as it is not available in any IO set";
                    }
                    else {
                        if (!choice.validPeripheral && !choice.validPeripheralsInUse) {
                            if ("" !== chosenPeripheral_1) {
                                errorText = ball + " is not available on " + chosenPeripheral_1;
                            }
                        }
                        else if (choice.invalidIOSet) {
                            errorText = ball + " is not valid for " + peripheralReq.peripheralSolution.ioSet;
                        }
                        if (choice.inUseBy) {
                            if ("" === errorText) {
                                errorText = ball + " is currently";
                            }
                            else {
                                errorText += " and is also";
                            }
                            errorText += " in use by " + choice.inUseBy;
                        }
                        if (!choice.validPeripheral && choice.validPeripheralsInUse && 0 !== choice.peripheralConflicts.length) {
                            var peripheralConflicts = _.unique(choice.peripheralConflicts);
                            if ("" === errorText) {
                                errorText = ball + " is ";
                            }
                            else {
                                errorText += " and is also ";
                            }
                            errorText += "only available on " + _.chain(peripheralConflicts)
                                .pluck("peripheralSolution")
                                .pluck("assignedToName")
                                .value().join(", ");
                            errorText += " which is in use by " + _.pluck(peripheralConflicts, "name").join(", ");
                        }
                    }
                    if ("" === errorText) {
                        logicError("Ball " + ball + " appears to be a valid assignment for pin " + pinReq.name + " of " + peripheralReq.name + ", but wasn't found by glucose");
                    }
                    util.AddErrorDetailsToSolution(pinReq.solution, errorText);
                });
            }
        }
    }
    function summarizeGpioPinsUsed(pinRequirements) {
        return _.reduce(pinRequirements, function (total, pinReq) {
            if (!Requirement.isMultiPin(pinReq)) {
                return total + ((pinReq.solution.assignedToName in gpioBalls) ? 1 : 0);
            }
            else {
                return total + summarizeGpioPinsUsed(pinReq.pinRequirements);
            }
        }, 0);
    }
    function summarizeErrors(deviceRequirements) {
        var errors = 0;
        var warnings = 0;
        var gpioPinsUsed = 0;
        _.each(deviceRequirements.interfaceRequirementsMap, function (interfaceReq, interfaceName) {
            var intErrors = 0;
            var intWarnings = 0;
            var intGpioPinsUsed = 0;
            var peripheralsSearched = 0;
            _.each(interfaceReq.requirements, function (peripheralReq) {
                var perfErrors = 0;
                var perfWarnings = 0;
                var perfGpioPinsUsed = summarizeGpioPinsUsed(peripheralReq.pinRequirements);
                if ("" !== peripheralReq.peripheralSolution.errorText) {
                    ++perfErrors;
                    addPeripheralErrorDetails(peripheralReq, deviceRequirements.interfaceRequirementsMap);
                }
                if (util.Const.ANY === peripheralReq.selectedInstance) {
                    ++peripheralsSearched;
                    if (8 <= peripheralsSearched && !deviceData.interfaces[interfaceName].peripherals[0].isStandardGPIO) {
                        util.AddSolverWarningToSolution(peripheralReq.peripheralSolution);
                    }
                }
                if ("" !== peripheralReq.peripheralSolution.warningText) {
                    ++perfWarnings;
                }
                _.each(peripheralReq.pinRequirements, function (pinReq) {
                    if (pinReq.used) {
                        if ("" !== pinReq.solution.errorText) {
                            ++perfErrors;
                            addPinErrorDetails(interfaceName, pinReq, peripheralReq, deviceRequirements.devicePinMap, deviceRequirements.interfaceRequirementsMap);
                        }
                        if ("" !== pinReq.solution.warningText) {
                            ++perfWarnings;
                        }
                    }
                });
                intErrors += perfErrors;
                intWarnings += perfWarnings;
                intGpioPinsUsed += perfGpioPinsUsed;
                util.AddSummaryToSolution(peripheralReq.solution, perfErrors, perfWarnings, perfGpioPinsUsed);
            });
            errors += intErrors;
            warnings += intWarnings;
            gpioPinsUsed += intGpioPinsUsed;
            util.AddSummaryToSolution(interfaceReq.solution, intErrors, intWarnings, intGpioPinsUsed);
        });
        util.AddSummaryToSolution(deviceRequirements.solution, errors, warnings, gpioPinsUsed, numGPIOBalls);
    }
    function solveImpl(deviceRequirements) {
        glucose.setBudget(debug.glucoseBudget.conflicts, debug.glucoseBudget.propagations, debug.glucoseBudget.restarts);
        glucose.setVerbosity(debug.glucoseVerbosity.verbosity, debug.glucoseVerbosity.verbEveryConflicts);
        resetChoices(deviceRequirements);
        determineChoices(deviceRequirements);
        generateClauses();
        var solved = choices.solve();
        if (solved) {
            solved = minimizePowerWarnings();
        }
        else {
            solved = findValidSolution(deviceRequirements);
        }
        deviceRequirements.devicePinMap = {};
        applySolution(solved, deviceRequirements.devicePinMap);
        summarizeErrors(deviceRequirements);
        saveSolution(deviceRequirements);
    }
    function solveProfile(deviceRequirements) {
        glucose.glucoseTime = 0;
        var start = new Date().getTime();
        var ret = solveImpl(deviceRequirements);
        var end = new Date().getTime();
        console.log("solve() took " + (end - start) + ", " + (end - start - glucose.glucoseTime) + " excluding glucose");
        return ret;
    }
    function freeNativeMemory() {
        _.each([Module, glucose, clauses, choices, Choices], function (hack) {
            _.each(hack, function (_member, name) {
                hack[name] = null;
            });
        });
        peripheralChoices = null;
        pinChoices = null;
        ioSetChoices = null;
        multiPinChoices = null;
        powerChoices = null;
    }
    if ((typeof require === "function") && (process.env.PINMUX_TEST_ENABLED || process.env.PINMUX_DEV)) {
        window.onbeforeunload = function () {
            freeNativeMemory();
        };
    }
    function initData(deviceData, deviceRequirements) {
        var initDataDefer = q.defer();
        init(deviceData, deviceRequirements);
        initDataDefer.resolve(deviceData);
        return initDataDefer.promise;
    }
    exports.initData = initData;
    exports.solve = debug.profile ? solveProfile : solveImpl;
    function abortOnError(val) {
        if (val) {
            debug.abortOnError = val;
        }
        return debug.abortOnError;
    }
    exports.abortOnError = abortOnError;
});
//# sourceMappingURL=solver.js.map