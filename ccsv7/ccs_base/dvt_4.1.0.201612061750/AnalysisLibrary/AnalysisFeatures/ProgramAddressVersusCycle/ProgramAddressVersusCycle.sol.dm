<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_29" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\scm\svn\branches\ccstudio5.5\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\ProgramAddressVersusCycle</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
          <void property="name"> 
           <string>Program Address vs Cycle</string> 
          </void> 
         </object> 
        </void> 
        <void property="XMLconfigFile"> 
         <string>Translator2.xml</string> 
        </void> 
        <void property="name"> 
         <string>FieldTranslator</string> 
        </void> 
       </object> 
      </void> 
      <void property="flow"> 
       <boolean>false</boolean> 
      </void> 
      <void property="name"> 
       <string>$Input</string> 
      </void> 
      <void property="numInputs"> 
       <int>1</int> 
      </void> 
     </object> 
    </void> 
    <void property="fileName"> 
     <string>data\pcVsCycleData.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
