expRemoveAll();
expAdd ("gMotorVars");
expAdd ("gMotorVars.UserErrorCode");
expAdd ("gMotorVars.CtrlVersion");
expAdd ("gMotorVars.Flag_enableSys", getDecimal());
expAdd ("gMotorVars.Flag_Run_Identify", getDecimal());
expAdd ("gMotorVars.Flag_enableForceAngle", getDecimal());
expAdd ("gMotorVars.Flag_enablePowerWarp", getDecimal());

expAdd ("gMotorVars.CtrlState");
expAdd ("gMotorVars.EstState");

expAdd ("gMotorVars.SpeedRef_krpm", getQValue(24));
expAdd ("gMotorVars.MaxAccel_krpmps", getQValue(24));
expAdd ("gMotorVars.Speed_krpm", getQValue(24));

expAdd ("gMotorVars.MagnCurr_A");
expAdd ("gMotorVars.Rr_Ohm");
expAdd ("gMotorVars.Rs_Ohm");
expAdd ("gMotorVars.Lsd_H");
expAdd ("gMotorVars.Lsq_H");
expAdd ("gMotorVars.Flux_VpHz");

expAdd ("gMotorVars.I_bias", getQValue(24));
expAdd ("gMotorVars.V_bias", getQValue(24));

expAdd ("gMotorVars.VdcBus_kV", getQValue(24));

expAdd ("gDrvSpi8301Vars");
