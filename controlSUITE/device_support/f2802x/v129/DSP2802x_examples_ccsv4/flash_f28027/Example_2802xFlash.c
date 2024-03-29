// TI File $Revision: /main/3 $
// Checkin $Date: October 6, 2010   14:42:42 $
//###########################################################################
//
// FILE:    Example_2802xFlash.c
//
// TITLE:   DSP2802x EPwm Timer Interrupt From Flash Example.
//
// ASSUMPTIONS:
//
//    This program requires the DSP2802x header files.
//
//    As supplied, this project is configured for "boot to FLASH"
//    operation.  The 2802x Boot Mode table is shown below.
//    For information on configuring the boot mode of an eZdsp,
//    please refer to the documentation included with the eZdsp,
//
//    $Boot_Table
//    While an emulator is connected to your device, the TRSTn pin = 1,
//    which sets the device into EMU_BOOT boot mode. In this mode, the
//    peripheral boot modes are as follows:
//
//      Boot Mode:   EMU_KEY        EMU_BMODE
//                   (0xD00)         (0xD01)
//      ---------------------------------------
//      Wait         !=0x55AA        X
//      I/O          0x55AA          0x0000
//      SCI          0x55AA          0x0001
//      Wait         0x55AA          0x0002
//      Get_Mode     0x55AA          0x0003
//      SPI          0x55AA          0x0004
//      I2C          0x55AA          0x0005
//      OTP          0x55AA          0x0006
//      Wait         0x55AA          0x0007
//      Wait         0x55AA          0x0008
//      SARAM        0x55AA          0x000A
//      Flash        0x55AA          0x000B   <-- "Boot to Flash"
//      Wait         0x55AA          Other
//
//   Write EMU_KEY to 0xD00 and EMU_BMODE to 0xD01 via the debugger
//   according to the Boot Mode Table above. Build/Load project,
//   Reset the device, and Run example
//
//   $End_Boot_Table
//
//    The program must first be compiled and then programmed into the
//    flash.
//
//
// DESCRIPTION:
//
//    This example runs the EPwm interrupt example from flash.
//
//    1) Build the project
//    2) Flash the .out file into the device.
//    3) Set the hardware jumpers to boot to Flash
//    4) Use the included GEL file to load the project, symbols
//       defined within the project and the variables into the watch
//       window.
//
//    Steps that were taken to convert the EPwm example from RAM
//    to Flash execution:
//
//    - Change the linker cmd file to reflect the flash memory map.
//    - Make sure any initialized sections are mapped to Flash.
//      In SDFlash utility this can be checked by the View->Coff/Hex
//      status utility. Any section marked as "load" should be
//      allocated to Flash.
//    - Make sure there is a branch instruction from the entry to Flash
//      at 0x3F7FF6 to the beginning of code execution. This example
//      uses the DSP0x_CodeStartBranch.asm file to accomplish this.
//    - Set boot mode Jumpers to "boot to Flash"
//    - For best performance from the flash, modify the waitstates
//      and enable the flash pipeline as shown in this example.
//      Note: any code that manipulates the flash waitstate and pipeline
//      control must be run from RAM. Thus these functions are located
//      in their own memory section called ramfuncs.
//
//
//    EPwm1 Interrupt will run from RAM and puts the flash into sleep mode
//    EPwm2 Interrupt will run from RAM and puts the flash into standby mode
//    EPwm3 Interrupt will run from FLASH
//
//    As supplied:
//
//    All timers have the same period
//    The timers are started sync'ed
//    An interrupt is taken on a zero event for each EPwm timer
//
//       EPwm1: takes an interrupt every event
//       EPwm2: takes an interrupt every 2nd event
//       EPwm3: takes an interrupt every 3rd event
//
//    Thus the Interrupt count for EPwm1, EPwm4-EPwm6 should be equal
//    The interrupt count for EPwm2 should be about half that of EPwm1
//    and the interrupt count for EPwm3 should be about 1/3 that of EPwm1
//
//          Watch Variables:
//                 EPwm1TimerIntCount
//                 EPwm2TimerIntCount
//                 EPwm3TimerIntCount
//
//                 Toggle GPIO34 while in the background loop.
//
//###########################################################################
// $TI Release: 2802x C/C++ Header Files and Peripheral Examples V1.29 $
// $Release Date: January 11, 2011 $
//###########################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

// Configure which EPwm timer interrupts are enabled at the PIE level:
// 1 = enabled,  0 = disabled
#define PWM1_INT_ENABLE  1
#define PWM2_INT_ENABLE  1
#define PWM3_INT_ENABLE  1

// Configure the period for each timer
#define PWM1_TIMER_TBPRD   0x1FFF
#define PWM2_TIMER_TBPRD   0x1FFF
#define PWM3_TIMER_TBPRD   0x1FFF

// Make this long enough so that we can see an LED toggle
#define DELAY 1000000L

// Functions that will be run from RAM need to be assigned to
// a different section.  This section will then be mapped using
// the linker cmd file.
#pragma CODE_SECTION(EPwm1_timer_isr, "ramfuncs");
#pragma CODE_SECTION(EPwm2_timer_isr, "ramfuncs");

// Prototype statements for functions found within this file.
interrupt void EPwm1_timer_isr(void);
interrupt void EPwm2_timer_isr(void);
interrupt void EPwm3_timer_isr(void);
void InitEPwmTimer(void);

// Global variables used in this example
Uint32  EPwm1TimerIntCount;
Uint32  EPwm2TimerIntCount;
Uint32  EPwm3TimerIntCount;
Uint32  LoopCount;

// These are defined by the linker (see F2808.cmd)
extern Uint16 RamfuncsLoadStart;
extern Uint16 RamfuncsLoadEnd;
extern Uint16 RamfuncsRunStart;

void main(void)
{

// Step 1. Initialize System Control:
// PLL, WatchDog, enable Peripheral Clocks
// This example function is found in the DSP2802x_SysCtrl.c file.
   InitSysCtrl();

// Step 2. Initalize GPIO:
// This example function is found in the DSP2802x_Gpio.c file and
// illustrates how to set the GPIO to it's default state.
// InitGpio();  // Skipped for this example

// Step 3. Clear all interrupts and initialize PIE vector table:
// Disable CPU interrupts
   DINT;

// Initialize the PIE control registers to their default state.
// The default state is all PIE interrupts disabled and flags
// are cleared.
// This function is found in the DSP2802x_PieCtrl.c file.
   InitPieCtrl();

// Disable CPU interrupts and clear all CPU interrupt flags:
   IER = 0x0000;
   IFR = 0x0000;

// Initialize the PIE vector table with pointers to the shell Interrupt
// Service Routines (ISR).
// This will populate the entire table, even if the interrupt
// is not used in this example.  This is useful for debug purposes.
// The shell ISR routines are found in DSP2802x_DefaultIsr.c.
// This function is found in DSP2802x_PieVect.c.
   InitPieVectTable();

// Interrupts that are used in this example are re-mapped to
// ISR functions found within this file.
   EALLOW;  // This is needed to write to EALLOW protected registers
   PieVectTable.EPWM1_INT = &EPwm1_timer_isr;
   PieVectTable.EPWM2_INT = &EPwm2_timer_isr;
   PieVectTable.EPWM3_INT = &EPwm3_timer_isr;
   EDIS;    // This is needed to disable write to EALLOW protected registers

// Step 4. Initialize all the Device Peripherals:
// This function is found in DSP2802x_InitPeripherals.c
// InitPeripherals();  // Not required for this example
   InitEPwmTimer();    // For this example, only initialize the EPwm Timers

// Step 5. User specific code, enable interrupts:

// Copy time critical code and Flash setup code to RAM
// This includes the following ISR functions: EPwm1_timer_isr(), EPwm2_timer_isr()
// EPwm3_timer_isr and and InitFlash();
// The  RamfuncsLoadStart, RamfuncsLoadEnd, and RamfuncsRunStart
// symbols are created by the linker. Refer to the F2808.cmd file.
   MemCopy(&RamfuncsLoadStart, &RamfuncsLoadEnd, &RamfuncsRunStart);

// Call Flash Initialization to setup flash waitstates
// This function must reside in RAM
   InitFlash();

// Initalize counters:
   EPwm1TimerIntCount = 0;
   EPwm2TimerIntCount = 0;
   EPwm3TimerIntCount = 0;
   LoopCount = 0;

// Enable CPU INT3 which is connected to EPwm1-3 INT:
   IER |= M_INT3;

// Enable EPwm INTn in the PIE: Group 3 interrupt 1-3
   PieCtrlRegs.PIEIER3.bit.INTx1 = PWM1_INT_ENABLE;
   PieCtrlRegs.PIEIER3.bit.INTx2 = PWM2_INT_ENABLE;
   PieCtrlRegs.PIEIER3.bit.INTx3 = PWM3_INT_ENABLE;

// Enable global Interrupts and higher priority real-time debug events:
   EINT;   // Enable Global interrupt INTM
   ERTM;   // Enable Global realtime interrupt DBGM

// Step 6. IDLE loop. Just sit and loop forever (optional):
   EALLOW;
   GpioCtrlRegs.GPBMUX1.bit.GPIO34 = 0;
   GpioCtrlRegs.GPBDIR.bit.GPIO34 = 1;
   EDIS;

   for(;;)
   {
       // This loop will be interrupted, so the overall
       // delay between pin toggles will be longer.
       DELAY_US(DELAY);
       LoopCount++;
       GpioDataRegs.GPBTOGGLE.bit.GPIO34 = 1;
   }

}

void InitEPwmTimer()
{

   EALLOW;
   SysCtrlRegs.PCLKCR0.bit.TBCLKSYNC = 0;      // Stop all the TB clocks
   EDIS;

   InitEPwm1Gpio();
   InitEPwm2Gpio();
   InitEPwm3Gpio();

   // Setup Sync
   EPwm1Regs.TBCTL.bit.SYNCOSEL = TB_SYNC_IN;  // Pass through
   EPwm2Regs.TBCTL.bit.SYNCOSEL = TB_SYNC_IN;  // Pass through
   EPwm3Regs.TBCTL.bit.SYNCOSEL = TB_SYNC_IN;  // Pass through

   // Allow each timer to be sync'ed

   EPwm1Regs.TBCTL.bit.PHSEN = TB_ENABLE;
   EPwm2Regs.TBCTL.bit.PHSEN = TB_ENABLE;
   EPwm3Regs.TBCTL.bit.PHSEN = TB_ENABLE;

   EPwm1Regs.TBPHS.half.TBPHS = 100;
   EPwm2Regs.TBPHS.half.TBPHS = 200;
   EPwm3Regs.TBPHS.half.TBPHS = 300;

   EPwm1Regs.TBPRD = PWM1_TIMER_TBPRD;
   EPwm1Regs.TBCTL.bit.CTRMODE = TB_COUNT_UP;    // Count up
   EPwm1Regs.ETSEL.bit.INTSEL = ET_CTR_ZERO;     // Select INT on Zero event
   EPwm1Regs.ETSEL.bit.INTEN = PWM1_INT_ENABLE;  // Enable INT
   EPwm1Regs.ETPS.bit.INTPRD = ET_1ST;           // Generate INT on 1st event


   EPwm2Regs.TBPRD = PWM2_TIMER_TBPRD;
   EPwm2Regs.TBCTL.bit.CTRMODE = TB_COUNT_UP;     // Count up
   EPwm2Regs.ETSEL.bit.INTSEL = ET_CTR_ZERO;      // Enable INT on Zero event
   EPwm2Regs.ETSEL.bit.INTEN = PWM2_INT_ENABLE;   // Enable INT
   EPwm2Regs.ETPS.bit.INTPRD = ET_2ND;            // Generate INT on 2nd event


   EPwm3Regs.TBPRD = PWM3_TIMER_TBPRD;
   EPwm3Regs.TBCTL.bit.CTRMODE = TB_COUNT_UP;     // Count up
   EPwm3Regs.ETSEL.bit.INTSEL = ET_CTR_ZERO;      // Enable INT on Zero event
   EPwm3Regs.ETSEL.bit.INTEN = PWM3_INT_ENABLE;   // Enable INT
   EPwm3Regs.ETPS.bit.INTPRD = ET_3RD;            // Generate INT on 3rd event

   EPwm1Regs.CMPA.half.CMPA = PWM1_TIMER_TBPRD/2;
   EPwm1Regs.AQCTLA.bit.PRD = AQ_SET;
   EPwm1Regs.AQCTLA.bit.CAU = AQ_CLEAR;
   EPwm1Regs.AQCTLB.bit.PRD = AQ_SET;
   EPwm1Regs.AQCTLB.bit.CAU = AQ_CLEAR;

   EPwm2Regs.CMPA.half.CMPA = PWM2_TIMER_TBPRD/2;
   EPwm2Regs.AQCTLA.bit.PRD = AQ_SET;
   EPwm2Regs.AQCTLA.bit.CAU = AQ_CLEAR;
   EPwm2Regs.AQCTLB.bit.PRD = AQ_SET;
   EPwm2Regs.AQCTLB.bit.CAU = AQ_CLEAR;

   EPwm3Regs.CMPA.half.CMPA = PWM3_TIMER_TBPRD/2;
   EPwm3Regs.AQCTLA.bit.PRD = AQ_SET;
   EPwm3Regs.AQCTLA.bit.CAU = AQ_CLEAR;
   EPwm3Regs.AQCTLB.bit.PRD = AQ_SET;
   EPwm3Regs.AQCTLB.bit.CAU = AQ_CLEAR;

   EALLOW;
   SysCtrlRegs.PCLKCR0.bit.TBCLKSYNC = 1;         // Start all the timers synced
   EDIS;

}

// This ISR MUST be executed from RAM as it will put the Flash into Sleep
// Interrupt routines uses in this example:
interrupt void EPwm1_timer_isr(void)
{

   // Put the Flash to sleep
   FlashRegs.FPWR.bit.PWR = FLASH_SLEEP;

   EPwm1TimerIntCount++;

   // Clear INT flag for this timer
   EPwm1Regs.ETCLR.bit.INT = 1;

   // Acknowledge this interrupt to receive more interrupts from group 3
   PieCtrlRegs.PIEACK.all = PIEACK_GROUP3;
}

// This ISR MUST be executed from RAM as it will put the Flash into Standby
interrupt void EPwm2_timer_isr(void)
{
   EPwm2TimerIntCount++;

    // Put the Flash into standby
    FlashRegs.FPWR.bit.PWR = FLASH_STANDBY;

   // Clear INT flag for this timer
   EPwm2Regs.ETCLR.bit.INT = 1;

   // Acknowledge this interrupt to receive more interrupts from group 3
   PieCtrlRegs.PIEACK.all = PIEACK_GROUP3;
}

interrupt void EPwm3_timer_isr(void)
{
   Uint16 i;

   EPwm3TimerIntCount++;

    // Short Delay to simulate some ISR Code
    for(i = 1; i < 0x01FF; i++) {}

   // Clear INT flag for this timer
   EPwm3Regs.ETCLR.bit.INT = 1;

   // Acknowledge this interrupt to receive more interrupts from group 3
   PieCtrlRegs.PIEACK.all = PIEACK_GROUP3;
}

//===========================================================================
// No more.
//===========================================================================
