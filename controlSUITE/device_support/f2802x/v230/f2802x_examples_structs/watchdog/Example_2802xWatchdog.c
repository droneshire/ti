//###########################################################################
//
// FILE:   Example_2802xWatchdog.c
//
// TITLE:  f2802x Watchdog interrupt test program.
//
// ASSUMPTIONS:
//
//    This program requires the f2802x header files.
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
// DESCRIPTION:
//
//   This program exercises the watchdog.
//
//   First the watchdog is connected to the WAKEINT interrupt of the
//   PIE block.  The code is then put into an infinite loop.
//
//   The user can select to feed the watchdog key register or not
//   by commenting one line of code in the infinite loop.
//
//   If the watchdog key register is fed by the ServiceDog function
//   then the WAKEINT interrupt is not taken.  If the key register
//   is not fed by the ServiceDog function then WAKEINT will be taken.
//
//      Watch Variables:
//         LoopCount for the number of times through the infinite loop
//         WakeCount for the number of times through WAKEINT
//
//###########################################################################
// $TI Release: F2802x Support Library v230 $
// $Release Date: Fri May  8 07:43:05 CDT 2015 $
// $Copyright: Copyright (C) 2008-2015 Texas Instruments Incorporated -
//             http://www.ti.com/ ALL RIGHTS RESERVED $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

// Prototype statements for functions found within this file.
__interrupt void wakeint_isr(void);

// Global variables for this example
uint32_t WakeCount;
uint32_t LoopCount;

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

// Step 3. Clear all interrupts and initialize PIE vector table:
// Disable CPU interrupts
   DINT;

// Initialize PIE control registers to their default state.
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
   EALLOW;	// This is needed to write to EALLOW protected registers
   PieVectTable.WAKEINT = &wakeint_isr;
   EDIS;   // This is needed to disable write to EALLOW protected registers

// Step 4. Initialize all the Device Peripherals:
// Not required for this example

// Step 5. User specific code, enable interrupts:

// Clear the counters
   WakeCount = 0; // Count interrupts
   LoopCount = 0; // Count times through idle loop

// Connect the watchdog to the WAKEINT interrupt of the PIE
// Write to the whole SCSR register to avoid clearing WDOVERRIDE bit
   EALLOW;
   SysCtrlRegs.SCSR = BIT1;
   EDIS;

// Enable WAKEINT in the PIE: Group 1 interrupt 8
// Enable INT1 which is connected to WAKEINT:
   PieCtrlRegs.PIECTRL.bit.ENPIE = 1;   // Enable the PIE block
   PieCtrlRegs.PIEIER1.bit.INTx8 = 1;   // Enable PIE Group 1 INT8
   IER |= M_INT1;                       // Enable CPU INT1
   EINT;                                // Enable Global Interrupts

// Reset the watchdog counter
   ServiceDog();

// Enable the watchdog
   EALLOW;
   SysCtrlRegs.WDCR = 0x0028;
   EDIS;

// Step 6. IDLE loop. Just sit and loop forever (optional):
   for(;;)
   {
      LoopCount++;

      // Uncomment ServiceDog to just loop here
      // Comment ServiceDog to take the WAKEINT instead
      // ServiceDog();
   }
}

// Step 7. Insert all local Interrupt Service Routines (ISRs) and functions here:
// If local ISRs are used, reassign vector addresses in vector table as
// shown in Step 5

__interrupt void wakeint_isr(void)
{
	WakeCount++;

	// Acknowledge this interrupt to get more from group 1
	PieCtrlRegs.PIEACK.all = PIEACK_GROUP1;
}

//===========================================================================
// No more.
//===========================================================================
