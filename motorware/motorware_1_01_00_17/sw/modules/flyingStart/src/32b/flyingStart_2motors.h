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
#ifndef _FS_H_
#define _FS_H_

//! \file   modules/FS/src/32b/FS.h
//! \brief  Contains public interface to various functions related
//!         to the FS object
//!
//! (C) Copyright 2011, Texas Instruments, Inc.


// **************************************************************************
// the includes

#include "sw/modules/iqmath/src/32b/IQmathLib.h"
#include "sw/modules/types/src/types.h"

#include "sw/modules/ctrl/src/32b/ctrl_2motors.h"

//!
//!
//! \defgroup FS FS
//!
//@{


#ifdef __cplusplus
extern "C" {
#endif


// **************************************************************************
// the defines


//! \brief Defines the Flying Start (FS) minimum switch speed
//!
#define FS_SPEED_MIN                   _IQ(0.030)


//! \brief Defines the Flying Start (FS) minimum switch speed
//!
#define FS_MAX_CHECK_TIME              (6000)

// **************************************************************************
// the typedefs
  

//! \brief Defines the Flying Start (FS) data
//!
typedef struct _FS_Obj_
{
  _iq speed_ref_pu;						//!<
  _iq speed_set_pu;						//!<
  _iq speed_est_pu;						//!<

  _iq speed_est_avg;					//!<

  _iq speed_fs_min;						//!<

  _iq run_direction;					//!<

  uint32_t  cnt_checktime;          	//!< the Flying Start (FS) counter
  uint32_t  max_checktime;           	//!< the Flying Start (FS) hold time

  bool flag_enableSpeedCtrl;			//!< a flag to enable speed control Flying Start (FS)
  bool flag_enableFs;         			//!< a flag to enable Flying Start (FS)
} FS_Obj;


//! \brief Defines the FS handle
//!
typedef struct _FS_Obj_ *FS_Handle;


// **************************************************************************
// the globals


// **************************************************************************
// the function prototypes


//! \brief     Initializes the Flying Start (FS) object
//! \param[in] pMemory   A pointer to the memory for the Flying Start (FS) object
//! \param[in] numBytes  The number of bytes allocated for the Flying Start (FS) object, bytes
//! \return    The Flying Start (FS) object handle
extern FS_Handle FS_init(void *pMemory, const size_t numBytes);

//! \brief     Sets the enable flag of the Flying Start (FS) (FS) object
//! \param[in] fsHandle  The Flying Start (FS) handle
//! \param[in] state     The Flying Start (FS) enable state
static inline void FS_setSpeedFsMin(FS_Handle fsnHandle, const _iq speedFsMin)
{
  FS_Obj *fsObj = (FS_Obj *)fsnHandle;

  fsObj->speed_fs_min = speedFsMin;

  return;
} // end of FS_setSpeedFsMin() function


static inline FS_setSpeedFsMin_krpm(FS_Handle fsnHandle, CTRL_Handle handle, const _iq spd_ref_krpm)
{
  FS_Obj *fsObj = (FS_Obj *)fsnHandle;
  CTRL_Obj *ctrlObj = (CTRL_Obj *)handle;

  _iq krpm_to_pu_sf = EST_get_krpm_to_pu_sf(ctrlObj->estHandle);

  _iq spd_ref_pu = _IQmpy(spd_ref_krpm,krpm_to_pu_sf);

  fsObj->speed_fs_min = spd_ref_pu;

  return;
} // end of CTRL_setSpd_ref_krpm() function

//! \brief     Sets the enable flag of the Flying Start (FS) (FS) object
//! \param[in] fsHandle  The Flying Start (FS) handle
//! \param[in] state     The Flying Start (FS) enable state
static inline void FS_setMaxCheckTime(FS_Handle fsnHandle, const uint32_t checktime)
{
  FS_Obj *fsObj = (FS_Obj *)fsnHandle;

  fsObj->max_checktime = checktime;

  return;
} // end of FS_setMaxCheckTime() function

//! \brief     Sets the counter of the Flying Start (FS) (FS) object
//! \param[in] fsHandle  The Flying Start (FS) handle
static inline void FS_setCntCheckTime(FS_Handle fsnHandle, const uint32_t checktime)
{
  FS_Obj *fsObj = (FS_Obj *)fsnHandle;

  fsObj->cnt_checktime = checktime;

  return;
} // end of FS_setCntCheckTime() function

//! \brief     Clears the counter of the Flying Start (FS) (FS) object
//! \param[in] fsHandle  The Flying Start (FS) handle
static inline void FS_clearCntCheckTime(FS_Handle fsnHandle)
{
  FS_Obj *fsObj = (FS_Obj *)fsnHandle;

  fsObj->cnt_checktime = 0;
 
  return;
} // end of FS_clearCntCheckTime() function


//! \brief     Sets the enable flag of the Flying Start (FS) (FS) object
//! \param[in] fsHandle  The Flying Start (FS) handle
//! \param[in] state     The Flying Start (FS) enable state
static inline void FS_setFlag_enableFs(FS_Handle fsnHandle, const bool state)
{
  FS_Obj *fsObj = (FS_Obj *)fsnHandle;

  fsObj->flag_enableFs = state;
  
  return;
} // end of FS_setFlag_enableFS() function


//! \brief     Gets the enable flag of the Flying Start (FS) (FS) object
//! \param[in] fsHandle  The Flying Start (FS) handle
//! \return    The Flying Start (FS) enable state
static inline bool FS_getFlag_enableFS(FS_Handle fsnHandle)
{
  FS_Obj *fsObj = (FS_Obj *)fsnHandle;

  return(fsObj->flag_enableFs);
} // end of FS_getFlag_enableFS() function


//! \brief     Gets the enable flag of the Flying Start (FS) (FS) object
//! \param[in] fsHandle  The Flying Start (FS) handle
//! \return    The Flying Start (FS) enable state
static inline bool FS_getFlag_SpeedCtrl(FS_Handle fsnHandle)
{
  FS_Obj *fsObj = (FS_Obj *)fsnHandle;

  return(fsObj->flag_enableSpeedCtrl);
} // end of FS_getFlag_SpeedCtrl() function


//! \brief     Runs the FS controller
//! \param[in] fsHandle    The FS controller handle
//! \param[in]  handle     The controller (CTRL) handle
static inline void FS_run(CTRL_Handle ctrlsHandle, FS_Handle fsnHandle)
{
  CTRL_Obj *ctrlObj = (CTRL_Obj *)ctrlsHandle;

  FS_Obj *fsObj = (FS_Obj *)fsnHandle;

  if(fsObj->flag_enableFs == true)
  {
	  CTRL_setId_ref_pu(ctrlsHandle, _IQ(0.0));
	  CTRL_setIq_ref_pu(ctrlsHandle, _IQ(0.0));

	  fsObj->speed_ref_pu = CTRL_getSpd_ref_pu(ctrlsHandle);
	  fsObj->speed_est_pu = EST_getFm_pu(ctrlObj->estHandle);
	  fsObj->speed_est_avg = _IQmpy(fsObj->speed_est_avg, _IQ(0.8)) + _IQmpy(fsObj->speed_est_pu, _IQ(0.20));

	  if(fsObj->cnt_checktime >= fsObj->max_checktime)
	  {
//		  fs->cnt_checktime = 0;

		  if(_IQabs(fsObj->speed_est_avg) < fsObj->speed_fs_min)
		  {
			  fsObj->speed_set_pu = _IQ(0.0);
		  }
		  else
		  {
			  fsObj->speed_set_pu = fsObj->speed_est_avg;
		  }

		  fsObj->flag_enableFs = false;
		  fsObj->flag_enableSpeedCtrl = true;

		  TRAJ_setIntValue(ctrlObj->trajHandle_spd, fsObj->speed_set_pu);
		  PID_setUi(ctrlObj->pidHandle_spd, _IQ(0.0));
		  CTRL_setSpd_out_pu(ctrlsHandle, _IQ(0.0));
	  }
	  else
		  fsObj->cnt_checktime++;
  }
  else
  {
	  fsObj->flag_enableSpeedCtrl = true;
  }

  return;
} // end of FS_run() function

//! \brief     Runs the FS controller
//! \param[in] fsHandle    The FS controller handle
static inline void FS_reset(FS_Handle fsnHandle)
{
   FS_Obj *fsObj = (FS_Obj *)fsnHandle;

   if(fsObj->flag_enableFs == true)
   {
	   fsObj->flag_enableSpeedCtrl = false;
   }
   else
   {
	   fsObj->flag_enableSpeedCtrl = true;
   }

   fsObj->speed_est_avg = _IQ(0.0);
   fsObj->cnt_checktime = 0;
}

#ifdef __cplusplus
}
#endif // extern "C"

//@} // ingroup
#endif // end of _FS_H_ definition

