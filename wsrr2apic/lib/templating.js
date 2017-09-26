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
// for templating


'use strict';

var _ = require('lodash'), logger = require("./Logger"), Handlebars = require('handlebars'), yaml = require('js-yaml'), 
fs = require('fs'), Promise = require('bluebird'), url = require('url'), path = require('path');

//promise FS
Promise.promisifyAll(fs);

//TODO: data with no values appear in the written YAML as null as the value, we want to remove them or have ""?

// types for maps
var SOAP = "SOAP";
var REST = "REST";
var REST_SWAGGER = "REST_SWAGGER";
var PRODUCT = "PRODUCT";
var PRODUCT_PER_VERSION = "PRODUCT_PER_VERSION";
var CONSUMERS_PER_VERSION = "CONSUMERS_PER_VERSION";
var PRODUCT_WSDL = "PRODUCT_WSDL";

// map of template type to utf8 string content
var templateMap = {};

// register helpers
Handlebars.registerHelper("host", function(data){
	  // lets you do: host: {{host versions.0.slds.0.endpoints.0.properties.name}}
	  // call with URL, strip the host out
	// will return "" if data is undefined or null
	  var ret = "";
	  if(data) {
		  var theUrl = url.parse(data);
		  ret = theUrl.host;
	  }
	  return ret;
});
Handlebars.registerHelper("path", function(data){
	  // lets you do: basePath: {{path versions.0.slds.0.endpoints.0.properties.name}}
	  // call with URL, strip the path out
	// will return "" if data is undefined or null
	  var ret = "";
	  if(data) {
		  var theUrl = url.parse(data);
		  ret = theUrl.pathname;
	  }
	  return ret;
});
function _handlerHostProtocol(data) {
	  // lets you do: path: {{hostProtocol versions.0.slds.0.endpoints.0.properties.name}}
	  // call with URL, strip the host and protocol out eg https://test.com
	// will return "" if data is undefined or null
	  var ret = "";
	  if(data) {
		  var theUrl = url.parse(data);
		  ret = theUrl.protocol;
		  if(theUrl.slashes) {
			  ret += "//";
		  }
		  ret += theUrl.host;
	  }
	  return ret;
}
Handlebars.registerHelper("hostProtocol", _handlerHostProtocol);
Handlebars.registerHelper("apiName", function(data){
	  // lets you do: name: {{apiName properties.name}}
	  // change word to be safe for x-ibm-name
	  var name;
      if(data) {
          name = data;
          do{
	          // multiple spaces replaced by single hyphen
	          name = name.replace(/ +/gi, '-');
	          // multiple hyphens replaced by single hyphen
	          name = name.replace(/-+/gi, '-');
	          // anything not a-z 0-9 A-Z hyphen removed
	          name = name.replace(/[^A-Za-z0-9\\-]/gi, '');
	          // remove all start hyphens
	          name = name.replace(/^[-]+/, '');
	          // remove all end hyphens
	          name = name.replace(/[-]+$/, '');
	          // remove all start numbers
	          name = name.replace(/^[0-9]+/, '');      
	          // only lower case
	          name = name.toLowerCase();
          }while(!(/^[a-z]/.test(name)));        	          
      } else {
    	  name="";
      }
      return name;
});
Handlebars.registerHelper("debug", function(data){
	  // lets you do: {{debug endpoints}} 
	  // and get this and also whatever endpoints is out to the console. 
	 console.log("Current:");
	 console.log(this);
	 if(data){
		 console.log("Data:");
		 console.log(data);
	 }
});
Handlebars.registerHelper("multiline", function(data){
	  // lets you do: description: "{{multiline version.properties.description}}"
	  // when the description has embedded \n which should be preserved.
	  // NB: the description must be enclosed in double quotes for the escaping to work!
	  var ret = "";
	  if(data) {
		  var escapedMultiline = data.replace(/\n/g, "\\n");
		  ret = escapedMultiline;
	  }
	  return ret;
});
/* Block helper that is called for each WSRR object, but only invokes
 * the block if the child WSRR object has the classification URI provided. If the object
 * does not have any classifications or has some but does not have the URI, the
 * inner block is not invoked.
 */
function _handlerOnlyClassified(context, classification, options) {
	var ret = "";
	// check we have a classification and the object has classifications 
	if(classification && context.classifications && context.classifications.indexOf(classification) !== -1) {
		// call inner block
		ret = options.fn(context);	
	}
	return ret;
}
Handlebars.registerHelper("onlyClassified", _handlerOnlyClassified);

/* Helper that is called for an array of SLDs or a single SLD and finds the first endpoint that is classified
 * with the provided classification URIs (multiple), then returns its name.
 */
function _handlerEndpointByClassifications(data) {
	logger.entry("_handlerEndpointByClassifications", arguments);
	// use arguments to take variable number of classifications - arguments are data, parameters..., options
	var classifications = [];
	if(arguments.length > 2) {
		// classifications are the parameters in the middle
		for(var argI = 1, argLen = arguments.length - 1; argI < argLen; argI++) {
			classifications.push(arguments[argI]);
		}
	}
	logger.debug("_handlerEndpointByClassifications classifications to find: " + classifications);
	// now go find the endpoint with the classifications
	var retEp = null;
	
	// check for single SLD
	var slds = data;
	if(typeof data.length === "undefined") {
		// treat as single SLD
		slds = [data];
	}
	
	if(slds.length) {
		for(var i = 0, len = slds.length; i < len; i++) {
			var sld = slds[i];
			logger.debug("_handlerEndpointByClassifications sld: " + sld.bsrURI);			
			// check each endpoint
			for(var epI = 0, epLen = sld.endpoints.length; epI < epLen; epI++) {
				var ep = sld.endpoints[epI];
				logger.debug("_handlerEndpointByClassifications endpoint: " + ep.bsrURI);
				var matched = true;
				for(var classI = 0, classLen = classifications.length; classI < classLen; classI++) {
					// if endpoint classifications does not contain the desired classification
					if(ep.classifications.indexOf(classifications[classI]) === -1){
						// fail the match
						matched = false;
						break;
					}						
				}
				// if matched is true then we found the endpoint
				if(matched) {
					retEp = ep;
					logger.debug("_handlerEndpointByClassifications matched endpoint: " + ep.bsrURI);
					break;
				}
			}
			// if we found an endpoint we can stop looking
			if(retEp !== null) {
				break;
			}
		}
	}

	var retEpName = "";
	if(retEp) {
		// get the return name
		retEpName = retEp.properties.name;
	}

	logger.exit("_handlerEndpointByClassifications", retEpName);
	return retEpName;
}
Handlebars.registerHelper("endpointNameByClassifications", _handlerEndpointByClassifications);

/* helper to take parameters in pairs, first is the to URI and second is the value, and look at the classifications on the object passed in
 * and when it finds the first hit, output the value.
 * If the parameters don't come in pairs then ignore the unmatched one.
 */
function _handlerClassificationToValue(data, options) {
	logger.entry("_handlerClassificationToValue", arguments);
	var ret = "";
	// make a hash of the parameters, 2nd to the 2nd to last parameter. 2nd param is uri, 3rd param is the value.
	// 4th param is the uri, 5th the value, and so on. Last param is the options object from handlebars.
	var uriToValue = {};
	if(arguments.length > 2) {
		// only iterate so the pair of values is the ones before the last parameter
		for(var argI = 1, argLen = arguments.length; argI < argLen - 2; argI+=2) {
			var uri = arguments[argI];
			var value = arguments[argI + 1];
			uriToValue[uri] = value;
		}
	}
	
	// find if any keys in the hash are on the object
	if(data && data.classifications && data.classifications.length) {
		for(var i = 0, j = data.classifications.length; i < j; i++) {
			if(uriToValue[data.classifications[i]]) {
				// match
				ret = uriToValue[data.classifications[i]];
				break;
			}
		}
	}
	logger.exit("_handlerClassificationToValue", ret);
	return ret;
}
Handlebars.registerHelper("classificationToValue", _handlerClassificationToValue);

/* helper to take parameters in pairs, first is the to URI and second is the value, and look at the classifications on the object passed in
 * and when it finds the matches and adds to a list., output the array of value.
 * If the parameters don't come in pairs then ignore the unmatched one.
 * 
 * Produces a result like
 * classifications:
 *     - Production
 *     - Staging
 */
function _handlerClassificationsToValueArray(data,options){
	logger.entry("_handlerClassificationsToValueArray",arguments);
	var ret="";
	// make a hash of the parameters, 2nd to the 2nd to last parameter. 2nd param is uri, 3rd param is the value.
	// 4th param is the uri, 5th the value, and so on. Last param is the options object from handlebars.
	var uriToValue = {};
	if(arguments.length > 2) {
		// only iterate so the pair of values is the ones before the last parameter
		for(var argI = 1, argLen = arguments.length; argI < argLen - 2; argI+=2) {
			var uri = arguments[argI];
			var value = arguments[argI + 1];
			uriToValue[uri] = value;
		}
	}
	if(data && data.classifications && data.classifications.length) {
		for(var i = 0, j = data.classifications.length; i < j; i++) {
			if(uriToValue[data.classifications[i]]) {
				// match
				if(ret===""){
					ret = uriToValue[data.classifications[i]];
				}else{
					ret=ret+","+uriToValue[data.classifications[i]];
				}
				
			}
		}
	}
	logger.exit("_handlerClassificationsToValueArray", ret);
	return "["+ret+"]";
}
Handlebars.registerHelper("classificationsToValueArray", _handlerClassificationsToValueArray);

/* helper to take parameters in pairs, first is the to URI and second is the value, and look at the classifications on the object passed in
 * and when it finds the matches and adds to a list. output the array of values prepended with the provided key.
 * If the parameters don't come in pairs then ignore the unmatched one.
 * 
 * produces a result like
 * classifications:
 *     - classification: Production
 *     - classification: Staging
 */
function _handlerClassificationsToValueArrayWithKey(data,options){
	logger.entry("_handlerClassificationsToValueArrayWithKey",arguments);
	var ret="";
	var key=arguments[1];
	// make a hash of the parameters, 2nd to the 2nd to last parameter. 2nd param is uri, 3rd param is the value.
	// 4th param is the uri, 5th the value, and so on. Last param is the options object from handlebars.
	var uriToValue = {};
	if(arguments.length > 2) {
		// only iterate so the pair of values is the ones before the last parameter
		for(var argI = 2, argLen = arguments.length; argI < argLen - 2; argI+=2) {
			var uri = arguments[argI];
			var value = arguments[argI + 1];
			uriToValue[uri] = value;
		}
	}
	if(data && data.classifications && data.classifications.length) {
		for(var i = 0, j = data.classifications.length; i < j; i++) {
			if(uriToValue[data.classifications[i]]) {
				// match
				if(ret===""){
					ret = key+": "+uriToValue[data.classifications[i]];
				}else{
					ret=ret+","+key+": "+uriToValue[data.classifications[i]];
				}				
			}
		}
	}
	logger.exit("_handlerClassificationsToValueArrayWithKey", ret);
	return "["+ret+"]";
}
Handlebars.registerHelper("classificationsToValueArrayWithKey", _handlerClassificationsToValueArrayWithKey);

/* helper to take parameters in pairs, first is the to URI and second is the value, and look at the state on the object passed in
 * and when it finds the first hit, output the value.
 * If the parameters don't come in pairs then ignore the unmatched one.
 */
function _handlerStateToValue(data, options) {
	logger.entry("_handlerStateToValue", arguments);
	var ret = "";
	// make a hash of the parameters, 2nd to the 2nd to last parameter. 2nd param is uri, 3rd param is the value.
	// 4th param is the uri, 5th the value, and so on. Last param is the options object from handlebars.
	var uriToValue = {};
	if(arguments.length > 2) {
		// only iterate so the pair of values is the ones before the last parameter
		for(var argI = 1, argLen = arguments.length; argI < argLen - 2; argI+=2) {
			var uri = arguments[argI];
			var value = arguments[argI + 1];
			uriToValue[uri] = value;
		}
	}
	
	// find if any keys in the hash are on the object
	if(data && data.state) {
		if(uriToValue[data.state]) {
			ret = uriToValue[data.state];
		}
	}
	logger.exit("_handlerStateToValue", ret);
	return ret;
}
Handlebars.registerHelper("stateToValue", _handlerStateToValue);


/*
 * 
 * examples
 * {{#each relationships}}
 *   {{@key}}: {{RelationshipToMap this}}
 * {{/each}}
 * ale63_OwningOrganisation: {{RelationToMap this.relationships.ale63_OwningOrganisation OwningOrganisation}}
 *
 */
function _handlerRelationshipToMap(data,options){
	logger.entry("_handlerRelationshipToMap", arguments);	
	var ret="";
	var key="";
	//If we have data on options and the key
	if(options.data && options.data.key){
		key=options.data.key;
	//if we have no data object on options we have a value for the key, if not no key
	}else if(!options.data){
		key=options;
	}
	var relationships=data;
	for(var i=0;i<relationships.length;i++){
		var relationship=relationships[i];
		var bsrURI=relationship.bsrURI;
		var primaryType=relationship.primaryType
		if(ret===""){
			ret=key+i+": [bsrURI: "+bsrURI+", pimaryType: "+primaryType+"]";
		}else{
			ret=ret+", "+key+i+": [bsrURI: "+bsrURI+", pimaryType: "+primaryType+"]";
		}
	}	
	ret="["+ret+"]";
	logger.exit("_handlerRelationshipToMap", ret);
	return ret
}
Handlebars.registerHelper("RelationshipToMap",_handlerRelationshipToMap);

/*
 * Only the first match is converted and returned
 * example ale63_owningOrganization: {{RelationshipToValue this.relationships.ale63_owningOrganization "9772d397-a8fd-4d2f.adb4.44f34044b410" "Common Services" "386a9f38-fb86-46b5.867f.6ee9186e7f65" "Mobile Apps"}} 
 */
function _handlerRelationshipToValue(data,options){
	logger.entry("_handlerRelationshipToValue", arguments);	
	var ret="";
	var uriToValue = {};		
	if(arguments.length > 2) {
		// only iterate so the pair of values is the ones before the last parameter
		for(var argI = 1, argLen = arguments.length; argI < argLen - 2; argI+=2) {
			var uri = arguments[argI];
			var value = arguments[argI + 1];
			uriToValue[uri] = value;
		}
	}
	// find if any keys in the hash are on the object
	if(data) {
		var relationships=data
		for(var i = 0, j = relationships.length; i < j; i++) {			
			if(uriToValue[relationships[i].bsrURI]) {
				// match
				ret = uriToValue[relationships[i].bsrURI];
				break;
			}
		}
	}
	
	logger.exit("_handlerRelationshipToValue", ret);
	return ret;
}
Handlebars.registerHelper("RelationshipToValue",_handlerRelationshipToValue);

//merge objects


/*
 * Merge the objects by taking properties from overrideObject and overwriting the corresponding
 * properties on baseObject.
 * 
 * Arrays and objects are merged recursively.
 *
 * Used to take a object representing the yaml and update it with an object representing the 
 * yaml which was created by a template and some data.
 * 
 */
function _mergeObjects(baseObject, overrideObject) {
	logger.entry("_mergeObjects", baseObject, overrideObject);
	
	// use lodash.merge to do this
	// If both the populated template and the wsdl generated yaml contain an assembly populate using the templated assembly
	if(baseObject['x-ibm-configuration'] && overrideObject['x-ibm-configuration']){
		if(baseObject['x-ibm-configuration']['assembly'] && overrideObject['x-ibm-configuration']['assembly']){
			baseObject['x-ibm-configuration']=_.omit(baseObject['x-ibm-configuration'],'assembly');
		}
	}
	var merged = _.merge(baseObject, overrideObject);

	logger.exit("_mergeObjects", merged);
	return merged;
}

/*
 * Combine the objects representing API Yaml, taking the contents of
 * overrideYamlObject as precident.
 * 
 * Returns single object.
 * 
 */
function combineApiYamlObjects(baseYamlObject, overrideYamlObject) {
	logger.entry("combineApiYamlObjects", baseYamlObject, overrideYamlObject);
	
	// use _mergeObjects without anything extra for now
	var merged = _mergeObjects(baseYamlObject, overrideYamlObject);
	
	logger.exit("combineApiYamlObjects", merged);
	return merged;
}

/*
 * Generate string from template.
 * 
 * templateContent is a utf-8 string which is the template which should generate a YAML representation of an object.
 * dataObject is a JS object containing the data referred to in the template.
 * 
 * returns string which is the formatted template.
 * throws an Error if the template step fails.
 */
function generateStringFromYamlTemplate(/* utf-8 string */templateContent, dataObject) {
	logger.entry("generateStringFromYamlTemplate", templateContent, dataObject);

	var returnObject = null;
	var result = null;
	
	logger.debug("compiling template");
	try {
		var template = Handlebars.compile(templateContent);
		result = template(dataObject);
	} catch(e) {
		logger.error(e);
		throw e;
	}	

	logger.exit("generateStringFromYamlTemplate", result);
	return result;
}

/*
 * Generate object from yaml string.
 * 
 * yamlString is a utf-8 string which is YAML representation of an object.
 * 
 * returns object which is the formatted template parsed as a YAML object.
 * throws an Error if the parsing of an object from the template fails.
 */
function generateObjectFromYamlString(/* utf-8 string */yamlString) {
	logger.entry("generateObjectFromYamlString", yamlString);

	var returnObject = null;

	// try to convert to object
	try {
		returnObject = yaml.safeLoad(yamlString);
	} catch(e) {
		logger.error(e);
		throw e;
	}
	
	logger.exit("generateObjectFromYamlString", returnObject);
	return returnObject;
}

/*
 * Generate object from template.
 * 
 * templateContent is a utf-8 string which is the template which should generate a YAML representation of an object.
 * dataObject is a JS object containing the data referred to in the template.
 * 
 * returns object which is the formatted template parsed as a YAML object.
 * throws an Error if the template step fails, or the parsing of an object from the template fails.
 */
function generateObjectFromYamlTemplate(/* utf-8 string */templateContent, dataObject) {
	logger.entry("generateObjectFromYamlTemplate", templateContent, dataObject);

	var result = generateStringFromYamlTemplate(templateContent, dataObject);
	
	var returnObject = generateObjectFromYamlString(result);
	
	logger.exit("generateObjectFromYamlTemplate", returnObject);
	return returnObject;
}

/*
 * Load the templates specified in the configuration into a memory map, of
 * type to utf8 string content. The contents of the templates will be converted
 * using utf8.
 *
 * Type = SOAP, REST, REST_SWAGGER or PRODUCT
 * Configuration entry is template_SOAP, etc and gives the file name of the template.
 * Templates are assumed to be stored in the folder "templates" directly under the 
 * running directory.
 * Defaults if the config entry is not there, is soap.yaml, rest.yaml, etc
 * 
 * TODO: probably add more like Product-per-version and Product-per-business-service
 * 
 * Return promise that resolves once the load is done.
 *
 */
function loadTemplatesIntoMap(configuration) {
	logger.entry("loadTemplatesIntoMap", configuration);
	var promise = null;
	
	// for type, config is config property to use for file name and file is default file name
	var configs = {};
	configs[SOAP] = {config: "template_SOAP", file: "soap.yaml"};
	configs[REST] = {config: "template_REST", file: "rest.yaml"};
	configs[REST_SWAGGER] = {config: "template_REST_SWAGGER", file: "restSwagger.yaml"};
	configs[PRODUCT] = {config: "template_PRODUCT", file: "product.yaml"};
	configs[PRODUCT_PER_VERSION] = {config: "template_PRODUCT_PER_VERSION", file: "productPerVersion.yaml"};
	configs[CONSUMERS_PER_VERSION] = {config: "template_CONSUMERS_PER_VERSION", file: "consumersPerVersion.yaml"};
	// use product per version unless overridden
	configs[PRODUCT_WSDL] = {config: "template_PRODUCT_WSDL", file: "productWsdl.yaml"};
	
	// override value of file if one in config
	for(var type in configs) {
		var typeConfig = configs[type];
		if(configuration[typeConfig.config]) {
			typeConfig.file = configuration[typeConfig.config];
			// set to be absolute
			typeConfig.fileAbsolute = true;
		}
	}
	// now load them all
	var promises = [];
	// function to function-scope type variable on the .then()
	function loadFile(type) {
		var typeConfig = configs[type];

		var filepath = null;
		if(typeConfig.fileAbsolute) {
			filepath = typeConfig.file;
		} else {
			filepath = path.resolve(__dirname, "../templates", typeConfig.file);
		}
		var promise = fs.readFileAsync(filepath, "utf8").then(function(data){
			logger.entry("loadTemplatesIntoMap_resolved", type, data);

			// add to map
			templateMap[type] = data;
			logger.exit("loadTemplatesIntoMap_resolved");
		});
		return promise;
	}
	for(var type in configs) {
		var loadPromise = loadFile(type);
		promises.push(loadPromise);
	}
	// return promise all for the reads
	promise = Promise.all(promises);
	
	logger.exit("loadTemplatesIntoMap", promise);
	return promise;
}

/*
 * Get the utf8 string template for the specified type.
 * Type = SOAP, REST, REST_SWAGGER, PRODUCT or CONSUMERS
 * 
 * Returns a reference to the template string. This is not cloned so do not modify it.
 * Or throws an error if no template exists for the type.
 */
function getTemplate(type) {
	logger.entry("getTemplate", type);
	
	var content = null;
	if(templateMap[type]) {
		content = templateMap[type];
	}
	if(!content) {
		var e = new Error(logger.Globalize.formatMessage("templatingErrorNoTemplate", type));
		logger.error(e);
		throw e;		
	}
	
	logger.exit("getTemplate", content);
	return content;
}

module.exports = {
	generateObjectFromYamlTemplate:generateObjectFromYamlTemplate,
	generateStringFromYamlTemplate:generateStringFromYamlTemplate,
	generateObjectFromYamlString:generateObjectFromYamlString,
	loadTemplatesIntoMap:loadTemplatesIntoMap,
	getTemplate:getTemplate,
	combineApiYamlObjects:combineApiYamlObjects,

	// types for template map
	SOAP:SOAP,
	REST:REST,
	REST_SWAGGER:REST_SWAGGER,
	PRODUCT:PRODUCT,
	PRODUCT_PER_VERSION:PRODUCT_PER_VERSION,
	CONSUMERS_PER_VERSION:CONSUMERS_PER_VERSION,
	PRODUCT_WSDL:PRODUCT_WSDL,
	
	// modules for unit testing
	_test_mergeObjects:_mergeObjects,
	_test_handlerHostProtocol:_handlerHostProtocol,
	_test_handlerClassificationToValue:_handlerClassificationToValue,
	_test_handlerClassificationsToValueArray:_handlerClassificationsToValueArray,
	_test_handlerClassificationsToValueArrayWithKey:_handlerClassificationsToValueArrayWithKey,
	_test_handlerOnlyClassified:_handlerOnlyClassified,
	_test_handlerEndpointByClassifications:_handlerEndpointByClassifications,
	_test_handlerStateToValue:_handlerStateToValue,
	_test_handlerRelationshipToMap:_handlerRelationshipToMap,
	_test_handlerRelationshipToValue:_handlerRelationshipToValue
	
};
