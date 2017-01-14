################################################################################
# TI CS2000 Makefile
################################################################################

TARGET_NAME = Example_2802xSci_Echoback
TARGET = $(TARGET_NAME)

#####################
# Path locations
#####################
# TODO(ross): make this an env variable or detect ti by backwards recursion
TI_ROOT_DIR := /home/ross/shared_vm/ti

CCS_INSTALL_ROOT_DIR := $(TI_ROOT_DIR)/ccsv7
CCS_TOOLS_DIR := $(CCS_INSTALL_ROOT_DIR)/tools
COMPILER_DIR := $(CCS_INSTALL_ROOT_DIR)/tools/compiler/ti-cgt-c2000_16.9.1.LTS

CONTROL_SUITE_ROOT := $(TI_ROOT_DIR)/controlSUITE
MOTORWARE_ROOT := $(TI_ROOT_DIR)/motorware/motorware_1_01_00_17

#####################
# Executables
#####################
COMPILER := $(COMPILER_DIR)/bin/cl2000
GEN_SOURCE_RULES = ../../../python/sourcegen/extract_sources.py

#####################
# Commands
#####################
RM := rm
RMDIR := rm -rf
MDKIR := mkdir -p

# All of the sources participating in the build are defined here
-include gen_sources.mk
-include gen_subdir_vars.mk
-include gen_subdir_rules.mk
-include gen_objects.mk

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


#####################
# Define flags
#####################

BUILD_DEFINES = --define=_DEBUG --define=LARGE_MODEL

#####################
# Flag definitions
#####################

FLAGS = \
	--quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063

C2000_CFLAGS = \
	--preproc_with_compile --output_all_syms


C2000_LFLAGS = \
	--stack_size=0x200 --reread_libs --issue_remarks \
	--entry_point=code_start --rom_model --warn_sections \
	--xml_link_info=../Debug/$(TARGET_NAME)_linkInfo.xml \
	--issue_remarks

LIBRARY_OBJS = \
	rts2800_ml.lib \
	IQmath.lib

LIBRARY_OBJS_FLAGS = $(addprefix -l, $(LIBRARY_OBJS))

#####################
# Build paths
#####################

INCLUDE_PATH = \
	$(COMPILER_DIR)/include \
	$(CONTROL_SUITE_ROOT)/device_support/f2802x/v230/f2802x_common/include \
	$(CONTROL_SUITE_ROOT)/device_support/f2802x/v230/f2802x_headers/include \
	$(CONTROL_SUITE_ROOT)/libs/math/IQmath/v15c/include \
	.. \
	.

INCLUDE_PATH_FLAGS = $(addprefix -i, $(INCLUDE_PATH))

LIBRARY_PATH = \
	$(COMPILER_DIR)/lib \
	$(CONTROL_SUITE_ROOT)/device_support/f2802x/v230/f2802x_common/lib \
	$(CONTROL_SUITE_ROOT)/libs/math/IQmath/v15c/lib \

LIBRARY_PATH_FLAGS = $(addprefix -i, $(LIBRARY_PATH))

.PHONY: all
all: srcgen $(TARGET).out
	@echo Building

.SECONDARY:

ORDERED_OBJS = \
	Example_2802xSci_Echoback.obj \
	F2802x_GlobalVariableDefs.obj \
	f2802x_codestartbranch.obj \
	f2802x_defaultisr.obj \
	f2802x_piectrl.obj \
	f2802x_pievect.obj \
	f2802x_sci.obj \
	f2802x_sysctrl.obj \
	f2802x_usdelay.obj \
	$(CONTROL_SUITE_ROOT)/device_support/f2802x/v230/f2802x_headers/cmd/F2802x_Headers_nonBIOS.cmd \
	$(CONTROL_SUITE_ROOT)/device_support/f2802x/v230/f2802x_common/cmd/F2802x_generic_ram.cmd \
	$(GEN_CMDS__FLAG) \
	$(LIBRARY_OBJS_FLAGS)

# Tool invocations
$(TARGET).out: $(OBJS) $(CMD_SRCS) $(LIB_SRCS) $(GEN_CMDS)
	@echo $(OBJS)
	@echo 'Building $@'
	@echo 'Invoking: C2000 Linker'
	$(COMPILER) -v28 -ml -mt -g $(BUILD_DEFINES) $(FLAGS) $(C2000_LFLAGS) -z -m$(TARGET).map $(INCLUDE_PATH_FLAGS) $(LIBRARY_PATH_FLAGS) -o $@ $(ORDERED_OBJS)
	@echo 'Finished building: $@'
	@echo ' '

.PHONY: srcgen
srcgen:
	@echo 'Running source gen'
	python $(GEN_SOURCE_RULES) $(TARGET_NAME)

.PHONY: clean
clean:
	-$(RMDIR) *.obj
	-$(RMDIR) *.d
	-$(RMDIR) *.mk
	-$(RMDIR) *.map
	-@echo 'Finished clean'
	-@echo ' '
