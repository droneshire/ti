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
//! \file   solutions/instaspin_motion/src/proj_lab06c.c
//! \brief  Motion Sequence Example: Washing Machine
//!
//! (C) Copyright 2012, LineStream Technologies, Inc.
//! (C) Copyright 2011, Texas Instruments, Inc.

//! \defgroup PROJ_LAB06c PROJ_LAB06c
//@{

//! \defgroup PROJ_LAB06c_OVERVIEW Project Overview
//!
//! Motion Sequence Example: Washing Machine
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

#define WASHER_MAX_WATER_LEVEL (1000)

#define WASHER_MIN_WATER_LEVEL (0)

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

// Used to handle controlling SpinTAC Plan
ST_PlanButton_e gVelPlanRunFlag = ST_PLAN_STOP;

// Enumerates the States in the Washing Machine Example
typedef enum
{
  WASHER_IDLE = 0,
  WASHER_FILL,
  WASHER_AGI_CCW,
  WASHER_AGI_CW,
  WASHER_DRAIN,
  WASHER_DRY,
  NUM_WASHER_STATES	// Used to represent the number of States in this configuration
} WASHER_State_e;

// Enumerates the Variables in the Washing Machine Example
typedef enum
{
  WASHER_FillSensor = 0,
  WASHER_DrainSensor,
  WASHER_CycleCounter,
  WASHER_FillValve,
  WASHER_DrainValve,
  NUM_WASHER_VARS // Used to represent the number of Variables in this configuration
} WASHER_Vars_e;

// Enumerates the Conditions in the Washing Machine Example
typedef enum
{
  WASHER_WaterFull = 0,
  WASHER_AgiNotDone,
  WASHER_AgiDone,
  WASHER_WaterEmpty,
  NUM_WASHER_CONDS // Used to represent the number of Conditions in this configuration
} WASHER_Cond_e;

// Enumerates the Actions in the Washing Machine Example
typedef enum
{
  WASHER_SetCycleCnt = 0,
  WASHER_DecCycleCnt,
  WASHER_OpenFillValve,
  WASHER_CloseValveWhenFull,
  WASHER_OpenDrainValve,
  WASHER_CloseDrainWhenDone,
  NUM_WASHER_ACTS // Used to represent the number of Actions in this configuration
} WASHER_Acts_e;

// Enumerates the Transitions in the Washing Machine Example
typedef enum
{
  WASHER_IdleToFill = 0,
  WASHER_FillToAgi1,
  WASHER_Agi1ToAgi2,
  WASHER_Agi2ToAgi1,
  WASHER_Agi2ToDrain,
  WASHER_DrainToDry,
  WASHER_DryToIdle,
  NUM_WASHER_TRANS // Used to represent the number of Transitions in this configuration
} WASHER_Trans_e;

// Calculates the amount of memory required for the SpinTAC Velocity Plan configuration
// This is based on the above enumerations
#define ST_VELPLAN_CFG_ARRAY_DWORDS (   (ST_VEL_PLAN_ACT_DWORDS   * NUM_WASHER_ACTS)  + \
                                        (ST_VEL_PLAN_COND_DWORDS  * NUM_WASHER_CONDS) + \
                                        (ST_VEL_PLAN_VAR_DWORDS   * NUM_WASHER_VARS)  + \
                                        (ST_VEL_PLAN_TRAN_DWORDS  * NUM_WASHER_TRANS) + \
                                        (ST_VEL_PLAN_STATE_DWORDS * NUM_WASHER_STATES))

// Used to store the configuration of SpinTAC Velocity Plan
uint32_t stVelPlanCfgArray[ST_VELPLAN_CFG_ARRAY_DWORDS];

// Used to store the values of SpinTAC Velocity Plan variables
_iq gVelPanVar[NUM_WASHER_VARS];

WASHER_State_e gWasherState = WASHER_IDLE;

// Used to store the water level in the washer
unsigned long gWaterLevel = 0;	

uint16_t gLEDcnt = 0;

volatile MOTOR_Vars_t gMotorVars = MOTOR_Vars_INIT;

#ifdef FLASH
// Used for running BackGround in flash, and ISR in RAM
extern uint16_t *RamfuncsLoadStart, *RamfuncsLoadEnd, *RamfuncsRunStart;
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
  ST_setupVelCtl(stHandle);
  ST_setupVelMove(stHandle);
  ST_setupVelPlan(stHandle);


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

    // Dis-able the Library internal PI.  Iq has no reference now
    CTRL_setFlag_enableSpeedCtrl(ctrlHandle, false);

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

                if(ctrlState == CTRL_State_OffLine)
                  {
                    // enable the PWM
                    HAL_enablePwm(halHandle);
                  }
                else if(ctrlState == CTRL_State_OnLine)
                  {
                    if(gMotorVars.Flag_enableOffsetcalc == true)
                    {
                      // update the ADC bias values
                      HAL_updateAdcBias(halHandle);
                    }
                    else
                    {
                      // set the current bias
                      HAL_setBias(halHandle,HAL_SensorType_Current,0,_IQ(I_A_offset));
                      HAL_setBias(halHandle,HAL_SensorType_Current,1,_IQ(I_B_offset));
                      HAL_setBias(halHandle,HAL_SensorType_Current,2,_IQ(I_C_offset));

                      // set the voltage bias
                      HAL_setBias(halHandle,HAL_SensorType_Voltage,0,_IQ(V_A_offset));
                      HAL_setBias(halHandle,HAL_SensorType_Voltage,1,_IQ(V_B_offset));
                      HAL_setBias(halHandle,HAL_SensorType_Voltage,2,_IQ(V_C_offset));
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

            // enable the SpinTAC Speed Controller
            STVELCTL_setEnable(stObj->velCtlHandle, true);

            if(EST_getState(obj->estHandle) != EST_State_OnLine)
            {
            	// if the estimator is not running, place SpinTAC into reset
            	STVELCTL_setEnable(stObj->velCtlHandle, false);
            	// if the estimator is not running, set SpinTAC Move start & end velocity to 0
            	STVELMOVE_setVelocityEnd(stObj->velMoveHandle, _IQ(0.0));
            	STVELMOVE_setVelocityStart(stObj->velMoveHandle, _IQ(0.0));
            }

            if(Flag_Latch_softwareUpdate)
            {
              Flag_Latch_softwareUpdate = false;

              USER_calcPIgains(ctrlHandle);
			  
              // initialize the watch window kp and ki current values with pre-calculated values
              gMotorVars.Kp_Idq = CTRL_getKp(ctrlHandle,CTRL_Type_PID_Id);
              gMotorVars.Ki_Idq = CTRL_getKi(ctrlHandle,CTRL_Type_PID_Id);

			  // initialize the watch window Bw value with the default value
              gMotorVars.SpinTAC.VelCtlBw_radps = STVELCTL_getBandwidth_radps(stObj->velCtlHandle);

              // initialize the watch window with maximum and minimum Iq reference
              gMotorVars.SpinTAC.VelCtlOutputMax_A = _IQmpy(STVELCTL_getOutputMaximum(stObj->velCtlHandle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A));
              gMotorVars.SpinTAC.VelCtlOutputMin_A = _IQmpy(STVELCTL_getOutputMinimum(stObj->velCtlHandle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A));
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


        // update Kp and Ki gains
        updateKpKiGains(ctrlHandle);

        // set the SpinTAC (ST) bandwidth scale
        STVELCTL_setBandwidth_radps(stObj->velCtlHandle, gMotorVars.SpinTAC.VelCtlBw_radps);

        // set the maximum and minimum values for Iq reference
        STVELCTL_setOutputMaximums(stObj->velCtlHandle, _IQmpy(gMotorVars.SpinTAC.VelCtlOutputMax_A, _IQ(1.0/USER_IQ_FULL_SCALE_CURRENT_A)), _IQmpy(gMotorVars.SpinTAC.VelCtlOutputMin_A, _IQ(1.0/USER_IQ_FULL_SCALE_CURRENT_A)));

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
    ST_setupVelCtl(stHandle);
    ST_setupVelMove(stHandle);

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
      ST_runVelPlanTick(stHandle);
      ST_runVelPlan(stHandle, ctrlHandle);
	  ST_runVelMove(stHandle, ctrlHandle);
	  ST_runVelCtl(stHandle, ctrlHandle);
	  stCnt = 1;
  }


  // run the controller
  CTRL_run(ctrlHandle,halHandle,&gAdcData,&gPwmData);


  // write the PWM compare values
  HAL_writePwmData(halHandle,&gPwmData);


  // setup the controller
  CTRL_setup(ctrlHandle);


  return;
} // end of mainISR() function


void updateGlobalVariables_motor(CTRL_Handle handle, ST_Handle sthandle)
{
  uint16_t stVelPlanCfgErrIdx, stVelPlanCfgErrCode;
  CTRL_Obj *obj = (CTRL_Obj *)handle;
  ST_Obj *stObj = (ST_Obj *)sthandle;


  // get the speed estimate
  gMotorVars.Speed_krpm = EST_getSpeed_krpm(obj->estHandle);

  // get the real time speed reference coming out of the speed trajectory generator
  gMotorVars.SpeedTraj_krpm = _IQmpy(STVELMOVE_getVelocityReference(stObj->velMoveHandle),EST_get_pu_to_krpm_sf(obj->estHandle));

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

  // get the Iq reference from the speed controller
  gMotorVars.IqRef_A = _IQmpy(STVELCTL_getTorqueReference(stObj->velCtlHandle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A));

  // gets the Velocity Controller status
  gMotorVars.SpinTAC.VelCtlStatus = STVELCTL_getStatus(stObj->velCtlHandle);

  // get the inertia setting
  gMotorVars.SpinTAC.InertiaEstimate_Aperkrpm = _IQmpy(STVELCTL_getInertia(stObj->velCtlHandle), _IQ(ST_SPEED_PU_PER_KRPM * USER_IQ_FULL_SCALE_CURRENT_A));

  // get the friction setting
  gMotorVars.SpinTAC.FrictionEstimate_Aperkrpm = _IQmpy(STVELCTL_getFriction(stObj->velCtlHandle), _IQ(ST_SPEED_PU_PER_KRPM * USER_IQ_FULL_SCALE_CURRENT_A));

  // get the Velocity Controller error
  gMotorVars.SpinTAC.VelCtlErrorID = STVELCTL_getErrorID(stObj->velCtlHandle);

  // get the Velocity Move status
  gMotorVars.SpinTAC.VelMoveStatus = STVELMOVE_getStatus(stObj->velMoveHandle);

  // get the Velocity Move profile time
  gMotorVars.SpinTAC.VelMoveTime_ticks = STVELMOVE_getProfileTime_tick(stObj->velMoveHandle);

  // get the Velocity Move error
  gMotorVars.SpinTAC.VelMoveErrorID = STVELMOVE_getErrorID(stObj->velMoveHandle);
  
  // get the Velocity Plan status
  gMotorVars.SpinTAC.VelPlanStatus = STVELPLAN_getStatus(stObj->velPlanHandle);

  // get the Velocity Plan error
  gMotorVars.SpinTAC.VelPlanErrorID = STVELPLAN_getCfgError(stObj->velPlanHandle, &stVelPlanCfgErrIdx, &stVelPlanCfgErrCode);
  gMotorVars.SpinTAC.VelPlanCfgErrorIdx = stVelPlanCfgErrIdx;
  gMotorVars.SpinTAC.VelPlanCfgErrorCode = stVelPlanCfgErrCode;

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


void ST_setupVelPlan(ST_Handle handle) {

  _iq accMax, jrkMax;
  ST_Obj *stObj = (ST_Obj *)handle;

  // Pass the configuration array pointer into SpinTAC Velocity Plan
  STVELPLAN_setCfgArray(stObj->velPlanHandle, &stVelPlanCfgArray[0], sizeof(stVelPlanCfgArray), NUM_WASHER_ACTS, NUM_WASHER_CONDS, NUM_WASHER_VARS, NUM_WASHER_TRANS, NUM_WASHER_STATES);

  // Establish the Acceleration, and Jerk Maximums
  accMax = _IQ24(10.0);
  jrkMax = _IQ20(62.5);

  // Configure SpinTAC Velocity Plan: Sample Time, LoopENB
  STVELPLAN_setCfg(stObj->velPlanHandle, _IQ(ST_SAMPLE_TIME), false);
  // Configure halt state: VelEnd, AccMax, JrkMax, Timer
  STVELPLAN_setCfgHaltState(stObj->velPlanHandle, 0, accMax, jrkMax, 1000L);

  //Example: STVELPLAN_addCfgState(handle,    VelSetpoint[pups],                 StateTimer[ticks]);
  STVELPLAN_addCfgState(stObj->velPlanHandle, 0,                                 200L); // StateIdx0: Idle
  STVELPLAN_addCfgState(stObj->velPlanHandle, 0,                                 200L); // StateIdx1: Fill
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(0.25 * ST_SPEED_PU_PER_KRPM),  200L);  // StateIdx2: AgiCW
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(-0.25 * ST_SPEED_PU_PER_KRPM), 200L);  // StateIdx3: AgiCCW
  STVELPLAN_addCfgState(stObj->velPlanHandle, 0,                                 200L); // StateIdx4: Drain
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(2 * ST_SPEED_PU_PER_KRPM),     2000L); // StateIdx5: Dry

  //Example: STVELPLAN_addCfgVar(handle,    VarType,      InitialValue);
  STVELPLAN_addCfgVar(stObj->velPlanHandle, ST_VAR_IN,    0);	// VarIdx0: FillSensor {0: not filled; 1: filled}
  STVELPLAN_addCfgVar(stObj->velPlanHandle, ST_VAR_IN,    0);	// VarIdx1: DrainSensor {0: not drained; 1: drained}
  STVELPLAN_addCfgVar(stObj->velPlanHandle, ST_VAR_INOUT, 0);	// VarIdx2: CycleCounter
  STVELPLAN_addCfgVar(stObj->velPlanHandle, ST_VAR_OUT,   0);	// VarIdx3: FillValve {0: valve closed; 1: valve open}
  STVELPLAN_addCfgVar(stObj->velPlanHandle, ST_VAR_OUT,   0);	// VarIdx4: DrainValve {0: valve closed; 1: valve open}

  //Example: STVELPLAN_addCfgCond(handle,    VarIdx,              Comparison,  Value1, Value2)
  STVELPLAN_addCfgCond(stObj->velPlanHandle, WASHER_FillSensor,   ST_COMP_EQ,  1,      0); // CondIdx0: WaterFull Water is filled
  STVELPLAN_addCfgCond(stObj->velPlanHandle, WASHER_CycleCounter, ST_COMP_GT,  0,      0); // CondIdx1: AgiNotDone SgitCycleCounter is greater than 0 (not done)
  STVELPLAN_addCfgCond(stObj->velPlanHandle, WASHER_CycleCounter, ST_COMP_ELW, 0,      0); // CondIdx2: AgiDone SgitCycleCounter is equal or less than 0 (done)
  STVELPLAN_addCfgCond(stObj->velPlanHandle, WASHER_DrainSensor,  ST_COMP_EQ,  1,      0); // CondIdx3: WaterEmpty Water is drained
  // Note: Set Value2 to 0 if Comparison is for only one value.

  //Example: STVELPLAN_addCfgTran(handle,    FromState,      ToState,        CondOption, CondIdx1,          CondiIdx2, AccLim[pups2], JrkLim[pups3]);
  STVELPLAN_addCfgTran(stObj->velPlanHandle, WASHER_IDLE,    WASHER_FILL,    ST_COND_NC, 0,                 0,         _IQ(0.1),      _IQ20(1.0));	// From IdleState to FillState
  STVELPLAN_addCfgTran(stObj->velPlanHandle, WASHER_FILL,    WASHER_AGI_CCW, ST_COND_FC, WASHER_WaterFull,  0,         _IQ(0.1),      _IQ20(1.0));	// From FillState to AgiState1
  STVELPLAN_addCfgTran(stObj->velPlanHandle, WASHER_AGI_CCW, WASHER_AGI_CW,  ST_COND_NC, 0,                 0,         _IQ(1.0),      _IQ20(1.0));	// From AgiState1 to AgiState2
  STVELPLAN_addCfgTran(stObj->velPlanHandle, WASHER_AGI_CW,  WASHER_AGI_CCW, ST_COND_FC, WASHER_AgiNotDone, 0,         _IQ(1.0),      _IQ20(1.0));	// From AgiState2 to AgiState1
  STVELPLAN_addCfgTran(stObj->velPlanHandle, WASHER_AGI_CW,  WASHER_DRAIN,   ST_COND_FC, WASHER_AgiDone,    0,         _IQ(0.1),      _IQ20(1.0));	// From AgiState2 to DrainState
  STVELPLAN_addCfgTran(stObj->velPlanHandle, WASHER_DRAIN,   WASHER_DRY,     ST_COND_FC, WASHER_WaterEmpty, 0,         _IQ(0.2),      _IQ20(1.0));	// From DrainState to DryState
  STVELPLAN_addCfgTran(stObj->velPlanHandle, WASHER_DRY,     WASHER_IDLE,    ST_COND_NC, 0,                 0,         _IQ(0.1),      _IQ20(1.0));	// From DryState to IdleState
  // Note: set CondIdx1 to 0 if CondOption is ST_COND_NC; set CondIdx2 to 0 if CondOption is ST_COND_NC  or ST_COND_FC

  //Example: STVELPLAN_addCfgAct(handle,    StateIdx,       CondOption, CondIdx1, CondIdx2, VarIdx,              Operation,	 Value, ActionTriger);
  STVELPLAN_addCfgAct(stObj->velPlanHandle, WASHER_IDLE,    ST_COND_NC, 0,        0,        WASHER_CycleCounter, ST_ACT_EQ,  20,    ST_ACT_EXIT);	// In IdleState, preset AgiCycleCounter  counter to 20
  STVELPLAN_addCfgAct(stObj->velPlanHandle, WASHER_AGI_CCW, ST_COND_NC, 0,        0,        WASHER_CycleCounter, ST_ACT_ADD, -1,    ST_ACT_ENTR);	// Decrease AgiCycleCounter by 1 everytime enters AgiState1
  STVELPLAN_addCfgAct(stObj->velPlanHandle, WASHER_FILL,    ST_COND_NC, 0,        0,        WASHER_FillValve,    ST_ACT_EQ,  1,     ST_ACT_ENTR);	// In FillState, set VarIdx3 to 1 to open FillValve
  STVELPLAN_addCfgAct(stObj->velPlanHandle, WASHER_FILL,    ST_COND_NC, 0,        0,        WASHER_FillValve,    ST_ACT_EQ,  0,     ST_ACT_EXIT);	// In FillState, set VarIdx3 to 0 to close FillValve when FillSensor = 1
  STVELPLAN_addCfgAct(stObj->velPlanHandle, WASHER_DRAIN,   ST_COND_NC, 0,        0,        WASHER_DrainValve,   ST_ACT_EQ,  1,     ST_ACT_ENTR);	// In DrainState, set VarIdx4 to 1 to open DrainValve
  STVELPLAN_addCfgAct(stObj->velPlanHandle, WASHER_DRAIN,   ST_COND_NC, 0,        0,        WASHER_DrainValve,   ST_ACT_EQ,  0,     ST_ACT_EXIT);	// In DrainState, set VarIdx4 to 0 to close DrainValve when DrainSensor = 1
}


void ST_runVelPlan(ST_Handle handle, CTRL_Handle ctrlHandle)
{

    _iq speedFeedback;
    ST_Obj *stObj = (ST_Obj *)handle;
    CTRL_Obj *ctrlObj = (CTRL_Obj *)ctrlHandle;

    // Get the mechanical speed in pu
    speedFeedback = EST_getFm_pu(ctrlObj->estHandle);

	// SpinTAC Velocity Plan
	if(gVelPlanRunFlag == ST_PLAN_STOP && gMotorVars.SpinTAC.VelPlanRun == ST_PLAN_START) {
		if(gMotorVars.SpeedRef_krpm != 0) {
			gMotorVars.SpeedRef_krpm = 0;
		}
		if(_IQabs(speedFeedback) < _IQ(ST_MIN_ID_SPEED_PU)) {
			if(STVELPLAN_getErrorID(stObj->velPlanHandle) != false) {
				STVELPLAN_setEnable(stObj->velPlanHandle, false);
				STVELPLAN_setReset(stObj->velPlanHandle, true);
				gMotorVars.SpinTAC.VelPlanRun = gVelPlanRunFlag;
			}
			else {
				STVELPLAN_setEnable(stObj->velPlanHandle, true);
				STVELPLAN_setReset(stObj->velPlanHandle, false);
				gVelPlanRunFlag = gMotorVars.SpinTAC.VelPlanRun;
			}
		}
	}
	if(gMotorVars.SpinTAC.VelPlanRun == ST_PLAN_STOP) {
		STVELPLAN_setReset(stObj->velPlanHandle, true);
		gVelPlanRunFlag = gMotorVars.SpinTAC.VelPlanRun;
	}
	if(gVelPlanRunFlag == ST_PLAN_START && gMotorVars.SpinTAC.VelPlanRun == ST_PLAN_PAUSE) {
		STVELPLAN_setEnable(stObj->velPlanHandle, false);
		gVelPlanRunFlag = gMotorVars.SpinTAC.VelPlanRun;
	}
	if(gVelPlanRunFlag == ST_PLAN_PAUSE && gMotorVars.SpinTAC.VelPlanRun == ST_PLAN_START) {
		STVELPLAN_setEnable(stObj->velPlanHandle, true);
		gVelPlanRunFlag = gMotorVars.SpinTAC.VelPlanRun;
	}

	// Run SpinTAC Velocity Plan
	STVELPLAN_run(stObj->velPlanHandle);

	// Update the global variable for the SpinTAC Plan State
	gWasherState = (WASHER_State_e)STVELPLAN_getCurrentState(stObj->velPlanHandle);

	// Update sensor values for SpinTAC Plan
	// Get values for washer valve components
	STVELPLAN_getVar(stObj->velPlanHandle, WASHER_FillValve, &gVelPanVar[WASHER_FillValve]);
	STVELPLAN_getVar(stObj->velPlanHandle, WASHER_DrainValve, &gVelPanVar[WASHER_DrainValve]);
	if(gVelPanVar[WASHER_FillValve] == true) {
		// if fill valve is open, increase water level
		gWaterLevel += 1;
	}
	else if(gVelPanVar[WASHER_DrainValve] == true) {
		// if drain valve is open, decrease water level
		gWaterLevel -= 1;
	}
	if(gWaterLevel >= WASHER_MAX_WATER_LEVEL) {
		// if water level is greater than maximum, set fill sensor to true
		gWaterLevel = WASHER_MAX_WATER_LEVEL;
		gVelPanVar[WASHER_FillSensor] = true;
	}
	else {
		// if water level is less than maximum, set fill sensor to false
		gVelPanVar[WASHER_FillSensor] = false;
	}
	if(gWaterLevel <= WASHER_MIN_WATER_LEVEL) {
		// if water level is less than zero, force water level to minimum & set drain sensor to true
		gWaterLevel = WASHER_MIN_WATER_LEVEL;
		gVelPanVar[WASHER_DrainSensor] = true;
	}
	else {
		// if the water level is greater than minimum, set drain sensor to false
		gVelPanVar[WASHER_DrainSensor] = false;
	}
	// Set values for washer sensor components
	STVELPLAN_setVar(stObj->velPlanHandle, WASHER_FillSensor, gVelPanVar[WASHER_FillSensor]);
	STVELPLAN_setVar(stObj->velPlanHandle, WASHER_DrainSensor, gVelPanVar[WASHER_DrainSensor]);

	if(STVELPLAN_getStatus(stObj->velPlanHandle) != ST_PLAN_IDLE) {
		// Send the profile configuration to SpinTAC Velocity Profile Generator
		gMotorVars.SpeedRef_krpm = _IQmpy(STVELPLAN_getVelocitySetpoint(stObj->velPlanHandle), _IQ(ST_SPEED_KRPM_PER_PU));
		gMotorVars.MaxAccel_krpmps = _IQmpy(STVELPLAN_getAccelerationLimit(stObj->velPlanHandle), _IQ(ST_SPEED_KRPM_PER_PU));
		gMotorVars.MaxJrk_krpmps2 = _IQ20mpy(STVELPLAN_getJerkLimit(stObj->velPlanHandle), _IQ20(ST_SPEED_KRPM_PER_PU));
	}
	else
	{
		if(gVelPlanRunFlag == ST_PLAN_START && gMotorVars.SpinTAC.VelPlanRun == ST_PLAN_START) {
			gMotorVars.SpinTAC.VelPlanRun = ST_PLAN_STOP;
			gVelPlanRunFlag = gMotorVars.SpinTAC.VelPlanRun;
			gMotorVars.SpeedRef_krpm = gMotorVars.StopSpeedRef_krpm;
		}
	}
}


void ST_runVelMove(ST_Handle handle, CTRL_Handle ctrlHandle)
{

    ST_Obj *stObj = (ST_Obj *)handle;
    CTRL_Obj *ctrlObj = (CTRL_Obj *)ctrlHandle;

	// Run SpinTAC Move
	// If we are not in reset, and the SpeedRef_krpm has been modified
	if((EST_getState(ctrlObj->estHandle) == EST_State_OnLine) && (_IQmpy(gMotorVars.SpeedRef_krpm, _IQ(ST_SPEED_PU_PER_KRPM)) != STVELMOVE_getVelocityEnd(stObj->velMoveHandle))) {
		// Get the configuration for SpinTAC Move
		STVELMOVE_setCurveType(stObj->velMoveHandle, gMotorVars.SpinTAC.VelMoveCurveType);
		STVELMOVE_setVelocityEnd(stObj->velMoveHandle, _IQmpy(gMotorVars.SpeedRef_krpm, _IQ(ST_SPEED_PU_PER_KRPM)));
		STVELMOVE_setAccelerationLimit(stObj->velMoveHandle, _IQmpy(gMotorVars.MaxAccel_krpmps, _IQ(ST_SPEED_PU_PER_KRPM)));
		STVELMOVE_setJerkLimit(stObj->velMoveHandle, _IQ20mpy(gMotorVars.MaxJrk_krpmps2, _IQ20(ST_SPEED_PU_PER_KRPM)));
		// Enable SpinTAC Move
		STVELMOVE_setEnable(stObj->velMoveHandle, true);
		// If starting from zero speed, enable ForceAngle, otherwise disable ForceAngle
		if(_IQabs(STVELMOVE_getVelocityStart(stObj->velMoveHandle)) < _IQ(ST_MIN_ID_SPEED_PU)) {
			EST_setFlag_enableForceAngle(ctrlObj->estHandle, true);
			gMotorVars.Flag_enableForceAngle = true;
		}
		else {
			EST_setFlag_enableForceAngle(ctrlObj->estHandle, false);
			gMotorVars.Flag_enableForceAngle = false;
		}
	}
	STVELMOVE_run(stObj->velMoveHandle);
}


void ST_runVelCtl(ST_Handle handle, CTRL_Handle ctrlHandle)
{

    _iq speedFeedback, iqReference;
    ST_Obj *stObj = (ST_Obj *)handle;
    CTRL_Obj *ctrlObj = (CTRL_Obj *)ctrlHandle;

    // Get the mechanical speed in pu
    speedFeedback = EST_getFm_pu(ctrlObj->estHandle);

    // Run the SpinTAC Controller
	STVELCTL_setVelocityReference(stObj->velCtlHandle, STVELMOVE_getVelocityReference(stObj->velMoveHandle));
	STVELCTL_setAccelerationReference(stObj->velCtlHandle, STVELMOVE_getAccelerationReference(stObj->velMoveHandle));
	STVELCTL_setVelocityFeedback(stObj->velCtlHandle, speedFeedback);
	STVELCTL_run(stObj->velCtlHandle);

	// select SpinTAC Velocity Controller
	iqReference = STVELCTL_getTorqueReference(stObj->velCtlHandle);

	// Set the Iq reference that came out of SpinTAC Velocity Control
	CTRL_setIq_ref_pu(ctrlHandle, iqReference);
}


//@} //defgroup
// end of file
