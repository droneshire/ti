//#############################################################################
//
//  File:   f2802x_examples/timed_led_blink/Example_F2802xLedBlink.c
//
//  Title:  F2802x LED Blink Getting Started Program.
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>LED Blink</h1>
//!
//!   This example configures CPU Timer0 for a 500 msec period, and toggles 
//!   the GPIO0-4 LEDs  once per interrupt. For testing purposes, this example
//!   also increments a counter each time the timer asserts an interrupt.
//!
//!   Watch Variables:
//!   - interruptCount
//!
//!   Monitor the GPIO0-4 LEDs blink on (for 500 msec) and off (for 500 msec) 
//!   on the 2802x0 control card.
//
//  (C) Copyright 2012, Texas Instruments, Inc.
//#############################################################################
// $TI Release: PACKAGE NAME $
// $Release Date: PACKAGE RELEASE DATE $
//#############################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

#include "f2802x_common/include/adc.h"
#include "f2802x_common/include/clk.h"
#include "f2802x_common/include/flash.h"
#include "f2802x_common/include/gpio.h"
#include "f2802x_common/include/pie.h"
#include "f2802x_common/include/pll.h"
#include "f2802x_common/include/timer.h"
#include "f2802x_common/include/wdog.h"

// Prototype statements for functions found within this file.
__interrupt void cpu_timer0_isr(void);

uint16_t interruptCount = 0;

ADC_Handle myAdc;
CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;
TIMER_Handle myTimer;

void main(void)
{

    CPU_Handle myCpu;
    PLL_Handle myPll;
    WDOG_Handle myWDog;
    
    // Initialize all the handles needed for this application    
    myAdc = ADC_init((void *)ADC_BASE_ADDR, sizeof(ADC_Obj));
    myClk = CLK_init((void *)CLK_BASE_ADDR, sizeof(CLK_Obj));
    myCpu = CPU_init((void *)NULL, sizeof(CPU_Obj));
    myFlash = FLASH_init((void *)FLASH_BASE_ADDR, sizeof(FLASH_Obj));
    myGpio = GPIO_init((void *)GPIO_BASE_ADDR, sizeof(GPIO_Obj));
    myPie = PIE_init((void *)PIE_BASE_ADDR, sizeof(PIE_Obj));
    myPll = PLL_init((void *)PLL_BASE_ADDR, sizeof(PLL_Obj));
    myTimer = TIMER_init((void *)TIMER0_BASE_ADDR, sizeof(TIMER_Obj));
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
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_1, PIE_SubGroupNumber_7, (intVec_t)&cpu_timer0_isr);

    // Configure CPU-Timer 0 to interrupt every 500 milliseconds:
    // 60MHz CPU Freq, 50 millisecond Period (in uSeconds)
    //    ConfigCpuTimer(&CpuTimer0, 60, 500000);
    TIMER_stop(myTimer);
    TIMER_setPeriod(myTimer, 50 * 500000);
    TIMER_setPreScaler(myTimer, 0);
    TIMER_reload(myTimer);
    TIMER_setEmulationMode(myTimer, TIMER_EmulationMode_StopAfterNextDecrement);
    TIMER_enableInt(myTimer);

    TIMER_start(myTimer);


    // Configure GPIO 0-3 as outputs
    GPIO_setMode(myGpio, GPIO_Number_0, GPIO_0_Mode_GeneralPurpose);
    GPIO_setMode(myGpio, GPIO_Number_1, GPIO_0_Mode_GeneralPurpose);
    GPIO_setMode(myGpio, GPIO_Number_2, GPIO_0_Mode_GeneralPurpose);
    GPIO_setMode(myGpio, GPIO_Number_3, GPIO_0_Mode_GeneralPurpose);
    
    GPIO_setDirection(myGpio, GPIO_Number_0, GPIO_Direction_Output);
    GPIO_setDirection(myGpio, GPIO_Number_1, GPIO_Direction_Output);
    GPIO_setDirection(myGpio, GPIO_Number_2, GPIO_Direction_Output);
    GPIO_setDirection(myGpio, GPIO_Number_3, GPIO_Direction_Output);
    
    GPIO_setLow(myGpio, GPIO_Number_0);
    GPIO_setHigh(myGpio, GPIO_Number_1);
    GPIO_setLow(myGpio, GPIO_Number_2);
    GPIO_setHigh(myGpio, GPIO_Number_3);

    // Enable CPU INT1 which is connected to CPU-Timer 0:
    CPU_enableInt(myCpu, CPU_IntNumber_1);

    // Enable TINT0 in the PIE: Group 1 interrupt 7
    PIE_enableTimer0Int(myPie);

    // Enable global Interrupts and higher priority real-time debug events
    CPU_enableGlobalInts(myCpu);
    CPU_enableDebugInt(myCpu);

    for(;;){
        __asm(" NOP");
    }
    
}


__interrupt void cpu_timer0_isr(void)
{
    interruptCount++;
    
    // Toggle GPIOs
    GPIO_toggle(myGpio, GPIO_Number_0);
    GPIO_toggle(myGpio, GPIO_Number_1);
    GPIO_toggle(myGpio, GPIO_Number_2);
    GPIO_toggle(myGpio, GPIO_Number_3);
    
    // Acknowledge this interrupt to receive more interrupts from group 1
    PIE_clearInt(myPie, PIE_GroupNumber_1);
}


//===========================================================================
// No more.
//===========================================================================
