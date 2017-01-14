define(["require", "exports", "glucose", "glucoseFunctions", "debug", "choices"], function (require, exports, Module, glucose, debug, choices) {
    "use strict";
    var buf = 0;
    var size = 0;
    var offset = 0;
    var numClauses = 0;
    var typedArray = null;
    var textClauses = "";
    function reset() {
        offset = 0;
        numClauses = 0;
    }
    exports.reset = reset;
    function apply() {
        if (debug.textBasedClauses) {
            var text = choices.generateHeaderComments();
            text += "p cnf " + choices.numChoices() + " " + (numClauses + choices.numAssumptions()) + "\n";
            text += textClauses;
            textClauses = "";
            console.clear();
            console.log(text);
        }
        if (debug.profileGlucose) {
            console.log("Applying: " + choices.numChoices() + " choices, " + numClauses + " clauses");
        }
        glucose.initializeClauses(choices.numChoices(), numClauses, buf);
    }
    exports.apply = apply;
    function addLiteral(lit) {
        if (offset === size) {
            if (size === 0) {
                size = 256;
            }
            else {
                size = Math.floor(size * 3 / 2);
            }
            buf = Module._realloc(buf, size * 4);
            typedArray = Module.HEAP32.subarray(buf >> 2, (buf >> 2) + size * 4);
        }
        typedArray[offset++] = lit;
        if (debug.textBasedClauses) {
            textClauses += lit + " ";
        }
    }
    exports.addLiteral = addLiteral;
    function endClause(comments) {
        ++numClauses;
        addLiteral(0);
        if (debug.textBasedClauses) {
            textClauses += "c " + comments + "\n";
        }
    }
    exports.endClause = endClause;
});
//# sourceMappingURL=clauses.js.map