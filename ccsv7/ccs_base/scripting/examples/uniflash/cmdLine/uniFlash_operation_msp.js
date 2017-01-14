function performOperation()
{
	// use the following environment variables: testEnv.index, testEnv.arguments[index], testEnv.argLength,
	//   testEnv.scriptEnv, testEnv.debugServer and testEnv.debugSession
	errCode = 0;
	
	if ( testEnv.arguments[testEnv.index] == "-listOperations" )
	{
		testEnv.scriptEnv.traceWrite("> MSP430 targets does not support the listOperations parameter.");
		return errCode;
	} else if ( testEnv.arguments[testEnv.index] == "-operation" )  {
		testEnv.scriptEnv.traceWrite("> MSP430 targets does not support the operation parameter.");
		return errCode;
	} else {
		curMode = "start";
		while ( testEnv.index < testEnv.argLength )
		{
			curParam = testEnv.arguments[testEnv.index];
			
			// the current parameter could be a mode (-program and -export), or the opCode/Path associated with the current mode
			if ( curParam == "-program" ) {
				// set the mode to Operation Mode
				curMode = "program";
			} else if ( curParam == "-programBin" ) {
				curMode = "programBin";
			} else if ( curParam == "-verify" ) {
				curMode = "verify";
			} else if ( curParam == "-verifyBin" ) {
				curMode = "verifyBin";
			} else if ( curParam == "-export" ) {
				curMode = "export";
			} else if ( curParam == "-exportMulti" ) {
				curMode = "exportMulti";
			} else if ( curParam == "-targetOp" ) {
				// set the mode to Operation Mode
				curMode = "targetOp";
			} else {
				// once the mode is determined, use the current argument(s) to determine how to handle the current mod
				if ( curMode == "program" ) {
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
						testEnv.debugSession.expression.evaluate("GEL_LoadBin(\""+curParam+"\","+addressOffset+")")
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
						testEnv.debugSession.expression.evaluate("GEL_VerifyBinProgram(\""+curParam+"\","+addressOffset+")");
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
						testEnv.debugSession.memory.saveRaw(testEnv.debugSession.memory.getPage(1), exportStartAddr,exportPath,exportLength,8,false);
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
						testEnv.scriptEnv.traceWrite("> Reset issued.");
					} else if ( curParam == "restart" )
					{
						testEnv.debugSession.target.restart();
						testEnv.scriptEnv.traceWrite("> Restart issued.");
					} else if ( curParam == "run" )
					{
						testEnv.debugSession.target.runAsynch();
						testEnv.scriptEnv.traceWrite("> Running target.");
					}
				}
			}
			
			testEnv.index++;
		}
	}

	return errCode;
}