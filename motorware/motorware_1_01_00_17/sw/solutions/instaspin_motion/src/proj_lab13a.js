expRemoveAll();
expAdd ("gMotorVars");
expAdd ("gMotorVars.UserErrorCode");
expAdd ("gMotorVars.CtrlVersion");
expAdd ("gMotorVars.Flag_enableSys", getDecimal());
expAdd ("gMotorVars.Flag_Run_Identify", getDecimal());
expAdd ("gMotorVars.Flag_enableOffsetcalc", getDecimal());
expAdd ("gMotorVars.Flag_enablePowerWarp", getDecimal());
expAdd ("gMotorVars.CtrlState");
expAdd ("gMotorVars.EstState");
expAdd ("gMotorVars.Flag_MotorIdentified", getDecimal());
expAdd ("gMotorVars.Torque_Nm", getQValue(24));

expAdd ("gMotorVars.PositionError_MRev");
expAdd ("gMotorVars.SpinTAC.PosCtlStatus");
expAdd ("gMotorVars.SpinTAC.InertiaEstimate_Aperkrpm", getQValue(24));
expAdd ("gMotorVars.SpinTAC.FrictionEstimate_Aperkrpm", getQValue(24));
expAdd ("gMotorVars.SpinTAC.PosCtlBw_radps", getQValue(20));
expAdd ("gMotorVars.SpinTAC.PosCtlErrorID");

expAdd ("gMotorVars.Kp_Idq", getQValue(24));
expAdd ("gMotorVars.Ki_Idq", getQValue(24));
expAdd ("gMotorVars.VdcBus_kV", getQValue(24));


expAdd ("gDrvSpi8301Vars");
