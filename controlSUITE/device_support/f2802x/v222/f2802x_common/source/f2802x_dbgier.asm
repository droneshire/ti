;//###########################################################################
;//
;// FILE:  DSP2802x_DBGIER.asm
;//
;// TITLE: Set the DBGIER register
;//
;// DESCRIPTION:
;//  
;//  Function to set the DBGIER register (for realtime emulation).
;//  Function Prototype: void SetDBGIER(Uint16)
;//  Useage: SetDBGIER(value);
;//  Input Parameters: Uint16 value = value to put in DBGIER register. 
;//  Return Value: none          
;//
;//###########################################################################
;// $TI Release: F2802x Support Library v222 $
;// $Release Date: Thu Jan 15 13:56:57 CST 2015 $
;// $Copyright: Copyright (C) 2008-2015 Texas Instruments Incorporated -
;//             http://www.ti.com/ ALL RIGHTS RESERVED $
;//###########################################################################    
        .global _SetDBGIER
        .text
        
_SetDBGIER:
        MOV     *SP++,AL
        POP     DBGIER
        LRETR
        
