define(["require", "exports", "$scope", "$rootScope", "services/project", "services/analytics", "services/fileList", "services/extendScope"], function (require, exports, $scope, $rootScope, srvProject, srvAnalytics, srvFileList, extendScope) {
    "use strict";
    var editorScope = extendScope($scope, {
        curOpenedFile: null,
        closeCodeFile: closeCodeFile,
        downloadFile: srvProject.downloadFile,
        editor: null,
        openFile: openFile,
        getFileName: srvProject.getGeneratedFileName,
        popoverIsVisible: false,
        togglePopOver: togglePopOver,
        closePopOver: closePopOver,
        srvFileListVM: srvFileList.vm,
    });
    var unreg = $rootScope.$on("openCodeFile", function (_event, fileEntry) {
        editorScope.openFile(fileEntry);
    });
    editorScope.$on("$destroy", function () { return unreg(); });
    function closeCodeFile() {
        editorScope.curOpenedFile = null;
        $rootScope.$emit("codeFileClosed");
    }
    ;
    function setEditorHeight() {
        if ($(window).width() <= 720) {
            $("#editor").css("height", $(window).innerHeight() - 125);
        }
        else {
            $("#editor").css("height", $(window).innerHeight() - 80);
        }
    }
    $(window).resize(setEditorHeight);
    editorScope.$on("$destroy", function () {
        $(window).off("resize", setEditorHeight);
    });
    function openFile(fileEntry) {
        if (fileEntry) {
            editorScope.curOpenedFile = fileEntry;
        }
        if (!editorScope.curOpenedFile) {
            return;
        }
        if (!editorScope.editor) {
            editorScope.editor = ace.edit("editor");
            editorScope.editor.setTheme("ace/theme/chrome");
            editorScope.editor.getSession().setMode("ace/mode/c_cpp");
            editorScope.editor.setReadOnly(true);
            editorScope.editor.selection.selectTo(0, 0);
            editorScope.editor.$blockScrolling = Infinity;
            setEditorHeight();
            srvAnalytics.record("openCodePreview", {
                fileName: editorScope.curOpenedFile.name,
            });
        }
        var curScrollTop = editorScope.editor.session.getScrollTop();
        var curScrollLeft = editorScope.editor.session.getScrollLeft();
        var content = srvProject.generateCode(editorScope.curOpenedFile.template);
        editorScope.editor.setValue(content);
        editorScope.editor.session.setScrollTop(curScrollTop);
        editorScope.editor.session.setScrollLeft(curScrollLeft);
        editorScope.editor.clearSelection();
        $rootScope.$emit("codeFileOpened", fileEntry);
    }
    function togglePopOver() {
        editorScope.popoverIsVisible = !editorScope.popoverIsVisible;
    }
    function closePopOver() {
        editorScope.popoverIsVisible = false;
    }
});
//# sourceMappingURL=editor.js.map