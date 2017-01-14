<?xml version="1.0" encoding="UTF-8"?>
<java version="1.5.0_14" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\TexasInstruments\CCS4.2_1030\ccsv4\dvt\DataStruct\solutions</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.Tap"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.analysis.DataStructureAnalyzer"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.Tap"> 
          <void method="connectOutput">
           <object class="com.ti.dvt.datamodel.core.UnlimitedBuffer">
            <void property="fileName"> 
             <string>C:\Eclipse_CCEHead2\workspace_run\.metadata\.plugins\com.ti.dvt.datamodel\temp\166263_null.dat</string> 
            </void> 
            <void property="name"> 
             <string>UnlimitedBuffer</string> 
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
        <void property="XMLconfigFile"> 
         <string>config/dataStructureTranslate.xml</string>
        </void> 
        <void property="name"> 
         <string>FieldTranslator</string> 
        </void> 
       </object> 
      </void> 
      <void property="bucketBySymbol"> 
       <boolean>true</boolean>
      </void> 
      <void property="name"> 
       <string>DataStructureAnalyzer</string> 
      </void> 
     </object> 
    </void> 
    <void method="connectOutput"> 
     <int>1</int> 
     <object class="com.ti.dvt.datamodel.analysis.DataStructureAnalyzer"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.UnlimitedBuffer"> 
          <void property="fileName">
           <string>C:\Eclipse_CCEHead2\workspace_run\.metadata\.plugins\com.ti.dvt.datamodel\temp\3ee73b_null.dat</string> 
          </void> 
          <void property="name"> 
           <string>UnlimitedBuffer.1</string> 
          </void> 
         </object> 
        </void> 
        <void property="XMLconfigFile"> 
         <string>config/rawDataTranslate.xml</string>
        </void> 
        <void property="name"> 
         <string>FieldTranslator.1</string> 
        </void> 
       </object> 
      </void> 
      <void property="name"> 
       <string>DataStructureAnalyzer.1</string> 
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
 </object> 
</java> 
