"use strict";
var services = require("./services.js")();
services.registerService("../cli/cli_core.js");
services.registerService("../cli/cli_opts.js");
services.get("cli_opts");
//# sourceMappingURL=cli.js.map