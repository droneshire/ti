/* Import DebugServer enving and Java packages */
importPackage(Packages.com.ti.debug.engine.scripting);
importPackage(Packages.com.ti.ccstudio.scripting.environment);
importPackage(Packages.java.lang);

/*
Equivalent to the command line: 
uniflash -log scriptExample_complex.xml -ccxml ../configs/TMS320F28035.ccxml -setOptions FlashKey0=AAAA FlashKey1=BBBB -operation Unlock Erase -program ../programs/F28035_Prog1.out ../programs/F28035_Prog2.out ../programs/F28035_Prog3.out -operation "CalculateChecksum" -export COFF 0x3E8000 0xC000 ../programs/export2.out
*/

/* Global handles to the debugger */
var env = ScriptingEnvironment.instance();
var server = env.getServer("DebugServer.1");

// Create a log file in the current directory to log script execution
env.traceBegin("scriptExample_complex.xml", "../stylesheet/DefaultStylesheet.xsl");
env.traceSetFileLevel(TraceLevel.ALL);

server.setConfig("../configs/TMS320F28035.ccxml");
var session = server.openSession("*","*");

try{
	/* Set Flash Options */
	env.traceWrite("Setting flash options...");
	session.flash.options.setString("FlashKey0","AAAA");
	session.flash.options.setString("FlashKey1","BBBB");
	
	env.traceWrite("\nConnecting to the device...");
	session.target.connect();
	env.traceWrite("Connected. \n");
	
	/* Unlocking device */
	env.traceWrite("\nUnlocking...");
	session.flash.performOperation("Unlock");
	env.traceWrite("Finish unlock.\n");
	
	/* Erase device */
	env.traceWrite("\Erasing...");
	session.flash.performOperation("Erase");
	env.traceWrite("Finish erase.\n");
	
	env.traceWrite("Starting Program loads...");
	session.flash.multiloadStart();
	session.memory.loadProgram("../programs/F28035_Prog1.out");
	session.memory.loadProgram("../programs/F28035_Prog2.out");
	session.memory.loadProgram("../programs/F28035_Prog3.out");
	session.flash.multiloadEnd();
	env.traceWrite("Completed.\n");
	
	env.traceWrite("Calculate checksum...");
	session.flash.performOperation("CalculateChecksum");
	env.traceWrite("Completed.\n");
	
	env.traceWrite("Save memory to file...");
	session.memory.save(0x3E8000,0,0xC000,"../programs/export2.out",5,false);
	env.traceWrite("Completed.\n");
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