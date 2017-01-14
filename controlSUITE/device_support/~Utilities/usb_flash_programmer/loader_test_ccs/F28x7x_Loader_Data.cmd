//This is a demonstration file for use with the TMS320F28x7x boot loader.
//It puts all loadable program and data sections into parts of RAM that are
//not used by the boot ROM.

MEMORY
{
	PAGE 0:
	/* BEGIN is used for the "Boot to RAM" bootloader mode */
	BEGIN           : origin = 0x000000, length = 0x000002
	BOOT_RSVD1      : origin = 0x000002, length = 0x000120    /* Part of M0; used by the boot ROM stack */

	RAMM0           : origin = 0x000122, length = 0x0002DE
	RAMD0           : origin = 0x00B000, length = 0x000800

	RAMLS0          : origin = 0x008000, length = 0x000800
	RAMLS1          : origin = 0x008800, length = 0x000800
	RAMLS2          : origin = 0x009000, length = 0x000800

	RAMGS0          : origin = 0x00C000, length = 0x001000
	RAMGS1          : origin = 0x00D000, length = 0x001000
	RAMGS2          : origin = 0x00E000, length = 0x001000
	RAMGS3          : origin = 0x00F000, length = 0x001000
	RAMGS4          : origin = 0x010000, length = 0x001000
	RAMGS5          : origin = 0x011000, length = 0x001000
	RAMGS6          : origin = 0x012000, length = 0x001000
	RAMGS7          : origin = 0x013000, length = 0x001000

	RESET           : origin = 0x3FF16A, length = 0x000002

	PAGE 1:
	RAMM1           : origin = 0x000400, length = 0x000400
	RAMD1           : origin = 0x00B800, length = 0x000800

	RAMLS3          : origin = 0x009800, length = 0x000800
	RAMLS4          : origin = 0x00A000, length = 0x000800
	RAMLS5          : origin = 0x00A800, length = 0x000800

	RAMGS8          : origin = 0x014000, length = 0x001000
	RAMGS9          : origin = 0x015000, length = 0x001000
	RAMGS10         : origin = 0x016000, length = 0x001000
	RAMGS11         : origin = 0x017000, length = 0x001000
	RAMGS12         : origin = 0x018000, length = 0x001000
	RAMGS13         : origin = 0x019000, length = 0x001000
	RAMGS14         : origin = 0x01A000, length = 0x001000
	RAMGS15         : origin = 0x01B000, length = 0x001000

	CPU2TOCPU1RAM   : origin = 0x03F800, length = 0x000400
	CPU1TOCPU2RAM   : origin = 0x03FC00, length = 0x000400
}

SECTIONS
{
    /* Constants and initalization values are traditionally put in page 0
       since some tools won't load data from page 1. The .const, .bss,
       .stack, and .sysmem sections must be in the lower 64kW of memory
       according to section 4.3.6 of the compiler guide (SPRU514). */
	.reset          : > RAMLS0,    PAGE = 0
	codestart       : > RAMLS0,    PAGE = 0
	.text           : > RAMLS0,    PAGE = 0
	.cinit          : > RAMLS1,    PAGE = 0
	.pinit          : > RAMLS1,    PAGE = 0

	.const          : > RAMLS3,    PAGE = 1
	.econst         : > RAMGS8,    PAGE = 1
	.stack          : > RAMM1,     PAGE = 1
	.data           : > RAMLS3,    PAGE = 1
	.ebss           : > RAMLS3,    PAGE = 1
	.esysmem        : > RAMLS3,    PAGE = 1
}
