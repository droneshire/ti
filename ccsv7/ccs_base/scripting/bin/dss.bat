@echo off
REM *************************************************************************
REM This script is used to run JavaScript-based DSS scripts.
REM
REM If eclipsec.exe is present, it will use the headless script launcher
REM to run the script
REM
REM Otherwise, it does this by setting up the necessary environment and invoking the
REM Rhino Javascript engine.
REM
REM Usage: dss DSS_JAVASCRIPT_FILE (to use the Rhino Shell)
REM		   dss -dss.debug DSS_JAVASCRIPT_FILE (to use the Rhino Debugger, if eclipsec.exe is present)
REM
REM *************************************************************************

setlocal ENABLEDELAYEDEXPANSION

set DEBUGSERVER=%~dp0..\..\DebugServer

if not exist "!DEBUGSERVER!\..\..\eclipse\eclipsec.exe" (
	REM if eclipsec.exe is not present, use the old way of launching the script 
	goto LAUNCH_DSS_SCRIPT
)

REM determine if we are using Rhino debugger
set NeedDebug=0
if %1 == -dss.debug set NeedDebug=1

REM loop code for determine the string of arguments after the first one (used for removing the -dss.debug if present
SHIFT
set ArgsAfterFirst=%1

:ArgLoop
	if "%2" == "" goto EndArgLoop
	set ArgsAfterFirst=%ArgsAfterFirst% %2
	SHIFT
	goto ArgLoop
:EndArgLoop

REM use the new headless script launcher
:LAUNCH_IDE_SCRIPT
if %NeedDebug% == 1 (
	!DEBUGSERVER!\..\..\eclipse\eclipsec.exe -nosplash -application com.ti.ccstudio.apps.runScript -product com.ti.ccstudio.branding.product -dss.debug -dss.rhinoArgs "%ArgsAfterFirst%"
) else (
	!DEBUGSERVER!\..\..\eclipse\eclipsec.exe -nosplash -application com.ti.ccstudio.apps.runScript -product com.ti.ccstudio.branding.product -dss.rhinoArgs "%*"
)

goto THEEND

:LAUNCH_DSS_SCRIPT

REM Path to Rhino JAR File
set RHINO_JAR="!DEBUGSERVER!\packages\ti\dss\java\js.jar"

REM Path to DVT Scripting JAR File
set DVT_SCRIPTING_JAR="!DEBUGSERVER!\..\dvt\scripting\dvt_scripting.jar"

REM Path to DebugServer JAR File
set SCRIPTING_JARS="!DEBUGSERVER!\packages\ti\dss\java\dss.jar"

REM If this is CCS (rather than stand-alone DSS) also add Eclipse's Equinox Launcher JAR to to the classpath
REM (need to modify to match the version of the JAR of the current version in Eclipse
if exist "!DEBUGSERVER!\..\..\eclipse\plugins\org.eclipse.equinox.launcher_1.2.0.v20110502.jar" (
	set SCRIPTING_JARS=!SCRIPTING_JARS!;"!DEBUGSERVER!\..\..\eclipse\plugins\org.eclipse.equinox.launcher_1.2.0.v20110502.jar"
)

REM Name of Rhino Shell Java Application
set RHINO_SHELL=org.mozilla.javascript.tools.shell.Main

REM Name of Rhino Debugger Java Application
set RHINO_DEBUGGER=org.mozilla.javascript.tools.debugger.Main

REM add path to Windows 32-bit on Windows 64-bit (WOW64) folder for 64bit Windows to use the 32bit applications.
if exist "!SYSTEMROOT!\SysWOW64\" set PATH=!SYSTEMROOT!\SysWOW64\;!PATH!
 
:SETUP_JRE_PATH
REM If the user chose to install the JRE with this DSS install - use that JRE. 
if exist "!DEBUGSERVER!\..\jre" (
	set JAVA_HOME=!DEBUGSERVER!\..\jre
	set PATH=!DEBUGSERVER!\..\jre\bin;!PATH!
	goto LAUNCH_SCRIPT
)

REM If this CCS (rather than stand-alone DSS) the installed jre is in \eclipse\jre
if exist "!DEBUGSERVER!\..\..\eclipse\jre" (
	set JAVA_HOME=!DEBUGSERVER!\..\..\eclipse\jre
	set PATH=!DEBUGSERVER!\..\..\eclipse\jre\bin;!PATH!
	goto LAUNCH_SCRIPT
)

REM Launch Rhino script engine.  Import the scripting package.
:LAUNCH_SCRIPT
java.exe -Xms40m -Xmx384m -cp !RHINO_JAR!;!SCRIPTING_JARS!;!DVT_SCRIPTING_JAR! !RHINO_SHELL! %1 %2 %3 %4 %5 %6 %7 %8 %9

:THEEND
endlocal
