function config()
{
	// use the following environment variables: testEnv.index, testEnv.arguments[index] and testEnv.argLength,
	//   testEnv.scriptEnv, testEnv.debugServer and testEnv.debugSession
	errCode = 0;
	
	if ( testEnv.arguments[testEnv.index] == "-ccxml" )
	{
		testEnv.debugServer = testEnv.scriptEnv.getServer("DebugServer.1");
		
		curConfig = testEnv.arguments[testEnv.index+1];
        testEnv.debugServer.setConfig(curConfig);
		
		testEnv.index+=2;
	} else if ( testEnv.arguments[testEnv.index] == "-createConfig" ) 
	{
		testEnv.scriptEnv.traceWrite("> Generating the configuration based on the connection/device information ...\n");
		
		connection = testEnv.arguments[testEnv.index+1];
		device = testEnv.arguments[testEnv.index+2];
		
		// get the user specified fullpath, and extract the fileName and path from it
		fullPath = testEnv.arguments[testEnv.index+3];
		fileName = fullPath.replace(/^.*(\\|\/|\:)/, '');
		path = fullPath.substr(0,fullPath.length-fileName.length);
		
		// Create the DebugServer object and generate the configuration file
		testEnv.debugServer = testEnv.scriptEnv.getServer("DebugServer.1");
		configGenerator = testEnv.debugServer.createTargetConfigurationGenerator();
		configGenerator.setOutputDirectory(path);

		configGenerator.setConnection(connection);
		configGenerator.setDevice(device);
		
		try
		{
			configGenerator.createConfiguration(fileName);
		}
		catch (ex)
		{
			errCode = getErrorCode(ex);
			testEnv.scriptEnv.traceWrite("> [Error]: Could not create configuration from the given connection/device pair.");
		}
		
		testEnv.debugServer.setConfig(fullPath);
		testEnv.index+=4;
	}
	
	return errCode;
}
