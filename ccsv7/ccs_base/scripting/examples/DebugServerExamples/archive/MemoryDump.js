// Import the DSS packages into our namespace to save on typing
importPackage(Packages.com.ti.debug.engine.scripting)
importPackage(Packages.com.ti.ccstudio.scripting.environment)
importPackage(Packages.java.lang)
importPackage(Packages.java.io)

var PACKET_SIZE = 0x7FF0;
var READ_BUFFER = 10000; 	// Read 10000 bytes at a time for validation

// Create our scripting environment object - which is the main entry point into any script and
// the factory for creating other Scriptable ervers and Sessions
var script = ScriptingEnvironment.instance()

// Create a log file in the current directory to log script execution
script.traceBegin("MemoryDumpTestLog.xml", "DefaultStylesheet.xsl")

// Log everything
script.traceSetConsoleLevel(TraceLevel.ALL)
script.traceSetFileLevel(TraceLevel.ALL)

// Get the Debug Server and start a Debug Session
debugServer = script.getServer("DebugServer.1")
debugServer.setConfig("../C64/tisim_c64xple.ccxml");
debugSession = debugServer.openSession(".*")

if (debugSession.getMajorISA() != 0x64) 
{
	// Requires a C64x (for now)
	script.traceSetConsoleLevel(TraceLevel.INFO)
	script.traceWrite("Test requires a C64x!")
	script.traceWrite("TEST FAILED!")
	script.traceEnd()
	java.lang.System.exit(1);
}

// Values for a C6x Sim
var page = 0;
var address = 0x20;
var addrUnits = 1;
var byteSize = 8;
var wordSize = 32;

// Load a Jpg
var SAMPLE_JPG_LOAD = "tidotcom.jpg";
debugSession.memory.loadRaw(page, address, SAMPLE_JPG_LOAD, wordSize, false);
			
// Open the Jpg
var fis = new FileInputStream(script.toAbsolutePath(SAMPLE_JPG_LOAD));
			
// Open an output Log file 
var testLog = new PrintWriter(script.toAbsolutePath("testLoadRawJpg.txt"));
var currentLine = "INDEX\t\tADDRESS\t\tFILE BYTE\t\tMEM BYTE";
var previousLine = "";
testLog.println(currentLine);

// We're going to read the target file back from memory and verify that everything is OK
// See:  http://www.mozilla.org/rhino/ScriptingJava.html for more details on how to create java arrays in javascript
gotFromFile = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, READ_BUFFER);
var gotFromMem;
var bytesRead;
var index = 0;
var errorCount = 0;
var prevMatched = false;
			
// Keep reading until we hit the end of the file
do {
	// Read bytes into an array
	bytesRead = fis.read(gotFromFile);
	
	// Read bytes from memory
	if (bytesRead > 0) {
			
		gotFromMem = debugSession.memory.readData(page, address + (index * addrUnits), byteSize, bytesRead);
				
		for (var i = 0; i < bytesRead; i++) {
						
			// Cast from signed byte to (unsigned) in a long
			var fromFile;
			if (gotFromFile[i] < 0) {
				fromFile = gotFromFile[i] + 0x100;
			}
			else {
				fromFile = gotFromFile[i];
			}
			
			var fromMem = gotFromMem[i];
			
			previousLine = currentLine;
			currentLine = (index + i) + "\t\t" +
							"0x" + Long.toHexString(address + ((index + i) * addrUnits)) + "\t\t" +
							"0x" + Long.toHexString(fromFile) + "\t\t" + 
							"0x" + Long.toHexString(fromMem);
						
			// Compare the values
			if (fromFile != fromMem) {
						
				// Generate a message from the memory operation
				//memErrors.add("<Byte " + String.valueOf(index + i) + "> Original JPG: 0x" + Long.toHexString(fromFile) + " From Memory: 0x" + Long.toHexString(fromMem));
				errorCount++;
					
				// Write to the output log
				// If this is a failure and the previous was a match - then display the prev. too
				if (prevMatched) {
					testLog.println("========================================================================================");
					testLog.println(previousLine);
					testLog.println("========================================================================================");
				}
			
				testLog.println(currentLine);
				prevMatched = false;
						
			} else {
				prevMatched = true;
			}
		}
	}
				
	// Skip ahead
	index += bytesRead;
				
} while (bytesRead > 0);
			
testLog.close();
fis.close();
			
//	-------------------------------------------------------------
// Check to see is anything was entered in the memErrors List
if (errorCount > 0 ) {
	script.traceSetConsoleLevel(TraceLevel.INFO)
	script.traceWrite("ERROR: Data mismatch.  See <testLoadRawJpg.txt> for details");
	script.traceWrite("TEST FAILED!")
	script.traceEnd()
	java.lang.System.exit(1);
}
	
// All done
debugServer.stop()

script.traceSetConsoleLevel(TraceLevel.INFO)
script.traceWrite("TEST SUCCEEDED!")

// Close our Log File and exit
script.traceEnd()
