function getCore()
{
	// use the following environment variables: testEnv.index, testEnv.arguments[index], testEnv.argLength,
	//   testEnv.scriptEnv, testEnv.debugServer and testEnv.debugSession
	errCode = 0;
	
	// handle MSP430 firmware update
	testEnv.debugServer.setDefaultDialogResponse("Update");
	
	if ( testEnv.arguments[testEnv.index] == "-core" )
	{
		// extract the given core string and try to open a session using the string
		coreName = testEnv.arguments[testEnv.index+1];
		
		try
		{
			testEnv.debugSession = testEnv.debugServer.openSession(".*" + coreName + ".*");
			
			// special F2837x/F2847x case; logic involving determine if the partnum matches, and if the CPU name tells us it is CPU2
			if ( ((testEnv.debugSession.getPartnum().length() >= 12 && testEnv.debugSession.getPartnum().substr(0,11) == "TMS320F2837") || ( testEnv.debugSession.getPartnum().length() >= 6 && testEnv.debugSession.getPartnum().substr(0,5) == "F2837") || (testEnv.debugSession.getPartnum().length() >= 12 && testEnv.debugSession.getPartnum().substr(0,11) == "TMS320F2847") || ( testEnv.debugSession.getPartnum().length() >= 6 && testEnv.debugSession.getPartnum().substr(0,5) == "F2847")) && (testEnv.debugSession.getCPUName().indexOf("C28xx_CPU2") != -1))
			{
				testEnv.debugSession2 = testEnv.debugServer.openSession(".*C28xx_CPU1.*");
				testEnv.debugSession2.target.connect();	// leave CPU1 connected so we can use CPU2
			}
		}
		catch (ex)
		{
			errCode = getErrorCode(ex);
			testEnv.scriptEnv.traceWrite("> [Error]: Could not open session based on the given core name.");
		}
		
		testEnv.index+=2;
	} else if ( testEnv.arguments[testEnv.index] == "-listCores" )
	{
		testEnv.scriptEnv.traceWrite("Here is the list of avaiable cores for the current configuration:");
		var sessionArr = testEnv.debugServer.getListOfCPUs();
		
		for (var i = 0; i < sessionArr.length; ++i)
		{
			testEnv.scriptEnv.traceWrite(sessionArr[i]);
		}
		
		testEnv.index++;
		return 1;	// return 
	} else {
		// no core provided, get the default debugSession
		testEnv.scriptEnv.traceWrite("> Configuring the Flash Programmer with the given configuration ...\n");

		testEnv.debugSession = testEnv.debugServer.openSession("*", "*");		
	}
	
	if ( testEnv.debugSession != null )
	{
		testEnv.scriptEnv.traceWrite( "> Flash Manager is configured for the following part: " + testEnv.debugSession.getPartnum() + "\n");
	}
	
	testEnv.debugServer.unsetDefaultDialogResponse();
	
	return errCode;
}