define(["require", "exports", "pinmuxRouteParams", "data"], function (require, exports, $routeParams, srvDeviceData) {
    "use strict";
    exports.vm = {
        fileCategorySelect: null,
        filteredFileListArray: [],
        fileCategories: [],
        fileListArray: []
    };
    function setSelectedCategory(category) {
        exports.vm.fileCategorySelect = category;
        exports.vm.filteredFileListArray = [];
        if (category.value == "all") {
            exports.vm.filteredFileListArray = exports.vm.fileListArray;
        }
        else {
            exports.vm.fileListArray.forEach(function (curFile) {
                if (curFile.category == category.value) {
                    exports.vm.filteredFileListArray.push(curFile);
                }
            });
        }
    }
    exports.setSelectedCategory = setSelectedCategory;
    function init() {
        return srvDeviceData.getDeviceInfo($routeParams.boardId, $routeParams.deviceId, $routeParams.partId, $routeParams.packageId)
            .then(function (deviceData) {
            exports.vm.fileCategories = deviceData.templates.fileCategories;
            exports.vm.fileListArray = deviceData.templates.fileListArray;
            setSelectedCategory(exports.vm.fileCategories[0]);
        });
    }
    exports.init = init;
});
//# sourceMappingURL=fileList.js.map