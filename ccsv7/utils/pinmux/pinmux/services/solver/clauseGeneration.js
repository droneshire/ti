define(["require", "exports", "clauses"], function (require, exports, clauses) {
    "use strict";
    function mutuallyExclusive(choiceMap, getWarning, comments) {
        choiceMap.forEach(function (choices, choiceName) {
            for (var i = 0; i < choices.length - 1; ++i) {
                for (var j = i + 1; j < choices.length; ++j) {
                    clauses.addLiteral(-choices[i].id);
                    clauses.addLiteral(-choices[j].id);
                    if (getWarning) {
                        clauses.addLiteral(getWarning(choiceName).id);
                    }
                    clauses.endClause(comments);
                }
            }
        });
    }
    exports.mutuallyExclusive = mutuallyExclusive;
    function dependentChoices(choiceMap, comments) {
        choiceMap.forEach(function (choices, choiceName) {
            _.each(choices, function (choice) {
                clauses.addLiteral(-choice.id);
                clauses.addLiteral(choiceName);
                clauses.endClause(comments);
            });
        });
    }
    exports.dependentChoices = dependentChoices;
    function chooseAtLeastOneOf(choiceMap, getError, comments) {
        choiceMap.forEach(function (choices, choiceName) {
            _.each(choices, function (choice) {
                clauses.addLiteral(choice.id);
            });
            if (getError) {
                clauses.addLiteral(getError(choiceName).id);
            }
            clauses.endClause(comments);
        });
    }
    exports.chooseAtLeastOneOf = chooseAtLeastOneOf;
    function chooseAtLeastOneOfOnlyIf(choiceMap, getError, comments) {
        choiceMap.forEach(function (choices, choiceName) {
            _.each(choices, function (choice) {
                clauses.addLiteral(choice.id);
            });
            clauses.addLiteral(-choiceName);
            if (getError) {
                clauses.addLiteral(getError(choiceName).id);
            }
            clauses.endClause(comments);
        });
    }
    exports.chooseAtLeastOneOfOnlyIf = chooseAtLeastOneOfOnlyIf;
    function chooseOneOf(choiceMap, getError, comments) {
        chooseAtLeastOneOf(choiceMap, getError, comments + " (at least one of)");
        mutuallyExclusive(choiceMap, null, comments + " (but only one)");
    }
    exports.chooseOneOf = chooseOneOf;
    function chooseOneOfOnlyIf(choiceMap, getError, comments) {
        chooseAtLeastOneOfOnlyIf(choiceMap, getError, comments + " (at least one of)");
        dependentChoices(choiceMap, comments + " (forbid if the dependent choice is not chosen)");
        mutuallyExclusive(choiceMap, null, comments + " (but only one)");
    }
    exports.chooseOneOfOnlyIf = chooseOneOfOnlyIf;
    function userOverrides(overrides, getError, comments) {
        overrides.forEach(function (override, overrideName) {
            clauses.addLiteral(override.id);
            if (getError) {
                clauses.addLiteral(getError(overrideName).id);
            }
            clauses.endClause(comments);
        });
    }
    exports.userOverrides = userOverrides;
});
//# sourceMappingURL=clauseGeneration.js.map