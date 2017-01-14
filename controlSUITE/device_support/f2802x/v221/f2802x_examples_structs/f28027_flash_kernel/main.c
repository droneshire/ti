//###########################################################################
//
// FILE:    main.c
//
// TITLE:   F28027 Flash Kernel
//
// DESCRIPTION:
//
//    This example is for use with the SerialLoader2000 utility.  This
//    application is intended to be loaded into the device's RAM via the
//    SCI boot mode.  After successfully loaded this program implements a
//    modified version of the SCI boot protocol that allows a user application
//    to be programmed into flash.
//
//###########################################################################
// $TI Release: 2802x C/C++ Header Files and Peripheral Examples V1.29 $
// $Release Date: January 11, 2011 $
//###########################################################################

#include "DSP28x_Project.h"
extern Uint32 SCI_Boot();

void (*ApplicationPtr) (void);

Uint32 main(void) {
	//GPIO and SCI are still setup from Sci_Boot()
	//Setup sysctl and pll
   DisableDog();
   IntOsc1Sel();
   InitPll(DSP28_PLLCR,DSP28_DIVSEL);
   InitFlash();

   DELAY_US(100);

	return SCI_Boot();

}