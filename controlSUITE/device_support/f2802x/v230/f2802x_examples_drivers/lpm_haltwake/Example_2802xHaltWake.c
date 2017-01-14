//#############################################################################
//
//  File:   Example_F2802xHaltWake.c
//
//  Title:  Device Halt Mode and Wakeup Program.
//
//! \addtogroup example_list
//!  <h1>Device Halt Mode and Wakeup</h1>
//!
//!   This example puts the device into HALT mode. If the lowest
//!   possible current consumption in HALT mode is desired, the
//!   JTAG connector must be removed from the device board while
//!   the device is in HALT mode.
//!
//!   The example then wakes up the device from HALT using GPIO0.
//!   GPIO0 wakes the device from HALT mode when a high-to-low
//!   signal is detected on the pin. This pin must be pulsed by
//!   an external agent for wakeup.
//!
//!   The wakeup process begins as soon as GPIO0 is held low for the
//!   time indicated in the device datasheet. After the
//!   device wakes up, GPIO1 can be observed to go high.
//!
//!   GPIO0 is configured as the LPM wakeup pin to trigger a
//!   WAKEINT interrupt upon detection of a low pulse.
//!   Initially, pull GPIO0 high externally. To wake device
//!   from halt mode, pull GPIO0 low for at least the crystal
//!   startup time + 2 OSCLKS, then pull it high again.
//!
//!   To observe when device wakes from HALT mode, monitor
//!   GPIO1 with an oscilloscope (toggled in WAKEINT ISR)
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
#include "f2802x_common/include/gpio.h"
#include "f2802x_common/include/pie.h"
#include "f2802x_common/include/pll.h"
#include "f2802x_common/include/pwr.h"
#include "f2802x_common/include/wdog.h"

// Prototype statements for functions found within this file.

__interrupt void wakeint_isr(void);      // ISR for WAKEINT

CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;

void main(void)
{
    CPU_Handle myCpu;
    PLL_Handle myPll;
    PWR_Handle myPwr;
    WDOG_Handle myWDog;

    // Initialize all the handles needed for this application
    myClk = CLK_init((void *)CLK_BASE_ADDR, sizeof(CLK_Obj));
    myCpu = CPU_init((void *)NULL, sizeof(CPU_Obj));
    myFlash = FLASH_init((void *)FLASH_BASE_ADDR, sizeof(FLASH_Obj));
    myGpio = GPIO_init((void *)GPIO_BASE_ADDR, sizeof(GPIO_Obj));
    myPie = PIE_init((void *)PIE_BASE_ADDR, sizeof(PIE_Obj));
    myPll = PLL_init((void *)PLL_BASE_ADDR, sizeof(PLL_Obj));
    myPwr = PWR_init((void *)PWR_BASE_ADDR, sizeof(PWR_Obj));
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

    // Initialize GPIO
    // Enable Pull-ups
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_1, GPIO_PullUp_Enable);

    // GPIO1 set in the ISR to indicate device woken up.
    GPIO_setDirection(myGpio, GPIO_Number_1, GPIO_Direction_Output);

    // Choose GPIO0 pin for lpm wakeup
    GPIO_lpmSelect(myGpio,GPIO_Number_0);

    // Setup a debug vector table and enable the PIE
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);

    // Register interrupt handlers in the PIE vector table
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_1, PIE_SubGroupNumber_8,
                              (intVec_t)&wakeint_isr);

    // Enable CPU INT1 which is connected to WakeInt
    CPU_enableInt(myCpu, CPU_IntNumber_1);

    // Enable WAKEINT in the PIE: Group 1 interrupt 8
    PIE_enableInt(myPie, PIE_GroupNumber_1, PIE_InterruptSource_WAKE);

    PIE_clearInt(myPie, PIE_GroupNumber_1);

    // Enable global Interrupts
    CPU_enableGlobalInts(myCpu);

    // Only enter Standby mode when PLL is not in limp mode.
    if ( PLL_getClkStatus(myPll) != PLL_PLLSTS_MCLKSTS_BITS)
    {
        // LPM mode = Standby
        PWR_setLowPowerMode(myPwr, PWR_LowPowerMode_Halt);
    }

    // Force device into STANDBY
    IDLE;       // Device waits in IDLE until falling edge on GPIO0/XNMI pin
                // wakes device from Standby mode.
    for(;;){}   // Loop here after wake-up.
}

/* ----------------------------------------------- */
/* ISR for WAKEINT - Will be executed when         */
/* low pulse triggered on GPIO0 pin                */
/* ------------------------------------------------*/
__interrupt void wakeint_isr(void)
{
     // TOGGLE GPIO1 in the ISR - monitored with oscilloscope
    GPIO_toggle(myGpio, GPIO_Number_1);

    PIE_clearInt(myPie, PIE_GroupNumber_1);
}
