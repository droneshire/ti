<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.5.0_14" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\CodeComposer\CCS_5.1.0.09000_2\ccsv5\ccs_base\dvt_3.1.0.201110191212\AnalysisLibrary\AnalysisFeatures\Compare</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
        <void property="name"> 
         <string>$Debug.VirtualBuffer</string> 
        </void> 
       </object> 
      </void> 
      <void method="connectOutput"> 
       <int>1</int> 
       <object id="CompareDataPreparator0" class="com.ti.dvt.datamodel.analysis.prototyping.CompareDataPreparator"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
          <void property="name"> 
           <string>VirtualBuffer.1</string> 
          </void> 
         </object> 
        </void> 
        <void property="compareBasedOnKey"> 
         <boolean>true</boolean> 
        </void> 
        <void property="keyField"> 
         <string>Name</string> 
        </void> 
        <void property="name"> 
         <string>CompareDataPreparator</string> 
        </void> 
        <void property="numInputs"> 
         <int>2</int> 
        </void> 
        <void property="subsetFields"> 
         <string>Excl Count</string> 
        </void> 
       </object> 
      </void> 
      <void property="flow"> 
       <boolean>false</boolean> 
      </void> 
      <void property="name"> 
       <string>Tap</string> 
      </void> 
      <void property="numInputs"> 
       <int>1</int> 
      </void> 
     </object> 
    </void> 
    <void property="fileName"> 
     <string>test_Log.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <int>0</int> 
       <object idref="CompareDataPreparator0"/> 
       <int>1</int> 
      </void> 
      <void method="connectOutput"> 
       <int>1</int> 
       <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
        <void property="name"> 
         <string>$Debug.VirtualBuffer.2</string> 
        </void> 
       </object> 
      </void> 
      <void property="flow"> 
       <boolean>false</boolean> 
      </void> 
      <void property="name"> 
       <string>Tap.1</string> 
      </void> 
      <void property="numInputs"> 
       <int>1</int> 
      </void> 
     </object> 
    </void> 
    <void property="fileName"> 
     <string>test_GoldenLog.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader.1</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
