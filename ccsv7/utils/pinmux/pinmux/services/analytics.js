define(["require", "exports", "$http", "$location", "settings"], function (require, exports, http, location, srvSettings) {
    "use strict";
    function record(action, data) {
        if (!isNode()) {
            var myData = data;
            if (data === undefined) {
                myData = {};
            }
            myData.app = "pinmux";
            myData.url = location.path();
            myData.version = srvSettings.version;
            var params = {
                "action": action,
                "data": myData
            };
            http.post("/analytics", JSON.stringify(params))
                .success(function () { })
                .error(function () { });
        }
    }
    exports.record = record;
});
//# sourceMappingURL=analytics.js.map