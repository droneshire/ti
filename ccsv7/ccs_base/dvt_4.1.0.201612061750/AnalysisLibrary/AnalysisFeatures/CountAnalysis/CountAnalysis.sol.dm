<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_34" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\Gforge\trunk\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\CountAnalysis</string> 
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
         <object class="com.ti.dvt.datamodel.analysis.prototyping.BasicDataLossHandler"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.core.Tap"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.analysis.prototyping.SequenceGenerator"> 
                <void method="connectOutput"> 
                 <object class="com.ti.dvt.datamodel.core.Tap"> 
                  <void method="connectOutput"> 
                   <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                    <void property="name"> 
                     <string>Graph</string> 
                    </void> 
                   </object> 
                  </void> 
                  <void method="connectOutput"> 
                   <int>1</int> 
                   <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                    <void property="dataField"> 
                     <string>DataValue</string> 
                    </void> 
                    <void property="keyField"> 
                     <string>Source</string> 
                    </void> 
                    <void property="name"> 
                     <string>Summary</string> 
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
                <void property="keyField"> 
                 <string>Source</string> 
                </void> 
                <void property="name"> 
                 <string>SequenceGenerator</string> 
                </void> 
               </object> 
              </void> 
              <void property="XMLconfigFile"> 
               <string>config\TranslateEventToChannel.xml</string> 
              </void> 
              <void property="name"> 
               <string>FieldTranslator</string> 
              </void> 
             </object> 
            </void> 
            <void property="filter"> 
             <string>(Event == &quot;UIAEvt_intWithKey&quot;)</string> 
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
          <void property="classFieldPresent"> 
           <boolean>false</boolean> 
          </void> 
          <void property="eventHandled"> 
           <string>UIAEvt_intWithKey</string> 
          </void> 
          <void property="moduleField"> 
           <string></string> 
          </void> 
          <void property="name"> 
           <string>BasicDataLossHandler</string> 
          </void> 
         </object> 
        </void> 
        <void property="filter"> 
         <string>(Time != NAN)</string> 
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
