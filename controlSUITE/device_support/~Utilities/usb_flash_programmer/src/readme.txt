Texas Instruments C2000 USB Flash Programmer Example Package


The file explains the structure of the boot loader client and provides
compilation instructions for different platforms and libraries.


The USB loader client performs the following actions:
1. Parse the command line options.
2. Read data from the input file.
3. Attempt to open the USB device.
4. Read and print the USB string descriptors.
5. Send the input file data via a bulk OUT transfer.
6. Clean up the USB library environment.
7. Return a pass/fail to the calling environment.
8. If multiple arguments: Go to 1

Command line options and file IO can be done through the C standard library,
but USB operations can only be done through the operating system's device
driver framework. There are two widely-used libraries that provide this
capability. The first is libusb, an open-source (LGPL) library that features
a Unix-style API. The second is WinUSB, which is part of the Windows Driver
Development Kit. Both libraries run in user mode and provide generic access
to USB devices without the need for a customer driver. Libusb is very easy
to use and is also available on Linux, but it's somewhat slower and any
distribution is complicated by the license. WinUSB is harder to use, but is
faster and the resulting software is simpler to distribute. The precompiled
version of usb_flash_programmer.exe included with this package uses WinUSB,
but source code is provided for both libraries.

Similar to the libraries, there are two common compilers available for Windows
development. One is MinGW, a port of the GNU Compiler Collection (GCC). The
other is Microsoft's Visual Studio. These are as different as night and day,
but describing them is beyond the scope of this document. Both are supported
in this package.

The source code is divided into several files. Command line options and file
IO are handled by the generic main file (usb_flash_programmer.c). The main()
function works with the chosen USB library through generic wrapper functions.
These are defined in usb_flash_programmer.h along with the device driver GUIDs
and USB vendor and product IDs. Library-specific functionality is implemented
in libusb_wrapper.c and winusb_wrapper.c. These #include library-specific
header files and link with a static library file.


To use WinUSB, compile and link together the following files:
usb_flash_programmer.c
winusb_wrapper.c
setupapi.lib (from the DDK)
winusb.lib (from the DDK)

WinUSB header files are found in:
C:\WinDDK\7600.16385.1\inc\api
C:\WinDDK\7600.16385.1\inc\ddk

WinUSB libraries are around in:
C:\WinDDK\7600.16385.1\lib\win7\i386


To use libusb, compile and link together the following files:
usb_flash_programmer.c
libusb_wrapper.c
MinGW: libusb-1.0.a (from libusb for MINGW32)
VS: libusb-1.0.lib (from libusb for MS32)

Libusb is not included in this package. Windows binaries can be downloaded
from their web site at http://libusb.info. To use the makefile or Visual
Studio projects included in this package, put libusb-1.0.a, libusb-1.0.lib,
and libusb.h in the libusb subdirectory below the main C files.


To use Visual Studio, open the solution in the VS2010_USBLoader2000
subdirectory. There will be two projects -- one for WinUSB and one for
libusb. Build the one for your chosen library. The resulting executable
will be in the build_libusb or build_winusb subdirectory.


To use MinGW, use the provided makefile. To build a libusb executable, run
'make loader_libusb'. To build a WinUSB executable, run 'make loader_winusb'.
Alternatively, run 'mingw32-make loader_libusb' and 'mingw32-make loader_winusb'.

To use MinGW to build a winusb executable, check winusb_wrapper.c.  You may need
to manually change NTDDI_VERSION for your system.