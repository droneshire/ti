@echo off

REM Three sample scripts which perform basic memory and breakpoint operations
REM on a C6416.

cmd /c "%~dp0..\..\bin\dss" Memory.js
cmd /c "%~dp0..\..\bin\dss" MemoryDump.js
cmd /c "%~dp0..\..\bin\dss" Breakpoints.js