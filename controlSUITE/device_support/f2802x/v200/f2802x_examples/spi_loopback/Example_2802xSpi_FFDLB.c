//#############################################################################
//
//  File:   f2802x_examples_ccsv4/spi_loopback/Example_F2802xSpi_FFDLB.c
//
//  Title:  F2802x Device Spi Digital Loop Back program.
//
//  Group:          C2000
//  Target Device:  TMS320F2802x
//
//! \addtogroup example_list
//!  <h1>SPI Digital Loop Back</h1>
//!
//!   This program is a SPI example that uses the internal loopback of
//!   the peripheral.  Interrupts are not used.
//!
//!   A stream of data is sent and then compared to the recieved stream.
//!
//!   The sent data looks like this:
//!   0000 0001 0002 0003 0004 0005 0006 0007 .... FFFE FFFF
//!
//!   This pattern is repeated forever.
//!
//!   Watch Variables:
//!   - sdata - sent data
//!   - rdata - received data
//
//  (C) Copyright 2012, Texas Instruments, Inc.
//#############################################################################
// $TI Release: f2802x Support Library v200 $
// $Release Date: Tue Jul 24 10:01:39 CDT 2012 $
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
void delay_loop(void);
void spi_xmit(uint16_t a);
void spi_fifo_init(void);
void spi_init(void);
void error(void);

ADC_Handle myAdc;
CLK_Handle myClk;
FLASH_Handle myFlash;
GPIO_Handle myGpio;
PIE_Handle myPie;
SPI_Handle mySpi;

void main(void)
{
    uint16_t sdata;  // send data
    uint16_t rdata;  // received data
    
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

    spi_init();         // Initialize SPI
    spi_fifo_init();    // Initialize the SPI FIFOs

    sdata = 0x0000;
    
    for(;;) {
        
        // Transmit data
        SPI_write(mySpi, sdata);
        
        // Wait until data is received
        while(SPI_getRxFifoStatus(mySpi) == SPI_FifoStatus_Empty){
        }
        
        // Check against sent data
        rdata = SPI_read(mySpi);
        if(rdata != sdata) 
            error();
            
        sdata++;
    }
}


void delay_loop()
{
    long      i;
    
    for (i = 0; i < 1000000; i++) {
    }
    
    return;
}

void error(void)
{
    asm(" ESTOP0");     // Test failed!! Stop!
    for (;;){
    }
}

void spi_init()
{
    CLK_enableSpiaClock(myClk);
    
    // Reset on, rising edge, 16-bit char bits
    SPI_setCharLength(mySpi, SPI_CharLength_16_Bits);

    // Enable master mode, normal phase,
    // enable talk, and SPI int disabled.
    SPI_setMode(mySpi, SPI_Mode_Master);
    SPI_enableTx(mySpi);
    
    SPI_setBaudRate(mySpi, SPI_BaudRate_1_MBaud);
    
    // Relinquish SPI from Reset
    SPI_enableLoopBack(mySpi);
    SPI_enable(mySpi);

    // Set so breakpoints don't disturb xmission
    SPI_setPriority(mySpi, SPI_Priority_FreeRun);
    
    return;
}

void spi_fifo_init()
{
    
    // Initialize SPI FIFO registers
    SPI_enableChannels(mySpi);
    SPI_enableFifoEnh(mySpi);
    SPI_resetTxFifo(mySpi);
    SPI_clearTxFifoInt(mySpi);    
    SPI_resetRxFifo(mySpi);
    SPI_clearRxFifoInt(mySpi);
    SPI_setRxFifoIntLevel(mySpi, SPI_FifoLevel_4_Words);
    
    return;
}

//===========================================================================
// No more.
//===========================================================================

