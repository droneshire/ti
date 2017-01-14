/*
//###########################################################################
// FILE:    28M35H20B1_RAM_lnk_m3.cmd
// TITLE:   Linker Command File for 28M35H20B1 examples that run out of RAM
//          This ONLY includes all SARAM blocks on the 28M35H20B1 device.
//          This does not include flash or OTP.
//          Keep in mind that C0 and C1 are protected by the code
//          security module.
//          What this means is in most cases you will want to move to
//          another memory map file which has more memory defined.
//###########################################################################
// $TI Release: 28M35x Driver Library vAlpha1 $
// $Release Date: July 11, 2011 $
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
    INTVECS (RWX)    : origin = 0x20005000, length = 0x01B0
    C2 (RWX)         : origin = 0x200051B0, length = 0x0E50
    C3 (RWX)         : origin = 0x20006000, length = 0x2000
    CTOMRAM (RX)     : origin = 0x2007F000, length = 0x0800
    MTOCRAM (RWX)    : origin = 0x2007F800, length = 0x0800
}

/* Section allocation in memory */

SECTIONS
{
    .intvecs:   > INTVECS
    .resetisr:  > RESETISR
    .text   :   > C0
    .const  :   > C2
    .cinit  :   > C2
    .pinit  :   > C2

    .vtable :   > C1
    .data   :   > C1
    .bss    :   > C1
    .sysmem :   > C1
    .stack  :   > C1
    
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


