//###########################################################################
//
// FILE:    Example_2802xECap_apwm.c
//
// TITLE:   f2802x ECAP APWM Example
//
// ASSUMPTIONS:
//
//    This program requires the f2802x header files.
//
//    Monitor eCAP1 - eCAP4 pins on a oscilloscope as
//    described below.
//
//       eCAP1 on GPIO5
//
//    As supplied, this project is configured for "boot to SARAM"
//    operation.  The 2802x Boot Mode table is shown below.
//    For information on configuring the boot mode of an eZdsp,
//    please refer to the documentation included with the eZdsp,
//
//    $Boot_Table
//    While an emulator is connected to your device, the TRSTn pin = 1,
//    which sets the device into EMU_BOOT boot mode. In this mode, the
//    peripheral boot modes are as follows:
//
//      Boot Mode:   EMU_KEY        EMU_BMODE
//                   (0xD00)	     (0xD01)
//      ---------------------------------------
//      Wait		 !=0x55AA        X
//      I/O		     0x55AA	         0x0000
//      SCI		     0x55AA	         0x0001
//      Wait 	     0x55AA	         0x0002
//      Get_Mode	 0x55AA	         0x0003
//      SPI		     0x55AA	         0x0004
//      I2C		     0x55AA	         0x0005
//      OTP		     0x55AA	         0x0006
//      Wait		 0x55AA	         0x0007
//      Wait		 0x55AA	         0x0008
//      SARAM		 0x55AA	         0x000A	  <-- "Boot to SARAM"
//      Flash		 0x55AA	         0x000B
//	    Wait		 0x55AA          Other
//
//   Write EMU_KEY to 0xD00 and EMU_BMODE to 0xD01 via the debugger
//   according to the Boot Mode Table above. Build/Load project,
//   Reset the device, and Run example
//
//   $End_Boot_Table
//
//
//
// DESCRIPTION:
//
//    This program sets up the eCAP pins in the APWM mode.
//    This program runs at 60 MHz or 40 MHz SYSCLKOUT assuming
//    a 10 MHz OSCCLK depending on the max frequency allowed
//    by a particular device.
//
//    eCAP1 will come out on the GPIO5 pin.
//    This pin is configured to vary between 3 Hz and 6 Hz (at 60 MHz
//    SYSCLKOUT) or 2 Hz and 4 Hz (at 40 MHz SYSCLKOUT) using the
//    shadow registers to load the next period/compare values.
//
//    --------------------------------------------------------------
//    Watch Variables:
//
//       ERR_LOG (bit 15 is set to remind user to visually
//       check the PWM action on the CAP pins.
//
//       Monitor eCAP1 pin on GPIO5 for PWM frequency
//
//###########################################################################
// $TI Release: F2802x Support Library v230 $
// $Release Date: Fri May  8 07:43:05 CDT 2015 $
// $Copyright: Copyright (C) 2008-2015 Texas Instruments Incorporated -
//             http://www.ti.com/ ALL RIGHTS RESERVED $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

// Global variables
uint16_t direction = 0;

void main(void)
{
// WARNING: Always ensure you call memcpy before running any functions from RAM
// InitSysCtrl includes a call to a RAM based function and without a call to
// memcpy first, the processor will go "into the weeds"
   #ifdef _FLASH
	   memcpy(&RamfuncsRunStart, &RamfuncsLoadStart, (size_t)&RamfuncsLoadSize);
   #endif

// Step 1. Initialize System Control:
// PLL, WatchDog, enable Peripheral Clocks
// This example function is found in the f2802x_SysCtrl.c file.
   InitSysCtrl();

// Step 2. Initialize GPIO:
// This example function is found in the f2802x_Gpio.c file and
// illustrates how to set the GPIO to it's default state.
// InitGpio();  // Skipped for this example

// Initialize the GPIO pins for eCAP.
// This function is found in the f2802x_ECap.c file
   InitECapGpio();

// Step 3. Clear all interrupts and initialize PIE vector table:
// Disable CPU interrupts
   DINT;

// Initialize the PIE control registers to their default state.
// The default state is all PIE interrupts disabled and flags
// are cleared.
// This function is found in the f2802x_PieCtrl.c file.
   InitPieCtrl();

// Disable CPU interrupts and clear all CPU interrupt flags:
   IER = 0x0000;
   IFR = 0x0000;

// Initialize the PIE vector table with pointers to the shell Interrupt
// Service Routines (ISR).
// This will populate the entire table, even if the interrupt
// is not used in this example.  This is useful for debug purposes.
// The shell ISR routines are found in f2802x_DefaultIsr.c.
// This function is found in f2802x_PieVect.c.
   InitPieVectTable();

// Interrupts that are used in this example are re-mapped to
// ISR functions found within this file.
// No interrupts used for this example.

// Step 4. Initialize all the Device Peripherals:
// Not required for this example

// Step 5. User specific code

   // Setup APWM mode on CAP1, set period and compare registers
   ECap1Regs.ECCTL2.bit.CAP_APWM = 1;	// Enable APWM mode
   ECap1Regs.CAP1 = 0x01312D00;			// Set Period value
   ECap1Regs.CAP2 = 0x00989680;			// Set Compare value
   ECap1Regs.ECCLR.all = 0x0FF;			// Clear pending interrupts
   ECap1Regs.ECEINT.bit.CTR_EQ_CMP = 1; // enable Compare Equal Int

   // Start counters
   ECap1Regs.ECCTL2.bit.TSCTRSTOP = 1;
   for(;;)
   {
      // vary freq
      if(ECap1Regs.CAP1 >= 0x01312D00)
      {
         direction = 0;
      }
      else if (ECap1Regs.CAP1 <= 0x00989680)
      {
         direction = 1;
      }

      // update the period using CAP3 (APRD) shadow register
      if(direction == 0)
      {
         ECap1Regs.CAP3 = ECap1Regs.CAP1 - 500000;
      }
      else
      {
         ECap1Regs.CAP3 = ECap1Regs.CAP1 + 500000;
      }
   }
}

//===========================================================================
// No more.
//===========================================================================
