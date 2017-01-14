define(["require", "exports", "layout"], function (require, exports, srvLayout) {
    "use strict";
    function getTriangleGlyphClass(hide) {
        if (hide) {
            return "glyphicon glyphicon-triangle-right";
        }
        else {
            return "glyphicon glyphicon-triangle-bottom";
        }
    }
    exports.getTriangleGlyphClass = getTriangleGlyphClass;
    ;
    function getLibraryTabClass(index, showLibraryColumn) {
        if (index == showLibraryColumn) {
            return "active";
        }
        return "";
    }
    exports.getLibraryTabClass = getLibraryTabClass;
    ;
    function getErrorWarningListClass(obj) {
        var rtnVal = "list-group-item";
        if (obj.highlight) {
            rtnVal += " highlight";
        }
        return rtnVal;
    }
    exports.getErrorWarningListClass = getErrorWarningListClass;
    function getPeripheralTab2Class() {
        if (srvLayout.getTabletRequirementCol() == 1 && $(window).width() <= 1200) {
            return "";
        }
        return "hideTab";
    }
    exports.getPeripheralTab2Class = getPeripheralTab2Class;
    function getPeripheralTab3Class() {
        if (srvLayout.getTabletRequirementCol() == 2 && $(window).width() <= 1200) {
            return "";
        }
        return "hideTab";
    }
    exports.getPeripheralTab3Class = getPeripheralTab3Class;
    function getRequirementTab1Class() {
        if (srvLayout.getTabletRequirementCol() == 1 && $(window).width() <= 1200) {
            return "";
        }
        return "hideTab";
    }
    exports.getRequirementTab1Class = getRequirementTab1Class;
    function getRequirementTab3Class() {
        if (srvLayout.getTabletRequirementCol() == 2 && $(window).width() <= 1200) {
            return "";
        }
        return "hideTab";
    }
    exports.getRequirementTab3Class = getRequirementTab3Class;
    function outputTab1Class() {
        if (srvLayout.getTabletRequirementCol() == 1 && $(window).width() <= 1200) {
            return "";
        }
        return "hideTab";
    }
    exports.outputTab1Class = outputTab1Class;
    function outputTab2Class() {
        if (srvLayout.getTabletRequirementCol() == 2 && $(window).width() <= 1200) {
            return "";
        }
        return "hideTab";
    }
    exports.outputTab2Class = outputTab2Class;
    function getMobileTabClass(colNum) {
        if (srvLayout.getColMobileShow()[colNum - 1]) {
            return "active";
        }
        return "";
    }
    exports.getMobileTabClass = getMobileTabClass;
    function getMobileButtonClass(colNum) {
        var rtnStr = "mobileButton ";
        if (srvLayout.getColMobileShow()[colNum - 1]) {
            rtnStr += " mobileButtonActive";
        }
        else {
            rtnStr += " mobileButtonInactive";
        }
        return rtnStr;
    }
    exports.getMobileButtonClass = getMobileButtonClass;
    function getInterfaceDivClass(peripheralInterface) {
        if (peripheralInterface.maxAllowed === 0) {
            return "disabled";
        }
        return "";
    }
    exports.getInterfaceDivClass = getInterfaceDivClass;
    function getInterfaceButtonClass(uiInterface, first, last, selectedInterface) {
        var rtnClass = "btn btn-xs";
        if (first) {
            rtnClass += " first";
        }
        if (last) {
            rtnClass += " last";
        }
        if (selectedInterface && selectedInterface.name === uiInterface.name) {
            return rtnClass + " listButtonSelected";
        }
        else if (uiInterface.interfaceRequirement.solution.errorText !== "") {
            return rtnClass + " errorBGLite";
        }
        else if (uiInterface.interfaceRequirement.solution.warningText !== "") {
            return rtnClass + " warningBGLite";
        }
        else if (uiInterface.interfaceRequirement.requirements.length > 0) {
            return rtnClass + " validBGLite";
        }
        return rtnClass + " title";
    }
    exports.getInterfaceButtonClass = getInterfaceButtonClass;
    function getInterfacePlusButtonClass(first, last) {
        var rtnClass = "btn btn-default btn-xs";
        if (first) {
            rtnClass += " first";
        }
        if (last) {
            rtnClass += " last";
        }
        return rtnClass;
    }
    exports.getInterfacePlusButtonClass = getInterfacePlusButtonClass;
    function getBadgeClass(uiInterface) {
        if (uiInterface.interfaceRequirement.solution.errorText !== "") {
            return "badge errorBG interfaceTextBadge";
        }
        else if (uiInterface.interfaceRequirement.solution.warningText !== "") {
            return "badge warningBG interfaceTextBadge";
        }
        else if (uiInterface.interfaceRequirement.requirements.length > 0) {
            return "badge validBG interfaceTextBadge";
        }
        return "badge zeroBG interfaceTextBadge";
    }
    exports.getBadgeClass = getBadgeClass;
    function getInterfaceStatusGlyphClass(uiInterface) {
        if (uiInterface.interfaceRequirement.solution.errorText !== "") {
            return "glyphicon glyphicon-ban-circle errorFG";
        }
        else if (uiInterface.interfaceRequirement.solution.warningText !== "") {
            return "iconWarning";
        }
        else if (uiInterface.interfaceRequirement.requirements.length > 0) {
            return "glyphicon glyphicon-ok validFG";
        }
        return "";
    }
    exports.getInterfaceStatusGlyphClass = getInterfaceStatusGlyphClass;
    function getReqButtonClass(req, first, last, selectedRequirement) {
        var rtnStr = "btn btn-xs";
        if (first && last) {
            rtnStr += " only";
        }
        else if (first) {
            rtnStr += " first";
        }
        else if (last) {
            rtnStr += " last";
        }
        if (selectedRequirement && selectedRequirement.requirement.id === req.requirement.id) {
            rtnStr += " listButtonSelected";
        }
        else if (req.requirement.solution.errorText !== "") {
            rtnStr += " errorBGLite";
        }
        else if (req.requirement.solution.warningText !== "") {
            rtnStr += " warningBGLite";
        }
        else {
            rtnStr += " validBGLite";
        }
        return rtnStr;
    }
    exports.getReqButtonClass = getReqButtonClass;
    function getReqMinusButtonClass(first, last) {
        var rtnStr = "btn btn-default btn-xs";
        if (first && last) {
            rtnStr += " only";
        }
        else if (first) {
            rtnStr += " first";
        }
        else if (last) {
            rtnStr += " last";
        }
        return rtnStr;
    }
    exports.getReqMinusButtonClass = getReqMinusButtonClass;
    function getCol1Class() {
        if ($(window).width() <= 1200) {
            return "newCol1";
        }
        if (srvLayout.getCol1Active() && !srvLayout.getCol3Active()) {
            return "newCol1 minusNewCol3";
        }
        else if (srvLayout.getCol1Active()) {
            return "newCol1 normal";
        }
        return "newCol1 inactive";
    }
    exports.getCol1Class = getCol1Class;
    function getCol2Class() {
        if ($(window).width() <= 1200) {
            if (srvLayout.getTabletRequirementCol() == 1) {
                return "minusNewCol1 newCol2 normal";
            }
            else {
                return "newCol2";
            }
        }
        if (!srvLayout.getCol1Active() && !srvLayout.getCol3Active()) {
            return "newCol2 minusNewCol13";
        }
        else if (!srvLayout.getCol1Active()) {
            return "newCol2 minusNewCol1";
        }
        else if (!srvLayout.getCol3Active()) {
            return "newCol2 minusNewCol3";
        }
        return "newCol2 normal";
    }
    exports.getCol2Class = getCol2Class;
    function getCol3Class(codePreviewViewStatus) {
        if ($(window).width() <= 1200) {
            return "newCol3";
        }
        var rtnStr = "newCol3";
        if (srvLayout.getCol3Active() && !srvLayout.getCol1Active()) {
            rtnStr += " minusNewCol1";
        }
        else if (!srvLayout.getCol3Active()) {
            rtnStr += " inactive";
        }
        if (codePreviewViewStatus) {
            rtnStr += " newCol3CodePreview";
        }
        return rtnStr;
    }
    exports.getCol3Class = getCol3Class;
    function getShowHideIconClass1() {
        if (srvLayout.getCol1Active()) {
            return "glyphicon-triangle-left";
        }
        return "glyphicon-triangle-right";
    }
    exports.getShowHideIconClass1 = getShowHideIconClass1;
    function getShowHideIconClass3() {
        if (srvLayout.getCol3Active()) {
            return "glyphicon-triangle-right";
        }
        return "glyphicon-triangle-left";
    }
    exports.getShowHideIconClass3 = getShowHideIconClass3;
    function getRequirementLabelClass(requirement) {
        var rtnVal = "label shadow1 shadowButton";
        if (requirement.solution.errorText !== "") {
            rtnVal += " label-danger errorLabel";
        }
        else if (requirement.solution.warningText !== "") {
            rtnVal += " label-warning warningLabel";
        }
        else {
            rtnVal += " label-default requirementLabel";
        }
        return rtnVal;
    }
    exports.getRequirementLabelClass = getRequirementLabelClass;
});
//# sourceMappingURL=style.js.map