<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.5.0_14" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\GForge\trunk\dvt_resources\platform\AnalysisLibrary\DataProviders\CsvViewer</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.Tap"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
          <void property="name"> 
           <string>VirtualBuffer</string> 
          </void> 
         </object> 
        </void> 
        <void property="flow"> 
         <boolean>false</boolean> 
        </void> 
        <void property="name"> 
         <string>BufferFlowCntrl</string> 
        </void> 
        <void property="numInputs"> 
         <int>1</int> 
        </void> 
       </object> 
      </void> 
      <void property="flow"> 
       <boolean>false</boolean> 
      </void> 
      <void property="name"> 
       <string>$HookIn</string> 
      </void> 
      <void property="numInputs"> 
       <int>1</int> 
      </void> 
     </object> 
    </void> 
    <void property="fileName"> 
     <string>dvtFormat.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
