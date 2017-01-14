importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.com.ti.dvt.engine.scripting)
importPackage(Packages.java.lang)
importPackage(Packages.java.io)
importPackage(Packages.java.util)

/*
 * This file contains an example for running Code Coverage Analysis on a TDF file
 * The example will export processed data to CSV files locate in CWD (Current Working Directory).
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

script.traceWrite("Code Coverage for TDF");

// ---------- Create a DVT server ----------
dvtServer = script.getServer("DVTServer.1");

// ---------- Open TDF file in the Trace Viewer ----------
script.traceWrite("Opening TDF file");
analysisSession = dvtServer.openAnalysisSession();

analysisConfig = analysisSession.loadAnalysis("Hardware Trace Analyzer/Open File");
analysisConfig.setProperty("tdfFilename", "../../../C66/lame/lame.tdf");
analysisConfig.setProperty("outFilename", "../../../C66/lame/lame.out");

analysisConfig.run();

//---------- Run analyzer on the opened TDF file data in the Trace Viewer ----------
script.traceWrite("Running Code Coverage Analyzer");
analyzer = analysisConfig.loadAnalyzer("Code Coverage", "Trace Viewer");
analyzer.run();

// ---------- Wait until processing is done  ----------
script.traceWrite("Processing");
analyzer.waitForEndOfData();

// ---------- Post analysis - export the data to a CSV file ----------
cwd = script.getCurrentDirectory();
script.traceWrite("Exporting results to " + cwd);
analyzer.exportDataToCSV("Line Coverage", cwd+"/"+"LineCoverageTDF.csv", null);
analyzer.exportDataToCSV("Function Coverage", cwd+"/"+"FunctionCoverageTDF.csv", null);

// ---------- shut down ----------
script.traceWrite("Shutting down");
analysisSession.endAnalysis(analysisConfig);
dvtServer.stop();
script.traceEnd();
