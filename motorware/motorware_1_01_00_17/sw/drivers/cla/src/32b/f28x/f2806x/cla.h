/* --COPYRIGHT--,BSD
 * Copyright (c) 2015, Texas Instruments Incorporated
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
//! \defgroup CLA CLA
//@{


#ifndef _CLA_H_
#define _CLA_H_

//! \file   drivers/cla/src/32b/f28x/f2806x/cla.h
//!
//! \brief  Contains public interface to various functions related to the 
//!         CLA object
//!
//! (C) Copyright 2015, Texas Instruments, Inc.


// **************************************************************************
// the includes

#include "sw/modules/types/src/types.h"

#ifdef __cplusplus
extern "C" {
#endif


//---------------------------------------------------------------------------
// CLA Control Register
struct MCTL_BITS {             // bits   description
    uint16_t   HARDRESET:1;      // 0      Issue a hard reset
    uint16_t   SOFTRESET:1;      // 1      Issue a soft reset
    uint16_t   IACKE:1;          // 2      Enable IACK for task start
    uint16_t   rsvd1:13;         // 15:3   reserved
};

union MCTL_REG {
   uint16_t                   all;
   struct MCTL_BITS         bit;
};

//---------------------------------------------------------------------------
// CLA Memory Configuration Register
struct MMEMCFG_BITS {          // bits   description
    uint16_t   PROGE:1;          // 0      Program RAM enable
    uint16_t   rsvd1:3;          // 3:1    reserved
    uint16_t   RAM0E:1;          // 4      Data RAM 0 enable
    uint16_t   RAM1E:1;          // 5      Data RAM 1 enable
    uint16_t   rsvd2:10;         // 15:6   reserved
};

union MMEMCFG_REG {
   uint16_t                   all;
   struct MMEMCFG_BITS      bit;
};

//---------------------------------------------------------------------------
// CLA Peripheral Interrupt Select Register
struct MPISRCSEL1_BITS {        // bits     description
    uint16_t   PERINT1SEL:4;      // 3:0      Source for CLA interrupt 1
    uint16_t   PERINT2SEL:4;      // 7:4      Source for CLA interrupt 2
    uint16_t   PERINT3SEL:4;      // 11:8     Source for CLA interrupt 3
    uint16_t   PERINT4SEL:4;      // 15:12    Source for CLA interrupt 4
    uint16_t   PERINT5SEL:4;      // 19:16    Source for CLA interrupt 5
    uint16_t   PERINT6SEL:4;      // 23:20    Source for CLA interrupt 6
    uint16_t   PERINT7SEL:4;      // 27:24    Source for CLA interrupt 7
    uint16_t   PERINT8SEL:4;      // 31:28    Source for CLA interrupt 8
};

union MPISRCSEL1_REG {
   uint32_t                   all;
   struct MPISRCSEL1_BITS   bit;
};

//---------------------------------------------------------------------------
// CLA Interrupt Registers
struct MIFR_BITS {              // bits     description
    uint16_t   INT1:1;            // 0        Interrupt 1 flag
    uint16_t   INT2:1;            // 1        Interrupt 2 flag
    uint16_t   INT3:1;            // 2        Interrupt 3 flag
    uint16_t   INT4:1;            // 3        Interrupt 4 flag
    uint16_t   INT5:1;            // 4        Interrupt 5 flag
    uint16_t   INT6:1;            // 5        Interrupt 6 flag
    uint16_t   INT7:1;            // 6        Interrupt 7 flag
    uint16_t   INT8:1;            // 7        Interrupt 8 flag
    uint16_t   rsvd:8;
};

union MIFR_REG {
   uint16_t              all;
   struct MIFR_BITS    bit;
};

union MIOVF_REG {
   uint16_t              all;
   struct MIFR_BITS    bit;
};

union MIFRC_REG {
   uint16_t              all;
   struct MIFR_BITS    bit;
};

union MICLR_REG {
   uint16_t              all;
   struct MIFR_BITS    bit;
};

union MICLROVF_REG {
   uint16_t              all;
   struct MIFR_BITS    bit;
};

union MIER_REG {
   uint16_t              all;
   struct MIFR_BITS    bit;
};

union MIRUN_REG {
   uint16_t              all;
   struct MIFR_BITS    bit;
};

//---------------------------------------------------------------------------
// CLA Status Register
struct MSTF_BITS {              // bits     description
    uint16_t   LVF:1;             // 0        Latched overflow flag
    uint16_t   LUF:1;             // 1        Latched underflow flag
    uint16_t   NF:1;              // 2        Negative float flag
    uint16_t   ZF:1;              // 3        Zero float flag
    uint16_t   rsvd1:2;           // 5,4
    uint16_t   TF:1;              // 6        Test flag
    uint16_t   rsvd2:2;           // 8,7
    uint16_t   RNDF32:1;          // 9        Rounding mode
    uint16_t   rsvd3:1;           // 10
    uint16_t   MEALLOW:1;         // 11       MEALLOW status
    uint16_t   RPCL:4;            // 15:12    Return PC, low portion
    uint16_t   RPCH:8;            // 23:16    Return PC, high portion
    uint16_t   rsvd4:8;           // 31:24
};

union MSTF_REG {
   uint32_t              all;
   struct MSTF_BITS    bit;
};

union MR_REG {
   uint32_t              i32;
   float               f32;
};

//---------------------------------------------------------------------------
// External Interrupt Register File:
struct CLA_REGS {
    uint16_t  MVECT1;                           // Task 1 vector
    uint16_t  MVECT2;                           // Task 2 vector
    uint16_t  MVECT3;                           // Task 3 vector
    uint16_t  MVECT4;                           // Task 4 vector
    uint16_t  MVECT5;                           // Task 5 vector
    uint16_t  MVECT6;                           // Task 6 vector
    uint16_t  MVECT7;                           // Task 7 vector
    uint16_t  MVECT8;                           // Task 8 vector
    uint16_t  rsvd1[8];
    union   MCTL_REG        MCTL;             // CLA control
    union   MMEMCFG_REG     MMEMCFG;          // CLA memory configuration
    uint16_t  rsvd2[2];
    union   MPISRCSEL1_REG  MPISRCSEL1;       // CLA interrupt source select
    uint16_t  rsvd3[10];
    union   MIFR_REG        MIFR;             // CLA interrupt flag
    union   MIOVF_REG       MIOVF;            // CLA interrupt overflow flag
    union   MIFRC_REG       MIFRC;            // CLA interrupt force
    union   MICLR_REG       MICLR;            // CLA interrupt flag clear
    union   MICLROVF_REG    MICLROVF;         // CLA interrupt overflow flag clear
    union   MIER_REG        MIER;             // CLA interrupt enable
    union   MIRUN_REG       MIRUN;            // CLA interrupt run status
    uint16_t  rsvd10;
       // Leading _ in front of execution registers avoids
       // conflicts when using this header in assembly files
    uint16_t  _MPC;                              // CLA program counter
    uint16_t  rsvd4;
    uint16_t  _MAR0;                             // CLA auxillary register 0
    uint16_t  _MAR1;                             // CLA auxillary register 1
    uint16_t  rsvd5[2];
    union   MSTF_REG        _MSTF;             // CLA floating-point status register
    union   MR_REG          _MR0;              // CLA result register 0
    uint32_t  rsvd6;
    union   MR_REG          _MR1;              // CLA result register 1
    uint32_t  rsvd7;
    union   MR_REG          _MR2;              // CLA result register 2
    uint32_t  rsvd8;
    union   MR_REG          _MR3;              // CLA result register 3
    uint32_t  rsvd9;
};

//---------------------------------------------------------------------------
// External Interrupt References & Function Declarations:
//
extern volatile struct CLA_REGS Cla1Regs;

#ifdef __cplusplus
}
#endif /* extern "C" */

#endif  // end of _CLA_H_ definition


//@}
