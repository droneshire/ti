importPackage(Packages.com.ti.dvt.analysis.traceviewer.activity)


dvt_activity.include("../../scripts/useCaseHelper.js");

var p_trace_uc_helper = new TraceUseCaseHelper( );

function trace_usecase_launch_dialog()
{
	var launch = dvt_usecase_launch_dialog();
	launch.dialog.setText("Hardware Trace Analysis Configuration");
	
	return launch;
}

function helperConnectSystemTrace( family, subfamily ){
	return p_trace_uc_helper.connectSystemTrace( family, subfamily );
}

function helperConnectCSETB(){
	return p_trace_uc_helper.connectCSETB();
}


function helperGetReceiverType( cpu ){
	return p_trace_uc_helper.getReceiverType( cpu.toString() );
}

function helperFindJobs( trace_type, cpu ) {
	receiver_jobs_can_be_applied = true; 
	trigger_jobs_can_be_applied = true; 
	return p_trace_uc_helper.findJobs( trace_type, cpu );
}
 
function helperGetReceiverJobs( cpu ) {
	return p_trace_uc_helper.getReceiverJobs( cpu );
}
 
function helperGetTriggerJobs( cpu ) {
	return p_trace_uc_helper.getTriggerJobs( cpu );
}
 
function helperGetReceiverEnables( cpu ) {
	return p_trace_uc_helper.getReceiverEnables( cpu );
}
 
function helperGetTriggerEnables( cpu ) {
	return p_trace_uc_helper.getTriggerEnables( cpu );
}

function helperIsSimulator( cpu_list ){
	return p_trace_uc_helper.isSimulator( cpu_list[0] );
}	

function helperIsHomogeneousSelection( cpu_list ){
	p_trace_uc_helper.traceMsg("helperIsHomogeneousSelection()");
	var family = cpu_list[0].getCPUFamily();
	var sub_family = cpu_list[0].getCPUSubFamily();
	var f, sf;
	for(var i=1;i<cpu_list.length;i++){
		f 	= cpu_list[i].getCPUFamily();
		sf 	= cpu_list[i].getCPUSubFamily();
		if( (f != family) || (sf != sub_family) ){
			return false;
		}
	}

	return true;
}

var receiver_jobs_can_be_applied; 
function helperApplyReceiverJobs( trace_type, cpu, jobs, enables ) {
	p_trace_uc_helper.traceMsg("helperApplyReceiverJobs()");
	return p_trace_uc_helper.applyTraceJobs(trace_type, "Receiver", cpu, jobs, enables);
}

var trigger_jobs_can_be_applied; 
function helperApplyTriggerJobs( trace_type, cpu, jobs, enables ) {
	p_trace_uc_helper.traceMsg("helperApplyTriggerJobs()" );
	return p_trace_uc_helper.applyTraceJobs(trace_type, "Trigger", cpu, jobs, enables);
}


function helperEnableTrace( cpu ) {
	p_trace_uc_helper.traceMsg("helperEnableTrace()");
	if((trigger_jobs_can_be_applied == true)&&(receiver_jobs_can_be_applied == true)){
		return p_trace_uc_helper.enableTrace( cpu );
	}
	else{
		p_trace_uc_helper.traceMsg("No job applied or jobs could not be applied");
		return false;
	}
}

function helperSetJobs( cpu, bkpt_list, state ){
	return p_trace_uc_helper.setJobs( cpu.toString(), bkpt_list, state );
}

function helperCreateJobs( cpu, bkpt_list, state ){
	return p_trace_uc_helper.createJobs( cpu.toString(), bkpt_list, state );
}

function helperRemove( core_name ){
	return p_trace_uc_helper.remove( core_name );
}

function helperDisableUC( cpu ){
	p_trace_uc_helper.traceMsg("helperDisableUC()");
	return p_trace_uc_helper.jobsEnable( cpu, false );
}

function helperReEnableUC( cpu ){
	p_trace_uc_helper.traceMsg("helperReEnableUC()");
	return p_trace_uc_helper.jobsEnable( cpu, true );
}

function helperGetNameForDisplay( core_name ){
	return p_trace_uc_helper.getNameForDisplay( core_name );
}

function helperCleanupOnCancel(){
	if (typeof cleanupOnCancelAFs != "undefined") {
		cleanupOnCancelAFs();
	} 

	return p_trace_uc_helper.cleanupOnCancel();
}

function helperRunGelFunctions( cpu ){
	return p_trace_uc_helper.runGelFunctions( cpu );
}


function helperCreateCopyOfJobs( core_name ){
	return p_trace_uc_helper.createCopyOfJobs( core_name );
}

function helperCommitJobsOnApply( cpu ){
	return p_trace_uc_helper.commitJobsOnApply( cpu );
}

function helperSetCPUs( cpus ) {
	p_trace_uc_helper.setCPUs( cpus );
}

function helperSetCoreName( core_name ) {
	p_trace_uc_helper.setCoreName( core_name );
}

function helperHasReceiverChangedInAdvance() {
	return p_trace_uc_helper.hasReceiverChangedInAdvance();
}

function helperHaveTriggersChangedInAdvance() {
	return p_trace_uc_helper.haveTriggersChangedInAdvance();
}

function helperGetSubFolderForDevice() {
	return p_trace_uc_helper.getSubFolderForDevice();
}

var p_Version = "";
function helperSaveRestoreVersionCompatible() {
	p_trace_uc_helper.traceMsg("helperSaveRestoreVersionCompatible()" );

	if( p_Version == "" ){
		p_trace_uc_helper.traceMsg("Restored UC based of old (non versioned) Save and Restore feature");
		return false;
	}

	if( version == p_Version ){
		return true;
	}
	else{
		p_trace_uc_helper.traceMsg("Restored UC does not match version of current Save and Restore feature");
		return false;
	}
}

function helperIsCustomUC() {
	p_trace_uc_helper.traceMsg("helperIsCustomUC()" );
	return p_trace_uc_helper.isCustomUC(dvt_activity_priority);

}

