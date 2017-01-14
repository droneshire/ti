dvt_activity.include("../../scripts/DialogHelper.js");
dvt_activity.include("../../scripts/BasicDialog.js");
dvt_activity.include("../../scripts/Receiver.js");
dvt_activity.include("../../scripts/TraceRange.js");

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
		
	if (!p_trace_uc_helper.jobPropertyExists("Start Address")) {
		applyCanFinish();
		configDialog.page.addWidget(label("                               ")); 
		configDialog.page.addWidget(label("                               "));
		configDialog.page.addWidget(label("                               ")); 
	    configDialog.page.addWidget(label("                               "));	
		advancedSettingButton(configDialog);	
		return configDialog;		
	}			
		
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

	configDialog.page.addWidget(label("                               ")); 
	configDialog.page.addWidget(label("                               "));
	configDialog.page.addWidget(label("                               ")); 
    configDialog.page.addWidget(label("                               "));

	advancedSettingButton(configDialog);

	return configDialog;
}

function applyTriggerProperties() {	
	applyTraceRange("Trace");
}

function cancelDialogProperties() {
	if(typeof cancelReceiverProperties != "undefined")
		cancelReceiverProperties();
	
	cancelTraceRange("Trace");
		
	setTriggerSectionEnabled( oldTriggerSectionEnabled );
}
