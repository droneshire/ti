importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.com.ti.dvt.engine.scripting)
importPackage(Packages.java.lang)
importPackage(Packages.java.io)
importPackage(Packages.java.util)

// ---------- Start up ----------
script = ScriptingEnvironment.instance();

// Create a log file to log script execution

script.traceBegin("scriptLog.xml", "../../DefaultStylesheet.xsl");
script.traceSetConsoleLevel(TraceLevel.INFO);
script.traceSetFileLevel(TraceLevel.INFO);

script.traceWrite("SA Open File");

// ---------- Create a DVT server ----------
dvtServer = script.getServer("DVTServer.1");

// ---------- Open Bin File ----------
script.traceWrite("Opening bin file");

analysisSession = dvtServer.openAnalysisSession();

analysisConfig = analysisSession.loadAnalysis("System Analyzer/Open File/Open Binary File");

analysisConfig.setProperty("uiaDataFolder", "./myData");

analysisConfig.setProperty("uiaCfgFilename", "./myData/DefaultSession.usmxml");

analysisConfig.run();

analysisConfig.waitForEndOfData();

dataProvider = analysisConfig.findDataProviderByName("Binary File");

dataProvider.waitForEndOfData();


// ---Post analysis - export the data to a CSV file ----
cwd = script.getCurrentDirectory();
script.traceWrite("Exporting results to " + cwd);


dataProvider.exportDataToCSV("LogView", cwd+"/"+"exportedData.csv", null);

// ---------- shut down ----------
script.traceWrite("Shutting down");
analysisSession.endAnalysis(analysisConfig);
dvtServer.stop();
script.traceEnd();
