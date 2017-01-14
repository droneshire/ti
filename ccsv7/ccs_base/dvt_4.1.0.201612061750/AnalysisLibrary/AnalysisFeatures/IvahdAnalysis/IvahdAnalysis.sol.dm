<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_34" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\Gforge\ccstudio5.5\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\IvahdAnalysis</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.TextFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.Tap"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.core.Tap"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.IVAHDDecoder"> 
                <void method="connectOutput"> 
                 <object class="com.ti.dvt.datamodel.core.Tap"> 
                  <void method="connectOutput"> 
                   <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                    <void property="name"> 
                     <string>Log Table</string> 
                    </void> 
                   </object> 
                  </void> 
                  <void method="connectOutput"> 
                   <int>1</int> 
                   <object class="com.ti.dvt.datamodel.core.Tap"> 
                    <void method="connectOutput"> 
                     <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                      <void property="keyField"> 
                       <string>EventString</string> 
                      </void> 
                      <void property="name"> 
                       <string>Start Stop Counts</string> 
                      </void> 
                     </object> 
                    </void> 
                    <void method="connectOutput"> 
                     <int>2</int> 
                     <object class="com.ti.dvt.datamodel.analysis.SETAnalyzer"> 
                      <void method="connectOutput"> 
                       <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
                        <void method="connectOutput"> 
                         <object class="com.ti.dvt.datamodel.core.Tap"> 
                          <void method="connectOutput"> 
                           <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                            <void property="name"> 
                             <string>Duration vs Time</string> 
                            </void> 
                           </object> 
                          </void> 
                          <void method="connectOutput"> 
                           <int>1</int> 
                           <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                            <void property="dataField"> 
                             <string>Duration</string> 
                            </void> 
                            <void property="keyField"> 
                             <string>Source</string> 
                            </void> 
                            <void property="name"> 
                             <string>Duration per algo</string> 
                            </void> 
                           </object> 
                          </void> 
                          <void property="flow"> 
                           <boolean>false</boolean> 
                          </void> 
                          <void property="name"> 
                           <string>Tap.4</string> 
                          </void> 
                          <void property="numInputs"> 
                           <int>1</int> 
                          </void> 
                         </object> 
                        </void> 
                        <void property="XMLconfigFile"> 
                         <string>ivahd_config\TransHwaFsms.xml</string> 
                        </void> 
                        <void property="name"> 
                         <string>FieldTranslator.2</string> 
                        </void> 
                        <void property="passthroughAllFields"> 
                         <boolean>true</boolean> 
                        </void> 
                       </object> 
                      </void> 
                      <void method="connectOutput"> 
                       <int>1</int> 
                       <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                        <void property="name"> 
                         <string>Scope</string> 
                        </void> 
                       </object> 
                      </void> 
                      <void property="auxdataField"> 
                       <string>MB</string> 
                      </void> 
                      <void property="configFile"> 
                       <string>ivahd_config\HwaFsms.xml</string> 
                      </void> 
                      <void property="name"> 
                       <string>SETAnalyzer</string> 
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
                     <string>Tap.5</string> 
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
                   <string>Tap.3</string> 
                  </void> 
                  <void property="numInputs"> 
                   <int>1</int> 
                  </void> 
                 </object> 
                </void> 
                <void property="name"> 
                 <string>IVAHDDecoder</string> 
                </void> 
               </object> 
              </void> 
              <void property="XMLconfigFile"> 
               <string>ivahd_config\STMDecoder1.xml</string> 
              </void> 
              <void property="name"> 
               <string>FieldTranslator.1</string> 
              </void> 
              <void property="passthroughAllFields"> 
               <boolean>true</boolean> 
              </void> 
             </object> 
            </void> 
            <void property="filter"> 
             <string>(Event &gt;= 0) &amp;&amp; (Event &lt; 256)</string> 
            </void> 
            <void property="flow"> 
             <boolean>false</boolean> 
            </void> 
            <void property="name"> 
             <string>(Event &gt;= 0) &amp;&amp; (Event &lt; 256)</string> 
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
           <string>ivahd_config\Rename.xml</string> 
          </void> 
          <void property="name"> 
           <string>FieldTranslator</string> 
          </void> 
         </object> 
        </void> 
        <void property="filter"> 
         <string>Master_Name==&quot;SMSET&quot;</string> 
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
      <void property="XMLconfigFile"> 
       <string>ivahd_config\IVAHDDummyFields.xml</string> 
      </void> 
      <void property="name"> 
       <string>Dummy IVAHD Fields</string> 
      </void> 
     </object> 
    </void> 
    <void property="name"> 
     <string>Dummy IVAHD TextFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
