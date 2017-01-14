expRemoveAll();
expAdd ("gMotorVars");
expAdd ("gMotorVars.UserErrorCode");
expAdd ("gMotorVars.CtrlVersion");
expAdd ("gMotorVars.Flag_enableSys", getDecimal());
expAdd ("gMotorVars.Flag_Run_Identify", getDecimal());
expAdd ("gMotorVars.Flag_enableUserParams", getDecimal());
expAdd ("gMotorVars.Flag_enableRsRecalc", getDecimal());
expAdd ("gMotorVars.Flag_enableForceAngle", getDecimal());
expAdd ("gMotorVars.Flag_enablePowerWarp", getDecimal());

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

expAdd ("gMotorVars.VdcBus_kV", getQValue(24));

expAdd ("gMotorVars.Id_A", getQValue(24));	
expAdd ("gMotorVars.Iq_A", getQValue(24));
expAdd ("gMotorVars.Is_A", getQValue(24));	

expAdd ("gDacData");	
expAdd ("cpu_time");	

expAdd ("speed_pu", getQValue(24));	
expAdd ("speed_est_pu", getQValue(24));	
expAdd ("gHall_speed_fdb_pu", getQValue(24));	
expAdd ("gHall_Flag_EnableBldc", getDecimal());	
expAdd ("gHall_Flag_EnableStartup", getDecimal());
expAdd ("gHall_Flag_CurrentCtrl", getDecimal());	
expAdd ("gHall_PwmDuty", getQValue(24));		
expAdd ("gHall_speed_fdb_pu", getQValue(24));	
expAdd ("gHall_State", getDecimal());		
expAdd ("gHall_BLDC_Is_ref_pu", getQValue(24));		
expAdd ("gHall_BLDC_Is_fdb_pu", getQValue(24));		
expAdd ("gHall_speed_FastToBldc_low_pu", getQValue(24));	
expAdd ("gHall_speed_BldcToFast_high_pu", getQValue(24));	
expAdd ("gHall_PwmIndex", getDecimal());
expAdd ("gHall2Fast_Spd_Coef", getQValue(24));	
expAdd ("gHall2Fast_Iq_coef", getQValue(24));	
expAdd ("gHall2Fast_Ui_coef", getQValue(24));	

expAdd ("pid[0]");	
expAdd ("pid[1]");	
expAdd ("pid[2]");	
expAdd ("pid[3]");



