<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_34" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\Gforge\trunk\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\LogicAnalyzer</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.Tap"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.rta.GroupBy"> 
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
             <string>config\CreateEventSourceName.xml</string> 
            </void> 
            <void property="name"> 
             <string>Create Event Source Name</string> 
            </void> 
           </object> 
          </void> 
          <void property="addFieldName"> 
           <boolean>false</boolean> 
          </void> 
          <void property="groupByFieldName"> 
           <string>DataToString</string> 
          </void> 
          <void property="name"> 
           <string>GroupBy</string> 
          </void> 
          <void property="orderBy"> 
           <string>Data</string> 
          </void> 
         </object> 
        </void> 
        <void method="connectOutput"> 
         <int>1</int> 
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
