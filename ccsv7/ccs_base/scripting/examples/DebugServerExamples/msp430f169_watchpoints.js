// This example runs on a MSP430F169.  In order to run this example on different MSP430
// target, recompile main.c for the appropriate target, and modify the line below with the name 
// of the newly generated executable.

// CCS must be set up for the correct target (MSP430F169, or otherwise if EXECUTABLE is modified).
// You can test that your set up is correct by running CCS, and confirming that you can start a debug
// session for the correct target.  Then, exit CCS.

var EXECUTABLE="../msp430f169/gcd/Debug/gcd.out"
var GCD_TO_LOOK_FOR=17;

// Import DebugServer environment and Java packages

importPackage(Packages.com.ti.debug.engine.scripting);
importPackage(Packages.com.ti.ccstudio.scripting.environment);
importPackage(Packages.java.lang);

function gcd(a, b)
{
     if(a == 0)
     {
     	return b;
     }
     
     while(b != 0)
     {
     	if(a > b)
     	{
     		a = a - b;
     	}
     	else
     	{
     		b = b - a;
     	}
     }
	
    return a;
}

// Global handles to the debugger
var env;
var server;
var session;

try
{
	env=ScriptingEnvironment.instance();
	server=env.getServer("DebugServer.1");
	server.setConfig("../msp430f169/msp430f169_usb.ccxml");	
	session=server.openSession(".*");
}
catch(err)
{
	throw "Could not start DebugServer.  Is the target properly configured?";
}

// Create a log file in the current directory to log script execution
env.traceBegin("WatchpointsLog.xml", "DefaultStylesheet.xsl");

// Connect to target and load the program
session.target.connect();
session.memory.loadProgram(EXECUTABLE);

// Calculate what the values of a and b should be where gcd(a, b)==GCD_TO_LOOK_FOR 
// Get the maximum value from the target program.

var a=new Array();
var b=new Array();
var MAX=session.expression.evaluate("MAX");

// Determine what values of a and b will yield the given GCDs 
for(i=1; i<=MAX; i++)
{
	for(j=1; j<=MAX; j++)
	{
		if(gcd(i, j)==GCD_TO_LOOK_FOR)
		{
			a.push(i);
			b.push(j);
		}
	}
}

// Add a watch point: wait for write to gcd_ab 
env.traceWrite("Adding watch point: gcd_ab == " +GCD_TO_LOOK_FOR);

// Create a hardware break point
var properties=session.breakpoint.createProperties(1);

// Set MAB constraints (i.e. what variable to watch) 
// Note the property strings used for setting the watchpoint exactly match what can be viewed 
// in the breakpoint properties dialog. You can explore the other breakpoint properties available by looking at
// the options available in this dialog.
properties.setString("Hardware Configuration.Type.Trigger 0", "Memory Address Bus");
properties.setString("Hardware Configuration.Type.Trigger 0.Location", "&gcd_ab");
properties.setString("Hardware Configuration.Type.Trigger 0.Access", "Write");

// Set MDB constraints (i.e. what value to look for) 
properties.setString("Hardware Configuration.Type.Trigger 1", "Memory Data Bus");
properties.setNumeric("Hardware Configuration.Type.Trigger 1.Value", GCD_TO_LOOK_FOR);
properties.setString("Hardware Configuration.Type.Trigger 1.Access", "Write");

env.traceWrite("Printing watch point properties");
env.traceWrite("--");
properties.printProperties();
env.traceWrite("--");

session.breakpoint.add(properties);

// For each (a, b) combination, run the target until the watch point is hit, and verify a and b
try
{
	for(var i=0; i<a.length; i++)
	{
		var a_val=a[i];
		var b_val=b[i];
		
		env.traceWrite("Running target; expect to halt with a == " +a_val +" and b == " +b_val);
		session.target.run();
		
		var a_target=session.expression.evaluate("a");
		var b_target=session.expression.evaluate("b");
		
		if(a_target!=a_val)
		{
			throw "Expected value of a to be " +a_val +" but found " +a_target;
		}
		
		if(b_target!=b_val)
		{
			throw "Expected value of b to be " +b_val +" but found " +b_target;
		}
		
		env.traceWrite("Halted with a == " +a_val +" and b == " +b_val);
		env.traceWrite("--");
	}
} 
catch(err)
{
	env.traceWrite("An error was detected while running the script.");
	env.traceWrite("The error is as follows: ");
	end.traceWrite("--");
	env.traceWrite(err);
	end.traceWrite("--");
	end.traceWrite("Please ensure that the target and this script are set up correctly.");
}

// End session, since the program is done
server.stop();
session.terminate();

// Close our Log File
env.traceEnd();
