importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.com.ti.dvt.engine.scripting)
importPackage(Packages.java.lang)
importPackage(Packages.java.io)
importPackage(Packages.java.util)

/*
 * This file contains an example for running Code Coverage Analysis on a C6670 board over XDSPRO
 * It enables the Merge option for Code Coverage and merge data from 2 runs.
 *
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

script.traceWrite("Starting Code Coverage");

// ---------- Set up debugger ----------
script.traceWrite("Launching debugger");
debugServer = script.getServer("DebugServer.1");
debugServer.setConfig("../../../C66/C6670 XDSPRO USB.ccxml");
dsC66_0 = debugServer.openSession("Spectrum Digital XDSPRO USB Emulator_0/C66xx_0"); 

script.traceWrite("Connecting CPU");
dsC66_0.target.connect();

script.traceWrite("Loading program");
dsC66_0.memory.loadProgram("../../../C66/lame/lame.out");

// ---------- Create a DVT server ----------
dvtServer = script.getServer("DVTServer.1");

// ---------- Set up the analysis ----------
script.traceWrite("Setting up Code Coverage Analysis with merging");
analysisSession = dvtServer.openAnalysisSession();

analysisConfig = analysisSession.loadAnalysis("Hardware Trace Analyzer/Code Coverage");
analysisConfig.setProperty("core", dsC66_0.getName());
analysisConfig.setProperty("transportType", "Pro Trace");
analysisConfig.setProperty("bufferSize", "64 kB");
analysisConfig.setProperty("merge", true);

analysisConfig.run();

//---------- Run target for 2 secs ----------
script.traceWrite("Running target");
dsC66_0.target.runAsynch();
Thread.sleep(2000);
dsC66_0.target.halt();

// ---------- Wait until processing is done  ----------
script.traceWrite("Processing");
analyzer = analysisConfig.findAnalyzerByName("Code Coverage");
analyzer.waitForEndOfData();

//---------- Post analysis - export the result from first run to a CSV file ----------
cwd = script.getCurrentDirectory();
script.traceWrite("Exporting results to " + cwd);
analyzer.exportDataToCSV("Line Coverage", cwd+"/"+"LineCoverageLive.csv", null);
analyzer.exportDataToCSV("Function Coverage", cwd+"/"+"FunctionCoverageLive.csv", null);

//---------- Again run target for 2 secs ----------
script.traceWrite("Running target again");
dsC66_0.target.restart();
dsC66_0.target.runAsynch();
Thread.sleep(2000);
dsC66_0.target.halt();

// ---------- Wait until processing is done  ----------
script.traceWrite("Processing (merging with existing code coverage statistics)");
analyzer.waitForEndOfData();

// ---------- Post analysis - export merged result to a CSV file ----------
cwd = script.getCurrentDirectory();
script.traceWrite("Exporting results to " + cwd);
analyzer.exportDataToCSV("Line Coverage", cwd+"/"+"LineCoverageLive_Merged.csv", null);
analyzer.exportDataToCSV("Function Coverage", cwd+"/"+"FunctionCoverageLive_Merged.csv", null);

// ---------- shut down ----------
script.traceWrite("Shutting down");
analysisSession.endAnalysis(analysisConfig);
debugServer.stop();
dvtServer.stop();
script.traceEnd();
