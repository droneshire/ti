// TI File $Revision: /main/3 $
// Checkin $Date: December 17, 2009   14:35:29 $
//###########################################################################
//
// FILE:    Example_2802xIdleWake.c
//
// TITLE:   Device Idle Mode and Wakeup Program.
//
// ASSUMPTIONS:
//
//    This program requires the DSP2802x header files.
//
//    GPIO0 is configured as an XINT1 pin to trigger a
//    XINT1 interrupt upon detection of a falling edge.
//    Initially, pull GPIO0 high externally. To wake device
//    from idle mode by triggering an XINT1 interrupt,
//    pull GPIO0 low (falling edge)
//
//    To observe when device wakes from IDLE mode, monitor
//    GPIO1 with an oscilloscope (set to 1 in XINT1 ISR)
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
//    This example puts the device into IDLE mode.
//
//    The example then wakes up the device from IDLE using XINT1
//    which triggers on a falling edge from GPIO0.
//    This pin must be pulled from high to low by an external agent for
//    wakeup.
//
//    To observe the device wakeup from IDLE mode, monitor GPIO1 with
//    an oscilloscope, which toggles in the XINT_1_ISR.
//
//###########################################################################
// $TI Release: 2802x Header Files V1.27 $
// $Release Date: June 28, 2010 $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

// Prototype statements for functions found within this file.
interrupt void XINT_1_ISR(void);  	// ISR

void main()

{
// Step 1. Initialize System Control:
// PLL, WatchDog, enable Peripheral Clocks
// This example function is found in the DSP2802x_SysCtrl.c file.
   InitSysCtrl();

// Step 2. Initalize GPIO:
// This example function is found in the DSP2802x_Gpio.c file and
// illustrates how to set the GPIO to it's default state.
// InitGpio();  // Skipped for this example

    EALLOW;
	GpioCtrlRegs.GPAPUD.all = 0;                    // Enable all Pull-ups
	GpioCtrlRegs.GPBPUD.all = 0;
	GpioIntRegs.GPIOXINT1SEL.bit.GPIOSEL = 0;		// Choose GPIO0 as the XINT1 pin.
	GpioCtrlRegs.GPADIR.all = 0xFFFFFFFE;	        // All pins are outputs except 0
	GpioDataRegs.GPADAT.all = 0x00000000;	        // All I/O pins are driven low
    EDIS;

    XIntruptRegs.XINT1CR.bit.ENABLE = 1; 	        // Enable XINT1 pin
	XIntruptRegs.XINT1CR.bit.POLARITY = 0;	        // Interrupt triggers on falling edge

// Step 3. Clear all interrupts and initialize PIE vector table:
// Disable CPU interrupts
   DINT;

// Initialize the PIE control registers to their default state.
// The default state is all PIE interrupts disabled and flags
// are cleared.
// This function is found in the DSP2802x_PieCtrl.c file.
   InitPieCtrl();

// Disable CPU interrupts and clear all CPU interrupt flags:
   IER = 0x0000;
   IFR = 0x0000;

// Initialize the PIE vector table with pointers to the shell Interrupt
// Service Routines (ISR).
// This will populate the entire table, even if the interrupt
// is not used in this example.  This is useful for debug purposes.
// The shell ISR routines are found in DSP2802x_DefaultIsr.c.
// This function is found in DSP2802x_PieVect.c.
   InitPieVectTable();

// Interrupts that are used in this example are re-mapped to
// ISR functions found within this file.
   EALLOW;  // This is needed to write to EALLOW protected registers
   PieVectTable.XINT1 = &XINT_1_ISR;
   EDIS;

// Step 4. Initialize all the Device Peripherals:
// Not applicable for this example.

// Step 5. User specific code, enable interrupts:

// Enable CPU INT1 which is connected to WakeInt:
   IER |= M_INT1;

// Enable XINT1 in the PIE: Group 1 interrupt 4
   PieCtrlRegs.PIEIER1.bit.INTx4 = 1;
   PieCtrlRegs.PIEACK.bit.ACK1 = 1;

// Enable global Interrupts:
   EINT;   // Enable Global interrupt INTM

// Write the LPM code value
  EALLOW;
  if (SysCtrlRegs.PLLSTS.bit.MCLKSTS != 1) // Only enter Idle mode when PLL is not in limp mode.
  {
     SysCtrlRegs.LPMCR0.bit.LPM = 0x0000;  // LPM mode = Idle
  }
  EDIS;
  asm(" IDLE");                            // Device waits in IDLE until XINT1 interrupts
  for(;;){}
}

interrupt void XINT_1_ISR(void)
{
   GpioDataRegs.GPATOGGLE.bit.GPIO1 = 1;	// GPIO1 is toggled upon exiting IDLE.
   PieCtrlRegs.PIEACK.bit.ACK1 = 1;
   EINT;

}












