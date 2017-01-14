/* Import DebugServer enving and Java packages */
importPackage(Packages.com.ti.debug.engine.scripting);
importPackage(Packages.com.ti.ccstudio.scripting.environment);
importPackage(Packages.java.lang);

/*
Equivalent to the command line: 
uniflash -ccxml ../configs/F28M35H52C1_XDS560.ccxml -core M3 -export COFF 0x200000 0x2000 ../programs/export.out
*/

/* Global handles to the debugger */
var env = ScriptingEnvironment.instance();
var server = env.getServer("DebugServer.1");

// Create a log file in the current directory to log script execution
env.traceBegin("scriptExample_export.xml", "../stylesheet/DefaultStylesheet.xsl");
env.traceSetFileLevel(TraceLevel.ALL);

server.setConfig("../configs/F28M35H52C1_XDS560.ccxml");
var session = server.openSession(".*M3.*");

try{
	/* Exporting/Save memory to file */
	env.traceWrite("\nConnecting to the device...");
	session.target.connect();
	env.traceWrite("Connected. \n");
	
	env.traceWrite("Save memory to file...");
	session.memory.save(0x200000,0,0x2000,"../programs/export.out",5,false);
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