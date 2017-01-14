//#############################################################################
//
//  File:   f2802x_examples_ccsv4/epwm_real-time_interrupts/Example_F2802xEPwmRealTimeInt.c
//
//  Title:  F2802x ePWM Real-Time Interrupt example.
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>PWM Real-Time Interrupt</h1>
//!
//!   This example configures the ePWM1 Timer and increments
//!   a counter each time an interrupt is taken. ePWM interrupt can
//!   be configured as time critical to demonstrate real-time mode 
//!   functionality and real-time interrupt capability
//!
//!     ControlCard LED2 (GPIO31) toggled in main loop. \n
//!     ControlCard LED3 (GPIO34) toggled in ePWM1 Timer Interrupt.
//!
//!   FREE_SOFT bits and DBBIER.INT3 bit must be set to enable ePWM1
//!   interrupt to be time critical and operational in real time mode
//!   after halt command.
//!
//!   As supplied:
//!
//!   ePWM1 is initalized. \n
//!     ePWM1 is cleared at period match and set at Compare-A match.
//!     Compare A match occurs at half period.
//!
//!     GPIOs for LED2 and LED3 are initialized.
//!
//!     Free_Soft bits and DBGIER are cleared.
//!
//!   An interrupt is taken on a zero event for the ePWM1 timer.
//!   
//!   Watch Variables:
//!   - EPwm1TimerIntCount
//!   - EPwm1Regs.TBCTL.bit.FREE_SOFT
//!   - EPwm1Regs.TBCTR
//!   - DBGIER.INT3
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


// Configure if ePWM timer interrupt is enabled at the PIE level:
// 1 = enabled,  0 = disabled
#define PWM1_INT_ENABLE  1

// Configure the period for the timer
#define PWM1_TIMER_TBPRD   0x1FFF

// Prototype statements for functions found within this file.
interrupt void epwm1_timer_isr(void);
void InitEPwmTimer(void);

// Global variables used in this example
uint32_t  EPwm1TimerIntCount;        //counts entries into PWM1 Interrupt 
uint16_t    LEDcount;        //creates delay for LED3 toggling

CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;
PWM_Handle myPwm1, myPwm2, myPwm3;

void main(void)
{
    int i;
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

    // Initalize GPIO
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Disable);
    GPIO_setPullUp(myGpio, GPIO_Number_1, GPIO_PullUp_Disable);
    GPIO_setMode(myGpio, GPIO_Number_0, GPIO_0_Mode_EPWM1A);
    GPIO_setMode(myGpio, GPIO_Number_1, GPIO_1_Mode_EPWM1B);

    GPIO_setDirection(myGpio, GPIO_Number_2, GPIO_Direction_Output);
    GPIO_setDirection(myGpio, GPIO_Number_3, GPIO_Direction_Output);
    GPIO_setMode(myGpio, GPIO_Number_2, GPIO_2_Mode_GeneralPurpose);
    GPIO_setMode(myGpio, GPIO_Number_3, GPIO_3_Mode_GeneralPurpose);
    GPIO_setLow(myGpio, GPIO_Number_2);
    GPIO_setHigh(myGpio, GPIO_Number_3);

    // Setup a debug vector table and enable the PIE
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);

    // Register interrupt handlers in the PIE vector table
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_3, PIE_SubGroupNumber_1, (intVec_t)&epwm1_timer_isr);
    
    InitEPwmTimer();    

    // Initalize counters
    EPwm1TimerIntCount = 0;
    LEDcount=0;

    // Enable CPU INT3 which is connected to EPWM1-6 INT
    CPU_enableInt(myCpu, CPU_IntNumber_3);

    // Enable EPWM INTn in the PIE: Group 3 interrupt 1-6
    PIE_enablePwmInt(myPie, PWM_Number_1);
    
    // Initially disable time-critical interrupts   
    setDBGIER(0x0000);   //PIE groups time-critical designation

    // Enable global Interrupts and higher priority real-time debug events
    CPU_enableGlobalInts(myCpu);
    CPU_enableDebugInt(myCpu);

    for(;;) {
        asm(" NOP");
        for(i=1;i<=100;i++) {
            //toggle LED2 on the controlCARD
            GPIO_toggle(myGpio, GPIO_Number_2);
        }
    }
}

void InitEPwmTimer()
{

    // Stop all the TB clocks
    CLK_disableTbClockSync(myClk);
    // Enable the PWM
    CLK_enablePwmClock(myClk, PWM_Number_1);

    // Disable Sync
    PWM_setSyncMode(myPwm1, PWM_SyncMode_CounterEqualZero);
    
    // Initally disable Free/Soft Bits
    PWM_setRunMode(myPwm1, PWM_RunMode_SoftStopAfterIncr);
    
    PWM_setPeriod(myPwm1, PWM1_TIMER_TBPRD);                        // Set up PWM1 Period
    PWM_setCounterMode(myPwm1, PWM_CounterMode_Up);                 // Count up mode
    PWM_setIntMode(myPwm1, PWM_IntMode_CounterEqualZero);           // Select INT on Zero event
    PWM_enableInt(myPwm1);                                          // Enable INT
    PWM_setIntPeriod(myPwm1, PWM_IntPeriod_FirstEvent);             // Generate INT on 1st event
    PWM_setCmpA(myPwm1, PWM1_TIMER_TBPRD/2);                        // Clear timer counter
    PWM_setActionQual_Period_PwmA(myPwm1, PWM_ActionQual_Clear);    // CompareA event at half of period
    PWM_setActionQual_CntUp_CmpA_PwmA(myPwm1, PWM_ActionQual_Set);  // Action-qualifiers, Set on CMPA, Clear on PRD

    // Start all the timers synced
    CLK_enableTbClockSync(myClk);

}

// Interrupt routines uses in this example:
interrupt void epwm1_timer_isr(void)
{
    EPwm1TimerIntCount++;
    LEDcount++;
    
    // Clear INT flag for this timer
    PWM_clearIntFlag(myPwm1);

    if (LEDcount==500) {
        //turn on/off LED3 on the controlCARD
        GPIO_toggle(myGpio, GPIO_Number_3);
        LEDcount=0;
    }

    // Acknowledge this interrupt to receive more interrupts from group 3
    PIE_clearInt(myPie, PIE_GroupNumber_3);
}

//===========================================================================
// No more.
//===========================================================================
