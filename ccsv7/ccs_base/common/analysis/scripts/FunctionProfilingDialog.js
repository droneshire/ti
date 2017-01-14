dvt_activity.include("../../scripts/DialogHelper.js");
dvt_activity.include("../../scripts/BasicDialog.js");
dvt_activity.include("../../scripts/Receiver.js");
dvt_activity.include("../../scripts/TraceRange.js");

var triggerSectionWidget = null;
var triggerSectionEnabled = true;
var oldTriggerSectionEnabled = null;

var p_OS = null;
var oldOS = null;
var p_ShowLibraries = false;
var p_ProfileLevel = null;
var oldShowLibraries = null;
var oldProfileLevel = null;

function setTriggerSectionEnabled(tSectionEnabled) {
	if (triggerSectionWidget == null) 
		return;
	
	triggerSectionEnabled = tSectionEnabled;
	triggerSectionWidget.setExpanded(triggerSectionEnabled);
	triggerSectionWidget.setEnabled(triggerSectionEnabled);
	
	configDialog.refresh();
}

var configDialog;
function configDialogFn() {

	
	configDialog = trace_usecase_launch_dialog();

    if(typeof basicDialog != "undefined") 
    	basicDialog(configDialog);

    if(typeof receiverProperties != "undefined")
		receiverProperties(configDialog);
	
	triggerSectionWidget = new ConfigSection("Data Collection Settings");
	triggerSectionWidget.setSpanAllColumns(true);
	triggerSectionWidget.setExpanding(true);
	oldTriggerSectionEnabled = triggerSectionEnabled;
	triggerSectionWidget.setEnabled(triggerSectionEnabled);
	triggerSectionWidget.setExpanded(triggerSectionEnabled);		
	configDialog.page.addWidget(triggerSectionWidget);
	
	var triggerSection = new ConfigSection();
	triggerSection.setNumColumns(5);
	
	triggerSectionWidget.addWidget(triggerSection);

	addTraceRange(triggerSection, "Trace");	   
    	
	addOsSelection(triggerSection, "OS");
	
	// save original values for "cancel"
	oldShowLibraries = p_ShowLibraries;
	oldProfileLevel  = p_ProfileLevel;
	oldOS            = p_OS;
	//System.out.println("p_ShowLibraries: " + p_ShowLibraries);
	//System.out.println("p_ProfileLevel: "  + p_ProfileLevel);
	//System.out.println("p_OS: "  + p_OS);
	
	// Apply the startup/restored properties
	applyAnalysisProperties();

	configDialog.page.addWidget(label("                               ")); 
	configDialog.page.addWidget(label("                               "));
	configDialog.page.addWidget(label("                               ")); 
    configDialog.page.addWidget(label("                               "));

	// Analysis
	createAnalysisSection();
	analysisSection().addWidget(dvt_checkbox(dvt_config_ShowLibraries, p_ShowLibraries));
	
	/*
	dvt_checkbox(dvt_config_ShowLibraries).addRun(new IRun( {
		run: function() {
			p_ShowLibraries = dvt_checkbox(dvt_config_ShowLibraries).getCheck();
			if (dvt_config_ShowLibraries != null) {
				dvt_config_ShowLibraries.setValue(p_ShowLibraries.toString());
			}			
		} 
	})); 
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		p_ShowLibraries = dvt_checkbox(dvt_config_ShowLibraries).getCheck();
		if (dvt_config_ShowLibraries != null) {
			dvt_config_ShowLibraries.setValue(p_ShowLibraries.toString());
		}
    	} 
}); 
dvt_checkbox(dvt_config_ShowLibraries).addRun(new MyRunnable());

	analysisSection().addWidget(label("                               ")); 
	analysisSection().addWidget(label("                               "));
	analysisSection().addWidget(label("                               ")); 
	analysisSection().addWidget(label("                               "));
	analysisSection().addWidget(label("Profile Level:"));
 	analysisSection().addWidget(dvt_combobox(dvt_config_ProfileLevel, p_ProfileLevel));
	
	/*
	dvt_combobox(dvt_config_ProfileLevel).addRun(new IRun( {
		run: function() {
			p_ProfileLevel = dvt_combobox(dvt_config_ProfileLevel).getText();
			if(dvt_config_ProfileLevel != null) {
				dvt_config_ProfileLevel.setValue(p_ProfileLevel);
			} 
		}
	}));
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		p_ProfileLevel = dvt_combobox(dvt_config_ProfileLevel).getText();
		if(dvt_config_ProfileLevel != null) {
			dvt_config_ProfileLevel.setValue(p_ProfileLevel);
		}
    	} 
}); 
dvt_combobox(dvt_config_ProfileLevel).addRun(new MyRunnable());

	// Advanced
	advancedSettingButton(configDialog);

	return configDialog;
}

function applyTriggerProperties() {
	//System.out.println("applyTriggerProperties()");
	
	applyTraceRange("Trace");	
	applyOS();
}

function cancelDialogProperties() {
	//System.out.println("cancelDialogProperties");
	
	if(typeof cancelReceiverProperties != "undefined")
		cancelReceiverProperties();
	
	cancelTraceRange("Trace");
	
	setTriggerSectionEnabled( oldTriggerSectionEnabled );
	
	// restore analysis properties
	p_ShowLibraries = oldShowLibraries;
	p_ProfileLevel  = oldProfileLevel;
	p_OS            = oldOS;
	applyAnalysisProperties();
}

function applyAnalysisProperties() {
	//System.out.println("applyAnalysisProperties()");
	
	if (dvt_config_NoWizard != null)
		dvt_config_NoWizard.setValue("true");
	
	if (dvt_config_ShowLibraries != null)
		dvt_config_ShowLibraries.setValue(p_ShowLibraries.toString());
	if (dvt_config_ProfileLevel != null)
		dvt_config_ProfileLevel.setValue(p_ProfileLevel);
}

function cleanupOnCancelAFs() {
	p_ShowLibraries = false;
	p_ProfileLevel = null;
}

function addOsSelection(triggerSection, osComboName) {
	//System.out.println("addOsSelection()");
	
	triggerSection.addWidget(label("Target OS:"));
	triggerSection.addWidget(combobox(osComboName, p_OS));
	if (combobox(osComboName).getItems().size() > 0)
		p_OS = combobox(osComboName).getItems().get(combobox(osComboName).getSelection()).getText();
	else
		p_OS = "None";
}

function applyOS() {
	if (typeof p_OS != "undefined" && p_OS != null)	{
		//System.out.println("apply OS job: " + "OS" + ", " + p_OS);
		p_trace_uc_helper.setJobProperty("OS", p_OS);
	}
	else {
		//System.out.println("apply OS default job");
		p_trace_uc_helper.applyDefaults("OS");
	}
}
