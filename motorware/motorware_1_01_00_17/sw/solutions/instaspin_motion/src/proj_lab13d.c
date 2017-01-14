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
//! \file   solutions/instaspin_motion/src/proj_lab13d.c
//! \brief  Motion Sequence Real World Example: Vending Machine
//!
//! (C) Copyright 2012, LineStream Technologies, Inc.
//! (C) Copyright 2011, Texas Instruments, Inc.

//! \defgroup PROJ_LAB13D PROJ_LAB13D
//@{

//! \defgroup PROJ_LAB13D_OVERVIEW Project Overview
//!
//! Motion Sequence Real World Example: Vending Machine
//!

// **************************************************************************
// the includes

// system includes
#include <math.h>
#include "main_position.h"

#ifdef FLASH
#pragma CODE_SECTION(mainISR,"ramfuncs");
#endif

// Include header files used in the main function


// **************************************************************************
// the defines

#define LED_BLINK_FREQ_Hz   5

#define VEND_INITIAL_INVENTORY 10


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

ENC_Handle encHandle;
ENC_Obj enc;

SLIP_Handle slipHandle;
SLIP_Obj slip;

ST_Obj st_obj;
ST_Handle stHandle;

// Used to handle controlling SpinTAC Plan
ST_PlanButton_e gPosPlanRunFlag = ST_PLAN_STOP;

// Enumerates the States in the Vending Machine Example
typedef enum
{
  VEND_INIT = 0,
  VEND_ITEM0,
  VEND_ITEM1,
  VEND_ITEM2,
  VEND_ITEM3,
  NUM_VEND_STATES	// Used to represent the number of States in this configuration
} VEND_State_e;

// Enumerates the Transitions in the Vending Machine Example
typedef enum
{
  VEND_INITto2 = 0,
  VEND_0toINIT,
  VEND_0to1,
  VEND_1to2,
  VEND_2to3,
  VEND_3to0,
  NUM_VEND_TRANS // Used to represent the number of Transitions in this configuration
} VEND_Trans_e;

// Enumerates the Variables in the Vending Machine Example
typedef enum
{
  VEND_Fwd = 0,
  VEND_Item0Inv,
  VEND_Item1Inv,
  VEND_Item2Inv,
  VEND_Item3Inv,
  VEND_TotalInv,
  NUM_VEND_VARS // Used to represent the number of Transitions in this configuration
} VEND_Var_e;

// Enumerates the Conditions in the Vending Machine Example
typedef enum
{
  VEND_FwdPressed = 0,
  VEND_Item0InvEmpty,
  VEND_Item1InvEmpty,
  VEND_Item2InvEmpty,
  VEND_Item3InvEmpty,
  VEND_InvEmpty,
  NUM_VEND_CONDS // Used to represent the number of Conditions in this configuration
} VEND_Cond_e;

// Enumerates the Actions in the Vending Machine Example
typedef enum
{
  VEND_ClearFwdItem0 = 0,
  VEND_ClearFwdItem1,
  VEND_ClearFwdItem2,
  VEND_ClearFwdItem3,
  NUM_VEND_ACTS // Used to represent the number of Actions in this configuration
} VEND_Acts_e;

// Calculates the amount of memory required for the SpinTAC Position Plan configuration
// This is based on the above enumerations
#define ST_POSPLAN_CFG_ARRAY_DWORDS (   (ST_POS_PLAN_ACT_DWORDS   * NUM_VEND_ACTS)  + \
                                        (ST_POS_PLAN_COND_DWORDS  * NUM_VEND_CONDS) + \
                                        (ST_POS_PLAN_VAR_DWORDS   * NUM_VEND_VARS)  + \
                                        (ST_POS_PLAN_TRAN_DWORDS  * NUM_VEND_TRANS) + \
                                        (ST_POS_PLAN_STATE_DWORDS * NUM_VEND_STATES))

// Used to store the configuration of SpinTAC Position Plan
uint32_t stPosPlanCfgArray[ST_POSPLAN_CFG_ARRAY_DWORDS];

// Variable to display current Plan State
VEND_State_e gVendState = VEND_INIT;

// Variables to interface with Vending Machine Plan
_iq gVendFwdButton = 0;
_iq gVendSelectButton = 0;
uint16_t gVendInventory[4] = {VEND_INITIAL_INVENTORY, VEND_INITIAL_INVENTORY, VEND_INITIAL_INVENTORY, VEND_INITIAL_INVENTORY};
VEND_State_e gVendAvailableItem = VEND_ITEM0;

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


  // initialize the ENC module
  encHandle = ENC_init(&enc, sizeof(enc));


  // setup the ENC module
  ENC_setup(encHandle, 1, USER_MOTOR_NUM_POLE_PAIRS, USER_MOTOR_ENCODER_LINES, 0, USER_IQ_FULL_SCALE_FREQ_Hz, USER_ISR_FREQ_Hz, 8000.0);


  // initialize the SLIP module
  slipHandle = SLIP_init(&slip, sizeof(slip));


  // setup the SLIP module
  SLIP_setup(slipHandle, _IQ(gUserParams.ctrlPeriod_sec));


  // initialize the SpinTAC Components
  stHandle = ST_init(&st_obj, sizeof(st_obj));
  
  
  // setup the SpinTAC Components
  ST_setupPosConv(stHandle);
  ST_setupPosCtl(stHandle);
  ST_setupPosMove(stHandle);
  ST_setupPosPlan(stHandle);

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
            CTRL_setSpd_ref_krpm(ctrlHandle,STPOSMOVE_getVelocityReference(stObj->posMoveHandle));

            // set the speed acceleration
            CTRL_setMaxAccel_pu(ctrlHandle,_IQmpy(MAX_ACCEL_KRPMPS_SF,gMotorVars.MaxAccel_krpmps));

            // enable the SpinTAC Position Controller
            STPOSCTL_setEnable(stObj->posCtlHandle, true);

            if(EST_getState(obj->estHandle) != EST_State_OnLine)
            {
            	// if the system is not running, disable SpinTAC Position Controller
        	    STPOSCTL_setEnable(stObj->posCtlHandle, false);
			    // If motor is not running, feed the position feedback into SpinTAC Position Move
				STPOSMOVE_setPositionStart_mrev(stObj->posMoveHandle, STPOSCONV_getPosition_mrev(stObj->posConvHandle));
            }

            if(Flag_Latch_softwareUpdate)
            {
              Flag_Latch_softwareUpdate = false;

              USER_calcPIgains(ctrlHandle);
			  
              // initialize the watch window kp and ki current values with pre-calculated values
              gMotorVars.Kp_Idq = CTRL_getKp(ctrlHandle,CTRL_Type_PID_Id);
              gMotorVars.Ki_Idq = CTRL_getKi(ctrlHandle,CTRL_Type_PID_Id);


			  // initialize the watch window Bw value with the default value
              gMotorVars.SpinTAC.PosCtlBw_radps = STPOSCTL_getBandwidth_radps(stObj->posCtlHandle);

              // initialize the watch window with maximum and minimum Iq reference
              gMotorVars.SpinTAC.PosCtlOutputMax_A = _IQmpy(STPOSCTL_getOutputMaximum(stObj->posCtlHandle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A));
              gMotorVars.SpinTAC.PosCtlOutputMin_A = _IQmpy(STPOSCTL_getOutputMinimum(stObj->posCtlHandle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A));
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
        STPOSCTL_setBandwidth_radps(stObj->posCtlHandle, gMotorVars.SpinTAC.PosCtlBw_radps);

        // set the maximum and minimum values for Iq reference
        STPOSCTL_setOutputMaximums(stObj->posCtlHandle, _IQmpy(gMotorVars.SpinTAC.PosCtlOutputMax_A, _IQ(1.0/USER_IQ_FULL_SCALE_CURRENT_A)), _IQmpy(gMotorVars.SpinTAC.PosCtlOutputMin_A, _IQ(1.0/USER_IQ_FULL_SCALE_CURRENT_A)));

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
    ST_setupPosConv(stHandle);
    ST_setupPosCtl(stHandle);
    ST_setupPosMove(stHandle);
	ST_setupPosPlan(stHandle);

  } // end of for(;;) loop

} // end of main() function


interrupt void mainISR(void)
{

  static uint16_t stCnt = 0;
  CTRL_Obj *obj = (CTRL_Obj *)ctrlHandle;

  // toggle status LED
  if(gLEDcnt++ > (uint_least32_t)(USER_ISR_FREQ_Hz / LED_BLINK_FREQ_Hz))
  {
    HAL_toggleLed(halHandle,(GPIO_Number_e)HAL_Gpio_LED2);
    gLEDcnt = 0;
  }


  // compute the electrical angle
  ENC_calcElecAngle(encHandle, HAL_getQepPosnCounts(halHandle));


  // acknowledge the ADC interrupt
  HAL_acqAdcInt(halHandle,ADC_IntNumber_1);


  // convert the ADC data
  HAL_readAdcData(halHandle,&gAdcData);


  // Run the SpinTAC Components
  if(stCnt++ >= ISR_TICKS_PER_SPINTAC_TICK) {
	  ST_runPosConv(stHandle, encHandle, ctrlHandle);
	  ST_runPosPlanTick(stHandle);
	  ST_runPosMove(stHandle);
	  ST_runPosCtl(stHandle, ctrlHandle);
	  stCnt = 1;
  }


  if(USER_MOTOR_TYPE == MOTOR_Type_Induction) {
    // update the electrical angle for the SLIP module
    SLIP_setElectricalAngle(slipHandle, ENC_getElecAngle(encHandle));
    // compute the amount of slip
    SLIP_run(slipHandle);


    // run the controller
    CTRL_run(ctrlHandle,halHandle,&gAdcData,&gPwmData,SLIP_getMagneticAngle(slipHandle));
  }
  else {
    // run the controller
    CTRL_run(ctrlHandle,halHandle,&gAdcData,&gPwmData,ENC_getElecAngle(encHandle));
  }

  // write the PWM compare values
  HAL_writePwmData(halHandle,&gPwmData);


  // setup the controller
  CTRL_setup(ctrlHandle);

  // if we are forcing alignment, using the Rs Recalculation, align the eQEP angle with the rotor angle
  if((EST_getState(obj->estHandle) == EST_State_Rs) && (USER_MOTOR_TYPE == MOTOR_Type_Pm))
  {
	  ENC_setZeroOffset(encHandle, (uint32_t)(HAL_getQepPosnMaximum(halHandle) - HAL_getQepPosnCounts(halHandle)));
  }

  return;
} // end of mainISR() function


void updateGlobalVariables_motor(CTRL_Handle handle, ST_Handle sthandle)
{
  uint16_t stPosPlanCfgErrIdx, stPosPlanCfgErrCode;
  uint32_t ProTime_tick, ProTime_mtick;
  CTRL_Obj *obj = (CTRL_Obj *)handle;
  ST_Obj *stObj = (ST_Obj *)sthandle;

  // get the speed estimate
  gMotorVars.Speed_krpm = _IQmpy(STPOSCONV_getVelocityFiltered(stObj->posConvHandle), _IQ(ST_SPEED_KRPM_PER_PU));

  // get the position error
  gMotorVars.PositionError_MRev = STPOSCTL_getPositionError_mrev(stObj->posCtlHandle);

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

  // get the Iq reference from the position controller
  gMotorVars.IqRef_A = _IQmpy(STPOSCTL_getTorqueReference(stObj->posCtlHandle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A));

  // gets the Position Controller status
  gMotorVars.SpinTAC.PosCtlStatus = STPOSCTL_getStatus(stObj->posCtlHandle);
	
  // get the inertia setting
  gMotorVars.SpinTAC.InertiaEstimate_Aperkrpm = _IQmpy(STPOSCTL_getInertia(stObj->posCtlHandle), _IQ(ST_SPEED_PU_PER_KRPM * USER_IQ_FULL_SCALE_CURRENT_A));

  // get the friction setting
  gMotorVars.SpinTAC.FrictionEstimate_Aperkrpm = _IQmpy(STPOSCTL_getFriction(stObj->posCtlHandle), _IQ(ST_SPEED_PU_PER_KRPM * USER_IQ_FULL_SCALE_CURRENT_A));

  // get the Position Controller error
  gMotorVars.SpinTAC.PosCtlErrorID = STPOSCTL_getErrorID(stObj->posCtlHandle);

  // get the Position Move status
  gMotorVars.SpinTAC.PosMoveStatus = STPOSMOVE_getStatus(stObj->posMoveHandle);

  // get the Position Move profile time
  STPOSMOVE_getProfileTime_tick(stObj->posMoveHandle, &ProTime_tick, &ProTime_mtick);
  gMotorVars.SpinTAC.PosMoveTime_ticks = ProTime_tick;
  gMotorVars.SpinTAC.PosMoveTime_mticks = ProTime_mtick;

  // get the Position Move error
  gMotorVars.SpinTAC.PosMoveErrorID = STPOSMOVE_getErrorID(stObj->posMoveHandle);
  
  // get the Position Plan status
  gMotorVars.SpinTAC.PosPlanStatus = STPOSPLAN_getStatus(stObj->posPlanHandle);

  // get the Position Plan error
  gMotorVars.SpinTAC.PosPlanErrorID = STPOSPLAN_getCfgError(stObj->posPlanHandle, &stPosPlanCfgErrIdx, &stPosPlanCfgErrCode);
  gMotorVars.SpinTAC.PosPlanCfgErrorIdx = stPosPlanCfgErrIdx;
  gMotorVars.SpinTAC.PosPlanCfgErrorCode = stPosPlanCfgErrCode;
  
  // get the Position Converter error
  gMotorVars.SpinTAC.PosConvErrorID = STPOSCONV_getErrorID(stObj->posConvHandle);

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


void ST_setupPosPlan(ST_Handle handle) {

  _iq velMax, accMax, jrkMax;
  _iq velLim, accLim, decLim, jrkLim;
  ST_Obj *stObj = (ST_Obj *)handle;

  // Pass the configuration array pointer into SpinTAC Position Plan
  STPOSPLAN_setCfgArray(stObj->posPlanHandle, &stPosPlanCfgArray[0], sizeof(stPosPlanCfgArray), NUM_VEND_ACTS, NUM_VEND_CONDS, NUM_VEND_VARS, NUM_VEND_TRANS, NUM_VEND_STATES);

  // Establish the Velocity, Acceleration, Deceleration, and Jerk Maximums
  velMax = _IQ24(USER_MOTOR_MAX_SPEED_KRPM * ST_SPEED_PU_PER_KRPM);
  accMax = _IQ24(10.0);
  jrkMax = _IQ20(62.5);

  // Establish the Velocity, Acceleration, Deceleration, and Jerk Limits
  velLim = _IQ(0.1 * ST_SPEED_PU_PER_KRPM);
  accLim = _IQ(0.5 * ST_SPEED_PU_PER_KRPM);
  decLim = _IQ(0.5 * ST_SPEED_PU_PER_KRPM);
  jrkLim = _IQ(1.0 * ST_SPEED_PU_PER_KRPM);

  // Configure SpinTAC Position Plan: Sample Time, LoopENB
  STPOSPLAN_setCfg(stObj->posPlanHandle, _IQ(ST_SAMPLE_TIME), false);
  // Configure halt state: PosStep[MRev], PosStepFrac[MRev], VelEnd, AccMax, JrkMax, Timer
  STPOSPLAN_setCfgHaltState(stObj->posPlanHandle, 0, 0, velMax, accMax, jrkMax, 1000L);

  //Example: STPOSPLAN_addCfgState(handle,    PosStepInt[MRev], PosStepFrac[MRev], StateTimer[ticks]);
  STPOSPLAN_addCfgState(stObj->posPlanHandle, 0,                0,                 200L); // StateIdx0: A
  STPOSPLAN_addCfgState(stObj->posPlanHandle, 0,                _IQ(0.25),         200L); // StateIdx1: Item0
  STPOSPLAN_addCfgState(stObj->posPlanHandle, 0,                _IQ(0.25),         200L); // StateIdx2: Item1
  STPOSPLAN_addCfgState(stObj->posPlanHandle, 0,                _IQ(0.25),         200L); // StateIdx3: Item2
  STPOSPLAN_addCfgState(stObj->posPlanHandle, 0,                _IQ(0.25),         200L); // StateIdx4: Item3

  //Example: STPOSPLAN_addCfgVar(handle,    VarType,      InitialValue);
  STPOSPLAN_addCfgVar(stObj->posPlanHandle, ST_VAR_INOUT, 0);	                    // VarIdx0: FwdButton
  STPOSPLAN_addCfgVar(stObj->posPlanHandle, ST_VAR_IN,    VEND_INITIAL_INVENTORY);	// VarIdx1: Item0Inv
  STPOSPLAN_addCfgVar(stObj->posPlanHandle, ST_VAR_IN,    VEND_INITIAL_INVENTORY);	// VarIdx2: Item1Inv
  STPOSPLAN_addCfgVar(stObj->posPlanHandle, ST_VAR_IN,    VEND_INITIAL_INVENTORY);	// VarIdx3: Item2Inv
  STPOSPLAN_addCfgVar(stObj->posPlanHandle, ST_VAR_IN,    VEND_INITIAL_INVENTORY);	// VarIdx4: Item3Inv
  STPOSPLAN_addCfgVar(stObj->posPlanHandle, ST_VAR_IN,    40);                      // VarIdx5: TotalInv

  //Example: STPOSPLAN_addCfgCond(handle,    VarIdx,        Comparison,   Value1, Value2)
  STPOSPLAN_addCfgCond(stObj->posPlanHandle, VEND_Fwd,      ST_COMP_EQ,   1,      0); // CondIdx0: Fwd Button Pressed
  STPOSPLAN_addCfgCond(stObj->posPlanHandle, VEND_Item0Inv, ST_COMP_ELW,  0,      0); // CondIdx1: Item0 Empty
  STPOSPLAN_addCfgCond(stObj->posPlanHandle, VEND_Item1Inv, ST_COMP_ELW,  0,      0); // CondIdx2: Item1 Empty
  STPOSPLAN_addCfgCond(stObj->posPlanHandle, VEND_Item2Inv, ST_COMP_ELW,  0,      0); // CondIdx3: Item2 Empty
  STPOSPLAN_addCfgCond(stObj->posPlanHandle, VEND_Item3Inv, ST_COMP_ELW,  0,      0); // CondIdx4: Item3 Empty
  STPOSPLAN_addCfgCond(stObj->posPlanHandle, VEND_TotalInv, ST_COMP_ELW,  0,      0); // CondIdx5: TotalInv Empty

  //Example: STPOSPLAN_addCfgTran(handle,    FromState,  ToState,    CondOption, CondIdx1,        CondIdx2,           VelLim[pups], AccLim[pups2], DecLim[pups2], JrkLim[pups3]);
  // NOTE: The deceleration limit must be set between the following bounds [acceleration limit, 10*acceleration limit]
  STPOSPLAN_addCfgTran(stObj->posPlanHandle, VEND_INIT,  VEND_ITEM1, ST_COND_OR, VEND_FwdPressed, VEND_Item0InvEmpty, velLim,       accLim,        decLim,        jrkLim);	// From Init to Item0
  STPOSPLAN_addCfgTran(stObj->posPlanHandle, VEND_ITEM0, VEND_INIT,  ST_COND_FC, VEND_InvEmpty,   0,                  velLim,       accLim,        decLim,        jrkLim);	// From Item3 to Init
  STPOSPLAN_addCfgTran(stObj->posPlanHandle, VEND_ITEM0, VEND_ITEM1, ST_COND_OR, VEND_FwdPressed, VEND_Item0InvEmpty, velLim,       accLim,        decLim,        jrkLim);	// From Item0 to Item1
  STPOSPLAN_addCfgTran(stObj->posPlanHandle, VEND_ITEM1, VEND_ITEM2, ST_COND_OR, VEND_FwdPressed, VEND_Item1InvEmpty, velLim,       accLim,        decLim,        jrkLim);	// From Item1 to Item2
  STPOSPLAN_addCfgTran(stObj->posPlanHandle, VEND_ITEM2, VEND_ITEM3, ST_COND_OR, VEND_FwdPressed, VEND_Item2InvEmpty, velLim,       accLim,        decLim,        jrkLim);	// From Item2 to Item3
  STPOSPLAN_addCfgTran(stObj->posPlanHandle, VEND_ITEM3, VEND_ITEM0, ST_COND_OR, VEND_FwdPressed, VEND_Item3InvEmpty, velLim,       accLim,        decLim,        jrkLim);	// From Item3 to Item0

  //Example: STPOSPLAN_addCfgAct(handle,    StateIdx,   CondOption, CondIdx1, CondIdx2, VarIdx,   Operation, Value, ActionTriger);
  STPOSPLAN_addCfgAct(stObj->posPlanHandle, VEND_ITEM0, ST_COND_NC, 0,        0,        VEND_Fwd, ST_ACT_EQ, 0,     ST_ACT_ENTR);	// In Item0, clear Fwd Button
  STPOSPLAN_addCfgAct(stObj->posPlanHandle, VEND_ITEM1, ST_COND_NC, 0,        0,        VEND_Fwd, ST_ACT_EQ, 0,     ST_ACT_ENTR);	// In Item1, clear Fwd Button
  STPOSPLAN_addCfgAct(stObj->posPlanHandle, VEND_ITEM2, ST_COND_NC, 0,        0,        VEND_Fwd, ST_ACT_EQ, 0,     ST_ACT_ENTR);	// In Item2, clear Fwd Button
  STPOSPLAN_addCfgAct(stObj->posPlanHandle, VEND_ITEM3, ST_COND_NC, 0,        0,        VEND_Fwd, ST_ACT_EQ, 0,     ST_ACT_ENTR);	// In Item3, clear Fwd Button
}


void ST_runPosConv(ST_Handle handle, ENC_Handle encHandle, CTRL_Handle ctrlHandle)
{
	ST_Obj *stObj = (ST_Obj *)handle;

	// get the electrical angle from the ENC module
    STPOSCONV_setElecAngle_erev(stObj->posConvHandle, ENC_getElecAngle(encHandle));

    if(USER_MOTOR_TYPE ==  MOTOR_Type_Induction) {
      // The CurrentVector feedback is only needed for ACIM
      // get the vector of the direct/quadrature current input vector values from CTRL
      STPOSCONV_setCurrentVector(stObj->posConvHandle, CTRL_getIdq_in_addr(ctrlHandle));
    }

	// run the SpinTAC Position Converter
	STPOSCONV_run(stObj->posConvHandle);

	if(USER_MOTOR_TYPE ==  MOTOR_Type_Induction) {
	  // The Slip Velocity is only needed for ACIM
	  // update the slip velocity in electrical angle per second, Q24
	  SLIP_setSlipVelocity(slipHandle, STPOSCONV_getSlipVelocity(stObj->posConvHandle));
	}
}

void ST_runPosCtl(ST_Handle handle, CTRL_Handle ctrlHandle)
{
	ST_Obj *stObj = (ST_Obj *)handle;

	// provide the updated references to the SpinTAC Position Control
	STPOSCTL_setPositionReference_mrev(stObj->posCtlHandle, STPOSMOVE_getPositionReference_mrev(stObj->posMoveHandle));
	STPOSCTL_setVelocityReference(stObj->posCtlHandle, STPOSMOVE_getVelocityReference(stObj->posMoveHandle));
	STPOSCTL_setAccelerationReference(stObj->posCtlHandle, STPOSMOVE_getAccelerationReference(stObj->posMoveHandle));
	// provide the feedback to the SpinTAC Position Control
	STPOSCTL_setPositionFeedback_mrev(stObj->posCtlHandle, STPOSCONV_getPosition_mrev(stObj->posConvHandle));

	// Run SpinTAC Position Control
	STPOSCTL_run(stObj->posCtlHandle);
	
	// Provide SpinTAC Position Control Torque Output to the FOC
	CTRL_setIq_ref_pu(ctrlHandle, STPOSCTL_getTorqueReference(stObj->posCtlHandle));
}

void ST_runPosMove(ST_Handle handle)
{
	ST_Obj *stObj = (ST_Obj *)handle;

	// Run SpinTAC Position Profile Generator
	// If we are not running a profile, and command indicates we should has been modified
	if((STPOSMOVE_getStatus(stObj->posMoveHandle) == ST_MOVE_IDLE) && (gMotorVars.RunPositionProfile == true)) {
		// Get the configuration for SpinTAC Position Move
		STPOSMOVE_setCurveType(stObj->posMoveHandle, gMotorVars.SpinTAC.PosMoveCurveType);
		STPOSMOVE_setPositionStep_mrev(stObj->posMoveHandle, gMotorVars.PosStepInt_MRev,  gMotorVars.PosStepFrac_MRev);
		STPOSMOVE_setVelocityLimit(stObj->posMoveHandle, _IQmpy(gMotorVars.MaxVel_krpm, _IQ(ST_SPEED_PU_PER_KRPM)));
		STPOSMOVE_setAccelerationLimit(stObj->posMoveHandle, _IQmpy(gMotorVars.MaxAccel_krpmps, _IQ(ST_SPEED_PU_PER_KRPM)));
		STPOSMOVE_setDecelerationLimit(stObj->posMoveHandle, _IQmpy(gMotorVars.MaxDecel_krpmps, _IQ(ST_SPEED_PU_PER_KRPM)));
		STPOSMOVE_setJerkLimit(stObj->posMoveHandle, _IQ20mpy(gMotorVars.MaxJrk_krpmps2, _IQ20(ST_SPEED_PU_PER_KRPM)));
		// Enable the SpinTAC Position Profile Generator
		STPOSMOVE_setEnable(stObj->posMoveHandle, true);
		// clear the position step command
		gMotorVars.PosStepInt_MRev = 0;
		gMotorVars.PosStepFrac_MRev = 0;
		gMotorVars.RunPositionProfile = false;
	}

	STPOSMOVE_run(stObj->posMoveHandle);
}


void ST_runPosPlan(ST_Handle handle)
{
    ST_Obj *stObj = (ST_Obj *)handle;

	// SpinTAC Position Plan
	if(gPosPlanRunFlag == ST_PLAN_STOP && gMotorVars.SpinTAC.PosPlanRun == ST_PLAN_START) {
		if(STPOSMOVE_getStatus(stObj->posMoveHandle) == ST_MOVE_IDLE) {
			if(STPOSPLAN_getErrorID(stObj->posPlanHandle) != false) {
				STPOSPLAN_setEnable(stObj->posPlanHandle, false);
				STPOSPLAN_setReset(stObj->posPlanHandle, true);
				gMotorVars.SpinTAC.PosPlanRun = gPosPlanRunFlag;
			}
			else {
				STPOSPLAN_setEnable(stObj->posPlanHandle, true);
				STPOSPLAN_setReset(stObj->posPlanHandle, false);
				gPosPlanRunFlag = gMotorVars.SpinTAC.PosPlanRun;
			}
		}
	}
	if(gMotorVars.SpinTAC.PosPlanRun == ST_PLAN_STOP) {
		STPOSPLAN_setReset(stObj->posPlanHandle, true);
		STPOSMOVE_setEnable(stObj->posMoveHandle, false);
		gPosPlanRunFlag = gMotorVars.SpinTAC.PosPlanRun;
	}
	if(gPosPlanRunFlag == ST_PLAN_START && gMotorVars.SpinTAC.PosPlanRun == ST_PLAN_PAUSE) {
		STPOSPLAN_setEnable(stObj->posPlanHandle, false);
		STPOSMOVE_setEnable(stObj->posMoveHandle, false);
		gPosPlanRunFlag = gMotorVars.SpinTAC.PosPlanRun;
	}
	if(gPosPlanRunFlag == ST_PLAN_PAUSE && gMotorVars.SpinTAC.PosPlanRun == ST_PLAN_START) {
		STPOSPLAN_setEnable(stObj->posPlanHandle, true);
		gPosPlanRunFlag = gMotorVars.SpinTAC.PosPlanRun;
	}

	// if we have selected an item from the machine
	if(gVendSelectButton == 1) {
		if(STPOSPLAN_getStatus(stObj->posPlanHandle) != ST_PLAN_IDLE) {
			// decrease our inventory
			gVendInventory[gVendAvailableItem - 1]--;
		}
		// toggle the select button off
		gVendSelectButton = 0;
	}

	// Update variables passed into Plan
	STPOSPLAN_setVar(stObj->posPlanHandle, VEND_Fwd, gVendFwdButton);
	STPOSPLAN_setVar(stObj->posPlanHandle, VEND_Item0Inv, gVendInventory[VEND_ITEM0 - 1]);
	STPOSPLAN_setVar(stObj->posPlanHandle, VEND_Item1Inv, gVendInventory[VEND_ITEM1 - 1]);
	STPOSPLAN_setVar(stObj->posPlanHandle, VEND_Item2Inv, gVendInventory[VEND_ITEM2 - 1]);
	STPOSPLAN_setVar(stObj->posPlanHandle, VEND_Item3Inv, gVendInventory[VEND_ITEM3 - 1]);
	STPOSPLAN_setVar(stObj->posPlanHandle, VEND_TotalInv, gVendInventory[0] + gVendInventory[1] + gVendInventory[2] + gVendInventory[3]);

	// Run SpinTAC Position Plan
	STPOSPLAN_run(stObj->posPlanHandle);

	// display the selected item
	if(STPOSPLAN_getCurrentState(stObj->posPlanHandle) > 0) {
		gVendAvailableItem = (VEND_State_e)STPOSPLAN_getCurrentState(stObj->posPlanHandle);
	}
	else
	{
		gVendAvailableItem = VEND_ITEM0;
	}
	
	// get the current state of Plan
	gVendState = (VEND_State_e)STPOSPLAN_getCurrentState(stObj->posPlanHandle);

	// Update variables passed out of Plan
	if(STPOSPLAN_getFsmState(stObj->posPlanHandle) == ST_FSM_STATE_STAY)
	{
		STPOSPLAN_getVar(stObj->posPlanHandle, VEND_Fwd, &gVendFwdButton);
	}

	if(STPOSPLAN_getStatus(stObj->posPlanHandle) != ST_PLAN_IDLE) {
		// Send the profile configuration to SpinTAC Position Move
		STPOSPLAN_getPositionStep_mrev(stObj->posPlanHandle, (_iq24 *)&gMotorVars.PosStepInt_MRev, (_iq24 *)&gMotorVars.PosStepFrac_MRev);
		gMotorVars.RunPositionProfile = true;
		gMotorVars.MaxVel_krpm = _IQmpy(STPOSPLAN_getVelocityLimit(stObj->posPlanHandle), _IQ(ST_SPEED_KRPM_PER_PU));
		gMotorVars.MaxAccel_krpmps = _IQmpy(STPOSPLAN_getAccelerationLimit(stObj->posPlanHandle), _IQ(ST_SPEED_KRPM_PER_PU));
		gMotorVars.MaxDecel_krpmps = _IQmpy(STPOSPLAN_getDecelerationLimit(stObj->posPlanHandle), _IQ(ST_SPEED_KRPM_PER_PU));
		gMotorVars.MaxJrk_krpmps2 = _IQ20mpy(STPOSPLAN_getJerkLimit(stObj->posPlanHandle), _IQ20(ST_SPEED_KRPM_PER_PU));
	}
	else
	{
		if(gPosPlanRunFlag == ST_PLAN_START && gMotorVars.SpinTAC.PosPlanRun == ST_PLAN_START) {
			gMotorVars.SpinTAC.PosPlanRun = ST_PLAN_STOP;
			gPosPlanRunFlag = gMotorVars.SpinTAC.PosPlanRun;
		}
	}
}


//@} //defgroup
// end of file
