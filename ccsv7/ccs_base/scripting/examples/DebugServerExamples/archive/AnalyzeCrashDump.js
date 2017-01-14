// Import the DSS packages into our namespace to save on typing

importPackage( Packages.com.ti.debug.engine.scripting )
importPackage( Packages.com.ti.ccstudio.scripting.environment )
importPackage( Packages.java.lang )

// Configure and launch DSS for analyzing a 64+ crash dump

System.out.println( "Launching DebugSession..." );
debugServer = ScriptingEnvironment.instance().getServer( "DebugServer.1" )
debugServer.setConfig( "CrashDumpAnalysis (64+).ccxml" )
debugSession = debugServer.openSession( ".*" )

// Load the symbols associated with the crash dump, and the crash dump itself

System.out.println( "Loading symbols..." );
debugSession.symbol.load( "../C64/modem/Debug/modem.out" )

System.out.println( "Loading crash dump..." );
debugSession.expression.evaluate( "GEL_SystemRestoreState( \"ExampleCrashDump.txt\" )" )

// We can now print out as much of the call stack as we can.  If the crash dump 
// is missing memory or register values, an error will be printed before the 
// frames are.

System.out.println( "Analyzing...\n" );
debugSession.callStack.print()

// Now we can inspect locals or globals etc.  If the crash dump does not 
// contain the necessary data, an error will be printed out instead.  We'll 
// disable the console log so that we don't see the error multiple times

ScriptingEnvironment.instance().traceSetConsoleLevel( "OFF" )
System.out.println( "\n" );

function display( variable )
{
	try
	{
		System.out.println( variable + " = " + debugSession.expression.evaluate( variable ) )
	} 
	catch( exception )
	{
		System.out.println( exception.javaException.getMessage() )
	}
}

display( "amplitudeOfSymbol" ) 						// Local value in ShapingFilter()
display( "'modemtx.c'::g_ModemData.noiseLevel" ) 	// File static variable - note the pre-pending of the file to indicate where it was declared.

// Load the symbols associated with the another crash dump, and the crash dump itself
// This time, the crash dump does not contain register data and so we'll need to use
// another function to analyze the callstack.  That function will not use register data
// and will analyze the entire stack range for any data that appears call frame related

System.out.println( "Loading symbols..." );
debugSession.symbol.load( "../C64/stl/Release/stl6x.out" )

System.out.println( "Loading crash dump..." );
debugSession.expression.evaluate( "GEL_SystemRestoreState( \"stl_crash_dump.txt\" )" )

// We can now analyze and print out all stack data we can find.  For 
// stl6x.out, the stack is allocated to 0x80000000 with a size of 0x6000

// Note that two call stacks will be printed.  The second one is the actual 
// stack at the time that the stack image was created.  The first one 
// represents earlier calls that were made on the target prior to the stack
// image being created, but which had not yet been over written with other 
// data by the execution of the target.  This happens because the sort 
// algorithm makes significantly more calls and thus uses more stack memory
// than the random shuffle algorithm, which was called second.

System.out.println( "Analyzing...\n" );
debugSession.callStack.analyzeStackMemory( 0x80000000, 0, 0x6000 );

// Once we're done inspecting the crash dump, we can end the script

debugServer.stop()

