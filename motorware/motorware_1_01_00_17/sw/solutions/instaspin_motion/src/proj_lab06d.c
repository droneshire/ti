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
//! \file   solutions/instaspin_motion/src/proj_lab06d.c
//! \brief  Design a motion sequence
//!
//! (C) Copyright 2012, LineStream Technologies, Inc.
//! (C) Copyright 2011, Texas Instruments, Inc.

//! \defgroup PROJ_LAB06d PROJ_LAB06d
//@{

//! \defgroup PROJ_LAB06d_OVERVIEW Project Overview
//!
//! Design a motion sequence
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

// State Machine Options for this Project
typedef enum
{
	TEST_PATTERN=0,      // Simple test pattern without conditional transitions
	GROCERY_CONVEYOR,    // Conveyor belt designed to simulate the one at a grocery store
	GARAGE_DOOR          // Garage door simulation
} PLAN_SELECT_e;

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

// Used to select a state machine
PLAN_SELECT_e gSelectedPlan = TEST_PATTERN;

// Used to hold the current configured state machine
PLAN_SELECT_e gConfiguredPlan = TEST_PATTERN;

// Enumerations for Test Pattern State Machine
// Enumerates the States in the Test Pattern Example
typedef enum
{
  TEST_0 = 0,
  TEST_4000,
  TEST_N4000,
  TEST_2000,
  TEST_N2000,
  TEST_1000,
  TEST_N1000,
  TEST_500,
  TEST_N500,
  TEST_250,
  TEST_N250,
  NUM_TEST_STATES // Used to represent the number of States in this configuration
} TEST_State_e;

// Enumerates the Transitions in the Test Pattern Example
typedef enum
{
  TEST_0to4000 = 0,
  TEST_4000toN4000,
  TEST_N4000to2000,
  TEST_2000toN2000,
  TEST_N2000to1000,
  TEST_1000toN1000,
  TEST_N1000to500,
  TEST_500toN500,
  TEST_N500to250,
  TEST_250toN250,
  TEST_N250to0,
  NUM_TEST_TRANS // Used to represent the number of Transitons in this configuration
} TEST_Trans_e;

// Enumerations for Grocery Conveyor State Machine
// Enumerates the States in the Grocery Conveyor Example
typedef enum
{
  GROCERY_Idle = 0,
  GROCERY_Convey,
  NUM_GROCERY_STATES // Used to represent the number of States in this configuration
} GROCERY_State_e;

// Enumerates the Variables in the Grocery Conveyor Example
typedef enum
{
  GROCERY_OnOff = 0,
  GROCERY_ProxSensor,
  NUM_GROCERY_VARS // Used to represent the number of Variables in this configuration
} GROCERY_Vars_e;

// Enumerates the Conditions in the Grocery Conveyor Example
typedef enum
{
  GROCERY_SwitchOn = 0,
  GROCERY_SwitchOff,
  GROCERY_ProxOpen,
  GROCERY_ProxBlocked,
  NUM_GROCERY_CONDS // Used to represent the number of Conditions in this configuration
} GROCERY_Cond_e;

// Enumerates the Transitions in the Grocery Conveyor Example
typedef enum
{
  GROCERY_IdleToConvey = 0,
  GROCERY_ConveyToIdle,
  NUM_GROCERY_TRANS // Used to represent the number of Transitions in this configuration
} GROCERY_Trans_e;

// Enumerations for Garage Door State Machine
// Enumerates the States in the Garage Door Example
typedef enum
{
  GARAGE_Idle = 0,
  GARAGE_Down,
  GARAGE_Up,
  NUM_GARAGE_STATES // Used to represent the number of States in this configuration
} GARAGE_State_e;

// Enumerates the Variables in the Garage Door Example
typedef enum
{
  GARAGE_DownSensor = 0,
  GARAGE_UpSensor,
  GARAGE_Button,
  NUM_GARAGE_VARS // Used to represent the number of Variables in this configuration
} GARAGE_Vars_e;

// Enumerates the Conditions in the Garage Door Example
typedef enum
{
  GARAGE_DoorDown = 0,
  GARAGE_DoorUp,
  GARAGE_ButtonPressed,
  NUM_GARAGE_CONDS // Used to represent the number of Conditions in this configuration
} GARAGE_Cond_e;

// Enumerates the Actions in the Garage Door Example
typedef enum
{
  GARAGE_ClearButtonDown = 0,
  GARAGE_ClearButtonUp,
  GARAGE_ClearDownSensor,
  GARAGE_ClearUpSensor,
  NUM_GARAGE_ACTS // Used to represent the number of Actions in this configuration
} GARAGE_Acts_e;

// Enumerates the Transitions in the Garage Door Example
typedef enum
{
  GARAGE_IdleToDown = 0,
  GARAGE_IdleToUp,
  GARAGE_DownToUp,
  GARAGE_UpToDown,
  GARAGE_DownToIdle,
  GARAGE_UpToIdle,
  NUM_GARAGE_TRANS // Used to represent the number of Transitions in this configuration
} GARAGE_Trans_e;

// Calculates the amount of memory required for the SpinTAC Velocity Plan configuration
#define ST_VELPLAN_CFG_ARRAY_DWORDS (   (ST_VEL_PLAN_ACT_DWORDS     * 5)  + \
                                        (ST_VEL_PLAN_COND_DWORDS    * 5) + \
                                        (ST_VEL_PLAN_VAR_DWORDS     * 5)  + \
                                        (ST_VEL_PLAN_TRAN_DWORDS    * 15) + \
                                        (ST_VEL_PLAN_STATE_DWORDS   * 15))


// Used to store the configuration of SpinTAC Velocity Plan
uint32_t stVelPlanCfgArray[ST_VELPLAN_CFG_ARRAY_DWORDS];

// Used to store the values of SpinTAC Velocity Plan - Test Pattern
TEST_State_e gTestState = TEST_0;

// Used to store the values of SpinTAC Velocity Plan - Grocery Conveyor
GROCERY_State_e gGroceryState = GROCERY_Idle;
_iq gGroceryConveyorOnOff = 0;
_iq gGroceryConveyorProxSensor = 0;

// Used to store the values of SpinTAC Velocity Plan - Garage Door
GARAGE_State_e gGarageState = GARAGE_Idle;
_iq gGarageDoorDown = 1;
_iq gGarageDoorUp = 0;
_iq gGarageDoorButton = 0;

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
void ST_setupVelPlan_TestPattern(ST_Handle sthandle);
void ST_setupVelPlan_GroceryConveyor(ST_Handle sthandle);
void ST_setupVelPlan_GarageDoor(ST_Handle sthandle);

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

  // setup the selected Plan
  switch(gSelectedPlan) {
	  case TEST_PATTERN:
		  ST_setupVelPlan_TestPattern(stHandle);
	  break;
	  case GARAGE_DOOR:
		  ST_setupVelPlan_GarageDoor(stHandle);
	  break;
	  case GROCERY_CONVEYOR:
		  ST_setupVelPlan_GroceryConveyor(stHandle);
	  break;
  }

  // report selected state machine
  gConfiguredPlan = gSelectedPlan;

  
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

        // configure a different Plan if selected
        if((gSelectedPlan != gConfiguredPlan) && (STVELPLAN_getStatus(stObj->velPlanHandle) == ST_PLAN_IDLE))
        {
        	// setup the selected Plan
        	  switch(gSelectedPlan) {
        	  case TEST_PATTERN:
        		  ST_setupVelPlan_TestPattern(stHandle);
        	  break;
        	  case GARAGE_DOOR:
        		  ST_setupVelPlan_GarageDoor(stHandle);
        	  break;
        	  case GROCERY_CONVEYOR:
        		  ST_setupVelPlan_GroceryConveyor(stHandle);
        	  break;
        	  }

        	  // report selected state machine
        	  gConfiguredPlan = gSelectedPlan;
        }

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

            // Run SpinTAC Velocity Plan
            ST_runVelPlan(stHandle, ctrlHandle);

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
    switch(gSelectedPlan) {
	  case TEST_PATTERN:
		  ST_setupVelPlan_TestPattern(stHandle);
	  break;
	  case GARAGE_DOOR:
		  ST_setupVelPlan_GarageDoor(stHandle);
	  break;
	  case GROCERY_CONVEYOR:
		  ST_setupVelPlan_GroceryConveyor(stHandle);
	  break;
	}

	// report selected state machine
	gConfiguredPlan = gSelectedPlan;

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

	ST_Obj *stObj = (ST_Obj *)handle;

	// Pass the configuration array pointer into SpinTAC Velocity Plan
	STVELPLAN_setCfgArray(stObj->velPlanHandle, &stVelPlanCfgArray[0], sizeof(stVelPlanCfgArray), 5, 5, 5, 15, 15);
}


void ST_setupVelPlan_TestPattern(ST_Handle handle) {

  _iq accMax, jrkMax;
  ST_Obj *stObj = (ST_Obj *)handle;

  // Reset the Plan configuration
  STVELPLAN_reset(stObj->velPlanHandle);

  // Establish the Acceleration, and Jerk Maximums
  accMax = _IQ24(10.0);
  jrkMax = _IQ20(62.5);

  // Configure SpinTAC Velocity Plan: Sample Time, LoopENB
  STVELPLAN_setCfg(stObj->velPlanHandle, _IQ(ST_SAMPLE_TIME), false);
  // Configure halt state: VelEnd, AccMax, JrkMax, Timer
  STVELPLAN_setCfgHaltState(stObj->velPlanHandle, 0, accMax, jrkMax, 1000L);

  //Example: STVELPLAN_addCfgState(handle,    VelSetpoint[pups],                 StateTimer[ticks]);
  STVELPLAN_addCfgState(stObj->velPlanHandle, 0,                                 800L); // StateIdx0: IdleState
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(4 * ST_SPEED_PU_PER_KRPM),     800L); // StateIdx1: 4KRPM
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(-4 * ST_SPEED_PU_PER_KRPM),    800L); // StateIdx2: -4KRPM
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(2 * ST_SPEED_PU_PER_KRPM),     800L); // StateIdx3: 2KRPM
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(-2 * ST_SPEED_PU_PER_KRPM),    800L); // StateIdx4: -2KRPM
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(1 * ST_SPEED_PU_PER_KRPM),     800L); // StateIdx5: 1KRPM
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(-1 * ST_SPEED_PU_PER_KRPM),    800L); // StateIdx6: -1KRPM
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(0.5 * ST_SPEED_PU_PER_KRPM),   800L); // StateIdx7: 0.5KRPM
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(-0.5 * ST_SPEED_PU_PER_KRPM),  800L); // StateIdx8: -0.5KRPM
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(0.25 * ST_SPEED_PU_PER_KRPM),  800L); // StateIdx9: 0.25KRPM
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(-0.25 * ST_SPEED_PU_PER_KRPM), 800L); // StateIdx10: -0.25KRPM

  //Example: STVELPLAN_addCfgTran(handle,    FromState,  ToState,    CondOption, CondIdx1, CondiIdx2, AccLim[pups2], JrkLim[pups3]);
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_0,     TEST_4000,  ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From IdleState to 4KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_4000,  TEST_N4000, ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From 4KRPM to -4KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_N4000, TEST_2000,  ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From -4KRPM to 2KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_2000,  TEST_N2000, ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From 2KRPM to -2KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_N2000, TEST_1000,  ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From -2KRPM to 1KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_1000,  TEST_N1000, ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From 1KRPM to -1KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_N1000, TEST_500,   ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From -1KRPM to 0.5KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_500,   TEST_N500,  ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From 0.5KRPM to -0.5KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_N500,  TEST_250,   ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From -0.5KRPM to 0.25KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_250,   TEST_N250,  ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From 0.25KRPM to -0.25KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, TEST_N250,  TEST_0,     ST_COND_NC, 0,        0,        _IQ(0.1),      _IQ20(0.2)); // From -0.25KRPM to 0.125KRPM
  // Note: set CondIdx1 to 0 if CondOption is ST_COND_NC; set CondIdx2 to 0 if DondOption is ST_COND_NC  or ST_COND_FC
}


void ST_setupVelPlan_GroceryConveyor(ST_Handle handle) {

  _iq accMax, jrkMax;
  ST_Obj *stObj = (ST_Obj *)handle;

  // Reset the Plan configuration
  STVELPLAN_reset(stObj->velPlanHandle);

  // Establish the Acceleration, and Jerk Maximums
  accMax = _IQ24(10.0);
  jrkMax = _IQ20(62.5);

  // Configure SpinTAC Velocity Plan: Sample Time, LoopENB
  STVELPLAN_setCfg(stObj->velPlanHandle, _IQ(ST_SAMPLE_TIME), true);
  // Configure halt state: VelEnd, AccMax, JrkMax, Timer
  STVELPLAN_setCfgHaltState(stObj->velPlanHandle, 0, accMax, jrkMax, 1000L);

  //Example: STVELPLAN_addCfgState(handle,    VelSetpoint[pups],                 StateTimer[ticks]);
  STVELPLAN_addCfgState(stObj->velPlanHandle, 0,                                 1L); // StateIdx0: IdleState
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(0.5 * ST_SPEED_PU_PER_KRPM),   1L); // StateIdx1: Conveying

  //Example: STVELPLAN_addCfgVar(handle,    VarType,      InitialValue);
  STVELPLAN_addCfgVar(stObj->velPlanHandle, ST_VAR_IN,    0);	// VarIdx0: OnOff      {0: Off; 1: On}
  STVELPLAN_addCfgVar(stObj->velPlanHandle, ST_VAR_IN,    0);	// VarIdx1: ProxSensor {0: Open; 1: Blocked}

  //Example: STVELPLAN_addCfgCond(handle,    VarIdx,             Comparison,  Value1, Value2)
  STVELPLAN_addCfgCond(stObj->velPlanHandle, GROCERY_OnOff,      ST_COMP_EQ,  1,      0); // CondIdx0: Switch On
  STVELPLAN_addCfgCond(stObj->velPlanHandle, GROCERY_OnOff,      ST_COMP_EQ,  0,      0); // CondIdx1: Switch Off
  STVELPLAN_addCfgCond(stObj->velPlanHandle, GROCERY_ProxSensor, ST_COMP_EQ,  0,      0); // CondIdx2: ProxSensor Open
  STVELPLAN_addCfgCond(stObj->velPlanHandle, GROCERY_ProxSensor, ST_COMP_EQ,  1,      0); // CondIdx3: ProxSensor Blocked

  //Example: STVELPLAN_addCfgTran(handle,    FromState,      ToState,        CondOption,  CondIdx1,          CondiIdx2,           AccLim[pups2], JrkLim[pups3]);
  STVELPLAN_addCfgTran(stObj->velPlanHandle, GROCERY_Idle,   GROCERY_Convey, ST_COND_AND, GROCERY_SwitchOn,  GROCERY_ProxOpen,    _IQ(0.1),      _IQ20(0.2)); // From IdleState to 4KRPM
  STVELPLAN_addCfgTran(stObj->velPlanHandle, GROCERY_Convey, GROCERY_Idle,   ST_COND_OR,  GROCERY_SwitchOff, GROCERY_ProxBlocked, _IQ(0.1),      _IQ20(0.2)); // From 4KRPM to -4KRPM
  // Note: set CondIdx1 to 0 if CondOption is ST_COND_NC; set CondIdx2 to 0 if DondOption is ST_COND_NC  or ST_COND_FC
}


void ST_setupVelPlan_GarageDoor(ST_Handle handle) {

  _iq accMax, jrkMax;
  ST_Obj *stObj = (ST_Obj *)handle;

  // Reset the Plan configuration
  STVELPLAN_reset(stObj->velPlanHandle);

  // Establish the Acceleration, and Jerk Maximums
  accMax = _IQ24(10.0);
  jrkMax = _IQ20(62.5);

  // Configure SpinTAC Velocity Plan: Sample Time, LoopENB
  STVELPLAN_setCfg(stObj->velPlanHandle, _IQ(ST_SAMPLE_TIME), true);
  // Configure halt state: VelEnd, AccMax, JrkMax, Timer
  STVELPLAN_setCfgHaltState(stObj->velPlanHandle, 0, accMax, jrkMax, 1000L);

  //Example: STVELPLAN_addCfgState(handle,    VelSetpoint[pups],                 StateTimer[ticks]);
  STVELPLAN_addCfgState(stObj->velPlanHandle, 0,                                 1L); // StateIdx0: IdleState
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(-1 * ST_SPEED_PU_PER_KRPM),    1L); // StateIdx1: Down
  STVELPLAN_addCfgState(stObj->velPlanHandle, _IQ(1 * ST_SPEED_PU_PER_KRPM),     1L); // StateIdx2: Up

  //Example: STVELPLAN_addCfgVar(handle,    VarType,      InitialValue);
  STVELPLAN_addCfgVar(stObj->velPlanHandle, ST_VAR_INOUT, 1);	// VarIdx0: DoorDown {0: unknown; 1: down}
  STVELPLAN_addCfgVar(stObj->velPlanHandle, ST_VAR_INOUT, 0);	// VarIdx1: DoorUp   {0: unknown; 1: up}
  STVELPLAN_addCfgVar(stObj->velPlanHandle, ST_VAR_INOUT, 0);	// VarIdx2: Button   {0: not pressed; 1: pressed}

  //Example: STVELPLAN_addCfgCond(handle,    VarIdx,            Comparison,  Value1, Value2)
  STVELPLAN_addCfgCond(stObj->velPlanHandle, GARAGE_DownSensor, ST_COMP_EQ,  1,      0); // CondIdx0: Door Down
  STVELPLAN_addCfgCond(stObj->velPlanHandle, GARAGE_UpSensor,   ST_COMP_EQ,  1,      0); // CondIdx1: Door Up
  STVELPLAN_addCfgCond(stObj->velPlanHandle, GARAGE_Button,     ST_COMP_EQ,  1,      0); // CondIdx2: Button Pressed

  //Example: STVELPLAN_addCfgTran(handle,    FromState,   ToState,     CondOption,  CondIdx1,             CondiIdx2,       AccLim[pups2], JrkLim[pups3]);
  STVELPLAN_addCfgTran(stObj->velPlanHandle, GARAGE_Idle, GARAGE_Down, ST_COND_AND, GARAGE_ButtonPressed, GARAGE_DoorUp,   _IQ(0.1),      _IQ20(0.2)); // From IdleState to Down
  STVELPLAN_addCfgTran(stObj->velPlanHandle, GARAGE_Idle, GARAGE_Up,   ST_COND_AND, GARAGE_ButtonPressed, GARAGE_DoorDown, _IQ(0.1),      _IQ20(0.2)); // From IdleState to Up
  STVELPLAN_addCfgTran(stObj->velPlanHandle, GARAGE_Down, GARAGE_Up,   ST_COND_FC,  GARAGE_ButtonPressed, 0,               _IQ(0.1),      _IQ20(0.2)); // From Down to Up
  STVELPLAN_addCfgTran(stObj->velPlanHandle, GARAGE_Up,   GARAGE_Down, ST_COND_FC,  GARAGE_ButtonPressed, 0,               _IQ(0.1),      _IQ20(0.2)); // From Up to Down
  STVELPLAN_addCfgTran(stObj->velPlanHandle, GARAGE_Down, GARAGE_Idle, ST_COND_FC,  GARAGE_DoorDown,      0,               _IQ(0.1),      _IQ20(0.2)); // From Down to IdleState
  STVELPLAN_addCfgTran(stObj->velPlanHandle, GARAGE_Up,   GARAGE_Idle, ST_COND_FC,  GARAGE_DoorUp,        0,               _IQ(0.1),      _IQ20(0.2)); // From Up to IdleState
  // Note: set CondIdx1 to 0 if CondOption is ST_COND_NC; set CondIdx2 to 0 if DondOption is ST_COND_NC  or ST_COND_FC

  //Example: STVELPLAN_addCfgAct(handle,    StateIdx,    CondOption, CondIdx1, CondIdx2, VarIdx,            Operation, Value, ActionTriger);
  STVELPLAN_addCfgAct(stObj->velPlanHandle, GARAGE_Down, ST_COND_NC, 0,        0,        GARAGE_Button,     ST_ACT_EQ, 0,     ST_ACT_ENTR);	// Set button value to zero after beginning motion
  STVELPLAN_addCfgAct(stObj->velPlanHandle, GARAGE_Up,   ST_COND_NC, 0,        0,        GARAGE_Button,     ST_ACT_EQ, 0,     ST_ACT_ENTR);	// Set button value to zero after beginning motion
  STVELPLAN_addCfgAct(stObj->velPlanHandle, GARAGE_Down, ST_COND_NC, 0,        0,        GARAGE_UpSensor,   ST_ACT_EQ, 0,     ST_ACT_ENTR);	// Set up sensor to zero after beginning up motion
  STVELPLAN_addCfgAct(stObj->velPlanHandle, GARAGE_Up,   ST_COND_NC, 0,        0,        GARAGE_DownSensor, ST_ACT_EQ, 0,     ST_ACT_ENTR);	// Set up sensor to zero after beginning down motion
  STVELPLAN_addCfgAct(stObj->velPlanHandle, GARAGE_Idle, ST_COND_FC, 2,        0,        GARAGE_Button,     ST_ACT_EQ, 10,    ST_ACT_ENTR);	// Set up sensor to zero after beginning down motion
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

	if(gConfiguredPlan == GARAGE_DOOR) {
	    STVELPLAN_setVar(stObj->velPlanHandle, 0, gGarageDoorDown);
	    STVELPLAN_setVar(stObj->velPlanHandle, 1, gGarageDoorUp);
	    STVELPLAN_setVar(stObj->velPlanHandle, 2, gGarageDoorButton);
	}
	else if(gConfiguredPlan == GROCERY_CONVEYOR) {
	    STVELPLAN_setVar(stObj->velPlanHandle, 0, gGroceryConveyorOnOff);
	    STVELPLAN_setVar(stObj->velPlanHandle, 1, gGroceryConveyorProxSensor);
	}

	// Run SpinTAC Velocity Plan
	STVELPLAN_run(stObj->velPlanHandle);

	if(gConfiguredPlan == GARAGE_DOOR) {
		if(STVELPLAN_getFsmState(stObj->velPlanHandle) == ST_FSM_STATE_STAY)
		{
			STVELPLAN_getVar(stObj->velPlanHandle, 0, &gGarageDoorDown);
			STVELPLAN_getVar(stObj->velPlanHandle, 1, &gGarageDoorUp);
			STVELPLAN_getVar(stObj->velPlanHandle, 2, &gGarageDoorButton);
		}
	}

	// update the state for each configured plan
	switch(gSelectedPlan) {
	  case TEST_PATTERN:
		  gTestState = (TEST_State_e)STVELPLAN_getCurrentState(stObj->velPlanHandle);
	  break;
	  case GARAGE_DOOR:
		  gGarageState = (GARAGE_State_e)STVELPLAN_getCurrentState(stObj->velPlanHandle);
	  break;
	  case GROCERY_CONVEYOR:
		  gGroceryState = (GROCERY_State_e)STVELPLAN_getCurrentState(stObj->velPlanHandle);
	  break;
	}

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
