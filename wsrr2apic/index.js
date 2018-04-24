#!/usr/bin/env node

/********************************************************* {COPYRIGHT-TOP} ***
 * Licensed Materials - Property of IBM
 *  5724-N72
 *
 * (C) Copyright IBM Corporation 2016
 *
 * All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ********************************************************** {COPYRIGHT-END} **/
var logger = require("./lib/Logger"), wsrrUtils = require("./lib/WSRR/wsrrUtils"), cliArgs = require("command-line-args"), apicUtils = require("./lib/APIC/apicUtils"), pjson = require('./package.json'), Promise = require("bluebird"), flow = require("./lib/flow"), lock = require("./lib/utils/lock"), os = require("os"), fs = require("fs"), mkdirp = require("mkdirp"),homedir=require("os-homedir"),propertyParse = require("properties-parser"),promiseStatus=require("./lib/utils/promiseStatus");

var outputDirectoryCreation,wsrrtest,apictest,wsrrOrg,bsrURICheck,apicdevportaltest;

function endToEndTransfer(options){
	// Perform test connections User promises to ensure prechecks are complete before starting transfer
	var bsrURI;
	if(options.transferMode.length>1){
		bsrURI=options.transferMode[1];
	}
	var directory;
	if (options.outputDirectory) {
		directory = options.outputDirectory;
	} else {
		directory = homedir()+ "/.soatt/files";
	}
	var join = Promise.join(
		//ensure file output directory exists, if not create it
		outputDirectoryCreation = new Promise(
			function(resolve,reject) {
				fs.access(directory,fs.F_OK,
					function(err) {
						if (err) {
							mkdirp(directory,function(){
								resolve();
							});
						}else{
							resolve();
						}
					});
			}),
		wsrrtest = new Promise(
			function(resolve,reject) {
				wsrrUtils.testWSRRConnection(
					function(passed,data) {
						if(passed){
							resolve();
						}else{
							logger.error(logger.Globalize.formatMessage("wsrrtestconnectionfailure"));
							reject();
						}
					});
			}),
		apictest = new Promise(
			function(resolve,reject) {
				apicUtils.testAPICConnection(
						function(passed,error) {
							if(passed){
								resolve();
							}else{
								logger.error(error);
								logger.error(logger.Globalize.formatMessage("apicconnectiontestfailed"));
								reject();
							}
						});
			}),
		wsrrOrg = new Promise(
			function(resolve,reject){
				if(!bsrURI){
					if (!wsrrUtils.getWSRROrg()) {
						logger.error(logger.Globalize.formatMessage("wsrrNoOrganisationDefined"));
						reject();
					}else{
						resolve();
					}
				}else{
					resolve();
				}
			}),
		bsrURICheck = new Promise(
			function(resolve,reject){
				if(bsrURI){
					wsrrUtils.validateBsrURI(bsrURI,function(passed){
						if(passed){
							resolve();
						}else{
							logger.error(logger.Globalize.formatMessage("invalidbsrURIprovided",bsrURI));
							reject();
						}
					});
				}else{
					resolve();
				}
			}),
		apicdevportaltest = new Promise(function(resolve,reject){
			apicUtils.createConsumers(function(create){
				if(create){
					apicUtils.testPortalConnection(function(passed){
						if(passed){
							resolve();
						}else{
							//TODOAdd error message
							reject();
						}
					})
				}else{
					resolve();
				}
			})
		})
	).then(
		function() {
			// now we do transfer stuff.
			logger.info(logger.Globalize.formatMessage("testconnectiontestssuccessful"));
			logger.info(logger.Globalize.formatMessage("startdownload"));
			if(!bsrURI){
				flow.transferToDraftForOrganization(
					wsrrUtils.getWSRROrg(),
					directory,
					wsrrUtils.getConnectionProperties(),
					wsrrUtils,
					require("./lib/apimcli"),
					require("./lib/apimdevportal"));
			}else{
				flow.transferToDraftForServiceVersion(
						bsrURI,
						directory,
						wsrrUtils.getConnectionProperties()
						,wsrrUtils
						,require("./lib/apimcli"),
						require("./lib/apimdevportal"));
			}
		}
	).catch(
		function(e){
			//If a error or rejection occurs, check to ensure long running promises complete before exiting the program
			if(e){
								logger.error(logger.Globalize.formatMessage("unexpectedprecheckfailure",options.transferMode[0]));
				logger.error(e);
			}
			promiseStatus.checkPromisesStatus([wsrrtest,apictest,apicdevportaltest],function(){
				logger.error(logger.Globalize.formatMessage("transferModePrecheckFail",options.transferMode[0]));
				process.exit(1);
				});
			});
}

function wsrrDownload(options){
	var bsrURI;
	if(options.transferMode.length>1){
		bsrURI=options.transferMode[1];
	}
	var outputDirectory;
	Promise.join(
		outputDirectoryCreation = new Promise(
			function(resolve,reject) {
				if(!options.outputDirectory){
					logger.error(logger.Globalize.formatMessage("noOutputDirectoryDefined",options.transferMode[0]));
					reject();
				}else{
					outputDirectory=options.outputDirectory;
					fs.access(outputDirectory,fs.F_OK,
						function(err) {
							if (err) {
								mkdirp(outputDirectory,function(){
									resolve();
								})
							}else{
								resolve();
							}
						});
				}
			}),
		wsrrtest = new Promise(
			function(resolve,reject) {
				wsrrUtils.testWSRRConnection(
					function(passed,data) {
						if(passed){
							resolve();
						}else{
							reject();
						}
					});
			}),
		wsrrOrg = new Promise(
			function(resolve,reject){
				if(!bsrURI){
					if (!wsrrUtils.getWSRROrg()) {
						logger.error(logger.Globalize.formatMessage("wsrrNoOrganisationDefined"));
						reject();
					}else{
						resolve();
					}
				}else{
					resolve();
				}
			}),
		bsrURICheck = new Promise(
			function(resolve,reject){
				if(bsrURI){
					wsrrUtils.validateBsrURI(bsrURI,function(passed){
						if(passed){
							resolve();
						}else{
							logger.error(logger.Globalize.formatMessage("invalidbsrURIprovided",bsrURI));
							reject();
						}
					});
				}else{
					resolve();
				}
			}),
		apictest= new Promise(
			function(resolve,reject){
				apicUtils.testAPICToolkit(function(passed,error) {
					if(passed){
						resolve();
					}else{
						logger.error(error);
						logger.error(logger.Globalize.formatMessage("apicconnectiontestfailed"));
						reject();
					}
				});
			})
	).then(
		function() {
			if(!bsrURI){
				flow.transferToFileSystemForOrganization(
					wsrrUtils.getWSRROrg(),
					outputDirectory,
					wsrrUtils.getConnectionProperties(),
					wsrrUtils,
					require("./lib/apimcli"));
			}else{
				flow.transferToFileSystemForServiceVersion(
						bsrURI,
						outputDirectory,
						wsrrUtils.getConnectionProperties(),
						wsrrUtils,
						require("./lib/apimcli"));
			}
		}
	).catch(
		function(e){
			if(e){
				logger.error(logger.Globalize.formatMessage("unexpectedprecheckfailure",options.transferMode[0]))
				logger.error(e);
			}
			promiseStatus.checkPromisesStatus([wsrrtest,apictest],function(){
				logger.error(logger.Globalize.formatMessage("transferModePrecheckFail",options.transferMode[0]));
				process.exit(1);
			});

		});
}

function apicUpload(options){
	var uploaddirectory;
	Promise.join(
		new Promise(
			function(resolve,reject) {
				if (options.inputDirectory && options.inputDirectory!=="") {
					uploaddirectory = options.inputDirectory;
					fs.access(uploaddirectory, fs.F_OK,
						function(err) {
							if (err) {
								logger.error(logger.Globalize.formatMessage("inputDirectoryDoesNotExist",uploaddirectory));
								reject();
							}else{
								fs.readdir(uploaddirectory,
									function(err, files) {
										if(!err){
											if(files.length>0){
												resolve();
											}else{
												logger.error(logger.Globalize.formatMessage("inputDirectoryEmpty",uploaddirectory));
												reject();
											}
										}else{
											logger.error(logger.Globalize.formatMessage("errorRetrievingDirectoryContents",uploaddirectory),err);
											reject();
										}
								});
							}
						});
				}else{
					logger.error(logger.Globalize.formatMessage("noInputDirectoryDefined",options.transferMode[0]));
					reject();
				}
			}),
		apictest = new Promise(
			function(resolve,reject) {
				apicUtils.testAPICConnection(
					function(passed,error) {
						if(passed){
							resolve();
						}else{
							logger.error(error);
							logger.error(logger.Globalize.formatMessage("apicconnectiontestfailed"));
							reject();
						}
					})
				}),
		apicdevportaltest = new Promise(
			function(resolve,reject){
				apicUtils.createConsumers(function(create){
					if(create){
						apicUtils.testPortalConnection(function(passed){
							if(passed){
								resolve();
							}else{
								reject();
							}
						})
					}else{
						resolve();
					}
				})
			})
	).then(
		function() {
			flow.pushToDraftFromFileSystem(
					uploaddirectory,
					wsrrUtils.getConnectionProperties(),
					require("./lib/apimcli"),
					require("./lib/apimdevportal"));
		}).catch(function(e){
			if(e){
				logger.error(logger.Globalize.formatMessage("unexpectedprecheckfailure",options.transferMode[0]))
				logger.error(e);
			}
			promiseStatus.checkPromisesStatus([apictest,apicdevportaltest],function(){
				logger.error(logger.Globalize.formatMessage("transferModePrecheckFail",options.transferMode[0]));
				process.exit(1);
			});

		})
}

function generateSwaggerFromLocalWSDL(options){
	var inputDirectory;
	var outputDirectory;
	Promise.join(
		new Promise(
			function(resolve,reject) {
				if (options.inputDirectory && options.inputDirectory!=="") {
					inputDirectory = options.inputDirectory;
					fs.access(inputDirectory, fs.F_OK,
						function(err) {
							if (err) {
								logger.error(logger.Globalize.formatMessage("inputDirectoryDoesNotExist",inputDirectory));
								reject();
							}else{
								fs.readdir(inputDirectory,
									function(err, files) {
										if(!err){
											if(files.length>0){
												resolve();
											}else{
												logger.error(logger.Globalize.formatMessage("inputDirectoryEmpty",inputDirectory));
												reject();
											}
										}else{
											logger.error(logger.Globalize.formatMessage("errorRetrievingDirectoryContents",inputDirectory),err);
											reject();
										}
								});
							}
							});
				}else{
					logger.error(logger.Globalize.formatMessage("noInputDirectoryDefined",options.transferMode[0]));
					reject();
				}
			}),
		new Promise(
			function(resolve,reject) {
				if(!options.outputDirectory){
					logger.error(logger.Globalize.formatMessage("noOutputDirectoryDefined",options.transferMode[0]));
					reject();
				}else{
					outputDirectory=options.outputDirectory;
					fs.access(outputDirectory,fs.F_OK,
						function(err) {
							if (err) {
								mkdirp(outputDirectory,function(){
									resolve();
								})
							}else{
								resolve();
							}
						});
				}
			}),
		new Promise(
			function(resolve,reject){
				apicUtils.testAPICToolkit(function(passed,error) {
					if(passed){
						resolve();
					}else{
						logger.error(error);
						logger.error(logger.Globalize.formatMessage("apicconnectiontestfailed"));
						reject();
					}
				});
			})
	).then(function(){
		var wsdl= require("./lib/wsdl.js");
		wsdl.initialize(inputDirectory);
		flow.transferToFileSystemForWSDL(outputDirectory,wsrrUtils.getConnectionProperties(),wsdl,require("./lib/apimcli"));
	}).catch(function(e){
		if(e){
			logger.error(logger.Globalize.formatMessage("unexpectedprecheckfailure",options.transferMode[0]))
			logger.error(e);
		}
			logger.error(logger.Globalize.formatMessage("transferModePrecheckFail",options.transferMode[0]));
			process.exit(1);
	});
}

function executePlugins(options){
	var inputDirectory;
	var outputDirectory;
	var input;
	var pluginName;
	Promise.join(
		new Promise(
			function(resolve,reject) {
				if (options.inputDirectory && options.inputDirectory!=="") {
					inputDirectory = options.inputDirectory;
					fs.access(inputDirectory, fs.F_OK,
						function(err) {
							if (err) {
								logger.error(logger.Globalize.formatMessage("inputDirectoryDoesNotExist",inputDirectory));
								reject();
							}else{
								fs.readdir(inputDirectory,
									function(err, files) {
										if(!err){
											if(files.length>0){
												resolve();
											}else{
												logger.error(logger.Globalize.formatMessage("inputDirectoryEmpty",inputDirectory));
												reject();
											}
										}else{
											logger.error(logger.Globalize.formatMessage("errorRetrievingDirectoryContents",inputDirectory),err);
											reject();
										}
								});
							}
						});
				}else{
					//Input directory is not a required option, so if not defined, just resolve
					resolve();
				}
			}),
			new Promise(function(resolve,reject) {
				if(!options.outputDirectory){
					logger.error(logger.Globalize.formatMessage("noOutputDirectoryDefined",options.transferMode[0]));
					reject();
				}else{
					outputDirectory=options.outputDirectory;
					fs.access(outputDirectory,fs.F_OK,
						function(err) {
							if (err) {
								mkdirp(outputDirectory,function(){
									resolve();
								})
							}else{
								resolve();
							}
						});
				}
			}),
			new Promise(
				function(resolve,reject){
					if(options.transferMode.length < 2){
						logger.error(logger.Globalize.formatMessage("missingPluginName"));
						reject();
					}else{
						pluginName=options.transferMode[1];
						if(options.transferMode.length>2){
							input=options.transferMode[2];
						}
						resolve();
					}
				})
		).then(function(){
			flow.transferToFileSystemForPlugin(outputDirectory,inputDirectory,input,wsrrUtils.getConnectionProperties(),pluginName);
		}).catch(function(e){
			if(e){
				logger.error(logger.Globalize.formatMessage("unexpectedprecheckfailure",options.transferMode[0]),e);
				logger.error(e);
			}
			logger.error(logger.Globalize.formatMessage("transferModePrecheckFail",options.transferMode[0]));
			process.exit(1);
		});
}

function diagnosticMode(options){
	if(options.diagnosticMode[0]==="1"){
		var propertiesFile,bsBsrURI,bsrURI;
		if(options.diagnosticMode.length!==4){
			//error as not enough arguments ([0]===mode,[1]===bsBsrURI,[2]===bsrURI,[3]===filePath)
			logger.error(logger.Globalize.formatMessage("diagnosticModeInvalidNumOfArgs",options.diagnosticMode[0]));
		}else{
			Promise.join(
					new Promise(function(resolve,reject){
						if(options.connectionPropertiesFile){
							propertiesFile=options.connectionPropertiesFile;
						}else{
							propertiesFile="./connectionproperties.properties";
						}
						resolve();
					}),
					new Promise(function(resolve,reject){
						wsrrUtils.validateBsrURI(options.diagnosticMode[1],function(passed){
							if(passed){
								bsBsrURI=options.diagnosticMode[1];
								resolve();
							}else{
								logger.error(logger.Globalize.formatMessage("invalidbsrURIprovided",options.diagnosticMode[1]));
								reject();
							}
						});
					}),
					new Promise(function(resolve,reject){
						wsrrUtils.validateBsrURI(options.diagnosticMode[2],function(passed){
							if(passed){
								bsrURI=options.diagnosticMode[2];
								resolve();
							}else{
								logger.error(logger.Globalize.formatMessage("invalidbsrURIprovided",options.diagnosticMode[2]));
								reject();
							}
						});
					})
			).then(function(){
				flow.diagnose_generateAPIAndProductYAML(
						bsBsrURI,
						bsrURI,
						options.diagnosticMode[3],
						propertiesFile,require("./lib/apimcli"));
			})
		}
	}else if(options.diagnosticMode[0]==="2"){
		//trace.expandTraceBuffers()
		//most work should be performed through logging class
		logger.traceBuffers(options.diagnosticMode,function(){

		});
	}else if(options.diagnosticMode[0]==="3"){
		flow.diagnose_listPlugins();
	}else{
		logger.error(logger.Globalize.formatMessage("invalidDiagnosticMode",options.diagnosticMode[0]));
	}
}

function initialize() {
	logger.initialize(function() {
		logger.loggerStart();
		var cli = getCLIArgs();
		var usage = cli
			.getUsage({
				header : "soatt - Transfer Services from WebSphere Service Registry and Repository (WSRR) to IBM API Connect v5.0 - Version 1.0",
				footer : "",
				hide: ["diagnosticMode","nl"]
				});
		var options;
		try{
			options = cli.parse();
		}catch(err){
			logger.error(logger.Globalize.formatMessage("cliargumentprocessingfailure",err.message));
			if(err.name==="UNKNOWN_OPTION"){
				console.log(usage);
			}
			process.exit(1);
		}
		// set the language
		if (typeof options.nl !== 'undefined') {
			logger.Globalize.locale(options.nl);
			cli = getCLIArgs();
		}
		logger.initialize();
		usage = cli.getUsage({
				footer : "",
				hide: ["diagnosticMode","nl"]
			});
		//No need to put this is the logger, but needs the logger initialized to pull the message
		console.log(logger.Globalize.formatMessage("startup",pjson.version));
		if (options.help || (!options.testWSRRConnection && !options.testAPICConnection && !options.transferMode && !options.version && !options.reviewlogs && !options.diagnosticMode)) {
			console.log(usage);
			lock.exit(0);
		} else if (options.version) {
			console.log(logger.Globalize.formatMessage("toolversion",pjson.name, pjson.version));
			lock.exit(0);
		} else if (options.reviewlogs) {
			//console.log(options.reviewlogs);
			logger.reviewLogs(options.reviewlogs,function(resolve){
				lock.exit(0);
			});
		}else if(options.diagnosticMode){
			diagnosticMode(options)
		} else {
			if (options.connectionPropertiesFile) {
				logger.debug("Setting Connections Properties file to: "+options.connectionPropertiesFile);
				wsrrUtils.setConnectionPropertiesFile(options.connectionPropertiesFile);
				apicUtils.setConnectionPropertiesFile(options.connectionPropertiesFile);
			}
			if (options.testWSRRConnection) {
				wsrrUtils.testWSRRConnection(function(passed, data) {
					if (passed) {
						logger.info(logger.Globalize.formatMessage("wsrrtestconnectionsuccess"));
					} else {
						logger.error(logger.Globalize.formatMessage("wsrrtestconnectionfailure"));
					}
				});
			}
			if (options.testAPICConnection) {
				apicUtils.testAPICConnection(function(passed,error) {
					if (passed) {
						logger.info(logger.Globalize.formatMessage("apicconnectiontestsuccessful"));
					} else {
						logger.error(error);
						logger.error(logger.Globalize.formatMessage("apicconnectiontestfailed"));
						Promise.delay(500).then(function(){
							process.exit(1);
						});
					}
				});
			}
			//Test Modes cannot be run in conjunction with transfer modes
			if (!options.testWSRRConnection	&& !options.testAPICConnection) {
				if (options.transferMode[0] === '1' || options.transferMode[0] === '2' || options.transferMode[0] === '3' || options.transferMode[0] === '4'  || options.transferMode[0] === '5') {
						wsrrUtils.setWSRRConnectiondetails(propertyParse.parse(fs
							.readFileSync(wsrrUtils.getConnectionPropertiesFile())));
					if (options.transferMode[0] === '1') {
						endToEndTransfer(options);
					} else if (options.transferMode[0] === '2') {
						wsrrDownload(options);
					} else if (options.transferMode[0] === '3') {
						apicUpload(options);
					} else if (options.transferMode[0] === '4') {
						generateSwaggerFromLocalWSDL(options);
					} else if (options.transferMode[0] === '5'){
						executePlugins(options);
					}
				}else {
						logger.error(logger.Globalize.formatMessage("invalid.transfer.mode.value",options.transferMode));
				}
			}
		}
	});
}

function getCLIArgs() {
	return cliArgs([
			{
				name : "help",
				type : Boolean,
				alias : "h",
				defaultOption : false,
				description : logger.Globalize.formatMessage("help")
			},
			{
				name : "transferMode",
				alias : "t",
				type : String,
				multiple : true,
				description : logger.Globalize.formatMessage("transferMode")
			},
			{
				name : "testWSRRConnection",
				type : Boolean,
				alias : "w",
				description : logger.Globalize
						.formatMessage("wsrrTestConnection")
			},
			{
				name : "testAPICConnection",
				type : Boolean,
				alias : "a",
				description : logger.Globalize
						.formatMessage("apicTestConnection")
			},
			{
				name : "outputDirectory",
				type : String,
				alias : "o",
				description : logger.Globalize.formatMessage("outputDirectory")
			},
			{
				name : "inputDirectory",
				type : String,
				alias : "i",
				description : logger.Globalize.formatMessage("inputDirectory")
			},
			{
				name : "version",
				type : Boolean,
				alias : "v",
				description : logger.Globalize.formatMessage("version")
			},
			{
				name : "nl",
				type : String,
				description : logger.Globalize.formatMessage("nl")
			},
			{
				name : "connectionPropertiesFile",
				alias : "f",
				type : String,
				description : logger.Globalize
						.formatMessage("connectionPropertiesFile")
			}, {
				name : "reviewlogs",
				alias : "l",
				type : String,
				multiple : true,
				description : logger.Globalize.formatMessage("reviewlogs")
			},{
				name: "diagnosticMode",
				type: String,
				multiple:true,
				description : logger.Globalize.formatMessage("diagnosticmode")
			}]);
}

initialize();
