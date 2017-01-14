<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_22" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\snapshots\svn\dvt\trunk\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\PMIAnalysis</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.Tap"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.Tap"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.analysis.prototyping2.PMIAnalyzer"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.Tap"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                <void property="name"> 
                 <string>PMI CMI Log</string> 
                </void> 
               </object> 
              </void> 
              <void method="connectOutput"> 
               <int>1</int> 
               <object class="com.ti.dvt.datamodel.analysis.prototyping2.PMIProfilerBuffer"> 
                <void property="name"> 
                 <string>PMI Profile</string> 
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
            <void property="name"> 
             <string>PMIAnalyzer</string> 
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
        <void property="flow"> 
         <boolean>false</boolean> 
        </void> 
        <void property="name"> 
         <string>Tap.Filter</string> 
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
     <string>pmi_out_sample.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
