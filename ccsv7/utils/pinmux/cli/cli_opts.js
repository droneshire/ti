define(["require", "exports", "./cli_core", "pinmux/services/settings"], function (require, exports, cliCore, settings) {
    "use strict";
    var version = settings.version;
    var path = require("path");
    var fs = require("fs");
    var docopt = require("docopt").docopt;
    var generateOutput = cliCore.generateOutput;
    var doc = fs.readFileSync(path.join(__dirname, "cli_docopt.txt")).toString().replace(/\r/gm, "");
    var cmdArgs = docopt(doc, {
        help: true,
        version: version
    });
    function invalidPathError(arg, path) {
        return "Invalid " + arg + " -> " + path + " does not exist";
    }
    _.each(_.zip(["--output", "--data", "<.pinmux file>"], [true]), function (pair) {
        var fileParam = pair[0];
        var validateParerntPath = pair[1];
        var pathToValidate;
        if (!path.isAbsolute(cmdArgs[fileParam])) {
            var fileArg = cmdArgs[fileParam];
            cmdArgs[fileParam] = path.resolve(fileArg);
            pathToValidate = validateParerntPath ? path.dirname(cmdArgs[fileParam]) : cmdArgs[fileParam];
            if (!fs.existsSync(pathToValidate)) {
                cmdArgs[fileParam] = path.resolve(path.join(__dirname, "..", fileArg));
            }
        }
        pathToValidate = validateParerntPath ? path.dirname(cmdArgs[fileParam]) : cmdArgs[fileParam];
        if (!fs.existsSync(pathToValidate)) {
            exitWithError(invalidPathError(fileParam, pathToValidate));
        }
    });
    try {
        fs.mkdirSync(cmdArgs["--output"]);
    }
    catch (error) {
        if (error.code !== "EEXIST")
            throw error;
    }
    function exitWithError(errorString) {
        process.stderr.write(errorString);
        process.exit(1);
    }
    function catchHandler(ex) {
        if (ex.stack) {
            console.error(ex.stack);
        }
        else {
            console.error(ex);
        }
    }
    var templates = cmdArgs["--template"][0] === "all" ? null : cmdArgs["--template"];
    var loadErrors = [];
    generateOutput(cmdArgs["--data"], cmdArgs["<.pinmux file>"], templates, cmdArgs["--output"], loadErrors)
        .catch(function (e) {
        if (e instanceof cliCore.TemplatePathError) {
            console.log(e.stack);
            exitWithError(invalidPathError("--template", path.join(cmdArgs["--data"], e.path)));
        }
        else {
            exitWithError(e);
        }
    })
        .then(function () {
        if (loadErrors.length) {
            console.log("Some errors loading design file due to data changes. The following requirements have been removed");
            console.log(loadErrors);
        }
    })
        .catch(catchHandler);
});
//# sourceMappingURL=cli_opts.js.map