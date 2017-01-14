<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_34" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\Gforge\trunk\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\InterruptAnalyzerITM</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.analysis.prototyping.InterruptLogDecoder"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.Tap"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.analysis.ProfilerAnalyzer"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.Tap"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                <void property="name"> 
                 <string>Detail</string> 
                </void> 
               </object> 
              </void> 
              <void method="connectOutput"> 
               <int>1</int> 
               <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                <void property="dataField"> 
                 <string>Incl Count, Excl Count</string> 
                </void> 
                <void property="keyField"> 
                 <string>Name</string> 
                </void> 
                <void property="name"> 
                 <string>Summary</string> 
                </void> 
               </object> 
              </void> 
              <void property="filter"> 
               <string>!((Name == &quot;Main thread&quot;) || (Name == &quot;0&quot;))</string> 
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
            <void property="1_StartProfile"> 
             <string>(Event == &quot;Enter&quot;)</string> 
            </void> 
            <void property="2_HoldExclCount"> 
             <string>(Event == &quot;Preempted&quot;)</string> 
            </void> 
            <void property="3_ResumeExclCount"> 
             <string>(Event == &quot;Resume&quot;)</string> 
            </void> 
            <void property="4_EndProfile"> 
             <string>(Event == &quot;Exit&quot;)</string> 
            </void> 
            <void property="auxdataField"> 
             <string>Start Address</string> 
            </void> 
            <void property="name"> 
             <string>ProfilerAnalyzer.1</string> 
            </void> 
            <void property="sourceKeyFields"> 
             <string>Data Message</string> 
            </void> 
            <void property="timeField"> 
             <string>Time</string> 
            </void> 
           </object> 
          </void> 
          <void method="connectOutput"> 
           <int>1</int> 
           <object class="com.ti.dvt.datamodel.core.Tap"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                <void property="name"> 
                 <string>Graph</string> 
                </void> 
               </object> 
              </void> 
              <void property="XMLconfigFile"> 
               <string>config\translate.xml</string> 
              </void> 
              <void property="name"> 
               <string>FieldTranslator</string> 
              </void> 
             </object> 
            </void> 
            <void property="filter"> 
             <string>!((Data_Message == &quot;Main thread&quot;) || (Data_Message == &quot;0&quot;))</string> 
            </void> 
            <void property="flow"> 
             <boolean>false</boolean> 
            </void> 
            <void property="name"> 
             <string>Tap.6</string> 
            </void> 
            <void property="numInputs"> 
             <int>1</int> 
            </void> 
           </object> 
          </void> 
          <void method="connectOutput"> 
           <int>2</int> 
           <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
            <void property="name"> 
             <string>$Debug.VirtualBuffer</string> 
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
        <void property="name"> 
         <string>InterruptLogDecoder</string> 
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
     <string>data.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
