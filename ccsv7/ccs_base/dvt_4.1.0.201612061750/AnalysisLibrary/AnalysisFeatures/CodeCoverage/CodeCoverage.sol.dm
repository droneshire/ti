<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_29" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\scm\svn\trunk03\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\CodeCoverage</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.analysis.CodeCoveragePCBasedCounting"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
          <void property="name"> 
           <string>Line Coverage</string> 
          </void> 
         </object> 
        </void> 
        <void method="connectOutput"> 
         <int>1</int> 
         <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
          <void property="name"> 
           <string>Function Coverage</string> 
          </void> 
         </object> 
        </void> 
        <void method="connectOutput"> 
         <int>2</int> 
         <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
          <void property="name"> 
           <string>File Coverage</string> 
          </void> 
         </object> 
        </void> 
        <void method="connectOutput"> 
         <int>3</int> 
         <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
          <void property="name"> 
           <string>Instruction Coverage</string> 
          </void> 
         </object> 
        </void> 
        <void property="name"> 
         <string>CodeCoveragePCBasedCounting</string> 
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
     <string>data\codeCoverageData.csv</string> 
    </void> 
    <void property="name"> 
     <string>CSVFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
