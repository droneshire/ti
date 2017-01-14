<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.5.0_14" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>/C:/TexasInstruments/CCS4.2_1030/ccsv4/eclipse/..\dvt\CodeGen\solutions</string> 
  </void> 
  <void method="addSource"> 
   <object class="com.ti.dvt.datamodel.core.TextFileReader"> 
    <void method="connectOutput"> 
     <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
      <void method="connectOutput"> 
       <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
        <void method="connectOutput"> 
         <object class="com.ti.dvt.datamodel.core.MultipleKeyAnalyser"> 
          <void method="connectOutput"> 
           <object class="com.ti.dvt.datamodel.core.Tap"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.FunctionCountAnalyser"> 
                <void method="connectOutput"> 
                 <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
                  <void method="connectOutput"> 
                   <object class="com.ti.dvt.datamodel.core.UnlimitedBuffer"> 
                    <void property="dataSourceName"> 
                     <string>Unlimited buffer1</string> 
                    </void> 
                    <void property="fileName"> 
                     <string>C:\Eclipse_CCEHead2\workspace_run\.metadata\.plugins\com.ti.dvt.datamodel\temp\16946d4_null.dat</string> 
                    </void> 
                    <void property="name"> 
                     <string>UnlimitedBuffer.1</string> 
                    </void> 
                   </object> 
                  </void> 
                  <void property="XMLconfigFile"> 
                   <string>config/removeField.xml</string> 
                  </void> 
                  <void property="name"> 
                   <string>FieldTranslator.3</string> 
                  </void> 
                  <void property="passthroughAllFields"> 
                   <boolean>true</boolean> 
                  </void> 
                 </object> 
                </void> 
                <void property="instructionDecodeCountFieldName"> 
                 <string>inst exec count</string> 
                </void> 
                <void property="keyFieldName"> 
                 <string>Function</string> 
                </void> 
                <void property="name"> 
                 <string>FunctionCountAnalyser</string> 
                </void> 
                <void property="predicateFalseCountFieldName"> 
                 <string>inst exec count</string> 
                </void> 
                <void property="secondaryKeyFieldName"> 
                 <string>Filename</string> 
                </void> 
               </object> 
              </void> 
              <void property="XMLconfigFile"> 
               <string>config/instrTranslate.xml</string> 
              </void> 
              <void property="name"> 
               <string>FieldTranslator.2</string> 
              </void> 
             </object> 
            </void> 
            <void method="connectOutput"> 
             <int>1</int> 
             <object class="com.ti.dvt.datamodel.core.UnlimitedBuffer"> 
              <void property="dataSourceName"> 
               <string>Unlimited buffer1</string> 
              </void> 
              <void property="fileName"> 
               <string>C:\Eclipse_CCEHead2\workspace_run\.metadata\.plugins\com.ti.dvt.datamodel\temp\16946d4_null.dat</string> 
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
             <string>Tap</string> 
            </void> 
            <void property="numInputs"> 
             <int>1</int> 
            </void> 
           </object> 
          </void> 
          <void property="keyFieldNames"> 
           <string>Filename,Function,Line Number</string> 
          </void> 
          <void property="name"> 
           <string>MultipleKeyAnalyser</string> 
          </void> 
          <void property="selectFirstFieldNames"> 
           <string>Comment</string> 
          </void> 
          <void property="selectLargestFieldNames"> 
           <string>Coverage</string> 
          </void> 
          <void property="selectSmallestFieldNames"> 
           <string></string> 
          </void> 
         </object> 
        </void> 
        <void property="XMLconfigFile"> 
         <string>config/coverageTranslate.xml</string> 
        </void> 
        <void property="name"> 
         <string>FieldTranslator.1</string> 
        </void> 
       </object> 
      </void> 
      <void property="XMLconfigFile"> 
       <string>config/codeGenFilter.xml</string> 
      </void> 
      <void property="name"> 
       <string>FieldTranslator</string> 
      </void> 
     </object> 
    </void> 
    <void property="comment"> 
     <string></string> 
    </void> 
    <void property="fileExpression"> 
     <string>.*csv</string> 
    </void> 
    <void property="fileName"> 
     <string></string> 
    </void> 
    <void property="filePath"> 
     <string>C:\DVDP\profiler\CCSV4 Code coverage\interpreter\Debug</string> 
    </void> 
    <void property="headerLinesToIgnore"> 
     <int>1</int> 
    </void> 
    <void property="name"> 
     <string>TextFileReader</string> 
    </void> 
   </object> 
  </void> 
 </object> 
</java> 
