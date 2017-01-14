dvt_activity.addPropertyMap("\
      p_Receiver		= ${transportType},\
      p_SynchronizeWithTarget	= ${synchronizeWithTarget},\
      p_BufferType		= ${bufferType},\
      p_BufferSize		= ${bufferSize},\
      p_BufferIPAddress		= ${bufferOrIPAddress},\
      p_BufferSizeCoreID	= ${bufferSizeOrCoreID},\
      p_NumberOfPins		= ${numberOfPins},\
      p_SwoEncoding		= ${encodingType},\
      p_TimestampingResolution	= ${timestampingResolution}, p_ComPort			= ${comPort}\
");

var p_Receiver = null;
var oldReceiver = null;
var p_SynchronizeWithTarget = null;
var oldSynchronizeWithTarget = null
var p_BufferSize = null;
var oldBufferSize = null;
var p_BufferType = null;
var oldBufferType = null;
//var p_connectionType = null;
//var p_oldConnectionType = null;
//var p_ipAddress = null;
//var p_oldIpAddress = null;
var p_BufferIPAddress = null;
var oldBufferIPAddress = null;
var p_BufferSizeCoreID = null;
var oldBufferSizeCoreID = null;
var receieverSectionWidget = null;
var receiverSectionEnabled = true;
var oldReceiverSectionEnabled = true;
var p_NumberOfPins = null;
var oldNumberOfPins = null;
var p_SwoEncoding = null;
var oldSwoEncoding = null;
var p_ComPort = null;
var oldComPort = null;
var p_TimestampingResolution = null;
var oldTimestampingResolution = null;

function setReceiverSectionEnabled(rSectionEnabled) {
	if (receieverSectionWidget == null) 
		return;

	receiverSectionEnabled = rSectionEnabled;	
	receieverSectionWidget.setExpanded(false);
	receieverSectionWidget.setEnabled(receiverSectionEnabled);
	
	configDialog.refresh();
}

function receiverProperties(configDialog) {

	receieverSectionWidget = new ConfigSection("Receiver/Transport Settings");
	receieverSectionWidget.setSpanAllColumns(true);
	receieverSectionWidget.setExpanding(true);
	receieverSectionWidget.setExpanded(false);
	receieverSectionWidget.setEnabled(receiverSectionEnabled);
	oldReceiverSectionEnabled = receiverSectionEnabled;		
	configDialog.page.addWidget(receieverSectionWidget);
		
	var receiverSection = new ConfigSection();
	receiverSection.setNumColumns(5);	
	receieverSectionWidget.addWidget(receiverSection);

//	receiverSection.addWidget(label("Receiver:"));	
//	receiverSection.addWidget(combobox("Receiver", receiver));
	if (combobox("Receiver", p_Receiver).getItems().size() > 0)        
    	p_Receiver = combobox("Receiver").getItems().get(combobox("Receiver").getSelection()).getText(); //todo
    	
    oldReceiver = p_Receiver;
	//combobox("Receiver").addRun(new IRun({ run: receiverRun }));
var MyRunnable = Java.extend(Runnable, { 
	run: receiverRun 
}); 
combobox("Receiver").addRun(new MyRunnable());
        
//  receiverSection.addWidget(label("     "));
//  receiverSection.addWidget(label("     "));
/*            
	checkbox("Synchronize trace collection with target run and halt").setEnabled(!receiver.equals("None"));
	receiverSection.addWidget(checkbox("Synchronize trace collection with target run and halt", synchronizeWithTarget));
	// TODO
	synchronizeWithTarget = checkbox("Synchronize trace collection with target run and halt").getCheck();	
	checkbox("Synchronize trace collection with target run and halt").addRun(new IRun( { 
	      run: function() { 
	    		synchronizeWithTarget =checkbox("Synchronize trace collection with target run and halt").getCheck();		
		  } 
	   }
	)); 		
*/		
//  receiverSection.addWidget(label("     "));
    
	receiverSection.addWidget(label("Buffer Type:"));
	label("Buffer Type:").setEnabled(p_Receiver.equals("560 V2 Trace") || p_Receiver.equals("Pro Trace"));		
	receiverSection.addWidget(combobox("Buffer type", p_BufferType));
	combobox("Buffer type").setEnabled(p_Receiver.equals("560 V2 Trace") || p_Receiver.equals("Pro Trace"));		
	if (combobox("Buffer type").getEnabled() && combobox("Buffer type").getItems().size()>0)	
		p_BufferType = combobox("Buffer type").getItems().get(combobox("Buffer type").getSelection()).getText();
	oldBufferType = p_BufferType;
	/*
	combobox("Buffer type").addRun(new IRun( { 
	      run: function() {
	      		if (combobox("Buffer type").getItems().size()>0) 
	    			p_BufferType = combobox("Buffer type").getItems().get(combobox("Buffer type").getSelection()).getText();
		  } 
	   }
	)); 		
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		if (combobox("Buffer type").getItems().size()>0) 
	    		p_BufferType = combobox("Buffer type").getItems().get(combobox("Buffer type").getSelection()).getText();
    	} 
}); 
combobox("Buffer type").addRun(new MyRunnable());

    receiverSection.addWidget(label("     "));	

	receiverSection.addWidget(label("Buffer Size:"));
	label("Buffer Size:").setEnabled(p_Receiver.equals("560 V2 Trace") || p_Receiver.equals("Pro Trace"));
	receiverSection.addWidget(combobox("Buffer size", p_BufferSize));
	combobox("Buffer size").setEnabled(p_Receiver.equals("560 V2 Trace") || p_Receiver.equals("Pro Trace"));
	if (combobox("Buffer size").getEnabled() &&  combobox("Buffer size").getItems().size()>0)	
		p_BufferSize = combobox("Buffer size").getItems().get(combobox("Buffer size").getSelection()).getText();
	oldBufferSize = p_BufferSize;
	/*
	combobox("Buffer size").addRun(new IRun( { 
	      run: function() {
	      		if (combobox("Buffer size").getItems().size()>0) 
	    			p_BufferSize = combobox("Buffer size").getItems().get(combobox("Buffer size").getSelection()).getText();
		  } 
	   }
	));
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		if (combobox("Buffer size").getItems().size()>0) 
    			p_BufferSize = combobox("Buffer size").getItems().get(combobox("Buffer size").getSelection()).getText();
    	} 
}); 
combobox("Buffer size").addRun(new MyRunnable());
	
	
	receiverSection.addWidget(label("Buffer/IP Address:"));
	label("Buffer/IP Address:").setEnabled(p_Receiver.equals("ETB Remote-Memory"));
	receiverSection.addWidget(textbox("Buffer/IP Address", p_BufferIPAddress));
	textbox("Buffer/IP Address").setEnabled(p_Receiver.equals("ETB Remote-Memory"));

	p_BufferIPAddress = textbox("Buffer/IP Address").getText();
	oldBufferIPAddress = p_BufferIPAddress;	
	textbox("Buffer/IP Address").setHighlight(textbox("Buffer/IP Address").getEnabled() && (p_BufferIPAddress == null || p_BufferIPAddress.equals("")));
	/*
	textbox("Buffer/IP Address").addRun(new IRun( { 
		run: function() {
			p_BufferIPAddress = textbox("Buffer/IP Address").getText(); 
			textbox("Buffer/IP Address").setHighlight(p_BufferIPAddress == null || p_BufferIPAddress.equals(""));
			applyCanFinish();
	    	configDialog.refresh();
		} 
	}));		
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		p_BufferIPAddress = textbox("Buffer/IP Address").getText(); 
		textbox("Buffer/IP Address").setHighlight(p_BufferIPAddress == null || p_BufferIPAddress.equals(""));
		applyCanFinish();
	    	configDialog.refresh();
    	} 
}); 
textbox("Buffer/IP Address").addRun(new MyRunnable());
	
	
    receiverSection.addWidget(label("     "));	
    	
	receiverSection.addWidget(label("Buffer Size/Core ID:"));
	label("Buffer Size/Core ID:").setEnabled(p_Receiver.equals("ETB Remote-Memory"));
	receiverSection.addWidget(textbox("Buffer Size/Core ID", p_BufferSizeCoreID));
	textbox("Buffer Size/Core ID").setEnabled(p_Receiver.equals("ETB Remote-Memory"));
	p_BufferSizeCoreID = textbox("Buffer Size/Core ID").getText();
	oldBufferSizeCoreID = p_BufferSizeCoreID;
	textbox("Buffer Size/Core ID").setHighlight(textbox("Buffer Size/Core ID").getEnabled() && (p_BufferSizeCoreID == null || p_BufferSizeCoreID.equals("")));
	applyCanFinish();	
	/*
	textbox("Buffer Size/Core ID").addRun(new IRun( { 
		run: function() {
			p_BufferSizeCoreID = textbox("Buffer Size/Core ID").getText(); 
			textbox("Buffer Size/Core ID").setHighlight(p_BufferSizeCoreID == null || p_BufferSizeCoreID.equals(""));
			applyCanFinish();
	    	configDialog.refresh();
		} 
	}));		
	*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
			p_BufferSizeCoreID = textbox("Buffer Size/Core ID").getText(); 
			textbox("Buffer Size/Core ID").setHighlight(p_BufferSizeCoreID == null || p_BufferSizeCoreID.equals(""));
			applyCanFinish();
	    	configDialog.refresh();;
    	} 
}); 
textbox("Buffer Size/Core ID").addRun(new MyRunnable());
		

	receiverSection.addWidget(label("Number of Pins:"));
	label("Number of Pins:").setEnabled(p_Receiver.equals("560 V2 Trace") || p_Receiver.equals("Pro Trace"));		
	receiverSection.addWidget(combobox("Number of Pins", p_NumberOfPins));
	combobox("Number of Pins").setEnabled(p_Receiver.equals("560 V2 Trace") || p_Receiver.equals("Pro Trace"));		
	if (combobox("Number of Pins").getEnabled() && combobox("Number of Pins").getItems().size()>0)	
		p_NumberOfPins = combobox("Number of Pins").getItems().get(combobox("Number of Pins").getSelection()).getText();
	oldNumberOfPins = p_NumberOfPins;
/*
	combobox("Number of Pins").addRun(new IRun( { 
	      run: function() {
	      		if (combobox("Number of Pins").getItems().size()>0) 
	    			p_NumberOfPins = combobox("Number of Pins").getItems().get(combobox("Number of Pins").getSelection()).getText();
		  } 
	   }
	)); 		
*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		if (combobox("Number of Pins").getItems().size()>0) 
	    			p_NumberOfPins = combobox("Number of Pins").getItems().get(combobox("Number of Pins").getSelection()).getText();
    	} 
}); 
combobox("Number of Pins").addRun(new MyRunnable());

    receiverSection.addWidget(label("     "));
    receiverSection.addWidget(label("     "));	
    receiverSection.addWidget(label("     "));
    
    receiverSection.addWidget(label("Encoding Type:"));
    label("Encoding Type:").setEnabled(p_Receiver.equals("SWO Trace"));
    receiverSection.addWidget(combobox("Encoding Type", p_SwoEncoding));
    combobox("Encoding Type").setEnabled(p_Receiver.equals("SWO Trace"));
    oldSwoEncoding = p_SwoEncoding;
    if (combobox("Encoding Type").getEnabled() && combobox("Encoding Type").getItems().size()>0)
        p_SwoEncoding = combobox("Encoding Type").getItems().get(combobox("Encoding Type").getSelection()).getText();
	/*
	combobox("Encoding Type").addRun(new IRun( { 
	      run: function() {
	      		if (combobox("Encoding Type").getItems().size()>0) 
	    			p_SwoEncoding = combobox("Encoding Type").getItems().get(combobox("Encoding Type").getSelection()).getText();
		  } 
	   }
	));
*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		if (combobox("Encoding Type").getItems().size()>0) 
	    		p_SwoEncoding = combobox("Encoding Type").getItems().get(combobox("Encoding Type").getSelection()).getText();;
    	} 
}); 
combobox("Encoding Type").addRun(new MyRunnable());

    receiverSection.addWidget(label("     "));
    
	receiverSection.addWidget(label("COM Port:"));
	label("COM Port:").setEnabled(p_Receiver.equals("SWO Trace"));
	receiverSection.addWidget(combobox("COM Port", p_ComPort));
	combobox("COM Port").setEnabled(p_Receiver.equals("SWO Trace"));
	
	combobox("COM Port").setEdit(true);
	
	if (combobox("COM Port").getItems().size()>0) 
		p_ComPort = combobox("COM Port").getItems().get(combobox("COM Port").getSelection()).getText();
	else
		p_ComPort = combobox("COM Port").getText();		
	oldComPort = p_ComPort;	
	combobox("COM Port").setHighlight(combobox("COM Port").getEnabled() && (p_ComPort == null || p_ComPort.equals("")));
/*	
	combobox("COM Port").addRun(new IRun( { 
		run: function() {
	   		if (combobox("COM Port").getItems().size()>0) 
	   			p_ComPort = combobox("COM Port").getItems().get(combobox("COM Port").getSelection()).getText();		
			else
				p_ComPort = combobox("COM Port").getText();
			combobox("COM Port").setHighlight(combobox("COM Port").getEnabled() && (p_ComPort == null || p_ComPort.equals("")));
			applyCanFinish();
	    	configDialog.refresh();			
		} 
	}));
*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
			if (combobox("COM Port").getItems().size()>0) 
	   			p_ComPort = combobox("COM Port").getItems().get(combobox("COM Port").getSelection()).getText();		
			else
				p_ComPort = combobox("COM Port").getText();
			combobox("COM Port").setHighlight(combobox("COM Port").getEnabled() && (p_ComPort == null || p_ComPort.equals("")));
			applyCanFinish();
	    	configDialog.refresh();
    	} 
}); 
combobox("COM Port").addRun(new MyRunnable());


	if (p_trace_uc_helper.jobPropertyExists("TimestampingResolution")) {
	
    receiverSection.addWidget(label("Timestamp Scale Factor:"));
    label("Timestamp Scale Factor:").setEnabled(p_Receiver.equals("SWO Trace"));
    receiverSection.addWidget(combobox("TimestampingResolution", p_TimestampingResolution));
    combobox("TimestampingResolution").setEnabled(p_Receiver.equals("SWO Trace"));
    oldTimestampingResolution = p_TimestampingResolution;
    if (combobox("TimestampingResolution").getEnabled() && combobox("TimestampingResolution").getItems().size()>0)
        p_TimestampingResolution = combobox("TimestampingResolution").getItems().get(combobox("TimestampingResolution").getSelection()).getText();
/*    
	combobox("TimestampingResolution").addRun(new IRun( { 
	      run: function() {
	      		if (combobox("TimestampingResolution").getItems().size()>0) 
	    			p_TimestampingResolution = combobox("TimestampingResolution").getItems().get(combobox("TimestampingResolution").getSelection()).getText();
		  } 
	   }
	));
*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		if (combobox("TimestampingResolution").getItems().size()>0) 
    			p_TimestampingResolution = combobox("TimestampingResolution").getItems().get(combobox("TimestampingResolution").getSelection()).getText();
    	} 
}); 
combobox("TimestampingResolution").addRun(new MyRunnable());

    receiverSection.addWidget(label("     "));
    receiverSection.addWidget(label("     "));	
    receiverSection.addWidget(label("     "));
    
    }
    		
	receiverSection.addWidget(checkbox("Synchronize trace collection with target run and halt", p_SynchronizeWithTarget));
	checkbox("Synchronize trace collection with target run and halt").setSpanColumns(5 );
    checkbox("Synchronize trace collection with target run and halt").setEnabled(!p_Receiver.equals("SWO Trace"));
	p_SynchronizeWithTarget = checkbox("Synchronize trace collection with target run and halt").getCheck();
	oldSynchronizeWithTarget = p_SynchronizeWithTarget;
/*	
	checkbox("Synchronize trace collection with target run and halt").addRun(new IRun( { 
	      run: function() { 
	    		p_SynchronizeWithTarget =checkbox("Synchronize trace collection with target run and halt").getCheck();		
		  } 
	   }
	)); 		
*/
var MyRunnable = Java.extend(Runnable, { 
	run: function() { 
		p_SynchronizeWithTarget =checkbox("Synchronize trace collection with target run and halt").getCheck();
    	} 
}); 
checkbox("Synchronize trace collection with target run and halt").addRun(new MyRunnable());	
	
	
	receiverRun(); 	
	
	receieverSectionWidget.setExpanded(false);
	if (typeof triggerSectionWidget != "undefined" && triggerSectionWidget != null)
		triggerSectionWidget.setExpanded(true);		
		
}


function receiverRun() {

	if (combobox("Receiver").getItems().size() > 0)        
		p_Receiver = combobox("Receiver").getItems().get(combobox("Receiver").getSelection()).getText();
		
	receieverSectionWidget.setExpanded(true);
	if (typeof triggerSectionWidget != "undefined" && triggerSectionWidget != null)
		triggerSectionWidget.setExpanded(false);

	checkbox("Synchronize trace collection with target run and halt").setEnabled(p_Receiver != null && !(p_Receiver.equals("None")));

	if (p_Receiver == null || p_Receiver.equals("ETB") || p_Receiver.equals("None")) {
		label("Buffer Size:").setEnabled(false);
	    combobox("Buffer size").setEnabled(false);
	    label("Buffer Type:").setEnabled(false);
	    combobox("Buffer type").setEnabled(false);
	    
	    label("Buffer/IP Address:").setEnabled(false);
	    textbox("Buffer/IP Address").setEnabled(false);
	    label("Buffer Size/Core ID:").setEnabled(false);
	    textbox("Buffer Size/Core ID").setEnabled(false);	    
	    
	    label("Number of Pins:").setEnabled(false);
	    combobox("Number of Pins").setEnabled(false);

        label("Encoding Type:").setEnabled(false);
	    combobox("Encoding Type").setEnabled(false);
        label("COM Port:").setEnabled(false);
	    combobox("COM Port").setEnabled(false);
	    if (p_trace_uc_helper.jobPropertyExists("TimestampingResolution")) {	    
	        label("Timestamp Scale Factor:").setEnabled(false);
		    textbox("TimestampingResolution").setEnabled(false);
	    }	    

	    checkbox("Synchronize trace collection with target run and halt").setEnabled(true);
	}
	else if (p_Receiver.equals("560 V2 Trace")) {
		label("Buffer Size:").setEnabled(true);
	    combobox("Buffer size").setEnabled(true);
	    label("Buffer Type:").setEnabled(true);
	    combobox("Buffer type").setEnabled(true);
	    			
	    label("Buffer/IP Address:").setEnabled(false);
	    textbox("Buffer/IP Address").setEnabled(false);
	    label("Buffer Size/Core ID:").setEnabled(false);
	    textbox("Buffer Size/Core ID").setEnabled(false);	    			
	    			
	    label("Number of Pins:").setEnabled(true);
	    combobox("Number of Pins").setEnabled(true);	    	    			

        label("Encoding Type:").setEnabled(false);
	    combobox("Encoding Type").setEnabled(false);
        label("COM Port:").setEnabled(false);
	    combobox("COM Port").setEnabled(false);
	    
	    if (p_trace_uc_helper.jobPropertyExists("TimestampingResolution")) {	    	    
	        label("Timestamp Scale Factor:").setEnabled(false);
		    textbox("TimestampingResolution").setEnabled(false);	    	    
		}
		
	    checkbox("Synchronize trace collection with target run and halt").setEnabled(true);
	}
	else if (p_Receiver.equals("Pro Trace")) {
	    label("Buffer Size:").setEnabled(true);
	    combobox("Buffer size").setEnabled(true);
	    label("Buffer Type:").setEnabled(true);
	    combobox("Buffer type").setEnabled(true);
	    			
	    label("Buffer/IP Address:").setEnabled(false);
	    textbox("Buffer/IP Address").setEnabled(false);
	    label("Buffer Size/Core ID:").setEnabled(false);
	    textbox("Buffer Size/Core ID").setEnabled(false);

	    label("Number of Pins:").setEnabled(true);
	    combobox("Number of Pins").setEnabled(true);	    	    				    	    

        label("Encoding Type:").setEnabled(false);
	    combobox("Encoding Type").setEnabled(false);
        label("COM Port:").setEnabled(false);
	    combobox("COM Port").setEnabled(false);
	    if (p_trace_uc_helper.jobPropertyExists("TimestampingResolution")) {	    
	        label("Timestamp Scale Factor:").setEnabled(false);
		    textbox("TimestampingResolution").setEnabled(false);	    	    
	    }
	    checkbox("Synchronize trace collection with target run and halt").setEnabled(true);
	}
	else if (p_Receiver.equals("ETB Remote-Memory")) {
	    label("Buffer Size:").setEnabled(false);
	    combobox("Buffer size").setEnabled(false);
	    label("Buffer Type:").setEnabled(false);
	    combobox("Buffer type").setEnabled(false);
	    			
	    label("Buffer/IP Address:").setEnabled(true);
	    textbox("Buffer/IP Address").setEnabled(true);
	    label("Buffer Size/Core ID:").setEnabled(true);
	    textbox("Buffer Size/Core ID").setEnabled(true);	    			
	    			
	    label("Number of Pins:").setEnabled(false);
	    combobox("Number of Pins").setEnabled(false);
        
        label("Encoding Type:").setEnabled(false);
	    combobox("Encoding Type").setEnabled(false);
        label("COM Port:").setEnabled(false);
	    combobox("COM Port").setEnabled(false);
	    
	    if (p_trace_uc_helper.jobPropertyExists("TimestampingResolution")) {	    
		    label("Timestamp Scale Factor:").setEnabled(false);
		    textbox("TimestampingResolution").setEnabled(false);	    
	    }  
	    checkbox("Synchronize trace collection with target run and halt").setEnabled(true);
	}		

    else if (p_Receiver.equals("SWO Trace")) {
	    label("Buffer Size:").setEnabled(false);
	    combobox("Buffer size").setEnabled(false);
	    label("Buffer Type:").setEnabled(false);
	    combobox("Buffer type").setEnabled(false);
	    			
	    label("Buffer/IP Address:").setEnabled(false);
	    textbox("Buffer/IP Address").setEnabled(false);
	    label("Buffer Size/Core ID:").setEnabled(false);
	    textbox("Buffer Size/Core ID").setEnabled(false);	    			
	    			
	    label("Number of Pins:").setEnabled(false);
	    combobox("Number of Pins").setEnabled(false);
        
        label("Encoding Type:").setEnabled(true);
	    combobox("Encoding Type").setEnabled(true);
        label("COM Port:").setEnabled(true);
	    combobox("COM Port").setEnabled(true);
	    
	    if (p_trace_uc_helper.jobPropertyExists("TimestampingResolution")) {	    
	        label("Timestamp Scale Factor:").setEnabled(true);
		    textbox("TimestampingResolution").setEnabled(true);	    
	    }
	    checkbox("Synchronize trace collection with target run and halt").setEnabled(false);
	}
        //-----work arround for 7.0, since the receiver is not getting switched
	applyReceiverProperties();
	//------------------------
	combobox("Buffer size").removeAll();
	var optionsBufferSize = p_trace_uc_helper.getOptions("Buffer size");
	if (optionsBufferSize.size() > 0) {	
        p_BufferSize = optionsBufferSize.get(optionsBufferSize.size() - 1);
        var eol = 2;
        if (p_BufferSize.equals("EOL")) {
        	p_BufferSize = "";
        	eol = 1;
        }        						
		for (var c=0; c<optionsBufferSize.size() - eol; c++) {
			combobox("Buffer size").add(optionsBufferSize.get(c));
			if (p_BufferSize.equals(optionsBufferSize.get(c)))
				combobox("Buffer size").setSelection(c);
		}
	}
	else {
		textbox("Buffer Size:").setEnabled(false);
		combobox("Buffer size").setEnabled(false);
		p_BufferSize = null;
	}
	    			    		
	combobox("Buffer type").removeAll();
	var optionsBufferType = p_trace_uc_helper.getOptions("Buffer type");
	if (optionsBufferType.size() > 0) {
		p_BufferType = optionsBufferType.get(optionsBufferType.size() - 1);	
        var eol = 2;
        if (p_BufferType.equals("EOL")) {
        	p_BufferType = "";
        	eol = 1;
        }        						
		for (var c=0; c<optionsBufferType.size()-eol; c++) {
			combobox("Buffer type").add(optionsBufferType.get(c));
			if (p_BufferType.equals(optionsBufferType.get(c)))
				combobox("Buffer type").setSelection(c);
		}
	}
	else {
	    label("Buffer Type:").setEnabled(false);
	    combobox("Buffer type").setEnabled(false);
	    p_BufferType = null;	
	}
		
	combobox("Number of Pins").removeAll();
	var optionsNumberOfPins = p_trace_uc_helper.getOptions("Number of Pins");
	if (optionsNumberOfPins.size() > 0) {
	    p_NumberOfPins = optionsNumberOfPins.get(optionsNumberOfPins.size() - 1);
        var eol = 2;
        if (p_NumberOfPins.equals("EOL")) {
        	p_NumberOfPins = "";
        	eol = 1;
        }        							    	
		for (var c=0; c<optionsNumberOfPins.size() - eol; c++) {
			combobox("Number of Pins").add(optionsNumberOfPins.get(c));
			if (p_NumberOfPins.equals(optionsNumberOfPins.get(c)))
				combobox("Number of Pins").setSelection(c);
		}
	}
	else {
	    label("Number of Pins:").setEnabled(false);
	    combobox("Number of Pins").setEnabled(false);
	    p_NumberOfPins = null;	
	}	
	
	p_BufferIPAddress = textbox("Buffer/IP Address").getText();
    if (textbox("Buffer/IP Address").getEnabled() && (p_BufferIPAddress == null || p_BufferIPAddress.equals(""))) {
		textbox("Buffer/IP Address").setHighlight(true);
	}
	else {
		textbox("Buffer/IP Address").setHighlight(false);
	}	    		

	p_BufferSizeCoreID = textbox("Buffer Size/Core ID").getText();
    if (textbox("Buffer Size/Core ID").getEnabled() && (p_BufferSizeCoreID == null || p_BufferSizeCoreID.equals(""))) {
		textbox("Buffer Size/Core ID").setHighlight(true);
	}
	else {
		textbox("Buffer Size/Core ID").setHighlight(false);
	}

    combobox("Encoding Type").removeAll();
	var optionsEncType = p_trace_uc_helper.getOptions("Encoding Type");
	if (optionsEncType.size() > 0) {	
        p_SwoEncoding = optionsEncType.get(optionsEncType.size() - 1);
        var eol = 2;
        if (p_SwoEncoding.equals("EOL")) {
        	p_SwoEncoding = "";
        	eol = 1;
        }        						
		for (var c=0; c<optionsEncType.size() - eol; c++) {
			combobox("Encoding Type").add(optionsEncType.get(c));
			if (p_SwoEncoding.equals(optionsEncType.get(c)))
				combobox("Encoding Type").setSelection(c);
		}
	}
	else {
		textbox("Encoding Type:").setEnabled(false);
		combobox("Encoding Type").setEnabled(false);
		p_SwoEncoding = null;
	}	
	
    combobox("COM Port").removeAll();
	var optionsComPort = p_trace_uc_helper.getOptions("COM Port");
	if (optionsComPort.size() > 0) {	
        p_ComPort = optionsComPort.get(optionsComPort.size() - 1);
        var eol = 2;
        if (p_ComPort.equals("EOL")) {
        	p_ComPort = "";
        	eol = 1;
        }
        var match = false;        						
		for (var c=0; c<optionsComPort.size() - eol; c++) {
			combobox("COM Port").add(optionsComPort.get(c));
			if (p_ComPort.equals(optionsComPort.get(c))) {
				combobox("COM Port").setSelection(c);
				match = true;
			}
		}
		if (!match) {
			combobox("COM Port").setText(p_ComPort);
		}
	}
	else {
		textbox("COM Port:").setEnabled(false);
		combobox("COM Port").setEnabled(false);
		p_ComPort = null;
	}	

	
	if (p_trace_uc_helper.jobPropertyExists("TimestampingResolution")) {	    
	    combobox("TimestampingResolution").removeAll();
		var optionsTimestampingResolution = p_trace_uc_helper.getOptions("TimestampingResolution");
		if (optionsTimestampingResolution.size() > 0) {	
	        p_TimestampingResolution = optionsTimestampingResolution.get(optionsTimestampingResolution.size() - 1);
	        var eol = 2;
	        if (p_TimestampingResolution.equals("EOL")) {
	        	p_TimestampingResolution = "";
	        	eol = 1;
	        }        						
			for (var c=0; c<optionsTimestampingResolution.size() - eol; c++) {
				combobox("TimestampingResolution").add(optionsTimestampingResolution.get(c));
				if (p_TimestampingResolution.equals(optionsTimestampingResolution.get(c)))
					combobox("TimestampingResolution").setSelection(c);
			}
		}
		else {
			textbox("Timestamp Scale Factor:").setEnabled(false);
			combobox("TimestampingResolution").setEnabled(false);
			p_TimestampingResolution = null;
		}
	}	
		

	applyCanFinish();	    		
	configDialog.refresh();

}

// for scripting
function setReceiver(value) {
	p_trace_uc_helper.setJobProperty("Receiver", value); 
	p_Receiver = value;
}

function setSynchronizeWithTarget(value) {
	p_trace_uc_helper.setJobProperty("Synchronize trace collection with target run and halt", value);
	p_SynchronizeWithTarget = value;
}

function setBufferSize(value) {
	p_trace_uc_helper.setJobProperty("Buffer size", value);
	p_BufferSize = value;
}

function setBufferType(value) {
	p_trace_uc_helper.setJobProperty("Buffer type", value);
	p_bufferTize = value;
}

function setNumberOfPins(value) {
	p_trace_uc_helper.setJobProperty("Number of Pins", value);
	p_NumberOfPins = value;
}

function setEncodingType(value) {
	p_trace_uc_helper.setJobProperty("Encoding Type", value);
	p_SwoEncoding = value;
}

/*
function setConnectionType(value) {
	p_trace_uc_helper.setJobProperty("Connection Type", value);
	p_connectionType = value;
}

function setIPAddress(value) {
	p_trace_uc_helper.setJobProperty("IP Address", value);
	p_ipAddress = value;
}
*/

function cancelReceiverProperties() {
	p_Receiver = oldReceiver;
	p_SynchronizeWithTarget = oldSynchronizeWithTarget;
	p_BufferSize = oldBufferSize;
	p_BufferType = oldBufferType;
	p_BufferIPAddress = oldBufferIPAddress;
	p_BufferSizeCoreID = oldBufferSizeCoreID;
	p_NumberOfPins = oldNumberOfPins;
	p_SwoEncoding = oldSwoEncoding;
	p_ComPort = oldComPort;	
	p_TimestampingResolution = oldTimestampingResolution;
//	p_connectionType = p_oldConnectionType;
//	p_ipAddress = p_oldIpAddress;
}

function applyReceiverProperties() {
	if (typeof p_Receiver != "undefined" && p_Receiver != null)
		p_trace_uc_helper.setJobProperty("Receiver", p_Receiver);
	else
		p_trace_uc_helper.applyDefaults("Receiver");

	if (typeof p_SynchronizeWithTarget != "undefined" && p_SynchronizeWithTarget != null)	 
		p_trace_uc_helper.setJobProperty("Synchronize trace collection with target run and halt", p_SynchronizeWithTarget);
	else
		p_trace_uc_helper.applyDefaults("Synchronize trace collection with target run and halt");
		
	if (typeof p_BufferSize != "undefined" && p_BufferSize != null)	 
		p_trace_uc_helper.setJobProperty("Buffer size", p_BufferSize);
	else
		p_trace_uc_helper.applyDefaults("Buffer size");
	
	if (typeof p_BufferType != "undefined" && p_BufferType != null)	 
		p_trace_uc_helper.setJobProperty("Buffer type", p_BufferType);
	else
		p_trace_uc_helper.applyDefaults("Buffer type");
		
	if (typeof p_NumberOfPins != "undefined" && p_NumberOfPins != null)	 
		p_trace_uc_helper.setJobProperty("Number of Pins", p_NumberOfPins);
	else
		p_trace_uc_helper.applyDefaults("Number of Pins");				
	
	if (typeof p_BufferIPAddress != "undefined" && p_BufferIPAddress != null)	 	
		p_trace_uc_helper.setJobProperty("Buffer/IP Address", p_BufferIPAddress)
	else
		p_trace_uc_helper.applyDefaults("Buffer/IP Address");
	
	if (typeof p_BufferSizeCoreID != "undefined" && p_BufferSizeCoreID != null)
		p_trace_uc_helper.setJobProperty("Buffer Size/Core ID", p_BufferSizeCoreID)
	else
		p_trace_uc_helper.applyDefaults("Buffer Size/Core ID");

/*	
	if (typeof connectionType != "undefined" && connectionType != null)
		p_trace_uc_helper.setJobProperty("Connection Type", connectionType);
	else
		p_trace_uc_helper.applyDefaults("Connection Type");
	
	if (typeof ipAddress != "undefined" && ipAddress != null)
		p_trace_uc_helper.setJobProperty("IP Address", ipAddress);
	else	
		p_trace_uc_helper.applyDefaults("IP Address");
*/		
    if (typeof p_SwoEncoding != "undefined" && p_SwoEncoding != null)
    	p_trace_uc_helper.setJobProperty("Encoding Type", p_SwoEncoding)
	else
		p_trace_uc_helper.applyDefaults("Encoding Type");
		
    if (typeof p_ComPort != "undefined" && p_ComPort != null)
    	p_trace_uc_helper.setJobProperty("COM Port", p_ComPort)
	else
		p_trace_uc_helper.applyDefaults("COM Port");

	if (p_trace_uc_helper.jobPropertyExists("TimestampingResolution")) {	    
	    if (typeof p_TimestampingResolution != "undefined" && p_TimestampingResolution != null)
	    	p_trace_uc_helper.setJobProperty("TimestampingResolution", p_TimestampingResolution)
		else
			p_trace_uc_helper.applyDefaults("TimestampingResolution");
	}
}

function refreshReceiver() {
    
    var etbType = "Auto";
	values = p_trace_uc_helper.getJobProperty("ETB Type");
	if (values != null && values.size() > 0) {
		etbType = values.get(0);				
	    if (etbType.equals("Remote-Memory")) {		
			values = p_trace_uc_helper.getJobProperty("Buffer/IP Address");
			if (values != null && values.size() > 0) {
				p_BufferIPAddress = values.get(0);
				textbox("Buffer/IP Address").setText(p_BufferIPAddress);
			}
		
			values = p_trace_uc_helper.getJobProperty("Buffer Size/Core ID");
			if (values != null && values.size() > 0) {
				p_BufferSizeCoreID = values.get(0);
				textbox("Buffer Size/Core ID").setText(p_BufferSizeCoreID);
			}
		}
		else {
			p_BufferIPAddress = null;
			p_BufferSizeCoreID = null;
		}
	}
	
	values = p_trace_uc_helper.getJobProperty("Receiver");
	if (values != null && values.size() > 0) {
		p_Receiver = values.get(0);
		for (a=0; a<combobox("Receiver").getItems().size(); a++) {
			if (p_Receiver.equals(combobox("Receiver").getItems().get(a).getText()))
				combobox("Receiver").setSelection(a);
			else if (etbType.equals("Remote-Memory") && combobox("Receiver").getItems().get(a).getText().equals("ETB Remote-Memory")) 
				combobox("Receiver").setSelection(a);
		}
	}
	

	values = p_trace_uc_helper.getJobProperty("Synchronize trace collection with target run and halt");
	if (values != null && values.size() > 0) {
		p_SynchronizeWithTarget = java.lang.Boolean.valueOf(values.get(0)).booleanValue();
		checkbox("Synchronize trace collection with target run and halt").setCheck(p_SynchronizeWithTarget);
	}

	values = p_trace_uc_helper.getJobProperty("Buffer size");
	if (values != null && values.size() > 0) {	
		p_BufferSize = values.get(0);
		for (a=0; a<combobox("Buffer size").getItems().size(); a++)
			if (p_BufferSize.equals(combobox("Buffer size").getItems().get(a).getText()))
				combobox("Buffer size").setSelection(a);
	}

	values = p_trace_uc_helper.getJobProperty("Buffer type");
	if (values != null && values.size() > 0) {	
		p_BufferType = values.get(0);
		for (a=0; a<combobox("Buffer type").getItems().size(); a++)
			if (p_BufferType.equals(combobox("Buffer type").getItems().get(a).getText()))
				combobox("Buffer type").setSelection(a);
	}
	
	values = p_trace_uc_helper.getJobProperty("Number of Pins");
	if (values != null && values.size() > 0) {	
		p_NumberOfPins = values.get(0);
		for (a=0; a<combobox("Number of Pins").getItems().size(); a++)
			if (p_NumberOfPins.equals(combobox("Number of Pins").getItems().get(a).getText()))
				combobox("Number of Pins").setSelection(a);
	}
	
	values = p_trace_uc_helper.getJobProperty("Encoding Type");
	if (values != null && values.size() > 0) {	
		p_SwoEncoding = values.get(0);
		for (a=0; a<combobox("Encoding Type").getItems().size(); a++)
			if (p_SwoEncoding.equals(combobox("Encoding Type").getItems().get(a).getText()))
				combobox("Encoding Type").setSelection(a);
	}
	
	values = p_trace_uc_helper.getJobProperty("COM Port");
	if (values != null && values.size() > 0) {	
		p_ComPort = values.get(0);
		var match = false;
		for (a=0; a<combobox("COM Port").getItems().size(); a++) {
			if (p_ComPort.equals(combobox("COM Port").getItems().get(a).getText())) {
				combobox("COM Port").setSelection(a);
				match = true;
			}
		}
		if (!match) {
			combobox("COM Port").setText(p_ComPort);
		}
	}	

	if (p_trace_uc_helper.jobPropertyExists("TimestampingResolution")) {	
		values = p_trace_uc_helper.getJobProperty("TimestampingResolution");
		if (values != null && values.size() > 0) {	
			p_TimestampingResolution = values.get(0);
			for (a=0; a<combobox("TimestampingResolution").getItems().size(); a++)
				if (p_TimestampingResolution.equals(combobox("TimestampingResolution").getItems().get(a).getText()))
					combobox("TimestampingResolution").setSelection(a);
		}
	}

	exp = receieverSectionWidget.getExpanded();
		
	receiverRun();
	
	receieverSectionWidget.setExpanded(exp);
	
}
