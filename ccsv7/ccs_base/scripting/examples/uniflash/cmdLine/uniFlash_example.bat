@ECHO OFF
REM This file contains 7 different examples, each showing different functionality provided by the command line tool. You should be able to copy each example and run them from command line, but only if you have the same target. Otherwise, you will need to modify them for your other environment.

REM 1. Example of displaying the help information
uniflash -help

REM 2. Example of using an existing Configuration file and viewing available Flash options
uniflash -ccxml ../configs/TMS470MF066_USB.ccxml -viewOptions

REM 3. Example of creating a new Configuration file and listing available Flash operations
uniflash -createConfig "Texas Instruments XDS100v2 USB Emulator" "TMS470MF06607" ../configs/uniflash.ccxml -listOperations

REM 4. Example of enabling logging, set Flash Options, and perform a Flash operation
uniflash -log myLog.xml -ccxml ../configs/TMS470MF066_USB.ccxml -setOptions FlashEraseSelection="Selected Sectors Only" FlashBank0Sector0=0 FlashBank0Sector1=true -operation Erase

REM 5. Use the -core argument for multicore devices (ie; Concerto accessing the C28 core), load settings from a session file (changes default to erase Necessary Sectors Only), load a program, and running the target after program load
uniflash -ccxml ../configs/F28M35H52C1_XDS560.ccxml -core "C28" -loadSettings ../session/f28m35.session -program ../programs/f28m35_c28_blinky.out -targetOp run

REM 6. Use the -core argument for multicore devices (this time, Concerto accessing the M3 core), and export the memory to a COFF file
uniflash -ccxml ../configs/F28M35H52C1_XDS560.ccxml -core M3 -export COFF 0x200000 0x2000 ../programs/export.out

REM 7. An example of chaining (issuing multiple) operations in the same command. It will configure an F28035 device, give the necessary password, unlock the device, erase the Flash, load multiple Flash programs, calculate the checksum (which will be logged in the log file), and export the memory to one single program file.
uniflash -log myLog.xml -ccxml ../configs/TMS320F28035.ccxml -setOptions FlashKey0=AAAA FlashKey1=BBBB -operation Unlock Erase -program ../programs/F28035_Prog1.out ../programs/F28035_Prog2.out ../programs/F28035_Prog3.out -operation "CalculateChecksum" -export COFF 0x3E8000 0xC000 ../programs/export2.out

REM 8. New for UniFlash v2.0, an example of access the target via the Serial COM port and performing a Flash operation. On the C28x core on a Concerto F28M35x device, set the COM port to COM29 and the Baud Rate to 115200 (update as needed), and perform a Flash Erase.
uniflash -ccxml ../configs/F28M35H52C1_Serial.ccxml -core "C28" -setOptions FlashSerialCOMPort=COM29 FlashSerialBaudRate=115200 -operation Erase