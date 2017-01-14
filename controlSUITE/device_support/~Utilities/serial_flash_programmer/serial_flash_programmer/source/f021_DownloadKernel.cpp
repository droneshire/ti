//###########################################################################
// FILE:   f021_DownloadKernel.cpp
// TITLE:  Download Kernel function for f021 devices.
//
// This function is used to communicate and download with the device.  For 
// F021 devices, the serial flash programmer sends the application the same
// way it does the kernel.  In both instances, the serial flash programmer
// send one byte and the device echos back that same byte.
//###########################################################################
// $TI Release: F28X7X Support Library$
// $Release Date: Octobe 23, 2014 $
//###########################################################################

#include "../include/f021_DownloadKernel.h"

#include "stdafx.h"
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>


#ifndef __linux__
#pragma once
#include <conio.h>
#include <windows.h>
#include <dos.h>
#include <time.h>
#endif

// Linux exclusive
#ifdef __linux__

#include <string.h>
#include <errno.h>
#include <termios.h>
#include <unistd.h>
#include <fcntl.h>
#include "linux_macros.h"

#endif //__linux__


//*****************************************************************************
//
// Helpful macros for generating output depending upon verbose and quiet flags.
//
//*****************************************************************************
#define VERBOSEPRINT(...) if(g_bVerbose) { _tprintf(__VA_ARGS__); }
#define QUIETPRINT(...) if(!g_bQuiet) { _tprintf(__VA_ARGS__); }

//*****************************************************************************
//
// Globals whose values are set or overridden via command line parameters.
//
//*****************************************************************************
extern bool g_bVerbose;
extern bool g_bQuiet;
extern bool g_bOverwrite;
extern bool g_bUpload;
extern bool g_bClear;
extern bool g_bBinary;
extern bool g_bWaitOnExit;
extern bool g_bReset;
extern bool g_bSwitchMode;
extern bool g_bDualCore;
extern wchar_t *g_pszAppFile;
extern wchar_t *g_pszAppFile2;
extern wchar_t *g_pszKernelFile;
extern wchar_t *g_pszKernelFile2;
extern wchar_t *g_pszComPort;
extern wchar_t *g_pszBaudRate;
extern wchar_t *g_pszDeviceName;

//COM Port stuff
#ifdef __linux__
extern int fd;
#else
extern HANDLE file;
extern DCB port;
#endif

//*****************************************************************************
//
// Function prototypes
//
//*****************************************************************************
void clearBuffer(void);
void autobaudLock(void);
void loadProgram(FILE *fh);
int f021_DownloadKernel(wchar_t* kernel);

//*****************************************************************************
//
// Flushes the serial port buffer.
//
//*****************************************************************************

void
clearBuffer(void)
{

#ifdef __linux__
	if (tcflush(fd, TCIOFLUSH) == 0){
		QUIETPRINT(_T("Input and Output successfully flushed"));
	}
	else{
		perror("tcflush error");
	}
#else
	PurgeComm(file, PURGE_RXCLEAR);
	unsigned char readBufferData[800];
	DWORD dwRead;
	COMSTAT ComStat;
	DWORD dwErrorFlags;
	ClearCommError(file, &dwErrorFlags, &ComStat);
	ReadFile(file, &readBufferData, ComStat.cbInQue, &dwRead, NULL);
#endif
}

//*****************************************************************************
//
// Locks baud rate.
//
//*****************************************************************************
void
autobaudLock(void)
{
	clearBuffer();
	unsigned char sendData[8];
	unsigned int rcvData = 0;
	DWORD dwWritten;
	DWORD dwRead;
	sendData[0] = 'A';
#ifdef __linux__
	unsigned char buf[8];
	int wr;
	int readf;
	wr = 0;
	wr = write(fd, &sendData[0], 1);
	buf[0] = 0;
	dwRead = 0;
	while (dwRead == 0){
		readf = read(fd, &buf, 1);
		if (readf == -1){
			QUIETPRINT(_T("Error %s\n"), strerror(errno));
		}
		dwRead = readf;
		rcvData = buf[0];
	}
#else
	WriteFile(file, &sendData[0], 1, &dwWritten, NULL);
	dwRead = 0;
	while (dwRead == 0){
		ReadFile(file, &rcvData, 1, &dwRead, NULL);
	}
#endif
	if (sendData[0] != rcvData)
	{
		QUIETPRINT(_T("\n%lx"), sendData[0]);
		QUIETPRINT(_T("==%lx"), rcvData);
		VERBOSEPRINT(_T("\nError with autobaud lock echoback... Please press Ctrl-C to abort."));
		while (1){}
	}
}

//*****************************************************************************
//
// Sends kernel and application load data in SCI-8 format.
//
//*****************************************************************************
void loadProgram(FILE *fh)
{
	unsigned char sendData[8];
	unsigned int fileStatus;
	unsigned int rcvData = 0;
	DWORD dwRead;
#ifdef __linux__
    unsigned char buf[8];
    int readf;
#else
	DWORD dwWritten;

#endif



#ifndef __linux__
	getc(fh);
	getc(fh);
#endif
	getc(fh);

	fileStatus = fscanf_s(fh, "%x", &sendData[0]);

	float bitRate = 0;
	DWORD millis = GetTickCount();
	while (fileStatus == 1)
	{
		QUIETPRINT(_T("\n%lx"), sendData[0]);
		//Send next char
#ifdef __linux__
		write(fd, &sendData[0], 1);
#else
		WriteFile(file, &sendData[0], 1, &dwWritten, NULL);
#endif
		bitRate++;
		dwRead = 0;
		while (dwRead == 0)
		{
#ifdef __linux__
            readf = read(fd, &buf, 1);
            if(readf == -1)
            {
		       	QUIETPRINT(_T("Error %s\n"), strerror(errno));
		    }
            dwRead = readf;
		    rcvDataH = buf[0];
#else            
            ReadFile(file, &rcvData, 1, &dwRead, NULL);
#endif
        }
		QUIETPRINT(_T("==%lx"), rcvData);
		//Ensure data matches
		if (sendData[0] != rcvData){
			VERBOSEPRINT(_T("\nData does not match... Please press Ctrl-C to abort."));
			while (1){}
		}

		//Read next char
		fileStatus = fscanf_s(fh, "%x", &sendData[0]);
	}
	millis = GetTickCount() - millis;
	bitRate = bitRate / millis * 1000 * 8;
	QUIETPRINT(_T("\nBit rate /s of transfer was: %f"), bitRate);
	rcvData = 0;
}

//*****************************************************************************
//
// Download a kernel to the the device identified by the passed handle.  The
// kernel to be downloaded and other parameters related to the operation are
// controlled by command line parameters via global variables.
//
// Returns 0 on success or a positive error return code on failure.
//
//*****************************************************************************
int
f021_DownloadKernel(wchar_t * kernel)
{
	FILE *Kfh;

	unsigned int rcvData = 0;
	unsigned int rcvDataH = 0;
	unsigned int txCount = 0;

#ifndef __linux__
	DWORD dwLen = 1;
#endif

    #ifdef __linux__
    unsigned char buf[8];
	int readf;
	int wr;
	#endif

	QUIETPRINT(_T("Downloading %s to device...\n"), kernel);

	// Opens the Flash Kernel File
    #ifdef  __linux__
	Kfh = fopen(kernel, _T("rb"));
	#else
	Kfh = _tfopen(kernel, _T("rb"));
    #endif
	if (!Kfh)
	{
		QUIETPRINT(_T("Unable to open Kernel file %s. Does it exist?\n"), kernel);
		return(10);
	}

    //
	//Both Kernel, Application, and COM port are open
	//
	//Do AutoBaud
	VERBOSEPRINT(_T("\nAttempting autobaud to load kernel..."));
	autobaudLock();

	VERBOSEPRINT(_T("\nAutobaud for kernel successful! Loading kernel file..."));
	loadProgram(Kfh);

	VERBOSEPRINT(_T("\nKernel loaded! Booting kernel..."));
	#ifdef __linux__
	sleep(2);
	#else
	Sleep(2000);
	#endif

	VERBOSEPRINT(_T("\nDone waiting for kernel boot... "));
	clearBuffer();
	return(0);
}
