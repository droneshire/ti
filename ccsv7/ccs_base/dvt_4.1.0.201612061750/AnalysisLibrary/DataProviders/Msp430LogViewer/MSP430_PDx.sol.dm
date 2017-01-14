<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_38" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\Snapshots\svn\dvt\branches\ccstudio5.5\dvt_resources\platform\AnalysisLibrary\DataProviders\Msp430LogViewer</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.uia.dp.UIALogSource"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.analysis.prototyping2.DummyMSPPowerAnalyzer"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.Tap"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.core.Tap"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.Tap"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                <void property="name"> 
                 <string>bLogMSP</string> 
                </void> 
               </object> 
              </void> 
              <void property="flow"> 
               <boolean>false</boolean> 
              </void> 
              <void property="name"> 
               <string>Tap.1a</string> 
              </void> 
              <void property="numInputs"> 
               <int>1</int> 
              </void> 
             </object> 
            </void> 
            <void method="connectOutput"> 
             <int>1</int> 
             <object class="com.ti.dvt.datamodel.core.Tap"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                <void property="name"> 
                 <string>bLogMSPb</string> 
                </void> 
               </object> 
              </void> 
              <void property="filter"> 
               <string>DSR != NAN</string> 
              </void> 
              <void property="flow"> 
               <boolean>false</boolean> 
              </void> 
              <void property="name"> 
               <string>Tap.1b</string> 
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
             <string>BufferFlowControl</string> 
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
        <void method="connectOutput"> 
         <int>1</int> 
         <object class="com.ti.dvt.datamodel.core.Tap"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.core.Tap"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
              <void property="name"> 
               <string>bLogMSP2</string> 
              </void> 
             </object> 
            </void> 
            <void property="flow"> 
             <boolean>false</boolean> 
            </void> 
            <void property="name"> 
             <string>Tap.2a</string> 
            </void> 
            <void property="numInputs"> 
             <int>1</int> 
            </void> 
           </object> 
          </void> 
          <void method="connectOutput"> 
           <int>1</int> 
           <object class="com.ti.dvt.datamodel.core.Tap"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
              <void property="name"> 
               <string>bLogMSP2b</string> 
              </void> 
             </object> 
            </void> 
            <void property="flow"> 
             <boolean>false</boolean> 
            </void> 
            <void property="name"> 
             <string>Tap.2b</string> 
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
           <string>BufferFlowControl2</string> 
          </void> 
          <void property="numInputs"> 
           <int>1</int> 
          </void> 
         </object> 
        </void> 
        <void property="name"> 
         <string>MSPPwrPreprocessor</string> 
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
    <void property="uiaSessionConfigFile"> 
     <string>MSP430_PD.usmxml</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
