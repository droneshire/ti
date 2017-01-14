<?xml version="1.0" encoding="UTF-8"?>
<java version="1.5.0_14" class="java.beans.XMLDecoder">
	<object class="com.ti.dvt.datamodel.core.DataModel">
		<void method="addSource">
			<object class="com.ti.dvt.datamodel.core.Tap">
				<void method="connectOutput">
					<object class="com.ti.dvt.datamodel.core.SymbolicTranslator">
						<void method="connectOutput">
							<object class="com.ti.dvt.datamodel.core.FieldTranslator">
								<void method="connectOutput">
									<object class="com.ti.dvt.datamodel.core.FieldTranslator">
										<void method="connectOutput">
											<object class="com.ti.dvt.datamodel.core.FieldTranslator">
												<void method="connectOutput">
													<object class="com.ti.dvt.datamodel.core.Tap">
														<void method="connectOutput">
															<object class="com.ti.dvt.datamodel.analysis.ProfilerAnalyzer">
																<void method="connectOutput">
																	<object class="com.ti.dvt.datamodel.core.CountAnalyser">
																		<void property="dataField">
																			<string>Excl Count, Incl Count</string>
																		</void>
																		<void property="fieldNameForCounts">
																			<string>Calls</string>
																		</void>
																		<void property="keyField">
																			<string>Name</string>
																		</void>
																		<void property="name">
																			<string>FunctionProfile</string>
																		</void>
																		<void property="partialField">
																			<string>Partial</string>
																		</void>
																		<void property="passthroughFields">
																			<string>Filename, Line Number, Start Address</string>
																		</void>
																	</object>
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
																<void property="name">
																	<string>ProfilerAnalyzer</string>
																</void>
																<void property="sourceKeyFields">
																	<string>Function</string>
																</void>
																<void property="timeField">
																	<string>Select</string>
																</void>
																<void property="passthroughAllFields">
																	<boolean>false</boolean>
																</void>
																<void property="captureDataForProfileResults">
																	<boolean>true</boolean>
																</void>
															</object>
														</void>
														<void property="flow">
															<boolean>false</boolean>
														</void>
														<void property="name">
															<string>ProfileFilter</string>
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
													<string>ProfileTranslate3</string>
												</void>
												<void property="numInputs">
													<int>1</int>
												</void>
												<void property="XMLconfigFile"> 
													<string>config/passthrough.xml</string> 
												</void> 
											</object>
										</void>
										<void property="flow">
											<boolean>false</boolean>
										</void>
										<void property="name">
											<string>ProfileTranslate2</string>
										</void>
										<void property="numInputs">
											<int>1</int>
										</void>
										<void property="XMLconfigFile"> 
											<string>config/passthrough.xml</string> 
										</void> 
									</object>
								</void>
								<void property="flow">
									<boolean>false</boolean>
								</void>
								<void property="name">
									<string>ProfileTranslate</string>
								</void>
								<void property="numInputs">
									<int>1</int>
								</void>
								<void property="XMLconfigFile"> 
									<string>config/passthrough.xml</string> 
								</void> 
							</object>
						</void>
						<void property="01_Symbol">
							<boolean>true</boolean>
						</void>
						<void property="01_SymbolFiles">
							<string/>
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
						<void property="06_StartAddress">
							<boolean>true</boolean>
						</void>
						<void property="07_EndAddress">
							<boolean>true</boolean>
						</void>
						<void property="13_FullSignature">
							<boolean>true</boolean>
						</void>
						<void property="name">
							<string>SymbolicTranslator</string>
						</void>
						<void property="passthroughAllFields">
							<boolean>true</boolean>
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
	</object>
</java>
