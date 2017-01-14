importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.com.ti.dvt.engine.scripting)
importPackage(Packages.java.lang)
importPackage(Packages.java.io)
importPackage(Packages.java.util)

/*
 * This file contains an example for collecting EnergyTrace++ data from a MSP430FR5969 Launchpad
 * The example will export the profiler result to a CSV files locate in CWD (Current Working Directory).
 */

// ---------- Start up ----------
script = ScriptingEnvironment.instance();
//script.setScriptTimeout(240000);

// Create a log file in the current directory to log script execution
script.traceBegin("scriptLog.xml", "../../DefaultStylesheet.xsl");
script.traceSetConsoleLevel(TraceLevel.INFO);
script.traceSetFileLevel(TraceLevel.INFO);

script.traceWrite("EnergyTrace MSP430FR5969 Example");

// ---------- Set up debugger ----------
script.traceWrite("Launching debugger");
debugServer = script.getServer("DebugServer.1");
debugServer.setConfig("../../../MSP430/MSP430_FR59_69_le_emu__win32__(USB1).ccxml");
dsMSP430 = debugServer.openSession("TI MSP430 USB1_0/MSP430"); 

script.traceWrite("Connecting CPU");
dsMSP430.target.connect();

script.traceWrite("Loading program");
dsMSP430.memory.loadProgram("../../../MSP430/EnergyTrace_Lab_5.out");


// ---------- Create a DVT server ----------
dvtServer = script.getServer("DVTServer.1");

// ---------- Set up ET session ----------
script.traceWrite("Setting up EnergyTrace session");
etSession = dvtServer.openEnergyTraceSession();
script.traceWrite("Finished openEnergyTraceSession");

etSession.setEngineeringLevel(1);	// for keeping the raw data for export

etSession.setCaptureDuration(30);	// set capture time = 30seconds
etSession.setEnabled(true);	// start
Thread.sleep(1000);

script.traceWrite("Running target");
dsMSP430.target.runAsynch();

script.traceWrite("Processing");
// Data sampling started when CPU run
timedOut = etSession.waitCaptureDone(60)	// wait capture done or timeout in 60 sec.
if(timedOut) {
	// error: have not received enough data in the timeout period 
	script.traceWrite("Error: data collection timed out.");
}

script.traceWrite("Stopping target");
dsMSP430.target.halt();
Thread.sleep(1000);

script.traceWrite("End of data collection");

// ---------- Post analysis - export the data to a CSV or CSTCMD file ----------
cwd = script.getCurrentDirectory();
script.traceWrite("Exporting results to " + cwd);
// Export function profile summary data
etSession.exportFunctionProfileToCSV(cwd+"/"+"FunctionProfile.csv");
// Export full profile summary data
etSession.exportProfileToCSV(cwd+"/"+"Profile.csv");
// Export function profile based optimization file
etSession.getActivity().exportFunctionProfileToCSTCMD(null, cwd+"/"+"FunctionProfile.cstcmd", 0);
// Export raw data
// To allow exporting raw data, the sesion has to be set up with engineering level > 0.
// See above setting with:
//         etSession.setEngineeringLevel(1);
etSession.exportRawDataToCSV(cwd+"/"+"EnergyTraceRaw.csv");	

// ---------- shut down ----------
script.traceWrite("Shutting down");
etSession.setEnabled(false);
debugServer.stop();
dvtServer.stop();
script.traceEnd();
