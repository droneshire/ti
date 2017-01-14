dvt_activity.include("../../scripts/DialogHelper.js");
dvt_activity.include("../../scripts/BasicDialog.js");
dvt_activity.include("../../scripts/Receiver.js");


dvt_activity.addPropertyMap("\
      p_Accesstype = ${transactionFilter}\
");

var p_AccessType = null;
var oldAccessType = null;

var triggerSectionWidget = null;
var triggerSectionEnabled = true;
var oldTriggerSectionEnabled = null;

function setTriggerSectionEnabled(tSectionEnabled) {
	if (triggerSectionWidget == null) 
		return;
	
	triggerSectionEnabled = tSectionEnabled
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
        
        
	triggerSection.addWidget(label("Transaction Filter:"));    
    triggerSection.addWidget(combobox("Access Type", p_AccessType));

    p_AccessType = combobox("Access Type").getItems().get(combobox("Access Type").getSelection()).getText();
    oldAccessType = p_AccessType;
        
    /*
	combobox("Access Type").addRun(new IRun({
	    run: function() { 
	    	if (combobox("Access Type").getItems().size() > 0)
	    		p_AccessType = combobox("Access Type").getItems().get(combobox("Access Type").getSelection()).getText();
		} 
      }
    ));
    */
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		if (combobox("Access Type").getItems().size() > 0)
	    		p_AccessType = combobox("Access Type").getItems().get(combobox("Access Type").getSelection()).getText();
    	} 
}); 
combobox("Access Type").addRun(new MyRunnable());
    
    triggerSection.addWidget(label("                                   ")); 
    triggerSection.addWidget(label("                                   "));    
    triggerSection.addWidget(label("                                   "));    
    
    configDialog.page.addWidget(label("                                       ")); 
    configDialog.page.addWidget(label("                                       ")); 
    configDialog.page.addWidget(label("                                       ")); 
    configDialog.page.addWidget(label("                                       ")); 
	
	advancedSettingButton(configDialog);
	
	//temporary
	return configDialog;
}

function applyTriggerProperties() {
	if (typeof p_AccessType != "undefined" && p_AccessType != null)	 
		p_trace_uc_helper.setJobProperty("Access Type", p_AccessType);
	else
		p_trace_uc_helper.applyDefaults("Access Type");	
}

function cancelDialogProperties() {
	if(typeof cancelReceiverProperties != "undefined")
		cancelReceiverProperties();
	
	p_AccessType = oldAccessType;
	setTriggerSectionEnabled( oldTriggerSectionEnabled );
}
