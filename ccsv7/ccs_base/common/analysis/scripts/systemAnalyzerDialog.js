
warningsGroup = null;
function systemAnalyzerDialog()
{
	//Data Type
	p_sa_uc_helper.traceMsg("systemAnalyzerDialog() uiaMode: " + uiaMode);
	if( uiaMode.equalsIgnoreCase("Live") == false)
	{
		typeDataGroup = new ConfigSection()
		typeDataGroup.setNumColumns(3);
		typeDataGroup.setSpanAllColumns(true);
		
		fileDataLabel = new ConfigLabel();
		if (uiaMode.equalsIgnoreCase("Binary"))
		{
			fileDataLabel.setText("Folder Name:");
		}
		else 
		{
			fileDataLabel.setText("File Name:");
		}
		typeDataGroup.addWidget(fileDataLabel);
	
		m_fileDataCombo = new ConfigFile();
		m_fileDataCombo.setDirectory(uiaMode.equalsIgnoreCase("Binary"));
		if (uiaMode.equalsIgnoreCase("Binary"))
		{
			m_fileDataCombo.setExtensions("*."+"bin");
		}
		else
		{
			m_fileDataCombo.setExtensions("*."+"csv");
		}

		m_fileDataCombo.setText(fileDataLabel.getText());
		//m_fileDataCombo.addRun(new IRun({run: function() { config.dialog.refresh(); }}));
var MyRunnable = Java.extend(Runnable, {
    	run: function() { 
		config.dialog.refresh();
    	} 
}); 
m_fileDataCombo.addRun(new MyRunnable());
		
		if( uiaMode.equalsIgnoreCase("Binary"))
		{ 
			m_fileDataCombo.setFile(new File(m_captureFilename));
		}
		else if ( uiaMode.equalsIgnoreCase("File"))
		{
			m_fileDataCombo.setFile(new File(p_m_state.getCSVFile()));
		}
			
		typeDataGroup.addWidget(m_fileDataCombo);
	
		config.page.addWidget(typeDataGroup);
	}
		
	if( uiaMode.equalsIgnoreCase("File") == false)
	{
		sessionGroup = new ConfigSection();
		sessionGroup.setNumColumns(5);
		sessionGroup.setSpanAllColumns(true);
	
		/*
		autoDetectButton = new ConfigCheck("Auto Detect UIA Configuration");
		//autoDetectButton.setSpanColumns(2);
		sessionGroup.addWidget(autoDetectButton);
		
		manualSpecifyButton = new ConfigCheck("Manually Specify UIA Configuration");
		manualSpecifyButton.setSpanColumns(3);
		sessionGroup.addWidget(manualSpecifyButton);
		*/
	
		m_coreTable = new ConfigTable(CORE+","+INSTRUMENTED+","+SYMBOL_FILE+","+CPU_SPEED+","+CYCLES_PER_TICK+","+TRANSPORT);
		//m_coreTable.setSpanColumns(4);
		m_coreTable.setSpanAllColumns(true);
		sessionGroup.addWidget(m_coreTable);
		
		blankLabel = new ConfigLabel("SPACEHERESPA");
		blankLabel.setVisible(false);
		sessionGroup.addWidget(blankLabel);
		
		m_sessionCheck = new ConfigCheck("Custom UIA Configuration file:");
		/*
		m_sessionCheck.addRun(new IRun({run: function()
		{
			m_sessionFile.setEnabled(m_sessionCheck.getCheck());
			m_sessionButton.setEnabled(m_sessionCheck.getCheck());
			
			m_config = getConfig();
			valid_config = p_sa_uc_helper.isValidUIACfg(m_config);
			p_sa_uc_helper.traceMsg("config value " + m_config + " : " + valid_config);
			warningSection();
			dynamicSectionChanges();
			
			setEndpointNames();	
			setTransport();
			setCoreTableData();					
			setIPAddress();
			
			config.dialog.refresh();
		}}));
		*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		m_sessionFile.setEnabled(m_sessionCheck.getCheck());
		m_sessionButton.setEnabled(m_sessionCheck.getCheck());
		
		m_config = getConfig();
		valid_config = p_sa_uc_helper.isValidUIACfg(m_config);
		p_sa_uc_helper.traceMsg("config value " + m_config + " : " + valid_config);
		warningSection();
		dynamicSectionChanges();
			
		setEndpointNames();	
		setTransport();
		setCoreTableData();					
		setIPAddress();
			
		config.dialog.refresh();
    	} 
}); 
m_sessionCheck.addRun(new MyRunnable());

		sessionGroup.addWidget(m_sessionCheck);
		
		m_sessionFile = new ConfigFile();
		m_sessionFile.setEnabled(m_sessionCheck.getCheck());
		m_sessionFile.setExtensions("*."+"usmxml");
		m_sessionFile.setText("Use config filename:");
		/*
		m_sessionFile.addRun(new IRun({run: function() 
		{
			m_config = getConfig();
			valid_config = p_sa_uc_helper.isValidUIACfg(m_config);
			p_sa_uc_helper.traceMsg("config value " + m_config + " : " + valid_config);
			warningSection();
			dynamicSectionChanges();

			setEndpointNames();	
			setTransport();
			setCoreTableData();					
			setIPAddress();
	
			config.dialog.refresh();
		}}));
		*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		m_config = getConfig();
		valid_config = p_sa_uc_helper.isValidUIACfg(m_config);
		p_sa_uc_helper.traceMsg("config value " + m_config + " : " + valid_config);
		warningSection();
		dynamicSectionChanges();

		setEndpointNames();	
		setTransport();
		setCoreTableData();					
		setIPAddress();
	
		config.dialog.refresh();
    	} 
}); 
m_sessionFile.addRun(new MyRunnable());

		sessionGroup.addWidget(m_sessionFile);
		if (m_configFilename != null && m_configFilename.length() > 0)
		{
			m_sessionCheck.setCheck(true);
			m_sessionFile.setFile(new File(m_configFilename));
			m_sessionFile.setEnabled(true);
		}
	
		m_sessionButton = new ConfigButton("Create UIA Config File");
		m_sessionButton.setEnabled(m_sessionCheck.getCheck());
		/*
		m_sessionButton.addRun(new IRun({run: function()
		{
			shell = new ConfigShell("UIA Config");
			shell.setClassName("com.ti.uia.sessionmgr.view.ui.SmvView$SessionManager");
			shell.setMethod("onSaveAs");
			shell.execute();
			
			fileName = shell.getResult();
			if (fileName != null)
			{
				m_sessionFile.setFile(fileName);
				
				m_config = getConfig();
				valid_config = p_sa_uc_helper.isValidUIACfg(m_config);
				p_sa_uc_helper.traceMsg("config value " + m_config + " : " + valid_config);
				warningSection();
				dynamicSectionChanges();
				
				setEndpointNames();	
				setTransport();
				setCoreTableData();					
				setIPAddress();
		
				config.dialog.refresh();
			}
		}}));
		*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		shell = new ConfigShell("UIA Config");
		shell.setClassName("com.ti.uia.sessionmgr.view.ui.SmvView$SessionManager");
		shell.setMethod("onSaveAs");
		shell.execute();
			
		fileName = shell.getResult();
		if (fileName != null)
		{
			m_sessionFile.setFile(fileName);
				
			m_config = getConfig();
			valid_config = p_sa_uc_helper.isValidUIACfg(m_config);
			p_sa_uc_helper.traceMsg("config value " + m_config + " : " + valid_config);
			warningSection();
			dynamicSectionChanges();
				
			setEndpointNames();	
			setTransport();
			setCoreTableData();					
			setIPAddress();
		
			config.dialog.refresh();
		}
    	} 
}); 
m_sessionButton.addRun(new MyRunnable());

		sessionGroup.addWidget(m_sessionButton);
	
		/*
		transport = new ConfigLabel("Transport:");
		sessionGroup.addWidget(transport);
		
		transportCombo = new ConfigCombo();
		transportCombo.add("None");
		transportCombo.setSelection(0);
		transportCombo.setSpanColumns(3);
		transportCombo.setEnabled(false);
		sessionGroup.addWidget(transportCombo);
		*/
		
		config.page.addWidget(sessionGroup);

		m_config = getConfig();		
		valid_config = p_sa_uc_helper.isValidUIACfg(m_config);
		p_sa_uc_helper.traceMsg("config value " + m_config + " : " + valid_config);
	}

	if( uiaMode.equalsIgnoreCase("Live"))
	{ 
		settingsGroup = new ConfigSection("Transport Settings");
		settingsGroup.setExpanding(true);
		settingsGroup.setExpanded(false);
		settingsGroup.setNumColumns(4);
		settingsGroup.setSpanAllColumns(true);
		settingsGroup.setEnabled(false);
		
	
		m_ipAddressLabel = new ConfigLabel("IP Address:");
		settingsGroup.addWidget(m_ipAddressLabel);
		
		m_ipAddressCombo = new ConfigCombo();
		m_ipAddressCombo.setSpanColumns(2);
		m_ipAddressCombo.setEnabled(false);
		m_ipAddressCombo.setEdit(true);
		var bDialogOpen = false;
		/*
		m_ipAddressCombo.addRun(new IRun({run: function()
		{
			if (bDialogOpen)
			{
				bDialogOpen = false;
				
				return;
			}
			
			if (!Util.getComPortMgr().isEmpty())
			{
				return;
			}
			
			if (m_config.getEventTransport().getType().equals(Session.TRANSPORT_USB) &&
				(IDEAdapterManager.getCurrentIDECPU() == null ||
				IDEAdapterManager.getCurrentIDECPU().getTargetRunningState() != IDECPU.TARGET_RUNNING))
			{
				bDialogOpen = true;
				messageDialog = new ConfigMessage("Note: Since target is not running, it may take up to 30 seconds to show list of ports. Run the target to avoid this delay.");
				messageDialog.setTitle("Confirm Port Scan");
				messageDialog.setIcon(ConfigMessage.QUESTION);
				messageDialog.setButtons(["OK", "Cancel"]);
				messageDialog.execute();
				
				if (messageDialog.getResult().equals("OK"))
				{
					scanCommPorts();
				}
			}
			else
			{
				scanCommPorts();
			}
		}}));
		*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		if (bDialogOpen)
			{
				bDialogOpen = false;
				
				return;
			}
			
			if (!Util.getComPortMgr().isEmpty())
			{
				return;
			}
			
			if (m_config.getEventTransport().getType().equals(Session.TRANSPORT_USB) &&
				(IDEAdapterManager.getCurrentIDECPU() == null ||
				IDEAdapterManager.getCurrentIDECPU().getTargetRunningState() != IDECPU.TARGET_RUNNING))
			{
				bDialogOpen = true;
				messageDialog = new ConfigMessage("Note: Since target is not running, it may take up to 30 seconds to show list of ports. Run the target to avoid this delay.");
				messageDialog.setTitle("Confirm Port Scan");
				messageDialog.setIcon(ConfigMessage.QUESTION);
				messageDialog.setButtons(["OK", "Cancel"]);
				messageDialog.execute();
				
				if (messageDialog.getResult().equals("OK"))
				{
					scanCommPorts();
				}
			}
			else
			{
				scanCommPorts();
			}
    	} 
}); 
m_ipAddressCombo.addRun(new MyRunnable());

		settingsGroup.addWidget(m_ipAddressCombo);
		
		m_ipAddressButton = new ConfigButton("Configure Port");
		m_ipAddressButton.setEnabled(false);
		/*
		m_ipAddressButton.addRun(new IRun({run: function()
		{
			var m_speed = null;
			var m_dataBits = null;
			var m_parity = null;
			var m_stopBits = null;
			
			regexComPort     = "COM(\\d+)?:?(\\d+)?[/\\-\\.]?([78])?([NEOMS])?([12])?";
			if (System.getProperty("os.name").toLowerCase().contains("linux") ||
				System.getProperty("os.name").toLowerCase().contains("mac"))
			{
				regexComPort = "/dev/ttyACM(\\d+)?:?(\\d+)?[/\\-\\.]?([78])?([NEOMS])?([12])?";
			}
									
			dialog = new ConfigWizard("Port Name:");
			dialogPage = new ConfigWizardPage("Configure Port Name", "");
			dialog.setApplyText("OK");
			dialog.addPage(dialogPage);
			
			pattern = Pattern.compile(regexComPort);
			m = pattern.matcher(m_ipAddressCombo.getText());
			m.matches();
			
			dialogPage.setNumColumns(2);
			
			portNameLabel = new ConfigLabel("Port Name:");
			dialogPage.addWidget(portNameLabel);
	
			m_portName = new ConfigEdit();
			if (System.getProperty("os.name").contains("linux") ||
				System.getProperty("os.name").contains("mac"))
			{
				m_portName.setText("/dev/ttyACM"+m.group(1));
			}
			else
			{
				m_portName.setText("COM"+m.group(1));
			}
			dialogPage.addWidget(m_portName);
			
			m_settingsButton = new ConfigCheck("Settings:");
			m_settingsButton.setSpanColumns(2);
			dialogPage.addWidget(m_settingsButton);
			m_settingsButton.addRun(new IRun({run: function()
			{
				if (m_settingsButton.getCheck())
				{
					m_speed.setEnabled(true);
					m_dataBits.setEnabled(true);
					m_parity.setEnabled(true);
					m_stopBits.setEnabled(true);
				}
				else
				{
					m_speed.setEnabled(false);
					m_dataBits.setEnabled(false);
					m_parity.setEnabled(false);
					m_stopBits.setEnabled(false);
				}
				
				dialog.refresh();
			}}));
			
			speedLabel = new ConfigLabel("Speed:");
			dialogPage.addWidget(speedLabel);
			m_speed = new ConfigEdit();
			m_speed.setText(m.group(2) != null ? m.group(2) : "115200");
			dialogPage.addWidget(m_speed);
			
			dataBitsLabel = new ConfigLabel("Data Bits:");
			dialogPage.addWidget(dataBitsLabel);
			m_dataBits = new ConfigCombo();
			m_dataBits.add("8");
			m_dataBits.add("7");
			if (m.group(3) == null || m_dataBits.indexOf(m.group(3)) < 0)
			{
				m_dataBits.setSelection(0);
			}
			else
			{
				m_dataBits.setText(m.group(3));
			}
			dialogPage.addWidget(m_dataBits);
			
			parity = m.group(4);
			if (parity != null)
			{
				parity = new String(parity);
				switch (parity.charAt(0))
				{
				case 'N':
					parity = "None";		
					break;
				case 'O':
					parity = "Odd";
					break;
				case 'E':
					parity = "Even";
					break;
				case 'M':
					parity = "Mark";
					break;
				case 'S':
					parity = "Space";
					break;
				}
			}
			parityLabel = new ConfigLabel("Parity:");
			dialogPage.addWidget(parityLabel);
			m_parity = new ConfigCombo();
			m_parity.add("None");
			m_parity.add("Odd");
			m_parity.add("Even");
			m_parity.add("Mark");
			m_parity.add("Space");
			if (parity == null || m_parity.indexOf(parity) < 0)
			{
				m_parity.setSelection(0);
			}
			else
			{
				m_parity.setText(parity);
			}
			dialogPage.addWidget(m_parity);
			
			stopBitsLabel = new ConfigLabel("Stop Bits:");
			dialogPage.addWidget(stopBitsLabel);
			m_stopBits = new ConfigCombo();
			m_stopBits.add("1");
			m_stopBits.add("2");
			if (m.group(5) == null || m_stopBits.indexOf(m.group(5)) < 0)
			{
				m_stopBits.setSelection(0);
			}
			else
			{
				m_stopBits.setText(m.group(5));
			}
			dialogPage.addWidget(m_stopBits);
			
			if (m.group(2) != null || m.group(3) != null || m.group(4) != null || m.group(5) != null)
			{
				m_settingsButton.setCheck(true);
				m_speed.setEnabled(true);
				m_dataBits.setEnabled(true);
				m_parity.setEnabled(true);
				m_stopBits.setEnabled(true);
			}
			else
			{
				m_settingsButton.setCheck(false);
				m_speed.setEnabled(false);
				m_dataBits.setEnabled(false);
				m_parity.setEnabled(false);
				m_stopBits.setEnabled(false);
			}
			
			dialog.execute();
			
			if (dialog.getFinished() == false)
			{
				return;
			}
			
			if (m_settingsButton.getCheck())
			{
				m_ipAddressCombo.setText(m_portName.getText()+":"+m_speed.getText()+"/"+m_dataBits.getText()+m_parity.getText().substring(0,1)+m_stopBits.getText());
			}
			else
			{
				m_ipAddressCombo.setText(m_portName.getText());
			}
									
			Util.getComPortMgr().clear();	// force a new port scan
						
			m_config = getConfig();
			valid_config = p_sa_uc_helper.isValidUIACfg(m_config);
			p_sa_uc_helper.traceMsg("config value " + m_config + " : " + valid_config);
			warningSection();
			dynamicSectionChanges();
			
			setEndpointNames();	
			setTransport();
			setCoreTableData();					
			setIPAddress();
	
			config.dialog.refresh();
		}}));
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		var m_speed = null;
			var m_dataBits = null;
			var m_parity = null;
			var m_stopBits = null;
			
			regexComPort     = "COM(\\d+)?:?(\\d+)?[/\\-\\.]?([78])?([NEOMS])?([12])?";
			if (System.getProperty("os.name").toLowerCase().contains("linux") ||
				System.getProperty("os.name").toLowerCase().contains("mac"))
			{
				regexComPort = "/dev/ttyACM(\\d+)?:?(\\d+)?[/\\-\\.]?([78])?([NEOMS])?([12])?";
			}
									
			dialog = new ConfigWizard("Port Name:");
			dialogPage = new ConfigWizardPage("Configure Port Name", "");
			dialog.setApplyText("OK");
			dialog.addPage(dialogPage);
			
			pattern = Pattern.compile(regexComPort);
			m = pattern.matcher(m_ipAddressCombo.getText());
			m.matches();
			
			dialogPage.setNumColumns(2);
			
			portNameLabel = new ConfigLabel("Port Name:");
			dialogPage.addWidget(portNameLabel);
	
			m_portName = new ConfigEdit();
			if (System.getProperty("os.name").contains("linux") ||
				System.getProperty("os.name").contains("mac"))
			{
				m_portName.setText("/dev/ttyACM"+m.group(1));
			}
			else
			{
				m_portName.setText("COM"+m.group(1));
			}
			dialogPage.addWidget(m_portName);
			
			m_settingsButton = new ConfigCheck("Settings:");
			m_settingsButton.setSpanColumns(2);
			dialogPage.addWidget(m_settingsButton);
			/*
			m_settingsButton.addRun(new IRun({run: function()
			{
				if (m_settingsButton.getCheck())
				{
					m_speed.setEnabled(true);
					m_dataBits.setEnabled(true);
					m_parity.setEnabled(true);
					m_stopBits.setEnabled(true);
				}
				else
				{
					m_speed.setEnabled(false);
					m_dataBits.setEnabled(false);
					m_parity.setEnabled(false);
					m_stopBits.setEnabled(false);
				}
				
				dialog.refresh();
			}}));
			*/
var MyRunnableInner = Java.extend(Runnable, { 
	run: function() { 
		if (m_settingsButton.getCheck())
		{
			m_speed.setEnabled(true);
			m_dataBits.setEnabled(true);
			m_parity.setEnabled(true);
			m_stopBits.setEnabled(true);
		}
		else
		{
			m_speed.setEnabled(false);
			m_dataBits.setEnabled(false);
			m_parity.setEnabled(false);
			m_stopBits.setEnabled(false);
		}
				
		dialog.refresh();;
    	} 
}); 
m_settingsButton.addRun(new MyRunnableInner());

			speedLabel = new ConfigLabel("Speed:");
			dialogPage.addWidget(speedLabel);
			m_speed = new ConfigEdit();
			m_speed.setText(m.group(2) != null ? m.group(2) : "115200");
			dialogPage.addWidget(m_speed);
			
			dataBitsLabel = new ConfigLabel("Data Bits:");
			dialogPage.addWidget(dataBitsLabel);
			m_dataBits = new ConfigCombo();
			m_dataBits.add("8");
			m_dataBits.add("7");
			if (m.group(3) == null || m_dataBits.indexOf(m.group(3)) < 0)
			{
				m_dataBits.setSelection(0);
			}
			else
			{
				m_dataBits.setText(m.group(3));
			}
			dialogPage.addWidget(m_dataBits);
			
			parity = m.group(4);
			if (parity != null)
			{
				parity = new String(parity);
				switch (parity.charAt(0))
				{
				case 'N':
					parity = "None";		
					break;
				case 'O':
					parity = "Odd";
					break;
				case 'E':
					parity = "Even";
					break;
				case 'M':
					parity = "Mark";
					break;
				case 'S':
					parity = "Space";
					break;
				}
			}
			parityLabel = new ConfigLabel("Parity:");
			dialogPage.addWidget(parityLabel);
			m_parity = new ConfigCombo();
			m_parity.add("None");
			m_parity.add("Odd");
			m_parity.add("Even");
			m_parity.add("Mark");
			m_parity.add("Space");
			if (parity == null || m_parity.indexOf(parity) < 0)
			{
				m_parity.setSelection(0);
			}
			else
			{
				m_parity.setText(parity);
			}
			dialogPage.addWidget(m_parity);
			
			stopBitsLabel = new ConfigLabel("Stop Bits:");
			dialogPage.addWidget(stopBitsLabel);
			m_stopBits = new ConfigCombo();
			m_stopBits.add("1");
			m_stopBits.add("2");
			if (m.group(5) == null || m_stopBits.indexOf(m.group(5)) < 0)
			{
				m_stopBits.setSelection(0);
			}
			else
			{
				m_stopBits.setText(m.group(5));
			}
			dialogPage.addWidget(m_stopBits);
			
			if (m.group(2) != null || m.group(3) != null || m.group(4) != null || m.group(5) != null)
			{
				m_settingsButton.setCheck(true);
				m_speed.setEnabled(true);
				m_dataBits.setEnabled(true);
				m_parity.setEnabled(true);
				m_stopBits.setEnabled(true);
			}
			else
			{
				m_settingsButton.setCheck(false);
				m_speed.setEnabled(false);
				m_dataBits.setEnabled(false);
				m_parity.setEnabled(false);
				m_stopBits.setEnabled(false);
			}
			
			dialog.execute();
			
			if (dialog.getFinished() == false)
			{
				return;
			}
			
			if (m_settingsButton.getCheck())
			{
				m_ipAddressCombo.setText(m_portName.getText()+":"+m_speed.getText()+"/"+m_dataBits.getText()+m_parity.getText().substring(0,1)+m_stopBits.getText());
			}
			else
			{
				m_ipAddressCombo.setText(m_portName.getText());
			}
									
			Util.getComPortMgr().clear();	// force a new port scan
						
			m_config = getConfig();
			valid_config = p_sa_uc_helper.isValidUIACfg(m_config);
			p_sa_uc_helper.traceMsg("config value " + m_config + " : " + valid_config);
			warningSection();
			dynamicSectionChanges();
			
			setEndpointNames();	
			setTransport();
			setCoreTableData();					
			setIPAddress();
	
			config.dialog.refresh();
    	} 
}); 
m_ipAddressButton.addRun(new MyRunnable());

		settingsGroup.addWidget(m_ipAddressButton);
	
		config.page.addWidget(settingsGroup);
	}
	
	if( uiaMode.equalsIgnoreCase("Live"))
	{ 
		analysisSettingsGroup = new ConfigSection("Analysis Settings");
		analysisSettingsGroup.setExpanding(true);
		analysisSettingsGroup.setSpanAllColumns(true);
		analysisSettingsGroup.setEnabled(valid_config);
		analysisSettingsGroup.setExpanded(valid_config);
	}
	m_analysisFeatures = new ConfigAnalysisFeatures();
	m_analysisFeatures.setActivity(dvt_activity);
	m_analysisFeatures.setData(IActivity.DVT_DATA_TYPE, "UIA");
	if( uiaMode.equalsIgnoreCase("Live"))
	{ 
		m_analysisFeatures.setData(IActivity.DVT_ANALYSIS_SHOW, eval( dataproviders + "_analyzer") ); //assumption just one provider
	}
	m_analysisFeatures.setCores(m_endPointNames);
	m_analysisFeatures.setAnalysisTable(p_m_state.getAnalysisTable());
	//m_analysisFeatures.refresh();
	if( uiaMode.equalsIgnoreCase("Live"))
	{ 
		m_analysisFeatures.setText("Instrumentation Status,Tips");
	}
	m_analysisFeatures.setSpanAllColumns(true);

	if( uiaMode.equalsIgnoreCase("Live"))
	{ 
		analysisSettingsGroup.addWidget(m_analysisFeatures);
		config.page.addWidget(analysisSettingsGroup);
		
		instr_warning = p_sa_uc_helper.getInstrumentationStatus();
	
		if((instr_warning == "Partial")||(instr_warning == "Cannot Determine")){
			analysisSettingsGroup.setHighlight(true);
			analysisSettingsGroup.setHighlightColour("blue");
		}
		else if(instr_warning == "Inadequate"){
			analysisSettingsGroup.setHighlight(true);
			analysisSettingsGroup.setHighlightColour("red");
		}
		else{
			analysisSettingsGroup.setHighlight(false);
		}
	}
	else
	{
		config.page.addWidget(m_analysisFeatures);
	}
	
	if( uiaMode.equalsIgnoreCase("Live"))
	{ 
		collectDataGroup = new ConfigSection("Data Collection");
		collectDataGroup.setExpanding(true);
		collectDataGroup.setExpanded(false);
		collectDataGroup.setNumColumns(6);
		collectDataGroup.setSpanAllColumns(true);
		collectDataGroup.setEnabled(valid_config);
	
	
		m_collectDurationButton = new ConfigCheck("Limit data collection time:");
		/*
		m_collectDurationButton.addRun(new IRun({run: function()
		{
			//m_collectDurationButton.setCheck(true);
			
			m_collectDuration.setEnabled(m_collectDurationButton.getCheck());
			m_collectUnits.setEnabled(m_collectDurationButton.getCheck());
			
			m_transportDataAfter.setEnabled(m_collectDurationButton.getCheck());
			
			//m_collectUntilStoppedButton.setCheck(false);
	
			//m_maxDataEdit.setEnabled(false);
			//m_maxUnits.setEnabled(false);
	
			config.dialog.refresh();
		}}));
		*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		//m_collectDurationButton.setCheck(true);
			
		m_collectDuration.setEnabled(m_collectDurationButton.getCheck());
		m_collectUnits.setEnabled(m_collectDurationButton.getCheck());
			
		m_transportDataAfter.setEnabled(m_collectDurationButton.getCheck());
			
		//m_collectUntilStoppedButton.setCheck(false);
	
		//m_maxDataEdit.setEnabled(false);
		//m_maxUnits.setEnabled(false);
	
		config.dialog.refresh();
    	} 
}); 
m_collectDurationButton.addRun(new MyRunnable());

		collectDataGroup.addWidget(m_collectDurationButton);
		
		m_collectDuration = new ConfigEdit("0");
		m_collectDuration.setEnabled(false);
		collectDataGroup.addWidget(m_collectDuration);
		
		m_collectUnits = new ConfigLabel("sec");
		m_collectUnits.setEnabled(false);
		collectDataGroup.addWidget(m_collectUnits);
		
		space = new ConfigLabel("SPACEHERE");
		collectDataGroup.addWidget(space);
		space.setVisible(false);
		
		m_transportDataAfter = new ConfigCheck("Transport Data only after collection");
		m_transportDataAfter.setEnabled(false);
		collectDataGroup.addWidget(m_transportDataAfter);
		
		collectDataGroup.addWidget(new ConfigLabel());
			
		m_collectUntilStoppedButton = new ConfigCheck("Set max size of binary data to collect:");
		/*
		m_collectUntilStoppedButton.addRun(new IRun({run: function()
		{
			//m_collectUntilStoppedButton.setCheck(true);
			
			//m_collectDuration.setEnabled(false);
			//m_collectUnits.setEnabled(false);
			
			//m_transportDataAfter.setEnabled(false);
			//m_transportDataAfter.setCheck(false);
			
			//m_collectDurationButton.setCheck(false);
			
			m_maxDataEdit.setEnabled(m_collectUntilStoppedButton.getCheck());
			m_maxUnits.setEnabled(m_collectUntilStoppedButton.getCheck());
	
			config.dialog.refresh();
		}}));
		*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		//m_collectUntilStoppedButton.setCheck(true);
			
		//m_collectDuration.setEnabled(false);
		//m_collectUnits.setEnabled(false);
			
		//m_transportDataAfter.setEnabled(false);
		//m_transportDataAfter.setCheck(false);
			
		//m_collectDurationButton.setCheck(false);
			
		m_maxDataEdit.setEnabled(m_collectUntilStoppedButton.getCheck());
		m_maxUnits.setEnabled(m_collectUntilStoppedButton.getCheck());

		config.dialog.refresh();
    	} 
}); 
m_collectUntilStoppedButton.addRun(new MyRunnable());

		m_collectUntilStoppedButton.setCheck(true);
		collectDataGroup.addWidget(m_collectUntilStoppedButton);
		
		m_maxDataEdit = new ConfigEdit("10");
		m_maxDataEdit.setEnabled(false);
		collectDataGroup.addWidget(m_maxDataEdit);
		
		m_maxUnits = new ConfigLabel("MB");
		m_maxUnits.setEnabled(false);
		collectDataGroup.addWidget(m_maxUnits);
		
		//collectDataGroup.addWidget(new ConfigLabel());
		//collectDataGroup.addWidget(new ConfigLabel());
		collectDataGroup.addWidget(new ConfigLabel());
	
		m_clearExistingData = new ConfigCheck("Clear logger buffers on target before starting collection");
		m_clearExistingData.setCheck(true);
		collectDataGroup.addWidget(m_clearExistingData);
		
		collectDataGroup.addWidget(new ConfigLabel());
		
		m_saveBinaryDataButton = new ConfigCheck("Save collected binary data to folder:")
			/*
		m_saveBinaryDataButton.addRun(new IRun({run: function()
		{
			m_saveDataFile.setEnabled(m_saveBinaryDataButton.getCheck());
	
			config.dialog.refresh();
		}}));
		*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		m_saveDataFile.setEnabled(m_saveBinaryDataButton.getCheck());

		config.dialog.refresh();
    	} 
}); 
m_saveBinaryDataButton.addRun(new MyRunnable());

		collectDataGroup.addWidget(m_saveBinaryDataButton);
		
		m_saveDataFile = new ConfigFile();
		m_saveDataFile.setEnabled(false);
		m_saveDataFile.setSpanColumns(4);
		m_saveDataFile.setSave(true);
		m_saveDataFile.setDirectory(true);
		m_saveDataFile.setExtensions("*."+"bin");
		m_saveDataFile.setText("Save data to Folder:");
		m_saveDataFile.setFile(m_captureFilename);
		/*
		m_saveDataFile.addRun(new IRun({run: function() 
		{
			config.dialog.refresh();
		}}));
		*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		config.dialog.refresh();
    	} 
}); 
m_saveDataFile.addRun(new MyRunnable());

		collectDataGroup.addWidget(m_saveDataFile);
		if (m_captureFilename != null && m_captureFilename.length() > 0)
		{
			m_saveBinaryDataButton.setCheck(true);
			m_saveDataFile.setEnabled(true);
		}
		/*
		m_saveDataFile = new ConfigEdit();
		m_saveDataFile.setSpanColumns(4);
		collectDataGroup.addWidget(m_saveDataFile);
		
		browseSaveDataButton = new ConfigButton("...");
		collectDataGroup.addWidget(browseSaveDataButton);
		*/
	
		if (m_duration == 0)
		{
			m_collectDurationButton.setCheck(false);
			
			m_collectDuration.setEnabled(false);
			m_collectUnits.setEnabled(false);
	
			m_transportDataAfter.setEnabled(false);
			m_transportDataAfter.setCheck(false);
		}
		else
		{
			m_collectDurationButton.setCheck(true);
			
			m_collectDuration.setEnabled(true);
			m_collectUnits.setEnabled(true);
	
			m_collectDuration.setText(new Integer(m_duration).toString());
			
			m_transportDataAfter.setEnabled(true);
			m_transportDataAfter.setCheck(m_bTransportDataAfter);
		}

		if (m_maxData == 0)
		{
			m_collectUntilStoppedButton.setCheck(false);
			
			m_maxDataEdit.setEnabled(false);
			m_maxUnits.setEnabled(false);
		}
		else
		{
			m_collectUntilStoppedButton.setCheck(true);
			
			m_maxDataEdit.setEnabled(true);
			m_maxUnits.setEnabled(true);
	
			m_maxDataEdit.setText(new Integer(m_maxData).toString());
		} 
	
		config.page.addWidget(collectDataGroup);

	}


	if( uiaMode.equalsIgnoreCase("File") == false)
	{
		//Data Loss Info section-------
		dataLossGroup = new ConfigSection("Data Loss Info");
		dataLossGroup.setExpanding(false);
		dataLossGroup.setExpanded(true);
		dataLossGroup.setNumColumns(2);
		dataLossGroup.setSpanAllColumns(true);
	
		m_feedbackLabel = new ConfigLabel("Last run of usecase resulted in " + p_sa_uc_helper.getAbsoluteDataLoss() + " overall data loss. Details");
		m_feedbackLabel.setColour("Red"); 
		m_feedbackDetailsButton = new ConfigButton("...");
		
		details_msg = "Buffer size can be modified in logging setup (from the project's cfg file) to adjust for dataloss.\n\r";
		details_msg = details_msg + p_sa_uc_helper.getDataLossDetails(); 
	
		// m_feedbackDetailsButton.addRun(new IRun({run: function() {new ConfigMessage( details_msg ).execute();}}));
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		new ConfigMessage( details_msg ).execute();
    	} 
}); 
m_feedbackDetailsButton.addRun(new MyRunnable());

		dataLossGroup.addWidget(m_feedbackLabel);
		dataLossGroup.addWidget(m_feedbackDetailsButton);
	
		if(p_sa_uc_helper.saveConfigEqualsCurrentConfig()){
			if(p_sa_uc_helper.getDataLossDetails() != ""){
				config.page.addWidget(dataLossGroup);
			}
		}

		//Warnings section-------
		warningSection();

		Util.getComPortMgr().clear();	// force a new port scan
		setEndpointNames();
		setTransport();
		setCoreTableData();
		setIPAddress();
		//Warnings section-------
	}
	else
	{
		setEndpointNames();
	}	

	config.table.setRemoved(true);

	
	
	config.execute();
}

function dynamicSectionChanges(){
	if( uiaMode.equalsIgnoreCase("File") == false){
		//the below check is because currently for Binary file the 'Analysis Settings' group is done else where
		if( uiaMode.equalsIgnoreCase("Live"))
		{	 
			analysisSettingsGroup.setEnabled(valid_config);
			analysisSettingsGroup.setExpanded(valid_config);
		}
		if( uiaMode.equalsIgnoreCase("Live"))
		{	 
			collectDataGroup.setEnabled(valid_config);
		}
		config.dialog.setCanFinish(valid_config);
	}
}

function warningSection(){
	p_sa_uc_helper.traceMsg("warningsSection ");
	if( uiaMode.equalsIgnoreCase("File") == false)
	{
		p_sa_uc_helper.traceMsg("warningsGroup " + warningsGroup);
		
		if(!valid_config){
			if(warningsGroup == null){
				warningsGroup = new ConfigSection("Warnings/Errors");
				warningsGroup.setExpanding(true);
				//warningsGroup.setExpanded(true);
				warningsGroup.setNumColumns(2);
				warningsGroup.setSpanAllColumns(true);
				m_warningsLabel = new ConfigLabel("");
				m_warningsLabel.setColour("Red"); 
				warningsGroup.addWidget(m_warningsLabel);
				config.page.addWidget(warningsGroup);
			}
			
			if( m_config == null){
				warning_message = "Select a valid UIA configuration file.";
			}
			else{
				warning_message =  "Could not detect a UIA configuration. One of the following is required:\n";
				warning_message += "\t* Either load a program with UIA instrumentation turned on\n";
				warning_message += "\t* Or specify a custom UIA configuration\n";
				warning_message += "\nIf an instrumented program is already loaded then verify that the generated *.uia.xml and *.rta.xml\nfiles are located in the folder they were generated in or are in the same folder as the .out file.";
			}
		}
		else{
			warning_message = "";
		}

		if(warningsGroup != null){
			m_warningsLabel.setText(warning_message);
			warningsGroup.setEnabled(!valid_config);
			warningsGroup.setExpanded(!valid_config);
		}
	}
}

