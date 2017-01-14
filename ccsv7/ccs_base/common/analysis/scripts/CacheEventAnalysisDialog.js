dvt_activity.include("../../scripts/DialogHelper.js");
dvt_activity.include("../../scripts/BasicDialog.js");
dvt_activity.include("../../scripts/Receiver.js");
dvt_activity.include("../../scripts/TraceRange.js");

dvt_activity.addPropertyMap("\
      p_AnalysisType=${type}\
");

var p_AnalysisType=null;
var oldAnalysisType = null;

var triggerSectionWidget = null;
var triggerSectionEnabled = true;
var oldTriggerSectionEnabled = null;

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

	triggerSection.addWidget(label("Type:"));
	
	
	triggerSection.addWidget(combobox("Trace", p_AnalysisType));
	p_AnalysisType = combobox("Trace").getItems().get(combobox("Trace").getSelection()).getText();

/*
	combobox("Trace").addRun(new IRun({
        run: function() {
            oldAnalysisType = p_AnalysisType; 
        	if (combobox("Trace").getItems().size() > 0)
        		p_AnalysisType = combobox("Trace").getItems().get(combobox("Trace").getSelection()).getText();
		}
	  }
	));  	
*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		oldAnalysisType = p_AnalysisType; 
        	if (combobox("Trace").getItems().size() > 0)
        		p_AnalysisType = combobox("Trace").getItems().get(combobox("Trace").getSelection()).getText();
    	} 
}); 
combobox("Trace").addRun(new MyRunnable());


	if (!p_trace_uc_helper.jobPropertyExists("Start Address")) {	
	
		applyCanFinish();
	
		configDialog.page.addWidget(label("                               ")); 
		configDialog.page.addWidget(label("                               "));
		configDialog.page.addWidget(label("                               ")); 
	    configDialog.page.addWidget(label("                               "));
	
		advancedSettingButton(configDialog);
	
		return configDialog;	
	}
	
 	triggerSection.addWidget(label("     "));
 	triggerSection.addWidget(label("                               "));
 	triggerSection.addWidget(label("                               "));

	addTraceRange(triggerSection, "TraceRange");
	
	configDialog.page.addWidget(label("                               ")); 
	configDialog.page.addWidget(label("                               "));
	configDialog.page.addWidget(label("                               ")); 
    configDialog.page.addWidget(label("                               "));

	advancedSettingButton(configDialog);

	return configDialog;
}


function applyTriggerProperties() {
	if (typeof p_AnalysisType != "undefined" && p_AnalysisType != null)	 
		p_trace_uc_helper.setJobProperty("Trace", p_AnalysisType);
	else
		p_trace_uc_helper.applyDefaults("Trace");

	applyTraceRange("TraceRange");
}

function cancelDialogProperties() {
	if(typeof cancelReceiverProperties != "undefined")
		cancelReceiverProperties();
	
	p_AnalysisType=oldAnalysisType;
	
	cancelTraceRange("TraceRange");
		
	setTriggerSectionEnabled( oldTriggerSectionEnabled );
}
