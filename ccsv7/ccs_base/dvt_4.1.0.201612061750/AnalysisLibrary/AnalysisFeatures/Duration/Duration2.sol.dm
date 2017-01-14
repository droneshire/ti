<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_29" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\scm\svn\trunk\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\Duration</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.Tap"> 
        <void method="connectOutput"> 
         <int>1</int> 
         <object class="com.ti.dvt.datamodel.core.Tap"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.analysis.prototyping.DurationDataPreparator"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.Tap"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                <void property="name"> 
                 <string>VirtualBuffer</string> 
                </void> 
               </object> 
              </void> 
              <void method="connectOutput"> 
               <int>1</int> 
               <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                <void property="dataField"> 
                 <string>Duration</string> 
                </void> 
                <void property="keyField"> 
                 <string>Source</string> 
                </void> 
                <void property="name"> 
                 <string>CountAnalyser</string> 
                </void> 
                <void property="outputPercent"> 
                 <boolean>true</boolean> 
                </void> 
               </object> 
              </void> 
              <void property="flow"> 
               <boolean>false</boolean> 
              </void> 
              <void property="name"> 
               <string>Tap.3</string> 
              </void> 
              <void property="numInputs"> 
               <int>1</int> 
              </void> 
             </object> 
            </void> 
            <void property="dataField"> 
             <string>Data1</string> 
            </void> 
            <void property="name"> 
             <string>DurationDataPreparator</string> 
            </void> 
           </object> 
          </void> 
          <void property="flow"> 
           <boolean>false</boolean> 
          </void> 
          <void property="name"> 
           <string>Tap.5</string> 
          </void> 
          <void property="numInputs"> 
           <int>1</int> 
          </void> 
         </object> 
        </void> 
        <void property="filter"> 
         <string>((Logger != &quot;LOST&quot;)&amp;&amp;(Time != NAN))</string> 
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
     <string>C:\Users\a0389332\Desktop\csv data files\SAlog_goodDataSet.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
