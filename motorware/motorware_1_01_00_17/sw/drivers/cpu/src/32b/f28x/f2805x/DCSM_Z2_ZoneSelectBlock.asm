;//###########################################################################
;//
;// FILE:	F2805x_DCSM_Z2_ZoneSelectBlock._asm
;//
;// TITLE:	F2805x Dual Code Security Module Zone 2 Zone Select Block Values.
;// 
;// DESCRIPTION:
;//
;//         This file is used to specify Z2 DCSM OTP and zone select
;//         values to program into the Zone 2 zone select locations in OTP
;//         Value depends on Linkpointer).
;//
;//         In addition, the 60 reserved values after the zone select block 
;//         are all programmed to 0x0000 as well.
;//
;//###########################################################################
;// $TI Release: F2805x C/C++ Header Files and Peripheral Examples V104 $
;// $Release Date: June  4, 2015 $
;// $Copyright: Copyright (C) 2012-2015 Texas Instruments Incorporated -
;//             http://www.ti.com/ ALL RIGHTS RESERVED $
;//###########################################################################


; !!IMPORTANT!!: The "dcsm_otp_z2" section contains the Z2 LINKPOINTER which 
; determines the location of the Z2 Zone Select block.  If the LINKPOINTER 
; is changed, then the "dcsm_zsel_z2" section in the F2805x.cmd command linker 
; file must also change to an address decoded from the value specified 
; in the Z2-LINKPOINTER location. 

; The "dcsm_zsel_z2" section contains the actual Z2 Zone Select Block values 
; that will be linked and programmed into to the DCSM Z2 OTP Zone Select block
; in OTP.  
; These values must be known in order to unlock the CSM module. 
; All 0xFFFFFFFF's (erased) is the default value for the password locations (PWL).

; It is recommended that all values be left as 0xFFFFFFFF during code
; development.  Values of 0xFFFFFFFF do not activate code security and dummy 
; reads of the Z2 DCSM PWL registers is all that is required to unlock the CSM.  
; When code development is complete, modify values to activate the
; code security module.
enableCSM_Z2	.set	0			;0-disable CSM, 1-enable CSM

      .sect "dcsm_otp_z2"
	  
	  .long 0xFFFFFFFF     ;Z2-LINKPOINTER
	  .long 0xFFFFFFFF     ;OTPSECLOCK

      .sect "dcsm_zsel_z2"

      .long	0xFFFFFFFF		;Z2-EXEONLYRAM
      .long	0xFFFFFFFF		;Z2-EXEONLYSECT
      .long	0xFFFFFFFF		;Z2-GRABRAM
      .long	0xFFFFFFFF		;Z2-GRABSECT
	  
	.if enableCSM_Z2	; enableCSM_Z2=1
      .long	0xFFFFFFFF		;Z2-CSMPSWD0 (LSW of 128-bit password)
      .long	0xFFFFFFFF		;Z2-CSMPSWD1
      .long	0xFFFFFFFF		;Z2-CSMPSWD2
      .long	0xFFFFFFFF		;Z2-CSMPSWD3 (MSW of 128-bit password)
	.else
      .long	0xFFFFFFFF		;Z2-CSMPSWD0 (LSW of 128-bit password)
      .long	0xFFFFFFFF		;Z2-CSMPSWD1
      .long	0xFFFFFFFF		;Z2-CSMPSWD2
      .long	0xFFFFFFFF		;Z2-CSMPSWD3 (MSW of 128-bit password)
     .endif
	  
;----------------------------------------------------------------------

; For code security operation,after development has completed, prior to
; production, all other zone select block locations should be programmed
; to 0x0000 for maximum security.        
; If the first zone select block at offset 0x10 is used, the section 
;"dcsm_rsvd_z2" can be used to program these locations to 0x0000.
; This code is commented out for development.
	.if enableCSM_Z2	; enableCSM_Z2=1
        .sect "dcsm_rsvd_z2"
        .loop (1e0h)
              .int 0x0000
        .endloop
    .endif

;//===========================================================================
;// End of file.
;//===========================================================================

      
