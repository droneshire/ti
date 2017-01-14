@echo off

set PATH=%~dp0\util;%PATH%

if not exist "%windir%\system32\reg.exe" goto QUERY_BITSIZE_DONE
if not exist "%windir%\system32\find.exe" goto QUERY_BITSIZE_DONE
"%windir%\system32\reg" Query "HKLM\Hardware\Description\System\CentralProcessor\0" | "%windir%\system32\find" /i "x86" > NUL && set OS_BIT_SIZE=32||set OS_BIT_SIZE=64
:QUERY_BITSIZE_DONE

if "%1"=="not_chrome" goto NOT_CHROME else goto CHROME

:CHROME

"%~dp0/node.exe" "%~dp0/src/main_chrome.js" %*
goto END

:NOT_CHROME

"%~dp0/node.exe" "%~dp0/src/main.js" %*

:END

