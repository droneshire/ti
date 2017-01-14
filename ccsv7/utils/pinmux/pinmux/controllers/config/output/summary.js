define(["require", "exports", "$scope", "$rootScope", "services/project", "services/analytics", "services/style", "services/layout", "services/config", "services/extendScope", "services/requirements"], function (require, exports, $scope, $rootScope, srvProject, srvAnalytics, srvStyle, srvLayout, srvConfig, extendScope, Requirement) {
    "use strict";
    ;
    ;
    var summaryScope = extendScope($scope, {
        srvStyle: srvStyle,
        showLibraryColumn: 0,
        showSummarySection: false,
        interfaceArr: [],
        errorListArr: [],
        warningListArr: [],
        curPriority: 0,
        errorListExpanded: false,
        warningListExpanded: false,
        setSummaryVisibility: setSummaryVisibility,
        setLibraryColumn: setLibraryColumn,
        summaryRequirementClicked: summaryRequirementClicked,
        generateConfigErrorWarningList: generateConfigErrorWarningList,
        summaryInterfaceClicked: summaryInterfaceClicked,
        errorWarningClicked: errorWarningClicked,
        expandList: expandList,
        minimizeList: minimizeList,
        interfaceWithRequirementsFilter: interfaceWithRequirementsFilter
    });
    function setLibraryColumn(val) {
        summaryScope.showLibraryColumn = val;
    }
    ;
    function setSummaryVisibility() {
        summaryScope.showSummarySection = !summaryScope.showSummarySection;
    }
    ;
    function summaryInterfaceClicked(interfaceName) {
        srvConfig.setSelectedByName(interfaceName);
        srvAnalytics.record("summaryInterfaceClicked", {
            "interfaceName": interfaceName
        });
    }
    ;
    function summaryRequirementClicked(interfaceName, requirementName) {
        srvConfig.setSelectedByName(interfaceName, requirementName);
        srvAnalytics.record("summaryRequirementClicked", {
            "requirementName": requirementName,
            "interfaceName": interfaceName
        });
    }
    ;
    function generateConfigErrorWarningList() {
        summaryScope.interfaceArr = [];
        summaryScope.errorListArr = [];
        summaryScope.warningListArr = [];
        summaryScope.errorListExpanded = false;
        summaryScope.warningListExpanded = false;
        summaryScope.curPriority = 0;
        var uiInterfaces = srvConfig.getInterfaces();
        _.forEach(uiInterfaces, function (uiInterface) {
            var key = uiInterface.name;
            var myInterface = {
                name: key,
                obj: uiInterface
            };
            summaryScope.interfaceArr.push(myInterface);
            var curInterfaceReq = uiInterface.interfaceRequirement;
            if ((curInterfaceReq.solution.errorText !== "") || (curInterfaceReq.solution.warningText !== "")) {
                for (var i = 0; i < curInterfaceReq.requirements.length; i++) {
                    var curRequirement = curInterfaceReq.requirements[i];
                    parseSolutions([curRequirement.peripheralSolution, curRequirement.nonSolverSolution], key, curRequirement);
                    for (var j = 0; j < curRequirement.pinRequirements.length; j++) {
                        var curPinRequirement = curRequirement.pinRequirements[j];
                        if (!Requirement.isMultiPin(curPinRequirement)) {
                            parseSolutionForErrorWarning(curPinRequirement.solution, key, curRequirement, curPinRequirement.interfacePinName, "pin");
                        }
                        else {
                            for (var k = 0; k < curPinRequirement.pinRequirements.length; k++) {
                                var curMultiPinRequirement = curPinRequirement.pinRequirements[k];
                                parseSolutionForErrorWarning(curMultiPinRequirement.solution, key, curRequirement, curMultiPinRequirement.interfacePinName, "pin");
                            }
                        }
                    }
                }
            }
        });
        $rootScope.$emit("onErrorTextChanged", summaryScope.errorListArr.length);
    }
    ;
    function parseSolutions(solutions, key, curRequirement) {
        _.each(solutions, function (solution) {
            if (solution.errorDetailsText.length > 0 || solution.warningDetailsText.length > 0) {
                parseSolutionForErrorWarning(solution, key, curRequirement, "", "peripheral");
            }
        });
    }
    function createListItem(curSolution, key, curRequirement, curPinName, curCategory, errorType) {
        var item = {
            interfaceName: key,
            requirementName: curRequirement.parentReqName ? curRequirement.parentReqName : curRequirement.name,
            requirementID: curRequirement.parentReqID ? curRequirement.parentReqID : curRequirement.id,
            pinName: curPinName,
            category: curCategory,
            text: errorType ? curSolution.errorText : curSolution.warningText,
            priority: 0,
            showDetail: false,
            highlight: false,
            detailList: [],
        };
        var details = errorType ? curSolution.errorDetailsText : curSolution.warningDetailsText;
        for (var k = 0; k < details.length; k++) {
            item.detailList.push({
                text: details[k]
            });
        }
        return item;
    }
    function parseSolutionForErrorWarning(curSolution, key, curRequirement, curPinName, curCategory) {
        if (curSolution.errorText !== "") {
            summaryScope.errorListArr.push(createListItem(curSolution, key, curRequirement, curPinName, curCategory, true));
        }
        else if (curSolution.warningText !== "") {
            summaryScope.warningListArr.push(createListItem(curSolution, key, curRequirement, curPinName, curCategory, false));
        }
    }
    function errorWarningClicked(obj, type) {
        obj.showDetail = !obj.showDetail;
        if (!obj.showDetail) {
            obj.highlight = false;
        }
        if (curLayout === srvLayout.layoutDefine.desktop ||
            (curLayout === srvLayout.layoutDefine.tablet && srvLayout.getColTabletShow()[1]) ||
            (curLayout === srvLayout.layoutDefine.mobile && srvLayout.getColMobileShow()[1])) {
            srvConfig.setSelectedByName(obj.interfaceName, obj.requirementName);
        }
        srvAnalytics.record("errorWarningSummaryClicked", {
            "type": type,
            "text": obj.text,
            "interfaceName": obj.interfaceName,
            "requirementName": obj.requirementName,
            "pinName": obj.pinName,
            "category": obj.category
        });
    }
    ;
    function expandList(list, type) {
        if (type == "error") {
            summaryScope.errorListExpanded = true;
        }
        else {
            summaryScope.warningListExpanded = true;
        }
        _.each(list, function (item) {
            item.showDetail = true;
        });
    }
    ;
    function minimizeList(list, type) {
        if (type == "error") {
            summaryScope.errorListExpanded = false;
        }
        else {
            summaryScope.warningListExpanded = false;
        }
        _.each(list, function (item) {
            item.highlight = false;
            item.showDetail = false;
        });
    }
    ;
    function displayCurrentErrorWarning(data) {
        var curCategory = data.category;
        var interfaceName = data.interfaceName;
        var requirementID = data.requirementID;
        var curPinName = data.pinName;
        var curText = data.text;
        var type = data.type;
        summaryScope.showSummarySection = true;
        var curList;
        if (type == "error") {
            summaryScope.showLibraryColumn = 1;
            curList = summaryScope.errorListArr;
        }
        else if (type == "warning") {
            summaryScope.showLibraryColumn = 2;
            curList = summaryScope.warningListArr;
        }
        var foundErrorWarning;
        _.each(curList, function (item) {
            item.highlight = false;
            if ((item.interfaceName === interfaceName) &&
                (item.requirementID === requirementID) &&
                ((item.category === curCategory) || (typeof item.category === "undefined")) &&
                ((item.text === curText) || (typeof item.text === "undefined")) &&
                ((curPinName === "") || (item.pinName === curPinName))) {
                foundErrorWarning = item;
            }
        });
        if (foundErrorWarning) {
            summaryScope.curPriority += 1;
            foundErrorWarning.priority = summaryScope.curPriority;
            foundErrorWarning.showDetail = true;
            foundErrorWarning.highlight = true;
            if (type === "error") {
                $("#errorLibraryContent").stop().animate({
                    scrollTop: 0
                }, 0);
            }
            else if (type === "warning") {
                $("#warningLibraryContent").stop().animate({
                    scrollTop: 0
                }, 0);
            }
        }
        srvAnalytics.record("errorWarningButtonClicked", data);
    }
    function interfaceWithRequirementsFilter(curInterface) {
        return curInterface.obj.peripheralRequirementsLength() > 0;
    }
    ;
    var unregs = [];
    unregs.push($rootScope.$on("onSolveComplete", function () {
        summaryScope.generateConfigErrorWarningList();
    }));
    unregs.push($rootScope.$on("onGenerateConfigErrorWarningList", function () {
        summaryScope.generateConfigErrorWarningList();
    }));
    var curLayout = srvLayout.getCurLayout();
    unregs.push($rootScope.$on("layoutChanged", function (_event, newLayout) {
        curLayout = newLayout;
    }));
    unregs.push($rootScope.$on("displayCurrentErrorWarning", function (_event, data) {
        displayCurrentErrorWarning(data);
    }));
    summaryScope.$on("$destroy", function () { return _.each(unregs, function (unreg) { return unreg(); }); });
    summaryScope.generateConfigErrorWarningList();
    srvProject.initialNumErrors = summaryScope.errorListArr.length;
});
//# sourceMappingURL=summary.js.map