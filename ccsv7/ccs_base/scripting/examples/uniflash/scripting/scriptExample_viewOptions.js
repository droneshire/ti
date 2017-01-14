/* Import DebugServer enving and Java packages */
importPackage(Packages.com.ti.debug.engine.scripting);
importPackage(Packages.com.ti.ccstudio.scripting.environment);
importPackage(Packages.java.lang);

/*
Equivalent to the command line: 
uniflash -log scriptExample_viewOptions.xml -ccxml ../configs/TMS470MF066_USB.ccxml -viewOptions
*/

/* Global handles to the debugger */
var env = ScriptingEnvironment.instance();
var server = env.getServer("DebugServer.1");

// Create a log file in the current directory to log script execution
env.traceBegin("scriptExample_viewOptions.xml", "../stylesheet/DefaultStylesheet.xsl");
env.traceSetFileLevel(TraceLevel.ALL);

server.setConfig("../configs/TMS470MF066_USB.ccxml");
var session = server.openSession("*","*");

try{
	/* Get Flash Options */
	env.traceWrite("Priting available options...");
	
	session.flash.options.printOptionById("FlashProgrammerNode");
	
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