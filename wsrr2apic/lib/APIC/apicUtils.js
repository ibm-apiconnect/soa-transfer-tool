/********************************************************* {COPYRIGHT-TOP} ***
 * Licensed Materials - Property of IBM
 *  5724-N72
 *
 * (C) Copyright IBM Corporation 2016, 2017
 *
 * All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ********************************************************** {COPYRIGHT-END} **/

var logger=require("../Logger"),apicCLI=require("../apimcli"),fs=require("fs"),propertyParse = require("properties-parser"),apimDevPortal=require("../apimdevportal");

var propertiesFile = "./connectionproperties.properties";

function testAPICConnection(callback) {
	logger.entry("apicUtils.testAPICConnection");
	
	var wsrr2apicProperties = fs
			.readFileSync(propertiesFile);
	var inputOptions = propertyParse.parse(wsrr2apicProperties);
	apicCLI.getVersion(inputOptions).then(function(resolve){
		if(resolve.stdout!==''){
			logger.debug(logger.Globalize.formatMessage("apicToolkitVersion",resolve.stdout));
		}
		apicCLI.setConnectionDetails(inputOptions).then(function(resolve){			
			callback(true,null);
			//Ignore error from IDEs
		}).catch(function(error){		
			//If error is thrown. Internal message is shown
			error.message = logger.Globalize.formatMessage("apicconnectiontestfailed");
			callback(false,error);
		})
	}).catch(function(error){		
		callback(false,error);
	});
	
	logger.exit("apicUtils.testAPICConnection");
}

function testAPICToolkit(callback){
	logger.entry("apicUtils.testAPICToolkit");
	var wsrr2apicProperties = fs.readFileSync(propertiesFile);
	var inputOptions = propertyParse.parse(wsrr2apicProperties);
	apicCLI.getVersion(inputOptions).then(function(resolve){
		if(resolve.stdout!==''){
			logger.debug(logger.Globalize.formatMessage("apicToolkitVersion",resolve.stdout));
		}
		callback(true,null);
	}).catch(function(error){		
		callback(false,error);
	});
	logger.exit("apicUtils.testAPICToolkit");
}

function testPortalConnection(callback) {
	logger.entry("apicUtils.testPortalConnection");
	var wsrr2apicProperties = fs
		.readFileSync(propertiesFile);
	var inputOptions = propertyParse.parse(wsrr2apicProperties);
	apimDevPortal.setConnectionDetails(inputOptions);
	apimDevPortal.listDeveloperOrganizations().then(function(){
		callback(true);
	}).catch(function(e){
		error=JSON.parse(e).errors[0];
		if(error['catalog.api.context.notValid']){
			logger.error(logger.Globalize.formatMessage("apicdevportalconnectionfailedCatalog"),e)
		}else if(error['generic.badCredentials']){
			logger.error(logger.Globalize.formatMessage("apicdevportalconnectionfailedCredentials"),e);
		}else{
			logger.error(logger.Globalize.formatMessage("apicdevportaltestfailed"),e);
		}
		callback(false);
	});	
	var inputOptions = propertyParse.parse(wsrr2apicProperties);			
	logger.exit("apicUtils.testPortalConnection");
}

function createConsumers(callback){	
	var wsrr2apicProperties = fs.readFileSync(propertiesFile);
	var options = propertyParse.parse(wsrr2apicProperties);
	if(options.createConsumers==="true"){
		callback(true);
	}else{
		callback(false);
	}
}

function setConnectionPropertiesFile(file){	
	propertiesFile=file;	
}

//return file name of properties file
function getConnectionPropertiesFile(){	
	return propertiesFile;	
}

module.exports = {
		testAPICConnection:testAPICConnection,
		testAPICToolkit:testAPICToolkit,
		testPortalConnection:testPortalConnection,
		createConsumers:createConsumers,
		setConnectionPropertiesFile:setConnectionPropertiesFile,
		getConnectionPropertiesFile:getConnectionPropertiesFile
};
