//###########################################################################
//
// FILE:    Example_F2802xSWPrioritizedDefaultIsr.c
//
// TITLE:   F2802x Device Default Software Prioritized Interrupt Service Routines.
//
//          This file is based on the standard F2802x_SWPrioritizedDefaultIsr.c
//          The ISR routines have been modified slightly to provide a trace
//          mechanism used for this example
//
//###########################################################################
// $TI Release: 2802x C/C++ Header Files and Peripheral Examples V1.29 $
// $Release Date: January 11, 2011 $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File
#include "f2802x_common/include/f2802x_swprioritizedisrlevels.h"

#include "f2802x_common/include/cpu.h"
#include "f2802x_common/include/pie.h"

// Defined in the Example_28xSWPrioritizedInterrupts.c file
// for this example only
extern uint16_t ISRTrace[50];
extern uint16_t ISRTraceIndex;
extern CPU_Handle myCpu;
extern PIE_Handle myPie;

// Used for ISR delays
uint16_t i;

// Connected to INT13/TINT1 of CPU (use MINT13 mask):
#if (INT13PL != 0)
__interrupt void INT13_ISR(void)     // INT13 or CPU-Timer1
{
     IER |= MINT13;                 // Set "global" priority
     CPU_enableGlobalInts(myCpu);

    // Insert ISR Code here

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
     __asm ("      ESTOP0");
     for(;;);
}
#endif

// Connected to INT14/TINT2 of CPU (use MINT14 mask):
#if (INT14PL != 0)
__interrupt void INT14_ISR(void)     // CPU-Timer2
{
    IER |= MINT14;                  // Set "global" priority
    CPU_enableGlobalInts(myCpu);

    // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}
#endif

// Connected to INT15 of CPU (use MINT15 mask):
#if (INT15PL != 0)
__interrupt void DATALOG_ISR(void)   // Datalogging interrupt
{
    IER |= MINT15;                 // Set "global" priority
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}
#endif

// Connected to INT16 of CPU (use MINT16 mask):
#if (INT16PL != 0)
__interrupt void RTOSINT_ISR(void)   // RTOS interrupt
{
    IER |= MINT16;                 // Set "global" priority
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}
#endif

// Connected to EMUINT of CPU (non-maskable):
__interrupt void EMUINT_ISR(void)    // Emulation interrupt
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to NMI of CPU (non-maskable):
__interrupt void NMI_ISR(void)      // Non-maskable interrupt
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to ITRAP of CPU (non-maskable):
__interrupt void ILLEGAL_ISR(void)   // Illegal operation TRAP
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER1 of CPU (non-maskable):
__interrupt void USER1_ISR(void)     // User Defined trap 1
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER2 of CPU (non-maskable):
__interrupt void USER2_ISR(void)     // User Defined trap 2
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER3 of CPU (non-maskable):
__interrupt void USER3_ISR(void)     // User Defined trap 3
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER4 of CPU (non-maskable):
__interrupt void USER4_ISR(void)     // User Defined trap 4
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER5 of CPU (non-maskable):
__interrupt void USER5_ISR(void)     // User Defined trap 5
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER6 of CPU (non-maskable):
__interrupt void USER6_ISR(void)     // User Defined trap 6
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER7 of CPU (non-maskable):
__interrupt void USER7_ISR(void)     // User Defined trap 7
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER8 of CPU (non-maskable):
__interrupt void USER8_ISR(void)     // User Defined trap 8
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER9 of CPU (non-maskable):
__interrupt void USER9_ISR(void)     // User Defined trap 9
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER10 of CPU (non-maskable):
__interrupt void USER10_ISR(void)    // User Defined trap 10
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER11 of CPU (non-maskable):
__interrupt void USER11_ISR(void)    // User Defined trap 11
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// Connected to USER12 of CPU (non-maskable):
__interrupt void USER12_ISR(void)     // User Defined trap 12
{
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

    // Next two lines for debug only to halt the processor here
    // Remove after inserting ISR Code
    __asm ("      ESTOP0");
    for(;;);
}

// -----------------------------------------------------------
// PIE Group 1 - MUXed into CPU INT1
// -----------------------------------------------------------
// Connected to PIEIER1_1 (use MINT1 and MG11 masks):
#if (G11PL != 0)
__interrupt void ADCINT1_ISR( void )     // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_1);
    CPU_enableInt(myCpu, CPU_IntNumber_1);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT1);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e) ~MG11);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0011;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER1_2 (use MINT1 and MG12 masks):
#if (G12PL != 0)
__interrupt void ADCINT2_ISR( void )    // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_1);
    CPU_enableInt(myCpu, CPU_IntNumber_1);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT1);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e) ~MG12);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0012;
    ISRTraceIndex++;

}
#endif


// Connected to PIEIER1_4 (use MINT1 and MG14 masks):
#if (G14PL != 0)
__interrupt void  XINT1_ISR(void)
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_1);
    CPU_enableInt(myCpu, CPU_IntNumber_1);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT1);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e) ~MG14);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

      __asm("      NOP");

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0014;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER1_5 (use MINT1 and MG15 masks):
#if (G15PL != 0)
__interrupt void  XINT2_ISR(void)
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_1);
    CPU_enableInt(myCpu, CPU_IntNumber_1);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT1);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e) ~MG15);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0015;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER1_6 (use MINT1 and MG16 masks):
#if (G16PL != 0)
__interrupt void  ADCINT9_ISR(void)     // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_1);
    CPU_enableInt(myCpu, CPU_IntNumber_1);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT1);                      // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e) ~MG16);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0016;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER1_7 (use MINT1 and MG17 masks):
#if (G17PL != 0)
__interrupt void  TINT0_ISR(void)      // CPU-Timer 0
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_1);
    CPU_enableInt(myCpu, CPU_IntNumber_1);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT1);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e) ~MG17);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0017;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER1_8 (use MINT1 and MG18 masks):
#if (G18PL != 0)
__interrupt void  WAKEINT_ISR(void)      // WD/LPM
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_1);
    CPU_enableInt(myCpu, CPU_IntNumber_1);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT1);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e) ~MG18);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_1, (PIE_InterruptSource_e)TempPIEIER);

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
__interrupt void EPWM1_TZINT_ISR(void)    // EPwm1 Trip Zone
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_2);
    CPU_enableInt(myCpu, CPU_IntNumber_2);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT2);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_2, (PIE_InterruptSource_e) ~MG21);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_2, (PIE_InterruptSource_e)TempPIEIER);

    //Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0021;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER2_2 (use MINT2 and MG22 masks):
#if (G22PL != 0)
__interrupt void EPWM2_TZINT_ISR(void)    // EPwm2 Trip Zone
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_2);
    CPU_enableInt(myCpu, CPU_IntNumber_2);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT2);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_2, (PIE_InterruptSource_e) ~MG22);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_2, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0022;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER2_3 (use MINT2 and MG23 masks):
#if (G23PL != 0)
__interrupt void EPWM3_TZINT_ISR(void)    // EPwm3 Trip Zone
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_2);
    CPU_enableInt(myCpu, CPU_IntNumber_2);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT2);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_2, (PIE_InterruptSource_e) ~MG23);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_2, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0023;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER2_4 (use MINT2 and MG24 masks):
#if (G24PL != 0)
__interrupt void EPWM4_TZINT_ISR(void)    // EPwm4 Trip Zone
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_2);
    CPU_enableInt(myCpu, CPU_IntNumber_2);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT2);                          // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_2, (PIE_InterruptSource_e) ~MG24);    // Set "group"  priority
    PIE_clearAllInts(myPie);    // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_2, (PIE_InterruptSource_e)TempPIEIER);

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
__interrupt void EPWM1_INT_ISR(void)     // EPwm1 Interrupt
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_3);
    CPU_enableInt(myCpu, CPU_IntNumber_3);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT3);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_3, (PIE_InterruptSource_e) ~MG31);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_3, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0031;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER3_2 (use MINT3 and MG32 masks):
#if (G32PL != 0)
__interrupt void EPWM2_INT_ISR(void)     // EPwm2 Interrupt
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_3);
    CPU_enableInt(myCpu, CPU_IntNumber_3);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT3);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_3, (PIE_InterruptSource_e) ~MG32);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_3, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0032;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER3_3 (use MINT3 and MG33 masks):
#if (G33PL != 0)
__interrupt void EPWM3_INT_ISR(void)     // EPwm3 Interrupt
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_3);
    CPU_enableInt(myCpu, CPU_IntNumber_3);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT3);                          // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_3, (PIE_InterruptSource_e) ~MG33);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_3, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0033;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER3_4 (use MINT3 and MG34 masks):
#if (G34PL != 0)
__interrupt void EPWM4_INT_ISR(void)     // EPwm4 Interrupt
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_3);
    CPU_enableInt(myCpu, CPU_IntNumber_3);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT3);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_3, (PIE_InterruptSource_e) ~MG34);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_3, (PIE_InterruptSource_e)TempPIEIER);

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
__interrupt void ECAP1_INT_ISR(void)     // eCAP1 Interrupt
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_4);
    CPU_enableInt(myCpu, CPU_IntNumber_4);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT4);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_4, (PIE_InterruptSource_e) ~MG41);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_4, (PIE_InterruptSource_e)TempPIEIER);

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
__interrupt void SPIRXINTA_ISR(void)    // SPI-A
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_6);
    CPU_enableInt(myCpu, CPU_IntNumber_6);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT6);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_6, (PIE_InterruptSource_e) ~MG61);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_6, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0061;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER6_2 (use MINT6 and MG62 masks):
#if (G62PL != 0)
__interrupt void SPITXINTA_ISR(void)     // SPI-A
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_6);
    CPU_enableInt(myCpu, CPU_IntNumber_6);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT6);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_6, (PIE_InterruptSource_e) ~MG62);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_6, (PIE_InterruptSource_e)TempPIEIER);

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
__interrupt void I2CINT1A_ISR(void)    // I2C-A
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_8);
    CPU_enableInt(myCpu, CPU_IntNumber_8);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT8);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_8, (PIE_InterruptSource_e) ~MG81);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_8, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0081;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER8_2 (use MINT8 and MG82 masks):
#if (G82PL != 0)
__interrupt void I2CINT2A_ISR(void)     // I2C-A
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_8);
    CPU_enableInt(myCpu, CPU_IntNumber_8);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT8);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_8, (PIE_InterruptSource_e) ~MG82);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_8, (PIE_InterruptSource_e)TempPIEIER);

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
__interrupt void SCIRXINTA_ISR(void)     // SCI-A
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_9);
    CPU_enableInt(myCpu, CPU_IntNumber_9);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT9);                          // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_9, (PIE_InterruptSource_e) ~MG91);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_9, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0091;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER9_2 (use MINT9 and MG92 masks):
#if (G92PL != 0)
__interrupt void SCITXINTA_ISR(void)     // SCI-A
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_9);
    CPU_enableInt(myCpu, CPU_IntNumber_9);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT9);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_9, (PIE_InterruptSource_e) ~MG92);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_9, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0092;
    ISRTraceIndex++;

}
#endif

// -----------------------------------------------------------
// PIE Group 10 - MUXed into CPU INT10
// -----------------------------------------------------------

/* Uncomment the below ADCINT1_ISR, and ADCINT2_ISR if the
    high priority equivalents in Group 1     are not used.
    Comment out the Group 1 equivalents in this case */
/*
// Connected to PIEIER10_1 (use MINT10 and MG101 masks):
#if (G101PL != 0)
__interrupt void ADCINT1_ISR( void )     // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_10);
    CPU_enableInt(myCpu, CPU_IntNumber_10);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT10);                         // Set "global" priority
    PieCtrlRegs.PIEIER10.all &= MG101;   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0101;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER10_2 (use MINT10 and MG102 masks):
#if (G102PL != 0)
__interrupt void ADCINT2_ISR( void )    // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_10);
    CPU_enableInt(myCpu, CPU_IntNumber_10);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT10);                         // Set "global" priority
    PieCtrlRegs.PIEIER10.all &= MG102; // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0102;
    ISRTraceIndex++;

}
#endif
*/

// Connected to PIEIER10_3 (use MINT10 and MG103 masks):
#if (G103PL != 0)
__interrupt void  ADCINT3_ISR(void)  // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_10);
    CPU_enableInt(myCpu, CPU_IntNumber_10);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT10);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e) ~MG103); // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

      __asm("      NOP");

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0103;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER10_4 (use MINT10 and MG104 masks):
#if (G104PL != 0)
__interrupt void  ADCINT4_ISR(void)  // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_10);
    CPU_enableInt(myCpu, CPU_IntNumber_10);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT10);                           // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e) ~MG104);   // Set "group"  priority
    PIE_clearAllInts(myPie);     // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......

      __asm("      NOP");

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0104;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER10_5 (use MINT10 and MG105 masks):
#if (G105PL != 0)
__interrupt void  ADCINT5_ISR(void)  // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_10);
    CPU_enableInt(myCpu, CPU_IntNumber_10);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT10);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e) ~MG105);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0105;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER10_6 (use MINT10 and MG106 masks):
#if (G106PL != 0)
__interrupt void  ADCINT6_ISR(void)     // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_10);
    CPU_enableInt(myCpu, CPU_IntNumber_10);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT10);                     // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e) ~MG106); // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0106;
    ISRTraceIndex++;

}
#endif

// Connected to PIEIER10_7 (use MINT10 and MG107 masks):
#if (G107PL != 0)
__interrupt void  ADCINT7_ISR(void)      // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_10);
    CPU_enableInt(myCpu, CPU_IntNumber_10);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT10);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e) ~MG107); // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0107;
    ISRTraceIndex++;
}
#endif

// Connected to PIEIER10_8 (use MINT10 and MG108 masks):
#if (G108PL != 0)
__interrupt void  ADCINT8_ISR(void)      // ADC
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_10);
    CPU_enableInt(myCpu, CPU_IntNumber_10);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT10);                         // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e) ~MG108);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_10, (PIE_InterruptSource_e)TempPIEIER);

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
__interrupt void XINT3_ISR(void)     // XINT3
{
    // Set interrupt priority:
    volatile uint16_t TempPIEIER = PIE_getIntEnables(myPie, PIE_GroupNumber_12);
    CPU_enableInt(myCpu, CPU_IntNumber_12);
    CPU_disableInt(myCpu, (CPU_IntNumber_e) ~MINT12);                          // Set "global" priority
    PIE_disableInt(myPie, PIE_GroupNumber_12, (PIE_InterruptSource_e) ~MG121);   // Set "group"  priority
    PIE_clearAllInts(myPie);   // Enable PIE interrupts
	__asm("  NOP");
    CPU_enableGlobalInts(myCpu);

      // Insert ISR Code here.......
    for(i = 1; i <= 10; i++) {}

    // Restore registers saved:
    CPU_disableGlobalInts(myCpu);
    PIE_enableInt(myPie, PIE_GroupNumber_12, (PIE_InterruptSource_e)TempPIEIER);

    //  Add ISR to Trace
    ISRTrace[ISRTraceIndex] = 0x0121;
    ISRTraceIndex++;

}
#endif
//---------------------------------------------------------------------------
// Catch All Default ISRs:
//

__interrupt void EMPTY_ISR(void)  // Empty ISR - only does a return.
{

}

__interrupt void PIE_RESERVED(void)  // Reserved space.  For test.
{
    __asm ("      ESTOP0");
    for(;;);
}

__interrupt void rsvd_ISR(void)      // For test
{
    __asm ("      ESTOP0");
    for(;;);
}

//===========================================================================
// No more.
//===========================================================================
