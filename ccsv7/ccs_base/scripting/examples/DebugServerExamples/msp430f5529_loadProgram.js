// Import the DSS packages into our namespace to save on typing
importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.java.lang)

// Configurable Parameters
var deviceCCXMLFile = "../msp430f5529/msp430f5529.ccxml";
var programToLoad = "../msp430f5529/programs/modem.out";

// Create our scripting environment object - which is the main entry point into any script and
// the factory for creating other Scriptable ervers and Sessions
var script = ScriptingEnvironment.instance();

// Create a debug server
var debugServer = script.getServer( "DebugServer.1" );

// Set the device ccxml 
debugServer.setConfig( deviceCCXMLFile );

// Open a debug session
debugSession = debugServer.openSession( ".*" );

// Connect to the target
debugSession.target.connect();

// Load the program 
debugSession.memory.loadProgram( programToLoad );

// Run the program
debugSession.target.runAsynch();

// Disconnect from the target
debugSession.target.disconnect();

debugSession.terminate();
debugServer.stop();
