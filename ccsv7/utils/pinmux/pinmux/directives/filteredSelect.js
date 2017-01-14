define(["require", "exports", "$filter", "services/pinmuxRootScope"], function (require, exports, $filter, $rootScope) {
    "use strict";
    function sortAndGroupSelections(scope) {
        var enabledSelections = [];
        var disabledSelections = [];
        for (var i = 0; i < scope.selections.length; i++) {
            var selection = scope.selections[i];
            if (selection.enabled) {
                enabledSelections.push(selection);
            }
            else {
                disabledSelections.push(selection);
            }
        }
        var predicate = $rootScope.natural("getDisplay");
        enabledSelections = $filter("orderBy")(enabledSelections, predicate);
        disabledSelections = $filter("orderBy")(disabledSelections, predicate);
        scope.sortedAndGroupedSelections = enabledSelections.concat(disabledSelections);
    }
    function link(scope) {
        sortAndGroupSelections(scope);
        function selectionsEnableDisable() {
            var val = "";
            _.each(scope.selections, function (selection) {
                val += selection.enabled;
            });
            return val;
        }
        ;
        scope.$watch(selectionsEnableDisable, function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                sortAndGroupSelections(scope);
            }
        });
        scope.$watch("selections", function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                sortAndGroupSelections(scope);
            }
        });
        var unreg = $rootScope.$on("devicePinDisplayName", function () {
            sortAndGroupSelections(scope);
        });
        scope.$on("$destroy", function () { return unreg(); });
    }
    var directive = {
        restrict: "E",
        templateUrl: "views/filteredselect.html",
        scope: {
            selections: "=",
            selectionChanged: "=",
            selectionChangedArg: "=",
            currentSelection: "=",
            tooltip: "="
        },
        link: link
    };
    return directive;
});
//# sourceMappingURL=filteredSelect.js.map