function performOperation()
{
	// use the following environment variables: testEnv.index, testEnv.arguments[index], testEnv.argLength,
	//   testEnv.scriptEnv, testEnv.debugServer and testEnv.debugSession
	errCode = 0;
	
	if ( testEnv.arguments[testEnv.index] == "-listOperations" )
	{
		try {
			// outputs the available operations for the current Flash target
			testEnv.debugSession.flash.listSupportedOperations();
			testEnv.index++;
			java.lang.System.out.println();
		} catch (ex) {
			errCode = getErrorCode(ex);
			testEnv.scriptEnv.traceWrite("> Error displaying supported operations.\n");
			
			return errCode;
		}
	} else {
		curMode = "start";
		multiLoadStarted = false;
		
		if ( testEnv.debugSession.getPartnum() == "ETHERNETTIVALM" )
		{
			// we cannot do multiload in the Ethernet case
			multiLoadStarted = true;
		}
		
		while ( testEnv.index < testEnv.argLength )
		{
			curParam = testEnv.arguments[testEnv.index];
			
			// the current parameter could be a mode (-operation, -program and -export), or the opCode/Path associated with the current mode
			if ( curParam == "-operation" )
			{	
				// set the mode to Operation Mode
				curMode = "operation";
				
				if ( multiLoadStarted )
				{
					testEnv.debugSession.flash.multiloadEnd();
					multiLoadStarted = false;
				}
			} else if ( curParam == "-program" ) {
				// set the mode to Program Mode
				curMode = "program";
				if ( !multiLoadStarted )
				{
					testEnv.debugSession.flash.multiloadStart();
					multiLoadStarted = true;
				}
			} else if ( curParam == "-programBin" ) {
				// set the mode to Program Binary Mode
				curMode = "programBin";
				
				if ( !multiLoadStarted )
				{
					testEnv.debugSession.flash.multiloadStart();
					multiLoadStarted = true;
				}
			} else if ( curParam == "-verify" ) {
				curMode = "verify";
				
				if ( multiLoadStarted )
				{
					testEnv.debugSession.flash.multiloadEnd();
					multiLoadStarted = false;
				}
			} else if ( curParam == "-verifyBin" ) {
				curMode = "verifyBin";
				
				if ( multiLoadStarted )
				{
					testEnv.debugSession.flash.multiloadEnd();
					multiLoadStarted = false;
				}
			} else if ( curParam == "-export" ) {
				curMode = "export";
				
				if ( multiLoadStarted )
				{
					testEnv.debugSession.flash.multiloadEnd();
					multiLoadStarted = false;
				}
			} else if ( curParam == "-exportMulti" ) {
				curMode = "exportMulti";
				
				if ( multiLoadStarted )
				{
					testEnv.debugSession.flash.multiloadEnd();
					multiLoadStarted = false;
				}
			} else if ( curParam == "-targetOp" ) {
				// set the mode to TargetOp Mode
				curMode = "targetOp";
				
				if ( multiLoadStarted )
				{
					testEnv.debugSession.flash.multiloadEnd();
					multiLoadStarted = false;
				}
			} else {
				// once the mode is determined, use the current argument(s) to determine how to handle the current mod
				if ( curMode == "operation" )
				{
					// execute Flash operations
					testEnv.scriptEnv.traceWrite("> Performing operation: " + curParam);
					
					try {
						if ( curParam == "CalculateChecksum" && testEnv.debugSession.getMajorISA() == 0x28 )
						{
							testEnv.debugSession.flash.calculateChecksum();
						} else {
							testEnv.debugSession.flash.performOperation(curParam);
						}
					} catch (ex) {
						errCode = getErrorCode(ex);
						testEnv.scriptEnv.traceWrite("> Command suspended due to errors in executing the given operation.\n");
						
						return errCode;
					}
					
					testEnv.scriptEnv.traceWrite("> Completed current operation.\n");
				} else if ( curMode == "program" ) {
					// load Flash programs
					testEnv.scriptEnv.traceWrite("> Loading Program: " + curParam);
					
					try {
						testEnv.debugSession.memory.loadProgram(curParam);
					} catch (ex) {
						errCode = getErrorCode(ex);
						testEnv.scriptEnv.traceWrite("> Command suspended due to errors in loading the program.\n");
						
						return errCode;
					}

					testEnv.scriptEnv.traceWrite("> Finish Loading.\n");
				} else if ( curMode == "programBin" ) {
					// load Flash programs
					testEnv.scriptEnv.traceWrite("> Loading Binary file: " + curParam);
					addressOffset = testEnv.arguments[testEnv.index+1];
					testEnv.index++;
					
					try {
						testEnv.debugSession.expression.evaluate("GEL_LoadBin(\""+curParam+"\", "+addressOffset+")");
					} catch (ex) {
						errCode = getErrorCode(ex);
						testEnv.scriptEnv.traceWrite("> Command suspended due to errors in loading the program.\n");
						
						return errCode;
					}

					testEnv.scriptEnv.traceWrite("> Finish Loading.\n");			
				} else if ( curMode == "verify" ) {
					// verify Flash programs
					testEnv.scriptEnv.traceWrite("> Verifying program on target: " + curParam);
					
					try {
						testEnv.debugSession.expression.evaluate("GEL_VerifyProgram(\""+curParam+"\")");
					} catch (ex) {
						errCode = getErrorCode(ex);
						testEnv.scriptEnv.traceWrite("> Command suspended due to errors in verifying the program.\n");
						
						return errCode;
					}

					testEnv.scriptEnv.traceWrite("> Verification Completed.\n");
				} else if ( curMode == "verifyBin" ) {
					// verify Flash programs
					testEnv.scriptEnv.traceWrite("> Verifying binary file on target: " + curParam);
					addressOffset = testEnv.arguments[testEnv.index+1];
					testEnv.index++;
					
					try {
						testEnv.debugSession.expression.evaluate("GEL_VerifyBinProgram(\""+curParam+"\", "+addressOffset+")");
					} catch (ex) {
						errCode = getErrorCode(ex);
						testEnv.scriptEnv.traceWrite("> Command suspended due to errors in verifying the program.\n");
						
						return errCode;
					}

					testEnv.scriptEnv.traceWrite("> Verification Completed.\n");
				} else if ( curMode == "export" ) {
					// export Flash memory to file
					exportType = curParam;
					exportStartAddr = testEnv.arguments[testEnv.index+1];
					exportLength = testEnv.arguments[testEnv.index+2];
					exportPath = testEnv.arguments[testEnv.index+3];
					testEnv.index+=3;
					
					testEnv.scriptEnv.traceWrite("> Exporting program to the following location: " + exportPath);
					
					if ( exportType == "COFF" )
					{
						// export COFF
						var addressArr = new Array();
						var lengthArr = new Array();
						
						addressArr[0] = exportStartAddr;
						lengthArr[0] = exportLength;
						
						testEnv.debugSession.memory.saveCoff( 0, addressArr, exportPath, lengthArr);
					} else if ( exportType == "BIN" )
					{
						// exporting binary (raw data)
						var typeSize = 8;
						if ( testEnv.debugSession.getMajorISA() == 0x28 ) { typeSize = 16; }	// 16-bit for C28
						
						testEnv.debugSession.memory.saveRaw(testEnv.debugSession.memory.getPage(1), exportStartAddr,exportPath,exportLength,typeSize,false);
					} else {
						testEnv.scriptEnv.traceWrite("> Warning: Unsupported File type specified; will use the default COFF format instead.\n");
					}
					
					testEnv.scriptEnv.traceWrite("> Export completed.\n");
				} else if ( curMode == "exportMulti" ) {
					// export multiple ranges to file (only supports COFF)
					numSections = curParam;
					var addressArr = new Array();
					var lengthArr = new Array();
					testEnv.index++;
					
					// fill up the array with the user input
					for ( var i = 0 ; i < numSections ; i++ )
					{
						addressArr[i] = testEnv.arguments[testEnv.index];
						lengthArr[i] = testEnv.arguments[testEnv.index+1];
						testEnv.index+=2;
					}
					// get the export path of the file
					exportPath = testEnv.arguments[testEnv.index];
					testEnv.index++;
					
					// call into DSS API to save the coff file
					testEnv.scriptEnv.traceWrite("> Exporting program with multiple ranges to the following location: " + exportPath);
					testEnv.debugSession.memory.saveCoff( 0, addressArr, exportPath, lengthArr);
					testEnv.scriptEnv.traceWrite("> Export completed.\n");
				} else if ( curMode == "targetOp" ) {
					if ( curParam == "reset" )
					{
						testEnv.debugSession.target.reset();
						testEnv.scriptEnv.traceWrite("> Reset issued.\n");
					} else if ( curParam == "restart" )
					{
						testEnv.debugSession.target.restart();
						testEnv.scriptEnv.traceWrite("> Restart issued.\n");
					} else if ( curParam == "run" )
					{
						testEnv.debugSession.target.runAsynch();
						testEnv.scriptEnv.traceWrite("> Running target.\n");
					} else if ( curParam == "runf" )
					{
						testEnv.debugSession.expression.evaluate("GEL_RunF()");
						testEnv.scriptEnv.traceWrite("> Free Running target.\n");
					}
				}
			}
			
			testEnv.index++;
		}
		
		if ( multiLoadStarted )
		{
			testEnv.debugSession.flash.multiloadEnd();
			multiLoadStarted = false;
		}
	}

	return errCode;
}