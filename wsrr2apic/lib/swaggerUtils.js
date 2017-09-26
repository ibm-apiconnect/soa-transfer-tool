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

// Utils for Swaggers

var logger=require("../lib/Logger"), yaml = require('js-yaml');

// separate function for unit testing
function _internalEndsWith(string, search) {
	var endsWith = false;

	var pos = string.length - search.length;
	var index = string.lastIndexOf(search, pos);
	
	if(index !== -1 && index === pos) {
		endsWith = true;
	}

	return endsWith;
}

function _endsWith(string, search) {
	var endsWith = false;

	if(string.endsWith) {
		endsWith = string.endsWith(search);
	} else {
		endsWith = _internalEndsWith(string, search);
	}
	return endsWith;
}

/*
 * Create an object from the swagger in swaggerString, using the extension in name to decide if it is
 * Yaml or Json.
 * 
 * swaggerString - string content of swagger doc, yaml or json format
 * name - Name of document the content is for
 *
 * Returns object or throws an error.
 */
function generateSwaggerObject(swaggerString, name) {
	logger.entry("swaggerUtils.generateSwaggerObject", swaggerString, name);
	
	var swaggerObject = null;
	
	var lcName = name.toLowerCase();
	if(_endsWith(lcName, ".yaml") || _endsWith(lcName, ".yml")) {
		// parse yaml
		try {
			swaggerObject = yaml.safeLoad(swaggerString);
		} catch(e) {
			// do not error, do not want this out to the console
			logger.debug(e);
			// throw
			throw e;
		}
	} else if(_endsWith(lcName, ".json")) {
		// parse JSON
		try {
			swaggerObject = JSON.parse(swaggerString);
		} catch(e) {
			// do not error, do not want this out to the console
			logger.debug(e);
			// throw
			throw e;
		}
	} else {
		// throw an error
		var msg = logger.Globalize.formatMessage("errorUnrecognisedExtension", lcName);
		logger.info(msg);
		throw new Error(msg);
	}
	
	logger.exit("swaggerUtils.generateSwaggerObject", swaggerObject);
	return swaggerObject;
}

/*
 * Check the content is a swagger, given the extension on the name for yaml or json.
 * Checks for the swagger = "2.0" entry at the root, and that the content can be
 * parsed as YAML or JSON.
 * 
 * swaggerString - string content of swagger doc, yaml or json format
 * name - Name of document the content is for
 * 
 * 
 * Returns true or false.
 */
function checkContentIsSwagger(swaggerString, name) {
	logger.entry("swaggerUtils.checkContentIsSwagger", swaggerString, name);
	
	// is false until proven otherwise
	var isSwagger = false;
	var swaggerObject = null;
	
	try {
		swaggerObject = generateSwaggerObject(swaggerString, name);
	} catch (e) {
		// already logged as debug
		// cannot be swagger, do not throw
	}
		
	if(swaggerObject) {
		// check for swagger 2.0
		if(swaggerObject.swagger === "2.0") {
			isSwagger = true;
		} else {
			// diagnostics
			logger.debug("No swagger found in object:");
			logger.debug(JSON.stringify(swaggerObject));
			logger.debug("Swagger string: " + swaggerString);
		}
	}
	
	logger.exit("swaggerUtils.checkContentIsSwagger", isSwagger);
	return isSwagger;
}

/*
 * Answers if the filename has a swagger extension, 
 * .yaml .yml or .json.
 * 
 */
function isSwaggerExtension(filename) {
	logger.entry("swaggerUtils.isSwaggerExtension", filename);

	var lcName = filename.toLowerCase();
	var isSwagger = false;
	if(_endsWith(lcName, ".yaml") || _endsWith(lcName, ".yml") || _endsWith(lcName, ".json")){
		isSwagger = true;
	}
	
	logger.exit("swaggerUtils.isSwaggerExtension", isSwagger);
	return isSwagger;
}

module.exports = {		
		isSwaggerExtension:isSwaggerExtension,
		checkContentIsSwagger:checkContentIsSwagger,
		generateSwaggerObject:generateSwaggerObject,
		
		_test_internalEndsWith:_internalEndsWith
};
