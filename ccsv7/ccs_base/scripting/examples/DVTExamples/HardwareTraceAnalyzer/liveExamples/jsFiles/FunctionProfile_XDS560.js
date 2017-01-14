importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.com.ti.dvt.engine.scripting)
importPackage(Packages.java.lang)
importPackage(Packages.java.io)
importPackage(Packages.java.util)

/*
 * This file contains an example for running Function Profile Analysis on a C6670 board over XDS560v2 Mezzanine
 * The example will export processed data to CSV files locate in CWD (Current Working Directory).
 *
 * See /ccs_base/scripting/docs/DVTAnalyzerScripting.htm for complete details on 
 * Hardware Trace Analyzer scripting 
 */

// ---------- Start up ----------
script = ScriptingEnvironment.instance();
script.setScriptTimeout(240000);

// Create a log file in the current directory to log script execution
script.traceBegin("scriptLog.xml", "../../DefaultStylesheet.xsl");
script.traceSetConsoleLevel(TraceLevel.INFO);
script.traceSetFileLevel(TraceLevel.INFO);

script.traceWrite("Starting Function Profile");

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

// ---------- Set up the analysis ----------
script.traceWrite("Setting up analysis session");
analysisSession = dvtServer.openAnalysisSession();

analysisConfig = analysisSession.loadAnalysis("Hardware Trace Analyzer/Function Profiling");
analysisConfig.setProperty("core", dsC66_0.getName());

analysisConfig.run();

//---------- Run target for 2 secs ----------
script.traceWrite("Running target");
dsC66_0.target.runAsynch();
Thread.sleep(2000);
dsC66_0.target.halt();

// ---------- Wait until processing is done  ----------
script.traceWrite("Processing");
analyzer = analysisConfig.findAnalyzerByName("Function Profiler");
analyzer.waitForEndOfData();


// ---------- Post analysis - export the data to a CSV file ----------
cwd = script.getCurrentDirectory();
script.traceWrite("Exporting results to " + cwd);
analyzer.exportDataToCSV("Summary", cwd+"/"+"FunctionProfileSummary.csv", null);

// ---------- shut down ----------
script.traceWrite("Shutting down");
analysisSession.endAnalysis(analysisConfig);
debugServer.stop();
dvtServer.stop();
script.traceEnd();
