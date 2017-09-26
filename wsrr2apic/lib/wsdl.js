/********************************************************* {COPYRIGHT-TOP} ***
 * Licensed Materials - Property of IBM
 *  5724-N72
 *
 * (C) Copyright IBM Corporation 2017
 *
 * All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ********************************************************** {COPYRIGHT-END} **/
/**
 * WSDL file system library, for reading WSDL from the file system for processing.
 * 
 */

'use strict';

var logger=require("../lib/Logger"), Promise = require('bluebird'), fs = require('fs');
var path = require('path'), yaml = require('js-yaml');

//promise FS
Promise.promisifyAll(fs);

//maximum depth to look in directories for content
var MAX_DEPTH = 10;

var wsdlPath = null;

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
 * Initialize to work from the provided path.
 */
function initialize(path) {
	logger.entry("initialize", path);
	
	wsdlPath = path;
	
	logger.exit("initialize");
}

/*
 * Get the WSDL path.
 */
function getWSDLPath() {
	logger.entry("getWSDLPath");
	
	logger.exit("getWSDLPath", wsdlPath);
	return wsdlPath;
}

/*
 * Get list of directory names under path. 
 * 
 * Returns Promise that resolves with the array with each entry the directory name.
 * 
 */
function getWSDLDirectoryList() {
	logger.entry("wsdl.getWSDLDirectoryList");

	var promise = fs.readdirAsync(wsdlPath).then(function(list){
		logger.entry("wsdl.getWSDLDirectoryList_callback", list);
		
		// stat each entry to exclude files
		var dirList = [];
		var statPromise = Promise.reduce(list, function(total, fileName, index, length){
			logger.entry("wsdl.getWSDLDirectoryList_reduce", total, fileName, index, length);
			
			// stat file
			var filePath = path.resolve(wsdlPath, fileName);
			var statFilePromise = fs.lstatAsync(filePath).then(function(stat){
				logger.entry("wsdl.getWSDLDirectoryList_reduce_stat", stat);
				
				if(stat.isDirectory()) {
					// add name if directory
					total.push(fileName);
				} else {
					// log warning and ignore
					logger.info(logger.Globalize.formatMessage("wsdlWarningFileFoundInRoot", fileName));
				}
				
				logger.exit("wsdl.getWSDLDirectoryList_reduce_stat", total);
				return total;
			});
			
			logger.exit("wsdl.getWSDLDirectoryList_reduce", statFilePromise);
			return statFilePromise;
		}, dirList);
		
		logger.exit("wsdl.getWSDLDirectoryList_callback", statPromise);
		return statPromise;
	});	
	
	logger.exit("wsdl.getWSDLDirectoryList", promise);
	return promise;
}

 

/*
 * Read data in directoryName and when an entry is wsdl or xsd, 
 * read in and add to results using the relativePath and directoryName and entry name for the location.
 * 
 * If the entry is a directory, call this function again recursively, passing
 * in the correct relativePath.
 * 
 * depth cannot exceed MAX_DEPTH else we error.
 * 
 * wsdlDirectoryName - name of the top level WSDL directory
 * relativePath - relative path of the directory to process from the top level WSDL directory
 * results - array of objects with data read
 * depth - depth we are at in this function call
 * 
 * Returns a Promise that resolves with nothing when done.
 */
function _getWSDLContentForDirectory(wsdlDirectoryName, relativePath, results, depth) {
	logger.entry("wsdl._getWSDLContentForDirectory", wsdlDirectoryName, relativePath, results, depth);

	if(depth > MAX_DEPTH) {
		logger.debug("Depth too great");
		var e = new Error("MAX_DEPTH exceeded");
		logger.exit("wsdl._getWSDLContentForDirectory", e.toString());
		throw e;
	}
	// hmm want the dir name when we go down dirs from the "root" dir that is the initial wsdl folder
	var files = [];
	var directories = [];

	var thePath = path.resolve(wsdlPath, wsdlDirectoryName, relativePath);
	var promise = fs.readdirAsync(thePath).then(function(list){
		logger.entry("wsdl._getWSDLContentForDirectory_callback", thePath, list);
		// stat all entries at once because the file system can take it
		var alls = [];
	
		// use function to tie up file name to stats
		var statHandler = function(fileName, stats) {
			logger.entry("wsdl._getWSDLContentForDirectory_statHandler", thePath, fileName, stats);

			// check is directory
			if(stats.isFile()) {
				// check for wsdl or xsd
				var lcName = fileName.toLowerCase();
				if(_endsWith(lcName, ".wsdl") || _endsWith(lcName, ".xsd")){
					files.push(fileName);
				}			
			} else if(stats.isDirectory()) {
				directories.push(fileName);
			}
			
			logger.exit("wsdl._getWSDLContentForDirectory_statHandler");
		};
		
		for(var i = 0, len = list.length; i < len; i++) {
			// stat
			var file = list[i];
			var filePath = path.resolve(thePath, file);
			// use statHandler but bind the value of file at this point as a parameter
			var statPromise = fs.lstatAsync(filePath).then(statHandler.bind(this, file));
			alls.push(statPromise);
		}		
		
		var allPromise = Promise.all(alls);
		
		logger.exit("wsdl._getWSDLContentForDirectory_callback", allPromise);
		return allPromise;
	}).then(function(){{
		logger.entry("wsdl._getWSDLContentForDirectory_stat_done", thePath);

		var i, len;
		// now need to read files in and call this again for the directories
		var readHandler = function(fileName, dataBuffer) {
			logger.entry("wsdl._getWSDLContentForDirectory_readHandler", thePath, fileName);

			var bsrURI = Math.floor((Math.random() * 1000000) + 1).toString(16);
			// location is relative path to the file
			var location = path.join(relativePath, fileName);
			var obj = {bsrURI: bsrURI, name: fileName, location: location, content: dataBuffer};
			results.push(obj);
			
			// trace obj so we know what happened
			logger.exit("wsdl._getWSDLContentForDirectory_readHandler", obj);
		};
		var alls = [];
		for(i = 0, len = files.length; i < len; i++) {
			// read and ask for the raw buffer
			var file = files[i];
			var filePath = path.resolve(thePath, file);
			// use readHandler but bind the value of file at this point as a parameter
			var readPromise = fs.readFileAsync(filePath).then(readHandler.bind(this, file));
			alls.push(readPromise);
		}
		for(i = 0, len = directories.length; i < len; i++) {
			// call again for directory
			var newDepth = depth++;
			var dirName = directories[i];
			var newRelativePath = path.join(relativePath, dirName);
			// pass in the directoryName
			var dirReadPromise = _getWSDLContentForDirectory(wsdlDirectoryName, newRelativePath, results, newDepth);
			alls.push(dirReadPromise);
		}
		
		var allPromise = Promise.all(alls);
		logger.exit("wsdl._getWSDLContentForDirectory_stat_done", allPromise);
		return allPromise;		
	}});
	
	logger.exit("wsdl._getWSDLContentForDirectory", promise);
	return promise;
}

/*
 * Get an array WSDL and XSD for the specified directory name, 
 * which should come from getWSDLDirectoryList.
 * 
 * Array contains same format as wsrrUtils.downloadServiceDocuments:
 * [{bsrURI: bsrURI
 * of doc, name: name of doc, content: Buffer with binary content, location: name}, ...]
 * bsrURI is randomly generated, we assume all docs are unique.
 * 
 * Returns Promise that resolves with the above array.
 */
function getWSDLContent(directoryName) {
	logger.entry("wsdl.getWSDLContent", directoryName);

	var results = [];
	var promise = _getWSDLContentForDirectory(directoryName, "", results, 0).then(function(){
		logger.entry("wsdl.getWSDLContent_callback");
		
		// return results which has been filled by _getWSDLContentForDirectory
		logger.exit("wsdl.getWSDLContent_callback", results);
		return results;
	});
	
/*
	var promise = fs.readdirAsync(thePath).then(function(list){
		logger.entry("wsdl.getWSDLContent_callback", list);
		// real all entries at once because the file system can take it
		var ret = [];
		var readHandler = function(fileName, dataBuffer) {
			logger.entry("wsdl.getWSDLContent_readHandler", fileName);

			// check is WSDL or XSD
			var lcName = fileName.toLowerCase();
			var obj = null;
			if(_endsWith(lcName, ".wsdl") || _endsWith(lcName, ".xsd")){
				// generate random number for bsrURI
				var bsrURI = Math.floor((Math.random() * 1000000) + 1).toString(16);
				obj = {bsrURI: bsrURI, name: fileName, location:fileName, content: dataBuffer};
				ret.push(obj);
			}			
			
			// trace obj so we know what happened
			logger.exit("wsdl.getWSDLContent_readHandler", obj);
		};
		var alls = [];
		for(var i = 0, len = list.length; i < len; i++) {
			// read and ask for the raw buffer
			var file = list[i];
			var filePath = path.resolve(thePath, file);
			// use readHandler but bind the value of file at this point as a parameter
			var readPromise = fs.readFileAsync(filePath).then(readHandler.bind(this, file));
			alls.push(readPromise);
		}		
		
		var allPromise = Promise.all(alls).then(function(){
			logger.entry("wsdl.getWSDLContent_all");
			
			// return array
			
			logger.exit("wsdl.getWSDLContent_all", ret);
			return ret;
		});
		
		logger.exit("wsdl.getWSDLContent_callback", allPromise);
		return allPromise;
	});	
*/
		
	logger.exit("wsdl.getWSDLContent", promise);
	return promise;
}

/*
 * Get the contents of "metadata.yaml" for the specified directory name, 
 * which should come from getWSDLDirectoryList.
 * 
 * This contains the swagger metadata that should be overlaid on top of the API swagger
 * generated by APIC for the WSDL.
 * 
 * Returns a Promise that resolves with the object, or null if no file found.
 * Throws if an error happens while parsing the Yaml.
 */
function getMetadata(directoryName) {
	logger.entry("wsdl.getMetadata", directoryName);
	
	var file= path.resolve(wsdlPath, directoryName, "metadata.yaml");
	var promise = fs.lstatAsync(file).then(function(stat){
		logger.entry("wsdl.getMetadata_stat", stat);
		// found
		var readPromise = fs.readFileAsync(file, "utf8").then(function(data){
			// parse into object
			logger.entry("wsdl.getMetadata_result", file, data);
			// parse yaml
			var swaggerObject = null;
			try {
				swaggerObject = yaml.safeLoad(data);
			} catch(e) {
				// do not error, do not want this out to the console
				logger.debug("Error converting Yaml to object");
				logger.debug(e);
				// throw
				throw e;
			}
			logger.exit("wsdl.getMetadata_result", swaggerObject);
			return swaggerObject;
		});
		
		logger.exit("wsdl.getMetadata_stat", readPromise);
		return readPromise;
	}).caught(function(error){
		logger.entry("wsdl.getMetadata_error", error);
		// not found
		logger.exit("wsdl.getMetadata_error", null);
		return null;
	});
	
	logger.exit("wsdl.getMetadata", promise);
	return promise;
}

module.exports = {
		initialize: initialize,
		getWSDLDirectoryList: getWSDLDirectoryList,
		getWSDLContent: getWSDLContent,
		getMetadata: getMetadata,
		getWSDLPath: getWSDLPath
};
