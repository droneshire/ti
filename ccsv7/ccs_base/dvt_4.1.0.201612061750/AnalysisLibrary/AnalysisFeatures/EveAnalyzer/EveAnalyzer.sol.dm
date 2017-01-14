<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_34" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\Gforge\ccstudio5.5\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\EveAnalyzer</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.Tap"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.EveDecoder"> 
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
                   <string>Segment,Overall</string> 
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
                 <string>Tap.2</string> 
                </void> 
                <void property="numInputs"> 
                 <int>1</int> 
                </void> 
               </object> 
              </void> 
              <void property="name"> 
               <string>EveDecoder</string> 
              </void> 
             </object> 
            </void> 
            <void property="XMLconfigFile"> 
             <string>eve_config\STMDecoder1.xml</string> 
            </void> 
            <void property="name"> 
             <string>FieldTranslator.1</string> 
            </void> 
           </object> 
          </void> 
          <void property="XMLconfigFile"> 
           <string>eve_config\Rename.xml</string> 
          </void> 
          <void property="name"> 
           <string>FieldTranslator</string> 
          </void> 
         </object> 
        </void> 
        <void property="filter"> 
         <string>(Master_Name like &quot;SMSET.*&quot;) &amp;&amp; (Data &gt;= 0) &amp;&amp; (Data &lt; 256)</string> 
        </void> 
        <void property="flow"> 
         <boolean>false</boolean> 
        </void> 
        <void property="name"> 
         <string>(Master_Name like &quot;SMSET.*&quot;) &amp;&amp; (Data &gt;= 0) &amp;&amp; (Data &lt; 256)</string> 
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
     <string>eve_config\eve2Example1.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
