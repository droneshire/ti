/******************************************************************************/
/* lnk_msp430f2013.cmd - LINKER COMMAND FILE FOR LINKING MSP430F2013 PROGRAMS */
/*                                                                            */
/*  Ver | dd mmm yyyy | Who  | Description of changes                         */
/* =====|=============|======|=============================================   */
/*  0.01| 08 Mar 2004 | A.D. | First prototype                                */
/*  0.02| 26 Mai 2004 | A.D. | Leading symbol underscores removed,            */
/*      |             |      | Interrupt vector definition changed            */
/*  0.03| 22 Jun 2004 | A.D. | File reformatted                               */
/*                                                                            */
/*   Usage:  lnk430 <obj files...>    -o <out file> -m <map file> lnk.cmd     */
/*           cl430  <src files...> -z -o <out file> -m <map file> lnk.cmd     */
/*                                                                            */
/*----------------------------------------------------------------------------*/

/* These linker options are for command line linking only.  For IDE linking,  */
/* you should set your linker options in Project Properties                   */
/* -c                                               LINK USING C CONVENTIONS  */
/* -stack  0x0100                                   SOFTWARE STACK SIZE       */
/* -heap   0x0100                                   HEAP AREA SIZE            */

/*----------------------------------------------------------------------------*/
/* 'Allocate' peripheral registers at given addresses                         */
/*----------------------------------------------------------------------------*/

/************************************************************
* STANDARD BITS
************************************************************/
/************************************************************
* STATUS REGISTER BITS
************************************************************/
/************************************************************
* PERIPHERAL FILE MAP
************************************************************/
/************************************************************
* SPECIAL FUNCTION REGISTER ADDRESSES + CONTROL BITS
************************************************************/
IE1                = 0x0000;
IFG1               = 0x0002;
/************************************************************
* Basic Clock Module
************************************************************/
DCOCTL             = 0x0056;
BCSCTL1            = 0x0057;
BCSCTL2            = 0x0058;
BCSCTL3            = 0x0053;
                                                                                    
/*************************************************************
* Flash Memory
*************************************************************/
FCTL1              = 0x0128;
FCTL2              = 0x012A;
FCTL3              = 0x012C;
/************************************************************
* DIGITAL I/O Port1/2 Pull up / Pull down Resistors
************************************************************/
P1IN               = 0x0020;
P1OUT              = 0x0021;
P1DIR              = 0x0022;
P1IFG              = 0x0023;
P1IES              = 0x0024;
P1IE               = 0x0025;
P1SEL              = 0x0026;
P1REN              = 0x0027;
P2IN               = 0x0028;
P2OUT              = 0x0029;
P2DIR              = 0x002A;
P2IFG              = 0x002B;
P2IES              = 0x002C;
P2IE               = 0x002D;
P2SEL              = 0x002E;
P2REN              = 0x002F;
/************************************************************
* SD16_A1 - Sigma Delta 16 Bit
************************************************************/
SD16INCTL0         = 0x00B0;
SD16AE             = 0x00B7;
SD16CONF0          = 0x00F7;
SD16CONF1          = 0x00BF;
                                      /* Please use only the recommended settings */
SD16CTL            = 0x0100;
SD16CCTL0          = 0x0102;
SD16IV             = 0x0110;
SD16MEM0           = 0x0112;
/************************************************************
* Timer A2
************************************************************/
TAIV               = 0x012E;
TACTL              = 0x0160;
TACCTL0            = 0x0162;
TACCTL1            = 0x0164;
TAR                = 0x0170;
TACCR0             = 0x0172;
TACCR1             = 0x0174;
/************************************************************
* USI
************************************************************/
USICTL0            = 0x0078;
USICTL1            = 0x0079;
USICKCTL           = 0x007A;
USICNT             = 0x007B;
USISRL             = 0x007C;
USISRH             = 0x007D;
USICTL             = 0x0078;
USICCTL            = 0x007A;
USISR              = 0x007C;
/************************************************************
* WATCHDOG TIMER
************************************************************/
WDTCTL             = 0x0120;
/************************************************************
* Calibration Data in Info Mem
************************************************************/
CALDCO_16MHZ       = 0x10F8;
CALBC1_16MHZ       = 0x10F9;
CALDCO_12MHZ       = 0x10FA;
CALBC1_12MHZ       = 0x10FB;
CALDCO_8MHZ        = 0x10FC;
CALBC1_8MHZ        = 0x10FD;
CALDCO_1MHZ        = 0x10FE;
CALBC1_1MHZ        = 0x10FF;
/************************************************************
* Interrupt Vectors (offset from 0xFFE0)
************************************************************/
/************************************************************
* End of Modules
************************************************************/

/****************************************************************************/
/* SPECIFY THE SYSTEM MEMORY MAP                                            */
/****************************************************************************/

MEMORY
{
    SFR                     : origin = 0x0000, length = 0x0010
    PERIPHERALS_8BIT        : origin = 0x0010, length = 0x00F0
    PERIPHERALS_16BIT       : origin = 0x0100, length = 0x0100
    RAM                     : origin = 0x0200, length = 0x0080
    INFOA                   : origin = 0x10C0, length = 0x0040
    INFOB                   : origin = 0x1080, length = 0x0040
    INFOC                   : origin = 0x1040, length = 0x0040
    INFOD                   : origin = 0x1000, length = 0x0040
    FLASH                   : origin = 0xF800, length = 0x07E0
    INT00                   : origin = 0xFFE0, length = 0x0002
    INT01                   : origin = 0xFFE2, length = 0x0002
    INT02                   : origin = 0xFFE4, length = 0x0002
    INT03                   : origin = 0xFFE6, length = 0x0002
    INT04                   : origin = 0xFFE8, length = 0x0002
    INT05                   : origin = 0xFFEA, length = 0x0002
    INT06                   : origin = 0xFFEC, length = 0x0002
    INT07                   : origin = 0xFFEE, length = 0x0002
    INT08                   : origin = 0xFFF0, length = 0x0002
    INT09                   : origin = 0xFFF2, length = 0x0002
    INT10                   : origin = 0xFFF4, length = 0x0002
    INT11                   : origin = 0xFFF6, length = 0x0002
    INT12                   : origin = 0xFFF8, length = 0x0002
    INT13                   : origin = 0xFFFA, length = 0x0002
    INT14                   : origin = 0xFFFC, length = 0x0002
    RESET                   : origin = 0xFFFE, length = 0x0002
}

/****************************************************************************/
/* SPECIFY THE SECTIONS ALLOCATION INTO MEMORY                              */
/****************************************************************************/

SECTIONS
{
    .bss       : {} > RAM                /* GLOBAL & STATIC VARS              */
    .sysmem    : {} > RAM                /* DYNAMIC MEMORY ALLOCATION AREA    */
    .stack     : {} > RAM (HIGH)         /* SOFTWARE SYSTEM STACK             */

    .text      : {} > FLASH              /* CODE                              */
    .cinit     : {} > FLASH              /* INITIALIZATION TABLES             */
    .const     : {} > FLASH              /* CONSTANT DATA                     */
    .cio       : {} > RAM                /* C I/O BUFFER                      */

    .pinit     : {} > FLASH              /* C++ CONSTRUCTOR TABLES            */

    .infoA     : {} > INFOA              /* MSP430 INFO FLASH MEMORY SEGMENTS */
    .infoB     : {} > INFOB
    .infoC     : {} > INFOC
    .infoD     : {} > INFOD

    .int00   : {} > INT00                /* MSP430 INTERRUPT VECTORS          */
    .int01   : {} > INT01
    .int02   : {} > INT02
    .int03   : {} > INT03
    .int04   : {} > INT04
    .int05   : {} > INT05
    .int06   : {} > INT06
    .int07   : {} > INT07
    .int08   : {} > INT08
    .int09   : {} > INT09
    .int10   : {} > INT10
    .int11   : {} > INT11
    .int12   : {} > INT12
    .int13   : {} > INT13
    .int14   : {} > INT14
    .reset   : {} > RESET              /* MSP430 RESET VECTOR               */ 
}

