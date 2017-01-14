
function configure(inputFmt){

  field_count = 29;
  opNameArray = new Array(field_count);
  opTypeArray = new Array(field_count);
  
  opNameArray[0] = "Time";
  opTypeArray[0] = "ULong";
  opNameArray[1] = "Current";
  opTypeArray[1] = "UInteger";
  opNameArray[2] = "Voltage";
  opTypeArray[2] = "UInteger";
  opNameArray[3] = "DSR";
  opTypeArray[3] = "ULong";
  
  opNameArray[4] = "PC";
  opTypeArray[4] = "UInteger";
  opNameArray[5] = "LDORange";
  opTypeArray[5] = "UInteger";
  
  opNameArray[6] = "Duration";
  opTypeArray[6] = "ULong";
  opNameArray[7] = "Power";
  opTypeArray[7] = "FloatingPoint";
  opNameArray[8] = "EnergyUsage";
  opTypeArray[8] = "FloatingPoint";
  opNameArray[9] = "Energy";
  opTypeArray[9] = "FloatingPoint";
  opNameArray[10] = "Function";
  opTypeArray[10] = "Label";

  opNameArray[11] = "Mod00";
  opTypeArray[11] = "OnOffFlag";
  opNameArray[12] = "Mod01";
  opTypeArray[12] = "OnOffFlag";
  opNameArray[13] = "Mod02";
  opTypeArray[13] = "OnOffFlag";
  opNameArray[14] = "Mod03";
  opTypeArray[14] = "OnOffFlag";
  opNameArray[15] = "Mod04";
  opTypeArray[15] = "OnOffFlag";
  opNameArray[16] = "Mod05";
  opTypeArray[16] = "OnOffFlag";
  opNameArray[17] = "Mod06";
  opTypeArray[17] = "OnOffFlag";
  opNameArray[18] = "Mod07";
  opTypeArray[18] = "OnOffFlag";
  opNameArray[19] = "Mod08";
  opTypeArray[19] = "OnOffFlag";
  opNameArray[20] = "Mod09";
  opTypeArray[20] = "OnOffFlag";
  opNameArray[21] = "Mod10";
  opTypeArray[21] = "OnOffFlag";
  opNameArray[22] = "Mod11";
  opTypeArray[22] = "OnOffFlag";
  opNameArray[23] = "Mod12";
  opTypeArray[23] = "OnOffFlag";
  opNameArray[24] = "Mod13";
  opTypeArray[24] = "OnOffFlag";
  opNameArray[25] = "Mod14";
  opTypeArray[25] = "OnOffFlag";
  opNameArray[26] = "Mod15";
  opTypeArray[26] = "OnOffFlag";

  opNameArray[27] = "Reference";
  opTypeArray[27] = "FloatingPoint";
  opNameArray[28] = "EnergyRef";
  opTypeArray[28] = "FloatingPoint";

  channel_hndl = ScriptableDP.createChannel( opNameArray, opTypeArray );
}

