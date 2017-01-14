define(["require", "exports"], function (require, exports) {
    "use strict";
    angular.module("pinmux", ["ngRoute", "ui.bootstrap", "naturalSort", "toastr"]).
        config(["$routeProvider", "$controllerProvider", function ($routeProvider) {
            $routeProvider.
                when("/config/:boardId/:deviceId/:partId/:packageId/:selectedInterfaceId/:selectedRequirementId", {
                templateUrl: "views/config/config.html",
                controller: "config",
                resolve: { waitFor: ["$q", "settings", initSyncServices] }
            }).
                when("/powerdomains/:boardId/:deviceId/:partId/:packageId/", {
                templateUrl: "views/powerdomains/powerdomains.html",
                controller: "powerdomains",
                resolve: {
                    waitFor: ["$q", "settings", initSyncServices]
                }
            }).
                when("/iosets/:boardId/:deviceId/:partId/:packageId/:peripheralId/:ioSetId/", {
                templateUrl: "views/iosets/iosets.html",
                controller: "iosets",
                resolve: {
                    waitFor: ["$q", "settings", initSyncServices]
                }
            }).
                when("/default", {
                templateUrl: "views/default/default.html",
                controller: "default",
                resolve: {
                    waitFor: ["$q", "settings", initSyncServices]
                }
            }).
                when("/launchFromEclipse", {
                template: "",
                controller: "launchfromeclipse",
                resolve: {
                    waitFor: ["$q", "settings", initSyncServices]
                }
            }).
                otherwise({
                redirectTo: "/default/"
            });
        }]);
    function initSyncServices(q) {
        var services = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            services[_i - 1] = arguments[_i];
        }
        var promises = _.map(services, function (service) { return service.init(); });
        return q.all(promises);
    }
    angular.module("pinmux").config(function ($httpProvider) {
        $httpProvider.defaults.transformResponse = angular.identity;
    });
    angular.module("pinmux").run(["project", "nav", "modals", function (srvProject, srvNav, srvModals) {
            if (isNode()) {
                var gui = require("nw.gui");
                gui.Window.get().on("close", function () {
                    if (srvProject.unSaved && !srvNav.isWelcomePage()) {
                        srvModals.confirm("Close Application!", "You have unsaved changes. Do you really want to leave?", function () {
                            gui.App.quit()();
                        });
                    }
                    else {
                        gui.App.quit()();
                    }
                });
            }
        }]);
    angular.module("pinmux").run(["toastrConfig", function (toastrConfig) {
            var options = {
                positionClass: "toast-bottom-left",
                maxOpened: 4,
                closeButton: true
            };
            angular.extend(toastrConfig, options);
        }]);
    angular.element(document).ready(function () {
        if ((typeof require === "function") && process.env.PINMUX_TEST_ENABLED) {
            window.name = "NG_DEFER_BOOTSTRAP! Pin Mux";
        }
        angular.bootstrap(document, ["pinmux"]);
    });
    angular.module("pinmux").filter("object", function () {
        return function (input, search) {
            if (!input)
                return input;
            if (!search)
                return input;
            var expected = ("" + search).toLowerCase();
            var result = {};
            angular.forEach(input, function (value, key) {
                var actual = ("" + value).toLowerCase();
                if (actual.indexOf(expected) !== -1) {
                    result[key] = value;
                }
            });
            return result;
        };
    });
    angular.module("pinmux").directive("integer", function () {
        return {
            require: "ngModel",
            link: function (_scope, _ele, _attr, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    return parseInt(viewValue, 10);
                });
            }
        };
    });
    angular.module("pinmux").run(["$rootScope", "solver", "project", function ($rootScope, srvSolver, srvProject) {
            $rootScope.onSolve = function () {
                srvSolver.solve($rootScope.deviceRequirements);
                $rootScope.$emit("onSolveComplete", $rootScope.deviceRequirements);
                srvProject.setRequirementsChanged();
            };
        }]);
});
//# sourceMappingURL=app.js.map