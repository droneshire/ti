#ifndef _SPINTAC_POSITION_H_
#define _SPINTAC_POSITION_H_
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

//! \file   solutions/instaspin_motion/src/spintac_position_2mtr.h
//! \brief  Contains public interface to various functions related
//!         to the SpinTAC (ST) object
//!
//! (C) Copyright 2012, LineStream Technologies, Inc.
//! (C) Copyright 2011, Texas Instruments, Inc.


// **************************************************************************
// the includes
#include "main_position_2mtr.h"

#include "sw/modules/spintac/src/32b/spintac_pos_conv.h"
#include "sw/modules/spintac/src/32b/spintac_pos_ctl.h"
#include "sw/modules/spintac/src/32b/spintac_pos_move.h"
#include "sw/modules/spintac/src/32b/spintac_pos_plan.h"

//!
//!
//! \defgroup ST ST
//!
//@{

#ifdef __cplusplus
extern "C" {
#endif

// **************************************************************************
// the defines

//! \brief ROTATION UNIT MAXIMUMS
// **************************************************************************
//! \brief Defines the maximum and minimum value at which the Mechanical Revolution [MRev] will rollover.
//! \brief The position signal produced by SpinTAC Position Converter is a sawtooth signal.
//! \brief All SpinTAC Components need to be aware of the bounds of this signal.
//! \brief When the position signal reaches the maximum value it will immediatly go to the minimum value.
//! \brief The minimum value is the negative of the maximum value.
#define ST_MREV_ROLLOVER (10.0)
#define ST_MREV_ROLLOVER_2 (10.0)

//! \brief Defines the maximum value for an Electrical Revolution [ERev]
//! \brief The position siganl produced by the ENC module is a sawtooth signal
//! \brief This signal varies from 0 to the value specified in ST_EREV_MAXIMUM
#define ST_EREV_MAXIMUM (1.0)
#define ST_EREV_MAXIMUM_2 (1.0)

//! \brief Defines the maximum value of error allowable in SpinTAC Position Control, MRev
//! \breif This value should be the maximum amount of position error that is allowable in your system.
//! \breif If the position error exceeds this value, SpinTAC Position Control will hold it's output to 0.
#define ST_POS_ERROR_MAXIMUM_MREV (2.0)
#define ST_POS_ERROR_MAXIMUM_MREV_2 (2.0)


//! \brief SAMPLE TIME
// **************************************************************************
//! \brief Defines the number of interrupt ticks per SpinTAC tick
//! \brief Should be the same as the InstSpin-FOC speed controller clock tick
#define ISR_TICKS_PER_SPINTAC_TICK (USER_NUM_ISR_TICKS_PER_CTRL_TICK * USER_NUM_CTRL_TICKS_PER_SPEED_TICK)
#define ISR_TICKS_PER_SPINTAC_TICK_2 (USER_NUM_ISR_TICKS_PER_CTRL_TICK_2 * USER_NUM_CTRL_TICKS_PER_SPEED_TICK_2)

//! \brief Defines the SpinTAC execution period, sec
#define ST_SAMPLE_TIME (ISR_TICKS_PER_SPINTAC_TICK / USER_ISR_FREQ_Hz)
#define ST_SAMPLE_TIME_2 (ISR_TICKS_PER_SPINTAC_TICK_2 / USER_ISR_FREQ_Hz_2)


//! \brief UNIT SCALING
// **************************************************************************
//! \brief Defines the speed scale factor for the system
//! \brief Compile time calculation for scale factor (ratio) used throughout the system
#define ST_SPEED_PU_PER_KRPM (USER_MOTOR_NUM_POLE_PAIRS / (0.001 * 60.0 * USER_IQ_FULL_SCALE_FREQ_Hz))
#define ST_SPEED_PU_PER_KRPM_2 (USER_MOTOR_NUM_POLE_PAIRS_2 / (0.001 * 60.0 * USER_IQ_FULL_SCALE_FREQ_Hz_2))

//! \brief Defines the speed scale factor for the system
//! \brief Compile time calculation for scale factor (ratio) used throughout the system
#define ST_SPEED_KRPM_PER_PU ((0.001 * 60.0 * USER_IQ_FULL_SCALE_FREQ_Hz) / USER_MOTOR_NUM_POLE_PAIRS)
#define ST_SPEED_KRPM_PER_PU_2 ((0.001 * 60.0 * USER_IQ_FULL_SCALE_FREQ_Hz_2) / USER_MOTOR_NUM_POLE_PAIRS_2)

//! \brief Defines the default inertia for the system, PU/(pu/s^2)
//! \brief This value should be calculated from the inertia estimated with SpinTAC Identify
#define ST_SYSTEM_INERTIA_PU (USER_SYSTEM_INERTIA * ST_SPEED_KRPM_PER_PU * (1.0 / USER_IQ_FULL_SCALE_CURRENT_A))
#define ST_SYSTEM_INERTIA_PU_2 (USER_SYSTEM_INERTIA_2 * ST_SPEED_KRPM_PER_PU_2 * (1.0 / USER_IQ_FULL_SCALE_CURRENT_A_2))

//! \brief Defines the default friction for the system, PU/(pu/s^2)
//! \brief This value should be calculated from the friction estimated with SpinTAC Identify
#define ST_SYSTEM_FRICTION_PU (USER_SYSTEM_FRICTION * ST_SPEED_KRPM_PER_PU * (1.0 / USER_IQ_FULL_SCALE_CURRENT_A))
#define ST_SYSTEM_FRICTION_PU_2 (USER_SYSTEM_FRICTION_2 * ST_SPEED_KRPM_PER_PU_2 * (1.0 / USER_IQ_FULL_SCALE_CURRENT_A_2))


//! \brief SPINTAC IDENTIFY SETTINGS
// **************************************************************************
//! \brief Defines the minimum speed from which the SpinTAC Identify will start running, rpm
//! \brief This value needs to be low enough that the motor is effectivly stopped
#define ST_MIN_ID_SPEED_RPM (5)
#define ST_MIN_ID_SPEED_RPM_2 (5)

//! \brief Defines the minimum speed from which the SpinTAC Identify will start running
//! \breif Compile time calculation that converts the minimum identification speed into pu/s
#define ST_MIN_ID_SPEED_PU (ST_MIN_ID_SPEED_RPM * 0.001 * ST_SPEED_PU_PER_KRPM)
#define ST_MIN_ID_SPEED_PU_2 (ST_MIN_ID_SPEED_RPM_2 * 0.001 * ST_SPEED_PU_PER_KRPM_2)

//! \brief Defines the SpinTAC Identify error code that needs to run to completion
//! \breif Identifies the error code that should not halt operation
#define ST_ID_INCOMPLETE_ERROR (2005)


//! \brief GLOBAL VARIABLE INITIALIZATION
// **************************************************************************
//! \brief Initalization values of SpinTAC global variables
#define ST_VARS_DEFAULTS_MTR1 {ST_CTL_IDLE, \
	                           _IQ24(USER_SYSTEM_INERTIA), \
	                           _IQ24(USER_SYSTEM_FRICTION), \
                               _IQ20(USER_SYSTEM_BANDWIDTH), \
                               _IQ24(USER_MOTOR_MAX_CURRENT), \
                               -_IQ24(USER_MOTOR_MAX_CURRENT), \
                               0, \
                               ST_MOVE_IDLE, \
                               ST_MOVE_CUR_STCRV, \
                              0, \
                               0, \
                               0, \
                               ST_PLAN_STOP, \
                               ST_PLAN_IDLE, \
                               0, \
                               0, \
                               0, \
                               0}
						  
#define ST_VARS_DEFAULTS_MTR2 {ST_CTL_IDLE, \
	                           _IQ24(USER_SYSTEM_INERTIA_2), \
	                           _IQ24(USER_SYSTEM_FRICTION_2), \
                               _IQ20(USER_SYSTEM_BANDWIDTH_2), \
                               _IQ24(USER_MOTOR_MAX_CURRENT_2), \
                               -_IQ24(USER_MOTOR_MAX_CURRENT_2), \
                               0, \
                               ST_MOVE_IDLE, \
                               ST_MOVE_CUR_STCRV, \
                               0, \
                               0, \
                               0, \
                               ST_PLAN_STOP, \
                               ST_PLAN_IDLE, \
                               0, \
                               0, \
                               0, \
                               0}

// **************************************************************************
// the typedefs

//! \brief Defines the position components of SpinTAC (ST)
//!
typedef struct _POS_Params_t
{
    ST_PosConv_t conv;   //!< the position converter (ST_PosConv) object
    ST_PosCtl_t	 ctl;    //!< the position controller (ST_PosCtl) object
    ST_PosMove_t move;   //!< the position profile generator (ST_PosMove) object
    ST_PosPlan_t plan;   //!< the position motion sequencer (ST_PosPlan) object
} POS_Params_t;

//! \brief Defines the SpinTAC (ST) object
//!
typedef struct _ST_Obj
{
	POS_Params_t	  pos;           //!< the position components of the SpinTAC (ST) object
	ST_Ver_t          version;     	 //!< the version (ST_Ver) object
	ST_POSCTL_Handle  posCtlHandle;  //!< Handle for Position Controller (ST_PosCtl)
	ST_POSMOVE_Handle posMoveHandle; //!< Handle for Position Move (ST_PosMove)
	ST_POSPLAN_Handle posPlanHandle; //!< Handle for Position Plan (ST_PosPlan)
	ST_POSCONV_Handle posConvHandle; //!< Handle for Position Converter (ST_PosConv)
	ST_VER_Handle     versionHandle; //!< Handle for Version (ST_Ver)
} ST_Obj;

//! \brief Handle
//!
typedef struct _ST_Obj_ *ST_Handle; // SpinTAC Velocity Controller Handle

//! \brief Enumeration for the control of the position motion state machine (SpinTAC Position Plan)
//!
typedef enum
{
  ST_PLAN_STOP = 0,    //!< stops the current motion sequence
  ST_PLAN_START,       //!< starts the current motion sequence
  ST_PLAN_PAUSE        //!< pauses the current motion sequence
} ST_PlanButton_e;

//! \brief Defines the SpinTAC (ST) global variables
//!
typedef struct _ST_Vars_t
{
    ST_CtlStatus_e     PosCtlStatus;              //!< status of Position Controller (ST_PosCtl)
    _iq24              InertiaEstimate_Aperkrpm;  //!< displays the inertia used by Position Controller (ST_PosCtl)
    _iq24              FrictionEstimate_Aperkrpm; //!< displays the friction used by Position Controller (ST_PosCtl)
    _iq20              PosCtlBw_radps;            //!< sets the tuning (Bw_radps) of the Position Controller (ST_PosCtl)
    _iq24              PosCtlOutputMax_A;         //!< sets the maximum amount of current the Position Controller (ST_PosCtl) will supply as Iq reference
    _iq24              PosCtlOutputMin_A;         //!< sets the minimum amount of current the Position Controller (ST_PosCtl) will supply as Iq reference
    uint16_t           PosCtlErrorID;             //!< displays the error seen by Position Controller (ST_PosCtl)
    ST_MoveStatus_e    PosMoveStatus;             //!< status of Position Move (ST_PosMove)
    ST_MoveCurveType_e PosMoveCurveType;          //!< selects the curve type used by Position Move (ST_PosMove)
    int32_t            PosMoveTime_ticks;         //!< Amount of time profile will take within 1 million ticks (ST_PosMove)
    int32_t            PosMoveTime_mticks;        //!< Profile time million tick part value, together with ProTime_tick to present the total amount of time (ST_PosMove)
    uint16_t           PosMoveErrorID;            //!< displays the error seen by Position Move (ST_PosMove)
    ST_PlanButton_e    PosPlanRun;                //!< contols the operation of Position Plan (ST_PosPlan)
    ST_PlanStatus_e    PosPlanStatus;             //!< status of Position Plan (ST_PosPlan)
    uint16_t           PosPlanErrorID;            //!< displays the error seen by Position Plan (ST_PosPlan)
    uint16_t           PosPlanCfgErrorIdx;        //!< displays which index caused a configuration error in Position Plan (ST_PosPlan)
    uint16_t           PosPlanCfgErrorCode;       //!< displays the specific configuration error in Position Plan (ST_PosPlan)
    uint16_t           PosConvErrorID;           //!< displays the error seen by the Position Converter (ST_PosConv)
} ST_Vars_t;

// **************************************************************************
// the globals


// **************************************************************************
// the functions

//! \brief      Initalizes the SpinTAC (ST) object
inline ST_Handle ST_init(void *pMemory, const size_t numBytes)
{
	ST_Handle handle;
	ST_Obj *obj;

	handle = (ST_Handle)pMemory;	// assign the handle
	obj = (ST_Obj *)handle;		// assign the object

	// init the ST PosCtl object
	obj->posCtlHandle = STPOSCTL_init(&obj->pos.ctl, sizeof(ST_PosCtl_t));
	// init the ST PosMove object
	obj->posMoveHandle = STPOSMOVE_init(&obj->pos.move, sizeof(ST_PosMove_t));
	// init the ST PosPlan object
	obj->posPlanHandle = STPOSPLAN_init(&obj->pos.plan, sizeof(ST_PosPlan_t));
	// init the ST PosConv object
	obj->posConvHandle = STPOSCONV_init(&obj->pos.conv, sizeof(ST_PosConv_t));
	// get the ST Version object
	obj->versionHandle = ST_initVersion(&obj->version, sizeof(ST_Ver_t));

	return handle;
}

//! \brief      Setups SpinTAC Position Convert
inline void ST_setupPosConv_mtr1(ST_Handle handle) {

	// get object from the handle
	ST_Obj *obj = (ST_Obj *)handle;

    // Initalize SpinTAC Position Convert
	STPOSCONV_setSampleTime_sec(obj->posConvHandle, _IQ24(ST_SAMPLE_TIME));
	STPOSCONV_setERevMaximums_erev(obj->posConvHandle, _IQ24(ST_EREV_MAXIMUM), 0);
	STPOSCONV_setUnitConversion(obj->posConvHandle, USER_IQ_FULL_SCALE_FREQ_Hz, ST_SAMPLE_TIME, USER_MOTOR_NUM_POLE_PAIRS);
	STPOSCONV_setMRevMaximum_mrev(obj->posConvHandle, _IQ24(ST_MREV_ROLLOVER));
	STPOSCONV_setLowPassFilterTime_tick(obj->posConvHandle, 3);
	if(USER_MOTOR_TYPE ==  MOTOR_Type_Induction) {
		// The Slip Compensator is only needed for ACIM
		STPOSCONV_setupSlipCompensator(obj->posConvHandle, ST_SAMPLE_TIME, USER_IQ_FULL_SCALE_FREQ_Hz, USER_MOTOR_Rr, USER_MOTOR_Ls_d);
	}
	STPOSCONV_setEnable(obj->posConvHandle, true);
}

inline void ST_setupPosConv_mtr2(ST_Handle handle) {

	// get object from the handle
	ST_Obj *obj = (ST_Obj *)handle;

    // Initalize SpinTAC Position Convert
	STPOSCONV_setSampleTime_sec(obj->posConvHandle, _IQ24(ST_SAMPLE_TIME_2));
	STPOSCONV_setERevMaximums_erev(obj->posConvHandle, _IQ24(ST_EREV_MAXIMUM_2), 0);
	STPOSCONV_setUnitConversion(obj->posConvHandle, USER_IQ_FULL_SCALE_FREQ_Hz_2, ST_SAMPLE_TIME_2, USER_MOTOR_NUM_POLE_PAIRS_2);
	STPOSCONV_setMRevMaximum_mrev(obj->posConvHandle, _IQ24(ST_MREV_ROLLOVER_2));
	STPOSCONV_setLowPassFilterTime_tick(obj->posConvHandle, 3);
	if(USER_MOTOR_TYPE ==  MOTOR_Type_Induction) {
		// The Slip Compensator is only needed for ACIM
		STPOSCONV_setupSlipCompensator(obj->posConvHandle, ST_SAMPLE_TIME_2, USER_IQ_FULL_SCALE_FREQ_Hz_2, USER_MOTOR_Rr_2, USER_MOTOR_Ls_d_2);
	}
	STPOSCONV_setEnable(obj->posConvHandle, true);
}

//! \brief      Setups SpinTAC Position Control
inline void ST_setupPosCtl_mtr1(ST_Handle handle) {

	// get object from the handle
	ST_Obj *obj = (ST_Obj *)handle;
	_iq24 maxCurrent_PU = _IQ24(USER_MOTOR_MAX_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A);
	
	// Initalize SpinTAC Position Control
	STPOSCTL_setAxis(obj->posCtlHandle, ST_AXIS0);
	STPOSCTL_setSampleTime_sec(obj->posCtlHandle, _IQ24(ST_SAMPLE_TIME));
	STPOSCTL_setOutputMaximums(obj->posCtlHandle, maxCurrent_PU, -maxCurrent_PU);
	STPOSCTL_setVelocityMaximum(obj->posCtlHandle, _IQ24(USER_MOTOR_MAX_SPEED_KRPM * ST_SPEED_PU_PER_KRPM));
	STPOSCTL_setPositionRolloverMaximum_mrev(obj->posCtlHandle, _IQ24(ST_MREV_ROLLOVER));
	STPOSCTL_setUnitConversion(obj->posCtlHandle, USER_IQ_FULL_SCALE_FREQ_Hz, USER_MOTOR_NUM_POLE_PAIRS);
	STPOSCTL_setPositionErrorMaximum_mrev(obj->posCtlHandle, _IQ24(ST_POS_ERROR_MAXIMUM_MREV));
	STPOSCTL_setRampDisturbanceFlag(obj->posCtlHandle, false);
	STPOSCTL_setFilterEnableFlag(obj->posCtlHandle, true);
	STPOSCTL_setInertia(obj->posCtlHandle, _IQ24(ST_SYSTEM_INERTIA_PU));
	STPOSCTL_setFriction(obj->posCtlHandle, _IQ24(ST_SYSTEM_FRICTION_PU));
	STPOSCTL_setBandwidth_radps(obj->posCtlHandle, _IQ20(USER_SYSTEM_BANDWIDTH));
	STPOSCTL_setEnable(obj->posCtlHandle, false);
}

inline void ST_setupPosCtl_mtr2(ST_Handle handle) {

	// get object from the handle
	ST_Obj *obj = (ST_Obj *)handle;
	_iq24 maxCurrent_PU = _IQ24(USER_MOTOR_MAX_CURRENT_2 / USER_IQ_FULL_SCALE_CURRENT_A_2);
	
	// Initalize SpinTAC Position Control
	STPOSCTL_setAxis(obj->posCtlHandle, ST_AXIS1);
	STPOSCTL_setSampleTime_sec(obj->posCtlHandle, _IQ24(ST_SAMPLE_TIME_2));
	STPOSCTL_setOutputMaximums(obj->posCtlHandle, maxCurrent_PU, -maxCurrent_PU);
	STPOSCTL_setVelocityMaximum(obj->posCtlHandle, _IQ24(USER_MOTOR_MAX_SPEED_KRPM_2 * ST_SPEED_PU_PER_KRPM_2));
	STPOSCTL_setPositionRolloverMaximum_mrev(obj->posCtlHandle, _IQ24(ST_MREV_ROLLOVER_2));
	STPOSCTL_setUnitConversion(obj->posCtlHandle, USER_IQ_FULL_SCALE_FREQ_Hz_2, USER_MOTOR_NUM_POLE_PAIRS_2);
	STPOSCTL_setPositionErrorMaximum_mrev(obj->posCtlHandle, _IQ24(ST_POS_ERROR_MAXIMUM_MREV_2));
	STPOSCTL_setRampDisturbanceFlag(obj->posCtlHandle, false);
	STPOSCTL_setFilterEnableFlag(obj->posCtlHandle, true);
	STPOSCTL_setInertia(obj->posCtlHandle, _IQ24(ST_SYSTEM_INERTIA_PU_2));
	STPOSCTL_setFriction(obj->posCtlHandle, _IQ24(ST_SYSTEM_FRICTION_PU_2));
	STPOSCTL_setBandwidth_radps(obj->posCtlHandle, _IQ20(USER_SYSTEM_BANDWIDTH_2));
	STPOSCTL_setEnable(obj->posCtlHandle, false);
}

//! \brief      Setups SpinTAC Position Move
inline void ST_setupPosMove_mtr1(ST_Handle handle) {

	// get object from the handle
	ST_Obj *obj = (ST_Obj *)handle;

	// Initalize SpinTAC Position Move
	STPOSMOVE_setAxis(obj->posMoveHandle, ST_AXIS0);
	STPOSMOVE_setProfileType(obj->posMoveHandle, ST_POS_MOVE_POS_TYPE);
	STPOSMOVE_setCurveType(obj->posMoveHandle, ST_MOVE_CUR_STCRV);
	STPOSMOVE_setSampleTime_sec(obj->posMoveHandle, _IQ24(ST_SAMPLE_TIME));
	STPOSMOVE_setMRevMaximum_mrev(obj->posMoveHandle, _IQ24(ST_MREV_ROLLOVER));
	STPOSMOVE_setUnitConversion(obj->posMoveHandle, USER_IQ_FULL_SCALE_FREQ_Hz, USER_MOTOR_NUM_POLE_PAIRS);
	STPOSMOVE_setVelocityStart(obj->posMoveHandle, 0);
	STPOSMOVE_setPositionStart_mrev(obj->posMoveHandle, 0);
	STPOSMOVE_setVelocityEnd(obj->posMoveHandle, 0);
	STPOSMOVE_setVelocityLimit(obj->posMoveHandle, _IQ24(USER_MOTOR_MAX_SPEED_KRPM * ST_SPEED_PU_PER_KRPM));
	STPOSMOVE_setAccelerationLimit(obj->posMoveHandle, _IQ24(0.4));
	STPOSMOVE_setDecelerationLimit(obj->posMoveHandle, _IQ24(0.4));
	STPOSMOVE_setJerkLimit(obj->posMoveHandle, _IQ20(1.0));
	STPOSMOVE_setEnable(obj->posMoveHandle, false);
	STPOSMOVE_setTest(obj->posMoveHandle, false);
}

inline void ST_setupPosMove_mtr2(ST_Handle handle) {

	// get object from the handle
	ST_Obj *obj = (ST_Obj *)handle;

	// Initalize SpinTAC Position Move
	STPOSMOVE_setAxis(obj->posMoveHandle, ST_AXIS1);
	STPOSMOVE_setProfileType(obj->posMoveHandle, ST_POS_MOVE_POS_TYPE);
	STPOSMOVE_setCurveType(obj->posMoveHandle, ST_MOVE_CUR_STCRV);
	STPOSMOVE_setSampleTime_sec(obj->posMoveHandle, _IQ24(ST_SAMPLE_TIME_2));
	STPOSMOVE_setMRevMaximum_mrev(obj->posMoveHandle, _IQ24(ST_MREV_ROLLOVER_2));
	STPOSMOVE_setUnitConversion(obj->posMoveHandle, USER_IQ_FULL_SCALE_FREQ_Hz_2, USER_MOTOR_NUM_POLE_PAIRS_2);
	STPOSMOVE_setVelocityStart(obj->posMoveHandle, 0);
	STPOSMOVE_setPositionStart_mrev(obj->posMoveHandle, 0);
	STPOSMOVE_setVelocityEnd(obj->posMoveHandle, 0);
	STPOSMOVE_setVelocityLimit(obj->posMoveHandle, _IQ24(USER_MOTOR_MAX_SPEED_KRPM_2 * ST_SPEED_PU_PER_KRPM_2));
	STPOSMOVE_setAccelerationLimit(obj->posMoveHandle, _IQ24(0.4));
	STPOSMOVE_setDecelerationLimit(obj->posMoveHandle, _IQ24(0.4));
	STPOSMOVE_setJerkLimit(obj->posMoveHandle, _IQ20(1.0));
	STPOSMOVE_setEnable(obj->posMoveHandle, false);
	STPOSMOVE_setTest(obj->posMoveHandle, false);
}

//! \brief      Setups SpinTAC Positon Plan
extern void ST_setupPosPlan_mtr1(ST_Handle);
extern void ST_setupPosPlan_mtr2(ST_Handle);

//! \brief      Runs SpinTAC Positon Convert
extern void ST_runPosConv(ST_Handle handle, ENC_Handle encHandle, SLIP_Handle slipHandle, MATH_vec2 *Idq_pu, MOTOR_Type_e motorType);

//! \brief      Runs SpinTAC Positon Control
extern _iq ST_runPosCtl(ST_Handle);

//! \brief      Runs SpinTAC Positon Move
extern void ST_runPosMove(ST_Handle);

//! \brief      Runs SpinTAC Positon Plan
extern void ST_runPosPlan(ST_Handle);

//! \brief      Runs the time-critical components of SpinTAC Positon Plan
inline void ST_runPosPlanTick(ST_Handle handle) {
	ST_Obj *stObj = (ST_Obj *)handle;

	// Update the SpinTAC Position Plan Timer
	STPOSPLAN_runTick(stObj->posPlanHandle);
	// Update Plan when the profile is completed
	if(STPOSMOVE_getStatus(stObj->posMoveHandle) == ST_MOVE_IDLE) {
		STPOSPLAN_setUnitProfDone(stObj->posPlanHandle, true);
	}
	else {
		STPOSPLAN_setUnitProfDone(stObj->posPlanHandle, false);
	}
}

#ifdef __cplusplus
}
#endif // extern "C"

//@} // ingroup
#endif // end of _SPINTAC_POSITION_H_ definition
