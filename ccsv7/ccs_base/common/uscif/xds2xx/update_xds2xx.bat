@echo off

if "%1" == "xds200" (
    goto XDS200
) else if "%1" == "xds220" (
    echo ERROR: Do not run this script on an XDS220.
    echo Use the tools and firmware supplied by the manufacturer.
    goto END 
) else  (
    echo ERROR: Unknown option "%1".
    echo The only valid option is xds200.
    echo Do not run this script on an XDS220.
    goto END
)

:XDS200
if exist xds200_firmware_v1008.bin (
    echo .
    echo Updating Firmware ...
    xds2xx_conf update  xds2xxu 0 xds200_firmware_v1008.bin
    echo .
    echo Rebooting, please wait ...
    xds2xx_conf boot xds2xxu 0
)

if exist xds200_cpld_v1008.xsvf (
   echo .
   echo Updating CPLD ...
   xds2xx_conf program xds2xxu 0 xds200_cpld_v1008.xsvf
)

if exist xds200_firmware_v1008.bin (
    echo .
    echo Reading Configuration ...
    echo .
    echo Check swRev is 1.0.0.8 or higher
    echo .
    xds2xx_conf get xds2xxu 0
    echo .
)
goto END

:END
pause
