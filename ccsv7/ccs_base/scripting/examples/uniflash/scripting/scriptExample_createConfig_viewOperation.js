/* Import DebugServer enving and Java packages */
importPackage(Packages.com.ti.debug.engine.scripting);
importPackage(Packages.com.ti.ccstudio.scripting.environment);
importPackage(Packages.java.lang);

/*
Equivalent to the command line: 
uniflash -log scriptExample_createConfig_viewOperation.xml -createConfig "Texas Instruments XDS100v2 USB Emulator" "TMS470MF06607" ../configs/uniflash.ccxml -listOperations
*/

/* Global handles to the debugger */
var env = ScriptingEnvironment.instance();
var server = env.getServer("DebugServer.1");

// Create a log file in the current directory to log script execution
env.traceBegin("scriptExample_createConfig_viewOperation.xml", "../stylesheet/DefaultStylesheet.xsl");
env.traceSetFileLevel(TraceLevel.ALL);

// generate the configuration file
try {
	env.traceWrite("Generating Target Configuration file... ");
	var configGenerator = server.createTargetConfigurationGenerator();
	configGenerator.setOutputDirectory("../configs/");

	configGenerator.setConnection("Texas Instruments XDS100v2 USB Emulator");
	configGenerator.setDevice("TMS470MF06607");
	
	configGenerator.createConfiguration("uniflash.ccxml");
	env.traceWrite("Generated. \n");
	
	server.setConfig("../configs/uniflash.ccxml");
	var session = server.openSession("*","*");

	env.traceWrite("Connecting to the device...");
	session.target.connect();
	env.traceWrite("Connected. \n");
	
	session.flash.listSupportedOperations();
	session.terminate();
}
catch(err)
{
	env.traceWrite("Error encountered during script: " + err);
}

server.stop();
env.traceEnd();
