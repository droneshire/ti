/* --COPYRIGHT--,BSD
 * Copyright (c) 2015, Texas Instruments Incorporated
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
//! \file   solutions/instaspin_foc/src/proj_lab011a.c
//! \brief A Feature Rich Example without Controller Module
//!
//! (C) Copyright 2015, Texas Instruments, Inc.

//! \defgroup PROJ_LAB11A PROJ_LAB11A
//@{

//! \defgroup PROJ_LAB11A_OVERVIEW Project Overview
//!
//! A Feature Rich Example without Controller Module
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

// **************************************************************************
// the globals

CLARKE_Handle   clarkeHandle_I;               //!< the handle for the current Clarke transform
CLARKE_Obj      clarke_I;                     //!< the current Clarke transform object

CLARKE_Handle   clarkeHandle_V;               //!< the handle for the voltage Clarke transform
CLARKE_Obj      clarke_V;                     //!< the voltage Clarke transform object

CPU_USAGE_Handle  cpu_usageHandle;
CPU_USAGE_Obj     cpu_usage;

EST_Handle      estHandle;                    //!< the handle for the estimator

FW_Handle       fwHandle;
FW_Obj          fw;

PID_Obj         pid[3];                       //!< three handles for PID controllers 0 - Speed, 1 - Id, 2 - Iq
PID_Handle      pidHandle[3];                 //!< three objects for PID controllers 0 - Speed, 1 - Id, 2 - Iq
uint16_t        pidCntSpeed;                  //!< count variable to decimate the execution of the speed PID controller

IPARK_Handle    iparkHandle;                  //!< the handle for the inverse Park transform
IPARK_Obj       ipark;                        //!< the inverse Park transform object

FILTER_FO_Handle  filterHandle[6];            //!< the handles for the 3-current and 3-voltage filters for offset calculation
FILTER_FO_Obj     filter[6];                  //!< the 3-current and 3-voltage filters for offset calculation

SVGENCURRENT_Obj     svgencurrent;
SVGENCURRENT_Handle  svgencurrentHandle;

SVGEN_Handle    svgenHandle;                  //!< the handle for the space vector generator
SVGEN_Obj       svgen;                        //!< the space vector generator object

TRAJ_Handle     trajHandle_Id;                //!< the handle for the id reference trajectory
TRAJ_Obj        traj_Id;                      //!< the id reference trajectory object

TRAJ_Handle     trajHandle_spd;               //!< the handle for the speed reference trajectory
TRAJ_Obj        traj_spd;                     //!< the speed reference trajectory object

#ifdef CSM_ENABLE
#pragma DATA_SECTION(halHandle,"rom_accessed_data");
#endif
HAL_Handle      halHandle;                    //!< the handle for the hardware abstraction layer (HAL)

HAL_PwmData_t   gPwmData = {_IQ(0.0), _IQ(0.0), _IQ(0.0)};       //!< contains the three pwm values -1.0 - 0%, 1.0 - 100%

HAL_AdcData_t   gAdcData;                     //!< contains three current values, three voltage values and one DC buss value

MATH_vec3       gOffsets_I_pu = {_IQ(0.0), _IQ(0.0), _IQ(0.0)};  //!< contains the offsets for the current feedback

MATH_vec3       gOffsets_V_pu = {_IQ(0.0), _IQ(0.0), _IQ(0.0)};  //!< contains the offsets for the voltage feedback

MATH_vec2       gIdq_ref_pu = {_IQ(0.0), _IQ(0.0)};              //!< contains the Id and Iq references

MATH_vec2       gVdq_out_pu = {_IQ(0.0), _IQ(0.0)};              //!< contains the output Vd and Vq from the current controllers

MATH_vec2       gIdq_pu = {_IQ(0.0), _IQ(0.0)};                  //!< contains the Id and Iq measured values

#ifdef CSM_ENABLE
#pragma DATA_SECTION(gUserParams,"rom_accessed_data");
#endif
USER_Params     gUserParams;

volatile MOTOR_Vars_t gMotorVars = MOTOR_Vars_INIT;   //!< the global motor variables that are defined in main.h and used for display in the debugger's watch window

#ifdef FLASH
// Used for running BackGround in flash, and ISR in RAM
extern uint16_t *RamfuncsLoadStart, *RamfuncsLoadEnd, *RamfuncsRunStart;

#ifdef CSM_ENABLE
extern uint16_t *econst_start, *econst_end, *econst_ram_load;
extern uint16_t *switch_start, *switch_end, *switch_ram_load;
#endif
#endif


MATH_vec3 gIavg = {_IQ(0.0), _IQ(0.0), _IQ(0.0)};
uint16_t gIavg_shift = 1;
MATH_vec3 	    gPwmData_prev = {_IQ(0.0), _IQ(0.0), _IQ(0.0)};

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

_iq gSpeed_krpm_to_pu_sf = _IQ((float_t)USER_MOTOR_NUM_POLE_PAIRS * 1000.0 / (USER_IQ_FULL_SCALE_FREQ_Hz * 60.0));

_iq gSpeed_hz_to_krpm_sf = _IQ(60.0 / (float_t)USER_MOTOR_NUM_POLE_PAIRS / 1000.0);

_iq gIs_Max_squared_pu = _IQ((USER_MOTOR_MAX_CURRENT * USER_MOTOR_MAX_CURRENT) / (USER_IQ_FULL_SCALE_CURRENT_A * USER_IQ_FULL_SCALE_CURRENT_A));

float_t gCpuUsagePercentageMin = 0.0;
float_t gCpuUsagePercentageAvg = 0.0;
float_t gCpuUsagePercentageMax = 0.0;

uint32_t gOffsetCalcCount = 0;

uint16_t gTrjCnt = 0;

volatile bool gFlag_enableRsOnLine = false;

volatile bool gFlag_updateRs = false;

volatile _iq gRsOnLineFreq_Hz = _IQ(0.2);

volatile _iq gRsOnLineId_mag_A = _IQ(0.5);

volatile _iq gRsOnLinePole_Hz = _IQ(0.2);

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

  // initialize the Clarke modules
  clarkeHandle_I = CLARKE_init(&clarke_I,sizeof(clarke_I));
  clarkeHandle_V = CLARKE_init(&clarke_V,sizeof(clarke_V));

  // initialize the estimator
  estHandle = EST_init((void *)USER_EST_HANDLE_ADDRESS, 0x200);

  // initialize the user parameters
  USER_setParams(&gUserParams);

  // set the hardware abstraction layer parameters
  HAL_setParams(halHandle,&gUserParams);

#ifdef FAST_ROM_V1p6
  {
    CTRL_Handle ctrlHandle = CTRL_init((void *)USER_CTRL_HANDLE_ADDRESS, 0x200);
    CTRL_Obj *obj = (CTRL_Obj *)ctrlHandle;
    obj->estHandle = estHandle;

    // initialize the estimator through the controller
    CTRL_setParams(ctrlHandle,&gUserParams);
    CTRL_setUserMotorParams(ctrlHandle);
    CTRL_setupEstIdleState(ctrlHandle);
  }
#else
  {
    // initialize the estimator
    EST_setEstParams(estHandle,&gUserParams);
    EST_setupEstIdleState(estHandle);
  }
#endif

  // disable Rs recalculation by default
  gMotorVars.Flag_enableRsRecalc = false;
  EST_setFlag_enableRsRecalc(estHandle,false);

  // configure RsOnLine
  EST_setFlag_enableRsOnLine(estHandle,gFlag_enableRsOnLine);
  EST_setFlag_updateRs(estHandle,gFlag_updateRs);
  EST_setRsOnLineAngleDelta_pu(estHandle,_IQmpy(gRsOnLineFreq_Hz, _IQ(1.0/USER_ISR_FREQ_Hz)));
  EST_setRsOnLineId_mag_pu(estHandle,_IQmpy(gRsOnLineId_mag_A, _IQ(1.0/USER_IQ_FULL_SCALE_CURRENT_A)));

  // Calculate coefficients for all filters
  {
    _iq b0 = _IQmpy(gRsOnLinePole_Hz, _IQ(1.0/USER_ISR_FREQ_Hz));
    _iq a1 = b0 - _IQ(1.0);
    EST_setRsOnLineFilterParams(estHandle,EST_RsOnLineFilterType_Current,b0,a1,_IQ(0.0),b0,a1,_IQ(0.0));
    EST_setRsOnLineFilterParams(estHandle,EST_RsOnLineFilterType_Voltage,b0,a1,_IQ(0.0),b0,a1,_IQ(0.0));
  }

  // set the number of current sensors
  setupClarke_I(clarkeHandle_I,USER_NUM_CURRENT_SENSORS);

  // set the number of voltage sensors
  setupClarke_V(clarkeHandle_V,USER_NUM_VOLTAGE_SENSORS);

  // set the pre-determined current and voltage feeback offset values
  gOffsets_I_pu.value[0] = _IQ(I_A_offset);
  gOffsets_I_pu.value[1] = _IQ(I_B_offset);
  gOffsets_I_pu.value[2] = _IQ(I_C_offset);
  gOffsets_V_pu.value[0] = _IQ(V_A_offset);
  gOffsets_V_pu.value[1] = _IQ(V_B_offset);
  gOffsets_V_pu.value[2] = _IQ(V_C_offset);

  // initialize the PID controllers
  {
    _iq maxCurrent_pu = _IQ(USER_MOTOR_MAX_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A);
    _iq maxVoltage_pu = _IQ(USER_MAX_VS_MAG_PU * USER_VD_SF);
    float_t fullScaleCurrent = USER_IQ_FULL_SCALE_CURRENT_A;
    float_t fullScaleVoltage = USER_IQ_FULL_SCALE_VOLTAGE_V;
    float_t IsrPeriod_sec = 1.0 / USER_ISR_FREQ_Hz;
    float_t Ls_d = USER_MOTOR_Ls_d;
    float_t Ls_q = USER_MOTOR_Ls_q;
    float_t Rs = USER_MOTOR_Rs;
    float_t RoverLs_d = Rs/Ls_d;
    float_t RoverLs_q = Rs/Ls_q;
    _iq Kp_Id = _IQ((0.25*Ls_d*fullScaleCurrent)/(IsrPeriod_sec*fullScaleVoltage));
    _iq Ki_Id = _IQ(RoverLs_d*IsrPeriod_sec);
    _iq Kp_Iq = _IQ((0.25*Ls_q*fullScaleCurrent)/(IsrPeriod_sec*fullScaleVoltage));
    _iq Ki_Iq = _IQ(RoverLs_q*IsrPeriod_sec);

    pidHandle[0] = PID_init(&pid[0],sizeof(pid[0]));
    pidHandle[1] = PID_init(&pid[1],sizeof(pid[1]));
    pidHandle[2] = PID_init(&pid[2],sizeof(pid[2]));

    PID_setGains(pidHandle[0],_IQ(1.0),_IQ(0.01),_IQ(0.0));
    PID_setMinMax(pidHandle[0],-maxCurrent_pu,maxCurrent_pu);
    PID_setUi(pidHandle[0],_IQ(0.0));
    pidCntSpeed = 0;

    PID_setGains(pidHandle[1],Kp_Id,Ki_Id,_IQ(0.0));
    PID_setMinMax(pidHandle[1],-maxVoltage_pu,maxVoltage_pu);
    PID_setUi(pidHandle[1],_IQ(0.0));

    PID_setGains(pidHandle[2],Kp_Iq,Ki_Iq,_IQ(0.0));
    PID_setMinMax(pidHandle[2],_IQ(0.0),_IQ(0.0));
    PID_setUi(pidHandle[2],_IQ(0.0));
  }

  // initialize the speed reference in kilo RPM where base speed is USER_IQ_FULL_SCALE_FREQ_Hz
  gMotorVars.SpeedRef_krpm = _IQmpy(_IQ(10.0), gSpeed_hz_to_krpm_sf);

  // initialize the inverse Park module
  iparkHandle = IPARK_init(&ipark,sizeof(ipark));

  // initialize and configure offsets using filters
  {
    uint16_t cnt = 0;
    _iq b0 = _IQ(gUserParams.offsetPole_rps/(float_t)gUserParams.ctrlFreq_Hz);
    _iq a1 = (b0 - _IQ(1.0));
    _iq b1 = _IQ(0.0);

    for(cnt=0;cnt<6;cnt++)
      {
        filterHandle[cnt] = FILTER_FO_init(&filter[cnt],sizeof(filter[0]));
        FILTER_FO_setDenCoeffs(filterHandle[cnt],a1);
        FILTER_FO_setNumCoeffs(filterHandle[cnt],b0,b1);
        FILTER_FO_setInitialConditions(filterHandle[cnt],_IQ(0.0),_IQ(0.0));
      }

    gMotorVars.Flag_enableOffsetcalc = false;
  }

  // initialize the space vector generator module
  svgenHandle = SVGEN_init(&svgen,sizeof(svgen));

  // Initialize and setup the 100% SVM generator
  svgencurrentHandle = SVGENCURRENT_init(&svgencurrent,sizeof(svgencurrent));

  // setup svgen current
  {
    float_t minWidth_microseconds = 2.0;
    uint16_t minWidth_counts = (uint16_t)(minWidth_microseconds * USER_SYSTEM_FREQ_MHz);
    float_t fdutyLimit = 0.5-(2.0*minWidth_microseconds*USER_PWM_FREQ_kHz*0.001);
    _iq dutyLimit = _IQ(fdutyLimit);

    SVGENCURRENT_setMinWidth(svgencurrentHandle, minWidth_counts);
    SVGENCURRENT_setIgnoreShunt(svgencurrentHandle, use_all);
    SVGENCURRENT_setMode(svgencurrentHandle,all_phase_measurable);
    SVGENCURRENT_setVlimit(svgencurrentHandle,dutyLimit);
  }

  // initialize the speed reference trajectory
  trajHandle_spd = TRAJ_init(&traj_spd,sizeof(traj_spd));

  // configure the speed reference trajectory
  TRAJ_setTargetValue(trajHandle_spd,_IQ(0.0));
  TRAJ_setIntValue(trajHandle_spd,_IQ(0.0));
  TRAJ_setMinValue(trajHandle_spd,_IQ(-1.0));
  TRAJ_setMaxValue(trajHandle_spd,_IQ(1.0));
  TRAJ_setMaxDelta(trajHandle_spd,_IQ(USER_MAX_ACCEL_Hzps / USER_IQ_FULL_SCALE_FREQ_Hz / USER_ISR_FREQ_Hz));

  // initialize the Id reference trajectory
  trajHandle_Id = TRAJ_init(&traj_Id,sizeof(traj_Id));

  if(USER_MOTOR_TYPE == MOTOR_Type_Pm)
    {
      // configure the Id reference trajectory
      TRAJ_setTargetValue(trajHandle_Id,_IQ(0.0));
      TRAJ_setIntValue(trajHandle_Id,_IQ(0.0));
      TRAJ_setMinValue(trajHandle_Id,_IQ(-USER_MOTOR_MAX_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A));
      TRAJ_setMaxValue(trajHandle_Id,_IQ(USER_MOTOR_MAX_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A));
      TRAJ_setMaxDelta(trajHandle_Id,_IQ(USER_MOTOR_RES_EST_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A / USER_ISR_FREQ_Hz));

      // Initialize field weakening
      fwHandle = FW_init(&fw,sizeof(fw));
      FW_setFlag_enableFw(fwHandle, false); // Disable field weakening
      FW_clearCounter(fwHandle); // Clear field weakening counter
      FW_setNumIsrTicksPerFwTick(fwHandle, FW_NUM_ISR_TICKS_PER_CTRL_TICK); // Set the number of ISR per field weakening ticks
      FW_setDeltas(fwHandle, FW_INC_DELTA, FW_DEC_DELTA); // Set the deltas of field weakening
      FW_setOutput(fwHandle, _IQ(0.0)); // Set initial output of field weakening to zero
      FW_setMinMax(fwHandle,_IQ(USER_MAX_NEGATIVE_ID_REF_CURRENT_A/USER_IQ_FULL_SCALE_CURRENT_A),_IQ(0.0)); // Set the field weakening controller limits
    }
  else
    {
      // configure the Id reference trajectory
      TRAJ_setTargetValue(trajHandle_Id,_IQ(0.0));
      TRAJ_setIntValue(trajHandle_Id,_IQ(0.0));
      TRAJ_setMinValue(trajHandle_Id,_IQ(0.0));
      TRAJ_setMaxValue(trajHandle_Id,_IQ(USER_MOTOR_MAGNETIZING_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A));
      TRAJ_setMaxDelta(trajHandle_Id,_IQ(USER_MOTOR_MAGNETIZING_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A / USER_ISR_FREQ_Hz));
    }

  // initialize the CPU usage module
  cpu_usageHandle = CPU_USAGE_init(&cpu_usage,sizeof(cpu_usage));
  CPU_USAGE_setParams(cpu_usageHandle,
                     (uint32_t)USER_SYSTEM_FREQ_MHz * 1000000,     // timer period, cnts
                     (uint32_t)USER_ISR_FREQ_Hz);                  // average over 1 second of ISRs

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

  // compute scaling factors for flux and torque calculations
  gFlux_pu_to_Wb_sf = USER_computeFlux_pu_to_Wb_sf();
  gFlux_pu_to_VpHz_sf = USER_computeFlux_pu_to_VpHz_sf();
  gTorque_Ls_Id_Iq_pu_to_Nm_sf = USER_computeTorque_Ls_Id_Iq_pu_to_Nm_sf();
  gTorque_Flux_Iq_pu_to_Nm_sf = USER_computeTorque_Flux_Iq_pu_to_Nm_sf();

  // enable the system by default
  gMotorVars.Flag_enableSys = true;

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

  // Begin the background loop
  for(;;)
  {
    // Waiting for enable system flag to be set
    while(!(gMotorVars.Flag_enableSys));

    // loop while the enable system flag is true
    while(gMotorVars.Flag_enableSys)
      {
        if(gMotorVars.Flag_Run_Identify)
          {
            // disable Rs recalculation
            EST_setFlag_enableRsRecalc(estHandle,false);

            // update estimator state
            EST_updateState(estHandle,0);

            #ifdef FAST_ROM_V1p6
              // call this function to fix 1p6
              softwareUpdate1p6(estHandle);
            #endif

            // enable the PWM
            HAL_enablePwm(halHandle);

            // set trajectory target for speed reference
            TRAJ_setTargetValue(trajHandle_spd,_IQmpy(gMotorVars.SpeedRef_krpm, gSpeed_krpm_to_pu_sf));

            if(USER_MOTOR_TYPE == MOTOR_Type_Pm)
              {
                // set trajectory target for Id reference
                TRAJ_setTargetValue(trajHandle_Id,gIdq_ref_pu.value[0]);
              }
            else
              {
                if(gMotorVars.Flag_enablePowerWarp)
                  {
                    _iq Id_target_pw_pu = EST_runPowerWarp(estHandle,TRAJ_getIntValue(trajHandle_Id),gIdq_pu.value[1]);
                    TRAJ_setTargetValue(trajHandle_Id,Id_target_pw_pu);
                    TRAJ_setMinValue(trajHandle_Id,_IQ(USER_MOTOR_MAGNETIZING_CURRENT * 0.3 / USER_IQ_FULL_SCALE_CURRENT_A));
                    TRAJ_setMaxDelta(trajHandle_Id,_IQ(USER_MOTOR_MAGNETIZING_CURRENT * 0.3 / USER_IQ_FULL_SCALE_CURRENT_A / USER_ISR_FREQ_Hz));
                  }
                else
                  {
                    // set trajectory target for Id reference
                    TRAJ_setTargetValue(trajHandle_Id,_IQ(USER_MOTOR_MAGNETIZING_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A));
                    TRAJ_setMinValue(trajHandle_Id,_IQ(0.0));
                    TRAJ_setMaxDelta(trajHandle_Id,_IQ(USER_MOTOR_MAGNETIZING_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A / USER_ISR_FREQ_Hz));
                  }
              }
          }
        else if(gMotorVars.Flag_enableRsRecalc)
          {
            // set angle to zero
            EST_setAngle_pu(estHandle,_IQ(0.0));

            // enable or disable Rs recalculation
            EST_setFlag_enableRsRecalc(estHandle,true);

            // update estimator state
            EST_updateState(estHandle,0);

            #ifdef FAST_ROM_V1p6
              // call this function to fix 1p6
              softwareUpdate1p6(estHandle);
            #endif

            // enable the PWM
            HAL_enablePwm(halHandle);

            // set trajectory target for speed reference
            TRAJ_setTargetValue(trajHandle_spd,_IQ(0.0));

            // set trajectory target for Id reference
            TRAJ_setTargetValue(trajHandle_Id,_IQ(USER_MOTOR_RES_EST_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A));

            // if done with Rs recalculation, disable flag
            if(EST_getState(estHandle) == EST_State_OnLine) gMotorVars.Flag_enableRsRecalc = false;
          }
        else
          {
            // set estimator to Idle
            EST_setIdle(estHandle);

            // disable the PWM
            if(!gMotorVars.Flag_enableOffsetcalc) HAL_disablePwm(halHandle);

            // clear the speed reference trajectory
            TRAJ_setTargetValue(trajHandle_spd,_IQ(0.0));
            TRAJ_setIntValue(trajHandle_spd,_IQ(0.0));

            // clear the Id reference trajectory
            TRAJ_setTargetValue(trajHandle_Id,_IQ(0.0));
            TRAJ_setIntValue(trajHandle_Id,_IQ(0.0));

            // configure trajectory Id defaults depending on motor type
            if(USER_MOTOR_TYPE == MOTOR_Type_Pm)
              {
                TRAJ_setMinValue(trajHandle_Id,_IQ(-USER_MOTOR_MAX_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A));
                TRAJ_setMaxDelta(trajHandle_Id,_IQ(USER_MOTOR_RES_EST_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A / USER_ISR_FREQ_Hz));
              }
            else
              {
                TRAJ_setMinValue(trajHandle_Id,_IQ(0.0));
                TRAJ_setMaxDelta(trajHandle_Id,_IQ(USER_MOTOR_MAGNETIZING_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A / USER_ISR_FREQ_Hz));
              }

            // clear integral outputs
            PID_setUi(pidHandle[0],_IQ(0.0));
            PID_setUi(pidHandle[1],_IQ(0.0));
            PID_setUi(pidHandle[2],_IQ(0.0));

            // clear Id and Iq references
            gIdq_ref_pu.value[0] = _IQ(0.0);
            gIdq_ref_pu.value[1] = _IQ(0.0);

            // disable RsOnLine flags
            gFlag_enableRsOnLine = false;
            gFlag_updateRs = false;

            // disable PowerWarp flag
            gMotorVars.Flag_enablePowerWarp = false;
          }

        // update the global variables
        updateGlobalVariables(estHandle);

        // set field weakening enable flag depending on user's input
        FW_setFlag_enableFw(fwHandle,gMotorVars.Flag_enableFieldWeakening);

		// set the speed acceleration
		TRAJ_setMaxDelta(trajHandle_spd,_IQmpy(MAX_ACCEL_KRPMPS_SF,gMotorVars.MaxAccel_krpmps));

        // update CPU usage
        updateCPUusage();

        // enable/disable the forced angle
        EST_setFlag_enableForceAngle(estHandle,gMotorVars.Flag_enableForceAngle);

        // enable or disable RsOnLine
        EST_setFlag_enableRsOnLine(estHandle,gFlag_enableRsOnLine);

        // set slow rotating frequency for RsOnLine
        EST_setRsOnLineAngleDelta_pu(estHandle,_IQmpy(gRsOnLineFreq_Hz, _IQ(1.0/USER_ISR_FREQ_Hz)));

        // set current amplitude for RsOnLine
        EST_setRsOnLineId_mag_pu(estHandle,_IQmpy(gRsOnLineId_mag_A, _IQ(1.0/USER_IQ_FULL_SCALE_CURRENT_A)));

        // set flag that updates Rs from RsOnLine value
        EST_setFlag_updateRs(estHandle,gFlag_updateRs);

        // clear Id for RsOnLine if disabled
        if(!gFlag_enableRsOnLine) EST_setRsOnLineId_pu(estHandle,_IQ(0.0));

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

    gMotorVars.Flag_Run_Identify = false;
  } // end of for(;;) loop
} // end of main() function


//! \brief     The main ISR that implements the motor control.
interrupt void mainISR(void)
{
  _iq angle_pu = _IQ(0.0);
  _iq speed_pu = _IQ(0.0);
  _iq oneOverDcBus;
  MATH_vec2 Iab_pu;
  MATH_vec2 Vab_pu;
  MATH_vec2 phasor;
  uint32_t timer1Cnt;

  // read the timer 1 value and update the CPU usage module
  timer1Cnt = HAL_readTimerCnt(halHandle,1);
  CPU_USAGE_updateCnts(cpu_usageHandle,timer1Cnt);

  // acknowledge the ADC interrupt
  HAL_acqAdcInt(halHandle,ADC_IntNumber_1);

  // convert the ADC data
  HAL_readAdcDataWithOffsets(halHandle,&gAdcData);

  // remove offsets
  gAdcData.I.value[0] = gAdcData.I.value[0] - gOffsets_I_pu.value[0];
  gAdcData.I.value[1] = gAdcData.I.value[1] - gOffsets_I_pu.value[1];
  gAdcData.I.value[2] = gAdcData.I.value[2] - gOffsets_I_pu.value[2];
  gAdcData.V.value[0] = gAdcData.V.value[0] - gOffsets_V_pu.value[0];
  gAdcData.V.value[1] = gAdcData.V.value[1] - gOffsets_V_pu.value[1];
  gAdcData.V.value[2] = gAdcData.V.value[2] - gOffsets_V_pu.value[2];

  // run the current reconstruction algorithm
  runCurrentReconstruction();

  // run Clarke transform on current
  CLARKE_run(clarkeHandle_I,&gAdcData.I,&Iab_pu);

  // run Clarke transform on voltage
  CLARKE_run(clarkeHandle_V,&gAdcData.V,&Vab_pu);

  // run a trajectory for Id reference, so the reference changes with a ramp instead of a step
  TRAJ_run(trajHandle_Id);

  // run the estimator
  EST_run(estHandle,
          &Iab_pu,
          &Vab_pu,
          gAdcData.dcBus,
          TRAJ_getIntValue(trajHandle_spd));

  // generate the motor electrical angle
  angle_pu = EST_getAngle_pu(estHandle);
  speed_pu = EST_getFm_pu(estHandle);

  // get Idq from estimator to avoid sin and cos
  EST_getIdq_pu(estHandle,&gIdq_pu);

  // run the appropriate controller
  if((gMotorVars.Flag_Run_Identify) || (gMotorVars.Flag_enableRsRecalc))
    {
      _iq refValue;
      _iq fbackValue;
      _iq outMax_pu;

      // when appropriate, run the PID speed controller
      if((pidCntSpeed++ >= USER_NUM_CTRL_TICKS_PER_SPEED_TICK) && (!gMotorVars.Flag_enableRsRecalc))
        {
          // calculate Id reference squared
          _iq Id_ref_squared_pu = _IQmpy(PID_getRefValue(pidHandle[1]),PID_getRefValue(pidHandle[1]));

          // Take into consideration that Iq^2+Id^2 = Is^2
          _iq Iq_Max_pu = _IQsqrt(gIs_Max_squared_pu - Id_ref_squared_pu);

          // clear counter
          pidCntSpeed = 0;

          // Set new min and max for the speed controller output
          PID_setMinMax(pidHandle[0], -Iq_Max_pu, Iq_Max_pu);

          // run speed controller
          PID_run_spd(pidHandle[0],TRAJ_getIntValue(trajHandle_spd),speed_pu,&(gIdq_ref_pu.value[1]));
        }

      // get the reference value from the trajectory module
      refValue = TRAJ_getIntValue(trajHandle_Id) + EST_getRsOnLineId_pu(estHandle);

      // get the feedback value
      fbackValue = gIdq_pu.value[0];

      // run the Id PID controller
      PID_run(pidHandle[1],refValue,fbackValue,&(gVdq_out_pu.value[0]));

      // set Iq reference to zero when doing Rs recalculation
      if(gMotorVars.Flag_enableRsRecalc) gIdq_ref_pu.value[1] = _IQ(0.0);

      // get the Iq reference value
      refValue = gIdq_ref_pu.value[1];

      // get the feedback value
      fbackValue = gIdq_pu.value[1];

      // calculate Iq controller limits, and run Iq controller
      _iq max_vs = _IQmpy(_IQ(USER_MAX_VS_MAG_PU),EST_getDcBus_pu(estHandle));
      outMax_pu = _IQsqrt(_IQmpy(max_vs,max_vs) - _IQmpy(gVdq_out_pu.value[0],gVdq_out_pu.value[0]));
      PID_setMinMax(pidHandle[2],-outMax_pu,outMax_pu);
      PID_run(pidHandle[2],refValue,fbackValue,&(gVdq_out_pu.value[1]));

      // compensate angle for PWM delay
      angle_pu = angleDelayComp(speed_pu, angle_pu);

      // compute the sin/cos phasor
      phasor.value[0] = _IQcosPU(angle_pu);
      phasor.value[1] = _IQsinPU(angle_pu);

      // set the phasor in the inverse Park transform
      IPARK_setPhasor(iparkHandle,&phasor);

      // run the inverse Park module
      IPARK_run(iparkHandle,&gVdq_out_pu,&Vab_pu);

      // run the space Vector Generator (SVGEN) module
      oneOverDcBus = EST_getOneOverDcBus_pu(estHandle);
      Vab_pu.value[0] = _IQmpy(Vab_pu.value[0],oneOverDcBus);
      Vab_pu.value[1] = _IQmpy(Vab_pu.value[1],oneOverDcBus);
      SVGEN_run(svgenHandle,&Vab_pu,&(gPwmData.Tabc));

      // run the PWM compensation and current ignore algorithm
      SVGENCURRENT_compPwmData(svgencurrentHandle,&(gPwmData.Tabc),&gPwmData_prev);

      gTrjCnt++;
    }
  else if(gMotorVars.Flag_enableOffsetcalc == true)
    {
      runOffsetsCalculation();
    }
  else
    {
      // disable the PWM
      HAL_disablePwm(halHandle);

      // Set the PWMs to 50% duty cycle
      gPwmData.Tabc.value[0] = _IQ(0.0);
      gPwmData.Tabc.value[1] = _IQ(0.0);
      gPwmData.Tabc.value[2] = _IQ(0.0);
    }

  // write the PWM compare values
  HAL_writePwmData(halHandle,&gPwmData);
  
  if(gTrjCnt >= gUserParams.numCtrlTicksPerTrajTick)
  {
	  // clear counter
	  gTrjCnt = 0;

	  // run a trajectory for speed reference, so the reference changes with a ramp instead of a step
	  TRAJ_run(trajHandle_spd);
  }

  // run function to set next trigger
  if(!gMotorVars.Flag_enableRsRecalc) runSetTrigger();

  // run field weakening
  if(USER_MOTOR_TYPE == MOTOR_Type_Pm) runFieldWeakening();

  // read the timer 1 value and update the CPU usage module
  timer1Cnt = HAL_readTimerCnt(halHandle,1);
  CPU_USAGE_updateCnts(cpu_usageHandle,timer1Cnt);

  // run the CPU usage module
  CPU_USAGE_run(cpu_usageHandle);

  return;
} // end of mainISR() function


_iq angleDelayComp(const _iq fm_pu, const _iq angleUncomp_pu)
{
  _iq angleDelta_pu = _IQmpy(fm_pu,_IQ(USER_IQ_FULL_SCALE_FREQ_Hz/(USER_PWM_FREQ_kHz*1000.0)));
  _iq angleCompFactor = _IQ(1.0 + (float_t)USER_NUM_PWM_TICKS_PER_ISR_TICK * 0.5);
  _iq angleDeltaComp_pu = _IQmpy(angleDelta_pu, angleCompFactor);
  uint32_t angleMask = ((uint32_t)0xFFFFFFFF >> (32 - GLOBAL_Q));
  _iq angleComp_pu;
  _iq angleTmp_pu;

  // increment the angle
  angleTmp_pu = angleUncomp_pu + angleDeltaComp_pu;

  // mask the angle for wrap around
  // note: must account for the sign of the angle
  angleComp_pu = _IQabs(angleTmp_pu) & angleMask;

  // account for sign
  if(angleTmp_pu < _IQ(0.0))
    {
      angleComp_pu = -angleComp_pu;
    }

  return(angleComp_pu);
} // end of angleDelayComp() function


void runCurrentReconstruction(void)
{
  SVGENCURRENT_MeasureShunt_e measurableShuntThisCycle = SVGENCURRENT_getMode(svgencurrentHandle);

  // run the current reconstruction algorithm
  SVGENCURRENT_RunRegenCurrent(svgencurrentHandle, (MATH_vec3 *)(gAdcData.I.value));

  gIavg.value[0] += (gAdcData.I.value[0] - gIavg.value[0])>>gIavg_shift;
  gIavg.value[1] += (gAdcData.I.value[1] - gIavg.value[1])>>gIavg_shift;
  gIavg.value[2] += (gAdcData.I.value[2] - gIavg.value[2])>>gIavg_shift;

  if(measurableShuntThisCycle > two_phase_measurable)
  {
	  gAdcData.I.value[0] = gIavg.value[0];
	  gAdcData.I.value[1] = gIavg.value[1];
	  gAdcData.I.value[2] = gIavg.value[2];
  }

  return;
} // end of runCurrentReconstruction() function

void runSetTrigger(void)
{
  SVGENCURRENT_IgnoreShunt_e ignoreShuntNextCycle = SVGENCURRENT_getIgnoreShunt(svgencurrentHandle);
  SVGENCURRENT_VmidShunt_e midVolShunt = SVGENCURRENT_getVmid(svgencurrentHandle);

  // Set trigger point in the middle of the low side pulse
  HAL_setTrigger(halHandle,ignoreShuntNextCycle,midVolShunt);

  return;
} // end of runSetTrigger() function

void runFieldWeakening(void)
{
  if(FW_getFlag_enableFw(fwHandle) == true)
    {
      FW_incCounter(fwHandle);

      if(FW_getCounter(fwHandle) > FW_getNumIsrTicksPerFwTick(fwHandle))
        {
          _iq refValue;
          _iq fbackValue;

          FW_clearCounter(fwHandle);

          refValue = gMotorVars.VsRef;

          fbackValue =_IQmpy(gMotorVars.Vs,EST_getOneOverDcBus_pu(estHandle));

          FW_run(fwHandle, refValue, fbackValue, &(gIdq_ref_pu.value[0]));

          gMotorVars.IdRef_A = _IQmpy(gIdq_ref_pu.value[0], _IQ(USER_IQ_FULL_SCALE_CURRENT_A));
        }
    }
  else
    {
      gIdq_ref_pu.value[0] = _IQmpy(gMotorVars.IdRef_A, _IQ(1.0/USER_IQ_FULL_SCALE_CURRENT_A));
    }

  return;
} // end of runFieldWeakening() function


void runOffsetsCalculation(void)
{
  uint16_t cnt;

  // enable the PWM
  HAL_enablePwm(halHandle);

  for(cnt=0;cnt<3;cnt++)
    {
      // Set the PWMs to 50% duty cycle
      gPwmData.Tabc.value[cnt] = _IQ(0.0);

      // reset offsets used
      gOffsets_I_pu.value[cnt] = _IQ(0.0);
      gOffsets_V_pu.value[cnt] = _IQ(0.0);

      // run offset estimation
      FILTER_FO_run(filterHandle[cnt],gAdcData.I.value[cnt]);
      FILTER_FO_run(filterHandle[cnt+3],gAdcData.V.value[cnt]);
    }

  if(gOffsetCalcCount++ >= gUserParams.ctrlWaitTime[CTRL_State_OffLine])
    {
      gMotorVars.Flag_enableOffsetcalc = false;
      gOffsetCalcCount = 0;

      for(cnt=0;cnt<3;cnt++)
        {
          // get calculated offsets from filter
          gOffsets_I_pu.value[cnt] = FILTER_FO_get_y1(filterHandle[cnt]);
          gOffsets_V_pu.value[cnt] = FILTER_FO_get_y1(filterHandle[cnt+3]);

          // clear filters
          FILTER_FO_setInitialConditions(filterHandle[cnt],_IQ(0.0),_IQ(0.0));
          FILTER_FO_setInitialConditions(filterHandle[cnt+3],_IQ(0.0),_IQ(0.0));
        }
    }

  return;
} // end of runOffsetsCalculation() function


void softwareUpdate1p6(EST_Handle handle)
{
  float_t fullScaleInductance = USER_IQ_FULL_SCALE_VOLTAGE_V/(USER_IQ_FULL_SCALE_CURRENT_A*USER_VOLTAGE_FILTER_POLE_rps);
  float_t Ls_coarse_max = _IQ30toF(EST_getLs_coarse_max_pu(handle));
  int_least8_t lShift = ceil(log(USER_MOTOR_Ls_d/(Ls_coarse_max*fullScaleInductance))/log(2.0));
  uint_least8_t Ls_qFmt = 30 - lShift;
  float_t L_max = fullScaleInductance * pow(2.0,lShift);
  _iq Ls_d_pu = _IQ30(USER_MOTOR_Ls_d / L_max);
  _iq Ls_q_pu = _IQ30(USER_MOTOR_Ls_q / L_max);


  // store the results
  EST_setLs_d_pu(handle,Ls_d_pu);
  EST_setLs_q_pu(handle,Ls_q_pu);
  EST_setLs_qFmt(handle,Ls_qFmt);

  return;
} // end of softwareUpdate1p6() function

//! \brief     Setup the Clarke transform for either 2 or 3 sensors.
//! \param[in] handle             The clarke (CLARKE) handle
//! \param[in] numCurrentSensors  The number of current sensors
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


//! \brief     Setup the Clarke transform for either 2 or 3 sensors.
//! \param[in] handle             The clarke (CLARKE) handle
//! \param[in] numVoltageSensors  The number of voltage sensors
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


//! \brief     Update the global variables (gMotorVars).
//! \param[in] handle  The estimator (EST) handle
void updateGlobalVariables(EST_Handle handle)
{
  // get the speed estimate
  gMotorVars.Speed_krpm = EST_getSpeed_krpm(handle);

  // get the torque estimate
  {
    _iq Flux_pu = EST_getFlux_pu(handle);
    _iq Id_pu = PID_getFbackValue(pidHandle[1]);
    _iq Iq_pu = PID_getFbackValue(pidHandle[2]);
    _iq Ld_minus_Lq_pu = _IQ30toIQ(EST_getLs_d_pu(handle)-EST_getLs_q_pu(handle));
    _iq Torque_Flux_Iq_Nm = _IQmpy(_IQmpy(Flux_pu,Iq_pu),gTorque_Flux_Iq_pu_to_Nm_sf);
    _iq Torque_Ls_Id_Iq_Nm = _IQmpy(_IQmpy(_IQmpy(Ld_minus_Lq_pu,Id_pu),Iq_pu),gTorque_Ls_Id_Iq_pu_to_Nm_sf);
    _iq Torque_Nm = Torque_Flux_Iq_Nm + Torque_Ls_Id_Iq_Nm;

    gMotorVars.Torque_Nm = Torque_Nm;
  }

  // get the magnetizing current
  gMotorVars.MagnCurr_A = EST_getIdRated(handle);

  // get the rotor resistance
  gMotorVars.Rr_Ohm = EST_getRr_Ohm(handle);

  // get the stator resistance
  gMotorVars.Rs_Ohm = EST_getRs_Ohm(handle);

  // get the online stator resistance
  gMotorVars.RsOnLine_Ohm = EST_getRsOnLine_Ohm(handle);

  // get the stator inductance in the direct coordinate direction
  gMotorVars.Lsd_H = EST_getLs_d_H(handle);

  // get the stator inductance in the quadrature coordinate direction
  gMotorVars.Lsq_H = EST_getLs_q_H(handle);

  // get the flux in V/Hz in floating point
  gMotorVars.Flux_VpHz = EST_getFlux_VpHz(handle);

  // get the flux in Wb in fixed point
  gMotorVars.Flux_Wb = _IQmpy(EST_getFlux_pu(handle),gFlux_pu_to_Wb_sf);

  // get the estimator state
  gMotorVars.EstState = EST_getState(handle);

  // Get the DC buss voltage
  gMotorVars.VdcBus_kV = _IQmpy(gAdcData.dcBus,_IQ(USER_IQ_FULL_SCALE_VOLTAGE_V/1000.0));

  // read Vd and Vq vectors per units
  gMotorVars.Vd = gVdq_out_pu.value[0];
  gMotorVars.Vq = gVdq_out_pu.value[1];

  // calculate vector Vs in per units
  gMotorVars.Vs = _IQsqrt(_IQmpy(gMotorVars.Vd, gMotorVars.Vd) + _IQmpy(gMotorVars.Vq, gMotorVars.Vq));

  // read Id and Iq vectors in amps
  gMotorVars.Id_A = _IQmpy(gIdq_pu.value[0], _IQ(USER_IQ_FULL_SCALE_CURRENT_A));
  gMotorVars.Iq_A = _IQmpy(gIdq_pu.value[1], _IQ(USER_IQ_FULL_SCALE_CURRENT_A));

  // calculate vector Is in amps
  gMotorVars.Is_A = _IQsqrt(_IQmpy(gMotorVars.Id_A, gMotorVars.Id_A) + _IQmpy(gMotorVars.Iq_A, gMotorVars.Iq_A));

  return;
} // end of updateGlobalVariables() function


void updateCPUusage(void)
{
  uint32_t minDeltaCntObserved = CPU_USAGE_getMinDeltaCntObserved(cpu_usageHandle);
  uint32_t avgDeltaCntObserved = CPU_USAGE_getAvgDeltaCntObserved(cpu_usageHandle);
  uint32_t maxDeltaCntObserved = CPU_USAGE_getMaxDeltaCntObserved(cpu_usageHandle);
  uint16_t pwmPeriod = HAL_readPwmPeriod(halHandle,PWM_Number_1);
  float_t  cpu_usage_den = (float_t)pwmPeriod * (float_t)USER_NUM_PWM_TICKS_PER_ISR_TICK * 2.0;

  // calculate the minimum cpu usage percentage
  gCpuUsagePercentageMin = (float_t)minDeltaCntObserved / cpu_usage_den * 100.0;

  // calculate the average cpu usage percentage
  gCpuUsagePercentageAvg = (float_t)avgDeltaCntObserved / cpu_usage_den * 100.0;

  // calculate the maximum cpu usage percentage
  gCpuUsagePercentageMax = (float_t)maxDeltaCntObserved / cpu_usage_den * 100.0;

  return;
} // end of updateCPUusage() function


//@} //defgroup
// end of file



