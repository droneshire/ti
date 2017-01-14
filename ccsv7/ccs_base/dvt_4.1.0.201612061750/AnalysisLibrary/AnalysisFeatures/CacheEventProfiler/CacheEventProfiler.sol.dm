<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_35" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\GForgeSVN\dvt\trunk\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\CacheEventProfiler</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.xds560trace.TraceEventDecoder"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.Tap"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
            <void property="dataField"> 
             <string>Memory Event 1,Memory Event 2,Memory Event 3,Memory Event 4</string> 
            </void> 
            <void property="dataFieldLabelList"> 
             <string>${CacheEventNames}</string> 
            </void> 
            <void property="displayTotalAs"> 
             <string>Integer</string> 
            </void> 
            <void property="fieldNameForCounts"> 
             <string>&lt;N/A&gt;</string> 
            </void> 
            <void property="keyField"> 
             <string>Function</string> 
            </void> 
            <void property="name"> 
             <string>Cache Event Profiler</string> 
            </void> 
            <void property="passthroughFields"> 
             <string>Filename</string> 
            </void> 
            <void property="showKeyAndTotalOnly"> 
             <boolean>true</boolean> 
            </void> 
           </object> 
          </void> 
          <void property="filter"> 
           <string>(Function!=null)&amp;&amp;(Function!=&quot;&quot;)</string> 
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
        <void property="name"> 
         <string>TraceEventDecoder</string> 
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
     <string>test.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
