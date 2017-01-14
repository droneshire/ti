//#############################################################################
//
//  File:   f2802x_examples_ccsv4/adc_soc/Example_F2802xAdcSoc.c
//
//  Title:  F2802x ADC Start-Of-Conversion (SOC) Example Program.
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>ADC Start-Of-Conversion (SOC)</h1>
//!
//!   Interrupts are enabled and the ePWM1 is setup to generate a periodic
//!   ADC SOC - ADCINT1. Two channels are converted, ADCINA4 and ADCINA2.
//!
//!   Watch Variables:
//!
//!   - Voltage1[10] - Last 10 ADCRESULT0 values
//!   - Voltage2[10] - Last 10 ADCRESULT1 values
//!   - ConversionCount - Current result number 0-9
//!   - LoopCount - Idle loop counter
//
//  (C) Copyright 2012, Texas Instruments, Inc.
//#############################################################################
// $TI Release: f2802x Support Library v200 $
// $Release Date: Tue Jul 24 10:01:39 CDT 2012 $
//#############################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

#include "f2802x_common/include/adc.h"
#include "f2802x_common/include/clk.h"
#include "f2802x_common/include/flash.h"
#include "f2802x_common/include/gpio.h"
#include "f2802x_common/include/pie.h"
#include "f2802x_common/include/pll.h"
#include "f2802x_common/include/wdog.h"

// Prototype statements for functions found within this file.
interrupt void adc_isr(void);
void Adc_Config(void);

// Global variables used in this example:
uint16_t LoopCount;
uint16_t ConversionCount;
uint16_t Voltage1[10];
uint16_t Voltage2[10];

ADC_Handle myAdc;
CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;
PWM_Handle myPwm;

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
    myPwm = PWM_init((void *)PWM_ePWM1_BASE_ADDR, sizeof(PWM_Obj));
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
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_10, PIE_SubGroupNumber_1, (intVec_t)&adc_isr);

    // Initialize the ADC
    ADC_enableBandGap(myAdc);
    ADC_enableRefBuffers(myAdc);
    ADC_powerUp(myAdc);
    ADC_enable(myAdc);
    ADC_setVoltRefSrc(myAdc, ADC_VoltageRefSrc_Int);

    // Enable ADCINT1 in PIE
    PIE_enableAdcInt(myPie, ADC_IntNumber_1);
    // Enable CPU Interrupt 1
    CPU_enableInt(myCpu, CPU_IntNumber_10);
    // Enable Global interrupt INTM
    CPU_enableGlobalInts(myCpu);
    // Enable Global realtime interrupt DBGM
    CPU_enableDebugInt(myCpu);

    LoopCount = 0;
    ConversionCount = 0;

    // Configure ADC
    //Note: Channel ADCINA4  will be double sampled to workaround the ADC 1st sample issue for rev0 silicon errata  
    ADC_setIntPulseGenMode(myAdc, ADC_IntPulseGenMode_Prior);               //ADCINT1 trips after AdcResults latch
    ADC_enableInt(myAdc, ADC_IntNumber_1);                                  //Enabled ADCINT1
    ADC_setIntMode(myAdc, ADC_IntNumber_1, ADC_IntMode_ClearFlag);          //Disable ADCINT1 Continuous mode
    ADC_setIntSrc(myAdc, ADC_IntNumber_1, ADC_IntSrc_EOC2);                 //setup EOC2 to trigger ADCINT1 to fire
    ADC_setSocChanNumber (myAdc, ADC_SocNumber_0, ADC_SocChanNumber_A4);    //set SOC0 channel select to ADCINA4
    ADC_setSocChanNumber (myAdc, ADC_SocNumber_1, ADC_SocChanNumber_A4);    //set SOC1 channel select to ADCINA4
    ADC_setSocChanNumber (myAdc, ADC_SocNumber_2, ADC_SocChanNumber_A2);    //set SOC2 channel select to ADCINA2
    ADC_setSocTrigSrc(myAdc, ADC_SocNumber_0, ADC_SocTrigSrc_EPWM1_ADCSOCA);    //set SOC0 start trigger on EPWM1A, due to round-robin SOC0 converts first then SOC1
    ADC_setSocTrigSrc(myAdc, ADC_SocNumber_1, ADC_SocTrigSrc_EPWM1_ADCSOCA);    //set SOC1 start trigger on EPWM1A, due to round-robin SOC0 converts first then SOC1
    ADC_setSocTrigSrc(myAdc, ADC_SocNumber_2, ADC_SocTrigSrc_EPWM1_ADCSOCA);    //set SOC2 start trigger on EPWM1A, due to round-robin SOC0 converts first then SOC1, then SOC2
    ADC_setSocSampleWindow(myAdc, ADC_SocNumber_0, ADC_SocSampleWindow_7_cycles);   //set SOC0 S/H Window to 7 ADC Clock Cycles, (6 ACQPS plus 1)
    ADC_setSocSampleWindow(myAdc, ADC_SocNumber_1, ADC_SocSampleWindow_7_cycles);   //set SOC1 S/H Window to 7 ADC Clock Cycles, (6 ACQPS plus 1)
    ADC_setSocSampleWindow(myAdc, ADC_SocNumber_2, ADC_SocSampleWindow_7_cycles);   //set SOC2 S/H Window to 7 ADC Clock Cycles, (6 ACQPS plus 1)

    // Enable PWM clock
    CLK_enablePwmClock(myClk, PWM_Number_1);
    
    // Setup PWM
    PWM_enableSocAPulse(myPwm);                                         // Enable SOC on A group
    PWM_setSocAPulseSrc(myPwm, PWM_SocPulseSrc_CounterEqualCmpAIncr);   // Select SOC from from CPMA on upcount
    PWM_setSocAPeriod(myPwm, PWM_SocPeriod_FirstEvent);                 // Generate pulse on 1st event
    PWM_setCmpA(myPwm, 0x0080);                                         // Set compare A value
    PWM_setPeriod(myPwm, 0xFFFF);                                       // Set period for ePWM1
    PWM_setCounterMode(myPwm, PWM_CounterMode_Up);                      // count up and start

    // Wait for ADC interrupt
    for(;;)
    {
        LoopCount++;
    }

}


interrupt void adc_isr(void)
{
 
    //discard ADCRESULT0 as part of the workaround to the 1st sample errata for rev0
    Voltage1[ConversionCount] = ADC_readResult(myAdc, ADC_ResultNumber_1);
    Voltage2[ConversionCount] = ADC_readResult(myAdc, ADC_ResultNumber_2);

    // If 10 conversions have been logged, start over
    if(ConversionCount == 9)
    {
        ConversionCount = 0;
    }
    else ConversionCount++;

    // Clear ADCINT1 flag reinitialize for next SOC
    ADC_clearIntFlag(myAdc, ADC_IntNumber_1);
    // Acknowledge interrupt to PIE
    PIE_clearInt(myPie, PIE_GroupNumber_10);

    return;
}


