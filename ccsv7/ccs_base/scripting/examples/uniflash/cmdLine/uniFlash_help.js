/**
 * Print help to console.
 */
function printHelp()
{
	print(
		"Usage: \n uniflash [UTILITY] [VERBOSE] [CONFIG] [CORE] [SETTINGS] [OPERATION/PROGRAM] \n\n" +
		"[UTILITY]: \n" +
		" -log <logFilePath> \n" +
		" -verbose [0/1] \n" +
		" -mode <modeID> \n" +
		" -programStatusOutput <fileToOutput> <successStr> <failStr> \n\n" +
		"[CONFIG]: \n" +
		" -ccxml <pathToExistingCCXML> \n" +
		" -createConfig <nameOfConnection> <nameOfDevice> <savePath> \n\n" +
		"[CORE]: \n" +
		" -listCores \n" +
		" -core <nameOfCore> \n\n" +
		"[SETTINGS]: \n" +
		" -viewOptions \n" +
		" -setOptions <OptID1>=<Value1> <OptID2>=<Value2> ... <OptIDn>=<Valuen>\n" +
		" -loadSettings <pathToSessionFile> \n\n" +
		"[OPERATION/PROGRAM]: \n" +
		" -listOperations \n" +
		" -operation <opCode1> ... <opCodeN> \n" +
		" -program <program1> ... <programN> \n" +
		" -programBin <program1> <address1> ... <programN> <addressN> \n" +
		" -verify <program1> ... <programN> \n" +
		" -verifyBin <program1> <address1> ... <programN> <addressN> \n" +
		" -export <fileType> <startAddr> <lengthInWords> <filePath> \n" +
		" -exportMulti <numSections> <startAddr1> <lengthInWords1> ... <startAddrN> <lengthInWordsN> <filePath> \n" +
		" -targetOp <targetOp> \n\n" +
		"* Please read the included uniFlash_ReadMe.txt file for more information on each available option\n"
	)
}
