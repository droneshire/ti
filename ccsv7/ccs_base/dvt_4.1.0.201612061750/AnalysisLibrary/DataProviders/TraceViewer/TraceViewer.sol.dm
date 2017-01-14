<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_35" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void method="addSource"> 
   <object class="com.ti.dvt.xds560trace.TraceDataSource"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.SymbolicTranslator"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.proxybuffer.ProxyBuffer"> 
        <void property="name"> 
         <string>Trace Viewer</string> 
        </void> 
       </object> 
      </void> 
      <void property="01_Symbol"> 
       <boolean>false</boolean> 
      </void> 
      <void property="01_SymbolFiles"> 
       <string></string> 
      </void> 
      <void property="02_Filename"> 
       <boolean>true</boolean> 
      </void> 
      <void property="03_Function"> 
       <boolean>true</boolean> 
      </void> 
      <void property="03_SourcePath"> 
       <string></string> 
      </void> 
      <void property="04_LineNumber"> 
       <boolean>true</boolean> 
      </void> 
      <void property="06_StartAddress"> 
       <boolean>true</boolean> 
      </void> 
      <void property="07_EndAddress"> 
       <boolean>true</boolean> 
      </void> 
      <void property="08_Source"> 
       <boolean>true</boolean> 
      </void> 
      <void property="09_Disassembly"> 
       <boolean>true</boolean> 
      </void> 
      <void property="13_FullSignature"> 
       <boolean>true</boolean> 
      </void> 
      <void property="15_FunctionStart"> 
       <boolean>true</boolean> 
      </void> 
      <void property="addressField"> 
       <string>Program_Address</string> 
      </void> 
      <void property="loadAddressField"> 
       <string>Load_Address</string> 
      </void> 
      <void property="name"> 
       <string>Symbols</string> 
      </void> 
      <void property="passthroughAllFields"> 
       <boolean>true</boolean> 
      </void> 
     </object> 
    </void> 
    <void property="name"> 
     <string>Trace Data Source</string> 
    </void> 
   </object> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void property="name"> 
     <string>Trace CSV File Reader</string> 
    </void> 
   </object> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
    <void property="name"> 
     <string>VirtualBuffer</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
