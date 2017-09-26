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
'use strict';

// Flow module which encapsulates the processing needed to achieve tasks for the tool

var logger = require("./Logger"), Promise = require("bluebird"), wsrrQueries = require("./WSRR/wsrrqueries"),
templating = require("./templating"), ttData = require("./ttData"), ttStorage = require("./ttStorage"),
ttResults = require("./ttResults"), path = require("path"), swaggerUtils = require("./swaggerUtils"),
flowConsumers = require('./flowConsumers'), flowPublish = require('./flowPublish'), pluginLoader = require('./pluginLoader'),
chardet=require('chardet'),iconv=require('iconv-lite');


/*
 * Load the plugins using the pluginLoader module.
 * 
 * Separate function in case we need to do extra work in future.
 */
function _loadPlugins() {
	logger.entry("_loadPlugins");

	// for now just call load plugins, because the node process ends after each tool run and each call to flow.
	pluginLoader.loadPlugins();
	
	logger.exit("_loadPlugins");
}

/*
 * Get the SLDs and endpoints for the version, and the consumers for each SLD.
 * Add the SLD and endpoints and consumers to the overallData object.
 * 
 * Returns a Promise that resolves with no data when done.
 * 
 * version - version object
 * bsBsrURI - business service bsrURI
 * configuration - key:value pair config
 * wsrrUtils - WSRRUtils module
 * overallData - the ttData object to add the SLD and endpoints to
 * singleSV - if running for a single version (true)
 */
function _getSLDsAndEndpointsAndConsumersForVersion(version, bsBsrURI, configuration, wsrrUtils, overallData, singleSV) {
	logger.entry("_getSLDsAndEndpointsAndConsumersForVersion", version, bsBsrURI, configuration, wsrrUtils, overallData, singleSV);
	
	var bsrURI = version.bsrURI;
	var sldData = null;
	var xpath = wsrrQueries.getQueryXPath(wsrrQueries.SLDsForServiceVersion, configuration);
	xpath = wsrrQueries.resolveInserts(xpath, bsrURI);
	logger.info(logger.Globalize.formatMessage("flowFetchSLDsForVersion", version.properties.name, version.properties.version, bsrURI));
	// query for SLDs for the version
	var promise = wsrrUtils.runGraphQuery(xpath)
	.then(function(data) {
		logger.entry("_getSLDsAndEndpointsAndConsumersForVersion_sldcallback", data);
		logger.info(logger.Globalize.formatMessage("flowFetchedSLDs"));
		// store SLDs
		sldData = data;
		for(var i = 0; i < sldData.length; i++) {
			overallData.addSLD(sldData[i], bsrURI);
		}
		// get endpoints for each SLD
		var promisesForEndpoints = [];
		if(sldData.length > 0) {
			logger.info(logger.Globalize.formatMessage("flowFetchingEndpointsForSLD"));
			for(i = 0; i < sldData.length; i++) {
				var soapRestPromises = [];
				// SOAP
				var endpointXpath = wsrrQueries.getQueryXPath(wsrrQueries.SOAPEndpointsForSLD, configuration);
				var sldBsrURI = sldData[i].bsrURI;
				endpointXpath = wsrrQueries.resolveInserts(endpointXpath, sldBsrURI);
				logger.info(logger.Globalize.formatMessage("flowFetchingSOAPEndpointsForSLD", sldData[i].properties.name, sldBsrURI));
				var endpointPromise = wsrrUtils.runGraphQuery(endpointXpath);
				soapRestPromises.push(endpointPromise);
				// REST
				endpointXpath = wsrrQueries.getQueryXPath(wsrrQueries.RESTEndpointsForSLD, configuration);
				endpointXpath = wsrrQueries.resolveInserts(endpointXpath, sldBsrURI);
				logger.info(logger.Globalize.formatMessage("flowFetchingRESTEndpointsForSLD", sldData[i].properties.name, sldBsrURI));
				endpointPromise = wsrrUtils.runGraphQuery(endpointXpath);
				soapRestPromises.push(endpointPromise);
				
				// now add both to the overall promises
				promisesForEndpoints.push(Promise.all(soapRestPromises));
			}
			// now return promise which waits for all of these then processes the results
			var endpointsForSLDsPromise = Promise.all(promisesForEndpoints).then(function(allData){
				logger.entry("_getSLDsAndEndpointsAndConsumersForVersion_endpointsallcallback", allData);
				logger.info(logger.Globalize.formatMessage("flowFetchedEndpoints"));
				// allData is an array each entry is the result of an endpoint query promise
				// and we have the same number of entries as SLDs
				for(var i = 0; i < sldData.length; i++) {
					var sld = sldData[i];
					var endpointsForSLD = allData[i];
					// SOAP is the first entry and REST the second
					var soapEndpoints = endpointsForSLD[0];
					// endpoints result is an array, add to data, are all SOAP
					overallData.addEndpointsToSLD(soapEndpoints, sld.bsrURI, "SOAP");
					var restEndpoints = endpointsForSLD[1];
					// endpoints result is an array, add to data, are all REST
					overallData.addEndpointsToSLD(restEndpoints, sld.bsrURI, "REST");					
				}
				// now the data is complete, return
				logger.exit("_getSLDsAndEndpointsAndConsumersForVersion_endpointsallcallback");
			}).then(function() {
				// now get the consumers for the SLDs
				logger.entry("_getSLDsAndEndpointsAndConsumersForVersion_getconsumers");
				
				var promisesForConsumers = [];
				logger.info(logger.Globalize.formatMessage("flowFetchingConsumersForSLDs"));
				for(i = 0; i < sldData.length; i++) {
					var sldBsrURI = sldData[i].bsrURI;
					var consumerPromise = flowConsumers.getConsumersForSLD(sldData[i], bsrURI, bsBsrURI, overallData, configuration, wsrrUtils, singleSV);
					promisesForConsumers.push(consumerPromise);
				}
				var consumersPromise = Promise.all(promisesForConsumers);
				
				logger.exit("_getSLDsAndEndpointsAndConsumersForVersion_getconsumers", consumersPromise);
				return consumersPromise;
			});
			logger.exit("_getSLDsAndEndpointsAndConsumersForVersion_sldcallback", endpointsForSLDsPromise);
			return endpointsForSLDsPromise;
		} else {
			logger.info(logger.Globalize.formatMessage("flowFetchNoSLDsFound"));
			// no more fetches to do, return
			logger.exit("_getSLDsAndEndpointsAndConsumersForVersion_sldcallback");
		}		
	});	
	
	logger.exit("_getSLDsAndEndpointsAndConsumersForVersion", promise);
	return promise;
}

/*
 * Download artifacts for the business service and version from WSRR and then store.
 * Gets charter and artifacts from the business service. Gets the artifacts from the
 * service version. Gets rest interface documents.
 * 
 * versionBsrURI - bsrURI of the version
 * capabilityBsrURI - bsrURI of the business capability
 * wsrrUtils - initialized wsrrUtils
 * 
 * Returns Promise that resolves when the download and store is done.
 */
function _getArtifactsAndStore(capabilityBsrURI, versionBsrURI, wsrrUtils) {
	logger.entry("_getArtifactsAndStore", capabilityBsrURI, versionBsrURI, wsrrUtils);
	
	// download first
	var bsArtifactsPromise = wsrrUtils.downloadArtifactDocumentsForService(capabilityBsrURI);
	var bsCharterPromise = wsrrUtils.downloadCharterDocumentsForService(capabilityBsrURI);
	var vArtifactsPromise = wsrrUtils.downloadArtifactDocumentsForService(versionBsrURI);
	var vRestPromise = wsrrUtils.downloadRESTDocumentsForService(versionBsrURI, false);
	
	var promise = Promise.all([bsArtifactsPromise, bsCharterPromise, vArtifactsPromise, vRestPromise]).then(function(dataArray) {
		logger.entry("_getArtifactsAndStore_download_callback", dataArray);
		
		// dataArray is an array of 4 arrays each are document data, last 2 are for the version
		var versionDocs = dataArray[2].concat(dataArray[3]);
		// combine capability data into one array
		var capabilityDocs = dataArray[0].concat(dataArray[1]);
		
		// store
		var vStorePromise = ttStorage.storeServiceVersionArtifacts(capabilityBsrURI, versionBsrURI, versionDocs);
		var bsStorePromise = ttStorage.storeBusinessServiceArtifacts(capabilityBsrURI, capabilityDocs);
		
		var storePromise = Promise.all([vStorePromise, bsStorePromise]);
		
		logger.exit("_getArtifactsAndStore_download_callback", storePromise);
		return storePromise;
	});	
	
	logger.exit("_getArtifactsAndStore", promise);
	return promise;
}


/*
 * Do the processing for the SOAP version specific to SOAP services.
 * - get WSDL and XSD
 * - store on disc
 * - generate WSRR YAML using templates and WSRR data
 * - create WSDL Yaml
 * - merge WSDL Yaml and WSRR Yaml into API Yaml (with WSRR Yaml as priority) and store
 * 
 * Product per version mode.
 * 
 * If an error happens, throw it.
 * 
 * Returns Promise which resolves when done, with an object with {productName, productVersion, plans: [plan names]}.
 * 
 */
function _processSOAPVersion(version, capability, overallData, configuration, wsrrUtils, apiCli){
	logger.entry("_processSOAPVersion", version, capability, overallData, configuration, wsrrUtils, apiCli);
	
	var bsrURI = version.bsrURI;
	var bsBsrURI = capability.bsrURI;
	
	var apiString = null;
	var productString = null;
	var productObject = null;

	var wsrrYaml = null;
	
	var wsdlDirectoryPath = null;

	// product details from the generated yaml
	var productName = null;
	var productVersion = null;
	
	logger.info(logger.Globalize.formatMessage("flowFetchingWSDLs", version.properties.name, version.properties.version, bsrURI));
	var promise = wsrrUtils.downloadServiceDocumentsForService(bsrURI).then(function(wsdlData){
		logger.entry("_processSOAPVersion_wsdldocuments_callback");
		logger.info(logger.Globalize.formatMessage("flowFetchedWSDLs"));
		// check if we got anything, if not we cannot transfer
		if(wsdlData.length === 0) {
			var wsdlMsg = logger.Globalize.formatMessage("wsrrErrorNoWSDLOnVersion", version.properties.name);
			logger.info(wsdlMsg);
			// throw for now to make it stop processing this version
			throw new Error(wsdlMsg);
		}
		
		// write to disk so we don't fill the memory up
		var storePromise = ttStorage.storeWSDL(bsBsrURI, bsrURI, wsdlData);
		logger.exit("_processSOAPVersion_wsdldocuments_callback", storePromise);
		return storePromise;
	}).then(function(){
		logger.entry("_processSOAPVersion_storeWSDL_callback");
		logger.info(logger.Globalize.formatMessage("flowGeneratingYaml"));
	
		// generate WSRR API YAML using template and data in WSRR into file
		var template = templating.getTemplate(templating.SOAP);
		var productTemplate = templating.getTemplate(templating.PRODUCT_PER_VERSION);
		
		var apiData = overallData.getApiData(bsrURI);
		apiString = templating.generateStringFromYamlTemplate(template, apiData);
		
		//var apiObject = templating.generateObjectFromYamlTemplate(template, apiData);
		
		var productData = overallData.getProductData(bsrURI);
		productString = templating.generateStringFromYamlTemplate(productTemplate, productData);
		//var productObject = templating.generateObjectFromYamlTemplate(productTemplate, productData);
	
		// store string version of yaml for diagnostic
		var productStringPromise = ttStorage.storeDiagnosticString(bsBsrURI, bsrURI, productString, "productFromTemplate.yaml");
		var apiStringPromise = ttStorage.storeDiagnosticString(bsBsrURI, bsrURI, apiString, "apiFromTemplate.yaml");
		var writesStringPromise = Promise.all([productStringPromise, apiStringPromise]);
		
		logger.exit("_processSOAPVersion_storeWSDL_callback", writesStringPromise);
		return writesStringPromise;
	}).then(function(){
		logger.entry("_processSOAPVersion_writeWSRRYamls_callback");
		logger.info(logger.Globalize.formatMessage("flowCreatingWSDLYaml"));
		
		// run apic command to create wsdl yaml pointing to wsdl zip
		var wsdlFilename = ttStorage.getWSDLZipName(bsBsrURI, bsrURI);
		wsdlDirectoryPath = ttStorage.getProductDirectoryPath(bsBsrURI, bsrURI);
		// run in the folder where the WSDL zip is
		var wsdlYamlGenPromise = apiCli.createAPIFromWSDL(wsdlFilename, wsdlDirectoryPath);
		
		logger.exit("_processSOAPVersion_writeWSRRYamls_callback", wsdlYamlGenPromise);
		return wsdlYamlGenPromise;
	}).then(function(wsdlObject){
		logger.entry("_processSOAPVersion_generateSOAPYaml_callback", wsdlObject);
		logger.info(logger.Globalize.formatMessage("flowCreatingAPIYaml"));
		
		var yamlFileName = wsdlObject.yamlName;
		var wsdlYamlPath = path.resolve(wsdlDirectoryPath, yamlFileName);
		
		// move to storage
		var movePromise = ttStorage.moveWSDLYaml(wsdlYamlPath, bsBsrURI, bsrURI);
		
		logger.exit("_processSOAPVersion_generateSOAPYaml_callback", movePromise);
		return movePromise;
	}).then(function() {
		logger.entry("_processSOAPVersion_moveSOAPYaml_callback");
	
		// read YAML into node as JS object
		var wsdlYamlPromise = ttStorage.readWSDLYaml(bsBsrURI, bsrURI);
		
		logger.exit("_processSOAPVersion_moveSOAPYaml_callback", wsdlYamlPromise);
		return wsdlYamlPromise;
	}).then(function(wsdlYaml){
		logger.entry("_processSOAPVersion_loadBothYaml_callback", wsdlYaml);
		wsrrYaml = templating.generateObjectFromYamlString(apiString);
		// combine taking WSRR yaml as precident
		var apiYaml = templating.combineApiYamlObjects(wsdlYaml, wsrrYaml);
	
		// write out api yaml
		logger.info(logger.Globalize.formatMessage("flowSavingAPIYaml"));
		var apiWritePromise = ttStorage.storeApiYaml(bsBsrURI, bsrURI, apiYaml);
		
		logger.exit("_processSOAPVersion_loadBothYaml_callback", apiWritePromise);
		return apiWritePromise;
	}).then(function() {
		logger.entry("_processSOAPVersion_diagDumpYaml_callback");
		
		// create product and API Yaml objects
		
		productObject = templating.generateObjectFromYamlString(productString);

		// store product details
		if(productObject.info) {
			productName = productObject.info.name;
			productVersion = productObject.info.version;
		}		
		
		logger.info(logger.Globalize.formatMessage("flowStoringYaml"));
	
		// write objects out now as product and WSRR api yamls
		var productPromise = ttStorage.storeProductYaml(bsBsrURI, bsrURI, productObject);
		var apiPromise = ttStorage.storeWSRRApiYaml(bsBsrURI, bsrURI, wsrrYaml);
		
		var writesPromise = Promise.all([productPromise, apiPromise]);
		logger.exit("_processSOAPVersion_diagDumpYaml_callback", writesPromise);
		return writesPromise;
	}).then(function() {
		logger.entry("_processSOAPVersion_writeAPIYaml_callback");
		// return product details with plans
		var plans = [];
		if(productObject.plans) {
			// plan names are the keys of the plans object
			plans = Object.keys(productObject.plans);
		}
		var details = {productName: productName, productVersion: productVersion, plans: plans};
		
		logger.exit("_processSOAPVersion_writeAPIYaml_callback", details);
		return details;
	});

	logger.exit("_processSOAPVersion", promise);
	return promise;
}

/*
 * Do the processing for the REST version specific to REST services.
 * - decide if there is swagger or not in WSRR
 * - generate YAML using templates and WSRR data
 * (DO NOT create "created" APIC REST Yaml using the APIC toolkit create - because it has a lot of default paths and types we do not want)
 * (if attached swagger, get the attached swagger then merge with the "created" APIC REST YAML with priority of the attached swagger to make the REST Yaml)
 * - merge Swagger REST Yaml and WSRR Yaml into API Yaml (with priority of the WSRR Yaml) and store (if Swagger)
 * 
 * Product per version mode.
 * 
 * If an error happens, throw it.
 * 
 * Returns Promise which resolves when done, with an object with {productName, productVersion, plans: [plan names]}.
 * 
 */
function _processRESTVersion(version, capability, overallData, configuration, wsrrUtils, apiCli){
	logger.entry("_processRESTVersion", version, capability, overallData, configuration, wsrrUtils, apiCli);

	var bsrURI = version.bsrURI;
	var bsBsrURI = capability.bsrURI;
	
	var apiString = null;
	var wsrrApiObject = null;
	var productString = null;
	var productObject = null;

	// swagger from WSRR string
	var swaggerFromWSRRString = null;
	var swaggerFromWSRRName = null;
	// object version
	var swaggerFromWSRRObject = null;
	
	// combined APIC created REST and wsrr downloaded swagger (or just APIC created if no WSRR swagger)
	var restYaml = null;
	
	// product details from the generated yaml
	var productName = null;
	var productVersion = null;

	logger.info(logger.Globalize.formatMessage("flowFetchingSwagger", version.properties.name, version.properties.version, bsrURI));
	var promise = wsrrUtils.downloadRESTDocumentsForService(bsrURI, true).then(function(swaggerData){
		logger.entry("_processRESTVersion_swaggerdocuments_callback", swaggerData);
		
		logger.info(logger.Globalize.formatMessage("flowFetchedSwagger"));

		// warning we take first
		if(swaggerData.length > 1) {
			var msg = logger.Globalize.formatMessage("flowFetchedMultipleSwagger", swaggerData[0].name);
			logger.info(msg);
		}
		// store for diagnostics as "swaggerFromWSRR_<name of doc>"
		var storePromise = null;
		if(swaggerData.length > 0) {
			var encoding = chardet.detect(swaggerData[0].content);
			if(iconv.encodingExists(encoding)){					
				swaggerFromWSRRString = iconv.decode(swaggerData[0].content,encoding);			
				swaggerFromWSRRName = swaggerData[0].name;
				storePromise = ttStorage.storeDiagnosticString(bsBsrURI, bsrURI, swaggerFromWSRRString, "swaggerFromWSRR_" + swaggerFromWSRRName);
			} else{
				logger.debug(logger.Globalize.formatMessage("unsupportDocumentEncoding",swaggerData[0].name));				
			}
		} else {
			// return an already resolved promise
			storePromise = Promise.resolve();
		}
		logger.exit("_processRESTVersion_swaggerdocuments_callback", storePromise);
		return storePromise;
	}).then(function(){
		logger.entry("_processRESTVersion_storeWSRRSwagger_callback");
		
		// validate if we got a swagger from WSRR
		if(swaggerFromWSRRString) {
			try {
				swaggerFromWSRRObject = swaggerUtils.generateSwaggerObject(swaggerFromWSRRString, swaggerFromWSRRName);
			}catch(e) {
				// error is not valid
				logger.debug(e);
				throw e;
			}
		}
		
		logger.info(logger.Globalize.formatMessage("flowGeneratingYaml"));
	
		// generate WSRR API YAML using template and data in WSRR into file
		var templateName = null;
		// if we have swagger use a different template than if not
		if(swaggerFromWSRRString) {
			templateName = templating.REST_SWAGGER;
		} else {
			templateName = templating.REST;
		}
		var template = templating.getTemplate(templateName);
		var productTemplate = templating.getTemplate(templating.PRODUCT_PER_VERSION);
		
		var apiData = overallData.getApiData(bsrURI);
		apiString = templating.generateStringFromYamlTemplate(template, apiData);
		
		var productData = overallData.getProductData(bsrURI);
		productString = templating.generateStringFromYamlTemplate(productTemplate, productData);
	
		// store string version of yaml for diagnostic
		var productStringPromise = ttStorage.storeDiagnosticString(bsBsrURI, bsrURI, productString, "productFromTemplate.yaml");
		var apiStringPromise = ttStorage.storeDiagnosticString(bsBsrURI, bsrURI, apiString, "apiFromTemplate.yaml");
		var writesStringPromise = Promise.all([productStringPromise, apiStringPromise]);
		
		logger.exit("_processRESTVersion_storeWSRRSwagger_callback", writesStringPromise);
		return writesStringPromise;
	}).then(function() {
		logger.entry("_processRESTVersion_diagDumpYaml_callback");
		
		// create product and API Yaml objects
		wsrrApiObject = templating.generateObjectFromYamlString(apiString);
		productObject = templating.generateObjectFromYamlString(productString);

		// store product details
		if(productObject.info) {
			productName = productObject.info.name;
			productVersion = productObject.info.version;
		}		
		
		logger.info(logger.Globalize.formatMessage("flowStoringYaml"));
	
		// write objects out now as product and WSRR api yamls
		var productPromise = ttStorage.storeProductYaml(bsBsrURI, bsrURI, productObject);
		var apiPromise = ttStorage.storeWSRRApiYaml(bsBsrURI, bsrURI, wsrrApiObject);
		
		var writesPromise = Promise.all([productPromise, apiPromise]);
		logger.exit("_processRESTVersion_diagDumpYaml_callback", writesPromise);
		return writesPromise;
	}).then(function(){
		logger.entry("_processRESTVersion_writeWSRRYamls_callback");
/*		
		logger.info(logger.Globalize.formatMessage("flowCreatingRESTYaml"));
		
		// run apic command to create REST yaml
		var createdDirectory = ttStorage.getCreatedRestDirectory(bsBsrURI, bsrURI);
		var createdName = ttStorage.getCreatedRestName(bsBsrURI, bsrURI);
		// use service version name as the title of the API (should be overwritten by the WSRR template later)
		var restYamlGenPromise = apiCli.createAPIForREST(version.properties.name, createdName, createdDirectory);
		
		logger.exit("_processRESTVersion_writeWSRRYamls_callback", restYamlGenPromise);
		return restYamlGenPromise;
	}).then(function(restObject){
		logger.entry("_processRESTVersion_generateRESTYaml_callback", restObject);
		
		logger.info(logger.Globalize.formatMessage("flowCreatingRESTAPIYaml"));
		
		// read YAML into node as JS object
		var restYamlPromise = ttStorage.readCreatedRESTYaml(bsBsrURI, bsrURI);
		
		logger.exit("_processRESTVersion_generateRESTYaml_callback", restYamlPromise);
		return restYamlPromise;
	}).then(function(createdYaml){
		logger.entry("_processRESTVersion_loadCreatedYaml_callback", createdYaml);
*/
		// if attached swagger, get the attached swagger then merge with the WSRR YAML with priority of the attached swagger
		if(swaggerFromWSRRObject) {
			restYaml = templating.combineApiYamlObjects(swaggerFromWSRRObject, wsrrApiObject);
		} else {
			// just use the APIC created object 
			restYaml = wsrrApiObject;
		}
/*
		// store combined for diagnostics
		var storeCombinedPromise = ttStorage.storeCombinedRESTYaml(bsBsrURI, bsrURI, restYaml);
		logger.exit("_processRESTVersion_loadBothYaml_callback", storeCombinedPromise);
		return storeCombinedPromise;
	}).then(function() {
		logger.entry("_processRESTVersion_storeCreatedYaml_callback");
		// merge REST Yaml and WSRR Yaml into API Yaml and store

		// combine taking WSRR yaml as precident
		var apiYaml = templating.combineApiYamlObjects(restYaml, wsrrApiObject);
*/
		var apiYaml = restYaml;
		
		// write out api yaml
		logger.info(logger.Globalize.formatMessage("flowSavingAPIYaml"));
		var apiWritePromise = ttStorage.storeApiYaml(bsBsrURI, bsrURI, apiYaml);
		
		logger.exit("_processRESTVersion_storeCreatedYaml_callback", apiWritePromise);
		return apiWritePromise;
	}).then(function(){
		logger.entry("_processRESTVersion_writeAPIYaml_callback");

		// return product details with plans
		var plans = [];
		if(productObject.plans) {
			// plan names are the keys of the plans object
			plans = Object.keys(productObject.plans);
		}
		var details = {productName: productName, productVersion: productVersion, plans: plans};
		
		logger.exit("_processRESTVersion_writeAPIYaml_callback", details);
		return details;
	});

	logger.exit("_processRESTVersion", promise);
	return promise;
}

/*
 * Push the product to drafts, return the promise that resolves with nothing when done.
 * 
 */
function _pushProductToDrafts(bsBsrURI, bsrURI, productDetails, apiCli) {
	logger.entry("_pushProductToDrafts", bsBsrURI, bsrURI, productDetails, apiCli);
	
	logger.info(logger.Globalize.formatMessage("flowPushingProductToDrafts", productDetails.productName, productDetails.productVersion));
	
	// for WSDL we need to run the APIC command from the directory where the WSDL zips are
	var productFilename = ttStorage.getProductYamlName(bsBsrURI, bsrURI);
	var productPath = ttStorage.getProductDirectoryPath(bsBsrURI, bsrURI);
	var apicPromise = apiCli.pushFromDir(productFilename, productPath);

	logger.exit("_pushProductToDrafts", apicPromise);
	return apicPromise;
}

/*
 * Read the consumers yaml and then use it to create consumers.
 * 
 * If consumers yaml does not exist then return, do not error.
 * 
 * Return a promise that resolves with a map of catalog name to consumersDone object with details of what was done. 
 */
function _readAndCreateConsumers(bsBsrURI, bsrURI, productDetails, apicdevportal, apiCli, transferResult) {
	logger.entry("_readAndCreateConsumers", bsBsrURI, bsrURI, productDetails, apicdevportal, apiCli, transferResult);
	
	var promise = ttStorage.existsConsumersYaml(bsBsrURI, bsrURI).then(function(exists){
		logger.entry("_readAndCreateConsumers_exists", exists);
		
		var ret = null;
		if(exists === true) {
			transferResult.consumersAttempted = true;
			ret = ttStorage.readConsumersYaml(bsBsrURI, bsrURI).then(function(consumersObject){
				logger.entry("_readAndCreateConsumers_read", consumersObject);
				// create consumers
				var createPromise = flowConsumers.createConsumersInCatalogs(bsBsrURI, bsrURI, consumersObject, productDetails, apicdevportal, apiCli); 
				logger.exit("_readAndCreateConsumers_read", createPromise);
				return createPromise;
			});				
		} else {
			// do not create consumers because the file does not exist
			ret = {};
		}
		logger.exit("_readAndCreateConsumers_exists", ret);
		return ret;
	});	

	logger.exit("_readAndCreateConsumers", promise);
	return promise;
}

/*
 * Push and publish the service depending on the flags.
 * Assumes push is true.
 * 
 * Sets the attempted and success flags in the transferResult for push and publish.
 *  
 * Returns a promise that resolves with nothing.
 * Throws an error if something goes wrong. 
 * 
 */
function _pushPublishConsumers(bsBsrURI, bsrURI, modeFlags, productDetails, transferResult, apiCli, apicdevportal) {
	logger.entry("_pushPublish", bsBsrURI, bsrURI, modeFlags, transferResult, apiCli, apicdevportal);
	
	transferResult.pushAttempted = true;
	var pushPromise = _pushProductToDrafts(bsBsrURI, bsrURI, productDetails, apiCli).then(function(){
		logger.entry("_pushPublish_push_callback");

		// indicate push was done
		transferResult.pushSuccess = true;
		
		var publishPromise = null;
		if(modeFlags.publish === true) {
			transferResult.publishAttempted = true;
			publishPromise = flowPublish.publishProductToCatalogs(bsBsrURI, bsrURI, productDetails, apiCli);
		} else {
			transferResult.publishAttempted = false;
			publishPromise = "";
		}
		
		logger.exit("_pushPublish_push_callback", publishPromise);
		return publishPromise;
	}).then(function(doneCatalogs){
		logger.entry("_pushPublish_publish_callback");
	
		if(modeFlags.publish === true) {
			transferResult.publishSuccess = true;
			transferResult.catalogs = doneCatalogs;
		}

		var consumersPromise = null;
		if(modeFlags.consumers === true) {
			transferResult.consumersAttempted = false;
			// function will set attempted if the consumers yaml exists
			consumersPromise = _readAndCreateConsumers(bsBsrURI, bsrURI, productDetails, apicdevportal, apiCli, transferResult);
		} else {
			transferResult.consumersAttempted = false;
			consumersPromise = "";
		}
		
		logger.exit("_pushPublish_publish_callback", consumersPromise);
		return consumersPromise;
	}).then(function(catalogConsumersDone){
		logger.entry("_pushPublish_consumers_callback", catalogConsumersDone);
		
		if(modeFlags.consumers === true) {
			transferResult.consumersSuccess = true;
			transferResult.catalogConsumersDone = catalogConsumersDone;
		}

		logger.exit("_pushPublish_consumers_callback");
	}).caught(function(error){
		logger.entry("_pushPublish_consumers_error", error);
		
		// error in consumer create means we need to undo the publish work		
		var undoPromise = null;
		if(transferResult.publishSuccess === true) {
			// have published and error happened in consumers so need to remove
			var spaces = apiCli.getCatalogToSpace();
			undoPromise = flowPublish.removeFromCatalogs(productDetails, transferResult.catalogs, spaces, apiCli).then(function(){
				logger.entry("_pushPublish_consumers_error_unpublish");
				
				// throw error now
				logger.exit("_pushPublish_consumers_error_unpublish", error);
				throw error;
			});			
		}

		// if unpublishing return promise else throw error now
		if(undoPromise !== null) {
			logger.exit("_pushPublish_consumers_error", undoPromise);
			return undoPromise;
		} else {
			logger.exit("_pushPublish_consumers_error", error);
			throw error;
		}
	});
	
	logger.exit("_pushPublish", pushPromise);
	return pushPromise;	
} 

/*
 * Push product to drafts, publish if the flags say so, then store result on FS, then return promise which resolves with the 
 * business service results object. When we read the details of the WSRR data set the business service results object.
 * If an error happens during the push store a bad result and return promise which resolves with the results object.
 * 
 * bsBsrURI - bsrURI of the business service
 * bsrURI - bsrURI of the service version
 * bsResults - business service results item (ttResults BSResultsItem)
 * modeFlags - flags to publish. Assumes push is true.
 * apiCli - initialized API CLI module
 * 
 * Returns a promise that resolves with a ttResults SV results item.
 */
function _pushProductToDraftsPublishStoreResult(bsBsrURI, bsrURI, bsResults, modeFlags, apiCli, apicdevportal) {
	logger.entry("_pushProductToDraftsPublishStoreResult", bsBsrURI, bsrURI, bsResults, modeFlags, apiCli, apicdevportal);
	
	var wsrrData = null;
	var productDetails = null;

	// result which we update as we go
	var transferResult = null;

	var version = null;
	
	// read wsrr data for messages
	var wsrrDataPromise = ttStorage.readWsrrDataOrEmpty(bsBsrURI, bsrURI);
	// read product yaml for later
	var productPromise = ttStorage.readProductYaml(bsBsrURI, bsrURI);
	
	var pushPromise = Promise.all([wsrrDataPromise, productPromise]).then(function(data){
		logger.entry("_pushProductToDraftsPublishStoreResult_readwsrrdata_callback", data);
		
		// wsrrData can be null if the file does not exist
		wsrrData = data[0];
		
		var productObject = data[1];
		productDetails = {productName: productObject.info.name, productVersion: productObject.info.version};

		// set business service results
		if(wsrrData) {
			bsResults.name = wsrrData.properties.name;
			bsResults.version = wsrrData.properties.version;
			bsResults.description = wsrrData.properties.description;
			version = wsrrData.version;
		} else {
			bsResults.name = bsBsrURI;
			bsResults.version = "";
			bsResults.description = "";
			version = {properties : {
				name: bsrURI,
				description: "",
				version: ""
				},
				bsrURI: bsrURI
			};
		}
		
		logger.info(logger.Globalize.formatMessage("flowProcessingVersionDetails", version.properties.name, bsrURI));

		transferResult = ttResults.createSVResultsItem(version.properties.name, version.properties.version, version.properties.description, version.bsrURI, true);
		transferResult.productName = productObject.info.name;
		transferResult.productVersion = productObject.info.version;

		var apicPromise = _pushPublishConsumers(bsBsrURI, bsrURI, modeFlags, productDetails, transferResult, apiCli, apicdevportal);
		
		logger.exit("_pushProductToDraftsPublishStoreResult_readwsrrdata_callback", apicPromise);
		return apicPromise;
	}).then(function(){
		logger.entry("_pushProductToDraftsPublishStoreResult_publish_callback");

		var storePromise = ttStorage.storeTransferResult(bsBsrURI, bsrURI, transferResult);
		
		logger.exit("_pushProductToDraftsPublishStoreResult_publish_callback", storePromise);
		return storePromise;
	}).then(function() {
		logger.entry("_pushProductToDraftsPublishStoreResult_store_callback");

		ttResults.addServiceVersion(bsResults, transferResult);
		
		logger.exit("_pushProductToDraftsPublishStoreResult_store_callback", bsResults);
		return bsResults;
	}).caught(function(error) {
		logger.entry("_pushProductToDraftsPublishStoreResult_error", error);

		var errorMsg = null;
		if(wsrrData) {
			errorMsg = logger.Globalize.formatMessage("wsrrErrorTransferVersionToDraft", wsrrData.version.properties.name, wsrrData.version.properties.version, error.toString());
		} else {
			errorMsg = logger.Globalize.formatMessage("wsrrErrorTransferVersionToDraft", bsrURI, "", error.toString());
		}
		logger.error(errorMsg, error);
		
		transferResult.success = false;
		transferResult.diagnostics = [error.toString(), error.stack];

		var errorPromise = ttStorage.storeTransferResult(bsBsrURI, bsrURI, transferResult).then(function() {
			logger.entry("_pushProductToDraftsPublishStoreResult_error_store_callback");
			
			// return unsuccessful
			delete transferResult.diagnostics;

			ttResults.addServiceVersion(bsResults, transferResult);

			logger.exit("_pushProductToDraftsPublishStoreResult_error_store_callback", bsResults);		
			return bsResults;
		});
		
		logger.exit("_pushProductToDraftsPublishStoreResult_error", errorPromise);
		return errorPromise;
	});

	logger.exit("_pushProductToDraftsPublishStoreResult", pushPromise);
	return pushPromise;
}

/*
 * Transfer the version into APIC drafts.
 * 
 * Product per version mode.
 * 
 * If an error happens, log it and store the failure, then return so processing can continue.
 * 
 * Returns Promise which resolves when done, with a ttResults results item object.
 */
function _transferToDraftForVersion(version, capability, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal){
	logger.entry("_transferToDraftForVersion", version, capability, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal);
	
	var overallData = ttData.create();
	// add data
	overallData.setBusinessService(capability);
	overallData.addServiceVersion(version);

	var bsrURI = version.bsrURI;
	var bsBsrURI = capability.bsrURI;
	
	var apiString = null;
	var productString = null;

	// details of the product generated
	var productDetails = null;

	// result which we update as we go
	var transferResult = ttResults.createSVResultsItem(version.properties.name, version.properties.version, version.properties.description, version.bsrURI, true);
	transferResult.captureAttempted = true;

	var singleSV = false;
	if(modeFlags.singleSV) {
		singleSV = true;
	}
	
	// get the SLDs and endpoints for the version
	logger.info(logger.Globalize.formatMessage("flowFetchingSLDsAndEndpoints", version.properties.name, version.properties.version, bsrURI));
	var promise = _getSLDsAndEndpointsAndConsumersForVersion(version, bsBsrURI, configuration, wsrrUtils, overallData, singleSV)
	.then(function() {
		logger.entry("_transferToDraftForVersion_sldsendpoints_callback");
		// clear version folder first so the WSDL generate works if the file already existed
		var clearPromise = ttStorage.clearVersionFolder(bsBsrURI, bsrURI);
		
		logger.exit("_transferToDraftForVersion_sldsendpoints_callback", clearPromise);
		return clearPromise;
	}).then(function() {
		logger.entry("_transferToDraftForVersion_folderClear_callback");
		// store data in diagnostics
		var diagPromise = ttStorage.storeWsrrData(bsBsrURI, bsrURI, overallData.getDiagnosticData());
		
		logger.exit("_transferToDraftForVersion_folderClear_callback", diagPromise);
		return diagPromise;
	}).then(function() {
		logger.entry("_transferToDraftForVersion_diagDumpWsrrData_callback");
		logger.info(logger.Globalize.formatMessage("flowFetchedSLDsAndEndpoints"));
		// previous function added the SLDs and endpoints to the overallData
		// what if no SLDs or endpoints come back? For design time this is ok
		
		var endpointTypes = overallData.checkEndpointTypes(bsrURI);

		var promise = null;
		
		// get WSDL/XSD if SOAP service
		if(endpointTypes.SOAP === true) {
			// SOAP endpoints, treat as SOAP
			promise = _processSOAPVersion(version, capability, overallData, configuration, wsrrUtils, apiCli);
		} else if(endpointTypes.REST === true) {
			// REST endpoints, treat as REST
			promise = _processRESTVersion(version, capability, overallData, configuration, wsrrUtils, apiCli);
		} else {
			// no SOAP or REST endpoints found
			logger.info(logger.Globalize.formatMessage("flowNoEndpointsService"));
			// throw for now to make it stop processing this version
			throw new Error(logger.Globalize.formatMessage("flowErrorNoEndpoints"));
		}

		logger.exit("_transferToDraftForVersion_diagDumpWsrrData_callback", promise);
		return promise;
	}).then(function(product) {
		logger.entry("_transferToDraftForVersion_processVersion_callback", product);

		// store
		productDetails = product;
		transferResult.productName = productDetails.productName;
		transferResult.productVersion = productDetails.productVersion;
		
		// get binary artifact documents and store
		var artifactsPromise = _getArtifactsAndStore(capability.bsrURI, version.bsrURI, wsrrUtils);
		
		logger.exit("_transferToDraftForVersion_processVersion_callback", artifactsPromise);
		return artifactsPromise;
	}).then(function() {
		logger.entry("_transferToDraftForVersion_artifacts_callback");
		
		// generate consumers yaml
		var consumersPromise = flowConsumers.generateConsumersYaml(bsBsrURI, bsrURI, overallData, productDetails.plans);
		
		logger.exit("_transferToDraftForVersion_artifacts_callback", consumersPromise);
		return consumersPromise;
	}).then(function() {
		logger.entry("_transferToDraftForVersion_consumers_callback");

		logger.info(logger.Globalize.formatMessage("flowValidatingProduct"));
		
		var productPath = ttStorage.getProductPath(bsBsrURI, bsrURI);
		var apicPromise = apiCli.validate(productPath);
		
		logger.exit("_transferToDraftForVersion_consumers_callback", apicPromise);
		return apicPromise;
	}).then(function() {
		logger.entry("_transferToDraftForVersion_validateYaml_callback");

		// capture is now done and validated
		transferResult.captureSuccess = true;
		
		var pushPromise = null;
		if(modeFlags.push === true) {
			pushPromise = _pushPublishConsumers(bsBsrURI, bsrURI, modeFlags, productDetails, transferResult, apiCli, apicdevportal);
		} else {
			transferResult.pushAttempted = false;
			pushPromise = "";
		}
		
		logger.exit("_transferToDraftForVersion_validateYaml_callback", pushPromise);
		return pushPromise;
	}).then(function(){
		logger.entry("_transferToDraftForVersion_publish_callback");

		// store result
		var resultPromise = ttStorage.storeTransferResult(bsBsrURI, bsrURI, transferResult);
		
		logger.exit("_transferToDraftForVersion_publish_callback", resultPromise);
		return resultPromise;
	}).then(function() {
		logger.entry("_transferToDraftForVersion_store_result_callback");
		// return successful
		logger.exit("_transferToDraftForVersion_store_result_callback", transferResult);		
		return transferResult;
	}).caught(function(error){
		logger.entry("_transferToDraftForVersion_error", error);
		
		var errorMsg = logger.Globalize.formatMessage("wsrrErrorTransferVersionToDraft", version.properties.name, version.properties.version, error.toString());
		logger.error(errorMsg, error);
		
		transferResult.success = false;
		transferResult.diagnostics = [error.toString(), error.stack];

		var errorPromise = ttStorage.storeTransferResult(bsBsrURI, bsrURI, transferResult).then(function() {
			logger.entry("_transferToDraftForVersion_error_store_callback");
			// return unsuccessful
			delete transferResult.diagnostics;
			
			logger.exit("_transferToDraftForVersion_error_store_callback", transferResult);		
			return transferResult;
		});
		
		logger.exit("_transferToDraftForVersion_error", errorPromise);
		return errorPromise;
	});

	logger.exit("_transferToDraftForVersion", promise);
	return promise;
}

/*
 * Transfer the capability provided into APIC drafts, finding all sub versions.
 * 
 * Product per version mode.
 * 
 * If an error happens, log it and return so that the processing of other capabilities can continue.
 * 
 * Returns Promise which resolves when done, with a ttResults results item object for the capability with versions.
 */
function _transferToDraftForCapability(capability, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal) {
	logger.entry("_transferToDraftForCapability", capability, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal);
	
	// get versions
	var bsrURI = capability.bsrURI;
	
	var theResults = ttResults.createBSResultsItem(capability.properties.name, capability.properties.version, capability.properties.description, capability.bsrURI, true);
	
	var xpath = wsrrQueries.getQueryXPath(wsrrQueries.ServiceVersionsForBusinessService, configuration);
	xpath = wsrrQueries.resolveInserts(xpath, bsrURI);
	logger.info(logger.Globalize.formatMessage("flowFetchingVersions", capability.properties.name, bsrURI));
	var promise = wsrrUtils.runGraphQuery(xpath)
	.then(function(data) {
		logger.entry("_transferToDraftForCapability_versions_callback", data);
		// check we have data because queries can return nothing
		if(!data.length || data.length === 0) {
			logger.info(logger.Globalize.formatMessage("flowNoVersions"));	
			throw new Error(logger.Globalize.formatMessage("flowNoVersionsError", xpath));
		}
	  	logger.info(logger.Globalize.formatMessage("flowFetchedVersions", data.length));
	  	// for each version do the processing, because one product per version we handle each one
	  	var loopPromise = null;
	  	if(data.length > 0) {
	  		// use reduce so it waits until the promise for an item resolves before processing the next item
	  		loopPromise = Promise.reduce(data, function(total, version, index, length) {
	  			logger.entry("_transferToDraftForCapability_reduce_callback", total, version, index, length);
	  			logger.info(logger.Globalize.formatMessage("flowProcessingVersion", (index + 1), length));
	  			var versionPromise = _transferToDraftForVersion(version, capability, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal).then(function(sv){
		  			logger.entry("_transferToDraftForCapability_reduce_transfer_callback", sv);
	  				ttResults.addServiceVersion(total, sv);
	  				logger.exit("_transferToDraftForCapability_reduce_transfer_callback", total);
	  				return total;
	  			});
	  			logger.exit("_transferToDraftForCapability_reduce_callback", versionPromise);
	  			return versionPromise;
	  		}, theResults).then(function(total){
	  			logger.entry("_transferToDraftForCapability_reduce_done_callback", total);
	  			logger.info(logger.Globalize.formatMessage("flowProcessedVersions"));
	  			logger.exit("_transferToDraftForCapability_reduce_done_callback", total);
	  			return total;
	  		});
	  	}

	  	// return 
		logger.exit("_transferToDraftForCapability_versions_callback", loopPromise);
		return loopPromise;
	}).caught(function(error){
		logger.entry("_transferToDraftForCapability_error", error);
		// log the error and the failure, then return
		logger.error(error, error);
		// cannot store under version because we have none
		theResults.success = false;
		logger.exit("_transferToDraftForCapability_error", theResults);
		return theResults;
	});	
	
	logger.exit("_transferToDraftForCapability", promise);
	return promise;
}

/*
 * Internal transfer method with mode flag object.
 * 
 * modeFlags - object { push: true/false, publish: true/false }
 * 
 * In future modeFlags can specify things like publish, do consumers, etc.
 * 
 */
function _transferToDraftForOrganization(orgName, filePath, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal) {
	logger.entry("_transferToDraftForOrganization", orgName, filePath, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal);

	// set where the storage module writes data
	ttStorage.setFSRoot(filePath);
	// explicit product per version
	ttStorage.setProductPerVersion(true);

	// get business services for the owning org
	var xpath = wsrrQueries.getQueryXPath(wsrrQueries.BusinessServiceByOwningOrg, configuration);
	xpath = wsrrQueries.resolveInserts(xpath, orgName);
	logger.info(logger.Globalize.formatMessage("flowFetchingBSForOrg", orgName));
	var queryPromise = wsrrUtils.runGraphQuery(xpath);
	// load templates too
	var templatePromise = templating.loadTemplatesIntoMap(configuration);
	var promise = Promise.all([queryPromise, templatePromise])	
	.then(function(dataArray) {
		logger.entry("transferToDraftForOrganization_bcs_callback", dataArray);
		var data = dataArray[0];
		// check we have data because queries can return nothing
		if(!data.length || data.length === 0) {
			throw new Error(logger.Globalize.formatMessage("flowNoBSs", xpath));
		}
	  	logger.info(logger.Globalize.formatMessage("flowFetchedBSs", data.length));
	  	// for each business capability process versions
	  	var loopPromise = null;
	  	if(data.length > 0) {
	  		var resultsObj = ttResults.create();
	  		// use reduce so it waits until the promise for an item resolves before processing the next item
	  		loopPromise = Promise.reduce(data, function(total, capability, index, length) {
	  			logger.entry("transferToDraftForOrganization_reduce_callback", total, capability, index, length);
	  			logger.info(logger.Globalize.formatMessage("flowProcessingBS", (index + 1), length));
	  			var reducePromise = _transferToDraftForCapability(capability, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal).then(function(bs){
		  			logger.entry("transferToDraftForOrganization_reduce_transfer_callback", bs);
	  				total.addBusinessService(bs);
		  			logger.exit("transferToDraftForOrganization_reduce_transfer_callback", total);
		  			return total;
	  			});
	  			logger.exit("transferToDraftForOrganization_reduce_callback", reducePromise);
	  			return reducePromise;
	  		}, resultsObj).then(function(total){
	  			logger.entry("transferToDraftForOrganization_reduce_done_callback", total);
	  			logger.info(logger.Globalize.formatMessage("flowProcessedBSs"));
	  			logger.exit("transferToDraftForOrganization_reduce_done_callback", total);
	  			return total;
	  		});
	  	}

	  	// return 
		logger.exit("generateWSRRDataForServiceVersion_bc_callback", loopPromise);
		return loopPromise;
	});	
	
	logger.exit("_transferToDraftForOrganization", promise);
	return promise;
}

/*
 * Transfers a set of services into APIC drafts for a single WSRR organization that
 * is named by the name provided.
 * 
 * Will query WSRR for the owning business service, service version and all artifacts, store them in a folder under 
 * the filePath, and generate the YAML representing the Product and API. 
 * One Product and one API per service version.
 *
 * Then uses APIC to generate the WSDL yaml and pushes into APIC. 
 * 
 * Config determines some things like the queries to run, the template file names, etc.
 *
 * If a service generate fails or a push fails, then the code logs this and carries on with the next version.
 *
 * Product per version mode.
 * 
 * This behaves like doing transferToFileSystemForOrganization() then pushToDraftFromFileSystem()
 * except it downloads and then pushes each individual service, one by one.
 * 
 * Returns Promise which resolves when done, with a result object of ttResults.
 * 
 * orgName - name of the organization
 * filePath - path to put the files
 * configuration - config object with key:value pairs
 * wsrrUtils - WSRRUtils module, already initialized
 * apiCli - apic cli module, already initialized
 * apicdevportal - dev portal module, already initialized
 */
function transferToDraftForOrganization(orgName, filePath, configuration, wsrrUtils, apiCli, apicdevportal) {
	logger.entry("transferToDraftForOrganization", orgName, filePath, configuration, wsrrUtils, apiCli, apicdevportal);

	_loadPlugins();
	
	var modeFlags = {push: true};
	var publish = apiCli.getPublishMode();
	modeFlags.publish = publish;
	var consumers = apiCli.getConsumersMode();
	modeFlags.consumers = consumers;
	
	// transferring whole org
	modeFlags.singleSV = false;
	
	var promise = _transferToDraftForOrganization(orgName, filePath, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal);

	logger.exit("transferToDraftForOrganization", promise);
	return promise;
}


/*
 * Transfers a set of services onto the file system for a single WSRR organization that
 * is named by the name provided.
 * 
 * Will query WSRR for the owning business service, service version and all artifacts, store them in a folder under 
 * the filePath, and generate the YAML representing the Product and API. 
 * One Product and one API per service version.
 *
 * Then uses APIC to generate the WSDL yaml.
 * 
 * Needs the APIC toolkit installed to validate and generate the WSDL YAML.
 * 
 * Does not push into APIC.
 * 
 * Config determines some things like the queries to run, the template file names, etc.
 *
 * If a service generate fails or a push fails, then the code logs this and carries on with the next version.
 *
 * Product per version mode.
 * 
 * Returns Promise which resolves when done, with a result object of ttResults.
 * 
 * orgName - name of the organization
 * filePath - path to put the files
 * configuration - config object with key:value pairs
 * wsrrUtils - WSRRUtils module, already initialized
 * apiCli - apic cli module, already initialized
 */
function transferToFileSystemForOrganization(orgName, filePath, configuration, wsrrUtils, apiCli) {
	logger.entry("transferToFileSystemForOrganization", orgName, filePath, configuration, wsrrUtils, apiCli);

	_loadPlugins();
	
	var modeFlags = {push: false, publish: false, singleSV: false};
	var promise = _transferToDraftForOrganization(orgName, filePath, configuration, wsrrUtils, apiCli, modeFlags, null);

	logger.exit("transferToFileSystemForOrganization", promise);
	return promise;
}

/*
 * Transfers a business service from the file system which has previously been transferred from 
 * WSRR in transferToFileSystemForOrganization(). 
 * 
 * One Product and one API per service version.
 *
 * Then uses APIC to push to drafts.
 * 
 * Config determines some things like the queries to run, the template file names, etc.
 *
 * If a service push fails, then the code logs this and carries on with the next version.
 *
 * Product per version mode.
 * 
 * Returns Promise which resolves when done, with a result object of ttResults BSResultsItem
 * 
 * capabilityObject - object for the business service, one entry in the return array from ttStorage.getBusinessServiceVersionList().
 * configuration - config object with key:value pairs
 * apiCli - apic cli module, already initialized
 * modeFlags - mode flags object
 * 
 */
function _pushToDraftFromFileSystemForCapability(capabilityObject, configuration, apiCli, modeFlags, apicdevportal) {
	logger.entry("_pushToDraftFromFileSystemForCapability", capabilityObject, configuration, apiCli, modeFlags, apicdevportal);
	
	// initial results with just bsrURI
	var theResults = ttResults.createBSResultsItem(capabilityObject.bsBsrURI, "", "", capabilityObject.bsBsrURI, true);

	var data = capabilityObject.versions;
	
	var promise = null;
	
	// check we have versions
	if(!data.length || data.length === 0) {
		logger.info(logger.Globalize.formatMessage("flowNoVersions"));	
		// return failure directly
		theResults.success = false;
		promise = theResults;
	} else {
	  	logger.info(logger.Globalize.formatMessage("flowFetchedVersions", capabilityObject.versions.length));
	  	
	  	// for each version do the processing, because one product per version we handle each one
		// use reduce so it waits until the promise for an item resolves before processing the next item
		promise = Promise.reduce(data, function(total, bsrURI, index, length) {
			logger.entry("_transferToDraftForCapability_reduce_callback", total, bsrURI, index, length);
			logger.info(logger.Globalize.formatMessage("flowProcessingVersion", (index + 1), length));
			// pass in the total so it can set the capability details upon load
			var versionPromise = _pushProductToDraftsPublishStoreResult(capabilityObject.bsBsrURI, bsrURI, total, modeFlags, apiCli, apicdevportal).then(function(bs){
	  			logger.entry("_transferToDraftForCapability_reduce_transfer_callback", bs);
				
	  			// return the business service results
				logger.exit("_transferToDraftForCapability_reduce_transfer_callback", bs);
				return bs;
			});
			logger.exit("_transferToDraftForCapability_reduce_callback", versionPromise);
			return versionPromise;
		}, theResults).then(function(total){
			logger.entry("_transferToDraftForCapability_reduce_done_callback", total);
			logger.info(logger.Globalize.formatMessage("flowProcessedVersions"));
			logger.exit("_transferToDraftForCapability_reduce_done_callback", total);
			return total;
		}).caught(function(error){
			logger.entry("_transferToDraftForCapability_error", error);
			// log the error and the failure, then return
			logger.error("", error);
			// cannot store under version because we have none
			theResults.success = false;
			logger.exit("_transferToDraftForCapability_error", theResults);
			return theResults;
		});	
	}
	// return 
	logger.exit("_transferToDraftForCapability_versions_callback", promise);
	return promise;
}

/*
 * Transfers a set of services from the file system which has previously been transferred from 
 * WSRR in transferToFileSystemForOrganization(). Whatever is on the file system specified
 * will be pushed.
 * 
 * One Product and one API per service version.
 *
 * Then uses APIC to push to drafts.
 * 
 * Config determines some things like the queries to run, the template file names, etc.
 *
 * If a service push fails, then the code logs this and carries on with the next version.
 *
 * Product per version mode.
 * 
 * Returns Promise which resolves when done, with a result object of ttResults.
 * 
 * filePath - path to put the files
 * configuration - config object with key:value pairs
 * apiCli - apic cli module, already initialized
 */
//TODO: in future this can only push-failed or not-pushed APIs from the FS
function pushToDraftFromFileSystem(filePath, configuration, apiCli, apicdevportal) {
	logger.entry("pushToDraftFromFileSystem", filePath, configuration, apiCli, apicdevportal);

	// do not need plugins here because we have already generated the yamls
	
	// set where the storage module writes data
	ttStorage.setFSRoot(filePath);
	// explicit product per version
	ttStorage.setProductPerVersion(true);

	var modeFlags = {push: true};
	var publish = apiCli.getPublishMode();
	modeFlags.publish = publish;
	var consumers = apiCli.getConsumersMode();
	modeFlags.consumers = consumers;
	
	// results object
	var resultsObj = ttResults.create();
	// total to pass into reduce
	var totalObj = {results: resultsObj, lastBs: null};
	
	// iterate over all products in the file system to get the business services
	logger.info(logger.Globalize.formatMessage("flowFetchingFileSystem", filePath));
	
	var promise = ttStorage.getBusinessServiceVersionList().then(function(services){
		logger.entry("pushToDraftFromFileSystem_serviceList", services);

		if(!services.length || services.length === 0) {
			throw new Error(logger.Globalize.formatMessage("flowNoBSsFile", filePath));
		}
	  	logger.info(logger.Globalize.formatMessage("flowFetchedBSs", services.length));
	  	// for each business capability process versions
	  	var loopPromise = null;
	  	if(services.length > 0) {
	  		var resultsObj = ttResults.create();
	  		// use reduce so it waits until the promise for an item resolves before processing the next item
	  		loopPromise = Promise.reduce(services, function(total, capabilityObject, index, length) {
	  			logger.entry("pushToDraftFromFileSystem_reduce_callback", total, capabilityObject, index, length);
	  			logger.info(logger.Globalize.formatMessage("flowProcessingBS", (index + 1), length));
	  			var reducePromise = _pushToDraftFromFileSystemForCapability(capabilityObject, configuration, apiCli, modeFlags, apicdevportal).then(function(bs){
		  			logger.entry("pushToDraftFromFileSystem_reduce_transfer_callback", bs);
	  				total.addBusinessService(bs);
		  			logger.exit("pushToDraftFromFileSystem_reduce_transfer_callback", total);
		  			return total;
	  			});
	  			logger.exit("pushToDraftFromFileSystem_reduce_callback", reducePromise);
	  			return reducePromise;
	  		}, resultsObj).then(function(total){
	  			logger.entry("pushToDraftFromFileSystem_reduce_done_callback", total);
	  			logger.info(logger.Globalize.formatMessage("flowProcessedBSs"));
	  			logger.exit("pushToDraftFromFileSystem_reduce_done_callback", total);
	  			return total;
	  		});
	  	}
		
		logger.exit("pushToDraftFromFileSystem_serviceList", loopPromise);
		return loopPromise;
	});

	logger.exit("pushToDraftFromFileSystem", promise);
	return promise;
}

/*
 * Transfer to drafts and publish for a single service version.
 * 
 * Will query WSRR for the owning business service, service version and all artifacts, store them in a folder under 
 * the filePath, and generate the YAML representing the Product and API. 
 * One Product and one API for the service version.
 *
 * Then uses APIC to generate the WSDL yaml and pushes into APIC. 
 * 
 * Config determines some things like the queries to run, the template file names, etc.
 * 
 * Returns Promise which resolves when done, with a result object of ttResults.
 *  
 * bsrURI - bsrURI of the service version.
 * filePath - path to put the files
 * configuration - config object with key:value pairs
 * wsrrUtils - WSRRUtils module, already initialized
 * apiCli - apic cli module, already initialized
 * apicdevportal - apic dev portal module, already initialized or null if just doing capture
 */
function _transferToDraftForServiceVersion(bsrURI, filePath, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal) {
	logger.entry("_transferToDraftForServiceVersion", bsrURI, filePath, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal);

	// set where the storage module writes data
	ttStorage.setFSRoot(filePath);
	// explicit product per version
	ttStorage.setProductPerVersion(true);

	var xpath = null;
	
	// results object
	var theResults = ttResults.create();
	
	// data from WSRR
	var version = null;
	var capability = null;

	// get service version directly
	logger.info(logger.Globalize.formatMessage("flowFetchingSV", bsrURI));
	var fetchPromise = wsrrUtils.retrieveMetadata(bsrURI);
	// load templates too
	var templatePromise = templating.loadTemplatesIntoMap(configuration);
	var promise = Promise.all([fetchPromise, templatePromise])	
	.then(function(allData) {
		logger.entry("_transferToDraftForServiceVersion_sv_callback", allData);
		// check we have data because fetch can return nothing
		if(allData[0] === null) {
			throw new Error(logger.Globalize.formatMessage("flowNoSV", bsrURI));
		}
		// version is the first result in the Promise.all array
		version = allData[0];
		
	  	logger.info(logger.Globalize.formatMessage("flowFetchedVersions", 1));
	  	// get the business capability for this version
	  	
		xpath = wsrrQueries.getQueryXPath(wsrrQueries.BusinessServiceForServiceVersion, configuration);
		xpath = wsrrQueries.resolveInserts(xpath, bsrURI);
	  	logger.info(logger.Globalize.formatMessage("flowFetchingBSForSV", version.properties.name, version.properties.version, version.bsrURI));
	  	
		var queryPromise = wsrrUtils.runGraphQuery(xpath);
		logger.exit("_transferToDraftForServiceVersion_sv_callback", queryPromise);
		return queryPromise;
	}).then(function(data) {
		logger.entry("_transferToDraftForServiceVersion_bc_callback", data);
	  	
		// check we have data because queries can return nothing
		if(!data.length || data.length === 0) {
			logger.info(logger.Globalize.formatMessage("flowNoBSsLog"));	
			throw new Error(logger.Globalize.formatMessage("flowNoBSs", xpath));
		}
		
		// first one is the capability and should be 1
		capability = data[0];

		// log BS details
		logger.info(logger.Globalize.formatMessage("flowFetchedBSForSV", capability.properties.name, capability.properties.version, capability.bsrURI));
		
		var versionPromise = _transferToDraftForVersion(version, capability, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal);
		logger.exit("_transferToDraftForServiceVersion_bc_callback", versionPromise);
		return versionPromise;
	}).then(function(svResults){
		logger.entry("_transferToDraftForServiceVersion_transfer_callback", svResults);
		
		logger.info(logger.Globalize.formatMessage("flowProcessedSV"));
		
		var bsResults = ttResults.createBSResultsItem(capability.properties.name, capability.properties.version, capability.properties.description, capability.bsrURI, true);
		ttResults.addServiceVersion(bsResults, svResults);
		theResults.addBusinessService(bsResults);
		
		logger.exit("_transferToDraftForServiceVersion_transfer_callback", theResults);
		return theResults;
	});
	
	logger.exit("_transferToDraftForServiceVersion", promise);
	return promise;
}

/*
 * Transfer a single WSDL to the file system.
 * 
 * Call getWSDLContent() then generate WSDL YAML with APIC and product from template.
 * Read the API Yaml and pull data from it to build the product template, using a different product template.
 * 
 * If something goes wrong, log the error and return, but do not throw.
 * 
 * wsdlId - id of WSDL
 * wsdl - wsdl module
 * apiCli - APIC CLI module
 * 
 * Return promise which resolves with a BSResultsItem from ttResults.
 * 
 */
function _transferSingleWSDLToFileSystem(wsdlId, wsdl, apiCli) {
	logger.entry("_transferSingleWSDLToFileSystem", wsdlId, wsdl, apiCli);

	var wsdlDirectoryPath = null;
	var apiObject = null;
	var productString = null;
	var wsdlYaml = null;
	
	var theResults = null;
	var transferSV = null;
	
	logger.info(logger.Globalize.formatMessage("flowFetchWSDLsForId", wsdlId));
	var promise = wsdl.getWSDLContent(wsdlId).then(function(wsdlData){
		logger.entry("_transferSingleWSDLToFileSystem_content", wsdlData);
		
		if(wsdlData.length === 0) {
			var wsdlMsg = logger.Globalize.formatMessage("wsrrErrorNoWSDLInDirectory", wsdlId);
			logger.info(wsdlMsg);
			// throw for now to make it stop processing this version
			throw new Error(wsdlMsg);
		}

		var storePromise = ttStorage.storeWSDL(wsdlId, wsdlId, wsdlData);
		
		logger.exit("_transferSingleWSDLToFileSystem_content", storePromise);
		return storePromise;
	}).then(function(){
		logger.entry("_transferSingleWSDLToFileSystem_storeWSDL");

		// generate WSDL API
		logger.info(logger.Globalize.formatMessage("flowCreatingWSDLYaml"));

		var wsdlFilename = ttStorage.getWSDLZipName(wsdlId, wsdlId);
		wsdlDirectoryPath = ttStorage.getProductDirectoryPath(wsdlId, wsdlId);
		// run in the folder where the WSDL zip is
		var wsdlYamlGenPromise = apiCli.createAPIFromWSDL(wsdlFilename, wsdlDirectoryPath);

		logger.exit("_transferSingleWSDLToFileSystem_storeWSDL", wsdlYamlGenPromise);
		return wsdlYamlGenPromise;
	}).then(function(wsdlObject){
		logger.entry("_transferSingleWSDLToFileSystem_generateAPI", wsdlObject);
		
		var yamlFileName = wsdlObject.yamlName;
		var wsdlYamlPath = path.resolve(wsdlDirectoryPath, yamlFileName);
		
		// move to storage
		var movePromise = ttStorage.moveWSDLYaml(wsdlYamlPath, wsdlId, wsdlId);

		logger.exit("_transferSingleWSDLToFileSystem_generateAPI", movePromise);
		return movePromise;
	}).then(function(){
		logger.entry("_transferSingleWSDLToFileSystem_move");
		
		// read YAML into node as JS object
		var wsdlYamlPromise = ttStorage.readWSDLYaml(wsdlId, wsdlId);

		logger.exit("_transferSingleWSDLToFileSystem_move", wsdlYamlPromise);
		return wsdlYamlPromise;
	}).then(function(wsdlYamlObject){
		logger.entry("_transferSingleWSDLToFileSystem_WSDL_read", wsdlYamlObject);

		wsdlYaml = wsdlYamlObject;
		
		// check if there is metadata.yaml
		var metadataPromise = wsdl.getMetadata(wsdlId);
		
		logger.exit("_transferSingleWSDLToFileSystem_WSDL_read", metadataPromise);
		return metadataPromise;
	}).then(function(metadataYaml){
		logger.entry("_transferSingleWSDLToFileSystem_metadata_read", metadataYaml);

		if(metadataYaml !== null) {
			// combine with wsdlYaml taking metadataYaml as precident
			wsdlYaml = templating.combineApiYamlObjects(wsdlYaml, metadataYaml);
		}
		
		logger.info(logger.Globalize.formatMessage("flowSavingAPIYaml"));
		// save
		apiObject = wsdlYaml;
		// make results with data
		theResults = ttResults.createBSResultsItem(apiObject.info.title, apiObject.info.version, apiObject.info.description, wsdlId, true);
		transferSV = ttResults.createSVResultsItem(apiObject.info.title, apiObject.info.version, apiObject.info.description, wsdlId, true);
		ttResults.addServiceVersion(theResults, transferSV);
		
		// generate product using template and wsdlYaml
		var productTemplate = templating.getTemplate(templating.PRODUCT_WSDL);
		productString = templating.generateStringFromYamlTemplate(productTemplate, wsdlYaml);
		var productStringPromise = ttStorage.storeDiagnosticString(wsdlId, wsdlId, productString, "productFromTemplate.yaml");

		logger.exit("_transferSingleWSDLToFileSystem_metadata_read", productStringPromise);
		return productStringPromise;
	}).then(function(){
		logger.entry("_transferSingleWSDLToFileSystem_WSDL_store_product_diagnostic");

		// make product YAML
		var productObject = templating.generateObjectFromYamlString(productString);
		var productPromise = ttStorage.storeProductYaml(wsdlId, wsdlId, productObject);
		var apiPromise = ttStorage.storeApiYaml(wsdlId, wsdlId, apiObject);
		
		var writesPromise = Promise.all([productPromise, apiPromise]);
		logger.exit("_transferSingleWSDLToFileSystem_WSDL_store_product_diagnostic", writesPromise);
		return writesPromise;
	}).then(function(){
		logger.entry("_transferSingleWSDLToFileSystem_WSDL_store_product");
		
		logger.info(logger.Globalize.formatMessage("flowValidatingProduct"));
		var productPath = ttStorage.getProductPath(wsdlId, wsdlId);
		var apicPromise = apiCli.validate(productPath);

		logger.exit("_transferSingleWSDLToFileSystem_WSDL_store_product", apicPromise);
		return apicPromise;
	}).then(function(){
		logger.entry("_transferSingleWSDLToFileSystem_WSDL_validate_product");
		
		// results
		transferSV.captureSuccess = true;
		transferSV.captureAttempted = true;
		
		// store result
		var resultPromise = ttStorage.storeTransferResult(wsdlId, wsdlId, transferSV);

		logger.exit("_transferSingleWSDLToFileSystem_WSDL_validate_product", resultPromise);
		return resultPromise;
	}).then(function(){
		logger.entry("_transferSingleWSDLToFileSystem_WSDL_store_results");
		
		logger.exit("_transferSingleWSDLToFileSystem_WSDL_store_results", theResults);
		return theResults;
	}).caught(function(error){
		logger.entry("_transferSingleWSDLToFileSystem_error");
		
		// if we have the api we can make results, else not
		var errorMsg = logger.Globalize.formatMessage("wsrrErrorTransferWSDLToFilesystem", wsdlId, error.toString());
		logger.error(errorMsg, error);
		
		if(theResults === null) {
			theResults = ttResults.createBSResultsItem("", "", "", wsdlId, false);
			transferSV = ttResults.createSVResultsItem("", "", "", wsdlId, false);
			ttResults.addServiceVersion(theResults, transferSV);
		}
		
		transferSV.success = false;
		transferSV.diagnostics = [error.toString(), error.stack];

		var errorPromise = ttStorage.storeTransferResult(wsdlId, wsdlId, transferSV).then(function() {
			logger.entry("_transferSingleWSDLToFileSystem_error_store_callback");
			
			// return unsuccessful
			delete transferSV.diagnostics;

			logger.exit("_transferSingleWSDLToFileSystem_error_store_callback", theResults);		
			return theResults;
		});
		
		logger.exit("_transferSingleWSDLToFileSystem_error", errorPromise);
		return errorPromise;
	});
	
	logger.exit("_transferSingleWSDLToFileSystem", promise);
	return promise;
}

/*
 * Transfer to drafts and publish for a single service version.
 * 
 * Will query WSRR for the owning business service, service version and all artifacts, store them in a folder under 
 * the filePath, and generate the YAML representing the Product and API. 
 * One Product and one API for the service version.
 *
 * Will ignore organizations and transfer all consumers over.
 *
 * Then uses APIC to generate the WSDL yaml and pushes into APIC. 
 * 
 * Config determines some things like the queries to run, the template file names, etc.
 * 
 * Returns Promise which resolves when done, with a result object of ttResults.
 *  
 * bsrURI - bsrURI of the service version.
 * filePath - path to put the files
 * configuration - config object with key:value pairs
 * wsrrUtils - WSRRUtils module, already initialized
 * apiCli - apic cli module, already initialized
 */
function transferToDraftForServiceVersion(bsrURI, filePath, configuration, wsrrUtils, apiCli, apicdevportal) {
	logger.entry("transferToDraftForServiceVersion", bsrURI, filePath, configuration, wsrrUtils, apiCli, apicdevportal);

	_loadPlugins();
	
	var modeFlags = {push: true};
	var publish = apiCli.getPublishMode();
	modeFlags.publish = publish;
	var consumers = apiCli.getConsumersMode();
	modeFlags.consumers = consumers;

	// indicate transferring single version
	modeFlags.singleSV = true;
	
	var promise = _transferToDraftForServiceVersion(bsrURI, filePath, configuration, wsrrUtils, apiCli, modeFlags, apicdevportal);
	
	logger.exit("transferToDraftForServiceVersion", promise);
	return promise;
}

/*
 * Transfers a service onto the file system for a single service version with the provided bsrURI.
 * 
 * Will query WSRR for the owning business service, service version and all artifacts, store them in a folder under 
 * the filePath, and generate the YAML representing the Product and API. 
 * One Product and one API per service version.
 *
 * Then uses APIC to generate the WSDL yaml.
 * 
 * Needs the APIC toolkit installed to validate and generate the WSDL YAML.
 * 
 * Does not push into APIC.
 * 
 * Config determines some things like the queries to run, the template file names, etc.
 *
 * If a service generate fails or a push fails, then the code logs this.
 *
 * Product per version mode.
 * 
 * Returns Promise which resolves when done, with a result object of ttResults.
 * 
 * bsrURI - bsrURI of the service version.
 * filePath - path to put the files
 * configuration - config object with key:value pairs
 * wsrrUtils - WSRRUtils module, already initialized
 * apiCli - apic cli module, already initialized
 */
function transferToFileSystemForServiceVersion(bsrURI, filePath, configuration, wsrrUtils, apiCli) {
	logger.entry("transferToFileSystemForServiceVersion", bsrURI, filePath, configuration, wsrrUtils, apiCli);

	_loadPlugins();
	
	var modeFlags = {push: false, publish: false, singleSV: true};
	var promise = _transferToDraftForServiceVersion(bsrURI, filePath, configuration, wsrrUtils, apiCli, modeFlags, null);

	logger.exit("transferToFileSystemForServiceVersion", promise);
	return promise;
}

/*
 * Generate API and Product YAML for a given business service and service version
 * on the file system. Then validate the YAMLs.
 * 
 * For use to diagnose issues.
 * Folder for business service and service version should exist.
 * 
 * Returns promise that resolves once the YAML is validated and written.
 */
function diagnose_generateAPIAndProductYAML(bsBsrURI, bsrURI, filePath, configuration, apiCli) {
	logger.entry("diagnose_generateAPIAndProductYAML", bsBsrURI, bsrURI, filePath, configuration, apiCli);
	
	// set where the storage module writes data
	ttStorage.setFSRoot(filePath);
	// explicit product per version
	ttStorage.setProductPerVersion(true);

	var overallData = ttData.create();
	
	var apiString = null;
	var productString = null;

	var wsrrDataPromise = ttStorage.readWsrrData(bsBsrURI, bsrURI);
	var templatePromise = templating.loadTemplatesIntoMap(configuration);
	var readsPromise = Promise.all([wsrrDataPromise, templatePromise]);
	
	var promise = readsPromise.then(function(data) {
		logger.entry("diagnose_generateAPIAndProductYAML_readWsrrData", data);
		// set
		overallData.setDiagnosticData(data[0]);

		var productTemplate = templating.getTemplate(templating.PRODUCT_PER_VERSION);
		var template = null;

		// find service type
		var endpointTypes = overallData.checkEndpointTypes(bsrURI);
		if(endpointTypes.SOAP === true) {		
			// generate WSRR API YAML using template and data in WSRR into file
			template = templating.getTemplate(templating.SOAP);
		} else if(endpointTypes.REST === true) {
			//TODO: need to check for swagger docs
			logger.info("REST not supported");
			throw new Error("REST not supported");
		} else {
			logger.info(logger.Globalize.formatMessage("flowNoEndpointsService"));
			// throw for now to make it stop processing this version
			throw new Error(logger.Globalize.formatMessage("flowErrorNoEndpoints"));
		}

		logger.info(logger.Globalize.formatMessage("flowGeneratingYaml"));

		var apiData = overallData.getApiData(bsrURI);
		apiString = templating.generateStringFromYamlTemplate(template, apiData);
		
		var productData = overallData.getProductData(bsrURI);
		productString = templating.generateStringFromYamlTemplate(productTemplate, productData);
	
		// store string version of yaml for diagnostic
		var productStringPromise = ttStorage.storeDiagnosticString(bsBsrURI, bsrURI, productString, "productFromTemplate.yaml");
		var apiStringPromise = ttStorage.storeDiagnosticString(bsBsrURI, bsrURI, apiString, "apiFromTemplate.yaml");
		var writesStringPromise = Promise.all([productStringPromise, apiStringPromise]);
		
		logger.exit("diagnose_generateAPIAndProductYAML_readWsrrData", writesStringPromise);
		return writesStringPromise;
	}).then(function(){
		logger.entry("diagnose_generateAPIAndProductYAML_writeCallback");

		// validate the yaml is valid
		logger.info("Parsing API YAML");
		var wsrrYaml = templating.generateObjectFromYamlString(apiString);
		logger.info("Parsing Product YAML");
		var productObject = templating.generateObjectFromYamlString(productString);

		logger.info(logger.Globalize.formatMessage("flowStoringYaml"));
		
		// write objects out now as product and WSRR api yamls
		var productPromise = ttStorage.storeProductYaml(bsBsrURI, bsrURI, productObject);
		var apiPromise = ttStorage.storeWSRRApiYaml(bsBsrURI, bsrURI, wsrrYaml);
		
		var writesPromise = Promise.all([productPromise, apiPromise]);
		
		logger.exit("diagnose_generateAPIAndProductYAML_writeCallback", writesPromise);
		return writesPromise;
	}).then(function() {
		logger.entry("diagnose_generateAPIAndProductYAML_writeAPICallback");
		
		logger.info(logger.Globalize.formatMessage("flowProcessedSV"));
		
		logger.exit("diagnose_generateAPIAndProductYAML_writeAPICallback");		
	});

	logger.exit("diagnose_generateAPIAndProductYAML", promise);
	return promise;
}

/*
 * Load and list the plugins found for diagnostics.
 * 
 * Returns once listed.
 */
function diagnose_listPlugins() {
	logger.entry("diagnose_listPlugins");
	
	_loadPlugins();
	
	var pluginNames = pluginLoader.listPlugins();
	if(pluginNames.length === 0) {
		logger.info(logger.Globalize.formatMessage("pluginsEmptyList"));
	} else {
		logger.info(logger.Globalize.formatMessage("pluginsList"));
		
		for(var i = 0, len = pluginNames.length; i < len; i++) {
			var pluginName = pluginNames[i];
			
			logger.info(logger.Globalize.formatMessage("pluginsListItem", pluginName));
		}
	}
	
	logger.exit("diagnose_listPlugins");
}


/*
 * Transfer to the file system for a set of directories each containing WSDL and XSD. Is
 * given a path to a directory. This directory should contain a directory per service
 * which contains the WSDL and XSD for that service. Eg:
 * 
 * wsdl1/x.wsdl
 * wsdl2/y.wsdl
 * wsdl2/a.xsd
 * wsdl2/metadata.yaml
 * 
 * Uses the APIC toolkit to generate API Yaml and the product template to generate product yaml.
 * The product is given the "final" API Yaml as an object to use to substitute.
 * 
 * If there is a "metadata.yaml" in any WSDL directory then this is read in and
 * overlaid on top of the generated API Yaml, and this is the "final" API Yaml.
 * 
 * Does not push into APIC.
 * 
 * Returns a promise that resolves with nothing when done.
 * 
 * filePath - path to put the files
 * configuration - config object with key:value pairs
 * wsdl - wsdl module, already initialized
 * apiCli - apic cli module, already initialized
 * 
 */
function transferToFileSystemForWSDL(filePath, configuration, wsdl, apiCli) {
	logger.entry("transferToFileSystemForWSDL", filePath, configuration, wsdl, apiCli);
	
	_loadPlugins();
	
	// set where the storage module writes data
	ttStorage.setFSRoot(filePath);
	// explicit product per version
	ttStorage.setProductPerVersion(true);
	
	var promise = templating.loadTemplatesIntoMap(configuration).then(function(){
		logger.entry("transferToFileSystemForWSDL_templateLoad");
		
		logger.info(logger.Globalize.formatMessage("flowFetchingWsdlFileSystem", wsdl.getWSDLPath()));
		// read list of folders in the one we were given
		var promise = wsdl.getWSDLDirectoryList();
		logger.exit("transferToFileSystemForWSDL_templateLoad", promise);
		return promise;
	}).then(function(list){
		logger.entry("transferToFileSystemForWSDL_list", list);
		
		if(!list.length || list.length === 0) {
			throw new Error(logger.Globalize.formatMessage("flowNoWsdlsLog"));
		}
	  	logger.info(logger.Globalize.formatMessage("flowFetchedWsdls", list.length));

		// reduce on the list and for each call getWSDLContent() then generate WSDL YAML and product from template
		// read the API Yaml and pull data from it to build the product template, using a different product template
  		var resultsObj = ttResults.create();
  		var ret = null;
		if(list.length > 0) {
	  		ret = Promise.reduce(list, function(total, wsdlId, index, length) {		
	  			logger.entry("transferToFileSystemForWSDL_reduce", total, wsdlId, index, length);
				logger.info(logger.Globalize.formatMessage("flowProcessingVersion", (index + 1), length));

	  			var wsdlPromise = _transferSingleWSDLToFileSystem(wsdlId, wsdl, apiCli).then(function(bs){
	  				logger.entry("transferToFileSystemForWSDL_reduce_callback", bs);
	  				total.addBusinessService(bs);
	  				logger.exit("transferToFileSystemForWSDL_reduce_callback", total);
	  				return total;
	  			}); 
	  			
	  			logger.exit("transferToFileSystemForWSDL_reduce", wsdlPromise);
	  			return wsdlPromise;
	  		}, resultsObj).then(function(results){
	  			logger.entry("transferToFileSystemForWSDL_reduce_end", results);
	  			logger.info(logger.Globalize.formatMessage("flowProcessedWsdls"));	  			
	  			logger.exit("transferToFileSystemForWSDL_reduce_end", results);
	  			return results;
	  		});
		} else {
			ret = resultsObj;
		}
		logger.exit("transferToFileSystemForWSDL_list", ret);
		return ret;
	});
	
	logger.exit("transferToFileSystemForWSDL", promise);
	return promise;
}

/*
 * Call a plugin to transfer to the file system.
 *
 * filePath - path to store the results
 * inputDirectory - path to where to get input, can be null
 * inputValue - value inputted on the command line, like the bsrURI for transfer mode 2. Can be null.
 * configuration - config object with key:value pairs
 * pluginName - name of plugin to use
 *
 * Returns a Promise which resolves with nothing when done. Throws if something goes wrong.
 * 
 */
function transferToFileSystemForPlugin(filePath, inputDirectory, inputValue, configuration, pluginName) {
	logger.entry("transferToFileSystemForPlugin", filePath, inputDirectory, inputValue, configuration, pluginName);
	
	// load plugins
	_loadPlugins();
	
	var promise = null;

	// set where the storage module writes data
	ttStorage.setFSRoot(filePath);
	// explicit product per version
	ttStorage.setProductPerVersion(true);

	// get plugin
	var pluginModule = pluginLoader.getPlugin(pluginName);
	if(pluginModule === null) {
		// error not found
		logger.info(logger.Globalize.formatMessage("errorPluginNotFound", pluginName));

		// return resolved promise
		promise = Promise.resolve();		
	} else {
		// load templates
		promise = templating.loadTemplatesIntoMap(configuration).then(function(){
			logger.entry("transferToFileSystemForPlugin_templateLoadDone");
	
			var pluginPromise = null;
			// call plugin
			try{
				// pass in modules in an object so we can add more later
				var modules = {
					logger: logger,
					ttStorage: ttStorage,
					templating: templating
				};
				logger.debug("Calling plugin module");
				pluginPromise = pluginModule.process(configuration, inputDirectory, inputValue, modules);
				logger.debug("Finished calling plugin module");
			} catch(e) {
				// log and rethrow
				logger.info(logger.Globalize.formatMessage("errorPluginRunning", pluginName, e));
				throw e;
			}
			
			logger.exit("transferToFileSystemForPlugin_templateLoadDone", pluginPromise);
			return pluginPromise;
		});
	}
	
	logger.exit("transferToFileSystemForPlugin", promise);
	return promise;
}

//TODO: for tool to return 1 for error, need to return what we did and which transfers failed

module.exports = {
	transferToDraftForOrganization: transferToDraftForOrganization,
	transferToDraftForServiceVersion: transferToDraftForServiceVersion,
	transferToFileSystemForOrganization: transferToFileSystemForOrganization,
	transferToFileSystemForServiceVersion: transferToFileSystemForServiceVersion,
	pushToDraftFromFileSystem: pushToDraftFromFileSystem,
	transferToFileSystemForWSDL: transferToFileSystemForWSDL,
	transferToFileSystemForPlugin: transferToFileSystemForPlugin,
	
	diagnose_generateAPIAndProductYAML: diagnose_generateAPIAndProductYAML,
	diagnose_listPlugins: diagnose_listPlugins
	
};

