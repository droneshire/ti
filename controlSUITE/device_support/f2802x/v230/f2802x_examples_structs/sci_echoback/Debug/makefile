################################################################################
# Automatically-generated file. Do not edit!
################################################################################

SHELL = cmd.exe

CG_TOOL_ROOT := C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS

GEN_OPTS__FLAG := 
GEN_CMDS__FLAG := 

ORDERED_OBJS += \
"./Example_2802xSci_Echoback.obj" \
"./F2802x_GlobalVariableDefs.obj" \
"./f2802x_codestartbranch.obj" \
"./f2802x_defaultisr.obj" \
"./f2802x_piectrl.obj" \
"./f2802x_pievect.obj" \
"./f2802x_sci.obj" \
"./f2802x_sysctrl.obj" \
"./f2802x_usdelay.obj" \
"C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/cmd/F2802x_Headers_nonBIOS.cmd" \
"C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/cmd/F2802x_generic_ram.cmd" \
$(GEN_CMDS__FLAG) \
-lrts2800_ml.lib \
-lIQmath.lib \

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
Example_2802xSci_echoback.out \

EXE_OUTPUTS__QUOTED += \
"Example_2802xSci_echoback.out" \


# All Target
all: Example_2802xSci_echoback.out

# Tool invocations
Example_2802xSci_echoback.out: $(OBJS) $(CMD_SRCS) $(GEN_CMDS)
	@echo 'Building target: $@'
	@echo 'Invoking: C2000 Linker'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt -g --define="_DEBUG" --define="LARGE_MODEL" --quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063 --issue_remarks --output_all_syms --cdebug_asm_data -z -m"Example_2802xSci_echoback.map" --stack_size=0x200 --warn_sections -i"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/lib" -i"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" -i"C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_examples_structs/sci_echoback" -i"C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/lib" -i"C:/ti/controlSUITE/libs/math/IQmath/v15c/lib" --reread_libs --verbose_diagnostics --issue_remarks --xml_link_info="Example_2802xSci_echoback_linkInfo.xml" --entry_point=code_start --rom_model -o "Example_2802xSci_echoback.out" $(ORDERED_OBJS)
	@echo 'Finished building target: $@'
	@echo ' '

# Other Targets
clean:
	-$(RM) $(EXE_OUTPUTS__QUOTED)
	-$(RM) "Example_2802xSci_Echoback.obj" "F2802x_GlobalVariableDefs.obj" "f2802x_codestartbranch.obj" "f2802x_defaultisr.obj" "f2802x_piectrl.obj" "f2802x_pievect.obj" "f2802x_sci.obj" "f2802x_sysctrl.obj" "f2802x_usdelay.obj" 
	-$(RM) "Example_2802xSci_Echoback.d" "F2802x_GlobalVariableDefs.d" "f2802x_defaultisr.d" "f2802x_piectrl.d" "f2802x_pievect.d" "f2802x_sci.d" "f2802x_sysctrl.d" 
	-$(RM) "f2802x_codestartbranch.d" "f2802x_usdelay.d" 
	-@echo 'Finished clean'
	-@echo ' '

.PHONY: all clean dependents
.SECONDARY:

-include ../makefile.targets

