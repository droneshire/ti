//This is demonstration code for use with the Texas Instruments USB Loader 2000.
//It wraps around the SetupAPI and WinUSB APIs to provide a
//generic interface to the main() function. For information on SetupAPI and
//WinUSB, see the MSDN documentation:
// WinUSB API - http://msdn.microsoft.com/en-us/library/windows/hardware/ff540046.aspx
// SetupDi API - http://msdn.microsoft.com/en-us/library/windows/hardware/ff553567.aspx#ddk_setupdi_device_information_functions_dg
// SetupDi Example - http://support.microsoft.com/kb/259695
// Template Code - http://msdn.microsoft.com/en-us/library/windows/hardware/dn376872.aspx#template_code_discussion

//Note on Header Files: The Windows DDK has incompatible versions
//of common header files like windows.h and sal.h. This tends to break the
//build if the DDK directories come before the standard system headers in the
//include path. If you get compiler errors about needing to #define a target
//architecture or redefining _In_ and _Out_, your include path is probably
//to blame.

//Note for MinGW: WinUSB only supports Windows XP and later, so winusb.h
//requires that NTDDI_VERSION be WinXP or greater. MinGW's version of
//sdkddkver.h defaults to Win2000, so NTDDI_VERSION must be set manually.
//This must happen before any header files are #included since all of the
//C standard headers that come with MinGW #include sdkddkver.h indirectly.
#ifdef __MINGW32__
	#define NTDDI_VERSION NTDDI_WIN7
#endif

#include "usb_flash_programmer.h"

//Windows headers for file types and SetupDi functions
#include <Windows.h>
#include <SetupAPI.h>

//WinDDK headers for WinUSB
#include <SDKDDKVer.h>
#include <sal.h>
#include <winusb.h>
#include <usb200.h>

//Save the device file handle here so the main function doesn't have to carry
//around two separate handles.
static HANDLE fileHandle = NULL;


//Get a handle to the USB device. This requires two separate Windows APIs:
//SetupDi, which gets us a file handle to the device, and WinUSB, which
//controls the USB driver. This function performs the following steps:
//
//1. Get a list of devices that match the driver's GUID by calling
//   SetupDiGetClassDevs().
//2. Get information about each device by calling SetupDiEnumDeviceInterfaces().
//3. Get the device path by calling SetupDiGetDeviceInterfaceDetail().
//4. Create a file handle for the device by calling CreateFile().
//5. Get a WinUSB handle by calling WinUsb_Initialize().
//
void *USB_GetHandle(void)
{
	WINUSB_INTERFACE_HANDLE usbHandle;
	GUID usbGUID = F28X7X_LOADER_GUID;
	HDEVINFO devInfoSet;
	SP_DEVICE_INTERFACE_DATA devInterfaceData;
	PSP_DEVICE_INTERFACE_DETAIL_DATA devDetailData = NULL;
	BOOL result = FALSE;
	ULONG requiredLength = 0;

	//Step 1: Get the device information set for all installed devices which
	//match the device GUID from the driver INF.
	devInfoSet = SetupDiGetClassDevs(&usbGUID, NULL, NULL, DIGCF_PRESENT | DIGCF_DEVICEINTERFACE);
	if (devInfoSet == INVALID_HANDLE_VALUE)
	{
		fprintf(stderr, "Error getting device interface set: 0x%04lx\n", GetLastError());
		return NULL;
	}

	//Step 2: Enumerate the available device interfaces
	devInterfaceData.cbSize = sizeof(SP_DEVICE_INTERFACE_DATA);
	result = SetupDiEnumDeviceInterfaces(devInfoSet, NULL, &usbGUID, 0, &devInterfaceData);
	if (!result)
	{
		fprintf(stderr, "Error enumerating device interface: 0x%04lx\n", GetLastError());
		fprintf(stderr, "This may mean that the device is not attached or the driver is not installed\n");
		SetupDiDestroyDeviceInfoList(devInfoSet);
		return NULL;
	}

	//Step 3: Get detailed data for the device interface, including the device
	//path. SetupDiGetDeviceInterfaceDetail() is called twice -- once to get
	//the size of the detail data, and again after a suitable buffer has been
	//allocated to hold it.
	result = SetupDiGetDeviceInterfaceDetail(devInfoSet, &devInterfaceData, NULL, 0, &requiredLength, NULL);
	if (!result && GetLastError() != ERROR_INSUFFICIENT_BUFFER)
	{
		fprintf(stderr, "Error getting device interface detail size: 0x%04lx\n", GetLastError());
		SetupDiDestroyDeviceInfoList(devInfoSet);
		return NULL;
	}
	devDetailData = (PSP_DEVICE_INTERFACE_DETAIL_DATA)LocalAlloc(LMEM_FIXED, requiredLength);
	if (devDetailData == NULL)
	{
		fprintf(stderr, "Error allocating memory for device interface detail: 0x%04lx\n", GetLastError());
		SetupDiDestroyDeviceInfoList(devInfoSet);
		return NULL;
	}
	devDetailData->cbSize = sizeof(SP_DEVICE_INTERFACE_DETAIL_DATA);
	result = SetupDiGetDeviceInterfaceDetail(devInfoSet, &devInterfaceData, devDetailData, requiredLength, &requiredLength, NULL);
	SetupDiDestroyDeviceInfoList(devInfoSet);
	if (!result)
	{
		fprintf(stderr, "Error getting device interface detail: 0x%04lx\n", GetLastError());
		return NULL;
	}

	//Step 4: Create a file handle for the device and free up the detail data
	fileHandle = CreateFile(devDetailData->DevicePath, GENERIC_WRITE | GENERIC_READ, FILE_SHARE_WRITE | FILE_SHARE_READ, NULL,
	                        OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL | FILE_FLAG_OVERLAPPED, NULL);
	LocalFree(devDetailData);
	if (fileHandle == INVALID_HANDLE_VALUE)
	{
		fprintf(stderr, "Error opening USB boot loader device: 0x%04lx\n", GetLastError());
		return NULL;
	}

	//Step 5: Start up WinUSB on the device and return the resulting handle
	result = WinUsb_Initialize(fileHandle, &usbHandle);
	if (!result)
	{
		fprintf(stderr, "Error initializing WinUsb: 0x%04lx\n", GetLastError());
		return NULL;
	}
	
	return (void *)usbHandle;
}
	
	
//Print the manufacturer, product ID, and serial number string descriptors.
//WinUSB only provides raw string descriptors in wide character format, so
//wprintf() is used for printing.
int USB_PrintDescriptors(void *devHandle)
{
	unsigned char buffer[2048];
	PUSB_STRING_DESCRIPTOR strDes = (PUSB_STRING_DESCRIPTOR)buffer;
	USB_DEVICE_DESCRIPTOR devDesc;
	unsigned long length;
	BOOL result;
	
	//Get the device descriptor, which contains the string descriptor indices
	result = WinUsb_GetDescriptor(devHandle, USB_DEVICE_DESCRIPTOR_TYPE, 0, 0, (PUCHAR)&devDesc, sizeof(devDesc), &length);
	if (!result)
	{
		fprintf(stderr, "Error reading device descriptor: %0x%04lx\n", GetLastError());
		return false;
	}

	//Print the manufacturer name
	result = WinUsb_GetDescriptor(devHandle, USB_STRING_DESCRIPTOR_TYPE, devDesc.iManufacturer, 0, (PUCHAR)strDes, 2048, &length);
	if (!result)
	{
		fprintf(stderr, "Error reading manufacturer string: %0x%04lx\n", GetLastError());
		return false;
	}
	wprintf(L"Manufacturer: %s\n", strDes->bString);

	//Print the product ID
	result = WinUsb_GetDescriptor(devHandle, USB_STRING_DESCRIPTOR_TYPE, devDesc.iProduct, 0, (PUCHAR)strDes, 2048, &length);
	if (!result)
	{
		fprintf(stderr, "Error reading product ID string: %0x%04lx\n", GetLastError());
		return false;
	}
	wprintf(L"Product ID: %s\n", strDes->bString);

	//Print the serial number
	result = WinUsb_GetDescriptor(devHandle, USB_STRING_DESCRIPTOR_TYPE, devDesc.iSerialNumber, 0, (PUCHAR)strDes, 2048, &length);
	if (!result)
	{
		fprintf(stderr, "Error reading serial number string: %0x%04lx\n", GetLastError());
		return false;
	}
	wprintf(L"Serial number: %s\n", strDes->bString);

	return true;
}


//Send the USB data via a bulk transfer. If there's an error, return the amount
//of data actually sent. If all of the data was sent but there's still an
//error, add 1 byte to trigger an error in main().
size_t USB_SendData(void *devHandle, unsigned char *usbData, size_t dataLen)
{
	unsigned long sentLen;
	unsigned long timeout = USB_TIMEOUT_MS;
	BOOL result;

	//Set a timeout for the pipe
	result = WinUsb_SetPipePolicy(devHandle, F28X7X_LOADER_ENDPOINT, PIPE_TRANSFER_TIMEOUT, sizeof(unsigned long), &timeout);
	if (!result)
	{
		fprintf(stderr, "\nError setting pipe timeout: 0x%04lx\n", GetLastError());
		return 0;
	}
	//Write the data to the endpoint pipe, which starts the bulk transfer
	result = WinUsb_WritePipe(devHandle, F28X7X_LOADER_ENDPOINT, (PUCHAR)usbData, dataLen, &sentLen, NULL);
	if (!result)
	{
		fprintf(stderr, "\nError sending bulk transfer: 0x%04lx\n", GetLastError());
		if (sentLen == dataLen)
			return (size_t)(dataLen + 1);
	}
	
	return (size_t)sentLen;
}

//Clean up the resources allocated by WinUsb_Initialize() and close the device
//file handle.
void USB_CleanUp(void *devHandle)
{
	WinUsb_Free(devHandle);
	CloseHandle(fileHandle);
}
