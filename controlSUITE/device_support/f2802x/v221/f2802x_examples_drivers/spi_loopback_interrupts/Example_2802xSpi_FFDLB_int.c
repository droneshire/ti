//#############################################################################
//
//  File:   f2802x_examples/spi_loopback_interrupts/Example_F2802xSpi_FFDLB_int.c
//
//  Title:  F2802x Device Spi Digital Loop Back with Interrupts Example.
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>SPI Digital Loop Back with Interrupts</h1>
//!
//!   This program is a SPI-A example that uses the internal loopback of
//!   the peripheral.  Both interrupts and the SPI FIFOs are used.
//!
//!   A stream of data is sent and then compared to the received stream.
//!
//!   The sent data looks like this:
//!   0000 0001 \n
//!   0001 0002 \n
//!   0002 0003 \n
//!   ....      \n
//!   FFFE FFFF \n
//!   FFFF 0000 \n
//!    etc..
//!
//!   This pattern is repeated forever.
//!
//!
//!   Watch Variables:
//!   - sdata[2] - Data to send
//!   - rdata[2] - Received data
//!   - rdata_point - Used to keep track of the last position in
//!                   the receive stream for error checking.
//
//  (C) Copyright 2012, Texas Instruments, Inc.
//#############################################################################
// $TI Release: PACKAGE NAME $
// $Release Date: PACKAGE RELEASE DATE $
//#############################################################################

#include "DSP28x_Project.h"     // Device Headerfile and Examples Include File

#include "f2802x_common/include/adc.h"
#include "f2802x_common/include/clk.h"
#include "f2802x_common/include/flash.h"
#include "f2802x_common/include/gpio.h"
#include "f2802x_common/include/pie.h"
#include "f2802x_common/include/pll.h"
#include "f2802x_common/include/spi.h"
#include "f2802x_common/include/wdog.h"

// Prototype statements for functions found within this file.
// interrupt void ISRTimer2(void);
__interrupt void spiTxFifoIsr(void);
__interrupt void spiRxFifoIsr(void);
void delay_loop(void);
void spi_init(void);
void spi_fifo_init(void);
void error();

uint16_t sdata[2];      // Send data buffer
uint16_t rdata[2];      // Receive data buffer
uint16_t rdata_point;   // Keep track of where we are
                        // in the data stream to check received data
                     
ADC_Handle myAdc;
CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;
SPI_Handle mySpi;

void main(void)
{
    uint16_t i;
    
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
    mySpi = SPI_init((void *)SPIA_BASE_ADDR, sizeof(SPI_Obj));
    myWDog = WDOG_init((void *)WDOG_BASE_ADDR, sizeof(WDOG_Obj));
    
    // Perform basic system initialization    
    WDOG_disable(myWDog);
    CLK_enableAdcClock(myClk);
    (*Device_cal)();
    
    //Enable SPI-A Clock
    CLK_enableSpiaClock(myClk);

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

    // Initialize GPIO
    GPIO_setPullUp(myGpio, GPIO_Number_16, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_17, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_18, GPIO_PullUp_Enable);
    GPIO_setPullUp(myGpio, GPIO_Number_19, GPIO_PullUp_Enable);
    GPIO_setQualification(myGpio, GPIO_Number_16, GPIO_Qual_ASync);
    GPIO_setQualification(myGpio, GPIO_Number_17, GPIO_Qual_ASync);
    GPIO_setQualification(myGpio, GPIO_Number_18, GPIO_Qual_ASync);
    GPIO_setQualification(myGpio, GPIO_Number_19, GPIO_Qual_ASync);
    GPIO_setMode(myGpio, GPIO_Number_16, GPIO_16_Mode_SPISIMOA);
    GPIO_setMode(myGpio, GPIO_Number_17, GPIO_17_Mode_SPISOMIA);
    GPIO_setMode(myGpio, GPIO_Number_18, GPIO_18_Mode_SPICLKA);
    GPIO_setMode(myGpio, GPIO_Number_19, GPIO_19_Mode_SPISTEA_NOT);

    // Setup a debug vector table and enable the PIE
    PIE_setDebugIntVectorTable(myPie);
    PIE_enable(myPie);

    // Register interrupt handlers in the PIE vector table
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_6, PIE_SubGroupNumber_1, (intVec_t)&spiRxFifoIsr);
    PIE_registerPieIntHandler(myPie, PIE_GroupNumber_6, PIE_SubGroupNumber_2, (intVec_t)&spiTxFifoIsr);

    // Initialize the SPI only
    spi_init();

    // Initialize the send data buffer
    for(i=0; i<2; i++)
    {
      sdata[i] = i;
    }
    rdata_point = 0;

    // Enable interrupts required for this example
    PIE_enableInt(myPie, PIE_GroupNumber_6, PIE_InterruptSource_SPIARX);
    PIE_enableInt(myPie, PIE_GroupNumber_6, PIE_InterruptSource_SPIATX);
    CPU_enableInt(myCpu, CPU_IntNumber_6);
    CPU_enableGlobalInts(myCpu);

    for(;;) {
        __asm(" NOP");
    }

}

// Some Useful local functions
void delay_loop()
{
    long      i;
    
    for (i = 0; i < 1000000; i++) {
    }
    
    return;
}

void error(void)
{
    __asm("     ESTOP0");     //Test failed!! Stop!
    for (;;){
        __asm(" NOP");
    }
}


void spi_init()
{

    SPI_reset(mySpi);
    SPI_enable(mySpi);

    // Reset on, rising edge, 16-bit char bits
    SPI_setCharLength(mySpi, SPI_CharLength_16_Bits);
    SPI_enableLoopBack(mySpi);

    // Enable master mode, normal phase,
    // enable talk, and SPI int disabled.
    SPI_setMode(mySpi, SPI_Mode_Master);
    SPI_enableTx(mySpi);
    SPI_enableOverRunInt(mySpi);
    SPI_enableInt(mySpi);

    SPI_setBaudRate(mySpi, (SPI_BaudRate_e)0x63);

//    // Initialize SPI FIFO registers
    SPI_enableFifoEnh(mySpi);
    SPI_enableChannels(mySpi);
    SPI_resetTxFifo(mySpi);
    SPI_clearTxFifoInt(mySpi);
    SPI_setTxFifoIntLevel(mySpi, SPI_FifoLevel_2_Words);
    SPI_enableTxFifoInt(mySpi);

    SPI_resetRxFifo(mySpi);
    SPI_setRxFifoIntLevel(mySpi, SPI_FifoLevel_2_Words);
    SPI_enableRxFifoInt(mySpi);
    SPI_clearRxFifoInt(mySpi);

    SPI_setTxDelay(mySpi, 0);

    // Set so breakpoints don't disturb xmission
    SPI_setPriority(mySpi, SPI_Priority_FreeRun);

    SPI_enable(mySpi);

    SPI_enableTxFifo(mySpi);
    SPI_enableRxFifo(mySpi);

}

__interrupt void spiTxFifoIsr(void)
{
     uint16_t i;
    for(i=0;i<2;i++) {
        // Send data
        SPI_write(mySpi, sdata[i]);
    }

    for(i=0;i<2;i++) {
        // Increment data for next cycle
        sdata[i]++;
    }

    // Clear Interrupt flag
    SPI_clearTxFifoInt(mySpi); 
    
    // Issue PIE ACK
    PIE_clearInt(myPie, PIE_GroupNumber_6);
    
    return;
}

__interrupt void spiRxFifoIsr(void)
{
    uint16_t i;
    
    if(SPI_getRxFifoStatus(mySpi) != SPI_FifoLevel_Empty) {
        for(i=0;i<2;i++) {
            // Read data
            rdata[i] = SPI_read(mySpi);
        }
        for(i=0;i<2;i++) {
            // Check received data
            if(rdata[i] != rdata_point+i) {
                error();
            }
        }

        rdata_point++;
    }

    // Clear Overflow flag
    SPI_clearRxFifoOvf(mySpi);
    
    // Clear Interrupt flag
    SPI_clearRxFifoInt(mySpi);
    
    // Issue PIE ack
    PIE_clearInt(myPie, PIE_GroupNumber_6);
    
    return;
}

//===========================================================================
// No more.
//===========================================================================

