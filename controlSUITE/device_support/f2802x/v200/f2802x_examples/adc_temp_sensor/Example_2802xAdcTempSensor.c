//#############################################################################
//
//  File:   f2802x_examples_ccsv4/adc_temp_sensor/Example_F2802xAdcTempSensor.c
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
    
// Step 1. Initialize System Control:
// PLL, WatchDog, enable Peripheral Clocks
// This example function is found in the F2802x_SysCtrl.c file.
//   InitSysCtrl();

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

// Step 2. Initialize GPIO:
// This example function is found in the F2802x_Gpio.c file and
// illustrates how to set the GPIO to it's default state.
// InitGpio();  // Skipped for this example

// Step 3. Clear all interrupts and initialize PIE vector table:
// Disable CPU interrupts
//   DINT;

// Initialize the PIE control registers to their default state.
// The default state is all PIE interrupts disabled and flags
// are cleared.
// This function is found in the F2802x_PieCtrl.c file.
//   InitPieCtrl();

// Disable CPU interrupts and clear all CPU interrupt flags:
//   IER = 0x0000;
//   IFR = 0x0000;

// Initialize the PIE vector table with pointers to the shell Interrupt
// Service Routines (ISR).
// This will populate the entire table, even if the interrupt
// is not used in this example.  This is useful for debug purposes.
// The shell ISR routines are found in F2802x_DefaultIsr.c.
// This function is found in F2802x_PieVect.c.
//   InitPieVectTable();
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);

// Interrupts that are used in this example are re-mapped to
// ISR functions found within this file.
    EALLOW;  // This is needed to write to EALLOW protected register
//   PieVectTable.ADCINT1 = &adc_isr;
    ((PIE_Obj *)myPie)->ADCINT1 = &adc_isr;
    EDIS;    // This is needed to disable write to EALLOW protected registers

// Step 4. Initialize the ADC:
// This function is found in F2802x_Adc.c
//   InitAdc();  // For this example, init the ADC
    ADC_enableBandGap(myAdc);
    ADC_enableRefBuffers(myAdc);
    ADC_powerUp(myAdc);
    ADC_enable(myAdc);
    ADC_setVoltRefSrc(myAdc, ADC_VoltageRefSrc_Int);

// Step 5. Configure ADC to sample the temperature sensor on ADCIN5:
// The output of Piccolo temperature sensor can be internally connected to the ADC through ADCINA5
// via the TEMPCONV bit in the ADCCTL1 register. When this bit is set, any voltage applied to the external
// ADCIN5 pin is ignored.
//    EALLOW;
//    AdcRegs.ADCCTL1.bit.TEMPCONV     = 1;    //Connect internal temp sensor to channel ADCINA5.
    ADC_enableTempSensor(myAdc); 
//    EDIS;

// Step 6. Continue configuring ADC to sample the temperature sensor on ADCIN5:
// Since the temperature sensor is connected to ADCIN5, configure the ADC to sample channel ADCIN5
// as well as the ADC SOC trigger and ADCINTs preferred. This example uses EPWM1A to trigger the ADC
// to start a conversion and trips ADCINT1 at the end of the conversion.

//Note: The temperature sensor will be double sampled to apply the workaround for rev0 silicon errata for the ADC 1st sample issue
//    EALLOW;
//    AdcRegs.ADCCTL1.bit.INTPULSEPOS    = 1;    //ADCINT1 trips after AdcResults latch
    ADC_setIntPulseGenMode(myAdc, ADC_IntPulseGenMode_Prior);
//    AdcRegs.INTSEL1N2.bit.INT1E     = 1;    //Enabled ADCINT1
    ADC_enableInt(myAdc, ADC_IntNumber_1);
//    AdcRegs.INTSEL1N2.bit.INT1CONT  = 0;    //Disable ADCINT1 Continuous mode
    ADC_setIntMode(myAdc, ADC_IntNumber_1, ADC_IntMode_ClearFlag);
//    AdcRegs.INTSEL1N2.bit.INT1SEL    = 1;    //setup EOC1 to trigger ADCINT1 to fire
    ADC_setIntSrc(myAdc, ADC_IntNumber_1, ADC_IntSrc_EOC1);
//    AdcRegs.ADCSOC0CTL.bit.CHSEL     = 5;    //set SOC0 channel select to ADCINA5 (which is internally connected to the temperature sensor)
    ADC_setSocChanNumber (myAdc, ADC_SocNumber_0, ADC_SocChanNumber_A5);  
//    AdcRegs.ADCSOC1CTL.bit.CHSEL     = 5;    //set SOC1 channel select to ADCINA5 (which is internally connected to the temperature sensor)  errata workaround
    ADC_setSocChanNumber (myAdc, ADC_SocNumber_1, ADC_SocChanNumber_A5);  
//    AdcRegs.ADCSOC0CTL.bit.TRIGSEL     = 5;    //set SOC0 start trigger on EPWM1A
    ADC_setSocTrigSrc(myAdc, ADC_SocNumber_0, ADC_SocTrigSrc_EPWM1_ADCSOCA);
//    AdcRegs.ADCSOC1CTL.bit.TRIGSEL     = 5;    //set SOC1 start trigger on EPWM1A errata workaround
    ADC_setSocTrigSrc(myAdc, ADC_SocNumber_1, ADC_SocTrigSrc_EPWM1_ADCSOCA);
//    AdcRegs.ADCSOC0CTL.bit.ACQPS     = 6;    //set SOC0 S/H Window to 7 ADC Clock Cycles, (6 ACQPS plus 1)
    ADC_setSocSampleWindow(myAdc, ADC_SocNumber_0, ADC_SocSampleWindow_7_cycles);
//    AdcRegs.ADCSOC1CTL.bit.ACQPS     = 6;    //set SOC1 S/H Window to 7 ADC Clock Cycles, (6 ACQPS plus 1) errata workaround
    ADC_setSocSampleWindow(myAdc, ADC_SocNumber_1, ADC_SocSampleWindow_7_cycles);
//    EDIS;


// Step 7. User specific code, enable interrupts:

// Enable ADCINT1 in PIE
//   PieCtrlRegs.PIEIER1.bit.INTx1 = 1;    // Enable INT 1.1 in the PIE
    PIE_enableAdcInt(myPie, ADC_IntNumber_1);
//    IER |= M_INT1;                         // Enable CPU Interrupt 1
    CPU_enableInt(myCpu, CPU_IntNumber_10);
//    EINT;                                  // Enable Global interrupt INTM
    CPU_enableGlobalInts(myCpu);
//    ERTM;                                  // Enable Global realtime interrupt DBGM
    CPU_enableDebugInt(myCpu);

    LoopCount = 0;
    ConversionCount = 0;


// Assumes ePWM1 clock is already enabled in InitSysCtrl();
//   EPwm1Regs.ETSEL.bit.SOCAEN    = 1;        // Enable SOC on A group
    PWM_enableSocAPulse(myPwm);
//   EPwm1Regs.ETSEL.bit.SOCASEL    = 4;        // Select SOC from from CPMA on upcount
    PWM_setSocAPulseSrc(myPwm, PWM_SocPulseSrc_CounterEqualCmpAIncr);
//   EPwm1Regs.ETPS.bit.SOCAPRD     = 1;        // Generate pulse on 1st event
    PWM_setSocAPeriod(myPwm, PWM_SocPeriod_FirstEvent);
//   EPwm1Regs.CMPA               = 0x0080;    // Set compare A value
    ((PWM_Obj *)myPwm)->CMPA = 0x0080;
//   EPwm1Regs.TBPRD                 = 0xFFFF;    // Set period for ePWM1
    PWM_setPeriod(myPwm, 0xFFFF);
//   EPwm1Regs.TBCTL.bit.CTRMODE     = 0;        // count up and start
    PWM_setCounterMode(myPwm, PWM_CounterMode_Up);

// Wait for ADC interrupt
    for(;;)
    {
      LoopCount++;
    }

}


interrupt void  adc_isr(void)
{

//    TempSensorVoltage[ConversionCount] = AdcResult.ADCRESULT1;  //discard ADCRESULT0 as part of the workaround to the 1st sample errata for rev0
    TempSensorVoltage[ConversionCount] = ADC_readResult(myAdc, ADC_ResultNumber_1);
    
    // If 20 conversions have been logged, start over
    if(ConversionCount == 9)
    {
     ConversionCount = 0;
    }
    else ConversionCount++;

//  AdcRegs.ADCINTFLGCLR.bit.ADCINT1 = 1;        //Clear ADCINT1 flag reinitialize for next SOC
    ADC_clearIntFlag(myAdc, ADC_IntNumber_1);
//  PieCtrlRegs.PIEACK.all = PIEACK_GROUP1;   // Acknowledge interrupt to PIE
    PIE_clearInt(myPie, PIE_GroupNumber_10);

    return;
}


