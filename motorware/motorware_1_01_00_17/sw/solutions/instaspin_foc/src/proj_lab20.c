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
//! \file   solutions/instaspin_foc/src/proj_lab20.c
//! \brief New ctrl Structure
//!
//! (C) Copyright 2011, Texas Instruments, Inc.

//! \defgroup PROJ_LAB20 PROJ_LAB20
//@{

//! \defgroup PROJ_LAB20_OVERVIEW Project Overview
//!
//! New ctrl Structure
//!

// **************************************************************************
// the includes

// system includes
#include <math.h>
#include "main.h"

// due to memory limitations, when building for F2802xF with CSM run mainISR from Flash
#ifdef FLASH
#pragma CODE_SECTION(mainISR,"ramfuncs");
#endif

// Include header files used in the main function


// **************************************************************************
// the defines


#define LED_BLINK_FREQ_Hz   5


// **************************************************************************
// the globals

uint_least16_t gCounter_updateGlobals = 0;

bool Flag_Latch_softwareUpdate = true;

MATH_vec3 gAdcBiasI;
MATH_vec3 gAdcBiasV;
CTRL_Handle ctrlHandle;

CLARKE_Handle   clarkeHandle_I;               //!< the handle for the current Clarke transform
CLARKE_Obj      clarke_I;                     //!< the current Clarke transform object

CLARKE_Handle   clarkeHandle_V;               //!< the handle for the voltage Clarke transform
CLARKE_Obj      clarke_V;                     //!< the voltage Clarke transform object

EST_Handle      estHandle;                    //!< the handle for the estimator

IPARK_Handle    iparkHandle;                  //!< the handle for the inverse Park transform
IPARK_Obj       ipark;                        //!< the inverse Park transform object

PARK_Handle     parkHandle;                   //!< the handle for the Park object
PARK_Obj        park;                         //!< the Park transform object

SVGEN_Handle    svgenHandle;                  //!< the handle for the space vector generator
SVGEN_Obj       svgen;                        //!< the space vector generator object

#ifdef CSM_ENABLE
#pragma DATA_SECTION(halHandle,"rom_accessed_data");
#endif
HAL_Handle halHandle;

#ifdef CSM_ENABLE
#pragma DATA_SECTION(gUserParams,"rom_accessed_data");
#endif

USER_Params gUserParams;

HAL_PwmData_t gPwmData = {_IQ(0.0), _IQ(0.0), _IQ(0.0)};

HAL_AdcData_t gAdcData;

_iq gMaxCurrentSlope = _IQ(0.0);

#ifdef FAST_ROM_V1p6
CTRL_Obj *controller_obj;
#else

#ifdef CSM_ENABLE
#pragma DATA_SECTION(ctrl,"rom_accessed_data");
#endif

CTRL_Obj ctrl;				//v1p7 format
#endif

uint16_t gLEDcnt = 0;

volatile MOTOR_Vars_t gMotorVars = MOTOR_Vars_INIT;

#ifdef FLASH
// Used for running BackGround in flash, and ISR in RAM
extern uint16_t *RamfuncsLoadStart, *RamfuncsLoadEnd, *RamfuncsRunStart;

#ifdef CSM_ENABLE
extern uint16_t *econst_start, *econst_end, *econst_ram_load;
extern uint16_t *switch_start, *switch_end, *switch_ram_load;
#endif
#endif


#ifdef DRV8301_SPI
// Watch window interface to the 8301 SPI
DRV_SPI_8301_Vars_t gDrvSpi8301Vars;
#endif

#ifdef DRV8305_SPI
// Watch window interface to the 8305 SPI
DRV_SPI_8305_Vars_t gDrvSpi8305Vars;
#endif

_iq gFlux_pu_to_Wb_sf;

_iq gFlux_pu_to_VpHz_sf;

_iq gTorque_Ls_Id_Iq_pu_to_Nm_sf;

_iq gTorque_Flux_Iq_pu_to_Nm_sf;

// **************************************************************************
// the functions

void main(void)
{
  uint_least8_t estNumber = 0;

#ifdef FAST_ROM_V1p6
  uint_least8_t ctrlNumber = 0;
#endif

  // Only used if running from FLASH
  // Note that the variable FLASH is defined by the project
  #ifdef FLASH
  // Copy time critical code and Flash setup code to RAM
  // The RamfuncsLoadStart, RamfuncsLoadEnd, and RamfuncsRunStart
  // symbols are created by the linker. Refer to the linker files.
  memCopy((uint16_t *)&RamfuncsLoadStart,(uint16_t *)&RamfuncsLoadEnd,(uint16_t *)&RamfuncsRunStart);

  #ifdef CSM_ENABLE
  //copy .econst to unsecure RAM
  if(*econst_end - *econst_start)
	{
	  memCopy((uint16_t *)&econst_start,(uint16_t *)&econst_end,(uint16_t *)&econst_ram_load);
	}

  //copy .switch ot unsecure RAM
  if(*switch_end - *switch_start)
	{
	  memCopy((uint16_t *)&switch_start,(uint16_t *)&switch_end,(uint16_t *)&switch_ram_load);
	}
  #endif
  #endif

  // initialize the hardware abstraction layer
  halHandle = HAL_init(&hal,sizeof(hal));


  // check for errors in user parameters
  USER_checkForErrors(&gUserParams);


  // store user parameter error in global variable
  gMotorVars.UserErrorCode = USER_getErrorCode(&gUserParams);


  // do not allow code execution if there is a user parameter error
  if(gMotorVars.UserErrorCode != USER_ErrorCode_NoError)
    {
      for(;;)
        {
          gMotorVars.Flag_enableSys = false;
        }
    }


  // initialize the user parameters
  USER_setParams(&gUserParams);


  // set the hardware abstraction layer parameters
  HAL_setParams(halHandle,&gUserParams);


  // initialize the controller
#ifdef FAST_ROM_V1p6
  ctrlHandle = CTRL_initCtrl(ctrlNumber, estNumber);  		//v1p6 format (06xF and 06xM devices)
  controller_obj = (CTRL_Obj *)ctrlHandle;
#else
  ctrlHandle = CTRL_initCtrl(estNumber,&ctrl,sizeof(ctrl));	//v1p7 format default
#endif


  {
    CTRL_Version version;

    // get the version number
    CTRL_getVersion(ctrlHandle,&version);

    gMotorVars.CtrlVersion = version;
  }


  // set the default controller parameters
  CTRL_setParams(ctrlHandle,&gUserParams);


  // initialize the Clarke modules
  clarkeHandle_I = CLARKE_init(&clarke_I,sizeof(clarke_I));
  clarkeHandle_V = CLARKE_init(&clarke_V,sizeof(clarke_V));


  // set the number of current sensors
  setupClarke_I(clarkeHandle_I,gUserParams.numCurrentSensors);


  // set the number of voltage sensors
  setupClarke_V(clarkeHandle_V,gUserParams.numVoltageSensors);


#ifdef FAST_ROM_V1p6
  estHandle = controller_obj->estHandle;
#else
  estHandle = ctrl.estHandle;
#endif


  // initialize the inverse Park module
  iparkHandle = IPARK_init(&ipark,sizeof(ipark));


  // initialize the Park module
  parkHandle = PARK_init(&park,sizeof(park));


  // initialize the space vector generator module
  svgenHandle = SVGEN_init(&svgen,sizeof(svgen));


  // setup faults
  HAL_setupFaults(halHandle);


  // initialize the interrupt vector table
  HAL_initIntVectorTable(halHandle);


  // enable the ADC interrupts
  HAL_enableAdcInts(halHandle);


  // enable global interrupts
  HAL_enableGlobalInts(halHandle);


  // enable debug interrupts
  HAL_enableDebugInt(halHandle);


  // disable the PWM
  HAL_disablePwm(halHandle);


#ifdef DRV8301_SPI
  // turn on the DRV8301 if present
  HAL_enableDrv(halHandle);
  // initialize the DRV8301 interface
  HAL_setupDrvSpi(halHandle,&gDrvSpi8301Vars);
#endif


#ifdef DRV8305_SPI
  // turn on the DRV8305 if present
  HAL_enableDrv(halHandle);
  // initialize the DRV8305 interface
  HAL_setupDrvSpi(halHandle,&gDrvSpi8305Vars);
#endif


  // enable DC bus compensation
  CTRL_setFlag_enableDcBusComp(ctrlHandle, true);


  // compute scaling factors for flux and torque calculations
  gFlux_pu_to_Wb_sf = USER_computeFlux_pu_to_Wb_sf();
  gFlux_pu_to_VpHz_sf = USER_computeFlux_pu_to_VpHz_sf();
  gTorque_Ls_Id_Iq_pu_to_Nm_sf = USER_computeTorque_Ls_Id_Iq_pu_to_Nm_sf();
  gTorque_Flux_Iq_pu_to_Nm_sf = USER_computeTorque_Flux_Iq_pu_to_Nm_sf();


  for(;;)
  {
    // Waiting for enable system flag to be set
    while(!(gMotorVars.Flag_enableSys));

    // Enable the Library internal PI.  Iq is referenced by the speed PI now
    CTRL_setFlag_enableSpeedCtrl(ctrlHandle, true);

    // loop while the enable system flag is true
    while(gMotorVars.Flag_enableSys)
    {
      CTRL_Obj *obj = (CTRL_Obj *)ctrlHandle;

      // increment counters
      gCounter_updateGlobals++;

      // enable/disable the use of motor parameters being loaded from user.h
      CTRL_setFlag_enableUserMotorParams(ctrlHandle,gMotorVars.Flag_enableUserParams);

      // enable/disable Rs recalibration during motor startup
      EST_setFlag_enableRsRecalc(obj->estHandle,gMotorVars.Flag_enableRsRecalc);

      // enable/disable automatic calculation of bias values
      CTRL_setFlag_enableOffset(ctrlHandle,gMotorVars.Flag_enableOffsetcalc);


      if(CTRL_isError(ctrlHandle))
      {
        // set the enable controller flag to false
        CTRL_setFlag_enableCtrl(ctrlHandle,false);

        // set the enable system flag to false
        gMotorVars.Flag_enableSys = false;

        // disable the PWM
        HAL_disablePwm(halHandle);
      }
      else
      {
        // update the controller state
        bool flag_ctrlStateChanged = CTRL_updateState(ctrlHandle);

        // enable or disable the control
        CTRL_setFlag_enableCtrl(ctrlHandle, gMotorVars.Flag_Run_Identify);

        if(flag_ctrlStateChanged)
        {
          CTRL_State_e ctrlState = CTRL_getState(ctrlHandle);

          if(ctrlState == CTRL_State_OffLine)
          {
            // enable the PWM
            HAL_enablePwm(halHandle);
          }
          else if(ctrlState == CTRL_State_OnLine)
          {
            if(gMotorVars.Flag_enableOffsetcalc == true)
            {
              uint_least16_t cnt;

              // update the ADC bias values
              HAL_updateAdcBias(halHandle);

              // record the current bias
              for(cnt=0;cnt<3;cnt++)
                gAdcBiasI.value[cnt] = HAL_getBias(halHandle,HAL_SensorType_Current,cnt);

              // record the voltage bias
              for(cnt=0;cnt<3;cnt++)
                gAdcBiasV.value[cnt] = HAL_getBias(halHandle,HAL_SensorType_Voltage,cnt);

              gMotorVars.Flag_enableOffsetcalc = false;
            }
            else
            {
              uint_least16_t cnt;

              // set the current bias
              for(cnt=0;cnt<3;cnt++)
                HAL_setBias(halHandle,HAL_SensorType_Current,cnt,gAdcBiasI.value[cnt]);

              // set the voltage bias
              for(cnt=0;cnt<3;cnt++)
                HAL_setBias(halHandle,HAL_SensorType_Voltage,cnt,gAdcBiasV.value[cnt]);
            }

            // enable the PWM
            HAL_enablePwm(halHandle);
          }
          else if(ctrlState == CTRL_State_Idle)
          {
            // disable the PWM
            HAL_disablePwm(halHandle);
            gMotorVars.Flag_Run_Identify = false;
          }

          if((CTRL_getFlag_enableUserMotorParams(ctrlHandle) == true) &&
            (ctrlState > CTRL_State_Idle) &&
            (gMotorVars.CtrlVersion.minor == 6))
          {
            // call this function to fix 1p6
            USER_softwareUpdate1p6(ctrlHandle);
          }
        }
      }


      if(EST_isMotorIdentified(obj->estHandle))
      {
        // set the current ramp
        EST_setMaxCurrentSlope_pu(obj->estHandle,gMaxCurrentSlope);
        gMotorVars.Flag_MotorIdentified = true;

        // set the speed reference
        CTRL_setSpd_ref_krpm(ctrlHandle,gMotorVars.SpeedRef_krpm);

        // set the speed acceleration
        CTRL_setMaxAccel_pu(ctrlHandle,_IQmpy(MAX_ACCEL_KRPMPS_SF,gMotorVars.MaxAccel_krpmps));
        if(Flag_Latch_softwareUpdate)
        {
          Flag_Latch_softwareUpdate = false;

          USER_calcPIgains(ctrlHandle);

          // initialize the watch window kp and ki current values with pre-calculated values
          gMotorVars.Kp_Idq = CTRL_getKp(ctrlHandle,CTRL_Type_PID_Id);
          gMotorVars.Ki_Idq = CTRL_getKi(ctrlHandle,CTRL_Type_PID_Id);

          // initialize the watch window kp and ki values with pre-calculated values
          gMotorVars.Kp_spd = CTRL_getKp(ctrlHandle,CTRL_Type_PID_spd);
          gMotorVars.Ki_spd = CTRL_getKi(ctrlHandle,CTRL_Type_PID_spd);
        }

      }
      else
      {
        Flag_Latch_softwareUpdate = true;

        // the estimator sets the maximum current slope during identification
        gMaxCurrentSlope = EST_getMaxCurrentSlope_pu(obj->estHandle);
      }


      // when appropriate, update the global variables
      if(gCounter_updateGlobals >= NUM_MAIN_TICKS_FOR_GLOBAL_VARIABLE_UPDATE)
      {
        // reset the counter
        gCounter_updateGlobals = 0;

        updateGlobalVariables_motor(ctrlHandle);
      }


      // update Kp and Ki gains
      updateKpKiGains(ctrlHandle);

      // enable/disable the forced angle
      EST_setFlag_enableForceAngle(obj->estHandle,gMotorVars.Flag_enableForceAngle);

      // enable or disable power warp
      CTRL_setFlag_enablePowerWarp(ctrlHandle,gMotorVars.Flag_enablePowerWarp);

#ifdef DRV8301_SPI
      HAL_writeDrvData(halHandle,&gDrvSpi8301Vars);

      HAL_readDrvData(halHandle,&gDrvSpi8301Vars);
#endif
#ifdef DRV8305_SPI
      HAL_writeDrvData(halHandle,&gDrvSpi8305Vars);

      HAL_readDrvData(halHandle,&gDrvSpi8305Vars);
#endif
    } // end of while(gFlag_enableSys) loop


    // disable the PWM
    HAL_disablePwm(halHandle);

    // set the default controller parameters (Reset the control to re-identify the motor)
    CTRL_setParams(ctrlHandle,&gUserParams);
    gMotorVars.Flag_Run_Identify = false;

  } // end of for(;;) loop

} // end of main() function


interrupt void mainISR(void)
{
  _iq angle_pu = 0;
  _iq speed_pu;
  _iq speed_ref_pu = TRAJ_getIntValue(((CTRL_Obj *)ctrlHandle)->trajHandle_spd);
  _iq speed_outMax_pu = TRAJ_getIntValue(((CTRL_Obj *)ctrlHandle)->trajHandle_spdMax);

  MATH_vec2 Iab_pu;
  MATH_vec2 Vab_pu;
  MATH_vec2 Vdq_out_pu;
  MATH_vec2 Vab_out_pu;
  MATH_vec2 phasor;


  // toggle status LED
  if(gLEDcnt++ > (uint_least32_t)(USER_ISR_FREQ_Hz / LED_BLINK_FREQ_Hz))
  {
    HAL_toggleLed(halHandle,(GPIO_Number_e)HAL_Gpio_LED2);
    gLEDcnt = 0;
  }


  // acknowledge the ADC interrupt
  HAL_acqAdcInt(halHandle,ADC_IntNumber_1);


  // convert the ADC data
  HAL_readAdcData(halHandle,&gAdcData);

  {
    uint_least16_t count_isr = CTRL_getCount_isr(ctrlHandle);
    uint_least16_t numIsrTicksPerCtrlTick = CTRL_getNumIsrTicksPerCtrlTick(ctrlHandle);

    // if needed, run the controller
    if(count_isr >= numIsrTicksPerCtrlTick)
    {
      CTRL_State_e ctrlState = CTRL_getState(ctrlHandle);

      bool flag_enableSpeedCtrl;
      bool flag_enableCurrentCtrl;

      MATH_vec2 Idq_offset_pu;
      MATH_vec2 Vdq_offset_pu;


      // reset the isr count
      CTRL_resetCounter_isr(ctrlHandle);

      // run Clarke transform on current
      CLARKE_run(clarkeHandle_I,&gAdcData.I,&Iab_pu);

      // run Clarke transform on voltage
      CLARKE_run(clarkeHandle_V,&gAdcData.V,&Vab_pu);

      {
        // run the estimator
        EST_run(estHandle, \
                &Iab_pu, \
                &Vab_pu, \
                gAdcData.dcBus, \
                speed_ref_pu);

        flag_enableSpeedCtrl = EST_doSpeedCtrl(estHandle);
        flag_enableCurrentCtrl = EST_doCurrentCtrl(estHandle);
      }

      // generate the motor electrical angle
      angle_pu = EST_getAngle_pu(estHandle);
      speed_pu = EST_getFm_pu(estHandle);

      // compute the sin/cos phasor
      CTRL_computePhasor(angle_pu,&phasor);

      // set the phasor in the Park transform
      PARK_setPhasor(parkHandle,&phasor);

      // run the Park transform
      PARK_run(parkHandle,&Iab_pu,CTRL_getIdq_in_addr(ctrlHandle));

      // set the offset based on the Id trajectory
      Idq_offset_pu.value[0] = TRAJ_getIntValue(((CTRL_Obj *)ctrlHandle)->trajHandle_Id);
      Idq_offset_pu.value[1] = _IQ(0.0);

      Vdq_offset_pu.value[0] = 0;
      Vdq_offset_pu.value[1] = 0;

      CTRL_setup_user(ctrlHandle,
                      angle_pu,
                      speed_ref_pu,
                      speed_pu,
                      speed_outMax_pu,
                      &Idq_offset_pu,
                      &Vdq_offset_pu,
                      flag_enableSpeedCtrl,
                      flag_enableCurrentCtrl);

      // run the appropriate controller
      if(ctrlState == CTRL_State_OnLine)
      {
        // run the online controller
        CTRL_runPiOnly(ctrlHandle); //,&gAdcData,&gPwmData);

        // get the controller output
        CTRL_getVdq_out_pu(ctrlHandle,&Vdq_out_pu);

        // set the phasor in the inverse Park transform
        IPARK_setPhasor(iparkHandle,&phasor);

        // run the inverse Park module
        IPARK_run(iparkHandle,&Vdq_out_pu,&Vab_out_pu);

        // run the space Vector Generator (SVGEN) module
        SVGEN_run(svgenHandle,&Vab_out_pu,&(gPwmData.Tabc));
      }
      else if(ctrlState == CTRL_State_OffLine)
      {
        // run the offline controller
        CTRL_runOffLine(ctrlHandle,halHandle,&gAdcData,&gPwmData);
      }
    }
    else
    {
      // increment the isr count
      CTRL_incrCounter_isr(ctrlHandle);
    }
  }

  // write the PWM compare values
  HAL_writePwmData(halHandle,&gPwmData);


  return;
} // end of mainISR() function


void setupClarke_I(CLARKE_Handle handle,const uint_least8_t numCurrentSensors)
{
  _iq alpha_sf,beta_sf;


  // initialize the Clarke transform module for current
  if(numCurrentSensors == 3)
    {
      alpha_sf = _IQ(MATH_ONE_OVER_THREE);
      beta_sf = _IQ(MATH_ONE_OVER_SQRT_THREE);
    }
  else if(numCurrentSensors == 2)
    {
      alpha_sf = _IQ(1.0);
      beta_sf = _IQ(MATH_ONE_OVER_SQRT_THREE);
    }
  else
    {
      alpha_sf = _IQ(0.0);
      beta_sf = _IQ(0.0);
    }

  // set the parameters
  CLARKE_setScaleFactors(handle,alpha_sf,beta_sf);
  CLARKE_setNumSensors(handle,numCurrentSensors);

  return;
} // end of setupClarke_I() function


void setupClarke_V(CLARKE_Handle handle,const uint_least8_t numVoltageSensors)
{
  _iq alpha_sf,beta_sf;


  // initialize the Clarke transform module for voltage
  if(numVoltageSensors == 3)
    {
      alpha_sf = _IQ(MATH_ONE_OVER_THREE);
      beta_sf = _IQ(MATH_ONE_OVER_SQRT_THREE);
    }
 else
    {
      alpha_sf = _IQ(0.0);
      beta_sf = _IQ(0.0);
    }

  // set the parameters
  CLARKE_setScaleFactors(handle,alpha_sf,beta_sf);
  CLARKE_setNumSensors(handle,numVoltageSensors);

  return;
} // end of setupClarke_V() function


void updateGlobalVariables_motor(CTRL_Handle handle)
{
  CTRL_Obj *obj = (CTRL_Obj *)handle;

  // get the speed estimate
  gMotorVars.Speed_krpm = EST_getSpeed_krpm(obj->estHandle);

  // get the real time speed reference coming out of the speed trajectory generator
  gMotorVars.SpeedTraj_krpm = _IQmpy(CTRL_getSpd_int_ref_pu(handle),EST_get_pu_to_krpm_sf(obj->estHandle));

  // get the torque estimate
  gMotorVars.Torque_Nm = USER_computeTorque_Nm(handle, gTorque_Flux_Iq_pu_to_Nm_sf, gTorque_Ls_Id_Iq_pu_to_Nm_sf);

  // get the magnetizing current
  gMotorVars.MagnCurr_A = EST_getIdRated(obj->estHandle);

  // get the rotor resistance
  gMotorVars.Rr_Ohm = EST_getRr_Ohm(obj->estHandle);

  // get the stator resistance
  gMotorVars.Rs_Ohm = EST_getRs_Ohm(obj->estHandle);

  // get the stator inductance in the direct coordinate direction
  gMotorVars.Lsd_H = EST_getLs_d_H(obj->estHandle);

  // get the stator inductance in the quadrature coordinate direction
  gMotorVars.Lsq_H = EST_getLs_q_H(obj->estHandle);

  // get the flux in V/Hz in floating point
  gMotorVars.Flux_VpHz = EST_getFlux_VpHz(obj->estHandle);

  // get the flux in Wb in fixed point
  gMotorVars.Flux_Wb = USER_computeFlux(handle, gFlux_pu_to_Wb_sf);

  // get the controller state
  gMotorVars.CtrlState = CTRL_getState(handle);

  // get the estimator state
  gMotorVars.EstState = EST_getState(obj->estHandle);

  // Get the DC buss voltage
  gMotorVars.VdcBus_kV = _IQmpy(gAdcData.dcBus,_IQ(USER_IQ_FULL_SCALE_VOLTAGE_V/1000.0));

  return;
} // end of updateGlobalVariables_motor() function


void updateKpKiGains(CTRL_Handle handle)
{
  if((gMotorVars.CtrlState == CTRL_State_OnLine) && (gMotorVars.Flag_MotorIdentified == true) && (Flag_Latch_softwareUpdate == false))
    {
      // set the kp and ki speed values from the watch window
      CTRL_setKp(handle,CTRL_Type_PID_spd,gMotorVars.Kp_spd);
      CTRL_setKi(handle,CTRL_Type_PID_spd,gMotorVars.Ki_spd);

      // set the kp and ki current values for Id and Iq from the watch window
      CTRL_setKp(handle,CTRL_Type_PID_Id,gMotorVars.Kp_Idq);
      CTRL_setKi(handle,CTRL_Type_PID_Id,gMotorVars.Ki_Idq);
      CTRL_setKp(handle,CTRL_Type_PID_Iq,gMotorVars.Kp_Idq);
      CTRL_setKi(handle,CTRL_Type_PID_Iq,gMotorVars.Ki_Idq);
	}

  return;
} // end of updateKpKiGains() function

//@} //defgroup
// end of file



