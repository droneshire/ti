// Example: 
// 1. Launches CCS GUI
// 2. Launches the debugger for the C64 simulator
// 3. Load a program
// 4. Terminates the debugger, CCS, etc.

// Import the DSS packages into our namespace to save on typing
importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.java.lang)

// Create our scripting environment object - which is the main entry point into any script and
// the factory for creating other Scriptable ervers and Sessions
var script = ScriptingEnvironment.instance()

script.traceBegin("CCSSession.xml", "DefaultStylesheet.xsl")

// Log everything
script.traceSetConsoleLevel(TraceLevel.ALL)
script.traceSetFileLevel(TraceLevel.ALL)

// Start up CCS
ccsServer = script.getServer("CCSServer.1")
ccsSession = ccsServer.openSession(".*")

// Start up the debugger; it will start up the session in CCS
debugServer = script.getServer("DebugServer.1")
debugServer.setConfig("../msp430f5529/msp430f5529.ccxml")
debugSession = debugServer.openSession(".*")

debugSession.target.connect();

// Load a program
script.setScriptTimeout(15000);
debugSession.memory.loadProgram("../msp430f5529/programs/modem.out")

// terminate the debugger
debugSession.terminate()
debugServer.stop()

// stop the Logging
script.traceSetConsoleLevel(TraceLevel.INFO)
script.traceWrite("TEST SUCCEEDED!")
script.traceEnd()

// Terminate CCS
debugSession.target.disconnect();
ccsSession.terminate()
ccsServer.stop()
