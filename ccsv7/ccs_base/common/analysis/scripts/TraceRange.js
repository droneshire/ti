var p_Trace=null;
var oldTrace = null;
var p_StartAddress=null;
var oldStartAddress = null;
var p_EndAddress=null;
var oldEndAddress = null;

dvt_activity.addPropertyMap("\
      p_Trace		= ${traceRange},\
      p_StartAddress	= ${startAddress},\
      p_EndAddress	= ${endAddress}\
");

function addTraceRange(triggerSection, traceRangeComboName) {
	triggerSection.addWidget(label("Trace Range:"));
	triggerSection.addWidget(combobox(traceRangeComboName, p_Trace));
	if (combobox(traceRangeComboName).getItems().size() > 0)
		p_Trace = combobox(traceRangeComboName).getItems().get(combobox(traceRangeComboName).getSelection()).getText();
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
	combobox(traceRangeComboName).addRun(new IRun({
        run: function() { 
        	if (combobox(traceRangeComboName).getItems().size() > 0)
        		p_Trace = combobox(traceRangeComboName).getItems().get(combobox(traceRangeComboName).getSelection()).getText();
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
		if (combobox(traceRangeComboName).getItems().size() > 0)
        		p_Trace = combobox(traceRangeComboName).getItems().get(combobox(traceRangeComboName).getSelection()).getText();
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
combobox(traceRangeComboName).addRun(new MyRunnable());

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
}

function applyTraceRange(traceRangeComboName) {
	if (!p_trace_uc_helper.jobPropertyExists("Start Address")) return;

	if (typeof p_Trace != "undefined" && p_Trace != null)	 
		p_trace_uc_helper.setJobProperty(traceRangeComboName, p_Trace);
	else
		p_trace_uc_helper.applyDefaults(traceRangeComboName);

	if (typeof p_StartAddress != "undefined" && p_StartAddress != null)	 
		p_trace_uc_helper.setJobProperty("Start Address", p_StartAddress);
	else
		p_trace_uc_helper.applyDefaults("Start Address");
	
	if (typeof p_EndAddress != "undefined" && p_EndAddress != null)	 
		p_trace_uc_helper.setJobProperty("End Address", p_EndAddress);
	else
		p_trace_uc_helper.applyDefaults("End Address");
}

function cancelTraceRange(traceRangeComboName) {
	if (!p_trace_uc_helper.jobPropertyExists("Start Address")) return;

	p_Trace=oldTrace;
	p_StartAddress=oldStartAddress;
	p_EndAddress=oldEndAddress;
}
