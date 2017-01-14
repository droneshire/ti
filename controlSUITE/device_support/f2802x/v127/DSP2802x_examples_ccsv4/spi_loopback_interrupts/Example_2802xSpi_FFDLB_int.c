// TI File $Revision: /main/3 $
// Checkin $Date: December 17, 2009   14:37:38 $
//###########################################################################
//
// FILE:   Example_2802xSpi_FFDLB_int.c
//
// TITLE:  DSP2802x Device Spi Digital Loop Back with Interrupts Example.
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
//    This program is a SPI-A example that uses the internal loopback of
//    the peripheral.  Both interrupts and the SPI FIFOs are used.
//
//    A stream of data is sent and then compared to the recieved stream.
//
//    The sent data looks like this:
//    0000 0001
//    0001 0002
//    0002 0003
//    ....
//    FFFE FFFF
//    FFFF 0000
//     etc..
//
//    This pattern is repeated forever.
//
//
// Watch Variables:
//     sdata[2]    - Data to send
//     rdata[2]    - Received data
//     rdata_point - Used to keep track of the last position in
//                   the receive stream for error checking
//###########################################################################
//
// Original Source by S.D.
//
// $TI Release: 2802x Header Files V1.27 $
// $Release Date: June 28, 2010 $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

// Prototype statements for functions found within this file.
// interrupt void ISRTimer2(void);
interrupt void spiTxFifoIsr(void);
interrupt void spiRxFifoIsr(void);
void delay_loop(void);
void spi_fifo_init(void);
void error();

Uint16 sdata[2];     // Send data buffer
Uint16 rdata[2];     // Receive data buffer
Uint16 rdata_point;  // Keep track of where we are
                     // in the data stream to check received data

void main(void)
{
   Uint16 i;

// Step 1. Initialize System Control:
// PLL, WatchDog, enable Peripheral Clocks
// This example function is found in the DSP2802x_SysCtrl.c file.
   InitSysCtrl();

// Step 2. Initalize GPIO:
// This example function is found in the DSP2802x_Gpio.c file and
// illustrates how to set the GPIO to it's default state.
// InitGpio();  // Skipped for this example
// Setup only the GP I/O only for SPI-A functionality
   InitSpiaGpio();

// Step 3. Initialize PIE vector table:
// Disable and clear all CPU interrupts
   DINT;
   IER = 0x0000;
   IFR = 0x0000;

// Initialize PIE control registers to their default state:
// This function is found in the DSP2802x_PieCtrl.c file.
   InitPieCtrl();

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
   PieVectTable.SPIRXINTA = &spiRxFifoIsr;
   PieVectTable.SPITXINTA = &spiTxFifoIsr;
   EDIS;   // This is needed to disable write to EALLOW protected registers

// Step 4. Initialize all the Device Peripherals:
// This function is found in DSP2802x_InitPeripherals.c
// InitPeripherals(); // Not required for this example
   spi_fifo_init();	  // Initialize the SPI only

// Step 5. User specific code, enable interrupts:

// Initalize the send data buffer
   for(i=0; i<2; i++)
   {
      sdata[i] = i;
   }
   rdata_point = 0;

// Enable interrupts required for this example
   PieCtrlRegs.PIECTRL.bit.ENPIE = 1;   // Enable the PIE block
   PieCtrlRegs.PIEIER6.bit.INTx1=1;     // Enable PIE Group 6, INT 1
   PieCtrlRegs.PIEIER6.bit.INTx2=1;     // Enable PIE Group 6, INT 2
   IER=0x20;                            // Enable CPU INT6
   EINT;                                // Enable Global Interrupts

// Step 6. IDLE loop. Just sit and loop forever (optional):
	for(;;);

}

// Some Useful local functions
void delay_loop()
{
    long      i;
    for (i = 0; i < 1000000; i++) {}
}

void error(void)
{
    asm("     ESTOP0");	 //Test failed!! Stop!
    for (;;);
}

void spi_fifo_init()
{
// Initialize SPI FIFO registers
   SpiaRegs.SPICCR.bit.SPISWRESET=0; // Reset SPI

   SpiaRegs.SPICCR.all=0x001F;       //16-bit character, Loopback mode
   SpiaRegs.SPICTL.all=0x0017;       //Interrupt enabled, Master/Slave XMIT enabled
   SpiaRegs.SPISTS.all=0x0000;
   SpiaRegs.SPIBRR=0x0063;           // Baud rate
   SpiaRegs.SPIFFTX.all=0xC022;      // Enable FIFO's, set TX FIFO level to 2
   SpiaRegs.SPIFFRX.all=0x0022;      // Set RX FIFO level to 2
   SpiaRegs.SPIFFCT.all=0x00;
   SpiaRegs.SPIPRI.all=0x0010;

   SpiaRegs.SPICCR.bit.SPISWRESET=1;  // Enable SPI

   SpiaRegs.SPIFFTX.bit.TXFIFO=1;
   SpiaRegs.SPIFFRX.bit.RXFIFORESET=1;
}

interrupt void spiTxFifoIsr(void)
{
 	Uint16 i;
    for(i=0;i<2;i++)
    {
 	   SpiaRegs.SPITXBUF=sdata[i];      // Send data
    }

    for(i=0;i<2;i++)                    // Increment data for next cycle
    {
 	   sdata[i]++;
    }

    SpiaRegs.SPIFFTX.bit.TXFFINTCLR=1;  // Clear Interrupt flag
	PieCtrlRegs.PIEACK.all|=0x20;  		// Issue PIE ACK
}

interrupt void spiRxFifoIsr(void)
{
    Uint16 i;
    for(i=0;i<2;i++)
    {
	    rdata[i]=SpiaRegs.SPIRXBUF;		// Read data
	}
	for(i=0;i<2;i++)                    // Check received data
	{
	    if(rdata[i] != rdata_point+i) error();
	}
	rdata_point++;
	SpiaRegs.SPIFFRX.bit.RXFFOVFCLR=1;  // Clear Overflow flag
	SpiaRegs.SPIFFRX.bit.RXFFINTCLR=1; 	// Clear Interrupt flag
	PieCtrlRegs.PIEACK.all|=0x20;       // Issue PIE ack
}

//===========================================================================
// No more.
//===========================================================================

