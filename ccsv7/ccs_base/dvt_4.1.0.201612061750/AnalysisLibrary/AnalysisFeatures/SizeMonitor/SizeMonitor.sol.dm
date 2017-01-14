<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.5.0_14" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\GForge\trunk\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\SizeMonitor</string> 
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
           <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.analysis.prototyping.SequenceGenerator"> 
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
                     <string>FreeSize</string> 
                    </void> 
                    <void property="keyField"> 
                     <string>MasterHeap</string> 
                    </void> 
                    <void property="name"> 
                     <string>CountAnalyser</string> 
                    </void> 
                   </object> 
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
                <void property="keyField"> 
                 <string>MasterHeap</string> 
                </void> 
                <void property="name"> 
                 <string>SequenceGenerator</string> 
                </void> 
               </object> 
              </void> 
              <void property="XMLconfigFile"> 
               <string>config\ReadAsInteger.xml</string> 
              </void> 
              <void property="name"> 
               <string>FieldTranslator.2</string> 
              </void> 
             </object> 
            </void> 
            <void property="XMLconfigFile"> 
             <string>config\ConvertToHex.xml</string> 
            </void> 
            <void property="name"> 
             <string>FieldTranslator.1</string> 
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
         <string>(Event == &quot;UIAStatistic_freeBytes&quot;)</string> 
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
     <string>data.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
