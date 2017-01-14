=========================================================================
HISTORY
=========================================================================
07-DEC-2013
- Update xds2xx firmware to version 1.0.0.6
  xds200     - sd_xds200_firmware_v1006.bin
  xds220     - sd_xds220_firmware_v1006.bin
  xds220 iso - sd_xds220_iso_firmware_v1006.bin

31-May-2013
- Added Cortex SWD support.  This requires a CPLD and firmware update
  to the XDS200 and XDS220.

   CPLD     : xds2xx_xc64_swd.xsvf
   FIRMWARE : sd_xds200_firmware_v1005.bin
   To update XDS200 or XDS220 (not ISO)
       xds2xx_conf update  xds2xxu 0 sd_xds200_firmware_v1005.bin
       xds2xx_conf program xds2xxu 0 xds2xx_xc64_swd.xsvf
       xds2xx_conf boot xds2xxu 0

   OR Run the update batch with appropriate emulator selected
         update_xds2xx xds200   :For XDS200
         update_xds2xx xds220   :For XDS220

   See details below on the boot command.

   DO NOT APPLY TO XDS220-ISO.  THE ISO VERSION IS JTAG ONLY AND DOES NOT
   SUPPORT SWD, UART OR CJTAG. IT USES A DIFFERENT CPLD AND PROGRAMMING 
   WITH xds2xx_xc64_swd.xsvf OR xds2xx_xc64.xsvf MAY HAVE ADVERSE SIDE
   EFFECTS.

=========================================================================
XDS2xx Utility Files
=========================================================================
xds2xx_xc64.xsvf   - XDS200 and XDS220 CPLD image file

xds2xx_usbconf     - XDS200 and XDS220 usb configuration support dll

xds2xx_enetconf     - XDS200 and XDS220 usb configuration support dll

xds2xx_portchk.exe  - XDS200 and XDS220 Windows COM port check utility

xds2xx_currentmeasure - XDS220 current measurement utility

xds2xx_conf           - XDS200 and XDS220 configuration utility

sd_xds220_firmware_v1004.bin - xds220 firmware version 1.0.0.4
 
sd_xds200_firmware_v1004.bin - xds200 firmware version 1.0.0.4

app_currentmeasure.bin   - XDS220 current measurement application, 
                           runs on the emulator

app_cpld.bin - XDS200 and XDS220 cpld programming application, 
               runs on the emulator

=========================================================================
UTILITY - xds2xx_portchk
=========================================================================
In Windows run "xds2xx_portchk" with the XDS2xx connected to see which 
communications port Windows has assigned.

-------------------------------------------------------------------
-- xds2xx_portchk
-- 
  Enumerated:  XDS2xx Emulator CDC Serial Port (COM3)
               CCS Port Address (Specific): 0xc003
               CCS Port Address (Generic) : 0

  Found 1 XDS2xx Emulators Connected

=========================================================================
UTILITY - xds2xx_conf
=========================================================================
This utility allows you to customize certain features of the XDS2xx and 
to obtain the DHCP assigned IP Address for the XDS220.

-------------------------------------------------------------------------
-- xds2xx_conf -h  for help
-- 
  XDS2XX Configuration utility, (C) Copyright 2012 by Spectrum Digital.
  All rights reserved.

  USAGE:

     xds2xx_conf  [-v] [-e] [--version] [-h] <command> <arg> ...
     -v,  --verbose
       enable verbose output

     -e,  --examples
       display examples

     --version
       Displays version information and exits.

     -h,  --help
       Displays usage information and exits.

     <command>
       (required)  the command to run

     <arg>  (accepted multiple times)
       the command arguments



  COMMAND DESCRIPTION :
    get        Returns the values of 1 or more variables
    set        Set the values of 1 or more variables
  **boot       Boot the XDS2XX Emulator
    update     Update firmware
    program    Program Xilinx CPLD.


  COMMAND SYNTAX :
    get        <adapter> <address> [name1 .. nameN]
    set        <adapter> <address> <name1=value1> [.. nameN=valueN]
    boot       <adapter> <address>
    update     <adapter> <address> <path-to-firmware>
    program    <adapter> <address> <path-to-cpld-firmware>

-------------------------------------------------------------------------
-- xds2xx_conf -e                   for examples
--  
  EXAMPLE 1 - Use USB to display the current IP address
    xds2xx_conf get xds2xxu 0 ipAddress

  EXAMPLE 2 - Use USB to configure networking for a static IP address
    xds2xx_conf set xds2xxu 0 ipConfig=<ip-address>

  EXAMPLE 3 - Use USB to configure networking for DHCP
    xds2xx_conf set xds2xxu 0 ipConfig=dhcp

  EXAMPLE 5 - Use Ethernet to display all the settings
    xds2xx_conf get xds2xxe <ip-address>

  EXAMPLE 6 - Use Ethernet to update the firmware
    xds2xx_conf update xds2xxe <ip-address> c:\tmp\myfirmware.bin

  EXAMPLE 7 - Use USB to program CPLD
    xds2xx_conf program xds2xxu 0 c:\tmp\mycpldfirmware.xsvf

  EXAMPLE 8 - Use USB to enable serial number for multi-emulator support
    xds2xx_conf set xds2xxu 0 EnableUSBSerial=true


** The boot command is only supported in in firmware version 1.0.0.4
   and higher.  If your firmware version is older then you must first
   do an update and then power cycle the emulator.  If your firmware
   is 1.0.0.4 or later then you can update by running:

   xds2xx_conf update xds2xxu 0 sd_xds200_firmware_v1004.bin
   xds2xx_conf boot xds2xxu 0

   The whole process may take 15 seconds to update the firmware,
   reboot, and re-establish the USB and or ENET connection.

   The firmware is emulator specific as each emulator has it's own
   feature set.  However there are no checks made to prevent loading
   the incorrect firmware. This allows generic use of this utility
   on XDS2xx products that have followed the EPK design. The firmware
   update does NOT modify the parameter block which may be vendor
   specific.

-------------------------------------------------------------------
-- xds2xx_conf get xds2xxu 0        get all the current settings
-- 

  boardRev=1
  ipAddress=10.0.3.21
  ipConfig=dhcp
  ipGateway=0.0.0.0
  ipNetmask=0.0.0.0
  productClass=XDS2XX
  productName=XDS220
  serialNum=00:0E:99:03:92:04
  swRev=1.0.0.4
  hostCPU=AM1802
  emuCtrlType=Bit bang
  extMemType=SDRAM
  portUSB=true
  portENET=true
  portWIFI=false
  portRS232=false
  EnableUSBSerial=false
  CurrentMeasure=true

=========================================================================
UTILITY - xds2xx_currentmeasure
=========================================================================
This utility allows the monitoring of two simple current measurement 
channels and control of the variable voltage output.

xds2xx_currentmeasure   no options for details

See the Spectrum Digital XDS200 support page for latest examples and 
details on current measurement.
