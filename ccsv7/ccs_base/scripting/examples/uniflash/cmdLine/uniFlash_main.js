// Equivalent in effect to the Java declaration import java.io.*;
importPackage(java.io);
importPackage(java.lang);

// Run uniflash command line
testEnv = {};

// ability to switch out these files with custom ones to tailor the user experience
// for files after config file, you can also write code in the main() function to switch js files based on the current target/ISA

testEnv.helpFile = "uniFlash_help.js"
testEnv.utilityFile = "uniFlash_utility.js"
testEnv.configFile = "uniFlash_config.js"

testEnv.coreFile = "uniFlash_core.js"
testEnv.settingFile = "uniFlash_settings.js"
testEnv.operationFile = "uniFlash_operation.js"

// Note: as a general rule, you need to increment the argument counter if you consumed an argument in each of these scripts

main();

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
	if ( testEnv.connected )
	{
		// disconnect from the target
		testEnv.scriptEnv.traceWrite("> Disconnecting from target. \n" );
		
		testEnv.debugSession.target.disconnect();
	}
	
	if ( testEnv.debugSession != null )
	{
		// Close debug session.
		testEnv.debugSession.terminate();
	}
	
	if ( testEnv.debugSession2 != null )
	{
		testEnv.debugSession2.target.disconnect();
		testEnv.debugSession2.terminate();
	}
	
	if ( testEnv.isDebugServer != null )
	{
		// kill DebugServer
		debugServer.stop();
	}
	
	// close the opened files
	if ( testEnv.reader != null )
	{
		testEnv.reader.close();
	}
	
	if ( testEnv.writer != null )
	{
		testEnv.writer.close();
	}

	// calculate the operation (diff2) and total time (diff)
	testEnv.dEnd = new Date();
	testEnv.scriptEnv.traceWrite("<END: " + testEnv.dEnd.toTimeString() + ">\n");

	testEnv.diff = (testEnv.dEnd.getTime() - testEnv.dStart.getTime())/1000;
	
	if ( testEnv.diff2 != 0 ) 
	{
		testEnv.scriptEnv.traceWrite("<Operation Time: " + testEnv.diff2 + "s>");
	}
	
	testEnv.scriptEnv.traceWrite("<Total Time: " + testEnv.diff + "s>");
	delete testEnv;

	// Terminate JVM and return main return value.
	java.lang.System.exit(retVal);
}

// parse the user specified arguments and store them in the testEnv.arguments array
function parseArgs()
{
	var argCt = 0;
	var argvNum = 1;
	
	// Split arguments containing '=' into multiple arguments. This is needed because on Windows the arguments array
	// is already broken up in this manner (? at least according the loadTI command it is), but on Linux it is not.
	var args2 = [];
	for (var i = 0; i < testEnv.arguments.length; ++i)
	{
		if (testEnv.arguments[i].substring(0,4) == "NCO_")
		{
			testEnv.NCOperation = true;
		}
		
		splitArgs = testEnv.arguments[i].split("=");
		args2 = args2.concat(splitArgs);
	}
	testEnv.arguments = args2;
}

/**
 * Print command-line argument error along with correct usage and exit.
 */
function exitWithArgError(message)
{
	print("ERROR: " + message);
	print();

	printHelp();

	delete testEnv;
	java.lang.System.exit(1);
}

/**
 * Print help and exit.
 */
function exitWithHelp()
{
	printHelp();

	delete testEnv;
	java.lang.System.exit(0);
}

/*
 * Main function.
 */
function main()
{
	java.lang.System.out.println("\n***** Texas Instruments Universal Flash Programmer *****\n");
	
	// If no arguments were passed to the script, then print help and exit.
	if (this.arguments.length == 0 || this.arguments[0] == "-help")
	{
		load(java.lang.System.getenv("UNIFLASH_PATH") + testEnv.helpFile);
		exitWithHelp();
	}
	
	// Create base scripting environment.
	testEnv.scriptEnv = Packages.com.ti.ccstudio.scripting.environment.ScriptingEnvironment.instance();
	testEnv.debugServer = null;
	testEnv.debugSession = null;
	testEnv.debugSession2 = null;
	
	testEnv.diff = 0;
	testEnv.diff2 = 0;
	
	// storing the ARGV arguments off command line
	testEnv.arguments = this.arguments;
	testEnv.index = 0;
	var defaultTimeout = -1;
	
	testEnv.enabledLog = false;
	testEnv.setConfig = false;
	testEnv.setCore = false;
	testEnv.setOptions = false;
	testEnv.runOperation = false;
	testEnv.repeatMode = false;
	testEnv.reader = null;
	testEnv.writer = null;
	testEnv.NCOperation = false;
	
	// Get the arguments passed into the script, or if the [LOAD] option was used, get arugments from file
	parseArgs();
	testEnv.argLength = testEnv.arguments.length;

	// Set overall script timeout value.
	testEnv.scriptEnv.setScriptTimeout(defaultTimeout);
	
	// get the start time
	testEnv.dStart = new Date();
	testEnv.scriptEnv.traceWrite("<START: " + testEnv.dStart.toTimeString() + ">\n");
	
	// default setting for verbose mode = on
	testEnv.verboseMode = true;
	
	// Parse the [UTILITY] parameters and configure the command line tool with the given configuration
	if ( testEnv.index < testEnv.arguments.length )
	{
		load(java.lang.System.getenv("UNIFLASH_PATH") + testEnv.utilityFile);
		errCode = parseUtil();
		if (errCode != 0)
		{
			quit(errCode);
		}
	}
	
	if ( testEnv.repeatMode )
	{
		// create the input reader if we are in repeat mode
		testEnv.reader = new BufferedReader( new InputStreamReader(System['in']) );
	}
	
	if ( testEnv.statusOutputFile )
	{
		// create writer to write status output
		var file = new File(testEnv.statusOutputFile);
		
		if ( !file.exists() )
		{	// create the file if it doesn't exist
			file.createNewFile();
		}
		testEnv.writer = new BufferedWriter( new FileWriter(file) );
	}
	
	// Parse the [CONFIG] parameters and configure the DebugServer/FlashManager with the given configuration
	if ( testEnv.index < testEnv.arguments.length )
	{
		load(java.lang.System.getenv("UNIFLASH_PATH") + testEnv.configFile);
		errCode = config();
		if (errCode != 0)
		{
			quit(errCode);
		}
	}
	
	// Parse the optional [CORE] parameter to determine which core we are talking to in the current script
	if ( testEnv.index <= testEnv.arguments.length )
	{
		load(java.lang.System.getenv("UNIFLASH_PATH") + testEnv.coreFile);
		errCode = getCore();
		if (errCode != 0)
		{
			quit(errCode);
		}
	}

	// special case for MSP430
	if ( testEnv.debugSession.getFamily() == 430 )
	{
		testEnv.settingFile = "uniFlash_settings_msp.js"
		testEnv.operationFile = "uniFlash_operation_msp.js"
	}
	
	// now that we have the session, we can set the verbose option (if the option exists)
	if ( testEnv.debugSession.options.optionExist("FlashVerboseMode") ) 
	{	
		testEnv.debugSession.options.setBoolean("FlashVerboseMode",testEnv.verboseMode);
	}
	
	if ( testEnv.index < testEnv.arguments.length )
	{
		// by default, set the following options relating to the debugger
		testEnv.debugSession.options.setBoolean("AddCIOBreakpointAfterLoad", false);
		testEnv.debugSession.options.setString("VerifyAfterProgramLoad", "Full verification");
		testEnv.debugSession.options.setBoolean("AutoRunToLabelOnRestart", false);
		testEnv.debugSession.options.setBoolean("AddCEXITbreakpointAfterLoad", false);
		
		// Parse the [SETTINGS] parameter and set the appropriate Flash options
		load(java.lang.System.getenv("UNIFLASH_PATH") + testEnv.settingFile);
		errCode = setOptions();
		if (errCode != 0)
		{
			quit(errCode);
		}
	}
	
	// should connect to the target now
	if ( testEnv.index < testEnv.arguments.length )
	{
		if ( !testEnv.NCOperation )
		{
			testEnv.scriptEnv.traceWrite( "> Connecting to the target for Flash operations ... \n" );
			try {
				if ( (testEnv.debugSession.getPartnum().length() >= 4) && (testEnv.debugSession.getPartnum().substr(0,4) == "CC25") )
				{	// special case for CC25xx devices to support connecting to devices that are running
					testEnv.debugSession.target.connect(false);	// connect aysnc
					
					// if target is running after connecting, need to reset
					if ( !testEnv.debugSession.target.isHalted() )
					{
						// one second delay so that it 'finishes' connecting first
						java.lang.Thread.sleep(1000);
						
						// halt the target first
						testEnv.debugSession.target.halt();
						
						// rely on SystemReset as defined in the GEL to put core in a good state (need to update if the GEL file changes...)
						testEnv.debugSession.expression.evaluate("SystemReset()");
					}
					
					testEnv.connected = true;
					testEnv.scriptEnv.traceWrite( "> Connected.\n" );
				} else {
					testEnv.debugSession.target.connect();
					testEnv.connected = true;
					testEnv.scriptEnv.traceWrite( "> Connected.\n" );
				}
			} catch (ex) {
				errCode = getErrorCode(ex);
				testEnv.scriptEnv.traceWrite("> Error connecting to target.\n");
				
				if ( testEnv.statusOutputFile )
				{	// log fail status to file
					testEnv.writer.write(testEnv.failStr);
				}
				
				quit(errCode);
			}
		}
		
		// Parse the [OPERATION] 
		load(java.lang.System.getenv("UNIFLASH_PATH") + testEnv.operationFile);
		testEnv.dStart2 = new Date();
		
		var cachedIndex = testEnv.index;
		var sExecuteOperation = 1;	// always execute at least once
		
		while (sExecuteOperation) 
		{
			// re-connect to target if we disconnected
			if ( !testEnv.connected && !testEnv.NCOperation )
			{
				// disconnect from the target
				testEnv.scriptEnv.traceWrite("> (Re)connecting to the target. \n" );
				
				testEnv.debugSession.target.connect();
				testEnv.connected = true;
			}
			
			testEnv.dStart2 = new Date();
			errCode = performOperation();
			testEnv.dEnd2 = new Date();
			
			testEnv.diff2 += ((testEnv.dEnd2.getTime() - testEnv.dStart2.getTime())/1000);
			
			// error detected, quit out
			if ( errCode != 0 ) 
			{
				if ( testEnv.statusOutputFile )
				{	// log fail status to file
					testEnv.writer.write(testEnv.failStr);
				}
				break;
			} else {
				if ( testEnv.statusOutputFile )
				{	// log pass status to file
					testEnv.writer.write(testEnv.successStr);
				}
			}
			
			if ( testEnv.repeatMode )	// if repeat mode, wait for user input to see if we want to repeat the operation(s)
			{
				// disconnect from the target first so that users can switch out devices as needed
				if ( testEnv.connected )
				{
					// disconnect from the target
					testEnv.scriptEnv.traceWrite("> Disconnecting from target. \n" );
					
					testEnv.debugSession.target.disconnect();
					testEnv.connected = false;
				}
				
				// wait for input to see if we want to repeat operation
				testEnv.scriptEnv.traceWrite("> Press any key to rerun operation, 'exit' to stop script. \n");
				sExecuteOperation = testEnv.reader.readLine();
				testEnv.scriptEnv.traceWrite("> Input Detected. \n" );
				
				// exit code detected, quit out
				if ( sExecuteOperation == "exit" ) break;
				
				// return the index to previous value so that we can rerun the operations
				testEnv.index = cachedIndex;
			} else {
				sExecuteOperation = false;	// stop the loop
			}
		}
		
		testEnv.dEnd2 = new Date();
		if (errCode != 0)
		{
			quit(errCode);
		}
		testEnv.runOperation = true;
	}
	
	if ( testEnv.enabledLog )
	{
		testEnv.scriptEnv.traceEnd();
	}

	quit(0);
}
