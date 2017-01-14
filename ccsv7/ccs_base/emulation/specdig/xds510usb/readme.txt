Applies to Windows installations CCSv4 and higher:
---------------------------------------------------
xds510usb and xd510usb_win64 files have been removed and replaced with signed
windows drivers and placed in:
Program Files\SpectrumDigital\Emulation\Drivers for 32-bit Windows and
Program Files (x86)\SpectrumDigital\Emulation\Drivers for 64-bit Windows

During the CCS installation process windows system level drivers are quietly 
pre-installed.  On Vista, the system level drivers install may not succeed as 
security checks may block the install.  When you plug in a USB HW device if 
Vista does not automatically find the USB drivers then the install did not 
succeed and you have two options:

1) When the install Wizard cannot find the drivers simply have the Wizard 
search the directories listed above with the search subdirectory check box 
checked.

2) Manually pre-install the drivers before plugging in the USB HW.  
To do this use Explorer and go to the appropriate driver directory listed 
above and the appropriate subdirectory, i386 for 32-bit Windows or amd64 for 
64-bit Windows and run DPInst.exe.  If you are not sure if drivers were
pre-installed during the CCS install you can safely run DPInst.exe again. 
