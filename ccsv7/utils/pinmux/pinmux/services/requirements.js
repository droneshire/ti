var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "utils"], function (require, exports, util) {
    "use strict";
    var Solution = (function () {
        function Solution() {
            this.nameDecoratorText = "";
            this.assignedToName = "";
            this.errorText = "";
            this.warningText = "";
            this.errorDetailsText = [];
            this.warningDetailsText = [];
            this.errorCount = 0;
            this.warningCount = 0;
            this.nonSolverErrorCount = 0;
        }
        return Solution;
    }());
    exports.Solution = Solution;
    var DevicePinSolution = (function (_super) {
        __extends(DevicePinSolution, _super);
        function DevicePinSolution() {
            _super.apply(this, arguments);
            this.requirementName = "";
            this.requirementId = "";
            this.interfacePin = "";
        }
        return DevicePinSolution;
    }(Solution));
    exports.DevicePinSolution = DevicePinSolution;
    var Abstract = (function () {
        function Abstract() {
            this.used = true;
            this.solution = new Solution();
            this.nonSolverSolution = new Solution();
        }
        return Abstract;
    }());
    exports.Abstract = Abstract;
    var AbstractPin = (function (_super) {
        __extends(AbstractPin, _super);
        function AbstractPin() {
            _super.apply(this, arguments);
            this.assignedToName = util.Const.ANY;
            this.removable = false;
        }
        return AbstractPin;
    }(Abstract));
    exports.AbstractPin = AbstractPin;
    function isMultiPin(pin) {
        return pin.type == util.Const.MULTIPIN;
    }
    exports.isMultiPin = isMultiPin;
    var Pin = (function (_super) {
        __extends(Pin, _super);
        function Pin(useCasePin) {
            _super.call(this);
            this.type = util.Const.SINGLEPIN;
            this.used = true;
            this.name = useCasePin.name;
            this.interfacePinName = useCasePin.interfacePin.name;
        }
        return Pin;
    }(AbstractPin));
    exports.Pin = Pin;
    var MultiPin = (function (_super) {
        __extends(MultiPin, _super);
        function MultiPin(count, pinRequirements) {
            _super.call(this);
            this.type = util.Const.MULTIPIN;
            this.used = true;
            this.assignedToName = util.Const.ANY;
            this.solution = new Solution();
            this.defaultCount = count;
            this.pinRequirements = pinRequirements;
            this.count = count;
        }
        return MultiPin;
    }(AbstractPin));
    exports.MultiPin = MultiPin;
    var Peripheral = (function (_super) {
        __extends(Peripheral, _super);
        function Peripheral(id, interfaceName, parentMultiPerphReqID, parentMultiPerphReqName) {
            _super.call(this);
            this.selectedInstance = util.Const.ANY;
            this.selectedVoltage = util.Const.ANY;
            this.selectedUseCase = null;
            this.pinRequirements = [];
            this.peripheralSolution = new Solution();
            this.voltageSolution = new Solution();
            this.isNameValid = true;
            this.assignedToName = "";
            this.id = id;
            this.name = id;
            this.interfaceName = interfaceName;
            this.parentReqName = parentMultiPerphReqName;
            this.parentReqID = parentMultiPerphReqID;
        }
        return Peripheral;
    }(Abstract));
    exports.Peripheral = Peripheral;
    var Device = (function (_super) {
        __extends(Device, _super);
        function Device() {
            _super.apply(this, arguments);
            this.devicePinMap = {};
            this.powerDomainSettings = {};
            this.powerDomainSettingsEnabled = false;
            this.groupRequirements = {};
            this.version = "2.0.0";
        }
        return Device;
    }(Abstract));
    exports.Device = Device;
    var BaseGroup = (function (_super) {
        __extends(BaseGroup, _super);
        function BaseGroup(pname) {
            _super.call(this);
            this.requirementsNameIndex = 1;
            this.numOfGPIOPins = 0;
            this.name = pname;
            this.id = pname;
        }
        return BaseGroup;
    }(Abstract));
    exports.BaseGroup = BaseGroup;
    var Group = (function (_super) {
        __extends(Group, _super);
        function Group(pname) {
            _super.call(this, pname);
            this.requirements = [];
        }
        return Group;
    }(BaseGroup));
    exports.Group = Group;
    var GPIOGroup = (function (_super) {
        __extends(GPIOGroup, _super);
        function GPIOGroup(pname) {
            _super.call(this, pname);
            this.requirements = [];
        }
        return GPIOGroup;
    }(BaseGroup));
    exports.GPIOGroup = GPIOGroup;
    function uniqueInternalReqName(requirement) {
        return requirement.id + "_intenal_" + requirement.requirementsNameIndex++;
    }
    exports.uniqueInternalReqName = uniqueInternalReqName;
    function adaptLegacyPeripheralRequirement(peripheralRequirement, interfaceName) {
        peripheralRequirement.interfaceName = interfaceName;
        return peripheralRequirement;
    }
    function loadLegacyNonStandardGPIO(groupRequirement, interfaceName) {
        groupRequirement.name = interfaceName;
        groupRequirement.id = interfaceName;
        _(groupRequirement.requirements).each(function (peripheralRequirement) {
            peripheralRequirement = adaptLegacyPeripheralRequirement(peripheralRequirement, interfaceName);
        });
        return groupRequirement;
    }
    function loadLegacyStandardGPIO(groupRequirement, interfaceName) {
        var rootGroupRequirement = new GPIOGroup(interfaceName);
        rootGroupRequirement.solution = groupRequirement.solution;
        _(groupRequirement.requirements).each(function (peripheralRequirement) {
            peripheralRequirement = adaptLegacyPeripheralRequirement(peripheralRequirement, interfaceName);
            var parentGroupRequirement = new Group(peripheralRequirement.name);
            parentGroupRequirement.id = peripheralRequirement.id;
            parentGroupRequirement.numOfGPIOPins = 1;
            peripheralRequirement.id = uniqueInternalReqName(parentGroupRequirement);
            peripheralRequirement.name = peripheralRequirement.id;
            peripheralRequirement.parentReqName = parentGroupRequirement.name;
            peripheralRequirement.parentReqID = parentGroupRequirement.id;
            parentGroupRequirement.requirements.push(peripheralRequirement);
            rootGroupRequirement.requirements.push(parentGroupRequirement);
            rootGroupRequirement.requirementsNameIndex++;
        });
        return rootGroupRequirement;
    }
    function adaptToVersion(deviceRequirement, isStandardGPIO) {
        deviceRequirement.groupRequirements = {};
        deviceRequirement.version = "2.0.0";
        _.each(deviceRequirement.interfaceRequirementsMap, function (groupRequirement, interfaceName) {
            if (interfaceName === "GPIO" && isStandardGPIO) {
                deviceRequirement.groupRequirements[interfaceName] = loadLegacyStandardGPIO(groupRequirement, interfaceName);
            }
            else {
                deviceRequirement.groupRequirements[interfaceName] = loadLegacyNonStandardGPIO(groupRequirement, interfaceName);
            }
        });
        return deviceRequirement;
    }
    function adaptPowerDomainSettings(deviceRequirement) {
        if (deviceRequirement.powerDomainSettings) {
            if (typeof deviceRequirement.powerDomainSettingsEnabled === "undefined") {
                deviceRequirement.powerDomainSettingsEnabled = true;
            }
        }
        else {
            deviceRequirement.powerDomainSettingsEnabled = false;
            deviceRequirement.powerDomainSettings = {};
        }
        return deviceRequirement;
    }
    function validate(deviceRequirement) {
        var ids = {};
        function validateRequirement(requirement) {
            var existingObj = ids[requirement.id];
            if (existingObj) {
                throw new Error("Conflicting ID -> " + requirement.id);
            }
            ids[requirement.id] = requirement;
            _(requirement.requirements).each(function (childRequirement) {
                validateRequirement(childRequirement);
            });
        }
        _(deviceRequirement.groupRequirements).map(function (requirement) {
            validateRequirement(requirement);
        });
    }
    function Adapt(deviceRequirement, isStandardGPIO) {
        deviceRequirement = adaptPowerDomainSettings(deviceRequirement);
        if (deviceRequirement.version !== "2.0.0") {
            deviceRequirement = adaptToVersion(deviceRequirement, isStandardGPIO);
        }
        deviceRequirement.interfaceRequirementsMap = {};
        validate(deviceRequirement);
        return deviceRequirement;
    }
    exports.Adapt = Adapt;
});
//# sourceMappingURL=requirements.js.map