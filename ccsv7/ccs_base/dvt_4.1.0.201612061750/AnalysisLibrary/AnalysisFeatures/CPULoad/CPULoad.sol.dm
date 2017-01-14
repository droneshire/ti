<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_34" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\Gforge\trunk\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\CPULoad</string> 
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
         <object class="com.ti.dvt.datamodel.core.Tap"> 
          <void method="connectOutput"> 
           <int>1</int> 
           <object class="com.ti.dvt.datamodel.analysis.prototyping.BasicDataLossHandler"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.analysis.prototyping.LoadAccuracyDeterminer"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.Tap"> 
                <void method="connectOutput"> 
                 <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
                  <void method="connectOutput"> 
                   <object class="com.ti.dvt.datamodel.core.DataTypeAdapter"> 
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
                         <string>Load</string> 
                        </void> 
                        <void property="keyField"> 
                         <string>Master</string> 
                        </void> 
                        <void property="name"> 
                         <string>Summary</string> 
                        </void> 
                       </object> 
                      </void> 
                      <void property="filter"> 
                       <string>Source == &quot;CPU&quot;</string> 
                      </void> 
                      <void property="flow"> 
                       <boolean>false</boolean> 
                      </void> 
                      <void property="name"> 
                       <string>Tap.2</string> 
                      </void> 
                      <void property="numInputs"> 
                       <int>1</int> 
                      </void> 
                     </object> 
                    </void> 
                    <void property="name"> 
                     <string>DataTypeAdapter</string> 
                    </void> 
                    <void property="typeConvert"> 
                     <string>Load:float</string> 
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
                 <string>Event == &quot;Load&quot;</string> 
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
               <string>LoadAccuracyDeterminer</string> 
              </void> 
             </object> 
            </void> 
            <void property="eventHandled"> 
             <string>Load</string> 
            </void> 
            <void property="name"> 
             <string>BasicDataLossHandler</string> 
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
