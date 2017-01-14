/*
//###########################################################################
// FILE:    F28M36x_generic_wshared_M3_RAM.cmd
// TITLE:   Linker Command File For F28M36x examples that run out of RAM
//          This does not include flash or OTP.
//          Keep in mind that C0 and C1 are protected by the code
//          security module.
//          What this means is in most cases you will want to move to
//          another memory map file which has more memory defined.
//###########################################################################
// $TI Release: F28M36x Driver Library vAlpha1 $
// $Release Date: February 27, 2012 $
//###########################################################################
*/

--retain=g_pfnVectors

/* The following command line options are set as part of the CCS project.    */
/* If you are building using the command line, or for some reason want to    */
/* define them here, you can uncomment and modify these lines as needed.     */
/* If you are using CCS for building, it is probably better to make any such */
/* modifications in your CCS project and leave this file alone.              */
/*                                                                           */
/* --heap_size=0                                                             */
/* --stack_size=256                                                          */
/* --library=rtsv7M3_T_le_eabi.lib                                           */


/* System memory map */

MEMORY
{
    C0 (RWX)         : origin = 0x20000000, length = 0x2000
    C1 (RWX)         : origin = 0x20002000, length = 0x2000
    BOOT_RSVD (RX)   : origin = 0x20004000, length = 0x0FF8
    RESETISR (RWX)   : origin = 0x20004FF8, length = 0x0008
    INTVECS (RWX)    : origin = 0x20005000, length = 0x0258
    C2 (RWX)         : origin = 0x20005258, length = 0x0DA8
    C3 (RWX)         : origin = 0x20006000, length = 0x2000
    S0 (RWX)         : origin = 0x20008000, length = 0x2000
    S1 (RWX)         : origin = 0x2000A000, length = 0x2000
    S2 (RWX)         : origin = 0x2000C000, length = 0x2000
    S3 (RWX)         : origin = 0x2000E000, length = 0x2000
    S4 (RWX)         : origin = 0x20010000, length = 0x2000
    S5 (RWX)         : origin = 0x20012000, length = 0x2000
    S6 (RWX)         : origin = 0x20014000, length = 0x2000
    S7 (RWX)         : origin = 0x20016000, length = 0x2000
    
    C4  (RWX)        : origin = 0x20018000, length = 0x2000
    C5  (RWX)        : origin = 0x2001A000, length = 0x2000
    C6  (RWX)        : origin = 0x2001C000, length = 0x2000
    C7  (RWX)        : origin = 0x2001E000, length = 0x2000
    C8  (RWX)        : origin = 0x20020000, length = 0x2000
    C9  (RWX)        : origin = 0x20022000, length = 0x2000
    C10 (RWX)        : origin = 0x20024000, length = 0x2000
    C11 (RWX)        : origin = 0x20026000, length = 0x2000
    C12 (RWX)        : origin = 0x20028000, length = 0x2000
    C13 (RWX)        : origin = 0x2002A000, length = 0x2000
    C14 (RWX)        : origin = 0x2002C000, length = 0x2000
    C15 (RWX)        : origin = 0x2002E000, length = 0x2000
    
    CTOMRAM (RX)     : origin = 0x2007F000, length = 0x0800
    MTOCRAM (RWX)    : origin = 0x2007F800, length = 0x0800
}

/* Section allocation in memory */

SECTIONS
{
    .intvecs:   > INTVECS
    .resetisr:  > RESETISR
    .text   :   >> C0 | C1 | C2 | C3 
    .const  :   >> C0 | C1 | C2 | C3
    .cinit  :   >  C0 | C1 | C2 | C3
    .pinit  :   >> C0 | C1 | C2 | C3

    .vtable :   >> C0 | C1 | C2 | C3
    .data   :   >> C2 | C3 | C0 | C1 
    .bss    :   >> C2 | C3 | C0 | C1 
    .sysmem :   >> C0 | C1 | C2 | C3
    .stack  :   >  C0 | C1 | C2 | C3

    SHARERAMS0  : > S0
    SHARERAMS1  : > S1
    SHARERAMS2  : > S2
    SHARERAMS3  : > S3
    SHARERAMS4  : > S4
    SHARERAMS5  : > S5
    SHARERAMS6  : > S6
    SHARERAMS7  : > S7

    
    GROUP : > MTOCRAM
    {
        PUTBUFFER  
        PUTWRITEIDX
        GETREADIDX  
    }

    GROUP : > CTOMRAM 
    {
        GETBUFFER : TYPE = DSECT
        GETWRITEIDX : TYPE = DSECT
        PUTREADIDX : TYPE = DSECT
    }    
}

__STACK_TOP = __stack + 256;
