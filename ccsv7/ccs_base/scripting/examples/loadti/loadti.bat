@echo off
SETLOCAL

setlocal ENABLEDELAYEDEXPANSION

REM ===========================================================================
REM This batch file executes LoadTI for DSS for Windows.
REM ===========================================================================

REM ===========================================================================
REM Do not edit the lines below.
REM ===========================================================================

REM Set the DSS and DebugServer Root.
set DEBUGSERVER_ROOT=%~dp0..\..\..\DebugServer
set DSS_ROOT=!DEBUGSERVER_ROOT!\..

REM add path to Windows 32-bit on Windows 64-bit (WOW64) folder for 64bit Windows to use the 32bit applications.
if exist "!SYSTEMROOT!\SysWOW64\" set PATH=!SYSTEMROOT!\SysWOW64\;!PATH!

REM Set PATH to Java
set PATH=!DEBUGSERVER_ROOT!\..\jre\bin;!DEBUGSERVER_ROOT!\..\..\eclipse\jre\bin;!PATH!

REM Set LOADTI_PATH.
set LOADTI_PATH=%~dp0

REM Set DSS_LIB_PATH.
set DSS_LIB_PATH=!DEBUGSERVER_ROOT!\packages\ti\dss\java

REM Set full path to script
SET LOADTI_JS=%~dp0main.js

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
SHIFT
SET PARAM31=%9
SHIFT
SET PARAM32=%9
SHIFT
SET PARAM33=%9
SHIFT
SET PARAM34=%9
SHIFT
SET PARAM35=%9
SHIFT
SET PARAM36=%9
SHIFT
SET PARAM37=%9
SHIFT
SET PARAM38=%9
SHIFT
SET PARAM39=%9
SHIFT
SET PARAM40=%9

REM Set path to Rhino JAR File.
set RHINO_JAR=!DSS_LIB_PATH!\js.jar

REM Set path to DSS JAR File.
set SCRIPTING_JAR=!DSS_LIB_PATH!\dss.jar

REM Set name of Rhino Shell Java Application.
set RHINO_SHELL=org.mozilla.javascript.tools.shell.Main

REM Set name of Rhino Debugger Java Application.
set RHINO_DEBUGGER=org.mozilla.javascript.tools.debugger.Main

REM Path validation.
if not exist "!DEBUGSERVER_ROOT!" goto invalidpath
if not exist "!DEBUGSERVER_ROOT!\bin" goto invalidpath
if not exist "!DEBUGSERVER_ROOT!\components" goto invalidpath

REM Run generic loader.
CMD /C java.exe -cp "!RHINO_JAR!;!SCRIPTING_JAR!" !RHINO_SHELL! "!LOADTI_JS!" %PARAM01% %PARAM02% %PARAM03% %PARAM04% %PARAM05% %PARAM06% %PARAM07% %PARAM08% %PARAM09% %PARAM10% %PARAM11% %PARAM12% %PARAM13% %PARAM14% %PARAM15% %PARAM16% %PARAM17% %PARAM18% %PARAM19% %PARAM20% %PARAM21% %PARAM22% %PARAM23% %PARAM24% %PARAM25% %PARAM26% %PARAM27% %PARAM28% %PARAM29% %PARAM30% %PARAM31% %PARAM32% %PARAM33% %PARAM34% %PARAM35% %PARAM36% %PARAM37% %PARAM38% %PARAM39% %PARAM40%

REM Done.
goto eof

:invalidpath
@echo "%DEBUGSERVER_ROOT% does not point to a valid DSS DebugServer installation"

:eof

ENDLOCAL
if "%EXIT_LOADTI_WITH_ERRORLEVEL%"=="1" exit %errorlevel%
