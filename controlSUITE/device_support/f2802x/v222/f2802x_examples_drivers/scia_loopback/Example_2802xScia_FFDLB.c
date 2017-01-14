//#############################################################################
//
//  File:   f2802x_examples/scia_loopback/Example_F2802xSci_FFDLB.c
//
//  Title:  F2802x Device SCI FIFO Digital Loop Back Test.
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>SCI FIFO Digital Loop Back</h1>
//!
//!   This test uses the loopback test mode of the SCI module to send
//!   characters starting with 0x00 through 0xFF.  The test will send
//!   a character and then check the receive buffer for a correct match.
//!
//!   Watch Variables:
//!   - LoopCount - Number of characters sent
//!   - ErrorCount - Number of errors detected
//!   - SendChar - Character sent
//!   - ReceivedChar - Character received
//
//#############################################################################
// $TI Release: F2802x Support Library v222 $
// $Release Date: Thu Jan 15 13:56:57 CST 2015 $
// $Copyright: Copyright (C) 2008-2015 Texas Instruments Incorporated -
//             http://www.ti.com/ ALL RIGHTS RESERVED $
//#############################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File
#include <stdio.h>
#include <file.h>

#include "f2802x_common/include/adc.h"
#include "f2802x_common/include/clk.h"
#include "f2802x_common/include/flash.h"
#include "f2802x_common/include/gpio.h"
#include "f2802x_common/include/pie.h"
#include "f2802x_common/include/pll.h"
#include "f2802x_common/include/sci.h"
#include "f2802x_common/include/wdog.h"

// Prototype statements for functions found within this file.
void scia_init(void);
void scia_fifo_init(void);
void scia_xmit(int a);
void error(void);

// Global counts used in this example
uint16_t LoopCount;
uint16_t ErrorCount;

ADC_Handle myAdc;
CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;
SCI_Handle mySci;

void main(void)
{
    uint16_t SendChar;
    uint16_t ReceivedChar;
    
    CPU_Handle myCpu;
    PLL_Handle myPll;
    WDOG_Handle myWDog;
    
    // Initialize all the handles needed for this application    
    myAdc = ADC_init((void *)ADC_BASE_ADDR, sizeof(ADC_Obj));
    myClk = CLK_init((void *)CLK_BASE_ADDR, sizeof(CLK_Obj));
    myCpu = CPU_init((void *)NULL, sizeof(CPU_Obj));
    myFlash = FLASH_init((void *)FLASH_BASE_ADDR, sizeof(FLASH_Obj));
    myGpio = GPIO_init((void *)GPIO_BASE_ADDR, sizeof(GPIO_Obj));
    myPie = PIE_init((void *)PIE_BASE_ADDR, sizeof(PIE_Obj));
    myPll = PLL_init((void *)PLL_BASE_ADDR, sizeof(PLL_Obj));
    mySci = SCI_init((void *)SCIA_BASE_ADDR, sizeof(SCI_Obj));
    myWDog = WDOG_init((void *)WDOG_BASE_ADDR, sizeof(WDOG_Obj));
    
    // Perform basic system initialization    
    WDOG_disable(myWDog);
    CLK_enableAdcClock(myClk);
    (*Device_cal)();
    
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

    // Setup GPIO
    GPIO_setPullUp(myGpio, GPIO_Number_28, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_29, GPIO_PullUp_Disable);
    GPIO_setQualification(myGpio, GPIO_Number_28, GPIO_Qual_ASync);
    GPIO_setMode(myGpio, GPIO_Number_28, GPIO_28_Mode_SCIRXDA);
    GPIO_setMode(myGpio, GPIO_Number_29, GPIO_29_Mode_SCITXDA);

    // Setup a debug vector table and enable the PIE
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);

    LoopCount = 0;
    ErrorCount = 0;

    scia_init();        // Initialize SCI for digital loop back
    scia_fifo_init();   // Initialize the SCI FIFO

    // Send a character starting with 0
    SendChar = 0;

    // Send Characters forever starting with 0x00 and going through
    // 0xFF.  After sending each, check the receive buffer for the correct value
    for(;;) {

        SCI_putDataBlocking(mySci, SendChar);

        while(SCI_getRxFifoStatus(mySci) == SCI_FifoStatus_Empty){
        }

        // Check received character
        ReceivedChar = SCI_getData(mySci);
        if(ReceivedChar != SendChar) error();

        // Move to the next character and repeat the test
        SendChar++;
        // Limit the character to 8-bits
        SendChar &= 0x00FF;
        LoopCount++;
    }

}

// Step 7. Insert all local Interrupt Service Routines (ISRs) and functions here:

void error(void)
{
      ErrorCount++;
    __asm(" ESTOP0");  // Uncomment to stop the test here
    for (;;) {
    }

}

void scia_init()
{

    CLK_enableSciaClock(myClk);

    // 1 stop bit,  No loopback
    // No parity,8 char bits,
    // async mode, idle-line protocol
    SCI_disableParity(mySci);
    SCI_setNumStopBits(mySci, SCI_NumStopBits_One);
    SCI_setCharLength(mySci, SCI_CharLength_8_Bits);
    
    // enable TX, RX, internal SCICLK,
    // Disable RX ERR, SLEEP, TXWAKE
    SCI_enableTx(mySci);
    SCI_enableRx(mySci);
    SCI_enableTxInt(mySci);
    SCI_enableRxInt(mySci);

    SCI_enableLoopBack(mySci);

    // SCI BRR = LSPCLK/(SCI BAUDx8) - 1
#if (CPU_FRQ_50MHZ)
    SCI_setBaudRate(mySci, SCI_BaudRate_9_6_kBaud);
#elif (CPU_FRQ_40MHZ)
    SCI_setBaudRate(mySci, (SCI_BaudRate_e)129);
#endif

    SCI_enable(mySci);
    
    return;
}

// Initalize the SCI FIFO
void scia_fifo_init()
{
    SCI_enableFifoEnh(mySci);
    SCI_resetTxFifo(mySci);
    SCI_clearTxFifoInt(mySci);
    SCI_resetChannels(mySci);
    SCI_setTxFifoIntLevel(mySci, SCI_FifoLevel_Empty);
    
    SCI_resetRxFifo(mySci);
    SCI_clearRxFifoInt(mySci);
    SCI_setRxFifoIntLevel(mySci, SCI_FifoLevel_4_Words);
    
    return;
}


//===========================================================================
// No more.
//===========================================================================

