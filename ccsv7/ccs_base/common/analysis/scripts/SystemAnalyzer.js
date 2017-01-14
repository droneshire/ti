dvt_activity.include("../../scripts/useCaseHelper.js");
dvt_activity.include("../../scripts/BasicDialog.js");
dvt_activity.include("../../scripts/systemAnalyzerDialog.js");
importPackage(Packages.java.util.regex)
importPackage(Packages.com.ti.dvt.uia.utils)
importPackage(Packages.com.ti.uia.host.core)
//importPackage(Packages.com.ti.uia.transport.jtag);

dvt_activity.addPropertyMap("\
      uiaCfgFilename 	= ${uiaCfgFilename},\
      uiaDataFolder 	= ${uiaDataFolder},\
      uiaMode 		= ${uiaMode},\
      uiaMaster 	= ${uiaMaster}\
");

/*
 * Usecase properties for user.
 * TODO - The properties and the names are still evolving.
 */
var uiaCfgFilename = "";	// Full path for the UIA configuration file
var uiaDataFolder = "";	// Full path for the bin file
//var uiaMode = "";	// "Live", "Binary", or "File" 
var uiaMaster = ""; //The Master whose data will be processed. If there is only one core in the debug context/configuration file then this property will be ignored by the AF and will automatically set to that lone Master


//var p_sa_uc_helper = new SystemAnalyzerUseCaseHelper( dvt_activity_name );
var p_sa_uc_helper = new SystemAnalyzerUseCaseHelper();


var uc_state = "Initialization";

var valid = false;
var validate_performed = false;
var scripting = dvt_activity.getProperty("scripting");

var CORE = "Cores";
var INSTRUMENTED = "Instrumented";
var SYMBOL_FILE = "Application";
var CPU_SPEED = "Timestamp Freq. (MHz)";
var CYCLES_PER_TICK = "Cycles per tick";
var TRANSPORT = "Transport";


function isStringEmpty(str) {
	return str == null || str.length == 0;
}

var config = null;
var log_level = 0;

var p_m_state = new PersistState();
var m_config = null;
var m_runParam = null;
var m_fileDataCombo = null;
var m_sessionCheck = null;
var m_sessionFile = null;
var m_endPointNames = null;
var m_coreTable = null;
var m_analysisFeatures = null;
var m_analysisActions = null;
var m_transportType = null;
var m_collectDurationButton = null;
var m_collectDuration = null;
var m_collectUnits = null;
var m_collectUntilStoppedButton = null;
var m_maxDataEdit = null;
var m_maxUnits = null;
var m_clearExistingData = null;
var m_transportDataAfter = null;
var m_duration = null;
var m_maxData = null;
var m_ipAddressLabel = null;
var m_ipAddressCombo = null;
var m_ipAddressButton = null;
var settingsGroup = null;
var m_saveBinaryDataButton = null;
var m_saveDataFile = null;

dvt_activity_instance = 0;

//var Runnable = Java.type("java.lang.Runnable"); 

//Validate whether this Use Case can be shown in current context.
function validate()
{	
	p_sa_uc_helper.setTraceMsgLevel(log_level);
	p_sa_uc_helper.traceMsg("validate()");
	//p_sa_uc_helper.traceMsg(uc_name);
	p_sa_uc_helper.setUCName(uc_name);

	validate_performed = true;

	dvt_activity_instances = 1; 
	//dvt_activity_names = ""; 
	dvt_activity_resources = "";

	if (uiaMode == "Live")
	{
		dvt_activity_resources = "System Analyzer";
	}

	if(scripting){
//		JTManager.getInstance();
	}

	valid = true;
	return valid;
}

function setDataProviderProperties()
{
}


function startUIAViewer()
{
	p_sa_uc_helper.traceMsg("startUIAViewer()");
	/*propertiesButton = */addConfigurationButtons();

	dataprovider_list = getDataProviderList();

	if(dataprovider_list.length > 1)
	{
		//TODO right now assuming only one DataProvider and AF list
		return;
	}
	if (dvt_activity_resources.length > 0)
	{
		dvt_activity_resources = dvt_activity_resources.split(",")[dvt_activity_instance];
		p_sa_uc_helper.traceMsg("Resource consumed: " + dvt_activity_resources);
	}

	for(dp=0;dp<dataprovider_list.length;dp++)
	{
		//TODO trim()
		p_sa_uc_helper.traceMsg("DP " + dataprovider_list[dp] );
		//TODO if eval does not exist
		provider_name = eval(dataprovider_list[dp]+"_name");

		if (uiaMode.equalsIgnoreCase("File"))
		{
			dataproviderActivity = ActivityManager.get().findActivity("Viewers/" + provider_name);
		}
		else
		{
			dataproviderActivity = ActivityManager.get().findActivity("UIA-Java/" + provider_name);
		}
		dataproviderActivity = dataproviderActivity.copy();  //TODO change APIs to get rid of the copy()
		if (dataproviderActivity != null) 
		{
			p_sa_uc_helper.traceMsg("uiaMode " + uiaMode);
			//TODO - encapsulate and handle these properties being set based on uiaMode.
			// handle user entered properties, map them to UIA run parameters	
	
			if (!isStringEmpty(uiaMode)) 
			{
				if( uiaMode.equalsIgnoreCase("File"))
				{
					dataproviderActivity.setName(Util.SA_CSV_FILE);
					dataproviderActivity.setProperty("csvFilePath", m_fileDataCombo.getFile().getAbsolutePath());
				}
				else if( uiaMode.equalsIgnoreCase("Binary")) 
				{
					dataproviderActivity.setName(Util.SA_BINARY_FILE);
				}
				else if( uiaMode.equalsIgnoreCase("Live")) 
				{
					p_sa_uc_helper.traceMsg(Util.SA_LIVE + " Session");
					dataproviderActivity.setName(Util.SA_LIVE + " Session");
				}
			}
			if ( !isStringEmpty(uiaCfgFilename) ) 
			{
				m_runParam.configFilename = uiaCfgFilename; 
			}
			if ( !isStringEmpty(uiaDataFolder) ) 
			{
				m_runParam.captureFilename = uiaDataFolder; 
			}
			
			p_sa_uc_helper.traceMsg("m_config " + m_config);
			dataproviderActivity.setProperty("runParam", m_runParam);
			dataproviderActivity.setProperty("uiaConfig", m_config);
			
		
			/*
			var status = new Status();
			status.addWidget(propertiesButton);
			dataproviderActivity.addStatus(status);
			*/
			
			//m_analysisFeatures = findAnalysisFeatures(dataprovider_list[dp]);

			ActivityManager.get().addActivityToSession(dataproviderActivity, dvt_activity, m_analysisActions);


			if (uiaMode.equalsIgnoreCase("Live"))
			{
				p_sa_uc_helper.setActivityProvider( dataproviderActivity ); //assuming one UIA provider?
			}
		}
		else
		{
			p_sa_uc_helper.traceMsg("dataprovider not found " + dataprovider_list[dp]);
		}
	} //end of for dps
}

function getConfig()
{
	p_sa_uc_helper.traceMsg("getConfig()");
	dataprovider_list = getDataProviderList();
	for(dp=0;dp<dataprovider_list.length;dp++)
	{
		provider_name = eval(dataprovider_list[dp]+"_name");
		dataproviderActivity = ActivityManager.get().findActivity("UIA-Java/" + provider_name);
		uiaActivity = dataproviderActivity;
	}

	if (m_sessionCheck.getCheck() == false)
	{
		uiaConfig = uiaActivity.autoConfigFromDebugger();
	}
	else
	{
		uiaConfig = uiaActivity.openConfig(m_sessionFile.getFile().getAbsolutePath());
	}

	p_sa_uc_helper.setUIACfg( uiaConfig );
	
	return uiaConfig;
}

function setEndpointNames()
{
	if (m_config != null)
	{
		m_endPointNames = new ArrayList();//Util.getEndPointNames();
		
		endPoints = m_config.getEndpoints();
		for (i=0;i<endPoints.size();i++)
		{
			//if (!m_endPointNames.contains(endPoint.getName()))
			{
				m_endPointNames.add(endPoints.get(i).getName());
			}
		}
		
		m_analysisFeatures.setCores(m_endPointNames);
	} 
}

function setCoreTableData()
{
	m_coreTable.removeAll();
	if (m_endPointNames != null && m_endPointNames.size() > 0)
	{
		for (i=0;i<m_endPointNames.size();i++)
		{
			if (m_endPointNames.get(i).length() == 0)
			{
				continue;
			}
			
			coreRow = new ConfigRow();
			coreRow.setValue(CORE, m_endPointNames.get(i));
			if (m_config != null)
			{
				endPoint = m_config.getEndpoint(m_endPointNames.get(i));
				if (endPoint != null)
				{
					coreRow.setValue(INSTRUMENTED, "yes"/*endPoint.getType()*/);
					file = new File(endPoint.getOutFile());		
					coreRow.setValue(SYMBOL_FILE, file.getName());
					coreRow.setValue(CPU_SPEED, new Long(endPoint.getClockFreq()/1000000).toString());
					coreRow.setValue(CYCLES_PER_TICK, new Long(endPoint.getCyclePerTick()).toString());
					coreRow.setValue(TRANSPORT, m_transportType);
				}
				else
				{
					coreRow.setValue(INSTRUMENTED, "no");
				}
			}
			
			m_coreTable.addRow(coreRow);
		}
	}
	
	//m_coreViewer.setInput(coreTableData);
}

function setTransport()
{
	if (uiaMode.equals("Live"))
	{
		transport = null;
		if (m_config != null)
		{
			transport = m_config.getEventTransport();
			
			m_transportType = Session.TRANSPORT_NONE;
			if (transport != null)
			{
				m_transportType = transport.getType();
			}
			
			if (m_transportType.equals(Session.TRANSPORT_JTAG))
			{
				m_transportType = "Run-Mode " + m_transportType;
			}
			
			if (m_transportType.equals(Session.TRANSPORT_NONE))
			{
				endPoints = m_config.getEndpoints();
				for (i=0;i<endPoints.size();i++)
				{
					if (endPoints.get(i).isJtagMonitor())
					{
						m_transportType = "Stop-Mode " + Session.TRANSPORT_JTAG;
						
						break;
					}
				}
			}
			
			if (m_clearExistingData != null && m_transportDataAfter != null)
			{
				if (m_transportType.indexOf(Session.TRANSPORT_JTAG) >= 0)
				{
					m_clearExistingData.setEnabled(false);
					m_clearExistingData.setCheck(false);
					
					m_transportDataAfter.setEnabled(false);
					m_transportDataAfter.setCheck(false);
					
					m_collectDurationButton.setEnabled(false);
					m_collectDurationButton.setCheck(false);
				}
				else if (m_transportType.indexOf(Session.TRANSPORT_UART) >= 0 ||
						 m_transportType.indexOf(Session.TRANSPORT_USB) >= 0)
				{
					m_clearExistingData.setEnabled(false);
					m_clearExistingData.setCheck(false);
					
					m_transportDataAfter.setEnabled(false);
					m_transportDataAfter.setCheck(false);
					
					m_collectDurationButton.setEnabled(false);
					m_collectDurationButton.setCheck(false);				}
				else
				{
					m_clearExistingData.setEnabled(true);
					
					m_transportDataAfter.setEnabled(true);
					
					m_collectDurationButton.setEnabled(true);
				}
			}
		}
	}
}

function scanCommPorts()
{
	comPorts = Util.getComPortMgr().getList(Util.ComPortMgr.ScanMode.AlwaysScan);
	for(i = 0; i<comPorts.size(); i++) 
	{
		if( m_ipAddressCombo.indexOf(comPorts.get(i)) < 0 ) 
		{
			m_ipAddressCombo.add(comPorts.get(i));
		}
	}
}

function setIPAddress()
{
	if (uiaMode.equals("Live"))
	{
		transport = null;
		if (m_config != null)
		{
			transport = m_config.getEventTransport();
			
			if (transport != null && 
				(transport.getType().equals(Session.TRANSPORT_TCPIP) ||
				transport.getType().equals(Session.TRANSPORT_UDP)))
			{
				settingsGroup.setEnabled(true);
				settingsGroup.setExpanded(true);
				m_ipAddressCombo.setEnabled(true);
				m_ipAddressLabel.setText("IP Address:");
				m_ipAddressCombo.setText(transport.getAddress());// + ":" + transport.getPort());
				m_ipAddressButton.setEnabled(false);
			}
			else if (transport != null &&
					(transport.getType().equals(Session.TRANSPORT_UART) ||
					 transport.getType().equals(Session.TRANSPORT_USB)))
			{
				settingsGroup.setEnabled(true);
				settingsGroup.setExpanded(true);
				m_ipAddressCombo.setEnabled(true);
				m_ipAddressLabel.setText("Port Name:");
				if (transport.getType().equals(Session.TRANSPORT_UART))
				{
					m_ipAddressButton.setEnabled(true);
					scanCommPorts();
				}
				addr = transport.getAddress();
				if(addr != null && addr.length() != 0) 
				{
					m_ipAddressCombo.setText(addr);
				}
				else if(m_ipAddressCombo.getSelection() > 0) 
				{
					m_ipAddressCombo.setSelection(0);
				}
				else 
				{
					m_ipAddressCombo.setText("");
				}
				
				/*
				if ((addr == null || addr.length() == 0) && p_m_state.m_ipAddress != null && p_m_state.m_ipAddress.length() != 0)
				{
					idx = m_ipAddressCombo.indexOf(p_m_state.m_ipAddress);
					if(idx >= 0) 
					{
						m_ipAddressCombo.setSelection(idx);
					}
					else 
					{
						m_ipAddressCombo.add(p_m_state.m_ipAddress);
						m_ipAddressCombo.setText(p_m_state.m_ipAddress);
					}
				}
				*/
			}
			else
			{
				settingsGroup.setEnabled(false);
				settingsGroup.setExpanded(false);
				m_ipAddressCombo.setEnabled(false);
				m_ipAddressButton.setEnabled(false);
			}
		}
	}
}

//Enable this Use Case.
function enable()
{
	p_sa_uc_helper.setTraceMsgLevel(log_level);
	p_sa_uc_helper.traceMsg("enable()");
	p_sa_uc_helper.setUCName(uc_name);

	if( uiaMode.equalsIgnoreCase("Live"))
	{ 
		analyzer_list = p_sa_uc_helper.addToUsecaseDB( eval( dataproviders + "_analyzer")); 
		//analyzer_list will be without ' ' (uses '_'), and without the enabled attribute
	
		for(af=0;af<analyzer_list.length;af++)
		{
			af_tip = eval(analyzer_list[af] + "_Tip");
			//p_sa_uc_helper.traceMsg(analyzer_list[af] + " Tip: " + af_tip);
			p_sa_uc_helper.addUsecaseTip( af, af_tip );
		}

		p_sa_uc_helper.enable();
	}

	//Retrieve UIA run params.
	if( uiaMode.equalsIgnoreCase("Live")) 
	{
		m_runParam = p_m_state.getLiveParam();
	}
	else if( uiaMode.equalsIgnoreCase("Binary")) 
	{
		m_runParam = p_m_state.getFileParam();
	}
	
	if (m_runParam == null)
	{
		m_runParam = new RunParam();
	}
			

	m_duration = m_runParam.duration;
	m_maxData = m_runParam.maxData;
	
	extensionIndex = m_runParam.captureFilename.lastIndexOf('.');
	if (extensionIndex > 0)
	{
		m_captureFilename = m_runParam.captureFilename.substring(0, extensionIndex);					
	}
	else
	{
		m_captureFilename = m_runParam.captureFilename;
	}
	m_configFilename = m_runParam.configFilename;
	m_bTransportDataAfter = m_runParam.transportDataAfter;
	m_bClearExistingData = m_runParam.clearExistingData;

	if( uiaMode.equalsIgnoreCase("Live")) 
	{
		p_m_state.setLiveParam(m_runParam);
	}
	else if (uiaMode.equalsIgnoreCase("Binary"))
	{
		p_m_state.setFileParam(m_runParam);
	}


	config = dvt_usecase_launch_dialog();
   	basicDialog(config);

	systemAnalyzerDialog();

	if (!config.dialog.getFinished())
	{
		return false;
	}
	

	if (m_ipAddressCombo != null && m_ipAddressCombo.getEnabled() && m_ipAddressCombo.getText().length() == 0)
	{
		messageDialog = new ConfigMessage("Please fill in " + m_ipAddressLabel.getText());
		messageDialog.setTitle("Missing Information");
		messageDialog.execute();
		
		return;
	}
	
	store();

	m_analysisActions = m_analysisFeatures.getActions();

	dvt_enable = true;

	dvt_activity.save();

	return true;
}

function store()
{
	duration = 0;
	maxData = 0;
	captureFilename = null;
	configFilename = null;
	transportDataAfter = true;
	clearExistingData = false;
	
	p_sa_uc_helper.traceMsg(uiaMode);
	if( uiaMode.equalsIgnoreCase("Live")) 
	{
		sCollectDuration = m_collectDuration.getText();
		if (sCollectDuration != null && sCollectDuration.length() > 0)
		{
			try
			{
				duration = Integer.parseInt(sCollectDuration);
			}
			catch (err)
			{
			}
		}
		
		sMaxData = m_maxDataEdit.getText();
		if (sMaxData != null && sMaxData.length() > 0)
		{
			try
			{
				maxData = Integer.parseInt(sMaxData);
			}
			catch (err)
			{
			}
		}
				
		if (m_sessionCheck.getCheck())
		{
			configFilename = m_sessionFile.getFile().getAbsolutePath();
		}
		else
		{
			configFilename = "";
		}
		captureFilename = m_saveDataFile.getFile().getAbsolutePath();
		transportDataAfter = m_transportDataAfter.getCheck();
		clearExistingData = m_clearExistingData.getCheck();
		
		captureFile = new File(captureFilename);
		if (captureFile != null && !captureFile.exists())
		{
			captureFile.mkdirs();
		}
	}
	else if( uiaMode.equalsIgnoreCase("Binary")) 
	{
		if (m_sessionCheck.getCheck())
		{
			configFilename = m_sessionFile.getFile().getAbsolutePath();
		}
		else
		{
			configFilename = "";
		}
		captureFilename = m_fileDataCombo.getFile().getAbsolutePath();
	}
	else if( uiaMode.equalsIgnoreCase("File"))
	{
		p_m_state.setCSVFile(m_fileDataCombo.getFile().getAbsolutePath());
	}
	
	if (uiaMode.equalsIgnoreCase("File") == false)
	{
		if (m_config != null)
		{
			//Config config = getConfig();
			
			if (m_ipAddressCombo != null)
			{
				transport = m_config.getEventTransport();
				address = m_ipAddressCombo.getText();
			
				if (transport != null && address != null && address.length() > 0)
				{
					if (transport.getType().equals(Session.TRANSPORT_UART) ||
						transport.getType().equals(Session.TRANSPORT_USB))
					{
						p_m_state.setIPAddress(address);
					}
					
					//transport.setType(m_transportCombo.getText());
					/*
					if (address.indexOf(":") >= 0)
					{
						String port = address.substring(address.indexOf(":")+1);
						transport.setPort(Integer.parseInt(port));
						
						address = address.substring(0, address.indexOf(":"));
					}
					*/
					transport.setAddress(address);
					
					transport = m_config.getMsgTransport();
					if (transport != null)
					{
						transport.setAddress(address);
					}
				}
			}
			
			if (configFilename.length > 0)
			{
				try 
				{
					m_config.store(configFilename, null);
				} 
				catch (err) 
				{
					p_sa_uc_helper.traceMsg(err);
				}
			}
		}

		if (m_runParam != null)
		{
			/*
			p_sa_uc_helper.traceMsg(duration);
			p_sa_uc_helper.traceMsg(maxData);
			p_sa_uc_helper.traceMsg(captureFilename);
			p_sa_uc_helper.traceMsg(configFilename);
			p_sa_uc_helper.traceMsg(transportDataAfter);
			p_sa_uc_helper.traceMsg(clearExistingData);
			*/
			
			m_runParam.duration = duration;
			m_runParam.maxData = maxData;
			m_runParam.captureFilename = captureFilename;
			m_runParam.configFilename = configFilename;
			m_runParam.transportDataAfter = transportDataAfter;
			m_runParam.clearExistingData = clearExistingData;
		}
	}
		
	p_m_state.setAnalysisTable(m_analysisFeatures.getAnalysisTable());
}

//Removes this Use Case.
function disable()
{
	p_sa_uc_helper.traceMsg("disable()");
	//Tear down Use Case.
	//Remove Data Provider? Check to see if this is automatic...
	//
	
	if(uc_state == "Running"){
		dvt_activity.save();
	}
}

//Run this Use Case.
function run()
{
	p_sa_uc_helper.traceMsg("run()");
	
	if(validate_performed == false)
	{
		if(validate() == false)
		{
			dvt_activity_resources = "";
			dvt_activity.removeFromSession();
			return;
		}
	}

	if(scripting){
		p_sa_uc_helper.traceMsg("Scripting");
		uiaConfig = uiaActivity.autoConfigFromDebugger();
		p_sa_uc_helper.setUIACfg( uiaConfig );
	}
	else{
		p_sa_uc_helper.traceMsg("NOT scripting");
	}


	instr_warning = p_sa_uc_helper.getInstrumentationStatus();
	if(instr_warning != "Good"){
		var warning = new ConfigMessage("Instrumentation status: " + instr_warning + ". Continue running ?");
		warning.setIcon(ConfigMessage.WARNING);
		var buttons = ["OK","Cancel"];
		warning.setTitle("Warning");
		warning.setButtons(buttons);
		warning.execute();
	
		if (warning.getResult().equals("Cancel")){
			dvt_activity_resources = "";
			dvt_activity.removeFromSession();
			return;
		}
	}


	
	
	uc_state = "Running";

	// Run
	startUIAViewer();

}

//Reset this Use Case.
function reset()
{
	p_sa_uc_helper.traceMsg("reset()");
}

function save()
{
	p_sa_uc_helper.traceMsg("save()");
	store();
		
	//p_sa_uc_helper.traceMsg("save() " + dvt_activity_instance);
	p_Version = version;
	
	if( uiaMode.equalsIgnoreCase("Live"))
	{ 
		p_sa_uc_helper.save( dvt_save_basedir );
	}
}

var restored = false;
function restore()
{
	p_sa_uc_helper.setTraceMsgLevel(log_level);
	p_sa_uc_helper.traceMsg("Restore()"); 
	uc_state = "Initialization";
	
	if( uiaMode.equalsIgnoreCase("Live"))
	{ 
		//p_sa_uc_helper.enable();
		if (p_sa_uc_helper.restore(dvt_save_basedir) == false){
			var msg = "Restoring of saved settings for usecase failed. Restoring to default settings"
			var message = new ConfigMessage( msg );
			message.setIcon(ConfigMessage.WARNING);
			message.execute();
			p_sa_uc_helper.traceMsg( msg );
			return false;
		}
	}

	/*
	for(af=0;af<analyzer_list.length;af++)
	{
		af_tip = eval(analyzer_list[af] + "_Tip");
		p_sa_uc_helper.traceMsg(analyzer_list[af] + " Tip: " + af_tip);
		p_sa_uc_helper.addUsecaseTip( af, af_tip );
	}

	p_sa_uc_helper.enable();
	*/

	p_sa_uc_helper.traceMsg("config restored");

	//We probably don't need the below 2
	//config = configDialogFn();
	//config.dialog.setFinished(false);

	restored = true;
}

var feature_name;
var tips = new Array();
function getTipWidget(name, tipString)
{
	if (tips[name+"_tips"] == null)
	{
		button = new ConfigButton("...");
		//button.addRun(new IRun({run: function() { new ConfigMessage( tipString ).execute(); }}));
var MyRunnable = Java.extend(Runnable, {
    	run: function() { 
		new ConfigMessage( tipString ).execute();
    	} 
}); 
button.addRun(new MyRunnable());
		tips[name+"_tips"] = button;
	}
	
	return tips[name+"_tips"];
}

function getTips()
{
	feature_name = dvt_getTips;
	//p_sa_uc_helper.traceMsg(feature_name + ":getTips()"); 

	tip = p_sa_uc_helper.getTip( feature_name );
	if(tip == "")
	{
		return new ConfigLabel("");
	}
	else
	{
		return getTipWidget(feature_name, tip);	
	}
}

var feedback = new Array();
function getFeedbackWidget(name, feedbackString)
{
	if (feedback[name+"_feedback"] == null)
	{
		button = new ConfigButton("?");
		//button.addRun(new IRun({run: function() { new ConfigMessage( feedbackString ).execute(); }})); 
var MyRunnable = Java.extend(Runnable, {
    	run: function() { 
		new ConfigMessage( feedbackString ).execute();
    	} 
}); 
button.addRun(new MyRunnable());
		feedback[name+"_feedback"] = button;
	}
	
	return feedback[name+"_feedback"];
}

function getInstrumentationStatus()
{
	feature_name = dvt_getInstrumentationStatus;
	//p_sa_uc_helper.traceMsg(feature_name + ":getInstrumentationStatus()"); 
	row = m_analysisFeatures.getRow(feature_name); 
	widgets = row.getWidgets();
	
	p_sa_uc_helper.setConfigSelection( feature_name, widgets.get(0).getCheck(), widgets.get(1).getText() );

	if (widgets.size() > 0 && (widgets.get(0).getCheck() == true))
	{	
		var instr_status = p_sa_uc_helper.getInstrumentationStatus( feature_name );
		var instr_feedback = p_sa_uc_helper.getFeatureFeedback( feature_name );

		//p_sa_uc_helper.traceMsg("Feature instr_status = " + instr_status); 

		if(instr_status == "Filtered"){
			//All programs filtered by Current Core selection
			return new ConfigLabel("");
		}
		else if(instr_status == "Good"){
			label = new ConfigLabel(instr_status);
			label.setColour("DARK_Green"); 
			return label;
		}
		else if(instr_status == "Inadequate"){
			item = new ConfigRow$ConfigRowItem();
			label = new ConfigLabel(instr_status);
			label.setColour("Red"); 
			button = getFeedbackWidget(feature_name, instr_feedback);
			item.addWidget(label);
			item.addWidget(button);

			//At least one program (on specified core filters) has inadequate logging or Cannot Determine instrumentation
			return item;
		}
		else if((instr_status == "Partial")||(instr_status == "Cannot Determine")){
			item = new ConfigRow$ConfigRowItem();
			label = new ConfigLabel(instr_status);
			label.setColour("Blue"); 
			button = getFeedbackWidget(feature_name, instr_feedback);
			item.addWidget(label);
			item.addWidget(button);

			//At least one program  (on specified core filters) has Partial logging and none of those programs have inadequate logging 
			return item;
		}
	}
	else
	{
		//p_sa_uc_helper.traceMsg("Feature not enabled"); 
		return new ConfigLabel("");
	}
}
