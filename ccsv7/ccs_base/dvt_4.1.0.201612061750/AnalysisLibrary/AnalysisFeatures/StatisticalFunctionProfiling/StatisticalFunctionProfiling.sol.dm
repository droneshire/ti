<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_35" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\GForgeSVN\dvt\trunk\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\StatisticalFunctionProfiling</string> 
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
           <string>$Debug.VirtualBuffer</string> 
          </void> 
         </object> 
        </void> 
        <void method="connectOutput"> 
         <int>1</int> 
         <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
          <void property="fieldNameForCounts"> 
           <string>Times Encountered</string> 
          </void> 
          <void property="fieldNameForPercents"> 
           <string></string> 
          </void> 
          <void property="keyField"> 
           <string>Function</string> 
          </void> 
          <void property="keyPercentageFieldName"> 
           <string>FunctionPercentage</string> 
          </void> 
          <void property="name"> 
           <string>Statistical Function Profiling</string> 
          </void> 
          <void property="passthroughFields"> 
           <string>Filename</string> 
          </void> 
          <void property="showKeyPercentage"> 
           <boolean>true</boolean> 
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
     <string>data/data.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
