#ifndef _MAIN_GRAPH_H_
#define _MAIN_GRAPH_H_
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
#include "sw/modules/diagnostic/graph/src/32b/graph.h"
#include "sw/solutions/instaspin_foc/src/main.h"

// modules

// drivers


// platforms


// **************************************************************************
// the defines


// **************************************************************************
// the function prototypes
//! \brief      Read from the buffer
//! \param[in]  Buffer_t  		The pointer to the buffer data
//! \param[out]	pWord			Read data from the buffer
int32_t BufferOut(volatile Buffer_t *pBuffer, int32_t *pWord)
{
  //if (buffer.read == buffer.write)
  //  return FALSE;
  *pWord = pBuffer->data[pBuffer->read];
  pBuffer->read = (pBuffer->read+1) & BUFFER_MASK;
  return true;
}


//! \brief      Write into the buffer
//! \param[in]  Buffer_t  		The pointer to the buffer data
//! \param[in]	word			Write data into the buffer
int32_t BufferIn(volatile Buffer_t *pBuffer, int32_t word)
{
  int32_t next = ((pBuffer->write + 1) & BUFFER_MASK);
  //if (buffer.read == next)
  //  return FALSE;
  pBuffer->data[pBuffer->write & BUFFER_MASK] = word;
  pBuffer->write = next;
  return true;
}


//! \brief      Init function and reset funciton
//! \param[in]  GRAPH_Vars_t  		The pointer to the gGraphVars data
void BufferInit(volatile GRAPH_Vars_t *pGraphVars)
{
	uint_least16_t buffer_array = 0;
	for(buffer_array=0;buffer_array<BUFFER_NR;buffer_array++)
	  {
		  pGraphVars->Buffer_data[buffer_array].write = pGraphVars->Buffer_data[buffer_array].read = 0;
	  }
	pGraphVars->Buffer_counter = pGraphVars->Buffer_reset = pGraphVars->Buffer_tick_counter =  0;
}

//! \brief      Data gathering function for any iq value
//! \param[in]  GRAPH_Vars_t  		The pointer to the gGraphVars data
//! \param[in]  GRAPH_Buffer_NR_e 	Definition of buffer number
//! \param[in]  gData  				Recorded iq data
//! \param[in]  TriggerValue	  	Trigger value to start the data recording
inline void GRAPH_Data_Gather (volatile GRAPH_Vars_t *pGraphVars,GRAPH_Buffer_NR_e Buffer_Num,_iq gData,_iq TriggerValue)
{

	  if( pGraphVars->Buffer_counter < BUFFER_SIZE && Buffer_Num == 0){
		  pGraphVars->Buffer_tick_counter++;
		if( pGraphVars->Buffer_tick_counter < (pGraphVars->Buffer_tick) )
			;// do nothing
		else {
			BufferIn(&pGraphVars->Buffer_data[Buffer_Num], gData);
			pGraphVars->Buffer_counter++;
			pGraphVars->Buffer_tick_counter = 0;
			pGraphVars->Buffer_reset_wait = false;
		} // END ( gGraphVars->Buffer_delay_counter <= gGraphVars->Buffer_delay )
	  }
	  else if((pGraphVars->Buffer_reset == 1 || (pGraphVars->Buffer_previous != TriggerValue)) && Buffer_Num == 0){
		  pGraphVars->Buffer_previous = TriggerValue;
       	  BufferInit(pGraphVars);
       	  pGraphVars->Buffer_reset_wait = true;
	  } else if (pGraphVars->Buffer_counter < BUFFER_SIZE && Buffer_Num != 0 && pGraphVars->Buffer_reset_wait == false)
			if( pGraphVars->Buffer_tick_counter != 0 )
				;// do nothing
			else
				BufferIn(&pGraphVars->Buffer_data[Buffer_Num], gData);
		  // END if( gGraphVars->Buffer_counter < BUFFER_SIZE && Buffer_Num == 0 )
} // END Graph_Current_step


void GRAPH_DATA(volatile GRAPH_Vars_t *pGraphVars, CTRL_Handle handle,volatile MOTOR_Vars_t *pMotorVars,uint16_t trigger)
{

	switch(pGraphVars->Buffer_mode)
	{
	case 1:
		  GRAPH_Data_Gather(pGraphVars,GRAPH_Buffer_NR0,_IQmpy(CTRL_getId_in_pu(handle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A)),(_iq)trigger);
	break;

	case 2:
		  GRAPH_Data_Gather(pGraphVars,GRAPH_Buffer_NR1,_IQmpy(CTRL_getIq_in_pu(handle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A)),(_iq)trigger);
		  GRAPH_Data_Gather(pGraphVars,GRAPH_Buffer_NR0,EST_getSpeed_krpm(handle->estHandle),(_iq)trigger);
	break;

	case 3:
		  GRAPH_Data_Gather(pGraphVars,GRAPH_Buffer_NR1,_IQmpy(CTRL_getIq_in_pu(handle), _IQ(USER_IQ_FULL_SCALE_CURRENT_A)),pMotorVars->IqRef_A);
		  GRAPH_Data_Gather(pGraphVars,GRAPH_Buffer_NR0,EST_getSpeed_krpm(handle->estHandle),pMotorVars->IqRef_A);
	break;

	default:

		break;
	}

}


//@} //defgroup
#endif // end of _MAIN_GRAPH_H_ definition


