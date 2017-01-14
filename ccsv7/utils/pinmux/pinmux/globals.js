function isNode() {
    return ((typeof require === "function"));
}
var enableZoom = true;
function define(deps, callback) {
    var scripts = document.getElementsByTagName("script");
    var lastScript = scripts[scripts.length - 1];
    var scriptName = lastScript.src;
    if (-1 !== scriptName.indexOf("app.js")) {
        callback(isNode() ? require : undefined);
        return;
    }
    var isService = -1 !== scriptName.indexOf("services");
    var isDirective = -1 !== scriptName.indexOf("directives");
    var isController = -1 !== scriptName.indexOf("controllers");
    if (!isService && !isDirective && !isController ||
        isService && isDirective ||
        isService && isController ||
        isDirective && isController) {
        console.error("Unable to determine module type for " + scriptName);
        throw new Error("Unable to determine module type for " + scriptName);
    }
    var name = scriptName.substring(scriptName.lastIndexOf("/") + 1, scriptName.length - 3);
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
        var result = callback.apply(void 0, [isNode() ? require : undefined, exports].concat(args));
        if (_.isEmpty(exports)) {
            return result;
        }
        return exports;
    });
    if (isService) {
        angular.module("pinmux").factory(name, angularDeps);
    }
    else if (isDirective) {
        angular.module("pinmux").directive(name, angularDeps);
    }
    else if (isController) {
        angular.module("pinmux").controller(name, angularDeps);
    }
}
//# sourceMappingURL=globals.js.map