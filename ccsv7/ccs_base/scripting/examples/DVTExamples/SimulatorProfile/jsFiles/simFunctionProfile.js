importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.com.ti.dvt.engine.scripting)
importPackage(Packages.java.lang)
importPackage(Packages.java.io)
importPackage(Packages.java.beans)
importPackage(Packages.java.util)

function Sleep(numberMillis) 
{
	var now = new Date();
	var exitTime = now.getTime() + numberMillis;
	while (true) 
	{
		now = new Date();
		if (now.getTime() > exitTime)
		return;
	}
}
 
	
script = ScriptingEnvironment.instance();
		
//The default timeout is 'infinite'.  Set ours to something shorter, one minute
script.setScriptTimeout(240000);
		
//Create a log file in the current directory to log script execution
script.traceBegin("scriptLog.xml", "../DefaultStylesheet.xsl");
script.traceSetConsoleLevel(TraceLevel.INFO);
script.traceSetFileLevel(TraceLevel.INFO);

script.traceWrite("Launching debugger");		
debugServer = script.getServer("DebugServer.1");
debugServer.setConfig("../../C64/tisim_c64xpcpube.ccxml");
debugSession = debugServer.openSession(".*");
	
//Get the DVT Server
script.traceWrite("Setting up Profiler");			
dvtServer = script.getServer("DVTServer.1");
profileAnalysisSession = dvtServer.openProfileAnalysisSession(debugSession, "FunctionProfile");
		
profileActivity = debugSession.profileSetup.getActivity("Profile all Functions for CPU Cycles");
profileActivity.setStatus(true);

script.traceWrite("Loading Program");
debugSession.memory.loadProgram("../../C64/interpreter/Debug/interpreter.out");
	
script.traceWrite("Running target");	
try
{
	debugSession.target.run();
}
catch(e)
{
	//Timeout expected.
}			

script.traceWrite("Halting target");		
debugSession.target.halt();
	
script.traceWrite("Waiting for Profiler to complete");
profileAnalysisSession.waitUntilProfilingComplete();


exports = profileAnalysisSession.exportData();
for (var i=0; i < exports.length; i++)
{
	var file = exports[i].save(exports[i].getName() + ".csv");
	script.traceWrite("Data exported to:" + file);	
	System.out.println("Data exported to: " + file);
}

//Disable Function Profiling.
script.traceWrite("Shutting Down");
profileActivity.setStatus(false);
profileAnalysisSession.terminate();
dvtServer.stop();
			
debugSession.terminate();
debugServer.stop();
			
script.traceEnd();
		
System.err.println("DVTScript Done!");		
System.exit(0);
