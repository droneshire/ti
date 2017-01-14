/* --COPYRIGHT--,BSD
 * Copyright (c) 2012, LineStream Technologies Incorporated
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
* *  Neither the names of Texas Instruments Incorporated, LineStream
 *    Technologies Incorporated, nor the names of its contributors may be
 *    used to endorse or promote products derived from this software without
 *    specific prior written permission.
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
//! \file   solutions/instaspin_motion/src/proj_lab05c.c
//! \brief  InstaSPIN-MOTION Inertia Identification
//!
//! (C) Copyright 2012, LineStream Technologies, Inc.
//! (C) Copyright 2011, Texas Instruments, Inc.

//! \defgroup PROJ_LAB05c PROJ_LAB05c
//@{

//! \defgroup PROJ_LAB05c_OVERVIEW Project Overview
//!
//! InstaSPIN-MOTION Inertia Identification
//!

// **************************************************************************
// the includes

// system includes
#include <math.h>
#include "main.h"

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

CTRL_Handle ctrlHandle;

HAL_Handle halHandle;

USER_Params gUserParams;

HAL_PwmData_t gPwmData = {_IQ(0.0), _IQ(0.0), _IQ(0.0)};

HAL_AdcData_t gAdcData;

_iq gMaxCurrentSlope = _IQ(0.0);

#ifdef FAST_ROM_V1p6
CTRL_Obj *controller_obj;
#else
CTRL_Obj ctrl;				//v1p7 format
#endif

ST_Obj st_obj;
ST_Handle stHandle;

uint16_t gLEDcnt = 0;

volatile MOTOR_Vars_t gMotorVars = MOTOR_Vars_INIT;

#ifdef FLASH
// Used for running BackGround in flash, and ISR in RAM
extern uint16_t *RamfuncsLoadStart, *RamfuncsLoadEnd, *RamfuncsRunStart;
#endif

_iq gLs_pu = _IQ30(0.0);
uint_least8_t gLs_qFmt = 0;
uint_least8_t gMax_Ls_qFmt = 0;

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


  // initialize the SpinTAC Components
  stHandle = ST_init(&st_obj, sizeof(st_obj));
  
  
  // setup the SpinTAC Components
  ST_setupVelId(stHandle);


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
        ST_Obj *stObj = (ST_Obj *)stHandle;

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
                EST_State_e estState = EST_getState(obj->estHandle);

                if(ctrlState == CTRL_State_OffLine)
                  {
                    // enable the PWM
                    HAL_enablePwm(halHandle);
                  }
                else if(ctrlState == CTRL_State_OnLine)
                  {
                    if((estState < EST_State_LockRotor) || (estState > EST_State_MotorIdentified))
                      {
                        // update the ADC bias values
                        HAL_updateAdcBias(halHandle);
                      }

                    // Return the bias value for currents
                    gMotorVars.I_bias.value[0] = HAL_getBias(halHandle,HAL_SensorType_Current,0);
                    gMotorVars.I_bias.value[1] = HAL_getBias(halHandle,HAL_SensorType_Current,1);
                    gMotorVars.I_bias.value[2] = HAL_getBias(halHandle,HAL_SensorType_Current,2);

                    // Return the bias value for voltages
                    gMotorVars.V_bias.value[0] = HAL_getBias(halHandle,HAL_SensorType_Voltage,0);
                    gMotorVars.V_bias.value[1] = HAL_getBias(halHandle,HAL_SensorType_Voltage,1);
                    gMotorVars.V_bias.value[2] = HAL_getBias(halHandle,HAL_SensorType_Voltage,2);

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

              // initializes the value for GoalSpeed and TorqueRampTime
              gMotorVars.SpinTAC.VelIdGoalSpeed_krpm = _IQmpy(STVELID_getGoalSpeed(stObj->velIdHandle), _IQ(ST_SPEED_KRPM_PER_PU));
              gMotorVars.SpinTAC.VelIdTorqueRampTime_sec = STVELID_getTorqueRampTime_sec(stObj->velIdHandle);
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

            updateGlobalVariables_motor(ctrlHandle, stHandle);
          }


        if(gMotorVars.Flag_enableUserParams == true)
        {
          // update Kp and Ki gains
          updateKpKiGains(ctrlHandle);
        }
        else
        {
          if(CTRL_getMotorType(ctrlHandle) == MOTOR_Type_Induction)
          {
            // recalculate Kp and Ki gains to fix the R/L limitation of 2000.0, and Kp limit to 0.11
            recalcKpKi(ctrlHandle);

            // set electrical frequency limit to zero while identifying an induction motor
            setFeLimitZero(ctrlHandle);

            // calculate Dir_qFmt for acim motors
            acim_Dir_qFmtCalc(ctrlHandle);
          }
          else
          {
            // recalculate Kp and Ki gains to fix the R/L limitation of 2000.0, and Kp limit to 0.11
            // as well as recalculates gains based on estimator state to allow low inductance pmsm to id
            recalcKpKiPmsm(ctrlHandle);

            // calculate an Ls qFmt that allows ten times smaller inductance compared to Lhf
            CTRL_calcMax_Ls_qFmt(ctrlHandle, &gMax_Ls_qFmt);

            gLs_pu = EST_getLs_d_pu(obj->estHandle);
            gLs_qFmt = EST_getLs_qFmt(obj->estHandle);
          }
        }

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
	
    // setup the SpinTAC Components
    ST_setupVelId(stHandle);

  } // end of for(;;) loop

} // end of main() function


interrupt void mainISR(void)
{

  static uint16_t stCnt = 0;

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


  // Run the SpinTAC Components
  if(stCnt++ >= ISR_TICKS_PER_SPINTAC_TICK) {
	  ST_runVelId(stHandle, ctrlHandle);
	  stCnt = 1;
  }


  // run the controller
  CTRL_run(ctrlHandle,halHandle,&gAdcData,&gPwmData);


  // write the PWM compare values
  HAL_writePwmData(halHandle,&gPwmData);


  // setup the controller
  CTRL_setup(ctrlHandle);


  if(CTRL_getMotorType(ctrlHandle) == MOTOR_Type_Pm)
    {
      // reset Ls Q format to a higher value when Ls identification starts
      CTRL_resetLs_qFmt(ctrlHandle, gMax_Ls_qFmt);
    }

  return;
} // end of mainISR() function


void updateGlobalVariables_motor(CTRL_Handle handle, ST_Handle sthandle)
{
  CTRL_Obj *obj = (CTRL_Obj *)handle;
  ST_Obj *stObj = (ST_Obj *)sthandle;


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

  // Get the DC bus voltage
  gMotorVars.VdcBus_kV = _IQmpy(gAdcData.dcBus,_IQ(USER_IQ_FULL_SCALE_VOLTAGE_V/1000.0));

  // get the Iq Reference
  if(gMotorVars.SpinTAC.VelIdRun) {
	  gMotorVars.IqRef_A = _IQmpy(STVELID_getTorqueReference(stObj->velIdHandle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A));
  }
  else {
	  gMotorVars.IqRef_A = _IQmpy(CTRL_getSpd_out_pu(handle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A));
  }

  // get Velocity Identify status
  gMotorVars.SpinTAC.VelIdStatus = STVELID_getStatus(stObj->velIdHandle);

  // get the inertia estimate
  gMotorVars.SpinTAC.InertiaEstimate_Aperkrpm = _IQmpy(STVELID_getInertiaEstimate(stObj->velIdHandle), _IQ(ST_SPEED_PU_PER_KRPM * USER_IQ_FULL_SCALE_CURRENT_A));

  // get the friction estimate
  gMotorVars.SpinTAC.FrictionEstimate_Aperkrpm = _IQmpy(STVELID_getFrictionEstimate(stObj->velIdHandle), _IQ(ST_SPEED_PU_PER_KRPM * USER_IQ_FULL_SCALE_CURRENT_A));

  // get the Velocity Identify error
  gMotorVars.SpinTAC.VelIdErrorID = STVELID_getErrorID(stObj->velIdHandle);

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


void CTRL_resetLs_qFmt(CTRL_Handle handle, const uint_least8_t Ls_qFmt)
{
  CTRL_Obj *obj = (CTRL_Obj *)handle;
  static bool LsResetLatch = false;

  // reset Ls Q format to a higher value when Ls identification starts
  if(EST_getState(obj->estHandle) == EST_State_Ls)
    {
      if((EST_getLs_d_pu(obj->estHandle) != _IQ30(0.0)) && (LsResetLatch == false))
        {
          EST_setLs_qFmt(obj->estHandle, Ls_qFmt);
          LsResetLatch = true;
        }
    }
  else
    {
      LsResetLatch = false;
    }

  return;
} // end of CTRL_resetLs_qFmt() function


void recalcKpKiPmsm(CTRL_Handle handle)
{
  CTRL_Obj *obj = (CTRL_Obj *)handle;
  EST_State_e EstState = EST_getState(obj->estHandle);

  if((EST_isMotorIdentified(obj->estHandle) == false) && (EstState == EST_State_Rs))
    {
      float_t Lhf = CTRL_getLhf(handle);
      float_t Rhf = CTRL_getRhf(handle);
      float_t RhfoverLhf = Rhf/Lhf;
      _iq Kp = _IQ(0.05*Lhf*USER_IQ_FULL_SCALE_CURRENT_A/(USER_CTRL_PERIOD_sec*USER_IQ_FULL_SCALE_VOLTAGE_V));
      _iq Ki = _IQ(RhfoverLhf*USER_CTRL_PERIOD_sec);
      _iq Kp_spd = _IQ(0.005*USER_IQ_FULL_SCALE_FREQ_Hz*USER_MOTOR_MAX_CURRENT/USER_IQ_FULL_SCALE_CURRENT_A);

      // set Rhf/Lhf
      CTRL_setRoverL(handle,RhfoverLhf);

      // set the controller proportional gains
      CTRL_setKp(handle,CTRL_Type_PID_Id,Kp);
      CTRL_setKp(handle,CTRL_Type_PID_Iq,Kp);

      // set the Id controller gains
      CTRL_setKi(handle,CTRL_Type_PID_Id,Ki);
      PID_setKi(obj->pidHandle_Id,Ki);

      // set the Iq controller gains
      CTRL_setKi(handle,CTRL_Type_PID_Iq,Ki);
      PID_setKi(obj->pidHandle_Iq,Ki);

      // set speed gains
      PID_setKp(obj->pidHandle_spd,Kp_spd);
    }
  else if(EstState == EST_State_RatedFlux)
    {
      _iq Ki_spd = _IQ(0.5*USER_IQ_FULL_SCALE_FREQ_Hz*USER_CTRL_PERIOD_sec*USER_MOTOR_MAX_CURRENT/USER_IQ_FULL_SCALE_CURRENT_A);

      // Set Ki on closing the feedback loop
      PID_setKi(obj->pidHandle_spd,Ki_spd);
    }
  else if(EstState == EST_State_RampDown)
    {
      _iq Kp_spd = _IQ(0.02*USER_IQ_FULL_SCALE_FREQ_Hz*USER_MOTOR_MAX_CURRENT/USER_IQ_FULL_SCALE_CURRENT_A);
      _iq Ki_spd = _IQ(2.0*USER_IQ_FULL_SCALE_FREQ_Hz*USER_CTRL_PERIOD_sec*USER_MOTOR_MAX_CURRENT/USER_IQ_FULL_SCALE_CURRENT_A);

      // Set Kp and Ki of the speed controller
      PID_setKp(obj->pidHandle_spd,Kp_spd);
      PID_setKi(obj->pidHandle_spd,Ki_spd);

      TRAJ_setTargetValue(obj->trajHandle_spdMax,_IQ(USER_MOTOR_RES_EST_CURRENT/USER_IQ_FULL_SCALE_CURRENT_A));
    }

  return;
} // end of recalcKpKiPmsm() function


void CTRL_calcMax_Ls_qFmt(CTRL_Handle handle, uint_least8_t *pLs_qFmt)
{
  CTRL_Obj *obj = (CTRL_Obj *)handle;

  if((EST_isMotorIdentified(obj->estHandle) == false) && (EST_getState(obj->estHandle) == EST_State_Rs))
    {
      float_t Lhf = CTRL_getLhf(handle);
	  float_t fullScaleInductance = USER_IQ_FULL_SCALE_VOLTAGE_V/(USER_IQ_FULL_SCALE_CURRENT_A*USER_VOLTAGE_FILTER_POLE_rps);
	  float_t Ls_coarse_max = _IQ30toF(EST_getLs_coarse_max_pu(obj->estHandle));
	  int_least8_t lShift = ceil(log((Lhf/20.0)/(Ls_coarse_max*fullScaleInductance))/log(2.0));

	  *pLs_qFmt = 30 - lShift;
    }

  return;
} // end of CTRL_calcMax_Ls_qFmt() function


void recalcKpKi(CTRL_Handle handle)
{
  CTRL_Obj *obj = (CTRL_Obj *)handle;
  EST_State_e EstState = EST_getState(obj->estHandle);

  if((EST_isMotorIdentified(obj->estHandle) == false) && (EstState == EST_State_Rs))
    {
      float_t Lhf = CTRL_getLhf(handle);
      float_t Rhf = CTRL_getRhf(handle);
      float_t RhfoverLhf = Rhf/Lhf;
      _iq Kp = _IQ(0.25*Lhf*USER_IQ_FULL_SCALE_CURRENT_A/(USER_CTRL_PERIOD_sec*USER_IQ_FULL_SCALE_VOLTAGE_V));
      _iq Ki = _IQ(RhfoverLhf*USER_CTRL_PERIOD_sec);

      // set Rhf/Lhf
      CTRL_setRoverL(handle,RhfoverLhf);

      // set the controller proportional gains
      CTRL_setKp(handle,CTRL_Type_PID_Id,Kp);
      CTRL_setKp(handle,CTRL_Type_PID_Iq,Kp);

      // set the Id controller gains
      CTRL_setKi(handle,CTRL_Type_PID_Id,Ki);
      PID_setKi(obj->pidHandle_Id,Ki);

      // set the Iq controller gains
      CTRL_setKi(handle,CTRL_Type_PID_Iq,Ki);
      PID_setKi(obj->pidHandle_Iq,Ki);
    }

  return;
} // end of recalcKpKi() function


void setFeLimitZero(CTRL_Handle handle)
{
  CTRL_Obj *obj = (CTRL_Obj *)handle;
  EST_State_e EstState = EST_getState(obj->estHandle);

  _iq fe_neg_max_pu;
  _iq fe_pos_min_pu;

  if((EST_isMotorIdentified(obj->estHandle) == false) && (CTRL_getMotorType(handle) == MOTOR_Type_Induction))
    {
	  fe_neg_max_pu = _IQ30(0.0);

	  fe_pos_min_pu = _IQ30(0.0);
    }
  else
    {
	  fe_neg_max_pu = _IQ30(-USER_ZEROSPEEDLIMIT);

	  fe_pos_min_pu = _IQ30(USER_ZEROSPEEDLIMIT);
    }

  EST_setFe_neg_max_pu(obj->estHandle, fe_neg_max_pu);

  EST_setFe_pos_min_pu(obj->estHandle, fe_pos_min_pu);

  return;
} // end of setFeLimitZero() function


void acim_Dir_qFmtCalc(CTRL_Handle handle)
{
  CTRL_Obj *obj = (CTRL_Obj *)handle;
  EST_State_e EstState = EST_getState(obj->estHandle);

  if(EstState == EST_State_IdRated)
    {
      EST_setDir_qFmt(obj->estHandle, EST_computeDirection_qFmt(obj->estHandle, 0.7));
    }

  return;
} // end of acim_Dir_qFmtCalc() function


void ST_runVelId(ST_Handle handle, CTRL_Handle ctrlHandle)
{

    _iq speedFeedback, iqReference;
    ST_Obj *stObj = (ST_Obj *)handle;
    CTRL_Obj *ctrlObj = (CTRL_Obj *)ctrlHandle;

    // Get the mechanical speed in pu
    speedFeedback = EST_getFm_pu(ctrlObj->estHandle);

	if(gMotorVars.SpinTAC.VelIdRun == true) {
		// if beginning the SpinTAC Identify process
		// set the speed reference to zero
		gMotorVars.SpeedRef_krpm = 0;
		// wait until the actual speed is zero
		if((_IQabs(speedFeedback) < _IQ(ST_MIN_ID_SPEED_PU)) && (STVELID_getEnable(stObj->velIdHandle) == false)) {
			CTRL_setFlag_enableSpeedCtrl(ctrlHandle, false);
			gMotorVars.Flag_enableForceAngle = true;
			EST_setFlag_enableForceAngle(ctrlObj->estHandle, gMotorVars.Flag_enableForceAngle);
			// set the GoalSpeed
			STVELID_setGoalSpeed(stObj->velIdHandle, _IQmpy(gMotorVars.SpinTAC.VelIdGoalSpeed_krpm, _IQ(ST_SPEED_PU_PER_KRPM)));
			// set the Torque Ramp Time
			STVELID_setTorqueRampTime_sec(stObj->velIdHandle, gMotorVars.SpinTAC.VelIdTorqueRampTime_sec);
			// Enable SpinTAC Inertia Identify
			STVELID_setEnable(stObj->velIdHandle, true);
			// Set a positive speed reference to FAST to provide direction information
			gMotorVars.SpeedRef_krpm = _IQ(0.001);
			CTRL_setSpd_ref_krpm(ctrlHandle, gMotorVars.SpeedRef_krpm);
		}
	}

	// Run SpinTAC Inertia Identify
	STVELID_setVelocityFeedback(stObj->velIdHandle, speedFeedback);
	STVELID_run(stObj->velIdHandle);

	if((STVELID_getStatus(stObj->velIdHandle) == ST_VEL_ID_IDLE) && (_IQabs(speedFeedback) < _IQ(ST_MIN_ID_SPEED_PU))) {
		// If inertia identification is successful, update the inertia setting of SpinTAC Velocity Controller
		// EXAMPLE: STVELCTL_setInertia(stObj->velCtlHandle, STVELID_getInertiaEstimate(stObj->velIdHandle));
		gMotorVars.SpinTAC.VelIdRun = false;
		// return the speed reference to zero
		gMotorVars.SpeedRef_krpm = gMotorVars.StopSpeedRef_krpm;
		CTRL_setFlag_enableSpeedCtrl(ctrlHandle, true);
		CTRL_setSpd_ref_krpm(ctrlHandle, gMotorVars.SpeedRef_krpm);
	}
	else if((STVELID_getErrorID(stObj->velIdHandle) != false) && (STVELID_getErrorID(stObj->velIdHandle) != ST_ID_INCOMPLETE_ERROR)) {
	// if not done & in error, wait until speed is less than 1RPM to exit
		if(_IQabs(speedFeedback) < _IQ(ST_MIN_ID_SPEED_PU)) {
			gMotorVars.SpinTAC.VelIdRun = false;
			// return the speed reference to zero
			gMotorVars.SpeedRef_krpm = gMotorVars.StopSpeedRef_krpm;
			CTRL_setFlag_enableSpeedCtrl(ctrlHandle, true);
			CTRL_setSpd_ref_krpm(ctrlHandle, gMotorVars.SpeedRef_krpm);
		}
	}

	// select SpinTAC Identify
	iqReference = STVELID_getTorqueReference(stObj->velIdHandle);

	// Set the Iq reference that came out of SpinTAC Velocity Control
	CTRL_setIq_ref_pu(ctrlHandle, iqReference);
}


//@} //defgroup
// end of file
