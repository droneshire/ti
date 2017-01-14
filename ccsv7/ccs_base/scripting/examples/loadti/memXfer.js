/**
 * @memXfer.js - DSS Generic TI Loader include file that contains functions
 * used by main.js for host to target memory data transfer.
 */

/**
 * Load data from file(s) on host to target memory.
 *
 * @param {dssScriptEnv} DSS Scripting Environment object.
 * @param {debugSession} Debug Session object.
 * @param {loadRaw} Array of strings, where each string describes a raw file to
 * memory transfer.
 * @param {loadDat} Array of strings, where each string describes a text-based
 * file to memory transfer.
 */
function memLoad(dssScriptEnv, debugSession, loadRaw, loadDat)
{
    var errCode = 0;
    var xferNum = 0;

    if (loadRaw.length > 0)
    {
		for (xferNum = 0; xferNum < loadRaw.length; xferNum++)
		{
			errCode = loadRawData(dssScriptEnv, debugSession, loadRaw[xferNum]);
		}
    }

    if (loadDat.length > 0)
    {
        for (xferNum = 0; xferNum < loadDat.length; xferNum++)
        {
            errCode = loadDatData(dssScriptEnv, debugSession, loadDat[xferNum]);
        }
    }

    return errCode;
}

/**
 * Save memory on target to a file(s) on the host.
 *
 * @param {dssScriptEnv} DSS Scripting Environment object.
 * @param {debugSession} Debug Session object.
 * @param {saveRaw} Array of strings, where each string describes a memory to
 * raw file transfer.
 * @param {saveDat} Array of strings, where each string describes a memory to
 * text-based file transfer.
 */
function memSave(dssScriptEnv, debugSession, saveRaw, saveDat)
{
    var errCode = 0;
    var xferNum = 0;

    if (saveRaw.length > 0)
    {
		for (xferNum = 0; xferNum < saveRaw.length; xferNum++)
		{
			errCode = saveRawData(dssScriptEnv, debugSession, saveRaw[xferNum]);
		}
    }

    if (saveDat.length > 0)
    {
        for (xferNum = 0; xferNum < saveDat.length; xferNum++)
        {
            errCode = saveDatData(dssScriptEnv, debugSession, saveDat[xferNum]);
        }
    }

    return errCode;
}

/**
 * Load binary data from file on host to target memory.
 *
 * @param {dssScriptEnv} DSS Scripting Environment object.
 * @param {debugSession} Debug Session object.
 * @param {parameters} String containing parameters to the actual load, with
 * format "[page],[address],[filename],[type_size],[byte_swap]".
 */
function loadRawData(dssScriptEnv, debugSession, parameters)
{
    var errCode = 0;

    matchResult = parameters.match(/([0-4]|65535),(\w+),(.+),(8|16|32),(true|false)/);

    if ((matchResult == null))
    {
        dssScriptEnv.traceWrite("--mem_load_raw parameters: " + parameters +
				" option are invalid! see loadti --help for parameter specification");
        errCode = 1;
    }
	else
	{
        var nPage = parseInt(RegExp.$1);
        var nAddress = parseInt(RegExp.$2);
        var sFilename = RegExp.$3;
        var nTypeSize = parseInt(RegExp.$4);
        var bByteSwap = false;

        if (RegExp.$5 == "true")
        {
            bByteSwap = true;
        }

        try
		{
            debugSession.memory.loadRaw(nPage, nAddress, sFilename, nTypeSize, bByteSwap);
        }
		catch (ex)
		{
			errCode = getErrorCode(ex);
            dssScriptEnv.traceWrite("Error code #" + errCode + ", could not load file " + sFilename +
					" to target memory!");
        }
    }

    return errCode;
}

/**
 * Load text-based data from file on host to target memory.
 *
 * @param {dssScriptEnv} DSS Scripting Environment object.
 * @param {debugSession} Debug Session object.
 * @param {parameters} String containing parameters to the actual load, with
 * format "[page],[address],[filename],[len]".
 */
function loadDatData(dssScriptEnv, debugSession, parameters)
{
    var errCode = 0;

    matchResult = parameters.match(/([0-4]|65535),(\w+),(.+),(\w+)/);

    if ((matchResult == null))
    {
        dssScriptEnv.traceWrite("--mem_load_dat parameters: " + parameters +
				" option are invalid! see loadti --help for parameter specification");
        errCode = 1;
    }
	else
	{
        var nPage = parseInt(RegExp.$1);
        var nAddress = parseInt(RegExp.$2);
        var sFilename = RegExp.$3;
        var nLength = parseInt(RegExp.$4);

        try
		{
            debugSession.memory.loadData(nPage, nAddress, sFilename, nLength);
        }
		catch (ex)
		{
			errCode = getErrorCode(ex);
            dssScriptEnv.traceWrite("Error code #" + errCode + ", could not load file " + sFilename +
					" to target memory!");
        }
    }

    return errCode;
}

/**
 * Save memory on target to a binary file on the host.
 *
 * @param {dssScriptEnv} DSS Scripting Environment object.
 * @param {debugSession} Debug Session object.
 * @param {parameters} String containing parameters to the actual save, with
 * format "[page],[address],[filename],[len],[type_size],[byte_swap]".
 */
function saveRawData(dssScriptEnv, debugSession, parameters)
{
    var errCode = 0;

    matchResult = parameters.match(/([0-4]|65535),(\w+),(.+),(\w+),(8|16|32),(true|false)/);

    if ((matchResult == null))
    {
        dssScriptEnv.traceWrite("--mem_save_raw parameters: " + parameters +
				" option are invalid! see loadti --help for parameter specification");
        errCode = 1;
    }
	else
	{
        var nPage = parseInt(RegExp.$1);
        var nAddress = parseInt(RegExp.$2);
        var sFilename = RegExp.$3;
        var nLength = parseInt(RegExp.$4);
        var nTypeSize = parseInt(RegExp.$5);
        var bByteSwap = false;

        if (RegExp.$6 == "true")
        {
            bByteSwap = true;
        }

        try
		{
            debugSession.memory.saveRaw(nPage, nAddress, sFilename, nLength, nTypeSize, bByteSwap);
        }
		catch (ex)
		{
			errCode = getErrorCode(ex);
            dssScriptEnv.traceWrite("Error code #" + errCode + ", could not save memory to host!");
        }
    }

    return errCode;
}

/**
 * Save memory on target to a text-based file on the host.
 *
 * @param {dssScriptEnv} DSS Scripting Environment object.
 * @param {debugSession} Debug Session object.
 * @param {parameters} String containing parameters to the actual save, with
 * format "[page],[address],[filename],[len],[io_format],[append]".
 */
function saveDatData(dssScriptEnv, debugSession, parameters)
{
    var errCode = 0;

    matchResult = parameters.match(/([0-4]|65535),(\w+),(.+),(\w+),([1-5]),(true|false)/);

    if ((matchResult == null))
    {
        dssScriptEnv.traceWrite("--mem_save_dat parameters: " + parameters +
				" option are invalid! see loadti --help for parameter specification");
        errCode = 1;
    }
	else
	{
        var nPage = parseInt(RegExp.$1);
        var nAddress = parseInt(RegExp.$2);
        var sFilename = RegExp.$3;
        var nLength = parseInt(RegExp.$4);
        var nIOFormat = parseInt(RegExp.$5);
        var bAppend = false;

        if (RegExp.$6 == "true")
        {
            bAppend = true;
        }

        try
		{
            debugSession.memory.saveData(nPage, nAddress, sFilename, nLength, nIOFormat, bAppend);
        }
		catch (ex)
		{
			errCode = getErrorCode(ex);
            dssScriptEnv.traceWrite("Error code #" + errCode + ", could not save memory to host!");
        }
    }

    return errCode;
}
