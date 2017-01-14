var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "requirements", "utils", "debug", "clauses", "clauseGeneration", "choices"], function (require, exports, Requirement, util, debug, clauses, cg, choiceArray) {
    "use strict";
    var AbstractChoice = (function () {
        function AbstractChoice() {
            this.id = choiceArray.push(this);
        }
        return AbstractChoice;
    }());
    var AbstractErrorChoice = (function () {
        function AbstractErrorChoice(name, restrictsGPIO) {
            if (restrictsGPIO === void 0) { restrictsGPIO = false; }
            this.restrictsGPIO = restrictsGPIO;
            this.id = choiceArray.pushError(this, name);
        }
        return AbstractErrorChoice;
    }());
    var Map = (function () {
        function Map() {
            this.c = {};
        }
        Map.prototype.forEach = function (callbackfn) {
            _.each(this.c, callbackfn);
        };
        Map.prototype.set = function (key, value) {
            this.c[key] = value;
        };
        return Map;
    }());
    var RelatedChoices = (function (_super) {
        __extends(RelatedChoices, _super);
        function RelatedChoices() {
            _super.apply(this, arguments);
        }
        RelatedChoices.prototype.get = function (key) {
            if (!this.c[key]) {
                this.c[key] = [];
            }
            return this.c[key];
        };
        return RelatedChoices;
    }(Map));
    function isStandardGPIO(peripheral, peripheralReq) {
        return peripheral.isStandardGPIO &&
            (!peripheralReq.pinRequirements[0].used ||
                (peripheralReq.selectedInstance === util.Const.ANY &&
                    peripheralReq.pinRequirements[0].assignedToName === util.Const.ANY));
    }
    ;
    var PeripheralChoices = (function () {
        function PeripheralChoices() {
            this.byPeripheral = new RelatedChoices();
            this.byRequirement = new RelatedChoices();
            this.overriddenChoices = new Map();
            this.errors = {};
        }
        PeripheralChoices.prototype.newChoice = function (peripheral, peripheralReq) {
            if (peripheralReq.selectedInstance !== util.Const.ANY && peripheralReq.selectedInstance !== peripheral.name) {
                return null;
            }
            if (peripheral.isStandardGPIO &&
                peripheralReq.pinRequirements[0].assignedToName !== util.Const.ANY &&
                peripheralReq.pinRequirements[0].used) {
                var ballChoiceForThisPerf = _.chain(peripheral.peripheralPins)
                    .pluck("pinMappings")
                    .flatten()
                    .pluck("ball")
                    .first()
                    .value();
                if (ballChoiceForThisPerf !== peripheralReq.pinRequirements[0].assignedToName) {
                    return null;
                }
                var noChoice = new PeripheralChoices.NoChoice(peripheralReq);
                this.byRequirement.get(peripheralReq.id).push(noChoice);
            }
            if (!isStandardGPIO(peripheral, peripheralReq)) {
                var choice = new PeripheralChoices.RealChoice(peripheral, peripheralReq);
                this.byPeripheral.get(peripheral.name).push(choice);
                this.byRequirement.get(peripheralReq.id).push(choice);
                if (peripheralReq.selectedInstance && peripheralReq.selectedInstance === peripheral.name) {
                    this.overriddenChoices.set(peripheralReq.id, choice);
                }
                return choice;
            }
            else {
                return new PeripheralChoices.GPIOChoice(peripheral, peripheralReq);
            }
        };
        PeripheralChoices.prototype.generateClauses = function () {
            var _this = this;
            var errorFetcher = function (choiceName) { return _this.getError(choiceName); };
            cg.chooseOneOf(this.byRequirement, errorFetcher, "must choose one peripheral per requirement");
            cg.mutuallyExclusive(this.byPeripheral, null, "a peripheral can only be chosen once");
            cg.userOverrides(this.overriddenChoices, errorFetcher, "overridden peripherals must be chosen");
        };
        PeripheralChoices.prototype.getError = function (peripheralReqId) {
            if (peripheralReqId in this.errors) {
                return this.errors[peripheralReqId];
            }
            var error = new PeripheralChoices.Error(this.byRequirement.get(peripheralReqId)[0].peripheralReq);
            this.errors[peripheralReqId] = error;
            return error;
        };
        return PeripheralChoices;
    }());
    exports.PeripheralChoices = PeripheralChoices;
    var PeripheralChoices;
    (function (PeripheralChoices) {
        var RealChoice = (function (_super) {
            __extends(RealChoice, _super);
            function RealChoice(peripheral, peripheralReq) {
                _super.call(this);
                this.peripheral = peripheral;
                this.peripheralReq = peripheralReq;
                if (debug.debug) {
                    this.name = peripheralReq.name + "->" + peripheral.name;
                }
            }
            RealChoice.prototype.apply = function () {
                util.UpdateSolution(this.peripheralReq.peripheralSolution, "", this.peripheral.name);
            };
            return RealChoice;
        }(AbstractChoice));
        PeripheralChoices.RealChoice = RealChoice;
        var GPIOChoice = (function () {
            function GPIOChoice(peripheral, peripheralReq) {
                this.peripheral = peripheral;
                this.peripheralReq = peripheralReq;
            }
            GPIOChoice.prototype.apply = function () {
                util.UpdateSolution(this.peripheralReq.peripheralSolution, "", this.peripheral.name);
            };
            return GPIOChoice;
        }());
        PeripheralChoices.GPIOChoice = GPIOChoice;
        var NoChoice = (function (_super) {
            __extends(NoChoice, _super);
            function NoChoice(peripheralReq) {
                _super.call(this);
                this.peripheralReq = peripheralReq;
                if (debug.debug) {
                    this.name = peripheralReq.name + "->No Choice";
                }
            }
            NoChoice.prototype.apply = function () {
                util.ClearSolution(this.peripheralReq.peripheralSolution);
            };
            return NoChoice;
        }(AbstractChoice));
        PeripheralChoices.NoChoice = NoChoice;
        var Error = (function (_super) {
            __extends(Error, _super);
            function Error(peripheralReq) {
                _super.call(this, peripheralReq.id);
                this.peripheralReq = peripheralReq;
                if (debug.debug) {
                    this.name = "Peripheral conflict " + peripheralReq.name;
                }
                util.ClearSolution(this.peripheralReq.peripheralSolution);
            }
            Error.prototype.apply = function () {
                util.ClearSolution(this.peripheralReq.peripheralSolution);
                util.AddErrorToSolution(this.peripheralReq.peripheralSolution, "Peripheral conflict");
                for (var _i = 0, _a = this.peripheralReq.pinRequirements; _i < _a.length; _i++) {
                    var pinReq = _a[_i];
                    util.ClearSolution(pinReq.solution);
                }
            };
            return Error;
        }(AbstractErrorChoice));
        PeripheralChoices.Error = Error;
    })(PeripheralChoices = exports.PeripheralChoices || (exports.PeripheralChoices = {}));
    function isRealChoice(choice) {
        return choice instanceof PeripheralChoices.RealChoice;
    }
    var PinChoices = (function () {
        function PinChoices() {
            this.byPeripheral = new RelatedChoices();
            this.byDevicePin = new RelatedChoices();
            this.byRequirement = new RelatedChoices();
            this.byMultiPinRequirement = new RelatedChoices();
            this.overriddenChoices = new RelatedChoices();
            this.multiPinOverrides = new RelatedChoices();
            this.errors = {};
            this.gpioPins = {};
        }
        PinChoices.prototype.newChoice = function (peripheralChoice, peripheralPin, devicePin, pinReq, multiPinChoice) {
            if (pinReq.assignedToName !== util.Const.ANY && pinReq.assignedToName !== devicePin.name) {
                return false;
            }
            if (!isRealChoice(peripheralChoice)) {
                var choice_1 = this.gpioPins[peripheralChoice.peripheralReq.id]
                    || new PinChoices.GPIOChoice(peripheralChoice.peripheralReq, pinReq);
                choice_1.choices[devicePin.name] = {
                    peripheralChoice: peripheralChoice,
                    peripheralPin: peripheralPin,
                    devicePin: devicePin,
                };
                this.gpioPins[peripheralChoice.peripheralReq.id] = choice_1;
                return false;
            }
            var choice = new PinChoices.Choice(peripheralChoice, peripheralPin, devicePin, pinReq);
            this.byDevicePin.get(devicePin.name).push(choice);
            var requirementName = peripheralChoice.peripheralReq.id + "->" + pinReq.interfacePinName;
            var isOverride = (pinReq.assignedToName && pinReq.assignedToName === devicePin.name);
            if (multiPinChoice) {
                this.byMultiPinRequirement.get(multiPinChoice.id).push(choice);
                if (isOverride) {
                    this.multiPinOverrides.get(multiPinChoice.id).push(choice);
                }
            }
            else {
                this.byRequirement.get(requirementName).push(choice);
                if (isOverride) {
                    this.overriddenChoices.get(requirementName).push(choice);
                }
            }
            this.byPeripheral.get(peripheralChoice.id).push(choice);
            return true;
        };
        PinChoices.prototype.generateClauses = function () {
            var _this = this;
            var getPinError = function (choiceName) { return _this.getPinError(choiceName); };
            var getMultiPinError = function (choiceId) { return _this.getMultiPinError(choiceId); };
            cg.chooseAtLeastOneOf(this.byRequirement, getPinError, "each pin requirement must choose one mapping");
            cg.chooseOneOfOnlyIf(this.byMultiPinRequirement, getMultiPinError, "only choose a multi-pin sub-choice choice if that combo was selected");
            cg.dependentChoices(this.byPeripheral, "pins can only be chosen if their peripheral is also chosen");
            cg.mutuallyExclusive(this.byDevicePin, null, "only choose a device pin once");
            cg.chooseAtLeastOneOf(this.overriddenChoices, getPinError, "must choose the overridden pin choice");
            cg.chooseAtLeastOneOfOnlyIf(this.multiPinOverrides, getMultiPinError, "must choose the overridden multi-pin pin choice, but only if the combo was selected");
        };
        PinChoices.prototype.getPinError = function (requirementName) {
            if (requirementName in this.errors) {
                return this.errors[requirementName];
            }
            var pinChoice = this.byRequirement.get(requirementName)[0];
            var name = requirementName;
            return this.newError(pinChoice, name, requirementName);
        };
        PinChoices.prototype.getMultiPinError = function (requirementId) {
            if (requirementId in this.errors) {
                return this.errors[requirementId];
            }
            var pinChoice = this.byMultiPinRequirement.get(requirementId)[0];
            var name = pinChoice.peripheralChoice.peripheralReq.id + "->Multi->" + pinChoice.pinReq.interfacePinName;
            return this.newError(pinChoice, name, requirementId);
        };
        PinChoices.prototype.newError = function (pinChoice, name, id) {
            var error = new PinChoices.Error(pinChoice.peripheralChoice.peripheralReq, pinChoice.pinReq, name, pinChoice.peripheralPin.interfacePin);
            this.errors[id] = error;
            return error;
        };
        return PinChoices;
    }());
    exports.PinChoices = PinChoices;
    var PinChoices;
    (function (PinChoices) {
        var Choice = (function (_super) {
            __extends(Choice, _super);
            function Choice(peripheralChoice, peripheralPin, devicePin, pinReq) {
                _super.call(this);
                this.applied = false;
                this.peripheralChoice = peripheralChoice;
                this.pinReq = pinReq;
                this.peripheralPin = peripheralPin;
                this.devicePin = devicePin;
                util.ClearSolution(this.pinReq.solution);
                if (debug.debug) {
                    this.name = peripheralPin.name + "->" + devicePin.name + " (" + peripheralChoice.name + ")";
                }
            }
            Choice.prototype.apply = function (devicePinMap) {
                if ("" === this.pinReq.solution.assignedToName) {
                    util.UpdateSolution(this.pinReq.solution, this.peripheralPin.name, this.devicePin.ball);
                    devicePinMap[this.devicePin.name] = new Requirement.DevicePinSolution();
                    util.UpdateSolution(devicePinMap[this.devicePin.name], this.devicePin.ball, this.peripheralPin.name);
                    var requirementName = this.peripheralChoice.peripheralReq.parentReqName ?
                        this.peripheralChoice.peripheralReq.parentReqName : this.peripheralChoice.peripheralReq.name;
                    var requirementID = this.peripheralChoice.peripheralReq.parentReqID ?
                        this.peripheralChoice.peripheralReq.parentReqID : this.peripheralChoice.peripheralReq.id;
                    devicePinMap[this.devicePin.name].requirementName = requirementName;
                    devicePinMap[this.devicePin.name].requirementId = requirementID;
                    devicePinMap[this.devicePin.name].interfacePin = this.pinReq.interfacePinName;
                    this.applied = true;
                }
            };
            return Choice;
        }(AbstractChoice));
        PinChoices.Choice = Choice;
        var GPIOChoice = (function () {
            function GPIOChoice(peripheralReq, pinReq) {
                this.pinReq = pinReq;
                this.choices = {};
                util.ClearSolution(this.pinReq.solution);
                choiceArray.pushGPIO(this, {
                    apply: function () {
                        util.ClearSolution(peripheralReq.peripheralSolution);
                        util.ClearSolution(pinReq.solution);
                        util.AddErrorToSolution(pinReq.solution, "Pin conflict");
                    },
                }, peripheralReq.id + "->" + pinReq.interfacePinName);
                if (debug.debug) {
                    this.name = "GPIO choice";
                }
            }
            GPIOChoice.prototype.apply = function (devicePinMap) {
                var choice = _.find(this.choices, function (_choice, name) {
                    return !(name in devicePinMap);
                });
                util.UpdateSolution(this.pinReq.solution, choice.peripheralPin.name, choice.devicePin.ball);
                devicePinMap[choice.devicePin.name] = new Requirement.DevicePinSolution();
                util.UpdateSolution(devicePinMap[choice.devicePin.name], choice.devicePin.ball, choice.peripheralPin.name);
                devicePinMap[choice.devicePin.name].requirementName = choice.peripheralChoice.peripheralReq.parentReqName;
                devicePinMap[choice.devicePin.name].requirementId = choice.peripheralChoice.peripheralReq.parentReqID;
                devicePinMap[choice.devicePin.name].interfacePin = this.pinReq.interfacePinName;
                choice.peripheralChoice.apply();
            };
            return GPIOChoice;
        }());
        PinChoices.GPIOChoice = GPIOChoice;
        var Error = (function (_super) {
            __extends(Error, _super);
            function Error(peripheralReq, pinReq, requirementName, interfacePin) {
                _super.call(this, requirementName, interfacePin.restrictsGPIO);
                this.peripheralReq = peripheralReq;
                this.pinReq = pinReq;
                if (debug.debug) {
                    this.name = "Pin conflict " + requirementName;
                }
            }
            Error.prototype.apply = function () {
                util.ClearSolution(this.pinReq.solution);
                if ("" === this.peripheralReq.peripheralSolution.errorText) {
                    util.AddErrorToSolution(this.pinReq.solution, "Pin conflict");
                }
            };
            return Error;
        }(AbstractErrorChoice));
        PinChoices.Error = Error;
    })(PinChoices = exports.PinChoices || (exports.PinChoices = {}));
    var MultiPinChoices = (function () {
        function MultiPinChoices(pinChoiceFactory) {
            this.pinChoiceFactory = pinChoiceFactory;
            this.combinationChoices = [];
            this.factories = [];
            this.multiPinReqs = [];
            this.peripheralReqs = [];
        }
        MultiPinChoices.prototype.newPinChoiceFactory = function (peripheralReq, multiPinReq) {
            try {
                var combinationChoices = [];
                var factory = new MultiPinChoices.PinChoiceFactory(multiPinReq, this.pinChoiceFactory, combinationChoices);
                this.combinationChoices.push(combinationChoices);
                this.factories.push(factory);
                this.multiPinReqs.push(multiPinReq);
                this.peripheralReqs.push(peripheralReq);
                return factory;
            }
            catch (errorText) {
                return new MultiPinChoices.InvalidRequirement(multiPinReq, errorText);
            }
        };
        MultiPinChoices.prototype.generateClauses = function () {
            var _this = this;
            cg.chooseAtLeastOneOf(this.combinationChoices, function (choiceName) { return _this.getError(choiceName); }, "must choose one possible combination for this multi-pin set");
            for (var _i = 0, _a = this.factories; _i < _a.length; _i++) {
                var factory = _a[_i];
                factory.generateClauses();
            }
        };
        MultiPinChoices.prototype.getError = function (factoryIndex) {
            var error = new MultiPinChoices.Error(this.multiPinReqs[factoryIndex], this.peripheralReqs[factoryIndex]);
            this.factories[factoryIndex].errorChoice = error.id;
            return error;
        };
        return MultiPinChoices;
    }());
    exports.MultiPinChoices = MultiPinChoices;
    var MultiPinChoices;
    (function (MultiPinChoices) {
        var PinChoiceFactory = (function () {
            function PinChoiceFactory(multiPinReq, pinChoiceFactory, combinationChoices) {
                this.pinChoiceFactory = pinChoiceFactory;
                this.combinationChoices = combinationChoices;
                this.pinChoices = [];
                this.pinChoicesByInterface = {};
                util.ClearSolution(multiPinReq.solution);
                for (var _i = 0, _a = multiPinReq.pinRequirements; _i < _a.length; _i++) {
                    var pinRequirement = _a[_i];
                    if (pinRequirement.used) {
                        var choice = new MultiPinChoices.InterfaceChoice(pinRequirement);
                        this.pinChoicesByInterface[pinRequirement.interfacePinName] = choice;
                        this.pinChoices.push(choice);
                    }
                }
                var combinations = this.nCr(this.pinChoices.length, multiPinReq.count);
                for (var _b = 0, combinations_1 = combinations; _b < combinations_1.length; _b++) {
                    var combination = combinations_1[_b];
                    var combinationChoice = new MultiPinChoices.CombinationChoice(combination, this.pinChoices);
                    this.combinationChoices.push(combinationChoice);
                }
            }
            PinChoiceFactory.prototype.generateClauses = function () {
                var _this = this;
                for (var _i = 0, _a = this.combinationChoices; _i < _a.length; _i++) {
                    var combinationChoice = _a[_i];
                    for (var _b = 0, _c = this.pinChoices; _b < _c.length; _b++) {
                        var pinChoice = _c[_b];
                        if (pinChoice.id in combinationChoice.pins) {
                            clauses.addLiteral(-combinationChoice.id);
                            clauses.addLiteral(pinChoice.id);
                            clauses.endClause("choice must be on if this comination is chosen");
                        }
                        else {
                            clauses.addLiteral(-combinationChoice.id);
                            clauses.addLiteral(-pinChoice.id);
                            clauses.endClause("choice must be off if this combination is chosen");
                        }
                    }
                }
                _.each(this.pinChoices, function (choice) {
                    if ("" !== choice.solution.errorText) {
                        clauses.addLiteral(-choice.id);
                        clauses.endClause("no valid device pins exist for this multi-pin choice");
                    }
                    else {
                        clauses.addLiteral(choice.id);
                        clauses.addLiteral(-_this.errorChoice);
                        clauses.endClause("choice try to resolve all pins if the error choice is chosen");
                    }
                }, this);
            };
            PinChoiceFactory.prototype.newChoice = function (peripheralChoice, peripheralPin, devicePin, pinReq) {
                return this.pinChoiceFactory.newChoice(peripheralChoice, peripheralPin, devicePin, pinReq, this.pinChoicesByInterface[pinReq.interfacePinName]);
            };
            PinChoiceFactory.prototype.nCr = function (n, r) {
                if (r > n) {
                    throw "Requested " + r + " out of " + n + " pins";
                }
                if (r === 0) {
                    throw "Requested 0 pins";
                }
                var combination = [];
                for (var i = 0; i < r; ++i) {
                    combination.push(i);
                }
                var combinations = [];
                while (combination) {
                    combinations.push(combination);
                    combination = this.increment_nCr(combination, n, r);
                }
                return combinations;
            };
            PinChoiceFactory.prototype.increment_nCr = function (lastCombination, n, r) {
                var combination = lastCombination.slice(0);
                var lastIndex = r - 1;
                combination[lastIndex]++;
                if (combination[lastIndex] >= n) {
                    if (lastIndex !== 0) {
                        combination = this.increment_nCr(combination, n - 1, r - 1);
                        if (combination) {
                            combination[lastIndex] = combination[lastIndex - 1] + 1;
                            return combination;
                        }
                    }
                    return null;
                }
                return combination;
            };
            return PinChoiceFactory;
        }());
        MultiPinChoices.PinChoiceFactory = PinChoiceFactory;
        var InterfaceChoice = (function (_super) {
            __extends(InterfaceChoice, _super);
            function InterfaceChoice(pinRequirement) {
                _super.call(this);
                if (debug.debug) {
                    this.name = pinRequirement.interfacePinName;
                }
                this.solution = pinRequirement.solution;
            }
            ;
            InterfaceChoice.prototype.apply = function () { };
            return InterfaceChoice;
        }(AbstractChoice));
        MultiPinChoices.InterfaceChoice = InterfaceChoice;
        var CombinationChoice = (function (_super) {
            __extends(CombinationChoice, _super);
            function CombinationChoice(combination, pinChoices) {
                _super.call(this);
                this.pins = {};
                this.notTheseSolutions = [];
                for (var i = 0; i < pinChoices.length; ++i) {
                    var pinChoice = pinChoices[i];
                    if (-1 !== combination.indexOf(i)) {
                        this.pins[pinChoice.id] = pinChoice;
                    }
                    else {
                        this.notTheseSolutions.push(pinChoice.solution);
                    }
                }
                if (debug.debug) {
                    this.name = "";
                    for (var i = 0; i < combination.length; ++i) {
                        this.name += pinChoices[combination[i]].name;
                        if (i !== combination.length - 1) {
                            this.name += " and ";
                        }
                    }
                }
            }
            CombinationChoice.prototype.apply = function () {
                for (var _i = 0, _a = this.notTheseSolutions; _i < _a.length; _i++) {
                    var solution = _a[_i];
                    util.ClearSolution(solution);
                }
            };
            return CombinationChoice;
        }(AbstractChoice));
        MultiPinChoices.CombinationChoice = CombinationChoice;
        var InvalidRequirement = (function () {
            function InvalidRequirement(multiPinReq, errorText) {
                util.AddErrorToSolution(multiPinReq.solution, errorText);
                for (var _i = 0, _a = multiPinReq.pinRequirements; _i < _a.length; _i++) {
                    var pinReq = _a[_i];
                    util.ClearSolution(pinReq.solution);
                }
            }
            InvalidRequirement.prototype.newChoice = function () {
                return false;
            };
            return InvalidRequirement;
        }());
        MultiPinChoices.InvalidRequirement = InvalidRequirement;
        var Error = (function (_super) {
            __extends(Error, _super);
            function Error(multiPinReq, peripheralReq) {
                _super.call(this, peripheralReq.id + "->Multi");
                this.multiPinReq = multiPinReq;
                this.peripheralReq = peripheralReq;
                if (debug.debug) {
                    this.name = "Multi-pin error " + peripheralReq.id;
                }
            }
            Error.prototype.apply = function () {
                util.ClearSolution(this.multiPinReq.solution);
                if ("" === this.peripheralReq.peripheralSolution.errorText) {
                    util.AddErrorToSolution(this.multiPinReq.solution, Error.errorText);
                }
            };
            Error.errorText = "Could not solve for all pins";
            return Error;
        }(AbstractErrorChoice));
        MultiPinChoices.Error = Error;
    })(MultiPinChoices = exports.MultiPinChoices || (exports.MultiPinChoices = {}));
    var IOSetChoices = (function () {
        function IOSetChoices(pinChoices) {
            this.pinChoices = pinChoices;
            this.byRequirement = new RelatedChoices();
        }
        IOSetChoices.prototype.newChoice = function (peripheralChoice, ioSet) {
            if (!isRealChoice(peripheralChoice)) {
                debug.logicError("IOSet is defined for standard GPIO");
            }
            else {
                var choice = new IOSetChoices.Choice(peripheralChoice, ioSet);
                this.byRequirement.get(peripheralChoice.id).push(choice);
            }
        };
        IOSetChoices.prototype.generateClauses = function () {
            var _this = this;
            cg.chooseOneOfOnlyIf(this.byRequirement, null, "must choose one ioset per requirement, but only if the matching peripheral is selected");
            this.byRequirement.forEach(function (_choices, peripheralChoiceId) {
                var ioSetChoices = _this.byRequirement.get(peripheralChoiceId);
                var pinChoices = _this.pinChoices.byPeripheral.get(peripheralChoiceId) || [];
                for (var _i = 0, pinChoices_1 = pinChoices; _i < pinChoices_1.length; _i++) {
                    var pinChoice = pinChoices_1[_i];
                    var pinExistsInAnyIOSet = false;
                    for (var _a = 0, ioSetChoices_1 = ioSetChoices; _a < ioSetChoices_1.length; _a++) {
                        var ioSetChoice = ioSetChoices_1[_a];
                        if (pinChoice.peripheralPin.name in ioSetChoice.ioSet.ioSetRules) {
                            pinExistsInAnyIOSet = true;
                            if (ioSetChoice.ioSet.ioSetRules[pinChoice.peripheralPin.name] === pinChoice.devicePin.name) {
                                clauses.addLiteral(ioSetChoice.id);
                            }
                        }
                    }
                    if (pinExistsInAnyIOSet) {
                        clauses.addLiteral(-pinChoice.id);
                        clauses.endClause("only choose a pin if it's mapping is in the chosen ioset, or the interface pin is not part of any ioset");
                    }
                }
            });
        };
        return IOSetChoices;
    }());
    exports.IOSetChoices = IOSetChoices;
    var IOSetChoices;
    (function (IOSetChoices) {
        var Choice = (function (_super) {
            __extends(Choice, _super);
            function Choice(peripheralChoice, ioSet) {
                _super.call(this);
                this.peripheralChoice = peripheralChoice;
                this.ioSet = ioSet;
                if (debug.debug) {
                    this.name = peripheralChoice.name + "->" + ioSet.name;
                }
            }
            Choice.prototype.apply = function () {
                this.peripheralChoice.peripheralReq.peripheralSolution.ioSet = this.ioSet.name;
            };
            return Choice;
        }(AbstractChoice));
        IOSetChoices.Choice = Choice;
    })(IOSetChoices = exports.IOSetChoices || (exports.IOSetChoices = {}));
    var PowerChoices = (function () {
        function PowerChoices(pinChoices, powerDomainSettings, powerDomainSettingsEnabled) {
            this.pinChoices = pinChoices;
            this.powerDomainSettings = powerDomainSettings;
            this.powerDomainSettingsEnabled = powerDomainSettingsEnabled;
            this.warnings = {};
            this.byPeripheral = new RelatedChoices();
            this.all = [];
            this.overrides = [];
        }
        PowerChoices.prototype.addRestrictions = function (peripheralChoices, peripheralReq) {
            if (this.powerDomainSettingsEnabled) {
                for (var _i = 0, peripheralChoices_1 = peripheralChoices; _i < peripheralChoices_1.length; _i++) {
                    var perfChoice = peripheralChoices_1[_i];
                    if (!isRealChoice(perfChoice)) {
                        debug.logicError("Power choices not yet supported for standard GPIO");
                    }
                    else {
                        var pinChoices = this.pinChoices.byPeripheral.get(perfChoice.id);
                        for (var _a = 0, pinChoices_2 = pinChoices; _a < pinChoices_2.length; _a++) {
                            var pinChoice = pinChoices_2[_a];
                            if (pinChoice.devicePin.powerDomain) {
                                var voltage = this.powerDomainSettings[pinChoice.devicePin.powerDomain.name];
                                if (voltage) {
                                    var powerChoice = this.getChoice(voltage, peripheralReq);
                                    powerChoice.pins.push(pinChoice);
                                }
                            }
                        }
                    }
                }
                if (peripheralReq.selectedVoltage !== util.Const.ANY) {
                    var choice = this.getChoice(peripheralReq.selectedVoltage, peripheralReq);
                    this.overrides.push(choice);
                    choice.isOverride = true;
                }
            }
        };
        PowerChoices.prototype.generateClauses = function () {
            var _this = this;
            cg.chooseAtLeastOneOf(this.byPeripheral, null, "choose at least one power choice per peripheral");
            cg.mutuallyExclusive(this.byPeripheral, function (choiceName) { return _this.getWarning(choiceName); }, "only allow one power choice unless there's a warning");
            cg.userOverrides(this.overrides, null, "power level override");
            for (var _i = 0, _a = this.all; _i < _a.length; _i++) {
                var powerChoice = _a[_i];
                for (var _b = 0, _c = powerChoice.pins; _b < _c.length; _b++) {
                    var pinChoice = _c[_b];
                    clauses.addLiteral(-pinChoice.id);
                    clauses.addLiteral(powerChoice.id);
                    clauses.endClause("either the pin is not selected, or the power choice is selected");
                }
            }
        };
        PowerChoices.prototype.getChoice = function (voltage, peripheralReq) {
            var powerChoices = this.byPeripheral.get(peripheralReq.id);
            var powerChoice = null;
            for (var i = 0; i < powerChoices.length && !powerChoice; ++i) {
                if (powerChoices[i].voltage === voltage) {
                    powerChoice = powerChoices[i];
                }
            }
            if (!powerChoice) {
                powerChoice = new PowerChoices.Choice(voltage, peripheralReq, powerChoices);
                this.all.push(powerChoice);
            }
            return powerChoice;
        };
        PowerChoices.prototype.getWarning = function (warningId) {
            if (warningId in this.warnings) {
                return this.warnings[warningId];
            }
            var warning = new PowerChoices.Warning(warningId);
            this.warnings[warningId] = warning;
            return warning;
        };
        return PowerChoices;
    }());
    exports.PowerChoices = PowerChoices;
    var PowerChoices;
    (function (PowerChoices) {
        var Choice = (function (_super) {
            __extends(Choice, _super);
            function Choice(voltage, peripheralReq, powerChoices) {
                _super.call(this);
                this.powerChoices = powerChoices;
                this.pins = [];
                this.isOverride = false;
                this.applied = false;
                this.voltage = voltage;
                this.voltageSolution = peripheralReq.voltageSolution;
                this.powerChoices.push(this);
                util.ClearSolution(this.voltageSolution);
                if (debug.debug) {
                    this.name = peripheralReq.name + " -> " + voltage;
                }
            }
            Choice.prototype.apply = function (devicePinMap) {
                if ("" === this.voltageSolution.assignedToName) {
                    util.UpdateSolution(this.voltageSolution, "", this.voltage);
                    this.applied = true;
                }
                else {
                    var appliedChoice = null;
                    for (var i = 0; i < this.powerChoices.length && !appliedChoice; ++i) {
                        if (this.powerChoices[i].applied) {
                            appliedChoice = this.powerChoices[i];
                        }
                    }
                    var warningChoice = this;
                    var appliedPinCount = this.countAppliedPins(appliedChoice.pins);
                    var warningPinCount = this.countAppliedPins(warningChoice.pins);
                    if ((appliedPinCount < warningPinCount && !appliedChoice.isOverride) || warningChoice.isOverride) {
                        warningChoice = appliedChoice;
                        appliedChoice = this;
                    }
                    util.UpdateSolution(appliedChoice.voltageSolution, "", appliedChoice.voltage);
                    appliedChoice.applied = true;
                    warningChoice.applied = false;
                    for (var _i = 0, _a = warningChoice.pins; _i < _a.length; _i++) {
                        var pin = _a[_i];
                        if (pin.applied) {
                            var warningText = pin.devicePin.powerDomain.name + " is set to " + warningChoice.voltage;
                            util.AddWarningToSolution(pin.pinReq.solution, warningText);
                            util.AddWarningToSolution(devicePinMap[pin.devicePin.name], warningText);
                        }
                    }
                }
            };
            Choice.prototype.countAppliedPins = function (pins) {
                var count = 0;
                for (var _i = 0, pins_1 = pins; _i < pins_1.length; _i++) {
                    var pin = pins_1[_i];
                    if (pin.applied) {
                        ++count;
                    }
                }
                return count;
            };
            return Choice;
        }(AbstractChoice));
        PowerChoices.Choice = Choice;
        var Warning = (function () {
            function Warning(warningId) {
                this.id = choiceArray.pushWarning(this, warningId);
                if (debug.debug) {
                    this.name = "Power warning " + warningId;
                }
            }
            Warning.prototype.apply = function () { };
            return Warning;
        }());
        PowerChoices.Warning = Warning;
    })(PowerChoices = exports.PowerChoices || (exports.PowerChoices = {}));
});
//# sourceMappingURL=choiceFactories.js.map