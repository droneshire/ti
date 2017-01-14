define(["require", "exports", "$modal", "extendScope"], function (require, exports, modal, extendScope) {
    "use strict";
    function confirmDelete(filename) {
        var modalInstance = modal.open({
            templateUrl: "deleteConfirmModal.html",
            controller: ["$scope", function ($scope) {
                    var confirmDeleteScope = extendScope($scope, {
                        filename: filename,
                        ok: function () { return modalInstance.close(confirmDeleteScope.filename); },
                        cancel: function () { return modalInstance.dismiss("cancel"); }
                    });
                }]
        });
    }
    exports.confirmDelete = confirmDelete;
    function fileList(cloudFiles, fileSelected) {
        var modalInstance = modal.open({
            templateUrl: "filelistModal.html",
            controller: ["$scope", function ($scope) {
                    var fileListScope = extendScope($scope, {
                        cloudFiles: cloudFiles,
                        selectedFile: null,
                        openFile: function (filename) {
                            fileListScope.selectedFile = filename;
                            fileListScope.ok();
                        },
                        ok: function () { return modalInstance.close(fileListScope.selectedFile); },
                        cancel: function () { return modalInstance.dismiss("cancel"); }
                    });
                }]
        });
        modalInstance.result.then(fileSelected);
    }
    exports.fileList = fileList;
    function saveFile(filename, nameSelected) {
        var modalInstance = modal.open({
            templateUrl: "saveFileModal.html",
            controller: ["$scope", function ($scope) {
                    var saveScope = extendScope($scope, {
                        filename: filename,
                        ok: function () { return modalInstance.close(saveScope.filename); },
                        cancel: function () { return modalInstance.dismiss("cancel"); }
                    });
                }]
        });
        modalInstance.result.then(nameSelected);
    }
    exports.saveFile = saveFile;
    function confirm(heading, message, ok, cancel) {
        var modalInstance = modal.open({
            templateUrl: "confirm.html",
            controller: ["$scope", function ($scope) {
                    extendScope($scope, {
                        heading: heading,
                        message: message,
                        yes: function () { return modalInstance.close(); },
                        no: function () { return modalInstance.dismiss("cancel"); }
                    });
                }]
        });
        modalInstance.result.then(ok, cancel);
    }
    exports.confirm = confirm;
    function message(headerMsg, bodyMsgs, detailMsgs, type) {
        return modal.open({
            templateUrl: "messageModal.html",
            controller: ["$scope", "$modalInstance", function ($scope, $modalInstance) {
                    extendScope($scope, {
                        headerMsg: headerMsg,
                        bodyMsgs: bodyMsgs,
                        detailMsgs: detailMsgs,
                        type: type,
                        ok: function () {
                            $modalInstance.close();
                        }
                    });
                }],
            size: 'lg'
        }).result;
    }
    exports.message = message;
});
//# sourceMappingURL=modals.js.map