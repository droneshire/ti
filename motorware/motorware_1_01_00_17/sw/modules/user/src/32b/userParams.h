#ifndef _USERPARAMS_H_
#define _USERPARAMS_H_
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

//! \file   solutions/instaspin_foc/boards/drv8301kit_revD/f28x/f2806xF/src/user.h
//! \brief Contains the public interface for user initialization data for the CTRL, DRV, and EST modules 
//!
//! (C) Copyright 2012, Texas Instruments, Inc.


// **************************************************************************
// the includes

// modules
#include "sw/modules/types/src/types.h"


//!
//!
//! \defgroup USERPARAMS USERPARAMS
//!
//@{


#ifdef __cplusplus
extern "C" {
#endif




// **************************************************************************
// the typedefs

//! \brief Defines a structure for the user parameters
//!
typedef struct _USER_Params_
{
  float_t       iqFullScaleCurrent_A;         //!< Defines the full scale current for the IQ variables, A
  float_t       iqFullScaleVoltage_V;         //!< Defines the full scale voltage for the IQ variable, V
  float_t       iqFullScaleFreq_Hz;           //!< Defines the full scale frequency for IQ variable, Hz	

  uint_least16_t  numIsrTicksPerCtrlTick;       //!< Defines the number of Interrupt Service Routine (ISR) clock ticks per controller clock tick
  uint_least16_t  numCtrlTicksPerCurrentTick;   //!< Defines the number of controller clock ticks per current controller clock tick
  uint_least16_t  numCtrlTicksPerEstTick;       //!< Defines the number of controller clock ticks per estimator clock tick
  uint_least16_t  numCtrlTicksPerSpeedTick;     //!< Defines the number of controller clock ticks per speed controller clock tick
  uint_least16_t  numCtrlTicksPerTrajTick;      //!< Defines the number of controller clock ticks per trajectory clock tick
  uint_least8_t   numCurrentSensors;            //!< Defines the number of current sensors
  uint_least8_t   numVoltageSensors;            //!< Defines the number of voltage sensors

  float_t       offsetPole_rps;               //!< Defines the pole location for the voltage and current offset estimation, rad/s
  float_t       fluxPole_rps;                 //!< Defines the pole location for the flux estimation, rad/s
  float_t       zeroSpeedLimit;               //!< Defines the low speed limit for the flux integrator, pu 
  float_t       forceAngleFreq_Hz;            //!< Defines the force angle frequency, Hz
  float_t       maxAccel_Hzps;                //!< Defines the maximum acceleration for the speed profiles, Hz/s
  float_t       maxAccel_est_Hzps;            //!< Defines the maximum acceleration for the estimation speed profiles, Hz/s
  float_t       directionPole_rps;            //!< Defines the pole location for the direction filter, rad/s
  float_t       speedPole_rps;                //!< Defines the pole location for the speed control filter, rad/s
  float_t       dcBusPole_rps;                //!< Defines the pole location for the DC bus filter, rad/s
  float_t       fluxFraction;                 //!< Defines the flux fraction for Id rated current estimation
  float_t       indEst_speedMaxFraction;      //!< Defines the fraction of SpeedMax to use during inductance estimation
  float_t       eplGain;                      //!< Defines the EPL (Efficient Partial Load) gain for computing Id reference

  uint_least16_t  systemFreq_MHz;               //!< Defines the system clock frequency, MHz

  float_t       pwmPeriod_usec;               //!< Defines the Pulse Width Modulation (PWM) period, usec
  float_t       voltage_sf;                   //!< Defines the voltage scale factor for the system
  float_t       current_sf;                   //!< Defines the current scale factor for the system
  float_t       voltageFilterPole_rps;        //!< Defines the analog voltage filter pole location, rad/s
  float_t       maxVsMag_pu;                  //!< Defines the maximum voltage magnitude, pu
  float_t       estKappa;                     //!< Defines the convergence factor for the estimator

  MOTOR_Type_e    motor_type;                   //!< Defines the motor type
  uint_least16_t  motor_numPolePairs;           //!< Defines the number of pole pairs for the motor

  float_t       motor_ratedFlux;              //!< Defines the rated flux of the motor, V/Hz
  float_t       motor_Rr;                     //!< Defines the rotor resistance, ohm
  float_t       motor_Rs;                     //!< Defines the stator resistance, ohm
  float_t       motor_Ls_d;                   //!< Defines the direct stator inductance, H
  float_t       motor_Ls_q;                   //!< Defines the quadrature stator inductance, H
  float_t       maxCurrent;                   //!< Defines the maximum current value, A
  float_t       maxCurrent_resEst;            //!< Defines the maximum current value for resistance estimation, A
  float_t       maxCurrent_indEst;            //!< Defines the maximum current value for inductance estimation, A
  float_t       maxCurrentSlope;              //!< Defines the maximum current slope for Id current trajectory
  float_t       maxCurrentSlope_epl;          //!< Defines the maximum current slope for Id current trajectory during EPL mode
  float_t       IdRated;                      //!< Defines the Id rated current value, A
  float_t       IdRatedFraction_indEst;       //!< Defines the fraction of Id rated current to use during inductance estimation
  float_t       IdRatedFraction_ratedFlux;    //!< Defines the fraction of Id rated current to use during rated flux estimation
  float_t       IdRated_delta;                //!< Defines the Id rated delta current value, A
  float_t       fluxEstFreq_Hz;               //!< Defines the flux estimation frequency, Hz

  uint_least32_t  ctrlWaitTime[CTRL_numStates]; //!< Defines the wait times for each controller state, estimator ticks
  uint_least32_t  estWaitTime[EST_numStates];   //!< Defines the wait times for each estimator state, estimator ticks
  uint_least32_t  FluxWaitTime[EST_Flux_numStates]; //!< Defines the wait times for each Ls estimator, estimator ticks
  uint_least32_t  LsWaitTime[EST_Ls_numStates]; //!< Defines the wait times for each Ls estimator, estimator ticks
  uint_least32_t  RsWaitTime[EST_Rs_numStates]; //!< Defines the wait times for each Rs estimator, estimator ticks
  uint_least32_t  ctrlFreq_Hz;                  //!< Defines the controller frequency, Hz
  uint_least32_t  estFreq_Hz;                   //!< Defines the estimator frequency, Hz
  uint_least32_t  RoverL_estFreq_Hz;            //!< Defines the R/L estimation frequency, Hz
  uint_least32_t  trajFreq_Hz;                  //!< Defines the trajectory frequency, Hz

  float_t       ctrlPeriod_sec;               //!< Defines the controller execution period, sec

  float_t       maxNegativeIdCurrent_a;       //!< Defines the maximum negative current that the Id PID is allowed to go to, A
} USER_Params;


#ifdef __cplusplus
}
#endif // extern "C"

//@} // ingroup
#endif // end of _USERPARAMS_H_ definition
