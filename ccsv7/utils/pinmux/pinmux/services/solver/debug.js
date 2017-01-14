define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.debug = false;
    exports.textBasedClauses = exports.debug || false;
    exports.summarizeData = exports.debug || false;
    exports.profile = false;
    exports.profileGlucose = exports.profile || false;
    exports.abortOnError = false;
    exports.glucoseVerbosity = {
        verbosity: 0,
        verbEveryConflicts: 1000
    };
    exports.glucoseBudget = {
        conflicts: 300000,
        propagations: 10000000,
        restarts: 10
    };
    function logicError(errorText) {
        if (exports.abortOnError) {
            throw new Error(errorText);
        }
        console.log(errorText);
    }
    exports.logicError = logicError;
});
//# sourceMappingURL=debug.js.map