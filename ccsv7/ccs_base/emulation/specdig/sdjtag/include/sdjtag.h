/*H***************************************************************************
*
* $Archive:: /TI/product/ticcsv42/SdJtag/include/sdjtag.h                    $
* $Revision:: 14                                                             $
* $Date:: 3/17/11 2:57p                                                      $
* $Author:: Tonyc                                                            $
*
* DESCRIPTION: Interface file for sdjtag.dll, sdjtag.lib.  This interface
*              is a thin layer around standard SD emulation drivers.
*
* USAGE/LIMITATIONS: To be used with following SD emulators
*                    XDS510PP, XDS510PP_PLUS, SPI510, XDS510, SPI525
*                    SPI515, XDS510USB
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
* (C) Copyright 1999-2003 by Spectrum Digital Incorporated
* All rights reserved
*
*H***************************************************************************/

#ifndef sdjtag_h
#define sdjtag_h

/*---- compilation control switches ----------------------------------------*/

/*****************************************************************************
* INCLUDE FILES (minimize nesting of header files)
*****************************************************************************/
#ifdef _WIN32
    #if (_MSC_VER >= 900 )
       #define	WIN32_LEAN_AND_MEAN
       #define 	INC_OLE2
       #define	NOSERVICE
    #endif 

    #include <windows.h>
    #include <string.h>
    #include <stdio.h>
#endif

#ifdef _POSIX
	#include "platform.h"
#endif

#ifdef __cplusplus
extern "C" {
#endif
/*---- system and platform files -------------------------------------------*/

/*---- program files -------------------------------------------------------*/
/*****************************************************************************
* FILE CONTENT
*****************************************************************************/
/*-- Define current interface version and revision. ------------------------*/
// **************************************************************************
// V2:R0 Changes:
// Added function  SDJTAG_GetScanChainInfoEx()
// Added structure SDJTAG_SCAN_INFO_EX
// This addition supports router based devices like omap2420 dm420 etc which
//  include the icepick module.
//
// V2:R3
// Fixed bug in SDJTAG_ScanIr() and SDJTAG_ScanDr() where they were returning
// one extra VCT_BUF (garbage) value when the scan count was exactly modulo 16.
// This was simply a vector copy problem and did not effect actual scan in
// or scan out values.
//
// *************************************************************************
#define SDJTAG_INTERFACE_VERSION           2
#define SDJTAG_INTERFACE_REVISION          3

typedef void           * SDJTAG_HNDL;        // Interface handle
typedef unsigned long    SDJTAG_FLAGS;       // Operational flags
typedef unsigned int     SDJTAG_PORT_ID;     // Emulator port id
typedef unsigned short   VCT_BUF;            // Scan chain vector buffer type
typedef unsigned short * VCT_POINTER;        // Pointer to scan vector
typedef int              SDJTAG_DEV_ID;      // Target device id in scan chain

// Unkown or invalid target device id. 
#define  SDJTAG_DEV_ID_INVALID          (SDJTAG_DEV_ID)(-1)

// Number of bits per VCT_BUF size.
#define  NUMBITS_IN_VCT_BUF             (sizeof(VCT_BUF)*8)

// Maximum number of devices in scan chain
#define  SDJTAG_MAX_DEVICES             128
//----------------------------------------------------------------------------
// Define emulator base type.  If emulator is NOT in the list then it
// is not supported.  From a high level this interface is emulator 
// independent as emulator specific features are not directly supported.
//
typedef enum sdjtag_emu_type
{
    SDJTAG_TYPE_UNKNOWN = 0,
    SDJTAG_TYPE_SPI510,             // Supports TI XDS510 and SD SPI510      
    SDJTAG_TYPE_SPI525,             // SD PCI 525
    SDJTAG_TYPE_XDS510PP_PLUS,      // SD PP PLUS, the default
    SDJTAG_TYPE_SPI515,             // SD PP 515, 
    SDJTAG_TYPE_XDS510USB           // SD USB 510
}SDJTAG_EMU_TYPE, *PSDJTAG_EMU_TYPE;

//----------------------------------------------------------------------------
// Valid XDS510/SPI510 ISA port addresses/EmuId
#define XDS510_PORT_240             0x240
#define XDS510_PORT_280             0x280
#define XDS510_PORT_320             0x320
#define XDS510_PORT_340             0x340

//----------------------------------------------------------------------------
// Valid port addresses/EmuId printer port emulatorsfor
//   XDS510PP, XDS510PP_PLUS, SPI515
#define XDS510PP_PORT_3BC           0x3BC
#define XDS510PP_PORT_278           0x278
#define XDS510PP_PORT_378           0x378

//----------------------------------------------------------------------------
// Valid port addresses/EmuId pci port emulatorsfor
//   SPI525
#define SPI525_PORT_100             0x100

//----------------------------------------------------------------------------
// Valid port addresses/EmuId USB emulator
//   XDS510USB
#define XDS510USB_PORT_510          0x510
#define XDS510USB_PORT_511          0x511
#define XDS510USB_PORT_512          0x512
#define XDS510USB_PORT_513          0x513

//----------------------------------------------------------------------------
// Stable JTAG end states. Non-stable states are NOT supported and will
// generate an error
typedef enum sdjtag_state
{
    TLR=0,                      // Test logic reset
    RTI,                        // Run-Test-Idle
    IPAUS,                      // Ir-Pause
    DPAUS                       // Dr-Pause
}SDJTAG_STATE, *PSDJTAG_STATE;

//----------------------------------------------------------------------------
// SDJTAG_Scanxxxx command parameters
//
typedef struct sdjtag_scan
{
    SDJTAG_STATE    EndState;           // Terminal state
    VCT_POINTER     pXmit;              // Address of xmit vect
    VCT_POINTER     pRecv;              // Address of recv vect
    DWORD           NumIntrBits;        // Number of interest bits
}SDJTAG_SCAN, *PSDJTAG_SCAN;

#define SDJTAG_MAX_BITS_PER_SCAN    32000
//----------------------------------------------------------------------------
// SDJTAG_RtiStep command parameters
//
typedef struct sdjtag_step
{
    DWORD           RtiCount;           // Number of TCKs at RTI state
    DWORD           RepeatCount;        // Number of times to repeat
                                        // set to 0 for 1 iteration
    SDJTAG_STATE    EndState;           // Intermediate and terminal end state           
}SDJTAG_STEP, *PSDJTAG_STEP;

//----------------------------------------------------------------------------
// SDJTAG_Status return values
//
// SDJTAG_STAT_SAW_TPOWER_CYCLE      - Power went off at some point
// SDJTAG_STAT_NO_TPOWER             - Power is still off
// SDJTAG_STAT_NO_JTAG_CLK           - No JTAG clock detect at emulator
// SDJTAG_STAT_TRST_LOW              - TRST pin is low
// SDJTAG_STAT_CMD_BUSY              - Last command is still busy
//
#define SDJTAG_STAT_SAW_TPOWER_CYCLE     0x00000001L
#define SDJTAG_STAT_NO_TPOWER            0x00000002L  
#define SDJTAG_STAT_NO_JTAG_CLK          0x00000004L 
#define SDJTAG_STAT_TRST_LOW             0x00000008L 
#define SDJTAG_STAT_CMD_BUSY             0x00000001L 

//----------------------------------------------------------------------------
// SDJTAG_Trst command parameters
//
typedef enum sdjtag_trst_action
{
   TRST_ACTION_NONE = 0,               // No action
   TRST_ACTION_LOW,                    // Set TRST low
   TRST_ACTION_HIGH,                   // Set TRST high
   TRST_ACTION_PULSE_LOW               
}SDJTAG_TRST_ACTION, *PSDJTAG_TRST_ACTION;

//----------------------------------------------------------------------------
// Emulation Errors.  These errors are high level errors generated in the
// SDJTAG wrapper.  
// 
//    
typedef enum sdjtag_err
{
    SDJTAG_ERR_NONE  = 0,
    SDJTAG_ERR_CONTROLLER   = 100,      // Low level scan controller error
                                        // that does not map to a SDJTAG
                                        // error.
    SDJTAG_ERR_NULL_POINTER,            // Unexpected NULL pointer
    SDJTAG_ERR_HANDLE,                  // The handle is invalid
    SDJTAG_ERR_INVALID_RETURN_ARG,      // The command arguments returned from
                                        // the target are invalid.

    SDJTAG_ERR_CFG   = 150,
    SDJTAG_ERR_CFG_EMULATOR_TYPE,       // Incorrect emulator type
    SDJTAG_ERR_CFG_EMULATOR_ID,         // Incorrect emulator id
    SDJTAG_ERR_CFG_BOARD_DATA_FILE_PATH,// Board file not found at path
    SDJTAG_ERR_CFG_BOARD_DATA_FORMAT,   // Board file format error
    SDJTAG_ERR_CFG_NUM_DEVICES,         // Number of devices in scan chain not
                                        // supported.
    SDJTAG_ERR_CFG_NO_TARGET_POWER,     // Check for target power failed    
    SDJTAG_ERR_CFG_JTAG_TCK,            // Cannot detect a jtag tck
    SDJTAG_ERR_CFG_JTAG_VOLTAGE_LEVELS, // Cannot set voltage levels
                                        // SPI515 class emulator
    SDJTAG_ERR_CFG_ALREADY_CONNECTED,   // Previous connection was made
    SDJTAG_ERR_CFG_CREATE,              // Invalid call to SDJTAG_CreatHndl
    SDJTAG_ERR_CFG_UNINITIALIZED,       // Interface is not fully intialized
    SDJTAG_ERR_CFG_OS_VERSION,          // The emulator type is not supported
                                        // on the operating system
    SDJTAG_ERR_CFG_EMU_DRIVER_FILE,     // Cannot find the required emulation
                                        // driver file.  On XDS510USB the
                                        // file "sdxds510usb_vX.out" was not
                                        // found. 'X' is the version.  The file
                                        // should be in your ccs drivers directory
	SDJTAG_ERR_CFG_EMU_NOTSUPPORTED,    // The connected emulator is not supported
                                        // by this interface.sdjtagex.dll only supports
                                        // sd xds510usb plus emulator


    SDJTAG_ERR_JTAG  = 200,
    SDJTAG_ERR_JTAG_DEV_ID,             // Invalid DevId
    SDJTAG_ERR_JTAG_CMD_TIMEOUT,        // Command timed out
    SDJTAG_ERR_JTAG_SCAN_LENGTH,        // Scan length either to short to long,
                                        // or both pRecv and pXmit are NULL
    SDJTAG_ERR_JTAG_END_STATE,          // Invalid end state
    SDJTAG_ERR_JTAG_FEATURE             // The requested feature is not supported

}SDJTAG_ERR, *PSDJTAG_ERR;

//----------------------------------------------------------------------------
//  Defines command types that can be executed from a command list. 
//  Commands correspond to functions available in the interface.
//  TBD
typedef enum sdjtag_cmd_seq
{
   SEQCMD_ScanIr,
   SEQCMD_ScanIrStatus,
   SEQCMD_ScanDr,
   SEQCMD_State,
   SEQCMD_RtiStep,
   SEQCMD_Status
}SDJTAG_CMD_SEQ, *PSDJTAG_CMD_SEQ;

//----------------------------------------------------------------------------
//  Command list structure
// 
//typedef union 
typedef struct sdjtag_cmdlist
{
    SDJTAG_CMD_SEQ      TheCmd;         // The command to execute
    SDJTAG_ERR          CmdRetVal;      // The commands return value
    union               Arg 
        { void        * p;  // Pointer to arg struct
          SDJTAG_STATE  State;
        }_arg;       
}SDJTAG_CMDLIST, *PSDJTAG_CMDLIST;

//----------------------------------------------------------------------------
//  Scan info that is read from the board file
// 
typedef struct sdjtag_scan_info
{
    SDJTAG_DEV_ID   DevId;          // Device ID
    char            DevName[10];    // Device name
    DWORD           IrLen;          // Device JTAG IR length
}SDJTAG_SCAN_INFO, *PSDJTAG_SCAN_INFO;

typedef struct sdjtag_scan_info_ex
{
    SDJTAG_DEV_ID   DevId;          // Device ID
    char            DevName[10];    // Device name
    DWORD           IrLen;          // Device JTAG IR length
	DWORD           Router;         // Router info
	DWORD           Expansion[16];  // Future exansion
}SDJTAG_SCAN_INFO_EX, *PSDJTAG_SCAN_INFO_EX;

// Extended definitions for router devices
// DEVNO = Device id #
// IPNO  = Icepick router #
// PORT  = Icepick port # for subpath
// TYPE  = Type of path being defined
//
// These definitions imply max values of 255. Thus you can never support
// a scan path with more then total of 255 total device nodes.  A node 
// can be a bypass, icepick, or real device.  Exceeding this is highly
// unlikely as CCS or scan controller limits would be hit first.
//
#define SDJTAG_RTR_FLD_DEVNO_MASK             ((DWORD)0x000000FF)
#define SDJTAG_RTR_FLD_IPNO_MASK              ((DWORD)0x0000FF00)
#define SDJTAG_RTR_FLD_PORT_MASK              ((DWORD)0x00FF0000)
#define SDJTAG_RTR_FLD_TYPE_MASK              ((DWORD)0xFF000000)

#define SDJTAG_RTR_GET_DEVNO(x)               ((x    ) & 0x0FF )
#define SDJTAG_RTR_GET_IPNO(x)                ((x>> 8) & 0x0FF )
#define SDJTAG_RTR_GET_PORT(x)                ((x>>16) & 0x0FF )
#define SDJTAG_RTR_GET_TYPE(x)                ((x>>24) & 0x0FF )

#define SDJTAG_RTR_PORT_MAX 255            // Max port # for sub path

#define SDJTAG_RTR_NONE     0              // Not router device
#define SDJTAG_RTR_DEVICE   1              // The router
#define SDJTAG_RTR_SUBPATH  2              // Subpath behind router

#if defined(_POSIX)
       #define SDJTAG_EXPORT_TYPE
#elif defined(_WIN32)
#if defined( _SDJTAG_C_ ) || defined( _SDJTAGEX_C_ )  
   #define SDJTAG_EXPORT_TYPE __declspec(dllexport)
#else
   #define SDJTAG_EXPORT_TYPE __declspec(dllimport)
#endif
#endif

#if defined(_WIN32) || defined(_POSIX)
/*F***************************************************************************
* NAME:  SDJTAG_CreateHndl 
*
* DESCRIPTION:  Creates instance data for jtag session. 
*     
* INPUTS:
*   SDJTAG_HNDL     * pHndl         Pointer to return handle
*   SDJTAG_EMU_TYPE   EmuType       Type of emulator to connect to. 
*                                   Corresponds to EmuProductName from 
*                                   sdopts.cfg. 
*   SDJTAG_PORT_ID    EmuId         Emulator id. Corresponds to EmulatorId
*                                   from sdopts.cfg.
*   char            * pSdopts       Filepath name to sdopts.cfg or NULL.
*                                   If null then (recommended) then sdopts.cfg
*                                   will be loaded via standard emulator rules.
*   char            * pBoardDatFile Path to a CCS 2.x generated board file.
*                                   Cannot be NULL.
* OUTPUTS:
*   SDJTAG_HNDL        Hndl         Handle to jtag session instance data
*
* NOTES:  Must be the first function called to start a jtag session.
*
*         The standard sdopts.cfg file is used to communicate all emulation
*         parmaters. Assuming CCS or SDConfig is functional then sdopts.cfg
*         should be vaild for use by "sdjtag". 
*
*         The board file should be one generated by CCS 2.x or higher.  When
*         you run cc_setup and configure your system it will generate a file
*         named "ccBrd0.dat" which is a text file. This file is located in
*         your <CCS_INSTALLDIR>\cc\bin\BrdDat directory.  The typical format
*         of this file is: 
*           ;CFG-2.0
*           "cpu_0"   TIARM7xx
*
*         "cpu_0" is your processor instance name.  TIARM7xx is the 
*          processor family/type.
*
*         ############WARNING, BOARD FILES CAN BE A LITTLE TRICKY############
*         cc_setup presents an inverted view of the real scan chain and board
*         file. So the first shall be last the the last shall be first.
*         cc_setup of
*             MyTMS470
*             MyBy8
*         becomes
*           ;CFG-2.0
*           "cpu_0"   BYPASS008
*           "cpu_1"   TIARM7xx
*         
*         For the jtag session the important piece is the "cpu_1" in this
*         example.
*        
*         During the handle creation process the following checks are made:
*            1) Checks for multiple creation calls.
*            2) Checks for NULL input and output pointers.
*            3) Checks EmuType and EmuId for correctness and that both are
*               supported.
*            4) Checks that the operating system is supported by the
*               requested EmuType.  For example Win95 is NOT supported on
*               any platform.  WinNT-4 and Win98 are not supported by 
*               XDS510USB.
*            5) Checks the board file path and validates number of devices.
*               For XDS510USB the number of devices must be 1.
*            6) Verifies that most underlying emulation dlls and files are
*               present.  Some files cannot be checked until the call to
*               SDJTAG_Connect().
*F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAG_CreateHndl(   SDJTAG_HNDL     * pHndl,
                     SDJTAG_EMU_TYPE   EmuType,
                     SDJTAG_PORT_ID    EmuId,
                     char            * pSdopts,
                     char            * pBoardDatFile);

/*F***************************************************************************
* NAME:  SDJTAG_FreeHndl 
*
* DESCRIPTION:  Frees all jtag session data and closes open connections if
*               not already closed. 
*     
* INPUTS:
*   SDJTAG_HNDL       Hndl          Free jtag session data
*
* OUTPUTS:
*
* NOTES:  Once a handle is freed no other accesses to SdJtag are allowed 
*         except for SDJTAG_CreateHndl() and SDJTAG_GetErrorMessage().
*F***************************************************************************/ 

SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAG_FreeHndl( SDJTAG_HNDL Hndl );

/*F***************************************************************************
* NAME:  SDJTAG_Connect 
*
* DESCRIPTION:  Open a physical emulation connection, and get the emulator
*               ready for jtag commands.  Detailed operation is emulator
*               dependent but should be same as if CCS opened the connection.
*     
* INPUTS:
*   SDJTAG_HNDL       Hndl          Session handle
*   char          *   pDevName      Pointer to the target device name string.
*                                   String must match name in your board data
*                                   file.
*   SDJTAG_DEV_ID *   pRetDevId     Pointer to return the device ID for the
*                                   target device.  If NULL then no connection
*                                   is made.
* OUTPUTS:
*   SDJTAG_DEV_ID     RetDevId      A target device ID which is used by 
*                                   emulation drivers to find a given device
*                                   in the scan chain. If not available then
*                                   SDJTAG_DEV_ID_INVALID is returned.
*
* NOTES: The inteface maintains a connection count for all targets.  For a
*        single device system only one connect is allowed.  If multiple
*        connects are called then they will return the erorr
*        SDJTAG_ERR_CFG_ALREADY_CONNECTED and the RetDevId if available.
*        The connection count is NOT incremented on subsequent connections.
*
*        The state of the connection is not changed for connections that
*        return SDJTAG_ERR_CFG_ALREADY_CONNECTED.
*F***************************************************************************/ 

SDJTAG_EXPORT_TYPE SDJTAG_ERR 
SDJTAG_Connect(  SDJTAG_HNDL     Hndl, 
                 char          * pDevName, 
                 SDJTAG_DEV_ID * pRetDevId );

/*F***************************************************************************
* NAME:  SDJTAG_Disconnect 
*
* DESCRIPTION:  Disconnect from the target device.  
*
* INPUTS:
*   SDJTAG_HNDL       Hndl          Session handle
*
*   SDJTAG_DEV_ID     RetDevId      A target device ID which is used by 
*                                   emulation drivers to find a given device
*                                   in the scan chain. 
* OUTPUTS:
*
* NOTES:  The disconnect will close the emulation connection for the target
*         device and decrement the connection count.When disconnected the
*         only commands allowed are SDJTAG_Connect(), SDJTAG_FreeHndl(),
*         SDJTAG_GetErrorMessage(), and SDJTAG_GetLastEmulatorError().   
*
*F***************************************************************************/  
SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAG_Disconnect(  SDJTAG_HNDL   Hndl, 
                    SDJTAG_DEV_ID DevId ); 


/*F***************************************************************************
* NAME:  SDJTAG_ScanIr, SDJTAG_ScanDr, SDJTAG_ScanIrStatus
*
* DESCRIPTION:  Scan N bits into and out of the target device. Ir/Dr scan 
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
*       VCT_POINTER   pRecv         Pointer to recv vect buffer 
*       DWORD         NumIntrBits   Number of interest bits to scan
*
* OUTPUTS:
*       VCT_POINTER   Recv[]        Recieve buffer data
* NOTES:  
*        The EndState must be one of the predefined JTAG stable states.
* 
*        If a VCT_POINTER is NULL then an error is returned.
*
*        NumIntrBits specifies the number of bits of the target device
*        scan chain.  In a multi-target system if multple devices are in
*        the scan chain then the non-targeted devices are "bypassed". 
*        The bypassing is a function of low level emulation drivers based
*        on information from the board data file.  If there were 
*        three devices in the scan chain with Ir lengths of 4, 8, and 38,
*        valid NumIntrBits could only be 4, 8 or 38 but never the sum of
*        IR bits.
*
*        The interface does NOT support the scanning of partial scan
*        chains. For instance a scan chain of 38 could not be broken into
*        two scan operations of 30 bits and 8 bits.  It has to be the
*        complete scan chain length.  No checks are made to enforce this
*        rule.
*
*        All scan buffers are of type VCT_BUF.  The buffer is assumed to
*        be in little endian format.  For scan chains that are not a 
*        multiple of NUMBITS_IN_VCT_BUF, the remainder bits are not
*        defined.
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
*   ### IrStatus is a special version of ScanIr.  IrStatus will ensure that
*       before the ScanIr function has been performed the JTAG tap will
*       be forced to through the Ir Capture state. If you called the
*       ScanIr function with an EndState of IPAUS and immediately called
*       ScanIr again then the tap would NOT have gone through Ir Update
*       and Ir Capture.  Thus you would never capture status.  Instead you
*       would simply scan out your previous scan in.  
*       
*F***************************************************************************/  
SDJTAG_EXPORT_TYPE
SDJTAG_ERR  SDJTAG_ScanIr( SDJTAG_HNDL      Hndl,  
                           SDJTAG_DEV_ID    DevId,  
                           SDJTAG_SCAN    * pArgs);

SDJTAG_EXPORT_TYPE SDJTAG_ERR
SDJTAG_ScanIrStatus( SDJTAG_HNDL      Hndl,  
                     SDJTAG_DEV_ID    DevId,  
                     SDJTAG_SCAN    * pArgs);

SDJTAG_EXPORT_TYPE SDJTAG_ERR
SDJTAG_ScanDr( SDJTAG_HNDL      Hndl,    
               SDJTAG_DEV_ID    DevId,
               SDJTAG_SCAN    * pArgs );


/*F***************************************************************************
* NAME:  SDJTAG_State 
*
* DESCRIPTION: Go to the specified stable JTAG tap state.
*     
* INPUTS:
*   SDJTAG_HNDL       Hndl          Session handle
*
*   SDJTAG_DEV_ID     RetDevId      A target device ID which is used by 
*                                   emulation drivers to find a given device
*                                   in the scan chain. 
*
*   SDJTAG_STATE       State        Stable JTAG tap state
*
* OUTPUTS:
*
* NOTES:  
*
*F***************************************************************************/  

SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAG_State( SDJTAG_HNDL     Hndl,   
              SDJTAG_DEV_ID   DevId,
              SDJTAG_STATE    State ); 

/*F***************************************************************************
* NAME:  SDJTAG_RtiStep 
*
* DESCRIPTION: Go to the specified stable JTAG tap state.
*     
* INPUTS:
*   SDJTAG_HNDL       Hndl          Session handle
*
*   SDJTAG_DEV_ID     RetDevId      A target device ID which is used by 
*                                   emulation drivers to find a given device
*                                   in the scan chain. 
*
*   SDJTAG_STEP    * pArgs          Pointer to step arguments
*
* OUTPUTS:
*
* NOTES: The function is generally used when you need to execute a 
*        sequence such as:
*             Scan Dr
*             Run Test Idle 1 JTAG clk
*             End in Dr pause
*F***************************************************************************/  

SDJTAG_EXPORT_TYPE SDJTAG_ERR  
SDJTAG_RtiStep(  SDJTAG_HNDL      Hndl, 
                 SDJTAG_DEV_ID    DevId,
                 SDJTAG_STEP    * pArgs    );

/*F***************************************************************************
* NAME:  SDJTAG_Status 
*
* DESCRIPTION: Return the emulation and/or session status
*     
* INPUTS:
*   SDJTAG_HNDL       Hndl          Session handle
*
*   SDJTAG_DEV_ID     RetDevId      A target device ID which is used by 
*                                   emulation drivers to find a given device
*                                   in the scan chain. 
*
*   SDJTAG_FLAGS   * pFlags         Pointer to status flags
*
* OUTPUTS:
*
* NOTES: 
*
*F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR
SDJTAG_Status(   SDJTAG_HNDL      Hndl, 
                 SDJTAG_DEV_ID    DevId,   
                 SDJTAG_FLAGS   * pFlags   );

/*F***************************************************************************
* NAME:  SDJTAG_Trst 
*
* DESCRIPTION: Manually control the JTAG TRSTn pin
*     
* INPUTS:
*   SDJTAG_HNDL       Hndl          Session handle
*
*   SDJTAG_DEV_ID     RetDevId      A target device ID which is used by 
*                                   emulation drivers to find a given device
*                                   in the scan chain. 
*
*   SDJTAG_TRST_ACTION  Action      Action to perform on TRSTn.
*
* OUTPUTS:
*
* NOTES:  Not all scan controllers allow manual control of TRSTn or there
*         may be restrictions.  This is mainly a concern in a multiprocessor
*         environment.  In general SD scan controllers will manage TRSTn
*         automaticly during connect, disconnect or power cycle conditions.
*         Further SD includes various setting in sdopts.cfg which can
*         effect the operation of TRSTn and the EMU0/1 pins.
*         If the selected TRSTn action is not supported then the returned
*         error will be SDJTAG_ERR_JTAG_FEATURE.
*
*F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR
SDJTAG_Trst( SDJTAG_HNDL         Hndl, 
             SDJTAG_DEV_ID       DevId,   
             SDJTAG_TRST_ACTION  Action );

/*F***************************************************************************
* NAME:  SDJTAG_GetLastEmulatorError 
*
* DESCRIPTION: Return the last error reported by the low level scan controller
*              driver.
*     
* INPUTS:
*   SDJTAG_HNDL       Hndl          Session handle
*
*
* OUTPUTS:
*   int   Scan controller error.
*
* NOTES:  Scan controllers all return there own series of errors which are
*         not completely comprehended in this interface. In general these
*         errors tend to be negative numbers between -100 and -999.
*         If a function returns the error code SDJTAG_ERR_CONTROLLER then
*         you should check for a low level controller error.
*
*F***************************************************************************/ 
SDJTAG_EXPORT_TYPE int
SDJTAG_GetLastEmulatorError( SDJTAG_HNDL Hndl );


/*F***************************************************************************
* NAME:  SDJTAG_GetErrorMessage
*
* DESCRIPTION: Return the last error reported by the low level scan controller
*              driver.
*     
* INPUTS:
*   SDJTAG_HNDL       Hndl          Session handle
*   SDJTAG_ERR        Error         Error message to look up
*
* OUTPUTS:
*   const char *      pError        Pointer to error message
*
* NOTES:  
*F***************************************************************************/ 
SDJTAG_EXPORT_TYPE const char *
SDJTAG_GetErrorMessage( SDJTAG_ERR Error );

#if !defined(SDJTAGEXL)
/*F***************************************************************************
* NAME:  SDJTAG_GetScanChainInfo
*
* DESCRIPTION: Returns scan info for each device in the scan chain.
*     
* INPUTS:
*   int                 MaxDev           Max devices to return
*   char              * pBoardDatFile    Pointer to board file with scan chain
*   int               * pNumDevs         Pointer to number devices returned
*   SDJTAG_SCAN_INFO  * pScanInfo        Pointer to array of devices
*
* OUTPUTS:
*   int                 NumDevs           Number of devices returned
*   SDJTAG_SCAN_INFO    ScanInfo          Array of scan info from the board
*                                         file.
*
* NOTES:  No handle is required.  The board file does not have to be the
*         file currently in use by sdjtag. Devices are returned in ascending
*         order:
*              DevId = 1
*              DevId = 2
*              DevId = N
*
*          The translates to the scan chain order as follows which matches
*          the TI definition of board file format.
*          Target TDI->DevId N.. DevId 2.. DevId 1-> Target TDO
*           
*          DevId = 0 is reserved and should never be returned.
*F***************************************************************************/ 
SDJTAG_EXPORT_TYPE SDJTAG_ERR
SDJTAG_GetScanChainInfo( int                MaxDev,
                         char             * pBoardDatFile,
                         int              * pNumDevs,
                         SDJTAG_SCAN_INFO * pScanInfo );

SDJTAG_EXPORT_TYPE SDJTAG_ERR
SDJTAG_GetScanChainInfoEx( int                   MaxDev,
                           char                * pBoardDatFile,
                           int                 * pNumDevs,
                           SDJTAG_SCAN_INFO_EX * pScanInfo );
#endif
#endif // End of #ifdef _WIN32
#ifdef __cplusplus
}
#endif

#if defined(USE_SDJTAGEX)
    #include "sdjtagex.h"
#endif

#endif /* sdjtag_h ---- END OF FILE ----------------------------------------*/

