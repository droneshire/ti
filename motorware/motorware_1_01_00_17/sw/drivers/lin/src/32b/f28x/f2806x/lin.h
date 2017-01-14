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
//! \defgroup LIN LIN
//@{


#ifndef _LIN_H_
#define _LIN_H_

// TI File $Revision: /main/4 $
// Checkin $Date: April 29, 2009   09:56:39 $
//###########################################################################
//
// FILE:   LIN.h
//
// TITLE:  DSP2803x Device LIN Register Definitions.
//
//###########################################################################
// $TI Release: 2803x C/C++ Header Files and Peripheral Examples V1.23 $
// $Release Date: October 15, 2010 $
//###########################################################################

#include "sw/modules/types/src/types.h"

#ifdef __cplusplus
extern "C" {
#endif

/* --------------------------------------------------- */
/* LIN Registers                                       */
/* ----------------------------------------------------*/

/* Global Control Register 0 (SCIGCR0) bit definitions */
struct SCIGCR0_BITS {      // bit    description
    uint16_t  RESET:1;       // 0      LIN Module reset bit
    uint16_t  rsvd1:15;      // 15:1   reserved
	uint16_t  rsvd2:16;      // 31:16  reserved
};

/* Allow access to the bit fields or entire register */
union SCIGCR0_REG {
   uint32_t               all;
   struct SCIGCR0_BITS  bit;
};

/* Global Control Register 1 (SCIGCR1) bit definitions */
struct SCIGCR1_BITS {      // bit    description
    uint16_t  COMMMODE:1;    // 0      SCI/LIN communications mode bit
    uint16_t  TIMINGMODE:1;  // 1      SCI timing mode bit. Should be set to 1 for SCI mode.
    uint16_t  PARITYENA:1;   // 2      Parity enable
    uint16_t  PARITY:1;      // 3      SCI parity odd/even selection
    uint16_t  STOP:1;        // 4      SCI number of stop bits
    uint16_t  CLK_MASTER:1;  // 5      LIN Master/Slave selection and SCI clock enable
    uint16_t  LINMODE:1;     // 6      LIN Mode enable/disable
    uint16_t  SWnRST:1;      // 7      Software reset
    uint16_t  SLEEP:1;       // 8      SCI sleep (SCI compatibility mode)
    uint16_t  ADAPT:1;       // 9      Automatic baudrate adjustment control(LIN mode)
    uint16_t  MBUFMODE:1;    // 10     Multi-buffer mode
    uint16_t  CTYPE:1;       // 11     Checksum type (LIN mode)
    uint16_t  HGENCTRL:1;    // 12     Mask filtering comparison control (LIN mode)
    uint16_t  STOPEXTFRAME:1;// 13     Stop extended frame communication (LIN mode)
    uint16_t  rsvd2:2;       // 15:14  Reserved
    uint16_t  LOOPBACK:1;    // 16     Digital loopback mode
    uint16_t  CONT:1;        // 17     Continue on suspend
    uint16_t  rsvd3:6;       // 23:18  reserved
    uint16_t  RXENA:1;       // 24     SCI mode receiver enable
    uint16_t  TXENA:1;       // 25     SCI mode transmitter enable
    uint16_t  rsvd4:6;       // 31:26  reserved
};

/* Allow access to the bit fields or entire register */
union SCIGCR1_REG {
   uint32_t               all;
   struct SCIGCR1_BITS  bit;
};

/* Global Control Register 2 (SCIGCR2) bit definitions */
struct SCIGCR2_BITS {      // bit    description
    uint16_t  POWERDOWN:1;   // 0      Low-power mode PowerDown bit
    uint16_t  rsvd1:7;       // 7:1    reserved
    uint16_t  GENWU:1;       // 8      Generate Wakeup
    uint16_t  rsvd2:7;       // 15:9   reserved
    uint16_t  SC:1;          // 16     Send Checksum (LIN mode)
    uint16_t  CC:1;          // 17     Compare Checksum (LIN mode)
    uint16_t  rsvd3:14;      // 31:18  reserved
};

/* Allow access to the bit fields or entire register */
union SCIGCR2_REG {
   uint32_t               all;
   struct SCIGCR2_BITS  bit;
};

/* SCI Set Interrupt Register (SCISETINT) bit definitions */
struct SCISETINT_BITS {      // bit    description
    uint16_t  SETBRKDTINT:1;   // 0      Set Break-detect Interrupt (SCI compatible mode)
    uint16_t  SETWAKEUPINT:1;  // 1      Set Wake-up Interrupt
    uint16_t  rsvd1:2;         // 3:2    reserved
    uint16_t  SETTIMEOUTINT:1; // 4      Set Timeout Interrupt (LIN only)
    uint16_t  rsvd2:1;         // 5      reserved
    uint16_t  SETTOAWUSINT:1;  // 6      Set Timeout After Wakeup Signal Interrupt (LIN only)
    uint16_t  SETTOA3WUSINT:1; // 7      Set Timeout After 3 Wakeup Signals Interrupt (LIN only)
    uint16_t  SETTXINT:1;      // 8      Set Transmitter Interrupt
    uint16_t  SETRXINT:1;      // 9      Receiver Interrupt Enable
    uint16_t  rsvd3:3;         // 12:10  reserved
    uint16_t  SETIDINT:1;      // 13     Set Identifier Interrupt (LIN only)
    uint16_t  rsvd4:2;         // 15:14  reserved
	uint16_t  rsvd5:2;         // 17:16  reserved
    uint16_t  rsvd6:1;         // 18     reserved
    uint16_t  rsvd7:5;         // 23:19  reserved
    uint16_t  SETPEINT:1;      // 24     Set Parity Interrupt
    uint16_t  SETOEINT:1;      // 25     Set Overrun-Error Interrupt
    uint16_t  SETFEINT:1;      // 26     Set Framing-Error Interrupt
    uint16_t  SETNREINT:1;     // 27     Set No-Response-Error Interrupt (LIN only)
    uint16_t  SETISFEINT:1;    // 28     Set Inconsistent-Synch-Field-Error Interrupt (LIN only)
    uint16_t  SETCEINT:1;      // 29     Set Checksum-error Interrupt (LIN only)
    uint16_t  SETPBEINT:1;     // 30     Set Physical Bus Error Interrupt (LIN only)
    uint16_t  SETBEINT:1;      // 31     Set Bit Error Interrupt (LIN only)
};

/* Allow access to the bit fields or entire register */
union SCISETINT_REG {
   uint32_t                 all;
   struct SCISETINT_BITS  bit;
};

/* SCI Clear Interrupt (SCICLEARINT) Register bit definitions */
struct SCICLEARINT_BITS {    // bit    description
    uint16_t  CLRBRKDTINT:1;   // 0      Clear Break-detect Interrupt (SCI compatible mode)
    uint16_t  CLRWAKEUPINT:1;  // 1      Clear Wake-up Interrupt
    uint16_t  rsvd1:2;         // 3:2    reserved
    uint16_t  CLRTIMEOUTINT:1; // 4      Clear Timeout Interrupt (LIN only)
    uint16_t  rsvd2:1;         // 5      reserved
    uint16_t  CLRTOAWUSINT:1;  // 6      Clear Timeout After Wakeup Signal Interrupt (LIN only)
    uint16_t  CLRTOA3WUSINT:1; // 7      Clear Timeout After 3 Wakeup Signals Interrupt (LIN only)
    uint16_t  CLRTXINT:1;      // 8      Clear Transmitter Interrupt
    uint16_t  CLRRXINT:1;      // 9      Clear Receiver Interrupt
    uint16_t  rsvd3:3;         // 12:10  reserved
    uint16_t  CLRIDINT:1;      // 13     Clear Identifier Interrupt (LIN only)
    uint16_t  rsvd4:2;         // 15:14  reserved
	uint16_t  rsvd5:2;         // 17:16  reserved
    uint16_t  rsvd6:1;         // 18     reserved
    uint16_t  rsvd7:5;         // 23:19  reserved
    uint16_t  CLRPEINT:1;      // 24     Clear Parity Interrupt
    uint16_t  CLROEINT:1;      // 25     Clear Overrun-Error Interrupt
    uint16_t  CLRFEINT:1;      // 26     Clear Framing-Error Interrupt
    uint16_t  CLRNREINT:1;     // 27     Clear No-Response-Error Interrupt (LIN only)
    uint16_t  CLRISFEINT:1;    // 28     Clear Inconsistent-Synch-Field-Error Interrupt (LIN only)
    uint16_t  CLRCEINT:1;      // 29     Clear Checksum-error Interrupt (LIN only)
    uint16_t  CLRPBEINT:1;     // 30     Clear Physical Bus Error Interrupt (LIN only)
    uint16_t  CLRBEINT:1;      // 31     Clear Bit Error Interrupt (LIN only)
};

/* Allow access to the bit fields or entire register */
union SCICLEARINT_REG {
   uint32_t                   all;
   struct SCICLEARINT_BITS  bit;
};

/* SCI Set Interrupt Level Register (SCISETINTLVL) bit definitions */
struct SCISETINTLVL_BITS {      // bit    description
    uint16_t  SETBRKDTINTLVL:1;   // 0      Set Break-detect Interrupt Level (SCI compatible mode)
    uint16_t  SETWAKEUPINTLVL:1;  // 1      Set Wake-up Interrupt Level
    uint16_t  rsvd1:2;            // 3:2    reserved
    uint16_t  SETTIMEOUTINTLVL:1; // 4      Set Timeout Interrupt Level (LIN only)
    uint16_t  rsvd2:1;            // 5      reserved
    uint16_t  SETTOAWUSINTLVL:1;  // 6      Set Timeout After Wakeup Signal Interrupt Level (LIN only)
    uint16_t  SETTOA3WUSINTLVL:1; // 7      Set Timeout After 3 Wakeup Signals Interrupt Level (LIN only)
    uint16_t  SETTXINTLVL:1;      // 8      Set Transmitter Interrupt Level
    uint16_t  SETRXINTOVO:1;      // 9      Receiver Interrupt Enable Level
    uint16_t  rsvd3:3;            // 12:10  reserved
    uint16_t  SETIDINTLVL:1;      // 13     Set Identifier Interrupt Level (LIN only)
    uint16_t  rsvd4:2;            // 15:14  reserved
	uint16_t  rsvd5:2;            // 17:16  reserved
    uint16_t  rsvd6:1;            // 18     reserved
    uint16_t  rsvd7:5;            // 23:19  reserved
    uint16_t  SETPEINTLVL:1;      // 24     Set Parity Interrupt Level
    uint16_t  SETOEINTLVL:1;      // 25     Set Overrun-Error Interrupt Level
    uint16_t  SETFEINTLVL:1;      // 26     Set Framing-Error Interrupt Level
    uint16_t  SETNREINTLVL:1;     // 27     Set No-Response-Error Interrupt Level (LIN only)
    uint16_t  SETISFEINTLVL:1;    // 28     Set Inconsistent-Synch-Field-Error Interrupt Level (LIN only)
    uint16_t  SETCEINTLVL:1;      // 29     Set Checksum-error Interrupt Level (LIN only)
    uint16_t  SETPBEINTLVL:1;     // 30     Set Physical Bus Error Interrupt Level (LIN only)
    uint16_t  SETBEINTLVL:1;      // 31     Set Bit Error Interrupt Level(LIN only)
};

/* Allow access to the bit fields or entire register */
union SCISETINTLVL_REG {
   uint32_t                    all;
   struct SCISETINTLVL_BITS  bit;
};

/* SCI Clear Interrupt Level (SCICLEARINTLVL) Register bit definitions */
struct SCICLEARINTLVL_BITS {    // bit    description
    uint16_t  CLRBRKDTINTLVL:1;   // 0      Clear Break-detect Interrupt Level (SCI compatible mode)
    uint16_t  CLRWAKEUPINTLVL:1;  // 1      Clear Wake-up Interrupt Level
    uint16_t  rsvd1:2;            // 3:2    reserved
    uint16_t  CLRTIMEOUTINTLVL:1; // 4      Clear Timeout Interrupt Level (LIN only)
    uint16_t  rsvd2:1;            // 5      reserved
    uint16_t  CLRTOAWUSINTLVL:1;  // 6      Clear Timeout After Wakeup Signal Interrupt Level (LIN only)
    uint16_t  CLRTOA3WUSINTLVL:1; // 7      Clear Timeout After 3 Wakeup Signals Interrupt Level (LIN only)
    uint16_t  CLRTXINTLVL:1;      // 8      Clear Transmitter Interrupt Level
    uint16_t  CLRRXINTLVL:1;      // 9      Clear Receiver Interrupt Level
    uint16_t  rsvd3:3;            // 12:10  reserved
    uint16_t  CLRIDINTLVL:1;      // 13     Clear Identifier Interrupt Level (LIN only)
    uint16_t  rsvd4:2;            // 15:14  reserved
	uint16_t  rsvd5:2;            // 17:16  reserved
    uint16_t  rsvd6:1;            // 18     reserved
    uint16_t  rsvd7:5;            // 23:19  reserved
    uint16_t  CLRPEINTLVL:1;      // 24     Clear Parity Interrupt Level
    uint16_t  CLROEINTLVL:1;      // 25     Clear Overrun-Error Interrupt Level
    uint16_t  CLRFEINTLVL:1;      // 26     Clear Framing-Error Interrupt Level
    uint16_t  CLRNREINTLVL:1;     // 27     Clear No-Response-Error Interrupt Level (LIN only)
    uint16_t  CLRISFEINTLVL:1;    // 28     Clear Inconsistent-Synch-Field-Error Interrupt Level (LIN only)
    uint16_t  CLRCEINTLVL:1;      // 29     Clear Checksum-error Interrupt Level (LIN only)
    uint16_t  CLRPBEINTLVL:1;     // 30     Clear Physical Bus Error Interrupt Level (LIN only)
    uint16_t  CLRBEINTLVL:1;      // 31     Clear Bit Error Interrupt Level (LIN only)
};

/* Allow access to the bit fields or entire register */
union SCICLEARINTLVL_REG {
   uint32_t                      all;
   struct SCICLEARINTLVL_BITS  bit;
};

/* SCI Flags Register (SCIFLR) bit definitions */
struct SCIFLR_BITS {            // bit    description
    uint16_t  BRKDT:1;            // 0      Break-detect Flag (SCI compatible mode)
    uint16_t  WAKEUP:1;           // 1      Wake-up Flag
    uint16_t  IDLE:1;             // 2      SCI receiver in idle state (SCI compatible mode)
    uint16_t  BUSY:1;             // 3      Busy Flag
    uint16_t  TIMEOUT:1;          // 4      LIN Bus IDLE timeout Flag (LIN only)
    uint16_t  rsvd2:1;            // 5      reserved
    uint16_t  TOAWUS:1;           // 6      Timeout After Wakeup Signal Flag (LIN only)
    uint16_t  TOA3WUS:1;          // 7      Timeout After 3 Wakeup Signals Flag (LIN only)
    uint16_t  TXRDY:1;            // 8      Transmitter Buffer Ready Flag
    uint16_t  RXRDY:1;            // 9      Receiver Buffer Ready Flag
    uint16_t  TXWAKE:1;	        // 10     SCI Transmitter Wakeup Method Select
    uint16_t  TXEMPTY:1;          // 11     Transmitter Empty Clag
    uint16_t  RXWAKE:1;           // 12     Receiver Wakeup Detect Flag
    uint16_t  IDTXFLAG:1;         // 13     Identifier On Transmit Flag (LIN only)
    uint16_t  IDRXFLAG:1;         // 14     Identifier on Receive Flag
	uint16_t	rsvd3:1;			// 15
    uint16_t  rsvd4:8;            // 23:16  reserved
    uint16_t  PE:1;               // 24     Parity Error Flag
    uint16_t  OE:1;               // 25     Overrun Error Flag
    uint16_t  FE:1;               // 26     Framing Error Flag
    uint16_t  NRE:1;              // 27     No-Response Error Flag (LIN only)
    uint16_t  ISFE:1;             // 28     Inconsistent Synch Field Error Flag (LIN only)
    uint16_t  CE:1;               // 29     Checksum Error Flag (LIN only)
    uint16_t  PBE:1;              // 30     Physical Bus Error Flag (LIN only)
    uint16_t  BE:1;               // 31     Bit Error Flag (LIN only)
};

/* Allow access to the bit fields or entire register */
union SCIFLR_REG {
   uint32_t             all;
   struct SCIFLR_BITS  bit;
};

/* SCI Interrupt Vector Offset 0 (SCIINTVECT0) bit definitions */
struct SCIINTVECT0_BITS {      // bit    description
    uint16_t  INTVECT0:5;        // 4:0    Interrupt vector offset for INT0
    uint16_t  rsvd1:11;          // 15:5   reserved
	uint16_t  rsvd2:16;          // 31:16  reserved
};

/* Allow access to the bit fields or entire register */
union SCIINTVECT0_REG {
   uint32_t               all;
   struct SCIINTVECT0_BITS  bit;
};

/* SCI Interrupt Vector Offset 1 (SCIINTVECT1) bit definitions */
struct SCIINTVECT1_BITS {      // bit    description
    uint16_t  INTVECT1:5;        // 4:0    Interrupt vector offset for INT1
    uint16_t  rsvd1:11;          // 15:5   reserved
	uint16_t  rsvd2:16;          // 31:16  reserved
};

/* Allow access to the bit fields or entire register */
union SCIINTVECT1_REG {
   uint32_t               all;
   struct SCIINTVECT1_BITS  bit;
};

/* SCI Format Control Register (SCIFORMAT) bit definitions */
struct SCIFORMAT_BITS {        // bit    description
    uint16_t  CHAR:3;            // 2:0    Character Length Control Bits
    uint16_t  rsvd1:13;          // 15:3   reserved
    uint16_t  LENGTH:3;          // 18:16  Frame Length Control Bits
    uint16_t  rsvd2:13;          // 31:19  reserved
};

/* Allow access to the bit fields or entire register */
union SCIFORMAT_REG {
   uint32_t                 all;
   struct SCIFORMAT_BITS  bit;
};

/* Baud Rate Selection Register (BRSR) bit definitions */
struct BRSR_BITS {             // bit    description
	uint16_t  SCI_LIN_PSL :16;   // 15:0   SCI/LIN Prescaler Low
	uint16_t  SCI_LIN_PSH :8;    // 23:16  SCI/LIN Prescaler High
    uint16_t  M:4;               // 27:24  SCI/LIN Fractional Divider Selection
    uint16_t  rsvd1:4;           // 31:28     reserved
};

/* Allow access to the bit fields or entire register */
union BRSR_REG {
   uint32_t               all;
   struct BRSR_BITS     bit;
};

/* SCI Pin I/O Control Register 2 (SCIPIO2) bit definitions */
struct SCIPIO2_BITS {          // bit    description
    uint16_t  rsvd1:1;           // 0      reserved
    uint16_t  RXIN:1;            // 1      SCIRX pin value
    uint16_t  TXIN:1;            // 2      SCITX pin value
    uint16_t  rsvd2:13;          // 15:3   reserved
	uint16_t  rsvd3:16;          // 31:16  reserved
};

/* Allow access to the bit fields or entire register */
union SCIPIO2_REG {
   uint32_t               all;
   struct SCIPIO2_BITS  bit;
};


/* LIN Compare Register (LINCOMP) bit definitions */
struct LINCOMP_BITS {          // bit    description
    uint16_t  SBREAK:3;          // 2:0    Synch Break Extend
    uint16_t  rsvd1:5;           // 7:3    reserved
    uint16_t  SDEL:2;            // 9:8    Sync Delimiter Compare
	uint16_t  rsvd2:6;           // 15:10  reserved
	uint16_t  rsvd3:16;          // 31:16  reserved
};

/* Allow access to the bit fields or entire register */
union LINCOMP_REG {
   uint32_t               all;
   struct LINCOMP_BITS  bit;
};


/* LIN Receive Data 0 Register (LINRD0) bit definitions */
struct LINRD0_BITS {           // bit    description
    uint16_t  RD3:8;             // 7:0    Receive Buffer 3
    uint16_t  RD2:8;             // 15:8   Receive Buffer 2
    uint16_t  RD1:8;             // 23:16  Receive Buffer 1
    uint16_t  RD0:8;             // 31:24  Receive Buffer 0
};

/* Allow access to the bit fields or entire register */
union LINRD0_REG {
   uint32_t              all;
   struct LINRD0_BITS  bit;
};

/* LIN Receive Data 1 Register (LINRD1) bit definitions */
struct LINRD1_BITS {           // bit    description
    uint16_t  RD7:8;             // 7:0    Receive Buffer 7
    uint16_t  RD6:8;             // 15:8   Receive Buffer 6
    uint16_t  RD5:8;             // 23:16  Receive Buffer 5
    uint16_t  RD4:8;             // 31:24  Receive Buffer 4
};

/* Allow access to the bit fields or entire register */
union LINRD1_REG {
   uint32_t              all;
   struct LINRD1_BITS  bit;
};

/* LIN Acceptance Mask Register (LINMASK) bit definitions */
struct LINMASK_BITS {          // bit    description
    uint16_t  TXIDMASK:8;        // 7:0    TX ID Mask bits (LIN only)
    uint16_t  rsvd1:8;           // 15:8   reserved
    uint16_t  RXIDMASK:8;        // 23:16  RX ID Mask bits (LIN only)
    uint16_t  rsvd2:8;           // 31:24  reserved
};

/* Allow access to the bit fields or entire register */
union LINMASK_REG {
   uint32_t               all;
   struct LINMASK_BITS  bit;
};

/* LIN ID Register (LINID) bit definitions */
struct LINID_BITS {            // bit    description
    uint16_t  IDBYTE:8;          // 7:0    LIN message ID (LIN only)
    uint16_t  IDSLAVETASKBYTE:8; // 15:8   Received ID comparison ID (LIN only)
    uint16_t  RECEIVEDID:8;      // 23:16  Current Message ID (LIN only)
    uint16_t  rsvd1:8;           // 31:24  reserved
};

/* Allow access to the bit fields or entire register */
union LINID_REG {
   uint32_t             all;
   struct LINID_BITS  bit;
};

/* LIN Transmit Data 0 Register (LINTD0) bit definitions */
struct LINTD0_BITS {           // bit    description
    uint16_t  TD3:8;             // 7:0    Transmit Buffer 3
    uint16_t  TD2:8;             // 15:8   Transmit Buffer 2
    uint16_t  TD1:8;             // 23:16  Transmit Buffer 1
    uint16_t  TD0:8;             // 31:24  Transmit Buffer 0
};

/* Allow access to the bit fields or entire register */
union LINTD0_REG {
   uint32_t              all;
   struct LINTD0_BITS  bit;
};

/* LIN Transmit Data 1 Register (LINTD1) bit definitions */
struct LINTD1_BITS {           // bit    description
    uint16_t  TD7:8;             // 7:0    Transmit Buffer 7
    uint16_t  TD6:8;             // 15:8   Transmit Buffer 6
    uint16_t  TD5:8;             // 23:16  Transmit Buffer 5
    uint16_t  TD4:8;             // 31:24  Transmit Buffer 4
};

/* Allow access to the bit fields or entire register */
union LINTD1_REG {
   uint32_t               all;
   struct LINTD1_BITS   bit;
};

/* IODFT for LIN (IODFTCTRL) bit definitions */
struct IODFTCTRL_BITS {        // bit    description
    uint16_t  RXPENA:1;          // 0      Analog Loopback Via Receive Pin Enable
    uint16_t  LPBENA:1;          // 1      Module Loopback Enable
    uint16_t  rsvd1:6;           // 7:2    reserved
    uint16_t  IODFTENA:4;        // 11:8   IO DFT Enable Key
    uint16_t  rsvd2:4;           // 15:12  Reserved
    uint16_t  TXSHIFT:3;         // 18:16  Transmit Delay Shift
    uint16_t  PINSAMPLEMASK:2;   // 20:19  TX Pin Sample Mask
    uint16_t  rsvd3:3;           // 23:21  Reserved
    uint16_t  BRKDTERRENA:1;     // 24     Break Detect Error Enable (SCI compatibility mode)
    uint16_t  PERRENA:1;         // 25     Parity Error Enable (SCI compatibility mode)
    uint16_t  FERRENA:1;         // 26     Frame Error Enable (SCI compatibility mode)
    uint16_t  rsvd:1;            // 27     reserved
    uint16_t  ISFERRENA:1;       // 28     Inconsistent Synch Field Error Enable (LIN mode)
    uint16_t  CERRENA:1;         // 29     Checksum Error Enable(LIN mode)
    uint16_t  PBERRENA:1;        // 30     Physical Bus Error Enable (LIN mode)
    uint16_t  BERRENA:1;         // 31     Bit Error Enable (LIN mode)
};

/* Allow access to the bit fields or entire register */
union IODFTCTRL_REG {
   uint32_t                 all;
   struct IODFTCTRL_BITS  bit;
};


/**************************************/
/* LIN register file */
/**************************************/

struct LIN_REGS {
    union   SCIGCR0_REG         SCIGCR0;            // Global Control Register 0
	union	SCIGCR1_REG		    SCIGCR1;		    // Global Control Register 1
	union	SCIGCR2_REG		    SCIGCR2;		    // Global Control Register 2
	union	SCISETINT_REG		SCISETINT;		    // Interrupt Enable Register
	union	SCICLEARINT_REG		SCICLEARINT;		// Interrupt Disable Register
	union	SCISETINTLVL_REG	SCISETINTLVL;		// Set Interrupt Level Register
	union	SCICLEARINTLVL_REG	SCICLEARINTLVL;		// Clear Interrupt Level Register
	union	SCIFLR_REG		    SCIFLR;		        // Flag Register
	union	SCIINTVECT0_REG		SCIINTVECT0;		// Interrupt Vector Offset Register 0
	union	SCIINTVECT1_REG	 	SCIINTVECT1;	 	// Interrupt Vector Offset Register 1
	union	SCIFORMAT_REG		SCIFORMAT;		    // Length Control Register
	union	BRSR_REG			BRSR;				// Baud Rate Selection Register
	uint32_t          			SCIED;				// Emulation buffer Register
	uint32_t          			SCIRD;				// Receiver data buffer Register
	uint32_t          			SCITD;				// Transmit data buffer Register
	uint32_t                      rsvd1[2];			// reserved
	union	SCIPIO2_REG			SCIPIO2;			// Pin control Register 2
	uint32_t                      rsvd2[6];           // reserved
	union	LINCOMP_REG			LINCOMP;		    // Compare register
	union	LINRD0_REG			LINRD0;				// Receive data register 0
	union	LINRD1_REG			LINRD1;				// Receive data register 1
	union	LINMASK_REG			LINMASK;		    // Acceptance mask register
	union	LINID_REG			LINID;				// LIN ID Register
	union	LINTD0_REG			LINTD0;				// Transmit Data Register 0
	union	LINTD1_REG			LINTD1;				// Transmit Data Register 1
	uint32_t			            MBRSR;				// Baud Rate Selection Register
	uint32_t						rsvd3[4];		    // reserved
	union   IODFTCTRL_REG		IODFTCTRL;			// IODFT for LIN
};

//---------------------------------------------------------------------------
// LIN External References & Function Declarations:
//
extern volatile struct LIN_REGS LinaRegs;

#ifdef __cplusplus
}
#endif /* extern "C" */

#endif  // end of _LIN_H_ definition

//@}
