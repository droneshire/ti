//#############################################################################
//
//  File:   f2802x_examples_ccsv4/epwm_trip_zone/Example_F2802xEpwmTripZone.c
//
//  Title:  Check PWM Trip Zone Test
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>PWM Trip Zone</h1>
//!
//!   This example configures ePWM1 and ePWM2
//!
//!   2 Examples are included:
//!   - ePWM1 has TZ1 and TZ2 as one shot trip sources
//!   - ePWM2 has TZ1 and TZ2 as cycle by cycle trip sources
//!
//!   Each ePWM is configured to interrupt on the 3rd zero event.
//!   When this happens, the deadband is modified such that
//!   0 <= DB <= DB_MAX.  That is, the deadband will move up and
//!   down between 0 and the maximum value.
//!
//!   View the EPWM1A/B, EPWM2A/B waveforms
//!   via an oscilloscope to see the effect of TZ1 and TZ2
//!
//!   Initially tie TZ1 (GPIO12) and TZ2 (GPIO13) high.
//!
//!   During the test, monitor ePWM1 or ePWM2 outputs
//!   on a scope Pull TZ1 or TZ2 low to see the effect.
//!
//!      EPWM1A is on GPIO0 \n
//!      EPWM1B is on GPIO1 \n
//!      EPWM2A is on GPIO2 \n
//!      EPWM2B is on GPIO3
//!
//!   ePWM1 will react as a 1 shot trip.
//!
//!   ePWM2 will react as a cycle by cycle trip and will be
//!   cleared if TZ1 and TZ2 are both pulled back high.
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
#include "f2802x_common/include/pwm.h"
#include "f2802x_common/include/wdog.h"

// Prototype statements for functions found within this file.
void InitEPwm1Example(void);
void InitEPwm2Example(void);
interrupt void epwm1_tzint_isr(void);
interrupt void epwm2_tzint_isr(void);

// Global variables used in this example
uint32_t  EPwm1TZIntCount;
uint32_t  EPwm2TZIntCount;

CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;
PWM_Handle myPwm1, myPwm2, myPwm3;

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
    myPwm1 = PWM_init((void *)PWM_ePWM1_BASE_ADDR, sizeof(PWM_Obj));
    myPwm2 = PWM_init((void *)PWM_ePWM2_BASE_ADDR, sizeof(PWM_Obj));
    myPwm3 = PWM_init((void *)PWM_ePWM3_BASE_ADDR, sizeof(PWM_Obj));
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

// For this case just init GPIO pins for ePWM1, ePWM2, and TZ pins
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Disable);
    GPIO_setPullUp(myGpio, GPIO_Number_1, GPIO_PullUp_Disable);
    GPIO_setMode(myGpio, GPIO_Number_0, GPIO_0_Mode_EPWM1A);
    GPIO_setMode(myGpio, GPIO_Number_1, GPIO_1_Mode_EPWM1B);
    
    GPIO_setPullUp(myGpio, GPIO_Number_2, GPIO_PullUp_Disable);
    GPIO_setPullUp(myGpio, GPIO_Number_3, GPIO_PullUp_Disable);
    GPIO_setMode(myGpio, GPIO_Number_2, GPIO_2_Mode_EPWM2A);
    GPIO_setMode(myGpio, GPIO_Number_3, GPIO_3_Mode_EPWM2B);
    
    GPIO_setPullUp(myGpio, GPIO_Number_12, GPIO_PullUp_Enable);
    GPIO_setQualification(myGpio, GPIO_Number_12, GPIO_Qual_ASync);
    GPIO_setMode(myGpio, GPIO_Number_12, GPIO_12_Mode_TZ1_NOT);
    
    GPIO_setPullUp(myGpio, GPIO_Number_16, GPIO_PullUp_Enable);
    GPIO_setQualification(myGpio, GPIO_Number_16, GPIO_Qual_ASync);
    GPIO_setMode(myGpio, GPIO_Number_16, GPIO_16_Mode_TZ2_NOT);
    
    GPIO_setPullUp(myGpio, GPIO_Number_17, GPIO_PullUp_Enable);
    GPIO_setQualification(myGpio, GPIO_Number_17, GPIO_Qual_ASync);
    GPIO_setMode(myGpio, GPIO_Number_17, GPIO_17_Mode_TZ3_NOT);

    // Setup a debug vector table and enable the PIE
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);

    // Register interrupt handlers in the PIE vector table
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_2, PIE_SubGroupNumber_1, (intVec_t)&epwm1_tzint_isr);
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_2, PIE_SubGroupNumber_1, (intVec_t)&epwm2_tzint_isr);

    CLK_disableTbClockSync(myClk);

    InitEPwm1Example();
    InitEPwm2Example();

    CLK_enableTbClockSync(myClk);

    // Initalize counters:
    EPwm1TZIntCount = 0;
    EPwm2TZIntCount = 0;

    // Enable CPU INT3 which is connected to EPWM1-3 INT
    CPU_enableInt(myCpu, CPU_IntNumber_2);

    // Enable EPWM INTn in the PIE: Group 2 interrupt 1-3
    PIE_enablePwmTzInt(myPie, PWM_Number_1);
    PIE_enablePwmTzInt(myPie, PWM_Number_2);

    // Enable global Interrupts and higher priority real-time debug events:
    CPU_enableGlobalInts(myCpu);
    CPU_enableDebugInt(myCpu);

    for(;;) {
        asm(" NOP");
    }

}

interrupt void epwm1_tzint_isr(void)
{
    EPwm1TZIntCount++;

    // Leave PWM flags set so we only take this
    // interrupt once

    // Acknowledge this interrupt to receive more interrupts from group 2
    PIE_clearInt(myPie, PIE_GroupNumber_2);

}

interrupt void epwm2_tzint_isr(void)
{

    EPwm2TZIntCount++;

    // Clear the flags - we will continue to take
    // this interrupt until the TZ pin goes high
    PWM_clearTripZone(myPwm2, PWM_TripZoneFlag_CBC);
    PWM_clearTripZone(myPwm2, PWM_TripZoneFlag_Global);

    // Acknowledge this interrupt to receive more interrupts from group 2
    PIE_clearInt(myPie, PIE_GroupNumber_2);

}


void InitEPwm1Example()
{
    
    CLK_enablePwmClock(myClk, PWM_Number_1);
    
    // Enable TZ1 and TZ2 as one shot trip sources
    PWM_enableTripZoneSrc(myPwm1, PWM_TripZoneSrc_OneShot_TZ1_NOT);
    PWM_enableTripZoneSrc(myPwm1, PWM_TripZoneSrc_OneShot_TZ2_NOT);

    // What do we want the TZ1 and TZ2 to do?
    PWM_setTripZoneState_TZA(myPwm1, PWM_TripZoneState_EPWM_High);
    PWM_setTripZoneState_TZB(myPwm1, PWM_TripZoneState_EPWM_Low);

    // Enable TZ interrupt
    PWM_enableTripZoneInt(myPwm1, PWM_TripZoneFlag_OST);

    PWM_setPeriod(myPwm1, 6000);    // Set timer period
    PWM_setPhase(myPwm1, 0x0000);   // Phase is 0
    PWM_setCount(myPwm1, 0x0000);   // Clear counter

    // Setup TBCLK
    PWM_setCounterMode(myPwm1, PWM_CounterMode_UpDown); // Count up
    PWM_disableCounterLoad(myPwm1);                     // Disable phase loading
    PWM_setHighSpeedClkDiv(myPwm1, PWM_HspClkDiv_by_4); // Clock ratio to SYSCLKOUT
    PWM_setClkDiv(myPwm1, PWM_ClkDiv_by_4);

    PWM_setShadowMode_CmpA(myPwm1, PWM_ShadowMode_Shadow);  // Load registers every ZERO
    PWM_setShadowMode_CmpB(myPwm1, PWM_ShadowMode_Shadow);
    PWM_setLoadMode_CmpA(myPwm1, PWM_LoadMode_Zero);
    PWM_setLoadMode_CmpB(myPwm1, PWM_LoadMode_Zero);

    // Setup compare
    PWM_setCmpA(myPwm1, 3000);

    // Set actions
    PWM_setActionQual_CntUp_CmpA_PwmA(myPwm1, PWM_ActionQual_Set);
    PWM_setActionQual_CntDown_CmpA_PwmA(myPwm1, PWM_ActionQual_Clear);

    PWM_setActionQual_CntUp_CmpA_PwmB(myPwm1, PWM_ActionQual_Clear);
    PWM_setActionQual_CntDown_CmpA_PwmB(myPwm1, PWM_ActionQual_Set);

}


void InitEPwm2Example()
{

    CLK_enablePwmClock(myClk, PWM_Number_2);
    
    // Enable TZ1 and TZ2 as one cycle-by-cycle trip sources
    PWM_enableTripZoneSrc(myPwm2, PWM_TripZoneSrc_CycleByCycle_TZ1_NOT);
    PWM_enableTripZoneSrc(myPwm2, PWM_TripZoneSrc_CycleByCycle_TZ2_NOT);

    // What do we want the TZ1 and TZ2 to do?
    PWM_setTripZoneState_TZA(myPwm2, PWM_TripZoneState_EPWM_High);
    PWM_setTripZoneState_TZB(myPwm2, PWM_TripZoneState_EPWM_Low);

    // Enable TZ interrupt
    PWM_enableTripZoneInt(myPwm2, PWM_TripZoneFlag_CBC);

    PWM_setPeriod(myPwm2, 6000);    // Set timer period
    PWM_setPhase(myPwm2, 0x0000);   // Phase is 0
    PWM_setCount(myPwm2, 0x0000);   // Clear counter

    // Setup TBCLK
    PWM_setCounterMode(myPwm2, PWM_CounterMode_UpDown); // Count up/down
    PWM_disableCounterLoad(myPwm2);                     // Disable phase loading
    PWM_setHighSpeedClkDiv(myPwm2, PWM_HspClkDiv_by_4); // Clock ratio to SYSCLKOUT
    PWM_setClkDiv(myPwm2, PWM_ClkDiv_by_4);             // Slow just to observe on the scope

    // Setup compare
    PWM_setCmpA(myPwm2, 3000);

    // Set actions
    PWM_setActionQual_CntUp_CmpA_PwmA(myPwm2, PWM_ActionQual_Set);
    PWM_setActionQual_CntDown_CmpA_PwmA(myPwm2, PWM_ActionQual_Clear);

    PWM_setActionQual_CntUp_CmpA_PwmB(myPwm2, PWM_ActionQual_Clear);
    PWM_setActionQual_CntDown_CmpA_PwmB(myPwm2, PWM_ActionQual_Set);
}




//===========================================================================
// No more.
//===========================================================================
