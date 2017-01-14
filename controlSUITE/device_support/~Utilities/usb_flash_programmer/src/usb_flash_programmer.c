//This is demonstration code for use with the Texas Instruments USB Loader 2000.
//It reads data in the boot loader format from an input file,
//then sends that data to the microcontroller using libusb or WinUSB. Wrapper
//functions are used to keep the main() function generic.
//


#include "usb_flash_programmer.h"

//Local function prototypes
static size_t GetFileData(const char *fileName, unsigned char **fileData);
static void PrintUsage(void);

//Executable name from the command line for PrintUsage()
const char *exeName = NULL;

//Command line options
int listOnly = false, quietMode = false;


//Main function. Parses the command line options, reads the input file data,
//and calls USB wrapper functions to send that data to the boot loader.
int main(int argc, char **argv)
{
	const char *fileName = NULL;
	unsigned char *fileData = NULL;
	void *usbHandle = NULL;
	size_t dataLen, dataWritten;
	int arg;
	int stringDescSuccess;

	//Print a newline to give some space between the command line and any status messages
	printf("\n");
	
	//Save the executable name for PrintUsage()
	exeName = argv[0];

	//Process command line arguments
	for (arg = 1; arg < argc; arg++)
	{
		if (argv[arg][0] == '-')
		{
			if (argv[arg][2] != '\0' && argv[arg][1] != 'd')
			{
				PrintUsage();
				fprintf(stderr, "Error: Unrecognized argument %s\n", argv[arg]);
				return -1;
			} else
			{
				switch (argv[arg][1])
				{
					case 'q':
						quietMode = true;
						break;
					case 'l':
						listOnly = true;
						break;
					case 'h':
						PrintUsage();
						return 0;
					default:
						PrintUsage();
						fprintf(stderr, "Error: Unrecognized argument %s\n", argv[arg]);
						return -1;
				}
			}
		} else
		{
			fileName = argv[arg];
		}
		//If there were no arguments or no input filename was provided, print the usage and exit
		if ((argc == 1) || (fileName == NULL && !listOnly))
		{
			PrintUsage();
			fprintf(stderr, "Error: no input filename found\n");
			return -1;
		}
        
	    //If there were no arguments or no input filename was provided, print the usage and exit
	    if (argc == 1 || (fileName == NULL && !listOnly))
	    {
	    	PrintUsage();
	    	fprintf(stderr, "Error: No input filename found\n");
	    	return -1;
	    }
        
	    //Read data from the input file unless we're in list-only mode
	    if (arg == 1 && listOnly && !quietMode)
	    {
	    	printf("Performing device check only\n");
	    } else if (arg == 1 && listOnly && quietMode)
	    {
	    	fprintf(stderr, "Error: List-only mode and quiet mode cannot be used together\n\n");
	    	return -1;
	    } else
	    {
	    	dataLen = GetFileData(fileName, &fileData);
	    	if (dataLen == 0)
	    	{
	    		//GetFileData() prints its own error messages
	    		return -1;
	    	} else if (dataLen < 32)
	    	{
	    		fprintf(stderr, "Error: Only found %lu bytes of data in %s.\n"
	    		                "The boot loader data format requires at least 32 bytes.\n", (unsigned long)dataLen, fileName);
	    		return -1;
	    	}
	    }
	    
	    //Get a handle to the USB device
	    usbHandle = USB_GetHandle();
	    if (usbHandle == NULL)
	    {
	    	fprintf(stderr, "Error: Couldn't open the USB device\n");
	    	return -1;
	    }
	    
	    //Print the device's string descriptors to show the manufacturer, product name,
	    //and serial number.
	    stringDescSuccess = true;
	    if (!quietMode)
	    {
	    	stringDescSuccess = USB_PrintDescriptors(usbHandle);
	    }
	    
	    //Send the data to the USB device if not in list-only mode. If the string
	    //descriptor reads failed, skip the data transfer since the device may no
	    //longer be trustworthy.
	    dataWritten = 0;
	    if (!listOnly && stringDescSuccess)
	    {
	    	//There a C99 format specifier (%zd) for printing values of type
	    	//size_t, but Microsoft doesn't support it. This means we're stuck
	    	//casting everything to unsigned long. :-(
	    	if (!quietMode)
	    		printf("\nSending %lu bytes of data from file %s... ", (unsigned long)dataLen, fileName);
	    	dataWritten = USB_SendData(usbHandle, fileData, dataLen);
	    	if (!quietMode && dataWritten == dataLen)
	    		printf("done!\n");
	    	
	    	if (!quietMode)
	    		printf("%lu out of %lu bytes sent\n", (unsigned long)dataWritten, (unsigned long)dataLen);
	    }
	    
	    //Clean up the USB library state and free all allocated memory
	    USB_CleanUp(usbHandle);
	    free(fileData);
	    
	    //Determine whether the USB operations succeeded
	    if (stringDescSuccess && (listOnly || (dataWritten == dataLen)))
	    {
	    	if (!quietMode)
	    		printf("Success!\n");
	    } else
	    {
	    	fprintf(stderr, "USB operation failed!\n");
	    	return -1;
	    }    
        Sleep(3000);
    }
}


//Check whether the input file is valid. If it is, get the length of the file.
//Allocate a memory buffer to hold the file data, then copy it. Close the file
//and return the data length. The calling function is responsible for free()-ing
//the allocated memory. The binary file must contain only the exact data that
//should be sent to the MCU.
size_t GetFileData(const char *fileName, unsigned char **fileData)
{
	FILE *inFile;
	size_t dataLen, readLen;
	int err;

	//Try to open the file before we do anything with USB
	inFile = fopen(fileName, "rb");
	if (inFile == NULL)
	{
		fprintf(stderr, "Error: Couldn't open file %s\n", fileName);
		return 0;
	}

	//Get the length of the file. There's some debate on the internet over
	//whether using fseek() and ftell() in this way is a good idea. As far
	//as I can tell, it's not a problem for modern (post-1985) operating
	//systems. I'm using this method to avoid OS-specific functionality.
	fseek(inFile, 0, SEEK_END);
	dataLen = (size_t)ftell(inFile);
	rewind(inFile);

	//Allocate memory to store the file contents
	*fileData = (unsigned char *)malloc(dataLen);
	if (*fileData == NULL)
	{
		fprintf(stderr, "Error: Couldn't allocate memory for file data\n");
		fclose(inFile);
		return 0;
	}

	//Read the file into memory, then close it	
	readLen = fread(*fileData, sizeof(char), dataLen, inFile);
	err = ferror(inFile);
	fclose(inFile);
	if (err != 0)
	{
		fprintf(stderr, "Error reading data from input file: %d\n", err);
		return 0;
	}
	if (readLen != dataLen)
	{
		fprintf(stderr, "Error: File is %lu bytes long but only read %lu bytes\n", (unsigned long)dataLen, (unsigned long)readLen);
		return 0;
	}
	
	//Return the length of the data that was read
	return dataLen;
}


//Print the command line syntax of the program
void PrintUsage(void)
{
	printf("USB Loader 2000\n");
	printf("Copyright 2014 by Texas Instruments\n");
	printf("Version \xE4 -- Customer Preview\n\n");
	printf("Usage: %s [-l] [-q] [-h] <input filename(s)>\n\n", exeName);
	printf("\t-q  Quiet mode -- suppress normal output\n");
	printf("\t-l  List attached devices without programming\n");
	printf("\t-h  Print this usage information\n\n\n");
}
