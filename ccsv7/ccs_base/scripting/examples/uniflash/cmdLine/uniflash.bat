@echo off
SETLOCAL
SETLOCAL ENABLEDELAYEDEXPANSION

REM Set UNIFLASH_PATH (used by the main.js script)
set UNIFLASH_PATH=%~dp0

REM Set the DSS and DebugServer Root
set DEBUGSERVER_ROOT=%~dp0..\..\..\..\DebugServer

REM add path to Windows 32-bit on Windows 64-bit (WOW64) folder for 64bit Windows to use the 32bit applications
if exist "!SYSTEMROOT!\SysWOW64\" set PATH=!SYSTEMROOT!\SysWOW64\;!PATH!

REM Set PATH to Java
set PATH=!DEBUGSERVER_ROOT!\..\..\eclipse\jre\bin;!PATH!

REM Set DSS_LIB_PATH
set DSS_LIB_PATH=!DEBUGSERVER_ROOT!\packages\ti\dss\java

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
if not exist "!%DEBUGSERVER_ROOT!\bin" goto invalidpath

REM turn off trace
SET LD_LIBRARY_PATH=1

REM Set full path to script
SET UNIFLASH_JS=%~dp0uniFlash_main.js

REM Run generic loader.
CMD /C java.exe -DXPCOM.RUNTIME="!DEBUGSERVER_ROOT!\bin" -cp "!RHINO_JAR!;!SCRIPTING_JAR!" !RHINO_SHELL! "!UNIFLASH_JS!" %*

REM Done.
goto eof

:invalidpath
@echo "%DEBUGSERVER_ROOT% does not point to a valid DSS DebugServer installation"

:eof

ENDLOCAL
