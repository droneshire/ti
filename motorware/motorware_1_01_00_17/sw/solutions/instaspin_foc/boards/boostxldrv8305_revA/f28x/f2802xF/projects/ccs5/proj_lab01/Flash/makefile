################################################################################
# Automatically-generated file. Do not edit!
################################################################################

SHELL = cmd.exe

CG_TOOL_ROOT := C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS

GEN_OPTS__FLAG := 
GEN_CMDS__FLAG := 

ORDERED_OBJS += \
"C:/ti/motorware/motorware_1_01_00_17/sw/modules/fast/lib/32b/f28x/f2802x/2802xRevB_Fast_IQ_ROMSymbols.lib" \
"C:/ti/motorware/motorware_1_01_00_17/sw/modules/fast/lib/32b/f28x/f2802x/2802xRevB_Fast_ONLY_ROMSymbols.lib" \
"C:/ti/motorware/motorware_1_01_00_17/sw/modules/fast/lib/32b/f28x/f2802x/2802xRevB_Fast_RTS_ROMSymbols.lib" \
-lrts2800_ml.lib \
"C:/ti/motorware/motorware_1_01_00_17/sw/modules/fast/lib/32b/f28x/f2802x/fast_public.lib" \
"C:/ti/motorware/motorware_1_01_00_17/sw/modules/iqmath/lib/f28x/32b/IQmath.lib" \
"./CodeStartBranch.obj" \
"./adc.obj" \
"./clk.obj" \
"./cpu.obj" \
"./drv8305.obj" \
"./flash.obj" \
"./gpio.obj" \
"./hal.obj" \
"./memCopy.obj" \
"./osc.obj" \
"./pie.obj" \
"./pll.obj" \
"./proj_lab01.obj" \
"./pwm.obj" \
"./pwr.obj" \
"./spi.obj" \
"./timer.obj" \
"./usDelay.obj" \
"./user.obj" \
"./wdog.obj" \
"C:/ti/motorware/motorware_1_01_00_17/sw/ide/ccs/cmd/f2802x/F28027F.cmd" \
$(GEN_CMDS__FLAG) \

-include ../makefile.init

RM := DEL /F
RMDIR := RMDIR /S/Q

# All of the sources participating in the build are defined here
-include sources.mk
-include subdir_vars.mk
-include subdir_rules.mk
-include objects.mk

ifneq ($(MAKECMDGOALS),clean)
ifneq ($(strip $(C55_DEPS)),)
-include $(C55_DEPS)
endif
ifneq ($(strip $(C_UPPER_DEPS)),)
-include $(C_UPPER_DEPS)
endif
ifneq ($(strip $(S67_DEPS)),)
-include $(S67_DEPS)
endif
ifneq ($(strip $(S62_DEPS)),)
-include $(S62_DEPS)
endif
ifneq ($(strip $(S_DEPS)),)
-include $(S_DEPS)
endif
ifneq ($(strip $(OPT_DEPS)),)
-include $(OPT_DEPS)
endif
ifneq ($(strip $(C??_DEPS)),)
-include $(C??_DEPS)
endif
ifneq ($(strip $(ASM_UPPER_DEPS)),)
-include $(ASM_UPPER_DEPS)
endif
ifneq ($(strip $(S??_DEPS)),)
-include $(S??_DEPS)
endif
ifneq ($(strip $(C64_DEPS)),)
-include $(C64_DEPS)
endif
ifneq ($(strip $(CXX_DEPS)),)
-include $(CXX_DEPS)
endif
ifneq ($(strip $(S64_DEPS)),)
-include $(S64_DEPS)
endif
ifneq ($(strip $(INO_DEPS)),)
-include $(INO_DEPS)
endif
ifneq ($(strip $(CLA_DEPS)),)
-include $(CLA_DEPS)
endif
ifneq ($(strip $(S55_DEPS)),)
-include $(S55_DEPS)
endif
ifneq ($(strip $(SV7A_DEPS)),)
-include $(SV7A_DEPS)
endif
ifneq ($(strip $(C62_DEPS)),)
-include $(C62_DEPS)
endif
ifneq ($(strip $(C67_DEPS)),)
-include $(C67_DEPS)
endif
ifneq ($(strip $(PDE_DEPS)),)
-include $(PDE_DEPS)
endif
ifneq ($(strip $(K_DEPS)),)
-include $(K_DEPS)
endif
ifneq ($(strip $(C_DEPS)),)
-include $(C_DEPS)
endif
ifneq ($(strip $(CC_DEPS)),)
-include $(CC_DEPS)
endif
ifneq ($(strip $(C++_DEPS)),)
-include $(C++_DEPS)
endif
ifneq ($(strip $(C43_DEPS)),)
-include $(C43_DEPS)
endif
ifneq ($(strip $(S43_DEPS)),)
-include $(S43_DEPS)
endif
ifneq ($(strip $(ASM_DEPS)),)
-include $(ASM_DEPS)
endif
ifneq ($(strip $(S_UPPER_DEPS)),)
-include $(S_UPPER_DEPS)
endif
ifneq ($(strip $(CPP_DEPS)),)
-include $(CPP_DEPS)
endif
ifneq ($(strip $(SA_DEPS)),)
-include $(SA_DEPS)
endif
endif

-include ../makefile.defs

# Add inputs and outputs from these tool invocations to the build variables 
EXE_OUTPUTS += \
proj_lab01.out \

EXE_OUTPUTS__QUOTED += \
"proj_lab01.out" \


# All Target
all: proj_lab01.out

# Tool invocations
proj_lab01.out: $(OBJS) $(CMD_SRCS) $(LIB_SRCS) $(GEN_CMDS)
	@echo 'Building target: $@'
	@echo 'Invoking: C2000 Linker'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt -O2 -g --define=FLASH --define=FAST_ROM_V1p7 --define=F2802xF --diag_warning=225 --display_error_number --asm_listing -z -m"proj_lab01.map" --stack_size=0x180 --warn_sections -i"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/lib" -i"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" --reread_libs --priority --disable_auto_rts --diag_suppress=16002 --diag_suppress=10063-D --xml_link_info="proj_lab01_linkInfo.xml" --entry_point=code_start --rom_model -o "proj_lab01.out" $(ORDERED_OBJS)
	@echo 'Finished building target: $@'
	@echo ' '

# Other Targets
clean:
	-$(RM) $(EXE_OUTPUTS__QUOTED)
	-$(RM) "CodeStartBranch.obj" "adc.obj" "clk.obj" "cpu.obj" "drv8305.obj" "flash.obj" "gpio.obj" "hal.obj" "memCopy.obj" "osc.obj" "pie.obj" "pll.obj" "proj_lab01.obj" "pwm.obj" "pwr.obj" "spi.obj" "timer.obj" "usDelay.obj" "user.obj" "wdog.obj" 
	-$(RM) "adc.d" "clk.d" "cpu.d" "drv8305.d" "flash.d" "gpio.d" "hal.d" "memCopy.d" "osc.d" "pie.d" "pll.d" "proj_lab01.d" "pwm.d" "pwr.d" "spi.d" "timer.d" "user.d" "wdog.d" 
	-$(RM) "CodeStartBranch.d" "usDelay.d" 
	-@echo 'Finished clean'
	-@echo ' '

.PHONY: all clean dependents
.SECONDARY:

-include ../makefile.targets

