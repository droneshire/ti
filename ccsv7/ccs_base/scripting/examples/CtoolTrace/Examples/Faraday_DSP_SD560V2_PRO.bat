@echo off

REM This is an example batch file to demonstrate how to use trace DSS scripting. The first parameter of each line is the trace_dss batch file locaiton followed the test script locaiton. For the rest of parameter in each call, please look into test script example file for detail.
cls

REM This script is to perform a trace on job on C64xp in Faraday device with XDSPRO as receiver
REM The command start with the location of trace_dss.bat in either relative or absolute format
REM The first paramer has to be the test script name with path infomration
REM The second set of parameter -setupfile <FILENAME> specify the location of ccsv4 target setup file name in relative path. Absolute path name will work.
REM The third set of parameter -targetname <TARGETNAME> specify the complete target name that found in ccsv4 setup file
REM The forth set of parameter -channelfile specify ctool trace channel setting file location. These file located at the <CCSV$_INSTALL>\ccsv4\emulation\analysis\bin director. Either absolute or relative path is supported
REM The fifth set of parameter -receiver <RECEIVENAME> specify the receiver name. Curretnly supported receiver names are: "Pro Trace", "560 Trace Pod" or "560 V2 Trace".
REM The sixth set of parameter -triggerfile <TRIGGERFILENAME> specify the trigger file name. It should include either relative or absolute path. This file contains trigger configuration to config a trace job.
REM The seventh set of parameter -outfile <OUTPUTFILENAME> specify the intended output file name. It should include either relative or absolute path.
REM The eighth set of parameter -app <APPLICATIONNAME> specify the application file name. It should include either relative or absolute path.
REM
REM The order of these parameters are irrelevant except for the first parameter has to be script file. The leading ked words are defined inside the script so that can be add/delete/modified based on what the script is looking for. The maximum number of parameters are 35. Parameters are seperated with space.

set CCS_BASE_PATH=C:\\ccs\\5.5.0.00077\\ccsv5\\ccs_base
set START_DIR=%CD%
set SCRIPT_DIR=%CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace
cd "%SCRIPT_DIR%\\Examples"

call "%CCS_BASE_PATH%\\scripting\\bin\\trace_dss.bat" Faraday_DSP_PRO_Test.js -setupfile "%SCRIPT_DIR%\\Faraday\\Faraday_xds560v2pro_usb.ccxml" -targetname "Spectrum Digital XDSPRO USB Emulator_0/C64XP" -channelfile "%CCS_BASE_PATH%\\emulation\\analysis\\bin\\TraceCntrl_DefaultSettings_PRO_Dsp.xml" -receiver "Pro Trace" -triggerfile "%SCRIPT_DIR%\\C64xp\\Trace_On.xml" -outfile "%SCRIPT_DIR%\\Examples\\TraceOutput.txt" -app "%SCRIPT_DIR%\\Faraday\\autotest.out" 

cd "%START_DIR%"