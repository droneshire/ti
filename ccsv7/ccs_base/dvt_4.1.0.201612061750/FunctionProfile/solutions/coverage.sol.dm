<?xml version="1.0" encoding="UTF-8"?>
<java version="1.5.0_14" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.UnlimitedBuffer"> 
    <void property="fileName"> 
     <string>C:\Program Files\Texas Instruments\CC Studio v5 ROV5\eclipse\tmp\1aa0b72_null.dat</string> 
    </void> 
    <void property="name"> 
     <string>UnlimitedBuffer</string> 
    </void> 
   </object> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.Tap"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.PCCountAnalyser"> 
        <void property="cycleCPUFieldName"> 
         <string></string> 
        </void> 
        <void property="instructionDecodeCountFieldName"> 
         <string></string> 
        </void> 
        <void property="name"> 
         <string>PCCountAnalyser</string> 
        </void> 
        <void property="predicateFalseCountFieldName"> 
         <string></string> 
        </void> 
       </object> 
      </void> 
      <void property="XMLconfigFile"> 
       <string>config/TimeAccumulatorCoverage.xml</string> 
      </void> 
      <void property="name"> 
       <string>FieldTranslator</string> 
      </void> 
     </object> 
    </void> 
    <void property="flow"> 
     <boolean>false</boolean> 
    </void> 
    <void property="name"> 
     <string>Tap.DataSource</string> 
    </void> 
    <void property="numInputs"> 
     <int>1</int> 
    </void> 
   </object> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.LineCountAnalyser"> 
    <void property="name"> 
     <string>LineCountAnalyser</string> 
    </void> 
   </object> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.SymbolicTranslator"> 
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
    <void property="04_LineNumber"> 
     <boolean>true</boolean>
    </void>
    <void property="13_FullSignature">
          <boolean>true</boolean>
    </void>
    <void property="addressField">
     <string>StartAddress</string> 
    </void>
    <void property="name">
     <string>SymbolicTranslator</string> 
    </void> 
    <void property="passthroughAllFields"> 
     <boolean>true</boolean> 
    </void> 
   </object> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.FunctionCountAnalyser"> 
    <void property="name"> 
     <string>FunctionCountAnalyser</string> 
    </void> 
   </object> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
    <void property="XMLconfigFile"> 
     <string>config/coverageFilter.xml</string> 
    </void> 
    <void property="name"> 
     <string>FieldTranslator.1</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
