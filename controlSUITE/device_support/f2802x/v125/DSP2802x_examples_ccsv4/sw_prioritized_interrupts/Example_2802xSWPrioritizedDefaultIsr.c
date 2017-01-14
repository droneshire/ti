// TI File $Revision: /main/3 $
// Checkin $Date: December 17, 2009   14:37:59 $
//###########################################################################
//
// FILE:    Example_2802xSWPrioritizedDefaultIsr.c
//
// TITLE:   DSP2802x Device Default Software Prioritized Interrupt Service Routines.
//
//          This file is based on the standard DSP2802x_SWPrioritizedDefaultIsr.c
//          The ISR routines have been modified slightly to provide a trace
//          mechanism used for this example
//
//###########################################################################
//
// $TI Release: 2802x C/C++ Header Files V1.25 $
// $Release Date: December 18, 2009 $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File
#include "DSP2802x_SWPrioritizedIsrLevels.h"

// Defined in the Example_28xSWPrioritizedInterrupts.c file
// for this example only
extern Uint16 ISRTrace[50];
extern Uint16 ISRTraceIndex;

// Used for ISR delays
Uint16 i;

// Connected to INT13/TINT1 of CPU (use MINT13 mask):
#if (INT13PL != 0)
interrupt void INT13_ISR(void)     // INT13 or CPU-Timer1
{
	 IER |= MINT13;                 // Set "global" priority
	 EINT;

  // Insert ISR Code here

  // Next two lines for debug only to halt the processor here
  // Remove after inserting ISR Code
     asm ("      ESTOP0");
     for(;;);
}
#endif

// Connected to INT14/TINT2 of CPU (use MINT14 mask):
#if (INT14PL != 0)
interrupt void INT14_ISR(void)     // CPU-Timer2
{
   IER |= MINT14;                  // Set "global" priority
   EINT;

   // Insert ISR Code here.......

   // Next two lines for debug only to halt the processor here
   // Remove after inserting ISR Code
   asm ("      ESTOP0");
   for(;;);
}
#endif

// Connected to INT15 of CPU (use MINT15 mask):
#if (INT15PL != 0)
interrupt void DATALOG_ISR(void)   // Datalogging interrupt
{
	IER |= MINT15;                 // Set "global" priority
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}
#endif

// Connected to INT16 of CPU (use MINT16 mask):
#if (INT16PL != 0)
interrupt void RTOSINT_ISR(void)   // RTOS interrupt
{
	IER |= MINT16;                 // Set "global" priority
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}
#endif

// Connected to EMUINT of CPU (non-maskable):
interrupt void EMUINT_ISR(void)    // Emulation interrupt
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to NMI of CPU (non-maskable):
interrupt void NMI_ISR(void)      // Non-maskable interrupt
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to ITRAP of CPU (non-maskable):
interrupt void ILLEGAL_ISR(void)   // Illegal operation TRAP
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER1 of CPU (non-maskable):
interrupt void USER1_ISR(void)     // User Defined trap 1
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER2 of CPU (non-maskable):
interrupt void USER2_ISR(void)     // User Defined trap 2
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER3 of CPU (non-maskable):
interrupt void USER3_ISR(void)     // User Defined trap 3
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER4 of CPU (non-maskable):
interrupt void USER4_ISR(void)     // User Defined trap 4
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER5 of CPU (non-maskable):
interrupt void USER5_ISR(void)     // User Defined trap 5
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER6 of CPU (non-maskable):
interrupt void USER6_ISR(void)     // User Defined trap 6
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER7 of CPU (non-maskable):
interrupt void USER7_ISR(void)     // User Defined trap 7
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER8 of CPU (non-maskable):
interrupt void USER8_ISR(void)     // User Defined trap 8
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER9 of CPU (non-maskable):
interrupt void USER9_ISR(void)     // User Defined trap 9
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER10 of CPU (non-maskable):
interrupt void USER10_ISR(void)    // User Defined trap 10
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER11 of CPU (non-maskable):
interrupt void USER11_ISR(void)    // User Defined trap 11
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// Connected to USER12 of CPU (non-maskable):
interrupt void USER12_ISR(void)     // User Defined trap 12
{
	EINT;

  	// Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    asm ("      ESTOP0");
    for(;;);
}

// -----------------------------------------------------------
// PIE Group 1 - MUXed into CPU INT1
// -----------------------------------------------------------
// Connected to PIEIER1_1 (use MINT1 and MG11 masks):
#if (G11PL != 0)
interrupt void ADCINT1_ISR( void )     // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER1.all;
	IER |= M_INT1;
	IER	&= MINT1;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER1.all &= MG11;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER1.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0011;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER1_2 (use MINT1 and MG12 masks):
#if (G12PL != 0)
interrupt void ADCINT2_ISR( void )    // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER1.all;
	IER |= M_INT1;
	IER	&= MINT1;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER1.all &= MG12;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER1.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0012;
    ISRTraceIndex++;

}
#endif


// Connected to PIEIER1_4 (use MINT1 and MG14 masks):
#if (G14PL != 0)
interrupt void  XINT1_ISR(void)
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER1.all;
	IER |= M_INT1;
	IER	&= MINT1;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER1.all &= MG14;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......

      asm("      NOP");

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER1.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0014;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER1_5 (use MINT1 and MG15 masks):
#if (G15PL != 0)
interrupt void  XINT2_ISR(void)
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER1.all;
	IER |= M_INT1;
	IER	&= MINT1;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER1.all &= MG15;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER1.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0015;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER1_6 (use MINT1 and MG16 masks):
#if (G16PL != 0)
interrupt void  ADCINT9_ISR(void)     // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER1.all;
	IER |= M_INT1;
	IER	&= MINT1;                      // Set "global" priority
	PieCtrlRegs.PIEIER1.all &= MG16;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
   for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER1.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0016;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER1_7 (use MINT1 and MG17 masks):
#if (G17PL != 0)
interrupt void  TINT0_ISR(void)      // CPU-Timer 0
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER1.all;
	IER |= M_INT1;
	IER	&= MINT1;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER1.all &= MG17;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER1.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0017;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER1_8 (use MINT1 and MG18 masks):
#if (G18PL != 0)
interrupt void  WAKEINT_ISR(void)      // WD/LPM
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER1.all;
	IER |= M_INT1;
	IER	&= MINT1;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER1.all &= MG18;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER1.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0018;
    ISRTraceIndex++;
}
#endif

// -----------------------------------------------------------
// PIE Group 2 - MUXed into CPU INT2
// -----------------------------------------------------------

// Connected to PIEIER2_1 (use MINT2 and MG21 masks):
#if (G21PL != 0)
interrupt void EPWM1_TZINT_ISR(void)    // EPwm1 Trip Zone
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER2.all;
	IER |= M_INT2;
	IER	&= MINT2;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER2.all &= MG21;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER2.all = TempPIEIER;

    //Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0021;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER2_2 (use MINT2 and MG22 masks):
#if (G22PL != 0)
interrupt void EPWM2_TZINT_ISR(void)    // EPwm2 Trip Zone
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER2.all;
	IER |= M_INT2;
	IER	&= MINT2;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER2.all &= MG22;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER2.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0022;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER2_3 (use MINT2 and MG23 masks):
#if (G23PL != 0)
interrupt void EPWM3_TZINT_ISR(void)    // EPwm3 Trip Zone
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER2.all;
	IER |= M_INT2;
	IER	&= MINT2;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER2.all &= MG23;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER2.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0023;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER2_4 (use MINT2 and MG24 masks):
#if (G24PL != 0)
interrupt void EPWM4_TZINT_ISR(void)    // EPwm4 Trip Zone
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER2.all;
	IER |= M_INT2;
	IER	&= MINT2;	  	                // Set "global" priority
	PieCtrlRegs.PIEIER2.all &= MG24;    // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;    // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER2.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0024;
    ISRTraceIndex++;

}
#endif

// -----------------------------------------------------------
// PIE Group 3 - MUXed into CPU INT3
// -----------------------------------------------------------

// Connected to PIEIER3_1 (use MINT3 and MG31 masks):
#if (G31PL != 0)
interrupt void EPWM1_INT_ISR(void)     // EPwm1 Interrupt
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER3.all;
	IER |= M_INT3;
	IER	&= MINT3;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER3.all &= MG31;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER3.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0031;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER3_2 (use MINT3 and MG32 masks):
#if (G32PL != 0)
interrupt void EPWM2_INT_ISR(void)     // EPwm2 Interrupt
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER3.all;
	IER |= M_INT3;
	IER	&= MINT3;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER3.all &= MG32;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER3.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0032;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER3_3 (use MINT3 and MG33 masks):
#if (G33PL != 0)
interrupt void EPWM3_INT_ISR(void)     // EPwm3 Interrupt
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER3.all;
	IER |= M_INT3;
	IER	&= MINT3;	  	                // Set "global" priority
	PieCtrlRegs.PIEIER3.all &= MG33;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER3.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0033;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER3_4 (use MINT3 and MG34 masks):
#if (G34PL != 0)
interrupt void EPWM4_INT_ISR(void)     // EPwm4 Interrupt
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER3.all;
	IER |= M_INT3;
	IER	&= MINT3;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER3.all &= MG34;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER3.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0034;
    ISRTraceIndex++;

}
#endif

// -----------------------------------------------------------
// PIE Group 4 - MUXed into CPU INT4
// -----------------------------------------------------------

// Connected to PIEIER4_1 (use MINT4 and MG41 masks):
#if (G41PL != 0)
interrupt void ECAP1_INT_ISR(void)     // eCAP1 Interrupt
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER4.all;
	IER |= M_INT4;
	IER	&= MINT4;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER4.all &= MG41;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER4.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0041;
    ISRTraceIndex++;

}
#endif

// -----------------------------------------------------------
// PIE Group 5 - MUXed into CPU INT5
// -----------------------------------------------------------

// -----------------------------------------------------------
// PIE Group 6 - MUXed into CPU INT6
// -----------------------------------------------------------

// Connected to PIEIER6_1 (use MINT6 and MG61 masks):
#if (G61PL != 0)
interrupt void SPIRXINTA_ISR(void)    // SPI-A
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER6.all;
	IER |= M_INT6;
	IER	&= MINT6;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER6.all &= MG61;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER6.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0061;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER6_2 (use MINT6 and MG62 masks):
#if (G62PL != 0)
interrupt void SPITXINTA_ISR(void)     // SPI-A
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER6.all;
	IER |= M_INT6;
	IER	&= MINT6;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER6.all &= MG62;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER6.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0062;
    ISRTraceIndex++;

}
#endif

// -----------------------------------------------------------
// PIE Group 7 - MUXed into CPU INT7
// -----------------------------------------------------------

// -----------------------------------------------------------
// PIE Group 8 - MUXed into CPU INT8
// -----------------------------------------------------------

// Connected to PIEIER8_1 (use MINT8 and MG81 masks):
#if (G81PL != 0)
interrupt void I2CINT1A_ISR(void)    // I2C-A
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER8.all;
	IER |= M_INT8;
	IER	&= MINT8;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER8.all &= MG81;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER8.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0081;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER8_2 (use MINT8 and MG82 masks):
#if (G82PL != 0)
interrupt void I2CINT2A_ISR(void)     // I2C-A
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER8.all;
	IER |= M_INT8;
	IER	&= MINT8;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER8.all &= MG82;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER8.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0082;
    ISRTraceIndex++;

}
#endif

// -----------------------------------------------------------
// PIE Group 9 - MUXed into CPU INT9
// -----------------------------------------------------------

// Connected to PIEIER9_1 (use MINT9 and MG91 masks):
#if (G91PL != 0)
interrupt void SCIRXINTA_ISR(void)     // SCI-A
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER9.all;
	IER |= M_INT9;
	IER	&= MINT9;	  	                // Set "global" priority
	PieCtrlRegs.PIEIER9.all &= MG91;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER9.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0091;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER9_2 (use MINT9 and MG92 masks):
#if (G92PL != 0)
interrupt void SCITXINTA_ISR(void)     // SCI-A
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER9.all;
	IER |= M_INT9;
	IER	&= MINT9;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER9.all &= MG92;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER9.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0092;
    ISRTraceIndex++;

}
#endif

// -----------------------------------------------------------
// PIE Group 10 - MUXed into CPU INT10
// -----------------------------------------------------------

/* Uncomment the below ADCINT1_ISR, and ADCINT2_ISR if the
   high priority equivalents in Group 1	 are not used.
   Comment out the Group 1 equivalents in this case */
/*
// Connected to PIEIER10_1 (use MINT10 and MG101 masks):
#if (G101PL != 0)
interrupt void ADCINT1_ISR( void )     // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER10.all;
	IER |= M_INT10;
	IER	&= MINT10;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER10.all &= MG101;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER10.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0101;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER10_2 (use MINT10 and MG102 masks):
#if (G102PL != 0)
interrupt void ADCINT2_ISR( void )    // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER10.all;
	IER |= M_INT10;
	IER	&= MINT10;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER10.all &= MG102; // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER10.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0102;
    ISRTraceIndex++;

}
#endif
*/

// Connected to PIEIER10_3 (use MINT10 and MG103 masks):
#if (G103PL != 0)
interrupt void  ADCINT3_ISR(void)  // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER10.all;
	IER |= M_INT10;
	IER	&= MINT10;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER10.all &= MG103; // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......

      asm("      NOP");

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER10.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0103;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER10_4 (use MINT10 and MG104 masks):
#if (G104PL != 0)
interrupt void  ADCINT4_ISR(void)  // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER10.all;
	IER |= M_INT10;
	IER	&= MINT10;	  	                 // Set "global" priority
	PieCtrlRegs.PIEIER10.all &= MG104;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;     // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......

      asm("      NOP");

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER10.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0104;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER10_5 (use MINT10 and MG105 masks):
#if (G105PL != 0)
interrupt void  ADCINT5_ISR(void)  // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER10.all;
	IER |= M_INT10;
	IER	&= MINT10;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER10.all &= MG105;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER10.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0105;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER10_6 (use MINT10 and MG106 masks):
#if (G106PL != 0)
interrupt void  ADCINT6_ISR(void)     // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER10.all;
	IER |= M_INT10;
	IER	&= MINT10;                     // Set "global" priority
	PieCtrlRegs.PIEIER10.all &= MG106; // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
   for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER10.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0106;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER10_7 (use MINT10 and MG107 masks):
#if (G107PL != 0)
interrupt void  ADCINT7_ISR(void)      // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER10.all;
	IER |= M_INT10;
	IER	&= MINT10;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER10.all &= MG107; // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER10.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0107;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER10_8 (use MINT10 and MG108 masks):
#if (G108PL != 0)
interrupt void  ADCINT8_ISR(void)      // ADC
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER10.all;
	IER |= M_INT10;
	IER	&= MINT10;	  	               // Set "global" priority
	PieCtrlRegs.PIEIER10.all &= MG108;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER10.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0108;
    ISRTraceIndex++;
}
#endif

// -----------------------------------------------------------
// PIE Group 11 - MUXed into CPU INT11
// -----------------------------------------------------------

// -----------------------------------------------------------
// PIE Group 12 - MUXed into CPU INT12
// -----------------------------------------------------------

// Connected to PIEIER12_1 (use MINT12 and MG121 masks):
#if (G121PL != 0)
interrupt void XINT3_ISR(void)     // XINT3
{
	// Set interrupt priority:
	volatile Uint16 TempPIEIER = PieCtrlRegs.PIEIER12.all;
	IER |= M_INT12;
	IER	&= MINT12;	  	                // Set "global" priority
	PieCtrlRegs.PIEIER12.all &= MG121;   // Set "group"  priority
	PieCtrlRegs.PIEACK.all = 0xFFFF;   // Enable PIE interrupts
	EINT;

  	// Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

	// Restore registers saved:
	DINT;
	PieCtrlRegs.PIEIER12.all = TempPIEIER;

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0121;
    ISRTraceIndex++;

}
#endif
//---------------------------------------------------------------------------
// Catch All Default ISRs:
//

interrupt void EMPTY_ISR(void)  // Empty ISR - only does a return.
{

}

interrupt void PIE_RESERVED(void)  // Reserved space.  For test.
{
  asm ("      ESTOP0");
  for(;;);
}

interrupt void rsvd_ISR(void)      // For test
{
  asm ("      ESTOP0");
  for(;;);
}

//===========================================================================
// No more.
//===========================================================================
