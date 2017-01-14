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
//! \file   solutions/instaspin_foc/src/proj_lab10d.c
//! \brief Dual motor project
//!
//! (C) Copyright 2011, Texas Instruments, Inc.

//! \defgroup PROJ_LAB10d PROJ_LAB10d
//@{

//! \defgroup PROJ_LAB10d_OVERVIEW Project Overview
//!
//! Dual Motor Sensorless Velocity Control
//!

// **************************************************************************
// the includes

// system includes
#include <math.h>
#include "main_2motors.h"

#ifdef FLASH
#pragma CODE_SECTION(motor1_ISR,"ramfuncs");
#pragma CODE_SECTION(motor2_ISR,"ramfuncs");
#endif

// Include header files used in the main function


// **************************************************************************
// the defines

#define LED_BLINK_FREQ_Hz   5

#define EST_Number1 		0
#define CTRL_Number1		0


// **************************************************************************
// the globals
CTRL_Handle ctrlHandle[2];

uint_least16_t gCounter_updateGlobals[2] = {0, 0};
uint_least8_t motorNum = 0;
uint_least8_t estNumber[2] = {0, 1};
uint_least8_t ctrlNumber[2] = {0, 1};

bool Flag_Latch_softwareUpdate[2] = {true, true};


#ifdef CSM_ENABLE
#pragma DATA_SECTION(halHandle,"rom_accessed_data");
#endif

HAL_Handle halHandle;

#ifdef CSM_ENABLE
#pragma DATA_SECTION(gUserParams,"rom_accessed_data");
#endif

USER_Params gUserParams[2];

// the pwm voltage values for the three phases.
HAL_PwmData_t gPwmData[2] = {{_IQ(0.0), _IQ(0.0), _IQ(0.0)}, {_IQ(0.0), _IQ(0.0), _IQ(0.0)}};

// the voltage and current adc values for the CTRL controller and the FAST estimator.
HAL_AdcData_t gAdcData[2];

// the PWMDAC variable
HAL_DacData_t gDacData;

_iq gMaxCurrentSlope[2] = {_IQ(0.0), _IQ(0.0)};

#ifdef FAST_ROM_V1p6
CTRL_Obj *controller_obj[2];
#else
#ifdef CSM_ENABLE
#pragma DATA_SECTION(ctrl,"rom_accessed_data");
#endif
CTRL_Obj ctrl[2];				//v1p7 format
#endif

uint16_t gLEDcnt[2] = {0, 0};

// the variables to turn on and adjust InstaSPIN
volatile MOTOR_Vars_t gMotorVars[2] = {MOTOR_Vars_INIT_Mtr1,MOTOR_Vars_INIT_Mtr2};

//
volatile SYSTEM_Vars_t gSystemVars = SYSTEM_Vars_INIT;

#ifdef FLASH
// Used for running BackGround in flash, and ISR in RAM
extern uint16_t *RamfuncsLoadStart, *RamfuncsLoadEnd, *RamfuncsRunStart;

#ifdef CSM_ENABLE
extern uint16_t *econst_start, *econst_end, *econst_ram_load;
extern uint16_t *switch_start, *switch_end, *switch_ram_load;
#endif
#endif

SVGENCURRENT_Obj svgencurrent[2];
SVGENCURRENT_Handle svgencurrentHandle[2];

// set the offset, default value of 1 microsecond
int16_t gCmpOffset[2] = {(int16_t)(1.0 * USER_SYSTEM_FREQ_MHz_M1), (int16_t)(1.0 * USER_SYSTEM_FREQ_MHz_M2)};

MATH_vec3 gIavg[2] = {{_IQ(0.0), _IQ(0.0), _IQ(0.0)}, {_IQ(0.0), _IQ(0.0), _IQ(0.0)}};
uint16_t gIavg_shift[2] = {1, 1};
MATH_vec3 gPwmData_prev[2] = {{_IQ(0.0), _IQ(0.0), _IQ(0.0)}, {_IQ(0.0), _IQ(0.0), _IQ(0.0)}};

#ifdef DRV8301_SPI
// Watch window interface to the 8301 SPI
DRV_SPI_8301_Vars_t gDrvSpi8301Vars[2];
#endif

#ifdef DRV8305_SPI
// Watch window interface to the 8305 SPI
DRV_SPI_8305_Vars_t gDrvSpi8305Vars[2];
#endif

_iq gFlux_pu_to_Wb_sf[2];

_iq gFlux_pu_to_VpHz_sf[2];

_iq gTorque_Ls_Id_Iq_pu_to_Nm_sf[2];

_iq gTorque_Flux_Iq_pu_to_Nm_sf[2];

HAL_Handle      halHandle;       	//!< the handle for the hardware abstraction
                                 	 //!< layer for common CPU setup
HAL_Obj         hal;             	//!< the hardware abstraction layer object

#ifdef F2802xF
#pragma DATA_SECTION(halHandleMtr,"rom_accessed_data");
#endif

HAL_Handle_mtr  halHandleMtr[2]; 	//!< the handle for the hardware abstraction
                                 	 //!< layer specific to the motor board.
HAL_Obj_mtr     halMtr[2];       	//!< the hardware abstraction layer object
                                 	 //!< specific to the motor board.

// define Flying Start (FS) variables
FS_Obj fs[2];
FS_Handle fsHandle[2];

// define cpu_time object and handle for CPU usage time calculation
CPU_TIME_Handle  cpu_timeHandle[2];
CPU_TIME_Obj     cpu_time[2];

// **************************************************************************
// the functions

void main(void)
{
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

  // initialize the individual motor hal files
  halHandleMtr[HAL_MTR1] = HAL_init_mtr(&halMtr[HAL_MTR1], sizeof(halMtr[HAL_MTR1]), (HAL_MtrSelect_e)HAL_MTR1);

  // initialize the individual motor hal files
  halHandleMtr[HAL_MTR2] = HAL_init_mtr(&halMtr[HAL_MTR2], sizeof(halMtr[HAL_MTR2]), (HAL_MtrSelect_e)HAL_MTR2);

  // initialize the controller
#ifdef FAST_ROM_V1p6
//  ctrlHandle[HAL_MTR1] = CTRL_initCtrl(CTRL_Number1, EST_Number1);  		//v1p6 format (06xF and 06xM devices)
  ctrlHandle[HAL_MTR1] = CTRL_initCtrl(ctrlNumber[HAL_MTR1], estNumber[HAL_MTR1]);  					//v1p6 format (06xF and 06xM devices)
  ctrlHandle[HAL_MTR2] = CTRL_initCtrl(ctrlNumber[HAL_MTR2], estNumber[HAL_MTR2]);  					//v1p6 format (06xF and 06xM devices)
#else
  ctrlHandle[HAL_MTR1] = CTRL_initCtrl(estNumber[HAL_MTR1], &ctrl[HAL_MTR1], sizeof(ctrl[HAL_MTR1]));	//v1p7 format default
  ctrlHandle[HAL_MTR2] = CTRL_initCtrl(estNumber[HAL_MTR2], &ctrl[HAL_MTR2], sizeof(ctrl[HAL_MTR2]));	//v1p7 format default
#endif

  // Initialize and setup the 100% SVM generator
  svgencurrentHandle[HAL_MTR1] = SVGENCURRENT_init(&svgencurrent[HAL_MTR1],sizeof(svgencurrent[HAL_MTR1]));

  // Initialize and setup the 100% SVM generator
  svgencurrentHandle[HAL_MTR2] = SVGENCURRENT_init(&svgencurrent[HAL_MTR2],sizeof(svgencurrent[HAL_MTR2]));

  // initialize the user parameters
  // This function initializes all values of structure gUserParams with
  // values defined in user.h. The values in gUserParams will be then used by
  // the hardware abstraction layer (HAL) to configure peripherals such as
  // PWM, ADC, interrupts, etc.
  USER_setParamsMtr1(&gUserParams[HAL_MTR1]);
  USER_setParamsMtr2(&gUserParams[HAL_MTR2]);

  //HAL_setParams
  // set the common hardware abstraction layer parameters
  HAL_setParams(halHandle,&gUserParams[HAL_MTR1]);

  #ifdef _SINGLE_ISR_EN_
  // Setup each motor board to its specific setting
  HAL_setParamsDualMtr(halHandleMtr[HAL_MTR1], halHandleMtr[HAL_MTR2], halHandle, &gUserParams[HAL_MTR1], &gUserParams[HAL_MTR2]);
  #else
  // Setup each motor board to its specific setting
  HAL_setParamsMtr(halHandleMtr[HAL_MTR1],halHandle, &gUserParams[HAL_MTR1]);

  // Setup each motor board to its specific setting
  HAL_setParamsMtr(halHandleMtr[HAL_MTR2],halHandle, &gUserParams[HAL_MTR2]);
  #endif

  gMotorVars[0].Flag_enableUserParams = true;
//  gMotorVars[0].Flag_enableUserParams = false;

  gMotorVars[1].Flag_enableUserParams = true;
//  gMotorVars[1].Flag_enableUserParams = false;

  gMotorVars[0].Flag_enableSpeedCtrl = true;
  gMotorVars[1].Flag_enableSpeedCtrl = true;

  for(motorNum=HAL_MTR1;motorNum<=HAL_MTR2;motorNum++)
  {
	  // set the default controller parameters
	  CTRL_setParams(ctrlHandle[motorNum], &gUserParams[motorNum]);

	  // set the default controller parameters (Reset the control to re-identify the motor)
      CTRL_setParams(ctrlHandle[motorNum],&gUserParams[motorNum]);

	  {
		// initialize the CPU usage module
		cpu_timeHandle[motorNum] = CPU_TIME_init(&cpu_time[motorNum],sizeof(cpu_time[motorNum]));
		CPU_TIME_setParams(cpu_timeHandle[motorNum], PWM_getPeriod(halHandleMtr[motorNum]->pwmHandle[0]));
	  }

	  // set overmodulation to maximum value
	  gMotorVars[motorNum].OverModulation = _IQ(MATH_TWO_OVER_THREE);

	  // setup faults
	  HAL_setupFaults(halHandleMtr[motorNum]);

	  // enable DC bus compensation
	  CTRL_setFlag_enableDcBusComp(ctrlHandle[motorNum], true);

	  // compute scaling factors for flux and torque calculations
	  gFlux_pu_to_Wb_sf[motorNum] = USER_computeFlux_pu_to_Wb_sf(&gUserParams[motorNum]);
	  gFlux_pu_to_VpHz_sf[motorNum] = USER_computeFlux_pu_to_VpHz_sf(&gUserParams[motorNum]);
	  gTorque_Ls_Id_Iq_pu_to_Nm_sf[motorNum] = USER_computeTorque_Ls_Id_Iq_pu_to_Nm_sf(&gUserParams[motorNum]);
	  gTorque_Flux_Iq_pu_to_Nm_sf[motorNum] = USER_computeTorque_Flux_Iq_pu_to_Nm_sf(&gUserParams[motorNum]);

	  gMotorVars[motorNum].current_pu_to_A_sf = _IQ(gUserParams[motorNum].iqFullScaleCurrent_A);
	  gMotorVars[motorNum].voltage_pu_to_kv_sf = _IQ(gUserParams[motorNum].iqFullScaleVoltage_V/(float_t)1000.0);
	  gMotorVars[motorNum].current_A_to_pu_sf = _IQdiv(_IQ(1.0), gMotorVars[motorNum].current_pu_to_A_sf);

	#ifdef DRV8301_SPI
	  // turn on the DRV8301 if present
	  HAL_enableDrv(halHandleMtr[motorNum]);
	  // initialize the DRV8301 interface
	  HAL_setupDrvSpi(halHandleMtr[motorNum],&gDrvSpi8301Vars[motorNum]);
	#endif

	#ifdef DRV8305_SPI
	  // turn on the DRV8305 if present
	  HAL_enableDrv(halHandleMtr[motorNum]);
	  // initialize the DRV8305 interface
	  HAL_setupDrvSpi(halHandleMtr[motorNum],&gDrvSpi8305Vars[motorNum]);
	#endif

	  gCounter_updateGlobals[motorNum] = 0;
  }

  // setup svgen current for Motor #1
  {
    float_t minWidth_microseconds_M1 = 2.0;
    uint16_t minWidth_counts = (uint16_t)(minWidth_microseconds_M1 * USER_SYSTEM_FREQ_MHz);
    float_t fdutyLimit = 0.5-(2.0*minWidth_microseconds_M1*USER_PWM_FREQ_kHz_M1*0.001);
    _iq dutyLimit = _IQ(fdutyLimit);

    SVGENCURRENT_setMinWidth(svgencurrentHandle[HAL_MTR1], minWidth_counts);
    SVGENCURRENT_setIgnoreShunt(svgencurrentHandle[HAL_MTR1], use_all);
    SVGENCURRENT_setMode(svgencurrentHandle[HAL_MTR1],all_phase_measurable);
    SVGENCURRENT_setVlimit(svgencurrentHandle[HAL_MTR1],dutyLimit);
  }

  // setup svgen current for Motor #2
  {
    float_t minWidth_microseconds_M2 = 2.0;
    uint16_t minWidth_counts = (uint16_t)(minWidth_microseconds_M2 * USER_SYSTEM_FREQ_MHz);
    float_t fdutyLimit = 0.5-(2.0*minWidth_microseconds_M2*USER_PWM_FREQ_kHz_M2*0.001);
    _iq dutyLimit = _IQ(fdutyLimit);

    SVGENCURRENT_setMinWidth(svgencurrentHandle[HAL_MTR2], minWidth_counts);
    SVGENCURRENT_setIgnoreShunt(svgencurrentHandle[HAL_MTR2], use_all);
    SVGENCURRENT_setMode(svgencurrentHandle[HAL_MTR2],all_phase_measurable);
    SVGENCURRENT_setVlimit(svgencurrentHandle[HAL_MTR2],dutyLimit);
  }

  {
    CTRL_Version version;

    // get the version number
    CTRL_getVersion(ctrlHandle[HAL_MTR1],&version);

    gMotorVars[HAL_MTR1].CtrlVersion = version;
  }

  // set DAC parameters
  HAL_setDacParameters(halHandle, &gDacData);

  // initialize the interrupt vector table
  HAL_initIntVectorTable(halHandle);


  // enable the ADC interrupts
  HAL_enableAdcInts(halHandle);


  // enable global interrupts
  HAL_enableGlobalInts(halHandle);


  // enable debug interrupts
  HAL_enableDebugInt(halHandle);


  // disable the PWM
  HAL_disablePwm(halHandleMtr[HAL_MTR1]);
  HAL_disablePwm(halHandleMtr[HAL_MTR2]);

  gSystemVars.Flag_enableSystem = true;

  // Below two lines code for Flash Testing, need to be commented
//  gSystemVars.Flag_enableSynControl = true;
//  gSystemVars.Flag_enableRun = true;

  for(;;)
  {
    // Waiting for enable system flag to be set
    // Motor 1 Flag_enableSys is the master control.
//    while(!(gMotorVars[HAL_MTR1].Flag_enableSys));
    while(!(gSystemVars.Flag_enableSystem));

    // Enable the Library internal PI.  Iq is referenced by the speed PI now
//    CTRL_setFlag_enableSpeedCtrl(ctrlHandle[HAL_MTR1], true);

    // Enable the Library internal PI.  Iq is referenced by the speed PI now
//    CTRL_setFlag_enableSpeedCtrl(ctrlHandle[HAL_MTR2], true);

    // loop while the enable system flag is true
    // Motor 1 Flag_enableSys is the master control.
//    while(gMotorVars[HAL_MTR1].Flag_enableSys)
    while(gSystemVars.Flag_enableSystem)
    {
		// toggle status LED
		if(gLEDcnt[HAL_MTR1]++ > (uint_least32_t)(USER_ISR_FREQ_Hz_M1 / LED_BLINK_FREQ_Hz))
		{
			HAL_toggleLed(halHandle,(GPIO_Number_e)HAL_Gpio_LED2);
			gLEDcnt[HAL_MTR1] = 0;
		}

		// toggle status LED
		if(gLEDcnt[HAL_MTR2]++ > (uint_least32_t)(USER_ISR_FREQ_Hz_M2 / LED_BLINK_FREQ_Hz))
		{
			HAL_toggleLed(halHandle,(GPIO_Number_e)HAL_Gpio_LED3);
			gLEDcnt[HAL_MTR2] = 0;
		}

    	if(gSystemVars.Flag_enableSynControl == true)
    	{
    		gMotorVars[HAL_MTR1].Flag_Run_Identify = gSystemVars.Flag_enableRun;
    		gMotorVars[HAL_MTR1].SpeedRef_krpm = gSystemVars.SpeedSet_krpm;
    		gMotorVars[HAL_MTR1].MaxAccel_krpmps = gSystemVars.MaxAccelSet_krpmps;

    		gMotorVars[HAL_MTR2].Flag_Run_Identify = gSystemVars.Flag_enableRun;
    		gMotorVars[HAL_MTR2].SpeedRef_krpm = gSystemVars.SpeedSet_krpm;
    		gMotorVars[HAL_MTR2].MaxAccel_krpmps = gSystemVars.MaxAccelSet_krpmps;
    	}

        for(motorNum=HAL_MTR1;motorNum<=HAL_MTR2;motorNum++)
        {
        	CTRL_Obj *obj = (CTRL_Obj *)ctrlHandle[motorNum];

        	// increment counters
        	gCounter_updateGlobals[motorNum]++;

        	if(CTRL_isError(ctrlHandle[motorNum]))
        	{
        		// set the enable controller flag to false
        		CTRL_setFlag_enableCtrl(ctrlHandle[motorNum],false);

        		// set the enable system flag to false
        		gMotorVars[motorNum].Flag_enableSys = false;

        		// disable the PWM
        		HAL_disablePwm(halHandleMtr[motorNum]);
        	}
        	else
        	{
        		// update the controller state
        		bool flag_ctrlStateChanged = CTRL_updateState(ctrlHandle[motorNum]);

        		// enable or disable the control
        		CTRL_setFlag_enableCtrl(ctrlHandle[motorNum], gMotorVars[motorNum].Flag_Run_Identify);

        		if(flag_ctrlStateChanged)
        		{
        			CTRL_State_e ctrlState = CTRL_getState(ctrlHandle[motorNum]);
                    EST_State_e estState = EST_getState(obj->estHandle);

        			if(ctrlState == CTRL_State_OffLine)
        			{
        				// enable the PWM
        				HAL_enablePwm(halHandleMtr[motorNum]);
        			}
        			else if(ctrlState == CTRL_State_OnLine)
        			{
//        				if(gMotorVars[motorNum].Flag_enableOffsetcalc == true)
//        				{
//        					// update the ADC bias values
//        					HAL_updateAdcBias(halHandleMtr[motorNum]);
//        				}
//        				else
//        				{
//        					// set the current bias
//        					HAL_setBias(halHandleMtr[motorNum],HAL_SensorType_Current,0,_IQ(I_A_offset));
//        					HAL_setBias(halHandleMtr[motorNum],HAL_SensorType_Current,1,_IQ(I_B_offset));
//        					HAL_setBias(halHandleMtr[motorNum],HAL_SensorType_Current,2,_IQ(I_C_offset));
//
//        					// set the voltage bias
//        					HAL_setBias(halHandleMtr[motorNum],HAL_SensorType_Voltage,0,_IQ(V_A_offset));
//        					HAL_setBias(halHandleMtr[motorNum],HAL_SensorType_Voltage,1,_IQ(V_B_offset));
//        					HAL_setBias(halHandleMtr[motorNum],HAL_SensorType_Voltage,2,_IQ(V_C_offset));
//        				}

                        if((estState < EST_State_LockRotor) || (estState > EST_State_MotorIdentified))
                        {
                            // update the ADC bias values
                            HAL_updateAdcBias(halHandleMtr[motorNum]);
                        }

						// Return the bias value for currents
						gMotorVars[motorNum].I_bias.value[0] = HAL_getBias(halHandleMtr[motorNum],HAL_SensorType_Current,0);
						gMotorVars[motorNum].I_bias.value[1] = HAL_getBias(halHandleMtr[motorNum],HAL_SensorType_Current,1);
						gMotorVars[motorNum].I_bias.value[2] = HAL_getBias(halHandleMtr[motorNum],HAL_SensorType_Current,2);

						// Return the bias value for voltages
						gMotorVars[motorNum].V_bias.value[0] = HAL_getBias(halHandleMtr[motorNum],HAL_SensorType_Voltage,0);
						gMotorVars[motorNum].V_bias.value[1] = HAL_getBias(halHandleMtr[motorNum],HAL_SensorType_Voltage,1);
						gMotorVars[motorNum].V_bias.value[2] = HAL_getBias(halHandleMtr[motorNum],HAL_SensorType_Voltage,2);

						// enable the PWM
						HAL_enablePwm(halHandleMtr[motorNum]);
        			}
        			else if(ctrlState == CTRL_State_Idle)
        			{
        				// disable the PWM
        				HAL_disablePwm(halHandleMtr[motorNum]);
        				gMotorVars[motorNum].Flag_Run_Identify = false;
        			}		// ctrlState=?

        			if((CTRL_getFlag_enableUserMotorParams(ctrlHandle[motorNum]) == true) &&
        												  (ctrlState > CTRL_State_Idle) &&
												  (gMotorVars[motorNum].CtrlVersion.minor == 6))
        			{
        				// call this function to fix 1p6
        				USER_softwareUpdate1p6(ctrlHandle[motorNum], &gUserParams[motorNum]);
        			}

        		}	// flag_ctrlStateChanged=?
        	}	// CTRL_isError=?


        	if(EST_isMotorIdentified(obj->estHandle))
        	{
        		_iq Id_squared_pu = _IQmpy(CTRL_getId_ref_pu(ctrlHandle[motorNum]),CTRL_getId_ref_pu(ctrlHandle[motorNum]));

				//Set the maximum current controller output for the Iq and Id current controllers to enable
				//over-modulation.
				//An input into the SVM above 1/SQRT(3) = 0.5774 is in the over-modulation region.  An input of 0.5774 is where
				//the crest of the sinewave touches the 100% duty cycle.  At an input of 2/3, the SVM generator
				//produces a trapezoidal waveform touching every corner of the hexagon
				CTRL_setMaxVsMag_pu(ctrlHandle[motorNum],gMotorVars[motorNum].OverModulation);

				// set the current ramp
				EST_setMaxCurrentSlope_pu(obj->estHandle,gMaxCurrentSlope[motorNum]);

				gMotorVars[motorNum].Flag_MotorIdentified = true;

				// set the speed reference
				CTRL_setSpd_ref_krpm(ctrlHandle[motorNum],gMotorVars[motorNum].SpeedRef_krpm);

				// set the speed acceleration
//				CTRL_setMaxAccel_pu(ctrlHandle[motorNum],_IQmpy(MAX_ACCEL_KRPMPS_SF_M1,gMotorVars[motorNum].MaxAccel_krpmps));
				CTRL_setMaxAccel_pu(ctrlHandle[motorNum],_IQmpy(MAX_ACCEL_KRPMPS_SF_M1,gMotorVars[motorNum].MaxAccel_krpmps));

				// set the Id reference
//				CTRL_setId_ref_pu(ctrlHandle[motorNum], _IQmpy(gMotorVars.IdRef_A, _IQ(1.0/USER_IQ_FULL_SCALE_CURRENT_A)));
				CTRL_setId_ref_pu(ctrlHandle[motorNum], _IQmpy(gMotorVars[motorNum].IdRef_A, gMotorVars[motorNum].current_A_to_pu_sf));

				if(Flag_Latch_softwareUpdate[motorNum])
				{
				  Flag_Latch_softwareUpdate[motorNum] = false;

				  USER_calcPIgains(ctrlHandle[motorNum], &gUserParams[motorNum]);

				  // initialize the watch window kp and ki current values with pre-calculated values
				  gMotorVars[motorNum].Kp_Idq = CTRL_getKp(ctrlHandle[motorNum],CTRL_Type_PID_Id);
				  gMotorVars[motorNum].Ki_Idq = CTRL_getKi(ctrlHandle[motorNum],CTRL_Type_PID_Id);

				  // initialize the watch window kp and ki current values with pre-calculated values
				  gMotorVars[motorNum].Kp_spd = CTRL_getKp(ctrlHandle[motorNum],CTRL_Type_PID_spd);
				  gMotorVars[motorNum].Ki_spd = CTRL_getKi(ctrlHandle[motorNum],CTRL_Type_PID_spd);
				}
        	}
        	else
        	{
        		Flag_Latch_softwareUpdate[motorNum] = true;

        		// initialize the watch window kp and ki values with pre-calculated values
//        		gMotorVars[motorNum].Kp_spd = CTRL_getKp(ctrlHandle[motorNum],CTRL_Type_PID_spd);
//        		gMotorVars[motorNum].Ki_spd = CTRL_getKi(ctrlHandle[motorNum],CTRL_Type_PID_spd);

        		// the estimator sets the maximum current slope during identification
        		gMaxCurrentSlope[motorNum] = EST_getMaxCurrentSlope_pu(obj->estHandle);
        	}


        	// when appropriate, update the global variables
        	if(gCounter_updateGlobals[motorNum] >= NUM_MAIN_TICKS_FOR_GLOBAL_VARIABLE_UPDATE)
        	{
        		// reset the counter
        		gCounter_updateGlobals[motorNum] = 0;

        		updateGlobalVariables_motor(ctrlHandle[motorNum], motorNum);
        	}

            // recalculate Kp and Ki gains to fix the R/L limitation of 2000.0, and Kp limit to 0.11
            recalcKpKi(ctrlHandle[motorNum], motorNum);

        	// update Kp and Ki gains
        	updateKpKiGains(ctrlHandle[motorNum], motorNum);

        	// enable/disable the forced angle
        	EST_setFlag_enableForceAngle(obj->estHandle,gMotorVars[motorNum].Flag_enableForceAngle);

        	// enable or disable power warp
        	CTRL_setFlag_enablePowerWarp(ctrlHandle[motorNum],gMotorVars[motorNum].Flag_enablePowerWarp);

			#ifdef DRV8301_SPI
			HAL_writeDrvData(halHandleMtr[motorNum],&gDrvSpi8301Vars[motorNum]);

			HAL_readDrvData(halHandleMtr[motorNum],&gDrvSpi8301Vars[motorNum]);
			#endif

			#ifdef DRV8305_SPI
			HAL_writeDrvData(halHandleMtr[motorNum],&gDrvSpi8305Vars[motorNum]);

			HAL_readDrvData(halHandleMtr[motorNum],&gDrvSpi8305Vars[motorNum]);
			#endif
        }

      } // end of while(gFlag_enableSys) loop

      // disable the PWM
      HAL_disablePwm(halHandleMtr[HAL_MTR1]);
      HAL_disablePwm(halHandleMtr[HAL_MTR2]);

      gMotorVars[HAL_MTR1].Flag_Run_Identify = false;
      gMotorVars[HAL_MTR2].Flag_Run_Identify = false;

      // set the default controller parameters (Reset the control to re-identify the motor)
      CTRL_setParams(ctrlHandle[HAL_MTR1],&gUserParams[HAL_MTR1]);
      CTRL_setParams(ctrlHandle[HAL_MTR2],&gUserParams[HAL_MTR2]);
   } // end of for(;;) loop

} // end of main() function

#ifdef _SINGLE_ISR_EN_
// motor_ISR
interrupt void motor_ISR(void)
{
  // read the timer 1 value and update the CPU usage module
  uint32_t timer1Cnt = HAL_readTimerCnt(halHandle,2);
  CPU_TIME_updateCnts(cpu_timeHandle[HAL_MTR1],timer1Cnt);

  #ifdef _ENABLE_OVM_
  SVGENCURRENT_IgnoreShunt_e ignoreShuntThisCycle_M1 = SVGENCURRENT_getIgnoreShunt(svgencurrentHandle[HAL_MTR1]);

  // acknowledge the ADC interrupt
  HAL_acqAdcInt(halHandle,ADC_IntNumber_1);

  // convert the ADC data
  HAL_readAdcData(halHandle,halHandleMtr[HAL_MTR1],&gAdcData[HAL_MTR1]);

  // run the current reconstruction algorithm
  SVGENCURRENT_RunRegenCurrent(svgencurrentHandle[HAL_MTR1], (MATH_vec3 *)(gAdcData[HAL_MTR1].I.value));

  gIavg[HAL_MTR1].value[0] += (gAdcData[HAL_MTR1].I.value[0] - gIavg[HAL_MTR1].value[0])>>gIavg_shift[HAL_MTR1];
  gIavg[HAL_MTR1].value[1] += (gAdcData[HAL_MTR1].I.value[1] - gIavg[HAL_MTR1].value[1])>>gIavg_shift[HAL_MTR1];
  gIavg[HAL_MTR1].value[2] += (gAdcData[HAL_MTR1].I.value[2] - gIavg[HAL_MTR1].value[2])>>gIavg_shift[HAL_MTR1];

  if(ignoreShuntThisCycle_M1 == ignore_ab)
  {
    gAdcData[HAL_MTR1].I.value[0] = gIavg[HAL_MTR1].value[0];
    gAdcData[HAL_MTR1].I.value[1] = gIavg[HAL_MTR1].value[1];
  }
  else if(ignoreShuntThisCycle_M1 == ignore_ac)
  {
    gAdcData[HAL_MTR1].I.value[0] = gIavg[HAL_MTR1].value[0];
    gAdcData[HAL_MTR1].I.value[2] = gIavg[HAL_MTR1].value[2];
  }
  else if(ignoreShuntThisCycle_M1 == ignore_bc)
  {
    gAdcData[HAL_MTR1].I.value[1] = gIavg[HAL_MTR1].value[1];
    gAdcData[HAL_MTR1].I.value[2] = gIavg[HAL_MTR1].value[2];
  }
  #else
  // acknowledge the ADC interrupt
  HAL_acqAdcInt(halHandle,ADC_IntNumber_1);

  // convert the ADC data
  HAL_readDualAdcDataWithOffsets(halHandle,halHandleMtr[HAL_MTR1],halHandleMtr[HAL_MTR2],&gAdcData[HAL_MTR1],&gAdcData[HAL_MTR2]);
  #endif

  // run the flying start
  FS_run(ctrlHandle[HAL_MTR1], fsHandle[HAL_MTR1]);

  // run the controller
  CTRL_run(ctrlHandle[HAL_MTR1],halHandleMtr[HAL_MTR1],&gAdcData[HAL_MTR1],&gPwmData[HAL_MTR1]);

  // write the PWM compare values
  HAL_writePwmData(halHandleMtr[HAL_MTR1],&gPwmData[HAL_MTR1]);

  #ifdef _ENABLE_OVM_
  // run the current ignore algorithm
  {
    uint16_t cmp1_M1 = HAL_readPwmCmpA(halHandleMtr[HAL_MTR1],PWM_Number_1);
    uint16_t cmp2_M1 = HAL_readPwmCmpA(halHandleMtr[HAL_MTR1],PWM_Number_2);
    uint16_t cmp3_M1 = HAL_readPwmCmpA(halHandleMtr[HAL_MTR1],PWM_Number_3);

    uint16_t cmpM1_M1 = HAL_readPwmCmpAM(halHandleMtr[HAL_MTR1],PWM_Number_1);
    uint16_t cmpM2_M1 = HAL_readPwmCmpAM(halHandleMtr[HAL_MTR1],PWM_Number_2);
    uint16_t cmpM3_M1 = HAL_readPwmCmpAM(halHandleMtr[HAL_MTR1],PWM_Number_3);

    // run the current ignore algorithm
    SVGENCURRENT_RunIgnoreShunt(svgencurrentHandle[HAL_MTR1],cmp1_M1,cmp2_M1,cmp3_M1,cmpM1_M1,cmpM2_M1,cmpM3_M1);
  }

  {
    int16_t minwidth_M1 = SVGENCURRENT_getMinWidth(svgencurrentHandle[HAL_MTR1]);
    SVGENCURRENT_IgnoreShunt_e ignoreShuntNextCycle_M1 = SVGENCURRENT_getIgnoreShunt(svgencurrentHandle[HAL_MTR1]);

    // Set trigger point in the middle of the low side pulse
    HAL_setTrigger(halHandleMtr[HAL_MTR1], ignoreShuntNextCycle_M1, minwidth_M1, gCmpOffset[HAL_MTR1]);
  }
  #endif

  #ifdef _ENABLE_OVM_
  SVGENCURRENT_IgnoreShunt_e ignoreShuntThisCycle_M2 = SVGENCURRENT_getIgnoreShunt(svgencurrentHandle[HAL_MTR2]);

  // convert the ADC data
  HAL_readAdcData(halHandle,halHandleMtr[HAL_MTR2],&gAdcData[HAL_MTR2]);

  // run the current reconstruction algorithm
  SVGENCURRENT_RunRegenCurrent(svgencurrentHandle[HAL_MTR2], (MATH_vec3 *)(gAdcData[HAL_MTR2].I.value));

  gIavg[HAL_MTR2].value[0] += (gAdcData[HAL_MTR2].I.value[0] - gIavg[HAL_MTR2].value[0])>>gIavg_shift[HAL_MTR2];
  gIavg[HAL_MTR2].value[1] += (gAdcData[HAL_MTR2].I.value[1] - gIavg[HAL_MTR2].value[1])>>gIavg_shift[HAL_MTR2];
  gIavg[HAL_MTR2].value[2] += (gAdcData[HAL_MTR2].I.value[2] - gIavg[HAL_MTR2].value[2])>>gIavg_shift[HAL_MTR2];

  if(ignoreShuntThisCycle_M2 == ignore_ab)
  {
	gAdcData[HAL_MTR2].I.value[0] = gIavg[HAL_MTR2].value[0];
	gAdcData[HAL_MTR2].I.value[1] = gIavg[HAL_MTR2].value[1];
  }
  else if(ignoreShuntThisCycle_M2 == ignore_ac)
  {
	gAdcData[HAL_MTR2].I.value[0] = gIavg[HAL_MTR2].value[0];
	gAdcData[HAL_MTR2].I.value[2] = gIavg[HAL_MTR2].value[2];
  }
  else if(ignoreShuntThisCycle_M2 == ignore_bc)
  {
	gAdcData[HAL_MTR2].I.value[1] = gIavg[HAL_MTR2].value[1];
	gAdcData[HAL_MTR2].I.value[2] = gIavg[HAL_MTR2].value[2];
  }
  #endif

  // run the flying start
  FS_run(ctrlHandle[HAL_MTR2], fsHandle[HAL_MTR2]);

  // run the controller
  CTRL_run(ctrlHandle[HAL_MTR2],halHandleMtr[HAL_MTR2],&gAdcData[HAL_MTR2],&gPwmData[HAL_MTR2]);

  // write the PWM compare values
  HAL_writePwmData(halHandleMtr[HAL_MTR2],&gPwmData[HAL_MTR2]);

  #ifdef _ENABLE_OVM_
  // run the current ignore algorithm
  {
	uint16_t cmp1_M2 = HAL_readPwmCmpA(halHandleMtr[HAL_MTR2],PWM_Number_1);
	uint16_t cmp2_M2 = HAL_readPwmCmpA(halHandleMtr[HAL_MTR2],PWM_Number_2);
	uint16_t cmp3_M2 = HAL_readPwmCmpA(halHandleMtr[HAL_MTR2],PWM_Number_3);

	uint16_t cmpM1_M2 = HAL_readPwmCmpAM(halHandleMtr[HAL_MTR2],PWM_Number_1);
	uint16_t cmpM2_M2 = HAL_readPwmCmpAM(halHandleMtr[HAL_MTR2],PWM_Number_2);
	uint16_t cmpM3_M2 = HAL_readPwmCmpAM(halHandleMtr[HAL_MTR2],PWM_Number_3);

	// run the current ignore algorithm
	SVGENCURRENT_RunIgnoreShunt(svgencurrentHandle[HAL_MTR2],cmp1_M2,cmp2_M2,cmp3_M2,cmpM1_M2,cmpM2_M2,cmpM3_M2);
  }

  {
	int16_t minwidth_M2 = SVGENCURRENT_getMinWidth(svgencurrentHandle[HAL_MTR2]);
	SVGENCURRENT_IgnoreShunt_e ignoreShuntNextCycle_M2 = SVGENCURRENT_getIgnoreShunt(svgencurrentHandle[HAL_MTR2]);

	// Set trigger point in the middle of the low side pulse
	HAL_setTrigger(halHandleMtr[HAL_MTR2], ignoreShuntNextCycle_M2, minwidth_M2, gCmpOffset[HAL_MTR2]);
  }
  #endif

  // setup the controller
  CTRL_setup(ctrlHandle[HAL_MTR1]);
  CTRL_setup(ctrlHandle[HAL_MTR2]);

  // read the timer 1 value and update the CPU usage module
  timer1Cnt = HAL_readTimerCnt(halHandle,2);
  CPU_TIME_run(cpu_timeHandle[HAL_MTR1],timer1Cnt);

  return;
} // end of motor1_ISR() function
#else
// motor1_ISR
interrupt void motor1_ISR(void)
{
  // read the timer 1 value and update the CPU usage module
  uint32_t timer1Cnt = HAL_readTimerCnt(halHandle,2);
  CPU_TIME_updateCnts(cpu_timeHandle[HAL_MTR1],timer1Cnt);

  SVGENCURRENT_MeasureShunt_e measurableShuntThisCycle_M1 = SVGENCURRENT_getMode(svgencurrentHandle[HAL_MTR1]);

  // acknowledge the ADC interrupt
  HAL_acqAdcInt(halHandle,ADC_IntNumber_1);


  // convert the ADC data
  HAL_readAdcData(halHandle,halHandleMtr[HAL_MTR1],&gAdcData[HAL_MTR1]);


  // run the current reconstruction algorithm
  SVGENCURRENT_RunRegenCurrent(svgencurrentHandle[HAL_MTR1], (MATH_vec3 *)(gAdcData[HAL_MTR1].I.value));


  gIavg[HAL_MTR1].value[0] += (gAdcData[HAL_MTR1].I.value[0] - gIavg[HAL_MTR1].value[0])>>gIavg_shift[HAL_MTR1];
  gIavg[HAL_MTR1].value[1] += (gAdcData[HAL_MTR1].I.value[1] - gIavg[HAL_MTR1].value[1])>>gIavg_shift[HAL_MTR1];
  gIavg[HAL_MTR1].value[2] += (gAdcData[HAL_MTR1].I.value[2] - gIavg[HAL_MTR1].value[2])>>gIavg_shift[HAL_MTR1];

  if(measurableShuntThisCycle_M1 > two_phase_measurable)
  {
	  gAdcData[HAL_MTR1].I.value[0] = gIavg[HAL_MTR1].value[0];
	  gAdcData[HAL_MTR1].I.value[1] = gIavg[HAL_MTR1].value[1];
	  gAdcData[HAL_MTR1].I.value[2] = gIavg[HAL_MTR1].value[2];
  }

  // run the controller
  CTRL_run(ctrlHandle[HAL_MTR1],halHandleMtr[HAL_MTR1],&gAdcData[HAL_MTR1],&gPwmData[HAL_MTR1]);


  // run the PWM compensation and current ignore algorithm
  SVGENCURRENT_compPwmData(svgencurrentHandle[HAL_MTR1],&(gPwmData[HAL_MTR1].Tabc),&gPwmData_prev[HAL_MTR1]);


  // write the PWM compare values
  HAL_writePwmData(halHandleMtr[HAL_MTR1],&gPwmData[HAL_MTR1]);


  {
    SVGENCURRENT_IgnoreShunt_e ignoreShuntNextCycle_M1 = SVGENCURRENT_getIgnoreShunt(svgencurrentHandle[HAL_MTR1]);
    SVGENCURRENT_VmidShunt_e midVolShunt_M1 = SVGENCURRENT_getVmid(svgencurrentHandle[HAL_MTR1]);

    // Set trigger point in the middle of the low side pulse
    HAL_setTrigger(halHandleMtr[HAL_MTR1],ignoreShuntNextCycle_M1,midVolShunt_M1);
  }


  // setup the controller
  CTRL_setup(ctrlHandle[HAL_MTR1]);


  // get the estimator angle and frequency values
  gMotorVars[HAL_MTR1].angle_est_pu = EST_getAngle_pu(ctrlHandle[HAL_MTR1]->estHandle);
  gMotorVars[HAL_MTR1].speed_est_pu = EST_getFm_pu(ctrlHandle[HAL_MTR1]->estHandle);

  gDacData.value[0] = gMotorVars[HAL_MTR1].angle_est_pu;
  gDacData.value[1] = gMotorVars[HAL_MTR1].speed_est_pu;
  gDacData.value[2] = gMotorVars[HAL_MTR2].angle_est_pu;
  gDacData.value[3] = gMotorVars[HAL_MTR2].speed_est_pu;

  HAL_writeDacData(halHandle,&gDacData);


  // read the timer 1 value and update the CPU usage module
  timer1Cnt = HAL_readTimerCnt(halHandle,2);
  CPU_TIME_run(cpu_timeHandle[HAL_MTR1],timer1Cnt);

  return;
} // end of motor1_ISR() function


//motor2_ISR
interrupt void motor2_ISR(void)
{
  // read the timer 1 value and update the CPU usage module
  uint32_t timer1Cnt = HAL_readTimerCnt(halHandle,2);
  CPU_TIME_updateCnts(cpu_timeHandle[HAL_MTR2],timer1Cnt);
  SVGENCURRENT_MeasureShunt_e measurableShuntThisCycle_M2 = SVGENCURRENT_getMode(svgencurrentHandle[HAL_MTR2]);

  // acknowledge the ADC interrupt
  HAL_acqAdcInt(halHandle,ADC_IntNumber_2);

  // convert the ADC data
  HAL_readAdcData(halHandle,halHandleMtr[HAL_MTR2],&gAdcData[HAL_MTR2]);

  // run the current reconstruction algorithm
  SVGENCURRENT_RunRegenCurrent(svgencurrentHandle[HAL_MTR2], (MATH_vec3 *)(gAdcData[HAL_MTR2].I.value));


  gIavg[HAL_MTR2].value[0] += (gAdcData[HAL_MTR2].I.value[0] - gIavg[HAL_MTR2].value[0])>>gIavg_shift[HAL_MTR2];
  gIavg[HAL_MTR2].value[1] += (gAdcData[HAL_MTR2].I.value[1] - gIavg[HAL_MTR2].value[1])>>gIavg_shift[HAL_MTR2];
  gIavg[HAL_MTR2].value[2] += (gAdcData[HAL_MTR2].I.value[2] - gIavg[HAL_MTR2].value[2])>>gIavg_shift[HAL_MTR2];

  if(measurableShuntThisCycle_M2 > two_phase_measurable)
  {
	  gAdcData[HAL_MTR2].I.value[0] = gIavg[HAL_MTR2].value[0];
	  gAdcData[HAL_MTR2].I.value[1] = gIavg[HAL_MTR2].value[1];
	  gAdcData[HAL_MTR2].I.value[2] = gIavg[HAL_MTR2].value[2];
  }


  // run the controller
  CTRL_run(ctrlHandle[HAL_MTR2],halHandleMtr[HAL_MTR2],&gAdcData[HAL_MTR2],&gPwmData[HAL_MTR2]);


  // run the PWM compensation and current ignore algorithm
  SVGENCURRENT_compPwmData(svgencurrentHandle[HAL_MTR2],&(gPwmData[HAL_MTR2].Tabc),&gPwmData_prev[HAL_MTR2]);


  // write the PWM compare values
  HAL_writePwmData(halHandleMtr[HAL_MTR2],&gPwmData[HAL_MTR2]);


  {
    SVGENCURRENT_IgnoreShunt_e ignoreShuntNextCycle_M2 = SVGENCURRENT_getIgnoreShunt(svgencurrentHandle[HAL_MTR2]);
    SVGENCURRENT_VmidShunt_e midVolShunt_M2 = SVGENCURRENT_getVmid(svgencurrentHandle[HAL_MTR2]);

    // Set trigger point in the middle of the low side pulse
    HAL_setTrigger(halHandleMtr[HAL_MTR2],ignoreShuntNextCycle_M2,midVolShunt_M2);
  }


  // setup the controller
  CTRL_setup(ctrlHandle[HAL_MTR2]);


  // get the estimator angle and frequency values
  gMotorVars[HAL_MTR2].angle_est_pu = EST_getAngle_pu(ctrlHandle[HAL_MTR2]->estHandle);
  gMotorVars[HAL_MTR2].speed_est_pu = EST_getFm_pu(ctrlHandle[HAL_MTR2]->estHandle);

  // read the timer 1 value and update the CPU usage module
  timer1Cnt = HAL_readTimerCnt(halHandle,2);
  CPU_TIME_run(cpu_timeHandle[HAL_MTR2],timer1Cnt);

  return;
} // end of mainISR() function
#endif

void updateGlobalVariables_motor(CTRL_Handle handle, const uint_least8_t mtrNum)
{
  CTRL_Obj *obj = (CTRL_Obj *)handle;

  // get the speed estimate
  gMotorVars[mtrNum].Speed_krpm = EST_getSpeed_krpm(obj->estHandle);

  // get the real time speed reference coming out of the speed trajectory generator
  gMotorVars[mtrNum].SpeedTraj_krpm = _IQmpy(CTRL_getSpd_int_ref_pu(handle),EST_get_pu_to_krpm_sf(obj->estHandle));

  // get the torque estimate
//  gMotorVars[mtrNum].Torque_Nm = USER_computeTorque_Nm(handle, gTorque_Flux_Iq_pu_to_Nm_sf[mtrNum], gTorque_Ls_Id_Iq_pu_to_Nm_sf[mtrNum]);

  // get the magnetizing current
  gMotorVars[mtrNum].MagnCurr_A = EST_getIdRated(obj->estHandle);

  // get the rotor resistance
  gMotorVars[mtrNum].Rr_Ohm = EST_getRr_Ohm(obj->estHandle);

  // get the stator resistance
  gMotorVars[mtrNum].Rs_Ohm = EST_getRs_Ohm(obj->estHandle);

  // get the stator inductance in the direct coordinate direction
  gMotorVars[mtrNum].Lsd_H = EST_getLs_d_H(obj->estHandle);

  // get the stator inductance in the quadrature coordinate direction
  gMotorVars[mtrNum].Lsq_H = EST_getLs_q_H(obj->estHandle);

  // get the flux in V/Hz in floating point
  gMotorVars[mtrNum].Flux_VpHz = EST_getFlux_VpHz(obj->estHandle);

  // get the flux in Wb in fixed point
  gMotorVars[mtrNum].Flux_Wb = _IQmpy(EST_getFlux_pu(obj->estHandle),gFlux_pu_to_Wb_sf[mtrNum]);

  // get the controller state
  gMotorVars[mtrNum].CtrlState = CTRL_getState(handle);

  // get the estimator state
  gMotorVars[mtrNum].EstState = EST_getState(obj->estHandle);

  // read Vd and Vq vectors per units
  gMotorVars[mtrNum].Vd = CTRL_getVd_out_pu(handle);
  gMotorVars[mtrNum].Vq = CTRL_getVq_out_pu(handle);

  // calculate vector Vs in per units
  gMotorVars[mtrNum].Vs = _IQsqrt(_IQmpy(gMotorVars[mtrNum].Vd, gMotorVars[mtrNum].Vd) + _IQmpy(gMotorVars[mtrNum].Vq, gMotorVars[mtrNum].Vq));

  // read Id and Iq vectors in amps
//  gMotorVars[mtrNum].Id_A = _IQmpy(CTRL_getId_in_pu(handle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A));
//  gMotorVars[mtrNum].Iq_A = _IQmpy(CTRL_getIq_in_pu(handle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A));
  gMotorVars[mtrNum].Id_A = _IQmpy(CTRL_getId_in_pu(handle), gMotorVars[mtrNum].current_pu_to_A_sf);
  gMotorVars[mtrNum].Iq_A = _IQmpy(CTRL_getIq_in_pu(handle), gMotorVars[mtrNum].current_pu_to_A_sf);

  // calculate vector Is in amps
  gMotorVars[mtrNum].Is_A = _IQsqrt(_IQmpy(gMotorVars[mtrNum].Id_A, gMotorVars[mtrNum].Id_A) + _IQmpy(gMotorVars[mtrNum].Iq_A, gMotorVars[mtrNum].Iq_A));

  // Get the DC buss voltage
//  gMotorVars[mtrNum].VdcBus_kV = _IQmpy(gAdcData[mtrNum].dcBus,_IQ(USER_IQ_FULL_SCALE_VOLTAGE_V/1000.0));
  gMotorVars[mtrNum].VdcBus_kV = _IQmpy(gAdcData[mtrNum].dcBus, gMotorVars[mtrNum].voltage_pu_to_kv_sf);

  // enable/disable the use of motor parameters being loaded from user.h
  CTRL_setFlag_enableUserMotorParams(ctrlHandle[mtrNum],gMotorVars[mtrNum].Flag_enableUserParams);

  // Enable the Library internal PI.  Iq is referenced by the speed PI now
  CTRL_setFlag_enableSpeedCtrl(ctrlHandle[mtrNum], gMotorVars[mtrNum].Flag_enableSpeedCtrl);

  // enable/disable automatic calculation of bias values
  CTRL_setFlag_enableOffset(ctrlHandle[mtrNum],gMotorVars[mtrNum].Flag_enableOffsetcalc);

  // enable/disable dc bus voltage compensation
  CTRL_setFlag_enableDcBusComp(ctrlHandle[mtrNum], gMotorVars[mtrNum].Flag_enableDcBusComp);

  // enable/disable Rs recalibration during motor startup
  EST_setFlag_enableRsRecalc(obj->estHandle,gMotorVars[mtrNum].Flag_enableRsRecalc);

  return;
} // end of updateGlobalVariables_motor() function


void updateKpKiGains(CTRL_Handle handle, const uint_least8_t mtrNum)
{
  if((gMotorVars[mtrNum].CtrlState == CTRL_State_OnLine) && (gMotorVars[mtrNum].Flag_MotorIdentified == true) && (Flag_Latch_softwareUpdate[mtrNum] == false))
    {
      // set the kp and ki speed values from the watch window
      CTRL_setKp(handle,CTRL_Type_PID_spd,gMotorVars[mtrNum].Kp_spd);
      CTRL_setKi(handle,CTRL_Type_PID_spd,gMotorVars[mtrNum].Ki_spd);

      // set the kp and ki current values for Id and Iq from the watch window
      CTRL_setKp(handle,CTRL_Type_PID_Id,gMotorVars[mtrNum].Kp_Idq);
      CTRL_setKi(handle,CTRL_Type_PID_Id,gMotorVars[mtrNum].Ki_Idq);
      CTRL_setKp(handle,CTRL_Type_PID_Iq,gMotorVars[mtrNum].Kp_Idq);
      CTRL_setKi(handle,CTRL_Type_PID_Iq,gMotorVars[mtrNum].Ki_Idq);
	}

  return;
} // end of updateKpKiGains() function

void recalcKpKi(CTRL_Handle handle, const uint_least8_t mtrNum)
{
  CTRL_Obj *obj = (CTRL_Obj *)handle;
  EST_State_e EstState = EST_getState(obj->estHandle);

  if((EST_isMotorIdentified(obj->estHandle) == false) && (EstState == EST_State_Rs))
    {
      float_t Lhf = CTRL_getLhf(handle);
      float_t Rhf = CTRL_getRhf(handle);
      float_t RhfoverLhf = Rhf/Lhf;
//      _iq Kp = _IQ(0.25*Lhf*USER_IQ_FULL_SCALE_CURRENT_A/(USER_CTRL_PERIOD_sec*USER_IQ_FULL_SCALE_VOLTAGE_V));
      _iq Kp = _IQ(0.25*Lhf*gUserParams[mtrNum].iqFullScaleCurrent_A/(gUserParams[mtrNum].ctrlPeriod_sec*gUserParams[mtrNum].iqFullScaleVoltage_V));

//      _iq Ki = _IQ(RhfoverLhf*USER_CTRL_PERIOD_sec);
      _iq Ki = _IQ(RhfoverLhf*gUserParams[mtrNum].ctrlPeriod_sec);

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

//@} //defgroup
// end of file



