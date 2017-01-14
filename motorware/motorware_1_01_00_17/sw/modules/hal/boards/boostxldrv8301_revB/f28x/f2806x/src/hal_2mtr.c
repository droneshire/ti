/* --COPYRIGHT--,BSD
 * Copyright (c) 2012, Texas Instruments Incorporated
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * *  Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * *  Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * *  Neither the name of Texas Instruments Incorporated nor the names of
 *    its contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * --/COPYRIGHT--*/
//! \file   solutions/instaspin_foc/boards/drv8301kit_revD/f28x/f2806xF/src/hal.c
//! \brief Contains the various functions related to the HAL object (everything outside the CTRL system) 
//!
//! (C) Copyright 2011, Texas Instruments, Inc.


// **************************************************************************
// the includes

// drivers

// modules

// platforms
#include "hal_2mtr.h"
#include "hal_obj_2mtr.h"
#include "user1.h"
#include "user2.h"


#ifdef FLASH
#pragma CODE_SECTION(HAL_setupFlash,"ramfuncs");
#endif

// **************************************************************************
// the defines


// **************************************************************************
// the globals

//HAL_Obj hal;


// **************************************************************************
// the functions

void HAL_cal(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  // enable the ADC clock
  CLK_enableAdcClock(obj->clkHandle);


  // Run the Device_cal() function
  // This function copies the ADC and oscillator calibration values from TI reserved
  // OTP into the appropriate trim registers
  // This boot ROM automatically calls this function to calibrate the interal 
  // oscillators and ADC with device specific calibration data.
  // If the boot ROM is bypassed by Code Composer Studio during the development process,
  // then the calibration must be initialized by the application
  ENABLE_PROTECTED_REGISTER_WRITE_MODE;
  (*Device_cal)();
  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  // run offsets calibration in user's memory
  HAL_AdcOffsetSelfCal(handle);

  // run oscillator compensation
  HAL_OscTempComp(handle);

  // disable the ADC clock
  CLK_disableAdcClock(obj->clkHandle);

  return;
} // end of HAL_cal() function


void HAL_OscTempComp(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;
  uint16_t Temperature;

  // disable the ADCs
  ADC_disable(obj->adcHandle);

  // power up the bandgap circuit
  ADC_enableBandGap(obj->adcHandle);

  // set the ADC voltage reference source to internal
  ADC_setVoltRefSrc(obj->adcHandle,ADC_VoltageRefSrc_Int);

  // enable the ADC reference buffers
  ADC_enableRefBuffers(obj->adcHandle);

  // Set main clock scaling factor (max45MHz clock for the ADC module)
  ADC_setDivideSelect(obj->adcHandle,ADC_DivideSelect_ClkIn_by_2);

  // power up the ADCs
  ADC_powerUp(obj->adcHandle);

  // enable the ADCs
  ADC_enable(obj->adcHandle);

  // enable non-overlap mode
  ADC_enableNoOverlapMode(obj->adcHandle);

  // connect channel A5 internally to the temperature sensor
  ADC_setTempSensorSrc(obj->adcHandle, ADC_TempSensorSrc_Int);

  // set SOC0 channel select to ADCINA5
  ADC_setSocChanNumber(obj->adcHandle, ADC_SocNumber_0, ADC_SocChanNumber_A5);

  // set SOC0 acquisition period to 26 ADCCLK
  ADC_setSocSampleDelay(obj->adcHandle, ADC_SocNumber_0, ADC_SocSampleDelay_64_cycles);

  // connect ADCINT1 to EOC0
  ADC_setIntSrc(obj->adcHandle, ADC_IntNumber_1, ADC_IntSrc_EOC0);

  // clear ADCINT1 flag
  ADC_clearIntFlag(obj->adcHandle, ADC_IntNumber_1);

  // enable ADCINT1
  ADC_enableInt(obj->adcHandle, ADC_IntNumber_1);

  // force start of conversion on SOC0
  ADC_setSocFrc(obj->adcHandle, ADC_SocFrc_0);

  // wait for end of conversion
  while (ADC_getIntFlag(obj->adcHandle, ADC_IntNumber_1) == 0){}

  // clear ADCINT1 flag
  ADC_clearIntFlag(obj->adcHandle, ADC_IntNumber_1);

  Temperature = ADC_readResult(obj->adcHandle, ADC_ResultNumber_0);

  HAL_osc1Comp(handle, Temperature);

  HAL_osc2Comp(handle, Temperature);

  return;
} // end of HAL_OscTempComp() function


void HAL_osc1Comp(HAL_Handle handle, const int16_t sensorSample)
{
	int16_t compOscFineTrim;
	HAL_Obj *obj = (HAL_Obj *)handle;

	ENABLE_PROTECTED_REGISTER_WRITE_MODE;

    compOscFineTrim = ((sensorSample - getRefTempOffset())*(int32_t)getOsc1FineTrimSlope()
                      + OSC_POSTRIM_OFF + FP_ROUND )/FP_SCALE + getOsc1FineTrimOffset() - OSC_POSTRIM;

    if(compOscFineTrim > 31)
      {
        compOscFineTrim = 31;
      }
	else if(compOscFineTrim < -31)
      {
        compOscFineTrim = -31;
      }

    OSC_setTrim(obj->oscHandle, OSC_Number_1, HAL_getOscTrimValue(getOsc1CoarseTrim(), compOscFineTrim));

    DISABLE_PROTECTED_REGISTER_WRITE_MODE;

    return;
} // end of HAL_osc1Comp() function


void HAL_osc2Comp(HAL_Handle handle, const int16_t sensorSample)
{
	int16_t compOscFineTrim;
	HAL_Obj *obj = (HAL_Obj *)handle;

	ENABLE_PROTECTED_REGISTER_WRITE_MODE;

    compOscFineTrim = ((sensorSample - getRefTempOffset())*(int32_t)getOsc2FineTrimSlope()
                      + OSC_POSTRIM_OFF + FP_ROUND )/FP_SCALE + getOsc2FineTrimOffset() - OSC_POSTRIM;

    if(compOscFineTrim > 31)
      {
        compOscFineTrim = 31;
      }
	else if(compOscFineTrim < -31)
      {
        compOscFineTrim = -31;
      }

    OSC_setTrim(obj->oscHandle, OSC_Number_2, HAL_getOscTrimValue(getOsc2CoarseTrim(), compOscFineTrim));

    DISABLE_PROTECTED_REGISTER_WRITE_MODE;

    return;
} // end of HAL_osc2Comp() function


uint16_t HAL_getOscTrimValue(int16_t coarse, int16_t fine)
{
  uint16_t regValue = 0;

  if(fine < 0)
    {
      regValue = ((-fine) | 0x20) << 9;
    }
  else
    {
      regValue = fine << 9;
    }

  if(coarse < 0)
    {
      regValue |= ((-coarse) | 0x80);
    }
  else
    {
      regValue |= coarse;
    }

  return regValue;
} // end of HAL_getOscTrimValue() function


void HAL_AdcOffsetSelfCal(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;
  uint16_t AdcConvMean;

  // disable the ADCs
  ADC_disable(obj->adcHandle);

  // power up the bandgap circuit
  ADC_enableBandGap(obj->adcHandle);

  // set the ADC voltage reference source to internal
  ADC_setVoltRefSrc(obj->adcHandle,ADC_VoltageRefSrc_Int);

  // enable the ADC reference buffers
  ADC_enableRefBuffers(obj->adcHandle);

  // Set main clock scaling factor (max45MHz clock for the ADC module)
  ADC_setDivideSelect(obj->adcHandle,ADC_DivideSelect_ClkIn_by_2);

  // power up the ADCs
  ADC_powerUp(obj->adcHandle);

  // enable the ADCs
  ADC_enable(obj->adcHandle);

  //Select VREFLO internal connection on B5
  ADC_enableVoltRefLoConv(obj->adcHandle);

  //Select channel B5 for all SOC
  HAL_AdcCalChanSelect(handle, ADC_SocChanNumber_B5);

  //Apply artificial offset (+80) to account for a negative offset that may reside in the ADC core
  ADC_setOffTrim(obj->adcHandle, 80);

  //Capture ADC conversion on VREFLO
  AdcConvMean = HAL_AdcCalConversion(handle);

  //Set offtrim register with new value (i.e remove artical offset (+80) and create a two's compliment of the offset error)
  ADC_setOffTrim(obj->adcHandle, 80 - AdcConvMean);

  //Select external ADCIN5 input pin on B5
  ADC_disableVoltRefLoConv(obj->adcHandle);

  return;
} // end of HAL_AdcOffsetSelfCal() function


void HAL_AdcCalChanSelect(HAL_Handle handle, const ADC_SocChanNumber_e chanNumber)
{
  HAL_Obj *obj = (HAL_Obj *)handle;

  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_0,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_1,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_2,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_3,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_4,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_5,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_6,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_7,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_8,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_9,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_10,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_11,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_12,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_13,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_14,chanNumber);
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_15,chanNumber);

  return;
} // end of HAL_AdcCalChanSelect() function


uint16_t HAL_AdcCalConversion(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;
  uint16_t index, SampleSize, Mean;
  uint32_t Sum;
  ADC_SocSampleDelay_e ACQPS_Value;

  index       = 0;     //initialize index to 0
  SampleSize  = 256;   //set sample size to 256 (**NOTE: Sample size must be multiples of 2^x where is an integer >= 4)
  Sum         = 0;     //set sum to 0
  Mean        = 999;   //initialize mean to known value

  //Set the ADC sample window to the desired value (Sample window = ACQPS + 1)
  ACQPS_Value = ADC_SocSampleDelay_7_cycles;

  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_0,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_1,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_2,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_3,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_4,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_5,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_6,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_7,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_8,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_9,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_10,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_11,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_12,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_13,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_14,ACQPS_Value);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_15,ACQPS_Value);

  // Enabled ADCINT1 and ADCINT2
  ADC_enableInt(obj->adcHandle, ADC_IntNumber_1);
  ADC_enableInt(obj->adcHandle, ADC_IntNumber_2);

  // Disable continuous sampling for ADCINT1 and ADCINT2
  ADC_setIntMode(obj->adcHandle, ADC_IntNumber_1, ADC_IntMode_EOC);
  ADC_setIntMode(obj->adcHandle, ADC_IntNumber_2, ADC_IntMode_EOC);

  //ADCINTs trigger at end of conversion
  ADC_setIntPulseGenMode(obj->adcHandle, ADC_IntPulseGenMode_Prior);

  // Setup ADCINT1 and ADCINT2 trigger source
  ADC_setIntSrc(obj->adcHandle, ADC_IntNumber_1, ADC_IntSrc_EOC6);
  ADC_setIntSrc(obj->adcHandle, ADC_IntNumber_2, ADC_IntSrc_EOC14);

  // Setup each SOC's ADCINT trigger source
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_0, ADC_Int2TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_1, ADC_Int2TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_2, ADC_Int2TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_3, ADC_Int2TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_4, ADC_Int2TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_5, ADC_Int2TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_6, ADC_Int2TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_7, ADC_Int2TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_8, ADC_Int1TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_9, ADC_Int1TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_10, ADC_Int1TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_11, ADC_Int1TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_12, ADC_Int1TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_13, ADC_Int1TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_14, ADC_Int1TriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_15, ADC_Int1TriggersSOC);

  // Delay before converting ADC channels
  usDelay(ADC_DELAY_usec);

  ADC_setSocFrcWord(obj->adcHandle, 0x00FF);

  while( index < SampleSize )
    {
      //Wait for ADCINT1 to trigger, then add ADCRESULT0-7 registers to sum
      while (ADC_getIntFlag(obj->adcHandle, ADC_IntNumber_1) == 0){}

      //Must clear ADCINT1 flag since INT1CONT = 0
      ADC_clearIntFlag(obj->adcHandle, ADC_IntNumber_1);

      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_0);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_1);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_2);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_3);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_4);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_5);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_6);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_7);

      //Wait for ADCINT2 to trigger, then add ADCRESULT8-15 registers to sum
      while (ADC_getIntFlag(obj->adcHandle, ADC_IntNumber_2) == 0){}

      //Must clear ADCINT2 flag since INT2CONT = 0
      ADC_clearIntFlag(obj->adcHandle, ADC_IntNumber_2);

      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_8);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_9);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_10);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_11);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_12);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_13);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_14);
      Sum += ADC_readResult(obj->adcHandle, ADC_ResultNumber_15);

      index+=16;

  } // end data collection

  //Disable ADCINT1 and ADCINT2 to STOP the ping-pong sampling
  ADC_disableInt(obj->adcHandle, ADC_IntNumber_1);
  ADC_disableInt(obj->adcHandle, ADC_IntNumber_2);

  //Calculate average ADC sample value
  Mean = Sum / SampleSize;

  // Clear start of conversion trigger
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_0, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_1, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_2, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_3, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_4, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_5, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_6, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_7, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_8, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_9, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_10, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_11, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_12, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_13, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_14, ADC_NoIntTriggersSOC);
  ADC_setupSocTrigSrc(obj->adcHandle, ADC_SocNumber_15, ADC_NoIntTriggersSOC);

  //return the average
  return(Mean);
} // end of HAL_AdcCalConversion() function


void HAL_disableWdog(HAL_Handle halHandle)
{
  HAL_Obj *hal = (HAL_Obj *)halHandle;


  WDOG_disable(hal->wdogHandle);


  return;
} // end of HAL_disableWdog() function


void HAL_disableGlobalInts(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  CPU_disableGlobalInts(obj->cpuHandle);

  return;
} // end of HAL_disableGlobalInts() function


void HAL_enableAdcInts(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  // enable the PIE interrupts associated with the ADC interrupts
  PIE_enableAdcInt(obj->pieHandle,ADC_IntNumber_1);
  PIE_enableAdcInt(obj->pieHandle,ADC_IntNumber_2);


  // enable the ADC interrupts
  ADC_enableInt(obj->adcHandle,ADC_IntNumber_1);
  ADC_enableInt(obj->adcHandle,ADC_IntNumber_2);


  // enable the cpu interrupt for ADC interrupts
  CPU_enableInt(obj->cpuHandle,CPU_IntNumber_10);

  return;
} // end of HAL_enableAdcInts() function


void HAL_enableDebugInt(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  CPU_enableDebugInt(obj->cpuHandle);

  return;
} // end of HAL_enableDebugInt() function


void HAL_enableDrv(HAL_Handle_mtr handle)
{
  HAL_Obj_mtr *obj = (HAL_Obj_mtr *)handle;

  DRV8301_enable(obj->drv8301Handle);

  return;
}  // end of HAL_enableDrv() function


void HAL_enableGlobalInts(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  CPU_enableGlobalInts(obj->cpuHandle);

  return;
} // end of HAL_enableGlobalInts() function


void HAL_enablePwmInt(HAL_Handle_mtr handleMtr,HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;
  HAL_Obj_mtr *objMtr = (HAL_Obj_mtr *)handleMtr;
  HAL_MtrSelect_e mtrNum = objMtr->mtrNum;

  if(mtrNum == HAL_MTR1)
  {
    PIE_enablePwmInt(obj->pieHandle,PWM_Number_4);
  }
  else if(mtrNum == HAL_MTR2)
  {
    PIE_enablePwmInt(obj->pieHandle,PWM_Number_1);
  }


  // enable the interrupt
  PWM_enableInt(objMtr->pwmHandle[0]);


  // enable the cpu interrupt for EPWMx_INT
  CPU_enableInt(obj->cpuHandle,CPU_IntNumber_3);

  return;
} // end of HAL_enablePwmInt() function


void HAL_enableTimer0Int(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  PIE_enableTimer0Int(obj->pieHandle);


  // enable the interrupt
  TIMER_enableInt(obj->timerHandle[0]);


  // enable the cpu interrupt for TINT0
  CPU_enableInt(obj->cpuHandle,CPU_IntNumber_1);

  return;
} // end of HAL_enablePwmInt() function


void HAL_setupFaults(HAL_Handle_mtr handle)
{
  HAL_Obj_mtr *obj = (HAL_Obj_mtr *)handle;
  uint_least8_t cnt;


  // Configure Trip Mechanism for the Motor control software
  // -Cycle by cycle trip on CPU halt
  // -One shot fault trip zone
  // These trips need to be repeated for EPWM1 ,2 & 3
  for(cnt=0;cnt<3;cnt++)
    {
      PWM_enableTripZoneSrc(obj->pwmHandle[cnt],PWM_TripZoneSrc_CycleByCycle_TZ6_NOT);

      PWM_enableTripZoneSrc(obj->pwmHandle[cnt],PWM_TripZoneSrc_CycleByCycle_TZ3_NOT);

      PWM_enableTripZoneSrc(obj->pwmHandle[cnt],PWM_TripZoneSrc_CycleByCycle_TZ2_NOT);

      // What do we want the OST/CBC events to do?
      // TZA events can force EPWMxA
      // TZB events can force EPWMxB

      PWM_setTripZoneState_TZA(obj->pwmHandle[cnt],PWM_TripZoneState_EPWM_Low);
      PWM_setTripZoneState_TZB(obj->pwmHandle[cnt],PWM_TripZoneState_EPWM_Low);
    }

  return;
} // end of HAL_setupFaults() function


HAL_Handle HAL_init(void *pMemory,const size_t numBytes)
{
  HAL_Handle handle;
  HAL_Obj *obj;


  if(numBytes < sizeof(HAL_Obj))
    return((HAL_Handle)NULL);


  // assign the handle
  handle = (HAL_Handle)pMemory;


  // assign the object
  obj = (HAL_Obj *)handle;


  // initialize the watchdog driver
  obj->wdogHandle = WDOG_init((void *)WDOG_BASE_ADDR,sizeof(WDOG_Obj));


  // disable watchdog
  HAL_disableWdog(handle);


  // initialize the ADC
  obj->adcHandle = ADC_init((void *)ADC_BASE_ADDR,sizeof(ADC_Obj));


  // initialize the clock handle
  obj->clkHandle = CLK_init((void *)CLK_BASE_ADDR,sizeof(CLK_Obj));


  // initialize the CPU handle
  obj->cpuHandle = CPU_init(&cpu,sizeof(cpu));


  // initialize the FLASH handle
  obj->flashHandle = FLASH_init((void *)FLASH_BASE_ADDR,sizeof(FLASH_Obj));


  // initialize the GPIO handle
  obj->gpioHandle = GPIO_init((void *)GPIO_BASE_ADDR,sizeof(GPIO_Obj));


  // initialize the oscillator handle
  obj->oscHandle = OSC_init((void *)OSC_BASE_ADDR,sizeof(OSC_Obj));


  // initialize the PIE handle
  obj->pieHandle = PIE_init((void *)PIE_BASE_ADDR,sizeof(PIE_Obj));


  // initialize the PLL handle
  obj->pllHandle = PLL_init((void *)PLL_BASE_ADDR,sizeof(PLL_Obj));


  // initialize the SPI handles
  obj->spiAHandle = SPI_init((void *)SPIA_BASE_ADDR,sizeof(SPI_Obj));
  obj->spiBHandle = SPI_init((void *)SPIB_BASE_ADDR,sizeof(SPI_Obj));


  // initialize PWM DAC handles
  obj->pwmDacHandle[0] = PWMDAC_init((void *)PWM_ePWM7_BASE_ADDR,sizeof(PWM_Obj));
  obj->pwmDacHandle[1] = PWMDAC_init((void *)PWM_ePWM8_BASE_ADDR,sizeof(PWM_Obj));


  // initialize power handle
  obj->pwrHandle = PWR_init((void *)PWR_BASE_ADDR,sizeof(PWR_Obj));


  // initialize timer handles
  obj->timerHandle[0] = TIMER_init((void *)TIMER0_BASE_ADDR,sizeof(TIMER_Obj));
  obj->timerHandle[1] = TIMER_init((void *)TIMER1_BASE_ADDR,sizeof(TIMER_Obj));
  obj->timerHandle[2] = TIMER_init((void *)TIMER2_BASE_ADDR,sizeof(TIMER_Obj));


  return(handle);
} // end of HAL_init() function


HAL_Handle_mtr HAL_init_mtr(void *pMemory,const size_t numBytes,const HAL_MtrSelect_e mtrNum)
{
  HAL_Handle_mtr handle;
  HAL_Obj_mtr *obj;

  if(numBytes < sizeof(HAL_Obj_mtr))
    return((HAL_Handle_mtr)NULL);

  // assign the handle
  handle = (HAL_Handle_mtr)pMemory;

  // point to the object
  obj = (HAL_Obj_mtr *)handle;

  HAL_setMotorNumber(handle,mtrNum);

  // initialize PWM handles
  if(mtrNum == HAL_MTR1)
  {
    obj->pwmHandle[0] = PWM_init((void *)PWM_ePWM1_BASE_ADDR,sizeof(PWM_Obj));
    obj->pwmHandle[1] = PWM_init((void *)PWM_ePWM2_BASE_ADDR,sizeof(PWM_Obj));
    obj->pwmHandle[2] = PWM_init((void *)PWM_ePWM3_BASE_ADDR,sizeof(PWM_Obj));
  }
  else if(mtrNum == HAL_MTR2)
  {
    obj->pwmHandle[0] = PWM_init((void *)PWM_ePWM4_BASE_ADDR,sizeof(PWM_Obj));
    obj->pwmHandle[1] = PWM_init((void *)PWM_ePWM5_BASE_ADDR,sizeof(PWM_Obj));
    obj->pwmHandle[2] = PWM_init((void *)PWM_ePWM6_BASE_ADDR,sizeof(PWM_Obj));
  }
  else
  {
    obj->pwmHandle[0] = NULL;
    obj->pwmHandle[1] = NULL;
    obj->pwmHandle[2] = NULL;
  }

  // initialize drv8301 interface
  obj->drv8301Handle = DRV8301_init(&obj->drv8301,sizeof(obj->drv8301));

  // initialize QEP driver
#ifdef QEP
  if(mtrNum == HAL_MTR1)
  {
    obj->qepHandle = QEP_init((void*)QEP1_BASE_ADDR,sizeof(QEP_Obj));
  }
  else if(mtrNum == HAL_MTR2)
  {
    obj->qepHandle = QEP_init((void*)QEP2_BASE_ADDR,sizeof(QEP_Obj));
  }
  else
  {
	  obj->qepHandle = NULL;
  }
#endif

  return(handle);
}

void HAL_setParams(HAL_Handle handle,const USER_Params *pUserParams)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  // disable global interrupts
  CPU_disableGlobalInts(obj->cpuHandle);


  // disable cpu interrupts
  CPU_disableInts(obj->cpuHandle);


  // clear cpu interrupt flags
  CPU_clearIntFlags(obj->cpuHandle);


  // setup the clocks
  HAL_setupClks(handle);


  // Setup the PLL
  HAL_setupPll(handle,PLL_ClkFreq_90_MHz);


  // setup the PIE
  HAL_setupPie(handle);


  // run the device calibration
  HAL_cal(handle);


  // setup the peripheral clocks
  HAL_setupPeripheralClks(handle);


  // setup the GPIOs
  HAL_setupGpios(handle);


  // setup the flash
  HAL_setupFlash(handle);


  // setup the ADCs
  HAL_setupAdcs(handle);


  // setup the spiA
  HAL_setupSpiA(handle);


  // setup the spiB
  HAL_setupSpiB(handle);


  // setup the PWM DACs
  HAL_setupPwmDacs(handle);


  // setup the timers
  HAL_setupTimers(handle,
                  (float_t)pUserParams->systemFreq_MHz);


 return;
} // end of HAL_setParams() function


void HAL_setParamsMtr(HAL_Handle_mtr handleMtr,HAL_Handle handle,const USER_Params *pUserParams)
{
  HAL_Obj_mtr *objMtr = (HAL_Obj_mtr *)handleMtr;
  HAL_Obj *obj = (HAL_Obj *)handle;


  // setup the PWMs
  HAL_setupPwms(handleMtr,handle,pUserParams);


  // setup the drv8301 interface
  if(objMtr->mtrNum == HAL_MTR1)
  {
    DRV8301_setGpioHandle(objMtr->drv8301Handle,obj->gpioHandle);
    DRV8301_setSpiHandle(objMtr->drv8301Handle,obj->spiAHandle);
    DRV8301_setGpioNumber(objMtr->drv8301Handle,GPIO_Number_50);
  }
  else if(objMtr->mtrNum == HAL_MTR2)
  {
    DRV8301_setGpioHandle(objMtr->drv8301Handle,obj->gpioHandle);
    DRV8301_setSpiHandle(objMtr->drv8301Handle,obj->spiBHandle);
    DRV8301_setGpioNumber(objMtr->drv8301Handle,GPIO_Number_52);
  }

  //  set the current scale factor
 {
   _iq current_sf = _IQ(pUserParams->current_sf);

  HAL_setCurrentScaleFactor(handleMtr,current_sf);
 }


  //  set the voltage scale factor
 {
   _iq voltage_sf = _IQ(pUserParams->voltage_sf);

  HAL_setVoltageScaleFactor(handleMtr,voltage_sf);
 }


#ifdef QEP
  // setup the QEP
  if(objMtr->mtrNum == HAL_MTR1)
  {
    HAL_setupQEP(handleMtr, USER_MOTOR_ENCODER_LINES);
  }
  else if(objMtr->mtrNum == HAL_MTR2)
  {
    HAL_setupQEP(handleMtr, USER_MOTOR_ENCODER_LINES_2);
  }
#endif


  return;
}// end of HAL_setParamsMtr() function


void HAL_setupAdcs(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  // disable the ADCs
  ADC_disable(obj->adcHandle);


  // power up the bandgap circuit
  ADC_enableBandGap(obj->adcHandle);


  // set the ADC voltage reference source to internal 
  ADC_setVoltRefSrc(obj->adcHandle,ADC_VoltageRefSrc_Int);


  // enable the ADC reference buffers
  ADC_enableRefBuffers(obj->adcHandle);


  // Set main clock scaling factor (max45MHz clock for the ADC module)
  ADC_setDivideSelect(obj->adcHandle,ADC_DivideSelect_ClkIn_by_2);


  // power up the ADCs
  ADC_powerUp(obj->adcHandle);


  // enable the ADCs
  ADC_enable(obj->adcHandle);


  // set the ADC interrupt pulse generation to prior
  ADC_setIntPulseGenMode(obj->adcHandle,ADC_IntPulseGenMode_Prior);


  // set the temperature sensor source to external
  ADC_setTempSensorSrc(obj->adcHandle,ADC_TempSensorSrc_Ext);


  // configure the interrupt sources
  ADC_disableInt(obj->adcHandle,ADC_IntNumber_1);
  ADC_setIntMode(obj->adcHandle,ADC_IntNumber_1,ADC_IntMode_ClearFlag);
  ADC_setIntSrc(obj->adcHandle,ADC_IntNumber_1,ADC_IntSrc_EOC7);

  ADC_disableInt(obj->adcHandle,ADC_IntNumber_2);
  ADC_setIntMode(obj->adcHandle,ADC_IntNumber_2,ADC_IntMode_ClearFlag);
  ADC_setIntSrc(obj->adcHandle,ADC_IntNumber_2,ADC_IntSrc_EOC14);



  //configure the SOCs for boostxldrv8301_revB on J1 Connection
  // Begin Motor 1 sampling
  // EXT IA-FB
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_0,ADC_SocChanNumber_A0);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_0,ADC_SocTrigSrc_EPWM1_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_0,ADC_SocSampleDelay_9_cycles);

  // EXT IA-FB
  // Duplicate conversion due to ADC Initial Conversion bug (SPRZ342)
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_1,ADC_SocChanNumber_A0);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_1,ADC_SocTrigSrc_EPWM1_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_1,ADC_SocSampleDelay_9_cycles);

  // EXT IB-FB
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_2,ADC_SocChanNumber_B0);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_2,ADC_SocTrigSrc_EPWM1_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_2,ADC_SocSampleDelay_9_cycles);

  // EXT IC-FB
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_3,ADC_SocChanNumber_A1);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_3,ADC_SocTrigSrc_EPWM1_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_3,ADC_SocSampleDelay_9_cycles);

  // ADC-Vhb1
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_4,ADC_SocChanNumber_B1);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_4,ADC_SocTrigSrc_EPWM1_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_4,ADC_SocSampleDelay_9_cycles);

  // ADC-Vhb2
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_5,ADC_SocChanNumber_A2);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_5,ADC_SocTrigSrc_EPWM1_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_5,ADC_SocSampleDelay_9_cycles);

  // ADC-Vhb3
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_6,ADC_SocChanNumber_B2);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_6,ADC_SocTrigSrc_EPWM1_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_6,ADC_SocSampleDelay_9_cycles);

  // VDCBUS
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_7,ADC_SocChanNumber_A7);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_7,ADC_SocTrigSrc_EPWM1_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_7,ADC_SocSampleDelay_9_cycles);
  // End Motor 1 sampling

  // Begin Motor 2 sampling
  // EXT IA-FB
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_8,ADC_SocChanNumber_A3);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_8,ADC_SocTrigSrc_EPWM4_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_8,ADC_SocSampleDelay_9_cycles);

  // EXT IB-FB
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_9,ADC_SocChanNumber_B3);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_9,ADC_SocTrigSrc_EPWM4_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_9,ADC_SocSampleDelay_9_cycles);

  // EXT IC-FB
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_10,ADC_SocChanNumber_A4);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_10,ADC_SocTrigSrc_EPWM4_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_10,ADC_SocSampleDelay_9_cycles);

  // ADC-Vhb1
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_11,ADC_SocChanNumber_B4);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_11,ADC_SocTrigSrc_EPWM4_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_11,ADC_SocSampleDelay_9_cycles);

  // ADC-Vhb2
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_12,ADC_SocChanNumber_A5);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_12,ADC_SocTrigSrc_EPWM4_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_12,ADC_SocSampleDelay_9_cycles);

  // ADC-Vhb3
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_13,ADC_SocChanNumber_B5);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_13,ADC_SocTrigSrc_EPWM4_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_13,ADC_SocSampleDelay_9_cycles);

  // VDCBUS
  ADC_setSocChanNumber(obj->adcHandle,ADC_SocNumber_14,ADC_SocChanNumber_B7);
  ADC_setSocTrigSrc(obj->adcHandle,ADC_SocNumber_14,ADC_SocTrigSrc_EPWM4_ADCSOCA);
  ADC_setSocSampleDelay(obj->adcHandle,ADC_SocNumber_14,ADC_SocSampleDelay_9_cycles);
  // End Motor 2 sampling


  return;
} // end of HAL_setupAdcs() function


void HAL_setupClks(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  // enable internal oscillator 1
  CLK_enableOsc1(obj->clkHandle);

  // set the oscillator source
  CLK_setOscSrc(obj->clkHandle,CLK_OscSrc_Internal);

  // disable the external clock in
  CLK_disableClkIn(obj->clkHandle);

  // disable the crystal oscillator
  CLK_disableCrystalOsc(obj->clkHandle);

  // disable oscillator 2
  CLK_disableOsc2(obj->clkHandle);

  // set the low speed clock prescaler
  CLK_setLowSpdPreScaler(obj->clkHandle,CLK_LowSpdPreScaler_SysClkOut_by_1);

  // set the clock out prescaler
  CLK_setClkOutPreScaler(obj->clkHandle,CLK_ClkOutPreScaler_SysClkOut_by_1);

  return;
} // end of HAL_setupClks() function


void HAL_setupFlash(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  FLASH_enablePipelineMode(obj->flashHandle);

  FLASH_setNumPagedReadWaitStates(obj->flashHandle,FLASH_NumPagedWaitStates_3);

  FLASH_setNumRandomReadWaitStates(obj->flashHandle,FLASH_NumRandomWaitStates_3);

  FLASH_setOtpWaitStates(obj->flashHandle,FLASH_NumOtpWaitStates_5);

  FLASH_setStandbyWaitCount(obj->flashHandle,FLASH_STANDBY_WAIT_COUNT_DEFAULT);

  FLASH_setActiveWaitCount(obj->flashHandle,FLASH_ACTIVE_WAIT_COUNT_DEFAULT);

  return;
} // HAL_setupFlash() function


void HAL_setupGate(HAL_Handle_mtr handleMtr,SPI_Handle handleSpi,GPIO_Handle handleGpio,const GPIO_Number_e gpio)
{
//  HAL_Obj *obj = (HAL_Obj *)handle;
  HAL_Obj_mtr *objMtr = (HAL_Obj_mtr *)handleMtr;

  
  DRV8301_setGpioHandle(objMtr->drv8301Handle,handleGpio);
  DRV8301_setSpiHandle(objMtr->drv8301Handle,handleSpi);
  DRV8301_setGpioNumber(objMtr->drv8301Handle,gpio);

  return;
} // HAL_setupGate() function


void HAL_setupGpios(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  // PWM1
  GPIO_setMode(obj->gpioHandle,GPIO_Number_0,GPIO_0_Mode_EPWM1A);

  // PWM2
  GPIO_setMode(obj->gpioHandle,GPIO_Number_1,GPIO_1_Mode_EPWM1B);

  // PWM3
  GPIO_setMode(obj->gpioHandle,GPIO_Number_2,GPIO_2_Mode_EPWM2A);

  // PWM4
  GPIO_setMode(obj->gpioHandle,GPIO_Number_3,GPIO_3_Mode_EPWM2B);

  // PWM5
  GPIO_setMode(obj->gpioHandle,GPIO_Number_4,GPIO_4_Mode_EPWM3A);

  // PWM6
  GPIO_setMode(obj->gpioHandle,GPIO_Number_5,GPIO_5_Mode_EPWM3B);

  // PWM4A
  GPIO_setMode(obj->gpioHandle,GPIO_Number_6,GPIO_6_Mode_EPWM4A);

  // PWM4B
  GPIO_setMode(obj->gpioHandle,GPIO_Number_7,GPIO_7_Mode_EPWM4B);

  // PWM5A
  GPIO_setMode(obj->gpioHandle,GPIO_Number_8,GPIO_8_Mode_EPWM5A);

  // PWM5B
  GPIO_setMode(obj->gpioHandle,GPIO_Number_9,GPIO_9_Mode_EPWM5B);

  // PWM6A
  GPIO_setMode(obj->gpioHandle,GPIO_Number_10,GPIO_10_Mode_EPWM6A);

  // PWM6B
  GPIO_setMode(obj->gpioHandle,GPIO_Number_11,GPIO_11_Mode_EPWM6B);

  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_12,GPIO_12_Mode_GeneralPurpose);
  GPIO_setLow(obj->gpioHandle,GPIO_Number_12);
  GPIO_setDirection(obj->gpioHandle,GPIO_Number_12,GPIO_Direction_Output);

  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_13,GPIO_13_Mode_GeneralPurpose);

  // SPIB CLK
  GPIO_setMode(obj->gpioHandle,GPIO_Number_14,GPIO_14_Mode_SPICLKB);

  // UARTB RX
  GPIO_setMode(obj->gpioHandle,GPIO_Number_15,GPIO_15_Mode_SCIRXDB);

  // Set Qualification Period for GPIO16-23, 22*2*(1/90MHz) = 0.48us
  GPIO_setQualificationPeriod(obj->gpioHandle,GPIO_Number_16,22);

  // SPIA SIMO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_16,GPIO_16_Mode_SPISIMOA);

  // SPIA SOMI
  GPIO_setMode(obj->gpioHandle,GPIO_Number_17,GPIO_17_Mode_SPISOMIA);

  // SPIA CLK
  GPIO_setMode(obj->gpioHandle,GPIO_Number_18,GPIO_18_Mode_SPICLKA);

  // SPIA CS
  GPIO_setMode(obj->gpioHandle,GPIO_Number_19,GPIO_19_Mode_SPISTEA_NOT);
  
#ifdef QEP
  // EQEP1A
  GPIO_setMode(obj->gpioHandle,GPIO_Number_20,GPIO_20_Mode_EQEP1A);
  GPIO_setQualification(obj->gpioHandle,GPIO_Number_20,GPIO_Qual_Sample_3);

  // EQEP1B
  GPIO_setMode(obj->gpioHandle,GPIO_Number_21,GPIO_21_Mode_EQEP1B);
  GPIO_setQualification(obj->gpioHandle,GPIO_Number_21,GPIO_Qual_Sample_3);

  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_22,GPIO_22_Mode_GeneralPurpose);

  // EQEP1I
  GPIO_setMode(obj->gpioHandle,GPIO_Number_23,GPIO_23_Mode_EQEP1I);
  GPIO_setQualification(obj->gpioHandle,GPIO_Number_23,GPIO_Qual_Sample_3);
#else
  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_20,GPIO_20_Mode_GeneralPurpose);
  GPIO_setLow(obj->gpioHandle,GPIO_Number_20);
  GPIO_setDirection(obj->gpioHandle,GPIO_Number_20,GPIO_Direction_Output);

  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_21,GPIO_21_Mode_GeneralPurpose);

  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_22,GPIO_22_Mode_GeneralPurpose);

  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_23,GPIO_23_Mode_GeneralPurpose);
#endif

  // SPIB SIMO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_24,GPIO_24_Mode_SPISIMOB);

  // SPIB SOMI
  GPIO_setMode(obj->gpioHandle,GPIO_Number_25,GPIO_25_Mode_SPISOMIB);

  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_26,GPIO_26_Mode_GeneralPurpose);

  // SPIB CS
  GPIO_setMode(obj->gpioHandle,GPIO_Number_27,GPIO_27_Mode_SPISTEB_NOT);

  // OCTWn
  GPIO_setMode(obj->gpioHandle,GPIO_Number_28,GPIO_28_Mode_TZ2_NOT);

  // FAULTn
  GPIO_setMode(obj->gpioHandle,GPIO_Number_29,GPIO_29_Mode_TZ3_NOT);

  // CAN RX
  GPIO_setMode(obj->gpioHandle,GPIO_Number_30,GPIO_30_Mode_CANRXA);

  // CAN TX
  GPIO_setMode(obj->gpioHandle,GPIO_Number_31,GPIO_31_Mode_CANTXA);

  // I2C Data
  GPIO_setMode(obj->gpioHandle,GPIO_Number_32,GPIO_32_Mode_SDAA);

  // I2C Clock
  GPIO_setMode(obj->gpioHandle,GPIO_Number_33,GPIO_33_Mode_SCLA);

  // LED D9
  GPIO_setMode(obj->gpioHandle,GPIO_Number_34,GPIO_34_Mode_GeneralPurpose);
  GPIO_setLow(obj->gpioHandle,GPIO_Number_34);
  GPIO_setDirection(obj->gpioHandle,GPIO_Number_34,GPIO_Direction_Output);

  // JTAG
  GPIO_setMode(obj->gpioHandle,GPIO_Number_35,GPIO_35_Mode_JTAG_TDI);
  GPIO_setMode(obj->gpioHandle,GPIO_Number_36,GPIO_36_Mode_JTAG_TMS);
  GPIO_setMode(obj->gpioHandle,GPIO_Number_37,GPIO_37_Mode_JTAG_TDO);
  GPIO_setMode(obj->gpioHandle,GPIO_Number_38,GPIO_38_Mode_JTAG_TCK);

  // LED D10
  GPIO_setMode(obj->gpioHandle,GPIO_Number_39,GPIO_39_Mode_GeneralPurpose);
  GPIO_setLow(obj->gpioHandle,GPIO_Number_39);
  GPIO_setDirection(obj->gpioHandle,GPIO_Number_39,GPIO_Direction_Output);

  // DAC1
  GPIO_setMode(obj->gpioHandle,GPIO_Number_40,GPIO_40_Mode_EPWM7A);

  // DAC2
  GPIO_setMode(obj->gpioHandle,GPIO_Number_41,GPIO_41_Mode_EPWM7B);

  // DAC3
  GPIO_setMode(obj->gpioHandle,GPIO_Number_42,GPIO_42_Mode_EPWM8A);

  // DAC4
  GPIO_setMode(obj->gpioHandle,GPIO_Number_43,GPIO_43_Mode_EPWM8B);

  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_44,GPIO_44_Mode_GeneralPurpose);

  // Set Qualification Period for GPIO50-55, 22*2*(1/90MHz) = 0.48us
  GPIO_setQualificationPeriod(obj->gpioHandle,GPIO_Number_50,22);

  // DRV8301 Enable Gate
  GPIO_setMode(obj->gpioHandle,GPIO_Number_50,GPIO_50_Mode_GeneralPurpose);
  GPIO_setLow(obj->gpioHandle,GPIO_Number_50);
  GPIO_setDirection(obj->gpioHandle,GPIO_Number_50,GPIO_Direction_Output);

  // DRV8301 DC Calibration
  GPIO_setMode(obj->gpioHandle,GPIO_Number_51,GPIO_51_Mode_GeneralPurpose);
  GPIO_setLow(obj->gpioHandle,GPIO_Number_51);
  GPIO_setDirection(obj->gpioHandle,GPIO_Number_51,GPIO_Direction_Output);

  // DRV8301 Enable Gate
  GPIO_setMode(obj->gpioHandle,GPIO_Number_52,GPIO_52_Mode_GeneralPurpose);
  GPIO_setLow(obj->gpioHandle,GPIO_Number_52);
  GPIO_setDirection(obj->gpioHandle,GPIO_Number_52,GPIO_Direction_Output);

  // DRV8301 Device Calibration
  GPIO_setMode(obj->gpioHandle,GPIO_Number_53,GPIO_53_Mode_GeneralPurpose);
  GPIO_setLow(obj->gpioHandle,GPIO_Number_53);
  GPIO_setDirection(obj->gpioHandle,GPIO_Number_53,GPIO_Direction_Output);
  
  // Set Qualification Period for GPIO56-58, 22*2*(1/90MHz) = 0.48us
  GPIO_setQualificationPeriod(obj->gpioHandle,GPIO_Number_56,22);
  
#ifdef QEP
  // EQEP2A
  GPIO_setMode(obj->gpioHandle,GPIO_Number_54,GPIO_54_Mode_EQEP2A);
  GPIO_setQualification(obj->gpioHandle,GPIO_Number_54,GPIO_Qual_Sample_3);

  // EQEP2B
  GPIO_setMode(obj->gpioHandle,GPIO_Number_55,GPIO_55_Mode_EQEP2B);
  GPIO_setQualification(obj->gpioHandle,GPIO_Number_55,GPIO_Qual_Sample_3);

  // EQEP2I
  GPIO_setMode(obj->gpioHandle,GPIO_Number_56,GPIO_56_Mode_EQEP2I);
  GPIO_setQualification(obj->gpioHandle,GPIO_Number_56,GPIO_Qual_Sample_3);
#else
  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_54,GPIO_54_Mode_GeneralPurpose);

  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_55,GPIO_55_Mode_GeneralPurpose);

  // GPIO
  GPIO_setMode(obj->gpioHandle,GPIO_Number_56,GPIO_56_Mode_GeneralPurpose);
#endif

  // No Connection
  GPIO_setMode(obj->gpioHandle,GPIO_Number_57,GPIO_57_Mode_GeneralPurpose);

  // UARTB TX
  GPIO_setMode(obj->gpioHandle,GPIO_Number_58,GPIO_58_Mode_SCITXDB);

  return;
}  // end of HAL_setupGpios() function


void HAL_setupPie(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  PIE_disable(obj->pieHandle);

  PIE_disableAllInts(obj->pieHandle);

  PIE_clearAllInts(obj->pieHandle);

  PIE_clearAllFlags(obj->pieHandle);

  PIE_setDefaultIntVectorTable(obj->pieHandle);

  PIE_enable(obj->pieHandle);

  return;
} // end of HAL_setupPie() function


void HAL_setupPeripheralClks(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  CLK_enableAdcClock(obj->clkHandle);

  CLK_enableCompClock(obj->clkHandle,CLK_CompNumber_1);
  CLK_enableCompClock(obj->clkHandle,CLK_CompNumber_2);
  CLK_enableCompClock(obj->clkHandle,CLK_CompNumber_3);

  CLK_disableEcap1Clock(obj->clkHandle);

  CLK_enableEcanaClock(obj->clkHandle);

#ifdef QEP
  CLK_enableEqep1Clock(obj->clkHandle);
  CLK_enableEqep2Clock(obj->clkHandle);
#endif

  CLK_enablePwmClock(obj->clkHandle,PWM_Number_1);
  CLK_enablePwmClock(obj->clkHandle,PWM_Number_2);
  CLK_enablePwmClock(obj->clkHandle,PWM_Number_3);
  CLK_enablePwmClock(obj->clkHandle,PWM_Number_4);
  CLK_enablePwmClock(obj->clkHandle,PWM_Number_5);
  CLK_enablePwmClock(obj->clkHandle,PWM_Number_6);
  CLK_enablePwmClock(obj->clkHandle,PWM_Number_7);
  CLK_enablePwmClock(obj->clkHandle,PWM_Number_8);

  CLK_disableHrPwmClock(obj->clkHandle);

  CLK_enableI2cClock(obj->clkHandle);

  CLK_disableLinAClock(obj->clkHandle);

  CLK_disableClaClock(obj->clkHandle);

  CLK_disableSciaClock(obj->clkHandle);
  CLK_enableScibClock(obj->clkHandle);

  CLK_enableSpiaClock(obj->clkHandle);
  CLK_enableSpibClock(obj->clkHandle);
  
  CLK_enableTbClockSync(obj->clkHandle);

  return;
} // end of HAL_setupPeripheralClks() function


void HAL_setupPll(HAL_Handle handle,const PLL_ClkFreq_e clkFreq)
{
  HAL_Obj *obj = (HAL_Obj *)handle;


  // make sure PLL is not running in limp mode
  if(PLL_getClkStatus(obj->pllHandle) != PLL_ClkStatus_Normal)
    {
      // reset the clock detect
      PLL_resetClkDetect(obj->pllHandle);

      // ???????
      asm("        ESTOP0");
    }


  // Divide Select must be ClkIn/4 before the clock rate can be changed
  if(PLL_getDivideSelect(obj->pllHandle) != PLL_DivideSelect_ClkIn_by_4)
    {
      PLL_setDivideSelect(obj->pllHandle,PLL_DivideSelect_ClkIn_by_4);
    }


  if(PLL_getClkFreq(obj->pllHandle) != clkFreq)
    {
      // disable the clock detect
      PLL_disableClkDetect(obj->pllHandle);

      // set the clock rate
      PLL_setClkFreq(obj->pllHandle,clkFreq);
    }


  // wait until locked
  while(PLL_getLockStatus(obj->pllHandle) != PLL_LockStatus_Done) {}


  // enable the clock detect
  PLL_enableClkDetect(obj->pllHandle);


  // set divide select to ClkIn/2 to get desired clock rate
  // NOTE: clock must be locked before setting this register
  PLL_setDivideSelect(obj->pllHandle,PLL_DivideSelect_ClkIn_by_2);

  return;
} // end of HAL_setupPll() function


void HAL_setupPwms(HAL_Handle_mtr handleMtr,HAL_Handle handle,const USER_Params *pUserParams)
{
  HAL_Obj_mtr *objMtr = (HAL_Obj_mtr *)handleMtr;
  HAL_Obj *obj = (HAL_Obj *)handle;
  float_t systemFreq_MHz = pUserParams->systemFreq_MHz;
  uint_least16_t numPwmTicksPerIsrTick = pUserParams->numPwmTicksPerIsrTick;
  uint16_t halfPeriod_cycles = (uint16_t)(systemFreq_MHz*(float_t)pUserParams->pwmPeriod_usec) >> 1;
  uint_least8_t cnt;


  // turns off the outputs of the EPWM peripherals which will put the power switches
  // into a high impedance state.
  PWM_setOneShotTrip(objMtr->pwmHandle[PWM_Number_1]);
  PWM_setOneShotTrip(objMtr->pwmHandle[PWM_Number_2]);
  PWM_setOneShotTrip(objMtr->pwmHandle[PWM_Number_3]);


  for(cnt=0;cnt<3;cnt++)
    {
      // setup the Time-Base Control Register (TBCTL)
      PWM_setCounterMode(objMtr->pwmHandle[cnt],PWM_CounterMode_UpDown);
      PWM_disableCounterLoad(objMtr->pwmHandle[cnt]);      // Disable phase syncronization
      PWM_setPeriodLoad(objMtr->pwmHandle[cnt],PWM_PeriodLoad_Immediate);
      PWM_setSyncMode(objMtr->pwmHandle[cnt],PWM_SyncMode_EPWMxSYNC);
      PWM_setHighSpeedClkDiv(objMtr->pwmHandle[cnt],PWM_HspClkDiv_by_1);
      PWM_setClkDiv(objMtr->pwmHandle[cnt],PWM_ClkDiv_by_1);
      PWM_setRunMode(objMtr->pwmHandle[cnt],PWM_RunMode_FreeRun);

      // setup the Time-Base Counter Register (TBCTR)
      PWM_setCount(objMtr->pwmHandle[cnt],0);

      // setup the Time-Base Period Register (TBPRD)
      // set to zero initially
      PWM_setPeriod(objMtr->pwmHandle[cnt],0);

      // setup the Timer-Based Phase Register (TBPHS)
      PWM_setPhase(objMtr->pwmHandle[cnt],0);
      PWM_setPhaseDir(objMtr->pwmHandle[cnt],PWM_PhaseDir_CountUp);

      // setup the Counter-Compare Control Register (CMPCTL)
      PWM_setLoadMode_CmpA(objMtr->pwmHandle[cnt],PWM_LoadMode_Zero);
      PWM_setLoadMode_CmpB(objMtr->pwmHandle[cnt],PWM_LoadMode_Zero);
      PWM_setShadowMode_CmpA(objMtr->pwmHandle[cnt],PWM_ShadowMode_Shadow);
      PWM_setShadowMode_CmpB(objMtr->pwmHandle[cnt],PWM_ShadowMode_Immediate);

      // setup the Action-Qualifier Output A Register (AQCTLA)
      PWM_setActionQual_CntUp_CmpA_PwmA(objMtr->pwmHandle[cnt],PWM_ActionQual_Set);
      PWM_setActionQual_CntDown_CmpA_PwmA(objMtr->pwmHandle[cnt],PWM_ActionQual_Clear);

      // setup the Dead-Band Generator Control Register (DBCTL)
      PWM_setDeadBandOutputMode(objMtr->pwmHandle[cnt],PWM_DeadBandOutputMode_EPWMxA_Rising_EPWMxB_Falling);
      PWM_setDeadBandPolarity(objMtr->pwmHandle[cnt],PWM_DeadBandPolarity_EPWMxB_Inverted);

      // setup the Dead-Band Rising Edge Delay Register (DBRED)
      PWM_setDeadBandRisingEdgeDelay(objMtr->pwmHandle[cnt],HAL_PWM_DBRED_CNT);

      // setup the Dead-Band Falling Edge Delay Register (DBFED)
      PWM_setDeadBandFallingEdgeDelay(objMtr->pwmHandle[cnt],HAL_PWM_DBFED_CNT);
      // setup the PWM-Chopper Control Register (PCCTL)
      PWM_disableChopping(objMtr->pwmHandle[cnt]);

      // setup the Trip Zone Select Register (TZSEL)
      PWM_disableTripZones(objMtr->pwmHandle[cnt]);
    }


  // setup the Event Trigger Selection Register (ETSEL)
  PWM_disableInt(objMtr->pwmHandle[PWM_Number_1]);
  PWM_setSocAPulseSrc(objMtr->pwmHandle[PWM_Number_1],PWM_SocPulseSrc_CounterEqualZero);
  PWM_enableSocAPulse(objMtr->pwmHandle[PWM_Number_1]);

  // setup the Event Trigger Prescale Register (ETPS)
  if(numPwmTicksPerIsrTick == 3)
    {
      PWM_setIntPeriod(objMtr->pwmHandle[PWM_Number_1],PWM_IntPeriod_ThirdEvent);
      PWM_setSocAPeriod(objMtr->pwmHandle[PWM_Number_1],PWM_SocPeriod_ThirdEvent);
    }
  else if(numPwmTicksPerIsrTick == 2)
    {
      PWM_setIntPeriod(objMtr->pwmHandle[PWM_Number_1],PWM_IntPeriod_SecondEvent);
      PWM_setSocAPeriod(objMtr->pwmHandle[PWM_Number_1],PWM_SocPeriod_SecondEvent);
    }
  else
    {
      PWM_setIntPeriod(objMtr->pwmHandle[PWM_Number_1],PWM_IntPeriod_FirstEvent);
      PWM_setSocAPeriod(objMtr->pwmHandle[PWM_Number_1],PWM_SocPeriod_FirstEvent);
    }


  // setup the Event Trigger Clear Register (ETCLR)
  PWM_clearIntFlag(objMtr->pwmHandle[PWM_Number_1]);
  PWM_clearSocAFlag(objMtr->pwmHandle[PWM_Number_1]);

  // first step to synchronize the pwms
  CLK_disableTbClockSync(obj->clkHandle);

  // since the PWM is configured as an up/down counter, the period register is set to one-half 
  // of the desired PWM period
  PWM_setPeriod(objMtr->pwmHandle[PWM_Number_1],halfPeriod_cycles);
  PWM_setPeriod(objMtr->pwmHandle[PWM_Number_2],halfPeriod_cycles);
  PWM_setPeriod(objMtr->pwmHandle[PWM_Number_3],halfPeriod_cycles);

  // last step to synchronize the pwms
  CLK_enableTbClockSync(obj->clkHandle);

  return;
}  // end of HAL_setupPwms() function



#ifdef QEP
void HAL_setupQEP(HAL_Handle_mtr handleMtr, float_t encoderLines)
{
  HAL_Obj_mtr *objMtr = (HAL_Obj_mtr *)handleMtr;

  // hold the counter in reset
  QEP_reset_counter(objMtr->qepHandle);

  // set the QPOSINIT register
  QEP_set_posn_init_count(objMtr->qepHandle, 0);

  // disable all interrupts
  QEP_disable_all_interrupts(objMtr->qepHandle);

  // clear the interrupt flags
  QEP_clear_all_interrupt_flags(objMtr->qepHandle);

  // clear the position counter
  QEP_clear_posn_counter(objMtr->qepHandle);

  // setup the max position
  QEP_set_max_posn_count(objMtr->qepHandle, (uint16_t)((4.0 * encoderLines) - 1));

  // setup the QDECCTL register
  QEP_set_QEP_source(objMtr->qepHandle, QEP_Qsrc_Quad_Count_Mode);
  QEP_disable_sync_out(objMtr->qepHandle);
  QEP_set_swap_quad_inputs(objMtr->qepHandle, QEP_Swap_Not_Swapped);
  QEP_disable_gate_index(objMtr->qepHandle);
  QEP_set_ext_clock_rate(objMtr->qepHandle, QEP_Xcr_2x_Res);
  QEP_set_A_polarity(objMtr->qepHandle, QEP_Qap_No_Effect);
  QEP_set_B_polarity(objMtr->qepHandle, QEP_Qbp_No_Effect);
  QEP_set_index_polarity(objMtr->qepHandle, QEP_Qip_No_Effect);

  // setup the QEPCTL register
  QEP_set_emu_control(objMtr->qepHandle, QEPCTL_Freesoft_Unaffected_Halt);
  QEP_set_posn_count_reset_mode(objMtr->qepHandle, QEPCTL_Pcrm_Max_Reset);
  QEP_set_strobe_event_init(objMtr->qepHandle, QEPCTL_Sei_Nothing);
  QEP_set_index_event_init(objMtr->qepHandle, QEPCTL_Iei_Nothing);
  QEP_set_index_event_latch(objMtr->qepHandle, QEPCTL_Iel_Rising_Edge);
  QEP_set_soft_init(objMtr->qepHandle, QEPCTL_Swi_Nothing);
  QEP_disable_unit_timer(objMtr->qepHandle);
  QEP_disable_watchdog(objMtr->qepHandle);

  // setup the QPOSCTL register
  QEP_disable_posn_compare(objMtr->qepHandle);

  // setup the QCAPCTL register
  QEP_disable_capture(objMtr->qepHandle);

  // renable the position counter
  QEP_enable_counter(objMtr->qepHandle);


  return;
}
#endif

void HAL_setupSpiA(HAL_Handle handle)
{
  HAL_Obj   *obj = (HAL_Obj *)handle;

  SPI_reset(obj->spiAHandle);
  SPI_setMode(obj->spiAHandle,SPI_Mode_Master);
  SPI_setClkPolarity(obj->spiAHandle,SPI_ClkPolarity_OutputRisingEdge_InputFallingEdge);
  SPI_enableTx(obj->spiAHandle);
  SPI_enableTxFifoEnh(obj->spiAHandle);
  SPI_enableTxFifo(obj->spiAHandle);
  SPI_setTxDelay(obj->spiAHandle,0x0018);
  SPI_setBaudRate(obj->spiAHandle,(SPI_BaudRate_e)(0x000d));
  SPI_setCharLength(obj->spiAHandle,SPI_CharLength_16_Bits);
  SPI_setSuspend(obj->spiAHandle,SPI_TxSuspend_free);
  SPI_enable(obj->spiAHandle);

  return;
}  // end of HAL_setupSpiA() function


void HAL_setupSpiB(HAL_Handle handle)
{
  HAL_Obj   *obj = (HAL_Obj *)handle;

  SPI_reset(obj->spiBHandle);
  SPI_setMode(obj->spiBHandle,SPI_Mode_Master);
  SPI_setClkPolarity(obj->spiBHandle,SPI_ClkPolarity_OutputRisingEdge_InputFallingEdge);
  SPI_enableTx(obj->spiBHandle);
  SPI_enableTxFifoEnh(obj->spiBHandle);
  SPI_enableTxFifo(obj->spiBHandle);
  SPI_setTxDelay(obj->spiBHandle,0x0018);
  SPI_setBaudRate(obj->spiBHandle,(SPI_BaudRate_e)(0x000d));
  SPI_setCharLength(obj->spiBHandle,SPI_CharLength_16_Bits);
  SPI_setSuspend(obj->spiBHandle,SPI_TxSuspend_free);
  SPI_enable(obj->spiBHandle);

  return;
}  // end of HAL_setupSpiB() function


void HAL_setupPwmDacs(HAL_Handle handle)
{
  HAL_Obj *obj = (HAL_Obj *)handle;
  uint16_t halfPeriod_cycles = 512;       // 3000->10kHz, 1500->20kHz, 1000-> 30kHz, 500->60kHz
  uint_least8_t    cnt;


  for(cnt=0;cnt<2;cnt++)
    {
      // initialize the Time-Base Control Register (TBCTL)
      PWMDAC_setCounterMode(obj->pwmDacHandle[cnt],PWM_CounterMode_UpDown);
      PWMDAC_disableCounterLoad(obj->pwmDacHandle[cnt]);
      PWMDAC_setPeriodLoad(obj->pwmDacHandle[cnt],PWM_PeriodLoad_Immediate);
      PWMDAC_setSyncMode(obj->pwmDacHandle[cnt],PWM_SyncMode_EPWMxSYNC);
      PWMDAC_setHighSpeedClkDiv(obj->pwmDacHandle[cnt],PWM_HspClkDiv_by_1);
      PWMDAC_setClkDiv(obj->pwmDacHandle[cnt],PWM_ClkDiv_by_1);
      PWMDAC_setPhaseDir(obj->pwmDacHandle[cnt],PWM_PhaseDir_CountUp);
      PWMDAC_setRunMode(obj->pwmDacHandle[cnt],PWM_RunMode_FreeRun);

      // initialize the Timer-Based Phase Register (TBPHS)
      PWMDAC_setPhase(obj->pwmDacHandle[cnt],0);

      // setup the Time-Base Counter Register (TBCTR)
      PWMDAC_setCount(obj->pwmDacHandle[cnt],0);

      // Initialize the Time-Base Period Register (TBPRD)
      // set to zero initially
      PWMDAC_setPeriod(obj->pwmDacHandle[cnt],0);

      // initialize the Counter-Compare Control Register (CMPCTL)
      PWMDAC_setLoadMode_CmpA(obj->pwmDacHandle[cnt],PWM_LoadMode_Zero);
      PWMDAC_setLoadMode_CmpB(obj->pwmDacHandle[cnt],PWM_LoadMode_Zero);
      PWMDAC_setShadowMode_CmpA(obj->pwmDacHandle[cnt],PWM_ShadowMode_Shadow);
      PWMDAC_setShadowMode_CmpB(obj->pwmDacHandle[cnt],PWM_ShadowMode_Shadow);

      // Initialize the Action-Qualifier Output A Register (AQCTLA) 
      PWMDAC_setActionQual_CntUp_CmpA_PwmA(obj->pwmDacHandle[cnt],PWM_ActionQual_Clear);
      PWMDAC_setActionQual_CntDown_CmpA_PwmA(obj->pwmDacHandle[cnt],PWM_ActionQual_Set);
      PWMDAC_setActionQual_CntUp_CmpB_PwmB(obj->pwmDacHandle[cnt],PWM_ActionQual_Clear);
      PWMDAC_setActionQual_CntDown_CmpB_PwmB(obj->pwmDacHandle[cnt],PWM_ActionQual_Set);

      // Initialize the Dead-Band Control Register (DBCTL) 
      PWMDAC_disableDeadBand(obj->pwmDacHandle[cnt]);

      // Initialize the PWM-Chopper Control Register (PCCTL)
      PWMDAC_disableChopping(obj->pwmDacHandle[cnt]);

      // Initialize the Trip-Zone Control Register (TZSEL)
      PWMDAC_disableTripZones(obj->pwmDacHandle[cnt]);

      // Initialize the Trip-Zone Control Register (TZCTL)
      PWMDAC_setTripZoneState_TZA(obj->pwmDacHandle[cnt],PWM_TripZoneState_HighImp);
      PWMDAC_setTripZoneState_TZB(obj->pwmDacHandle[cnt],PWM_TripZoneState_HighImp);
      PWMDAC_setTripZoneState_DCAEVT1(obj->pwmDacHandle[cnt],PWM_TripZoneState_HighImp);
      PWMDAC_setTripZoneState_DCAEVT2(obj->pwmDacHandle[cnt],PWM_TripZoneState_HighImp);
      PWMDAC_setTripZoneState_DCBEVT1(obj->pwmDacHandle[cnt],PWM_TripZoneState_HighImp);
    }

  // since the PWM is configured as an up/down counter, the period register is set to one-half 
  // of the desired PWM period
  PWMDAC_setPeriod(obj->pwmDacHandle[PWMDAC_Number_1],halfPeriod_cycles);
  PWMDAC_setPeriod(obj->pwmDacHandle[PWMDAC_Number_2],halfPeriod_cycles);

  return;
}  // end of HAL_setupPwmDacs() function


void HAL_setupTimers(HAL_Handle handle,const float_t systemFreq_MHz)
{
  HAL_Obj  *obj = (HAL_Obj *)handle;
  uint32_t  timerPeriod_cnts = (uint32_t)(systemFreq_MHz * (float_t)1000000.0) - 1;

  // use timer 0 for frequency diagnostics
  TIMER_setDecimationFactor(obj->timerHandle[0],0);
  TIMER_setEmulationMode(obj->timerHandle[0],TIMER_EmulationMode_RunFree);
  TIMER_setPeriod(obj->timerHandle[0],timerPeriod_cnts);
  TIMER_setPreScaler(obj->timerHandle[0],0);

  // use timer 1 for CPU usage diagnostics
  TIMER_setDecimationFactor(obj->timerHandle[1],0);
  TIMER_setEmulationMode(obj->timerHandle[1],TIMER_EmulationMode_RunFree);
  TIMER_setPeriod(obj->timerHandle[1],timerPeriod_cnts);
  TIMER_setPreScaler(obj->timerHandle[1],0);

  return;
}  // end of HAL_setupTimers() function


void HAL_writeDrvData(HAL_Handle_mtr handle, DRV_SPI_8301_Vars_t *Spi_8301_Vars)
{
  HAL_Obj_mtr  *obj = (HAL_Obj_mtr *)handle;

  DRV8301_writeData(obj->drv8301Handle,Spi_8301_Vars);
  
  return;
}  // end of HAL_writeDrvData() function


void HAL_readDrvData(HAL_Handle_mtr handle, DRV_SPI_8301_Vars_t *Spi_8301_Vars)
{
  HAL_Obj_mtr  *obj = (HAL_Obj_mtr *)handle;

  DRV8301_readData(obj->drv8301Handle,Spi_8301_Vars);
  
  return;
}  // end of HAL_readDrvData() function


void HAL_setupDrvSpi(HAL_Handle_mtr handle, DRV_SPI_8301_Vars_t *Spi_8301_Vars)
{
  HAL_Obj_mtr  *obj = (HAL_Obj_mtr *)handle;

  DRV8301_setupSpi(obj->drv8301Handle,Spi_8301_Vars);

  return;
}  // end of HAL_setupDrvSpi() function


// end of file
