//This is demonstration code for use with the Texas Instruments TMS320F28x7x
//USB boot loader. It defines the device VID and PID along with the Windows
//device class and driver GUIDs. It also contains prototypes for the wrapper
//function interface for the USB libraries.

#ifndef _USBLOADER2000_H_
#define _USBLOADER2000_H_

#include <stdio.h>
#include <stdlib.h>
#include <Windows.h>

#define true 1
#define false 0

//USB VID and PID
#define TI_VENDOR_ID				0x1cbe
#define F28X7X_LOADER_PRODUCT_ID	0x00ff

//TI MCU device class GUID, which was defined in the driver INF to be {A3CA7927-E25F-4153-A582-0A328BEEE298}
#define TI_MCU_GUID {0xA3CA7927, 0xE25F, 0x4153, {0xA5, 0x82, 0x0A, 0x32, 0x8B, 0xEE, 0xE2, 0x98}}

//Driver-specific GUID, which was defined in the driver INF to be {7D61D87E-B7B8-4FB5-BB54-F2889119C5C8}
#define F28X7X_LOADER_GUID {0x7D61D87E, 0xB7B8, 0x4FB5, {0xBB, 0x54, 0xF2, 0x88, 0x91, 0x19, 0xC5, 0xC8}}

//Bulk OUT endpoint for receiving the loader data
#define F28X7X_LOADER_ENDPOINT 0x01

//Timeout for bulk data transfer in milliseconds
#define USB_TIMEOUT_MS 5000

//USB wrapper function prototypes
void *USB_GetHandle(void);
int USB_PrintDescriptors(void *devHandle);
size_t USB_SendData(void *devHandle, unsigned char *usbData, size_t dataLen);
void USB_CleanUp(void *devHandle);

#endif //_F28X7X_USB_LOADER_H_
