//#############################################################################
//
//  File:   f2802x_examples/adc_temp_sensor_conv/Example_F2802xAdc_TempSensorConv.c
//
//  Title:  Example ADC Temperature Sensor Conversion to Degrees Celsius/Degrees Kelvin
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>ADC Temperature Sensor Conversion</h1>
//!
//!    This program shows how to convert a raw ADC temperature sensor reading into
//!    deg. C or deg. K.
//!
//!    Watch Variables
//!    - temp
//!    - degC
//!    - degK
//
//#############################################################################
// $TI Release: F2802x Support Library v222 $
// $Release Date: Thu Jan 15 13:56:57 CST 2015 $
// $Copyright: Copyright (C) 2008-2015 Texas Instruments Incorporated -
//             http://www.ti.com/ ALL RIGHTS RESERVED $
//#############################################################################

#include "DSP28x_Project.h"     // DSP28x Headerfile

#include "f2802x_common/include/adc.h"
#include "f2802x_common/include/clk.h"
#include "f2802x_common/include/flash.h"
#include "f2802x_common/include/gpio.h"
#include "f2802x_common/include/pie.h"
#include "f2802x_common/include/pll.h"
#include "f2802x_common/include/wdog.h"

#define CONV_WAIT 1L //Micro-seconds to wait for ADC conversion. Longer than necessary.

int16_t temp; //raw temperature sensor reading
int16_t degC; //temperature in deg. C
int16_t degK; //temperature in deg. K

CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;

void main()
{
    
    ADC_Handle myAdc;
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

    // Initalize GPIO
    // Enable XCLOCKOUT to allow monitoring of oscillator 1
    GPIO_setMode(myGpio, GPIO_Number_18, GPIO_18_Mode_XCLKOUT);
    CLK_setClkOutPreScaler(myClk, CLK_ClkOutPreScaler_SysClkOut_by_1);


    // Setup a debug vector table and enable the PIE
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);

    // Initialize the ADC
    ADC_enableBandGap(myAdc);
    ADC_enableRefBuffers(myAdc);
    ADC_powerUp(myAdc);
    ADC_enable(myAdc);
    ADC_setVoltRefSrc(myAdc, ADC_VoltageRefSrc_Int);

    ADC_enableTempSensor(myAdc);                                            //Connect channel A5 internally to the temperature sensor
    ADC_setSocChanNumber (myAdc, ADC_SocNumber_0, ADC_SocChanNumber_A5);    //Set SOC0 channel select to ADCINA5
    ADC_setSocChanNumber (myAdc, ADC_SocNumber_1, ADC_SocChanNumber_A5);    //Set SOC1 channel select to ADCINA5
    ADC_setSocSampleWindow(myAdc, ADC_SocNumber_0, ADC_SocSampleWindow_37_cycles);   //Set SOC0 acquisition period to 37 ADCCLK
    ADC_setSocSampleWindow(myAdc, ADC_SocNumber_1, ADC_SocSampleWindow_37_cycles);   //Set SOC1 acquisition period to 37 ADCCLK
    ADC_setIntSrc(myAdc, ADC_IntNumber_1, ADC_IntSrc_EOC1);                 //Connect ADCINT1 to EOC1
    ADC_enableInt(myAdc, ADC_IntNumber_1);                                  //Enable ADCINT1

    // Note: two channels have been connected to the temp sensor
    // so that the first sample can be discarded to avoid the
    // ADC first sample issue.  See the device errata.

    // Set the flash OTP wait-states to minimum. This is important
    // for the performance of the temperature conversion function.
    FLASH_setup(myFlash);
    

    //Main program loop - continually sample temperature
    for(;;)
    {

        //Force start of conversion on SOC0 and SOC1
        ADC_forceConversion(myAdc, ADC_SocNumber_0);
        ADC_forceConversion(myAdc, ADC_SocNumber_1);

        //Wait for end of conversion.
        while(ADC_getIntStatus(myAdc, ADC_IntNumber_1) == 0) {
        }

        // Clear ADCINT1
        ADC_clearIntFlag(myAdc, ADC_IntNumber_1);

        // Get temp sensor sample result from SOC1
        temp = ADC_readResult(myAdc, ADC_ResultNumber_1);

        // Convert the raw temperature sensor measurement into temperature
        degC = ADC_getTemperatureC(myAdc, temp);
        degK = ADC_getTemperatureK(myAdc, temp);
    }
}



