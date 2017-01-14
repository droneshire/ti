******************************************************************************
DSS Generic Loader (loadti)
readme.txt
******************************************************************************


DESCRIPTION
===========

Command line loader for TI Targets. Leverages Debug Server Scripting and thus
works with any TI target, hardware, or simulator supported by the base Debug
Server.


INSTRUCTIONS
============

Run loadti batch file (WINDOWS) or shell script (LINUX):

  Usage: loadti [OPTION]... [OUT_FILE1[+OUT_FILE2]...] [ARGUMENT]...
  Load OUT_FILE executable(s) to TI target and run, passing ARGUMENT(s) to main.
  
  Available options:

  -a,   --async-run		Run the specified executable and return without halting

  -b,   --init-bss-section[=VALUE]
						Initialize .bss section to specified value, or 0 if
						value is omitted
  
  -c,   --cfg-file=CONFIG_FILE
						Target setup config file

  -f    --fileio=[FOLDER PATH]
                        Specify the default folder to use for File IO
												
  -h,   --help			Print help

  -l,   --load			Load program only

  -mlr, --mem-load-raw="PAGE,ADDR,FILE,TYPE_SIZE,BYTE_SWAP"
						Load binary data file on host to target

  -mld, --mem-load-dat="PAGE,ADDR,FILE,LEN"
						Load *.dat file on host to target

  -msr, --mem-save-raw="PAGE,ADDR,FILE,LEN,TYPE_SIZE,BYTE_SWAP"
						Save data from target memory to binary file on the host

  -msd, --mem-save-dat="PAGE,ADDR,FILE,LEN,IO_FORMAT,APPEND"
						Save data from target memory to *.dat file on the host

  -n,   --no-profile	Do not perform basic application profiling (total
						cycles)

  -q,   --quiet 		Quiet mode (only C I/O messages to the console)

  -r,   --reset			Reset target before run

  -s,   --stdout-file=FILE
						Save C I/O to specified file

  -t,   --timeout=VALUE	Overall scripting timeout value (in milliseconds)

  -v,   --verbose		Print informative messages during execution

  -x,   --xml-log=FILE	Generate specified XML log file
  
  -@,   --options-file=FILE
						Use options from specified file

  Debug Server configuration is done using the '-c' option The '-c' option
  takes a target setup configuration file as the parameter. These files have a
  *.ccxml extension and by default reside in
  '<Install Dir>/common/targetdb/configurations'.

  Examples: 

  Windows: loadti -c=..\..\..\..\common\targetdb\configurations\tisim_dm6446le.ccxml ..\C64\shapes\Debug\shapes.out
  Linux:   loadti.sh -c=../../../../common/targetdb/configurations/tisim_c64xple.ccxml ../C64/shapes/Debug/shapes.out 
  
  Run 'loadti --help' for the latest list and definition of all available
  options.
  
  Aborting loadti execution:
  
  Pressing CTRL-C during script execution will prematurely quit execution of 
  loadti. When CTRL-C is pressed when the application is running on the target
  ("Interrupt to abort . . ."), loadti will abort and if running on a
  simulator, the simulator will be shutdown with the rest of the Debug Server.
  When running on a HW target, loadti will terminate but the target will be
  left continuing execution.
 
  Multiple runs:

  Multiple runs of loadti can be done from a batch or bash file that calls
  loadti. On Windows, since loadti is also a batch file, make sure calls are
  done using the 'CALL' command. On Linux, calls to loadti can be made
  directly:
  
  Windows (Example batch file): 
  ------------------------------------------------------------------------------  
  CALL loadti -c dm6446_sim_custom.ccxml myapp1.out
  CALL loadti -c C:\TI\CCSv4\common\targetdb\configurations\tisim_c64xpbe.ccxml myapp3.out
  CALL loadti -c C:\TI\CCSv4\common\targetdb\configurations\tisim_c55xp_ca.ccxml -x myapp2log.xml myapp2.out arg1 arg2
  ------------------------------------------------------------------------------   
  
  Linux (Example shell script):
  ------------------------------------------------------------------------------
  loadti.sh -c dm6446_sim_custom.ccxml myapp1.out
  loadti.sh -c /opt/ti/ccs4/common/targetdb/configurations/tisim_c64xpbe.ccxml myapp3.out
  loadti.sh -c /opt/ti/ccs4/common/targetdb/configurations/tisim_c55xp_ca.ccxml -x myapp2log.xml myapp2.out arg1 arg2
  ------------------------------------------------------------------------------


FILES
=====

- loadti.bat
  Windows batch file that executes loadti.
 
- loadti.sh
  Linux shell script that executes loadti.

- DefaultStylesheet.xsl
  XML Stylesheet used by DSS XML logs.
 
- main.js
  Main JavaScript.

- dsSetup.js
  JavaScript used to configure the Debug Server.
  
- memXfer.js
  JavaScript used for host<->target data transfer.
  
- getArgs.js
  JavaScript used for parsing command-line arguments.
   
- readme.txt
  This text file.


KNOWN ISSUES
============

- Known issue where DSS is unable to create a xml log file (-x option) in a 
  location where the folder does not exist. 
    
- On certain HW targets, the following error message may appear:

  "SEVERE: TMS320C6400_0: Error enabling a profile counter: Profiling not 
  supported with existing configuration.  Check that Advanced Event Triggering 
  components are enabled. Sequence ID: 0 Error Code: 0 Error Class: 0x00000000"

  This error occurs when attempting to profile on targets with cTools (AET). 
 
- For applications where there is an .args section of greater than size zero,
  argc/argv will be passed to main only if there are arguments passed to loadti
  for main.
  
  Ex #1 (no argument): loadti app.out
  
  argc=0
  argv[0]=null
  
  Ex #2 (1 argument): loadti app.out arg1
  
  argc=2
  argv[0]=app.out
  argv[1]=arg1
  
- On some Windows environments it may be necessary to call batch scripts 
  (loadti.bat) with full filename extension.
