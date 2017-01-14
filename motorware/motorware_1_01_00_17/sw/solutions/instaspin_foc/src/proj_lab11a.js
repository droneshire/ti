expRemoveAll();
expAdd ("gMotorVars");
expAdd ("gMotorVars.Flag_enableSys", getDecimal());
expAdd ("gMotorVars.Flag_Run_Identify", getDecimal());
expAdd ("gMotorVars.Flag_enableOffsetcalc", getDecimal());
expAdd ("gMotorVars.Flag_enableRsRecalc", getDecimal());
expAdd ("gMotorVars.Flag_enablePowerWarp", getDecimal());
expAdd ("gMotorVars.Flag_enableFieldWeakening", getDecimal());
expAdd ("gMotorVars.Flag_enableForceAngle", getDecimal());
expAdd ("gFlag_enableRsOnLine", getDecimal());
expAdd ("gFlag_updateRs", getDecimal());

expAdd ("gMotorVars.EstState");

expAdd ("gMotorVars.IdRef_A", getQValue(24));
expAdd ("gMotorVars.SpeedRef_krpm", getQValue(24));
expAdd ("gMotorVars.Speed_krpm", getQValue(24));

expAdd ("gMotorVars.MagnCurr_A");
expAdd ("gMotorVars.Rr_Ohm");
expAdd ("gMotorVars.Rs_Ohm");
expAdd ("gMotorVars.RsOnLine_Ohm");
expAdd ("gMotorVars.Lsd_H");
expAdd ("gMotorVars.Lsq_H");
expAdd ("gMotorVars.Flux_VpHz");

expAdd ("gMotorVars.VdcBus_kV", getQValue(24));

expAdd ("gOffsets_I_pu", getQValue(24));
expAdd ("gOffsets_V_pu", getQValue(24));
expAdd ("pid", getQValue(24));
expAdd ("gMotorVars.Vs", getQValue(24));
expAdd ("gMotorVars.VsRef", getQValue(24));

expAdd ("gDrvSpi8301Vars");
