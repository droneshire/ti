// TI File $Revision: /main/4 $
// Checkin $Date: October 6, 2010   14:43:10 $
//###########################################################################
//
// FILE:    Example_2802xSci_FFDLB.c
//
// TITLE:   DSP2802x Device SCI FIFO Digital Loop Back Test.
//
// ASSUMPTIONS:
//
//    This program requires the DSP2802x header files.
//
//    This program uses the internal loop back test mode of the peripheral.
//    Other then boot mode pin configuration, no other hardware configuration
//    is required.
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
//    This test uses the loopback test mode of the SCI module to send
//    characters starting with 0x00 through 0xFF.  The test will send
//    a character and then check the receive buffer for a correct match.
//
//          Watch Variables:
//                LoopCount      Number of characters sent
//                ErrorCount     Number of errors detected
//                SendChar       Character sent
//                RecievedChar   Character recieved
//
//
//###########################################################################
//
// Original Author: S.S.
//
// $TI Release: 2802x C/C++ Header Files and Peripheral Examples V1.28 $
// $Release Date: October 15, 2010 $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

// Prototype statements for functions found within this file.
void scia_loopback_init(void);
void scia_fifo_init(void);
void scia_xmit(int a);
void error(void);
interrupt void scia_rx_isr(void);
interrupt void scia_tx_isr(void);

// Global counts used in this example
Uint16 LoopCount;
Uint16 ErrorCount;

void main(void)
{
    Uint16 SendChar;
    Uint16 ReceivedChar;

// Step 1. Initialize System Control registers, PLL, WatchDog, Clocks to default state:
// This function is found in the DSP2802x_SysCtrl.c file.
	InitSysCtrl();

// Step 2. Select GPIO for the device or for the specific application:
// This function is found in the DSP2802x_Gpio.c file.
// InitGpio(); skip this as this is example selects the I/O
// for SCI-A in this file itself
   InitSciGpio();

// Step 3. Initialize PIE vector table:
// The PIE vector table is initialized with pointers to shell Interrupt
// Service Routines (ISR).  The shell routines are found in DSP2802x_DefaultIsr.c.
// Insert user specific ISR code in the appropriate shell ISR routine in
// the DSP28_DefaultIsr.c file.

// Disable and clear all CPU interrupts:
	DINT;
	IER = 0x0000;
	IFR = 0x0000;

      // Initialize Pie Control Registers To Default State:
      // This function is found in the DSP2802x_PieCtrl.c file.
	  // InitPieCtrl();  PIE is not used for this example

      // Initialize the PIE Vector Table To a Known State:
      // This function is found in DSP2802x_PieVect.c.
      // This function populates the PIE vector table with pointers
      // to the shell ISR functions found in DSP2802x_DefaultIsr.c.
	  InitPieVectTable();

      // Enable CPU and PIE interrupts
      // This example function is found in the DSP2802x_PieCtrl.c file.
      EnableInterrupts();

// Step 4. Initialize all the Device Peripherals to a known state:
// This function is found in DSP2802x_InitPeripherals.c
// InitPeripherals(); skip this for SCI tests

// Step 5. User specific functions, Reassign vectors (optional), Enable Interrupts:

    LoopCount = 0;
    ErrorCount = 0;

    scia_fifo_init();	   // Initialize the SCI FIFO
    scia_loopback_init();  // Initalize SCI for digital loop back

    // Note: Autobaud lock is not required for this example

    // Send a character starting with 0
    SendChar = 0;

// Step 6. Send Characters forever starting with 0x00 and going through
// 0xFF.  After sending each, check the recieve buffer for the correct value

	for(;;)
    {
       scia_xmit(SendChar);
       while(SciaRegs.SCIFFRX.bit.RXFFST !=1) { } // wait for XRDY =1 for empty state

       // Check received character
       ReceivedChar = SciaRegs.SCIRXBUF.all;
       if(ReceivedChar != SendChar) error();

       // Move to the next character and repeat the test
       SendChar++;
       // Limit the character to 8-bits
       SendChar &= 0x00FF;
       LoopCount++;
    }

}

// Step 7. Insert all local Interrupt Service Routines (ISRs) and functions here:

void error(void)
{
      ErrorCount++;
//    asm("     ESTOP0");  // Uncomment to stop the test here
//    for (;;);

}

// Test 1,SCIA  DLB, 8-bit word, baud rate 0x000F, default, 1 STOP bit, no parity
void scia_loopback_init()
{
    // Note: Clocks were turned on to the SCIA peripheral
    // in the InitSysCtrl() function

 	SciaRegs.SCICCR.all =0x0007;   // 1 stop bit,  No loopback
                                   // No parity,8 char bits,
                                   // async mode, idle-line protocol
	SciaRegs.SCICTL1.all =0x0003;  // enable TX, RX, internal SCICLK,
                                   // Disable RX ERR, SLEEP, TXWAKE
	SciaRegs.SCICTL2.all =0x0003;
	SciaRegs.SCICTL2.bit.TXINTENA =1;
	SciaRegs.SCICTL2.bit.RXBKINTENA =1;
    SciaRegs.SCIHBAUD    =0x0000;
    SciaRegs.SCILBAUD    =0x000F;
	SciaRegs.SCICCR.bit.LOOPBKENA =1; // Enable loop back
	SciaRegs.SCICTL1.all =0x0023;     // Relinquish SCI from Reset
}

// Transmit a character from the SCI'
void scia_xmit(int a)
{
    SciaRegs.SCITXBUF=a;
}

// Initalize the SCI FIFO
void scia_fifo_init()
{
    SciaRegs.SCIFFTX.all=0xE040;
    SciaRegs.SCIFFRX.all=0x2044;
    SciaRegs.SCIFFCT.all=0x0;

}





//===========================================================================
// No more.
//===========================================================================

