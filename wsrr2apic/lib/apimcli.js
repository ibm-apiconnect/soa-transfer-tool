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
/**
 * API Connect CLI library.
 * 
 * Wraps the API Connect CLI with some functions. Uses Promises to resolve when the calls finish.
 */

'use strict';

var logger=require("../lib/Logger"), Promise = require('bluebird'), fs = require('fs'), url = require('url');
var apicUrlUtils = require('./APIC/apicUrlUtils');
var exec = require('child_process').exec;

// connection details
var apicServer;
var apicUsername;
var apicPassword;
var apicVersion;
var apicUrl;
var apicPOrg;
// default catalog
var apicCatalog;
var apicSpace;

var apicToolkitTimeout=60000

// connection properties
var configuration = null;

/*
 * Obfuscate sensitive data, like a password, on a command line.
 * Has a set of tokens it looks for and replaces the value with *.
 */
function _obfuscateSensitiveData(command) {
	var tokens = ["--password"];
	var ret = command;
	for(var i = 0; i < tokens.length; i++) {
		// regexp is token then one space then any number of non space characters
		var regexp = new RegExp(tokens[i] + "\\s[^\\s]+", "g");
		// replace with token, space and *****
		ret = ret.replace(regexp, tokens[i] + " *****");
	}
	return ret;
}

// Run the apic command by calling on the command line
// command is an array of values which are joined with spaces to make the command run.
// workingDir is optional, if specified runs from that directory.
// return Promise which resolves with result which has properties stdout and stderr, throws 
// with error message.
function _runAPICCommand(command, workingDir) {
	logger.entry("apimcli._runAPICCommand", command, workingDir);

	var cmd = "apic " + command.join(" ");

	var errorFn = function(error){
		logger.info(logger.Globalize.formatMessage("apicErrorRunning1"));
		logger.info(logger.Globalize.formatMessage("apicErrorRunning2"));
		var command = _obfuscateSensitiveData(error.error.toString());
		logger.info(command);
		logger.info(logger.Globalize.formatMessage("apicErrorRunning3"));
		logger.info(error.stdout);
		logger.info(error.stderr);
		logger.info(logger.Globalize.formatMessage("apicErrorRunning4"));
		if(workingDir) {
			logger.info(logger.Globalize.formatMessage("apicErrorRunning5", workingDir));			
		}
		
		var newError = new Error();
		if(workingDir) {
			newError.message = logger.Globalize.formatMessage("apicErrorRunningCommandFromDir", command, workingDir, error.stdout + " " + error.stderr);
		} else {
			newError.message = logger.Globalize.formatMessage("apicErrorRunningCommand", command, error.stdout + " " + error.stderr);
		}		
		
		throw newError;
	};
	
	var promise = new Promise(function(resolve, reject) {
		// called when process terminates
		var callback = function(error, stdout, stderr) {
			var result = {
					stdout: stdout, 
					stderr: stderr
			};
			if(error === null) {
				// in the case of apic returning nothing (empty strings are returned)
				if(stdout==="" && stderr===""){					
					result.error=logger.Globalize.formatMessage("apicErrorEmptyResult");
					reject(result);
				}else{
					// success				
					resolve(result);
				}
			} else {
				result.error = error;
				// error
				reject(result);
			}			
		};
		
		var childProcess = null;
		if(workingDir) {
			childProcess = exec(cmd, {cwd: workingDir}, callback);
		} else {
			childProcess = exec(cmd, {}, callback);
		}
		
	}).caught(errorFn);
	
	logger.exit("apimcli._runAPICCommand", promise);
	return promise;
}

// Call before using the module, sets up the connection from the properties, which should
// be an object containing key:value pairs.
// Logs in to APIC at this point.
// Sets the config to the catalog identifier URL in the configuration, which sets the catalog and provider org.
// All functions are directed to this catalog and provider org, which is why there are no options to specify them on the calls.
//
// connectionProperties - object
// noLogin - true to not login, undefined or false to login
//
// return Promise which resolves when finished set up and logged in.
function setConnectionDetails(connectionProperties, noLogin) {
	logger.entry("apimcli.setConnectionDetails", connectionProperties, noLogin);

	// store for use with getters
	configuration = connectionProperties;
	
	apicUsername = connectionProperties.apiUsername;
	apicPassword = connectionProperties.apiPassword;
	// get version in case we need different behaviour in future
	apicVersion = connectionProperties.apiVersion;

	// get identifier
	apicUrl = connectionProperties.apiIdentifier;
	
	// check configuration
	if(!apicUsername || !apicPassword || !apicVersion || !apicUrl) {
		var message = logger.Globalize.formatMessage("apicCLIMissingConfiguration");
		var e = new Error(message);
		logger.error(e);
		throw e;
	}
	
	// get server from url
	apicServer = apicUrlUtils.getHostFromApicUrl(apicUrl);

	// get provider org from url
	apicPOrg = apicUrlUtils.getPOrgFromApicUrl(apicUrl);	

	// get default catalog
	apicCatalog = apicUrlUtils.getCatalogFromApicUrl(apicUrl);
	
	apicSpace=apicUrlUtils.getSpaceFromApicUrl(apicUrl);	
	
	// now set them on the CLI
	var promise;
	if(noLogin) {
		logger.debug("Not logging in due to noLogin being: " + noLogin);
	} else {
		if(apicUrl.indexOf('apic-space')!==-1){
			promise = _runAPICCommand([ "config:set", "space=" + apicUrl])
			.then(function(data) {
				return _runAPICCommand([ "login", "--username", apicUsername, "--password", apicPassword, "--server", apicServer]);
			});	
		}else{
			promise = _runAPICCommand([ "config:set", "catalog=" + apicUrl])
			.then(function(data) {
				return _runAPICCommand([ "login", "--username", apicUsername, "--password", apicPassword, "--server", apicServer]);
			});
		}
	}

	logger.exit("apimcli.setConnectionDetails", promise);
	return promise;
}

// Get the version of the CLI, not the APIC server. Returns promise with the version string output which is the
// version of each component.
function getVersion(inputOptions) {
	logger.entry("apimcli.getVersion");
	if(inputOptions.apicToolkitTimeout){
		apicToolkitTimeout=inputOptions.apicToolkitTimeout;
	}
    var promise= _runAPICCommand(["--version"]).timeout(apicToolkitTimeout).catch(Promise.TimeoutError, function(e){
        var err = new Error();
        err.message= logger.Globalize.formatMessage("apicToolkitTimeout",apicToolkitTimeout)+"\n"+logger.Globalize.formatMessage("apicToolkitLicenseNotAccepted");
        err.code="ETIMEOUT";
        throw err;
}).catch(function(e){
	//This catch, catches the ETIMEOUT through
		var err;
		if(e.code==="ETIMEOUT"){
			err = e;
		}else{
			err = new Error(e);
			err.message= logger.Globalize.formatMessage("apicrunfailed");
			err.code="ECOMDNOTFOUND";
		}
        throw err;
});    
	logger.exit("apimcli.getVersion", promise);
	return promise;
}

/*
 * Logout from APIC, if already logged out, do not pass the error back.
 */
function logout() {
	logger.entry("apimcli.logout");
	
	var promise= _runAPICCommand(["logout", "--server", apicServer]).caught(function(error) {
		// ignore the error
		logger.debug("Ignoring error from logout: " + error);
	});
	
	logger.exit("apimcli.logout", promise);
	return promise;
}

// Validate file, if the promise resolves this indicates it was ok.
function validate(fileName) {
	logger.entry("apimcli.validate", fileName);
	
	var promise= _runAPICCommand(["validate", fileName]);
	
	logger.exit("apimcli.validate", promise);
	return promise;
}

// Push file into drafts. If product yaml, pushed referenced APIs. If API swagger pushes just the API.
// Returns a promise that resolves if push worked.
function push(fileName) {
	logger.entry("apimcli.push", fileName);
	
	var promise= _runAPICCommand(["drafts:push", fileName, "--server", apicServer, "--organization", apicPOrg]);

	logger.exit("apimcli.push", promise);
	return promise;
}

//Push file into drafts. If product yaml, pushed referenced APIs. If API swagger pushes just the API.
// workingDir is the directory to run the command in.
// Returns a promise that resolves if push worked.
function pushFromDir(fileName, workingDir) {
	logger.entry("apimcli.pushFromDir", fileName, workingDir);
	
	var promise= _runAPICCommand(["drafts:push", fileName, "--server", apicServer, "--organization", apicPOrg], workingDir);

	logger.exit("apimcli.pushFromDir", promise);
	return promise;
}

/*
 * From the output of the CLI, extract the details of the API yaml and API created 
 * for a WSDL file/zip or a Rest create.
 *
 * { yamlName: file name of the yaml that was created
 *   x-ibm-name: x-ibm-name of the API
 *   version: version of the API 
 * }
 * 
 * The APIC CLI seems to create the YAML with the name of the WSDL Service element, lower cased,
 * but can append -1 or -x on the end if a yaml already exists. The output is like:
 * 
 * Created basicservice.yaml API definition [basicservice:1.0.0] 
 * Created test.yaml API definition [test:1.0.0]
 * 
 */
function _extractCreateResults(stdout) {
	logger.entry("apimcli._extractCreateResults", stdout);
	
	var result = {yamlName: null, xIBMName: null, version: null};
	
	// find space then any number of words ending in .yaml then a space, capture name including yaml
	var regexp = /\s([\S]*\.yaml)\s/g;
	var match = regexp.exec(stdout);
	if(match[1]) {
		result.yamlName = match[1];
	}
	
	// find the API details - [ followed by non space followed by ] at the end, capture part in the []
	// multiline flag because there can be \n at the end
	regexp = /\[(\S*):(\S*)\]$/mg;
	match = regexp.exec(stdout);
	if(match[1]) {
		result.xIBMName = match[1];
	}
	if(match[2]) {
		result.version = match[2];
	}
	
	logger.exit("apimcli._extractCreateResults", result);
	return result;
}

/*
 * Create an API yaml from a WSDL file or ZIP containing WSDL and XSDs.
 * 
 * wsdlFilename - location from the working directory to the file which is the WSDL or a ZIP containing
 * the WSDLs and XSDs.
 * workingDir - the directory to run the command in.
 * 
 * Returns Promise which resolves with an object:
 * { yamlName: file name of the yaml that was created
 *   x-ibm-name: x-ibm-name of the API
 *   version: version of the API 
 * }
 *    
 * Rejected if an error happens with object with properties stdout and stderr.  
 * 
 */
function createAPIFromWSDL(wsdlFilename, workingDir) {
	logger.entry("apimcli.createAPIFromWSDL", wsdlFilename, workingDir);

	var promise= _runAPICCommand(["create", "--type", "api", "--wsdl", "\"" + wsdlFilename + "\""], workingDir).then(function(result) {
		// get standard out to get the data
		var out = result.stdout;
		var result2 = _extractCreateResults(out);
		return result2;
	});	
	
	logger.exit("apimcli.createAPIFromWSDL", promise);
	return promise;
}

/*
 * Create an API yaml for a REST service.
 * 
 * title - title of the API
 * filename - filename to store the yaml definition
 * workingDir - the directory to run the command in.
 * 
 * Returns Promise which resolves with an object:
 * { yamlName: file name of the yaml that was created
 *   x-ibm-name: x-ibm-name of the API
 *   version: version of the API 
 * }
 *    
 * Rejected if an error happens with object with properties stdout and stderr.  
 * 
 */
function createAPIForREST(title, filename, workingDir) {
	logger.entry("apimcli.createAPIForREST", title, filename, workingDir);

	var promise= _runAPICCommand(["create", "--type", "api", "--title", "\"" + title + "\"", "--filename", "\"" + filename + "\""], workingDir).then(function(result) {
		// get standard out to get the data
		var out = result.stdout;
		var result2 = _extractCreateResults(out);
		return result2;
	});	
	
	logger.exit("apimcli.createAPIForREST", promise);
	return promise;
}

//Stage file into a catalog. If product yaml, pushed referenced APIs. If API swagger pushes just the API.
//workingDir is the directory to run the command in.
// Returns a promise that resolves if stage worked.
function stageFromDir(fileName, workingDir) {
	logger.entry("apimcli.stageFromDir", fileName, workingDir);
	
	var promise= _runAPICCommand(["publish", "--stage", fileName, "--server", apicServer, "--organization", apicPOrg], workingDir);
	
	logger.exit("apimcli.stageFromDir", promise);
	return promise;
}

//Publish file into a catalog. If product yaml, pushed referenced APIs. If API swagger pushes just the API.
//workingDir is the directory to run the command in.
// Returns a promise that resolves if publish worked.
function publishFromDir(fileName, workingDir) {
	logger.entry("apimcli.publishFromDir", fileName, workingDir);
	
	var promise= _runAPICCommand(["publish", fileName, "--server", apicServer, "--organization", apicPOrg], workingDir);
	
	logger.exit("apimcli.publishFromDir", promise);
	return promise;
}

//Publish product in drafts into a catalog. 
//workingDir is the directory to run the command in.
//Returns a promise that resolves if publish worked.
//Throws if the name and version are not specified
function publishFromDrafts(productName, productVersion, catalogName, workingDir, spaceName) {
	logger.entry("apimcli.publishFromDrafts", productName, productVersion, catalogName, workingDir, spaceName);
	
	if(productName === "" || productVersion === "") {
		throw new Error("Product name and version must be specified: name: " + productName + " version: " + productVersion);
	}
	var promise;
	if(spaceName){
		promise= _runAPICCommand(["drafts:publish", productName + ":" + productVersion, "--scope","space","--catalog", catalogName, "--server", apicServer, "--organization", apicPOrg,"--space",spaceName], workingDir);
	}else{
		promise= _runAPICCommand(["drafts:publish", productName + ":" + productVersion, "--catalog", catalogName, "--server", apicServer, "--organization", apicPOrg], workingDir);
	}
	logger.exit("apimcli.publishFromDrafts", promise);
	return promise;
}

//Delete product from a catalog. 
//workingDir is the directory to run the command in.
//Returns a promise that resolves if delete worked.
//Throws if the name and version are not specified
function productsDelete(productName, productVersion, catalogName,spaceName) {
	logger.entry("apimcli.productsDelete", productName, productVersion, catalogName,spaceName);
	
	if(productName === "" || productVersion === "") {
		throw new Error("Product name and version must be specified: name: " + productName + " version: " + productVersion);
	}
	var promise;
	if(spaceName){
		promise= _runAPICCommand(["products:delete", productName + ":" + productVersion, "--scope","space","--catalog", catalogName, "--server", apicServer, "--organization", apicPOrg,"--space",spaceName]);
	}else{
		promise= _runAPICCommand(["products:delete", productName + ":" + productVersion, "--catalog", catalogName, "--server", apicServer, "--organization", apicPOrg]);
	}
	logger.exit("apimcli.productsDelete", promise);
	return promise;
}

/* Set a product to various things.
 *
 * productName - name of product
 * productVersion - version, can be null
 * status - value for status, can be null or (staged|published|deprecated|retired|archived)
 * ... eventually other things
 * catalogName - name of catalog
 *  
 * Returns a promise that resolves if set worked.
 */
function productsSet(productName, productVersion, status, catalogName,spaceName) {
	logger.entry("apimcli.productsSet", productName, productVersion, status, catalogName,spaceName);
	
	var prodName = productName;
	if(productVersion) {
		prodName += ":" + productVersion;
	}
	
	var options = null;
	if(status) {
		options = "--status " + status;
	}

	//TODO: caller need to specify something to set...
	
	var promise
	if(apicSpace){
		promise= _runAPICCommand(["products:set", prodName, options, "--scope","space","--catalog", catalogName, "--server", apicServer, "--organization", apicPOrg,"--space",apicSpace]);
	}else{
		promise= _runAPICCommand(["products:set", prodName, options, "--catalog", catalogName, "--server", apicServer, "--organization", apicPOrg]);
	}
	
	logger.exit("apimcli.productsSet", promise);
	return promise;
}

/*
 * Return the default catalog on the apiIdentifier URL.
 */ 
function getDefaultCatalog() {
	logger.entry("apimcli.getDefaultCatalog");
	
	logger.exit("apimcli.getDefaultCatalog", apicCatalog);
	return apicCatalog;
}

/* 
 * get "publish" configuration indicating whether to publish or not.
 * Returns true or false.
 */
function getPublishMode() {
	logger.entry("apimcli.getPublishMode");
	
	// default of false
	var publish = false;
	if(configuration.publish && configuration.publish === "true") {
		publish = true;
	}
	
	logger.exit("apimcli.getPublishMode", publish);
	return publish;
}

/* 
 * get "createConsumers" configuration indicating whether to create consumers or not.
 * Returns true or false.
 */
function getConsumersMode() {
	logger.entry("apimcli.getConsumersMode");
	
	// default of false
	var consumers = false;
	if(configuration.createConsumers && configuration.createConsumers === "true") {
		consumers = true;
	}
	
	logger.exit("apimcli.getConsumersMode", consumers);
	return consumers;
}

/*
 * Get list of catalogs to publish to. Returns array of catalog name string.
 * From "publishCatalogs" configuration.
 * 
 * If not specified, returns the default catalog in the array.
 * 
 */
function getPublishCatalogs() {
	logger.entry("apimcli.getPublishCatalogs");
	
	var catalogs = [];
	if(configuration.publishCatalogs) {
		// split up
		catalogs = configuration.publishCatalogs.split(",");
	} else {
		// default one
		catalogs.push(apicCatalog);
	}
	
	logger.exit("apimcli.getPublishCatalogs", catalogs);	
	return catalogs;
}

/*
 * Get a map of catalog to developer org name from config.
 * 
 * These are stored as keys "apiDeveloperOrgName_<catalog name>=<dev org name>"
 * The catalogs come from getPublishCatalogs()
 * 
 * If a dev org name cannot be found, throw an Error.
 * 
 * Returns map.
 */
function getCatalogToDevOrg() {
	logger.entry("apimcli.getCatalogToDevOrg");

	var catalogToDevOrg = {};
	
	var catalogs = getPublishCatalogs();
	
	for(var i = 0, len = catalogs.length; i < len; i++) {
		var catalog = catalogs[i];
		var configDevOrg = configuration["apiDeveloperOrgName_" + catalog];
		if(configDevOrg) {
			// add
			catalogToDevOrg[catalog] = configDevOrg;
		} else {
			// error no dev org id
			var msg = logger.Globalize.formatMessage("errorNoDevOrgNameForCatalog", catalog);
			var error = new Error(msg);
			logger.error(msg);
			logger.exit("apimcli.getCatalogToDevOrg", error);
			throw error;
		}
	}
	
	logger.exit("apimcli.getCatalogToDevOrg", catalogToDevOrg);
	return catalogToDevOrg;
}

function getCatalogToSpace(){
	logger.entry("apimcli.getCatalogToSpace");

	var catalogToSpace = {};
	
	var catalogs = getPublishCatalogs();
	
	for(var i = 0, len = catalogs.length; i < len; i++) {
		var catalog = catalogs[i];
		var configSpace = configuration["apicSpaceName_" + catalog];
		if(configSpace) {
			// add
			catalogToSpace[catalog] = configSpace;
		}
	}
	
	logger.exit("apimcli.getCatalogToSpace", catalogToSpace);
	return catalogToSpace;
}

module.exports = {
	getVersion: getVersion,
	setConnectionDetails: setConnectionDetails,
	logout: logout,
	validate: validate,
	push: push,
	pushFromDir: pushFromDir,
	createAPIFromWSDL: createAPIFromWSDL,
	createAPIForREST: createAPIForREST,
	stageFromDir: stageFromDir,
	publishFromDir: publishFromDir,
	publishFromDrafts: publishFromDrafts,
	getDefaultCatalog: getDefaultCatalog,
	getPublishCatalogs: getPublishCatalogs,
	getPublishMode: getPublishMode,
	getCatalogToDevOrg: getCatalogToDevOrg,
	getCatalogToSpace:getCatalogToSpace,
	getConsumersMode: getConsumersMode,
	productsSet: productsSet,
	productsDelete:productsDelete,

	// for testing only
	_test_runAPICCommand: _runAPICCommand,
	_test_obfuscateSensitiveData: _obfuscateSensitiveData,
	_test_extractCreateResults: _extractCreateResults
};
