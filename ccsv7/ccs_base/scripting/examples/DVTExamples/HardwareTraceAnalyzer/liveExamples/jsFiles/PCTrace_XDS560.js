importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.com.ti.dvt.engine.scripting)
importPackage(Packages.java.lang)
importPackage(Packages.java.io)
importPackage(Packages.java.util)

/*
 * This file contains an example for collecting PC Trace data on a C6670 board over XDS560v2 Mezzanine Emulator
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

script.traceWrite("PC Trace C6670 Example");

// ---------- Set up debugger ----------
script.traceWrite("Launching debugger");
debugServer = script.getServer("DebugServer.1");
debugServer.setConfig("../../../C66/C6670_XDS560v2_Mezz.ccxml");
dsC66_0 = debugServer.openSession("Blackhawk XDS560v2-USB Mezzanine Emulator_0/C66xx_0"); 

script.traceWrite("Connecting CPU");
dsC66_0.target.connect();

script.traceWrite("Loading program");
dsC66_0.memory.loadProgram("../../../C66/lame/lame.out");

// ---------- Create a DVT server ----------
dvtServer = script.getServer("DVTServer.1");

// ---------- Set up the analysis for PC Trace using ----------
script.traceWrite("Setting up PC Trace");
analysisSession = dvtServer.openAnalysisSession();

analysisConfig = analysisSession.loadAnalysis("Hardware Trace Analyzer/PC Trace");
analysisConfig.setProperty("core", dsC66_0.getName());


analysisConfig.run();

//---------- Run target for 2 secs ----------
script.traceWrite("Running target");
dsC66_0.target.runAsynch();
Thread.sleep(2000);
dsC66_0.target.halt();

// ---------- Wait until processing is done  ----------
script.traceWrite("Processing");
dataProvider = analysisConfig.findDataProviderByName("Trace Viewer");
dataProvider.waitForEndOfData();


// ---------- Post analysis - export the data to a CSV file ----------
cwd = script.getCurrentDirectory();
script.traceWrite("Exporting results to " + cwd);
dataProvider.exportDataToCSV("Trace Viewer", cwd+"/"+"TraceLogs.csv", null);

// ---------- shut down ----------
script.traceWrite("Shutting down");
analysisSession.endAnalysis(analysisConfig);
debugServer.stop();
dvtServer.stop();
script.traceEnd();
