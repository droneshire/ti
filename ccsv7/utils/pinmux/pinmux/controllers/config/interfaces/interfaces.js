define(["require", "exports", "$scope", "services/layout", "services/style", "services/toolTip", "services/config", "services/extendScope"], function (require, exports, $scope, srvLayout, srvStyle, srvToolTip, srvConfig, extendScope) {
    "use strict";
    var interfacesScope = extendScope($scope, {
        srvStyle: srvStyle,
        srvLayout: srvLayout,
        srvToolTip: srvToolTip,
        interfaces: null,
        srvConfigVM: srvConfig.vm,
        interfaceClicked: function (iface) {
            srvConfig.setSelected(iface);
        },
        addClicked: function (iface) {
            srvConfig.addRequirement(iface);
        }
    });
    srvConfig.init().then(function () {
        interfacesScope.interfaces = srvConfig.getInterfaces();
    });
    interfacesScope.$watch("srvConfigVM.selectedInterface", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            if ($(window).width() <= 1200) {
                srvLayout.showColOnly(2);
            }
        }
    });
});
//# sourceMappingURL=interfaces.js.map