expRemoveAll();
expAdd ("gMotorVars");
expAdd ("gMotorVars.Flag_enableSys", getDecimal());
expAdd ("gMotorVars.Flag_Run_Identify", getDecimal());
expAdd ("gMotorVars.Flag_enableRun", getDecimal());
expAdd ("gMotorVars.Flag_RunState", getDecimal());
expAdd ("gMotorVars.Flag_enableFlyingStart", getDecimal());
expAdd ("gMotorVars.Flag_enableSpeedCtrl", getDecimal());

expAdd ("gMotorVars.Flag_enableUserParams", getDecimal());
expAdd ("gMotorVars.Flag_enableRsRecalc", getDecimal());
expAdd ("gMotorVars.Flag_enableForceAngle", getDecimal());
expAdd ("gMotorVars.Flag_enableOffsetcalc", getDecimal());
expAdd ("gMotorVars.Flag_enablePowerWarp", getDecimal());

expAdd ("gMotorVars.CtrlState");
expAdd ("gMotorVars.EstState");

expAdd ("gMotorVars.SpeedSet_krpm", getQValue(24));
expAdd ("gMotorVars.SpeedRef_krpm", getQValue(24));
expAdd ("gMotorVars.MaxAccel_krpmps", getQValue(24));
expAdd ("gMotorVars.Speed_krpm", getQValue(24));
expAdd ("gMotorVars.Torque_Nm", getQValue(24));

expAdd ("gMotorVars.MagnCurr_A");
expAdd ("gMotorVars.Rr_Ohm");
expAdd ("gMotorVars.Rs_Ohm");
expAdd ("gMotorVars.Lsd_H");
expAdd ("gMotorVars.Lsq_H");
expAdd ("gMotorVars.Flux_VpHz");

expAdd ("gMotorVars.Kp_spd", getQValue(24));
expAdd ("gMotorVars.Ki_spd", getQValue(24));

expAdd ("gMotorVars.Kp_Idq", getQValue(24));
expAdd ("gMotorVars.Ki_Idq", getQValue(24));

expAdd ("gMotorVars.Vd", getQValue(24));
expAdd ("gMotorVars.Vq", getQValue(24));
expAdd ("gMotorVars.Vs", getQValue(24));
expAdd ("gMotorVars.VdcBus_kV", getQValue(24));

expAdd ("gMotorVars.Id_A", getQValue(24));
expAdd ("gMotorVars.Iq_A", getQValue(24));
expAdd ("gMotorVars.Is_A", getQValue(24));

expAdd ("fs");
expAdd ("gDacData");
expAdd ("cpu_time");

expAdd ("gMotorVars.OverModulation", getQValue(24));
expAdd ("svgencurrent.MinWidth", getDecimal());
expAdd ("svgencurrent.IgnoreShunt");
