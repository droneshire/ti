OVERVIEW
--------
XDS560v2 STM USB/LAN emulation driver update for windows and linux.

WINDOWS INSTRUCTIONS 
******* ************
- The following files are provided as part of the XDS560V2 CCSv4 update.

  <ccsv4_install_dir>\ccsv4\common\uscif
     Sd560v2Config.exe  - SD560V2 emulator port configuration utility
     sd560v2opts.cfg    - SD560V2 emulator port configuration file
     sd560v2u_io.dll    - SD560V2 emulator usb interface driver
     sd560v2e_io.dll    - SD560V2 emulator lan interface driver
     sd560v2u_conf.dll  - SD560V2 emulator usb configuration driver
     sd560v2u_killserver.exe  - SD560V2 emulator server kill utility (used by installer)
     sd560v2u_server.exe  - SD560V2 emulator usb server
     IPTracker.bat       - SD560V2 emulator lan configuration support file
     SD560V2ReadMe.txt   - this file

  <ccsv4_install_dir>\ccsv4\common\uscif\sd560v2_updates
     sd_xds560v2_firmware_2.2.0.1 - Production HW XDS560v2 STM emulator application file system update file 
   
  <ccsv4_install_dir>\ccsv4\common\TargetDB\connections
     SD560V2LAN_Connection.xml - CCSV4 LAN connection file
     SD560V2USB_Connection.xml - CCSV4 USB connection file

- XDS560V2 application file system update.  If you are a beta user you may need to update your
  emulation file system after installing the CCSv4 update. With USB connected to your XDS560V2 STM
  from a command prompt under the <CCSV4_install_dir>\ccsv4\common\uscif execute:
     dtc_conf update sd560v2u 0 sd560v2_updates\application.tar.gz

LINUX INSTRUCTIONS
***** ************
- The following files are provided as part of the XDS560V2 CCSv5 update.

  <ccsv5_install_dir>/ccsv5/ccs_base_5.0.0.xxxxx/common/uscif
     sd560v2config.jar  - SD560V2 emulator port configuration utility
     sd560v2opts.cfg    - SD560V2 emulator port configuration file
     sd560v2u_io.so     - SD560V2 emulator usb interface driver
     sd560v2e_io.so     - SD560V2 emulator lan interface driver
     sd560v2u_conf.so   - SD560V2 emulator usb configuration driver
     sd560v2u_killserver- SD560V2 emulator server kill utility (used by installer)
     sd560v2u_server    - SD560V2 emulator usb server
     IPTracker.sh       - SD560V2 emulator lan configuration support file
     SD560V2ReadMe.txt   - this file

  <ccsv5_install_dir>/ccsv5/ccs_base_5.0.0.xxxxx/common/uscif/sd560v2_updates
     sd_xds560v2_firmware_2.2.0.1 - Production HW XDS560v2 STM emulator application file system update file 
   
  <ccsv5_install_dir>/ccsv5/ccs_base_5.0.0.xxxxx/common/targetdb/connections
     SD560V2LAN_Connection.xml - CCSV4 LAN connection file
     SD560V2USB_Connection.xml - CCSV4 USB connection file

- XDS560V2 application file system update.  If you are a beta user you may need to update your
  emulation file system after installing the CCSv5 update. With USB connected to your XDS560V2 STM
  from a command prompt under the <ccsv5_install_dir>/ccsv5/ccs_base_5.0.0.xxxxx/common/uscif execute:
     ./dtc_conf update sd560v2u 0 sd560v2_updates/application.tar.gz

CCSV4 UPDATE SITE
-----------------
The CCS v4 Private Update site for XDS560V2 is located at:
http://support.spectrumdigital.com/ccs40/PrivateUpdates/

This package includes the standard Spectrum Digital driver install along with additional 
XDS560V2 STM content. You can manaully add this location to your CCS v4 update site list.

ADDITIONAL COMMAND LINE EXAMPLES FOR WINDOWS
---------------------------------------------
The following is a list of useful command line operations using dbgjtag.exe and dtc_conf.exe.
DBGJTAG requires a hex representation of the ip address while dtc_conf 
will take the standard representation. If you do not know the ip address for your 
XDS560v2 STM unit then see the documentation for Sd560v2Config.

Examples for IP address 10.0.3.49 whose hex value is 0x0a000331. 

# USEFULL DBGJTAG COMMANDS OVER ENET AT IP ADDRESS 10.0.3.49
dbgjtag.exe -d sd560v2e -p 0x0a000331 -rv
dbgjtag.exe -d sd560v2e -p 0x0a000331 -S pathlength
dbgjtag.exe -d sd560v2e -p 0x0a000331 -S integrity
dbgjtag.exe -d sd560v2e -p 0x0a000331 -G range, lowest=12MHz,highest=25MHz

# USEFULL DBGJTAG COMMANDS OVER USB AT PORT 0
dbgjtag.exe -d sd560v2u -p 0 -rv
dbgjtag.exe -d sd560v2u -p 0 -S pathlength
dbgjtag.exe -d sd560v2u -p 0 -S integrity
dbgjtag.exe -d sd560v2u -p 0 -G range, lowest=12MHz,highest=25MHz

# XDS560V2 PRODUCTION UNIT FIRMWARE UPDATE
dtc_conf update sd560v2e 10.0.3.49 sd560v2_updates\sd_xds560v2_firmware_2.2.0.1
dtc_conf update sd560v2u 0 sd560v2_updates\sd_xds560v2_firmware_2.2.0.1
 
# XDS560V2 BETA UNIT FIRMWARE UPDATES
dtc_conf update sd560v2e 10.0.3.49 sd560v2_updates\application.tar.gz
dtc_conf update sd560v2u 0 sd560v2_updates\application.tar.gz

ADDITIONAL COMMAND LINE EXAMPLES FOR LINUX
-------------------------------------------
The following is a list of useful command line operations using dbgjtag and dtc_conf.
DBGJTAG requires a hex representation of the ip address while dtc_conf 
will take the standard representation. If you do not know the ip address for your 
XDS560v2 STM unit then see the documentation for Sd560v2Config.

Examples for IP address 10.0.3.49 whose hex value is 0x0a000331. 

# USEFUL DBGJTAG COMMANDS OVER ENET AT IP ADDRESS 10.0.3.49
./dbgjtag -d sd560v2e -p 0x0a000331 -rv
./dbgjtag -d sd560v2e -p 0x0a000331 -S pathlength
./dbgjtag -d sd560v2e -p 0x0a000331 -S integrity
./dbgjtag -d sd560v2e -p 0x0a000331 -G range, lowest=12MHz,highest=25MHz

# USEFULL DBGJTAG COMMANDS OVER USB AT PORT 0
./dbgjtag -d sd560v2u -p 0 -rv
./dbgjtag -d sd560v2u -p 0 -S pathlength
./dbgjtag -d sd560v2u -p 0 -S integrity
./dbgjtag -d sd560v2u -p 0 -G range, lowest=12MHz,highest=25MHz

# XDS560V2 PRODUCTION UNIT FIRMWARE UPDATE
./dtc_conf update sd560v2e 10.0.3.49 sd560v2_updates/sd_xds560v2_firmware_2.2.0.1
./dtc_conf update sd560v2u 0 sd560v2_updates/sd_xds560v2_firmware_2.2.0.1
 
# XDS560V2 BETA UNIT FIRMWARE UPDATES
./dtc_conf update sd560v2e 10.0.3.49 sd560v2_updates/application.tar.gz
./dtc_conf update sd560v2u 0 sd560v2_updates/application.tar.gz

LAUNCHING sd560v2config utility from Linux
-------------------------------------------
From the command line,
	$ cd <ccsv5_install_dir>/ccsv5/ccs_base_5.0.0.xxxxx/common/uscif
        $ ../../../eclipse/jre/bin/java -jar sd560v2config.jar