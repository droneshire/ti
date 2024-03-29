//#############################################################################
//
//  File:   f2802x_examples_ccsv4/lpm_standbywake/Example_F2802xStandbyWake.c
//
//  Title:  Device Standby Mode and Wakeup Program.
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>Standby Mode and Wakeup</h1>
//!
//!   This example puts the device into STANDBY mode. If the lowest
//!   possible current consumption in STANDBY mode is desired, the
//!   JTAG connector must be removed from the device board while
//!   the device is in STANDBY mode.
//!
//!   The example then wakes up the device from STANDBY using GPIO0.
//!   GPIO0 wakes the device from STANDBY mode when a low pulse
//!   (signal goes high->low->high)is detected on the pin.
//!   This pin must be pulsed by an external agent for wakeup.
//!
//!   As soon as GPIO0 goes high again after the pulse, the device
//!   should wake up, and GPIO1 can be observed to toggle.
//
//  (C) Copyright 2012, Texas Instruments, Inc.
//#############################################################################
// $TI Release: f2802x Support Library v210 $
// $Release Date: Mon Sep 17 09:13:31 CDT 2012 $
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

interrupt void wakeint_isr(void);      // ISR for WAKEINT

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
    
    // Setup the PLL for x12 /2 which will yield 60Mhz = 10Mhz * 12 / 2
    PLL_setup(myPll, PLL_Multiplier_12, PLL_DivideSelect_ClkIn_by_2);
    
    // Disable the PIE and all interrupts
    PIE_disable(myPie);
    PIE_disableAllInts(myPie);
    CPU_disableGlobalInts(myCpu);
    CPU_clearIntFlags(myCpu);
    
    // If running from flash copy RAM only functions to RAM   
#ifdef _FLASH
    memcpy(&RamfuncsRunStart, &RamfuncsLoadStart, (size_t)&RamfuncsLoadSize);
#endif   

    // Initalize GPIO
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
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_1, PIE_SubGroupNumber_8, (intVec_t)&wakeint_isr);

    // Enable CPU INT1 which is connected to WakeInt
    CPU_enableInt(myCpu, CPU_IntNumber_1);

    // Enable WAKEINT in the PIE: Group 1 interrupt 8
    PIE_enableInt(myPie, PIE_GroupNumber_1, PIE_InterruptSource_WAKE);
    
    PIE_clearInt(myPie, PIE_GroupNumber_1);
    
    // Enable global Interrupts
    CPU_enableGlobalInts(myCpu);

    // Choose qualification cycles in LPMCR0 register
    // The wakeup signal should be (2+QUALSTDBY) OSCCLKs wide.
    PWR_setNumStandByClocks(myPwr, PWR_NumStandByClocks_2);

    // Only enter Standby mode when PLL is not in limp mode.
    if ( PLL_getClkStatus(myPll) != PLL_PLLSTS_MCLKSTS_BITS) {
        // LPM mode = Standby
        PWR_setLowPowerMode(myPwr, PWR_LowPowerMode_Standby);
    }
    
// Force device into STANDBY

    IDLE;                    // Device waits in IDLE until falling edge on GPIO0/XNMI pin
                            // wakes device from Standby mode.
                             
    for(;;) {               // Loop here after wake-up.
    }                

}

/* ----------------------------------------------- */
/* ISR for WAKEINT - Will be executed when         */
/* low pulse triggered on GPIO0 pin                */
/* ------------------------------------------------*/
interrupt void wakeint_isr(void)
{

    // TOGGLE GPIO1 in the ISR - monitored with oscilloscope
    GPIO_toggle(myGpio, GPIO_Number_1);

    PIE_clearInt(myPie, PIE_GroupNumber_1);    

}
