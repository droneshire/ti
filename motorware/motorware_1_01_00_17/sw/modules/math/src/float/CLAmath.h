/******************************************************************************
*******************************************************************************
* 
* FILE: CLAmath.h
* 
* DESCRIPTION: CLA math routines library 
* 
*******************************************************************************
*  $TI Release: CLA Math Library for CLA C Compiler V4.00.01.00 $
*  $Release Date: Apr 23, 2014 $
*******************************************************************************
*  This software is licensed for use with Texas Instruments C28x
*  family DSCs.  This license was provided to you prior to installing
*  the software.  You may review this license by consulting a copy of
*  the agreement in the doc directory of this library.
* ------------------------------------------------------------------------
*          Copyright (C) 2014 Texas Instruments, Incorporated.
*                          All Rights Reserved.
******************************************************************************/
#ifndef __CLAMATH_H__
#define __CLAMATH_H__

//###########################################################################
//
// If building with a C++ compiler, make all of the definitions in this header
// have a C binding.
//
//###########################################################################
#ifdef __cplusplus
extern "C"
{
#endif
//###########################################################################
//
// Macro Definitions
//
//###########################################################################


//###########################################################################
//
// Structures, variables and typedefs.
//
//###########################################################################
#include "sw/modules/types/src/types.h"

//CLASinCosTable Variables
extern float_t CLAsincosTable[161];
extern float_t CLAsinTable[128];
extern float_t *CLAsincosTable_Sin0;
extern float_t CLAcosTable[129];
extern float_t *CLAsincosTable_Cos0;
extern float_t *CLAsinTableEnd;
extern float_t *CLAcosTableEnd;
extern float_t *CLAsincosTableEnd;
extern float_t CLAsincosTable_TABLE_SIZE;
extern float_t CLAsincosTable_TABLE_SIZEDivTwoPi;
extern float_t CLAsincosTable_TwoPiDivTABLE_SIZE;
extern float_t CLAsincosTable_TABLE_MASK;
extern float_t CLAsincosTable_Coef0;
extern float_t CLAsincosTable_Coef1;
extern float_t CLAsincosTable_Coef1_pos;
extern float_t CLAsincosTable_Coef2;
extern float_t CLAsincosTable_Coef3;
extern float_t CLAsincosTable_Coef3_neg;

//CLAatanTable Variables
extern float_t CLAatan2HalfPITable[2];
extern float_t CLAatan2Table[195];
extern float_t *CLAatan2TableEnd;
extern float_t *CLAINV2PI;

//CLAacosineTable Variables
extern float_t CLAacosinHalfPITable[2];
extern float_t CLAacosinTable[192];
extern float_t *CLAacosinTableEnd;

//CLAasineTable Variables
extern float_t CLAasinHalfPITable[2];
extern float_t CLAasinTable[195];
extern float_t *CLAasinTableEnd;

//CLAexpTable Variables
extern float_t CLAINV1,CLAINV2,CLAINV3,CLAINV4;
extern float_t CLAINV5,CLAINV6,CLAINV7,CLALOG10;
extern float_t CLAExpTable[89];
extern float_t *CLAExpTableEnd;

//CLAlnTable Variables
extern float_t CLALNV2,CLALNVe,CLALNV10,CLABIAS;
extern long CLALN_TABLE_MASK1,CLALN_TABLE_MASK2;
extern float_t CLALnTable[99];
extern float_t *CLALnTableEnd;

//Linker Defined variables
extern unsigned int _cla_scratchpad_start;
extern unsigned int _cla_scratchpad_end;

//###########################################################################
//
// Function Prototypes
//
//###########################################################################
extern float_t CLAacos(float_t fVal);
extern float_t CLAacos_spc(float_t fVal);
extern float_t CLAasin(float_t fVal);
extern float_t CLAatan(float_t fVal);
extern float_t CLAatan2(float_t fVal1, float_t fVal2);
extern float_t CLAatan2PU(float_t fVal1, float_t fVal2);
extern float_t CLAcos(float_t fAngleRad);
extern float_t CLAcosPU(float_t fAngleRadPU);
extern float_t CLAdiv(float_t fNum, float_t fDen);
extern float_t CLAexp(float_t fVal);
extern float_t CLAexp10(float_t fVal);
extern float_t CLAexp2(float_t fNum, float_t fDen);
extern float_t CLAisqrt(float_t fVal);
extern float_t CLAln(float_t fVal);
extern float_t CLAlog10(float_t fVal);
extern float_t CLAsin(float_t fAngleRad);
extern float_t CLAsinPU(float_t fAngleRadPU);
extern float_t CLAsqrt(float_t fVal);
//###########################################################################
//
// Inline Functions
//
//###########################################################################
#define TABLE_SIZE_DIVTWOPI   20.37183271576;     //TABLE_SIZE/(2*Pi)
#define TWOPIDDIV_TABLE_SIZE  0.04908738521234;   //(2*Pi)/TABLE_SIZE
#define TABLE_SIZE            64
#define TABLE_SIZE_M_1        TABLE_SIZE-1
#ifndef PI
#define PI                    3.141592653589
#endif


#ifdef __TMS320C28XX_CLA__
#pragma FUNC_ALWAYS_INLINE(CLAsqrt_inline)
extern float_t __meisqrtf32(float_t in);
static inline float_t CLAsqrt_inline(float_t in)
{
  float_t y0,y1,y2;

  y0 = __meisqrtf32(in);             //Initial estimate of isqrt(in)


  if(in == (float_t)0.0)
    {
      y0 = (float_t)0.0;
    }

  y1 = y0*((float_t)1.5 - y0*y0*in*(float_t)0.5);      //Newton rapshon iteration 1
  y2 = y1*((float_t)1.5 - y1*y1*in*(float_t)0.5);      //Newton rapshon iteration 2
  y2 = y2 * in;                      //est(1/sqrt(in))*in = est(sqrt(in))

  return(y2);
}


#pragma FUNC_ALWAYS_INLINE(CLAsin_inline)
extern float_t __mfracf32(float_t in);
static inline float_t CLAsin_inline(float_t fAngle)
{
   //Local Variables
   float_t tblIdx;     //The floating pt table index
   float_t X;          //Fractional part of tblidx
   float_t SinK,CosK;  //Table values sin and cos that are closest to the
                       //user input angle value
   signed int index;

   tblIdx = fAngle * CLAsincosTable_TABLE_SIZEDivTwoPi;
   index=(((signed int)tblIdx)&(signed int)0x007F);
   SinK = CLAsincosTable[(signed int)index];
   CosK = CLAsincosTable[index+32];

   X = __mfracf32(tblIdx);
   X = X * (float_t)TWOPIDDIV_TABLE_SIZE;

   //Using the Taylor series
   return (SinK + X * (CosK                        \
                + X * (CLAsincosTable_Coef0 * SinK \
                + X * (CLAsincosTable_Coef1 * CosK \
                + X * (CLAsincosTable_Coef2 * SinK \
                + X * (CLAsincosTable_Coef3 * CosK))))));
}


#pragma FUNC_ALWAYS_INLINE(CLAcos_inline)
static inline float_t CLAcos_inline(float_t fAngle)
{
  //Local Variables
  float_t tblIdx;      //The floating pt table index, needs to be volatile due to compiler BUG
  float_t X;           //Fractional part of tblidx
  float_t SinK,CosK;   //Table values sin and cos that are closest to the
                       //user input angle value
  signed int index;

  tblIdx = fAngle * CLAsincosTable_TABLE_SIZEDivTwoPi;
  index=(((signed int)tblIdx)&(signed int)0x007F);

  SinK = CLAsincosTable[index]; //*pTblSin;
  CosK = CLAsincosTable[index+32]; //*pTblCos;

  X = __mfracf32(tblIdx);
  X = X * (float_t)TWOPIDDIV_TABLE_SIZE;

  //Using the Taylor series
  return (CosK + X * (-SinK                           \
               + X * (CLAsincosTable_Coef0 * CosK     \
               + X * (CLAsincosTable_Coef1_pos * SinK \
               + X * (CLAsincosTable_Coef2 * CosK     \
               + X * (CLAsincosTable_Coef3_neg * SinK))))));
}
#endif


//###########################################################################
//
//End of the C bindings section for C++ compilers.
//
//###########################################################################
#ifdef __cplusplus
}
#endif //__cplusplus

#endif // __CLAMATH_H__
