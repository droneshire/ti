// Import the DSS packages into our namespace to save on typing
importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.java.lang)
importPackage(Packages.com.ti.ctoolstrace.scripting)

var ARG_SETUPFILE = "-setupfile"
var ARG_TARGETNAME = "-targetname"
var ARG_CHANNELSETUPFILE = "-channelfile"
var ARG_STMNAME = "-stmname"
var ARG_ETBNAME = "-etbname"
var ARG_RECEIVERNAME = "-receiver"
var ARG_TRIGGER = "-triggerfile"
var ARG_OUTFILE = "-outfile"
var ARG_APPLICATION = "-app"


// Create our scripting environment object - which is the main entry point into any script and
// the factory for creating other Scriptable ervers and Sessions
var script = ScriptingEnvironment.instance();

// Create a log file in the current directory to log script execution
script.traceBegin("Faraday_ETB_Test.xml", "DefaultStylesheet.xsl")

script.traceSetConsoleLevel(TraceLevel.INFO)
script.traceWrite("\nBeginning of Faraday_ETB_Test..............")


// Set our TimeOut
script.setScriptTimeout(90000)

var idleThread = new java.lang.Thread();

var teststring = ""
var arglist = []
for (var i=0; i<arguments.length; i+=2)
{
	arglist[arguments[i]] = arguments[i+1]
}

// This is an optional operation to print out all the input parameters
for (i in arglist)
{
    script.traceWrite(i+ " = "+ arglist[i])
}

// Make sure all expected parameters are passed in as arguments
if ((arglist[ARG_SETUPFILE] == undefined)||(arglist[ARG_TARGETNAME] == undefined) || 
	(arglist[ARG_CHANNELSETUPFILE] == undefined) || (arglist[ARG_RECEIVERNAME] == undefined) ||
	(arglist[ARG_TRIGGER] == undefined) || (arglist[ARG_OUTFILE] == undefined) || 
	(arglist[ARG_APPLICATION] == undefined) || (arglist[ARG_ETBNAME] == undefined) ||
	(arglist[ARG_STMNAME] == undefined))
{
	script.traceWrite("usage: youscript.js " + ARG_SETUPFILE + " ccssetup_file_name.ccxml " +ARG_TARGETNAME + " trace_target_name " +
					  ARG_CHANNELSETUPFILE + " channel_setup_file_name.xml " + ARG_RECEIVERNAME + " receiver_name " + 
					  ARG_TRIGGER + " trigger_file.xml " + ARG_OUTFILE + " outfile_name.extension " + 
					  ARG_APPLICATION + " application.out " + ARG_ETBNAME + "EtbNodeName" + ARG_STMNAME +"StmNodeName")
					  
	if (arglist[ARG_SETUPFILE] == undefined)
	{
		script.traceWrite("argument " + ARG_SETUPFILE + " is not passed in")
	}
	if (arglist[ARG_TARGETNAME] == undefined)
	{
		script.traceWrite("argument " + ARG_TARGETNAME + " is not passed in")
	}
	if (arglist[ARG_CHANNELSETUPFILE] == undefined)
	{
		script.traceWrite("argument " + ARG_CHANNELSETUPFILE + " is not passed in")
	}
	if (arglist[ARG_RECEIVERNAME] == undefined)
	{
		script.traceWrite("argument " + ARG_RECEIVERNAME + " is not passed in")
	}
	if (arglist[ARG_TRIGGER] == undefined)
	{
		script.traceWrite("argument " + ARG_TRIGGER + " is not passed in")
	}
	if (arglist[ARG_OUTFILE] == undefined)
	{
		script.traceWrite("argument " + ARG_OUTFILE + " is not passed in")
	}	
	if (arglist[ARG_APPLICATION] == undefined)
	{
		script.traceWrite("argument " + ARG_APPLICATION + " is not passed in")
	}
	if (arglist[ARG_ETBNAME] == undefined)
	{
		script.traceWrite("argument " + ARG_ETBNAME + " is not passed in")
	}
	if (arglist[ARG_STMNAME] == undefined)
	{
		script.traceWrite("argument " + ARG_STMNAME + " is not passed in")
	}
	script.traceEnd()
	java.lang.System.exit(1);
}
script.traceSetConsoleLevel(TraceLevel.OFF)  //Do not output anything to console
script.traceSetFileLevel(TraceLevel.FINER)   //Log FINER and above (which includes method entry and exit
                                             //All error message still get logged to stderr


// Get the Debug Server and start a Debug Session
debugServer = script.getServer("DebugServer.1");
debugServer.setConfig(arglist[ARG_SETUPFILE]);
debugSessionCortexA9 = debugServer.openSession(arglist[ARG_TARGETNAME]);
debugSessionETB = debugServer.openSession(arglist[ARG_ETBNAME]);
debugSessionSTM = debugServer.openSession(arglist[ARG_STMNAME]);

// Connect to trace processor
debugSessionCortexA9.target.connect()
// Connect to etb
debugSessionETB.target.connect()
// Connect to stm
debugSessionSTM.target.connect()

if (debugSessionCortexA9.target.isConnected() && debugSessionETB.target.isConnected() && debugSessionSTM.target.isConnected())
{
    // Load a program
    // (ScriptingEnvironment has a concept of a working folder and for all of the APIs which take
    // path names as arguments you can either pass a relative path or an absolute path)
    var value = debugSessionCortexA9.options.getBoolean("AutoRunToLabelOnRestart")
    debugSessionCortexA9.options.setBoolean("AutoRunToLabelOnRestart", false)
    debugSessionCortexA9.memory.loadProgram(arglist[ARG_APPLICATION])
    
    // Create a ctool trace server.
    var ts = new CToolsTraceServer();
    // Initialize the newly create trace server object
    ts.initialize();
    
    //create a string array with size of 10
    var receiverNames = java.lang.reflect.Array.newInstance(java.lang.String, 10);
    
    //This is an example of how to use getAvaiableReceivers() API. It doesn't affect
    //the execution of the script.
    receiverNames = ts.getAvaiableReceivers();
    script.traceSetConsoleLevel(TraceLevel.INFO)
    for (var i=0; i<receiverNames.length; i++)
    {
        script.traceWrite("Avaiable Receiver "+ i + ": " + receiverNames[i]);       
    }
    
    script.traceWrite("\nSelect Receiver : " + arglist[ARG_RECEIVERNAME]+ "\n");
    script.traceSetConsoleLevel(TraceLevel.OFF)
    // Create a channel. The argument should be 560T/560v2 or ETB
    traceChannel = ts.createChannel(arglist[ARG_RECEIVERNAME]);	    
    
    // Add a trace target. The API expects a string array. So we first create
    // a string array and assign the target name as the first element in the arrary
    stringArray = java.lang.reflect.Array.newInstance(java.lang.String, 1)
    stringArray[0] = new java.lang.String(arglist[ARG_STMNAME]);
    
    // Add trace targets to channel channel object
	traceChannel.addTraceTargets(stringArray);
	
	// Setup trace channel, prepare for trace	
	traceChannel.setupTraceChannel(arglist[ARG_CHANNELSETUPFILE])
	
	// Load a trigger job file. This is to setup what to trace	
	//debugSessionCortexA9.breakpoint.loadConfig(arglist[ARG_TRIGGER])
	
	// Get channel receiver status. Make sure channel is in recording stage that
	// is ready to trace data
    channelStatus = traceChannel.getStatus();
    script.traceSetConsoleLevel(TraceLevel.INFO)
    script.traceWrite("Channel Status : "+ channelStatus.description());
    script.traceSetConsoleLevel(TraceLevel.OFF)

	// Just make sure the channel is enabled and ready to be used
    if (!channelStatus.isEnabled()){
        script.traceWrite("FAIL: Trace Receiver is not enabled after call setupTraceChannel("+channelConfigFileName+")");
        script.traceSetConsoleLevel(TraceLevel.INFO)
        script.traceWrite("TEST FAILED!")
        script.traceEnd()
        java.lang.System.exit(1);
    }
    
}
else
{
	script.traceSetConsoleLevel(TraceLevel.INFO)
	if (!debugSessionCortexA9.target.isConnected())
	{
		script.traceWrite("FAIL: Cannot connect to " + arglist[ARG_TARGETNAME])			
	}
	if (!debugSessionETB.target.isConnected())
	{
		script.traceWrite("FAIL: Cannot connect to " + arglist[ARG_ETBNAME])	
	}
	if (!debugSessionSTM.target.isConnected())
	{
		script.traceWrite("FAIL: Cannot connect to " + arglist[ARG_STMNAME])			
	}
	script.traceWrite("TEST FAILED!")
	script.traceEnd()
	java.lang.System.exit(1);
}
// Everything is setup and ready to trace data. Now run the problem. The result will be saved to ETB
debugSessionCortexA9.target.run();

script.traceWrite("Running Target. Waiting for target to halt.")
script.traceSetConsoleLevel(TraceLevel.INFO)

// Make sure the target is halted
while (debugSessionCortexA9.target.isHalted() == false){}

var channelStatus = traceChannel.getStatus();

if (channelStatus.isRecordingStopped())
{
    //Target is halted. we can collect data now. This API will get a
    //raw binary data file
    traceChannel.getTextTraceData(arglist[ARG_OUTFILE]);
}

// All done
debugSessionCortexA9.terminate()
debugServer.stop()

script.traceSetConsoleLevel(TraceLevel.INFO)
script.traceWrite("TEST SUCCEEDED!")

// Stop logging and exit.
script.traceEnd()
java.lang.System.exit(0);
