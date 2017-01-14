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
#ifndef _AFE_H_
#define _AFE_H_

//! \file   drivers/afe/src/32b/f28x/f2805x/afe.h
//! \brief  Contains public interface to various functions related
//!         to the analog front end (AFE) object
//!
//! (C) Copyright 2015, Texas Instruments, Inc.


// **************************************************************************
// the includes

// drivers
//#include "sw/drivers/cpu/src/32b/f28x/f2805x/cpu.h"

// **************************************************************************
// modules
#include "sw/modules/math/src/32b/math.h"
#include "sw/modules/types/src/types.h"
#include "sw/drivers/cpu/src/32b/f28x/f2805x/cpu.h"


//!
//! \defgroup AFE

//!
//! \ingroup AFE
//@{


#ifdef __cplusplus
extern "C" {
#endif


// **************************************************************************
// the defines


//! \brief Defines the base address of the analog-to-digital converter
//!       (ADC) registers
//!
#define AFE_BASE_ADDR              (0x006400)


// **************************************************************************
// the typedefs

//! \brief Enumeration to define the afe amplifier enable number
//!
typedef enum
{
  AFE_AMPB7EN=(1 << 6), //!< Denotes that the pga amplifier for adc B7 is enabled
  AFE_AMPB6EN=(1 << 5), //!< Denotes that the pga amplifier for adc B6 is enabled
  AFE_AMPB4EN=(1 << 4), //!< Denotes that the pga amplifier for adc B4 is enabled
  AFE_AMPA6EN=(1 << 3), //!< Denotes that the pga amplifier for adc A6 is enabled
  AFE_AMPB1EN=(1 << 2), //!< Denotes that the pga amplifier for adc B1 is enabled
  AFE_AMPA3EN=(1 << 1), //!< Denotes that the pga amplifier for adc A3 is enabled
  AFE_AMPA1EN=(1 << 0)  //!< Denotes that the pga amplifier for adc A1 is enabled
} AFE_PGAEN_e;


//! \brief Enumeration to define the afe amplifier enable number
//!
typedef enum
{
  AFE_DAC1EN=(1 << 0),    //!< Denotes that DAC 1 is enabled/disabled
  AFE_DAC2EN=(1 << 1),    //!< Denotes that DAC 2 is enabled/disabled
  AFE_DAC3EN=(1 << 2),    //!< Denotes that DAC 3 is enabled/disabled
  AFE_DAC4EN=(1 << 3),    //!< Denotes that DAC 4 is enabled/disabled
  AFE_DAC5EN=(1 << 4)     //!< Denotes that DAC 5 is enabled/disabled
} AFE_DACEN_e;


//! \brief Enumeration to define the afe DAC number
//!
typedef enum
{
  AFE_DAC1=0,   //!< Selects DAC1
  AFE_DAC2,     //!< Selects DAC2
  AFE_DAC3,     //!< Selects DAC3
  AFE_DAC4,     //!< Selects DAC4
  AFE_DAC5      //!< Selects DAC5
} AFE_DAC_NUMBER_e;


//! \brief Enumeration to define the afe Comparator enable number
//!
typedef enum
{
  AFE_COMPB7EN=(1 << 0),  //!< Denotes that Comparator B7 is enabled/disabled
  AFE_COMPA1EN=(1 << 2),  //!< Denotes that Comparator A1 is enabled/disabled
  AFE_COMPA3EN=(1 << 4),  //!< Denotes that Comparator A3 is enabled/disabled
  AFE_COMPB1EN=(1 << 6),  //!< Denotes that Comparator B1 is enabled/disabled
  AFE_COMPA6EN=(1 << 8),  //!< Denotes that Comparator A6 is enabled/disabled
  AFE_COMPB4EN=(1 << 10), //!< Denotes that Comparator B4 is enabled/disabled
  AFE_COMPB6EN=(1 << 12)  //!< Denotes that Comparator B6 is enabled/disabled
} AFE_COMPEN_e;


//! \brief Enumeration to define the afe Comparator hysteresis enable number
//!
typedef enum
{
  AFE_COMPB7_HYST_EN=(1 << 6),  //!< Denotes that Comparator Hysteresis B7 is enabled/disabled
  AFE_COMPB6_HYST_EN=(1 << 5),  //!< Denotes that Comparator Hysteresis B6 is enabled/disabled
  AFE_COMPB4_HYST_EN=(1 << 4),  //!< Denotes that Comparator Hysteresis B4 is enabled/disabled
  AFE_COMPB1_HYST_EN=(1 << 3),  //!< Denotes that Comparator Hysteresis B1 is enabled/disabled
  AFE_COMPA6_HYST_EN=(1 << 2),  //!< Denotes that Comparator Hysteresis A6 is enabled/disabled
  AFE_COMPA3_HYST_EN=(1 << 1),  //!< Denotes that Comparator Hysteresis A3 is enabled/disabled
  AFE_COMPA1_HYST_EN=(1 << 0)   //!< Denotes that Comparator Hysteresis A1 is enabled/disabled
} AFE_COMP_HYST_EN_e;


//! \brief Enumeration to define the afe Comparator CTRIP Filter Input and Function Control
//!        Registers (CTRIPxxICTL) Fields
//!
typedef enum
{
  AFE_CTRIPOUTBYP=(1 << 12),
  AFE_CTRIPBYP=(1 << 11),
  AFE_COMPLINPEN=(1 << 3),
  AFE_COMPHINPEN=(1 << 2),
  AFE_COMPLPOL=(1 << 1),
  AFE_COMPHPOL=(1 << 0)
} AFE_CTRIPxxICTL_FIELDS_e;


typedef enum
{
  AFE_COMP_A1=(0),
  AFE_COMP_A3,
  AFE_COMP_B1
} AFE_CTRIP_SEL_e;


//! \brief Enumeration to define the afe Comparator CTRIP Filter Input and Function Control
//!        Registers (CTRIPxxICTL) Fields
//!
typedef enum
{
  AFE_CTRIPOUTLATEN=(1 << 15),
  AFE_CTRIPOUTPOL=(1 << 14),
  AFE_CTRIPB1OUTEN=(1 << 10),
  AFE_CTRIPA3OUTEN=(1 << 9),
  AFE_CTRIPA1OUTEN=(1 << 8),
  AFE_CTRIPB1EN=(1 << 2),
  AFE_CTRIPA3EN=(1 << 1),
  AFE_CTRIPA1EN=(1 << 0)
} AFE_CTRIPMxOCTL_FIELDS_e;


//! \brief Enumeration to define the afe Comparator CTRIP Filter Input and Function Control
//!        Registers (CTRIPxxICTL) Fields
//!
typedef enum
{
  AFE_CTRIPOUTM1FLG=(1 << 15),
  AFE_CTRIPB1FLG=(1 << 10),
  AFE_CTRIPA3FLG=(1 << 9),
  AFE_CTRIPA1FLG=(1 << 8),
  AFE_CTRIPOUTM1STS=(1 << 7),
  AFE_CTRIPB1STS=(1 << 2),
  AFE_CTRIPA3STS=(1 << 1),
  AFE_CTRIPA1STS=(1 << 0)
} AFE_CTRIPMxSTATUS_FIELDS_e;


//! \brief Enumeration to define the afe Comparator CTRIP Filter Input and Function Control
//!        Registers (CTRIPxxICTL) Fields
//!
typedef enum
{
  AFE_CTRIPOUTM1FLGCLR=(1 << 15),
  AFE_CTRIPB1FLGCLR=(1 << 10),
  AFE_CTRIPA3FLGCLR=(1 << 9),
  AFE_CTRIPA1FLGCLR=(1 << 8)
} AFE_CTRIPMxFLAG_FIELDS_e;


//! \brief Defines the analog-to-digital converter (ADC) object
//!
typedef struct _AFE_Obj_
{
    uint16_t    DACxCTL[0x05];          //!< DAC 1-5 control registers
    uint16_t    VREFOUTCTL;             //!< VREFOUT (DAC6) control 
    uint16_t    rsvd1[0x0A];            //!< Reserved
    uint16_t    DACEN;                  //!< DAC Enables 
    uint16_t    VREFOUTEN;              //!< VREFOUT Enable 
    uint16_t    PGAEN;                  //!< Programmable Gain Amplifier Enable 
    uint16_t    COMPEN;                 //!< Comparator Enable 
    uint16_t    AMPM1_GAIN;             //!< Motor Unit 1 PGA Gain controls 
    uint16_t    AMPM2_GAIN;             //!< Motor Unit 2 PGA Gain controls 
    uint16_t    AMPPFC_GAIN;            //!< PFC PGA Gain controls 
    uint16_t    rsvd2[0x0A];            //!< Reserved 
    uint16_t    ADCINSWITCH;            //!< ADC input-select switch control 
    uint16_t    rsvd3[0x07];            //!< Reserved 
    uint16_t    COMPHYSTCTL;            //!< Comparator High AND Low hysteresis enable/disable 
    uint16_t    rsvd4[0x06];            //!< Reserved 
    uint16_t    CTRIPA1ICTL;            //!< CTRIPA1 Filter Input & function Control 
    uint16_t    CTRIPA1FILCTL;          //!< CTRIPA1 Filter parameters 
    uint16_t    CTRIPA1FILCLKCTL;       //!< CTRIPA1 Filter Sample Clock Control 
    uint16_t    rsvd5;                  //!< Reserved 
    uint16_t    CTRIPA3ICTL;            //!< CTRIPA3 Filter Input & function Control 
    uint16_t    CTRIPA3FILCTL;          //!< CTRIPA3 Filter parameters 
    uint16_t    CTRIPA3FILCLKCTL;       //!< CTRIPA3 Filter Sample Clock Control 
    uint16_t    rsvd6;                  //!< Reserved 
    uint16_t    CTRIPB1ICTL;            //!< CTRIPB1 Filter Input & function Control 
    uint16_t    CTRIPB1FILCTL;          //!< CTRIPB1 Filter parameters 
    uint16_t    CTRIPB1FILCLKCTL;       //!< CTRIPB1 Filter Sample Clock Control 
    uint16_t    rsvd7[0x02];            //!< Reserved 
    uint16_t    CTRIPM1OCTL;            //!< CTRIPM1 CTRIP Filter Output Control 
    uint16_t    CTRIPM1STS;             //!< CTRIPM1 CTRIPx outputs status 
    uint16_t    CTRIPM1FLGCLR;          //!< CTRIPM1 CTRIPx flag clear 
    uint16_t    rsvd8[0x10];            //!< Reserved 
    uint16_t    CTRIPA6ICTL;            //!< CTRIPA6 Filter Input & function Control 
    uint16_t    CTRIPA6FILCTL;          //!< CTRIPA6 Filter parameters 
    uint16_t    CTRIPA6FILCLKCTL;       //!< CTRIPA6 Filter Sample Clock Control 
    uint16_t    rsvd9;                  //!< Reserved 
    uint16_t    CTRIPB4ICTL;            //!< CTRIPB4 Filter Input & function Control 
    uint16_t    CTRIPB4FILCTL;          //!< CTRIPB4 Filter parameters 
    uint16_t    CTRIPB4FILCLKCTL;       //!< CTRIPB4 Filter Sample Clock Control 
    uint16_t    rsvd10;                 //!< Reserved 
    uint16_t    CTRIPB6ICTL;            //!< CTRIPB6 Filter Input & function Control 
    uint16_t    CTRIPB6FILCTL;          //!< CTRIPB6 Filter parameters 
    uint16_t    CTRIPB6FILCLKCTL;       //!< CTRIPB6 Filter Sample Clock Control 
    uint16_t    rsvd11[0x02];           //!< Reserved 
    uint16_t    CTRIPM2OCTL;            //!< CTRIPM2 CTRIP Filter Output Control 
    uint16_t    CTRIPM2STS;             //!< CTRIPM2 CTRIPx outputs status 
    uint16_t    CTRIPM2FLGCLR;          //!< CTRIPM2 CTRIPx flag clear 
    uint16_t    rsvd12[0x10];           //!< Reserved 
    uint16_t    CTRIPB7ICTL;            //!< CTRIPB7 Filter Input & function Control 
    uint16_t    CTRIPB7FILCTL;          //!< CTRIPB7 Filter parameters 
    uint16_t    CTRIPB7FILCLKCTL;       //!< CTRIPB7 Filter Sample Clock Control 
    uint16_t    rsvd13[0x0A];           //!< Reserved 
    uint16_t    CTRIPPFCOCTL;           //!< CTRIPPFC CTRIPx outputs status 
    uint16_t    CTRIPPFCSTS;            //!< CTRIPPFC CTRIPx flag clear 
    uint16_t    CTRIPPFCFLGCLR;         //!< CTRIPPFC COMP Test Control 
    uint16_t    rsvd14[0x70];           //!< Reserved 
    uint16_t    LOCKCTRIP;              //!< Lock Register for CTRIP Filters 
    uint16_t    rsvd15;                 //!< Reserved 
    uint16_t    LOCKDAC;                //!< Lock Register for DACs 
    uint16_t    rsvd16;                 //!< Reserved 
    uint16_t    LOCKAMPCOMP;            //!< Lock Register for Amplifiers & Comparators 
    uint16_t    rsvd17;                 //!< Reserved 
    uint16_t    LOCKSWITCH;             //!< Lock Register for Switches
} AFE_Obj;


//! \brief Defines the analog-to-digital converter (ADC) handle
//!
typedef struct _AFE_Obj_ *AFE_Handle;


// **************************************************************************
// the globals


// **************************************************************************
// the function prototypes


//! \brief     Initializes the analog front end (AFE)
//! \param[in] *pMemory The memory address of the object
//! \param[in] size_t  The size of the object in bytes
AFE_Handle AFE_init(void *pMemory,const size_t numBytes);


//! \brief     Enables programmable gain amps for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_PGAEN_e  An enumeration selecting the PGA input the enable
inline void AFE_enablePGA(AFE_Handle afeHandle, AFE_PGAEN_e PgaEnable)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->PGAEN |= PgaEnable;

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_EnablePGA() function


//! \brief     Disables programmable gain amps for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_PGAEN_e  An enumeration selecting the PGA input the disable
inline void AFE_disablePGA(AFE_Handle afeHandle, AFE_PGAEN_e PgaEnable)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->PGAEN &= ~PgaEnable;

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_DisablePGA() function


//! \brief     Enables the VrefOut DAC for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
inline void AFE_enableVrefOut(AFE_Handle afeHandle)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->VREFOUTEN |= 0x0001;

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_EnablePGA() function


//! \brief     Disables the VrefOut DAC for for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
inline void AFE_disableVrefOut(AFE_Handle afeHandle)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->VREFOUTEN &= ~0x0001;

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_DisablePGA() function


//! \brief     Controls the VrefOut DAC for the analog front end (AFE).  Sets the
//! \brief     DAC gain by the fraction VREFHI * [1,64]/64;
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] uint16_t A value from 0 to 63.
inline void AFE_setVrefOut(AFE_Handle afeHandle, uint16_t VrefOutVal)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the last 6 bits of the Register
  afe->VREFOUTCTL = (VrefOutVal & 0x003F);

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_setVrefOut() function


//! \brief     Controls the comparator DAC for the analog front end (AFE).  Sets the
//! \brief     DAC gain by the fraction VDDA * [1,64]/64;
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_DAC_NUMBER_e for selecting which DAC to control
//! \param[in] uint16_t A value from 0 to 63.
inline void AFE_setDacCtl(AFE_Handle afeHandle, AFE_DAC_NUMBER_e DacNumber, uint16_t DacOutVal)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the last 6 bits of the Register
  afe->DACxCTL[DacNumber] = (DacOutVal & 0x003F);

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_setDacCtl() function


//! \brief     Enables DAC outputs for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_DACEN_e  An enumeration selecting the DAC output the enable
inline void AFE_enableDAC(AFE_Handle afeHandle, AFE_DACEN_e DacEnable)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->DACEN |= DacEnable;

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_enableDAC() function


//! \brief     Enables Comparators for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_COMPEN_e  An enumeration selecting the Comparator to enable
inline void AFE_enableComp(AFE_Handle afeHandle, AFE_COMPEN_e CompEnable)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->COMPEN |= CompEnable;

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_enableComp() function


//! \brief     Enables Hysteresis for the Comparators for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_COMP_HYST_EN_e  An enumeration selecting the Comparator Hysteresis to enable
inline void AFE_enableCompHyst(AFE_Handle afeHandle, AFE_COMP_HYST_EN_e CompHystEnable)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->COMPHYSTCTL &= ~CompHystEnable;

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_enableCompHyst() function


//! \brief     Disables Comparators for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_COMPEN_e  An enumeration selecting the Comparator to enable
inline void AFE_disableComp(AFE_Handle afeHandle, AFE_COMPEN_e CompEnable)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->COMPEN &= ~CompEnable;

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_disableComp() function


//! \brief     Disables DAC outputs for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_DACEN_e  An enumeration selecting the DAC output the enable
inline void AFE_disableDAC(AFE_Handle afeHandle, AFE_DACEN_e DacEnable)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->DACEN &= ~DacEnable;

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_disableDAC() function


//! \brief     Disables Hysteresis for the Comparators for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_COMP_HYST_EN_e  An enumeration selecting the Comparator Hysteresis to disable
inline void AFE_disableCompHyst(AFE_Handle afeHandle, AFE_COMP_HYST_EN_e CompHystEnable)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->COMPHYSTCTL |= CompHystEnable;

  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_disableCompHyst() function


//! \brief     Sets the A1 Comparator Subsystem settings for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_CTRIPxxICTL_FIELDS_e  A single or or'd list of enumerations selecting the
//!                                      Comparator input settings
inline void AFE_setA1CompSubsystem(AFE_Handle afeHandle, AFE_CTRIPxxICTL_FIELDS_e CtripBitFields)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->CTRIPA1ICTL |= (uint16_t)CtripBitFields;


  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_setA1CompSubsystem() function


//! \brief     Sets the A3 Comparator Subsystem settings for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_CTRIPxxICTL_FIELDS_e  A single or or'd list of enumerations selecting the Comparator
//!                                      input settings
inline void AFE_setA3CompSubsystem(AFE_Handle afeHandle, AFE_CTRIPxxICTL_FIELDS_e CtripBitFields)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;


  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->CTRIPA3ICTL |= CtripBitFields;


  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_setA3CompSubsystem() function


//! \brief     Sets the B1 Comparator Subsystem settings for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_CTRIPxxICTL_FIELDS_e  A single or or'd list of enumerations selecting the Comparator
//!                                      input settings
inline void AFE_setB1CompSubsystem(AFE_Handle afeHandle, AFE_CTRIPxxICTL_FIELDS_e CtripBitFields)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;


  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->CTRIPB1ICTL |= CtripBitFields;


  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_setB1CompSubsystem() function


//! \brief     Sets the Comparator Trip Out settings for the M1 block for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_CTRIPMxOCTL_FIELDS_e  A single or or'd list of enumerations selecting the Comparator
//!                                      out settings
inline void AFE_setM1CtripOut(AFE_Handle afeHandle, AFE_CTRIPMxOCTL_FIELDS_e CtripOutBitFields)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;


  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->CTRIPM1OCTL |= CtripOutBitFields;


  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_setM1CtripOut() function


//! \brief     Returns the true/false status of the M1 Comparator Trip flags for the analog
//! \brief     front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_CTRIPMxSTATUS_FIELDS_e  A single enumeration selecting a single Comparator
//!                                        Status Flag to poll
//! \return    bool  Boolean result of whether the status flag is set or clear
inline bool AFE_getM1CtripStatus(AFE_Handle afeHandle, AFE_CTRIPMxSTATUS_FIELDS_e CtripStatusBitFields)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;
  bool status = false;

  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  status = (bool)(afe->CTRIPM1STS & (uint16_t)CtripStatusBitFields);


  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return (status);
} // end of AFE_getM1CtripStatus() function


//! \brief     Clears the Comparator Trip Flags for the analog front end (AFE)
//! \param[in] AFE_Handle A handle to the AFE object
//! \param[in] AFE_CTRIPMxFLAG_FIELDS_e  A single or or'd list of enumerations selecting the Comparator
//!                                      flags to reset
inline void AFE_clearM1CtripFlag(AFE_Handle afeHandle, AFE_CTRIPMxFLAG_FIELDS_e CtripFlagBitFields)
{
  AFE_Obj *afe = (AFE_Obj *)afeHandle;


  ENABLE_PROTECTED_REGISTER_WRITE_MODE;

  //set the selection bits
  afe->CTRIPM1STS |= CtripFlagBitFields;


  DISABLE_PROTECTED_REGISTER_WRITE_MODE;

  return;
} // end of AFE_clearM1CtripFlag() function


#ifdef __cplusplus
}
#endif // extern "C"

//@}  // ingroup


#endif // end of _AFE_H_ definition

