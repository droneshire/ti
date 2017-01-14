@echo off

REM This is an example batch file to demonstrate how to use trace DSS scripting. The first parameter of each line is the trace_dss batch file locaiton followed the test script locaiton. For the rest of parameter in each call, please look into test script example file for detail.
cls

REM This script is to perform a trace on job on C64xp in Faraday device with ETB as receiver
REM The command start with the location of trace_dss.bat in either relative or absolute format
REM The first paramer has to be the test script name with path infomration
REM The second set of parameter -setupfile <FILENAME> specify the location of ccsv4 target setup file name in relative path. Absolute path name will work.
REM The third set of parameter -targetname <TARGETNAME> specify the complete target name that found in ccsv4 setup file
REM The forth set of parameter -channelfile specify ctool trace channel setting file location. These file located at the <CCSV$_INSTALL>\ccsv4\emulation\analysis\bin director. Either absolute or relative path is supported
REM The fifth set of parameter -receiver <RECEIVENAME> specify the receiver name. Curretnly supported receiver names are: "ETB", "560 Trace Pod" or "560 V2 Trace".
REM The sixth set of parameter -triggerfile <TRIGGERFILENAME> specify the trigger file name. It should include either relative or absolute path. This file contains trigger configuration to config a trace job.
REM The seventh set of parameter -outfile <OUTPUTFILENAME> specify the intended output file name. It should include either relative or absolute path.
REM The eighth set of parameter -app <APPLICATIONNAME> specify the application file name. It should include either relative or absolute path.
REM
REM The order of these parameters are irrelevant except for the first parameter has to be script file. The leading ked words are defined inside the script so that can be add/delete/modified based on what the script is looking for. The maximum number of parameters are 35. Parameters are seperated with space.

REM Update this path setting to match your ccs installation setting
set CCS_BASE_PATH="C:\\ti\\ccsv5\\ccs_base"

REM This script is to perform a trace on job on C64xp in Faraday device with ETB as receiver
call %CCS_BASE_PATH%\\scripting\\bin\\trace_dss.bat %CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\Examples\\Faraday0_560T_ETB_BH_Test.js -setupfile "%CCS_BASE_PATH%\\scripting\\examples\\C64\\6488_BH.ccxml" -targetname "Blackhawk USB560-M Emulator_0/C64XP" -channelfile "%CCS_BASE_PATH%\\emulation\\analysis\\bin\\TraceCntrl_DefaultSettings_ETB.xml" -receiver "ETB" -triggerfile "%CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\C64xp\\Trace_On.xml" -outfile "%CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\Examples\\TraceOn560TETBTest.txt" -app "%CCS_BASE_PATH%\\scripting\\examples\\C64\\autotest.out"

REM This script is to perform a trace on job on C64xp in Faraday device with XDS560 Trace Pod as receiver
REM call %CCS_BASE_PATH%\\scripting\\bin\\trace_dss.bat %CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\Examples\\Faraday0_560T_ETB_BH_Test.js -setupfile "%CCS_BASE_PATH%\\scripting\\examples\\C64\\6488_BH.ccxml" -targetname "Blackhawk USB560-M Emulator_0/C64XP" -channelfile "%CCS_BASE_PATH%\\emulation\\analysis\\bin\\TraceCntrl_DefaultSettings.xml" -receiver "560 Trace Pod" -triggerfile "%CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\C64xp\\Trace_On.xml" -outfile "%CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\Examples\\TraceOn560TTest.txt" -app "%CCS_BASE_PATH%\\scripting\\examples\\C64\\autotest.out"

REM This script is to perform a trace on job on CortexA8 in Omap3430 target with ETB as receiver
REM call %CCS_BASE_PATH%\\scripting\\bin\\trace_dss.bat %CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\Examples\\Omap3430_ETB_BH_Test.js -setupfile "%CCS_BASE_PATH%\\scripting\\examples\\CortexA8\\Omap3430_ETB_BH.ccxml" -targetname "Blackhawk USB560-M Emulator_0/Cortex_A8_0" -channelfile "%CCS_BASE_PATH%\\emulation\\analysis\\bin\\TraceCntrl_DefaultSettings_ETB.xml" -receiver "ETB" -triggerfile "%CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\C64xp\\CortexA8\\Arm_Trace_On.xml" -outfile "%CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\Examples\\Omap3430TraceOn560ETBTest.txt" -app "%CCS_BASE_PATH%\\scripting\\examples\\CortexA8\\autotest.out" -etbname "Blackhawk USB560-M Emulator_0/CSETB_0"

REM This script is to perform a trace on job on STM in Omap4430 target with ETB as receiver
REM call %CCS_BASE_PATH%\\scripting\\bin\\trace_dss.bat %CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\Examples\\Omap4430_STM_ETB_Tes.js -setupfile "%CCS_BASE_PATH%\\scripting\\examples\\Omap4430\\omap4430_ES1_USB.ccxml" -targetname "Spectrum Digital XDS560V2 STM USB Emulator_0/CortexA9_0" -channelfile "%CCS_BASE_PATH%\\emulation\\analysis\\bin\\TraceCntrl_DefaultSettings_ETB.xml" -receiver "ETB" -triggerfile "%CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\Omap4430\\Stm_SW.xml" -outfile "%CCS_BASE_PATH%\\scripting\\examples\\CtoolTrace\\Examples\\Omap4430_STMSW_ETB_Test.bin" -app "%CCS_BASE_PATH%\\scripting\\examples\\Omap4430\\StmExample_CortexA9.out" "Spectrum Digital XDS560V2 STM USB Emulator_0/CSETB_0" -stmname "Spectrum Digital XDS560V2 STM USB Emulator_0/CSSTM_0"

