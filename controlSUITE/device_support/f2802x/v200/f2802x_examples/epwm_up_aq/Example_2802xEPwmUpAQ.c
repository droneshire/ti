//#############################################################################
//
//  File:   f2802x_examples_ccsv4/epwm_up_aq/Example_F2802xEPwm3UpAQ.c
//
//  Title:  Action Qualifier Module Upcount mode.
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>Action Qualifier Module Upcount mode</h1>
//!
//!   This example configures ePWM1, ePWM2, ePWM3 to produce a
//!   waveform with independant modulation on EPWMxA and
//!   EPWMxB.
//!
//!   The compare values CMPA and CMPB are modified within the ePWM's ISR.
//!
//!   The TB counter is in upmode for this example.
//!
//!   View the EPWM1A/B, EPWM2A/B and EPWM3A/B waveforms
//!   via an oscilloscope: \n
//!       EPWM1A is on GPIO0 \n
//!       EPWM1B is on GPIO1 
//!
//!       EPWM2A is on GPIO2 \n
//!       EPWM2B is on GPIO3
//!
//!       EPWM3A is on GPIO4 \n
//!       EPWM3B is on GPIO5
//
//  (C) Copyright 2012, Texas Instruments, Inc.
//#############################################################################
// $TI Release: f2802x Support Library v200 $
// $Release Date: Tue Jul 24 10:01:39 CDT 2012 $
//#############################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

#include "f2802x_common/include/clk.h"
#include "f2802x_common/include/flash.h"
#include "f2802x_common/include/gpio.h"
#include "f2802x_common/include/pie.h"
#include "f2802x_common/include/pll.h"
#include "f2802x_common/include/pwm.h"
#include "f2802x_common/include/wdog.h"

typedef struct
{
//    volatile struct EPWM_REGS *EPwmRegHandle;
    PWM_Handle myPwmHandle;
    uint16_t EPwm_CMPA_Direction;
    uint16_t EPwm_CMPB_Direction;
    uint16_t EPwmTimerIntCount;
    uint16_t EPwmMaxCMPA;
    uint16_t EPwmMinCMPA;
    uint16_t EPwmMaxCMPB;
    uint16_t EPwmMinCMPB;
}EPWM_INFO;


// Prototype statements for functions found within this file.
void InitEPwm1Example(void);
void InitEPwm2Example(void);
void InitEPwm3Example(void);
interrupt void epwm1_isr(void);
interrupt void epwm2_isr(void);
interrupt void epwm3_isr(void);
void update_compare(EPWM_INFO*);

// Global variables used in this example
EPWM_INFO epwm1_info;
EPWM_INFO epwm2_info;
EPWM_INFO epwm3_info;

// Configure the period for each timer
#define EPWM1_TIMER_TBPRD  2000  // Period register
#define EPWM1_MAX_CMPA     1950
#define EPWM1_MIN_CMPA       50
#define EPWM1_MAX_CMPB     1950
#define EPWM1_MIN_CMPB       50

#define EPWM2_TIMER_TBPRD  2000  // Period register
#define EPWM2_MAX_CMPA     1950
#define EPWM2_MIN_CMPA       50
#define EPWM2_MAX_CMPB     1950
#define EPWM2_MIN_CMPB       50

#define EPWM3_TIMER_TBPRD  2000  // Period register
#define EPWM3_MAX_CMPA      950
#define EPWM3_MIN_CMPA       50
#define EPWM3_MAX_CMPB     1950
#define EPWM3_MIN_CMPB     1050


// To keep track of which way the compare value is moving
#define EPWM_CMP_UP   1
#define EPWM_CMP_DOWN 0

CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;
PWM_Handle myPwm1, myPwm2, myPwm3;

void main(void)
{
    
    CPU_Handle myCpu;
    PLL_Handle myPll;
    WDOG_Handle myWDog;
    
    // Initialize all the handles needed for this application    
    myClk = CLK_init((void *)CLK_BASE_ADDR, sizeof(CLK_Obj));
    myCpu = CPU_init((void *)NULL, sizeof(CPU_Obj));
    myFlash = FLASH_init((void *)FLASH_BASE_ADDR, sizeof(FLASH_Obj));
    myGpio = GPIO_init((void *)GPIO_BASE_ADDR, sizeof(GPIO_Obj));
    myPie = PIE_init((void *)PIE_BASE_ADDR, sizeof(PIE_Obj));
    myPll = PLL_init((void *)PLL_BASE_ADDR, sizeof(PLL_Obj));
    myPwm1 = PWM_init((void *)PWM_ePWM1_BASE_ADDR, sizeof(PWM_Obj));
    myPwm2 = PWM_init((void *)PWM_ePWM2_BASE_ADDR, sizeof(PWM_Obj));
    myPwm3 = PWM_init((void *)PWM_ePWM3_BASE_ADDR, sizeof(PWM_Obj));
    myWDog = WDOG_init((void *)WDOG_BASE_ADDR, sizeof(WDOG_Obj));
    
    // Perform basic system initialization    
    WDOG_disable(myWDog);
    CLK_enableAdcClock(myClk);
    (*Device_cal)();
    CLK_disableAdcClock(myClk);
    
    //Select the internal oscillator 1 as the clock source
    CLK_setOscSrc(myClk, CLK_OscSrc_Internal);
    
    // Setup the PLL for x10 /2 which will yield 50Mhz = 10Mhz * 10 / 2
    PLL_setup(myPll, PLL_Multiplier_10, PLL_DivideSelect_ClkIn_by_2);
    
    // Disable the PIE and all interrupts
    PIE_disable(myPie);
    PIE_disableAllInts(myPie);
    CPU_disableGlobalInts(myCpu);
    CPU_clearIntFlags(myCpu);

    // If running from flash copy RAM only functions to RAM   
#ifdef _FLASH
    memcpy(&RamfuncsRunStart, &RamfuncsLoadStart, (size_t)&RamfuncsLoadSize);
#endif      

    // Initalize GPIO
    GPIO_setPullUp(myGpio, GPIO_Number_0, GPIO_PullUp_Disable);
    GPIO_setPullUp(myGpio, GPIO_Number_1, GPIO_PullUp_Disable);
    GPIO_setMode(myGpio, GPIO_Number_0, GPIO_0_Mode_EPWM1A);
    GPIO_setMode(myGpio, GPIO_Number_1, GPIO_1_Mode_EPWM1B);
    
    GPIO_setPullUp(myGpio, GPIO_Number_2, GPIO_PullUp_Disable);
    GPIO_setPullUp(myGpio, GPIO_Number_3, GPIO_PullUp_Disable);
    GPIO_setMode(myGpio, GPIO_Number_2, GPIO_2_Mode_EPWM2A);
    GPIO_setMode(myGpio, GPIO_Number_3, GPIO_3_Mode_EPWM2B);
    
    GPIO_setPullUp(myGpio, GPIO_Number_4, GPIO_PullUp_Disable);
    GPIO_setPullUp(myGpio, GPIO_Number_5, GPIO_PullUp_Disable);
    GPIO_setMode(myGpio, GPIO_Number_4, GPIO_4_Mode_EPWM3A);
    GPIO_setMode(myGpio, GPIO_Number_5, GPIO_5_Mode_EPWM3B);

    // Setup a debug vector table and enable the PIE
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);
    
    // Register interrupt handlers in the PIE vector table
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_3, PIE_SubGroupNumber_1, (intVec_t)&epwm1_isr);
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_3, PIE_SubGroupNumber_2, (intVec_t)&epwm2_isr);
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_3, PIE_SubGroupNumber_3, (intVec_t)&epwm3_isr);

    CLK_disableTbClockSync(myClk);

    InitEPwm1Example();
    InitEPwm2Example();
    InitEPwm3Example();

    CLK_enableTbClockSync(myClk);

    // Enable CPU INT3 which is connected to EPWM1-3 INT:
    CPU_enableInt(myCpu, CPU_IntNumber_3);
    

    // Enable EPWM INTn in the PIE: Group 3 interrupt 1-3
    PIE_enablePwmInt(myPie, PWM_Number_1);
    PIE_enablePwmInt(myPie, PWM_Number_2);
    PIE_enablePwmInt(myPie, PWM_Number_3);

    // Enable global Interrupts and higher priority real-time debug events
    CPU_enableGlobalInts(myCpu);
    CPU_enableDebugInt(myCpu);

    for(;;) {
        asm(" NOP");
    }

}

interrupt void epwm1_isr(void)
{
    // Update the CMPA and CMPB values
    update_compare(&epwm1_info);

    // Clear INT flag for this timer
    PWM_clearIntFlag(myPwm1);

    // Acknowledge this interrupt to receive more interrupts from group 3
    PIE_clearInt(myPie, PIE_GroupNumber_3);
}


interrupt void epwm2_isr(void)
{

    // Update the CMPA and CMPB values
    update_compare(&epwm2_info);

    // Clear INT flag for this timer
    PWM_clearIntFlag(myPwm2);

    // Acknowledge this interrupt to receive more interrupts from group 3
    PIE_clearInt(myPie, PIE_GroupNumber_3);
}

interrupt void epwm3_isr(void)
{

    // Update the CMPA and CMPB values
    update_compare(&epwm3_info);

    // Clear INT flag for this timer
    PWM_clearIntFlag(myPwm3);

    // Acknowledge this interrupt to receive more interrupts from group 3
    PIE_clearInt(myPie, PIE_GroupNumber_3);
}

void InitEPwm1Example()
{

    CLK_enablePwmClock(myClk, PWM_Number_1);
    
    // Setup TBCLK
    PWM_setCounterMode(myPwm1, PWM_CounterMode_Up);         // Count up
    PWM_setPeriod(myPwm1, EPWM1_TIMER_TBPRD);               // Set timer period
    PWM_disableCounterLoad(myPwm1);                         // Disable phase loading
    PWM_setPhase(myPwm1, 0x0000);                           // Phase is 0
    PWM_setCount(myPwm1, 0x0000);                           // Clear counter
    PWM_setHighSpeedClkDiv(myPwm1, PWM_HspClkDiv_by_2);     // Clock ratio to SYSCLKOUT
    PWM_setClkDiv(myPwm1, PWM_ClkDiv_by_2);

    // Setup shadow register load on ZERO
    PWM_setShadowMode_CmpA(myPwm1, PWM_ShadowMode_Shadow);
    PWM_setShadowMode_CmpB(myPwm1, PWM_ShadowMode_Shadow);
    PWM_setLoadMode_CmpA(myPwm1, PWM_LoadMode_Zero);
    PWM_setLoadMode_CmpB(myPwm1, PWM_LoadMode_Zero);

    // Set Compare values
    PWM_setCmpA(myPwm1, EPWM1_MIN_CMPA);    // Set compare A value
    PWM_setCmpB(myPwm1, EPWM1_MIN_CMPB);    // Set Compare B value

    // Set actions
    PWM_setActionQual_Zero_PwmA(myPwm1, PWM_ActionQual_Set);            // Set PWM1A on Zero
    PWM_setActionQual_CntUp_CmpA_PwmA(myPwm1, PWM_ActionQual_Clear);    // Clear PWM1A on event A, up count

    PWM_setActionQual_Zero_PwmB(myPwm1, PWM_ActionQual_Set);            // Set PWM1B on Zero
    PWM_setActionQual_CntUp_CmpB_PwmB(myPwm1, PWM_ActionQual_Clear);    // Clear PWM1B on event B, up count

    // Interrupt where we will change the Compare Values
    PWM_setIntMode(myPwm1, PWM_IntMode_CounterEqualZero);   // Select INT on Zero event
    PWM_enableInt(myPwm1);                                  // Enable INT
    PWM_setIntPeriod(myPwm1, PWM_IntPeriod_ThirdEvent);     // Generate INT on 3rd event

    // Information this example uses to keep track
    // of the direction the CMPA/CMPB values are
    // moving, the min and max allowed values and
    // a pointer to the correct ePWM registers
    epwm1_info.EPwm_CMPA_Direction = EPWM_CMP_UP;   // Start by increasing CMPA & CMPB
    epwm1_info.EPwm_CMPB_Direction = EPWM_CMP_UP;
    epwm1_info.EPwmTimerIntCount = 0;               // Zero the interrupt counter
    epwm1_info.myPwmHandle = myPwm1;                // Set the pointer to the ePWM module
    epwm1_info.EPwmMaxCMPA = EPWM1_MAX_CMPA;        // Setup min/max CMPA/CMPB values
    epwm1_info.EPwmMinCMPA = EPWM1_MIN_CMPA;
    epwm1_info.EPwmMaxCMPB = EPWM1_MAX_CMPB;
    epwm1_info.EPwmMinCMPB = EPWM1_MIN_CMPB;

}


void InitEPwm2Example()
{
    
    CLK_enablePwmClock(myClk, PWM_Number_2);
    
    // Setup TBCLK
    PWM_setCounterMode(myPwm2, PWM_CounterMode_Up);     // Count up
    PWM_setPeriod(myPwm2, EPWM2_TIMER_TBPRD);           // Set timer period
    PWM_disableCounterLoad(myPwm2);                     // Disable phase loading
    PWM_setPhase(myPwm2, 0x0000);                       // Phase is 0
    PWM_setCount(myPwm2, 0x0000);                       // Clear counter
    PWM_setHighSpeedClkDiv(myPwm2, PWM_HspClkDiv_by_2); // Clock ratio to SYSCLKOUT
    PWM_setClkDiv(myPwm2, PWM_ClkDiv_by_2);

    // Setup shadow register load on ZERO
    PWM_setShadowMode_CmpA(myPwm2, PWM_ShadowMode_Shadow);
    PWM_setShadowMode_CmpB(myPwm2, PWM_ShadowMode_Shadow);
    PWM_setLoadMode_CmpA(myPwm2, PWM_LoadMode_Zero);
    PWM_setLoadMode_CmpB(myPwm2, PWM_LoadMode_Zero);

    // Set Compare values
    PWM_setCmpA(myPwm2, EPWM2_MIN_CMPA);    // Set compare A value
    PWM_setCmpB(myPwm2, EPWM2_MIN_CMPB);    // Set Compare B value
    

    // Set actions
    PWM_setActionQual_Period_PwmA(myPwm2, PWM_ActionQual_Clear);    // Clear PWM2A on Period
    PWM_setActionQual_CntUp_CmpA_PwmA(myPwm2, PWM_ActionQual_Set);  // Set PWM2A on event A, up count

    PWM_setActionQual_Period_PwmB(myPwm2, PWM_ActionQual_Clear);    // Clear PWM2B on Period
    PWM_setActionQual_CntUp_CmpB_PwmB(myPwm2, PWM_ActionQual_Set);  // Set PWM2B on event B, up count

    // Interrupt where we will change the Compare Values
    PWM_setIntMode(myPwm2, PWM_IntMode_CounterEqualZero);   // Select INT on Zero event
    PWM_enableInt(myPwm2);                                  // Enable INT
    PWM_setIntPeriod(myPwm2, PWM_IntPeriod_ThirdEvent);     // Generate INT on 3rd event

    // Information this example uses to keep track
    // of the direction the CMPA/CMPB values are
    // moving, the min and max allowed values and
    // a pointer to the correct ePWM registers
    epwm2_info.EPwm_CMPA_Direction = EPWM_CMP_UP;   // Start by increasing CMPA
    epwm2_info.EPwm_CMPB_Direction = EPWM_CMP_DOWN; // and decreasing CMPB
    epwm2_info.EPwmTimerIntCount = 0;               // Zero the interrupt counter
    epwm2_info.myPwmHandle = myPwm2;                // Set the pointer to the ePWM module
    epwm2_info.EPwmMaxCMPA = EPWM2_MAX_CMPA;        // Setup min/max CMPA/CMPB values
    epwm2_info.EPwmMinCMPA = EPWM2_MIN_CMPA;
    epwm2_info.EPwmMaxCMPB = EPWM2_MAX_CMPB;
    epwm2_info.EPwmMinCMPB = EPWM2_MIN_CMPB;

}


void InitEPwm3Example(void)
{

    CLK_enablePwmClock(myClk, PWM_Number_3);

    // Setup TBCLK
    PWM_setCounterMode(myPwm3, PWM_CounterMode_Up);     // Count up
    PWM_setPeriod(myPwm3, EPWM3_TIMER_TBPRD);           // Set timer period
    PWM_disableCounterLoad(myPwm3);                     // Disable phase loading
    PWM_setPhase(myPwm3, 0x0000);                       // Phase is 0
    PWM_setCount(myPwm3, 0x0000);                       // Clear counter
    PWM_setHighSpeedClkDiv(myPwm3, PWM_HspClkDiv_by_1); // Clock ratio to SYSCLKOUT
    PWM_setClkDiv(myPwm3, PWM_ClkDiv_by_1);

    // Setup shadow register load on ZERO
    PWM_setShadowMode_CmpA(myPwm3, PWM_ShadowMode_Shadow);
    PWM_setShadowMode_CmpB(myPwm3, PWM_ShadowMode_Shadow);
    PWM_setLoadMode_CmpA(myPwm3, PWM_LoadMode_Zero);
    PWM_setLoadMode_CmpB(myPwm3, PWM_LoadMode_Zero);

    // Set Compare values
    PWM_setCmpA(myPwm3, EPWM3_MIN_CMPA);    // Set compare A value
    PWM_setCmpB(myPwm3, EPWM3_MIN_CMPB);    // Set Compare B value

    // Set Actions
    PWM_setActionQual_CntUp_CmpA_PwmA(myPwm3, PWM_ActionQual_Set);      // Set PWM3A on event B, up count
    PWM_setActionQual_CntUp_CmpB_PwmA(myPwm3, PWM_ActionQual_Clear);    // Clear PWM3A on event B, up count

    PWM_setActionQual_Zero_PwmB(myPwm3, PWM_ActionQual_Toggle);         // Toggle EPWM3B on Zero

    // Interrupt where we will change the Compare Values
    PWM_setIntMode(myPwm3, PWM_IntMode_CounterEqualZero);   // Select INT on Zero event
    PWM_enableInt(myPwm3);                                  // Enable INT
    PWM_setIntPeriod(myPwm3, PWM_IntPeriod_ThirdEvent);     // Generate INT on 3rd event

    // Information this example uses to keep track
    // of the direction the CMPA/CMPB values are
    // moving, the min and max allowed values and
    // a pointer to the correct ePWM registers
    epwm3_info.EPwm_CMPA_Direction = EPWM_CMP_UP;   // Start by increasing CMPA
    epwm3_info.EPwm_CMPB_Direction = EPWM_CMP_DOWN; // and decreasing CMPB
    epwm3_info.EPwmTimerIntCount = 0;               // Zero the interrupt counter
    epwm3_info.myPwmHandle = myPwm3;                // Set the pointer to the ePWM module
    epwm3_info.EPwmMaxCMPA = EPWM3_MAX_CMPA;        // Setup min/max CMPA/CMPB values
    epwm3_info.EPwmMinCMPA = EPWM3_MIN_CMPA;
    epwm3_info.EPwmMaxCMPB = EPWM3_MAX_CMPB;
    epwm3_info.EPwmMinCMPB = EPWM3_MIN_CMPB;
    
}


void update_compare(EPWM_INFO *epwm_info)
{


    // Every 10'th interrupt, change the CMPA/CMPB values
    if(epwm_info->EPwmTimerIntCount == 10)
    {
        epwm_info->EPwmTimerIntCount = 0;

        // If we were increasing CMPA, check to see if
        // we reached the max value.  If not, increase CMPA
        // else, change directions and decrease CMPA
        if(epwm_info->EPwm_CMPA_Direction == EPWM_CMP_UP) {
            if(PWM_getCmpA(epwm_info->myPwmHandle) < epwm_info->EPwmMaxCMPA) {
              PWM_setCmpA(epwm_info->myPwmHandle, PWM_getCmpA(epwm_info->myPwmHandle) + 1);
            }
            else {
              epwm_info->EPwm_CMPA_Direction = EPWM_CMP_DOWN;
              PWM_setCmpA(epwm_info->myPwmHandle, PWM_getCmpA(epwm_info->myPwmHandle) - 1);
            }
        }

        // If we were decreasing CMPA, check to see if
        // we reached the min value.  If not, decrease CMPA
        // else, change directions and increase CMPA
        else {
            if(PWM_getCmpA(epwm_info->myPwmHandle) == epwm_info->EPwmMinCMPA) {
              epwm_info->EPwm_CMPA_Direction = EPWM_CMP_UP;
              PWM_setCmpA(epwm_info->myPwmHandle, PWM_getCmpA(epwm_info->myPwmHandle) + 1);
            }
            else {
              PWM_setCmpA(epwm_info->myPwmHandle, PWM_getCmpA(epwm_info->myPwmHandle) - 1);
            }
        }

        // If we were increasing CMPB, check to see if
        // we reached the max value.  If not, increase CMPB
        // else, change directions and decrease CMPB
        if(epwm_info->EPwm_CMPB_Direction == EPWM_CMP_UP) {
            if(PWM_getCmpB(epwm_info->myPwmHandle) < epwm_info->EPwmMaxCMPB) {
              PWM_setCmpB(epwm_info->myPwmHandle, PWM_getCmpB(epwm_info->myPwmHandle) + 1);
            }
            else {
              epwm_info->EPwm_CMPB_Direction = EPWM_CMP_DOWN;
              PWM_setCmpB(epwm_info->myPwmHandle, PWM_getCmpB(epwm_info->myPwmHandle) - 1);
            }
        }

        // If we were decreasing CMPB, check to see if
        // we reached the min value.  If not, decrease CMPB
        // else, change directions and increase CMPB

        else {
            if(PWM_getCmpB(epwm_info->myPwmHandle) == epwm_info->EPwmMinCMPB) {
              epwm_info->EPwm_CMPB_Direction = EPWM_CMP_UP;
              PWM_setCmpB(epwm_info->myPwmHandle, PWM_getCmpB(epwm_info->myPwmHandle) + 1);
            }
            else {
              PWM_setCmpB(epwm_info->myPwmHandle, PWM_getCmpB(epwm_info->myPwmHandle) - 1);
            }
        }
    }
    else {
      epwm_info->EPwmTimerIntCount++;
    }

    return;
}


//===========================================================================
// No more.
//===========================================================================
