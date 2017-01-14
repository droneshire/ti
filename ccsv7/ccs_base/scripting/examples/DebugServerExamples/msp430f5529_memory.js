// Import the DSS packages into our namespace to save on typing
importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.java.lang)

// Create our scripting environment object - which is the main entry point into any script and
// the factory for creating other Scriptable ervers and Sessions
var script = ScriptingEnvironment.instance()

// Create a log file in the current directory to log script execution
script.traceBegin("MemoryTestLog.xml", "DefaultStylesheet.xsl")

// Log everything
script.traceSetConsoleLevel(TraceLevel.ALL)
script.traceSetFileLevel(TraceLevel.ALL)

// Get the Debug Server and start a Debug Session
debugServer = script.getServer("DebugServer.1")
debugServer.setConfig("../msp430f5529/msp430f5529.ccxml");
debugSession = debugServer.openSession(".*")

debugSession.target.connect();

// Change timeout from the default (infinite) to 15 seconds
script.setScriptTimeout(15000);

// Load a program
// (ScriptingEnvironment has a concept of a working folder and for all of the APIs which take
// path names as arguments you can either pass a relative path or an absolute path)
debugSession.memory.loadProgram("../msp430f5529/programs/modem.out")

// The "Modem" example uses a hard coded array called "sineTable" 
// Get the address of that symbol
var address = debugSession.symbol.getAddress("sineTable")

// Restart, and go to main. If the target is configured to go to main on restart, then restarting
// should be sufficient. Otherwise we will need to also set a breakpoint at main and run to it.
debugSession.target.restart()
var addressMain = debugSession.symbol.getAddress("main")
if (debugSession.memory.readRegister("PC") != addressMain)
{
	var bp = debugSession.breakpoint.add(addressMain)
	debugSession.target.run()
}

// Read 128, 16-bit values beginning at that location (on page DATA) in memory into an array
var data = debugSession.memory.readData(Memory.Page.PROGRAM, address, 16, 128, false)

var x
for (x in data)
{
	script.traceWrite("data[" + x + "]=0x" + Long.toHexString(data[x]))
}

// All done
debugSession.target.disconnect();
debugServer.stop()

script.traceSetConsoleLevel(TraceLevel.INFO)
script.traceWrite("TEST SUCCEEDED!")

// Stop logging and exit.
script.traceEnd()
