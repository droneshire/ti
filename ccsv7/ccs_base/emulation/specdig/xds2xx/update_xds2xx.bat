echo off

if "%1" == "xds200" (
    goto XDS200
) else if "%1" == "xds220" (
    goto XDS220
) else  (
    echo ERROR: unknown option "%1"
    echo Valid options are xds200 or xds220
    echo DO NOT RUN THIS ON XDS220 ISO
    goto END
)

:XDS200
if exist xds2xx_xc64_swd.xsvf (
   echo Updating CPLD
   xds2xx_conf program xds2xxu 0 xds2xx_xc64_swd.xsvf
)

if exist sd_xds200_firmware_v1008.bin (
    echo .
    echo Updating Firmware
    xds2xx_conf update  xds2xxu 0 sd_xds200_firmware_v1008.bin
    echo .
    echo Rebooting
    xds2xx_conf boot xds2xxu 0
    echo .
    echo Reading Configuration
    echo .
    echo Check swRev is 1.0.0.8 or higher
    echo .
    xds2xx_conf get xds2xxu 0
)
goto END

:XDS220
if exist xds2xx_xc64_swd.xsvf (
   echo Updating CPLD
   xds2xx_conf program xds2xxu 0 xds2xx_xc64_swd.xsvf
)

if exist sd_xds220_firmware_v1008.bin (
    echo .
    echo Updating Firmware
    xds2xx_conf update  xds2xxu 0 sd_xds220_firmware_v1008.bin
    echo .
    echo Rebooting
    xds2xx_conf boot xds2xxu 0
    echo .
    echo Reading Configuration
    echo .
    echo Check swRev is 1.0.0.8 or higher
    echo .
    xds2xx_conf get xds2xxu 0
)
goto END

:END
pause