Flash algorithm files are usually not installed by default. 
They will either be on your install CD or you can download
from the Spectrum Digital FTP site.  To setup a Flash
project do the following:

1) Unzip the flash files into the "specdig\SDFlash\myprojects" 
   directory of your CCS install.

2) Run SDFlash.

3) Browse to the flash project load the project.

4) Modify the project as required to locate the various
   elements.  By default all flash projects are setup
   with the default TI CCS directory "c:\ti".  

General Overview of where things are located:

<installdir>    default is "c:\ti"
sdgoxxxx.dvr    default is <installdir>\drivers
SDFlash binary  default is <installdir>\specdig\SDFlash
Flash projects  default is <installdir>\specdig\SDFlash\myprojects\<projectname>

Flash projects are versioned with and "_vx" where "x" is 1 to N.
Example: Flash project "sd2401_v1" is version 1 of the TMS320LF2401
         project.  This project was created by Spectrum Digital.

         Flash project "tif28x_v1" is version 1 of the TMS320F28xx
         project.  This project is created by Texas Instruments.

For instructions for how to use SDFlash see the online help.
For details about a specific processor or project see the documentation
in the project file.

###################################################################################

Theory of Operation
--------------------
  SDFlash combines elements of the old command line flash programmer with
  standard sdgoxxx Code Composer drivers and a GUI. The common options from
  the old command line utility are supported in the GUI as project settings.
  For each flash/dsp device you wish to program a flash project is created
  and saved as a .sdp file.  SDFlash is intended to be a common flash programming
  interface to eventually support all TI DSP devices supported
  by Code Composer.  The actual programming support via JTAG is provided by
  existing sdgoxxx CC and emulation drivers.

  SDFlash is designed to support both the developer and production programmer.
  A typical flow would be as follows:
  Developer:
	1) Using Code Composer develop the flash programming algorithms for the
           specific DSP/Flash device.  Examples are provided as a starting point.
        2) Setup a flash project file for your DSP/Flash device.  Again examples
           are provided as a starting point.
        3) Test flash programming with SDFlash.
        4) Package up your SDFlash project and support files for delivery to
           the production programmer.

  Production Programmer:
       1) Receive SDFlash project and programming files from the developer.
       2) Install files on production programming equipment.
       3) Verify programming operation.  If the production programmer and developer
          are not using the same emulator then adjustments may need to be made
          to the project.
       4) Program lots of DSP/Flash devices.
  
  One of the more important features of SDFlash for production programming is it's
  ability to handle continous emulator plug/unplug and power cycles.  Each operation
  on the target (Erase, Program, Verify, Upload) assumes power-on condition.  This
  is significantly different then the CC model where a power cycle while CC is 
  active requires CC to be terminated and restarted. Once SDFlash is opened
  and a project is active you simply press the "start" button to erase/program/verify.
  Then change out the target DSP/Flash and press "start" again.  You can also
  switch to an entirely different device and emulator by simply opening another
  project.  The current project is unloaded and the new project is loaded and
  ready to go.

  For debug and warm fuzzy feeling all operations to the target DSP will show
  pass/fail status messages in the output window.
    
Algorithm Development
--------------------
  If you wish to develop your own algorithm for a supported DSP then start
  with on of the examples provided.  When you write your own algorithm file
  there are certain requirements that must be met.

  ############################################################################
  # WARNING
  #
  # For the C24x, C2xx, C54x, and C27x ALL algorithm code and data MUST 
  # be located on-chip.
  ############################################################################ 

Required Algorithm Variables
-----------------------------
  You must provide the following variables.  These have to be global.
  The SDFlash utility will accept either 'C' or assembly variable names.
  In 'C' PRG_bufaddr becomes _PRG_bufaddr.

  PRG_bufaddr      Address of buffer for flash/program data
  PRG_bufsize      Size of program data buffer
  PRG_devsize      Size of programmable device
  PRG_paddr        First programming address
  PRG_page         Programming page
  PRG_length       Length of programming data
  PRG_status       Status of programming functions

Optional Algorithm Variables
----------------------------
  The optional variables provide a means to customize your algorithms.  The
  SDFlash utility will information from the "User Options X" to the algorithm
  options "PRG_optionsX.

  PRG_options	    User Options 1
  PRG_options2      User Options 2
  PRG_options3      User Options 3
  PRG_options4      User Options 4

  The C24x and C27x examples use PRG_options to control various erase
  features.  However you can use these has you see fit.

Required Algorithm Functions
----------------------------
  You must provide the following functions in your algorithm files.
  If you follow the C24x\C2xx model where there is a separate file
  for erase\program\verify you still need to provide each of the
  functions and stub the unsupported function.

   PRG_init         Initialize system for programming
   PRG_program      Program a block
   PRG_erase        Erase a programmable device
   PRG_verify       Verify a block

Variable Useage
---------------

  PRG_bufaddr: Initialized by the algorithm.  This is a pointer to the flash
               programming buffer.  SDFlash reads this pointer, and then 
               writes image data to the buffer pointed to by PRG_bufaddr.

  PRG_bufsize: Initialized by the algorithm.  This is the size of the data
               buffer pointed to by PRG_bufaddr.

  PRG_devsize: Initialized by the algorithm. This value remains for historical 
               reasons but is not used by SDFlash.

  PRG_paddr:   Initialized by SDFlash. This value will contain the current flash
               array address to be programmed. This value is updated for each
               block to be programmed.

  PRG_page:    Initialized by SDFlash. This is the paged to be programmed.
               0-Program, 1-Data.  This value is based on the COFF section
               type.  In general only program sections are placed in flash.
               Data sections normally get loaded as program as a .cint section
               and moved to data memory, RAM at run time.

  PRG_length:  Initialized by SDFlash. Number of target words to program.
               For TI 16 bit fixed point DSP 1 word is 16 bits of data.

  PRG_status:  Initialized by SDFlash.  The SDFlash utility will intialize
               PRG_status to a fail value.  When an algorithm executes it 
               should set PRG_status to 0 for pass and non 0 for fail.
               When the algorithm completes, SDFlash will read the value
               of SDFlash and continue on pass or exit on fail.

               Suggestion: At the beginning of each function set the PRG_status
               value to a non-0 value to indicate where you are in the 
               function process. Then at the end of the function set PRG_status
               to a pass/fail value.  This method improves function debug 
               in case of failure.
 
               Caveat: PRG_status will NOT be initialized to a fail value. 
               Some of the old TI F24x/F2xx algorithms do not properly
               manage PRG_status and would only set PRG_status on fail but
               not success. 

  PRG_optionsX:Initialized by SDFlash.  These options are passed from SDFlash
               via "User Options X".  The algorithm implementers are free to use
               them as they see fit.  

               Suggestion: At the end of each algorithm set the PRG_options 
               values to a default. Otherwise you may get unexpected
               algorithm side effects.  For example if both Erase and Program
               use options but you forget to set User Options for Program.
               Then Program would use the previous Erase options, which may
               give unexpected results.
               
Flash Routines in C
-------------------
  When developing flash programming algorithms in C there are a couple of
  things to keep in mind. 

  A. Flash programming is initialized from PRG_init instead of c_int00 or main.

  B. The SDFlash utility executes the erase/program/verify functions by 
     setting the program counter (PC) to the beginning of each function.
     The side effect of doing this is possible stack corruption.

  C. Depending on how you have mapped your flash and the type of DSP you
     may have to deal with the differences of a program address and 
     data address.   The C algorithms provided make a function call to
     access the flash.  Inside this function you can handle the issues
     of program and data spaces. 

  These 3 issues are easy to work around so that you can take advantage of
  developing in 'C'.   Following is a section of assembly code used to
  resolve issues A and B.  

>> Make your programming symbols external so that SDFlash can find
>> them.  In this example we used 'C' naming convention.  SDFlash
>> will except assembly or 'C' names.

 	  .global _c_int00  
 	  .global _Erase  
 	  .global _Program
 	  .global _Verify
 	  .global _PRG_init
 	  .global _PRG_erase
 	  .global _PRG_program
 	  .global _PRG_verify  
 	  
 	  .mmregs
      
          .sect "text"   

>> We create a common stopping point, which must include a software
>> breakpoint.  The SDFlash waits for the DSP to hit the breakpoint
>> then reads PRG_status to determine pass/fail.  We surround the
>> SWI with nop and a branch at the end.  This allows us to flush
>> the pipe on stop and then step off of the SWI for debug
>> cleanup.  The b $ at the end is a branch to self for defensive
>> purposes.
  
		; Common stopping point for all commands       
DONE:           nop
		nop
        .word   0F4F0h                  ;SWI instruction
		nop
		nop
                nop
 		b $

>> Our PRG_init function does some basic SD EVM setup then branches
>> to the normal c_int00 routine.  In turn c_int00 will call "main".
>> In "main" we can do our algorithm initialization.  At the end
>> of the main function we also force a SWI.  Otherwise "main"
>> would return to the runtime support "exit" routine not back
>> to our _PRG_init routine.  At this point our environment
>> is setup and ready to go.
 
_PRG_init:
		ld      #0,dp
		stm     #0,sp
		ssbx    intm          ; Disable interrupts 
		rsbx    sxm           ; Disable sign extension
		rsbx    cmpt
		rsbx    cpl
		stm     #0ffffh,ifr
		ld      #0,a
		portw   *(al),4       ; evm specific memory enable   
		; You may want to initialize the pll here.
		; The algo assumes a 10 MHz DSP clock which is the
		; EVM default input clock. Check your CLKMOD settings.
		rpt     #10
		nop  
		
		b		_c_int00
	
>> Each of our programming functions simply call the 'C' worker
>> function which will do a normal return.  We then branch to
>> our common stopping point.  Doing this maintains our 'C' 
>> stack.  This is very important as the Program and Verify 
>> routines will be called repeatedly.
 	
_PRG_erase:
		call  _Erase 
		b     DONE  
		
_PRG_program:
		call  _Program 
		b     DONE
		
_PRG_verify:
		call  _Verify 
		b     DONE

		.end

  






