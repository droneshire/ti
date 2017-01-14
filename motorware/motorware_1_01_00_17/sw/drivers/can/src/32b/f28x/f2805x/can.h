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


#ifndef _ECAN_H_
#define _ECAN_H_

//! \file   drivers/can/src/32b/f28x/f2805x/can.h
//!
//! \brief  Contains public interface to various functions related to the 
//!         CAN object
//!
//! (C) Copyright 2015, Texas Instruments, Inc.


// **************************************************************************
// the includes

#include "sw/modules/types/src/types.h"


//!
//! \defgroup CAN

//!
//! \ingroup CAN
//@{


#ifdef __cplusplus
extern "C" {
#endif



/* --------------------------------------------------- */
/* eCAN Control & Status Registers                     */
/* ----------------------------------------------------*/

/* eCAN Mailbox enable register (CANME) bit definitions */
struct  CANME_BITS {      // bit  description
   uint16_t      ME0:1;     // 0   Enable Mailbox 0
   uint16_t      ME1:1;     // 1   Enable Mailbox 1
   uint16_t      ME2:1;     // 2   Enable Mailbox 2
   uint16_t      ME3:1;     // 3   Enable Mailbox 3
   uint16_t      ME4:1;     // 4   Enable Mailbox 4
   uint16_t      ME5:1;     // 5   Enable Mailbox 5
   uint16_t      ME6:1;     // 6   Enable Mailbox 6
   uint16_t      ME7:1;     // 7   Enable Mailbox 7
   uint16_t      ME8:1;     // 8   Enable Mailbox 8
   uint16_t      ME9:1;     // 9   Enable Mailbox 9
   uint16_t      ME10:1;    // 10  Enable Mailbox 10
   uint16_t      ME11:1;    // 11  Enable Mailbox 11
   uint16_t      ME12:1;    // 12  Enable Mailbox 12
   uint16_t      ME13:1;    // 13  Enable Mailbox 13
   uint16_t      ME14:1;    // 14  Enable Mailbox 14
   uint16_t      ME15:1;    // 15  Enable Mailbox 15
   uint16_t      ME16:1;    // 16  Enable Mailbox 16
   uint16_t      ME17:1;    // 17  Enable Mailbox 17
   uint16_t      ME18:1;    // 18  Enable Mailbox 18
   uint16_t      ME19:1;    // 19  Enable Mailbox 19
   uint16_t      ME20:1;    // 20  Enable Mailbox 20
   uint16_t      ME21:1;    // 21  Enable Mailbox 21
   uint16_t      ME22:1;    // 22  Enable Mailbox 22
   uint16_t      ME23:1;    // 23  Enable Mailbox 23
   uint16_t      ME24:1;    // 24  Enable Mailbox 24
   uint16_t      ME25:1;    // 25  Enable Mailbox 25
   uint16_t      ME26:1;    // 26  Enable Mailbox 26
   uint16_t      ME27:1;    // 27  Enable Mailbox 27
   uint16_t      ME28:1;    // 28  Enable Mailbox 28
   uint16_t      ME29:1;    // 29  Enable Mailbox 29
   uint16_t      ME30:1;    // 30  Enable Mailbox 30
   uint16_t      ME31:1;    // 31  Enable Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANME_REG {
   uint32_t             all;
   struct CANME_BITS  bit;
};

/* eCAN Mailbox direction register (CANMD) bit definitions */
struct  CANMD_BITS {      // bit  description
   uint16_t      MD0:1;     // 0   0 -> Tx 1 -> Rx
   uint16_t      MD1:1;     // 1   0 -> Tx 1 -> Rx
   uint16_t      MD2:1;     // 2   0 -> Tx 1 -> Rx
   uint16_t      MD3:1;     // 3   0 -> Tx 1 -> Rx
   uint16_t      MD4:1;     // 4   0 -> Tx 1 -> Rx
   uint16_t      MD5:1;     // 5   0 -> Tx 1 -> Rx
   uint16_t      MD6:1;     // 6   0 -> Tx 1 -> Rx
   uint16_t      MD7:1;     // 7   0 -> Tx 1 -> Rx
   uint16_t      MD8:1;     // 8   0 -> Tx 1 -> Rx
   uint16_t      MD9:1;     // 9   0 -> Tx 1 -> Rx
   uint16_t      MD10:1;    // 10  0 -> Tx 1 -> Rx
   uint16_t      MD11:1;    // 11  0 -> Tx 1 -> Rx
   uint16_t      MD12:1;    // 12  0 -> Tx 1 -> Rx
   uint16_t      MD13:1;    // 13  0 -> Tx 1 -> Rx
   uint16_t      MD14:1;    // 14  0 -> Tx 1 -> Rx
   uint16_t      MD15:1;    // 15  0 -> Tx 1 -> Rx
   uint16_t      MD16:1;    // 16  0 -> Tx 1 -> Rx
   uint16_t      MD17:1;    // 17  0 -> Tx 1 -> Rx
   uint16_t      MD18:1;    // 18  0 -> Tx 1 -> Rx
   uint16_t      MD19:1;    // 19  0 -> Tx 1 -> Rx
   uint16_t      MD20:1;    // 20  0 -> Tx 1 -> Rx
   uint16_t      MD21:1;    // 21  0 -> Tx 1 -> Rx
   uint16_t      MD22:1;    // 22  0 -> Tx 1 -> Rx
   uint16_t      MD23:1;    // 23  0 -> Tx 1 -> Rx
   uint16_t      MD24:1;    // 24  0 -> Tx 1 -> Rx
   uint16_t      MD25:1;    // 25  0 -> Tx 1 -> Rx
   uint16_t      MD26:1;    // 26  0 -> Tx 1 -> Rx
   uint16_t      MD27:1;    // 27  0 -> Tx 1 -> Rx
   uint16_t      MD28:1;    // 28  0 -> Tx 1 -> Rx
   uint16_t      MD29:1;    // 29  0 -> Tx 1 -> Rx
   uint16_t      MD30:1;    // 30  0 -> Tx 1 -> Rx
   uint16_t      MD31:1;    // 31  0 -> Tx 1 -> Rx

};

/* Allow access to the bit fields or entire register */
union CANMD_REG {
   uint32_t             all;
   struct CANMD_BITS  bit;
};

/* eCAN Transmit Request Set register (CANTRS) bit definitions */
struct  CANTRS_BITS {      // bit  description
   uint16_t      TRS0:1;     // 0   TRS for Mailbox 0
   uint16_t      TRS1:1;     // 1   TRS for Mailbox 1
   uint16_t      TRS2:1;     // 2   TRS for Mailbox 2
   uint16_t      TRS3:1;     // 3   TRS for Mailbox 3
   uint16_t      TRS4:1;     // 4   TRS for Mailbox 4
   uint16_t      TRS5:1;     // 5   TRS for Mailbox 5
   uint16_t      TRS6:1;     // 6   TRS for Mailbox 6
   uint16_t      TRS7:1;     // 7   TRS for Mailbox 7
   uint16_t      TRS8:1;     // 8   TRS for Mailbox 8
   uint16_t      TRS9:1;     // 9   TRS for Mailbox 9
   uint16_t      TRS10:1;    // 10  TRS for Mailbox 10
   uint16_t      TRS11:1;    // 11  TRS for Mailbox 11
   uint16_t      TRS12:1;    // 12  TRS for Mailbox 12
   uint16_t      TRS13:1;    // 13  TRS for Mailbox 13
   uint16_t      TRS14:1;    // 14  TRS for Mailbox 14
   uint16_t      TRS15:1;    // 15  TRS for Mailbox 15
   uint16_t      TRS16:1;    // 16  TRS for Mailbox 16
   uint16_t      TRS17:1;    // 17  TRS for Mailbox 17
   uint16_t      TRS18:1;    // 18  TRS for Mailbox 18
   uint16_t      TRS19:1;    // 19  TRS for Mailbox 19
   uint16_t      TRS20:1;    // 20  TRS for Mailbox 20
   uint16_t      TRS21:1;    // 21  TRS for Mailbox 21
   uint16_t      TRS22:1;    // 22  TRS for Mailbox 22
   uint16_t      TRS23:1;    // 23  TRS for Mailbox 23
   uint16_t      TRS24:1;    // 24  TRS for Mailbox 24
   uint16_t      TRS25:1;    // 25  TRS for Mailbox 25
   uint16_t      TRS26:1;    // 26  TRS for Mailbox 26
   uint16_t      TRS27:1;    // 27  TRS for Mailbox 27
   uint16_t      TRS28:1;    // 28  TRS for Mailbox 28
   uint16_t      TRS29:1;    // 29  TRS for Mailbox 29
   uint16_t      TRS30:1;    // 30  TRS for Mailbox 30
   uint16_t      TRS31:1;    // 31  TRS for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANTRS_REG {
   uint32_t              all;
   struct CANTRS_BITS  bit;
};

/* eCAN Transmit Request Reset register (CANTRR) bit definitions */
struct  CANTRR_BITS {      // bit  description
   uint16_t      TRR0:1;     // 0   TRR for Mailbox 0
   uint16_t      TRR1:1;     // 1   TRR for Mailbox 1
   uint16_t      TRR2:1;     // 2   TRR for Mailbox 2
   uint16_t      TRR3:1;     // 3   TRR for Mailbox 3
   uint16_t      TRR4:1;     // 4   TRR for Mailbox 4
   uint16_t      TRR5:1;     // 5   TRR for Mailbox 5
   uint16_t      TRR6:1;     // 6   TRR for Mailbox 6
   uint16_t      TRR7:1;     // 7   TRR for Mailbox 7
   uint16_t      TRR8:1;     // 8   TRR for Mailbox 8
   uint16_t      TRR9:1;     // 9   TRR for Mailbox 9
   uint16_t      TRR10:1;    // 10  TRR for Mailbox 10
   uint16_t      TRR11:1;    // 11  TRR for Mailbox 11
   uint16_t      TRR12:1;    // 12  TRR for Mailbox 12
   uint16_t      TRR13:1;    // 13  TRR for Mailbox 13
   uint16_t      TRR14:1;    // 14  TRR for Mailbox 14
   uint16_t      TRR15:1;    // 15  TRR for Mailbox 15
   uint16_t      TRR16:1;    // 16  TRR for Mailbox 16
   uint16_t      TRR17:1;    // 17  TRR for Mailbox 17
   uint16_t      TRR18:1;    // 18  TRR for Mailbox 18
   uint16_t      TRR19:1;    // 19  TRR for Mailbox 19
   uint16_t      TRR20:1;    // 20  TRR for Mailbox 20
   uint16_t      TRR21:1;    // 21  TRR for Mailbox 21
   uint16_t      TRR22:1;    // 22  TRR for Mailbox 22
   uint16_t      TRR23:1;    // 23  TRR for Mailbox 23
   uint16_t      TRR24:1;    // 24  TRR for Mailbox 24
   uint16_t      TRR25:1;    // 25  TRR for Mailbox 25
   uint16_t      TRR26:1;    // 26  TRR for Mailbox 26
   uint16_t      TRR27:1;    // 27  TRR for Mailbox 27
   uint16_t      TRR28:1;    // 28  TRR for Mailbox 28
   uint16_t      TRR29:1;    // 29  TRR for Mailbox 29
   uint16_t      TRR30:1;    // 30  TRR for Mailbox 30
   uint16_t      TRR31:1;    // 31  TRR for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANTRR_REG {
   uint32_t              all;
   struct CANTRR_BITS  bit;
};

/* eCAN Transmit Acknowledge register (CANTA) bit definitions */
struct  CANTA_BITS {      // bit  description
   uint16_t      TA0:1;     // 0   TA for Mailbox 0
   uint16_t      TA1:1;     // 1   TA for Mailbox 1
   uint16_t      TA2:1;     // 2   TA for Mailbox 2
   uint16_t      TA3:1;     // 3   TA for Mailbox 3
   uint16_t      TA4:1;     // 4   TA for Mailbox 4
   uint16_t      TA5:1;     // 5   TA for Mailbox 5
   uint16_t      TA6:1;     // 6   TA for Mailbox 6
   uint16_t      TA7:1;     // 7   TA for Mailbox 7
   uint16_t      TA8:1;     // 8   TA for Mailbox 8
   uint16_t      TA9:1;     // 9   TA for Mailbox 9
   uint16_t      TA10:1;    // 10  TA for Mailbox 10
   uint16_t      TA11:1;    // 11  TA for Mailbox 11
   uint16_t      TA12:1;    // 12  TA for Mailbox 12
   uint16_t      TA13:1;    // 13  TA for Mailbox 13
   uint16_t      TA14:1;    // 14  TA for Mailbox 14
   uint16_t      TA15:1;    // 15  TA for Mailbox 15
   uint16_t      TA16:1;    // 16  TA for Mailbox 16
   uint16_t      TA17:1;    // 17  TA for Mailbox 17
   uint16_t      TA18:1;    // 18  TA for Mailbox 18
   uint16_t      TA19:1;    // 19  TA for Mailbox 19
   uint16_t      TA20:1;    // 20  TA for Mailbox 20
   uint16_t      TA21:1;    // 21  TA for Mailbox 21
   uint16_t      TA22:1;    // 22  TA for Mailbox 22
   uint16_t      TA23:1;    // 23  TA for Mailbox 23
   uint16_t      TA24:1;    // 24  TA for Mailbox 24
   uint16_t      TA25:1;    // 25  TA for Mailbox 25
   uint16_t      TA26:1;    // 26  TA for Mailbox 26
   uint16_t      TA27:1;    // 27  TA for Mailbox 27
   uint16_t      TA28:1;    // 28  TA for Mailbox 28
   uint16_t      TA29:1;    // 29  TA for Mailbox 29
   uint16_t      TA30:1;    // 30  TA for Mailbox 30
   uint16_t      TA31:1;    // 31  TA for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANTA_REG {
   uint32_t             all;
   struct CANTA_BITS  bit;
};

/* eCAN Transmit Abort Acknowledge register (CANAA) bit definitions */
struct  CANAA_BITS {      // bit  description
   uint16_t      AA0:1;     // 0   AA for Mailbox 0
   uint16_t      AA1:1;     // 1   AA for Mailbox 1
   uint16_t      AA2:1;     // 2   AA for Mailbox 2
   uint16_t      AA3:1;     // 3   AA for Mailbox 3
   uint16_t      AA4:1;     // 4   AA for Mailbox 4
   uint16_t      AA5:1;     // 5   AA for Mailbox 5
   uint16_t      AA6:1;     // 6   AA for Mailbox 6
   uint16_t      AA7:1;     // 7   AA for Mailbox 7
   uint16_t      AA8:1;     // 8   AA for Mailbox 8
   uint16_t      AA9:1;     // 9   AA for Mailbox 9
   uint16_t      AA10:1;    // 10  AA for Mailbox 10
   uint16_t      AA11:1;    // 11  AA for Mailbox 11
   uint16_t      AA12:1;    // 12  AA for Mailbox 12
   uint16_t      AA13:1;    // 13  AA for Mailbox 13
   uint16_t      AA14:1;    // 14  AA for Mailbox 14
   uint16_t      AA15:1;    // 15  AA for Mailbox 15
   uint16_t      AA16:1;    // 16  AA for Mailbox 16
   uint16_t      AA17:1;    // 17  AA for Mailbox 17
   uint16_t      AA18:1;    // 18  AA for Mailbox 18
   uint16_t      AA19:1;    // 19  AA for Mailbox 19
   uint16_t      AA20:1;    // 20  AA for Mailbox 20
   uint16_t      AA21:1;    // 21  AA for Mailbox 21
   uint16_t      AA22:1;    // 22  AA for Mailbox 22
   uint16_t      AA23:1;    // 23  AA for Mailbox 23
   uint16_t      AA24:1;    // 24  AA for Mailbox 24
   uint16_t      AA25:1;    // 25  AA for Mailbox 25
   uint16_t      AA26:1;    // 26  AA for Mailbox 26
   uint16_t      AA27:1;    // 27  AA for Mailbox 27
   uint16_t      AA28:1;    // 28  AA for Mailbox 28
   uint16_t      AA29:1;    // 29  AA for Mailbox 29
   uint16_t      AA30:1;    // 30  AA for Mailbox 30
   uint16_t      AA31:1;    // 31  AA for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANAA_REG {
   uint32_t             all;
   struct CANAA_BITS  bit;
};

/* eCAN Received Message Pending register (CANRMP) bit definitions */
struct  CANRMP_BITS {      // bit  description
   uint16_t      RMP0:1;     // 0   RMP for Mailbox 0
   uint16_t      RMP1:1;     // 1   RMP for Mailbox 1
   uint16_t      RMP2:1;     // 2   RMP for Mailbox 2
   uint16_t      RMP3:1;     // 3   RMP for Mailbox 3
   uint16_t      RMP4:1;     // 4   RMP for Mailbox 4
   uint16_t      RMP5:1;     // 5   RMP for Mailbox 5
   uint16_t      RMP6:1;     // 6   RMP for Mailbox 6
   uint16_t      RMP7:1;     // 7   RMP for Mailbox 7
   uint16_t      RMP8:1;     // 8   RMP for Mailbox 8
   uint16_t      RMP9:1;     // 9   RMP for Mailbox 9
   uint16_t      RMP10:1;    // 10  RMP for Mailbox 10
   uint16_t      RMP11:1;    // 11  RMP for Mailbox 11
   uint16_t      RMP12:1;    // 12  RMP for Mailbox 12
   uint16_t      RMP13:1;    // 13  RMP for Mailbox 13
   uint16_t      RMP14:1;    // 14  RMP for Mailbox 14
   uint16_t      RMP15:1;    // 15  RMP for Mailbox 15
   uint16_t      RMP16:1;    // 16  RMP for Mailbox 16
   uint16_t      RMP17:1;    // 17  RMP for Mailbox 17
   uint16_t      RMP18:1;    // 18  RMP for Mailbox 18
   uint16_t      RMP19:1;    // 19  RMP for Mailbox 19
   uint16_t      RMP20:1;    // 20  RMP for Mailbox 20
   uint16_t      RMP21:1;    // 21  RMP for Mailbox 21
   uint16_t      RMP22:1;    // 22  RMP for Mailbox 22
   uint16_t      RMP23:1;    // 23  RMP for Mailbox 23
   uint16_t      RMP24:1;    // 24  RMP for Mailbox 24
   uint16_t      RMP25:1;    // 25  RMP for Mailbox 25
   uint16_t      RMP26:1;    // 26  RMP for Mailbox 26
   uint16_t      RMP27:1;    // 27  RMP for Mailbox 27
   uint16_t      RMP28:1;    // 28  RMP for Mailbox 28
   uint16_t      RMP29:1;    // 29  RMP for Mailbox 29
   uint16_t      RMP30:1;    // 30  RMP for Mailbox 30
   uint16_t      RMP31:1;    // 31  RMP for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANRMP_REG {
   uint32_t              all;
   struct CANRMP_BITS  bit;
};

/* eCAN Received Message Lost register (CANRML) bit definitions */
struct  CANRML_BITS {      // bit  description
   uint16_t      RML0:1;     // 0   RML for Mailbox 0
   uint16_t      RML1:1;     // 1   RML for Mailbox 1
   uint16_t      RML2:1;     // 2   RML for Mailbox 2
   uint16_t      RML3:1;     // 3   RML for Mailbox 3
   uint16_t      RML4:1;     // 4   RML for Mailbox 4
   uint16_t      RML5:1;     // 5   RML for Mailbox 5
   uint16_t      RML6:1;     // 6   RML for Mailbox 6
   uint16_t      RML7:1;     // 7   RML for Mailbox 7
   uint16_t      RML8:1;     // 8   RML for Mailbox 8
   uint16_t      RML9:1;     // 9   RML for Mailbox 9
   uint16_t      RML10:1;    // 10  RML for Mailbox 10
   uint16_t      RML11:1;    // 11  RML for Mailbox 11
   uint16_t      RML12:1;    // 12  RML for Mailbox 12
   uint16_t      RML13:1;    // 13  RML for Mailbox 13
   uint16_t      RML14:1;    // 14  RML for Mailbox 14
   uint16_t      RML15:1;    // 15  RML for Mailbox 15
   uint16_t      RML16:1;    // 16  RML for Mailbox 16
   uint16_t      RML17:1;    // 17  RML for Mailbox 17
   uint16_t      RML18:1;    // 18  RML for Mailbox 18
   uint16_t      RML19:1;    // 19  RML for Mailbox 19
   uint16_t      RML20:1;    // 20  RML for Mailbox 20
   uint16_t      RML21:1;    // 21  RML for Mailbox 21
   uint16_t      RML22:1;    // 22  RML for Mailbox 22
   uint16_t      RML23:1;    // 23  RML for Mailbox 23
   uint16_t      RML24:1;    // 24  RML for Mailbox 24
   uint16_t      RML25:1;    // 25  RML for Mailbox 25
   uint16_t      RML26:1;    // 26  RML for Mailbox 26
   uint16_t      RML27:1;    // 27  RML for Mailbox 27
   uint16_t      RML28:1;    // 28  RML for Mailbox 28
   uint16_t      RML29:1;    // 29  RML for Mailbox 29
   uint16_t      RML30:1;    // 30  RML for Mailbox 30
   uint16_t      RML31:1;    // 31  RML for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANRML_REG {
   uint32_t              all;
   struct CANRML_BITS  bit;
};

/* eCAN Remote Frame Pending register (CANRFP) bit definitions */
struct  CANRFP_BITS {      // bit  description
   uint16_t      RFP0:1;     // 0   RFP for Mailbox 0
   uint16_t      RFP1:1;     // 1   RFP for Mailbox 1
   uint16_t      RFP2:1;     // 2   RFP for Mailbox 2
   uint16_t      RFP3:1;     // 3   RFP for Mailbox 3
   uint16_t      RFP4:1;     // 4   RFP for Mailbox 4
   uint16_t      RFP5:1;     // 5   RFP for Mailbox 5
   uint16_t      RFP6:1;     // 6   RFP for Mailbox 6
   uint16_t      RFP7:1;     // 7   RFP for Mailbox 7
   uint16_t      RFP8:1;     // 8   RFP for Mailbox 8
   uint16_t      RFP9:1;     // 9   RFP for Mailbox 9
   uint16_t      RFP10:1;    // 10  RFP for Mailbox 10
   uint16_t      RFP11:1;    // 11  RFP for Mailbox 11
   uint16_t      RFP12:1;    // 12  RFP for Mailbox 12
   uint16_t      RFP13:1;    // 13  RFP for Mailbox 13
   uint16_t      RFP14:1;    // 14  RFP for Mailbox 14
   uint16_t      RFP15:1;    // 15  RFP for Mailbox 15
   uint16_t      RFP16:1;    // 16  RFP for Mailbox 16
   uint16_t      RFP17:1;    // 17  RFP for Mailbox 17
   uint16_t      RFP18:1;    // 18  RFP for Mailbox 18
   uint16_t      RFP19:1;    // 19  RFP for Mailbox 19
   uint16_t      RFP20:1;    // 20  RFP for Mailbox 20
   uint16_t      RFP21:1;    // 21  RFP for Mailbox 21
   uint16_t      RFP22:1;    // 22  RFP for Mailbox 22
   uint16_t      RFP23:1;    // 23  RFP for Mailbox 23
   uint16_t      RFP24:1;    // 24  RFP for Mailbox 24
   uint16_t      RFP25:1;    // 25  RFP for Mailbox 25
   uint16_t      RFP26:1;    // 26  RFP for Mailbox 26
   uint16_t      RFP27:1;    // 27  RFP for Mailbox 27
   uint16_t      RFP28:1;    // 28  RFP for Mailbox 28
   uint16_t      RFP29:1;    // 29  RFP for Mailbox 29
   uint16_t      RFP30:1;    // 30  RFP for Mailbox 30
   uint16_t      RFP31:1;    // 31  RFP for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANRFP_REG {
   uint32_t              all;
   struct CANRFP_BITS  bit;
};

/* eCAN Global Acceptance Mask register (CANGAM) bit definitions */
struct  CANGAM_BITS {   // bits  description
   uint16_t GAM150:16;    // 15:0  Global acceptance mask bits 0-15
   uint16_t GAM2816:13;   // 28:16 Global acceptance mask bits 16-28
   uint16_t rsvd:2;       // 30:29 reserved
   uint16_t AMI:1;        // 31    AMI bit
};

/* Allow access to the bit fields or entire register */
union CANGAM_REG {
   uint32_t              all;
   struct CANGAM_BITS  bit;
};

/* eCAN Master Control register (CANMC) bit definitions */
struct  CANMC_BITS {       // bits  description
   uint16_t      MBNR:5;     // 4:0   MBX # for CDR bit
   uint16_t      SRES:1;     // 5     Soft reset
   uint16_t      STM:1;      // 6     Self-test mode
   uint16_t      ABO:1;      // 7     Auto bus-on
   uint16_t      CDR:1;      // 8     Change data request
   uint16_t      WUBA:1;     // 9     Wake-up on bus activity
   uint16_t      DBO:1;      // 10    Data-byte order
   uint16_t      PDR:1;      // 11    Power-down mode request
   uint16_t      CCR:1;      // 12    Change configuration request
   uint16_t      SCB:1;      // 13    SCC compatibility bit
   uint16_t      TCC:1;      // 14    TSC MSB clear bit
   uint16_t      MBCC:1;     // 15    TSC clear bit thru mailbox 16
   uint16_t      SUSP:1;     // 16    SUSPEND free/soft bit
   uint16_t      rsvd:15;    // 31:17  reserved
};

/* Allow access to the bit fields or entire register */
union CANMC_REG {
   uint32_t             all;
   struct CANMC_BITS  bit;
};

/* eCAN Bit -timing configuration register (CANBTC) bit definitions */
struct  CANBTC_BITS {  // bits  description
   uint16_t  TSEG2REG:3; // 2:0   TSEG2 register value
   uint16_t  TSEG1REG:4; // 6:3   TSEG1 register value
   uint16_t  SAM:1;      // 7     Sample-point setting
   uint16_t  SJWREG:2;   // 9:8   Synchroniztion Jump Width register value
   uint16_t  rsvd1:6;    // 15:10 reserved
   uint16_t  BRPREG:8;   // 23:16 Baudrate prescaler register value
   uint16_t  rsvd2:8;    // 31:24 reserved
};

/* Allow access to the bit fields or entire register */
union CANBTC_REG {
   uint32_t              all;
   struct CANBTC_BITS  bit;
};

/* eCAN Error & Status register (CANES) bit definitions */
struct  CANES_BITS {    // bits  description
   uint16_t   TM:1;       // 0     Transmit Mode
   uint16_t   RM:1;       // 1     Receive Mode
   uint16_t   rsvd1:1;    // 2     reserved
   uint16_t   PDA:1;      // 3     Power-down acknowledge
   uint16_t   CCE:1;      // 4     Change Configuration Enable
   uint16_t   SMA:1;      // 5     Suspend Mode Acknowledge
   uint16_t   rsvd2:10;   // 15:6  reserved
   uint16_t   EW:1;       // 16    Warning status
   uint16_t   EP:1;       // 17    Error Passive status
   uint16_t   BO:1;       // 18    Bus-off status
   uint16_t   ACKE:1;     // 19    Acknowledge error
   uint16_t   SE:1;       // 20    Stuff error
   uint16_t   CRCE:1;     // 21    CRC error
   uint16_t   SA1:1;      // 22    Stuck at Dominant error
   uint16_t   BE:1;       // 23    Bit error
   uint16_t   FE:1;       // 24    Framing error
   uint16_t   rsvd3:7;    // 31:25 reserved
};

/* Allow access to the bit fields or entire register */
union CANES_REG {
   uint32_t             all;
   struct CANES_BITS  bit;
};

/* eCAN Transmit Error Counter register (CANTEC) bit definitions */
struct  CANTEC_BITS {  // bits  description
   uint16_t TEC:8;       // 7:0   TEC
   uint16_t rsvd1:8;     // 15:8  reserved
   uint16_t rsvd2:16;    // 31:16  reserved
};

/* Allow access to the bit fields or entire register */
union CANTEC_REG {
   uint32_t              all;
   struct CANTEC_BITS  bit;
};

/* eCAN Receive Error Counter register (CANREC) bit definitions */
struct  CANREC_BITS {  // bits  description
   uint16_t REC:8;       // 7:0   REC
   uint16_t rsvd1:8;     // 15:8  reserved
   uint16_t rsvd2:16;    // 31:16 reserved
};

/* Allow access to the bit fields or entire register */
union CANREC_REG {
   uint32_t              all;
   struct CANREC_BITS  bit;
};

/* eCAN Global Interrupt Flag 0 (CANGIF0) bit definitions */
struct  CANGIF0_BITS {  // bits  description
   uint16_t   MIV0:5;     // 4:0   Mailbox Interrupt Vector
   uint16_t   rsvd1:3;    // 7:5   reserved
   uint16_t   WLIF0:1;    // 8     Warning level interrupt flag
   uint16_t   EPIF0:1;    // 9     Error-passive interrupt flag
   uint16_t   BOIF0:1;    // 10    Bus-off interrupt flag
   uint16_t   RMLIF0:1;   // 11    Received message lost interrupt flag
   uint16_t   WUIF0:1;    // 12    Wakeup interrupt flag
   uint16_t   WDIF0:1;    // 13    Write denied interrupt flag
   uint16_t   AAIF0:1;    // 14    Abort Ack interrupt flag
   uint16_t   GMIF0:1;    // 15    Global MBX interrupt flag
   uint16_t   TCOF0:1;    // 16    TSC Overflow flag
   uint16_t   MTOF0:1;    // 17    Mailbox Timeout flag
   uint16_t   rsvd2:14;   // 31:18 reserved
};

/* Allow access to the bit fields or entire register */
union CANGIF0_REG {
   uint32_t               all;
   struct CANGIF0_BITS  bit;
};

/* eCAN Global Interrupt Mask register (CANGIM) bit definitions */
struct  CANGIM_BITS { // bits  description
   uint16_t  I0EN:1;    // 0      Interrupt 0 enable
   uint16_t  I1EN:1;    // 1      Interrupt 1 enable
   uint16_t  GIL:1;     // 2      Global Interrupt Level
   uint16_t  rsvd1:5;   // 7:3    reserved
   uint16_t  WLIM:1;    // 8      Warning level interrupt mask
   uint16_t  EPIM:1;    // 9      Error-passive interrupt mask
   uint16_t  BOIM:1;    // 10     Bus-off interrupt mask
   uint16_t  RMLIM:1;   // 11     Received message lost interrupt mask
   uint16_t  WUIM:1;    // 12     Wakeup interrupt mask
   uint16_t  WDIM:1;    // 13     Write denied interrupt mask
   uint16_t  AAIM:1;    // 14     Abort Ack interrupt mask
   uint16_t  rsvd2:1;   // 15     reserved
   uint16_t  TCOM:1;    // 16     TSC overflow interrupt mask
   uint16_t  MTOM:1;    // 17     MBX Timeout interrupt mask
   uint16_t  rsvd3:14;  // 31:18  reserved
};

/* Allow access to the bit fields or entire register */
union CANGIM_REG {
   uint32_t              all;
   struct CANGIM_BITS  bit;
};

/* eCAN Global Interrupt Flag 1 (eCANGIF1) bit definitions */
struct  CANGIF1_BITS {     // bits  description
   uint16_t      MIV1:5;     // 4:0   Mailbox Interrupt Vector
   uint16_t      rsvd1:3;    // 7:5   reserved
   uint16_t      WLIF1:1;    // 8     Warning level interrupt flag
   uint16_t      EPIF1:1;    // 9     Error-passive interrupt flag
   uint16_t      BOIF1:1;    // 10    Bus-off interrupt flag
   uint16_t      RMLIF1:1;   // 11    Received message lost interrupt flag
   uint16_t      WUIF1:1;    // 12    Wakeup interrupt flag
   uint16_t      WDIF1:1;    // 13    Write denied interrupt flag
   uint16_t      AAIF1:1;    // 14    Abort Ack interrupt flag
   uint16_t      GMIF1:1;    // 15    Global MBX interrupt flag
   uint16_t      TCOF1:1;    // 16    TSC Overflow flag
   uint16_t      MTOF1:1;    // 17    Mailbox Timeout flag
   uint16_t      rsvd2:14;   // 31:18 reserved
};

/* Allow access to the bit fields or entire register */
union CANGIF1_REG {
   uint32_t               all;
   struct CANGIF1_BITS  bit;
};

/* eCAN Mailbox Interrupt Mask register (CANMIM) bit definitions */
struct  CANMIM_BITS {      // bit  description
   uint16_t      MIM0:1;     // 0   MIM for Mailbox 0
   uint16_t      MIM1:1;     // 1   MIM for Mailbox 1
   uint16_t      MIM2:1;     // 2   MIM for Mailbox 2
   uint16_t      MIM3:1;     // 3   MIM for Mailbox 3
   uint16_t      MIM4:1;     // 4   MIM for Mailbox 4
   uint16_t      MIM5:1;     // 5   MIM for Mailbox 5
   uint16_t      MIM6:1;     // 6   MIM for Mailbox 6
   uint16_t      MIM7:1;     // 7   MIM for Mailbox 7
   uint16_t      MIM8:1;     // 8   MIM for Mailbox 8
   uint16_t      MIM9:1;     // 9   MIM for Mailbox 9
   uint16_t      MIM10:1;    // 10  MIM for Mailbox 10
   uint16_t      MIM11:1;    // 11  MIM for Mailbox 11
   uint16_t      MIM12:1;    // 12  MIM for Mailbox 12
   uint16_t      MIM13:1;    // 13  MIM for Mailbox 13
   uint16_t      MIM14:1;    // 14  MIM for Mailbox 14
   uint16_t      MIM15:1;    // 15  MIM for Mailbox 15
   uint16_t      MIM16:1;    // 16  MIM for Mailbox 16
   uint16_t      MIM17:1;    // 17  MIM for Mailbox 17
   uint16_t      MIM18:1;    // 18  MIM for Mailbox 18
   uint16_t      MIM19:1;    // 19  MIM for Mailbox 19
   uint16_t      MIM20:1;    // 20  MIM for Mailbox 20
   uint16_t      MIM21:1;    // 21  MIM for Mailbox 21
   uint16_t      MIM22:1;    // 22  MIM for Mailbox 22
   uint16_t      MIM23:1;    // 23  MIM for Mailbox 23
   uint16_t      MIM24:1;    // 24  MIM for Mailbox 24
   uint16_t      MIM25:1;    // 25  MIM for Mailbox 25
   uint16_t      MIM26:1;    // 26  MIM for Mailbox 26
   uint16_t      MIM27:1;    // 27  MIM for Mailbox 27
   uint16_t      MIM28:1;    // 28  MIM for Mailbox 28
   uint16_t      MIM29:1;    // 29  MIM for Mailbox 29
   uint16_t      MIM30:1;    // 30  MIM for Mailbox 30
   uint16_t      MIM31:1;    // 31  MIM for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANMIM_REG {
   uint32_t              all;
   struct CANMIM_BITS  bit;
};

/* eCAN Mailbox Interrupt Level register (CANMIL) bit definitions */
struct  CANMIL_BITS {      // bit  description
   uint16_t      MIL0:1;     // 0   0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL1:1;     // 1   0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL2:1;     // 2   0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL3:1;     // 3   0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL4:1;     // 4   0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL5:1;     // 5   0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL6:1;     // 6   0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL7:1;     // 7   0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL8:1;     // 8   0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL9:1;     // 9   0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL10:1;    // 10  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL11:1;    // 11  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL12:1;    // 12  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL13:1;    // 13  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL14:1;    // 14  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL15:1;    // 15  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL16:1;    // 16  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL17:1;    // 17  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL18:1;    // 18  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL19:1;    // 19  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL20:1;    // 20  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL21:1;    // 21  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL22:1;    // 22  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL23:1;    // 23  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL24:1;    // 24  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL25:1;    // 25  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL26:1;    // 26  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL27:1;    // 27  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL28:1;    // 28  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL29:1;    // 29  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL30:1;    // 30  0 -> Int 9.5   1 -> Int 9.6
   uint16_t      MIL31:1;    // 31  0 -> Int 9.5   1 -> Int 9.6

};

/* Allow access to the bit fields or entire register */
union CANMIL_REG {
   uint32_t              all;
   struct CANMIL_BITS  bit;
};

/* eCAN Overwrite Protection Control register (CANOPC) bit definitions */
struct  CANOPC_BITS {      // bit  description
   uint16_t      OPC0:1;     // 0   OPC for Mailbox 0
   uint16_t      OPC1:1;     // 1   OPC for Mailbox 1
   uint16_t      OPC2:1;     // 2   OPC for Mailbox 2
   uint16_t      OPC3:1;     // 3   OPC for Mailbox 3
   uint16_t      OPC4:1;     // 4   OPC for Mailbox 4
   uint16_t      OPC5:1;     // 5   OPC for Mailbox 5
   uint16_t      OPC6:1;     // 6   OPC for Mailbox 6
   uint16_t      OPC7:1;     // 7   OPC for Mailbox 7
   uint16_t      OPC8:1;     // 8   OPC for Mailbox 8
   uint16_t      OPC9:1;     // 9   OPC for Mailbox 9
   uint16_t      OPC10:1;    // 10  OPC for Mailbox 10
   uint16_t      OPC11:1;    // 11  OPC for Mailbox 11
   uint16_t      OPC12:1;    // 12  OPC for Mailbox 12
   uint16_t      OPC13:1;    // 13  OPC for Mailbox 13
   uint16_t      OPC14:1;    // 14  OPC for Mailbox 14
   uint16_t      OPC15:1;    // 15  OPC for Mailbox 15
   uint16_t      OPC16:1;    // 16  OPC for Mailbox 16
   uint16_t      OPC17:1;    // 17  OPC for Mailbox 17
   uint16_t      OPC18:1;    // 18  OPC for Mailbox 18
   uint16_t      OPC19:1;    // 19  OPC for Mailbox 19
   uint16_t      OPC20:1;    // 20  OPC for Mailbox 20
   uint16_t      OPC21:1;    // 21  OPC for Mailbox 21
   uint16_t      OPC22:1;    // 22  OPC for Mailbox 22
   uint16_t      OPC23:1;    // 23  OPC for Mailbox 23
   uint16_t      OPC24:1;    // 24  OPC for Mailbox 24
   uint16_t      OPC25:1;    // 25  OPC for Mailbox 25
   uint16_t      OPC26:1;    // 26  OPC for Mailbox 26
   uint16_t      OPC27:1;    // 27  OPC for Mailbox 27
   uint16_t      OPC28:1;    // 28  OPC for Mailbox 28
   uint16_t      OPC29:1;    // 29  OPC for Mailbox 29
   uint16_t      OPC30:1;    // 30  OPC for Mailbox 30
   uint16_t      OPC31:1;    // 31  OPC for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANOPC_REG {
   uint32_t              all;
   struct CANOPC_BITS  bit;
};

/* eCAN TX I/O Control Register (CANTIOC) bit definitions */
struct  CANTIOC_BITS { // bits  description
   uint16_t  rsvd1:3;    // 2:0   reserved
   uint16_t  TXFUNC:1;   // 3     TXFUNC
   uint16_t  rsvd2:12;   // 15:4  reserved
   uint16_t  rsvd3:16;   // 31:16 reserved
};

/* Allow access to the bit fields or entire register */
union CANTIOC_REG {
   uint32_t               all;
   struct CANTIOC_BITS  bit;
};

/* eCAN RX I/O Control Register (CANRIOC) bit definitions */
struct  CANRIOC_BITS { // bits  description
   uint16_t  rsvd1:3;    // 2:0   reserved
   uint16_t  RXFUNC:1;   // 3     RXFUNC
   uint16_t  rsvd2:12;   // 15:4  reserved
   uint16_t  rsvd3:16;   // 31:16 reserved
};

/* Allow access to the bit fields or entire register */
union CANRIOC_REG {
   uint32_t               all;
   struct CANRIOC_BITS  bit;
};

/* eCAN Time-out Control register (CANTOC) bit definitions */
struct  CANTOC_BITS {      // bit  description
   uint16_t      TOC0:1;     // 0   TOC for Mailbox 0
   uint16_t      TOC1:1;     // 1   TOC for Mailbox 1
   uint16_t      TOC2:1;     // 2   TOC for Mailbox 2
   uint16_t      TOC3:1;     // 3   TOC for Mailbox 3
   uint16_t      TOC4:1;     // 4   TOC for Mailbox 4
   uint16_t      TOC5:1;     // 5   TOC for Mailbox 5
   uint16_t      TOC6:1;     // 6   TOC for Mailbox 6
   uint16_t      TOC7:1;     // 7   TOC for Mailbox 7
   uint16_t      TOC8:1;     // 8   TOC for Mailbox 8
   uint16_t      TOC9:1;     // 9   TOC for Mailbox 9
   uint16_t      TOC10:1;    // 10  TOC for Mailbox 10
   uint16_t      TOC11:1;    // 11  TOC for Mailbox 11
   uint16_t      TOC12:1;    // 12  TOC for Mailbox 12
   uint16_t      TOC13:1;    // 13  TOC for Mailbox 13
   uint16_t      TOC14:1;    // 14  TOC for Mailbox 14
   uint16_t      TOC15:1;    // 15  TOC for Mailbox 15
   uint16_t      TOC16:1;    // 16  TOC for Mailbox 16
   uint16_t      TOC17:1;    // 17  TOC for Mailbox 17
   uint16_t      TOC18:1;    // 18  TOC for Mailbox 18
   uint16_t      TOC19:1;    // 19  TOC for Mailbox 19
   uint16_t      TOC20:1;    // 20  TOC for Mailbox 20
   uint16_t      TOC21:1;    // 21  TOC for Mailbox 21
   uint16_t      TOC22:1;    // 22  TOC for Mailbox 22
   uint16_t      TOC23:1;    // 23  TOC for Mailbox 23
   uint16_t      TOC24:1;    // 24  TOC for Mailbox 24
   uint16_t      TOC25:1;    // 25  TOC for Mailbox 25
   uint16_t      TOC26:1;    // 26  TOC for Mailbox 26
   uint16_t      TOC27:1;    // 27  TOC for Mailbox 27
   uint16_t      TOC28:1;    // 28  TOC for Mailbox 28
   uint16_t      TOC29:1;    // 29  TOC for Mailbox 29
   uint16_t      TOC30:1;    // 30  TOC for Mailbox 30
   uint16_t      TOC31:1;    // 31  TOC for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANTOC_REG {
   uint32_t              all;
   struct CANTOC_BITS  bit;
};

/* eCAN Time-out Status register (CANTOS) bit definitions */
struct  CANTOS_BITS {            // bit  description
   uint16_t      TOS0:1;     // 0   TOS for Mailbox 0
   uint16_t      TOS1:1;     // 1   TOS for Mailbox 1
   uint16_t      TOS2:1;     // 2   TOS for Mailbox 2
   uint16_t      TOS3:1;     // 3   TOS for Mailbox 3
   uint16_t      TOS4:1;     // 4   TOS for Mailbox 4
   uint16_t      TOS5:1;     // 5   TOS for Mailbox 5
   uint16_t      TOS6:1;     // 6   TOS for Mailbox 6
   uint16_t      TOS7:1;     // 7   TOS for Mailbox 7
   uint16_t      TOS8:1;     // 8   TOS for Mailbox 8
   uint16_t      TOS9:1;     // 9   TOS for Mailbox 9
   uint16_t      TOS10:1;    // 10  TOS for Mailbox 10
   uint16_t      TOS11:1;    // 11  TOS for Mailbox 11
   uint16_t      TOS12:1;    // 12  TOS for Mailbox 12
   uint16_t      TOS13:1;    // 13  TOS for Mailbox 13
   uint16_t      TOS14:1;    // 14  TOS for Mailbox 14
   uint16_t      TOS15:1;    // 15  TOS for Mailbox 15
   uint16_t      TOS16:1;    // 16  TOS for Mailbox 16
   uint16_t      TOS17:1;    // 17  TOS for Mailbox 17
   uint16_t      TOS18:1;    // 18  TOS for Mailbox 18
   uint16_t      TOS19:1;    // 19  TOS for Mailbox 19
   uint16_t      TOS20:1;    // 20  TOS for Mailbox 20
   uint16_t      TOS21:1;    // 21  TOS for Mailbox 21
   uint16_t      TOS22:1;    // 22  TOS for Mailbox 22
   uint16_t      TOS23:1;    // 23  TOS for Mailbox 23
   uint16_t      TOS24:1;    // 24  TOS for Mailbox 24
   uint16_t      TOS25:1;    // 25  TOS for Mailbox 25
   uint16_t      TOS26:1;    // 26  TOS for Mailbox 26
   uint16_t      TOS27:1;    // 27  TOS for Mailbox 27
   uint16_t      TOS28:1;    // 28  TOS for Mailbox 28
   uint16_t      TOS29:1;    // 29  TOS for Mailbox 29
   uint16_t      TOS30:1;    // 30  TOS for Mailbox 30
   uint16_t      TOS31:1;    // 31  TOS for Mailbox 31

};

/* Allow access to the bit fields or entire register */
union CANTOS_REG {
   uint32_t              all;
   struct CANTOS_BITS  bit;
};

/**************************************/
/* eCAN Control & Status register file */
/**************************************/

struct ECAN_REGS {
   union CANME_REG   CANME;          // Mailbox Enable
   union CANMD_REG   CANMD;          // Mailbox Direction
   union CANTRS_REG  CANTRS;         // Transmit Request Set
   union CANTRR_REG  CANTRR;         // Transmit Request Reset
   union CANTA_REG   CANTA;          // Transmit Acknowledge
   union CANAA_REG   CANAA;          // Abort Acknowledge
   union CANRMP_REG  CANRMP;         // Received Message Pending
   union CANRML_REG  CANRML;         // Received Message Lost
   union CANRFP_REG  CANRFP;         // Remote Frame Pending
   union CANGAM_REG  CANGAM;         // Global Acceptance Mask
   union CANMC_REG   CANMC;          // Master Control
   union CANBTC_REG  CANBTC;         // Bit Timing
   union CANES_REG   CANES;          // Error Status
   union CANTEC_REG  CANTEC;         // Transmit Error Counter
   union CANREC_REG  CANREC;         // Receive Error Counter
   union CANGIF0_REG CANGIF0;        // Global Interrupt Flag 0
   union CANGIM_REG  CANGIM;         // Global Interrupt Mask 0
   union CANGIF1_REG CANGIF1;        // Global Interrupt Flag 1
   union CANMIM_REG  CANMIM;         // Mailbox Interrupt Mask
   union CANMIL_REG  CANMIL;         // Mailbox Interrupt Level
   union CANOPC_REG  CANOPC;         // Overwrite Protection Control
   union CANTIOC_REG CANTIOC;        // TX I/O Control
   union CANRIOC_REG CANRIOC;        // RX I/O Control
   uint32_t            CANTSC;         // Time-stamp counter
   union CANTOC_REG  CANTOC;         // Time-out Control
   union CANTOS_REG  CANTOS;         // Time-out Status

};

/* --------------------------------------------------- */
/* eCAN Mailbox Registers                               */
/* ----------------------------------------------------*/

/* eCAN Message ID (MSGID) bit definitions */
struct  CANMSGID_BITS {        // bits  description
   uint16_t      EXTMSGID_L:16;  // 0:15
   uint16_t      EXTMSGID_H:2;   // 16:17
   uint16_t      STDMSGID:11;    // 18:28
   uint16_t      AAM:1;          // 29
   uint16_t      AME:1;          // 30
   uint16_t      IDE:1;          // 31

};

/* Allow access to the bit fields or entire register */
union CANMSGID_REG {
   uint32_t                all;
   struct CANMSGID_BITS  bit;
};

/* eCAN Message Control Field (MSGCTRL) bit definitions */
struct  CANMSGCTRL_BITS {     // bits  description
   uint16_t DLC:4;          // 0:3
   uint16_t RTR:1;          // 4
   uint16_t rsvd1:3;        // 7:5   reserved
   uint16_t TPL:5;          // 12:8
   uint16_t rsvd2:3;        // 15:13 reserved
   uint16_t rsvd3:16;       // 31:16 reserved
};

/* Allow access to the bit fields or entire register */
union CANMSGCTRL_REG {
   uint32_t                  all;
   struct CANMSGCTRL_BITS  bit;
};

/* eCAN Message Data Register low (MDR_L) word definitions */
struct  CANMDL_WORDS {      // bits  description
   uint16_t      LOW_WORD:16; // 0:15
   uint16_t      HI_WORD:16;  // 31:16
};

/* eCAN Message Data Register low (MDR_L) byte definitions */
struct  CANMDL_BYTES {      // bits   description
   uint16_t      BYTE3:8;     // 31:24
   uint16_t      BYTE2:8;     // 23:16
   uint16_t      BYTE1:8;     // 15:8
   uint16_t      BYTE0:8;     // 7:0
};

/* Allow access to the bit fields or entire register */

union CANMDL_REG {
   uint32_t                all;
   struct CANMDL_WORDS   word;
   struct CANMDL_BYTES   byte;
};

/* eCAN Message Data Register high  (MDR_H) word definitions */
struct  CANMDH_WORDS {         // bits  description
   uint16_t      LOW_WORD:16;    // 0:15
   uint16_t      HI_WORD:16;     // 31:16
};

/* eCAN Message Data Register low (MDR_H) byte definitions */
struct  CANMDH_BYTES {      // bits   description
   uint16_t      BYTE7:8;     // 63:56
   uint16_t      BYTE6:8;     // 55:48
   uint16_t      BYTE5:8;     // 47:40
   uint16_t      BYTE4:8;     // 39:32
};

/* Allow access to the bit fields or entire register */
union CANMDH_REG {
   uint32_t                  all;
   struct CANMDH_WORDS     word;
   struct CANMDH_BYTES     byte;
};

struct MBOX {
   union CANMSGID_REG     MSGID;
   union CANMSGCTRL_REG   MSGCTRL;
   union CANMDL_REG       MDL;
   union CANMDH_REG       MDH;
};

/**************************************/
/*          eCAN Mailboxes             */
/**************************************/

struct ECAN_MBOXES {
   struct MBOX MBOX0;
   struct MBOX MBOX1;
   struct MBOX MBOX2;
   struct MBOX MBOX3;
   struct MBOX MBOX4;
   struct MBOX MBOX5;
   struct MBOX MBOX6;
   struct MBOX MBOX7;
   struct MBOX MBOX8;
   struct MBOX MBOX9;
   struct MBOX MBOX10;
   struct MBOX MBOX11;
   struct MBOX MBOX12;
   struct MBOX MBOX13;
   struct MBOX MBOX14;
   struct MBOX MBOX15;
   struct MBOX MBOX16;
   struct MBOX MBOX17;
   struct MBOX MBOX18;
   struct MBOX MBOX19;
   struct MBOX MBOX20;
   struct MBOX MBOX21;
   struct MBOX MBOX22;
   struct MBOX MBOX23;
   struct MBOX MBOX24;
   struct MBOX MBOX25;
   struct MBOX MBOX26;
   struct MBOX MBOX27;
   struct MBOX MBOX28;
   struct MBOX MBOX29;
   struct MBOX MBOX30;
   struct MBOX MBOX31;
};

/* eCAN Local Acceptance Mask (LAM) bit definitions */
struct  CANLAM_BITS {                // bits  description
   uint16_t      LAM_L:16;     // 0:15
   uint16_t      LAM_H:13;     // 16:28
   uint16_t rsvd1:2;           // 29:30   reserved
   uint16_t      LAMI:1;       // 31
};

/* Allow access to the bit fields or entire register */
union CANLAM_REG {
   uint32_t        all;
   struct CANLAM_BITS  bit;
};

/**************************************/
/*    eCAN Local Acceptance Masks      */
/**************************************/

/* eCAN LAM File */
struct LAM_REGS {
   union CANLAM_REG LAM0;
   union CANLAM_REG LAM1;
   union CANLAM_REG LAM2;
   union CANLAM_REG LAM3;
   union CANLAM_REG LAM4;
   union CANLAM_REG LAM5;
   union CANLAM_REG LAM6;
   union CANLAM_REG LAM7;
   union CANLAM_REG LAM8;
   union CANLAM_REG LAM9;
   union CANLAM_REG LAM10;
   union CANLAM_REG LAM11;
   union CANLAM_REG LAM12;
   union CANLAM_REG LAM13;
   union CANLAM_REG LAM14;
   union CANLAM_REG LAM15;
   union CANLAM_REG LAM16;
   union CANLAM_REG LAM17;
   union CANLAM_REG LAM18;
   union CANLAM_REG LAM19;
   union CANLAM_REG LAM20;
   union CANLAM_REG LAM21;
   union CANLAM_REG LAM22;
   union CANLAM_REG LAM23;
   union CANLAM_REG LAM24;
   union CANLAM_REG LAM25;
   union CANLAM_REG LAM26;
   union CANLAM_REG LAM27;
   union CANLAM_REG LAM28;
   union CANLAM_REG LAM29;
   union CANLAM_REG LAM30;
   union CANLAM_REG LAM31;
};

/* Mailbox MOTS File */

struct MOTS_REGS {
   uint32_t MOTS0;
   uint32_t MOTS1;
   uint32_t MOTS2;
   uint32_t MOTS3;
   uint32_t MOTS4;
   uint32_t MOTS5;
   uint32_t MOTS6;
   uint32_t MOTS7;
   uint32_t MOTS8;
   uint32_t MOTS9;
   uint32_t MOTS10;
   uint32_t MOTS11;
   uint32_t MOTS12;
   uint32_t MOTS13;
   uint32_t MOTS14;
   uint32_t MOTS15;
   uint32_t MOTS16;
   uint32_t MOTS17;
   uint32_t MOTS18;
   uint32_t MOTS19;
   uint32_t MOTS20;
   uint32_t MOTS21;
   uint32_t MOTS22;
   uint32_t MOTS23;
   uint32_t MOTS24;
   uint32_t MOTS25;
   uint32_t MOTS26;
   uint32_t MOTS27;
   uint32_t MOTS28;
   uint32_t MOTS29;
   uint32_t MOTS30;
   uint32_t MOTS31;
};

/* Mailbox MOTO File */

struct MOTO_REGS {
   uint32_t MOTO0;
   uint32_t MOTO1;
   uint32_t MOTO2;
   uint32_t MOTO3;
   uint32_t MOTO4;
   uint32_t MOTO5;
   uint32_t MOTO6;
   uint32_t MOTO7;
   uint32_t MOTO8;
   uint32_t MOTO9;
   uint32_t MOTO10;
   uint32_t MOTO11;
   uint32_t MOTO12;
   uint32_t MOTO13;
   uint32_t MOTO14;
   uint32_t MOTO15;
   uint32_t MOTO16;
   uint32_t MOTO17;
   uint32_t MOTO18;
   uint32_t MOTO19;
   uint32_t MOTO20;
   uint32_t MOTO21;
   uint32_t MOTO22;
   uint32_t MOTO23;
   uint32_t MOTO24;
   uint32_t MOTO25;
   uint32_t MOTO26;
   uint32_t MOTO27;
   uint32_t MOTO28;
   uint32_t MOTO29;
   uint32_t MOTO30;
   uint32_t MOTO31;
};

//---------------------------------------------------------------------------
// eCAN External References & Function Declarations:
//
extern volatile struct ECAN_REGS ECanaRegs;
extern volatile struct ECAN_MBOXES ECanaMboxes;
extern volatile struct LAM_REGS ECanaLAMRegs;
extern volatile struct MOTO_REGS ECanaMOTORegs;
extern volatile struct MOTS_REGS ECanaMOTSRegs;

#ifdef __cplusplus
}
#endif /* extern "C" */

#endif  // end of _ECAN_H_ definition

//@}
