/* Import DebugServer enving and Java packages
*/
importPackage(Packages.com.ti.debug.engine.scripting);
importPackage(Packages.com.ti.ccstudio.scripting.environment);
importPackage(Packages.java.lang);

var PROGRAMNAME="F28335_example_nonBIOS_flash.out";
var EXECUTABLE="../C28/F28335_nonBIOS_flash/"+PROGRAMNAME;

/* Global handles to the debugger
*/
var env = ScriptingEnvironment.instance();
var server = env.getServer("DebugServer.1");
server.setConfig("../C28/F28335SystemSetup.ccxml");
var session = server.openSession();

// Create a log file in the current directory to log script execution
env.traceBegin("Flash28Log.xml", "DefaultStylesheet.xsl");

/* Connect to target
*/
env.traceWrite("Connecting to device...");

session.target.connect();

env.traceWrite("Connected.");

/* Set flash properties
*/
/* Clock settings */
//session.flash.options.setString("FlashOSCCLK","30");
//session.flash.options.setString("FlashCLKINDV","2");
//session.flash.options.setString("FlashPLLCR","10");

/* sectors to erase */
//session.flash.options.setBoolean("FlashSectorA", true);
//session.flash.options.setBoolean("FlashSectorB", true);
//session.flash.options.setBoolean("FlashSectorC", true);
//session.flash.options.setBoolean("FlashSectorD", true);
//session.flash.options.setBoolean("FlashSectorE", true);
//session.flash.options.setBoolean("FlashSectorF", true);
//session.flash.options.setBoolean("FlashSectorG", true);
//session.flash.options.setBoolean("FlashSectorH", true);
//session.flash.options.setBoolean("FlashSectorI", true);
//session.flash.options.setBoolean("FlashSectorJ", true);

/* flash password settings */
//session.flash.options.setString("FlashKey0","FFFF");
//session.flash.options.setString("FlashKey1","FFFF");
//session.flash.options.setString("FlashKey2","FFFF");
//session.flash.options.setString("FlashKey3","FFFF");
//session.flash.options.setString("FlashKey4","FFFF");
//session.flash.options.setString("FlashKey5","FFFF");
//session.flash.options.setString("FlashKey6","FFFF");
//session.flash.options.setString("FlashKey7","FFFF");

/* frequency test settings */
/* for 281x devices */
//session.flash.options.setString("FTRegister", "GPAMux");
//session.flash.options.setString("FTPin","GPIOx0");
/* for other devices */
//session.flash.options.setString("FTPin","GPIO0 (A)");

/* flash operations */
//session.flash.startFrequencyTest();
//session.flash.endFrequencyTest();
//session.flash.erase();
//session.flash.programPassword();
//session.flash.lock();
//session.flash.unlock();
//session.flash.calculateChecksum();
//session.flash.depletionRecovery();

/* load program setting */
//session.flash.options.setString("FlashOperations","Erase, Program, Verify");

try{
	/* Load the Program
	*/
	env.traceWrite("Load Program: "+PROGRAMNAME);
	env.traceWrite("Loading...");

	session.memory.loadProgram(EXECUTABLE);
	env.traceWrite("Program Loaded.");

	/* Get Flash Checksum
	*/
	session.flash.calculateChecksum();
}
catch(err)
{
	env.traceWrite("Error in Flash Programmer.");
}

/* End session, since the tests are done
*/
server.stop();
session.terminate();
