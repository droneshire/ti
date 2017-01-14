//This is a demonstration program for use with the TMS320F28x7x boot
//loader. It provides a simple example of how to create a CCS project
//suitable for conversion to the boot loader format.

//Some of the project files are links to version 120 of the controlSUITE
//device_support files for the F2837xD. At the time of this writing,
//version 120 is the latest version available. You may need to re-link
//and update the include paths when a newer version becomes available.


#include "F28x_Project.h"


void main(void)
{
	//Disable the watchdog. A reset here will start up the USB boot loader
	//again! This can be very confusing when debugging.
	EALLOW;
	WdRegs.WDCR.all = 0x68;
	EDIS;

	//Start with a breakpoint so that someone running CCS can see that the load worked
//	asm(" ESTOP0");

	//Set up GPIO 10 for pin toggling
	InitGpio();
	GPIO_SetupPinOptions(10, GPIO_OUTPUT, GPIO_PUSHPULL);
	
	//Toggle GPIO 10
	while (1)
	{
		GpioDataRegs.GPATOGGLE.bit.GPIO10 = 1;
		asm(" RPT #100 || NOP");
	}
}
