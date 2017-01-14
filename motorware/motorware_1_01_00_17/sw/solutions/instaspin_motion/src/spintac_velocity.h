#ifndef _SPINTAC_VELOCITY_H_
#define _SPINTAC_VELOCITY_H_
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

//! \file   solutions/instaspin_motion/src/spintac_velocity.h
//! \brief  Contains public interface to various functions related
//!         to the SpinTAC (ST) object
//!
//! (C) Copyright 2012, LineStream Technologies, Inc.
//! (C) Copyright 2011, Texas Instruments, Inc.


// **************************************************************************
// the includes

#include "sw/modules/spintac/src/32b/spintac_vel_ctl.h"
#include "sw/modules/spintac/src/32b/spintac_vel_move.h"
#include "sw/modules/spintac/src/32b/spintac_vel_plan.h"
#include "sw/modules/spintac/src/32b/spintac_vel_id.h"
#include "sw/modules/spintac/src/32b/spintac_pos_conv.h"

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

//! \brief SAMPLE TIME
// **************************************************************************
//! \brief Defines the number of interrupt ticks per SpinTAC tick
//! \brief Should be the same as the InstSpin-FOC speed controller clock tick
#define ISR_TICKS_PER_SPINTAC_TICK (USER_NUM_ISR_TICKS_PER_CTRL_TICK * USER_NUM_CTRL_TICKS_PER_SPEED_TICK)

//! \brief Defines the SpinTAC execution period, sec
#define ST_SAMPLE_TIME (ISR_TICKS_PER_SPINTAC_TICK / USER_ISR_FREQ_Hz)


//! \brief UNIT SCALING
// **************************************************************************
//! \brief Defines the speed scale factor for the system
//! \brief Compile time calculation for scale factor (ratio) used throughout the system
#define ST_SPEED_PU_PER_KRPM (USER_MOTOR_NUM_POLE_PAIRS / (0.001 * 60.0 * USER_IQ_FULL_SCALE_FREQ_Hz))

//! \brief Defines the speed scale factor for the system
//! \brief Compile time calculation for scale factor (ratio) used throughout the system
#define ST_SPEED_KRPM_PER_PU ((0.001 * 60.0 * USER_IQ_FULL_SCALE_FREQ_Hz) / USER_MOTOR_NUM_POLE_PAIRS)

//! \brief Defines the default inertia for the system, PU/(pu/s^2)
//! \brief This value should be calculated from the inertia estimated with SpinTAC Identify
#define ST_SYSTEM_INERTIA_PU (USER_SYSTEM_INERTIA * ST_SPEED_KRPM_PER_PU * (1.0 / USER_IQ_FULL_SCALE_CURRENT_A))

//! \brief Defines the default friction for the system, PU/(pu/s^2)
//! \brief This value should be calculated from the friction estimated with SpinTAC Identify
#define ST_SYSTEM_FRICTION_PU (USER_SYSTEM_FRICTION * ST_SPEED_KRPM_PER_PU * (1.0 / USER_IQ_FULL_SCALE_CURRENT_A))


//! \brief SPINTAC IDENTIFY SETTINGS
// **************************************************************************
//! \brief Defines the minimum speed from which the SpinTAC Identify will start running, rpm
//! \brief This value needs to be low enough that the motor is effectivly stopped
#define ST_MIN_ID_SPEED_RPM (5)

//! \brief Defines the minimum speed from which the SpinTAC Identify will start running
//! \breif Compile time calculation that converts the minimum identification speed into pu/s
#define ST_MIN_ID_SPEED_PU (ST_MIN_ID_SPEED_RPM * 0.001 * ST_SPEED_PU_PER_KRPM)

//! \brief Defines the SpinTAC Identify error code that needs to run to completion
//! \breif Identifies the error code that should not halt operation
#define ST_ID_INCOMPLETE_ERROR (2005)


//! \brief GLOBAL VARIABLE INITIALIZATION
// **************************************************************************
//! \brief Initalization values of SpinTAC global variables
#define ST_VARS_DEFAULTS {false, \
		                  ST_VEL_ID_IDLE, \
		                  0, \
		                  0, \
	                      0, \
	                      0, \
	                      0, \
	                      true, \
	                      ST_CTL_IDLE, \
                          _IQ20(USER_SYSTEM_BANDWIDTH), \
                          _IQ24(USER_MOTOR_MAX_CURRENT), \
                          -_IQ24(USER_MOTOR_MAX_CURRENT), \
                          0, \
                          ST_MOVE_IDLE, \
                          ST_MOVE_CUR_STCRV, \
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

//! \brief Defines the velocity components of SpinTAC (ST)
//!
typedef struct _VEL_Params_t
{
    ST_PosConv_t conv;    //!< the position converter (ST_PosConv) object
    ST_VelCtl_t	 ctl;     //!< the velocity controller (ST_VelCtl) object
    ST_VelMove_t move;    //!< the velocity profile generator (ST_VelMove) object
    ST_VelPlan_t plan;    //!< the velocity motion sequence generator (ST_VelPlan) object
    ST_VelId_t   id;      //!< the velocity identify (ST_VelId) object
} VEL_Params_t;

//! \brief Defines the SpinTAC (ST) object
//!
typedef struct _ST_Obj
{
	VEL_Params_t	  vel;              //!< the velocity components of the SpinTAC (ST) object
	ST_Ver_t          version;     		//!< the version (ST_Ver) object
	ST_VELID_Handle   velIdHandle;      //!< Handle for Velocity Identify (ST_VelId)
	ST_VELCTL_Handle  velCtlHandle;     //!< Handle for Velocity Controller (ST_VelCtl)
	ST_VELMOVE_Handle velMoveHandle;    //!< Handle for Velocity Move (ST_VelMove)
	ST_VELPLAN_Handle velPlanHandle;    //!< Handle for Velocity Plan (ST_VelPlan)
	ST_POSCONV_Handle posConvHandle;    //!< Handle for Position Converter (ST_PosConv)
	ST_VER_Handle     versionHandle;    //!< Handle for Version (ST_Ver)
} ST_Obj;

//! \brief Handle
//!
typedef struct _ST_Obj_ *ST_Handle; // SpinTAC Velocity Controller Handle

//! \brief Enumeration for the control of the velocity motion state machine (SpinTAC Velocity Plan)
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
    bool               VelIdRun;                 //!< controls the operation of the Velocity Identify (ST_VelId)
    ST_VelIdStatus_e   VelIdStatus;              //!< status of Velocity Identify (ST_VelId)
    _iq24              VelIdGoalSpeed_krpm;      //!< sets the goal speed of Velocity Identify (ST_VelId)
    _iq24              VelIdTorqueRampTime_sec;  //!< sets the rate at which torque is applied during Identification (ST_VelId)
    _iq24              InertiaEstimate_Aperkrpm; //!< displays the inertia estimated by Velocity Identify (ST_VelId) and used by Velocity Controller (ST_VelCtl)
    _iq24              FrictionEstimate_Aperkrpm;//!< displays the friction estimated by Velocity Identify (ST_VelId) and used by Velocity Controller (ST_VelCtl)
    uint16_t           VelIdErrorID;             //!< displays the error seen by Velocity Identify (ST_VelId)
    bool               VelCtlEnb;                //!< selects the velocity controller to use { true: SpinTAC false: PI }
    ST_CtlStatus_e     VelCtlStatus;             //!< status of Velocity Controller (ST_VelCtl)
    _iq20              VelCtlBw_radps;           //!< sets the tuning (Bw_radps) of the Velocity Controller (ST_VelCtl)
    _iq24              VelCtlOutputMax_A;        //!< sets the maximum amount of current the Velocity Controller (ST_VelCtl) will supply as Iq reference
    _iq24              VelCtlOutputMin_A;        //!< sets the minimum amount of current the Velocity Controller (ST_VelCtl) will supply as Iq reference
    uint16_t           VelCtlErrorID;            //!< displays the error seen by Velocity Controller (ST_VelCtl)
    ST_MoveStatus_e    VelMoveStatus;            //!< status of Velocity Move (ST_VelMove)
    ST_MoveCurveType_e VelMoveCurveType;         //!< selects the curve type used by Velocity Move (ST_VelMove)
    int32_t            VelMoveTime_ticks;        //!< displys the time that the current profile will take { unit: [ticks] } (ST_VelMove)
    uint16_t           VelMoveErrorID;           //!< displays the error seen by Velocity Move (ST_VelMove)
    ST_PlanButton_e    VelPlanRun;               //!< contols the operation of Velocity Plan (ST_VelPlan)
    ST_PlanStatus_e    VelPlanStatus;            //!< status of Velocity Plan (ST_VelPlan)
    uint16_t           VelPlanErrorID;           //!< displays the error seen by Velocity Plan (ST_VelPlan)
    uint16_t           VelPlanCfgErrorIdx;       //!< displays which index caused a configuration error in Velocity Plan (ST_VelPlan)
    uint16_t           VelPlanCfgErrorCode;      //!< displays the specific configuration error in Velocity Plan (ST_VelPlan)
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

	// init the ST VelId object
	obj->velIdHandle = STVELID_init(&obj->vel.id, sizeof(ST_VelId_t));
	// init the ST VelCtl object
	obj->velCtlHandle = STVELCTL_init(&obj->vel.ctl, sizeof(ST_VelCtl_t));
	// init the ST VelMove object
	obj->velMoveHandle = STVELMOVE_init(&obj->vel.move, sizeof(ST_VelMove_t));
	// init the ST VelPlan object
	obj->velPlanHandle = STVELPLAN_init(&obj->vel.plan, sizeof(ST_VelPlan_t));
	// init the ST PosConv object
	obj->posConvHandle = STPOSCONV_init(&obj->vel.conv, sizeof(ST_PosConv_t));
	// get the ST Version object
	obj->versionHandle = ST_initVersion(&obj->version, sizeof(ST_Ver_t));

	return handle;
}

//! \brief      Setups SpinTAC Position Convert
inline void ST_setupPosConv(ST_Handle handle) {

	// get object from the handle
	ST_Obj *obj = (ST_Obj *)handle;

    // Initalize SpinTAC Position Convert
	STPOSCONV_setSampleTime_sec(obj->posConvHandle, _IQ24(ST_SAMPLE_TIME));
	STPOSCONV_setERevMaximums_erev(obj->posConvHandle, _IQ24(1.0), 0);
	STPOSCONV_setUnitConversion(obj->posConvHandle, USER_IQ_FULL_SCALE_FREQ_Hz, ST_SAMPLE_TIME, USER_MOTOR_NUM_POLE_PAIRS);
	STPOSCONV_setMRevMaximum_mrev(obj->posConvHandle, _IQ24(10.0));
	STPOSCONV_setLowPassFilterTime_tick(obj->posConvHandle, 3);
	if(USER_MOTOR_TYPE ==  MOTOR_Type_Induction) {
		// The Slip Compensator is only needed for ACIM
		STPOSCONV_setupSlipCompensator(obj->posConvHandle, ST_SAMPLE_TIME, USER_IQ_FULL_SCALE_FREQ_Hz, USER_MOTOR_Rr, USER_MOTOR_Ls_d);
	}
	STPOSCONV_setEnable(obj->posConvHandle, true);
}

//! \brief      Setups SpinTAC Velocity Control
inline void ST_setupVelCtl(ST_Handle handle) {

	// get object from the handle
	ST_Obj *obj = (ST_Obj *)handle;
	_iq24 maxCurrent_PU = _IQ24(USER_MOTOR_MAX_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A);

	// Initalize SpinTAC Position Control
	STVELCTL_setAxis(obj->velCtlHandle, ST_AXIS0);
	STVELCTL_setSampleTime_sec(obj->velCtlHandle, _IQ24(ST_SAMPLE_TIME));
	STVELCTL_setOutputMaximums(obj->velCtlHandle, maxCurrent_PU, -maxCurrent_PU);
	STVELCTL_setInertia(obj->velCtlHandle, _IQ24(ST_SYSTEM_INERTIA_PU));
	STVELCTL_setFriction(obj->velCtlHandle, _IQ24(ST_SYSTEM_FRICTION_PU));
	STVELCTL_setBandwidth_radps(obj->velCtlHandle, _IQ20(USER_SYSTEM_BANDWIDTH));
	STVELCTL_setEnable(obj->velCtlHandle, false);
}

//! \brief      Setups SpinTAC Velocity Move
inline void ST_setupVelMove(ST_Handle handle) {

	// get object from the handle
	ST_Obj *obj = (ST_Obj *)handle;

	// Initalize SpinTAC Velocity Move
	STVELMOVE_setAxis(obj->velMoveHandle, ST_AXIS0);
	STVELMOVE_setSampleTime_sec(obj->velMoveHandle, _IQ24(ST_SAMPLE_TIME));
	STVELMOVE_setAccelerationLimit(obj->velMoveHandle, _IQ24(0.4));
	STVELMOVE_setJerkLimit(obj->velMoveHandle, _IQ20(1.0));
	STVELMOVE_setCurveType(obj->velMoveHandle, ST_MOVE_CUR_STCRV);
	STVELMOVE_setTest(obj->velMoveHandle, false);
	STVELMOVE_setEnable(obj->velMoveHandle, false);
}

//! \brief      Setups SpinTAC Velocity Plan
extern void ST_setupVelPlan(ST_Handle);

//! \brief      Runs the time-critical components of SpinTAC Velocity Plan
inline void ST_runVelPlanTick(ST_Handle handle) {
	ST_Obj *stObj = (ST_Obj *)handle;

	// Update the SpinTAC Position Plan Timer
	STVELPLAN_runTick(stObj->velPlanHandle);
	// Update Plan when the profile is completed
	if(STVELMOVE_getStatus(stObj->velMoveHandle) == ST_MOVE_IDLE) {
		STVELPLAN_setUnitProfDone(stObj->velPlanHandle, true);
	}
	else {
		STVELPLAN_setUnitProfDone(stObj->velPlanHandle, false);
	}
}

//! \brief      Setups SpinTAC Velocity Identify
inline void ST_setupVelId(ST_Handle handle) {

	// get object from the handle
	ST_Obj *obj = (ST_Obj *)handle;
	_iq24 maxCurrent_PU = _IQ24(USER_MOTOR_MAX_CURRENT / USER_IQ_FULL_SCALE_CURRENT_A);

	// Initalize ST_VEL_ID
	STVELID_setSampleTime_sec(obj->velIdHandle, _IQ24(ST_SAMPLE_TIME));
	STVELID_setOutputMaximum(obj->velIdHandle, maxCurrent_PU);
	STVELID_setGoalSpeed(obj->velIdHandle, _IQ24(0.5 * USER_MOTOR_MAX_SPEED_KRPM * ST_SPEED_PU_PER_KRPM));
	STVELID_setLowPassFilterTime_tick(obj->velIdHandle, 1);
	STVELID_setTimeOut_sec(obj->velIdHandle, _IQ24(10.0));
	STVELID_setTorqueRampTime_sec(obj->velIdHandle, _IQ24(5.0));
	STVELID_setEnable(obj->velIdHandle, false);
}

#ifdef QEP
//! \brief      Runs SpinTAC Positon Convert
extern void ST_runPosConv(ST_Handle, ENC_Handle, CTRL_Handle);
#endif

//! \brief      Runs SpinTAC Velocity Control
extern void ST_runVelCtl(ST_Handle, CTRL_Handle);

//! \brief      Runs SpinTAC Velocity Move
extern void ST_runVelMove(ST_Handle, CTRL_Handle);

//! \brief      Runs SpinTAC Velocity Plan
extern void ST_runVelPlan(ST_Handle, CTRL_Handle);

//! \brief      Runs SpinTAC Velocity Identify
extern void ST_runVelId(ST_Handle, CTRL_Handle);

#ifdef __cplusplus
}
#endif // extern "C"

//@} // ingroup
#endif // end of _SPINTAC_VELOCITY_H_ definition
