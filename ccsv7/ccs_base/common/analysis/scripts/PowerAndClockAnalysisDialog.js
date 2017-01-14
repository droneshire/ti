dvt_activity.include("../../scripts/DialogHelper.js");
dvt_activity.include("../../scripts/BasicDialog.js");
dvt_activity.include("../../scripts/Receiver.js");

function configDialogFn() {
	p_trace_uc_helper.traceMsg("launchDialog()");
	configDialog = trace_usecase_launch_dialog();
	
    if(typeof basicDialog != "undefined") {
    	basicDialog(configDialog);
    }

	if(typeof receiverProperties != "undefined") {
    	receiverProperties(configDialog);
    }
    
	advancedSettingButton(configDialog);
    
	return configDialog;
}

function cancelDialogProperties() {
	if(typeof cancelReceiverProperties != "undefined")
		cancelReceiverProperties();
}
