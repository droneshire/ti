function parseUtil()
{
	// use the following environment variables: testEnv.index, testEnv.arguments[index] and testEnv.argLength,
	//   testEnv.scriptEnv, testEnv.debugServer and testEnv.debugSession
	errCode = 0;
	
	while ( testEnv.arguments[testEnv.index] != "-ccxml" && 
			testEnv.arguments[testEnv.index] != "-createConfig" &&
			testEnv.index < testEnv.arguments.length )
	{
		// parse the (optional) -log parameter
		if ( testEnv.arguments[testEnv.index] == "-log" )
		{
			testEnv.index++;
			// NOTE: Log output folder must already exist.
			try
			{
				testEnv.scriptEnv.traceBegin(testEnv.arguments[testEnv.index], java.lang.System.getenv("UNIFLASH_PATH").replace("\\", "/") + "../stylesheet/DefaultStylesheet.xsl");
				testEnv.scriptEnv.traceSetFileLevel(Packages.com.ti.ccstudio.scripting.environment.TraceLevel.ALL);
				testEnv.enabledLog = true;
				
				testEnv.index++;
			}
			catch (ex)
			{
				errCode = getErrorCode(ex);
				testEnv.scriptEnv.traceWrite("> Error code #" + errCode + ", failed to enable logging for " + testEnv.arguments[testEnv.index] + "\nLogging disabled!");
				testEnv.logFile = null;
			}
		} else if ( testEnv.arguments[testEnv.index] == "-verbose" )	// parse the (optional) -verbose parameter
		{
			if ( testEnv.arguments[testEnv.index+1] == 1 )
			{
				testEnv.verboseMode = true;
			} else if  ( testEnv.arguments[testEnv.index+1] == 0 )
			{
				testEnv.verboseMode = false;
			}
			testEnv.index+=2;
		} else if ( testEnv.arguments[testEnv.index] == "-mode" )	// parse the (optional) -mode parameter
		{
			if ( testEnv.arguments[testEnv.index+1] == "repeat" )
			{
				testEnv.repeatMode = true;
				testEnv.scriptEnv.traceWrite("> Repeat mode active. \n");
			}
			
			testEnv.index+=2;
		} else if ( testEnv.arguments[testEnv.index] == "-programStatusOutput" )	// parse the (optional) -programStatusOutput parameter
		{
			testEnv.statusOutputFile = testEnv.arguments[testEnv.index+1];
			testEnv.successStr = testEnv.arguments[testEnv.index+2];
			testEnv.failStr = testEnv.arguments[testEnv.index+3];
			
			testEnv.index+=4;
		} else {
			testEnv.index++;
		}
	}
	
	return errCode;
}
