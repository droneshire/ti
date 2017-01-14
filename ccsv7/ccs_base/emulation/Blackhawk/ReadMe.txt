Blackhawk(tm) CCS v6 Emulation Drivers

===================================
Blackhawk

123 Gaither Drive
Mount Laurel, New Jersey 08054-1701

Tel: +1 (856) 234-2629

http://www.blackhawk-dsp.com
===================================
2016 (c) EWA Technologies, Inc.


=> VERSION

6.0.83.003              12 July 2016


=> WHAT's NEW

Built using InstallBuilder Version: 16.1.0 (2016-01-26)

[WIN32 and LINUX Updates]
	- Removed old driver files nuot in EPK 6.0.83.0
		(55xp and arm11)

	
=> HISTORY 

6.0.83.001              21 March 2016
[WIN32 and LINUX Updates]
	- EPK 6.0.83.0 Driver Updates.
	- BH560v2Config Utlity Updated for modified dbgjtag 
		command line options.

[LINUX Updates]
	- Preliminary 64-bit Updates for Linux Distro.

6.0.0.347              18 November 2015
[WIN32 and LINUX Updates]
	- No changes.
	
[WIN32 Updates]
	- No Changes.

[LINUX Updates]
	- Preserve original uscif.out file on uninstall 
		(this fixes bug in previous update)

6.0.0.346              13 November 2015
[WIN32 and LINUX Updates]
	- No changes.
[WIN32 Updates]
	- No Changes.
[LINUX Updates]
	- Remove uscif.out file.

6.0.0.345              11 November 2015
Built using InstallBuilder Version: 8.6.0 (2013-06-26)
[WIN32 and LINUX Updates]
	- No changes.
	
[WIN32 Updates]
	- Updated XDS510 DVR files - removed RTDX references.

[LINUX Updates]
	- Fixed Rules file installation when running CCS setup as root.

	
6.0.0.344              21 May 2014
Built using InstallBuilder Version: 8.6.0 (2013-06-26)

[WIN32 and LINUX Updates]
	- Updated XDS510 XML file to support Cortex_R5 ISA.
[WIN32 Updates]
	- No changes.
[LINUX Updates]
	- Updated F28x DVR with ICEPICK_C Optimization (i.e. F28377D).

6.0.0.343              18 April 2014
Built using InstallBuilder Version: 8.6.0 (2013-06-26)

[WIN32 and LINUX Updates]
	- No changes.
[WIN32 Updates]
	- Updated F28x DVR with ICEPICK_C Optimization (i.e. F28377D).
[LINUX Updates]
	- No changes.

6.0.0.342              03 March 2014
Built using InstallBuilder Version: 8.6.0 (2013-06-26)

[WIN32 and LINUX Updates]
	- No changes.
[WIN32 Updates]
	- Updated Windows Device Driver installer v1.14.03.03.
[LINUX Updates]
	- No changes.


6.0.0.341              02 December 2013
Built using InstallBuilder Version: 8.6.0 (2013-06-26)
[WIN32 and LINUX Updates]
	- No changes.
[WIN32 Updates]
	- No Changes.
[LINUX Updates]
	- Fixed permissions (+rw) on install log.


6.0.0.340              27 November 2013
Built using InstallBuilder Version: 8.6.0 (2013-06-26)
[WIN32 and LINUX Updates]
	- Updated XDS510-class JSC library to match TI Emulation Update 5.1.340.0.
[WIN32 Updates]
	- This TI EPK change affected files bhemujsc.dll and bhemujscl.dll.
[LINUX Updates]
	- This TI EPK change affected file libbhemujscl.so.

6.0.0.102              14 November 2013
Built using InstallBuilder Version: 8.6.0 (2013-06-26)
[WIN32 and LINUX Updates]
	- Fixed Bh560v2Config Utility links to help documentation.
	- Removed Desktop shortcut for Bh560v2Config Guide.
[WIN32 Updates]
	- No other changes.
[LINUX Updates]
	- Fixed if condition in bh560v2-help.sh trying to open 
		browser multiple times.

6.0.0.101              28 October 2013
Built using InstallBuilder Version: 8.6.0 (2013-06-26)

[WIN32 and LINUX Updates]
	- Removed documents from emulation/Blackhaw/Docs folder
		Replaced with HTML file and link to Blackhawk website
			documentation page.
	- USB200 driver XML files updated to include support new 
		ICEPICK-based devices.  These include XML updates to:
		cs_child, cs_dap, dap_pc, and icepick_c
		(cortexM was also updated for Concerto).
	- XDS510 driver XML files for CLA updated to include CLA1
		This change also applies to USB2000.
	
[WIN32 Updates]
	- Removed BhProbe.2 Utility folder.
	
[LINUX Updates]
	- No other changes.

6.0.0.100              10 September 2013
Built using InstallBuilder Version: 8.6.0 (2013-06-26)
Updated installer to InstallBuilder.
Combined ReadMe files for Windows and Linux distributions.

[WIN32 Updates]
	- Updated Windows device driver package to v1.13.08.13.
	
[LINUX Updates]
	- Fixed Bh560v2Config utility help button to open user guide
		properly across multiple Linux verions and distributions.

5.3.0.208              11 April 2013
Built using IJ v1.2.14 (Build 179889)
Updated to match Linux revision.

5.3.0.207              25 March 2013
Built using IJ v1.2.14 (Build 179889)
Updated Device Driver Package to handle issues with
	C55x and F28x targets and BH-USB-510 product.

5.3.0.206              27 February 2013
Built using IJ v1.2.14 (Build 179889)
Updated Device Driver Package for improvements to USB510W
	and Blackhawk Control Panel (CPL).
Fixed typo in Probe Utility batch file (shift).

5.2.0.205              24 July 2012
Built using IJ v1.2.14 (Build 179889)
Added IJ Patch Information
Updated XDS560 OUT files to EPK v5.0.573.0

5.2.0.204              11 July 2012
Built using IJ v1.2.14 (Build 179889)
Removed/Deleted duplicate driver XML, bhemuetb11.xml.
Updated XSD560v2 firmware
Removed eclipse feature folder contents (not needed for P2)
Updated XDS560 OUT files (correct 2010 date) which caused CCS
	to hang on large program loads

5.2.0.203              24 May 2012
Built using IJ v1.2.14 (Build 179889)
Added missing driver XML files in targetdb for:
	arp32, cortexA15, csstm, etb11, and pru devices/nodes.

5.1.0.202              02 May 2012
Built using IJ v1.2.14 (Build 179889)
Updated device driver installer for USB510W (Wireless)
	DHCP configuration - config utility now displays IP address
	settings when configured for DHCP.
Updated bhemujscl.dll for USB510W to properly parse IP address from
	connection file.

5.1.0.201              10 April 2012
Built using IJ v1.2.14 (Build 179889)
Updated Windows Device Driver Package for Windows x86/x64 platforms
	to include support for USB560v2 System Trace Emulator.

5.1.0.200              08 February 2012
Built using IJ v1.2.14 (Build 179889)
Updated Windows Device Driver Package for Windows x86/x64 platforms
	to include support for USB510W (wireless) emulator.
Updated C55x and C64+ DVR for issues found when porting to Linux.

5.1.0.106              23 December 2011
Built using IJ v1.2.14 (Build 179889)
Updated Windows Device Driver Package for Windows x86/x64 platforms
	to fix an issue with device enumeration and re-enumeration when
	forced by automated scripting prcesses.
Updated Cortex M3 XML File for M4 devices.
Updated Diagnostic Commands that use dbgjtag to include '-o' parameter 
	to eliminate backspace character so command will run properly on Linux
	(Windows x86/x64 is updated as well).

5.1.0.105              03 November 2011
Built using IJ v1.2.14 (Build 179889)
Updated Windows Device Driver Package for Windows x64 platforms
	to fix an issue with PCI where the PC could lock-up 
	depending on the motherboard chipset and Windows Update.
Updated XDS510 DVR files to EPK v5.0.471.0 - (all may not 
	have been previously updated in Sept.)

5.1.0.104              23 September 2011
Built using IJ v1.2.14 (Build 179889)
Modified connection files to include DiagnosticCommand entry
Modified log folder area to begin with "bh_emupack"

5.1.0.103              14 September 2011
Built using IJ v1.2.14 (Build 179889)
Modified XDS560v2 connection files to include
	1149.7 parameters
Updated XDS510 DVR files to match EPK 5.0.471.0
Update Bh560v2Config to v1.0.0.9, which adds
	more dbgjtag test ranges

5.1.0.102              26 August 2011
Built using IJ v1.2.14 (Build 179889)
Modified XDS560 and XDS560v2 connection files for
	default TCLK in "legacy" mode, FALLing edge

5.1.0.101              18 August 2011
Built using IJ v1.2.14 (Build 179889)
Modified XDS560 connection files for legacy mode

5.1.0.100              16 August 2011
Built using IJ v1.2.14 (Build 179889)
Updated Search for JAVA JRE
Updated Bh560v2Config Utility to v1.0.0.8
Updated Bh560v2-USB Mezzanine support files
Updated Device Drivers to v1.11.08.16
	- Fixed issue with devices attached during install


5.1.0.005              15 April 2011
Built using IJ v1.2.14 (Build 179889)
Updated Device Drivers to v1.11.04.12
	- Fixed install issue if previous devices were installed
Remove check for previous installation to allow 
    mutiple CCS installs

5.1.0.003              31 March 2011
Built using IJ v1.2.14 (Build 179889)
Built from 5.0.2.003 installer

5.0.2.003              31 March 2011
Built using IJ v1.2.14 (Build 179889)
Updated Device Drivers to v1.11.03.29
	- Fixed install issue if previous devices were installed
Added install log generation (not just in debug and test modes)
Updated DVR files to correct linker/path problems with 
	updated Eclipse version
Added install prefix commandline option for eclipse

5.0.2.001              15 March 2011
Built using IJ v1.2.14 (Build 179889)
Built from CCS v4.2.1.002 installer base

4.2.1.002              15 March 2011
Built using IJ v1.2.14 (Build 179889)
Updated Device Drivers to v1.11.03.14 
	- supports Blackhawk XDS560v2 Mezzanine Emulator
	- Fixes STM acknowledgement problem on host
Added timstamp update to install actions
Added XDS560v2 Mezzanine Emulator Files
	- Complete file set

4.2.1.001              08 December 2010
Built using IJ v1.2.14 (Build 179889)
Roll-up of incremental update v4.2.0.9
	into a complete emupack.


4.2.0.9              02 December 2010
Built using IJ v1.2.14 (Build 179889)
Updated XDS560v2 bh560v2e/u_io.dll files to v5.0.161.0
	that were missed in v4.2.0.7/8

4.2.0.8              18 November 2010
Built using IJ v1.2.14 (Build 179889)
This is a patch installer for v4.2.0.[6/7]
Updated JSC DLL files for XDS510 products (fixes
	issues with changes in ARM drivers)
Updated Device Driver installer to v1.10.11.17
	fixes Windows 7 error message processing/status that
	'may' cause BSOD or reboot on certain PCs.

4.2.0.7              01 October 2010
Built using IJ v1.2.14 (Build 179889)
Updated bhemu DVR files to match
	latest EPK and ti emupack v5.0.161.0
Updated bhemu XML driver files.
Updated device driver installation to v1.10.08.12
	- now copies LAN560 config files

4.2.0.6              28 July 2010
Built using IJ v1.2.14 (Build 179889)
Driver XML Updates - to match TI XDS100v2/XDS510 changes.
	Added Files:	bhemu510cortexA9.xml
			bhemu510etbcs.xml
	Updated Files:	bhemu510cortexM.xml
			bhemu510cs_dap.xml
			bhemu510dap_pc.cml
	Removed File:	bhemu6400.xml (R10)


4.2.0.5              09 July 2010
Built using IJ v1.2.14 (Build 179889)
Added Missing LOOPBACK option to XDS560v2 Connection XML files.

4.2.0.4              28 May 2010
Built using IJ v1.2.14 (Build 179889)
Added XDS510 JSC Support (bhemujscl.dll)

4.2.0.3              20 May 2010
Built using IJ v1.2.14 (Build 179889)
Rolled Back from Microsoft.VC80.CRT 8.0.50727.4053 to .762
Removed XDS560v2 OUT files (bh560v2e,u).
XDS560v2 firmware and _io.dll files updated to [EPK] v2.0.4.0
**XDS510 support NOT updated for JSC in this release

4.2.0.2              30 April 2010
Built using IJ v1.2.14 (Build 179889)
Updated Bh560v2Config Utility (v1.0.0.5),
   including documentation
Updates Driver XML files for TargetDB:
   added TraceDeviceId field
   added c66xx,c669x, and icepick_d
   removed 24x and 27x
Fixed feature.xml dependency problems
**XDS510 support NOT updated for JSC in this release

4.2.0.1              12 March 2010
Built using IJ v1.2.14 (Build 179889)
Updated Device Driver install for Bh560v2 device
Added Bh560v2 files (XML, DLL, OUT, Config Utility, etc.)


4.0.1.1              31 December 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Created/Updated Driver XML files for TargetDB to match
   TI CCS v4.0.0 through v4.0.2 - This corrects C28x 
   imports for CLA updates and OMAP L13x imports.


4.0.1.0              02 September 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Original RTM release for CCS v4

4.0.0.21             02 June 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Added Support for UpdateManager 
Removed "configurations" files

4.0.0.20             01 June 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Updated Driver XML Files to include "realtimeEnabled" 
	field (28x,55x,64x,64xp,674x)
Added bhemu674x.xml file to be consistent with TI updates.
Updated XDS560 (and XDS510) Connection files for new parsing scheme.

4.0.0.19             09 April 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Updated Connection XML Files.
Renamed ccxml and xml files to 20pin (not Rev D)

4.0.0.18             30 March 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Corrected connection file location (inadvertently installing to TEMP folder)
Updated Installer for Device drivers v01.09.03.23
    - No actual driver file changes.

4.0.0.17             24 March 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Updated Device drivers to v01.09.03.23
    - Updated CPL for XP Pro x64 to handle old (pre-Vista) runtime DLL
    - Updated Installer to support "/mode Silent"
Updated BHEMUTBCL.DLL to correct SC_ERR_OCS_NUMBER message when 
	multiple USB2000/510L controllers are used simultaneously.

4.0.0.16             05 March 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Created Unique installer ID (GUID)
Modified UNINSTALL to prompt user ("Are you sure you want to uninstall?")
Device Drivers updated to v1.09.01.15 (LAN560 Updates)
Removed pre-defined imports for C28x and C54x devices.

v4.0.0.15
Updated XDS560 imports to use tixds560c64xp.xml file name.  
This version is included in the TI Beta 2 release

v4.0.0.14
Built using InstallJammer v1.2.12.  
Updated  Connection XML files to use "20-pin JTAG Cable", not "Rev.D"
This update may require a certain minimum CCS v4 build.

v4.0.0.13
Updated Installer to support the new, standard ISA="" strings used 
in the targetdb\drivers XML files missed in previous build. 
This update may require a certain minimum CCS v4 build.

v4.0.0.12
Updated Installer to support the new, standard ISA="" strings used 
in the targetdb XML files. 
This update may require a certain minimum CCS v4 build.

v4.0.0.11
Updated Installer to support ISA command line options (noc2400, 
noc2800, noc5400, noc5500, noc6000, noarm, noomap, nodavinci).  
Updated Windows devices drivers.

4.0.0.10
Updated XDS560 Files to USCIF v35.34.0.2 (USCIF Dynamic Loading)

4.0.0.9
Added Components, Groups and Files for target ISA and documentation

4.0.0.8
Updated Connection Files to use id="addrPort1".

v4.0.0.7
Added workaround in configuration .XML files to use "devices.old" folder.

v4.0.0.6
Fixed Typos in installer text strings
Updated Silent Uninstaller feature (/Y) to work as specified by TI

v4.0.0.5
Initial InstallJammer release.
Silent uninstall not configured correctly.
Not all Imports work as expected.

v4.0.0.4
Not released

v4.0.0.3
InstallShield version for CCS v4 Early Adopter
Directory Structure Update

v4.0.0.2
InstallShield version for CCE v4 Early Adopter
Directory Structure Update

v4.0.0.1
InstallShield version for CCE v4 Early Adopter
Directory Structure Update

v4.0.0.1
InstallShield version for CCE v3.x Early Adopter
Initial installer

=> HISTORY (LINUX)

5.3.0.208              11 April 2013
Built using IJ v1.2.14 (Build 179889)
Fixed [5] driver XML path and file names.

5.3.0.207              02 April 2013
Built using IJ v1.2.14 (Build 179889)
Updated to Match Windows Version

5.3.0.206              27 February 2013
Built using IJ v1.2.14 (Build 179889)
Updated/Added Installation Guides to Documentation folder

5.2.0.205              24 July 2012
Built using IJ v1.2.14 (Build 179889)
Added IJ Patch Information
Updated XDS560 OUT files to EPK v5.0.573.0

5.2.0.204              12 July 2012
Built using IJ v1.2.14 (Build 179889)
Added HTML message when installing in user mode (not root or sudo)
	when root is required for device driver updates.
Updated XDS560v2 firmware versions.
Updated XDS560 OUT files (correct 2010 date) which caused CCS
	to hang on large program loads
Removed eclipse feature folder contents (not needed for P2)
Removed Kernel Mode Drivers - replaced with LIBUSB implementation.

5.2.0.203              24 MAY 2012
Built using IJ v1.2.14 (Build 179889)
Added missing driver XML files in targetdb for:
	arp32, cortexA15, csstm, etb11, and pru devices/nodes.

5.1.0.202              23 MAY 2012
Built using IJ v1.2.14 (Build 179889)
Re-Updated 71-bh-permissions.rules file to fix enumeration issues on 
	newer Linux kernels

5.1.0.201              10 APRIL 2012
Built using IJ v1.2.14 (Build 179889)
Updated 71-bh-permissions.rules file to fix enumeration issues on 
	newer Linux kernels
Updated usb_server executable for differences in libusb0.1 and 
	libusb1.0+compatible that prevented threads from exiting

5.1.0.200              06 FEBRUARY 2012
Built using IJ v1.2.14 (Build 179889)
Added Linux Device Driver support for USB2000, USB510L and USB510W

5.1.0.106              23 December 2011
Built using IJ v1.2.14 (Build 179889)
Updated Cortex M3 XML File for M4 devices.
Updated Diagnostic Commands that use dbgjtag to include '-o' parameter 
	to eliminate backspace character so command will run properly on Linux
	(Windows x86/x64 is updated as well).


5.1.0.105              03 November 2011
Built using IJ v1.2.14 (Build 179889)
Added Command Line Utility for LAN560 that checks if 
	the unit is available (BhEthStatus).

5.1.0.104              23 September 2011
Built using IJ v1.2.14 (Build 179889)
Modified connection files to include DiagnosticCommand entry
Modified log folder area to begin with "bh_emupack"

5.1.0.103              14 September 2011
Built using IJ v1.2.14 (Build 179889)
Modified XDS560v2 connection files to include
	1149.7 parameters
Update Bh560v2Config to v1.0.0.9, which adds
	more dbgjtag test ranges

5.1.0.102            26 August 2011
Built using IJ v1.2.14 (Build 179889)
Modified XDS560 and XDS560v2 connection files for
	default TCLK in "legacy" mode, FALLing edge

5.1.0.101            17 August 2011
Built using IJ v1.2.14 (Build 179889)
Updated Search for JAVA JRE
Updated Bh560v2Config Utility to v1.0.0.8
Updated Bh560v2-USB Mezzanine support files
Added LAN560 configuration tool for Linux
Modified XDS560 connection files for legacy mode

5.1.0.002            05 April 2011
Built using IJ v1.2.14 (Build 179889)
Modified install for user installation

5.0.2.001            09 March 2011
Built using IJ v1.2.14 (Build 179889)
Added timestamp update to install actions [per TI]
Added XDS560v2 Mezzanine Emulator Connection File
Added Support for XDS560v1 USB and LAN Emulators
   (LAN560, USB560, USB560m, and USB560-BP)
Updated install scripts (i.e. for USB drivers)

5.0.0.4              17 November 2010
Fixed un/install script, bh_emulation_install.sh

5.0.0.3              17 November 2010
Built using IJ v1.2.14 (Build 179889)
Corrected install_scripts folder location to
   <%installdir%>/../install_scripts 

5.0.0.2              16 November 2010
Built using IJ v1.2.14 (Build 179889)
Modified install_scripts to a single file:
  bh_emulation_install.sh and check for options:
    --install, --uninstall
      (and check that user is root)

5.0.0.1              12 November 2010
Built using IJ v1.2.14 (Build 179889)
Built for Linux
Removed check/prompt for root
Added Un/Install Scripts

5.0.0.0              10 September 2010
Built using IJ v1.2.14 (Build 179889)
Built for Linux


4.2.0.6              28 July 2010
Built using IJ v1.2.14 (Build 179889)
Driver XML Updates - to match TI XDS100v2/XDS510 changes.
	Added Files:	bhemu510cortexA9.xml
			bhemu510etbcs.xml
	Updated Files:	bhemu510cortexM.xml
			bhemu510cs_dap.xml
			bhemu510dap_pc.cml
	Removed File:	bhemu6400.xml (R10)

4.2.0.5              09 July 2010
Built using IJ v1.2.14 (Build 179889)
Added Missing LOOPBACK option to XDS560v2 Connection XML files.

4.2.0.4              28 May 2010
Built using IJ v1.2.14 (Build 179889)
Added XDS510 JSC Support (bhemujscl.dll)

4.2.0.3              20 May 2010
Built using IJ v1.2.14 (Build 179889)
Rolled Back from Microsoft.VC80.CRT 8.0.50727.4053 to .762
Removed XDS560v2 OUT files (bh560v2e,u).
XDS560v2 firmware and _io.dll files updated to [EPK] v2.0.4.0
**XDS510 support NOT updated for JSC in this release

4.2.0.2              30 April 2010
Built using IJ v1.2.14 (Build 179889)
Updated Bh560v2Config Utility (v1.0.0.5),
   including documentation
Updates Driver XML files for TargetDB:
   added TraceDeviceId field
   added c66xx,c669x, and icepick_d
   removed 24x and 27x
Fixed feature.xml dependency problems
**XDS510 support NOT updated for JSC in this release

4.2.0.1              12 March 2010
Built using IJ v1.2.14 (Build 179889)
Updated Device Driver install for Bh560v2 device
Added Bh560v2 files (XML, DLL, OUT, Config Utility, etc.)


4.0.1.1              31 December 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Created/Updated Driver XML files for TargetDB to match
   TI CCS v4.0.0 through v4.0.2 - This corrects C28x 
   imports for CLA updates and OMAP L13x imports.


4.0.1.0              02 September 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Original RTM release for CCS v4

4.0.0.21             02 June 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Added Support for UpdateManager 
Removed "configurations" files

4.0.0.20             01 June 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Updated Driver XML Files to include "realtimeEnabled" 
	field (28x,55x,64x,64xp,674x)
Added bhemu674x.xml file to be consistent with TI updates.
Updated XDS560 (and XDS510) Connection files for new parsing scheme.

4.0.0.19             09 April 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Updated Connection XML Files.
Renamed ccxml and xml files to 20pin (not Rev D)

4.0.0.18             30 March 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Corrected connection file location (inadvertently installing to TEMP folder)
Updated Installer for Device drivers v01.09.03.23
    - No actual driver file changes.

4.0.0.17             24 March 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Updated Device drivers to v01.09.03.23
    - Updated CPL for XP Pro x64 to handle old (pre-Vista) runtime DLL
    - Updated Installer to support "/mode Silent"
Updated BHEMUTBCL.DLL to correct SC_ERR_OCS_NUMBER message when 
	multiple USB2000/510L controllers are used simultaneously.

4.0.0.16             05 March 2009
Built using IJ v1.2.12 (Build 1.2.12.0) - 02 Dec 2008
Created Unique installer ID (GUID)
Modified UNINSTALL to prompt user ("Are you sure you want to uninstall?")
Device Drivers updated to v1.09.01.15 (LAN560 Updates)
Removed pre-defined imports for C28x and C54x devices.

v4.0.0.15
Updated XDS560 imports to use tixds560c64xp.xml file name.  
This version is included in the TI Beta 2 release

v4.0.0.14
Built using InstallJammer v1.2.12.  
Updated  Connection XML files to use "20-pin JTAG Cable", not "Rev.D"
This update may require a certain minimum CCS v4 build.

v4.0.0.13
Updated Installer to support the new, standard ISA="" strings used 
in the targetdb\drivers XML files missed in previous build. 
This update may require a certain minimum CCS v4 build.

v4.0.0.12
Updated Installer to support the new, standard ISA="" strings used 
in the targetdb XML files. 
This update may require a certain minimum CCS v4 build.

v4.0.0.11
Updated Installer to support ISA command line options (noc2400, 
noc2800, noc5400, noc5500, noc6000, noarm, noomap, nodavinci).  
Updated Windows devices drivers.

4.0.0.10
Updated XDS560 Files to USCIF v35.34.0.2 (USCIF Dynamic Loading)

4.0.0.9
Added Components, Groups and Files for target ISA and documentation

4.0.0.8
Updated Connection Files to use id="addrPort1".

v4.0.0.7
Added workaround in configuration .XML files to use "devices.old" folder.

v4.0.0.6
Fixed Typos in installer text strings
Updated Silent Uninstaller feature (/Y) to work as specified by TI

v4.0.0.5
Initial InstallJammer release.
Silent uninstall not configured correctly.
Not all Imports work as expected.

v4.0.0.4
Not released

v4.0.0.3
InstallShield version for CCS v4 Early Adopter
Directory Structure Update

v4.0.0.2
InstallShield version for CCE v4 Early Adopter
Directory Structure Update

v4.0.0.1
InstallShield version for CCE v4 Early Adopter
Directory Structure Update

v4.0.0.1
InstallShield version for CCE v3.x Early Adopter
Initial installer


=> DESCRIPTION

Blackhawk Emulation Drivers for CCS v6 using InstallBuilder.



>> Emulator Product(s) Supported

WINDOWS:
	USB-JTAG Emulator	    P/N: BH-USB-1 (32-bit Windows XP only)
	USB 2.0 JTAG Emulator	P/N: BH-USB-2 (32-bit Windows XP only)

	USB2000  Controller	    P/N: BH-USB-2000
	PCI510   JTAG Emulator	P/N: BH-PCI-510
	USB510   JTAG Emulator	P/N: BH-USB-510
	USB510L  JTAG Emulator	P/N: BH-USB-510L
	USB510W  JTAG Emulator	P/N: BH-USB-510W

	USB200   JTAG Emulator  P/N: BH-USB-200

	PCI560   JTAG Emulator	P/N: BH-PCI-560
	LAN560   JTAG Emulator	P/N: BH-LAN-560
	USB560   JTAG Emulator	P/N: BH-USB-560
	USB560M  JTAG Emulator	P/N: BH-USB-560M
	USB560BP JTAG Emulator	P/N: BH-USB-560BP

	USB560v2 JTAG Emulator	P/N: BH-USB-560v2
	XDS560v2 JTAG Emulator	P/N: BH-XDS-560v2
	XDS560v2 JTAG Emulator	P/N: BH-XDS-560v2-BP
	XDS560v2 USB Mezzanine	P/N: tbd

LINUX:
	USB2000  Controller	    P/N: BH-USB-2000
	USB510L  JTAG Emulator	P/N: BH-USB-510L
	USB510W  JTAG Emulator	P/N: BH-USB-510W

	USB200   JTAG Emulator  P/N: BH-USB-200

	LAN560   JTAG Emulator	P/N: BH-LAN-560
	USB560   JTAG Emulator	P/N: BH-USB-560
	USB560M  JTAG Emulator	P/N: BH-USB-560M
	USB560BP JTAG Emulator	P/N: BH-USB-560BP

	USB560v2 JTAG Emulator	P/N: BH-USB-560v2
	XDS560v2 JTAG Emulator	P/N: BH-XDS-560v2
	XDS560v2 JTAG Emulator	P/N: BH-XDS-560v2-BP
	XDS560v2 USB Mezzanine	P/N: tbd
