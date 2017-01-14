dvt_activity.include("../../scripts/traceUseCaseHelper.js");

//Will use cpu if it is assigned a value
var cpu = ""; 
var p_CPUs = null;
var dvt_cpu_names = ""

var uc_state = "Initialization";

var valid = false;
var validate_performed = false;

var config = null;
var log_level = 0;
dvt_activity_instance = 0;

//TODO should not need the family and sub F. Now need for connect
	var STM_Family=470;
	var STM_Sub_Family=38;

//Validate whether this Use Case can be shown in current context.
function validate()
{	
	p_trace_uc_helper.setTraceMsgLevel(log_level);
	p_trace_uc_helper.traceMsg("validate()");

	p_trace_uc_helper.setUCName(uc_name);
	p_trace_uc_helper.setUCType("System");
	p_trace_uc_helper.registerTrace();

	var all_nodes = IDEAdapterManager.getCurrentIDE().getCPUList();
	if(all_nodes.length == 0){
		p_trace_uc_helper.traceMsg("No debug context");
		return false;
	}

	dvt_activity_disabled=false;
	dvt_activity_comment="";

	valid = helperIsSimulator( all_nodes );
	if( valid == true){
		p_trace_uc_helper.traceMsg("Not applicable on simulators");
		dvt_activity_comment="Not applicable on simulators";
		dvt_activity_disabled=true;
		return true;
	}


	p_CPUs = p_trace_uc_helper.getSystemNodes( STM_Family, STM_Sub_Family );
	if((p_CPUs == null)||(p_CPUs.length==0)){
		p_trace_uc_helper.traceMsg("STM System node not found");
		return false;
	}

	if( !p_trace_uc_helper.canDetermineDeviceMatch( ) ){
		p_trace_uc_helper.traceMsg("May be applicable");
		dvt_activity_comment="May be applicable";
		return true;
	}
	

	//for(i=0;i<p_CPUs.length;i++){
		var found = helperFindJobs( "System", p_CPUs[0] );
		if(found == false){
			p_trace_uc_helper.traceMsg("Not Applicable for System node");		
			return false;
		}
		else{
			p_trace_uc_helper.traceMsg("Applicable for System node");		
		}
	//}


	validate_performed = true;
	
	dvt_activity_instances = 1; 
	var short_name = helperGetNameForDisplay( p_CPUs[0].toString() ); 
	dvt_activity_resources = "System Trace on " + short_name;
	dvt_activity_names = short_name;

	dvt_cpu_names = p_CPUs[0].toString(); 

	helperSetCPUs( p_CPUs );
	if(p_trace_uc_helper.isScriptingEnvironment()){
		helperSetCoreName( p_CPUs[0].toString() );
	}

	dvt_save_subpath = helperGetSubFolderForDevice();
	p_trace_uc_helper.traceMsg("dvt_save_subpath = " + dvt_save_subpath);

	valid = true;
	return true;
}

function createJobs()
{
	p_trace_uc_helper.traceMsg("createJobs()");

	if(restored == false){

	var receiver_jobs = helperGetReceiverJobs( p_CPUs[0] );
	var receiver_enables = helperGetReceiverEnables( p_CPUs[0] );
	if(receiver_jobs == null){
		return false;
	}
	else if(receiver_jobs.length == 0){
		return false;
	}

	var done = helperApplyReceiverJobs( "System", p_CPUs[0], receiver_jobs, receiver_enables);
	if( done == false){
		var errmsg = p_trace_uc_helper.getErrorMsg();
		p_trace_uc_helper.traceMsg(errmsg);
		p_trace_uc_helper.traceMsg("Could not Create Receiver Job on Target");
		var message = new ConfigMessage( errmsg );
		message.setIcon(ConfigMessage.ERROR);
		message.execute();
		dvt_activity_resources = "";  //Note this is needed here because the removeFromSession is asynch 
		dvt_activity.removeFromSession();
		return false;
	}



	var trigger_jobs  = helperGetTriggerJobs( p_CPUs[0] );
	var trigger_enables = helperGetTriggerEnables( p_CPUs[0] );
	if(trigger_jobs == null){
		return false;
	}
	else if(trigger_jobs.length == 0){
		return false;
	}

	if( helperApplyTriggerJobs("System", p_CPUs[0], trigger_jobs, trigger_enables) == false){
		p_trace_uc_helper.traceMsg("Trigger Jobs not applicable ");
		return false;
	}

	}
	else{
		restored = false;
	}

	p_trace_uc_helper.cacheJobs( p_CPUs[0] );

	return true;
}

function getInstrumentationType()
{
	return "System Trace";
}

function getCores()
{
	return dvt_activity_names;
}

function getTransportType()
{
	return combobox("Receiver");
}

function applyWhenRunning()
{
	p_trace_uc_helper.traceMsg("applyWhenRunning()");
	helperCreateCopyOfJobs( p_CPUs[dvt_activity_instance].toString() );
	helperSetCoreName( p_CPUs[dvt_activity_instance].toString() );
	config = configDialogFn();
	config.dialog.setApplyText("Apply");
	config.reset.setVisible(false);
	var apply = config.dialog.execute();
	if (!config.dialog.getFinished()){
		if (typeof cancelDialogProperties != "undefined"){ 
			cancelDialogProperties();
		}
		return false;
	}
	else{
		var done = helperCommitJobsOnApply( p_CPUs[dvt_activity_instance] );
		if( done == false){
			var errmsg = p_trace_uc_helper.getErrorMsg();
			p_trace_uc_helper.traceMsg(errmsg);
			p_trace_uc_helper.traceMsg("Could not Enable Jobs on Target");
			var message = new ConfigMessage( errmsg );
			message.setIcon(ConfigMessage.ERROR);
			message.execute();
			dvt_activity_resources = "";  //Note this is needed here because the removeFromSession is asynch 
			dvt_activity.removeFromSession();
			return false;
		}

		if(uc_state == "Running"){
			dataproviderActivity.connectTo( p_CPUs[dvt_activity_instance].toString() );
		}
		resetAFs();
		
		p_Version = version;
		p_trace_uc_helper.traceMsg("dvt_save_subpath = " + dvt_save_subpath);
		dvt_activity.save();
		
		return true;
	}
}

function resetAFs()
{
	p_trace_uc_helper.traceMsg("resetAFs()");
}


//Enable this Use Case.
function enable()
{
	p_trace_uc_helper.setTraceMsgLevel(log_level);
	p_trace_uc_helper.traceMsg("enable()");
	p_trace_uc_helper.setUCName(uc_name);
	p_trace_uc_helper.setUCType("System");

	if( p_trace_uc_helper.isSystemTraceConnected( STM_Family, STM_Sub_Family ) ){
		//just incase STM only was connected
		helperConnectCSETB();
		//p_trace_uc_helper.connectEVEs();
		//TODO is the below needed since we are saving the cpus in p_CPUs?
		//TODO should we be saving the cpus?
		p_CPUs = helperConnectSystemTrace( STM_Family, STM_Sub_Family );
	}
	else{
		configBusyProgress = new ConfigBusyProgress("Connecting to System Trace Module");
		myConnectRun =  { 
              		run: function() {
                     	p_CPUs = helperConnectSystemTrace( STM_Family, STM_Sub_Family );
		     	if(p_CPUs != null){
                     		helperConnectCSETB();
				//p_trace_uc_helper.connectEVEs();
		     	}
                     	configBusyProgress.done();
              	}
		};
		//configBusyProgress.addRun(new IRun(myConnectRun));
var MyRunnable = Java.extend(Runnable, myConnectRun ); 
configBusyProgress.addRun(new MyRunnable());
		configBusyProgress.execute();
	}

	if(p_trace_uc_helper.isScriptingEnvironment()){
		//This is just for the scenario of having older user saved UCs in which the validate_performed got saved and is true
		validate_performed = false;
	}
	else{
		if(validate_performed == false){
			if( (validate() == false) || (createJobs() == false) ){

				var message = new ConfigMessage( "[" + uc_name.replace(/_/g," ") + "] not applicable on this device" );
				message.setIcon(ConfigMessage.ERROR);
				message.execute();

				dvt_activity_resources = "";
				dvt_activity.removeFromSession();
				return false;
			}
		}
		else{
			if( createJobs() == false){
				dvt_activity_resources = "";
				dvt_activity.removeFromSession();
				return false;
			}
		}
		//dvt_save_subpath = helperGetSubFolderForDevice();
		helperSetCoreName( p_CPUs[0].toString() );
		config = configDialogFn();
		config.execute();

		if (!config.dialog.getFinished()){
			helperCleanupOnCancel();
			return false;
		}
		p_trace_uc_helper.traceMsg("dvt_save_subpath = " + dvt_save_subpath);
	}

	p_Version = version;
	dvt_activity.save();

	return true;
}

//Disable this Use Case
function stop()
{
	p_trace_uc_helper.traceMsg("stop() " + dvt_activity_instance);
	helperDisableUC(  p_CPUs[dvt_activity_instance] );
	uc_state = "Disabled";
}

//Re-enable this Use Case
function reenable()
{
	p_trace_uc_helper.traceMsg("reenable() " + dvt_activity_instance);
	helperReEnableUC(  p_CPUs[dvt_activity_instance] );
}


//Removes this Use Case.
function disable()
{
	p_trace_uc_helper.traceMsg("disable() " + dvt_activity_instance);
	helperRemove( p_CPUs[dvt_activity_instance].toString() );
	//Tear down Use Case.
	//Remove Data Provider? Check to see if this is automatic...
}

//TODO right now assuming only one DataProvider and AF list
var dataproviderActivity;
var analysisfeatures;

//Run this Use Case.
function run()
{
	p_trace_uc_helper.traceMsg("run() " + dvt_activity_instance);
	if(validate_performed == false){
		if( (validate() == false) || (createJobs() == false) ){
			dvt_activity_resources = "";
			dvt_activity.removeFromSession();
			return;
		}
	}

	cpu_to_connect = p_CPUs[dvt_activity_instance];
	if( uc_state == "Disabled"){
		reenable();
		uc_state = "Running";	
		dataproviderActivity.connectTo( cpu_to_connect.toString() );
		resetAFs();
		return;
	}

	if( uc_state == "Running"){
		p_trace_uc_helper.traceMsg("UC already running");
		return;	
	}
	else{
		uc_state = "Running";
	}
	


	//Add configuration buttons to Analysis Dashboard column.
	var configure = new Configure();
	var propertiesButton = new ConfigButton("Analysis Properties...");
	propertiesButton.setIcon("platform:/plugin/com.ti.dvt.analysis.suite.gui/icons/properties.gif");
	var propertyRun = { run: function() { applyWhenRunning(); } };
	//propertiesButton.addRun(new IRun(propertyRun));
var MyRunnable = Java.extend(Runnable, propertyRun ); 
propertiesButton.addRun(new MyRunnable());

	configure.addWidget(propertiesButton);
	dvt_activity.addConfigure(configure);

	var status = new Status();
	var button = new ConfigButton("Close Session", "delete.gif");
	propertyRun = { run: function() {dvt_activity.removeFromSession();} };
	//button.addRun(new IRun(propertyRun));
var MyRunnable = Java.extend(Runnable, propertyRun ); 
button.addRun(new MyRunnable());

	status.addWidget(button);
	dvt_activity.addStatus(status);

	dvt_cpu_names = cpu_to_connect.toString();
	dvt_activity_names = helperGetNameForDisplay( cpu_to_connect.toString() );

	p_trace_uc_helper.traceMsg(cpu_to_connect.toString());

	if(p_trace_uc_helper.isScriptingEnvironment()){
		if (typeof applyReceiverProperties != "undefined"){ 
			p_trace_uc_helper.traceMsg("Applying receiver properties");
			applyReceiverProperties();
		}

		if (typeof applyTriggerProperties != "undefined"){ 
			p_trace_uc_helper.traceMsg("Applying trigger properties");
			applyTriggerProperties();
		}
		
		if (typeof applyAnalysisProperties != "undefined"){ 
			p_trace_uc_helper.traceMsg("Applying analysis properties");
			applyAnalysisProperties();
		}		
	}
	var func_not_run = helperRunGelFunctions( p_CPUs[dvt_activity_instance] );
	if(func_not_run != ""){
		p_trace_uc_helper.traceMsg("Could not run gel script function " + func_not_run + ".");
		var message = new ConfigMessage("Could not run analyzer. Cause: Unable to run gel script function " + func_not_run + ". Check that the correct gel script is loaded");
		message.setIcon(ConfigMessage.ERROR);
		message.execute();
		dvt_activity_resources = "";
		dvt_activity.removeFromSession();
		return;
	}

	var done = helperEnableTrace( cpu_to_connect );
	if( done == false){
		var errmsg = p_trace_uc_helper.getErrorMsg();
		p_trace_uc_helper.traceMsg(errmsg);
		p_trace_uc_helper.traceMsg("Could not Enable Jobs on Target");
		var message = new ConfigMessage( "Could not run analyzer. Cause: " + errmsg );
		message.setIcon(ConfigMessage.ERROR);
		message.execute();
		dvt_activity_resources = "";  //Note this is needed here because the removeFromSession is asynch 
		dvt_activity.removeFromSession();
		return;
	}

	dataprovider_list = dataproviders.split(",");

	if(dataprovider_list.length > 1){
		//TODO right now assuming only one DataProvider and AF list
		p_trace_uc_helper.traceMsg("Do not support more than one Data Provider per UC");
		var message = new ConfigMessage("Do not support more than one Data Provider per UC");
		message.setIcon(ConfigMessage.ERROR);
		message.execute();
		dvt_activity_resources = "";  //Note this is needed here because the removeFromSession is asynch
		dvt_activity.removeFromSession();
		return;
	}

	dvt_activity_resources = dvt_activity_resources.split(",")[dvt_activity_instance];
	p_trace_uc_helper.traceMsg("Resource consumed: " + dvt_activity_resources);

	for(dp=0;dp<dataprovider_list.length;dp++){
		//TODO trim()
		p_trace_uc_helper.traceMsg("DP " + dataprovider_list[dp] );
		//TODO if eval does not exist
		provider_name = eval(dataprovider_list[dp]+"_name");

		dataproviderActivity = ActivityManager.get().findActivity("Viewers/" + provider_name);
		dataproviderActivity = dataproviderActivity.copy();  //TODO change APIs to get rid of the copy()
		if (dataproviderActivity != null) {	
			if(!p_trace_uc_helper.isScriptingEnvironment()){
				dataproviderActivity.setSaveAndRestoreDir( p_trace_uc_helper.getSaveDir() );
			}
			dataproviderActivity.disableOpenAction();
			
			var status = new Status();
			status.addWidget(propertiesButton);
			dataproviderActivity.addStatus(status);

			ActivityManager.get().addActivityToSession(dataproviderActivity, dvt_activity);

			if( dataprovider_list[dp] == "Trace"){
				//Connenct to cpu
				dataproviderActivity.connectTo( cpu_to_connect.toString() );
			}
			analysisfeatures = eval(dataprovider_list[dp]+"_analyzer").split(",");
			for(af=0;af<analysisfeatures.length;af++){
				//TODO trim()
				p_trace_uc_helper.traceMsg("DP " + dataprovider_list[dp] + " <-- "  + analysisfeatures[af]);
				//Launch AFs
				var analysisFeatureTemplate = ActivityManager.get().findAction(analysisfeatures[af]);
				if (analysisFeatureTemplate != null){
					//TODO all AFs don't have this property to set
					var analysisFeature = ActivityManager.get().addActionToSession(dataproviderActivity, analysisFeatureTemplate);
				}
				else{
					p_trace_uc_helper.traceMsg("Could not find analysis feature " +  analysisfeatures[af]);
				}
			}
		}
		else{
			p_trace_uc_helper.traceMsg("dataprovider not found " +  dataprovider_list[dp]);
		}

	} //end of for dps

}

//Reset this Use Case.
function reset()
{
	p_trace_uc_helper.traceMsg("reset()");
}

function save()
{
	p_trace_uc_helper.traceMsg("save() " + dvt_activity_instance);
	p_Version = version;
	p_trace_uc_helper.save( dvt_save_basedir );
}

var restored = false;
function restore()
{
	p_trace_uc_helper.setTraceMsgLevel(log_level);
	p_trace_uc_helper.traceMsg("Restore()"); 
	uc_state = "Initialization";


	if( !helperSaveRestoreVersionCompatible() ){
		var txt;
		if( helperIsCustomUC() ){
			txt = "The saved usecase is based of a different version of the save and restore feature. Please delete it and save a newer version of it. Restoring to default settings.";
		}
		else{
			txt = "The automatically saved usecase's last settings are based of a different version of the save and restore feature. Restoring to default settings. Please relaunch the usecase.";
		}
		var message = new ConfigMessage( txt );
		message.setIcon(ConfigMessage.WARNING);
		message.execute();
		p_trace_uc_helper.traceMsg( txt );
		return false;
	}


	var factory_changed = p_trace_uc_helper.testForFactoryChange( p_trace_uc_helper.getProperty( uc_name + ".FactoryReceiverInfo"), p_trace_uc_helper.getProperty( uc_name + ".FactoryTriggerInfo"), p_trace_uc_helper.getProperty( uc_name + ".FactoryGelToRunInfo") );
	if( factory_changed ){
		var msg;
		if( helperIsCustomUC() ){
			msg = "The saved usecase's default settings changed since it was saved. Please delete it and save a newer version of it. Bringup the usecase with new default settings?";
		}
		else{
			msg = "The automatically saved usecase default settings changed since it was saved. It is suggested to restore to new default settings. Restore to current default settings?";
		}
		p_trace_uc_helper.traceMsg(msg);

		var message = new ConfigMessage(msg);
		var button_options=["Yes","No"];
		message.setButtons(button_options);
		message.setIcon(ConfigMessage.WARNING);
		message.execute();
		var result = message.getResult();
		if( result == "Yes" ){
			p_trace_uc_helper.traceMsg("Restoring to default settings");
			return false;
		}
		else{
			p_trace_uc_helper.traceMsg("Attempting to restore usecase saved with older default settings");
		}
	}
	
	if( !p_trace_uc_helper.isSystemTraceConnected( STM_Family, STM_Sub_Family ) ){
		configBusyProgress = new ConfigBusyProgress("Connecting to System Trace Module");
		myConnectRun =  { 
              		run: function() {
                     		p_CPUs = helperConnectSystemTrace( STM_Family, STM_Sub_Family );
		     		if(p_CPUs != null){
                     			helperConnectCSETB();
					//p_trace_uc_helper.connectEVEs();
		     		}
                     		configBusyProgress.done();
              		}
		};
		//configBusyProgress.addRun(new IRun(myConnectRun));
var MyRunnable = Java.extend(Runnable, myConnectRun ); 
configBusyProgress.addRun(new MyRunnable());
		configBusyProgress.execute();
	}
	else{
		//just incase STM only was connected
        	helperConnectCSETB();
		//p_trace_uc_helper.connectEVEs();
		//TODO is the below needed since we are saving the cpus in p_CPUs?
		//TODO should we be saving the cpus?
		p_CPUs = helperConnectSystemTrace( STM_Family, STM_Sub_Family );
	}

	if (p_trace_uc_helper.restore(dvt_save_basedir, p_CPUs) == false){
		var msg = "Restoring of saved settings for usecase failed. Restoring to default settings"
		var message = new ConfigMessage( msg );
		message.setIcon(ConfigMessage.WARNING);
		message.execute();
		p_trace_uc_helper.traceMsg( msg );
		return false;
	}

	p_trace_uc_helper.traceMsg("config restored");
	config = configDialogFn();
	config.dialog.setFinished(false);

	//Dont need for receiver since we are restoring their jobs always
	//if (typeof applyReceiverProperties != "undefined"){ 
	//		applyReceiverProperties();
	//}
	if( p_trace_uc_helper.beenToAdvanced( p_CPUs[0] ) == true  ){ //this works because of homogenous selections supported only 
		if (typeof setTriggerSectionEnabled != "undefined"){ 
			setTriggerSectionEnabled(false);
		}
	}
	else{
		if (typeof applyTriggerProperties != "undefined"){ 
			applyTriggerProperties();
		}
	}
	if (typeof applyAnalysisProperties != "undefined") { 
		applyAnalysisProperties();
	}		

	restored = true;
}

function onIDEEvent_CPU_REMOVED()
{
	//Debug terminate
	p_trace_uc_helper.flushCachedJobs();
}
