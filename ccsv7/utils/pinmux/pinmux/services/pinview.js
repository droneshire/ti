var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "utils"], function (require, exports, util) {
    "use strict";
    var pkg;
    var stage;
    var pinLayer;
    var pinUnassigned;
    var pinAssigned;
    var pinWarning;
    var pinPower;
    var pinGround;
    var pinFixed;
    var width;
    var height;
    var pkgLayer;
    var PIN_UNASSIGNED = "Pin Available";
    var PIN_ASSIGNED = "Pin Assigned";
    var PIN_NOT_AVAILABLE = "Pin Not Available";
    var PIN_WARNING = "Warning (Power Domain)";
    var PIN_POWER = "Power";
    var PIN_GROUND = "Ground";
    var PIN_FIXED = "Fixed (N/A)";
    var PIN_TYPES;
    var DEVICE_PIN_TO_PIN_TYPE = {
        Default: PIN_UNASSIGNED,
        Power: PIN_POWER,
        Ground: PIN_GROUND,
        Fixed: PIN_FIXED
    };
    var PIN_SIZE = 14;
    var EXTRA_PADDING_BEFORE_FIRST_VISIBLE_ELEMENT = PIN_SIZE * 3;
    function init(deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, showWarningPinTypes, rowColumnInverted, isBoard) {
        pkg = createPkg(deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, showWarningPinTypes, rowColumnInverted, isBoard);
        stage = null;
        pinLayer = null;
        pinUnassigned = -1;
        pinAssigned = -1;
        pinWarning = -1;
        pinPower = 0;
        pinGround = 0;
        pinFixed = 0;
        width = PIN_SIZE * (pkg.numColumns) + (2 * EXTRA_PADDING_BEFORE_FIRST_VISIBLE_ELEMENT);
        height = PIN_SIZE * (pkg.numRows) + (2 * EXTRA_PADDING_BEFORE_FIRST_VISIBLE_ELEMENT);
        stage = new Konva.Stage({
            container: "pinView",
            width: width,
            height: height + pkg.extraSpaceBelow
        });
        pkgLayer = new Konva.Layer();
        pkg.addBorder(pkgLayer);
        stage.add(pkgLayer);
        pinLayer = new Konva.Layer();
        pkg.addPins(pinLayer);
        stage.add(pinLayer);
        pkg.countPins();
        stage.draw();
    }
    exports.init = init;
    function redraw(selectedRequirement) {
        if (stage) {
            pkg.selectedRequirement = selectedRequirement;
            pkg.redraw();
            pkg.countPins();
        }
    }
    exports.redraw = redraw;
    function resetPinCount() {
        pinUnassigned = 0;
        pinAssigned = 0;
        pinWarning = 0;
        pinPower = 0;
        pinGround = 0;
        pinFixed = 0;
    }
    function destroy() {
        stage.destroy();
        _.each(Konva.shapes, function (shape) {
            shape.destroy();
        });
    }
    exports.destroy = destroy;
    function createPkg(deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, showWarningPinTypes, rowColumnInverted, isBoard) {
        setUpPinTypes(showExtendedPinTypes, showWarningPinTypes);
        if (isBoard) {
            var boardPkg = new BOARDPkg(deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, rowColumnInverted);
            return boardPkg;
        }
        else if (deviceData.packageDescription.type === "QFP") {
            var qfpPkg = new QFPPkg(deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, rowColumnInverted);
            return qfpPkg;
        }
        else if (deviceData.packageDescription.type === "BGA") {
            var bgaPkg = new BGAPkg(deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, rowColumnInverted);
            return bgaPkg;
        }
        throw "Unsupported Pacakge Type";
    }
    function setUpPinTypes(showExtendedPinTypes, showWarningPinTypes) {
        PIN_TYPES = [PIN_UNASSIGNED, PIN_ASSIGNED];
        if (showWarningPinTypes) {
            PIN_TYPES = PIN_TYPES.concat([PIN_WARNING]);
        }
        if (showExtendedPinTypes) {
            PIN_TYPES = PIN_TYPES.concat([PIN_POWER, PIN_GROUND]);
        }
        PIN_TYPES = PIN_TYPES.concat([PIN_FIXED]);
    }
    var QFPPkg = (function () {
        function QFPPkg(deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, rowColumnInverted) {
            this.deviceRequirements = deviceRequirements;
            this.showExtendedPinTypes = showExtendedPinTypes;
            this.extraSpaceBelow = 0;
            this.pins = [];
            this.extraTopLeft = (PIN_SIZE / 4) + EXTRA_PADDING_BEFORE_FIRST_VISIBLE_ELEMENT;
            this.extraBottomRight = 2 * EXTRA_PADDING_BEFORE_FIRST_VISIBLE_ELEMENT;
            this.deviceData = deviceData;
            this.selectedRequirement = selectedRequirement;
            this.pkgInfo = deviceData.packageDescription;
            this.rowColumnInverted = rowColumnInverted;
            this.numColumns = this.pkgInfo.numColumns + 2;
            this.numRows = this.pkgInfo.numRows + 2;
        }
        QFPPkg.prototype.countPins = function () {
            resetPinCount();
            for (var i = 0; i < this.pins.length; i++) {
                var pin = this.pins[i];
                if (pin.pinType == PIN_UNASSIGNED) {
                    pinUnassigned++;
                }
                else if (pin.pinType == PIN_ASSIGNED) {
                    pinAssigned++;
                }
                else if (pin.pinType == PIN_WARNING) {
                    pinWarning++;
                }
            }
        };
        QFPPkg.prototype.borderWidth = function () {
            return width - (2 * PIN_SIZE);
        };
        QFPPkg.prototype.borderHeight = function () {
            return height - (2 * PIN_SIZE);
        };
        QFPPkg.prototype.pinLegendYFactor = function () {
            return 0.25;
        };
        QFPPkg.prototype.dimpleRadius = function () {
            return PIN_SIZE / 2;
        };
        QFPPkg.prototype.dimpleX = function () {
            return PIN_SIZE * 3;
        };
        QFPPkg.prototype.dimpleY = function () {
            return height - (PIN_SIZE * 3);
        };
        QFPPkg.prototype.legendShape = function () {
            return new Konva.Rect({
                x: 0,
                y: 0,
                width: PIN_SIZE,
                height: PIN_SIZE / 2,
                fill: "grey"
            });
        };
        QFPPkg.prototype.legendLblOffsetY = function () {
            return -(PIN_SIZE / 4);
        };
        QFPPkg.prototype.addBorder = function (layer) {
            var width = this.borderWidth();
            var height = this.borderHeight();
            var borderStrokeWidth = 1;
            var borderX = PIN_SIZE + borderStrokeWidth;
            var borderY = PIN_SIZE + borderStrokeWidth;
            var borderWidth = width - (2 * borderStrokeWidth);
            var borderHeight = height - (2 * borderStrokeWidth);
            var border = new Konva.Rect({
                x: borderX,
                y: borderY,
                width: borderWidth,
                height: borderHeight,
                stroke: "black",
                strokeWidth: borderStrokeWidth,
                cornerRadius: 5
            });
            layer.add(border);
            var dimple = new Konva.Circle({
                radius: this.dimpleRadius(),
                stroke: "black",
                strokeWidth: 1,
                x: this.dimpleX(),
                y: this.dimpleY()
            });
            layer.add(dimple);
            var legendY = borderY + (borderHeight * this.pinLegendYFactor());
            var maxLblWidth = 0;
            var lbls = [];
            var shapes = [];
            for (var i = 0; i < PIN_TYPES.length; i++) {
                var pinType = PIN_TYPES[i];
                var pinShapeY = legendY + (PIN_SIZE * i);
                var shape = this.legendShape();
                shape.y(pinShapeY);
                var pin = {
                    pinType: pinType,
                    shape: shape
                };
                this.applyPinDecorationsToShape(pin);
                var lbl = new Konva.Text({
                    x: 0,
                    y: pinShapeY + this.legendLblOffsetY(),
                    text: pinType,
                    fontSize: PIN_SIZE,
                    fill: "black"
                });
                if (lbl.width() > maxLblWidth)
                    maxLblWidth = lbl.width();
                shapes.push(shape);
                lbls.push(lbl);
            }
            var padding = (PIN_SIZE / 4);
            var legendSize = maxLblWidth + PIN_SIZE + padding;
            var legendX = ((borderWidth - legendSize) / 2) + borderX;
            var lblX = legendX + PIN_SIZE + padding;
            for (var k = 0; k < lbls.length; k++) {
                shapes[k].x(legendX);
                layer.add(shapes[k]);
                lbls[k].x(lblX);
                layer.add(lbls[k]);
            }
        };
        QFPPkg.prototype.addPins = function (layer) {
            var _this = this;
            for (var i = 0; i < this.numColumns; i++) {
                for (var k = 0; k < this.numRows; k++) {
                    var pinX = (i * PIN_SIZE);
                    var pinY = (k * PIN_SIZE);
                    this.addCellContent(layer, pinX, pinY, k, i);
                }
            }
            layer.on("mouseover", function (obj) {
                _this.showPopUp(obj.target, obj.evt.clientX, obj.evt.clientY);
            });
            layer.on("mouseout", function () {
                _this.hidePopUp();
            });
        };
        QFPPkg.prototype.getXPinOffSet = function (row, column) {
            if (row === 0 || row === (this.numRows - 1)) {
                return this.extraTopLeft;
            }
            else if (column == this.numColumns - 1) {
                return this.extraBottomRight;
            }
            return 0;
        };
        QFPPkg.prototype.getYPinOffSet = function (row, column) {
            if (column === 0 || column === this.numColumns - 1) {
                return this.extraTopLeft;
            }
            else if (row == this.numRows - 1) {
                return this.extraBottomRight;
            }
            return 0;
        };
        QFPPkg.prototype.createLbl = function (x, y, row, column) {
            var numPinsInColumn = this.pkgInfo.numColumns;
            var numPinsInRow = this.pkgInfo.numRows;
            var pinWidthOffSet = (PIN_SIZE + (PIN_SIZE / 4));
            var pinHeightOffSet = (PIN_SIZE / 2);
            var lbl = new Konva.Text({
                x: x,
                y: y,
                text: "",
                fontSize: PIN_SIZE,
                fill: "black",
                rotation: 0
            });
            var pinNumber;
            if (row == this.numRows - 1) {
                pinNumber = column;
                lbl.text(this.lblText(pinNumber));
                lbl.x(lbl.x() - pinHeightOffSet);
                lbl.y(lbl.y() - pinHeightOffSet);
                lbl.rotation(-90);
            }
            else if (column === this.numColumns - 1) {
                pinNumber = numPinsInColumn + (this.numRows - row - 1);
                lbl.text(this.lblText(pinNumber));
                lbl.y(lbl.y() - pinHeightOffSet);
                var offSetPadding = isNaN(parseInt(this.lblText(pinNumber))) ? 14 : 4;
                lbl.x(lbl.x() - pinWidthOffSet - offSetPadding);
            }
            else if (row === 0) {
                pinNumber = numPinsInColumn + numPinsInRow + (this.numColumns - column - 1);
                lbl.text(this.lblText(pinNumber));
                lbl.x(lbl.x() - pinHeightOffSet);
                lbl.y(lbl.y() + pinWidthOffSet + lbl.width());
                lbl.rotation(-90);
            }
            else if (column === 0) {
                pinNumber = numPinsInRow + (2 * numPinsInColumn) + (row);
                lbl.text(this.lblText(pinNumber));
                lbl.y(lbl.y() - pinHeightOffSet);
                lbl.x(lbl.x() + pinWidthOffSet);
            }
            else {
                throw "Unable to map pin name";
            }
            return lbl;
        };
        QFPPkg.prototype.lblText = function (pinNumber) {
            return pinNumber.toString();
        };
        QFPPkg.prototype.isValidRowCol = function (row, column) {
            return ((row === 0 || row === this.numRows - 1) && column > 0 && column < this.numColumns - 1) ||
                ((column === 0 || column === this.numColumns - 1) && row > 0 && row < this.numRows - 1);
        };
        QFPPkg.prototype.addCellContent = function (layer, pinX, pinY, row, column) {
            if (this.isValidRowCol(row, column)) {
                var width_1 = PIN_SIZE;
                var height_1 = PIN_SIZE / 2;
                if (row === 0 || row === this.numRows - 1) {
                    var temp = width_1;
                    width_1 = height_1;
                    height_1 = temp;
                }
                pinX += this.getXPinOffSet(row, column);
                pinY += this.getYPinOffSet(row, column);
                var lbl = this.createLbl(pinX, pinY, row, column);
                var shape = new Konva.Rect({
                    x: pinX,
                    y: pinY,
                    width: width_1,
                    height: height_1,
                    fill: "grey"
                });
                var pin = {
                    shape: shape,
                    pinName: lbl.text(),
                    pinType: null
                };
                shape.pin = pin;
                this.applyPinDecorations(pin);
                layer.add(pin.shape);
                layer.add(lbl);
                this.pins.push(pin);
            }
        };
        QFPPkg.prototype.createPopUpDetails = function (pin) {
            var pinName = pin.pinName;
            var devicePin = this.deviceData.devicePins[pinName];
            var html = "<table> <tr> <td> Pin : </td> <td> " + pinName + "</td> </tr>";
            if (devicePin) {
                html += "<tr> <td> Name: </td> <td> " + devicePin.designSignalName + "</td> </tr>";
                if (devicePin.description !== "") {
                    html += "<tr>  <td> Description:  </td> <td> " + devicePin.description + "</td> </tr>";
                }
                if (devicePin.powerDomain) {
                    html += "<tr>  <td> Power:  </td> <td> " + devicePin.powerDomain.name + "</td> </tr>";
                }
                var solution = this.deviceRequirements.devicePinMap[pinName];
                var assignedToName = "";
                if (solution) {
                    assignedToName = solution.assignedToName;
                    html += "<tr> <td> Requirement: </td> <td> " + solution.requirementName + "</td> </tr>";
                }
                if (devicePin.mux) {
                    html += "<tr> <td><strong>Mode</strong></td> <td><strong>Function</strong></td></tr>";
                    var isPortMappingPin = false;
                    var portMappedModeName = null;
                    var portMappedSignalName = null;
                    var portMappingPinRegex = /_PM\d*_/;
                    for (var i = 0; i < devicePin.mux.muxSetting.length; i++) {
                        var mode = devicePin.mux.muxSetting[i].mode;
                        var signalName = devicePin.mux.muxSetting[i].peripheralPin.name;
                        if (mode.match(portMappingPinRegex)) {
                            isPortMappingPin = true;
                            if (signalName === assignedToName) {
                                portMappedModeName = mode.substring(0, mode.search(portMappingPinRegex));
                                portMappedSignalName = "PortMapped to: " + signalName;
                            }
                        }
                        else if (signalName === assignedToName) {
                            html += "<tr style='color:#49b653'>  <td>" + mode + " </td> <td> " + signalName + "</td> </tr>";
                            portMappedModeName = null;
                            portMappedSignalName = null;
                        }
                        else {
                            html += "<tr>  <td>" + mode + " </td> <td> " + signalName + "</td> </tr>";
                        }
                    }
                    if (isPortMappingPin) {
                        portMappedModeName = (portMappedModeName === null) ? "H_1" : portMappedModeName;
                        if (portMappedSignalName) {
                            html += "<tr style='color:#49b653'>  <td>" + portMappedModeName + " </td> <td> " + portMappedSignalName + "</td> </tr>";
                        }
                        else {
                            html += "<tr>  <td>" + portMappedModeName + " </td> <td> " + "Port Mapping Pins" + "</td> </tr>";
                        }
                    }
                }
            }
            else {
                html += "<tr> <th colspan='2'> N/A </th>  </tr>";
            }
            html += "</table>";
            return html;
        };
        QFPPkg.prototype.showPopUp = function (shape, x, y) {
            var popUp = document.getElementById("pinDetails");
            if (shape.pin) {
                var currentDocHeight = util.getWindowHeight();
                popUp.innerHTML = this.createPopUpDetails(shape.pin);
                popUp.style.display = "block";
                popUp.style.position = "fixed";
                var yOverFlow = (y + popUp.clientHeight + 30) - currentDocHeight;
                y = (yOverFlow > 0) ? (y - yOverFlow) : y;
                popUp.style.top = y + "px";
                popUp.style.left = (x - popUp.clientWidth) + "px";
            }
        };
        QFPPkg.prototype.applyPinDecorations = function (pin) {
            this.setPinType(pin);
            this.applyPinDecorationsToShape(pin);
        };
        QFPPkg.prototype.setPinType = function (pin) {
            var changed = false;
            var pinType = PIN_NOT_AVAILABLE;
            var selected = false;
            var pinName = pin.pinName;
            var devicePin = this.deviceData.devicePins[pinName];
            var solution = this.deviceRequirements.devicePinMap[pinName];
            if (devicePin) {
                pinType = DEVICE_PIN_TO_PIN_TYPE[devicePin.devicePinType];
                if (solution) {
                    pinType = PIN_ASSIGNED;
                    if (solution.warningDetailsText.length > 0) {
                        pinType = PIN_WARNING;
                    }
                    if (this.selectedRequirement == solution.requirementId) {
                        selected = true;
                    }
                }
            }
            changed = (pin.selected !== selected) || (pin.pinType != pinType);
            pin.selected = selected;
            pin.pinType = pinType;
            return changed;
        };
        QFPPkg.prototype.applyPinDecorationsToShape = function (pin) {
            if (pin.shape) {
                var fill = this.showExtendedPinTypes ? "white" : "#D8D8D8";
                var stroke = this.showExtendedPinTypes ? "white" : "#D8D8D8";
                var strokeWidth = 1;
                switch (pin.pinType) {
                    case PIN_UNASSIGNED:
                        fill = "#676767";
                        stroke = "#676767";
                        break;
                    case PIN_ASSIGNED:
                        fill = "#49b653";
                        stroke = "#49b653";
                        break;
                    case PIN_WARNING:
                        fill = "#FFBF00";
                        stroke = "#FFBF00";
                        break;
                    case PIN_POWER:
                        fill = "#990000";
                        stroke = "#990000";
                        break;
                    case PIN_GROUND:
                        fill = "black";
                        stroke = "black";
                        break;
                    case PIN_FIXED:
                        fill = "#D8D8D8";
                        stroke = "#D8D8D8";
                        break;
                }
                if (pin.selected) {
                    stroke = "#000";
                }
                pin.shape.fill(fill);
                pin.shape.stroke(stroke);
                pin.shape.strokeWidth(strokeWidth);
            }
        };
        QFPPkg.prototype.hidePopUp = function () {
            var popUp = document.getElementById("pinDetails");
            popUp.style.display = "none";
        };
        QFPPkg.prototype.redraw = function () {
            for (var i = 0; i < this.pins.length; i++) {
                var pin = this.pins[i];
                if (pin.shape) {
                    if (this.setPinType(pin)) {
                        pin.shape.stroke("white");
                        pin.shape.draw();
                        this.applyPinDecorationsToShape(pin);
                        pin.shape.draw();
                    }
                }
            }
        };
        return QFPPkg;
    }());
    var BGAPkg = (function (_super) {
        __extends(BGAPkg, _super);
        function BGAPkg(deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, rowColumnInverted) {
            _super.call(this, deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, rowColumnInverted);
            this.columnNames = this.getColumnNames(this.pkgInfo.numColumns);
            this.rowNames = this.getRowNames(this.pkgInfo.numRows);
            this.numColumns = this.pkgInfo.numColumns;
            this.numRows = this.pkgInfo.numRows;
            this.extraSpaceBelow = PIN_SIZE * (1 + PIN_TYPES.length);
            this.columnNames = this.getColumnNames(this.pkgInfo.numColumns);
            this.rowNames = this.getRowNames(this.pkgInfo.numRows);
            if (this.rowColumnInverted) {
                var temp = this.rowNames;
                this.rowNames = this.columnNames;
                this.columnNames = temp;
                this.rowNames.reverse();
                this.columnNames.reverse();
            }
            this.extraTopLeft = EXTRA_PADDING_BEFORE_FIRST_VISIBLE_ELEMENT;
            this.extraBottomRight = EXTRA_PADDING_BEFORE_FIRST_VISIBLE_ELEMENT;
        }
        BGAPkg.prototype.getColumnNames = function (numColumns) {
            var columns = [];
            var index = 0;
            while (columns.length != numColumns) {
                if (index < 26) {
                    var char = String.fromCharCode("A".charCodeAt(0) + index);
                    if (char != "I" && char != "O" && char != "Q" && char != "S" && char != "X" && char != "Z") {
                        columns.push(char);
                    }
                }
                else {
                    var numElements = index + 1;
                    var appendToIndex = Math.floor((numElements / 26)) - 1;
                    columns.push(columns[appendToIndex].concat(columns[(numElements % 26) - 1]));
                }
                index++;
            }
            return columns;
        };
        BGAPkg.prototype.getRowNames = function (numRows) {
            var rows = [];
            for (var index = numRows; index > 0; index--) {
                rows.push(index.toString());
            }
            return rows;
        };
        BGAPkg.prototype.pinLegendYFactor = function () {
            return 1.05;
        };
        BGAPkg.prototype.pinName = function (row, column) {
            if (this.rowColumnInverted) {
                return this.rowNames[row] + this.columnNames[column];
            }
            return this.columnNames[column] + this.rowNames[row];
        };
        BGAPkg.prototype.dimpleRadius = function () {
            return (PIN_SIZE / 3);
        };
        BGAPkg.prototype.dimpleX = function () {
            return PIN_SIZE * 2;
        };
        BGAPkg.prototype.dimpleY = function () {
            return height - (PIN_SIZE * 2);
        };
        BGAPkg.prototype.getXPinOffSet = function () {
            return this.extraTopLeft;
        };
        BGAPkg.prototype.getYPinOffSet = function () {
            return this.extraBottomRight;
        };
        BGAPkg.prototype.addCellContent = function (layer, pinX, pinY, row, column) {
            pinX += PIN_SIZE / 2;
            pinY += PIN_SIZE / 2;
            var radius = PIN_SIZE / 2.5;
            pinX += this.getXPinOffSet();
            pinY += this.getYPinOffSet();
            var pinName = this.pinName(row, column);
            var lbl = this.createLbl(pinX, pinY, row, column);
            var pin = {
                shape: null,
                pinName: pinName,
                pinType: null
            };
            pin.shape = new Konva.Circle({
                x: pinX,
                y: pinY,
                radius: radius,
                fill: "grey"
            });
            pin.shape.pin = pin;
            this.applyPinDecorations(pin);
            if (pin.shape)
                layer.add(pin.shape);
            if (lbl)
                layer.add(lbl);
            if (row === 0 && column === 0) {
                lbl = this.createLbl(pinX, pinY, -1, column);
                layer.add(lbl);
            }
            this.pins.push(pin);
        };
        BGAPkg.prototype.legendShape = function () {
            return new Konva.Circle({
                x: 0,
                y: 0,
                radius: PIN_SIZE / 2.5,
                fill: "grey"
            });
        };
        BGAPkg.prototype.legendLblOffsetY = function () {
            return -(PIN_SIZE / 2.5);
        };
        BGAPkg.prototype.createLbl = function (x, y, row, column) {
            var lbl = new Konva.Text({
                x: x,
                y: y,
                text: "",
                fontSize: PIN_SIZE,
                fill: "black",
                rotation: 0
            });
            var offSet = PIN_SIZE / 2;
            var padding = 4;
            if (row === 0) {
                lbl.text(this.columnNames[column]);
                lbl.y(lbl.y() - offSet - padding);
                lbl.x(lbl.x() - offSet);
                lbl.rotation(-90);
            }
            else if (column === 0) {
                row = (row == -1) ? 0 : row;
                lbl.text(this.rowNames[row]);
                lbl.x(lbl.x() - offSet - lbl.width() - padding);
                lbl.y(lbl.y() - offSet);
            }
            else if (row == -1 && column == -1) {
            }
            else {
                lbl = null;
            }
            return lbl;
        };
        return BGAPkg;
    }(QFPPkg));
    var BOARDPkg = (function (_super) {
        __extends(BOARDPkg, _super);
        function BOARDPkg(deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, rowColumnInverted) {
            _super.call(this, deviceData, deviceRequirements, selectedRequirement, showExtendedPinTypes, rowColumnInverted);
        }
        BOARDPkg.prototype.lblText = function (pinNumber) {
            var packagePin = _.find(this.deviceData.devicePins, { packagePinBall: String(pinNumber) });
            if (packagePin)
                return packagePin.ball;
            else
                return "";
        };
        return BOARDPkg;
    }(QFPPkg));
});
//# sourceMappingURL=pinview.js.map