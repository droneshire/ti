/**
 * @main.js - This script mimics Texas Instruments' load6x stand-alone
 * simulator base functionality but will work with any TI target (HW or
 * Simulator) that is supported by Debug Server Scripting.
 */

// Run loadti.
testEnv = {};
run();

/**
 * Send message to the console and log (if logging is enabled)
 * @param {String} The string to output to the console/log.
 */
function printTrace(string)
{
    if (!testEnv.quietMode)
	{
        dssScriptEnv.traceWrite(string);
    }
}

/**
 * Get error code from the given exception.
 * @param {exception} The exception from which to get the error code.
 */
function getErrorCode(exception)
{
	var ex2 = exception.javaException;
	if (ex2 instanceof Packages.com.ti.ccstudio.scripting.environment.ScriptingException) {
		return ex2.getErrorID();
	}
	return 0;
}

/**
 * This function is called to perform some clean up before exiting (or
 * aborting) the script. It assumes that the the scripting environment and
 * debug and profile servers have been created.
 */
function quit(retVal)
{

    if (isDebugSession)
	{
        // Close debug session.
        debugSession.terminate();
    }

    if (isDebugServer)
	{
		debugServer.stop();
    }

    date = new Date();
    printTrace("\nEND: " + date.toTimeString());

    if (testEnv.logFile != null)
	{
        // Close log.
		dssScriptEnv.traceEnd();
    }

    delete testEnv;

    // Terminate JVM and return main return value.
    java.lang.System.exit(retVal);
}

/*
 * Main function.
 */
function run()
{
    var inst;

    var errCode = 0;
    var retVal = 0;
    var date = 0;
    var defaultTimeout = -1;

    isDebugServer = false;
    isDebugSession = false;

    load(java.lang.System.getenv("LOADTI_PATH") + "/getArgs.js");

    getArgs();

    // Create base scripting environment.
    dssScriptEnv = Packages.com.ti.ccstudio.scripting.environment.ScriptingEnvironment.instance();

    // Set overall script timeout value.
    dssScriptEnv.setScriptTimeout(defaultTimeout);

    // Enable logging to a file if specified.
    if (testEnv.logFile != null)
    {
        // NOTE: Log output folder must already exist.
        try
		{
            dssScriptEnv.traceBegin(testEnv.logFile, java.lang.System.getenv("LOADTI_PATH").replace("\\", "/") +
					"/DefaultStylesheet.xsl");
            dssScriptEnv.traceSetFileLevel(Packages.com.ti.ccstudio.scripting.environment.TraceLevel.ALL);
        }
		catch (ex)
		{
			errCode = getErrorCode(ex);
            dssScriptEnv.traceWrite("Error code #" + errCode + ", failed to enable logging for " + testEnv.logFile +
					"\nLogging disabled!");
            testEnv.logFile = null;
        }
    }

    // Set console verbosity.
    if (testEnv.verboseMode)
	{
        dssScriptEnv.traceSetConsoleLevel(Packages.com.ti.ccstudio.scripting.environment.TraceLevel.ALL);
    }

    printTrace("\n***** DSS Generic Loader *****\n");

    date = new Date();
    printTrace("START: " + date.toTimeString() + "\n");

    // Configure the Debug Server.
    if (testEnv.setupCfgFile != null)
    {
        printTrace("Configuring Debug Server for specified target...");

        load(java.lang.System.getenv("LOADTI_PATH") + "/dsSetup.js");

        errCode = configureDebugServer(testEnv.setupCfgFile, dssScriptEnv);
        if (errCode != 0)
        {
            quit(errCode);
        }

        printTrace("Done");

		// There's no more to do if no outfiles have been provided.
		if (testEnv.outFiles == null)
		{
			quit(0);
		}
    }
	else
	{
        dssScriptEnv.traceWrite("No target setup configuration file specified. Aborting!");
        quit(1);
    }

    // Open Debug Server session.
    if (!isDebugServer)
    {
        debugServer = dssScriptEnv.getServer("DebugServer.1");
        isDebugServer = true;
    }

    debugSession = debugServer.openSession("*", "*");
    isDebugSession = true;

    //Set the default File IO folder
    debugSession.options.setString("FileIODefaultDirectory", testEnv.fileIOFolder);  

    printTrace("TARGET: " + debugSession.getBoardName());

    printTrace("Connecting to target...");

    // Connect to target. If target is simulator or already connected, a warning will be reported.
    try
	{
        debugSession.target.connect();
    }
	catch (ex)
	{
		errCode = getErrorCode(ex);
        dssScriptEnv.traceWrite("Error code #" + errCode + ", could not connect to target!\nAborting!");
        quit(errCode != 0 ? errCode : 1);
    }

    if (testEnv.resetTarget)
    {
        printTrace("Resetting target...");

        // Reset target.
        try
		{
            debugSession.target.reset();
        }
		catch (ex)
		{
			errCode = getErrorCode(ex);
            dssScriptEnv.traceWrite("Error code #" + errCode + ", could reset target!\nAborting!");
            quit(errCode != 0 ? errCode : 1);
        }
    }

	// Load and run each program provided.
	java.lang.System.out.println("testEnv.outFiles: " + testEnv.outFiles);
	var st = new java.util.StringTokenizer(testEnv.outFiles, "+");
	while (st.hasMoreTokens())
	{
		var outFile = st.nextToken();
	
		var filePath = new java.io.File(outFile);
		var outFileName = filePath.getName();
		testEnv.argvArgs[0] = outFileName;
	
		printTrace("Loading " + outFile);

	    // Load program and pass arguments to main (if applicable).
	    try
		{
			if (testEnv.initBss)
			{
				debugSession.memory.setBssInitValue(testEnv.initBssValue);
			}
			
			if (testEnv.argvArgs.length < 2)
			{
				debugSession.memory.loadProgram(outFile);
			}
			else
			{
				debugSession.memory.loadProgram(outFile, testEnv.argvArgs);
			}
	    }
		catch (ex)
		{
			errCode = getErrorCode(ex);
	        printTrace("Error code #" + errCode + ", " + outFile + " load failed!\nAborting!");
	        quit(errCode != 0 ? errCode : 1);
	    }

	    printTrace("Done");

	    load(java.lang.System.getenv("LOADTI_PATH") + "/memXfer.js");

	    // Load data from the host to target memory (if applicable).
	    if ((testEnv.loadRaw.length > 0) || (testEnv.loadDat.length > 0))
	    {
	        printTrace("Loading data to target memory...");

	        errCode = memLoad(dssScriptEnv, debugSession, testEnv.loadRaw, testEnv.loadDat);

	        if (errCode != 0)
	        {
	            printTrace("Memory load failed with errCode: " + errCode);
	        }
			else
			{
	            printTrace("Done");
	        }
	    }

	    if (!testEnv.onlyLoad)
	    {
	        printTrace("Target running...");

	        // Set script timeout value for run API.
	        dssScriptEnv.setScriptTimeout(testEnv.timeoutValue);

	        if (testEnv.cioFile != null)
	        {
	            // Begin CIO logging.
	            debugSession.beginCIOLogging(testEnv.cioFile);
	        }

	        // Run to end of program (or timeout) and return total cycles unless asynch run.
	        try
			{
				// Is the target already at the end of the program? If so, do not try to run again.
				// Note: we need to check the existance of the symbol first, since the evaluate function does not, and will return errors if the symbol does not exist, causing the script to exit
				// Note: This check is to fix the following use case: if the debugger is configured to Auto Run to a label after program load but that label is not hit then the loadti script may cause the program to enter an infinite loop.
				if ( ( debugSession.symbol.exists("C$$EXIT") && debugSession.expression.evaluate( "PC == C$$EXIT" ) ) ||
					 ( debugSession.symbol.exists("C$$EXITE") && debugSession.expression.evaluate( "PC == C$$EXITE") ) ||
					 ( debugSession.symbol.exists("abort") && debugSession.expression.evaluate( "PC == abort") ) ) 
				{
					printTrace( "Target failed to run to desired user label after program load, and is at end of program.  Script execution aborted." );
				} else {		
					// continue with running the program
					if (!testEnv.asyncRun)
					{
						printTrace("Interrupt to abort . . .");

						if (!testEnv.noProfile)
						{
							var cycles = debugSession.clock.runBenchmark();
						}
						else
						{
							debugSession.target.run();
						}
					}
					else
					{
						debugSession.target.runAsynch();
					}
				}
	        }
			catch (ex)
			{
				errCode = getErrorCode(ex);
	            if (errCode == 1001)
				{
	                printTrace(">> OVERALL TIMED OUT");
	                debugSession.target.halt();
	            }
				else
				{
	                dssScriptEnv.traceWrite("Error code #" + errCode +
							", error encountered during program execution!\nAborting!");
	                quit(errCode != 0 ? errCode : 1);
	            }
	        }

	        if (testEnv.cioFile != null && !testEnv.asyncRun)
	        {
	            // Stop CIO logging.
	            debugSession.endCIOLogging();
	        }

	        // Set script timeout value to default.
	        dssScriptEnv.setScriptTimeout(defaultTimeout);

	        if (!testEnv.asyncRun && !testEnv.noProfile)
	        {
	            // Print cycle counts unless script timout occurred on program execution.
	            if (errCode != 1001)
				{
	                printTrace("NORMAL COMPLETION: " + cycles + " cycles");
	            }
	        }
	    }

	    // Save data from target memory to a file on the host (if applicable).
	    if ((testEnv.saveRaw.length > 0) || (testEnv.saveDat.length > 0))
	    {
	        // Only dump data if it is not a asynchronous run.
	        if (!testEnv.asyncRun)
	        {
	            printTrace("Saving data to file...");

	            errCode = memSave(dssScriptEnv, debugSession, testEnv.saveRaw, testEnv.saveDat);

	            if (errCode != 0)
	            {
	                printTrace("Memory save failed with errCode: " + errCode);
					retVal = errCode;
	            }
				else
				{
	                printTrace("Done");
	            }
	        }
			else
			{
	            printTrace("Memory save options are not supported with an asynchronous run!");
	        }
	    }
	}
	
    // End automation.
    quit(retVal);
}
