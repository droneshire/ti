// Import the DSS packages into our namespace to save on typing
importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.java.lang)

// Create our scripting environment object - which is the main entry point into any script and
// the factory for creating other Scriptable ervers and Sessions
var script = ScriptingEnvironment.instance()

// Create a log file in the current directory to log script execution
script.traceBegin("BreakpointsTestLog.xml", "DefaultStylesheet.xsl")

// Set our TimeOut
script.setScriptTimeout(15000)

// Log everything
script.traceSetConsoleLevel(TraceLevel.ALL)
script.traceSetFileLevel(TraceLevel.ALL)

// Get the Debug Server and start a Debug Session
debugServer = script.getServer("DebugServer.1")
debugServer.setConfig("../msp430f5529/msp430f5529.ccxml");
debugSession = debugServer.openSession(".*")

debugSession.target.connect();

// Load a program
// (ScriptingEnvironment has a concept of a working folder and for all of the APIs which take
// path names as arguments you can either pass a relative path or an absolute path)
debugSession.memory.loadProgram("../msp430f5529/programs/modem.out")

// Set a breakpoint at "main"
var main = debugSession.symbol.getAddress("main")
var bp1 = debugSession.breakpoint.add(main)

// Set another breakpoint
var address = debugSession.symbol.getAddress("ReadNextData")
var bp2 = debugSession.breakpoint.add(address)

// Restart our Target
debugSession.target.restart()

// Run if already not automatically halted at main.  Should halt at first BP
if(debugSession.expression.evaluate("PC") != main)
{
	debugSession.target.run()
}

// Using an expression - get the current value of the PC
nPC = debugSession.expression.evaluate("PC")

// Verify we halted at the correct address.  Use the Static Java method Long.toHexString() to convert the 
// result to a hex string when logging messages
if (nPC == main) {
	script.traceWrite("SUCCESS: Halted at correct location")
} else {
	script.traceWrite("FAIL: Expected halt at 0x" + Long.toHexString(main) + ", actually halted at 0x" + Long.toHexString(nPC))

	script.traceSetConsoleLevel(TraceLevel.INFO)
	script.traceWrite("TEST FAILED!")
	script.traceEnd()
	java.lang.System.exit(1);
}

// Run again.  Should halt at our breakpoint
debugSession.target.run()

//  Using an expression - get the current value of the PC
nPC = debugSession.expression.evaluate("PC")

// Verify we halted at the correct address.
if (nPC == address) {
	script.traceWrite("SUCCESS: Halted at correct location")
} else {
	script.traceWrite("FAIL: Expected halt at 0x" + Long.toHexString(address) + ", actually halted at 0x" + Long.toHexString(nPC))

	script.traceSetConsoleLevel(TraceLevel.INFO)
	script.traceWrite("TEST FAILED!")
	script.traceEnd()
	java.lang.System.exit(1);
}

// All done
debugSession.target.disconnect();
debugSession.terminate()
debugServer.stop()

script.traceSetConsoleLevel(TraceLevel.INFO)
script.traceWrite("TEST SUCCEEDED!")

// Stop logging and exit.
script.traceEnd()
