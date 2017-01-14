dvt_activity.include("../../scripts/traceUseCaseHelper.js");

dvt_activity.addPropertyMap("\
      tdfFilename = ${tdfFilename},\
      tdfFilename = ${csvFilename},\
      outFilename = ${outFilename},\
      sourcePaths = ${sourcePaths}\
");

var dvt_cpu_names = ""
var uc_state = "Initialization";

var valid = false;
var validate_performed = false;
var scripting = dvt_activity.getProperty("scripting");

dvt_activity_priority = 5;

var log_level = 0;

//Validate whether this Use Case can be shown in current context.
function validate()
{	
	p_trace_uc_helper.setTraceMsgLevel(log_level);
	p_trace_uc_helper.traceMsg("validate()");
	validate_performed = true;

	dvt_activity_instances = 1; 
	dvt_activity_names = ""; 

	valid = true;
	return true;
}

var file;

//Set up GUI for Launch dialog.
//Add "wizard page" for simple properties.
function launchDialog() {

	p_trace_uc_helper.traceMsg("launchDialog()");
	var launch = trace_usecase_launch_dialog();

	launch.page.setNumColumns(4);

	//Read mapping xml file which maps
	//1. Hardware breakpoint property
	//2. Abstracted input on GUI
	//3. The Trace Job file

	launch.page.addWidget(new ConfigLabel("File Name:"));

	var file = new ConfigFile("");
	file.setSpanColumns(3);
	launch.page.addWidget(file);


	//--------------------------
	//--------------------------
	
	return launch;
}

var traceViewerActivity = null;

function startTraceViewer()
{
	if (traceViewerActivity == null) {
		traceViewerActivity = ActivityManager.get().findActivity("Viewers/Trace Viewer");
		traceViewerActivity = traceViewerActivity.copy();  //TODO change APIs to get rid of the copy()
		if (traceViewerActivity != null) {	
			traceViewerActivity.disableOpenAction();
			ActivityManager.get().addActivityToSession(traceViewerActivity, dvt_activity);
		} else {
			p_trace_uc_helper.traceMsg("traceViewer is null" );
			return false;
		}
	}

	//TODO API to launch Trace viewer with file
	traceViewerActivity.openFile(tdfFilename, outFilename, sourcePaths); // args are only used when in scripting mode and must not be null
	var flag = traceViewerActivity.isFileOpenSuccessful();
	if( flag == true)
	{
		if (scripting == false)
		{
			dvt_activity_names = traceViewerActivity.getFile();
			file = new File(dvt_activity_names);
			dvt_activity_names = file.getName();
		}
		else
		{
			dvt_activity_names = tdfFilename;
		}
		var status = new Status();
		button = new ConfigButton("Close Session", "delete.gif");
		propertyRun = { run: function() {dvt_activity.removeFromSession();} };
		//button.addRun(new IRun(propertyRun));
var MyRunnable = Java.extend(Runnable, propertyRun ); 
button.addRun(new MyRunnable());
		status.addWidget(button);
		dvt_activity.addStatus(status);
	}
	else
	{
		return false;
	}

	return true;
}

//Enable this Use Case.
function enable()
{
	p_trace_uc_helper.setTraceMsgLevel(log_level);
	p_trace_uc_helper.traceMsg("enable()");
	
	if (scripting == false)
	{
		if (!startTraceViewer())
		{
			return false;
		}
	} 
	
	dvt_enable = true;

	return true;
}

//Removes this Use Case.
function disable()
{
	p_trace_uc_helper.traceMsg("disable()");
	//Tear down Use Case.
	//Remove Data Provider? Check to see if this is automatic...
}

//Run this Use Case.
var tdfFilename = "";
var outFilename = "";
var sourcePaths = "";
function run()
{
	p_trace_uc_helper.traceMsg("run()");
	if(validate_performed == false){
		if(validate() == false){
			dvt_activity.removeFromSession();
			return;
		}
	}


	uc_state = "Running";
	
	if (tdfFilename != null && tdfFilename.length > 0)
	{
		if (!startTraceViewer())
		{
			dvt_activity.removeFromSession();
		}
	} 
}

//Reset this Use Case.
function reset()
{
	p_trace_uc_helper.traceMsg("reset()");
	
}
