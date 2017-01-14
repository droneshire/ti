<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_34" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\Gforge\trunk\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\TaskLoad</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.Tap"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.UnlimitedBuffer"> 
          <void property="fileName"> 
           <string>C:\temp\crap\.metadata\.plugins\com.ti.dvt.datamodel\temp\1972359_null.dat</string> 
          </void> 
          <void property="name"> 
           <string>$Debug.UnlimitedBuffer</string> 
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
                       <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                        <void property="dataField"> 
                         <string>Load</string> 
                        </void> 
                        <void property="fieldNameForPercents"> 
                         <string>Overall</string> 
                        </void> 
                        <void property="keyField"> 
                         <string>Source</string> 
                        </void> 
                        <void property="keyValuesNotInPercent"> 
                         <string>CPU</string> 
                        </void> 
                        <void property="name"> 
                         <string>Summary</string> 
                        </void> 
                        <void property="outputPercent"> 
                         <boolean>true</boolean> 
                        </void> 
                        <void property="partialField"> 
                         <string></string> 
                        </void> 
                       </object> 
                      </void> 
                      <void method="connectOutput"> 
                       <int>1</int> 
                       <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                        <void property="name"> 
                         <string>Detail</string> 
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
                 <string> (Event == &quot;Load&quot;)</string> 
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
          <void property="filter"> 
           <string>(Master == &quot;C64XP_A&quot;)</string> 
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
        <void property="filter"> 
         <string>((Logger != &quot;LOST&quot;)&amp;&amp;(Time != NAN))</string> 
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
