<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_29" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\scm\svn\trunk\dvt_resources\platform\CCS\dvt\solutions\CCSgraphs\SingleTime</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.ccsgraphs.CCSGraphsJtagDataSource"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.ccsgraphs.SingleDualTimeCCSGraphDecoder"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.ccsgraphs.GraphScaleDecoder"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.CircularBuffer"> 
          <void property="name"> 
           <string>CircularBuffer</string> 
          </void> 
          <void property="size"> 
           <int>200</int> 
          </void> 
         </object> 
        </void> 
        <void property="name"> 
         <string>GraphScaleDecoder</string> 
        </void> 
       </object> 
      </void> 
      <void property="blockSize1"> 
       <int>50</int> 
      </void> 
      <void property="blockSize2"> 
       <int>50</int> 
      </void> 
      <void property="name"> 
       <string>SingleDualTimeCCSGraphDecoder</string> 
      </void> 
     </object> 
    </void> 
    <void property="blockSize1"> 
     <int>50</int> 
    </void> 
    <void property="blockSize2"> 
     <int>50</int> 
    </void> 
    <void property="name"> 
     <string>CCSGraphsJtagDataSource</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
