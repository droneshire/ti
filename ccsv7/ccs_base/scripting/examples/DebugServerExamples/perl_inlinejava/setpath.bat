@echo off
REM
REM File: setpath.bat
REM
REM This batch file will set up the environment to run DSS with Perl 
REM Inline::Java. Contents of this batch file must be modified to match the 
REM user's environment
REM

REM ============================================================================
REM Modify these paths to match the user's environment.

REM Root DSS install location
set DSS_ROOT=C:\Program Files\Texas Instruments\ccsv6

REM Root JDK install location
set PERL_INLINE_JAVA_J2SDK=C:\Program Files\Java\jdk1.5.0_08

REM ============================================================================

REM Set PATH
set PATH=%DSS_ROOT%\ccs_base\DebugServer\packages\ti\dss\java;%PATH%
set PATH=%DSS_ROOT%\ccs_base\DebugServer\bin;%PATH%
set PATH=%DSS_ROOT%\ccs_base\common\bin;%PATH%
set PATH=%DSS_ROOT%\ccs_base\common\uscif;%PATH%
set PATH=%DSS_ROOT%\eclipse\plugins\com.ti.dvt.ofssymbolmanager_1.0.0;%PATH%
set PATH=%DSS_ROOT%\eclipse\plugins\com.ti.dvt.tidisassembly_1.0.0\os\win32;%PATH%

REM Set CLASSPATH
set CLASSPATH=%CLASSPATH%;%DSS_ROOT%\ccs_base\DebugServer\packages\ti\dss\java\dss.jar;%DSS_ROOT%\ccs_base\dvt\scripting\dvt_scripting.jar
