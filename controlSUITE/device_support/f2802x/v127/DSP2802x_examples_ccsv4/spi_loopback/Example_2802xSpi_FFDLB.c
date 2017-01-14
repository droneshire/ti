// TI File $Revision: /main/3 $
// Checkin $Date: December 17, 2009   14:37:18 $
//###########################################################################
//
// FILE:   Example_2802xSpi_FFDLB.c
//
// TITLE:  DSP2802x Device Spi Digital Loop Back program.
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
// DESCRIPTION:
//
//    This program is a SPI example that uses the internal loopback of
//    the peripheral.  Interrupts are not used.
//
//    A stream of data is sent and then compared to the recieved stream.
//
//    The sent data looks like this:
//    0000 0001 0002 0003 0004 0005 0006 0007 .... FFFE FFFF
//
//    This pattern is repeated forever.
//
//          Watch Variables:
//                sdata - sent data
//                rdata - received data
//
////###########################################################################
// Original Author: S.S.
//
// $TI Release: 2802x Header Files V1.27 $
// $Release Date: June 28, 2010 $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

// Prototype statements for functions found within this file.
// interrupt void ISRTimer2(void);
void delay_loop(void);
void spi_xmit(Uint16 a);
void spi_fifo_init(void);
void spi_init(void);
void error(void);

void main(void)
{
   Uint16 sdata;  // send data
   Uint16 rdata;  // received data

// Step 1. Initialize System Control:
// PLL, WatchDog, enable Peripheral Clocks
// This example function is found in the DSP2802x_SysCtrl.c file.
   InitSysCtrl();

// Step 2. Initalize GPIO:
// This example function is found in the DSP2802x_Gpio.c file and
// illustrates how to set the GPIO to it's default state.
// InitGpio();  // Skipped for this example
// Setup only the GP I/O only for SPI-A functionality
// This function is found in DSP2802x_Spi.c
   InitSpiaGpio();

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

// Step 4. Initialize all the Device Peripherals:
// This function is found in DSP2802x_InitPeripherals.c
// InitPeripherals(); // Not required for this example
   spi_fifo_init();	  // Initialize the Spi FIFO
   spi_init();		  // init SPI

// Step 5. User specific code:
// Interrupts are not used in this example.
   sdata = 0x0000;
   for(;;)
   {
     // Transmit data
     spi_xmit(sdata);
     // Wait until data is received
     while(SpiaRegs.SPIFFRX.bit.RXFFST !=1) { }
     // Check against sent data
     rdata = SpiaRegs.SPIRXBUF;
     if(rdata != sdata) error();
     sdata++;
   }
}

// Step 7. Insert all local Interrupt Service Routines (ISRs) and functions here:

void delay_loop()
{
    long      i;
    for (i = 0; i < 1000000; i++) {}
}

void error(void)
{
    asm("     ESTOP0");						// Test failed!! Stop!
    for (;;);
}

void spi_init()
{
	SpiaRegs.SPICCR.all =0x000F;	             // Reset on, rising edge, 16-bit char bits
	SpiaRegs.SPICTL.all =0x0006;    		     // Enable master mode, normal phase,
                                                 // enable talk, and SPI int disabled.
	SpiaRegs.SPIBRR =0x007F;
    SpiaRegs.SPICCR.all =0x009F;		         // Relinquish SPI from Reset
    SpiaRegs.SPIPRI.bit.FREE = 1;                // Set so breakpoints don't disturb xmission
}

void spi_xmit(Uint16 a)
{
    SpiaRegs.SPITXBUF=a;
}

void spi_fifo_init()
{
// Initialize SPI FIFO registers
    SpiaRegs.SPIFFTX.all=0xE040;
    SpiaRegs.SPIFFRX.all=0x2044;
    SpiaRegs.SPIFFCT.all=0x0;
}

//===========================================================================
// No more.
//===========================================================================

