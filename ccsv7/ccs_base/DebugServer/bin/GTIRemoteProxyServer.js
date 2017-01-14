/*jslint node: true */
"use strict";

var net = require("net");
var spawn = require("child_process").spawn;

var server = net.createServer(function(socket) {
	var lp = spawn("./GTIRemoteProxyServer", [], {
		cwd: __dirname,
		detached: true
	});
	
	function stdoutHandler(data)
	{
		var buffer = new Buffer(2);
		buffer.writeUInt16LE(parseInt(data, 10), 0);
		socket.write(buffer);
		socket.pipe(socket);
		lp.stdout.removeListener("data", stdoutHandler);
	}
	
	lp.stdout.on("data", stdoutHandler);
	lp.stderr.on("data", function (data) {
	    process.stderr.write(data);
	});
});

var port = process.argv[2] || 7710;
server.listen(port);