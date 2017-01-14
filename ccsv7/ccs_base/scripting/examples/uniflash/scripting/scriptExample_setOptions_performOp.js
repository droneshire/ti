/* Import DebugServer enving and Java packages */
importPackage(Packages.com.ti.debug.engine.scripting);
importPackage(Packages.com.ti.ccstudio.scripting.environment);
importPackage(Packages.java.lang);

/*
Equivalent to the command line: 
uniflash -log scriptExample_setOptions_performOp.xml -ccxml ../configs/TMS470MF066_USB.ccxml -setOptions FlashEraseSelection="Selected Sectors Only" FlashBank0Sector0=0 FlashBank0Sector1=true -operation Erase
*/

/* Global handles to the debugger */
var env = ScriptingEnvironment.instance();
var server = env.getServer("DebugServer.1");

// Create a log file in the current directory to log script execution
env.traceBegin("scriptExample_setOptions_performOp.xml", "../stylesheet/DefaultStylesheet.xsl");
env.traceSetFileLevel(TraceLevel.ALL);

server.setConfig("../configs/TMS470MF066_USB.ccxml");
var session = server.openSession("*","*");

try{
	/* Set Flash Options */
	env.traceWrite("Setting flash options...");
	session.flash.options.setString("FlashEraseSelection", "Selected Sectors Only");
	session.flash.options.setBoolean("FlashBank0Sector0", false);
	session.flash.options.setBoolean("FlashBank0Sector1", true);
	
	env.traceWrite("\nConnecting to the device...");
	session.target.connect();
	env.traceWrite("Connected. \n");
	
	env.traceWrite("Erasing selected Flash sectors...");
	session.flash.performOperation("Erase");
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