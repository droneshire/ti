expRemoveAll();
expAdd ("gMotorVars");
expAdd ("gMotorVars.UserErrorCode");
expAdd ("gMotorVars.CtrlVersion");
expAdd ("gMotorVars.Flag_enableSys", getDecimal());
expAdd ("gMotorVars.Flag_Run_Identify", getDecimal());
expAdd ("gMotorVars.Flag_enableUserParams", getDecimal());
expAdd ("gMotorVars.Flag_enableRsRecalc", getDecimal());
expAdd ("gMotorVars.Flag_enableForceAngle", getDecimal());
expAdd ("gMotorVars.Flag_enableOffsetcalc", getDecimal());
expAdd ("gMotorVars.Flag_enablePowerWarp", getDecimal());
expAdd ("gMotorVars.Flag_enableFieldWeakening", getDecimal());

expAdd ("gMotorVars.CtrlState");
expAdd ("gMotorVars.EstState");
expAdd ("gMotorVars.Flag_MotorIdentified", getDecimal());
expAdd ("gMotorVars.MagnCurr_A");
expAdd ("gMotorVars.Rr_Ohm");
expAdd ("gMotorVars.Rs_Ohm");
expAdd ("gMotorVars.Lsd_H");
expAdd ("gMotorVars.Lsq_H");
expAdd ("gMotorVars.Flux_VpHz");

expAdd ("gMotorVars.SpeedRef_krpm", getQValue(24));
expAdd ("gMotorVars.MaxAccel_krpmps", getQValue(24));
expAdd ("gMotorVars.MaxJrk_krpmps2", getQValue(20));
expAdd ("gMotorVars.Speed_krpm", getQValue(24));
expAdd ("gMotorVars.SpeedTraj_krpm", getQValue(24));
expAdd ("gMotorVars.Torque_Nm", getQValue(24));
expAdd ("gMotorVars.SpinTAC.VelCtlStatus");
expAdd ("gMotorVars.SpinTAC.InertiaEstimate_Aperkrpm", getQValue(24));
expAdd ("gMotorVars.SpinTAC.FrictionEstimate_Aperkrpm", getQValue(24));
expAdd ("gMotorVars.SpinTAC.VelCtlBw_radps", getQValue(20));
expAdd ("gMotorVars.SpinTAC.VelCtlErrorID");
expAdd ("gMotorVars.SpinTAC.VelMoveStatus");
expAdd ("gMotorVars.SpinTAC.VelMoveCurveType");
expAdd ("gMotorVars.SpinTAC.VelMoveTime_ticks");
expAdd ("gMotorVars.SpinTAC.VelMoveErrorID");

expAdd ("gMotorVars.Vd", getQValue(24));
expAdd ("gMotorVars.Vq", getQValue(24));
expAdd ("gMotorVars.Vs", getQValue(24));
expAdd ("gMotorVars.VsRef", getQValue(24));

expAdd ("gMotorVars.Id_A", getQValue(24));
expAdd ("gMotorVars.IdRef_A", getQValue(24));
expAdd ("gMotorVars.Iq_A", getQValue(24));
expAdd ("gMotorVars.Is_A", getQValue(24));
expAdd ("gMotorVars.OverModulation", getQValue(24));
expAdd ("svgencurrent.MinWidth", getDecimal());
expAdd ("svgencurrent.IgnoreShunt");

expAdd ("gMotorVars.Kp_Idq", getQValue(24));
expAdd ("gMotorVars.Ki_Idq", getQValue(24));
expAdd ("gMotorVars.VdcBus_kV", getQValue(24));


expAdd ("gDrvSpi8301Vars");
