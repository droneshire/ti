define(["require", "exports"], function (require, exports) {
    "use strict";
    var directive = {
        restrict: "A",
        scope: true,
        link: function (scope, _el, attrs) {
            scope.$watch(attrs["name"] + '.$valid', scope.vm.validityChanged, true);
        }
    };
    return directive;
});
//# sourceMappingURL=pmWatchValidity.js.map