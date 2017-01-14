// inlcuding CoreTrace.js would have been ideal but somehow overwriting of the function configDialogFn() messes things up and 
// 'config.execute();' in CoreTrace.js fails with complaint about config being 'undefined'
// dvt_activity.include("../../scripts/CoreTraceDialog.js");
// load("../../scripts/CoreTraceDialog.js"); // did not recognize load()
// this included it but had the same problem as dvt_activity.include():
//    eval(''+new String(org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader('C:/GForgeSVN/dvt/branches/ccstudio5.5/dvt_resources/platform/AnalysisLibrary/analysis/scripts/CoreTraceDialog.js'))));

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<< copy of CoreTraceDialog.js >>>>>>>>>>>>>>>>>>>>>>>>>>>>
// with 3 MODIFCATIONS as annotated below

dvt_activity.include("../../scripts/DialogHelper.js");
dvt_activity.include("../../scripts/BasicDialog.js");
dvt_activity.include("../../scripts/Receiver.js")

dvt_activity.addPropertyMap("p_Trace = ${traceRange},p_StartAddress	= ${startAddress},p_Merge = ${merging},p_ColorLines= ${highlightSource},p_ShowLibraries= ${showTheLibraries},p_OptimizedCode = ${optimizedTheCode},p_EndAddress	= ${endAddress}");

var p_Trace=null;
var oldTrace = null;
var p_StartAddress=null;
var oldStartAddress = null;
var p_EndAddress=null;
var oldEndAddress = null;

var triggerSectionWidget = null;
var triggerSectionEnabled = true;
var oldTriggerSectionEnabled = null;

var oldMerging = false;
var oldColoring = false;
var oldShowLibraries = false;
var oldOptimizedCode = false;

function setTriggerSectionEnabled(tSectionEnabled) {
	if (triggerSectionWidget == null) 
		return;
	
	triggerSectionEnabled = tSectionEnabled;
	triggerSectionWidget.setExpanded(triggerSectionEnabled);
	triggerSectionWidget.setEnabled(triggerSectionEnabled);
	
	configDialog.refresh();
}

var configDialog;
function coreTraceDialog() { // MODIFCATION 1: rename from configDialogFn() {
	
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

	triggerSection.addWidget(label("Trace Range:"));
	triggerSection.addWidget(combobox("Trace", p_Trace));
	if (combobox("Trace").getItems().size() > 0)
		p_Trace = combobox("Trace").getItems().get(combobox("Trace").getSelection()).getText();
	else
		p_Trace = "All";
	
	oldTrace = p_Trace;
 	triggerSection.addWidget(label("     "));
 	triggerSection.addWidget(label("                               "));
 	triggerSection.addWidget(label("                               "));
 	
 	triggerSection.addWidget(label("Start Address:"));
 	triggerSection.addWidget(textbox("Start Address", p_StartAddress));
 	p_StartAddress = textbox("Start Address").getText();
 	oldStartAddress = p_StartAddress;  	
 	
 	triggerSection.addWidget(label("     "));
 	triggerSection.addWidget(label("End Address:"));
	triggerSection.addWidget(textbox("End Address", p_EndAddress));
 	p_EndAddress = textbox("End Address").getText();
 	oldEndAddress = p_EndAddress; 	 	

	if (p_Trace.equals("All")) {
		label("Start Address:").setEnabled(false);
		textbox("Start Address").setEnabled(false);
		label("End Address:").setEnabled(false);
		textbox("End Address").setEnabled(false);        		        	
	}	
	else if (p_Trace.equals("Range") || p_Trace.equals("Start and Stop at Addresses")) {
		label("Start Address:").setEnabled(true);
		textbox("Start Address").setEnabled(true);
		label("End Address:").setEnabled(true);
		textbox("End Address").setEnabled(true);        		        	
	}
	else if (p_Trace.equals("Range")) {
		label("Start Address:").setEnabled(true);
		textbox("Start Address").setEnabled(true);
		label("End Address:").setEnabled(true);
		textbox("End Address").setEnabled(true);        		        	
	}
	else if (p_Trace.equals("Start at Address")) {
		label("Start Address:").setEnabled(true);
		textbox("Start Address").setEnabled(true);
		label("End Address:").setEnabled(false);
		textbox("End Address").setEnabled(false);        		        	
	}
	else if (p_Trace.equals("End at Address")) {
		label("Start Address:").setEnabled(false);
		textbox("Start Address").setEnabled(false);
		label("End Address:").setEnabled(true);
		textbox("End Address").setEnabled(true);        		        	
	}        	
	else {
		label("Start Address:").setEnabled(false);
		textbox("Start Address").setEnabled(false);
		label("End Address:").setEnabled(false);
		textbox("End Address").setEnabled(false);        		
	}

	textbox("Start Address").setHighlight(textbox("Start Address").getEnabled() && (p_StartAddress == null || p_StartAddress.equals("")));		
	/*
 	textbox("Start Address").addRun(new IRun({
        run: function() {
        	p_StartAddress = textbox("Start Address").getText();
			textbox("Start Address").setHighlight(textbox("Start Address").getEnabled() && (p_StartAddress == null || p_StartAddress.equals("")));
			applyCanFinish();
			configDialog.refresh();
			        	
		} 
      }
    ));
    */
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		p_StartAddress = textbox("Start Address").getText();
		textbox("Start Address").setHighlight(textbox("Start Address").getEnabled() && (p_StartAddress == null || p_StartAddress.equals("")));
		applyCanFinish();
		configDialog.refresh();
    	} 
}); 
textbox("Start Address").addRun(new MyRunnable());

    			
	textbox("End Address").setHighlight(textbox("End Address").getEnabled() && (p_EndAddress == null || p_EndAddress.equals("")));
	/*
 	textbox("End Address").addRun(new IRun({
        run: function() {
        	p_EndAddress = textbox("End Address").getText();        	
			textbox("End Address").setHighlight(textbox("End Address").getEnabled() && (p_EndAddress == null || p_EndAddress.equals("")));
			applyCanFinish();
			configDialog.refresh();         	
		} 
      }
    ));
    */
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		p_EndAddress = textbox("End Address").getText();        	
		textbox("End Address").setHighlight(textbox("End Address").getEnabled() && (p_EndAddress == null || p_EndAddress.equals("")));
		applyCanFinish();
		configDialog.refresh();
    	} 
}); 
textbox("End Address").addRun(new MyRunnable());  	
	applyCanFinish();


	/*	
	combobox("Trace").addRun(new IRun({
        run: function() { 
        	if (combobox("Trace").getItems().size() > 0)
        		p_Trace = combobox("Trace").getItems().get(combobox("Trace").getSelection()).getText();
        	else
        		p_Trace = "All";
        	
        		
			values = p_trace_uc_helper.getJobProperty("Start Address");
			if (values != null && values.size() > 0) {
				p_StartAddress = values.get(0);
				textbox("Start Address").setText(p_StartAddress);
			}
			values = p_trace_uc_helper.getJobProperty("End Address");
			if (values != null && values.size() > 0) {
				p_EndAddress = values.get(0);
				textbox("End Address").setText(p_EndAddress);
			}        		
			
        	
        	if (p_Trace.equals("Range") || p_Trace.equals("Start and Stop at Addresses")) {
        		label("Start Address:").setEnabled(true);
        		textbox("Start Address").setEnabled(true);
        		label("End Address:").setEnabled(true);
        		textbox("End Address").setEnabled(true)
        		
//        		textbox("Start Address").setHighlight(true);        		        	
//        		textbox("End Address").setHighlight(true);        		
        	}
        	else if (p_Trace.equals("Start at Address")) {
        		label("Start Address:").setEnabled(true);
        		textbox("Start Address").setEnabled(true);
        		label("End Address:").setEnabled(false);
        		textbox("End Address").setEnabled(false);
        		
//        		textbox("Start Address").setHighlight(true);        		        	
//        		textbox("End Address").setHighlight(false);        		
        	}
        	else if (p_Trace.equals("End at Address")) {
        		label("Start Address:").setEnabled(false);
        		textbox("Start Address").setEnabled(false);
        		label("End Address:").setEnabled(true);
        		textbox("End Address").setEnabled(true);
        		
//        		textbox("Start Address").setHighlight(false);        		        	
//        		textbox("End Address").setHighlight(true);        		
        	}        	
        	else {
        		label("Start Address:").setEnabled(false);
        		textbox("Start Address").setEnabled(false);
        		label("End Address:").setEnabled(false);
        		textbox("End Address").setEnabled(false);
        		
//        		textbox("Start Address").setHighlight(false);        		        	
//        		textbox("End Address").setHighlight(false);        		
        	}
        	applyCanFinish();
        	configDialog.refresh();
		} 
      }
    ));
*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		if (combobox("Trace").getItems().size() > 0)
        		p_Trace = combobox("Trace").getItems().get(combobox("Trace").getSelection()).getText();
        	else
        		p_Trace = "All";
        	
        		
			values = p_trace_uc_helper.getJobProperty("Start Address");
			if (values != null && values.size() > 0) {
				p_StartAddress = values.get(0);
				textbox("Start Address").setText(p_StartAddress);
			}
			values = p_trace_uc_helper.getJobProperty("End Address");
			if (values != null && values.size() > 0) {
				p_EndAddress = values.get(0);
				textbox("End Address").setText(p_EndAddress);
			}        		
			
        	
        	if (p_Trace.equals("Range") || p_Trace.equals("Start and Stop at Addresses")) {
        		label("Start Address:").setEnabled(true);
        		textbox("Start Address").setEnabled(true);
        		label("End Address:").setEnabled(true);
        		textbox("End Address").setEnabled(true)
        		
//        		textbox("Start Address").setHighlight(true);        		        	
//        		textbox("End Address").setHighlight(true);        		
        	}
        	else if (p_Trace.equals("Start at Address")) {
        		label("Start Address:").setEnabled(true);
        		textbox("Start Address").setEnabled(true);
        		label("End Address:").setEnabled(false);
        		textbox("End Address").setEnabled(false);
        		
//        		textbox("Start Address").setHighlight(true);        		        	
//        		textbox("End Address").setHighlight(false);        		
        	}
        	else if (p_Trace.equals("End at Address")) {
        		label("Start Address:").setEnabled(false);
        		textbox("Start Address").setEnabled(false);
        		label("End Address:").setEnabled(true);
        		textbox("End Address").setEnabled(true);
        		
//        		textbox("Start Address").setHighlight(false);        		        	
//        		textbox("End Address").setHighlight(true);        		
        	}        	
        	else {
        		label("Start Address:").setEnabled(false);
        		textbox("Start Address").setEnabled(false);
        		label("End Address:").setEnabled(false);
        		textbox("End Address").setEnabled(false);
        		
//        		textbox("Start Address").setHighlight(false);        		        	
//        		textbox("End Address").setHighlight(false);        		
        	}
        	applyCanFinish();
        	configDialog.refresh();
    	} 
}); 
combobox("Trace").addRun(new MyRunnable());
    
    
	values = p_trace_uc_helper.getJobProperty("Start Address");
	if (values != null && values.size() > 0) {
		p_StartAddress = values.get(0);
		textbox("Start Address").setText(p_StartAddress);
	}
	values = p_trace_uc_helper.getJobProperty("End Address");
	if (values != null && values.size() > 0) {
		p_EndAddress = values.get(0);
		textbox("End Address").setText(p_EndAddress);
	} 
	   
    	
// MODIFCATION 2: remove the Advanced button from here
//	configDialog.page.addWidget(label("                               ")); 
//	configDialog.page.addWidget(label("                               "));
//	configDialog.page.addWidget(label("                               ")); 
//    configDialog.page.addWidget(label("                               "));
//
//	advancedSettingButton(configDialog);

	return configDialog;
}


function applyTriggerProperties() {
	if (typeof p_Trace != "undefined" && p_Trace != null)	 
		p_trace_uc_helper.setJobProperty("Trace", p_Trace);
	else
		p_trace_uc_helper.applyDefaults("Trace");

	if (typeof p_StartAddress != "undefined" && p_StartAddress != null)	 
		p_trace_uc_helper.setJobProperty("Start Address", p_StartAddress);
	else
		p_trace_uc_helper.applyDefaults("Start Address");
	
	if (typeof p_EndAddress != "undefined" && p_EndAddress != null)	 
		p_trace_uc_helper.setJobProperty("End Address", p_EndAddress);
	else
		p_trace_uc_helper.applyDefaults("End Address");	
}

function cancelTriggerProperties() { // MODIFICATION 3: rennamed from cancelDialogProperties()
	if(typeof cancelReceiverProperties != "undefined")
		cancelReceiverProperties();
	
	p_Trace=oldTrace;
	p_StartAddress=oldStartAddress;
	p_EndAddress=oldEndAddress;

	setTriggerSectionEnabled( oldTriggerSectionEnabled );
}
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<< END of copy of CoreTraceDialog.js >>>>>>>>>>>>>>>>>>>>>>>>>>>>

var p_Merge = null;
var p_ColorLines = null;
var p_ShowLibraries = null;
var p_OptimizedCode = null;

var checkBoxMerging;
var checkBoxColoring;

var configDialog = null;


function configDialogFn() {
	
	p_trace_uc_helper.traceMsg("CodeCoverageDialog: configDialogFn() " + dvt_activity_instance);

	// create the receiver and trigger settings sections
	coreTraceDialog();

	createAnalysisSection();
	
 	// Merging
 	analysisSection().addWidget(dvt_checkbox(dvt_config_merge, p_Merge)); 
	oldMerging = p_Merge;
	/*
	dvt_checkbox(dvt_config_merge).addRun(new IRun( {
		run: function() {
			oldMerging = p_Merge;
			p_Merge = dvt_checkbox(dvt_config_merge).getCheck();
			if (dvt_config_merge != null)
				dvt_config_merge.setValue(p_Merge);			
		} 
	})); 	
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		oldMerging = p_Merge;
		p_Merge = dvt_checkbox(dvt_config_merge).getCheck();
		if (dvt_config_merge != null)
			dvt_config_merge.setValue(p_Merge);
    	} 
}); 
dvt_checkbox(dvt_config_merge).addRun(new MyRunnable());
 	  	
	analysisSection().addWidget(label(" ")); 
	analysisSection().addWidget(label(" ")); 
	analysisSection().addWidget(label(" ")); 
	analysisSection().addWidget(label(" ")); 

    // Source code highlighting
 	analysisSection().addWidget(dvt_checkbox(dvt_config_colorLines, p_ColorLines)); 
	oldColoring = p_ColorLines;
	/*
	dvt_checkbox(dvt_config_colorLines).addRun(new IRun( {
		run: function() {
			oldColoring = p_ColorLines;
			p_ColorLines = dvt_checkbox(dvt_config_colorLines).getCheck();
			if (dvt_config_colorLines != null)
				dvt_config_colorLines.setValue(p_ColorLines);			
		} 
	})); 
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		oldColoring = p_ColorLines;
		p_ColorLines = dvt_checkbox(dvt_config_colorLines).getCheck();
		if (dvt_config_colorLines != null)
			dvt_config_colorLines.setValue(p_ColorLines);
    	} 
}); 
dvt_checkbox(dvt_config_colorLines).addRun(new MyRunnable());
	    
	analysisSection().addWidget(label(" ")); 
	analysisSection().addWidget(label(" ")); 
	analysisSection().addWidget(label(" ")); 
	analysisSection().addWidget(label(" ")); 


 	// ShowLibraries
 	
 	analysisSection().addWidget(dvt_checkbox(dvt_config_showLibraries, p_ShowLibraries)); 
	oldShowLibraries = p_ShowLibraries;
	/*
	dvt_checkbox(dvt_config_showLibraries).addRun(new IRun( {
		run: function() {
			oldShowLibraries = p_ShowLibraries;
			p_ShowLibraries = dvt_checkbox(dvt_config_showLibraries).getCheck();
			if (dvt_config_showLibraries != null)
				dvt_config_showLibraries.setValue(p_ShowLibraries);			
		} 
	})); 
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		oldShowLibraries = p_ShowLibraries;
		p_ShowLibraries = dvt_checkbox(dvt_config_showLibraries).getCheck();
		if (dvt_config_showLibraries != null)
			dvt_config_showLibraries.setValue(p_ShowLibraries);
    	} 
}); 
dvt_checkbox(dvt_config_showLibraries).addRun(new MyRunnable());
	 	
	analysisSection().addWidget(label(" ")); 
	analysisSection().addWidget(label(" ")); 
	analysisSection().addWidget(label(" ")); 
	analysisSection().addWidget(label(" ")); 

 	// OptimizedCode
// 	analysisSection().addWidget(dvt_checkbox(dvt_config_optimizedCode, p_OptimizedCode, oldOptimizedCode));	

 	analysisSection().addWidget(dvt_checkbox(dvt_config_optimizedCode, p_OptimizedCode)); 
	oldOptimizedCode = p_OptimizedCode;
	/*
	dvt_checkbox(dvt_config_optimizedCode).addRun(new IRun( {
		run: function() {
			oldOptimizedCode = p_OptimizedCode;
			p_OptimizedCode = dvt_checkbox(dvt_config_optimizedCode).getCheck();
			if (dvt_config_optimizedCode != null)
				dvt_config_optimizedCode.setValue(p_OptimizedCode);			
		} 
	}));
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		oldOptimizedCode = p_OptimizedCode;
		p_OptimizedCode = dvt_checkbox(dvt_config_optimizedCode).getCheck();
		if (dvt_config_optimizedCode != null)
			dvt_config_optimizedCode.setValue(p_OptimizedCode);
    	} 
}); 
dvt_checkbox(dvt_config_optimizedCode).addRun(new MyRunnable());
 
	configDialog.page.addWidget(label("                               "));
	configDialog.page.addWidget(label("                               ")); 
    configDialog.page.addWidget(label("                               "));
    configDialog.page.addWidget(label("                               "));



	advancedSettingButton(configDialog);

	applyCanFinish();
	configDialog.refresh();
	
	dvt_config_useCaseDialogShown.setValue(true);
	
	return configDialog;
}

function applyAnalysisProperties() {
	if (dvt_config_merge != null)
		dvt_config_merge.setValue(p_Merge);			
	if (dvt_config_colorLines != null)
		dvt_config_colorLines.setValue(p_ColorLines);	
	if (dvt_config_showLibraries != null)
		dvt_config_showLibraries.setValue(p_ShowLibraries);
	if (dvt_config_optimizedCode != null)
		dvt_config_optimizedCode.setValue(p_OptimizedCode);	
}

function cleanupOnCancelAFs() {
	p_merge = false;
	p_ColorLines = false;
	p_ShowLibraries = false;
	p_OptimizedCode = false;
	oldMerging = null;
	oldColoring = null;
	oldOptimizedCode = null;
	oldShowLibraries = null;
	dvt_config_merge.setValue(p_Merge);			
	dvt_config_colorLines.setValue(p_ColorLines);	
	dvt_config_showLibraries.setValue(p_ShowLibraries);
	dvt_config_optimizedCode.setValue(p_OptimizedCode);	
	dvt_config_useCaseDialogShown.setValue(false);
}

//<<< OPS, 6/6/2013: TODO
function cancelDialogProperties() 
{
	// cancel trigger and receiver properties
	cancelTriggerProperties();
	
	p_Merge = oldMerging;
	p_ColorLines = oldColoring;
	p_OptimizedCode = oldOptimizedCode;
	p_ShowLibraries = oldShowLibraries;
	setAnalysisSectionEnabled(oldAnalysisSectionEnabled);
}
// >>>
