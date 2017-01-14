################################################################################
# Automatically-generated file. Do not edit!
################################################################################

SHELL = cmd.exe

# Each subdirectory must supply rules for building sources it contributes
Example_2802xSci_Echoback.obj: ../Example_2802xSci_Echoback.c $(GEN_OPTS) | $(GEN_HDRS)
	@echo 'Building file: $<'
	@echo 'Invoking: C2000 Compiler'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt --include_path="C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/include" --include_path="C:/ti/controlSUITE/libs/math/IQmath/v15c/include" -g --define="_DEBUG" --define="LARGE_MODEL" --quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063 --issue_remarks --output_all_syms --cdebug_asm_data --preproc_with_compile --preproc_dependency="Example_2802xSci_Echoback.d" $(GEN_OPTS__FLAG) "$<"
	@echo 'Finished building: $<'
	@echo ' '

F2802x_GlobalVariableDefs.obj: C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/source/F2802x_GlobalVariableDefs.c $(GEN_OPTS) | $(GEN_HDRS)
	@echo 'Building file: $<'
	@echo 'Invoking: C2000 Compiler'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt --include_path="C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/include" --include_path="C:/ti/controlSUITE/libs/math/IQmath/v15c/include" -g --define="_DEBUG" --define="LARGE_MODEL" --quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063 --issue_remarks --output_all_syms --cdebug_asm_data --preproc_with_compile --preproc_dependency="F2802x_GlobalVariableDefs.d" $(GEN_OPTS__FLAG) "$<"
	@echo 'Finished building: $<'
	@echo ' '

f2802x_codestartbranch.obj: C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/source/f2802x_codestartbranch.asm $(GEN_OPTS) | $(GEN_HDRS)
	@echo 'Building file: $<'
	@echo 'Invoking: C2000 Compiler'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt --include_path="C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/include" --include_path="C:/ti/controlSUITE/libs/math/IQmath/v15c/include" -g --define="_DEBUG" --define="LARGE_MODEL" --quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063 --issue_remarks --output_all_syms --cdebug_asm_data --preproc_with_compile --preproc_dependency="f2802x_codestartbranch.d" $(GEN_OPTS__FLAG) "$<"
	@echo 'Finished building: $<'
	@echo ' '

f2802x_defaultisr.obj: C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/source/f2802x_defaultisr.c $(GEN_OPTS) | $(GEN_HDRS)
	@echo 'Building file: $<'
	@echo 'Invoking: C2000 Compiler'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt --include_path="C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/include" --include_path="C:/ti/controlSUITE/libs/math/IQmath/v15c/include" -g --define="_DEBUG" --define="LARGE_MODEL" --quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063 --issue_remarks --output_all_syms --cdebug_asm_data --preproc_with_compile --preproc_dependency="f2802x_defaultisr.d" $(GEN_OPTS__FLAG) "$<"
	@echo 'Finished building: $<'
	@echo ' '

f2802x_piectrl.obj: C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/source/f2802x_piectrl.c $(GEN_OPTS) | $(GEN_HDRS)
	@echo 'Building file: $<'
	@echo 'Invoking: C2000 Compiler'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt --include_path="C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/include" --include_path="C:/ti/controlSUITE/libs/math/IQmath/v15c/include" -g --define="_DEBUG" --define="LARGE_MODEL" --quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063 --issue_remarks --output_all_syms --cdebug_asm_data --preproc_with_compile --preproc_dependency="f2802x_piectrl.d" $(GEN_OPTS__FLAG) "$<"
	@echo 'Finished building: $<'
	@echo ' '

f2802x_pievect.obj: C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/source/f2802x_pievect.c $(GEN_OPTS) | $(GEN_HDRS)
	@echo 'Building file: $<'
	@echo 'Invoking: C2000 Compiler'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt --include_path="C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/include" --include_path="C:/ti/controlSUITE/libs/math/IQmath/v15c/include" -g --define="_DEBUG" --define="LARGE_MODEL" --quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063 --issue_remarks --output_all_syms --cdebug_asm_data --preproc_with_compile --preproc_dependency="f2802x_pievect.d" $(GEN_OPTS__FLAG) "$<"
	@echo 'Finished building: $<'
	@echo ' '

f2802x_sci.obj: C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/source/f2802x_sci.c $(GEN_OPTS) | $(GEN_HDRS)
	@echo 'Building file: $<'
	@echo 'Invoking: C2000 Compiler'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt --include_path="C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/include" --include_path="C:/ti/controlSUITE/libs/math/IQmath/v15c/include" -g --define="_DEBUG" --define="LARGE_MODEL" --quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063 --issue_remarks --output_all_syms --cdebug_asm_data --preproc_with_compile --preproc_dependency="f2802x_sci.d" $(GEN_OPTS__FLAG) "$<"
	@echo 'Finished building: $<'
	@echo ' '

f2802x_sysctrl.obj: C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/source/f2802x_sysctrl.c $(GEN_OPTS) | $(GEN_HDRS)
	@echo 'Building file: $<'
	@echo 'Invoking: C2000 Compiler'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt --include_path="C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/include" --include_path="C:/ti/controlSUITE/libs/math/IQmath/v15c/include" -g --define="_DEBUG" --define="LARGE_MODEL" --quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063 --issue_remarks --output_all_syms --cdebug_asm_data --preproc_with_compile --preproc_dependency="f2802x_sysctrl.d" $(GEN_OPTS__FLAG) "$<"
	@echo 'Finished building: $<'
	@echo ' '

f2802x_usdelay.obj: C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/source/f2802x_usdelay.asm $(GEN_OPTS) | $(GEN_HDRS)
	@echo 'Building file: $<'
	@echo 'Invoking: C2000 Compiler'
	"C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/bin/cl2000" -v28 -ml -mt --include_path="C:/ti/ccsv7/tools/compiler/ti-cgt-c2000_16.9.1.LTS/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_headers/include" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230" --include_path="C:/ti/controlSUITE/device_support/f2802x/v230/f2802x_common/include" --include_path="C:/ti/controlSUITE/libs/math/IQmath/v15c/include" -g --define="_DEBUG" --define="LARGE_MODEL" --quiet --verbose_diagnostics --diag_warning=225 --diag_suppress=232 --diag_suppress=10063 --issue_remarks --output_all_syms --cdebug_asm_data --preproc_with_compile --preproc_dependency="f2802x_usdelay.d" $(GEN_OPTS__FLAG) "$<"
	@echo 'Finished building: $<'
	@echo ' '


