"use strict";
global._ = require("underscore");
var q = require("q");
var path = require("path");
var fs = require("fs");
var servicesToInclude = require("./services.json").services;
var paths = require("./paths");
var srvSettings = require("./settings");
var fileBeingRequired;
function initGlobal(services) {
    global.window = {};
    global.define = function (deps, callback) {
        if (-1 === fileBeingRequired.indexOf("services") &&
            -1 === fileBeingRequired.indexOf("tests") &&
            -1 === fileBeingRequired.indexOf("cli")) {
            throw new Error("non-service is being required");
        }
        var name = fileBeingRequired.substring(fileBeingRequired.lastIndexOf("/") + 1, fileBeingRequired.length - 3);
        deps = deps.slice(2);
        var angularDeps = deps.map(function (dep) {
            return dep.substring(dep.lastIndexOf("/") + 1);
        });
        angularDeps.push(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var exports = {};
            var result = callback.apply(void 0, [require, exports].concat(args));
            if (_.isEmpty(exports)) {
                return result;
            }
            return exports;
        });
        services[name] = angularDeps;
    };
}
function initServices() {
    var http = {
        get: function (url) {
            var str = fs.readFileSync(path.join(paths.deviceDataDirRoot, url));
            var response = {
                data: str.toString()
            };
            return q.resolve(response);
        }
    };
    var services = {
        $q: q,
        $http: http,
        $rootScope: {},
        settings: srvSettings,
        userPreferences: {}
    };
    return services;
}
var configured = false;
var instance;
module.exports = function () {
    if (configured)
        throw "Services module is already configured!";
    if (configured)
        return instance;
    var pinmuxDir = paths.pinmuxDir;
    var services = initServices();
    initGlobal(services);
    function get(name, chain) {
        if (!chain) {
            chain = name;
        }
        else {
            chain += " -> " + name;
        }
        var serviceDesc = services[name];
        if (!serviceDesc)
            throw new Error("Could not find service: " + chain);
        if (serviceDesc instanceof Array) {
            var ctor = serviceDesc.pop();
            var deps = _.map(serviceDesc, function (dep) {
                return get(dep, chain);
            });
            services[name] = ctor.apply({}, deps);
        }
        return services[name];
    }
    function registerService(serviceFile) {
        fileBeingRequired = serviceFile;
        require(path.join(pinmuxDir, serviceFile));
    }
    _.each(servicesToInclude, function (serviceFile) {
        registerService(serviceFile);
    });
    configured = true;
    instance = {
        get: get,
        registerService: registerService
    };
    return instance;
};
//# sourceMappingURL=services.js.map