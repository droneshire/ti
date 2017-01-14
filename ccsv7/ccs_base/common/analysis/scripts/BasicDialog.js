function basicDialog(configDialog) { 		
 	widgets = new Array();
 	configDialog.page.setNumColumns(5);
	configDialog.table.addActivity(dvt_activity);
	configDialog.table.setText("Instrumentation Type,Cores,Transport Type");	
}