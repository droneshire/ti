//#############################################################################
//
//  File:   f2802x_examples/adc_temp_sensor/Example_F2802xAdcTempSensor.c
//
//  Title:  F2802x ADC Temperatrue Sensor Example Program.
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>ADC Temperatrue Sensor</h1>
//!
//!  Interrupts are enabled and the ePWM1 is set up to generate a periodic
//!  ADC SOC interrupt - ADCINT1. One channel is converted -  ADCINA5, which is internally
//!    connected to the temperature sensor.
//!
//!  Watch Variables:
//!
//!  - TempSensorVoltage[10] Last 10 ADCRESULT0 values
//!  - ConversionCount  Current result number 0-9
//!  - LoopCount        Idle loop counter
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
#include "f2802x_common/include/wdog.h"

// Prototype statements for functions found within this file.
__interrupt void adc_isr(void);

// Global variables used in this example:
uint16_t LoopCount;
uint16_t ConversionCount;
uint16_t TempSensorVoltage[10];

ADC_Handle myAdc;
CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;
PWM_Handle myPwm;

void main()
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

    // Initialize the PIE vector table with pointers to the shell Interrupt
    // Service Routines (ISR).
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);

    // Register interrupt handlers in the PIE vector table
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_10, PIE_SubGroupNumber_1, (intVec_t)&adc_isr);


    //Initialize the ADC:
    ADC_enableBandGap(myAdc);
    ADC_enableRefBuffers(myAdc);
    ADC_powerUp(myAdc);
    ADC_enable(myAdc);
    ADC_setVoltRefSrc(myAdc, ADC_VoltageRefSrc_Int);


    ADC_enableTempSensor(myAdc); 


    ADC_setIntPulseGenMode(myAdc, ADC_IntPulseGenMode_Prior);
    ADC_enableInt(myAdc, ADC_IntNumber_1);
    ADC_setIntMode(myAdc, ADC_IntNumber_1, ADC_IntMode_ClearFlag);
    ADC_setIntSrc(myAdc, ADC_IntNumber_1, ADC_IntSrc_EOC1);
    ADC_setSocChanNumber (myAdc, ADC_SocNumber_0, ADC_SocChanNumber_A5);  
    ADC_setSocChanNumber (myAdc, ADC_SocNumber_1, ADC_SocChanNumber_A5);  
    ADC_setSocTrigSrc(myAdc, ADC_SocNumber_0, ADC_SocTrigSrc_EPWM1_ADCSOCA);
    ADC_setSocTrigSrc(myAdc, ADC_SocNumber_1, ADC_SocTrigSrc_EPWM1_ADCSOCA);
    ADC_setSocSampleWindow(myAdc, ADC_SocNumber_0, ADC_SocSampleWindow_7_cycles);
    ADC_setSocSampleWindow(myAdc, ADC_SocNumber_1, ADC_SocSampleWindow_7_cycles);



    PIE_enableAdcInt(myPie, ADC_IntNumber_1);
    CPU_enableInt(myCpu, CPU_IntNumber_10);
    CPU_enableGlobalInts(myCpu);
    CPU_enableDebugInt(myCpu);

    LoopCount = 0;
    ConversionCount = 0;


    CLK_enablePwmClock(myClk, PWM_Number_1);

    PWM_enableSocAPulse(myPwm);
    PWM_setSocAPulseSrc(myPwm, PWM_SocPulseSrc_CounterEqualCmpAIncr);
    PWM_setSocAPeriod(myPwm, PWM_SocPeriod_FirstEvent);
    ((PWM_Obj *)myPwm)->CMPA = 0x0080;
    PWM_setPeriod(myPwm, 0xFFFF);
    PWM_setCounterMode(myPwm, PWM_CounterMode_Up);

    CLK_enableTbClockSync(myClk);

// Wait for ADC interrupt
    for(;;)
    {
      LoopCount++;
    }

}


__interrupt void  adc_isr(void)
{

    TempSensorVoltage[ConversionCount] = ADC_readResult(myAdc, ADC_ResultNumber_1);
    
    // If 20 conversions have been logged, start over
    if(ConversionCount == 9)
    {
     ConversionCount = 0;
    }
    else ConversionCount++;

    ADC_clearIntFlag(myAdc, ADC_IntNumber_1);
    PIE_clearInt(myPie, PIE_GroupNumber_10);

    return;
}


