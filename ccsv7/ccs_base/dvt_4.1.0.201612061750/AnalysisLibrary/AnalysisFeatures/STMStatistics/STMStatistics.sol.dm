<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.6.0_34" class="java.beans.XMLDecoder"> 
 <object class="com.ti.dvt.datamodel.core.DataModel"> 
  <void property="filePath"> 
   <string>D:\Gforge\ccstudio5.5\dvt_resources\platform\AnalysisLibrary\AnalysisFeatures\STMStatistics</string> 
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
           <object class="com.ti.dvt.datamodel.core.FieldTranslator"> 
            <void method="connectOutput"> 
             <object class="com.ti.dvt.datamodel.analysis.IntervalBasedStatistics"> 
              <void method="connectOutput"> 
               <object class="com.ti.dvt.datamodel.core.Tap"> 
                <void method="connectOutput"> 
                 <object class="com.ti.dvt.datamodel.core.virtualbuffer.VirtualBuffer"> 
                  <void property="name"> 
                   <string>Detail</string> 
                  </void> 
                 </object> 
                </void> 
                <void method="connectOutput"> 
                 <int>1</int> 
                 <object class="com.ti.dvt.datamodel.core.CountAnalyser"> 
                  <void property="dataField"> 
                   <string>Total</string> 
                  </void> 
                  <void property="keyField"> 
                   <string>Source</string> 
                  </void> 
                  <void property="name"> 
                   <string>Summary</string> 
                  </void> 
                 </object> 
                </void> 
                <void property="flow"> 
                 <boolean>false</boolean> 
                </void> 
                <void property="name"> 
                 <string>Tap.28</string> 
                </void> 
                <void property="numInputs"> 
                 <int>1</int> 
                </void> 
               </object> 
              </void> 
              <void property="dataFieldName"> 
               <string>Data</string> 
              </void> 
              <void property="keyFieldName"> 
               <string>Event Source Name</string> 
              </void> 
              <void property="name"> 
               <string>IntervalBasedStatistics</string> 
              </void> 
              <void property="normalizeTotalOverSamplePeriod"> 
               <boolean>true</boolean> 
              </void> 
              <void property="numberOfSamples"> 
               <int>1</int> 
              </void> 
              <void property="samplePeriod"> 
               <double>1000.0</double> 
              </void> 
              <void property="typeOfInterval"> 
               <string>Sample Count</string> 
              </void> 
             </object> 
            </void> 
            <void property="XMLconfigFile"> 
             <string>config\CreateEventSourceName.xml</string> 
            </void> 
            <void property="name"> 
             <string>FieldTranslator.6</string> 
            </void> 
           </object> 
          </void> 
          <void property="filter"> 
           <string>!(Domain  == &quot;SW&quot;)&amp;&amp;!(Master_Name  == &quot;&quot;)&amp;&amp;(Data &gt;= -1)</string> 
          </void> 
          <void property="flow"> 
           <boolean>false</boolean> 
          </void> 
          <void property="name"> 
           <string>STMStatisticAnalysis Tap</string> 
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
