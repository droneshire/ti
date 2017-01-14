define(["require", "exports", "$rootScope"], function (require, exports, rootScope) {
    "use strict";
    exports.configure = "Start a new project.";
    exports.loadProject = "Load an existing project.";
    exports.saveProject = "Save current settings to a pinmux design project.";
    exports.saveAsProject = "Save As";
    exports.generate = "Generate output based on the current mux configuration.";
    exports.about = "Information on PinMux version.";
    exports.addRequirement = "Add peripheral requirement.";
    exports.removeRequirement = "Remove peripheral requirement.";
    exports.filterPeripherals = "Type text to filter available peripherals.";
    exports.configurePowerDomains = "Configure power domains.";
    exports.viewIOSets = "View all IO Sets. Note: This is a read only view; IO Sets are automatically resolved.";
    exports.checkPinRequirement = "Enable/disable signal.";
    exports.pinSelection = "Select pin for this signal. Use \"Any\" for automatic resolution.";
    exports.peripheralSelection = "Select peripheral. Use \"Any\" for automatic resolution.";
    exports.reset = "Reset and start a new project.";
    exports.sortAlpha = "Sort column ascending/descending by name.";
    exports.selectInterface = "Show requirements view for current peripheral.";
    exports.lockedSelection = "Current user selection cannot be changed by the solver when resolving other requirements.";
    rootScope["srvToolTip"] = exports;
});
//# sourceMappingURL=toolTip.js.map