dvt_activity.include("../../scripts/DialogHelper.js");
dvt_activity.include("../../scripts/BasicDialog.js");
dvt_activity.include("../../scripts/Receiver.js")

var trace=null;

var triggerSectionWidget = null;
function setTriggerSectionEnabled(triggerSectionEnabled) {
	if (triggerSectionWidget == null) return;
	
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
	
	
	configDialog.page.addWidget(label("                               ")); 
	configDialog.page.addWidget(label("                               "));
	configDialog.page.addWidget(label("                               ")); 
    configDialog.page.addWidget(label("                               "));

	advancedSettingButton(configDialog);

	return configDialog;
}


// for scripting
function setTrace(value) {
	p_trace_uc_helper.setJobProperty("Trace", value); 
	trace = value;
}

function cancelDialogProperties() {
	if(typeof cancelReceiverProperties != "undefined")
		cancelReceiverProperties();
}
