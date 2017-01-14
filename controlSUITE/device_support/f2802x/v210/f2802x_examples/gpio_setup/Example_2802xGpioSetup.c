//#############################################################################
//
//  File:   f2802x_examples_ccsv4/gpio_setup/Example_F2802xGpioSetup.c
//
//  Title:  F2802x Device GPIO Setup
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>GPIO Setup</h1>
//!
//!   Configures the 2802x GPIO into two different configurations
//!   This code is verbose to illustrate how the GPIO could be setup.
//!   In a real application, lines of code can be combined for improved
//!   code size and efficiency.
//!
//!   This example only sets-up the GPIO.  Nothing is actually done with
//!   the pins after setup.
//!
//!   In general:
//!   - All pullup resistors are enabled.  For EPwms this may not be desired.
//!   - Input qual for communication ports (eCAN, SPI, SCI, I2C) is asynchronous
//!   - Input qual for Trip pins (TZ) is asynchronous
//!   - Input qual for eCAP is synch to SYSCLKOUT
//!   - Input qual for some I/O's and interrupts may have a sampling window
//
//  (C) Copyright 2012, Texas Instruments, Inc.
//#############################################################################
// $TI Release: f2802x Support Library v210 $
// $Release Date: Mon Sep 17 09:13:31 CDT 2012 $
//#############################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include Files

#include "f2802x_common/include/clk.h"
#include "f2802x_common/include/flash.h"
#include "f2802x_common/include/gpio.h"
#include "f2802x_common/include/pie.h"
#include "f2802x_common/include/pll.h"
#include "f2802x_common/include/wdog.h"

// Select the example to compile in.  Only one example should be set as 1
// the rest should be set as 0.

#define EXAMPLE1 1  // Basic pinout configuration example
#define EXAMPLE2 0  // Communication pinout example

// Prototype statements for functions found within this file.
void Gpio_setup1(void);
void Gpio_setup2(void);

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

    // Setup a debug vector table and enable the PIE
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);


#if EXAMPLE1

    // This example is a basic pinout
    Gpio_setup1();

#endif  // - EXAMPLE1

#if EXAMPLE2

    // This example is a communications pinout
    Gpio_setup2();

#endif  // - EXAMPLE2

}

void Gpio_setup1(void)
{
    // Example 1:
    // Basic Pinout.
    // This basic pinout includes:
    // PWM1-3, TZ1-TZ4, SPI-A, EQEP1, SCI-A, I2C
    // and a number of I/O pins

    // These can be combined into single statements for improved
    // code efficiency.

    // Enable PWM1-3 on GPIO0-GPIO5
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_1, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_2, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_3, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_4, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_5, GPIO_PullUp_Enable);
    GPIO_setMode(myGpio, GPIO_Number_0, GPIO_0_Mode_EPWM1A);
    GPIO_setMode(myGpio, GPIO_Number_1, GPIO_1_Mode_EPWM1B);
    GPIO_setMode(myGpio, GPIO_Number_2, GPIO_2_Mode_EPWM2A);
    GPIO_setMode(myGpio, GPIO_Number_3, GPIO_3_Mode_EPWM2B);
    GPIO_setMode(myGpio, GPIO_Number_4, GPIO_4_Mode_EPWM3A);
    GPIO_setMode(myGpio, GPIO_Number_5, GPIO_5_Mode_EPWM3B);

    // Enable an GPIO output on GPIO6&7, set it high
    GPIO_setPullUp(myGpio, GPIO_Number_6, GPIO_PullUp_Enable);
    GPIO_setHigh(myGpio, GPIO_Number_6);
    GPIO_setMode(myGpio, GPIO_Number_6, GPIO_6_Mode_GeneralPurpose);
    GPIO_setDirection(myGpio, GPIO_Number_6, GPIO_Direction_Output);

    GPIO_setPullUp(myGpio, GPIO_Number_7, GPIO_PullUp_Enable);
    GPIO_setHigh(myGpio, GPIO_Number_7);
    GPIO_setMode(myGpio, GPIO_Number_7, GPIO_7_Mode_GeneralPurpose);
    GPIO_setDirection(myGpio, GPIO_Number_7, GPIO_Direction_Output);


    // Enable Trip Zone input on GPIO12
    GPIO_setPullUp(myGpio, GPIO_Number_12, GPIO_PullUp_Enable);
    GPIO_setQualification(myGpio, GPIO_Number_12, GPIO_Qual_ASync);
    GPIO_setMode(myGpio, GPIO_Number_12, GPIO_12_Mode_TZ1_NOT);

    // Enable SPI-A on GPIO16 - GPIO19
    GPIO_setPullUp(myGpio, GPIO_Number_16, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_17, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_18, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_19, GPIO_PullUp_Enable);
    GPIO_setQualification(myGpio, GPIO_Number_16, GPIO_Qual_ASync);
    GPIO_setQualification(myGpio, GPIO_Number_17, GPIO_Qual_ASync);
    GPIO_setQualification(myGpio, GPIO_Number_18, GPIO_Qual_ASync);
    GPIO_setQualification(myGpio, GPIO_Number_19, GPIO_Qual_ASync);
    GPIO_setMode(myGpio, GPIO_Number_16, GPIO_16_Mode_SPISIMOA);
    GPIO_setMode(myGpio, GPIO_Number_17, GPIO_17_Mode_SPISOMIA);
    GPIO_setMode(myGpio, GPIO_Number_18, GPIO_18_Mode_SPICLKA);
    GPIO_setMode(myGpio, GPIO_Number_19, GPIO_19_Mode_SPISTEA_NOT);




    // Enable SCI-A on GPIO28 - GPIO29
    GPIO_setPullUp(myGpio, GPIO_Number_28, GPIO_PullUp_Enable);
    GPIO_setQualification(myGpio, GPIO_Number_28, GPIO_Qual_ASync);
    GPIO_setMode(myGpio, GPIO_Number_28, GPIO_28_Mode_SCIRXDA);
    GPIO_setPullUp(myGpio, GPIO_Number_29, GPIO_PullUp_Enable);
    GPIO_setMode(myGpio, GPIO_Number_29, GPIO_29_Mode_SCITXDA);


    // Make GPIO34 an input
    GPIO_setPullUp(myGpio, GPIO_Number_34, GPIO_PullUp_Enable);
    GPIO_setMode(myGpio, GPIO_Number_34, GPIO_34_Mode_GeneralPurpose);
    GPIO_setDirection(myGpio, GPIO_Number_34, GPIO_Direction_Input);
}

void Gpio_setup2(void)
{
    // Example 1:
    // Communications Pinout.
    // This basic communications pinout includes:
    // PWM1-3, SPI-A, SCI-A
    // and a number of I/O pins

    // Enable PWM1-3 on GPIO0-GPIO5
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Enable);
    GPIO_setMode(myGpio, GPIO_Number_0, GPIO_0_Mode_EPWM1A);
    GPIO_setMode(myGpio, GPIO_Number_1, GPIO_1_Mode_EPWM1B);
    GPIO_setMode(myGpio, GPIO_Number_2, GPIO_2_Mode_EPWM2A);
    GPIO_setMode(myGpio, GPIO_Number_3, GPIO_3_Mode_EPWM2B);
    GPIO_setMode(myGpio, GPIO_Number_4, GPIO_4_Mode_EPWM3A);
    GPIO_setMode(myGpio, GPIO_Number_5, GPIO_5_Mode_EPWM3B);

    // Enable an GPIO output on GPIO6&7
    GPIO_setPullUp(myGpio, GPIO_Number_6, GPIO_PullUp_Enable);
    GPIO_setHigh(myGpio, GPIO_Number_6);
    GPIO_setMode(myGpio, GPIO_Number_6, GPIO_6_Mode_GeneralPurpose);
    GPIO_setDirection(myGpio, GPIO_Number_6, GPIO_Direction_Output);

    GPIO_setPullUp(myGpio, GPIO_Number_7, GPIO_PullUp_Enable);
    GPIO_setHigh(myGpio, GPIO_Number_7);
    GPIO_setMode(myGpio, GPIO_Number_7, GPIO_7_Mode_GeneralPurpose);
    GPIO_setDirection(myGpio, GPIO_Number_7, GPIO_Direction_Output);
    

    // Enable SPI-A on GPIO16 - GPIO19
    GPIO_setPullUp(myGpio, GPIO_Number_16, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_17, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_18, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_19, GPIO_PullUp_Enable);
    GPIO_setQualification(myGpio, GPIO_Number_16, GPIO_Qual_ASync);
    GPIO_setQualification(myGpio, GPIO_Number_17, GPIO_Qual_ASync);
    GPIO_setQualification(myGpio, GPIO_Number_18, GPIO_Qual_ASync);
    GPIO_setQualification(myGpio, GPIO_Number_19, GPIO_Qual_ASync);
    GPIO_setMode(myGpio, GPIO_Number_16, GPIO_16_Mode_SPISIMOA);
    GPIO_setMode(myGpio, GPIO_Number_17, GPIO_17_Mode_SPISOMIA);
    GPIO_setMode(myGpio, GPIO_Number_18, GPIO_18_Mode_SPICLKA);
    GPIO_setMode(myGpio, GPIO_Number_19, GPIO_19_Mode_SPISTEA_NOT);

    // Enable SCI-A on GPIO28 - GPIO29
    GPIO_setPullUp(myGpio, GPIO_Number_28, GPIO_PullUp_Enable);
    GPIO_setQualification(myGpio, GPIO_Number_28, GPIO_Qual_ASync);
    GPIO_setMode(myGpio, GPIO_Number_28, GPIO_28_Mode_SCIRXDA);
    GPIO_setPullUp(myGpio, GPIO_Number_29, GPIO_PullUp_Enable);
    GPIO_setMode(myGpio, GPIO_Number_29, GPIO_29_Mode_SCITXDA);

    // Make GPIO34 an input
    GPIO_setPullUp(myGpio, GPIO_Number_34, GPIO_PullUp_Enable);
    GPIO_setMode(myGpio, GPIO_Number_34, GPIO_34_Mode_GeneralPurpose);
    GPIO_setDirection(myGpio, GPIO_Number_34, GPIO_Direction_Input);

}

//===========================================================================
// No more.
//===========================================================================

