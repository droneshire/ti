define(["require", "exports", "$rootScope", "services/config"], function (require, exports, $rootScope, srvConfig) {
    "use strict";
    function getErrorText(uiRequirement, requirementName, requirementsWithMatchingNames) {
        if (requirementsWithMatchingNames.length === 1)
            return "";
        var interfaceName = uiRequirement.parentInterface.name;
        var conflictingInterfaceNames = _.chain(requirementsWithMatchingNames)
            .pluck("parentInterface")
            .pluck("name")
            .value();
        var toRemove = _.findIndex(conflictingInterfaceNames, function (val) {
            return val === interfaceName;
        });
        conflictingInterfaceNames.splice(toRemove, 1);
        return "Name " + requirementName + " already exists on " + _.unique(conflictingInterfaceNames);
    }
    function getAllRequirements() {
        var interfaces = srvConfig.getInterfaces();
        return _.chain(interfaces)
            .pluck("peripheralRequirements")
            .flatten()
            .value();
    }
    function clearSetError(currentUIRequirement, errorText) {
        var stateChagned = !!(currentUIRequirement.requirement.requirementNameErrorMessage || errorText);
        if (currentUIRequirement.requirement.requirementNameErrorMessage) {
            srvConfig.removeConfigurableError(currentUIRequirement, currentUIRequirement.requirement.requirementNameErrorMessage);
        }
        currentUIRequirement.requirement.requirementNameErrorMessage = errorText;
        if (currentUIRequirement.requirement.requirementNameErrorMessage) {
            srvConfig.addConfigurableError(currentUIRequirement, currentUIRequirement.requirement.requirementNameErrorMessage);
        }
        return stateChagned;
    }
    function clearSetErrors(uiRequirements, viewValue) {
        var stateChagned = false;
        _.each(uiRequirements, function (uiRequirement) {
            stateChagned = clearSetError(uiRequirement, getErrorText(uiRequirement, viewValue, uiRequirements)) || stateChagned;
        });
        return stateChagned;
    }
    function link(scope, _elm, _attrs, ctrl) {
        scope.$watch(function () {
            return ctrl.$viewValue;
        }, function (newVal, oldVal) {
            var srvConfigVM = scope.srvConfigVM;
            if (newVal !== oldVal) {
                var currentUIRequirement_1 = srvConfigVM.selectedRequirement;
                var stateChanged = false;
                var requirementsMatchingOldName = _.filter(getAllRequirements(), function (uiRequirement) {
                    return uiRequirement.requirement.name === oldVal && uiRequirement !== currentUIRequirement_1;
                });
                stateChanged = clearSetErrors(requirementsMatchingOldName, oldVal) || stateChanged;
                if (ctrl.$isEmpty(newVal)) {
                    clearSetError(currentUIRequirement_1, "Name cannot be empty!");
                    stateChanged = true;
                }
                else {
                    var requirementsMatchingNewName = _.filter(getAllRequirements(), function (uiRequirement) {
                        return uiRequirement.requirement.name === newVal;
                    });
                    stateChanged = clearSetErrors(requirementsMatchingNewName, newVal) || stateChanged;
                }
                if (stateChanged)
                    $rootScope.$emit('onGenerateConfigErrorWarningList');
            }
        });
    }
    var directive = {
        require: "ngModel",
        link: link
    };
    return directive;
});
//# sourceMappingURL=pmValidateRequirementName.js.map