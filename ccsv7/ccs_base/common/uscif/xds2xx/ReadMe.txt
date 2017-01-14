=========================================================================
xds2xx_conf Utility for the XDS200
=========================================================================
This utility allows you update the firmware and to customize certain 
features of the XDS200.

An update script is provided to update the firmware:

On Windows, execute the following command --
update_xds2xx.bat xds200

On Linux or Mac OS X, execute the following command --
update_xds2xx.sh xds200

Note: This utility does not support connections over Ethernet to the 
      XDS220 debug probe.  To update your XDS220, you must use the tools 
      and firmware supplied by the manufacturer.  Other features of this
      utility will work with an XDS220 when using a USB connection.

>xds2xx_conf.exe -h
-------------------------------------------------------------------------
XDS2XX Configuration utility
(C) Copyright 2015 by Texas Instruments, Inc. All rights reserved.

USAGE:

   xds2xx_conf.exe  [-v] [-e] [--version] [-h] <command> <arg> ...
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
    boot       Boot the XDS2XX Emulator
    update     Update firmware
    program    Program Xilinx CPLD.

COMMAND SYNTAX :
    get        <adapter> <address> [name1 .. nameN]
    set        <adapter> <address> <name1=value1> [.. nameN=valueN]
    boot       <adapter> <address>
    update     <adapter> <address> <path-to-firmware>
    program    <adapter> <address> <path-to-cpld-firmware>

    <adapter> is always xds2xxu for USB adapter. Ethernet is not
    supported by this version.

    <address> is the port number address. Using 0 for <address>
    always means to use the first XDS2XX found. 

        On Windows, use 0xC0nn for <address> where nn is the hex 
        value of the XDS2xx Emulator COM port. For example, if the 
        COM port is COM21:, then use 0xC015 for <address>.

        On Linux, use 0xC0nn for <address> where nn is the hex 
        value of the ttyACM device number. XDS2xx will always 
        create a pair of ttyACM entries; use the lower numbered
        one. For example, if the XDS2xx is /dev/ttyACM0, then use
        0xC000 for <address>.

        On Mac OS X, use 0xnnnn for <address> where nnnn is the 
        hex value of the tty.usbmodem device number.  XDS2xx will 
        always create a pair of tty.usbmodem entries; use the lower
        numbered one.  For example, if the XDS2xx entry is
        /dev/tty.usbmodem1421, then use 0x1421 for <address>. (The
        number following usbmodem is a hex number.)        

-------------------------------------------------------------------

EXAMPLE 1 - Use USB to display current value of all variables
    xds2xx_conf get xds2xxu 0

EXAMPLE 2 - Use USB to display the current IP address
    xds2xx_conf get xds2xxu 0 ipAddress

EXAMPLE 3 - Use USB to configure networking for a static IP address
    xds2xx_conf set xds2xxu 0 ipConfig=<ip-address>

EXAMPLE 4 - Use USB to configure networking for DHCP
    xds2xx_conf set xds2xxu 0 ipConfig=dhcp

EXAMPLE 5 - Use USB to program CPLD
    xds2xx_conf program xds2xxu 0 mycpldfirmware.xsvf

EXAMPLE 6 - Use USB to enable serial number for multi-emulator support
    xds2xx_conf set xds2xxu 0 EnableUSBSerial=true

-------------------------------------------------------------------

** The boot command is only supported in in firmware version 1.0.0.4
   and higher.  If your firmware version is older then you must first
   do an update and then power cycle the emulator.  If your firmware
   is 1.0.0.4 or later then you can update by running:

   xds2xx_conf update xds2xxu 0 xds200_firmware_v1008.bin
   xds2xx_conf boot xds2xxu 0

   The whole process may take 15 seconds to update the firmware,
   reboot, and re-establish the USB connection.
