<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.5.0_14" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\CodeComposer\CCS_5.0.1.00952\ccsv5\ccs_base_5.0.1.00039\dvt_3.1.0.201104061636\AnalysisLibrary\AnalysisFeatures\ContextAwareDuration</string> 
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
           <object class="com.ti.dvt.datamodel.analysis.prototyping.ContextAwareProfilerDataPreparator"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.Tap"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.Tap"> 
                <void method="connectOutput"> 
                 <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                  <void property="name"> 
                   <string>$Debug.VirtualBuffer.1</string> 
                  </void> 
                 </object> 
                </void> 
                <void property="flow"> 
                 <boolean>false</boolean> 
                </void> 
                <void property="name"> 
                 <string>$Debug.Tap.4</string> 
                </void> 
                <void property="numInputs"> 
                 <int>1</int> 
                </void> 
               </object> 
              </void> 
              <void method="connectOutput"> 
               <int>1</int> 
               <object class="com.ti.dvt.datamodel.analysis.ProfilerAnalyzer"> 
                <void method="connectOutput"> 
                 <object class="com.ti.dvt.datamodel.core.Tap"> 
                  <void method="connectOutput"> 
                   <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                    <void property="name"> 
                     <string>VirtualBuffer.2</string> 
                    </void> 
                   </object> 
                  </void> 
                  <void method="connectOutput"> 
                   <int>1</int> 
                   <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                    <void property="dataField"> 
                     <string>Incl Count, Excl Count</string> 
                    </void> 
                    <void property="keyField"> 
                     <string>Name</string> 
                    </void> 
                    <void property="name"> 
                     <string>CountAnalyser.1</string> 
                    </void> 
                    <void property="outputPercent"> 
                     <boolean>true</boolean> 
                    </void> 
                    <void property="partialField"> 
                     <string>Partial</string> 
                    </void> 
                   </object> 
                  </void> 
                  <void property="filter"> 
                   <string>!(Name like &quot;.*Unknown.*&quot;)&amp;&amp;(Partial == 0)</string> 
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
                <void property="1_StartProfile"> 
                 <string>,(Event==&quot;Start&quot;)</string> 
                </void> 
                <void property="2_HoldExclCount"> 
                 <string>ctxt!=&lt;source&gt;,UABenchmark!=&lt;source&gt;</string> 
                </void> 
                <void property="3_ResumeExclCount"> 
                 <string>ctxt==&lt;source&gt; &amp;&amp; Event!=&quot;Stop&quot;,UABenchmark==&lt;source&gt; &amp;&amp; Event!=&quot;Stop&quot;</string> 
                </void> 
                <void property="4_EndProfile"> 
                 <string>,(Event==&quot;Stop&quot;)</string> 
                </void> 
                <void property="clearPreviousExpression"> 
                 <string>(Flush == 1)</string> 
                </void> 
                <void property="hierarchalProfile"> 
                 <boolean>true</boolean> 
                </void> 
                <void property="individualProfile"> 
                 <boolean>false</boolean> 
                </void> 
                <void property="name"> 
                 <string>ProfilerAnalyzer.1</string> 
                </void> 
                <void property="separateCategoryFilters"> 
                 <string>(interrupt != &quot;1&quot;)</string> 
                </void> 
                <void property="separateCategoryNames"> 
                 <string>Interrupt</string> 
                </void> 
                <void property="sourceKeyFields"> 
                 <string>ctxt, UABenchmark</string> 
                </void> 
                <void property="timeField"> 
                 <string>Time</string> 
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
            <void property="dataField"> 
             <string>Data1</string> 
            </void> 
            <void property="name"> 
             <string>ContextAwareProfilerDataPreparator</string> 
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
         <string>(Logger != &quot;LOST&quot;)</string> 
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
