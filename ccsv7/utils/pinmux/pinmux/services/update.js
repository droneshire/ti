define(["require", "exports"], function (require, exports) {
    "use strict";
    var update;
    if (isNode()) {
        var fs_1 = require("fs");
        var path_1 = require("path");
        var childProcess_1 = require("child_process");
        var updateExecName_1 = "autoupdate-windows.exe";
        var updateExecPath_1 = null;
        var foundUpdateExec_1 = null;
        var checkForUpdateExec_1 = function () {
            if (foundUpdateExec_1 === null) {
                var nwPath = path_1.dirname(process.execPath);
                updateExecPath_1 = path_1.resolve(nwPath, "../", updateExecName_1);
                foundUpdateExec_1 = fs_1.existsSync(updateExecPath_1);
            }
        };
        update = {
            supported: function () {
                checkForUpdateExec_1();
                return foundUpdateExec_1;
            },
            available: function (callback) {
                var args = ["--check_for_updates", "true", "--mode", "unattended"];
                try {
                    var proc = childProcess_1.spawn(updateExecPath_1, args, {});
                    proc.on("exit", function (code) {
                        if (code === 0) {
                            callback(true);
                        }
                        else {
                            callback(false);
                        }
                    });
                }
                catch (e) {
                    console.log("Failed to check for updates! -> " + e);
                    callback(false);
                }
            },
            install: function () {
                try {
                    childProcess_1.spawn(updateExecPath_1, [], {
                        detached: true
                    });
                    var gui = require("nw.gui");
                    gui.App.quit();
                }
                catch (e) {
                    console.log("Failed to start update installation! -> " + e);
                }
            }
        };
    }
    else {
        update = {
            supported: function () {
                return false;
            },
            available: function (callback) {
                callback(false);
            },
            install: function () { }
        };
    }
    function supported() {
        return update.supported();
    }
    exports.supported = supported;
    function available(callback) {
        return update.available(callback);
    }
    exports.available = available;
    function install() {
        update.install();
    }
    exports.install = install;
});
//# sourceMappingURL=update.js.map