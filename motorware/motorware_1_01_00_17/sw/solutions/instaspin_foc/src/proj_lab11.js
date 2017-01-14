expRemoveAll();
expAdd ("gMotorVars");
expAdd ("gMotorVars.Flag_enableSys", getDecimal());
expAdd ("gMotorVars.Flag_Run_Identify", getDecimal());
expAdd ("gMotorVars.Flag_enableForceAngle", getDecimal());

expAdd ("gMotorVars.EstState");

expAdd ("gMotorVars.SpeedRef_krpm", getQValue(24));
expAdd ("gMotorVars.Speed_krpm", getQValue(24));

expAdd ("gMotorVars.MagnCurr_A");
expAdd ("gMotorVars.Rr_Ohm");
expAdd ("gMotorVars.Rs_Ohm");
expAdd ("gMotorVars.Lsd_H");
expAdd ("gMotorVars.Lsq_H");
expAdd ("gMotorVars.Flux_VpHz");

expAdd ("gMotorVars.VdcBus_kV", getQValue(24));

expAdd ("gOffsets_I_pu", getQValue(24));
expAdd ("gOffsets_V_pu", getQValue(24));
expAdd ("pid", getQValue(24));

expAdd ("gDrvSpi8301Vars");
