"use strict";
var fs = require("fs");
var path = require("path");
var paths = require("./paths");
module.exports = {
    version: fs.readFileSync(path.join(paths.pinmuxDir, "version.txt")).toString()
};
//# sourceMappingURL=settings.js.map