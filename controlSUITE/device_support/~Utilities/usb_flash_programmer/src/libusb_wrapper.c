//This is demonstration code for use with the Texas Instruments USB Loader
//2000. It wraps around the libusb API to provide a generic
//interface to the main() function. For information on the libusb API, see
//the documentation at: http://libusbx.sourceforge.net/api-1.0/index.html


#include "usb_flash_programmer.h"
#include "libusb.h"


//Initialize the libusb environment, then get a handle to the USB device. This
//function performs the following steps:
//
//1. Set up the libusb context by calling libusb_init().
//2. Get a reference to the USB device list from libusb_get_device_list().
//3. Read device descriptor with libusb_get_device_descriptor. Check the VID
//   and PID against the expected values. Repeat until the MCU is found.
//4. Open the device and claim its interface by calling libusb_open() and
//   libusb_claim_interface(). This results in a functional device handle.
//5. Free the device list by calling libusb_free_device_list().
//6. Return the device handle.
//
//A failure at any point prints an error message, cleans up any allocated
//resources, and returns NULL.
void *USB_GetHandle(void)
{
	libusb_device **devList = NULL;
	libusb_device_handle *devHandle = NULL;
	struct libusb_device_descriptor devDesc;
	ssize_t devCount, dev;
//	int dev;
	int err;

	//Initialize libusb
	err = libusb_init(NULL);
	if (err < 0)
	{
		fprintf(stderr, "Error initializing libusb: %s\n", libusb_error_name(err));
		return NULL;
	}
	
	//Get a list of USB devices attached to the system
	devCount = libusb_get_device_list(NULL, &devList);
	if (devCount < 0)
	{
		fprintf(stderr, "Error getting device list: %s\n", libusb_error_name(devCount));
		return NULL;
	}

	//Search the device list for a compatible TI MCU. Match based on vendor
	//and product ID.
	for (dev = 0; dev < devCount; dev++)
	{
		//Read the device descriptor
		err = libusb_get_device_descriptor(devList[dev], &devDesc);
		if (err < 0)
		{
			fprintf(stderr, "Error reading device descriptor for device %d: %s\n", dev, libusb_error_name(err));
			libusb_free_device_list(devList, true);
			return NULL;
		}
		
		//Check the vendor and product IDs
		if (devDesc.idVendor == TI_VENDOR_ID && devDesc.idProduct == F28X7X_LOADER_PRODUCT_ID)
			break;
	}
	
	//Check whether we found any MCUs
	if (dev == devCount)
	{
		fprintf(stderr, "Error: No compatible devices attached\n");
		libusb_free_device_list(devList, true);
		return NULL;
	}
	
	//Open the device and claim the interface. This is required before any IO
	//can take place.
	err = libusb_open(devList[dev], &devHandle);
	if (err < 0)
	{
		fprintf(stderr, "Error opening USB device: %s\n", libusb_error_name(err));
		fprintf(stderr, "This may mean that the driver is not installed\n");
		libusb_free_device_list(devList, true);
		return NULL;
	}
	err = libusb_claim_interface(devHandle, 0);
	if (err < 0)
	{
		fprintf(stderr, "Error claiming USB interface: %s\n", libusb_error_name(err));
		libusb_free_device_list(devList, true);
		return NULL;
	}
	
	//Convert the device handle (a libusb_device_handle pointer) to a void
	//pointer to make the wrapper generic.
	libusb_free_device_list(devList, true);
	return (void *)devHandle;
}
		

//Print the manufacturer, product ID, and serial number string descriptors.
int USB_PrintDescriptors(void *devHandle)
{
	struct libusb_device_descriptor devDesc;
	unsigned char strDes[2048];
	int err;
	
	//Get the device descriptor, which contains the string descriptor indices
	libusb_get_device_descriptor(libusb_get_device(devHandle), &devDesc);
	
	//Print the manufacturer name
	err = libusb_get_string_descriptor_ascii(devHandle, devDesc.iManufacturer, strDes, 2048);
	if (err < 0)
	{
		fprintf(stderr, "Error reading manufacturer string: %s\n", libusb_error_name(err));
		return false;
	}
	printf("Manufacturer: %s\n", strDes);
	
	//Print the product ID
	err = libusb_get_string_descriptor_ascii(devHandle, devDesc.iProduct, strDes, 2048);
	if (err < 0)
	{
		fprintf(stderr, "Error reading product ID string: %s\n", libusb_error_name(err));
		return false;
	}
	printf("Product ID: %s\n", strDes);

	//Print the serial number
	err = libusb_get_string_descriptor_ascii(devHandle, devDesc.iSerialNumber, strDes, 2048);
	if (err < 0)
	{
		fprintf(stderr, "Error reading serial number string: %s\n", libusb_error_name(err));
		return false;
	}
	printf("Serial number: %s\n", strDes);

	return true;
}


//Send the USB data via a bulk transfer. If there's an error, return the amount
//of data actually sent. If all of the data was sent but there's still an
//error, add 1 byte to trigger an error in main(). 
size_t USB_SendData(void *devHandle, unsigned char *usbData, size_t dataLen)
{
	int err;
	size_t sentLen;

	err = libusb_bulk_transfer(devHandle, F28X7X_LOADER_ENDPOINT, usbData, (int)dataLen, (int *)&sentLen, USB_TIMEOUT_MS);
	if (err < 0)
	{
		fprintf(stderr, "\nError sending bulk transfer: %s\n", libusb_error_name(err));
		if (sentLen == dataLen)
			return (size_t)(dataLen + 1);
	}

	return sentLen;
}

//Close the device handle and clean up the libusb contexts
void USB_CleanUp(void *devHandle)
{
	libusb_close(devHandle);
	libusb_exit(NULL);
}


//Workaround for the MinGW32 version of libusb 1.0.18. It needs there to be a
//function called __ms_vsnprintf() present in order to link with the C runtime.
#ifdef __MINGW32__
	void __ms_vsnprintf() {;}
#endif
