dvt_activity.include("../../scripts/DialogHelper.js");
dvt_activity.include("../../scripts/BasicDialog.js");
dvt_activity.include("../../scripts/Receiver.js")

dvt_activity.addPropertyMap("\
      p_SamplingInterval=${samplingInterval}\
");

var p_SamplingInterval=null;
var oldSamplingInterval = null;

var triggerSectionWidget = null;
var triggerSectionEnabled = true;
var oldTriggerSectionEnabled = null;

var labelInterval;
var textBox;	// for DSP only
var labelCycles;
var comboBox;	// for ITM/SWO only

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
	
	labelInterval = new ConfigLabel("Sampling Interval: ");
	triggerSection.addWidget(labelInterval);	

	// Sampling Interval for DSP
	if (p_Receiver.equals("SWO Trace") == false) {
		if (p_SamplingInterval == null || p_SamplingInterval.equals("")) {
			// if the property were not restored, try to get a default value from the job 
			var values = p_trace_uc_helper.getJobProperty("SamplingPeriodCycles");
			if (values != null && values.size() > 0)
				p_SamplingInterval = values.get(0);
		}
		textBox = textbox("SamplingPeriodCycles", p_SamplingInterval);
		triggerSection.addWidget(textBox);
		oldSamplingInterval = p_SamplingInterval;  	 	
		/*
		textBox.addRun(new IRun( {
			run: function() {
				p_SamplingInterval = textBox.getText();
				textBox.setHighlight(p_SamplingInterval == null || p_SamplingInterval.equals(""));		
				applyCanFinish();
				configDialog.refresh();
			} 
		}
		));
		*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		p_SamplingInterval = textBox.getText();
		textBox.setHighlight(p_SamplingInterval == null || p_SamplingInterval.equals(""));		
		applyCanFinish();
		configDialog.refresh();
    	} 
}); 
textBox.addRun(new MyRunnable());

	}

	// Sampling Interval for ITM/SWO
	if (p_Receiver.equals("SWO Trace") == true) {
		comboBox = combobox("Sampling Interval SWO", p_SamplingInterval);
		triggerSection.addWidget(comboBox);
		if (comboBox.getEnabled() &&  comboBox.getItems().size() > 0)	
			p_SamplingInterval = comboBox.getItems().get(comboBox.getSelection()).getText();
		oldsamplingInterval = p_SamplingInterval;
		/*
		comboBox.addRun(new IRun( { 
			run: function() {
				if (comboBox.getItems().size()>0) 
					p_SamplingInterval = comboBox.getItems().get(comboBox.getSelection()).getText();
			} 
		}
		));
		*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		if (comboBox.getItems().size()>0) 
					p_SamplingInterval = comboBox.getItems().get(comboBox.getSelection()).getText();
    	} 
}); 
comboBox.addRun(new MyRunnable());
	}

	labelCycles = new ConfigLabel("Cycles");
 	triggerSection.addWidget(labelCycles);
	
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

	if (p_Receiver.equals("SWO Trace")) {
		if (typeof p_SamplingInterval != "undefined" && p_SamplingInterval != null)	 
			p_trace_uc_helper.setJobProperty("Sampling Interval SWO", p_SamplingInterval);
		else
			p_trace_uc_helper.applyDefaults("Sampling Interval SWO");
	} else {
		if (typeof p_SamplingInterval != "undefined" && p_SamplingInterval != null)	 
			p_trace_uc_helper.setJobProperty("SamplingPeriodCycles", p_SamplingInterval);
		else
			p_trace_uc_helper.applyDefaults("SamplingPeriodCycles");
	}
}

function cancelDialogProperties() 
{
	if(typeof cancelReceiverProperties != "undefined")
		cancelReceiverProperties();
	
	p_SamplingInterval = oldSamplingInterval
	setTriggerSectionEnabled(oldTriggerSectionEnabled);
}
