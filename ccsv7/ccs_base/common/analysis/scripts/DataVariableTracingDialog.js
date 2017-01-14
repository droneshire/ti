dvt_activity.include("../../scripts/DialogHelper.js");
dvt_activity.include("../../scripts/BasicDialog.js");
dvt_activity.include("../../scripts/Receiver.js")

dvt_activity.addPropertyMap("\
      p_Location=${variableAddress}\
");

var p_Location = null;
var oldLocation = null;

var triggerSectionWidget = null;
var triggerSectionEnabled = true;
var oldTriggerSectionEnabled = null;

var labelAddress;
var textBox;

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
	
 	// trick to expand the width of each the 5 columns to make the textbox appear wider  
	triggerSection.addWidget(label(" "));
 	triggerSection.addWidget(label("                                             "));  // this one affects the textbox width
 	triggerSection.addWidget(label(" "));
 	triggerSection.addWidget(label(" "));
 	triggerSection.addWidget(label("  "));

 	// Address location 
	if (p_Location == null || p_Location.equals("")) {
		// if the property were not restored, try to get a default value from the job 
		var values = p_trace_uc_helper.getJobProperty("Location");
		if (values != null && values.size() > 0)
			p_Location = values.get(0);
	}
	labelAddress = new ConfigLabel("Variable Address:");
	textBox = textbox("Location", p_Location);
	triggerSection.addWidget(labelAddress);	
 	triggerSection.addWidget(textBox);
 	oldLocation = p_Location;  	 	
	/*
	textBox.addRun(new IRun( {
        run: function() {
        	p_Location = textBox.getText();
        	textBox.setHighlight(p_Location == null || p_Location.equals(""));		
			applyCanFinish();
			configDialog.refresh();
		} 
      }
    ));
    */
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		p_Location = textBox.getText();
        	textBox.setHighlight(p_Location == null || p_Location.equals(""));		
		applyCanFinish();
		configDialog.refresh();
    	} 
}); 
textBox.addRun(new MyRunnable());
    	
	// Advanced button
	configDialog.page.addWidget(label("                               ")); 
	configDialog.page.addWidget(label("                               "));
	configDialog.page.addWidget(label("                               ")); 
    configDialog.page.addWidget(label("                               "));
    advancedSettingButton(configDialog);

	applyCanFinish();
	configDialog.refresh();

	return configDialog;
}

function applyTriggerProperties() {

	if (typeof p_Location != "undefined" && p_Location != null)	 
		p_trace_uc_helper.setJobProperty("Location", p_Location);
	else
		p_trace_uc_helper.applyDefaults("Location");	
}

function cancelDialogProperties() 
{
	if(typeof cancelReceiverProperties != "undefined")
		cancelReceiverProperties();
	
	p_Location = oldLocation;
	setTriggerSectionEnabled(oldTriggerSectionEnabled);
}
