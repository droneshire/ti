define(["require", "exports", "$injector"], function (require, exports, injector) {
    "use strict";
    var injected = ((typeof require === "function") ?
        injector.get("nwStorage") : injector.get("cloudStorage"));
    return injected;
});
//# sourceMappingURL=storage.js.map