#ifndef _GRAPH_H_
#define _GRAPH_H_
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

//! \file   solutions/instaspin_foc/src/main_graph.h
//! \brief Defines the structures, global initialization, and functions used in MAIN 
//!
//! (C) Copyright 2011, Texas Instruments, Inc.

// **************************************************************************
// the includes
#include "sw/solutions/instaspin_foc/src/main.h"
// modules

// drivers


// platforms


// **************************************************************************
// the defines
#define BUFFER_NR 2			// Number of data arrays
#define BUFFER_SIZE 256		// Size of data arrays

#if (16 < BUFFER_SIZE && BUFFER_SIZE <= 32)
#define BUFFER_MASK (32-1)
#elif(32 < BUFFER_SIZE && BUFFER_SIZE <= 64)
#define BUFFER_MASK (64-1)
#elif(64 < BUFFER_SIZE && BUFFER_SIZE <= 128)
#define BUFFER_MASK (128-1)
#elif(128 < BUFFER_SIZE && BUFFER_SIZE <= 256)
#define BUFFER_MASK (256-1)
#elif(256 < BUFFER_SIZE && BUFFER_SIZE <= 512)
#define BUFFER_MASK (512-1)
#elif(512 < BUFFER_SIZE && BUFFER_SIZE <= 1024)
#define BUFFER_MASK (1024-1)
#elif(1024 < BUFFER_SIZE && BUFFER_SIZE <= 2048)
#define BUFFER_MASK (2048-1)
#elif(2048 < BUFFER_SIZE && BUFFER_SIZE <= 4096)
#define BUFFER_MASK (4096-1)
#elif(4096 < BUFFER_SIZE && BUFFER_SIZE <= 8192)
#define BUFFER_MASK (8192-1)
#else
#error BUFFER_SIZE is outside BUFFER_MASK definition in main_graph.h
#endif


//! \brief Initialization values of global variables
//!
#define GRAPH_Vars_INIT {0, \
                         0, \
                         0, \
                         1, \
                         1, \
                         false, \
                         _IQ(0.0)}

// **************************************************************************
// the typedefs

//! \brief Enumeration for the number of buffers
//!
typedef enum
{
	GRAPH_Buffer_NR0=0,        //!< Buffer define 0
	GRAPH_Buffer_NR1,          //!< Buffer define 1
	GRAPH_Buffer_NR2,          //!< Buffer define 2
	GRAPH_Buffer_NR3           //!< Buffer define 3
} GRAPH_Buffer_NR_e;


typedef struct _Buffer_
{
	_iq data[BUFFER_SIZE];
	int32_t read,		// points to field with oldest content
		  write;	// points to empty field
}Buffer_t;


typedef struct _GRAPH_Vars_t_
{
  uint32_t Buffer_reset;   			// used to reset the trigger the data gathering algorithm
  uint32_t Buffer_counter;			// used as an index to write into the buffer array structure
  uint32_t Buffer_tick_counter;		// used  to count the interrupts
  uint32_t Buffer_tick;				// defines how many interrupts happen per graph write
  uint32_t Buffer_mode;				// used to define different values to record for each mode during run time
  bool Buffer_reset_wait;			// wait for reset to finish

  _iq Buffer_previous;				// used to store the trigger value for the next rewrite of the buffer in _iq

  Buffer_t Buffer_data[BUFFER_NR];
}GRAPH_Vars_t;



// **************************************************************************
// the function prototypes

//! \brief      Sets the values to collect in a data array
//! \param[in]  handle  	The controller (CTRL) handle
//! \param[in]  pGraphVars  Pointer to the graph variables
//! \param[in]  gMotorVars  Pointer to the motor variables
void GRAPH_DATA(volatile GRAPH_Vars_t *pGraphVars, CTRL_Handle handle, volatile MOTOR_Vars_t *pMotorVars,uint16_t trigger);


//@} //defgroup
#endif // end of _GRAPH_H_ definition


