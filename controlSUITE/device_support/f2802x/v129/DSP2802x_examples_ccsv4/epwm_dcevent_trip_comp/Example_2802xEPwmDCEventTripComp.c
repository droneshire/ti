// TI File $Revision: /main/5 $
// Checkin $Date: December 16, 2010   16:34:40 $
//###########################################################################
//
// FILE:    Example_2802xEpwmTripZoneComp.c
//
// TITLE:   Check PWM Trip Zone Test with Comparator Inputs
//
// ASSUMPTIONS:
//
//    This program requires the DSP2802x header files.
//
//    Initially make voltage on pin COMP1A greater than COMP1B if using dual pin compare; else make internal DAC output lower than V on COMP1A
//
//    During the test, monitor ePWM1 outputs on a scope 
//    increase voltage on inverting side of comparator(either through COMP1B pin or internal DAC setting) to trigger
//    a DCAEVT1, and DCBEVT1 . 
//
//       EPWM1A is on GPIO0
//       EPWM1B is on GPIO1

//
//   DCAEVT1, DCBEVT1 a are all defined as
//   true when COMP1OUT is low
//    
//    ePWM1 will react to DCAEVT1 and DCBEVT1 as a 1 shot trip
//          DCAEVT1 will pull EPWM1A high
//          DCBEVT1 will pull EPWM1B low 
//
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
//    This example configures ePWM1 
//
//    2 Examples are included:
//    * ePWM1 has DCAEVT1 and DCBEVT1 as one shot trip sources
////
//    View the EPWM1A/B waveforms
//    via an oscilloscope to see the effect of the events
//    change the state of COMP1OUT create the events
//
//    DCAEVT1, DCBEVT1  are all defined as
//    true when COMP1OUT is low
//
//###########################################################################
// $TI Release: 2802x C/C++ Header Files and Peripheral Examples V1.29 $
// $Release Date: January 11, 2011 $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

// Prototype statements for functions found within this file.
void InitEPwm1Example(void);
interrupt void epwm1_tzint_isr(void);



// Global variables used in this example
Uint32  EPwm1TZIntCount;
Uint32  EPwm2TZIntCount;

void main(void)
{
// Step 1. Initialize System Control:
// PLL, WatchDog, enable Peripheral Clocks
// This example function is found in the DSP2802x_SysCtrl.c file.
   InitSysCtrl();

// Step 2. Initalize GPIO:
// This example function is found in the DSP2802x_Gpio.c file and
// illustrates how to set the GPIO to it's default state.
// InitGpio();  // Skipped for this example

// For this case just init GPIO pins for ePWM1, ePWM2, and TZ pins
   InitEPwm1Gpio();


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
   PieVectTable.EPWM1_TZINT = &epwm1_tzint_isr;
   EDIS;    // This is needed to disable write to EALLOW protected registers

// Step 4. Initialize all the Device Peripherals:
// This function is found in DSP2802x_InitPeripherals.c
// InitPeripherals();  // Not required for this example

   
   EALLOW;
   SysCtrlRegs.PCLKCR0.bit.ADCENCLK = 1;                 // Enable Clock to the ADC
   AdcRegs.ADCCTL1.bit.ADCBGPWD = 1;                     // Comparator shares the internal BG reference of the ADC, must be powered even if ADC is unused
   DELAY_US(1000L);                                      // Delay to allow BG reference to settle.	
	
   SysCtrlRegs.PCLKCR3.bit.COMP1ENCLK = 1;               // Enable clock to the Comparator 1 block 
   Comp1Regs.COMPCTL.bit.COMPDACEN = 1;                  // Power up Comparator 1 locally
   Comp1Regs.COMPCTL.bit.COMPSOURCE = 1;                 // Connect the inverting input to pin COMP1B
////////////////Uncomment following 2 lines to use DAC instead of pin COMP1B //////////////////
//   Comp1Regs.COMPCTL.bit.COMPSOURCE = 0;              // Connect the inverting input to the internal DAC
//   Comp1Regs.DACVAL.bit.DACVAL = 512;				    // Set DAC output to midpoint
//////////////////////////////////////////////////////////////////////////////////////////////
   SysCtrlRegs.PCLKCR0.bit.TBCLKSYNC = 0;
   EDIS;

   InitEPwm1Example();

   EALLOW;
   SysCtrlRegs.PCLKCR0.bit.TBCLKSYNC = 1;
   EDIS;

// Step 5. User specific code, enable interrupts
// Initalize counters:
   EPwm1TZIntCount = 0;

// Enable CPU INT3 which is connected to EPWM1-3 INT:
   IER |= M_INT2;

// Enable EPWM INTn in the PIE: Group 2 interrupt 1-3
   PieCtrlRegs.PIEIER2.bit.INTx1 = 1;

// Enable global Interrupts and higher priority real-time debug events:
   EINT;   // Enable Global interrupt INTM
   ERTM;   // Enable Global realtime interrupt DBGM



// Step 6. IDLE loop. Just sit and loop forever (optional):
   for(;;)
   {
       asm("          NOP");
   }

}

interrupt void epwm1_tzint_isr(void)
{
   EPwm1TZIntCount++;

// Leave these flags set so we only take this
// interrupt once
//
// EALLOW;
// EPwm1Regs.TZCLR.bit.OST = 1;
// EPwm1Regs.TZCLR.bit.INT = 1;
// EDIS;

   // Acknowledge this interrupt to receive more interrupts from group 2
   PieCtrlRegs.PIEACK.all = PIEACK_GROUP2;

}




void InitEPwm1Example()
{

   EALLOW;
   EPwm1Regs.TBPRD = 6000;                         // Set timer period
   EPwm1Regs.TBPHS.half.TBPHS = 0x0000;            // Phase is 0
   EPwm1Regs.TBCTR = 0x0000;  
   

   // Setup TBCLK
   EPwm1Regs.TBCTL.bit.CTRMODE = TB_COUNT_UPDOWN; // Count up/down
   EPwm1Regs.TBCTL.bit.PHSEN = TB_DISABLE;        // Disable phase loading
   EPwm1Regs.TBCTL.bit.HSPCLKDIV = TB_DIV4;       // Clock ratio to SYSCLKOUT
   EPwm1Regs.TBCTL.bit.CLKDIV = TB_DIV4;

   EPwm1Regs.CMPCTL.bit.SHDWAMODE = CC_SHADOW;    // Load registers every ZERO
   EPwm1Regs.CMPCTL.bit.SHDWBMODE = CC_SHADOW;
   EPwm1Regs.CMPCTL.bit.LOADAMODE = CC_CTR_ZERO;
   EPwm1Regs.CMPCTL.bit.LOADBMODE = CC_CTR_ZERO;

   // Setup compare
   EPwm1Regs.CMPA.half.CMPA = 3000;

   // Set actions
   EPwm1Regs.AQCTLA.bit.CAU = AQ_SET;             // Set PWM1A on Zero
   EPwm1Regs.AQCTLA.bit.CAD = AQ_CLEAR;


   EPwm1Regs.AQCTLB.bit.CAU = AQ_CLEAR;          // Set PWM1A on Zero
   EPwm1Regs.AQCTLB.bit.CAD = AQ_SET;
   
   // Define an event (DCAEVT1) based on TZ1 and TZ2
   EPwm1Regs.DCTRIPSEL.bit.DCAHCOMPSEL = DC_COMP1OUT;        // DCAH = Comparator 1 output
   EPwm1Regs.DCTRIPSEL.bit.DCALCOMPSEL = DC_TZ2;             // DCAL = TZ2
   EPwm1Regs.TZDCSEL.bit.DCAEVT1 = TZ_DCAH_LOW;              // DCAEVT1 =  DCAH low(will become active as Comparator output goes low)  
   EPwm1Regs.DCACTL.bit.EVT1SRCSEL = DC_EVT1;                // DCAEVT1 = DCAEVT1 (not filtered)
   EPwm1Regs.DCACTL.bit.EVT1FRCSYNCSEL = DC_EVT_ASYNC;       // Take async path
   
   // Define an event (DCBEVT1) based on TZ1 and TZ2
   EPwm1Regs.DCTRIPSEL.bit.DCBHCOMPSEL = DC_COMP1OUT;        // DCBH = Comparator 1 output
   EPwm1Regs.DCTRIPSEL.bit.DCBLCOMPSEL = DC_TZ2;             // DCAL = TZ2  
   EPwm1Regs.TZDCSEL.bit.DCBEVT1 = TZ_DCBH_LOW;              // DCBEVT1 =  (will become active as Comparator output goes low)    
   EPwm1Regs.DCBCTL.bit.EVT1SRCSEL = DC_EVT1;                // DCBEVT1 = DCBEVT1 (not filtered)
   EPwm1Regs.DCBCTL.bit.EVT1FRCSYNCSEL = DC_EVT_ASYNC;       // Take async path
         
   // Enable DCAEVT1 and DCBEVT1 are one shot trip sources
   // Note: DCxEVT1 events can be defined as one-shot.  
   //       DCxEVT2 events can be defined as cycle-by-cycle.
   EPwm1Regs.TZSEL.bit.DCAEVT1 = 1;
   EPwm1Regs.TZSEL.bit.DCBEVT1 = 1;

   // What do we want the DCAEVT1 and DCBEVT1 events to do?
   // DCAEVTx events can force EPWMxA 
   // DCBEVTx events can force EPWMxB  
   EPwm1Regs.TZCTL.bit.TZA = TZ_FORCE_HI;           // EPWM1A will go high
   EPwm1Regs.TZCTL.bit.TZB = TZ_FORCE_LO;           // EPWM1B will go low

   // Enable TZ interrupt
   EPwm1Regs.TZEINT.bit.OST = 1;
   EDIS;
   
   
}

//===========================================================================
// No more.
//===========================================================================
