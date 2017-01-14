define(["require", "exports"], function (require, exports) {
    "use strict";
    function isWin() {
        return process.platform.indexOf("win") === 0;
    }
    ;
    function getLocalAppData() {
        if (isWin()) {
            return process.env.LOCALAPPDATA || process.env.USERPROFILE;
        }
        else {
            return process.env.HOME;
        }
    }
    ;
    function getAppDir(appName) {
        if (isNode()) {
            var path = require("path");
            var fs = require("fs");
            var appDir = path.join(getLocalAppData(), appName);
            if (!fs.existsSync(appDir)) {
                fs.mkdirSync(appDir);
            }
            return appDir;
        }
        else {
            return "";
        }
    }
    exports.getAppDir = getAppDir;
});
//# sourceMappingURL=fsutil.js.map