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
 * Base connection script to WSRR
 */

'use strict';

var https = require('https'),http = require('http'), XmlDocument = require('xmldoc').XmlDocument, fs = require('fs'), 
propertyParse = require("properties-parser"),
logger=require("../../lib/Logger"),util=require("util"),queries =require("./wsrrqueries"), swaggerUtils = require('../swaggerUtils'), 
Promise = require('bluebird'), _ = require('lodash'), 
DOMParser = require('xmldom').DOMParser, XMLSerializer = require('xmldom').XMLSerializer,
yaml = require('js-yaml'), retry = require('retry'),chardet=require('chardet'),iconv=require('iconv-lite');
var retries = 5;
// Timeouts define how long between attempts should be waited not the amount of
// time for each attempt. The default can produce a max of 5 minutes, though is
// more likely to produce 2 minutes of retries
// Timeouts in Milliseconds
var minTimeout = 1 * 1000;
var maxTimeout = 60 * 1000 * 3;
var randomize = true;
/*
 * WSRR Connection details
 */
var wsrrHostname;
var wsrrPort;
var protocol;
var wsrrusername;
var wsrrpassword;
var wsrrPrefix;
var wsrrOrganisation;

var propertiesFile = "./connectionproperties.properties";
/*
 * WSRR Version details
 */
var versionURI;
var wsrrVersionMajor;
var wsrrVersionMinor;
var wsrrVersionMod;

var connection;

var baseConnectionOptions;

// config properties object with key:value pairs
var configuration = null;

// timeout for all requests
var requestTimeout = 300000;

/*
 * Constants. 7.5 endpoints because they work the same as future ones.
 */
var wsrrPropertyQueryPath = "/7.5/Metadata/JSON/PropertyQuery?query=";
var wsrrGraphQueryPath = "/7.5/Metadata/JSON/GraphQuery?query=";
var wsrrNamedQueryPath = "/7.5/Metadata/JSON/Query/";
var wsrrContentPath = "/7.5/Content/";
var wsrrMetadataPath = "/7.5/Metadata/JSON/";

var wsrrWSDLDocument = "WSDLDocument";
var wsrrXSDDocument = "XSDDocument";
var wsrrGenericDocument = "GenericDocument";

function setWSRRConnectiondetails(inputOptions) {
	logger.entry("setWSRRConnectiondetails", inputOptions);
	
	configuration = inputOptions;

	wsrrHostname = inputOptions.wsrrHostname;
	wsrrPort = inputOptions.wsrrPort;
	protocol = inputOptions.wsrrProtocol;
	wsrrusername = inputOptions.wsrrUsername;
	wsrrpassword = inputOptions.wsrrPassword;
	wsrrPrefix = inputOptions.wsrrPrefix;
	wsrrOrganisation = inputOptions.wsrrOrg;
	versionURI = "/" + wsrrPrefix + "WSRR";
	
	// check configuration
	if(!wsrrHostname || !wsrrPort || !protocol) {
		var message = logger.Globalize.formatMessage("wsrrMissingConfiguration");
		var e = new Error(message);
		logger.error(e);
		throw e;
	}
	
	// now if https check for username and password
	if(protocol==="https"){
		if(!wsrrusername || !wsrrpassword) {
			var message = logger.Globalize.formatMessage("wsrrMissingSecurityConfiguration");
			var e = new Error(message);
			logger.error(e);
			throw e;
		}
	}
	
	if(protocol==="https"){
		connection = https;
	}else{
		connection = http;
	}
	baseConnectionOptions = {
		hostname : wsrrHostname,
		port : wsrrPort,
		method : 'GET',
		headers:{
			accept : 'application/json'
		},
		agent : false,
		rejectUnauthorized : false,
		auth : wsrrusername + ':' + wsrrpassword
	};
	
	// request timeout is wsrrRequestTimeout in the config
	var strRequestTimeout = inputOptions.wsrrRequestTimeout;
	if(strRequestTimeout) {
		var intRequestTimeout = parseInt(strRequestTimeout);
		if(intRequestTimeout){
			requestTimeout = intRequestTimeout;
		}
	}
	// Retry Overrides - Not Documented
	if (inputOptions.retries) {
		retries = inputOptions.retries;
	}
	if (inputOptions.wsrrMinTimeout) {
		minTimeout = inputOptions.wsrrMinTimeout;
	}
	if (inputOptions.wsrrMaxTimeout) {
		maxTimeout = inputOptions.wsrrMaxTimeout;
	}

	logger.exit("setWSRRConnectiondetails");
}

function getAttribute(name, xmlO) {
	return xmlO.childWithAttribute("name",name).attr.value;
}

// if success, calls callback. If an error, logs it and calls errorCallback (with a message).
function sendRequestToWSRR(connectionOptions, callback, errorCallback) {
	//obfuscate WSRR Password
	var tConnectionOptions = _.cloneDeep(connectionOptions);
	tConnectionOptions.auth=tConnectionOptions.auth.split(":")[0]+":********";
	logger.entry("sendRequestToWSRR", tConnectionOptions);
	var operation = retry.operation({
		retries : retries,
		factor : 3,
		minTimeout : minTimeout,
		maxTimeout : maxTimeout,
		randomize : randomize,
	});
	operation.attempt(function(currentAttempt) {		
		var req = connection.request(connectionOptions, function(res) {
			logger.response(res);
			res.setEncoding('utf-8');
			var responseString = '';

			res.on('data', function(data) {
				if (logger.Debug) {
					logger.debug(data);
				}
				responseString += data;
			});

			res.on('end', function() {
				logger.entry("sendRequestToWSRR_end", res.statusCode);

				if (logger.Debug) {
					logger.debug(responseString);
				}
				// check the status code
				var status = res.statusCode;
				// deal with non-good return codes. 100 and 200 are ok, 300 is
				// redirect and 400 or 500 are bad.
				// but we will not deal with redirects for now.
				var statusNumber = parseInt(status);
				if (isNaN(statusNumber) || statusNumber >= 300) {
					// bad HTTP response code
					var errorMessage = logger.Globalize.formatMessage(
							"badHTTPcode", status, responseString);
					logger.error(errorMessage);
					errorCallback(errorMessage);
				} else {
					callback(responseString);
				}
				logger.exit("sendRequestToWSRR_end");
			});
		});
		// set timeout
		req.setTimeout(requestTimeout, function() {
			var msg = logger.Globalize.formatMessage("wsrrRequestTimeout",
					requestTimeout);
			var e = new Error(msg);
			logger.error(e);
			if (errorCallback) {
				if (operation.retry(e)) {
					if(currentAttempt>1){
						logger.warn(logger.Globalize.formatMessage("connectionfailedretry",connectionOptions.hostname,currentAttempt-1,retries));
					}else if(retries>0){
						logger.warn(logger.Globalize.formatMessage("connectionfailedfirst",connectionOptions.hostname));						
					}
					return;
				}else{
					logger.error(logger.Globalize.formatMessage("connectionfailedend",connectionOptions.hostname));
					logger.error(e);
					errorCallback(operation.mainError());
				}				
			}
		});
		logger.request(req);
		req.end();

		req.on('error', function(e) {
			var msg = null;
			if (e.code === "ETIMEDOUT") {
				// connect timeout
				msg = logger.Globalize
						.formatMessage("errorTimeoutConnectingToWSRR");
			} else {
				msg = logger.Globalize.formatMessage("errorSendRequestToWSRR");
			}
			if (errorCallback) {
				if (operation.retry(e)) {
					if(currentAttempt>1){
						logger.warn(logger.Globalize.formatMessage("connectionfailedretry",connectionOptions.hostname,currentAttempt-1,retries));
					}else if(retries>0){
						logger.warn(logger.Globalize.formatMessage("connectionfailedfirst",connectionOptions.hostname));						
					}
					logger.debug(e);
					return;
				}else{
					logger.error(logger.Globalize.formatMessage("connectionfailedend",connectionOptions.hostname));
					logger.error(e);
					errorCallback(e);
				}				
			}
		});
	});
	logger.exit("sendRequestToWSRR");
}

function getWSRRVersion(callback) {
	logger.entry("getWSRRVersion");
	// need to handle WSRR not being up, but WAS is still alive
	var tConnectionOptions = _.cloneDeep(baseConnectionOptions);
	tConnectionOptions.path = versionURI;
	var promise = new Promise(function(resolve, reject) {
		sendRequestToWSRR(tConnectionOptions, function(json) {
			var pJSON = JSON.parse(json);
			pJSON.forEach(function(item,index){
				if(item.name==="version"){
					wsrrVersionMajor = item.value[0];
					wsrrVersionMinor = item.value[2];
					wsrrVersionMod = item.value[4];
					logger.debug(wsrrVersionMajor + "." + wsrrVersionMinor + "."
							+ wsrrVersionMod);
					callback(wsrrVersionMajor + "." + wsrrVersionMinor + "."
							+ wsrrVersionMod);
				}
			});
			// resolve
			resolve(json);
		}, function(error) {
			// error
			resolve();
			callback();
		});
	});
	logger.exit("getWSRRVersion");
}

function testWSRRConnection(callback) {
	logger.entry("testWSRRConnection");
	var wsrr2apimProperties = fs
			.readFileSync(propertiesFile);
	var inputOptions = propertyParse.parse(wsrr2apimProperties);		
	setWSRRConnectiondetails(inputOptions);
	getWSRRVersion(function(data) {
		if (data) {
			callback(true, data)
		} else {
			callback(false, null);
		}
	});	
	logger.exit("testWSRRConnection");
}

function getEndpointAddressGivenBSRURI(bsrURI, callback) {
	var tConnectionOptions = _.cloneDeep(baseConnectionOptions);
	var path =queries.EndpointAddressGivenBsrURI.path+queries.graphQuery+queries.EndpointAddressGivenBsrURI.query;
	path = path.replace("%bsrURI%",bsrURI);
	tConnectionOptions.path
	sendRequestToWSRR(tConnectionOptions,function(xml){
		logger.info(xml);
		var document = new XmlDocument(xml);
        	var endpoints = document.childrenNamed("resource");
        	endpoints.forEach(function(endpoint){
			endpoint= endpoint.descendantWithPath("properties");
			var name = getAttribute("name", endpoint);
                	callback(name);
                });
	});
}

function getAllServiceVersions(callback){

}

function getSLDForApplicationVersion(bsrURI, callback) {
}

/*
 * Process the response from a graph query or fetch to get all properties
 * flattened. Response object is an array of objects.
 * 
 * Each object has properties of: properties - to flatten like: properties: {
 * name: Name, description: desc, etc } does not include bsrURI or primaryType,
 * these are on the object itself relationships - to flatten and also combine
 * multiple relationships into one like: relationships: {
 * gep63_serviceInterface: [ {bsrURI: xxx, type: GenericObject, primaryType:
 * xyz}, { another target } ] , gep63_availableEndpoints: [ .. more targets ] }
 * rels with no targets will have an empty array, eg relationships: {no_targets:
 * []} type - carry across primaryType - if present in properties, added to the
 * root governanceRootBsrURI - carry across bsrURI - carry across
 * classifications - remove the state and primaryType classification and then
 * flatten like: classifications: [ "uri1", "uri2" ] Add a state property which
 * has the uri of the state, comes from classifications where governanceState =
 * true
 * 
 */
function _flattenDataArray(data) {
	logger.entry("_flattenDataArray", data);
	var dataArray = [];
	
	if (data.length > 0) {
	   for (var i=0; i < data.length; i++) {
		  var object = {};
		  var wsrrobject = data[i];
		  // carry across things
		  object.bsrURI = wsrrobject.bsrURI;
		  object.type = wsrrobject.type;
		  object.governanceRootBsrURI = wsrrobject.governanceRootBsrURI;

		  // properties
		  var properties = {};
		  for (var propI = 0; propI < wsrrobject.properties.length; propI++) {
			var property = wsrrobject.properties[propI];
			if(property.name !== "bsrURI" && property.name !== "primaryType") {
				properties[property.name] = property.value;
			}
			// put type on root
			if(property.name === "primaryType") {
				object.primaryType = property.value;
			}
		  }
		  object.properties = properties;
		  
		  // relationships, like {bsrURI: xxx, type: GenericObject,
			// primaryType: xyz}
		  var relationships = {};
		  if(wsrrobject.relationships) {
			  for( var relI = 0; relI < wsrrobject.relationships.length; relI++) {
				  var relationship = wsrrobject.relationships[relI];
				  if(relationship.targetBsrURI) {
					  // has a target
					  var processedRel = relationships[relationship.name];
					  if(!processedRel) {
						  // add
						  processedRel = [];
						  relationships[relationship.name] = processedRel;
					  } 
					  var newRel = {};
					  newRel.bsrURI = relationship.targetBsrURI;
					  newRel.type = relationship.targetType;
					  newRel.primaryType = relationship.primaryType;
					  processedRel.push(newRel);
				  } else {
					  // no target
					  relationships[relationship.name] = [];
				  }
			  }
		  }
		  object.relationships = relationships;
		  
		  // classifications
		  var stateUri = null;
		  var classifications = [];
		  if(wsrrobject.classifications) {
			  for( var classI = 0; classI < wsrrobject.classifications.length; classI++) {
				  var classification = wsrrobject.classifications[classI];
				  // state true is actually a string
				  if(classification.governanceState && classification.governanceState === "true") {
					  // state, set and exclude from list
					  stateUri = classification.uri;
				  } else if(classification.uri !== object.primaryType){
					  // non state non primarytype, add to list
					  classifications.push(classification.uri);
				  }				  
			  }
		  }
		  object.classifications = classifications;
		  if(stateUri !== null) {
			  object.state = stateUri;
		  }
		  
		  // add to results
		  dataArray.push(object);
		}
	}
	
	logger.exit("_flattenDataArray", dataArray);
	return dataArray;
}

/*
 * Process a flattened data array from _flattenDataArray and make
 * an array of objects suitable for passing into WSRR. Effectively
 * does the opposite of _flattenDataArray.
 *   
 * Response object is an array of objects.
 * 
 */
function _unflattenDataArray(data) {
	logger.entry("_unflattenDataArray", data);
	var dataArray = [];
	
	if (data.length > 0) {
	   for (var i=0; i < data.length; i++) {
		  var object = {};
		  var wsrrobject = data[i];
		  // carry across things
		  object.bsrURI = wsrrobject.bsrURI;
		  object.type = wsrrobject.type;
		  object.governanceRootBsrURI = wsrrobject.governanceRootBsrURI;

		  // properties is an array of objects with name and value
		  var properties = [];
		  var keys = Object.keys(wsrrobject.properties);
		  for (var propI = 0; propI < keys.length; propI++) {
			  var propertyName = keys[propI];
			  var propertyValue = wsrrobject.properties[propertyName];
			  properties.push({name: propertyName, value: propertyValue});
		  }
		  // primary Type
		  if(wsrrobject.primaryType) {
			  properties.push({name: "primaryType", value: wsrrobject.primaryType});
		  }
		  // bsrURI is also a property
		  properties.push({name: "bsrURI", value: wsrrobject.bsrURI});
		  // add to object
		  object.properties = properties;
		  
		  /*
		   * relationships is an array of objects, each object has just the name of an empty rel, or
		   * if there are targets, there is an object per target with properties of: name, targetType (SDO
		   * type of target), primaryType (if GenericObject the primary Type of the target), targetBsrURI
		   * 
		   */

		  var relationships = [];
		  if(wsrrobject.relationships) {
			  var relKeys = Object.keys(wsrrobject.relationships);
			  for( var relI = 0; relI < relKeys.length; relI++) {
				  var relName = relKeys[relI];
				  var relTargets = wsrrobject.relationships[relName];
				  if(relTargets.length === 0) {
					  // no targets
					  relationships.push({name: relName});
				  } else {
					  for(var relTargetI = 0; relTargetI < relTargets.length; relTargetI++){
						  var target = relTargets[relTargetI];
						  var newRelEntry = {
							 name: relName,
							 targetBsrURI: target.bsrURI,
							 targetType: target.type							 
						  };
						  if(target.primaryType) {
							  newRelEntry.primaryType = target.primaryType;
						  }
						  relationships.push(newRelEntry);
					  }
				  }				  
			  }
		  }
		  object.relationships = relationships;
		  
		  /*
		   * classifications is array of objects with uri of the uri and if the state, governanceState: "true"
		   */
		  var classifications = [];
		  if(wsrrobject.classifications) {
			  for( var classI = 0; classI < wsrrobject.classifications.length; classI++) {
				  var classification = wsrrobject.classifications[classI];
				  classifications.push({uri: classification});
			  }
		  }
		  // add state which is stored seperately
		  if(wsrrobject.state) {
			  classifications.push({uri: wsrrobject.state, governanceState: "true"});
		  }
		  // add primary type which is stored separately
		  if(wsrrobject.primaryType) {
			  classifications.push({uri: wsrrobject.primaryType});
		  }
		  object.classifications = classifications;
		  
		  // add to results
		  dataArray.push(object);
	   }
	}
	
	logger.exit("_unflattenDataArray", dataArray);
	return dataArray;	
}

/*
 * Run graph query via REST API (so depth 1) and return a Promise. The Promise
 * will be resolved when the results come back. The resolve will be a single
 * array object which contains object per result. These objects will be in an
 * array with flattened properties. Which means a properties object with name =
 * prop name and value = value.
 */ 
function runGraphQuery(xpath) {
	logger.entry("runGraphQuery", xpath);
	
	// make query path
	var encodedXPath = encodeURIComponent(xpath);
	var restUrl = versionURI + wsrrGraphQueryPath + encodedXPath;
	
	// duplicate the connection options before modifying for thread safety
	var tConnectionOptions = _.cloneDeep(baseConnectionOptions);
	tConnectionOptions.path = restUrl;
	
	// I promise to be easier to use than callbacks
	var promise = new Promise(function(resolve, reject) {
		sendRequestToWSRR(tConnectionOptions, function(jsonString){
			// parse the response
			var responseObject = JSON.parse(jsonString);
			var returnObject = _flattenDataArray(responseObject);
	
			// resolve
			resolve(returnObject);
		}, function(error) {
			// error
			reject(error);
		});	
	});
	
	logger.exit("runGraphQuery", promise);
	return promise;
}

// graph is array of objects each have bsrURI property, properties property, type property
function _isGraphQueryResults(responseObject) {
	//TODO: this
	return true;
}

/*
 * Run a named query with the provided name and optionally parameters.
 * 
 * For now assumes the result is a graph query.
 * 
 * name - string name of query
 * parameters - array of string, parameters, can be null
 * 
 * Returns a Promise that resolves with the results.
 */ 
function runNamedQuery(name, parameters) {
	logger.entry("runNamedQuery", name, parameters);
	
	// make query path
	var encodedXPath = encodeURIComponent(name);
	var restUrl = versionURI + wsrrNamedQueryPath + encodedXPath;
	
	// add parameters
	if(parameters && parameters.length) {
		var first = true;
		for(var i = 0, len = parameters.length; i < len; i++) {
			var param = parameters[i];
			if(first) {
				restUrl += "?";
				first = false;
			} else {
				restUrl += "&";
			}
			restUrl += "p" + (i+1) + "=" + encodeURIComponent(param);
		}
	}
	
	// duplicate the connection options before modifying for thread safety
	var tConnectionOptions = _.cloneDeep(baseConnectionOptions);
	tConnectionOptions.path = restUrl;
	
	// I promise to be easier to use than callbacks
	var promise = new Promise(function(resolve, reject) {
		sendRequestToWSRR(tConnectionOptions, function(jsonString){
			// parse the response
			var responseObject = JSON.parse(jsonString);
			
			// figure out if prop or graph query results
			var returnObject = null;
			var isGraphResults = _isGraphQueryResults(responseObject);
			if(isGraphResults) {
				returnObject = _flattenDataArray(responseObject);
			} else {
				returnObject = _flattenPropertyQueryResultsArray(responseObject);
			}
			
			// resolve
			resolve(returnObject);
		}, function(error) {
			// error
			reject(error);
		});	
	});

	logger.exit("runNamedQuery", promise);
	return promise;
}

/*
 * Retrieve metadata for the bsrURI (depth 1) and return a Promise. The Promise
 * will be resolved when the results come back. The resolve will be a single
 * object. This object will be of the format of _flattenDataArray.
 */ 
function retrieveMetadata(bsrURI) {
	logger.entry("retrieveMetadata", bsrURI);
	
	// make query path
	var restUrl = versionURI + wsrrMetadataPath + bsrURI;
		
	var tConnectionOptions = _.cloneDeep(baseConnectionOptions);
	tConnectionOptions.path = restUrl;
	
	// I promise to be easier to use than callbacks
	var promise = new Promise(function(resolve, reject) {
		sendRequestToWSRR(tConnectionOptions, function(jsonString){
			// parse the response
			var responseObject = JSON.parse(jsonString);
			var returnObject = null;
			var returnArray = _flattenDataArray(responseObject);
			if(returnArray && returnArray.length === 1) {
				returnObject = returnArray[0];
			}
	
			// resolve
			resolve(returnObject);
		}, function(error) {
			// error
			reject(error);
		});	
	});
	
	logger.exit("retrieveMetadata", promise);
	return promise;
}

/*
 * Flatten the results of a property query.
 * 
 * Usually its an array, with an array per object containing objects with name
 * and value for each property. Return will be an array of objects with the key
 * the property name and the value the property value.
 * 
 */
function _flattenPropertyQueryResultsArray(data) {
	logger.entry("_flattenPropertyQueryResultsArray", data);
	var dataArray = [];
	
	if (data.length > 0) {
	   for (var i=0; i < data.length; i++) {
		  var object = {};
		  var resultObject = data[i];
		  // result is an array of objects
		  var propsLen = resultObject.length;
		  for(var propI = 0; propI < propsLen; propI++) {
			  var resultProp = resultObject[propI];
			  // resultProp is an object with name of the prop name and value
				// of the prop value
			  object[resultProp.name] = resultProp.value;
		  }
		  dataArray.push(object);
		}
	}
	logger.exit("_flattenPropertyQueryResultsArray", dataArray);
	return dataArray;
}

/*
 * Run property query via REST API and return a Promise. Input xpath. Input
 * properties which is an array of strings, names of the properties to return.
 * 
 * The Promise will be resolved when the results come back. The resolve will be
 * a single array object which contains object per result. These objects will
 * have flattened properties. Which means an object with name = prop name and
 * value = value. eg {name: <name value>, bsrURI: <bsrURI value>}
 */ 
function runPropertyQuery(xpath, wsrrProperties) {
	logger.entry("runPropertyQuery", xpath, wsrrProperties);
	
	// make query path
	var encodedXPath = encodeURIComponent(xpath);
	var restUrl = versionURI + wsrrPropertyQueryPath + encodedXPath;
	if(wsrrProperties) {
		var wsrrPropertyString = "";
		for (var i = 0; i < wsrrProperties.length; i++) {
			var property = wsrrProperties[i];
			// url encode the property
			property = encodeURIComponent(property);
			wsrrPropertyString += "&p" + (i + 1) + "=" + property;
		}
		restUrl += wsrrPropertyString;
	}
		
	var tConnectionOptions = _.cloneDeep(baseConnectionOptions);
	tConnectionOptions.path = restUrl;

	// I promise to be easier to use than callbacks
	var promise = new Promise(function(resolve, reject) {
		sendRequestToWSRR(tConnectionOptions, function(jsonString){
			// parse the response
			var responseObject = JSON.parse(jsonString);
			var returnObject = _flattenPropertyQueryResultsArray(responseObject);
			// resolve
			resolve(returnObject);
		}, function(error) {
			// error
			reject(error);
		});	
	});
	
	logger.exit("runPropertyQuery", promise);
	return promise;
}

/*
 * Download the binary content identified by bsrURI.
 * 
 * Relative - whether to pass in type=relative (true) or not (false). The true option rewrites imports
 * in WSDLs and XSDs to refer to the WSRR server for the import/include/redefine-ed documents.
 * 
 * Returns a Promise. The Promise will be resolved when the result comes back.
 * The resolve will be a single data object which is a Buffer. This has the
 * binary content.
 */
function downloadBinaryContent(bsrURI, relative) {
	logger.entry("downloadBinaryContent", bsrURI, relative);

	// have to use request directly to get binary data
	
	// make path
	var restUrl = versionURI + wsrrContentPath + bsrURI;
	if(relative) {
		restUrl += "?type=relative";
	}
		
	var tConnectionOptions = _.cloneDeep(baseConnectionOptions);
	tConnectionOptions.path = restUrl;

	var promise = new Promise(function(resolve, reject) {
		// request and resolve/reject promise when done
		// use http.get so that it returns Buffers
		var operation = retry.operation({
			retries : retries,
			factor : 3,
			minTimeout : minTimeout,
			maxTimeout : maxTimeout,
			randomize : randomize,
		});
		operation.attempt(function(currentAttempt) {
			var req = connection.get(tConnectionOptions, function(res) {
				var responseBuffers = [];

				res.on('data', function(data) {
					responseBuffers.push(data);
				});

				res.on('end', function() {
					logger.entry("downloadBinaryContent response", bsrURI);

					var resBuffer = Buffer.concat(responseBuffers);

					// check the status code
					var status = res.statusCode;
					// deal with non-good return codes. 100 and 200 are ok, 300
					// is
					// redirect and 400 or 500 are bad.
					// but we will not deal with redirects for now.
					var statusNumber = parseInt(status);
					if (isNaN(statusNumber) || statusNumber >= 300) {
						// bad HTTP response code
						var errorMessage = logger.Globalize.formatMessage(
								"badHTTPcode", status, resBuffer);
						logger.error(errorMessage);
						// reject Promise due to error
						logger.debug(
								"downloadBinaryContent response rejecting",
								bsrURI);
						reject(errorMessage);
					} else {
						// resolve Promise
						logger.debug(
								"downloadBinaryContent response resolving",
								bsrURI);
						resolve(resBuffer);
					}
					logger.exit("downloadBinaryContent response");
				});
			});
			req.end();

			req.setTimeout(requestTimeout, function() {
				var msg = logger.Globalize.formatMessage("wsrrRequestTimeout",
						requestTimeout);
				var e = new Error(msg);
				logger.error(e);				
				if (operation.retry(e)) {
					if(currentAttempt>1){
						logger.warn(logger.Globalize.formatMessage("connectionfailedretry",tConnectionOptions.hostname,currentAttempt-1,retries));
					}else if(retries>0){
						logger.warn(logger.Globalize.formatMessage("connectionfailedfirst",tConnectionOptions.hostname));						
					}
					return;
				}else{
					logger.error(logger.Globalize.formatMessage("connectionfailedend",tConnectionOptions.hostname));
					logger.error(e);
				}					
			});
			logger.request(req);
			req.end();

			req.on('error', function(e) {
				var msg = null;
				if (e.code === "ETIMEDOUT") {
					// connect timeout
					msg = logger.Globalize
							.formatMessage("errorTimeoutConnectingToWSRR");
				} else {
					msg = logger.Globalize
							.formatMessage("errorSendRequestToWSRR");
				}				
				if (operation.retry(e)) {
					if(currentAttempt>1){
						logger.warn(logger.Globalize.formatMessage("connectionfailedretry",tConnectionOptions.hostname,currentAttempt-1,retries));
					}else if(retries>0){
						logger.warn(logger.Globalize.formatMessage("connectionfailedfirst",tConnectionOptions.hostname));						
					}
					return;
				}else{
					logger.error(logger.Globalize.formatMessage("connectionfailedend",tConnectionOptions.hostname));
					logger.error(e);					
				}
			});
		});
	});
	
	logger.exit("downloadBinaryContent", promise);
	return promise;
}

/*
 * For the bsrURI, download the metadata and find dependent documents. Then
 * download the binary content.
 * 
 * Returns a Promise, resolved with an object: {bsrURI: bsrURI, name: name of
 * doc, content: Buffer with content, dependents: array of bsrURI strings for
 * dependent docs}
 * 
 */
function _downloadBinaryAndGetDependents(bsrURI) {
	logger.entry("_downloadBinaryAndGetDependents", bsrURI);
	
	// get the metadata
	var metadataPromise = retrieveMetadata(bsrURI);
	// download the binary content and rewrite the imports in the content
	var binaryPromise = downloadBinaryContent(bsrURI, true);
	
	var promise = Promise.all([metadataPromise, binaryPromise]).then(function(allData){
		logger.entry("_downloadBinaryAndGetDependents response", bsrURI, allData);

		var metadata = allData[0];
		var content = allData[1];
		
		// find dependent documents if WSDL or XSD
		var depDocs = [];
		if(metadata.type === wsrrWSDLDocument || metadata.type === wsrrXSDDocument) {
			// imported WSDLs - only on WSDLDocuments
			if(metadata.relationships.importedWSDLs) {
				metadata.relationships.importedWSDLs.forEach(function(target){
					depDocs.push(target.bsrURI);
				});
			}
			// imported XSDs
			if(metadata.relationships.importedXSDs) {
				metadata.relationships.importedXSDs.forEach(function(target){
					depDocs.push(target.bsrURI);
				});
			}
			// included XSDs
			if(metadata.relationships.includedXSDs) {
				metadata.relationships.includedXSDs.forEach(function(target){
					depDocs.push(target.bsrURI);
				});
			}			
			// redefined XSDs
			if(metadata.relationships.redefinedXSDs) {
				metadata.relationships.redefinedXSDs.forEach(function(target){
					depDocs.push(target.bsrURI);
				});
			}
		}
		
		var result = {content: content};
		result.dependents = depDocs;
		result.bsrURI = bsrURI;
		result.name = metadata.properties.name;
		result.type = metadata.type;

		logger.exit("_downloadBinaryAndGetDependents response", result);

		return result;
	});
	
	logger.exit("_downloadBinaryAndGetDependents", promise);
	return promise;
}

/*
 * Process returns from _downloadBinaryAndGetDependents.
 * 
 * If we need to fetch more documents, fire off requests.
 * 
 * Returns a promise that is not resolved until all sub-requests have been done.
 * Promise resolves with: [{bsrURI: bsrURI of doc, name: name of doc, content:
 * Buffer with binary content, type: SDO Type}, ...]
 * 
 */
function _process_downloadBinaryAndGetDependents(alreadySeen, docData) {
	logger.entry("_process_downloadBinaryAndGetDependents", alreadySeen, docData);
	
	// process data
	var result = {};
	result.bsrURI = docData.bsrURI;
	result.name = docData.name;
	result.content = docData.content;
	result.type = docData.type;
	
	// now find if we need to do more requests
	var newTodoBsrURIs = [];
	for(var i = 0; i < docData.dependents.length; i++) {
		var depBsrURI = docData.dependents[i];
		// check if this is already processed
		if(!alreadySeen[depBsrURI]) {
			// add
			alreadySeen[depBsrURI] = true;
			newTodoBsrURIs.push(depBsrURI);
		}
	}

	var ret = null;
	// if the new array has contents, then we need to fetch all these
	if(newTodoBsrURIs.length > 0) {
		// call back to _downloadServiceDocuments with the list to get it to
		// return a Promise, resolved when
		// all documents fetched. All this with the data we have.
		var fetchPromise = _downloadServiceDocuments(newTodoBsrURIs, alreadySeen);
		ret = Promise.all([result, fetchPromise]);
	} else {
		// return data directly
		ret = result;
	}
	logger.exit("_process_downloadBinaryAndGetDependents", ret);
	return ret;
}

/*
 * Download the service documents in todoBsrURIs.
 * 
 * todoBsrURIs - array of bsrURIs to process. Must have something in them.
 * alreadySeen - map of {bsrURI: true} for docs already processed or being
 * processed
 * 
 * Returns Promise which is resolved with an array of objects: [{bsrURI: bsrURI
 * of doc, name: name of doc, content: Buffer with binary content}, ...]
 * 
 * If the data requires further requests, this will not resolve until those
 * requests are resolved.
 * 
 */
function _downloadServiceDocuments(todoBsrURIs, alreadySeen) {
	logger.entry("_downloadServiceDocuments", todoBsrURIs, alreadySeen);

	// promises we fired off
	var firedPromises = [];
	
	for(var i = 0; i < todoBsrURIs.length; i++) {
		var bsrURI = todoBsrURIs[i];
		// process this one here
		var onePromise = _downloadBinaryAndGetDependents(bsrURI).then(_process_downloadBinaryAndGetDependents.bind(this, alreadySeen));
		// add this promise to the array
		firedPromises.push(onePromise);
	}
	
	// now return a promise which waits for all promises to resolve
	var retPromise = Promise.all(firedPromises);
	
	logger.exit("_downloadServiceDocuments", retPromise);
	return retPromise;
}

/*
 * Change the import location or schemaLocation attribute to either the bsrURI name or the file name.
 * 
 * Look on the provided node for attributes of location or schemaLocation, and get the location value.
 * 
 * The location value will be of the form "<bsrURI>?type=relative". If not the original 
 * is returned.
 * 
 * If the bsrURI is in the bsrURIToName map, then use the mapped name. Otherwise use
 * a name of <bsrURI>.<type> where <type> is wsdl or xsd.
 * 
 * location - the location value
 * bsrURIToName - map of bsrURI to doc name for bsrURIs we want to replace
 * isWsdl - is the doc wsdl (true) or xsd (false)
 *
 * Sets the location or schemaLocation attribute value (on the node) to the new value.
 * 
 */
function _rewriteImportsGetImport(node, bsrURIToName, isWsdl, bsrURIToType){
	// cannot trace the node
	logger.entry("_rewriteImportsGetImport", bsrURIToName, isWsdl, bsrURIToType);

	var map = node.attributes;
	var location = null;
	for(var n = 0; n < map.length; n++){
		if(map[n].nodeName === "location" || map[n].nodeName === "schemaLocation") {
			location = map[n];
		}
	}
	if(location) {
		// change
		var newLoc = location.value;
		var queryStringLoc = newLoc.indexOf("?type=relative");
		if(queryStringLoc !== -1) {
			var bsrURI = newLoc.substring(0, queryStringLoc);
			if(bsrURI) {
				var name = bsrURIToName[bsrURI];
				if(name) {
					// use name
					newLoc = name;
				} else {
					// make from bsrURI and type of the imported document
					newLoc = bsrURI;
					var type = bsrURIToType[bsrURI];
					if(type) {
						if(type === wsrrWSDLDocument) {
							newLoc += ".wsdl";
						} else {
							newLoc += ".xsd";
						}
					}
				}
			}
		}	
		location.value = newLoc;
	}
		
	logger.exit("_rewriteImportsGetImport");
}


/*
 * Rewrite the imports in the supplied Buffer which is a WSDL or XSD document content, and the import format
 * is a WSRR rewritten import like schemaLocation="dbbb0adb-6985-451f.97a4.e922a1e9a431?type=relative".
 * 
 * Decoded to a UTF-8 string.
 * 
 * content - Buffer with the binary content of the doc.
 * isWsdl - is this a WSDL (true) or XSD (False)
 * bsrURIToName - map of bsrURI to the document name for all documents that will be rewritten by converting the bsrURI to the name.
 *   If a bsrURI is found which is missing from this list, then the bsrURI is kept in the document.
 * bsrURIToType - map of bsrURI to the doc type (WSDLDocument or XSDDocument) for all documents.
 *
 * Returns a Buffer with the rewritten document content.
 * Throws an error if something goes wrong parsing the document.
 *
 */
function _rewriteImports(content, isWsdl, bsrURIToName, name, bsrURIToType) {
	logger.entry("_rewriteImports", content, isWsdl, bsrURIToName, name, bsrURIToType);

	var retBuffer = null;
	var encoding=chardet.detect(content);
	var doc = null;	
	if(iconv.encodingExists(encoding)){
		//throw error if encoding is not supported
		var xmlString = iconv.decode(content,encoding);
		// parse
		try {
			doc = new DOMParser().parseFromString(xmlString);
		} catch(e) {
			var errorMessage = logger.Globalize.formatMessage("wsrrErrorParsingDocument", name, e);
			logger.error(errorMessage);
			logger.exit("_rewriteImports", errorMessage);
			throw new Error(errorMessage);
		}
	}else{
		//As we are sure these are WSDL 
		var errorMessage=logger.Globalize.formatMessage("unsupportedDocumentEncoding");
		logger.error(errorMessage);
		logger.exit("_rewriteImports", errorMessage);
		throw new Error(errorMessage);
	}	
	
	// replace import/includes
	var nodeList = doc.documentElement.childNodes;
	var i;
	var node;
	if(nodeList) {
		if(isWsdl) {
			for(i = 0; i < nodeList.length; i++) {
				node = doc.documentElement.childNodes[i];
				if(node.nodeName.indexOf("types") !== -1) {
					var schemas = node.childNodes;
					if(schemas) {
						for(var j = 0; j < schemas.length; j++) {
							var schema = schemas[j];
							if(schema.nodeName.indexOf("schema") !== -1) {
								var imports = schema.childNodes;
								if(imports) {
									for(var k = 0; k < imports.length; k++) {
										var importNode = imports[k];
										if(importNode.nodeName.indexOf("import") !== -1 || importNode.nodeName.indexOf("include") !== -1) {
											_rewriteImportsGetImport(importNode, bsrURIToName, isWsdl, bsrURIToType);
										}
									}
								}
							}
						}
					}
				}
				// end types/schema
				else if(node.nodeName.indexOf("import") !== -1) {
					_rewriteImportsGetImport(node, bsrURIToName, isWsdl, bsrURIToType);
				}				
			}
		} // end is wsdl
		else {
			// treat as xsd
			for(i = 0; i < nodeList.length; i++) {
				node = doc.documentElement.childNodes[i];
				if(node.nodeName.indexOf("import") !== -1 || node.nodeName.indexOf("include") !== -1) {
					_rewriteImportsGetImport(node, bsrURIToName, isWsdl, bsrURIToType);
				}
			}
		}
	}
	
	// output to string
	var outXmlString = null;
	try {
		var s = new XMLSerializer();
		outXmlString = s.serializeToString(doc);
	} catch(e){
		var serErrorMessage = logger.Globalize.formatMessage("wsrrErrorSerializingDocument", name, e);
		logger.error(serErrorMessage);
		logger.exit("_rewriteImports", serErrorMessage);
		throw new Error(serErrorMessage);
	}

	retBuffer = new Buffer(outXmlString, "utf8");
	
	logger.exit("_rewriteImports", retBuffer);
	return retBuffer;
}

/*
 * calculate the file extension for a document
 */
function _calculateFileName(docName,type,isBsrURI){
	//split filename from extension, however allow for '.' in rest of filename
	if(!isBsrURI){
		docName = docName.substring(0,docName.lastIndexOf("."));
	}
	var extension = ((type=== wsrrWSDLDocument) ? ".wsdl" : (type=== wsrrXSDDocument) ? ".xsd" : docName.substring(docName.lastIndexOf("."),docName.length))
	return docName+extension;
}

/*
 * Calculate and add a location property for each entry in the data, and rewrite the
 * import/include/redefine statements in the documents to match the locations.
 * 
 * The location field is the calculated location of the document, which is the location
 * where to store the document in a ZIP such that imports from other documents will work.
 * This is relative to some imaginary root and does not include the doc name. For example
 * for doc name "schema.xsd" and location "schemas/" then the doc should be stored as 
 * "schemas/schema.xsd". For doc name "interface.wsdl" and location "" the doc should be
 * stored as "interface.wsdl".
 * 
 */ 
function _calculateLocationsAndRewriteDocuments(wsdlData) {
	logger.entry("_calculateLocationsAndRewriteDocuments", wsdlData);

	/*
	 * Have asked WSRR to rewrite imports so we get the bsrURI of the docs in the XML. Like schemaLocation="dbbb0adb-6985-451f.97a4.e922a1e9a431?type=relative"
	 * Check for duplicate names in the names list and mark the bsrURIs that should be kept as bsrURIs.
	 * Rewrite the XML for each doc and remove the URL to WSRR and put in either:
	 * - the doc name or
	 * - the bsrURI if in the list
	 * (these are flat names)
	 * 
	 * Then the location specifies the name also. And we set to the bsrURI or the doc name.
	 * 
	 */

	var i, wsdl, count;
	
	// map of bsrURI to name except where we want to keep the bsrURI when the name occurs >1
	var bsrURIToName = {};
	// map of bsrURI to type
	var bsrURIToType = {};
	for(i = 0; i < wsdlData.length; i++) {
		wsdl = wsdlData[i];
		// how many times does the name occur?
		count = 0;
		for(var k = 0; k < wsdlData.length; k++) {
			var compWsdl = wsdlData[k];
			if(compWsdl.name === wsdl.name) {
				count++;
			}
		}
		if(count === 1) {
			// not a duplicate
			bsrURIToName[wsdl.bsrURI] = _calculateFileName(wsdl.name,wsdl.type);
		}

		// always add to type map
		bsrURIToType[wsdl.bsrURI] = wsdl.type;
	}	

	// rewrite doc import/include/redefine statement
	for(i = 0; i < wsdlData.length; i++) {
		wsdl = wsdlData[i];
		// only rewrite if WSDL or XSD
		if(wsdl.type === wsrrWSDLDocument || wsdl.type === wsrrXSDDocument) {
			var isWsdl = wsdl.type === wsrrWSDLDocument;	
			var newContent = _rewriteImports(wsdl.content, isWsdl, bsrURIToName, wsdl.name, bsrURIToType);
			wsdl.content = newContent;
		}
	}

	// calculate names
	for(i = 0; i < wsdlData.length; i++) {
		wsdl = wsdlData[i];
		if(bsrURIToName[wsdl.bsrURI]) {
			// use name
			wsdl.location = _calculateFileName(wsdl.name,wsdl.type);
		} else {
			// use bsrURI plus type because there are duplicate names
			wsdl.location = _calculateFileName(wsdl.bsrURI,wsdl.type,true);			
		}
	}
	
	logger.exit("_calculateLocationsAndRewriteDocuments");
}

/*
 * Check the content is a swagger, given the extension on the name for yaml or json.
 * Checks for the swagger = "2.0" entry at the root, and that the content can be
 * parsed as YAML or JSON.
 * 
 * content - Buffer with utf8 string content of swagger doc, yaml or json format
 * name - Name of document the content is for
 * 
 * 
 * Returns true or false.
 */
function _checkContentIsSwagger(content, name) {
	logger.entry("wsrrUtils._checkContentIsSwagger", content, name);
	var isSwagger=false;
	var encoding = chardet.detect(content);
	logger.debug("Encoding of downloaded Swagger document: "+encoding);
	
	if(iconv.encodingExists(encoding)){		
		var swaggerString = iconv.decode(content,encoding);	
		isSwagger = swaggerUtils.checkContentIsSwagger(swaggerString, name);
	}else{
			//These can be any document, so do not throw an error, but ensure is logged
			logger.debug(logger.Globalize.formatMessage("unsupportedDocumentEncoding",name));			
	}	
	
	logger.exit("wsrrUtils._checkContentIsSwagger", isSwagger);
	return isSwagger;
}


/*
 * Download the service documents. For each document specified, download its
 * binary content, and for WSDL or XSD, find any imported or included or
 * redefined documents and download those too. Then recursively look for their
 * dependencies until all dependencies have been downloaded.
 * 
 * bsrURIs - array of document bsrURIs to start from.
 * 
 * Returns Promise which is resolved with an array of objects: [{bsrURI: bsrURI
 * of doc, name: name of doc, location: calculated location of the doc, 
 * content: Buffer with binary content}, type: WSRR SDO type]
 * 
 * See downloadServiceDocumentsForService() for description of the location field
 * and that the WSDL and XSD documents are rewritten.
 */
function downloadServiceDocuments(bsrURIs) {
	logger.entry("downloadServiceDocuments", bsrURIs);

	// map of bsrURI to true for docs we have or are processing
	var alreadySeen = {};
	// array of bsrURIs for docs we need to process, should be checked against
	// alreadySeen before adding
	var todoBsrURIs = bsrURIs;

	// call processing function
	var promise = _downloadServiceDocuments(todoBsrURIs, alreadySeen).then(function(data){
		logger.entry("downloadServiceDocuments_callback", data);
		
		// given how the code works, the data has an array with either a data
		// object for a document, or
		// an array which contains this again. So we need to unpack it.
		var ret = _.flattenDeep(data);
		logger.exit("downloadServiceDocuments_callback", ret);
		return ret;
	}).then(function(wsdlData){
		logger.entry("downloadServiceDocuments_flat_callback", wsdlData);		
		// now process the content to calculate the locations
		_calculateLocationsAndRewriteDocuments(wsdlData);
		logger.exit("downloadServiceDocuments_flat_callback", wsdlData);		
		return wsdlData;
	});
	
	logger.exit("downloadServiceDocuments", promise);
	return promise;
}

/*
 * Download WSDL and XSD documents for the specified service version.
 * 
 * Returns Promise which is resolved with an array of objects: [{bsrURI: bsrURI
 * of doc, name: name of doc, location: calculated location, content: Buffer with binary content, type: WSRR SDO type}]
 * 
 * The location field is the calculated location of the document, which is the location
 * where to store the document in a ZIP such that imports from other documents will work.
 * This is relative and includes the doc name. For example
 * for location "schemas/schema.xsd" then the doc should be stored as 
 * "schemas/schema.xsd". For location "xyz.wsdl" the doc should be
 * stored as "xyz.wsdl".
 * The import/include statements in the WSDL and XSD are changed to specify the document
 * given in the location field.
 * 
 */
function downloadServiceDocumentsForService(serviceBsrURI) {
	logger.entry("downloadServiceDocumentsForService", serviceBsrURI);
	
	// run query to get this
	var query = queries.WSDLForServiceVersion;
	var xpath = queries.getQueryXPath(query, configuration);
	// substitute the bsrURI into the query
	var realXPath = queries.resolveInserts(xpath, serviceBsrURI);
	
	var promise = runPropertyQuery(realXPath, ["bsrURI"]).then(function(data){
		logger.entry("downloadServiceDocumentsForService_callback", data);
		// return is array with object {bsrURI: bsrURI}
		// need to turn into array of just bsrURI
		var bsrURIs = [];
		if(data && data.length) {
			for(var i = 0; i < data.length; i++) {
				bsrURIs.push(data[i].bsrURI);
			}
		}
		// then feed into download service documents
		var downloadPromise = downloadServiceDocuments(bsrURIs);
		// return the download promise to the caller
		logger.exit("downloadServiceDocumentsForService_callback", downloadPromise);
		return downloadPromise;
	});

	logger.exit("downloadServiceDocumentsForService", promise);
	return promise;
}

/*
 * Make a list of Swagger documents to fetch given the input is the results of a 
 * PQ with bsrURI, _sdoType and name. Only return a list of docs which are 
 * GenericDocuments and have a swagger extension.
 * 
 */
function _makeSwaggerFetchList(data) {
	logger.entry("_makeSwaggerFetchList", data);

	var toFetch = [];

	if(data && data.length) {
		for(var i = 0; i < data.length; i++) {
			var doc = data[i];
			if(doc._sdoType === wsrrGenericDocument) {
				if(swaggerUtils.isSwaggerExtension(doc.name)) {
					// add
					toFetch.push(doc);
				}
			}
		}
	}

	logger.exit("_makeSwaggerFetchList", toFetch);
	return toFetch;
}

/*
 * Download REST Swagger documents for the specified service version.
 * 
 * Returns Promise which is resolved with an array of objects: [{bsrURI: bsrURI
 * of doc, name: name of doc, content: Buffer with binary content}]
 *
 * If swaggerOnly is true, only documents ending in .json or .yaml are returned. These documents are
 * checked to see if they are Swagger 2.0 documents. If not they are not
 * returned.
 * 
 * serviceBsrURI - bsruri of service version
 * swaggerOnly - true only get swagger, false get everything
 * 
 */
function downloadRESTDocumentsForService(serviceBsrURI, swaggerOnly) {
	logger.entry("downloadRESTDocumentsForService", serviceBsrURI, swaggerOnly);
	
	// run query to get this
	var query = queries.RESTInterfaceDocumentsForServiceVersion;
	var xpath = queries.getQueryXPath(query, configuration);
	// substitute the bsrURI into the query
	var realXPath = queries.resolveInserts(xpath, serviceBsrURI);

	var toFetch = [];
	
	var promise = runPropertyQuery(realXPath, ["bsrURI", "_sdoType", "name"]).then(function(data){
		logger.entry("downloadRESTDocumentsForService_callback", data);
		// return is array with object {bsrURI: bsrURI, type: SDO Type, name: name}
		// need to turn into array of docs to fetch but only for documents of Binary type
		// with name ending .yml .yaml .json if swaggerOnly
		
		if(swaggerOnly) {
			toFetch = _makeSwaggerFetchList(data);
		} else {
			// fetch all
			toFetch = data;
		}
		
		// fetch all
		if(toFetch.length > 0) {
			var binaryPromises = [];
			for(var i = 0; i < toFetch.length; i++) {
				var binaryPromise = downloadBinaryContent(toFetch[i].bsrURI, false);
				binaryPromises.push(binaryPromise);
			}
			var downloadPromise = Promise.all(binaryPromises);
			logger.exit("downloadRESTDocumentsForService_callback", downloadPromise);
			return downloadPromise;
		} else {
			 // return empty
			logger.exit("downloadRESTDocumentsForService_callback", []);
			return [];
		}
	}).then(function(allBinaries) {
		logger.entry("downloadRESTDocumentsForService_binary_callback", allBinaries);
		var retDatas = [];
		if(allBinaries.length > 0) {
			for(var i = 0; i < allBinaries.length; i++) {
				var content = allBinaries[i];
				var doc = toFetch[i];
				if(swaggerOnly === false || _checkContentIsSwagger(content, doc.name)) {
					var retData = {name: doc.name, bsrURI: doc.bsrURI, content: content};
					retDatas.push(retData);
				}
			}
		}
		logger.exit("downloadRESTDocumentsForService_binary_callback", retDatas);
		return retDatas;
	});

	logger.exit("downloadRESTDocumentsForService", promise);
	return promise;
}

/*
 * Download binary documents by running the xpath and downloading each result.
 * 
 * Returns Promise which is resolved with an array of objects: [{bsrURI: bsrURI
 * of doc, name: name of doc, content: Buffer with binary content}]
 * 
 */
function _downloadBinaryDocumentsForXPath(realXPath) {
	logger.entry("_downloadBinaryDocumentsForXPath", realXPath);

	var toFetch = [];
	
	var promise = runPropertyQuery(realXPath, ["bsrURI", "name"]).then(function(data){
		logger.entry("_downloadBinaryDocumentsForXPath_callback", data);
		// return is array with object {bsrURI: bsrURI}
		// need to download binary content for each
		var fetchPromises = [];
		if(data && data.length) {
			for(var i = 0; i < data.length; i++) {
				var fetchPromise = downloadBinaryContent(data[i].bsrURI, false);
				toFetch.push(data[i]);
				fetchPromises.push(fetchPromise);
			}
		}
		// make promise that waits for all to download
		var downloadPromise = null;
		if(fetchPromises.length > 0) {
			downloadPromise = Promise.all(fetchPromises);
		} else {
			downloadPromise = [];
		}
		// return the download promise to the caller
		logger.exit("_downloadBinaryDocumentsForXPath_callback", downloadPromise);
		return downloadPromise;
	}).then(function(allBinaries){
		logger.entry("_downloadBinaryDocumentsForXPath_binary_callback", allBinaries);
		var retDatas = [];
		if(allBinaries.length > 0) {
			for(var i = 0; i < allBinaries.length; i++) {
				var content = allBinaries[i];
				var doc = toFetch[i];
				var retData = {name: doc.name, bsrURI: doc.bsrURI, content: content};
				retDatas.push(retData);
			}
		}
		logger.exit("_downloadBinaryDocumentsForXPath_binary_callback", retDatas);
		return retDatas;
	});

	logger.exit("_downloadBinaryDocumentsForXPath", promise);
	return promise;
}

/*
 * Download artifact documents for the specified service version or business service. 
 * 
 * These are documents from the artifacts relationship.
 * 
 * Returns Promise which is resolved with an array of objects: [{bsrURI: bsrURI
 * of doc, name: name of doc, content: Buffer with binary content}]
 * 
 */
function downloadArtifactDocumentsForService(serviceBsrURI) {
	logger.entry("downloadArtifactDocumentsForService", serviceBsrURI);
	
	// run query to get this
	var query = queries.ArtifactDocumentsForService;
	var xpath = queries.getQueryXPath(query, configuration);
	// substitute the bsrURI into the query
	var realXPath = queries.resolveInserts(xpath, serviceBsrURI);

	var promise = _downloadBinaryDocumentsForXPath(realXPath);
	
	logger.exit("downloadArtifactDocumentsForService", promise);
	return promise;
}

/*
 * Download charter document for the specified service. 
 * 
 * These is a document from the charter relationship. We expect only 1 charter (or 0) but 
 * return an array in case the model has been changed.
 * 
 * Returns Promise which is resolved with an array of objects: [{bsrURI: bsrURI
 * of doc, name: name of doc, content: Buffer with binary content}]
 * 
 */
function downloadCharterDocumentsForService(serviceBsrURI) {
	logger.entry("downloadCharterDocumentsForService", serviceBsrURI);
	
	// run query to get this
	var query = queries.CharterDocumentForService;
	var xpath = queries.getQueryXPath(query, configuration);
	// substitute the bsrURI into the query
	var realXPath = queries.resolveInserts(xpath, serviceBsrURI);

	var promise = _downloadBinaryDocumentsForXPath(realXPath);
	
	logger.exit("downloadCharterDocumentsForService", promise);
	return promise;
}

function setConnectionPropertiesFile(file){	
	propertiesFile=file;	
}

// return file name of properties file
function getConnectionPropertiesFile(){	
	return propertiesFile;	
}

// get the actual configuration object
function getConnectionProperties() {
	return configuration;
}

function setWSRROrg(organisation){
	wsrrOrganisation=organisation;
}

function getWSRROrg(){
	return wsrrOrganisation;
}

function validateBsrURI(bsrURI,callback){
	/*
	 * Java regex's for bsrURIs
	 * private static final String BSRURI_60_VALIDATION_REGEXP = "^WSRR--[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){2}.[0-9a-fA-F]{4}.[0-9a-fA-F]{12}$";
		// regexp to validate a 60+ bsruri
		private static final String BSRURI_VALIDATION_REGEXP = "^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){2}.[0-9a-fA-F]{4}.[0-9a-fA-F]{12}$";		
	 */
	var bsrURI60RegEx = new RegExp(/^WSRR--[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){2}.[0-9a-fA-F]{4}.[0-9a-fA-F]{12}$/);
	var bsrURIRegEx = new RegExp(/^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){2}.[0-9a-fA-F]{4}.[0-9a-fA-F]{12}$/);
	if(bsrURI.match(bsrURIRegEx)){
		callback(true);
	}else if(bsrURI.match(bsrURI60RegEx)){
		callback(true);
	}else{
		callback(false);
	}
}

module.exports = {		
	setConnectionPropertiesFile:setConnectionPropertiesFile,
	getConnectionPropertiesFile:getConnectionPropertiesFile,
	getConnectionProperties:getConnectionProperties,
	getWSRRVersion:getWSRRVersion,
	setWSRRConnectiondetails:setWSRRConnectiondetails,
	testWSRRConnection:testWSRRConnection,
	runGraphQuery:runGraphQuery,
	runPropertyQuery:runPropertyQuery,
	runNamedQuery:runNamedQuery,
	downloadBinaryContent:downloadBinaryContent,
	downloadServiceDocuments:downloadServiceDocuments,
	retrieveMetadata:retrieveMetadata,
	downloadServiceDocumentsForService:downloadServiceDocumentsForService,
	downloadRESTDocumentsForService:downloadRESTDocumentsForService,
	downloadArtifactDocumentsForService:downloadArtifactDocumentsForService,
	downloadCharterDocumentsForService:downloadCharterDocumentsForService,
	setWSRROrg:setWSRROrg,
	getWSRROrg:getWSRROrg,
	validateBsrURI:validateBsrURI,
	
	// modules for unit testing
	_test_flattenDataArray:_flattenDataArray,
	_test_unflattenDataArray: _unflattenDataArray,
	_test_flattenPropertyQueryResultsArray:_flattenPropertyQueryResultsArray,
	_test_calculateLocationsAndRewriteDocuments:_calculateLocationsAndRewriteDocuments,
	_test_rewriteImports:_rewriteImports,
	_test_makeSwaggerFetchList: _makeSwaggerFetchList
	
};
