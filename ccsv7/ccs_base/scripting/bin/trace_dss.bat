@echo off
REM *************************************************************************
REM This script is used to run JavaScript-based DSS scripts.
REM
REM It does this by setting up the necessary environment and invoking the
REM Rhino Javascript engine.
REM
REM Usage: dss DSS_JAVASCRIPT_FILE [ARGUMENTS]...
REM
REM Run JavaScript DSS script DSS_JAVASCRIPT_FILE, with ARGUMENT(s) passed to
REM it.
REM *************************************************************************

setlocal ENABLEDELAYEDEXPANSION

REM This path to point to the absolute install location of the Debug Server.
REM We're going to use the DOS macro %~dp0 which always points to the
REM absolute path of this batch file, no matter where on the system this
REM batch file is called from.
set DEBUGSERVER=%~dp0..\..\DebugServer
if not exist "!DEBUGSERVER!" set DEBUGSERVER=%~dp0..\..\xulrunner

REM Path to necessary binaries
set PATH=!DEBUGSERVER!\..\..\eclipse\plugins\com.ti.dvt.ofssymbolmanager_1.0.0;!PATH!
set PATH=!DEBUGSERVER!\..\..\eclipse\plugins\com.ti.dvt.tidisassembly_1.0.0\os\win32;!PATH!

REM These are newly added lines to support CToolsTraceScripting.dll
set PATH=!DEBUGSERVER!\..\emulation\analysis\bin;!PATH!
set Trace_PATH = !DEBUGSERVER!\..\emulation\analysis\bin;
set CCS_V4_CTOOLSCRIPT_DIR=!DEBUGSERVER!\..\

REM Trace Script JAR file location
set Trace_JAR="!DEBUGSERVER!\..\emulation\analysis\bin\ctoolstraceScripting.jar"

REM Path to Rhino JAR File
set RHINO_JAR="!DEBUGSERVER!\packages\ti\dss\java\js.jar"

REM Path to DVT Scripting JAR File
set DVT_SCRIPTING_JAR="!DEBUGSERVER!\..\dvt\scripting\dvt_scripting.jar"

REM Path to DebugServer JAR File
set SCRIPTING_JARS="!DEBUGSERVER!\packages\ti\dss\java\dss.jar"


REM Set parameters to be passed to the script.
REM Need to do it this way to use SHIFT to overcome limitation to handle
REM parameters up to only %9.
REM Support up to max of 40 parameters. Increase as needed.
SET PARAM01=%1
SET PARAM02=%2
SET PARAM03=%3
SET PARAM04=%4
SET PARAM05=%5
SET PARAM06=%6
SET PARAM07=%7
SET PARAM08=%8
SET PARAM09=%9
SHIFT
SET PARAM10=%9
SHIFT
SET PARAM11=%9
SHIFT
SET PARAM12=%9
SHIFT
SET PARAM13=%9
SHIFT
SET PARAM14=%9
SHIFT
SET PARAM15=%9
SHIFT
SET PARAM16=%9
SHIFT
SET PARAM17=%9
SHIFT
SET PARAM18=%9
SHIFT
SET PARAM19=%9
SHIFT
SET PARAM20=%9
SHIFT
SET PARAM21=%9
SHIFT
SET PARAM22=%9
SHIFT
SET PARAM23=%9
SHIFT
SET PARAM24=%9
SHIFT
SET PARAM25=%9
SHIFT
SET PARAM26=%9
SHIFT
SET PARAM27=%9
SHIFT
SET PARAM28=%9
SHIFT
SET PARAM29=%9
SHIFT
SET PARAM30=%9

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

REM If the user chose to install the JRE with this DSS install - use that JRE. 
if exist "!DEBUGSERVER!\..\jre" (
  set JAVA_HOME=!DEBUGSERVER!\..\jre
  set PATH=!DEBUGSERVER!\..\jre\bin;!PATH!
  goto LAUNCH_SCRIPT
)

REM If this CCS (rather than stand-alone DSS) the installed jre is in
REM \eclipse\jre
if exist "!DEBUGSERVER!\..\..\eclipse\jre" (
  set JAVA_HOME=!DEBUGSERVER!\..\..\eclipse\jre
  set PATH=!DEBUGSERVER!\..\..\eclipse\jre\bin;!PATH!
  goto LAUNCH_SCRIPT
)

REM Launch Rhino script engine.  Import the scripting package.
:LAUNCH_SCRIPT
java.exe -Xms40m -Xmx384m -cp !RHINO_JAR!;!SCRIPTING_JARS!;!DVT_SCRIPTING_JAR!;!Trace_JAR! !RHINO_SHELL! !PARAM01! !PARAM02! !PARAM03! !PARAM04! !PARAM05! !PARAM06! !PARAM07! !PARAM08! !PARAM09! !PARAM10! !PARAM11! !PARAM12! !PARAM13! !PARAM14! !PARAM15! !PARAM16! !PARAM17! !PARAM18! !PARAM19! !PARAM20! !PARAM21! !PARAM22! !PARAM23! !PARAM24! !PARAM25! !PARAM26! !PARAM27! !PARAM28! !PARAM29! !PARAM30!

endlocal
