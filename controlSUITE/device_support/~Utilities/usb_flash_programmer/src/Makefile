# This makefile is for use with the USB Loader 2000 demonstration
# project. It uses MinGW to compile either the libusb or WinUSB version.

# Windows DDK installation directory for WinUSB
WINDDK_DIR=C:\WinDDK\7600.16385.1
WINDDK_LIBS=$(WINDDK_DIR)\lib\win7\i386\setupapi.lib $(WINDDK_DIR)\lib\win7\i386\winusb.lib

# Libusb directory. This directory should contain libusb.h and libusb-1.0.a.
LIBUSB_DIR=libusb
LIBUSB_LIBS=$(LIBUSB_DIR)\libusb-1.0.a

# Compiler and flag definitions
CC=gcc
CFLAGS_GENERIC=-std=c99 -pedantic -Wall -Wextra -Wcast-qual -Wconversion -Wundef
CFLAGS_LIBUSB=$(CFLAGS_GENERIC) -I$(LIBUSB_DIR)
CFLAGS_WINUSB=$(CFLAGS_GENERIC) -idirafter $(WINDDK_DIR)\inc\api -idirafter $(WINDDK_DIR)\inc\ddk

# There's no default project
all:
	@echo Please specify either loader_libusb or loader_winusb as the target

# Libusb version
.PHONY: loader_libusb
loader_libusb: usb_flash_programmer.c libusb_wrapper.c $(LIBUSB_LIBS)
	$(CC) $(CFLAGS_LIBUSB) -o usb_flash_programmer.exe usb_flash_programmer.c libusb_wrapper.c $(LIBUSB_LIBS)

# WinUSB version
.PHONY: loader_winusb
loader_winusb: usb_flash_programmer.c winusb_wrapper.c $(WINDDK_LIBS)
	$(CC) $(CFLAGS_WINUSB) -o usb_flash_programmer.exe usb_flash_programmer.c winusb_wrapper.c  $(WINDDK_LIBS)