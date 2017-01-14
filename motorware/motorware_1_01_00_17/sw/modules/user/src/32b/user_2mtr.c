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
//! \file   solutions/instaspin_foc/src/user.c
//! \brief Contains the function for setting initialization data to the CTRL, HAL, and EST modules
//!
//! (C) Copyright 2012, Texas Instruments, Inc.


// **************************************************************************
// the includes

#include <math.h>
#include "user1.h"
#include "user2.h"


// **************************************************************************
// the defines


// **************************************************************************
// the typedefs


// **************************************************************************
// the functions


void USER_setParamsMtr1(USER_Params *pUserParams)
{
  pUserParams->iqFullScaleCurrent_A = USER_IQ_FULL_SCALE_CURRENT_A;
  pUserParams->iqFullScaleVoltage_V = USER_IQ_FULL_SCALE_VOLTAGE_V;

  pUserParams->iqFullScaleFreq_Hz = USER_IQ_FULL_SCALE_FREQ_Hz;

  pUserParams->numIsrTicksPerCtrlTick = USER_NUM_ISR_TICKS_PER_CTRL_TICK;
  pUserParams->numCtrlTicksPerCurrentTick = USER_NUM_CTRL_TICKS_PER_CURRENT_TICK;
  pUserParams->numCtrlTicksPerEstTick = USER_NUM_CTRL_TICKS_PER_EST_TICK;
  pUserParams->numCtrlTicksPerSpeedTick = USER_NUM_CTRL_TICKS_PER_SPEED_TICK;
  pUserParams->numCtrlTicksPerTrajTick = USER_NUM_CTRL_TICKS_PER_TRAJ_TICK;
  pUserParams->numPwmTicksPerIsrTick = USER_NUM_PWM_TICKS_PER_ISR_TICK;

  pUserParams->numCurrentSensors = USER_NUM_CURRENT_SENSORS;
  pUserParams->numVoltageSensors = USER_NUM_VOLTAGE_SENSORS;

  pUserParams->offsetPole_rps = USER_OFFSET_POLE_rps;
  pUserParams->fluxPole_rps = USER_FLUX_POLE_rps;

  pUserParams->zeroSpeedLimit = USER_ZEROSPEEDLIMIT;

  pUserParams->forceAngleFreq_Hz = USER_FORCE_ANGLE_FREQ_Hz;

  pUserParams->maxAccel_Hzps = USER_MAX_ACCEL_Hzps;

  pUserParams->maxAccel_est_Hzps = USER_MAX_ACCEL_EST_Hzps;

  pUserParams->directionPole_rps = USER_DIRECTION_POLE_rps;

  pUserParams->speedPole_rps = USER_SPEED_POLE_rps;

  pUserParams->dcBusPole_rps = USER_DCBUS_POLE_rps;

  pUserParams->fluxFraction = USER_FLUX_FRACTION;

  pUserParams->indEst_speedMaxFraction = USER_SPEEDMAX_FRACTION_FOR_L_IDENT;

  pUserParams->systemFreq_MHz = USER_SYSTEM_FREQ_MHz;

  pUserParams->pwmPeriod_usec = USER_PWM_PERIOD_usec;

  pUserParams->voltage_sf = USER_VOLTAGE_SF;

  pUserParams->current_sf = USER_CURRENT_SF;

  pUserParams->voltageFilterPole_rps = USER_VOLTAGE_FILTER_POLE_rps;

  pUserParams->maxVsMag_pu = USER_MAX_VS_MAG_PU;

  pUserParams->estKappa = USER_EST_KAPPAQ;

  pUserParams->motor_type = USER_MOTOR_TYPE;
  pUserParams->motor_numPolePairs = USER_MOTOR_NUM_POLE_PAIRS;
  pUserParams->motor_ratedFlux = USER_MOTOR_RATED_FLUX;
  pUserParams->motor_Rr = USER_MOTOR_Rr;
  pUserParams->motor_Rs = USER_MOTOR_Rs;
  pUserParams->motor_Ls_d = USER_MOTOR_Ls_d;
  pUserParams->motor_Ls_q = USER_MOTOR_Ls_q;

  if((pUserParams->motor_Rr > (float_t)0.0) && (pUserParams->motor_Rs > (float_t)0.0))
    {
      pUserParams->powerWarpGain = sqrt((float_t)1.0 + pUserParams->motor_Rr/pUserParams->motor_Rs);
    }
  else
    {
      pUserParams->powerWarpGain = USER_POWERWARP_GAIN;
    }

  pUserParams->maxCurrent_resEst = USER_MOTOR_RES_EST_CURRENT;
  pUserParams->maxCurrent_indEst = USER_MOTOR_IND_EST_CURRENT;
  pUserParams->maxCurrent = USER_MOTOR_MAX_CURRENT;

  pUserParams->maxCurrentSlope = USER_MAX_CURRENT_SLOPE;
  pUserParams->maxCurrentSlope_powerWarp = USER_MAX_CURRENT_SLOPE_POWERWARP;

  pUserParams->IdRated = USER_MOTOR_MAGNETIZING_CURRENT;
  pUserParams->IdRatedFraction_ratedFlux = USER_IDRATED_FRACTION_FOR_RATED_FLUX;
  pUserParams->IdRatedFraction_indEst = USER_IDRATED_FRACTION_FOR_L_IDENT;
  pUserParams->IdRated_delta = USER_IDRATED_DELTA;

  pUserParams->fluxEstFreq_Hz = USER_MOTOR_FLUX_EST_FREQ_Hz;

  pUserParams->ctrlWaitTime[CTRL_State_Error]         = 0;
  pUserParams->ctrlWaitTime[CTRL_State_Idle]          = 0;
  pUserParams->ctrlWaitTime[CTRL_State_OffLine]       = (uint_least32_t)( 5.0 * USER_CTRL_FREQ_Hz);
  pUserParams->ctrlWaitTime[CTRL_State_OnLine]        = 0;

  pUserParams->estWaitTime[EST_State_Error]           = 0;
  pUserParams->estWaitTime[EST_State_Idle]            = 0;
  pUserParams->estWaitTime[EST_State_RoverL]          = (uint_least32_t)( 8.0 * USER_EST_FREQ_Hz);
  pUserParams->estWaitTime[EST_State_Rs]              = 0;
  pUserParams->estWaitTime[EST_State_RampUp]          = (uint_least32_t)((5.0 + USER_MOTOR_FLUX_EST_FREQ_Hz / USER_MAX_ACCEL_EST_Hzps) * USER_EST_FREQ_Hz);
  pUserParams->estWaitTime[EST_State_IdRated]         = (uint_least32_t)(30.0 * USER_EST_FREQ_Hz);
  pUserParams->estWaitTime[EST_State_RatedFlux_OL]    = (uint_least32_t)( 0.2 * USER_EST_FREQ_Hz);
  pUserParams->estWaitTime[EST_State_RatedFlux]       = 0;
  pUserParams->estWaitTime[EST_State_RampDown]        = (uint_least32_t)( 2.0 * USER_EST_FREQ_Hz);
  pUserParams->estWaitTime[EST_State_LockRotor]       = 0;
  pUserParams->estWaitTime[EST_State_Ls]              = 0;
  pUserParams->estWaitTime[EST_State_Rr]              = (uint_least32_t)(20.0 * USER_EST_FREQ_Hz);
  pUserParams->estWaitTime[EST_State_MotorIdentified] = 0;
  pUserParams->estWaitTime[EST_State_OnLine]          = 0;

  pUserParams->FluxWaitTime[EST_Flux_State_Error]     = 0;
  pUserParams->FluxWaitTime[EST_Flux_State_Idle]      = 0;
  pUserParams->FluxWaitTime[EST_Flux_State_CL1]       = (uint_least32_t)(10.0 * USER_EST_FREQ_Hz);
  pUserParams->FluxWaitTime[EST_Flux_State_CL2]       = (uint_least32_t)( 0.2 * USER_EST_FREQ_Hz);
  pUserParams->FluxWaitTime[EST_Flux_State_Fine]      = (uint_least32_t)( 4.0 * USER_EST_FREQ_Hz);
  pUserParams->FluxWaitTime[EST_Flux_State_Done]      = 0;

  pUserParams->LsWaitTime[EST_Ls_State_Error]        = 0;
  pUserParams->LsWaitTime[EST_Ls_State_Idle]         = 0;
  pUserParams->LsWaitTime[EST_Ls_State_RampUp]       = (uint_least32_t)( 3.0 * USER_EST_FREQ_Hz);
  pUserParams->LsWaitTime[EST_Ls_State_Init]         = (uint_least32_t)( 3.0 * USER_EST_FREQ_Hz);
  pUserParams->LsWaitTime[EST_Ls_State_Coarse]       = (uint_least32_t)( 0.2 * USER_EST_FREQ_Hz);
  pUserParams->LsWaitTime[EST_Ls_State_Fine]         = (uint_least32_t)(30.0 * USER_EST_FREQ_Hz);
  pUserParams->LsWaitTime[EST_Ls_State_Done]         = 0;

  pUserParams->RsWaitTime[EST_Rs_State_Error]        = 0;
  pUserParams->RsWaitTime[EST_Rs_State_Idle]         = 0;
  pUserParams->RsWaitTime[EST_Rs_State_RampUp]       = (uint_least32_t)( 1.0 * USER_EST_FREQ_Hz);
  pUserParams->RsWaitTime[EST_Rs_State_Coarse]       = (uint_least32_t)( 2.0 * USER_EST_FREQ_Hz);
  pUserParams->RsWaitTime[EST_Rs_State_Fine]         = (uint_least32_t)( 7.0 * USER_EST_FREQ_Hz);
  pUserParams->RsWaitTime[EST_Rs_State_Done]         = 0;

  pUserParams->ctrlFreq_Hz = USER_CTRL_FREQ_Hz;

  pUserParams->estFreq_Hz = USER_EST_FREQ_Hz;

  pUserParams->RoverL_estFreq_Hz = USER_R_OVER_L_EST_FREQ_Hz;

  pUserParams->trajFreq_Hz = USER_TRAJ_FREQ_Hz;

  pUserParams->ctrlPeriod_sec = USER_CTRL_PERIOD_sec;

  pUserParams->maxNegativeIdCurrent_a = USER_MAX_NEGATIVE_ID_REF_CURRENT_A;

  return;
} // end of USER_setParams() function


void USER_setParamsMtr2(USER_Params *pUserParams)
{
  pUserParams->iqFullScaleCurrent_A = USER_IQ_FULL_SCALE_CURRENT_A_2;
  pUserParams->iqFullScaleVoltage_V = USER_IQ_FULL_SCALE_VOLTAGE_V_2;

  pUserParams->iqFullScaleFreq_Hz = USER_IQ_FULL_SCALE_FREQ_Hz_2;

  pUserParams->numIsrTicksPerCtrlTick = USER_NUM_ISR_TICKS_PER_CTRL_TICK_2;
  pUserParams->numCtrlTicksPerCurrentTick = USER_NUM_CTRL_TICKS_PER_CURRENT_TICK_2;
  pUserParams->numCtrlTicksPerEstTick = USER_NUM_CTRL_TICKS_PER_EST_TICK_2;
  pUserParams->numCtrlTicksPerSpeedTick = USER_NUM_CTRL_TICKS_PER_SPEED_TICK_2;
  pUserParams->numCtrlTicksPerTrajTick = USER_NUM_CTRL_TICKS_PER_TRAJ_TICK_2;
  pUserParams->numPwmTicksPerIsrTick = USER_NUM_PWM_TICKS_PER_ISR_TICK_2;

  pUserParams->numCurrentSensors = USER_NUM_CURRENT_SENSORS_2;
  pUserParams->numVoltageSensors = USER_NUM_VOLTAGE_SENSORS_2;

  pUserParams->offsetPole_rps = USER_OFFSET_POLE_rps_2;
  pUserParams->fluxPole_rps = USER_FLUX_POLE_rps_2;

  pUserParams->zeroSpeedLimit = USER_ZEROSPEEDLIMIT_2;

  pUserParams->forceAngleFreq_Hz = USER_FORCE_ANGLE_FREQ_Hz_2;

  pUserParams->maxAccel_Hzps = USER_MAX_ACCEL_Hzps_2;

  pUserParams->maxAccel_est_Hzps = USER_MAX_ACCEL_EST_Hzps_2;

  pUserParams->directionPole_rps = USER_DIRECTION_POLE_rps_2;

  pUserParams->speedPole_rps = USER_SPEED_POLE_rps_2;

  pUserParams->dcBusPole_rps = USER_DCBUS_POLE_rps_2;

  pUserParams->fluxFraction = USER_FLUX_FRACTION_2;

  pUserParams->indEst_speedMaxFraction = USER_SPEEDMAX_FRACTION_FOR_L_IDENT_2;

  pUserParams->systemFreq_MHz = USER_SYSTEM_FREQ_MHz_2;

  pUserParams->pwmPeriod_usec = USER_PWM_PERIOD_usec_2;

  pUserParams->voltage_sf = USER_VOLTAGE_SF_2;

  pUserParams->current_sf = USER_CURRENT_SF_2;

  pUserParams->voltageFilterPole_rps = USER_VOLTAGE_FILTER_POLE_rps_2;

  pUserParams->maxVsMag_pu = USER_MAX_VS_MAG_PU_2;

  pUserParams->estKappa = USER_EST_KAPPAQ_2;

  pUserParams->motor_type = USER_MOTOR_TYPE_2;
  pUserParams->motor_numPolePairs = USER_MOTOR_NUM_POLE_PAIRS_2;
  pUserParams->motor_ratedFlux = USER_MOTOR_RATED_FLUX_2;
  pUserParams->motor_Rr = USER_MOTOR_Rr_2;
  pUserParams->motor_Rs = USER_MOTOR_Rs_2;
  pUserParams->motor_Ls_d = USER_MOTOR_Ls_d_2;
  pUserParams->motor_Ls_q = USER_MOTOR_Ls_q_2;

  if((pUserParams->motor_Rr > (float_t)0.0) && (pUserParams->motor_Rs > (float_t)0.0))
    {
      pUserParams->powerWarpGain = sqrt((float_t)1.0 + pUserParams->motor_Rr/pUserParams->motor_Rs);
    }
  else
    {
      pUserParams->powerWarpGain = USER_POWERWARP_GAIN_2;
    }

  pUserParams->maxCurrent_resEst = USER_MOTOR_RES_EST_CURRENT_2;
  pUserParams->maxCurrent_indEst = USER_MOTOR_IND_EST_CURRENT_2;
  pUserParams->maxCurrent = USER_MOTOR_MAX_CURRENT_2;

  pUserParams->maxCurrentSlope = USER_MAX_CURRENT_SLOPE_2;
  pUserParams->maxCurrentSlope_powerWarp = USER_MAX_CURRENT_SLOPE_POWERWARP_2;

  pUserParams->IdRated = USER_MOTOR_MAGNETIZING_CURRENT_2;
  pUserParams->IdRatedFraction_ratedFlux = USER_IDRATED_FRACTION_FOR_RATED_FLUX_2;
  pUserParams->IdRatedFraction_indEst = USER_IDRATED_FRACTION_FOR_L_IDENT_2;
  pUserParams->IdRated_delta = USER_IDRATED_DELTA_2;

  pUserParams->fluxEstFreq_Hz = USER_MOTOR_FLUX_EST_FREQ_Hz_2;

  pUserParams->ctrlWaitTime[CTRL_State_Error]         = 0;
  pUserParams->ctrlWaitTime[CTRL_State_Idle]          = 0;
  pUserParams->ctrlWaitTime[CTRL_State_OffLine]       = (uint_least32_t)( 5.0 * USER_CTRL_FREQ_Hz_2);
  pUserParams->ctrlWaitTime[CTRL_State_OnLine]        = 0;

  pUserParams->estWaitTime[EST_State_Error]           = 0;
  pUserParams->estWaitTime[EST_State_Idle]            = 0;
  pUserParams->estWaitTime[EST_State_RoverL]          = (uint_least32_t)( 8.0 * USER_EST_FREQ_Hz_2);
  pUserParams->estWaitTime[EST_State_Rs]              = 0;
  pUserParams->estWaitTime[EST_State_RampUp]          = (uint_least32_t)((5.0 + USER_MOTOR_FLUX_EST_FREQ_Hz_2 / USER_MAX_ACCEL_EST_Hzps_2) * USER_EST_FREQ_Hz_2);
  pUserParams->estWaitTime[EST_State_IdRated]         = (uint_least32_t)(30.0 * USER_EST_FREQ_Hz_2);
  pUserParams->estWaitTime[EST_State_RatedFlux_OL]    = (uint_least32_t)( 0.2 * USER_EST_FREQ_Hz_2);
  pUserParams->estWaitTime[EST_State_RatedFlux]       = 0;
  pUserParams->estWaitTime[EST_State_RampDown]        = (uint_least32_t)( 2.0 * USER_EST_FREQ_Hz_2);
  pUserParams->estWaitTime[EST_State_LockRotor]       = 0;
  pUserParams->estWaitTime[EST_State_Ls]              = 0;
  pUserParams->estWaitTime[EST_State_Rr]              = (uint_least32_t)(20.0 * USER_EST_FREQ_Hz_2);
  pUserParams->estWaitTime[EST_State_MotorIdentified] = 0;
  pUserParams->estWaitTime[EST_State_OnLine]          = 0;

  pUserParams->FluxWaitTime[EST_Flux_State_Error]     = 0;
  pUserParams->FluxWaitTime[EST_Flux_State_Idle]      = 0;
  pUserParams->FluxWaitTime[EST_Flux_State_CL1]       = (uint_least32_t)(10.0 * USER_EST_FREQ_Hz_2);
  pUserParams->FluxWaitTime[EST_Flux_State_CL2]       = (uint_least32_t)( 0.2 * USER_EST_FREQ_Hz_2);
  pUserParams->FluxWaitTime[EST_Flux_State_Fine]      = (uint_least32_t)( 4.0 * USER_EST_FREQ_Hz_2);
  pUserParams->FluxWaitTime[EST_Flux_State_Done]      = 0;

  pUserParams->LsWaitTime[EST_Ls_State_Error]        = 0;
  pUserParams->LsWaitTime[EST_Ls_State_Idle]         = 0;
  pUserParams->LsWaitTime[EST_Ls_State_RampUp]       = (uint_least32_t)( 3.0 * USER_EST_FREQ_Hz_2);
  pUserParams->LsWaitTime[EST_Ls_State_Init]         = (uint_least32_t)( 3.0 * USER_EST_FREQ_Hz_2);
  pUserParams->LsWaitTime[EST_Ls_State_Coarse]       = (uint_least32_t)( 0.2 * USER_EST_FREQ_Hz_2);
  pUserParams->LsWaitTime[EST_Ls_State_Fine]         = (uint_least32_t)(30.0 * USER_EST_FREQ_Hz_2);
  pUserParams->LsWaitTime[EST_Ls_State_Done]         = 0;

  pUserParams->RsWaitTime[EST_Rs_State_Error]        = 0;
  pUserParams->RsWaitTime[EST_Rs_State_Idle]         = 0;
  pUserParams->RsWaitTime[EST_Rs_State_RampUp]       = (uint_least32_t)( 1.0 * USER_EST_FREQ_Hz_2);
  pUserParams->RsWaitTime[EST_Rs_State_Coarse]       = (uint_least32_t)( 2.0 * USER_EST_FREQ_Hz_2);
  pUserParams->RsWaitTime[EST_Rs_State_Fine]         = (uint_least32_t)( 7.0 * USER_EST_FREQ_Hz_2);
  pUserParams->RsWaitTime[EST_Rs_State_Done]         = 0;

  pUserParams->ctrlFreq_Hz = USER_CTRL_FREQ_Hz_2;

  pUserParams->estFreq_Hz = USER_EST_FREQ_Hz_2;

  pUserParams->RoverL_estFreq_Hz = USER_R_OVER_L_EST_FREQ_Hz_2;

  pUserParams->trajFreq_Hz = USER_TRAJ_FREQ_Hz_2;

  pUserParams->ctrlPeriod_sec = USER_CTRL_PERIOD_sec_2;

  pUserParams->maxNegativeIdCurrent_a = USER_MAX_NEGATIVE_ID_REF_CURRENT_A_2;

  return;
} // end of USER_setParamsMtr2() function


//! \brief     Computes the scale factor needed to convert from torque created by Ld, Lq, Id and Iq, from per unit to Nm
//!
_iq USER_computeTorque_Ls_Id_Iq_pu_to_Nm_sf(USER_Params *pUserParams)
{
  float_t FullScaleInductance = (pUserParams->iqFullScaleVoltage_V/(pUserParams->iqFullScaleCurrent_A*pUserParams->voltageFilterPole_rps));
  float_t FullScaleCurrent = (pUserParams->iqFullScaleCurrent_A);
  float_t lShift = ceil(log(pUserParams->motor_Ls_d/(0.7*FullScaleInductance))/log(2.0));

  return(_IQ(FullScaleInductance*FullScaleCurrent*FullScaleCurrent*pUserParams->motor_numPolePairs*1.5*pow(2.0,lShift)));
} // end of USER_computeTorque_Ls_Id_Iq_pu_to_Nm_sf() function


//! \brief     Computes the scale factor needed to convert from torque created by flux and Iq, from per unit to Nm
//!
_iq USER_computeTorque_Flux_Iq_pu_to_Nm_sf(USER_Params *pUserParams)
{
  float_t FullScaleFlux = (pUserParams->iqFullScaleVoltage_V/(float_t)pUserParams->estFreq_Hz);
  float_t FullScaleCurrent = (pUserParams->iqFullScaleCurrent_A);
  float_t maxFlux = (pUserParams->motor_ratedFlux*((pUserParams->motor_type==MOTOR_Type_Induction)?0.05:0.7));
  float_t lShift = -ceil(log(FullScaleFlux/maxFlux)/log(2.0));

  return(_IQ(FullScaleFlux/(2.0*MATH_PI)*FullScaleCurrent*pUserParams->motor_numPolePairs*1.5*pow(2.0,lShift)));
} // end of USER_computeTorque_Flux_Iq_pu_to_Nm_sf() function


//! \brief     Computes the scale factor needed to convert from per unit to Wb
//!
_iq USER_computeFlux_pu_to_Wb_sf(USER_Params *pUserParams)
{
  float_t FullScaleFlux = (pUserParams->iqFullScaleVoltage_V/(float_t)pUserParams->estFreq_Hz);
  float_t maxFlux = (pUserParams->motor_ratedFlux*((pUserParams->motor_type==MOTOR_Type_Induction)?0.05:0.7));
  float_t lShift = -ceil(log(FullScaleFlux/maxFlux)/log(2.0));

  return(_IQ(FullScaleFlux/(2.0*MATH_PI)*pow(2.0,lShift)));
} // end of USER_computeFlux_pu_to_Wb_sf() function


//! \brief     Computes the scale factor needed to convert from per unit to V/Hz
//!
_iq USER_computeFlux_pu_to_VpHz_sf(USER_Params *pUserParams)
{
  float_t FullScaleFlux = (pUserParams->iqFullScaleVoltage_V/(float_t)pUserParams->estFreq_Hz);
  float_t maxFlux = (pUserParams->motor_ratedFlux*((USER_MOTOR_TYPE==MOTOR_Type_Induction)?0.05:0.7));
  float_t lShift = -ceil(log(FullScaleFlux/maxFlux)/log(2.0));

  return(_IQ(FullScaleFlux*pow(2.0,lShift)));
} // end of USER_computeFlux_pu_to_VpHz_sf() function


////! \brief     Computes Flux in Wb or V/Hz depending on the scale factor sent as parameter
////!
//_iq USER_computeFlux(CTRL_Handle handle, const _iq sf)
//{
//  CTRL_Obj *obj = (CTRL_Obj *)handle;
//
//  return(_IQmpy(EST_getFlux_pu(obj->estHandle),sf));
//} // end of USER_computeFlux() function
//
//
////! \brief     Computes Torque in Nm
////!
//_iq USER_computeTorque_Nm(CTRL_Handle handle, const _iq torque_Flux_sf, const _iq torque_Ls_sf)
//{
//  CTRL_Obj *obj = (CTRL_Obj *)handle;
//
//  _iq Flux_pu = EST_getFlux_pu(obj->estHandle);
//  _iq Id_pu = PID_getFbackValue(obj->pidHandle_Id);
//  _iq Iq_pu = PID_getFbackValue(obj->pidHandle_Iq);
//  _iq Ld_minus_Lq_pu = _IQ30toIQ(EST_getLs_d_pu(obj->estHandle)-EST_getLs_q_pu(obj->estHandle));
//  _iq Torque_Flux_Iq_Nm = _IQmpy(_IQmpy(Flux_pu,Iq_pu),torque_Flux_sf);
//  _iq Torque_Ls_Id_Iq_Nm = _IQmpy(_IQmpy(_IQmpy(Ld_minus_Lq_pu,Id_pu),Iq_pu),torque_Ls_sf);
//  _iq Torque_Nm = Torque_Flux_Iq_Nm + Torque_Ls_Id_Iq_Nm;
//
//  return(Torque_Nm);
//} // end of USER_computeTorque_Nm() function
//
//
////! \brief     Computes Torque in Nm
////!
//_iq USER_computeTorque_lbin(CTRL_Handle handle, const _iq torque_Flux_sf, const _iq torque_Ls_sf)
//{
//  CTRL_Obj *obj = (CTRL_Obj *)handle;
//
//  _iq Flux_pu = EST_getFlux_pu(obj->estHandle);
//  _iq Id_pu = PID_getFbackValue(obj->pidHandle_Id);
//  _iq Iq_pu = PID_getFbackValue(obj->pidHandle_Iq);
//  _iq Ld_minus_Lq_pu = _IQ30toIQ(EST_getLs_d_pu(obj->estHandle)-EST_getLs_q_pu(obj->estHandle));
//  _iq Torque_Flux_Iq_Nm = _IQmpy(_IQmpy(Flux_pu,Iq_pu),torque_Flux_sf);
//  _iq Torque_Ls_Id_Iq_Nm = _IQmpy(_IQmpy(_IQmpy(Ld_minus_Lq_pu,Id_pu),Iq_pu),torque_Ls_sf);
//  _iq Torque_Nm = Torque_Flux_Iq_Nm + Torque_Ls_Id_Iq_Nm;
//
//  return(_IQmpy(Torque_Nm, _IQ(MATH_Nm_TO_lbin_SF)));
//} // end of USER_computeTorque_lbin() function


// end of file

