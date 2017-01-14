var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "utils"], function (require, exports, util) {
    "use strict";
    var DropDown = {
        initModel: function (uiConfigurable) {
            var configurable = uiConfigurable.configurable;
            var configurableOverride = uiConfigurable.configurableOverride;
            var defaultOptionName = configurableOverride ? configurableOverride.optionName : configurable.default;
            uiConfigurable.setModel(_.find(configurable.options, {
                name: defaultOptionName
            }));
        },
        updateModel: function (uiConfigurable, newValue) {
            var configurable = uiConfigurable.configurable;
            var selectedOption = _.find(configurable.options, {
                name: newValue.name
            });
            uiConfigurable.setModel(selectedOption);
        },
        initLegacy: function (uiConfigurable, modelRoot) {
            var configurable = uiConfigurable.configurable;
            var selectedOption = _.find(configurable.options, function (option) {
                return modelRoot[option.name];
            });
            if (!selectedOption) {
                selectedOption = _.find(configurable.options, {
                    name: configurable.default
                });
            }
            uiConfigurable.setModel(selectedOption);
        }
    };
    var CheckBox = {
        initModel: function (uiConfigurable) {
            var configurable = uiConfigurable.configurable;
            var configurableOverride = uiConfigurable.configurableOverride;
            uiConfigurable.setModel(configurableOverride ? configurableOverride.checked : configurable.default);
        },
        updateModel: function (uiConfigurable, newValue) {
            uiConfigurable.setModel(newValue);
        },
        initLegacy: function (uiConfigurable, modelRoot) {
            uiConfigurable.setModel((modelRoot[uiConfigurable.configurable.name]));
        }
    };
    var TextBox = {
        initModel: function (uiConfigurable) {
            var configurable = uiConfigurable.configurable;
            var configurableOverride = uiConfigurable.configurableOverride;
            uiConfigurable.setModel(configurableOverride ? configurableOverride.value : configurable.default);
        },
        updateModel: function (uiConfigurable, newValue) {
            uiConfigurable.setModel(newValue);
        },
        initLegacy: function (_uiConfigurable, _modelRoot) {
        }
    };
    function getTypeHandler(configurable) {
        if (util.isDropDown(configurable)) {
            return DropDown;
        }
        if (util.isCheckBox(configurable)) {
            return CheckBox;
        }
        if (util.isTextBox(configurable)) {
            return TextBox;
        }
        throw new Error("Unsupported Type handler " + JSON.stringify(configurable));
    }
    var ConfigurableBase = (function () {
        function ConfigurableBase() {
        }
        ConfigurableBase.prototype.setModel = function (value) {
            this.model[this.configurable.name] = value;
        };
        ConfigurableBase.prototype.initModel = function () {
            getTypeHandler(this.configurable).initModel(this);
        };
        ConfigurableBase.prototype.updateModel = function (newValue) {
            getTypeHandler(this.configurable).updateModel(this, newValue);
        };
        ConfigurableBase.prototype.initLegacy = function (modelRoot) {
            getTypeHandler(this.configurable).initLegacy(this, modelRoot);
        };
        return ConfigurableBase;
    }());
    var Configurable = (function (_super) {
        __extends(Configurable, _super);
        function Configurable(modelRoot, configurable, configurableOverride, isLoad) {
            _super.call(this);
            if (modelRoot.configOptions) {
                modelRoot.configurables = modelRoot.configOptions;
                delete modelRoot.configOptions;
            }
            modelRoot.configurables = modelRoot.configurables || {};
            var isLegacyLoad = !modelRoot.configurables[configurable.name] && isLoad && util.isLegacy(configurable);
            this.model = modelRoot.configurables;
            this.configurable = configurable;
            this.configurableOverride = configurableOverride;
            if (isLegacyLoad) {
                this.initLegacy(modelRoot);
            }
            else if (!isLoad) {
                this.initModel();
            }
        }
        Configurable.prototype.hidden = function () {
            return this.configurable.hidden || (this.configurableOverride &&
                this.configurableOverride.hidden);
        };
        return Configurable;
    }(ConfigurableBase));
    exports.Configurable = Configurable;
    var ConfigurableHeader = (function (_super) {
        __extends(ConfigurableHeader, _super);
        function ConfigurableHeader(model, configurable) {
            _super.call(this);
            this.childUIConfigurables = [];
            this.model = model;
            this.configurable = configurable;
            this.initModel();
        }
        ConfigurableHeader.prototype.hidden = function () {
            var found = _.find(this.childUIConfigurables, function (uiConfigurable) {
                return !uiConfigurable.hidden();
            });
            return !found;
        };
        ConfigurableHeader.prototype.applyChange = function () {
            var newValue = this.model[this.configurable.name];
            _.find(this.childUIConfigurables, function (uiConfigurable) {
                var readOnly = uiConfigurable.configurable.readOnly ||
                    (uiConfigurable.configurableOverride && uiConfigurable.configurableOverride.readOnly);
                if (readOnly)
                    return;
                uiConfigurable.updateModel(newValue);
            });
        };
        return ConfigurableHeader;
    }(ConfigurableBase));
    exports.ConfigurableHeader = ConfigurableHeader;
    function createUIConfigurables(model, configurables, configurablesOverrides, isLoad) {
        var uiConfigurables = _.map(configurables, function (configurable) {
            var configurableOverride = _.find(configurablesOverrides, {
                name: configurable.name
            });
            return new Configurable(model, configurable, configurableOverride, isLoad);
        });
        return uiConfigurables;
    }
    exports.createUIConfigurables = createUIConfigurables;
});
//# sourceMappingURL=uiConfigurables.js.map