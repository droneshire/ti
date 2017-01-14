//#############################################################################
//
//! \file   f2802x_common/source/comp.c
//!
//! \brief  Contains the various functions related to the comparator 
//!         (COMP) object
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//#############################################################################
// $TI Release: F2802x Support Library v222 $
// $Release Date: Thu Jan 15 13:56:57 CST 2015 $
// $Copyright: Copyright (C) 2008-2015 Texas Instruments Incorporated -
//             http://www.ti.com/ ALL RIGHTS RESERVED $
//#############################################################################

// **************************************************************************
// the includes
#include "DSP28x_Project.h"
#include "f2802x_common/include/comp.h"


// assembly file
extern void usDelay(unsigned long Count);


// **************************************************************************
// the defines


// **************************************************************************
// the globals


// **************************************************************************
// the functions


void COMP_disable(COMP_Handle compHandle)
{
    COMP_Obj *comp = (COMP_Obj *)compHandle;

    ENABLE_PROTECTED_REGISTER_WRITE_MODE;

    // clear the bits
    comp->COMPCTL &= ~COMP_COMPCTL_COMPDACE_BITS;

    DISABLE_PROTECTED_REGISTER_WRITE_MODE;

    return;
} // end of COMP_disable() function


void COMP_disableDac(COMP_Handle compHandle)
{
    COMP_Obj *comp = (COMP_Obj *)compHandle;

    ENABLE_PROTECTED_REGISTER_WRITE_MODE;

    // set the bits
    comp->COMPCTL |= COMP_COMPCTL_COMPSOURCE_BITS;

    DISABLE_PROTECTED_REGISTER_WRITE_MODE;

    return;
} // end of COMP_disableDac() function


void COMP_enable(COMP_Handle compHandle)
{
    COMP_Obj *comp = (COMP_Obj *)compHandle;

    ENABLE_PROTECTED_REGISTER_WRITE_MODE;

    // set the bits
    comp->COMPCTL |= COMP_COMPCTL_COMPDACE_BITS;

    DISABLE_PROTECTED_REGISTER_WRITE_MODE;

    return;
} // end of COMP_enable() function


void COMP_enableDac(COMP_Handle compHandle)
{
    COMP_Obj *comp = (COMP_Obj *)compHandle;

    ENABLE_PROTECTED_REGISTER_WRITE_MODE;

    // set the bits
    comp->COMPCTL &= ~COMP_COMPCTL_COMPSOURCE_BITS;

    DISABLE_PROTECTED_REGISTER_WRITE_MODE;

    return;
} // end of COMP_enableDac() function


COMP_Handle COMP_init(void *pMemory, const size_t numBytes)
{
    COMP_Handle compHandle;

    if(numBytes < sizeof(COMP_Obj))
    return((COMP_Handle)NULL);

    // assign the handle
    compHandle = (COMP_Handle)pMemory;

    return(compHandle);
} // end of COMP_init() function







// end of file
