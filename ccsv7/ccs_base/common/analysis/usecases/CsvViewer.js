dvt_activity.include("helper.js");

//var dvt_activity_name = "Use Cases/Function Profiling";
//var dvt_activity_description = "Use Case for function profiling.";

var supported_type = 0x66;

var cpus;
var dvt_cpu_names = "";
var dvt_validate = false;

var config;
var csvViewer = null;
var dvt_activity_disabled = true;

var csvFilePath = "";

var dvt_activity_instance = 0;

//Validate whether this Use Case can be shown in current context.
function validate()
{	
	dvt_activity_disabled = !dvt_activity_disabled;
	
	//Make calls to Debug Server, or Trace Server, 
	//or whatever else is needed to validate whether this Use Case is valid for current context.

	//getSelectedCores().
	//look at types..
	var valid = true;

	cpus = IDEAdapterManager.getCurrentIDE().getSelectedCPUList();
	
	System.out.println(supported_type);
	System.out.println("jack");
	System.out.println(cpus.length);

	System.out.println(sampleProperty);
	System.out.println(sampleProperty2);

	if (cpus.length > 0)
	{	
		for (i=0; i<cpus.length; i++)
		{
			System.out.println(cpus[i].toString());
			System.out.println(cpus[i].getCPUSubFamily());
			if (cpus[i].getCPUSubFamily() != supported_type)	
			{
				return false;
			}	
		}	
	}
	
	dvt_validate = true;
	
	return true;
}


function test()
{
	new ConfigProperty("Property Dialog").execute();
	config.system.setEnabled(!config.system.getEnabled());
	config.system.setCheck(!config.system.getCheck());
	config.system.setHighlight(!config.system.getHighlight());
	config.cpuSelect.setSelection(1);
	config.cpuSelect.setHighlight(!config.cpuSelect.getHighlight());
	config.refresh();
}

function test3()
{
	config.system.setEnabled(!config.system.getEnabled());
	config.system.setCheck(!config.system.getCheck());
	config.system.setHighlight(!config.system.getHighlight());
	config.refresh();
}

function getInstrumentationType()
{
	return "CPU Trace";
}

function getCores()
{
	return dvt_activity_resources;
}

function getTransportType()
{
	return "ETB";
}

//Set up GUI for Launch dialog.
//Add "wizard page" for simple properties.
function launchDialog()
{
	var launch = dvt_usecase_launch_dialog();

	launch.table.setText("Instrumentation Type,Cores,Transport Type");
	launch.table.addRow(new ConfigRow(dvt_activity));
	
	launch.page.setNumColumns(5);
	
	launch.page.addWidget(new ConfigLabel("Which Views to Open:"));
	launch.page.addWidget(new ConfigCheck("Trace View"));
	launch.page.addWidget(new ConfigCheck("Profile View"));
	
	var system = new ConfigCheck("System Analyzer Log View");
	system.setEnabled(false);
	launch.page.addWidget(system);
	launch.system = system;
	var moreButton = new ConfigButton("More...");
	launch.page.addWidget(moreButton);
	launch.page.addWidget(new ConfigLabel("DSS Script to run:"));
	var file = new ConfigFile("");
	file.setSpanColumns(3);
	launch.page.addWidget(file);
	
	//Callback implementation #1:
	var impl = { run: test };
	
	//Callback implementation #2:
	var impl2 = { run: function()
	{
		new ConfigMessage("test1").execute();
	}};
		
	moreButton.addRun(new IRun(impl));

	var impl3 = { run: test3 };
	
	launch.page.addWidget(new ConfigLabel("Core or Master"));
	var cpuSelect = new ConfigCombo("CPU");
	launch.cpuSelect = cpuSelect;
	cpuSelect.setEdit(true);
	cpuSelect.add(new ConfigCombo.ConfigComboItem("ALL"));
	cpuSelect.add(new ConfigCombo.ConfigComboItem("cpu_1"));
	cpuSelect.add(new ConfigCombo.ConfigComboItem("cpu_2"));
	cpuSelect.addRun(new IRun(impl3));
	launch.page.addWidget(cpuSelect);

	
	return launch;
}

//Enable this Use Case.
function enable()
{
	var result = dvt_activity.callMethod("enable2");
	System.out.println(result);
	if (result == false)
	{
		return false;		
	}

	cpus = IDEAdapterManager.getCurrentIDE().getSelectedCPUList();
	
	if (cpus.length > 0)
	{	
		for (i=0; i<cpus.length; i++)
		{
			if (cpus[i] != null)
			{
				dvt_cpu_names = dvt_cpu_names + cpus[i].toString() + ";";
			}
		}	
	}
	System.out.println("here:" + dvt_cpu_names);
	
	helper();
	
	System.out.println("here:" + dvt_cpu_names);
	
	//Example call to IDEAdapter.
	var cpu = IDEAdapterManager.getCurrentIDECPU();
	if (cpu != null)
	{
		cpu.halt();
	}
	System.out.println("here:" + dvt_cpu_names);

	System.out.println("config assigned");
	config = launchDialog();
	config.execute();

	System.out.println("here:" + dvt_cpu_names);
	if (!config.dialog.getFinished())
	{
		return false;
	}

	/*	
	var fileDialog = new ConfigFile();
	fileDialog.setText("me");
	fileDialog.setPath(filepath);
	fileDialog.execute();
	if (!fileDialog.getFinished())
	{
		return;
	}
	*/	

	//dvt_activity.runScript("Breakpoints.js");
	System.out.println("here:" + dvt_cpu_names);


	return true;
}

//Disable this Use Case.
function disable()
{
	//Tear down Use Case.
	//Remove Data Provider? Check to see if this is automatic...
}

//Run this Use Case.
function run()
{
	System.out.println("here:" + dvt_cpu_names);
	if (dvt_run)
	{
		if (csvViewer == null)
		{
			dvt_activity_resources = dvt_activity_resources.split(",")[dvt_activity_instance];
			
			//Add configuration buttons to Analysis Dashboard column.
			var configure = new Configure();
			var button = new ConfigButton("Properties...");
			var propertyRun = { run: function() {System.out.println("instance #:" + dvt_activity_instance); var apply = config.dialog.execute(); System.out.println("instance again #:" + dvt_activity_instance);} };
			button.addRun(new IRun(propertyRun));
			configure.addWidget(button);
			dvt_activity.addConfigure(configure);
	
	
			var status = new Status();
			button = new ConfigButton("Close Session", "delete.gif");
			propertyRun = { run: function() {dvt_activity.removeFromSession();} };
			button.addRun(new IRun(propertyRun));
			status.addWidget(button);
			dvt_activity.addStatus(status);
		
	
			dataproviders = dataproviders.split(",");
			csvViewer = ActivityManager.get().findActivity(eval(dataproviders[0]+"_name"));
			csvViewer = csvViewer.copy();
			
			if (csvViewer != null)
			{	
				if (csvFilePath != null)
				{
					csvViewer.setProperty("csvFilePath", csvFilePath);
				}
				ActivityManager.get().addActivityToSession(csvViewer, dvt_activity);
				
				if (csvViewer.getSession() != null)
				{
					var analysis = eval(dataproviders[0]+"_analysis").split(",");
					analysis = ActivityManager.get().findAction(analysis[dvt_activity_instance]);
					
					if (analysis != null)
					{
						analysis.getActivity().setProperty("wizard.page1.masterlist.text", "ALL");
						ActivityManager.get().addActionToSession(csvViewer, analysis);
					}
				}
			}
			else
			{
				dvt_activity.removeFromSession()
			}
		}
		else
		{
			csvViewer.run();
		}
	}
}

function stop()
{
	if (csvViewer != null)
	{
		csvViewer.stop();
	}
}

//Reset this Use Case.
function reset()
{
	
}

function save()
{
}

function restore()
{
	System.out.println("config restored");
	config = launchDialog();
}
