define(["require", "exports"], function (require, exports) {
    "use strict";
    function UpdateSolution(solution, pnameDecoratorText, passignedToName) {
        solution.nameDecoratorText = pnameDecoratorText.trim();
        if (!passignedToName.trim)
            debugger;
        solution.assignedToName = passignedToName.trim();
        solution.errorText = "";
        solution.warningText = "";
        solution.warningDetailsText = [];
        solution.errorDetailsText = [];
        delete solution.gpioPinsUsed;
        delete solution.gpioPinsTotal;
        delete solution.ioSet;
    }
    exports.UpdateSolution = UpdateSolution;
    ;
    function AddErrorToSolution(solution, errorText) {
        solution.errorText = errorText.trim();
    }
    exports.AddErrorToSolution = AddErrorToSolution;
    ;
    function AddWarningToSolution(solution, warningText) {
        solution.warningDetailsText.push(warningText.trim());
        solution.warningText = "Voltage conflict";
    }
    exports.AddWarningToSolution = AddWarningToSolution;
    ;
    function AddSolverWarningToSolution(solution) {
        solution.warningDetailsText.push("Solver: 'There seems to be a large set of peripherals to choose from here. It might take me a while to find one that doesn't create any pin conflicts here or elsewhere. You can make my job easier by specifying the exact peripheral to use, or by adding these peripherals once you've got the rest of your setup complete.'");
        solution.warningText = "Performance warning";
    }
    exports.AddSolverWarningToSolution = AddSolverWarningToSolution;
    ;
    function AddErrorDetailsToSolution(solution, detailsText) {
        solution.errorDetailsText.push(detailsText.trim());
    }
    exports.AddErrorDetailsToSolution = AddErrorDetailsToSolution;
    ;
    function RemoveErrorDetailsToSolution(solution, detailsText) {
        solution.errorDetailsText = _(solution.errorDetailsText).without(detailsText.trim());
    }
    exports.RemoveErrorDetailsToSolution = RemoveErrorDetailsToSolution;
    ;
    function createText(count, text) {
        switch (count) {
            case 0:
                return "";
            case 1:
                return count + " " + text;
            default:
                return count + " " + text + "s";
        }
    }
    function addSummary(solution, errorCount, warningCount, gpioPinsUsed, gpioPinsTotal) {
        solution.errorText = createText(errorCount, "error");
        solution.warningText = createText(warningCount, "warning");
        solution.gpioPinsUsed = gpioPinsUsed;
        if (undefined !== gpioPinsTotal) {
            solution.gpioPinsTotal = gpioPinsTotal;
        }
    }
    function AddSummaryToSolution(solution, solverErrorCount, warningCount, gpioPinsUsed, gpioPinsTotal) {
        solution.errorCount = solverErrorCount;
        var nonSolverErrorCount = solution.nonSolverErrorCount ? solution.nonSolverErrorCount : 0;
        addSummary(solution, solution.errorCount + nonSolverErrorCount, warningCount, gpioPinsUsed, gpioPinsTotal);
    }
    exports.AddSummaryToSolution = AddSummaryToSolution;
    ;
    function AddNonSolverSummary(solution, nonSolverErrorCount) {
        solution.nonSolverErrorCount = nonSolverErrorCount;
        addSummary(solution, solution.errorCount + solution.nonSolverErrorCount, solution.warningCount, solution.gpioPinsTotal, solution.gpioPinsTotal);
    }
    exports.AddNonSolverSummary = AddNonSolverSummary;
    ;
    function ClearSolution(solution) {
        UpdateSolution(solution, "", "");
    }
    exports.ClearSolution = ClearSolution;
    ;
    function getFileName(filePath) {
        var path = require("path");
        return path.basename(filePath);
    }
    exports.getFileName = getFileName;
    ;
    function getWindowHeight() {
        if (isNode()) {
            var gui = require("nw.gui");
            var win = gui.Window.get().window;
            return win.innerHeight;
        }
        else {
            return $(window).innerHeight();
        }
    }
    exports.getWindowHeight = getWindowHeight;
    ;
    var Const;
    (function (Const) {
        Const.ANY = "Any";
        Const.MULTIPIN = "Multi";
        Const.SINGLEPIN = "Single";
    })(Const = exports.Const || (exports.Const = {}));
    function isLegacy(configurable) {
        return configurable.legacy;
    }
    exports.isLegacy = isLegacy;
    function isCheckBox(configurable) {
        return configurable.type === "CheckBox";
    }
    exports.isCheckBox = isCheckBox;
    function isDropDown(configurable) {
        return configurable.type === "DropDown";
    }
    exports.isDropDown = isDropDown;
    function isTextBox(configurable) {
        return configurable.type === "TextBox";
    }
    exports.isTextBox = isTextBox;
});
//# sourceMappingURL=utils.js.map