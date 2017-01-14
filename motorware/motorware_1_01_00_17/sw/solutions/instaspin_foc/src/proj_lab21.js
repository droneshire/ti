expRemoveAll();
expAdd ("gMotorVars");
expAdd ("gMotorVars.UserErrorCode");
expAdd ("gMotorVars.CtrlVersion");
expAdd ("gMotorVars.Flag_enableSys", getDecimal());
expAdd ("gMotorVars.Flag_Run_Identify", getDecimal());
expAdd ("gMotorVars.Flag_enableUserParams", getDecimal());

expAdd ("gMotorVars.CtrlState");
expAdd ("gMotorVars.EstState");

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

expAdd ("gMotorVars.VdcBus_kV", getQValue(24));

expAdd ("gMotorVars.ipd_excFreq_Hz");
expAdd ("gMotorVars.ipd_Kspd");
expAdd ("gMotorVars.ipd_excMag_coarse_pu", getQValue(24));
expAdd ("gMotorVars.ipd_excMag_fine_pu", getQValue(24));
expAdd ("gMotorVars.ipd_waitTime_coarse_sec");
expAdd ("gMotorVars.ipd_waitTime_fine_sec");
expAdd ("flag_update_ipd", getDecimal());

expAdd ("gThrottle_Result", getQValue(24));

expAdd ("gDrvSpi8301Vars");
