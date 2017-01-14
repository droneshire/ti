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
#ifndef _CTRL_H_
#define _CTRL_H_

//! \file   solutions/instaspin_foc/src/ctrl.h
//! \brief Contains the public interface, object and function definitions for 
//!        various functions related to the CTRL object 
//!
//! (C) Copyright 2011, Texas Instruments, Inc.


// **************************************************************************
// the includes

#include "sw/modules/ctrl/src/32b/ctrl_obj_eou.h"
#include "sw/modules/fast/src/32b/userParams_eou.h"


//!
//!
//! \defgroup CTRL CTRL
//!
//@{


#ifdef __cplusplus
extern "C" {
#endif


// **************************************************************************
// the function prototypes

//! \brief      Sets the controller parameters (Contained in ROM)
//! \details    This function allows for updates in scale factors during real-time
//!             operation of the controller.
//! \param[in]  handle       The controller (CTRL) handle
//! \param[in]  pUserParams  The pointer to the user parameters
void CTRL_setParams(CTRL_Handle handle,USER_Params *pUserParams);

//! \brief Sets up the controller and trajectory generator for the estimator idle state
//! \brief (Contained in ROM)
//! \param[in] handle  The controller (CTRL) handle
void CTRL_setupEstIdleState(CTRL_Handle handle);

//! \brief Sets the controller and estimator with motor parameters from the user.h file
//! \brief (Contained in ROM)
//! \param[in] handle  The controller (CTRL) handle
void CTRL_setUserMotorParams(CTRL_Handle handle);


#ifdef __cplusplus
}
#endif // extern "C"

//@} // ingroup
#endif // end of _CTRL_H_ definition




