var widgets = null;
var analysisFeaturesW = null;

function button(name) {
	if (widgets[name+"_button"] != null) return widgets[name+"_button"];	

	widgets[name+"_button"] = new ConfigButton(name);
	return widgets[name+"_button"];
}
function checkbox(name, defaultValue) {
	if (widgets[name+"_checkbox"] != null) return widgets[name+"_checkbox"];

	widgets[name+"_checkbox"] = new ConfigCheck(name);
	
	if (defaultValue == null) {
		var defaults = p_trace_uc_helper.applyDefaults(name);
		if (defaults != null && defaults.size() != 0) 
			defaultValue = java.lang.Boolean.valueOf(defaults.get(0)).booleanValue();
	}

	if (defaultValue == null)
		defaultValue = false;
			
	widgets[name+"_checkbox"].setCheck(defaultValue);	
	widgets[name+"_checkbox"].setToolTipText(p_trace_uc_helper.getDescription(name));
	
	//add runs
	widgets[name+"_checkboxRun"] = { 
		run: function() {
			defaultValue = widgets[name+"_checkbox"].getCheck();
			p_trace_uc_helper.setJobProperty(name, defaultValue);
		}
	};	
	//widgets[name+"_checkbox"].addRun(new IRun(widgets[name+"_checkboxRun"]));
var MyRunnable = Java.extend(Runnable, widgets[name+"_checkboxRun"] );
widgets[name+"_checkbox"].addRun(new MyRunnable());
		
	return widgets[name+"_checkbox"];
}

function dvt_checkbox(configUI, pValue) {
	if (widgets[configUI.getID()+"_checkbox_dvt"] != null) 
		return widgets[configUI.getID()+"_checkbox_dvt"];

	theValue = java.lang.Boolean.valueOf(configUI.getValue(pValue)).booleanValue();
			
	widgets[configUI.getID()+"_checkbox_dvt"] = new ConfigCheck(configUI.getLabel());	
	widgets[configUI.getID()+"_checkbox_dvt"].setCheck(theValue);
	widgets[configUI.getID()+"_checkbox_dvt"].setToolTipText(configUI.getTooltip());
	//todo
	widgets[configUI.getID()+"_ConfigUI"] = configUI;
	
	return widgets[configUI.getID()+"_checkbox_dvt"];	
}


function textbox(name, defaultValue) {
	if (widgets[name+"_textbox"] != null) return widgets[name+"_textbox"];
	
	widgets[name+"_textbox"] = new ConfigEdit();
	widgets[name+"_textbox"].setToolTipText(p_trace_uc_helper.getDescription(name));
	
	if (defaultValue == null) {
		var defaults = p_trace_uc_helper.applyDefaults(name);
		if (defaults != null && defaults.size() != 0)
			defaultValue = defaults.get(0);
		else {
			var values = p_trace_uc_helper.getJobProperty(name);
			if (values != null && values.size() > 0) {
				defaultValue = values.get(0);
			}
			else {
				widgets[name+"_textbox"].setHighlight(true);
				defaultValue = "";
			}
		}
	}
	widgets[name+"_textbox"].setText(defaultValue);
	
	widgets[name+"_textboxRun"] = {
		run: function() {
			defaultValue = widgets[name+"_textbox"].getText();
			p_trace_uc_helper.setJobProperty(name, defaultValue);
		}
	};	
	//widgets[name+"_textbox"].addRun(new IRun(widgets[name+"_textboxRun"]));		
var MyRunnable = Java.extend(Runnable, widgets[name+"_textboxRun"] );
widgets[name+"_textbox"].addRun(new MyRunnable());
	return widgets[name+"_textbox"];
}

function dvt_textbox(configUI) {
	if (widgets[configUI.getID()+"_textbox_dvt"] != null) return widgets[configUI.getID()+"_textbox_dvt"];
	
	widgets[configUI.getID()+"_textbox_dvt"] = new ConfigEdit(configUI.getID());
	widgets[configUI.getID()+"_textbox_dvt"].setToolTipText(configUI.getTooltip());
	
	var value = configUI.getValue(dvt_activity).toString();
	
	widgets[configUI.getID()+"_textbox_dvt"].setText(value);
	widgets[configUI.getID()+"_textbox_dvt"].setToolTipText(configUI.getTooltip());
	
	widgets[configUI.getID()+"_ConfigUI"] = configUI;

	/*
 	widgets[configUI.getID()+"_textbox_dvt"].addRun(new IRun( {
		run: function() {
			oldValue = pValue;
			pValue = widgets[configUI.getID()+"_checkbox_dvt"].getText();
			if (configUI != null)
				configUI.setValue(pValue);
		} 
	}));	
	*/
var MyRunnable = Java.extend(Runnable, {
    	run: function() { 
			oldValue = pValue;
			pValue = widgets[configUI.getID()+"_checkbox_dvt"].getText();
			if (configUI != null)
				configUI.setValue(pValue);
    	} 
}); 
widgets[configUI.getID()+"_textbox_dvt"].addRun(new MyRunnable());	
	return widgets[configUI.getID()+"_textbox_dvt"];	
}

function label(name) {
	if (widgets[name+"_label"] != null) return widgets[name+"_label"];
		
	widgets[name+"_label"] = new ConfigLabel(name);
	return widgets[name+"_label"];
}


function dvt_checkbox(configUI, pValue) {
	if (widgets[configUI.getID()+"_checkbox_dvt"] != null) 
		return widgets[configUI.getID()+"_checkbox_dvt"];

	theValue = java.lang.Boolean.valueOf(configUI.getValue(pValue)).booleanValue();
			
	widgets[configUI.getID()+"_checkbox_dvt"] = new ConfigCheck(configUI.getLabel());	
	widgets[configUI.getID()+"_checkbox_dvt"].setCheck(theValue);
	widgets[configUI.getID()+"_checkbox_dvt"].setToolTipText(configUI.getTooltip());
	//todo
	widgets[configUI.getID()+"_ConfigUI"] = configUI;
	
	return widgets[configUI.getID()+"_checkbox_dvt"];	
}


function dvt_combobox(configUI, pValue) {
	if (widgets[configUI.getID()+"_combobox_dvt"] != null) return widgets[configUI.getID()+"_combobox_dvt"];
	
	theValue = configUI.getValue(pValue);

	widgets[configUI.getID()+"_combobox_dvt"] = new ConfigCombo();
	var options = configUI.getOptions();
	var c=0;
	var selectionIndex = 0;
	for (c=0; c<options.size(); c++) {
		if (options.get(c).equals(theValue)) 
			selectionIndex = c;
		widgets[configUI.getID()+"_combobox_dvt"].add(options.get(c));
	}	
	widgets[configUI.getID()+"_combobox_dvt"].setSelection(selectionIndex);	
	widgets[configUI.getID()+"_combobox_dvt"].setToolTipText(configUI.getTooltip());
	
	//add runs
/*	
	widgets[configUI.getID()+"_comboboxRun"] = { 
		run: function() {
			var items = widgets[configUI.getID()+"_combobox_dvt"].getItems();
			if (!widgets[configUI.getID()+"_combobox_dvt"].getEdit()) {
				defaultValue = items.get(widgets[configUI.getID()+"_combobox_dvt"].getSelection()).getText();
			}
			else {
				defaultValue = widgets[configUI.getID()+"_combobox_dvt"].getText();
				var listSize = items.size();
				var match = false;
				for (var it=0; it<listSize; it++) {
					if (items.get(it).getText().equals(defaultValue)) {
						match = true;
						break;
					} 
				}
				if (!match) { 
					widgets[configUI.getID()+"_combobox_dvt"].add(defaultValue);
				}
			}
			configUI.setValue(defaultValue);
		}
	};
	widgets[configUI.getID()+"_combobox_dvt"].addRun(new IRun(widgets[configUI.getID()+"_comboboxRun"]));
*/	
	
	widgets[configUI.getID()+"_ConfigUI"] = configUI;	
		
	return widgets[configUI.getID()+"_combobox_dvt"];
}

function combobox(name, defaultValue) {
	if (widgets[name+"_combobox"] != null) return widgets[name+"_combobox"];

	widgets[name+"_combobox"] = new ConfigCombo();
	var options = p_trace_uc_helper.getOptions(name);
	var size = options.size();
	if (defaultValue == null && options.size()>0) {
		var defaults = p_trace_uc_helper.applyDefaults(name);
		if (defaults != null && defaults.size() != 0) {
			defaultValue = defaults.get(0);
		}
		else {
			if (!options.get(size-1).equals("EOL")) 
				defaultValue = options.get(size-1);
		}
	}
	var c=0;
	var selectionIndex = 0;
	var eol = 2;
	if ( options.get(size-1).equals("EOL") )
		eol = 1;
	for (var c=0; c<size - eol; c++) {
		if (options.get(c).equals(defaultValue)) 
			selectionIndex = c;
		widgets[name+"_combobox"].add(options.get(c));
	}
	
	widgets[name+"_combobox"].setSelection(selectionIndex);	
	widgets[name+"_combobox"].setToolTipText(p_trace_uc_helper.getDescription(name));
	
	//add runs
	widgets[name+"_comboboxRun"] = { 
		run: function() {
			var items = widgets[name+"_combobox"].getItems();
			if (!widgets[name+"_combobox"].getEdit()) {
				defaultValue = items.get(widgets[name+"_combobox"].getSelection()).getText();
			}
			else {
				defaultValue = widgets[name+"_combobox"].getText();
				var listSize = items.size();
				var match = false;
				for (var it=0; it<listSize; it++) {
					if (items.get(it).getText().equals(defaultValue)) {
						match = true;
						break;
					} 
				}
				if (!match) { 
					widgets[name+"_combobox"].add(defaultValue);
				}
			}
			p_trace_uc_helper.setJobProperty(name, defaultValue);
		}
	};	
	//widgets[name+"_combobox"].addRun(new IRun(widgets[name+"_comboboxRun"]));
var MyRunnable = Java.extend(Runnable, widgets[name+"_comboboxRun"] );
widgets[name+"_combobox"].addRun(new MyRunnable());
		
	return widgets[name+"_combobox"];
}

function runDSScript(scriptFileName) {
	dvt_activity.runScript(scriptFileName);
}

function advancedSettings() {
	var cpu_chosen;
	if (uc_state == "Initialization") {
		cpu_chosen = 0;
	}
	else {
		cpu_chosen = dvt_activity_instance;
	}

	p_trace_uc_helper.traceMsg("launchAdvanceDialog() " + cpu_chosen );
	var property = new ConfigProperty("Advanced Properties");
	var bkpt_list = p_trace_uc_helper.getBkptList( p_CPUs[cpu_chosen] );
	property.setTraceInfos( bkpt_list );
	property.setCPUName(p_CPUs[cpu_chosen]);
	property.setHelperInstance(p_trace_uc_helper);
    property.execute();
	
	if (property.getFinished()){
		var done = helperSetJobs( p_CPUs[cpu_chosen], property.getTraceInfos(), uc_state );
		if ( (uc_state == "Initialization")&&(done == true) ) {
			//Need to set the property to the entire list		
			p_trace_uc_helper.traceMsg("replicate Jobs to other Cores");	
			for(i=0;i<p_CPUs.length;i++){
				if(i != cpu_chosen){
					helperCreateJobs( p_CPUs[i], property.getTraceInfos(), uc_state );
				}
			}
		}
		
		if (typeof setTriggerSectionEnabled != "undefined") 
			setTriggerSectionEnabled(false);
		//if (typeof setReceiverSectionEnabled != "undefined") 
		//	setReceiverSectionEnabled(false);
		
		refreshReceiver();
		configDialog.dialog.setCanFinish(true);
		
	} 
	else{
	}
	configDialog.refresh();
}

function advancedSettingButton(configDialog) {
	var advancedButton = new ConfigButton("Advanced Settings");
	//advancedButton.addRun(new IRun({ run: advancedSettings }));	
var MyRunnable = Java.extend(Runnable, {
    	run: advancedSettings
}); 
advancedButton.addRun(new MyRunnable());
	configDialog.page.addWidget(advancedButton);
}

function applyCanFinish() {
	var canFinish = true;
	for (var key in widgets) {
	    if (!widgets.hasOwnProperty(key)) 
	    	continue;
        if (key.indexOf("Run") !== -1) 
        	continue;
        if (key.indexOf("ConfigUI") !== -1)
        	continue;  
        if (widgets[key].getEnabled())      
        	canFinish = canFinish && (!widgets[key].getHighlight());
        if (!canFinish)
        	break;
	}
	configDialog.dialog.setCanFinish(canFinish);
}

var analysisSectionWidget = null;
var analysisSectionWidget0 = null;
var analysisSectionEnabled = true;
var oldAnalysisSectionEnabled = null;

function setAnalysisSectionEnabled(sectionEnabled) {
	if (analysisSectionWidget == null) 
		return;
	
	analysisSectionEnabled = sectionEnabled;
	analysisSectionWidget.setExpanded(analysisSectionEnabled);
	analysisSectionWidget.setEnabled(analysisSectionEnabled);
	
	configDialog.refresh();
}

function createAnalysisSection() {
	analysisSectionWidget = new ConfigSection("Analysis Settings");
	analysisSectionWidget.setSpanAllColumns(true);
	analysisSectionWidget.setExpanding(true);
	oldAnalysisSectionEnabled = analysisSectionEnabled;
	analysisSectionWidget.setEnabled(analysisSectionEnabled);
	analysisSectionWidget.setExpanded(analysisSectionEnabled);	

	configDialog.page.addWidget(analysisSectionWidget);	
	analysisSectionWidget0 = new ConfigSection();
	analysisSectionWidget0.setNumColumns(5);	
	analysisSectionWidget.addWidget(analysisSectionWidget0);
}

function analysisSection() {
	if (analysisSectionWidget0 != null) return analysisSectionWidget0;	
	createAnalysisSection();	
	return analysisSectionWidget0;
}	
