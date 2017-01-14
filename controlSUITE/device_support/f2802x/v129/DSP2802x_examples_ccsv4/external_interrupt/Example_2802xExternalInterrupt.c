// TI File $Revision: /main/5 $
// Checkin $Date: December 21, 2010   13:59:36 $
//###########################################################################
//
// FILE:   Example_2802xExternalInterrupt.c
//
// TITLE:  DSP2802x External Interrupt test program.
//
// ASSUMPTIONS:
//
//    This program requires the DSP2802x header files.
//    As supplied, this project is configured for "boot to SARAM" operation.
//
//         Connect GPIO28 to GPIO0.  GPIO0 will be assigned to XINT1
//         Connect GPIO29 to GPIO1.  GPIO1 will be assigned to XINT2
//
//         Monitor GPIO34 with an oscilloscope. GPIO34 will be high outside of the
//         ISRs and low within each ISR.
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
// DESCRIPTION:
//
//    This program sets up GPIO0 as XINT1 and GPIO1 as XINT2.  Two other
//    GPIO signals are used to trigger the interrupt (GPIO28 triggers
//    XINT1 and GPIO29 triggers XINT2).  The user is required to
//    externally connect these signals for the program to work
//    properly.
//
//    XINT1 input is synched to SYSCLKOUT
//    XINT2 has a long qualification - 6 samples at 510*SYSCLKOUT each.
//
//    GPIO34 will go high outside of the interrupts and low within the
//    interrupts. This signal can be monitored on a scope.
//
//    Each interrupt is fired in sequence - XINT1 first and then XINT2
//
//
//    Watch Variables:
//       Xint1Count for the number of times through XINT1 interrupt
//       Xint2Count for the number of times through XINT2 interrupt
//       LoopCount for the number of times through the idle loop
//
//###########################################################################
// $TI Release: 2802x C/C++ Header Files and Peripheral Examples V1.29 $
// $Release Date: January 11, 2011 $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

// Prototype statements for functions found within this file.
interrupt void xint1_isr(void);
interrupt void xint2_isr(void);

// Global variables for this example
volatile Uint32 Xint1Count;
volatile Uint32 Xint2Count;
Uint32 LoopCount;

#define DELAY (CPU_RATE/1000*6*510)  //Qual period at 6 samples

void main(void)
{
   Uint32 TempX1Count;
   Uint32 TempX2Count;

// Step 1. Initialize System Control:
// PLL, WatchDog, enable Peripheral Clocks
// This example function is found in the DSP2802x_SysCtrl.c file.
   InitSysCtrl();

// Step 2. Initalize GPIO:
// This example function is found in the DSP2802x_Gpio.c file and
// illustrates how to set the GPIO to it's default state.
// InitGpio();  // Skipped for this example

// Step 3. Clear all interrupts and initialize PIE vector table:
// Disable CPU interrupts
   DINT;

// Initialize PIE control registers to their default state.
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
   EALLOW;	// This is needed to write to EALLOW protected registers
   PieVectTable.XINT1 = &xint1_isr;
   PieVectTable.XINT2 = &xint2_isr;
   EDIS;   // This is needed to disable write to EALLOW protected registers

// Step 4. Initialize all the Device Peripherals:
// This function is found in DSP2802x_InitPeripherals.c
// InitPeripherals(); // Not required for this example

// Step 5. User specific code, enable interrupts:

// Clear the counters
   Xint1Count = 0; // Count XINT1 interrupts
   Xint2Count = 0; // Count XINT2 interrupts
   LoopCount = 0;  // Count times through idle loop

// Enable XINT1 and XINT2 in the PIE: Group 1 interrupt 4 & 5
// Enable INT1 which is connected to WAKEINT:
   PieCtrlRegs.PIECTRL.bit.ENPIE = 1;          // Enable the PIE block
   PieCtrlRegs.PIEIER1.bit.INTx4 = 1;          // Enable PIE Gropu 1 INT4
   PieCtrlRegs.PIEIER1.bit.INTx5 = 1;          // Enable PIE Gropu 1 INT5
   IER |= M_INT1;                              // Enable CPU INT1
   EINT;                                       // Enable Global Interrupts

// GPIO28 & GPIO29 are outputs, start GPIO28 high and GPIO29 low
   EALLOW;
   GpioDataRegs.GPASET.bit.GPIO28 = 1;         // Load the output latch
   GpioCtrlRegs.GPAMUX2.bit.GPIO28 = 0;        // GPIO
   GpioCtrlRegs.GPADIR.bit.GPIO28 = 1;         // output

   GpioDataRegs.GPACLEAR.bit.GPIO29 = 1;       // Load the output latch
   GpioCtrlRegs.GPAMUX2.bit.GPIO29 = 0;        // GPIO
   GpioCtrlRegs.GPADIR.bit.GPIO29 = 1;         // output
   EDIS;

// GPIO0 and GPIO1 are inputs
   EALLOW;
   GpioCtrlRegs.GPAMUX1.bit.GPIO0 = 0;         // GPIO
   GpioCtrlRegs.GPADIR.bit.GPIO0 = 0;          // input
   GpioCtrlRegs.GPAQSEL1.bit.GPIO0 = 0;        // XINT1 Synch to SYSCLKOUT only

   GpioCtrlRegs.GPAMUX1.bit.GPIO1 = 0;         // GPIO
   GpioCtrlRegs.GPADIR.bit.GPIO1 = 0;          // input
   GpioCtrlRegs.GPAQSEL1.bit.GPIO1 = 2;        // XINT2 Qual using 6 samples
   GpioCtrlRegs.GPACTRL.bit.QUALPRD0 = 0xFF;   // Each sampling window is 510*SYSCLKOUT
   EDIS;

// GPIO0 is XINT1, GPIO1 is XINT2
   EALLOW;
   GpioIntRegs.GPIOXINT1SEL.bit.GPIOSEL = 0;   // XINT1 is GPIO0
   GpioIntRegs.GPIOXINT2SEL.bit.GPIOSEL = 1;   // XINT2 is GPIO1
   EDIS;

// Configure XINT1
   XIntruptRegs.XINT1CR.bit.POLARITY = 0;      // Falling edge interrupt
   XIntruptRegs.XINT2CR.bit.POLARITY = 1;      // Rising edge interrupt

// Enable XINT1 and XINT2
   XIntruptRegs.XINT1CR.bit.ENABLE = 1;        // Enable XINT1
   XIntruptRegs.XINT2CR.bit.ENABLE = 1;        // Enable XINT2


// GPIO34 will go low inside each interrupt.  Monitor this on a scope
   EALLOW;
   GpioCtrlRegs.GPBMUX1.bit.GPIO34 = 0;        // GPIO
   GpioCtrlRegs.GPBDIR.bit.GPIO34 = 1;         // output
   EDIS;

// Step 6. IDLE loop:
   for(;;)
   {

      TempX1Count = Xint1Count;
      TempX2Count = Xint2Count;

      // Trigger both XINT1
      GpioDataRegs.GPBSET.bit.GPIO34 = 1;   // GPIO34 is high
      GpioDataRegs.GPACLEAR.bit.GPIO28 = 1; // Lower GPIO28, trigger XINT1
      while(Xint1Count == TempX1Count) {}

      // Trigger both XINT2

      GpioDataRegs.GPBSET.bit.GPIO34 = 1;   // GPIO34 is high
      DELAY_US(DELAY);                      // Wait for Qual period
      GpioDataRegs.GPASET.bit.GPIO29 = 1;   // Raise GPIO29, trigger XINT2
      while(Xint2Count == TempX2Count) {}

      // Check that the counts were incremented properly and get ready
      // to start over.
      if(Xint1Count == TempX1Count+1 && Xint2Count == TempX2Count+1)
      {
          LoopCount++;
          GpioDataRegs.GPASET.bit.GPIO28 = 1;   // raise GPIO28
          GpioDataRegs.GPACLEAR.bit.GPIO29 = 1; // lower GPIO29
      }
      else
      {
          asm("      ESTOP0"); // stop here
      }

   }


}

// Step 7. Insert all local Interrupt Service Routines (ISRs) and functions here:
	// If local ISRs are used, reassign vector addresses in vector table as
    // shown in Step 5

interrupt void xint1_isr(void)
{
	GpioDataRegs.GPBCLEAR.all = 0x4;   // GPIO34 is low
	Xint1Count++;

	// Acknowledge this interrupt to get more from group 1
	PieCtrlRegs.PIEACK.all = PIEACK_GROUP1;
}

interrupt void xint2_isr(void)
{
	GpioDataRegs.GPBCLEAR.all = 0x4;   // GPIO34 is low
	Xint2Count++;

	// Acknowledge this interrupt to get more from group 1
	PieCtrlRegs.PIEACK.all = PIEACK_GROUP1;
}

//===========================================================================
// No more.
//===========================================================================
