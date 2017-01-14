define(["require", "exports", "$rootScope"], function (require, exports, rootScope) {
    "use strict";
    exports.layoutDefine = {
        desktop: 0,
        tablet: 1,
        mobile: 2
    };
    function adjustColHeight() {
        var height = $(window).height();
        if ($(window).width() > 720) {
            height -= 40;
            $("#newCol1Outer").css("height", height.toString() + "px");
            $("#newCol2Outer").css("height", height.toString() + "px");
            $("#newCol1").css("height", height.toString() + "px");
            $("#newCol2").css("height", height.toString() + "px");
            $("#newCol3").css("height", height.toString() + "px");
        }
        else {
            $("#newCol1Outer").css("height", "100%");
            $("#newCol2Outer").css("height", "100%");
            $("#newCol1").css("height", "100%");
            $("#newCol2").css("height", "100%");
            $("#newCol3").css("height", "100%");
        }
    }
    var addedResizableColumn = false;
    function setUpResizableColumn() {
        if ($(window).width() > 1200) {
            if (!$("#newCol1Outer").resizable("instance")) {
                $("#newCol1Outer").resizable({
                    autoHide: true,
                    handles: "e"
                });
            }
            if (!$("#newCol2Outer").resizable("instance")) {
                $("#newCol2Outer").resizable({
                    autoHide: true,
                    handles: "e"
                });
            }
            addedResizableColumn = true;
        }
        else if ($(window).width() > 720) {
            if ($("#newCol1Outer").resizable("instance")) {
                $("#newCol1Outer").resizable("destroy");
            }
            if ($("#newCol1Outer").resizable("instance")) {
                $("#newCol2Outer").resizable("destroy");
            }
            addedResizableColumn = false;
        }
        else if (addedResizableColumn) {
            if ($("#newCol1Outer").resizable("instance")) {
                $("#newCol1Outer").resizable("destroy");
            }
            if ($("#newCol1Outer").resizable("instance")) {
                $("#newCol2Outer").resizable("destroy");
            }
            addedResizableColumn = false;
        }
    }
    function getLayoutMode() {
        if ($(window).width() > 1200) {
            return exports.layoutDefine.desktop;
        }
        else if ($(window).width() > 720) {
            return exports.layoutDefine.tablet;
        }
        else {
            return exports.layoutDefine.mobile;
        }
    }
    adjustColHeight();
    setUpResizableColumn();
    var curLayout = getLayoutMode();
    var curHeight = $(window).height();
    fireLayoutChanged();
    $(window).resize(function () {
        var newLayout = getLayoutMode();
        var newHeight = $(window).height();
        if ((newHeight != curHeight) || (newLayout != curLayout)) {
            adjustColHeight();
            curHeight = newHeight;
        }
        if (newLayout != curLayout) {
            curLayout = newLayout;
            fireLayoutChanged();
            rootScope.$digest();
        }
    });
    function fireLayoutChanged() {
        rootScope.$emit("layoutChanged", curLayout);
    }
    var colTabletShow = [true, true, false];
    var colMobileShow = [true, false, false];
    function showColOnly(colNum) {
        if ($(window).width() <= 720) {
            colMobileShow = [false, false, false];
            colMobileShow[colNum - 1] = true;
        }
        else if ($(window).width() <= 1200) {
            if (tabletRequirementCol == 1) {
                colTabletShow = [false, false, true];
            }
            else {
                colTabletShow = [true, false, false];
            }
            colTabletShow[colNum - 1] = true;
        }
    }
    exports.showColOnly = showColOnly;
    ;
    function needShowCol(colNum) {
        if ($(window).width() <= 720) {
            return colMobileShow[colNum - 1];
        }
        else if ($(window).width() <= 1200) {
            return colTabletShow[colNum - 1];
        }
        return true;
    }
    exports.needShowCol = needShowCol;
    ;
    var tabletRequirementCol = 2;
    function moveRequirementTab(col) {
        if (col == 1) {
            tabletRequirementCol = 1;
            colTabletShow = [false, true, true];
        }
        else {
            tabletRequirementCol = 2;
            colTabletShow = [true, true, false];
        }
    }
    exports.moveRequirementTab = moveRequirementTab;
    var col1Active = true;
    var col3Active = true;
    function toggleActive1() {
        col1Active = !col1Active;
    }
    exports.toggleActive1 = toggleActive1;
    function toggleActive3() {
        col3Active = !col3Active;
    }
    exports.toggleActive3 = toggleActive3;
    function getColTabletShow() {
        return colTabletShow;
    }
    exports.getColTabletShow = getColTabletShow;
    function getColMobileShow() {
        return colMobileShow;
    }
    exports.getColMobileShow = getColMobileShow;
    function getTabletRequirementCol() {
        return tabletRequirementCol;
    }
    exports.getTabletRequirementCol = getTabletRequirementCol;
    function getCol1Active() {
        return col1Active;
    }
    exports.getCol1Active = getCol1Active;
    function getCol3Active() {
        return col3Active;
    }
    exports.getCol3Active = getCol3Active;
    function getCurLayout() {
        return curLayout;
    }
    exports.getCurLayout = getCurLayout;
});
//# sourceMappingURL=layout.js.map