importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.com.ti.dvt.engine.scripting)
importPackage(Packages.java.lang)
importPackage(Packages.java.io)
importPackage(Packages.java.util)

/*
 * This file contains an example for running Code Coverage Analysis on a TDF file
 * It will also demonstrate how to merge data from multiple TDF
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
// could set any analyzer properties here if needed
analyzer.run();

// ---------- Wait until processing is done  ----------
script.traceWrite("Processing");
analyzer.waitForEndOfData();

// ---------- Post analysis - export the result from first TDF to a CSV file ----------
cwd = script.getCurrentDirectory();
script.traceWrite("Exporting results to " + cwd);
analyzer.exportDataToCSV("Line Coverage", cwd+"/"+"LineCoverageTDF.csv", null);
analyzer.exportDataToCSV("Function Coverage", cwd+"/"+"FunctionCoverageTDF.csv", null);

// Enable merging
script.traceWrite("Enabling merging");
analyzer.setProperty("merge", true);

// ---------- Open the same TDF again and merge the code coverage statistics into the exsiting ones
script.traceWrite("Opening the TDF file again");
analysisConfig.run();

// no need to run the analyzer explicitly again here - it will update automatically when the TDF file is opened

// ---------- Wait until processing is done  ----------
script.traceWrite("Processing and merging");
analyzer.waitForEndOfData();

// ---------- Post analysis - export the merged result to a CSV file ----------
cwd = script.getCurrentDirectory();
script.traceWrite("Exporting results to " + cwd);
analyzer.exportDataToCSV("Line Coverage", cwd+"/"+"LineCoverageTDF_Merged.csv", null);
analyzer.exportDataToCSV("Function Coverage", cwd+"/"+"FunctionCoverageTDF_Merged.csv", null);

// ---------- shut down ----------
script.traceWrite("Shutting down");
analysisSession.endAnalysis(analysisConfig);
dvtServer.stop();
script.traceEnd();
