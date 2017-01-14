/*jslint node: true */
"use strict";

var ScriptingEnvironment = function(contextObj) {
	var inst;

	return {
		instance: function() {
			if (!inst) {
				inst = augScriptingEnvironment();
			}
			return inst;
		}
	};

	function augScriptingEnvironment() {
		return {
			getServer: function(serverName) {
				return augDebugServer(serverName);
			},

			traceWrite: console.log,

			setScriptTimeout: function(){},
			traceBegin: function(){},
			traceSetConsoleLevel: function(){},
			traceSetFileLevel: function(){},
			traceEnd: function(){}
		};
	}

	function augDebugServer(serverName) {
		var name = serverName;
		var ccxmlPath;

		return {
			setConfig: function(ccxml) {
				ccxmlPath = ccxml;
			},

			//configure
			openSession: function(params) {
				return augDebugSession(ccxmlPath, params);
			},

			getName: function() { // new
				return name;
			},

			//deconfigure all?
			stop: function() {
				//todo
			}
		};
	}

	function augTarget(core) {
		
		return {
			connect: function() {
				return core.targetState.connect();
			},

			disconnect: function() {
				return core.targetState.disconnect();
			},

			halt: function() {
				return core.targetState.halt();//todo: check param
			},

			run: function() {
				return core.targetState.run();//todo: check param
			}
		};
	}

	function augMemory(core) {
		return {
			loadProgram: function(progPath) {//todo: check param
				return core.symbols.loadProgram(progPath);//todo symbols.loadProgram
			},

			//takes varargs
			readData: function() {//todo: check param
				return core.memory.readData();//todo memory.read
			}
		};
	}

	function augSymbol(core) {
		return {
			load: function(progPath) {
				return core.symbols.loadProgram(progPath);
			}
		};
	}

	function augExpression(core) {
		return {
			evaluate: function(str) {
				return core.expressions.evaluate(str);
			}
		};
	}


	function augDebugSession(ccxmlPath, params) {
		var core = function() {
			var cores = contextObj.DSLite.configure(ccxmlPath).cores;
			var coreName = (!params) ? cores[0] : cores[0];//todo: right now just force core 0, handle this and process the wild str matching in dss
			var subModInfo = contextObj.DSLite.createSubModule(coreName);
			return contextObj.createSubmodule(coreName, subModInfo);
		}();

		return {
			target: augTarget(core),
			memory: augMemory(core),
			symbol: augSymbol(core),
			expression: augExpression(core),

			terminate: function(core) {//todo: what do we do here
				return contextObj.DSLite.deConfigure();
			}
		};
	}

};

module.exports = ScriptingEnvironment;

// function augGg(g) {
// 	g.test = function () {
// 		console.log("lol2");
// 	}

// 	return g;
// }

// function augScriptEnv(env) {
// 	env.lol = function () {
// 		console.log("lol");
// 	}

// 	env.gg = {};
// 	augGg(env.gg);

// 	return env;
// }

// var ScriptingEnvironment = {
// 		instance : function() {
// 			return augScriptEnv({});
// 		}

// };


// ScriptingEnvironment.instance().lol();
// ScriptingEnvironment.instance().gg.test();

//
//var ScriptingEnvironment = {
//		instance : function() {
//			return augScriptEnv({});
//		}
//
//};
//
//
//var env = ScriptingEnvironment.instance();
//env.gg.test();
//env.gg.test2();
//
//function augGg(g) {
//	g.test = function () {
//		this.a = 12
//		console.log("lol2");
//	}
//	
//	g.test2 = function () {
//		console.log(this.a);
//	}
//	
//	g.log = console.log;	
//	return g;
//}
//
//function augScriptEnv(env) {
//	env.lol = function () {
//		console.log("lol");
//	}
//	
//	env.gg = {};
//	augGg(env.gg);
//	
//	return env;
//}
//
//function create() {
//	return {
//		console:console
//	};
//}
//
//function test() {
//	return {
//	a: create()
//	};
//}
//
//test().a.console.log("lol");
