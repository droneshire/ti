******************************************************************************
Universal Flash Command Line Programmer
******************************************************************************

DESCRIPTION
===========
Provides command line support for Universal Flash Programmer. It should give users the ability to:
- configure the Flash Programmer for any configuration supported by the application (either via the GUI or scripting)
- handle multiple cores, for mulit-core devices (but can only interact with one core at a time; run multiple command lines for accessing multiple cores)
- set Flash configuration settings, based on Flash option IDs
- perform Flash operations, based on Flash Operation opCodes
- load Flash programs. Users can also provide a list of programs to load (in the order you wish to load them).
- export Flash memory to supported program file format for loading to other devices

INSTRUCTIONS
============
  Usage:
	1) uniflash [UTILITY] [CONFIG] [CORE] [SETTINGS] [OPERATION/PROGRAM]

  Where:
	[UTILITY] 
	  Provides various utilities to use during the command line execution. 
	  
	  "-log" givens the ability to specify a file to log information to for the execution of the application.
	  If no log option is specified, the logging information will appear only in the console.

	  "-verbose" sets the verbose output level. Defaults to 1 if not set.

	  "-mode" puts the tool into various modes, modifying the basic behaviour of the tool
	  
	    [Supported Modes]
	     "repeat" -> after the [Operation] paramters are finished executing, on user input, it executes the same operation again. This allows users to switch out the device with another (of the same) device and execute the same command without needing the tool to reconfigure the application. Input "exit" to end the repeat mode.
	  
	  "-programStatusOutput" allows users to specify a file to send status output to on a Program Load operation. When the program is loaded  successfully, it will write <successStr> to the file, otherwise it will write <failStr> to the file
	  
	  {Available options}
	   -log <logFilePath>
	   -verbose 0 or -verbose 1
	   -mode <modeID>
	   -programStatusOutput <outputFile> <successStr> <failStr> 
	  
	[CONFIG]
	  Provides the ability to config the application for your device.
	  
	  "-ccxml" can be used to load an existing configuration
	  
	  "-createConfig" can be used to create a new configuration. The <nameOfConnection> and <nameOfDevice> is the exact string from the configuration XML. <savePath> is where the generated CCXML will be saved.
	
	  Note:
	   1. the <savePath> needs to exist before invoking the command
	   2. creating configuration files is expected to take longer (total time) than using an existing configuration.
	
	  {Available options}
	  -ccxml <pathToExistingCCXML>
	  -createConfig <nameOfConnection> <nameOfDevice> <savePath>

	[CORE]
	  Provides the ability to specify the name of the core users want to interact with for the current command. This is only relevant for devices with multiple cores. If no core information is specified, it will use the default core, based on the configuration.
	  
	  The core string is based on the fullpath of the core from the configuration XML. the <nameOfCore> value will be matched using the Regular Expression .*<nameOfCore>.* on the available fullpaths.
	
	  Use the -listCores option to get an output of the core name strings to console. You can then use the name of the core in your core selection via -core.
	
	  {Available options}
	  -listCores
	  -core <nameOfCore>
	  
	[SETTINGS]
	  Before executing Flash operations, this provides the ability to either:
	   1. view the available Flash options (via -viewOptions). 
	   2. set values of available options (via -setOptions), or 
	   3. load settings from a session file created from the GUI (via -loadSettings)
	  
	  "-viewOptions" will output the available Flash options, as well as the IDs needed to reference the options and the values the options can be set to.
	  
	  "-setOptions" take one or more ID/value pairs, and are set in order.
	  
	  "-loadSettings" takes a session file generated from the GUI and loads the settings saved in the file
	
	  {Available options}
	  -viewOptions (outputs available options)
	  -setOptions <OptID1>=<Value1> <OptID2>=<Value2> ... <OptIDn>=<Valuen>
	  -loadSettings <pathToSessionFile>

	[OPERATION/PROGRAM]:
	  Provides the ability to list the available options (via -listOperations), perform an operation (via -operation), load a program (via -program or -programBin), verify a program to target memory (via -verify or verifyBin), export a program (-via export), or interact with the target after program loads.
	  
	  "-listOperations" will output the available Flash operations (via opCodes) for the configured target. This is a standalone operation and will exit right after the output.
	  
	  In contrast, "-operation", "-program", "-programBin", "verify", "verifyBin" and "-export" are chainable commands; which means that the user can specify multiple operations, programs and export commands, and each of these commands will be perform in order. 
	  
	   Example: -operation <opCode1> -program <program1> <program2> -operation <opCode2> <opCode3> -export <fileType> <startAddr> <endAddr> <exportPath1> -program <program3>
	  
	  The above command will perform <opCode1>, program <program1> and <program2>, perform <opCode2> and <opCode3>, export the memory to <exportPath1>, before finally programming <program3>; all in the same command.
	
	  "-operation" follow by opCodes will be executed in order.
	  
	  "-program" follow by path to the programs will be loaded in order.
	  
	  "-programBin", follow by path and start address will be loaded in order, and to the location specified by start address
	
	  "-verify" will match the given programs with the data on the target.
	
	  "-verifyBin" will match the given binary file with the data on the target at the given address.
	
	  "-export" will export the Flash memory to the specified File Type, given the start address, length (in words) and the location of the file to save to.
	   
	   Note: currently, the only exporting file type supported is COFF and BIN
	   Note2: the length is given in target words (instead of bytes)
	  
	   Example: -export COFF 0x0 0x2000 "C:/export.out"
				-export BIN 0x0 0x2000 "C:/export.bin"
	
	  "-exportMulti" will export multiple ranges of Flash memory to a single file. Since only COFF format is supported for this type of operation, the file type does not need to be specify. Specify the number of desired sections to export, and then give the start address and length (in words) pairs in order.
	  
	   Example: -exportMulti 3 0x0 0x200 0x400 0x200 0xF000 0x100 "C:/export.out"
	
	  "-targetOp" is use to interact with the target after program loads. Specified multiple target operation arguments will be executed in order. 
	  
	    The current supported operations are:
	      1) "reset" - resets the target
		  2) "restart" - issues a restart on the loaded program
		  3) "run" - run the target core asynchrononously (ie; does not wait for a halt)
	
	  {Available options}
	  -listOperations
	  -operation <opCode1> ... <opCodeN>
	  -program <program1> ... <programN>
	  -programBin <program1> <address1> ... <programN> <addressN>
	  -verify <program1> ... <programN>
	  -verifyBin <program1> <address1> ... <programN> <addressN>
	  -export <fileType> <startAddr> <length> <filePath>
	  -exportMulti <numSections> <startAddr1> <lengthInWords1> ... <startAddrN> <lengthInWordsN> <filePath>
	  -targetOp <targetOp1> .. <targetOpN>
