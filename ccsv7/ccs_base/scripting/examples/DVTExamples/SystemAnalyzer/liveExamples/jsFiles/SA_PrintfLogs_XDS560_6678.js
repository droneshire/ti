importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.com.ti.dvt.engine.scripting)
importPackage(Packages.java.lang)
importPackage(Packages.java.io)
importPackage(Packages.java.util)

/*
 * This file contains an example for collecting PC Trace data on a C6678 board over XDS560v2 Mezzanine Emulator
 * The example will export the logs to a CSV files locate in CWD (Current Working Directory).
 *
 * See /ccs_base/scripting/docs/DVTAnalyzerScripting.htm for complete details on 
 * Hardware Trace Analyzer scripting 
 */

// ---------- Start up ----------
script = ScriptingEnvironment.instance();
//script.setScriptTimeout(240000);

// Create a log file in the current directory to log script execution
script.traceBegin("scriptLog.xml", "../../DefaultStylesheet.xsl");
script.traceSetConsoleLevel(TraceLevel.INFO);
script.traceSetFileLevel(TraceLevel.INFO);

script.traceWrite("PC Trace C6678 Example");

// ---------- Set up debugger ----------
script.traceWrite("Launching debugger");
debugServer = script.getServer("DebugServer.1");
debugServer.setConfig("../../../C66/TMS320_66_78_le_emu_560v2__win32.ccxml");
dsC66_0 = debugServer.openSession("Blackhawk XDS560v2-USB Mezzanine Emulator_0/C66xx_0"); 

script.traceWrite("Connecting CPU");
dsC66_0.target.connect();

script.traceWrite("Loading program");
dsC66_0.memory.loadProgram("../../../C66/Stairstep_JTAGstop/Debug/Stairstep_JTAGstop.out");


// ---------- Create a DVT server ----------
dvtServer = script.getServer("DVTServer.1");

// ---------- Set up the analysis for PC Trace using ----------
script.traceWrite("Setting up SA Printf and Error Logs");
analysisSession = dvtServer.openAnalysisSession();
script.traceWrite("Finished openAnalysisSession");

analysisConfig = analysisSession.loadAnalysis("RTOS Analyzer/Printf and Error Logs");
script.traceWrite("Finished loadAnalysis");

Thread.sleep(10000);

analysisConfig.run();

script.traceWrite("Running target");
Thread.sleep(10000);

script.traceWrite("Running target2");
dsC66_0.target.runAsynch();
Thread.sleep(10000);
dsC66_0.target.halt();

dataProvider = analysisConfig.findDataProviderByName("Live Session");

if(dataProvider != null){
	//Should we stop the DP?
	//script.traceWrite("Stop DP");
}


// ---------- Wait until processing is done  ----------
script.traceWrite("Processing");
Thread.sleep(10000);
//dataProvider = analysisConfig.findDataProviderByName("Trace Viewer");
dataProvider = analysisConfig.findDataProviderByName("Live Session");
//dataProvider.waitForEndOfData();

script.traceWrite("End of Data");

// ---------- Post analysis - export the data to a CSV file ----------
cwd = script.getCurrentDirectory();
if(dataProvider == null){
	script.traceWrite("Could not find Data Provider");
}
else{
	script.traceWrite("Exporting results to " + cwd);
	//dataProvider.exportDataToCSV("Live Session", cwd+"/"+"SALogs.csv", null);
	dataProvider.exportDataToCSV("LogView", cwd+"/"+"SALogs.csv", "Type,Time,Error");
}

// ---------- shut down ----------
script.traceWrite("Shutting down");
analysisSession.endAnalysis(analysisConfig);
script.traceWrite("after endAnalysis");
debugServer.stop();
dvtServer.stop();
script.traceEnd();
