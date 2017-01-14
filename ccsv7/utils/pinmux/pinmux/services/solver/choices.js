define(["require", "exports", "glucose", "debug", "glucoseFunctions"], function (require, exports, Module, debug, glucose) {
    "use strict";
    var GPIOChoice = (function () {
        function GPIOChoice(pinChoice, errorChoice) {
            this.restrictsGPIO = true;
            this.pinChoice = pinChoice;
            this.errorChoice = errorChoice;
            this.chosenChoice = pinChoice;
        }
        return GPIOChoice;
    }());
    var availableGPIOPins;
    var choices;
    var assumptions;
    var warnings;
    var firstError;
    var firstWarning;
    var requiredGPIOPins;
    function reset(_availableGPIOPins) {
        availableGPIOPins = _availableGPIOPins;
        choices = [{ id: 0, apply: function () { } }];
        assumptions = {
            errors: {},
            valid: {}
        };
        warnings = {};
        firstError = 0;
        firstWarning = 0;
        requiredGPIOPins = [];
    }
    exports.reset = reset;
    function push(choice) {
        choices.push(choice);
        return choices.length - 1;
    }
    exports.push = push;
    function pushGPIO(pinChoice, errorChoice, name) {
        var gpioChoice = new GPIOChoice(pinChoice, errorChoice);
        requiredGPIOPins.push(gpioChoice);
        assumptions.valid[name] = gpioChoice;
    }
    exports.pushGPIO = pushGPIO;
    function pushError(choice, name) {
        var id = push(choice);
        assumptions.valid[name] = choice;
        if (0 === firstError) {
            firstError = id;
        }
        if (choice.restrictsGPIO) {
            --availableGPIOPins;
        }
        return id;
    }
    exports.pushError = pushError;
    function pushWarning(choice, name) {
        var id = push(choice);
        warnings[name] = choice;
        if (0 === firstWarning) {
            firstWarning = id;
        }
        return id;
    }
    exports.pushWarning = pushWarning;
    function apply(solutionAddy, devicePinMap) {
        var heap32Offset = solutionAddy >> 2;
        var choice = Module.HEAP32[heap32Offset++];
        while (choice) {
            choices[choice].apply(devicePinMap);
            choice = Module.HEAP32[heap32Offset++];
        }
        for (var i = 0; i < requiredGPIOPins.length; ++i) {
            requiredGPIOPins[i].chosenChoice.apply(devicePinMap);
        }
    }
    exports.apply = apply;
    function numChoices() {
        return choices.length - 1;
    }
    exports.numChoices = numChoices;
    function numAssumptions() {
        return _.size(assumptions.valid) + _.size(assumptions.errors);
    }
    exports.numAssumptions = numAssumptions;
    function generateHeaderComments() {
        var text = "";
        for (var i = 1; i < choices.length; ++i) {
            text += "c " + i + " " + choices[i].name + "\n";
        }
        return text;
    }
    exports.generateHeaderComments = generateHeaderComments;
    function initializeAssumptions() {
        if (0 !== firstError) {
            glucose.addAssumptions(firstError, numChoices(), false);
            if (0 !== firstWarning) {
                for (var i = firstWarning; i < choices.length; ++i) {
                    glucose.changeAssumption(i, true);
                }
            }
        }
    }
    exports.initializeAssumptions = initializeAssumptions;
    function assumeError(name) {
        if (name in assumptions.valid) {
            if (debug.debug) {
                console.log("Error: " + name);
            }
            var errorChoice = assumptions.valid[name];
            assumptions.errors[name] = errorChoice;
            delete assumptions.valid[name];
            if (errorChoice instanceof GPIOChoice) {
                errorChoice.chosenChoice = errorChoice.errorChoice;
            }
            else {
                glucose.changeAssumption(errorChoice.id, true);
            }
            if (errorChoice.restrictsGPIO) {
                ++availableGPIOPins;
            }
        }
    }
    exports.assumeError = assumeError;
    function assumeNoError(name) {
        if (name in assumptions.errors) {
            if (debug.debug) {
                console.log("Valid: " + name);
            }
            var errorChoice = assumptions.errors[name];
            assumptions.valid[name] = errorChoice;
            delete assumptions.errors[name];
            if (errorChoice instanceof GPIOChoice) {
                errorChoice.chosenChoice = errorChoice.pinChoice;
            }
            else {
                glucose.changeAssumption(errorChoice.id, false);
            }
            if (errorChoice.restrictsGPIO) {
                --availableGPIOPins;
            }
        }
    }
    exports.assumeNoError = assumeNoError;
    function assumeWarning(name) {
        glucose.changeAssumption(warnings[name].id, true);
    }
    exports.assumeWarning = assumeWarning;
    function assumeNoWarning(name) {
        glucose.changeAssumption(warnings[name].id, false);
    }
    exports.assumeNoWarning = assumeNoWarning;
    function solve() {
        if (debug.textBasedClauses) {
            var text_1 = "Assumptions:\n";
            _.each(assumptions.errors, function (choice) {
                if (!(choice instanceof GPIOChoice)) {
                    text_1 += choice.id + " 0 c assume true\n";
                }
            });
            _.each(assumptions.valid, function (choice) {
                if (!(choice instanceof GPIOChoice)) {
                    text_1 += -choice.id + " 0 c assume false\n";
                }
            });
            console.log(text_1);
        }
        return requiredGPIOPins.length <= availableGPIOPins && glucose.solve();
    }
    exports.solve = solve;
});
//# sourceMappingURL=choices.js.map