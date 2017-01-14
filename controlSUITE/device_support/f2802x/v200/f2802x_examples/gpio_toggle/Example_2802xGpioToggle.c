//#############################################################################
//
//  File:   f2802x_examples_ccsv4/gpio_toggle/Example_F2802xGpioToggle.c
//
//  Title:  F2802x Device GPIO toggle test program.
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>GPIO Toggle</h1>
//!
//!   Three different examples are included. Select the example
//!   (data, set/clear or toggle) to execute before compiling using
//!   the #define statements found at the top of the code.
//!
//!   ALL OF THE I/O'S TOGGLE IN THIS PROGRAM.  MAKE SURE
//!   THIS WILL NOT DAMAGE YOUR HARDWARE BEFORE RUNNING THIS
//!   EXAMPLE.
//!
//!   The pins can be observed using Oscilloscope.
//
//  (C) Copyright 2012, Texas Instruments, Inc.
//#############################################################################
// $TI Release: f2802x Support Library v200 $
// $Release Date: Tue Jul 24 10:01:39 CDT 2012 $
//#############################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

#include "f2802x_common/include/clk.h"
#include "f2802x_common/include/flash.h"
#include "f2802x_common/include/gpio.h"
#include "f2802x_common/include/pie.h"
#include "f2802x_common/include/pll.h"
#include "f2802x_common/include/wdog.h"

// Select the example to compile in.  Only one example should be set as 1
// the rest should be set as 0.
#define EXAMPLE1 1  // Use DATA registers to toggle I/O's
#define EXAMPLE2 0  // Use SET/CLEAR registers to toggle I/O's
#define EXAMPLE3 0  // Use TOGGLE registers to toggle I/O's

// Prototype statements for functions found within this file.
void delay_loop(void);
void Gpio_select(void);
void Gpio_example1(void);
void Gpio_example2(void);
void Gpio_example3(void);

CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
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
    myGpio = GPIO_init((void *)GPIO_BASE_ADDR, sizeof(GPIO_Obj));
    myPie = PIE_init((void *)PIE_BASE_ADDR, sizeof(PIE_Obj));
    myPll = PLL_init((void *)PLL_BASE_ADDR, sizeof(PLL_Obj));
    myWDog = WDOG_init((void *)WDOG_BASE_ADDR, sizeof(WDOG_Obj));
    
    // Perform basic system initialization    
    WDOG_disable(myWDog);
    CLK_enableAdcClock(myClk);
    (*Device_cal)();
    CLK_disableAdcClock(myClk);
    
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

    // For this example use the following configuration:
    Gpio_select();

    // Setup a debug vector table and enable the PIE
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);


#if EXAMPLE1

    // This example uses DATA registers to toggle I/O's
    Gpio_example1();

#endif  // - EXAMPLE1

#if EXAMPLE2

    // This example uses SET/CLEAR registers to toggle I/O's
    Gpio_example2();

#endif  // - EXAMPLE2

#if EXAMPLE3

    // This example uses TOGGLE registers to toggle I/O's
    Gpio_example3();

#endif  // - EXAMPLE3

}

void delay_loop()
{
    short      i;
    for (i = 0; i < 1000; i++) {}
}

void Gpio_example1(void)
{
    // Example 1:
    // Toggle I/Os using DATA registers

    for(;;) {
        ((GPIO_Obj *)myGpio)->GPADAT = 0xAAAAAAAA;
        ((GPIO_Obj *)myGpio)->GPBDAT = 0x0000000A;

        delay_loop();
        
        ((GPIO_Obj *)myGpio)->GPADAT = 0x55555555;
        ((GPIO_Obj *)myGpio)->GPBDAT = 0x00000005;

        delay_loop();
    }
}

void Gpio_example2(void)
{
    // Example 2:
    // Toggle I/Os using SET/CLEAR registers
    for(;;) {

        ((GPIO_Obj *)myGpio)->GPASET = 0xAAAAAAAA;
        ((GPIO_Obj *)myGpio)->GPACLEAR = 0x55555555;

        ((GPIO_Obj *)myGpio)->GPBSET = 0x0000000A;
        ((GPIO_Obj *)myGpio)->GPBCLEAR = 0x00000005;

        delay_loop();

        ((GPIO_Obj *)myGpio)->GPACLEAR = 0xAAAAAAAA;
        ((GPIO_Obj *)myGpio)->GPASET = 0x55555555;

        ((GPIO_Obj *)myGpio)->GPBCLEAR = 0x0000000A;
        ((GPIO_Obj *)myGpio)->GPBSET = 0x00000005;

        delay_loop();

    }
}

void Gpio_example3(void)
{
    // Example 2:
    // Toggle I/Os using TOGGLE registers

    // Set pins to a known state

    ((GPIO_Obj *)myGpio)->GPASET = 0xAAAAAAAA;
    ((GPIO_Obj *)myGpio)->GPACLEAR = 0x55555555;

    ((GPIO_Obj *)myGpio)->GPBSET = 0x0000000A;
    ((GPIO_Obj *)myGpio)->GPBCLEAR = 0x00000005;

    // Use TOGGLE registers to flip the state of
    // the pins.
    // Any bit set to a 1 will flip state (toggle)
    // Any bit set to a 0 will not toggle.

    for(;;) {
        ((GPIO_Obj *)myGpio)->GPATOGGLE = 0xFFFFFFFF;
        ((GPIO_Obj *)myGpio)->GPBTOGGLE = 0x0000000F;
        delay_loop();
    }
}

void Gpio_select(void)
{

    EALLOW;
    ((GPIO_Obj *)myGpio)->GPAMUX1 = 0x00000000;
    ((GPIO_Obj *)myGpio)->GPAMUX2 = 0x00000000;
    ((GPIO_Obj *)myGpio)->GPBMUX1 = 0x00000000;
    ((GPIO_Obj *)myGpio)->GPADIR = 0xFFFFFFFF;
    ((GPIO_Obj *)myGpio)->GPBDIR = 0x0000000F;
    EDIS;

}
//===========================================================================
// No more.
//===========================================================================

