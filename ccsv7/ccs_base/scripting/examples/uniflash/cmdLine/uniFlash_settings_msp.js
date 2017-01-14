function setOptions()
{
	// use the following environment variables: testEnv.index, testEnv.arguments[index], testEnv.argLength,
	// testEnv.scriptEnv, testEnv.debugServer and testEnv.debugSession
	errCode = 0;
	
	if ( testEnv.arguments[testEnv.index] == "-viewOptions" )
	{
		// display Flash options to console
		testEnv.scriptEnv.traceWrite("> Displaying the available Flash options to configure: ");
		
		testEnv.debugSession.options.printOptionById("MSP430PropertiesNode");
		testEnv.debugSession.options.printOptionById("VerifyAfterProgramLoad");
		
		testEnv.index++;
	} else if ( testEnv.arguments[testEnv.index] == "-loadSettings" )
	{
		// load settings based on the given session file (generated from uniFlash GUI)
		sessionPath = testEnv.arguments[testEnv.index+1];
		
		testEnv.scriptEnv.traceWrite("> Loading settings from the given session file ... \n");
		
		try
		{
			// call DSS API to load session settigns
			testEnv.debugSession.flash.options.loadSessionSettings(sessionPath);
			testEnv.scriptEnv.traceWrite("> Settings loaded. \n");
		} catch (ex) {
			errCode = getErrorCode(ex);
			testEnv.scriptEnv.traceWrite("> [Error]: Could not set value of options. Operation cancelled. \n");
			return errCode;
		}

		testEnv.index+=2;
	} else if ( testEnv.arguments[testEnv.index] == "-setOptions" )
	{
		// individually set options based on ID/value pairs
		testEnv.index++;
		testEnv.scriptEnv.traceWrite("> Setting up the user Flash Options ... \n");
		
		while ( testEnv.index < testEnv.argLength && testEnv.arguments[testEnv.index].substring(0,1) != "-"  )
		{
			id = testEnv.arguments[testEnv.index];
			value = testEnv.arguments[testEnv.index+1];
			
			valueType = testEnv.debugSession.options.getValueType(id);
			
			// determine the type of property and switch to call appropriate APIs
			if ( valueType == "boolean" )
			{
				try
				{
					boolVal = true;
					if ( value == "false" || value == "0" )
					{
						boolVal = false;
					}
					testEnv.debugSession.options.setBoolean(id, boolVal);
				} catch (ex) {
					errCode = getErrorCode(ex);
					testEnv.scriptEnv.traceWrite("> [Error]: could not set value of option.");
					return errCode;
				}
			} else if ( valueType == "numeric" )
			{
				try
				{
					intVal= Number(value)
					testEnv.debugSession.options.setNumeric(id, intVal);
				} catch (ex) {
					errCode = getErrorCode(ex);
					testEnv.scriptEnv.traceWrite("> [Error]: could not set value of option.");
					return errCode;
				}
			} else if ( valueType == "string" )
			{
				try
				{
					testEnv.debugSession.options.setString(id, value);
				} catch (ex) {
					errCode = getErrorCode(ex);
					testEnv.scriptEnv.traceWrite("> [Error]: could not set value of option.");
					return errCode;
				}
			} else {
				testEnv.scriptEnv.traceWrite("> [Warning]: Property " + id + " was not found. \n");
			}
			testEnv.index+=2;
		}
	}
	
	return errCode;
}
