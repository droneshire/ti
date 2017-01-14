//###########################################################################
// FILE:   f05_DownloadImage.cpp
// TITLE:  Download Image function required for serial flash programmer.
//
// This function is used to communicate and download with the device.  For 
// F05 devices, the serial flash programmer loads the kernel with a byte by
// byte echo back.  When communicating the application to the kernel, it
// works differently.  It sends chunks of the application and waits for 
// a checksum of that data.
//###########################################################################
// $TI Release: F28X7X Support Library$
// $Release Date: Octobe 23, 2014 $
//###########################################################################

#include "../include/f05_DownloadImage.h"

#include <stdafx.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#ifndef __linux__
#pragma once
#include <conio.h>
#include <windows.h>
#include <dos.h>
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
// Download an image to the the device identified by the passed handle.  The
// image to be downloaded and other parameters related to the operation are
// controlled by command line parameters via global variables.
//
// Returns 0 on success or a positive error return code on failure.
//
//*****************************************************************************
int
f05_DownloadImage(void)
{
	FILE *Kfh;
	FILE *Afh;
	

	unsigned int rcvData = 0;
	unsigned int rcvDataH = 0;
	int txCount = 0;

	uint16_t checksum;
	unsigned int fileStatus;
	DWORD dwRead;
    #ifdef __linux__
    unsigned char buf[8];
	int readf;
	unsigned int sendData[8];
	#else
	errno_t error;
	DWORD dwWritten;
	unsigned char sendData[8];
	#endif

	
	QUIETPRINT(_T("Downloading %s to device...\n"), g_pszAppFile);

	//
	// Does the input file exist?
	//
	// Opens the Flash Kernel File
    #ifdef  __linux__
	Kfh = fopen(g_pszKernelFile, _T("rb"));
	#else
	error = _wfopen_s(&Kfh, g_pszKernelFile, _T("rb"));
    #endif
	if (!Kfh)
	{
		QUIETPRINT(_T("Unable to open Kernel file %s. Does it exist?\n"), g_pszKernelFile);
		return(10);
	}

    //Opens the application file 
    #ifdef __linux__
    Afh = fopen(g_pszAppFile, _T("rb"));
    #else
	error = _wfopen_s(&Afh, g_pszAppFile, L"rb");
	#endif
	if (!Afh)
	{
		QUIETPRINT(_T("Unable to open Application file %s. Does it exist?\n"), g_pszAppFile);
		return(10);
	}

	//Both Kernel, Application, and COM port are open
	
	//Do AutoBaud
 	dwRead = 0;
	sendData[0] = 'A';
	
	QUIETPRINT(_T("Attempting autobaud...\n"));
	
	#ifdef __linux__
	write(fd, &sendData[0], 1);
    while (dwRead == 0)
    {

    	readf = read(fd,&buf,1);
        if(readf == -1)
        {
        	QUIETPRINT(_T("Error %s\n"), strerror(errno));
        }
        dwRead = readf;
        rcvData = buf[0];
    	if(readf == 0)
    	{
    	write(fd, &sendData[0], 1);
    	}
    }
	#else
	WriteFile(file, &sendData[0], 1, &dwWritten, NULL);
	while (dwRead == 0)
	{
		ReadFile(file, &rcvData, 1, &dwRead, NULL);
	}
    #endif

	if (sendData[0] != rcvData)
		return(12);


	VERBOSEPRINT(_T("\nKernel AutoBaud Successful"));
	//Find the start of the kernel data
	#ifndef __linux__
	getc(Kfh);
	getc(Kfh);
	#endif
	getc(Kfh);

	fileStatus = fscanf_s(Kfh, "%x", &sendData[0]);
    int i = 0;
	while (fileStatus == 1)
	{
		i++;

		//Send next char

	 	#ifdef __linux__
		write(fd,&sendData[0],1);
		//usleep(10000);
		#else
		WriteFile(file, &sendData[0], 1, &dwWritten, NULL);
		#endif

		//Read next char

		fileStatus = fscanf_s(Kfh, "%x", &sendData[0]);
	}

	VERBOSEPRINT(_T("\nKernel Loaded"));
	#ifdef __linux__
	sleep(5);
	#else
	Sleep(5000);
	#endif
	VERBOSEPRINT(_T("\nDone Waiting for kernel boot...attempting autobaud"));
	#ifdef __linux__
		if(tcflush(fd,TCIOFLUSH)== 0)
		{
			//printf("Input and Output successfully flushed");
		}
		else
		{
			perror("tcflush error");
		}
	#else
	    PurgeComm(file, PURGE_RXCLEAR);
    #endif


	//Do AutoBaud
	sendData[0] = 'A';
	#ifdef __linux__
	write(fd,&sendData[0],1);
	buf[0] = 0;
    dwRead = 0;
   // int counter = 0 ;
    while (dwRead == 0)
    {
    	//counter++;
     	readf = read(fd,&buf,1);
        if(readf == -1)
        {
        	QUIETPRINT(_T("Error %s\n"), strerror(errno));
        }
        dwRead = readf;
        rcvData = buf[0];
    }

    #else
	    WriteFile(file, &sendData[0], 1, &dwWritten, NULL);

	dwRead = 0;
	while (dwRead == 0)
	{
		ReadFile(file, &rcvData, 1, &dwRead, NULL);
	}
    #endif


	if (sendData[0] != rcvData)
		return(12);

	VERBOSEPRINT(_T("\nApplication AutoBaud Successful"));
	//Find the start of the application data
	txCount = 0;
	checksum = 0;
	#ifndef __linux__
	getc(Afh);
	getc(Afh);
	#endif
	getc(Afh);



	while (txCount < 22)
	{
		txCount++;
		fscanf_s(Afh, "%x", &sendData[0]);
		checksum += sendData[0];
		//Send next char
		#ifdef __linux__
		   write(fd,&sendData[0],1);
		#else
		   WriteFile(file, &sendData[0], 1, &dwWritten, NULL);
        #endif
	}
	dwRead = 0;
	while (dwRead == 0)
	{
		#ifdef __linux__
    	readf = read(fd,&buf,1);
        if(readf == -1)
        {
        	QUIETPRINT(_T("Error %s\n"), strerror(errno));
        }
        dwRead = readf;
        rcvData = buf[0];
		#else
		ReadFile(file, &rcvData, 1, &dwRead, NULL);
	    #endif
	}	
	dwRead = 0;
	while (dwRead == 0)
	{
	    #ifdef __linux__
    	readf = read(fd,&buf,1);
        if(readf == -1)
        {
        	QUIETPRINT(_T("Error %s\n"), strerror(errno));
        }
        dwRead = readf;
        rcvDataH = buf[0];
		#else
		ReadFile(file, &rcvDataH, 1, &dwRead, NULL);
	    #endif
	}

	//Ensure checksum matches
	if (checksum != (rcvData | (rcvDataH << 8)))
		return(12);


	//RONNIES CODE
	int wordData;
	int byteData;
	txCount = 0;
	checksum = 0;

	int totalCount = 0;
	wordData = 0x0000;
	byteData = 0x0000;
	fileStatus = 1;

	//Load the flash application
	while (1){

		fileStatus = fscanf_s(Afh, "%x ", &sendData[0]);
		if (fileStatus == 0)
			break;
		#ifdef __linux__
        write(fd,&sendData[0],1);
		#else
		WriteFile(file, &sendData[0], 1, &dwWritten, NULL);
		#endif
		checksum += sendData[0];

		// Get block size
		if (txCount == 0x00)
		{
			wordData = sendData[0];
		}
		else if (txCount == 0x01)
		{
			byteData = sendData[0];
			// form the wordData from the MSB:LSB
			wordData |= (byteData << 8);
		}

		txCount++;
		totalCount++;

		//If the next block size is 0, exit the while loop. 
		if (wordData == 0x00 && txCount > 1)
		{

			wordData = 0x0000;
			byteData = 0x0000;

			break;
		}
		// will execute when all the data in the block has been sent
		else if (txCount == 2 * (wordData + 3))
		{
			dwRead = 0;
			while (dwRead == 0)
			{
				#ifdef __linux__
				readf = read(fd, &buf, 1);
				if (readf == -1)
				{
					QUIETPRINT(_T("Error %s\n"), strerror(errno));
				}
				dwRead = readf;
				rcvData = buf[0];
				#else
				ReadFile(file, &rcvData, 1, &dwRead, NULL);
			#endif
			}
			dwRead = 0;
			while (dwRead == 0)
			{
				#ifdef __linux__
				readf = read(fd, &buf, 1);
				if (readf == -1)
				{
					QUIETPRINT(_T("Error %s\n"), strerror(errno));
				}
				dwRead = readf;
				rcvDataH = buf[0];
				#else				
				ReadFile(file, &rcvDataH, 1, &dwRead, NULL);
				#endif
			}
			//Ensure checksum matches
			if (checksum != (rcvData | (rcvDataH << 8)))
				return(12);
			else
				checksum = 0;

			wordData = 0x0000;
			byteData = 0x0000;
			txCount = 0x00;
		}
		// will execute when the flash kernel buffer is full (0x400 words == 0x800 bytes)
		else if ((txCount - 6) % 0x800 == 0 && txCount > 6)
		{
			dwRead = 0;
			while (dwRead == 0)
			{
			    #ifdef __linux__
		    	readf = read(fd,&buf,1);
		        if(readf == -1)
		        {
		        	QUIETPRINT(_T("Error %s\n"), strerror(errno));
		        }
		        dwRead = readf;
		        rcvData = buf[0];
		        #else
				ReadFile(file, &rcvData, 1, &dwRead, NULL);
				#endif
			}
			dwRead = 0;
			while (dwRead == 0)
			{
				#ifdef __linux__
		    	readf = read(fd,&buf,1);
		        if(readf == -1)
		        {
		        	QUIETPRINT(_T("Error %s\n"), strerror(errno));
		        }
		        dwRead = readf;
		        rcvDataH = buf[0];
				#else
				ReadFile(file, &rcvDataH, 1, &dwRead, NULL);
			    #endif
			}
			//Ensure checksum matches
			if (checksum != (rcvData | (rcvDataH << 8)))
				return(12);
			else
				checksum = 0;
		}
		
	}
	VERBOSEPRINT(_T("\nApplication Load Successful"));

	//not sure if should add?
    return 0;
}