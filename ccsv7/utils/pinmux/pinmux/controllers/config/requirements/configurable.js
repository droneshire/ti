define(["require", "exports", "$rootScope"], function (require, exports, $rootScope) {
    "use strict";
    var vm = {
        changed: changed,
        validityChanged: validityChanged,
        uiConfigurable: null,
        onValid: null,
        onInvalid: null,
    };
    function changed() {
        $rootScope.$emit('openCodeFile');
    }
    ;
    function getErrorText(configurable) {
        return configurable.displayName + "/" + configurable.validationFailMessage;
    }
    var firstTime = true;
    function validityChanged(valid) {
        var uiConfigurable = vm.uiConfigurable;
        var configurable = vm.uiConfigurable.configurable;
        if (firstTime) {
            uiConfigurable.valid = valid;
            firstTime = false;
            return;
        }
        if (valid && !uiConfigurable.valid) {
            uiConfigurable.valid = true;
            vm.onValid(getErrorText(configurable));
        }
        else if (!valid) {
            uiConfigurable.valid = false;
            vm.onInvalid(getErrorText(configurable), firstTime);
        }
    }
    ;
    return vm;
});
//# sourceMappingURL=configurable.js.map