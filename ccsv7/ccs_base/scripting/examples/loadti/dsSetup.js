/** 
 * @dsSetup.js - DSS Generic TI Loader include file that contains functions used
 * by main.js to configure the Debug Server.
 */

var debugServer = null;
var isDebugServer = false;

/**
 * Configure Debug Server with the given configuration.
 
 * @param {config} configuration file used to configure Debug Server.
 * @param {dssScriptEnv} DSS Scripting Environment object.
 */
function configureDebugServer(config, dssScriptEnv)
{
    errCode = 0;

	debugServer = dssScriptEnv.getServer("DebugServer.1");
	isDebugServer = true;

	try
	{
		debugServer.setConfig(config);
	}
	catch (ex)
	{
		errCode = getErrorCode(ex);
		dssScriptEnv.traceWrite("Error code #" + errCode + ", could not import configuration " + config +
				"\nAborting!");
	}

    return errCode;
}
