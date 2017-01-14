define(["require", "exports", "../../services/pinmuxRootScope", "$scope", "../../services/data", "../../services/nav", "../../services/pinmuxRouteParams", "../../services/extendScope"], function (require, exports, $rootScope, $scope, srvDeviceData, srvNav, $routeParams, extendScope) {
    "use strict";
    var powerDomainsScope = extendScope($scope, {
        powerDomains: null,
        deviceRequirements: null,
        configureCurrentDevicePins: function () {
            $rootScope.onSolve();
            srvNav.configurePins();
        }
    });
    srvDeviceData.getDeviceInfo($routeParams.boardId, $routeParams.deviceId, $routeParams.partId, $routeParams.packageId).then(function (data) {
        powerDomainsScope.powerDomains = data.powerDomains;
        var powerDomainSettings = $rootScope.deviceRequirements.powerDomainSettings;
        if (_.isEmpty(powerDomainSettings)) {
            for (var powerDomainName in powerDomainsScope.powerDomains) {
                var powerDomain = powerDomainsScope.powerDomains[powerDomainName];
                if (powerDomain.powerValue && powerDomain.powerValue.length > 0) {
                    powerDomainSettings[powerDomainName] = powerDomain.powerValue[0];
                }
            }
        }
        powerDomainsScope.deviceRequirements = $rootScope.deviceRequirements;
        srvNav.initComplete();
        $rootScope.data = data;
        return data;
    });
});
//# sourceMappingURL=powerdomains.js.map