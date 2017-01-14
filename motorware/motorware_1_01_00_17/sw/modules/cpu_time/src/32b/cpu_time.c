//! \file   ~/sw/modules/cpu_usage/src/32b/cpu_usage.c
//! \brief  Portable C fixed point code.  These functions define the 
//!         CPU usage time (CPU_TIME) module routines
//!
//! (C) Copyright 2013, Texas Instruments, Inc.


// **************************************************************************
// the includes

#include "sw/modules/cpu_time/src/32b/cpu_time.h"


// **************************************************************************
// the globals


// **************************************************************************
// the functions

CPU_TIME_Handle CPU_TIME_init(void *pMemory,const size_t numBytes)
{
  CPU_TIME_Handle handle;

  if(numBytes < sizeof(CPU_TIME_Obj))
    return((CPU_TIME_Handle)NULL);

  // assign the handle
  handle = (CPU_TIME_Handle)pMemory;

  return(handle);
} // end of CPU_TIME_init() function

void CPU_TIME_setParams(CPU_TIME_Handle handle, const uint16_t pwm_period)
{
  CPU_TIME_Obj *obj = (CPU_TIME_Obj *)handle;

  obj->pwm_period = pwm_period;

  obj->timer_cnt_now = 0;
  obj->timer_cnt_prev = 0;

  obj->timer_delta_now = 0;
  obj->timer_delta_prev = 0;

  obj->timer_delta_CntAcc = 0;
  obj->timer_delta_AccNum = 0;

  obj->timer_delta_max = 0;
  obj->timer_delta_min = 0;
  obj->timer_delta_avg = 0;

  obj->flag_resetStatus = false;

  return;
} // end of CPU_TIME_setParams() function

// end of file
