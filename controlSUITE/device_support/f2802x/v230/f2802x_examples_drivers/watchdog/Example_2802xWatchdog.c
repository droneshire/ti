//#############################################################################
//
//  File:   Example_F2802xWatchdog.c
//
//  Title:  F2802x Watchdog interrupt test program.
//
//! \addtogroup example_list
//!  <h1>Watchdog Interrupt</h1>
//!
//!  This program exercises the watchdog.
//!
//!  First the watchdog is connected to the WAKEINT interrupt of the
//!  PIE block.  The code is then put into an infinite loop.
//!
//!  The user can select to feed the watchdog key register or not
//!  by commenting one line of code in the infinite loop.
//!
//!  If the watchdog key register is fed by the WDOG_clearCounter function
//!  then the WAKEINT interrupt is not taken.  If the key register
//!  is not fed by the  WDOG_clearCounter function then WAKEINT will be taken.
//!
//!  Watch Variables:
//!  - LoopCount for the number of times through the infinite loop
//!  - WakeCount for the number of times through WAKEINT
//
//#############################################################################
// $TI Release: F2802x Support Library v230 $
// $Release Date: Fri May  8 07:43:05 CDT 2015 $
// $Copyright: Copyright (C) 2008-2015 Texas Instruments Incorporated -
//             http://www.ti.com/ ALL RIGHTS RESERVED $
//#############################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

#include "f2802x_common/include/clk.h"
#include "f2802x_common/include/flash.h"
#include "f2802x_common/include/pie.h"
#include "f2802x_common/include/pll.h"
#include "f2802x_common/include/wdog.h"

// Prototype statements for functions found within this file.
__interrupt void wakeint_isr(void);

// Global variables for this example
uint32_t WakeCount;
uint32_t LoopCount;

CLK_Handle myClk;
FLASH_Handle myFlash;
PIE_Handle myPie;

void main(void)
{
    CPU_Handle myCpu;
    PLL_Handle myPll;
    WDOG_Handle myWDog;
    
    // Initialize all the handles needed for this application 
    myClk = CLK_init((void *)CLK_BASE_ADDR, sizeof(CLK_Obj)); 
    myCpu = CPU_init((void *)NULL, sizeof(CPU_Obj));
    myFlash = FLASH_init((void *)FLASH_BASE_ADDR, sizeof(FLASH_Obj));
    myPie = PIE_init((void *)PIE_BASE_ADDR, sizeof(PIE_Obj));
    myPll = PLL_init((void *)PLL_BASE_ADDR, sizeof(PLL_Obj));
    myWDog = WDOG_init((void *)WDOG_BASE_ADDR, sizeof(WDOG_Obj));
    
    // Perform basic system initialization    
    WDOG_disable(myWDog);
    CLK_enableAdcClock(myClk);
    (*Device_cal)();
    
    //Select the internal oscillator 1 as the clock source
    CLK_setOscSrc(myClk, CLK_OscSrc_Internal);
    
    // Setup the PLL for x10 /2 which will yield 50Mhz = 10Mhz * 10 / 2
    PLL_setup(myPll, PLL_Multiplier_10, PLL_DivideSelect_ClkIn_by_2);
    
    // Disable the PIE and all interrupts
    PIE_disable(myPie);
    PIE_disableAllInts(myPie);
    CPU_disableGlobalInts(myCpu);
    CPU_clearIntFlags(myCpu);
    
// If running from flash copy RAM only functions to RAM   
#ifdef _FLASH
    memcpy(&RamfuncsRunStart, &RamfuncsLoadStart, (size_t)&RamfuncsLoadSize);
#endif   

    // Setup a debug vector table and enable the PIE
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);

    // Register interrupt handlers in the PIE vector table
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_1, PIE_SubGroupNumber_8, 
                              (intVec_t)&wakeint_isr);

    // Clear the counters
    WakeCount = 0; // Count interrupts
    LoopCount = 0; // Count times through idle loop
    
    WDOG_enableInt(myWDog); 

    // Enable WAKEINT in the PIE: Group 1 interrupt 8
    // Enable INT1 which is connected to WAKEINT
    PIE_enableInt(myPie, PIE_GroupNumber_1, PIE_InterruptSource_WAKE);
    CPU_enableInt(myCpu, CPU_IntNumber_1);
    CPU_enableGlobalInts(myCpu);

    // Reset the watchdog counter
    WDOG_clearCounter(myWDog);

    // Enable the watchdog
    WDOG_enable(myWDog);
    
    for(;;) 
    {
      LoopCount++;

      // Uncomment WDOG_clearCounter to just loop here
      // Comment WDOG_clearCounter to take the WAKEINT instead    
      WDOG_clearCounter(myWDog);
    }
}

__interrupt void wakeint_isr(void)
{
    WakeCount++;

    // Acknowledge this interrupt to get more from group 1
    PIE_clearInt(myPie, PIE_GroupNumber_1);
}

//===========================================================================
// No more.
//===========================================================================
