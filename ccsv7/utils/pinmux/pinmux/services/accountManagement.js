define(["require", "exports", "$http"], function (require, exports, http) {
    "use strict";
    var userInfoPromise;
    function getUserInfo() {
        if (userInfoPromise) {
            return userInfoPromise;
        }
        else {
            userInfoPromise = http.get("/api/queryUserStatus/");
        }
        return userInfoPromise;
    }
    exports.getUserInfo = getUserInfo;
});
//# sourceMappingURL=accountManagement.js.map