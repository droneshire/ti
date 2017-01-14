<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_35" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>C:\GForgeSVN\dvt\branches\ccstudio5.5\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\FunctionProfiler</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.CSVFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.Tap"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.Tap"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.Tap"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.core.Tap"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.analysis.ProfilerAnalyzer"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.Tap"> 
                <void method="connectOutput"> 
                 <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
                  <void method="connectOutput"> 
                   <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                    <void property="dataField"> 
                     <string>Excl, Incl</string> 
                    </void> 
                    <void property="fieldNameForCounts"> 
                     <string>Calls</string> 
                    </void> 
                    <void property="keyField"> 
                     <string>Function</string> 
                    </void> 
                    <void property="name"> 
                     <string>CPU Cycles Counter</string> 
                    </void> 
                    <void property="outputPercent"> 
                     <boolean>true</boolean> 
                    </void> 
                    <void property="partialField"> 
                     <string>Partial Profile</string> 
                    </void> 
                   </object> 
                  </void> 
                  <void property="XMLconfigFile"> 
                   <string>config\TranslateForCycleCounter.xml</string> 
                  </void> 
                  <void property="name"> 
                   <string>Rename Fields</string> 
                  </void> 
                 </object> 
                </void> 
                <void method="connectOutput"> 
                 <int>1</int> 
                 <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
                  <void method="connectOutput"> 
                   <object id="RTFieldLookup0" class="com.ti.dvt.datamodel.analysis.RTFieldLookup"> 
                    <void method="connectOutput"> 
                     <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                      <void property="name"> 
                       <string>VirtualBuffer</string> 
                      </void> 
                     </object> 
                    </void> 
                    <void property="inFieldName"> 
                     <string>Function</string> 
                    </void> 
                    <void property="inFieldName2"> 
                     <string>Function</string> 
                    </void> 
                    <void property="inFieldName3"> 
                     <string>Function</string> 
                    </void> 
                    <void property="lookupInFieldName"> 
                     <string>Function</string> 
                    </void> 
                    <void property="lookupInFieldName2"> 
                     <string>Function</string> 
                    </void> 
                    <void property="lookupInFieldName3"> 
                     <string>Function</string> 
                    </void> 
                    <void property="lookupOutFieldName"> 
                     <string>Filename</string> 
                    </void> 
                    <void property="lookupOutFieldName2"> 
                     <string>Start Address</string> 
                    </void> 
                    <void property="lookupOutFieldName3"> 
                     <string>End Address</string> 
                    </void> 
                    <void property="name"> 
                     <string>RTFieldLookup</string> 
                    </void> 
                   </object> 
                  </void> 
                  <void property="XMLconfigFile"> 
                   <string>config\TranslateForPerCallFunctionProfile.xml</string> 
                  </void> 
                  <void property="name"> 
                   <string>Rename Fields.2</string> 
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
                <void property="numOutputs"> 
                 <int>3</int> 
                </void> 
               </object> 
              </void> 
              <void property="1_StartProfile"> 
               <string> Load_Address == Start_Address</string> 
              </void> 
              <void property="2_HoldExclCount"> 
               <string>&lt;stack&gt;</string> 
              </void> 
              <void property="3_ResumeExclCount"> 
               <string>&lt;stack&gt;</string> 
              </void> 
              <void property="4_EndProfile"> 
               <string>&lt;stack&gt;</string> 
              </void> 
              <void property="auxdataField"> 
               <string>Start Address</string> 
              </void> 
              <void property="name"> 
               <string>CPU Cycles ProfilerAnalyzer</string> 
              </void> 
              <void property="sourceKeyFields"> 
               <string>Function</string> 
              </void> 
              <void property="timeField"> 
               <string>Cycle</string> 
              </void> 
             </object> 
            </void> 
            <void method="connectOutput"> 
             <int>1</int> 
             <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
                <void method="connectOutput"> 
                 <object class="com.ti.dvt.datamodel.core.Tap"> 
                  <void method="connectOutput"> 
                   <object class="com.ti.dvt.datamodel.analysis.ProfilerAnalyzer"> 
                    <void method="connectOutput"> 
                     <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
                      <void method="connectOutput"> 
                       <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                        <void property="dataField"> 
                         <string>Excl,Incl</string> 
                        </void> 
                        <void property="fieldNameForCounts"> 
                         <string>Calls</string> 
                        </void> 
                        <void property="keyField"> 
                         <string>Function</string> 
                        </void> 
                        <void property="name"> 
                         <string>Pipeline Stalls Counter</string> 
                        </void> 
                        <void property="outputPercent"> 
                         <boolean>true</boolean> 
                        </void> 
                        <void property="partialField"> 
                         <string>Partial Profile</string> 
                        </void> 
                       </object> 
                      </void> 
                      <void property="XMLconfigFile"> 
                       <string>config\TranslateForPipeStallCounter.xml</string> 
                      </void> 
                      <void property="name"> 
                       <string>Rename Fields.1</string> 
                      </void> 
                     </object> 
                    </void> 
                    <void property="1_StartProfile"> 
                     <string>Load_Address == Start_Address</string> 
                    </void> 
                    <void property="2_HoldExclCount"> 
                     <string>&lt;stack&gt;</string> 
                    </void> 
                    <void property="3_ResumeExclCount"> 
                     <string>&lt;stack&gt;</string> 
                    </void> 
                    <void property="4_EndProfile"> 
                     <string>&lt;stack&gt;</string> 
                    </void> 
                    <void property="auxdataField"> 
                     <string>Start Address</string> 
                    </void> 
                    <void property="name"> 
                     <string>Pipeline Stall ProfilerAnalyzer</string> 
                    </void> 
                    <void property="sourceKeyFields"> 
                     <string>Function</string> 
                    </void> 
                    <void property="timeField"> 
                     <string>PipestallTime</string> 
                    </void> 
                   </object> 
                  </void> 
                  <void property="filter"> 
                   <string>(Function!=null)</string> 
                  </void> 
                  <void property="flow"> 
                   <boolean>false</boolean> 
                  </void> 
                  <void property="name"> 
                   <string>(Function!=null)</string> 
                  </void> 
                  <void property="numInputs"> 
                   <int>1</int> 
                  </void> 
                  <void property="numOutputs"> 
                   <int>2</int> 
                  </void> 
                 </object> 
                </void> 
                <void property="XMLconfigFile"> 
                 <string>config\accumulator.xml</string> 
                </void> 
                <void property="name"> 
                 <string>Accumulator</string> 
                </void> 
                <void property="passthroughAllFields"> 
                 <boolean>true</boolean> 
                </void> 
               </object> 
              </void> 
              <void property="XMLconfigFile"> 
               <string>config\delta.xml</string> 
              </void> 
              <void property="name"> 
               <string>Delta</string> 
              </void> 
              <void property="passthroughAllFields"> 
               <boolean>true</boolean> 
              </void> 
             </object> 
            </void> 
            <void method="connectOutput"> 
             <int>2</int> 
             <object class="com.ti.dvt.xds560trace.TraceEventDecoder"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.Tap"> 
                <void method="connectOutput"> 
                 <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                  <void property="dataField"> 
                   <string>Memory Event 1,Memory Event 2,Memory Event 3,Memory Event 4</string> 
                  </void> 
                  <void property="dataFieldLabelList"> 
                   <string></string> 
                  </void> 
                  <void property="displayTotalAs"> 
                   <string>Integer</string> 
                  </void> 
                  <void property="fieldNameForCounts"> 
                   <string>&lt;N/A&gt;</string> 
                  </void> 
                  <void property="keyField"> 
                   <string>Function</string> 
                  </void> 
                  <void property="name"> 
                   <string>Memory Events Counter</string> 
                  </void> 
                  <void property="showKeyAndTotalOnly"> 
                   <boolean>true</boolean> 
                  </void> 
                 </object> 
                </void> 
                <void method="connectOutput"> 
                 <int>1</int> 
                 <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                  <void property="dataField"> 
                   <string>Stall Cycle Data 1,Stall Cycle Data 2,Stall Cycle Data 3,Stall Cycle Data 4</string> 
                  </void> 
                  <void property="dataFieldLabelList"> 
                   <string>Stall1,Stall 2,Stall 3,Stall 4</string> 
                  </void> 
                  <void property="displayTotalAs"> 
                   <string>Integer</string> 
                  </void> 
                  <void property="fieldNameForCounts"> 
                   <string>&lt;N/A&gt;</string> 
                  </void> 
                  <void property="keyField"> 
                   <string>Function</string> 
                  </void> 
                  <void property="name"> 
                   <string>Last Stall Standing Counter</string> 
                  </void> 
                  <void property="showKeyAndTotalOnly"> 
                   <boolean>true</boolean> 
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
               <string>TraceEventDecoder</string> 
              </void> 
             </object> 
            </void> 
            <void property="filter"> 
             <string>(Function != null) &amp;&amp; (Delta_Cycles&gt;=0)</string> 
            </void> 
            <void property="flow"> 
             <boolean>false</boolean> 
            </void> 
            <void property="name"> 
             <string>(Function != null) &amp;&amp; (Delta_Cycles&gt;=0)</string> 
            </void> 
            <void property="numInputs"> 
             <int>1</int> 
            </void> 
           </object> 
          </void> 
          <void method="connectOutput"> 
           <int>1</int> 
           <object idref="RTFieldLookup0"/> 
           <int>1</int> 
          </void> 
          <void property="flow"> 
           <boolean>false</boolean> 
          </void> 
          <void property="name"> 
           <string>Profile Tap</string> 
          </void> 
          <void property="numInputs"> 
           <int>1</int> 
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
