<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_34" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\Gforge\trunk\dvt_resources\platform\AnalysisLibrary\DataProviders\UiaLogViewer</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.uia.dp.UIALogSource"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.uia.dp.UIAPreprocessor"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.Tap"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.core.Tap"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
              <void property="name"> 
               <string>LogView</string> 
              </void> 
             </object> 
            </void> 
            <void property="flow"> 
             <boolean>false</boolean> 
            </void> 
            <void property="name"> 
             <string>BufferFlowCntrol</string> 
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
           <string>$HookIn</string> 
          </void> 
          <void property="numInputs"> 
           <int>1</int> 
          </void> 
         </object> 
        </void> 
        <void property="name"> 
         <string>UIAPreprocessor</string> 
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
     <string>UIALogSource</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
