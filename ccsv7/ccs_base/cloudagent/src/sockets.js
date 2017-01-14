/*jslint node: true */
"use strict";

var http = require("http");
var ws = require("ws");
var Q = require("q");

// create a websocket server
function createWSServer() {

	var def = Q.defer();

	// use create server to find an available port and to upgrade to wss
	var server = http.createServer(function(req, res) {

		res.writeHead(200);
		res.end();
	});

	server.on("error", function onError() {
		def.reject();
	});

	server.listen(function onListen() {
		var WebSocketServer = ws.Server;
		var wss = new WebSocketServer({
			server: server
		});
		def.resolve(wss);
	});

	return def.promise;
}

module.exports.createWSServer = createWSServer;