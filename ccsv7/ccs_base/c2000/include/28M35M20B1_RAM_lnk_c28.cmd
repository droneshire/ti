/*
//###########################################################################
// FILE:    28M35M20B1_RAM_lnk_c28.cmd
// TITLE:   Linker Command File for F28M35M20B1 examples that run out of RAM
//          This ONLY includes all SARAM blocks on the F28M35M20B1 device.
//          This does not include flash or OTP.
//          Keep in mind that L0 and L1 are protected by the code
//          security module.
//          What this means is in most cases you will want to move to
//          another memory map file which has more memory defined.
//###########################################################################
// $TI Release: F28M35x Driver Library vAlpha1 $
// $Release Date: July 11, 2011 $
//###########################################################################
*/

/* ======================================================
// In addition to this memory linker command file,
// add the header linker command file directly to the project.
// The header linker command file is required to link the
// peripheral structures to the proper locations within
// the memory map.
// The header linker files are found in <base>\F28M35x_headers\cmd
// For BIOS applications add:      F28M35x_Headers_BIOS.cmd
// For nonBIOS applications add:   F28M35x_Headers_nonBIOS.cmd
========================================================= */

/* Define the memory block start/length for the F28M35x
   PAGE 0 will be used to organize program sections
   PAGE 1 will be used to organize data sections

   Notes:
         Memory blocks on F28M35x are uniform (ie same
         physical memory) in both PAGE 0 and PAGE 1.
         That is the same memory region should not be
         defined for both PAGE 0 and PAGE 1.
         Doing so will result in corruption of program
         and/or data.

         Contiguous SARAM memory blocks can be combined
         if required to create a larger memory block.
*/

MEMORY
{
PAGE 0 :
   /* BEGIN is used for the "boot to SARAM" bootloader mode   */

   BEGIN       : origin = 0x000000, length = 0x000002
   RAMM0       : origin = 0x0001A3, length = 0x00025D     /* on-chip RAM block M0 */
   RAML0L1     : origin = 0x008000, length = 0x002000     /* on-chip RAM block L0, L1 */   
    
   RESET       : origin = 0x3FFFC0, length = 0x000002     /* Part of Boot ROM */
   FPUTABLES   : origin = 0x3FD258, length = 0x0006A0      /* FPU Tables in Boot ROM */
   IQTABLES    : origin = 0x3FD8F8, length = 0x000B50     /* IQ Math Tables in Boot ROM */
   IQTABLES2   : origin = 0x3FE448, length = 0x00008C     /* IQ Math Tables in Boot ROM */
   IQTABLES3   : origin = 0x3FE4D4, length = 0x0000AA      /* IQ Math Tables in Boot ROM */

   BOOTROM     : origin = 0x3FEDA8, length = 0x001200     /* Boot ROM */


PAGE 1 :

   BOOT_RSVD   : origin = 0x000002, length = 0x0001A0     /* Part of M0, BOOT rom will use this for stack */
   RAMM1       : origin = 0x000400, length = 0x000400     /* on-chip RAM block M1 */
   RAML2       : origin = 0x00A000, length = 0x001000      /* on-chip RAM block L2 */
   RAML3       : origin = 0x00B000, length = 0x001000     /* on-chip RAM block L3 */
   CTOMRAM     : origin = 0x03F800, length = 0x000380     /* C28 to M3 Message RAM */
   MTOCRAM     : origin = 0x03FC00, length = 0x000380     /* M3 to C28 Message RAM */
}


SECTIONS
{
   /* Setup for "boot to SARAM" mode:
      The codestart section (found in DSP28_CodeStartBranch.asm)
      re-directs execution to the start of user code.  */
   codestart        : > BEGIN,      PAGE = 0
   
#ifdef __TI_COMPILER_VERSION__
   #if __TI_COMPILER_VERSION__ >= 15009000
    .TI.ramfunc : {} > RAMM0,      PAGE = 0
   #else
   ramfuncs         : > RAMM0       PAGE = 0   
   #endif
#endif    
    
   .text            : > RAML0L1,    PAGE = 0
   .cinit           : > RAMM0,      PAGE = 0
   .pinit           : > RAMM0,      PAGE = 0
   .switch          : > RAMM0,      PAGE = 0
   .reset           : > RESET,      PAGE = 0, TYPE = DSECT /* not used, */

   .stack           : > RAML2,      PAGE = 1
   .ebss            : > RAML2,      PAGE = 1
   .econst          : > RAML2,      PAGE = 1
   .esysmem         : > RAML2,      PAGE = 1

   IQmath           : > RAML0L1,    PAGE = 0
   IQmathTables     : > IQTABLES,   PAGE = 0, TYPE = NOLOAD
   
   /* The following section definitions are required when using the IPC API Drivers */ 
   GROUP : > CTOMRAM, PAGE = 1 
   {
       PUTBUFFER 
       PUTWRITEIDX 
       GETREADIDX 
   }

   GROUP : > MTOCRAM, PAGE = 1
   {
       GETBUFFER :    TYPE = DSECT
       GETWRITEIDX :  TYPE = DSECT
       PUTREADIDX :   TYPE = DSECT
   }   
   
   /* Allocate FPU math areas: */
   FPUmathTables    : > FPUTABLES,  PAGE = 0, TYPE = NOLOAD

   DMARAML2            : > RAML2,        PAGE = 1
   DMARAML3            : > RAML3,        PAGE = 1

  /* Uncomment the section below if calling the IQNexp() or IQexp()
      functions from the IQMath.lib library in order to utilize the
      relevant IQ Math table in Boot ROM (This saves space and Boot ROM
      is 1 wait-state). If this section is not uncommented, IQmathTables2
      will be loaded into other memory (SARAM, Flash, etc.) and will take
      up space, but 0 wait-state is possible.
   */
   /*
   IQmathTables2    : > IQTABLES2,  PAGE = 0, TYPE = NOLOAD
   {

              IQmath.lib<IQNexpTable.obj> (IQmathTablesRam)

   }
   */
   /* Uncomment the section below if calling the IQNasin() or IQasin()
      functions from the IQMath.lib library in order to utilize the
      relevant IQ Math table in Boot ROM (This saves space and Boot ROM
      is 1 wait-state). If this section is not uncommented, IQmathTables2
      will be loaded into other memory (SARAM, Flash, etc.) and will take
      up space, but 0 wait-state is possible.
   */
   /*
   IQmathTables3    : > IQTABLES3,  PAGE = 0, TYPE = NOLOAD
   {

              IQmath.lib<IQNasinTable.obj> (IQmathTablesRam)

   }
   */

}

/*
*/

