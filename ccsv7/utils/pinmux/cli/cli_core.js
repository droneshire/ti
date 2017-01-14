var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "pinmux/services/data", "pinmux/services/ui", "pinmux/services/codeGenerator", "pinmux/services/pinmuxRootScope", "pinmux/services/settings"], function (require, exports, srvDeviceData, UI, CodeGenerator, rootScope, settings) {
    "use strict";
    var version = settings.version;
    var path = require("path");
    var fs = require("fs");
    var paths = require("./paths");
    var TemplatePathError = (function (_super) {
        __extends(TemplatePathError, _super);
        function TemplatePathError(templatePath) {
            _super.call(this);
            this.path = templatePath;
            this.message = "Can't find " + templatePath;
        }
        return TemplatePathError;
    }(Error));
    exports.TemplatePathError = TemplatePathError;
    function generateOutput(deviceDataDir, designFile, templates, outDir, loadErrors) {
        var dataStr = fs.readFileSync(designFile).toString();
        paths.deviceDataDirRoot = deviceDataDir;
        function writeFile(outputdir, name, data) {
            var outFile = path.resolve(path.join(outputdir, name));
            console.log("Generating " + outFile + "...");
            var str = data();
            fs.writeFileSync(outFile, str);
            console.log("Done.");
        }
        function generateOutput(deviceData, templateInfos, outputdir) {
            var codeGenerator = new CodeGenerator(rootScope.deviceRequirements, deviceData, version);
            _.each(templateInfos, function (templateInfo) {
                writeFile(outputdir, templateInfo.name, function () {
                    return codeGenerator.generate(templateInfo.template);
                });
            });
        }
        return srvDeviceData.loadProject(dataStr)
            .then(function (projectData) {
            return srvDeviceData.getDeviceInfo(projectData.boardId, projectData.deviceId, projectData.partId, projectData.packageId);
        })
            .then(function (deviceData) {
            var writeLoadErrorsToFile = false;
            if (!loadErrors) {
                writeLoadErrorsToFile = true;
                loadErrors = [];
            }
            UI.createInterfaces(deviceData, rootScope.deviceRequirements, loadErrors);
            if (loadErrors.length && writeLoadErrorsToFile) {
                writeFile(outDir, "errors_loading_design.json", function () {
                    return JSON.stringify(_(loadErrors).map(function (error) {
                        return error.message;
                    }));
                });
            }
            var templateInfos = deviceData.templates.fileListArray;
            if (templates) {
                templateInfos = _.map(templates, function (templateName) {
                    var outputFile = templateName.replace(".xdt", "");
                    var templateInfo = _.find(deviceData.templates.fileListArray, function (templateInfo) {
                        return templateInfo.name === outputFile;
                    });
                    if (!templateInfo) {
                        throw new TemplatePathError(path.join("deviceData", "templates", templateName));
                    }
                    return templateInfo;
                });
            }
            return generateOutput(deviceData, templateInfos, outDir);
        });
    }
    exports.generateOutput = generateOutput;
});
//# sourceMappingURL=cli_core.js.map