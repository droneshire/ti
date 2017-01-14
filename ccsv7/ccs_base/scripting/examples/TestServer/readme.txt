******************************************************************************
DSS Test Server
readme.txt
******************************************************************************


DESCRIPTION
===========

Launches a DSS instance for a target configuration and starts a debug session 
for all debuggable cores on the target in its own Java thread. Each thread will 
then listen for commands on an open TCP/IP socket. Remote clients can 
communicate to the active debug session by connecting to the socket and sending 
appropriate commands.


INSTRUCTIONS
============

The example that demonstrates the DSS Test Server is written in Perl. Hence an
installation of Perl is needed. The JSON (JavaScript Object Notation) encoder/
decoder Perl module also needs to be installed. 

To run the example: 

Start the Test Server:

- open a command window by running the setenv.bat file located at 
          <CCS_INSTALL>/ccsv5/ccs_base_<CCS_VERSION>/scripting/examples/TestServer

- Start the Test Server example by running the 'test_server.js' script

  > dss test_server.js
  
  The Test Server will take a few moments to start up. You will know it is
  fully up when you are notified that 'session[x] opened on port <number>'.
  
Run the Test Server Client example:

- open a command window by running the setenv.bat file located at 
          <CCS_INSTALL>/ccsv5/ccs_base_<CCS_VERSION>/scripting/examples/TestServer

- Run the Client example by running the 'perl_client.pl' script and passing in
  the host and port of the Test Server debug session you wish to connect to. For  
  this example, use "localhost" for the host and port number 4444 

  > perl perl_client "localhost" 4444
  
  This will run the Client example for the specified debug session. A series of
  messages will appear in both consoles as messages are being passed between the
  client and server. The client script will send a series of commands that the
  server will receive and attempt to execute on the associated debug session. 
  The status of the command will be sent back to the client (OK or FAIL). Any
  failure will also have an associated message describing the cause of the 
  failure. Note that the client script intentionally has some invalid commands
  to demonstrate how failures are handled.  
  
  
COMMANDS
======= 

The format of the data communicated between the host and client are JSON 
objects. JSON (JavaScript Object Notation) is a lightweight computer data 
interchange format based of JavaScript. See http://www.json.org/ for more 
information. 

JSON objects are a set of name/value pairs. An object begins with { (left brace) 
and ends with } (right brace). Each name is followed by : (colon) and the 
name/value pairs are separated by , (comma). Example:

{"name":"timeout","timeout":10000} 

The DSSClient Perl module provides an 'execute' function that can take a Perl 
data structure and encode it to JSON format. Hence one simply needs to format 
the command they wish to send to the Test Server in a data structure and use the
execute command to encode it to the JSON format and send the command. For 
example, the 'run' command (to run the target) has no parameters. The element in
the data structure would be the name of the command:

# Halt the target
$cmd = {
	"name" => "halt",
};

The first element is always the name of the command.

Let's take a look at a command with many parameters... like the '
loadRawFromFile' command (load a binary file from the PC to target):

# Load binary file to memory.
$cmd = {
	"name" => "loadRawFromFile",
	"page" => 0,
	"address" => 0x10000,
	"file" => "loadRawFromFile.bin",
	"wordSize" => 32,
	"byteSwap" => 0,
};

All commands return a status to indicate if the command succeeded (OK) or failed 
(FAIL). In JSON format, it would be ("status":"OK") or ("status":"FAIL"). The
command will somtimes return additional values, usually a failure message if
the command failed, or data if it is a command requesting data (such as 
"readData").

The following commands are currently supported. Since many of the commands call
an equivalent DSS API, it is recommended to get familiar with the DSS API
documentation for a better understanding of the commands.

- COMMAND:      stop 
  FORMAT:       {"name":"stop"} 
  RETURNS:      status (OK or FAIL), message (if status is FAIL)
  DESCRIPTION:  Terminates connection with debug session
          
- COMMAND:      connect
  FORMAT:       {"name":"connect"}
  RETURNS:      status (OK or FAIL), message (if status is FAIL)
  DESCRIPTION:  Connect to the target
             
- COMMAND:      disconnect
  FORMAT:       {"name":"disconnect"}  
  RETURNS:      status (OK or FAIL), message (if status is FAIL)     
  DESCRIPTION:  Disconnect from the target
  
- COMMAND:      load
  FORMAT:       {"name":"load","program":<file name>}  
  RETURNS:      status (OK or FAIL), message (if status is FAIL)           
  DESCRIPTION:  Loads a program on the target  
                
- COMMAND:      run
  FORMAT:       {"name":"run"}  
  RETURNS:      status (OK or FAIL), message (if status is FAIL)
  DESCRIPTION:  Synchronous run command. This command will block until the 
                program is halted or a script timeout occurs
                   
- COMMAND:      runAsynch 
  FORMAT        {"name":"asynch"} 
  RETURNS:      status (OK or FAIL), message (if status is FAIL)      
  DESCRIPTION:  Asynchronous run command. This command will run the target and 
                return
    
- COMMAND:      halt
  FORMAT:       {"name":"halt"}
  RETURNS:      status (OK or FAIL), message (if status is FAIL)  
  DESCRIPTION:  Halt the target
                               
- COMMAND:      reset
  FORMAT:       {"name":"reset"}
  RETURNS:      status (OK or FAIL), message (if status is FAIL)    
  DESCRIPTION:  Reset the target
                           
- COMMAND:      timeout
  FORMAT:       {"name":"timeout","timeout":<value>} 
  RETURNS:      status (OK or FAIL), message (if status is FAIL)  
  DESCRIPTION:  Set the DSS timout value for synchronous APIs
                         
- COMMAND:      redirectCIO
  FORMAT:       {"name":"redirectCIO","file":<file name>}
  RETURNS:      status (OK or FAIL), message (if status is FAIL)        
  DESCRIPTION:  Redirect CIO messages to a file
   
- COMMAND:      setBreakpoint
  FORMAT:       {"name":"setBreakpoint","address":<address value (int) or 
                symbol name (string)>}     
  RETURNS:      status (OK or FAIL), message (breakpoint ID or failure message)                
  DESCRIPTION:  Set a breakpoint on an address or symbol.               
                   
- COMMAND:      removeAllBreakpoints
  FORMAT:       {"name":"removeAllBreakpoints"}
  RETURNS:      status (OK or FAIL), message (if status is FAIL)    
  DESCRIPTION:  Remove all set breakpoints

- COMMAND:      loadRawFromFile
  FORMAT:       {
                    "name":"loadRawFromFile",
                    "page":<memory page>,
                    "address":<address value>,
                    "file":<file name>,
                    "wordSize":<size of word (in bits)>,
                    "byteSwap":<byte swap enable ('0' = false, '1' = true)>
                }    
  RETURNS:      status (OK or FAIL), message (if status is FAIL)                  
  DESCRIPTION:  Load a binary file to target memory

- COMMAND:      saveRawToFile
  FORMAT:       {
                    "name":"saveRawToFile",
                    "page":<memory page>,
                    "address":<address value>,
                    "file":<file name>,
                    "length":<number of bytes>,
                    "wordSize":<size of word (in bits)>,
                    "byteSwap":<byte swap enable ('0' = false, '1' = true)>
                }  
  RETURNS:      status (OK or FAIL), message (if status is FAIL)  
  DESCRIPTION:  Save target memory contents to a binary file
  
- COMMAND:      loadDataFromFile 
  FORMAT:       {
                    "name":"saveRawToFile",
                    "page":<memory page>,
                    "address":<address value>,
                    "file":<file name>,
                    "length":<number of bytes>
                }  
  RETURNS:      status (OK or FAIL), message (if status is FAIL)  
  DESCRIPTION:  Load a *.dat file to target memory

- COMMAND:      saveDataToFile
  FORMAT:       {
                    "name":"saveRawToFile",
                    "page":<memory page>,
                    "address":<address value>,
                    "file":<file name>,
                    "length":<number of bytes>,
                    "ioFormat":<see DSS API documentation for ioFormat values>,
                    "append":<enable append to file ('0' = false, '1' = true)>
                }  
  RETURNS:      status (OK or FAIL), message (if status is FAIL)  
  DESCRIPTION:  Save target memory contents to a *.dat file    

- COMMAND:      loadGel
  FORMAT:       {"name":"loadGel","file":<file name>}      
  RETURNS:      status (OK or FAIL), message (if status is FAIL)  
  DESCRIPTION:  Load a GEL file
  
- COMMAND:      runGel
  FORMAT:       {"name":"runGel","expression":<GEL expression>}      
  RETURNS:      status (OK or FAIL), message (if status is FAIL)  
  DESCRIPTION:  Run a GEL expression 
  
- COMMAND:      readData 
  FORMAT:       {
                    "name":"readData",
                    "page":<memory page>,
                    "address":<address value>,
                    "typeSize":<bit size of value to read>,
                    "signed":<return value is signed ('0' = false, '1' = true)>
                }  
  RETURNS:      status (OK or FAIL), value (if status is OK), message (if 
                status is FAIL)                  
  DESCRIPTION:  Read one integer value from memory

- COMMAND:      writeData
  FORMAT:       {
                    "name":"writeData",
                    "page":<memory page>,
                    "address":<address value>,
                    "value":<value to write>,
                    "typeSize":<bit size of value to write>
                }  
  RETURNS:      status (OK or FAIL), message (if status is FAIL)                  
  DESCRIPTION:  Write one integer value to memory    

- COMMAND:      readDataArray 
  FORMAT:       {
                    "name":"readDataArray",
                    "page":<memory page>,
                    "address":<address value>,
                    "typeSize":<bit size of the values to read>,
                    "numValues":<number of values to read>,
                    "signed":<return value is signed ('0' = false, '1' = true)>
                }  
  RETURNS:      status (OK or FAIL), value (if status is OK), message (if 
                status is FAIL)                
  DESCRIPTION:  Read multiple values from memory

- COMMAND:      writeDataArray
  FORMAT:       {
                    "name":"writeData",
                    "page":<memory page>,
                    "address":<address value>,
                    "values":<values to write to memory>,
                    "typeSize":<bit size of values to write>
                }  
  RETURNS:      status (OK or FAIL), message (if status is FAIL)                  
  DESCRIPTION:  Write multiple values to memory. The values parameter takes a 
                string of values delimited by a comma ("1,2,3,4")          
  
Additional custom commands can be created. Simply create them in your server
side script and add them using the 'addHandlers()' API. See 'test_server.js'
for an example.


FILES
=====

- DSSClient.pm
  Perl module that enable customers to talk over a TCP/IP socket to 
  a DSS TestServer as implemented in dss/TestServer.js. Requires a version of 
  Perl with JSON support. 

- json2.js
  JSON utility JavaScript file that creates a global JSON object containing two 
  methods: stringify and parse.

- TestServer.js
  JavaScript file where the bulk of the functionality is found, implemented in 
  JavaScript/DSS. Starts a DSS instance for a specified target configuration, 
  and then starts a debug sessions for all debuggable cores, each in its own 
  Java Thread and waits for connections/commands on a TCP/IP socket per session.
  
- readme.txt
  This text file.   
 
The rest of the files are example files that would vary between user and is
provided as an example on how to use the above three (minus readme.txt) core 
scripts:
 
- perl_client.pl
  Example client script. Demonstrates the use of DSSClient.pm by creating a 
  DSSClient instance and sending scripting commands to an active DSS Test Server 
  debug session.

- test_server.js 
  Example server script. Demonstrates the use of dss/TestServer.js. Starts the 
  DSS Test Server for a C64x+ CPU Simulator. Also defines some additional custom 
  commands that can be called from the remote client.

- setpath.bat
  Configures the environment PATH and PERL5LIB variables needed to run the Test
  Server and examples.
   
- Other example files to by used by the perl_client.pl example


KNOWN ISSUES
============
TBD
