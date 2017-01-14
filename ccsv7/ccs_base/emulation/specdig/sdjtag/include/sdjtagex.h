/*H***************************************************************************
*
* $Archive:: /TI/product/ticcsv42/SdJtag/include/sdjtagex.h                  $
* $Revision:: 9                                                              $
* $Date:: 3/17/11 2:57p                                                      $
* $Author:: Tonyc                                                            $
*
* DESCRIPTION: Interface file for sdjtagex.dll, sdjtagex.lib.  This interface
*              is a thin layer around standard SD emulation drivers.
*
* USAGE/LIMITATIONS: To be used with following SD emulators
*                    XDS510USBPLUS
*
*                    Assumptions:
*                       1) Standard SD driver install for CCS has been
*                          been installed.
*                       2) Requires emulation drivers for CCS 2.x or higher.
*                       3) CCS, SdConfig or SDFlash are functional on the 
*                          test setup and target.
*                       4) Cannot be run simultaneously with other tools that
*                          make access to the scan chain.
*
*
* NOTES:
*   
* (C) Copyright 2007 by Spectrum Digital Incorporated
* All rights reserved
*
*H***************************************************************************/

#ifndef sdjtagex_h
#define sdjtagex_h

#ifdef __cplusplus
extern "C" {
#endif

/*---- system and platform files --------------------------------------------*/

/*---- program files --------------------------------------------------------*/

typedef unsigned short SDJTAGEX_JBIO_PLAY;    /* Jtag BITIO play buffer type */
typedef unsigned short SDJTAGEX_BIST_PLAY;

/*----------------------------------------------------------------------------*
 *                                                                            *
 *                        JTAG BIT IO PIN NAMES                               *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_jbio_pin_name  
{
	PIN_RTCK=0,                                     /*  Return Test Clock Pin */
	PIN_TCK,                                        /*  Test Clock Pin        */
	PIN_TRST,                                       /*  Test Reset Pin        */
	PIN_TMS,                                        /*  Test Mode Select Pin  */
	PIN_TDI,                                        /*  Test Data Input Pin   */
	PIN_TDO                                         /*  Test Data Output Pin  */
}SDJTAGEX_JBIO_PIN_NAME,*PSDJTAGEX_JBIO_PIN_NAME;

/*----------------------------------------------------------------------------*
 *                                                                            *
 *                        BIT IO PIN NAMES                                    *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_bio_pin_name  
{
	EMU0=0,                                           /*  Emu0 Pin            */
	EMU1=4,                                           /*  Emu1 Pin            */
	EMU3=8,                                           /*  Emu3 Pin(Not Used)  */
	EMU4=12                                           /*  Emu4 Pin(Not Used)  */
}SDJTAGEX_BIO_PIN_NAME,*PSDJTAGEX_BIO_PIN_NAME;

/*----------------------------------------------------------------------------*
 *                                                                            *
 * SdConfigEx Parameters - These are equivalent to the parameters that        *
 * can be set from SdConfigEx for XDS510USB PLUS emulator.                    *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_config_parmeter 
{  
	PARM_EMUPORTFLAGS = 1,               /*  Emulator Port Flags              */ 
	PARM_EMUTCKDIV = 3,                  /*  TCK Divisor/Adaptive TCK Delay   */
	PARM_PORTSPEED,                      /*  Emulator Port Speed              */
	PARM_JCLKMODE,                       /*  Emulator JCLK Mode               */
	PARM_JCLKFREQHZ,                     /*  Emulator JCLK Frequency          */
	PARM_POWERMODE,                      /*  Target Power Detect Threshold    */
	PARM_MAXWAITTIME =9,                 /*  Get only                         */
	PARM_NOPTIME,                        /*  Get only                         */
	PARM_EMU0PINLEVEL,                   /*  State of the EMU0 Pin            */
	PARM_EMU1PINLEVEL                    /*  State of the EMU1 Pin            */                          
}SDJTAGEX_CONFIG_PARAMETER,*PSDJTAGEX_CONFIG_PARAMETER;

/*----------------------------------------------------------------------------*
 *                                                                            *
 * PARM_EMUPORTFLAGS Options                                                  *
 *                                                                            *
 * SDJTAGEX_PFLAGS_ALT_TIMING               - Non-Compliant JTAG Timing       *
 * SDJTAGEX_PFLAGS_RESET_TRG                - Assert Target System Reset      *
 * SDJTAGEX_PFLAGS_PULSE_TRST               - Pulse TRST                      *
 * SDJTAGEX_PFLAGS_EMUIO_OFF_AT_EXIT        - JTAG IO OFF AT EXIT             *
 * SDJTAGEX_PFLAGS_EMUIO_OFF_AT_DISCONNECT  - JTAG IO OFF AT DISCONNECT       *
 *                                                                            *
 *----------------------------------------------------------------------------*/
#define SDJTAGEX_PFLAGS_ALT_TIMING               0x0001  
#define SDJTAGEX_PFLAGS_RESET_TRG                0x0004  
#define SDJTAGEX_PFLAGS_PULSE_TRST               0x0100  
#define SDJTAGEX_PFLAGS_EMUIO_OFF_AT_EXIT        0x0800  
#define SDJTAGEX_PFLAGS_EMUIO_OFF_AT_DISCONNECT  0x4000  

/*----------------------------------------------------------------------------*
 *                                                                            *
 * PARM_JCLKMODE Options - Methods of generating TCK to the target.           *
 *                                                                            *
 * COUNTER  - TCK is driven by a clock counter/timer which can be programmed  *
 *            to generate frequencies from 1 to 32 MHz.                       *
 * ADAPTIVE - TCK is generated adaptively from the RTCK (TCLK_RET) signal.    *
 *            The emulator generates a TCK edge and waits for the target      *
 *            to send RTCK. When RTCK equals TCK the emulator will wait       *
 *            N-clocks and generate an inverted TCK.                          *
 * ADAPTIVE_FAST - The Fast Adaptive Mode is the same as Adaptive Mode except *
 *                 there is no programmable delay between RTCK and TCK.       *
 * BITIO    - TCK generated by the user.                                      *
 * EXTBITIO - BITIO via McBsp                                                 *
 * COUNTER_ITCKR - Same as COUNTER mode with TCK return looped back internal. *
 *                 This mode is intended for boundary scan support where      *
 *                 TCK_RET pin does not exist on the target system.           *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_jclk_mode 
{
	COUNTER=0,                     
	ADAPTIVE,                     
	ADAPTIVE_FAST,                 
	BITIO,                         
	EXTBITIO,
    COUNTER_ITCKR
}SDJTAGEX_JCLK_MODE,*PSDJTAGEX_JCLK_MODE;

/*----------------------------------------------------------------------------*
 *                                                                            *
 * PARM_POWERMODE Options - Target Power Detect Threshold                     *
 *                                                                            * 
 * PDM_DEFAULT - When PDM_DEFAULT option is selected the emulator will sense  * 
 *               a target power failure if the voltage at the PD pin falls    *
 *               below approximately 2.1 volts.                               *
 * PDM_LOW     - When PDM_LOW option is selected the emulator will sense a    *
 *               target power failure if the voltage at the PD pin falls      * 
 *               below approximately 1.1 volts.                               *
 * PDM_PWM     - Future use for XDS510USB Galvanic support.                   *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_power_det_threshold
{ 
    PDM_DEFAULT=0, 
    PDM_LOW =1, 
    PDM_PWM
}SDJTAGEX_POWER_DET_THRESHOLD,*PSDJTAGEX_POWER_DET_THRESHOLD;

/*----------------------------------------------------------------------------*
 *                                                                            *
 * PIN STATES - Can be used to set any BITIO or JBITIO pins to high,low or    *
 *              HIGHZ configuration.                                          *
 * PINLOW  - Emulator will drive the pin low.                                 *
 * PINHIGH - Emulator will drive the pin high.                                *
 * HIGHZ   - Emulator doesn't drive the pin, tri-stated                       *
 *                                                                            *
 * NOTE: EMU0-EMU3 have tri-state pin control other pins do not.              *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_pin_state 
{ 
	PINLOW = 0,                                  
	PINHIGH,                                     
	PINZ                                          
}SDJTAGEX_PIN_STATE,*PSDJTAGEX_PIN_STATE;

/*----------------------------------------------------------------------------*
 *                                                                            *
 * JCLK SOURCE - Clock Source used to configure the operating mode for TCK    *
 *                                                                            *
 * TCK_JCLK_RET - Used in emulation mode, where TCK source is the             * 
 *                TCK return value                                            *
 * TCK_INTERNAL_LOOPBACK - Used in Boundary Scan mode,where the TCK source    *
 *                         is an internal loopback                            *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_jclk_source
{
    TCK_JCLK_RET =0,                              
    TCK_INTERNAL_LOOPBACK                         
}SDJTAGEX_JCLK_SOURCE,*PSDJTAGEX_JCLK_SOURCE;

/*----------------------------------------------------------------------------*
 *                                                                            *
 * MODE_SELECT - Can be used to enable or disable a particular mode bit.      *
 *                                                                            *
 * DISABLE  - Disables the mode bit.                                          *
 * ENABLE   - Enables the mode bit.                                           *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_mode_select
{
    DISABLE = 0,
    ENABLE
}SDJTAGEX_MODE_SELECT,*PSDJTAGEX_MODE_SELECT;

/*----------------------------------------------------------------------------*
 *                                                                            *
 * SDJTAGEX_MAKE_JTAG_VECTOR - Macro to make a vector to apply to pins for    * 
 *                             JTAG BIT IO Pin Play.                          *
 *                                                                            *
 * SDJTAGEX_EXTRACT_JTAG_TDI - Macro used to extract Test Data Input from the *
 *                             output buffer after a JTAG BIT IO Pin Play.    *
 *                                                                            *
 * SDJTAGEX_EXTRACT_TCK      - Macro used to extract Test Clock from the      *
 *                             output buffer after a JTAG BIT IO Pin Play.    *
 *                                                                            *
 *----------------------------------------------------------------------------*/
#define SDJTAGEX_MAKE_JTAG_VECTOR(ptrst,ptms,ptdo,ptck) ((ptrst<<2)\
                                                        |(ptms <<3)\
                                                        |(ptdo <<5)\
                                                        |(ptck <<1))
#define SDJTAGEX_EXTRACT_JTAG_TDI( ptdi) ( (ptdi>>4) & 1 )

#define SDJTAGEX_EXTRACT_TCK(x) ((x>>1)&1)


//----------------------------------------------------------------------------
// SDJTAGEX_ScanIrDrEx command parameters
//
typedef struct sdjtag_scanex
{
    SDJTAG_STATE    EndState;           // Terminal state
    VCT_POINTER     pXmit;              // Address of xmit vect or null
    VCT_POINTER     pRecv;              // Address of recv vect or null
    DWORD           NumIntrBits;        // Number of interest bits
    DWORD           NumPreBits;         // Number of preamble bits
    DWORD           NumPostBits;        // Number of preamble bits
    DWORD           OpFlags;            // Option flags
    DWORD           LoopCount;          // If looping
}SDJTAG_SCANEX, *PSDJTAG_SCANEX;

// Go via capture to the scan state. If currently in a pause state
//  then force exit, update, capture.
#define  SCANEX_FLG_PRECAPTURE    (DWORD)0x00000001
// Go via idle to the scan state. If currently in a pause state
//  then force exit, update, idle, capture.
#define  SCANEX_FLG_PREIDLE       (DWORD)0x00000002
// Go via capture to the end state. This executes a state command
//   following the end of the scan command.
#define  SCANEX_FLG_POSCAPTURE    (DWORD)0x00000004
// Go via idle to the end state. This executes a run-1 command
//   following the end of the scan command.
#define  SCANEX_FLG_POSIDLE       (DWORD)0x00000008
// This is an IR scan.
#define  SCANEX_FLG_IRSCAN        (DWORD)0x00000010
// Send all ones when pXmit is NULL.
#define  SCANEX_FLG_CONSTONES     (DWORD)0x00000020
// When looping reuse the send buffer, i.e. sending constant 
//   pattern for all sends.
#define  SCANEX_FLG_BUFFREUSE     (DWORD)0x00000040
// The buffer data is of size 32.  When looping send/recv
//   data pointers will be aligned to 32 bit data boundary.
#define  SCANEX_FLG_BUFFER32      (DWORD)0x00000080

// Caller's current jtag state based on SDJTAG_STATE.
// State is 2 bits. JSC keeps track of the current JTAG state and
// uses this information to determine when precapture/preidle bits
// need to be set.
#define  SCANEX_FLG_CURRENT_STATE(x)  (DWORD) (((DWORD)(x) & 3)<<14)

#define  SCANEX_GET_CURRENT_STATE(x)  (SDJTAG_STATE) ((x>>14) & 3)


/*----------------------BIST DEFINITIONS------------------------------------------*/
/*----------------------------------------------------------------------------*
 *                                                                            *
 * BIST_CHANNEL_NAME - Name of the BIST Channels                              *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_bist_channel_name
{
    CHANNELA = 0,
    CHANNELB,
	CHANNELC,
	CHANNELD
}SDJTAGEX_BIST_CHANNEL_NAME,*PSDJTAGEX_BIST_CHANNEL_NAME;

/*----------------------------------------------------------------------------*
 *                                                                            *
 * BIST_CHANNEL_REGS - BIST Channel Registers                                 *
 * INCAP               // Input data,  sync capture                           *
 * OUTPUT              // Output data, sync update                            *
 * OUTZ                // Output Z, sync update                               *
 * INRAW               // Input raw, reads pins directly                      *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_bist_channel_regs
{
	INCAP = 0,
    OUTPUT = 2,
	OUTZ = 4,
	INRAW = 6
}SDJTAGEX_BIST_CHANNEL_REGS,*PSDJTAGEX_BIST_CHANNEL_REGS;

/*----------------------------------------------------------------------------*
 *                                                                            *
 * BIST_CONTROL_REGS - BIST Control Registers                                 *
 * VERSION                                                                    *
 * PRESENT                                                                    *
 * CLKENABLE                                                                  *
 * UPDATE                                                                     *
 * SDRAM_PAGE                                                                 *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_bist_regs
{
	CONTROL_VERSION = 0,
    CONTROL_PRESENT,
	CONTROL_CLKENABLE,
	CONTROL_UPDATE,
    CONTROL_SDRAM_PAGE,
	REG_PIO_IN,
	REG_PIO_OUT,
	REG_I2C,
	REG_SDRAM_BASE
}SDJTAGEX_BIST_REGS,*PSDJTAGEX_BIST_REGS;

/*----------------------------------------------------------------------------*
 *                                                                            *
 * BIST_CHANNEL_REG_BITS - BIST Channel Register Bits                         *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef enum sdjtagex_bist_channel_reg_bits
{
    BIT_0 = 0,
    BIT_1,
	BIT_2,
	BIT_3,
	BIT_4,
	BIT_5,
	BIT_6,
	BIT_7,
	BIT_8,
	BIT_9,
	BIT_10,
	BIT_11,
	BIT_12,
	BIT_13,
	BIT_14,
	BIT_15
}SDJTAGEX_BIST_CHANNEL_REG_BITS,*PSDJTAGEX_BIST_CHANNEL_REG_BITS;

/*-------------------------------------------------------------------------------*
*                                                                                *
* BIST CHANNEL UPDATE AND CAPTURE MASKS .                                        *
*                                                                                *
*--------------------------------------------------------------------------------*/
#define SDJTAGEX_BIST_UPDATE_CHANNELA           0x0001
#define SDJTAGEX_BIST_UPDATE_CHANNELB           0x0002 
#define SDJTAGEX_BIST_UPDATE_CHANNELC           0x0004
#define SDJTAGEX_BIST_UPDATE_CHANNELD           0x0008 

#define SDJTAGEX_BIST_CAPTURE_CHANNELA          0x0010
#define SDJTAGEX_BIST_CAPTURE_CHANNELB          0x0020 
#define SDJTAGEX_BIST_CAPTURE_CHANNELC          0x0040
#define SDJTAGEX_BIST_CAPTURE_CHANNELD          0x0080

/*----------------------------------------------------------------------------*
 *                                                                            *
 * BIST_CHANNEL_PLAY Structure                                                *
 *                                                                            *
 *----------------------------------------------------------------------------*/
typedef struct sdjtag_bist_channel_play
{
    unsigned short ControlWord;         // Address of the register to read.
	unsigned short DataValue;           // DataValue

}SDJTAGEX_BIST_CHANNEL_PLAY, *PSDJTAGEX_BIST_CHANNEL_PLAY;

#define SDJTAGEX_BIST_CTLREG_ADDRESS_MASK    0x1000
#define SDJTAGEX_BIST_CHANNEL_ADDRESS_MASK   0x2000
#define SDJTAGEX_BIST_READ_FLAG              0x8000
#define SDJTAGEX_BIST_WRITE_FLAG             0x0000  

/*----------------------------------------------------------------------------*
 *                                                                            *
 * SDJTAGEX_MAKE_WRITE_CHANNEL_CTLWORD - Macro to make a write channel control* 
 *                                       word to write to the BIST channel    *
 *                                       regs.                                *
 *                                                                            *
 * SDJTAGEX_MAKE_READ_CHANNEL_CTLWORD - Macro to make a read channel control  * 
 *                                      word to read from the BIST channel    *
 *                                      regs.                                 *
 *                                                                            *
 * SDJTAGEX_MAKE_WRITE_CTLREG_CTLWORD - Macro to make a write control word to * 
 *                                      write to the BIST control regs.       *
 *                                                                            *
 * SDJTAGEX_MAKE_READ_CTLREG_CTLWORD - Macro to make a read control word to   * 
 *                                     read from the BIST control regs.       *
 *                                                                            *
 *----------------------------------------------------------------------------*/
#define SDJTAGEX_MAKE_WRITE_CHANNEL_CTLWORD(Channel,Reg) ( SDJTAGEX_BIST_CHANNEL_ADDRESS_MASK \
                                                         | SDJTAGEX_BIST_WRITE_FLAG   \
                                                         |((Channel*2)<<4) \
                                                         | Reg)

#define SDJTAGEX_MAKE_READ_CHANNEL_CTLWORD(Channel,Reg) ( SDJTAGEX_BIST_CHANNEL_ADDRESS_MASK \
                                                        | SDJTAGEX_BIST_READ_FLAG   \
                                                        |((Channel*2)<<4) \
                                                        | Reg)

#define SDJTAGEX_MAKE_WRITE_CTLREG_CTLWORD(Reg) ( SDJTAGEX_BIST_CTLREG_ADDRESS_MASK \
                                                | SDJTAGEX_BIST_WRITE_FLAG \
                                                | Reg)

#define SDJTAGEX_MAKE_READ_CTLREG_CTLWORD(Reg) ( SDJTAGEX_BIST_CTLREG_ADDRESS_MASK \
                                               | SDJTAGEX_BIST_READ_FLAG \
                                               | Reg)

#define SDJTAGEX_BIST_EXTRACT_CHANNEL(ControlWord)       ((ControlWord & 0x00F0)>>5)

#define SDJTAGEX_BIST_EXTRACT_REGISTER(ControlWord)       (ControlWord & 0x000F)

/*--------------END OF BIST DEFINITIONS-------------------------------------------------*/

#if defined(_WIN32) || defined(_POSIX)
/*F***************************************************************************
* NAME:  SDJTAGEX_BitIoPinSet
*
* DESCRIPTION: Set the state of the BitIO pins emu0,emu1,emu3 or emu4 
*              to pinlow,pinhigh or pinz.
*     
* INPUTS:
*   SDJTAG_HNDL            Hndl       Session handle
*   SDJTAG_DEV_ID          DevId      A target device ID which is used by 
*                                     emulation drivers to find a given device
*                                     in the scan chain. 
*   SDJTAGEX_BIO_PIN_NAME  Pin        Name of the BITIO Pin 
*   SDJTAGEX_PIN_STATE     State      State of the BITIO Pin 
*
* OUTPUTS:
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR
SDJTAGEX_BitIoPinSet( SDJTAG_HNDL           Hndl, 
                      SDJTAG_DEV_ID         DevId, 
                      SDJTAGEX_BIO_PIN_NAME Pin, 
                      SDJTAGEX_PIN_STATE    State );

/*F***************************************************************************
* NAME:  SDJTAGEX_BitIoPinGet
*
* DESCRIPTION:Get the state of the BitIO pins emu0,emu1,emu3 or emu4 as pinlow 
*             or pinhigh. 
*     
* INPUTS:
*   SDJTAG_HNDL            Hndl       Session handle
*   SDJTAG_DEV_ID          DevId      A target device ID which is used by 
*                                     emulation drivers to find a given device
*                                     in the scan chain. 
*   SDJTAGEX_BIO_PIN_NAME  Pin        Name of the BITIO Pin 
*   SDJTAGEX_PIN_STATE     *pState    pointer to the state of the BITIO Pin 
*                                     returned
* OUTPUTS:
*   SDJTAGEX_PIN_STATE     State      State of the BITIO Pin returned 
*
* NOTES: The State of the return value cannot be pinz. 
*
* *F***************************************************************************/ 

SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_BitIoPinGet( SDJTAG_HNDL             Hndl, 
                      SDJTAG_DEV_ID           DevId, 
                      SDJTAGEX_BIO_PIN_NAME   Pin, 
                      SDJTAGEX_PIN_STATE    * pState );

/*F***************************************************************************
* NAME:  SDJTAGEX_TckConfigure
*
* DESCRIPTION: Configure the operating mode for TCK.Doesn't turn the clock on.  
*     
* INPUTS:
*   SDJTAG_HNDL             Hndl       Session handle
*   SDJTAG_DEV_ID           DevId      A target device ID which is used by 
*                                      emulation drivers to find a given device
*                                      in the scan chain. 
*   SDJTAGEX_JCLK_MODE      ClkMode    JTAG Clock Mode to be set for TCK.   
*   SDJTAGEX_JCLK_SOURCE    ClkSource  JTAG Clock Source    
*   DWORD                   FreqHz     Frequency in Hertz.
*
* OUTPUTS:
*
* NOTES: In emulation mode,the TCK source is the TCK return value.In boundary 
*        scan mode,the TCK source is an internal loopback.
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_TckConfigure( SDJTAG_HNDL          Hndl, 
                       SDJTAG_DEV_ID        DevId, 
                       SDJTAGEX_JCLK_MODE   ClkMode,
                       SDJTAGEX_JCLK_SOURCE ClkSource,
                       DWORD                FreqHz );

/*F***************************************************************************
* NAME:  SDJTAGEX_TckOn
*
* DESCRIPTION: Turn on the TCK
*     
* INPUTS:
*   SDJTAG_HNDL            Hndl       Session handle
*   SDJTAG_DEV_ID          DevId      A target device ID which is used by 
*                                     emulation drivers to find a given device
*                                     in the scan chain. 
*
* OUTPUTS:
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_TckOn( SDJTAG_HNDL   Hndl, 
                SDJTAG_DEV_ID DevId);

/*F***************************************************************************
* NAME:  SDJTAGEX_TckOff
*
* DESCRIPTION: Turn off the TCK
*     
* INPUTS:
*   SDJTAG_HNDL            Hndl       Session handle
*   SDJTAG_DEV_ID          DevId      A target device ID which is used by 
*                                     emulation drivers to find a given device
*                                     in the scan chain. 
*
* OUTPUTS:
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_TckOff( SDJTAG_HNDL   Hndl, 
                 SDJTAG_DEV_ID DevId);

/*F***************************************************************************
* NAME:  SDJTAGEX_LowPowerMode
*
* DESCRIPTION: Turn off the clock and set to lower power mode.
*     
* INPUTS:
*   SDJTAG_HNDL            Hndl       Session handle
*   SDJTAG_DEV_ID          DevId      A target device ID which is used by 
*                                     emulation drivers to find a given device
*                                     in the scan chain. 
*
* OUTPUTS:
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_LowPowerMode( SDJTAG_HNDL   Hndl, 
                       SDJTAG_DEV_ID DevId);

/*F***************************************************************************
* NAME:  SDJTAGEX_PowDetConfigure
*
* DESCRIPTION: Configure power detection.
*
* INPUTS:
*   SDJTAG_HNDL                  Hndl        Session handle.
*   SDJTAG_DEV_ID                DevId       A target device ID which is used by 
*                                            emulation drivers to find a given device
*                                            in the scan chain. 
*   SDJTAGEX_MODE_SELECT         PwmMode     PWM Enable. 
*                                            PWM Disable. 
*   SDJTAGEX_MODE_SELECT         PowDetMode  Power Detect Enable.
*                                            Power Detect Disable.  
*   SDJTAGEX_POWER_DET_THRESHOLD Threshold   Low limit(1.09V threshold) - PDM_LOW.
*                                            High limit(2.04V threshold) - PDM_DEFAULT.
*
* OUTPUTS:
*
* NOTES:When power detection is enabled the target power is sensed and the 
*        JTAG input/output buffers will track the user TPLD pin.  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_PowDetConfigure( SDJTAG_HNDL                    Hndl, 
                          SDJTAG_DEV_ID                  DevId, 
                          SDJTAGEX_MODE_SELECT           PwmMode, 
                          SDJTAGEX_MODE_SELECT           PowDetMode, 
                          SDJTAGEX_POWER_DET_THRESHOLD   Threshold );

/*F***************************************************************************
* NAME:  SDJTAGEX_ClearPowerLoss
*
* DESCRIPTION: Writes to latched power loss bits.  If power levels are valid
*              then bits will be cleard and the TPLD will be de-asserted.
*     
* INPUTS:
*   SDJTAG_HNDL            Hndl       Session handle
*   SDJTAG_DEV_ID          DevId      A target device ID which is used by 
*                                     emulation drivers to find a given device
*                                     in the scan chain. 
*
*
* OUTPUTS:
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_ClearPowerLoss( SDJTAG_HNDL   Hndl, 
                         SDJTAG_DEV_ID DevId);

/*F***************************************************************************
* NAME:  SDJTAGEX_SetPowerLoss
*
* DESCRIPTION: Set the power loss bits to simulate a power loss.
*     
* INPUTS:
*   SDJTAG_HNDL            Hndl       Session handle
*   SDJTAG_DEV_ID          DevId      A target device ID which is used by 
*                                     emulation drivers to find a given device
*                                     in the scan chain. 
*
*
* OUTPUTS:
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_SetPowerLoss( SDJTAG_HNDL   Hndl, 
                       SDJTAG_DEV_ID DevId);

/*F***************************************************************************
* NAME:  SDJTAGEX_JtagBitIoConfigure
*
* DESCRIPTION:Configure the JTAG pins for bitio or eZemu mode. 
*     
* INPUTS:
*   SDJTAG_HNDL            Hndl       Session handle
*   SDJTAG_DEV_ID          DevId      A target device ID which is used by 
*                                     emulation drivers to find a given device
*                                     in the scan chain. 
*
*   SDJTAGEX_MODE_SELECT   BitIOMode  ENABLE  - BITIO    Mode
*                                     DISABLE - Emulator Mode
* 
* OUTPUTS:
*
* NOTES:The TCK mode should be set prior to calling this function and probably
*        best to reset the Emulator block.  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_JtagBitIoConfigure( SDJTAG_HNDL           Hndl, 
                             SDJTAG_DEV_ID         DevId,
                             SDJTAGEX_MODE_SELECT  BitIOMode );

/*F***************************************************************************
* NAME:  SDJTAGEX_JtagBitIoSetPin
*
* DESCRIPTION: Set a JTAG pin via bitio to pinhigh or pinlow.
*     
* INPUTS:
*   SDJTAG_HNDL             Hndl       Session handle
*   SDJTAG_DEV_ID           DevId      A target device ID which is used by 
*                                      emulation drivers to find a given device
*                                      in the scan chain. 
*
*   SDJTAGEX_JBIO_PIN_NAME  Pin        Name of the JTAG pin to be set
*   SDJTAGEX_PIN_STATE      State      State of the JTAG pin to be set
*
* OUTPUTS:
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_JtagBitIoSetPin( SDJTAG_HNDL            Hndl, 
                          SDJTAG_DEV_ID          DevId, 
                          SDJTAGEX_JBIO_PIN_NAME Pin,
                          SDJTAGEX_PIN_STATE     State );

/*F***************************************************************************
* NAME:  SDJTAGEX_JtagBitIoGetPin
*
* DESCRIPTION: Get a JTAG pin via bitio as pinlow or pinhigh.
*     
* INPUTS:
*   SDJTAG_HNDL              Hndl       Session handle
*   SDJTAG_DEV_ID            DevId      A target device ID which is used by 
*                                       emulation drivers to find a given device
*                                       in the scan chain. 
*
*   SDJTAGEX_JBIO_PIN_NAME   Pin        Name of the JTAG pin 
*   SDJTAGEX_PIN_STATE      *pState     pointer to the state of the JTAG Pin 
*                                       returned
*
* OUTPUTS:
*   SDJTAGEX_PIN_STATE       State       State of the JTAG Pin returned
*                                        
* NOTES: 
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_JtagBitIoGetPin( SDJTAG_HNDL             Hndl, 
                          SDJTAG_DEV_ID           DevId, 
                          SDJTAGEX_JBIO_PIN_NAME  Pin,
                          SDJTAGEX_PIN_STATE     *pState );

/*F***************************************************************************
* NAME:  SDJTAGEX_JtagBitIoPlay
*
* DESCRIPTION:Play a pin file/buffer. 
*     
* INPUTS:
*   SDJTAG_HNDL          Hndl        Session handle
*   SDJTAG_DEV_ID        DevId       A target device ID which is used by 
*                                    emulation drivers to find a given device
*                                    in the scan chain. 
*
*   SDJTAGEX_JBIO_PLAY   Count       Count of BITIO words to play with.    
*
*   SDJTAGEX_JBIO_PLAY * pIn         Pointer to the JTAG pins in pin buffer created with:
*                                    SDJTAGEX_MAKE_JTAG_VECTOR( ptrst,ptms,ptdo,ptck )        
*
*   SDJTAGEX_JBIO_PLAY * pOut        Pointer to the JTAG pins out pin buffer with ptdi
*                                    extracted with SDJTAGEX_EXTRACT_JTAG_TDI(x)
*
* OUTPUTS:
*   SDJTAGEX_JBIO_PLAY * pOut        JTAG pins out pin buffer with ptdi
*                                    extracted with SDJTAGEX_EXTRACT_JTAG_TDI(x)
*
* NOTES:
*   The input buffer for Jtag Bit IO Play is created with the macro 
*   SDJTAGEX_MAKE_JTAG_VECTOR( ptrst,ptms,ptdo,ptck ) as defined above.
*   
*   The JTAG TDI values are extracted from the output buffer with the macro
*   SDJTAGEX_EXTRACT_JTAG_TDI(x) also defined above.
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_JtagBitIoPlay( SDJTAG_HNDL          Hndl, 
                        SDJTAG_DEV_ID        DevId,
                        SDJTAGEX_JBIO_PLAY   Count,
                        SDJTAGEX_JBIO_PLAY * pIn,
                        SDJTAGEX_JBIO_PLAY * pOut );

/*F***************************************************************************
* NAME:  SDJTAGEX_SetConfigParameter
*
* DESCRIPTION: Set a config parameter.
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl       Session handle
*   SDJTAG_DEV_ID               DevId      A target device ID which is used by 
*                                          emulation drivers to find a given device
*                                          in the scan chain. 
*   SDJTAGEX_CONFIG_PARAMETER   Config     Name of the config parameter to be set
*   DWORD                       Parameter  Value of the config parameter to be set
*
* OUTPUTS:
*
* NOTES: The config parameters in the SDJTAGEX_CONFIG_PARAMETER enum structure are 
*        equivalent to the parameters that can be set from SdConfigEx which use the 
*        sdopts.cfg file to store emulator options.All options may also be configured 
*        manually directly in sdopts.cfg file which is located in the 
*        windows\system32 directory.   
* 
* Parameter               : PARM_EMUPORTFLAGS
* sdjtagex ValidOptions   : SDJTAGEX_PFLAGS_ALT_TIMING ,SDJTAGEX_PFLAGS_RESET_TRG,
*                           SDJTAGEX_PFLAGS_PULSE_TRST,SDJTAGEX_PFLAGS_EMUIO_OFF_AT_EXIT,
*                           SDJTAGEX_PFLAGS_EMUIO_OFF_AT_DISCONNECT
*
* PARM_EMUPORTFLAGS OPTION: SDJTAGEX_PFLAGS_ALT_TIMING
* sdopts Parameter        : EmuAltTckTiming
* Description             : By selecting this option the TMS and TDI are driven from 
*                           the rising edge of TCK.
* SDJTAGEX Valid Values   : SDJTAGEX_PFLAGS_ALT_TIMING
* sdopts Valid Values     : YES,NO
* sdopts Default Value    : NO
*
* PARM_EMUPORTFLAGS OPTION: SDJTAGEX_PFLAGS_RESET_TRG
* sdopts Parameter        : EmuAssertSysReset
* Description             : This option is only available when a CTI-20 pin cable is used, 
*                           i.e. primarily for DaVinici target systems.
* SDJTAGEX Valid Values   : SDJTAGEX_PFLAGS_RESET_TRG
* sdopts Valid Values     : YES,NO
* sdopts Default Value    : NO
*
* PARM_EMUPORTFLAGS OPTION: SDJTAGEX_PFLAGS_PULSE_TRST
* sdopts Parameter        : EmuPulseTrst
* Description             : When selected the TRSTn pin will be pulsed high-low-high 
*                           during emulation startup.
* SDJTAGEX Valid Values   : SDJTAGEX_PFLAGS_PULSE_TRST
* sdopts Valid Values     : YES,NO
* sdopts Default Value    : NO
*
* PARM_EMUPORTFLAGS OPTION: SDJTAGEX_PFLAGS_EMUIO_OFF_AT_EXIT
* sdopts Parameter        : EmuIoOffAtExit
* Description             : When checked the XDS510USB class emulators will turn off 
*                           the JTAG backend when an emulation session is not active.
* SDJTAGEX Valid Values   : SDJTAGEX_PFLAGS_EMUIO_OFF_AT_EXIT
* sdopts Valid Values     : YES,NO
* sdopts Default Value    : YES
*
* PARM_EMUPORTFLAGS OPTION: SDJTAGEX_PFLAGS_EMUIO_OFF_AT_DISCONNECT
* sdopts Parameter        : EmuIoOffAtDisconnect
* Description             : Reserved for future use to selectively distinguish between 
*                           a CCS exit and a CCS disconnect.
* SDJTAGEX Valid Values   : SDJTAGEX_PFLAGS_EMUIO_OFF_AT_DISCONNECT
* sdopts Valid Values     : YES,NO
* sdopts Default Value    : YES
*
* Parameter               : PARM_EMUTCKDIV
* sdopts Parameter        : EmuTckDiv
* Description             : Divide JTAG clock source by N.
* SDJTAGEX Valid Values   : 1 - 12 
* sdopts Valid Values     : 1 - 12
* sdopts Default Value    : 1
* 
* Parameter               : PARM_PORTSPEED
* sdopts Parameter        : EmuPortSpeed
* Description             : Emulator port speed (0-fastest 100-slowest)
* SDJTAGEX Valid Values   : 0 - 32768 
* sdopts Valid Values     : 0 - 32768
* sdopts Default Value    : 0
* 
* Parameter               : PARM_JCLKMODE
* sdopts Parameter        : EmuJclkMode
* Description             : The TCK mode defines how the emulator will generate 
*                           the TCK to the target.
* SDJTAGEX Valid Values   : COUNTER,ADAPTIVE,ADAPTIVE_FAST,BITIO,EXTBITIO
* sdopts Valid Values     : COUNTER,ADAPTIVE,ADAPTIVE_FAST
* sdopts Default Value    : COUNTER
* 
* Parameter               : PARM_JCLKFREQHZ
* sdopts Parameter        : EmuJclkFreqMHz
* Description             : The TCK Frequency parameter sets the TCK frequency 
*                           when in TCK-Counter mode
* SDJTAGEX Valid Values   : 1000000 - 32000000 
* sdopts Valid Values     : 1 - 32
* sdopts Default Value    : 13
* 
* Parameter               : PARM_POWERMODE
* sdopts Parameter        : EmuPowerMode
* Description             : Target Power Detect Threshold
* SDJTAGEX Valid Values   : PDM_DEFAULT,PDM_LOW,PDM_PWM 
* sdopts Valid Values     : Threshold_1Volt_IO,Threshold_3Volt_IO
* sdopts Default Value    : Threshold_1Volt_IO
* 
* Parameter               : PARM_MAXWAITTIME
* Description             : This is a get only parameter.
*                           SPECTRUM DIGITAL INTERNAL USE ONLY
* 
* Parameter               : PARM_NOPTIME
* Description             : This is a get only parameter.
*                           SPECTRUM DIGITAL INTERNAL USE ONLY
* 
* Parameter               : PARM_EMU0PINLEVEL
* sdopts Parameter        : Emu0PinLevel
* Description             : This parameter allows you to set the state of the 
*                           EMU0 pin when the JTAG backend becomes active.
* SDJTAGEX Valid Values   : PINLOW,PINHIGH,PINZ          
* sdopts Valid Values     : HIGH,LOW,HIZ
* sdopts Default Value    : HIZ
* 
* Parameter               : PARM_EMU1PINLEVEL
* sdopts Parameter        : Emu1PinLevel
* Description             : This parameter allows you to set the state of the 
*                           EMU1 pin when the JTAG backend becomes active.
* SDJTAGEX Valid Values   : PINLOW,PINHIGH,PINZ          
* sdopts Valid Values     : HIGH,LOW,HIZ
* sdopts Default Value    : HIZ
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_SetConfigParameter( SDJTAG_HNDL               Hndl, 
                             SDJTAG_DEV_ID             DevId,
                             SDJTAGEX_CONFIG_PARAMETER Config,
                             DWORD                     Parameter );


/*F***************************************************************************
* NAME:  SDJTAGEX_GetConfigParmater
*
* DESCRIPTION: Get a config parameter
*     
* INPUTS:
*   SDJTAG_HNDL                Hndl        Session handle
*   SDJTAG_DEV_ID              DevId       A target device ID which is used by 
*                                          emulation drivers to find a given device
*                                          in the scan chain. 
*   SDJTAGEX_CONFIG_PARAMETER  Config      Name of the config parameter to be 
*                                          returned
*   DWORD                     *pParameter  pointer to the value of the config  
*                                          parameter to be returned
*
* OUTPUTS:
*   DWORD                      Parameter   Value of the config parameter to be 
*                                          returned. 
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAGEX_GetConfigParameter( SDJTAG_HNDL                Hndl, 
                             SDJTAG_DEV_ID              DevId,
                             SDJTAGEX_CONFIG_PARAMETER  Config,
                             DWORD                     *pParameter);




/*F***************************************************************************
* NAME:  SDJTAGEX_ScanIrIn, SDJTAGEX_ScanDrIn
*
* DESCRIPTION:  Scan N bits into the target device. Ir/Dr scan 
*               specify which JTAG path to address.
*     
* INPUTS:
*   SDJTAG_HNDL       Hndl          Session handle
*
*   SDJTAG_DEV_ID     RetDevId      A target device ID which is used by 
*                                   emulation drivers to find a given device
*                                   in the scan chain. 
*   SDJTAG_SCAN    *  pArgs         Pointer to scan arguments
*      SDJTAG_STATE   EndState      JTAG terminal state
*       VCT_POINTER   pXmit         Pointer xmit vect buffer 
*       DWORD         NumIntrBits   Number of interest bits to scan
*
* OUTPUTS:
*       VCT_POINTER   Recv[]        Recieve buffer data
* NOTES:  
*        The EndState must be one of the predefined JTAG stable states.
* 
*        If a VCT_POINTER is NULL then an error is returned.
*
*        The scan chain bit ordering follows the convention:
*
*        TDI->MSBits....LSBits->TDO  
*        or
*        
*        Bit #  |Byte3|Byte2 |Byte1 |Byte0
*          TDI->33..2 22..11 11...0 00..00->TDO
*               10..4 32..76 54   8 76..10
*
*        So for a scan  of 17 bits, bits 18..31 are undefined for both
*        input and output.  When doing buffer comparisons be carefull to
*        mask the undefined bits.
*
*        These two functions are optimized for boundary scan operations.
*        The function returns success once the operation has been initiated.
*        Using this operation for send or scan in only operations can
*        significantly improve many boundary scan operations.
*     
*F***************************************************************************/  
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_ScanIrIn( SDJTAG_HNDL      Hndl,  
                   SDJTAG_DEV_ID    DevId,  
                   SDJTAG_SCAN    * pArgs);

SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_ScanDrIn( SDJTAG_HNDL      Hndl,  
                   SDJTAG_DEV_ID    DevId,  
                   SDJTAG_SCAN    * pArgs);

#if defined(SDJTAGEXL)

/*F***************************************************************************
* NAME:  SDJTAGEX_ScanIrDrEx
*
* DESCRIPTION:  Scan N bits into the target device. Ir/Dr scan 
*               specify which JTAG path to address.  For use with TI JSC only.
*     
* INPUTS:
*   SDJTAG_HNDL       Hndl          Session handle
*
*   SDJTAG_DEV_ID     RetDevId      A target device ID which is used by 
*                                   emulation drivers to find a given device
*                                   in the scan chain. 
*   SDJTAG_SCANEX  *  pArgs         Pointer to scan arguments
*      SDJTAG_STATE   EndState      JTAG terminal state
*       VCT_POINTER   pXmit         Pointer xmit vect buffer
*       VCT_POINTER   pRecv         Pointer recv vect buffer 
*       DWORD         NumIntrBits   Number of interest bits to scan
*       DWORD         NumPreBits    Number of preamble bits to scan
*       DWORD         NumPostBits   Number of postamble bits to scan
*       DWORD         OpFlags       Operation flags
*       DWORD         LoopCount     Number of times to repeat the operation
* OUTPUTS:
*       VCT_POINTER   Recv[]        Recieve buffer data
* NOTES:  
*       This is a custom function to support TI JSC interface and should
*         only be called by sdemujsc.dll.
*
*F***************************************************************************/  


SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_ScanIrDrEx( SDJTAG_HNDL      Hndl,  
                     SDJTAG_DEV_ID    DevId,  
                     SDJTAG_SCANEX  * pArgs);

SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_ScanIrDrEx2( SDJTAG_HNDL      Hndl,  
                      SDJTAG_DEV_ID    DevId,  
                      SDJTAG_SCANEX  * pArgs);
#endif

/*--------------------BIST FUNCTIONS ---------------------------------------------*/
#if !defined(SDJTAGEXL)
/*F***************************************************************************
* NAME:  SDJTAGEX_BISTInit
*
* DESCRIPTION: Intialize the BIST Channel
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTInit( SDJTAG_HNDL		Hndl,  
                   SDJTAG_DEV_ID    DevId);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTRegRead
*
* DESCRIPTION: Read a Register value from the BIST.
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
*                                           in the scan chain. 
*   
*   int                         Register    Name of the register   
*
*   unsigned short             *pRegValue   pointer to the value of the register  
*                                           to be returned
*
* OUTPUTS:
*   VCT_BUF                      RegValue   Value of the register to be 
*                                           returned. 
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTRegRead( SDJTAG_HNDL			Hndl,  
                      SDJTAG_DEV_ID			DevId,
					  SDJTAGEX_BIST_REGS    Register,
					  unsigned short       *pRegValue);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTRegWrite
*
* DESCRIPTION:Write a value to the BIST register. 
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
*                                           in the scan chain. 
*   
*   int                         Register    Name of the register   
*
*   unsigned short              RegValue    value of the register  
*                                           to be written
*
* OUTPUTS:
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTRegWrite( SDJTAG_HNDL			Hndl,  
                       SDJTAG_DEV_ID		DevId,
					   SDJTAGEX_BIST_REGS   Register,
					   unsigned short		RegValue);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTChannelRead
*
* DESCRIPTION: Read a Channel Register value from BIST
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
*                                           in the scan chain. 
*   SDJTAGEX_BIST_CHANNEL_NAME  Channel     Channel name to read
*   
*   SDJTAGEX_BIST_CHANNEL_REGS  Register    Name of the channel register   
*
*   VCT_BUF                     *pRegValue   pointer to the value of the register  
*                                           to be returned
*
* OUTPUTS:
*   VCT_BUF                      RegValue   Value of the register to be 
*                                           returned. 
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTChannelRead( SDJTAG_HNDL                 Hndl,  
                          SDJTAG_DEV_ID               DevId,
						  SDJTAGEX_BIST_CHANNEL_NAME  Channel,
						  SDJTAGEX_BIST_CHANNEL_REGS  Register,
						  unsigned short             *pRegValue);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTChannelWrite
*
* DESCRIPTION:Write a value to the BIST Channel register. 
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
*                                           in the scan chain. 
*   SDJTAGEX_BIST_CHANNEL_NAME  Channel     Channel name to read
*   
*   SDJTAGEX_BIST_CHANNEL_REGS  Register    Name of the channel register   
*
*   VCT_BUF                     RegValue    value of the register  
*                                           to be written
*
* OUTPUTS:
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTChannelWrite( SDJTAG_HNDL                 Hndl,  
                           SDJTAG_DEV_ID               DevId,
						   SDJTAGEX_BIST_CHANNEL_NAME  Channel,
						   SDJTAGEX_BIST_CHANNEL_REGS  Register,
						   unsigned short              RegValue);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTChannelReadBit
*
* DESCRIPTION:Read a specified bit from the BIST Channel Register. 
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
*                                           in the scan chain. 
*   SDJTAGEX_BIST_CHANNEL_NAME  Channel     Channel name to read
*   
*   SDJTAGEX_BIST_CHANNEL_REGS  Register    Name of the channel register   
*
*	SDJTAGEX_BIST_CHANNEL_REG_BITS  BitToRead  Bit field to read from.
*
*   SDJTAGEX_PIN_STATE             *pBitValue  pointer to the value of the bit to be
*                                              returned.
*
* OUTPUTS:
*   SDJTAGEX_PIN_STATE             BitValue    value of the bit returned.
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTChannelReadBit( SDJTAG_HNDL                     Hndl,  
                             SDJTAG_DEV_ID                   DevId,
						     SDJTAGEX_BIST_CHANNEL_NAME      Channel,
						     SDJTAGEX_BIST_CHANNEL_REGS      Register,
						     SDJTAGEX_BIST_CHANNEL_REG_BITS  BitToRead,
							 SDJTAGEX_PIN_STATE             *pBitValue);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTChannelWriteBit
*
* DESCRIPTION:Write to specified bit of the BIST Channel Register. 
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
*                                           in the scan chain. 
*   SDJTAGEX_BIST_CHANNEL_NAME  Channel     Channel name to read
*   
*   SDJTAGEX_BIST_CHANNEL_REGS  Register    Name of the channel register   
*
*	SDJTAGEX_BIST_CHANNEL_REG_BITS  BitToWrite  Bit field to write to.
*
*   SDJTAGEX_PIN_STATE             BitValue  The value of the bit to write to.
*
* OUTPUTS:
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTChannelWriteBit( SDJTAG_HNDL                     Hndl,  
                              SDJTAG_DEV_ID                   DevId,
						      SDJTAGEX_BIST_CHANNEL_NAME      Channel,
						      SDJTAGEX_BIST_CHANNEL_REGS      Register,
						      SDJTAGEX_BIST_CHANNEL_REG_BITS  BitToWrite,
							  SDJTAGEX_PIN_STATE              BitValue);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTChannelUpdateAndCapture
*
* DESCRIPTION: Global update of output bits and capture of input bits.
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
*   unsigned short              ChannelMask	Mask of the channel to be updated and captured
*            
*
* NOTES:The FPGA ensures that the capture of inputs occurs ahead of the
*        update. The Channel mask can be 
* (SDJTAGEX_BIST_UPDATE_CHANNELx | SDJTAGEX_BIST_CAPTURE_CHANNELx)  - for update and capture.
* SDJTAGEX_BIST_UPDATE_CHANNELx                                     - for update only.
* SDJTAGEX_BIST_CAPTURE_CHANNELx                                    - for capture only.
* where x - A,B,C or D depending on the channel to be updated or captured.
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTChannelUpdateAndCapture( SDJTAG_HNDL		Hndl,  
                                       SDJTAG_DEV_ID    DevId,
									   unsigned short   ChannelMask);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTChannelClockEnable
*
* DESCRIPTION: Enable the update and capture clocks based on the channelmask 
*              specified.
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle.
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device.
*   unsigned short              ChannelMask	Mask of the channel whose clock is to be 
*                                           updated and captured.
*
* NOTES:  The Channel mask can be 
* (SDJTAGEX_BIST_UPDATE_CHANNELx | SDJTAGEX_BIST_CAPTURE_CHANNELx)  - for update and capture.
* SDJTAGEX_BIST_UPDATE_CHANNELx                                     - for update only.
* SDJTAGEX_BIST_CAPTURE_CHANNELx                                    - for capture only.
* where x - A,B,C or D depending on the channel to be updated or captured. 
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTChannelClockEnable( SDJTAG_HNDL	  Hndl,  
                                 SDJTAG_DEV_ID    DevId,
							     unsigned short   ChannelMask);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTChannelPresent
*
* DESCRIPTION: Test if channel is present.
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
*   unsigned short            * pIsPresent  pointer to the value to be returned.
*
* OUTPUTS:
*   unsigned short              IsPresent   Bit indicating if channel is present or not. 
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTChannelPresent( SDJTAG_HNDL	  Hndl,  
                             SDJTAG_DEV_ID    DevId,
							 unsigned short  *pIsPresent);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTChannelPlay
*
* DESCRIPTION:Play the Channels on the BIST. 
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
*                                           in the scan chain. 
*   SDJTAGEX_BIST_CHANNEL_PLAY  * pInput    Pointer to the channel play input buffer.
*   
*   SDJTAGEX_BIST_CHANNEL_PLAY  * pOutput   Pointer to the channel play output buffer.   
*
*	VCT_BUF                       InCount   Count of the Input buffer words to play 
*                                           with.
*
*   VCT_BUF                     * OutCount  Pointer to the output count to be returned.   
*
* OUTPUTS:
*
*   VCT_BUF                       OutCount  Output count returned.   
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTChannelPlay( SDJTAG_HNDL                     Hndl,  
                          SDJTAG_DEV_ID                   DevId,
						  SDJTAGEX_BIST_CHANNEL_PLAY    * pInput,
						  SDJTAGEX_BIST_CHANNEL_PLAY    * pOutput,
						  unsigned short                  InCount,
						  unsigned short                * pOutCount);

/*F***************************************************************************
* NAME:  SDJTAGEX_BISTADCRead
*
* DESCRIPTION:Read the  
*     
* INPUTS:
*   SDJTAG_HNDL                 Hndl        Session handle
*   SDJTAG_DEV_ID               DevId       A target device ID which is used by 
*                                           emulation drivers to find a given device
*                                           in the scan chain. 
*   unsigned short            * pADCData    Pointer to ADC Data to be returned .
*
* OUTPUTS:
*   unsigned short            * pADCData    ADC Channel Value to be returned.
*
* NOTES:  
*
* *F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAGEX_BISTADCRead( SDJTAG_HNDL       Hndl,  
                      SDJTAG_DEV_ID     DevId,
					  unsigned short  * pADCData);

#endif
/*--------------------END OF BIST FUNCTIONS ---------------------------------------------*/


#endif

#ifdef __cplusplus
}
#endif

#endif /* sdjtagex_h ---- END OF FILE ----------------------------------------*/

