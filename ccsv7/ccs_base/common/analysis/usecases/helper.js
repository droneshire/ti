importPackage(Packages.java.lang)
importPackage(Packages.java.io)
importPackage(Packages.com.ti.dvt.control.engine.activities)
importPackage(Packages.com.ti.dvt.control.engine.types)
importPackage(Packages.com.ti.dvt.analysis.suite)
importPackage(Packages.com.ti.dvt.ideadapter)

function helper()
{
	var configProperty = new ConfigProperty();
	configProperty.setFinished(true);
}

function dvt_usecase_launch_dialog()
{
	//TODO: Multiple contributors.
	var wizardDialog = new ConfigWizard("Hardware Trace Analysis Configuration");
	var wizardPage = new ConfigWizardPage(dvt_activity.getName() + " Configuration", dvt_activity.getDescription());
	wizardDialog.addPage(wizardPage);
	var saveButton = new ConfigButton("Save Use Case");
	saveRun = { run: function() {dvt_activity.save();} };
	saveButton.addRun(new IRun(saveRun));
	wizardDialog.addButton(saveButton);

	var configTable = new ConfigTable();
	wizardPage.addWidget(configTable);
	configTable.setSpanAllColumns(true);

	var launch = new Object();
	launch.execute = function() {wizardDialog.execute();}
	launch.refresh = function() {wizardDialog.refresh();}
	launch.dialog = wizardDialog;
	launch.page = wizardPage; 
	launch.table = configTable;
	
	return launch;
}
