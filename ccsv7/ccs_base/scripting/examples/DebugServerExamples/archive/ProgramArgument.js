// Import the DSS packages into our namespace to save on typing
importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.java.lang)

// Create our scripting environment object - which is the main entry point into any script and
// the factory for creating other Scriptable ervers and Sessions
var script = ScriptingEnvironment.instance()

// Create a log file in the current directory to log script execution
script.traceBegin("ProgramArgument.xml", "DefaultStylesheet.xsl")

// Log everything
script.traceSetConsoleLevel(TraceLevel.ALL)
script.traceSetFileLevel(TraceLevel.ALL)

// Get the Debug Server and start a Debug Session
debugServer = script.getServer("DebugServer.1")
debugServer.setConfig("../C64/tisim_c64xple.ccxml");
debugSession = debugServer.openSession(".*")

script.setScriptTimeout(15000);
// pass the arguments to the program
debugSession.memory.loadProgram("../C64/args/C64XPLE_Args.out",arguments)
// prints out all of the arguments passed to the program by running the program
debugSession.target.run()
debugServer.stop()

script.traceSetConsoleLevel(TraceLevel.INFO)
script.traceWrite("TEST SUCCEEDED!")

// Stop logging and exit.
script.traceEnd()
