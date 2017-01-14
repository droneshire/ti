dvt_activity.include("../../scripts/useCaseHelper.js");
importPackage(Packages.com.ti.dvt.uia.utils)
importPackage(Packages.com.ti.dvt.uia.affsup)

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
var uiaMode = "";	// "Live" or "File" 
var uiaMaster = ""; //The Master whose data will be processed. If there is only one core in the debug context/configuration file then this property will be ignored by the AF and will automatically set to that lone Master


var logger = new TraceUseCaseHelper( );	// TODO - any other class available for logging?
var uc_state = "Initialization";

var valid = false;
var validate_performed = false;
var scripting = dvt_activity.getProperty("scripting");

dvt_activity_priority = 5;

function isStringEmpty(str) {
	return str == null || str.length == 0;
}

//Validate whether this Use Case can be shown in current context.
function validate()
{	
	logger.setTraceMsgLevel(0);
	if(typeof enabled !== "undefined") {
		if(enabled == "false"){
			return false;
		}
	}
	logger.traceMsg("validate()");
	validate_performed = true;

	dvt_activity_instances = 1; 
	dvt_activity_names = ""; 

	valid = true;
	return true;
}

//Set up GUI for Launch dialog.
//Add "wizard page" for simple properties.
function launchDialog() {

	logger.traceMsg("launchDialog()");
	var launch = null;

	return launch;
}

function startUIAViewer()
{
	_activityName = "UIA-Java/UIA Log Viewer";
	var uiaViewerActivity = ActivityManager.get().findActivity(_activityName);
	uiaViewerActivity = uiaViewerActivity.copy();
	uiaViewerActivity.setAutoRun(false);
	if (uiaViewerActivity != null) {
		// handle user entered properties, map them to UIA run parameters	
		var param = new IUtilUI.RunParam();

		if ( !isStringEmpty(uiaMode) ) {
			if( uiaMode.equalsIgnoreCase("File") ) {
				uiaViewerActivity.setName("Binary File");
			}
			else if( uiaMode.equalsIgnoreCase("Live") ) {
				uiaViewerActivity.setName("Live");
			}
		}
		if ( !isStringEmpty(uiaCfgFilename) ) {
			param.configFilename = uiaCfgFilename; 
		}
		if ( !isStringEmpty(uiaDataFolder) ) {
			param.captureFilename = uiaDataFolder; 
		}
		uiaViewerActivity.setProperty("runParam", param);
		
		ActivityManager.get().addActivityToSession(uiaViewerActivity, dvt_activity);

		//Assuming only one Data provider for now
		if( dataproviders == "UIA"){
			provider_name = eval(dataproviders + "_name");

			var analysisfeatures = eval(dataproviders + "_analysis").split(",");
			for(af=0;af<analysisfeatures.length;af++){
				logger.traceMsg("DP " + dataproviders + " <-- "  + analysisfeatures[af]);
				//Launch AFs
				var analysis = ActivityManager.get().findAction(analysisfeatures[af]);
				if (analysis != null){
					analysis.getActivity().setProperty("wizard.page1.masterlist.text", uiaMaster);
					ActivityManager.get().addActionToSession(uiaViewerActivity, analysis);
				}
				else{
					logger.traceMsg("Could not find analysis feature " +  analysisfeatures[af]);
				}
			}
		}
		else{
			logger.traceMsg("Not UIA DataProvider");
		}

	}
	else{
		logger.traceMsg("Failed to load: "+_activityName );
	}
}

//Enable this Use Case.
function enable()
{
	logger.setTraceMsgLevel(0);
	logger.traceMsg("enable()");

	dvt_enable = true;

	return true;
}

//Removes this Use Case.
function disable()
{
	logger.traceMsg("disable()");
	//Tear down Use Case.
	//Remove Data Provider? Check to see if this is automatic...
}

//Run this Use Case.
function run()
{
	logger.traceMsg("run()");
	if(validate_performed == false){
		if(validate() == false){
			dvt_activity.removeFromSession();
			return;
		}
	}

	uc_state = "Running";

	// Run
	UIAActivitySup.InitTimeBaseServerFactory();	// Need this for multi-core correlation
	startUIAViewer();
	
}

//Reset this Use Case.
function reset()
{
	logger.traceMsg("reset()");
	
}
