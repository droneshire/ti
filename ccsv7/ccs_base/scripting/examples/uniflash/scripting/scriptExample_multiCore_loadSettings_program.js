/* Import DebugServer enving and Java packages */
importPackage(Packages.com.ti.debug.engine.scripting);
importPackage(Packages.com.ti.ccstudio.scripting.environment);
importPackage(Packages.java.lang);

/*
Equivalent to the command line: 
uniflash -log scriptExample_multiCore_loadSettings_program.xml -ccxml ../configs/F28M35H52C1_XDS560.ccxml -core "C28" -loadSettings ../session/f28m35.session -program ../programs/f28m35_c28_blinky.out
*/

/* Global handles to the debugger */
var env = ScriptingEnvironment.instance();
var server = env.getServer("DebugServer.1");

// Create a log file in the current directory to log script execution
env.traceBegin("scriptExample_multiCore_loadSettings_program.xml", "../stylesheet/DefaultStylesheet.xsl");
env.traceSetFileLevel(TraceLevel.ALL);

server.setConfig("../configs/F28M35H52C1_XDS560.ccxml");
var session = server.openSession(".*C28.*");

try{
	/* Set Flash Options */
	env.traceWrite("Setting flash options from session file...");
	session.flash.options.loadSessionSettings("../session/f28m35.session");
	
	env.traceWrite("\nConnecting to the device...");
	session.target.connect();
	env.traceWrite("Connected. \n");
	
	env.traceWrite("Loading Program...");
	session.memory.loadProgram("../programs/f28m35_c28_blinky.out");
	env.traceWrite("Completed.");
}
catch(err)
{
	env.traceWrite("Error encountered during script: " + err);
}

/* End session, since the tests are done
*/
server.stop();
session.terminate();
env.traceEnd();