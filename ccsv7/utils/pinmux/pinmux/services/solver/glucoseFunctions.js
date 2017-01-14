define(["require", "exports", "glucose", "debug"], function (require, exports, Module, debug) {
    "use strict";
    var logicError = debug.logicError;
    exports.glucoseTime = 0;
    function dlsym_initializeClauses() {
        return Module.cwrap("initializeClauses", "number", ["number", "number", "number"]);
    }
    function dlsym_addAssumptions() {
        return Module.cwrap("addAssumptions", "void", ["number", "number", "number"]);
    }
    function dlsym_changeAssumption() {
        return Module.cwrap("changeAssumption", "number", ["number", "number"]);
    }
    function dlsym_setBudget() {
        return Module.cwrap("setBudget", "void", ["number", "number", "number"]);
    }
    function dlsym_setVerbosity() {
        return Module.cwrap("setVerbosity", "void", ["number", "number"]);
    }
    function dlsym_solve() {
        return Module.cwrap("solve", "number", []);
    }
    function dlsym_getSolution() {
        return Module.cwrap("getSolution", "number", []);
    }
    function glucoseFunction(fun) {
        if (debug.profileGlucose) {
            var doProfiling = function () {
                console.log("calling " + name);
                var start = new Date().getTime();
                var raw = fun;
                var ret = raw.apply(void 0, arguments);
                var end = new Date().getTime();
                console.log(name + " took " + (end - start));
                exports.glucoseTime += (end - start);
                return ret;
            };
            return doProfiling;
        }
        return fun;
    }
    ;
    function createEmptyCache() {
        return {
            start: 0,
            current: [],
            cache: [],
            currentSolution: null
        };
    }
    var assumptionCache = createEmptyCache();
    function clearAssumptionCache() {
        assumptionCache = createEmptyCache();
    }
    ;
    exports.initializeClauses = function () {
        var initializeClauses = glucoseFunction(dlsym_initializeClauses());
        return function (numVars, numClauses, clauseArray) {
            clearAssumptionCache();
            var result = initializeClauses(numVars, numClauses, clauseArray);
            if (!result) {
                logicError("Initialize clauses failed");
            }
            return result;
        };
    }();
    exports.addAssumptions = function () {
        var glucoseAddAssumptions = glucoseFunction(dlsym_addAssumptions());
        return function (firstError, numChoices, bool) {
            clearAssumptionCache();
            assumptionCache.current = _.times(numChoices, function () {
                return bool ? 1 : 0;
            });
            glucoseAddAssumptions(firstError, numChoices, bool);
        };
    }();
    exports.changeAssumption = function () {
        var glucoseChangeAssumption = dlsym_changeAssumption();
        return function (num, bool) {
            if (!glucoseChangeAssumption(num, bool)) {
                logicError("Invalid assumption change");
            }
            assumptionCache.current[num - assumptionCache.start] = bool ? 1 : 0;
            return true;
        };
    }();
    exports.solve = function () {
        var solve = glucoseFunction(dlsym_solve());
        return function () {
            var current = assumptionCache.current.join("");
            var cache = _.find(assumptionCache.cache, function (cache) {
                return cache.assumptions === current;
            });
            if (cache) {
                return cache.solved;
            }
            else {
                var solved = solve();
                assumptionCache.cache.push({
                    solved: solved,
                    assumptions: current
                });
                assumptionCache.currentSolution = current;
                return solved;
            }
        };
    }();
    exports.setBudget = function () {
        var setBudget = glucoseFunction(dlsym_setBudget());
        return function (a, b, c) {
            assumptionCache.cache = [];
            assumptionCache.currentSolution = null;
            return setBudget(a, b, c);
        };
    }();
    exports.getSolution = function () {
        var getSolution = glucoseFunction(dlsym_getSolution());
        return function () {
            if (assumptionCache.currentSolution !== assumptionCache.current.join("")) {
                assumptionCache.cache = [];
                assumptionCache.currentSolution = null;
                exports.solve();
            }
            return getSolution();
        };
    }();
    exports.setVerbosity = glucoseFunction(dlsym_setVerbosity());
});
//# sourceMappingURL=glucoseFunctions.js.map