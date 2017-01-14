/* This example runs on a MSP430F2013.  In order to run this example on another MSP430
target, recompile main.c for the appropriate target, and modify line 61 with the name of the
newly generated executable.  You will also need to change the configuration used at line 17.
*/

/* Import DebugServer enving and Java packages
*/
importPackage(Packages.com.ti.debug.engine.scripting);
importPackage(Packages.com.ti.ccstudio.scripting.environment);
importPackage(Packages.java.lang);


/* Global handles to the debugger
*/
var env = ScriptingEnvironment.instance();
var server = env.getServer("DebugServer.1");
server.setConfig("../msp430f2013/msp430f2013_usb.ccxml");
var session = server.openSession(".*");


/* Connect to target
*/
session.target.connect();


/** A basic assert
@param expr A boolean expression
@pre N/A
@post Throws an exception if expr is false
*/
function assert(expr)
{
	if(!expr)
	{
		throw "FALSE ASSERTION";
	}
}


/** This contains test instructions for the set-up, tear-down, and running stages
@param run_function The function to run which contains the test
@pre run_function is a function
@post The test is run with the call to new
*/
function test(test_name, run_function)
{
	if(test_name==null || test_name=="")
	{
		throw "Test cannot be specified with no name";
	}

	if(run_function==null || run_function==0)
	{
		throw "Test cannot be specified with no run_function";
	}

	/* This contains the set up done before each test
	*/
	this.set_up=function()
	{
		session.memory.loadProgram("../msp430f2013/quicksort/Debug/quicksort.out");
	}
	
	/* The test itself is specified as a parameter (i.e. run_function)
	*/
	this.run=run_function;
	
	/* This contains the tear down done after each test
	*/
	this.tear_down=function()
	{
		session.breakpoint.removeAll();
	}
	
	/* Provide a way of getting the test name
	*/
	this.toString=function()
	{
		return test_name;
	}
	
	this.init=function()
	{
		/* Try to set up
		*/
		try
		{
			this.set_up();
		} catch(exception)
		{
			env.traceWrite("SET UP FAILURE: " +this.toString());
		}
		
		/* Try to run the test
		*/
		try
		{
			this.run();
			env.traceWrite("PASS: " +this.toString());
		} catch(exception)
		{
			env.traceWrite("FAILURE: " +this.toString());
		}
		
		/* Try to tear down
		*/
		try
		{
			this.tear_down();
		} catch(exception)
		{
			env.traceWrite("TEAR DOWN FAILURE: " +this.toString());
		}
	}
	
	/* Call init to set up, run, and tear down
	*/
	this.init();
}


/* Open the session so we can start the tests
*/
session = server.openSession();


/** This is not a test; it is a helper function.  It runs to the end of main and verifies that values were sorted.
@pre N/A
@post Asserts that each value in the array is less than the next value in the array
*/
function verify_execution()
{
	// Run to the end of main (i.e. line 58)
		
	session.breakpoint.add("main.c", 58);
	session.target.run();
	
	// Verify that the elements in the array were sorted
	
	for(var i=0; i<10; ++i)
	{
		// Note: arr is the name of the array in the source file (main.c)
		var value1=session.expression.evaluate("arr[" + i + "]");
		var value2=session.expression.evaluate("arr[" + (i + 1) + "]");
		
		// Assert that the pair of values is in ascending order
		assert(value1<=value2);
	}
}


/** This is not a test; it is a helper function.  It uses specific values for verify_execution.
@pre N/A
@post Asserts that each value in the array is less than the next value in the array using verify_execution
*/
function verify_execution_with_specific_parameters(values_to_test)
{
	// Verify the execution again, but with different values
		
	for(var i=0; i<10; ++i)
	{
		session.expression.evaluate("arr[" + i + "] = " + values_to_test[i]);
	}
	
	verify_execution();
}



/* This is a simple test using the helper function.
	* The test name is "verify_execution".
	* The run function is specified inline, and calls the verify_execution_with_specific_parameters helper function.
*/
var test_verify_execution1=new test("verify_execution1", function()
{
	verify_execution_with_specific_parameters(new Array(5, 2, 0, 3, 6, 1, 50, 3, 39, 9));
});


/* This is a simple test using the helper function but with different numbers
*/
var test_verify_execution2=new test("verify_execution2", function()
{
	verify_execution_with_specific_parameters(new Array(15, 22, 4, 6, 6, 19, 50, 3, 39, 9));
});


/* An example profiling test
*/
var test_profile=new test("profile", function()
{
	// Verify that the prgram completes in a minimum amount of cycles
	session.breakpoint.add("main.c", 58);
	var time = session.clock.runBenchmark();
	env.traceWrite("quicksort took " +time +" cycles");
	assert(time<2250);		
});


/* An example failure
*/
var test_fail=new test("fail_on_purpose", function()
{
	assert(false);	
});


/* End session, since the tests are done
*/
server.stop();
session.terminate();
