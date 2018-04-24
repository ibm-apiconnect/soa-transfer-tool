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

/*
 * Transfer Tool storage, represents storing data to disk and reading it from disk.
 *
 * Stores files under the fsRoot in the following structure:
 *
 * /
 * /<business service bsrURI>/product.yaml - if product per BS
 * /<business service bsrURI>/docs/ - artifact and charter documents
 * /<business service bsrURI>/<service version bsrURI>_wsdls.zip
 * /<business service bsrURI>/<service version bsrURI>/
 *   /api.yaml
 *   /docs/<various binary documents>
 *   /logs/wsrr.yaml - WSRR Yaml - generated YAML from templates and WSRR data
 *   /result.json - result of transfer (success, failure)
 *   /product.yaml - if product per SV
 *   /docs/ - artifact documents
 *
 * For SOAP:
 *   /logs/wsdl.yaml - WSDL Yaml - generated YAML from APIC
 *
 * For REST:
 *   /logs/swaggerFromWSRR_<name of swagger> - Downloaded swagger from WSRR, if one was found
 *   /logs/combinedApi.yaml - Combined API Yaml from generated YAML from APIC and downloaded swagger from WSRR
 *
 * Does not store any state, so you can change the FS root at will.
 *
 */

// wsdls are stored in BS dir because the drafts:push command needs the wsdls to be in the dir where the command is run from

'use strict';

var logger=require("../lib/Logger"), Promise = require('bluebird'), fs = require('fs'), nodeZip = require("node-zip"),
yaml = require('js-yaml'), path = require("path");

// promise FS
Promise.promisifyAll(fs);

// root of the file system where we put things
var fsRoot = null;
// product per version mode
var productPerVersion = true;

/*
 * Set the root of the file system where to store all data.
 */
function setFSRoot(root) {
	logger.entry("setFSRoot", root);

	fsRoot = root;

	logger.exit("setFSRoot");
}

/*
 * Set the product per version mode.
 *
 * If true things are stored under the version folder. If false,
 * things like the product.yaml are stored under the business
 * service folder.
 *
 */
function setProductPerVersion(product) {
	logger.entry("setProductPerVersion", product);

	productPerVersion = product;

	logger.exit("setProductPerVersion");
}

/*
 * Make folders for the BS and SV if not already there.
 * If serviceVersionBsrURI is null then do not make the sv folder.
 *
 * Return Promise that resolves when done.
 */
function _makeFolders(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("_makeFolders", businessServiceBsrURI, serviceVersionBsrURI);

	var bsFolder = fsRoot + "/" + businessServiceBsrURI;
	var svFolder = bsFolder + "/" + serviceVersionBsrURI;
	var bsDocsFolder = bsFolder + "/docs";
	var logsFolder = bsFolder + "/" + serviceVersionBsrURI + "/logs";
	var docsFolder = bsFolder + "/" + serviceVersionBsrURI + "/docs";

	// function to make the logs and docs folder for the SV
	var makeLogsFolder = function() {
		if(serviceVersionBsrURI) {
			var logsPromise = fs.mkdirAsync(logsFolder).caught(function(error){
				// trace and ignore
				logger.debug("Ignorable error from mkdir " + logsFolder + " but could be because it existed: " + error);
				return "";
			});
			var docsPromise = fs.mkdirAsync(docsFolder).caught(function(error){
				// trace and ignore
				logger.debug("Ignorable error from mkdir " + docsFolder + " but could be because it existed: " + error);
				return "";
			});
			return Promise.all([logsPromise, docsPromise]);
		}
	};

	// function to make the SV folder and the SV logs folder
	var makeSvFolder = function() {
		if(serviceVersionBsrURI) {
			return fs.mkdirAsync(svFolder).
			then(function() {
				return makeLogsFolder();
			}).
			caught(function(error){
				// trace and ignore
				logger.debug("Ignorable error from mkdir " + svFolder + " but could be because it existed: " + error);
				return makeLogsFolder();
			});
		}
	};

	// make just the BS logs folder
	var makeBsLogsFolder = function() {
		return fs.mkdirAsync(bsDocsFolder).caught(function(error) {
			// trace and ignore
			logger.debug("Ignorable error from mkdir " + bsDocsFolder + " but could be because it existed: " + error);
			return "";
		});
	};

	var promise = fs.mkdirAsync(bsFolder).then(function(){
		// make sv and docs folder
		return Promise.all([makeSvFolder(), makeBsLogsFolder()]);
	}).caught(function(error){
		logger.debug("Ignorable error from mkdir " + bsFolder + " but could be because it existed: " + error);
		// make sv and docs folder
		return Promise.all([makeSvFolder(), makeBsLogsFolder()]);
	});

	logger.exit("_makeFolders", promise);
	return promise;
}

/*
 * Clear the version folder of files. If the version or business service folder does not exist, create it.
 *
 * Return promise which resolves when done (with no data).
 */
function clearVersionFolder(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("clearVersionFolder", businessServiceBsrURI, serviceVersionBsrURI);

	var bsFolder = fsRoot + "/" + businessServiceBsrURI;
	var svFolder = bsFolder + "/" + serviceVersionBsrURI;

	// try to make folders first - they may already exist
	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("clearVersionFolder_makefolders_callback");
		var readPromise = fs.readdirAsync(svFolder).then(function(fileList){
			logger.entry("clearVersionFolder_readdir_callback", fileList);
			var allDelPromise = null;
			if(fileList) {
				// delete all at once
				var delPromises = [];
				var delPromise, delPath;
				// function to check if the filename is a directory or file
				var checkFunction = function(deletePath, stats) {
					logger.entry("clearVersionFolder_checkFunction", stats);
					var unlinkPromise = null;
					if(stats && stats.isFile()) {
						unlinkPromise = fs.unlinkAsync(deletePath);
					}
					logger.exit("clearVersionFolder_checkFunction", unlinkPromise);
					return unlinkPromise;
				};
				for(var i = 0; i < fileList.length; i++) {
					delPath = path.resolve(svFolder, fileList[i]);
					delPromise = fs.statAsync(delPath).then(checkFunction.bind(this, delPath));
					delPromises.push(delPromise);
				}
				allDelPromise = Promise.all(delPromises);
			}
			logger.exit("clearVersionFolder_readdir_callback", allDelPromise);
			return allDelPromise;
		});
		logger.exit("clearVersionFolder_makefolders_callback", readPromise);
		return readPromise;
	});

	logger.exit("clearVersionFolder", promise);
	return promise;
}

/*
 * Get the path to the WSDL documents for the specified bs and sv.
 * Does not guarantee that the document exists.
 *
 * if productPerVersion true, wsdl path is under the SV folder. If false, wsdl path is under the BS path.
 * //TODO: this
 * Return a path including the fsRoot.
 */
function getWSDLPath(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("getWSDLPath", businessServiceBsrURI, serviceVersionBsrURI);

	var filePath = null;
	if(productPerVersion) {
		filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/" + serviceVersionBsrURI + "_wsdls.zip";
	} else {
		filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "_wsdls.zip";
	}

	logger.exit("getWSDLPath", filePath);
	return filePath;
}

/*
 * Store the WSDL and XSD documents in wsdlData under the BS and SV BsrURIs.
 * data should be the data from wsrrUtils.downloadServiceDocuments() with location field:
 *
 * [{bsrURI: bsrURI
 * of doc, name: name of doc, content: Buffer with binary content, location: name of doc to write}, ...]
 *
 * Stores in serviceVersionBsrURI_wsdls.zip
 *
 * Uses the location property as the name stored in the ZIP.
 *
 * Return Promise which resolves once done.
 */
function storeWSDL(businessServiceBsrURI, serviceVersionBsrURI, data) {
	logger.entry("storeWSDL", businessServiceBsrURI, serviceVersionBsrURI, data);

	// make folders
	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("storeWSDL_madeFolders");
		var zip = new NodeZip();
		for(var i = 0; i < data.length; i++) {
			if(!data[i].location || !data[i].content || !data[i].name) {
				throw new Error("Data incorrect needs location content name fields: " + data[i]);
			}
			// change \ to / in location so sub folders work
			var location = data[i].location.replace("\\", "/");
			zip.file(location, data[i].content);
		}
		// need to use adm-zip@0.4.4 else later releases generate a zip that confuses Windows 7 built in zip stuff
		var buffer = zip.generate({base64:false,compression:'DEFLATE'});
		var zipPath = getWSDLPath(businessServiceBsrURI, serviceVersionBsrURI);
		logger.debug("Writing to: " + zipPath);
		var fsPromise = fs.writeFileAsync(zipPath, buffer, 'binary');
		logger.exit("storeWSDL_madeFolders", fsPromise);
		return fsPromise;
	});

	logger.exit("storeWSDL", promise);
	return promise;
}

/*
 * Convert object to Yaml and store in the file specified in path.
 *
 * Return Promise that resolves once store is done.
 * Or throws an error if something went wrong.
 */
function _storeYamlConvert(object, filePath) {
	logger.entry("_storeYamlConvert", object, filePath);

	var fsPromise = null;
	try {
		var yamlData = yaml.safeDump(object);
		logger.debug("Yaml: " + yamlData);
		fsPromise = fs.writeFileAsync(filePath, yamlData);
	}catch(error){
		logger.debug("Error making product yaml");
		logger.error(error);
		throw error;
	}

	logger.exit("_storeYamlConvert", fsPromise);
	return fsPromise;
}


/*
 * Store the product YAML under the business service directory,
 * converting the YAML to a utf8 file. Or the service version
 * dir.
 *
 * businessServiceBsrURI - bs bsrURI
 * productObject - object to convert to YAML and store as product.yaml
 * serviceVersionBsrURI - (optional) service version bsruri, needed if product per version. Can set to null.
 *
 * returns Promise that resolves once store is done.
 */
function storeProductYaml(businessServiceBsrURI, serviceVersionBsrURI, productObject) {
	logger.entry("storeProductYaml", businessServiceBsrURI, serviceVersionBsrURI, productObject);
	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("storeProductYaml_makeFolders_callback");

		//TODO: if !productPerVersion store under BS
		var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/product.yaml";
		var fsPromise = _storeYamlConvert(productObject, filePath);

		logger.exit("storeProductYaml_makeFolders_callback", fsPromise);
		return fsPromise;
	});

	logger.exit("storeProductYaml", promise);
	return promise;
}

/*
 * Store the Api YAML under the business service and service version directory,
 * converting the YAML to a utf8 file.
 *
 * apiObject - object to convert to YAML and store as api.yaml
 *
 * returns Promise that resolves once store is done.
 */
function storeApiYaml(businessServiceBsrURI, serviceVersionBsrURI, apiObject) {
	logger.entry("storeApiYaml", businessServiceBsrURI, serviceVersionBsrURI, apiObject);

	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("storeApiYaml_makeFolders_callback");

		var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/api.yaml";
		var fsPromise = _storeYamlConvert(apiObject, filePath);

		logger.exit("storeApiYaml_makeFolders_callback", fsPromise);
		return fsPromise;
	});

	logger.exit("storeApiYaml", promise);
	return promise;
}

/*
 * Store the WSRR Api YAML under the business service and service version directory,
 * converting the YAML to a utf8 file. This is the yaml created by the template and
 * data from WSRR.
 *
 * apiObject - object to convert to YAML and store as wsrr.yaml
 *
 * returns Promise that resolves once store is done.
 */
function storeWSRRApiYaml(businessServiceBsrURI, serviceVersionBsrURI, apiObject) {
	logger.entry("ttStorage.storeWSRRApiYaml", businessServiceBsrURI, serviceVersionBsrURI, apiObject);

	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("ttStorage.storeWSRRApiYaml_makeFolders_callback");

		var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/logs/wsrr.yaml";
		var fsPromise = _storeYamlConvert(apiObject, filePath);

		logger.exit("ttStorage.storeWSRRApiYaml_makeFolders_callback", fsPromise);
		return fsPromise;
	});

	logger.exit("ttStorage.storeWSRRApiYaml", promise);
	return promise;
}

/*
 * Store the Combined REST Api YAML under the business service and service version directory,
 * converting the YAML to a utf8 file. This is the yaml created by the template and
 * data from WSRR.
 *
 * apiObject - object to convert to YAML and store as combinedApi.yaml
 *
 * returns Promise that resolves once store is done.
 */
function storeCombinedRESTYaml(businessServiceBsrURI, serviceVersionBsrURI, apiObject) {
	logger.entry("ttStorage.storeCombinedRESTYaml", businessServiceBsrURI, serviceVersionBsrURI, apiObject);

	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("ttStorage.storeCombinedRESTYaml_makeFolders_callback");

		var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/logs/combinedApi.yaml";
		var fsPromise = _storeYamlConvert(apiObject, filePath);

		logger.exit("ttStorage.storeCombinedRESTYaml_makeFolders_callback", fsPromise);
		return fsPromise;
	});

	logger.exit("ttStorage.storeCombinedRESTYaml", promise);
	return promise;
}

/*
 * Store the consumers YAML under the business service and service version directory,
 * converting the YAML to a utf8 file. This is the yaml created by the template and
 * data from WSRR.
 *
 * consumersObject - object to convert to YAML and store as consumers.yaml
 *
 * returns Promise that resolves once store is done.
 */
function storeConsumersYaml(businessServiceBsrURI, serviceVersionBsrURI, consumersObject) {
	logger.entry("ttStorage.storeConsumersYaml", businessServiceBsrURI, serviceVersionBsrURI, consumersObject);

	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("ttStorage.storeConsumersYaml_makeFolders_callback");

		var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/consumers.yaml";
		var fsPromise = _storeYamlConvert(consumersObject, filePath);

		logger.exit("ttStorage.storeConsumersYaml_makeFolders_callback", fsPromise);
		return fsPromise;
	});

	logger.exit("ttStorage.storeConsumersYaml", promise);
	return promise;
}

/*
 * Store the provided docs into the directoryPath.
 * If there is a name clash, will use bsrURI_name as the file name. Unless both docs have the same bsrURI,
 * then will store just one.
 *
 * directoryPath - full path to where to store.
 * docs - should be the return data from wsrrUtils.downloadCharterDocumentsForService() or downloadArtifactDocumentsForService(), should contain something
 *
 * returns Promise that resolves when the store is done.
 */
function _storeBinaryDocs(directoryPath, docs) {
	logger.entry("ttStorage._storeBinaryDocs", directoryPath, docs);

	// copy to new array and check name
	var newDocs = [];
	var doc, i, bsrURI, newDoc;
	for(i = 0; i < docs.length; i++) {
		doc = docs[i];
		newDoc = {name: doc.name, content: doc.content, bsrURI: doc.bsrURI};
		// remove any path characters \ / from the name or ../ or ..\
		newDoc.name = newDoc.name.replace(/(\.\.\\)|(\/)|(\\)|(\.\.\/)/g, "");
		//replace any known invalid characters with .
		newDoc.name = newDoc.name.replace(/(\?)|(\:)|(\*)|(\|)|(<)|(>)/g,".");
		newDocs.push(newDoc);
	}

	// work out duplicate names
	var bsrURIToDoc = {};
	var dupNames = [];
	var names = [];
	// map of name to bsrURI for duplicates
	for(i = 0; i < newDocs.length; i++) {
		doc = newDocs[i];
		// only store if we have not seen this bsrURI before
		if(!bsrURIToDoc[doc.bsrURI]) {
			// not seen bsrURI before so store
			bsrURIToDoc[doc.bsrURI] = doc;
			// check for duplicate name
			if(names.indexOf(doc.name) === -1) {
				names.push(doc.name);
			} else {
				// already seen this name
				dupNames.push(doc.name);
			}
		}
	}

	// store each entry in bsrURIToDoc
	var bsrURIs = Object.keys(bsrURIToDoc);
	var promises = [];
	var fsPromise, name, filePath;
	for(i = 0; i < bsrURIs.length; i++) {
		bsrURI = bsrURIs[i];
		doc = bsrURIToDoc[bsrURIs[i]];
		name = doc.name;
		if(dupNames.indexOf(doc.name) !== -1) {
			// duplicate, store as bsrURI_name
			name = doc.bsrURI + "_" + doc.name;
		}
		filePath = path.resolve(directoryPath, name);

		fsPromise = fs.writeFileAsync(filePath, doc.content);
		promises.push(fsPromise);
	}
	var promise = Promise.all(promises);

	logger.exit("ttStorage._storeBinaryDocs", promise);
	return promise;
}

/*
 * Store the artifact documents for the business service, as binary.
 * If there is a name clash, will use bsrURI_name as the file name.
 *
 * docs - should be the return data from wsrrUtils.downloadCharterDocumentsForService() or downloadArtifactDocumentsForService()
 *
 * returns Promise that resolves once store is done.
 */
function storeBusinessServiceArtifacts(businessServiceBsrURI, docs) {
	logger.entry("ttStorage.storeBusinessServiceArtifacts", businessServiceBsrURI, docs);

	var promise = _makeFolders(businessServiceBsrURI, null).then(function(){
		logger.entry("ttStorage.storeBusinessServiceArtifacts_makeFolders_callback");

		var filePath = fsRoot + "/" + businessServiceBsrURI + "/docs";
		var fsPromise = _storeBinaryDocs(filePath, docs);

		logger.exit("ttStorage.storeBusinessServiceArtifacts_makeFolders_callback", fsPromise);
		return fsPromise;
	});

	logger.exit("ttStorage.storeBusinessServiceArtifacts", promise);
	return promise;
}

/*
 * Store the artifact documents for the business service and service version, as binary.
 * If there is a name clash, will use bsrURI_name as the file name.
 *
 * docs - should be the return data from wsrrUtils.downloadCharterDocumentsForService() or downloadArtifactDocumentsForService()
 *
 * returns Promise that resolves once store is done.
 */
function storeServiceVersionArtifacts(businessServiceBsrURI, serviceVersionBsrURI, docs) {
	logger.entry("ttStorage.storeServiceVersionArtifacts", businessServiceBsrURI, serviceVersionBsrURI, docs);

	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("ttStorage.storeServiceVersionArtifacts_makeFolders_callback");

		var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/docs";
		var fsPromise = _storeBinaryDocs(filePath, docs);

		logger.exit("ttStorage.storeServiceVersionArtifacts_makeFolders_callback", fsPromise);
		return fsPromise;
	});

	logger.exit("ttStorage.storeServiceVersionArtifacts", promise);
	return promise;
}


/*
 * Store the diagnostic data object under the business service and service version directory,
 * converting to a JSON utf8 file.
 *
 * dataObject - object to convert to JSON and store as diagnostics
 * name - name of file to store as
 *
 * returns Promise that resolves once store is done.
 */
function storeDiagnostic(businessServiceBsrURI, serviceVersionBsrURI, dataObject, name) {
	logger.entry("ttStorage.storeDiagnostic", businessServiceBsrURI, serviceVersionBsrURI, dataObject, name);

	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("ttStorage.storeDiagnostic_makeFolders_callback");
		var fsPromise = null;
		try {
			var jsonData = JSON.stringify(dataObject, null, "  ");
			var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/logs/" + name;
			fsPromise = fs.writeFileAsync(filePath, jsonData);
		}catch(error){
			logger.debug("Error making diagnostic JSON but ignoring");
			logger.error(error);
			// ignore error because something may have already gone wrong and we want that error to surface
		}

		logger.exit("ttStorage.storeDiagnostic_makeFolders_callback", fsPromise);
		return fsPromise;
	});

	logger.exit("ttStorage.storeDiagnostic", promise);
	return promise;
}

/*
 * Store the WSRR data downloaded from the server and combined.
 */
function storeWsrrData(businessServiceBsrURI, serviceVersionBsrURI, dataObject) {
	logger.entry("ttStorage.storeWsrrData", businessServiceBsrURI, serviceVersionBsrURI, dataObject);

	var promise = storeDiagnostic(businessServiceBsrURI, serviceVersionBsrURI, dataObject, "wsrrdata.json");

	logger.exit("ttStorage.storeWsrrData", promise);
	return promise;
}

/*
 * Read the WSRR data back as an object.
 */
function readWsrrData(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("ttStorage.readWsrrData", businessServiceBsrURI, serviceVersionBsrURI);

	var file = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/logs/wsrrdata.json";

	var promise = fs.readFileAsync(file, "utf8").then(function(data){
		// parse into object
		logger.entry("ttStorage.readWsrrData_result", file, data);
		// try to convert to object
		var returnObject = null;
		try {
			returnObject = JSON.parse(data);
		} catch(e) {
			logger.debug("Error converting JSON to object");
			logger.error(e);
			throw e;
		}
		logger.exit("ttStorage.readWsrrData_result", returnObject);
		return returnObject;
	});

	logger.exit("ttStorage.readWsrrData", promise);
	return promise;
}

/*
 * Read the WSRR data back as an object, or return null if the file does not exist.
 */
function readWsrrDataOrEmpty(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("ttStorage.readWsrrDataOrEmpty", businessServiceBsrURI, serviceVersionBsrURI);

	var file = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/logs/wsrrdata.json";

	var promise = fs.lstatAsync(file).then(function(stat){
		logger.entry("ttStorage.readWsrrDataOrEmpty_stat", stat);
		// found

		var readPromise = readWsrrData(businessServiceBsrURI, serviceVersionBsrURI);
		logger.exit("ttStorage.readWsrrDataOrEmpty_stat", readPromise);
		return readPromise;
	}).caught(function(error){
		logger.entry("ttStorage.readWsrrDataOrEmpty_error", error);
		// not found
		logger.exit("ttStorage.readWsrrDataOrEmpty_error", null);
		return null;
	});

	logger.exit("ttStorage.readWsrrDataOrEmpty", promise);
	return promise;
}

/*
 * Store the diagnostic string under the business service and service version directory.
 *
 * dataString - string to store as diagnostics
 * name - name of file to store as
 *
 * returns Promise that resolves once store is done.
 */
function storeDiagnosticString(businessServiceBsrURI, serviceVersionBsrURI, dataString, name) {
	logger.entry("ttStorage.storeDiagnosticString", businessServiceBsrURI, serviceVersionBsrURI, dataString, name);

	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("ttStorage.storeDiagnosticString_makeFolders_callback");
		var fsPromise = null;
		try {
			var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/logs/" + name;
			fsPromise = fs.writeFileAsync(filePath, dataString);
		}catch(error){
			logger.debug("Error writing diagnostic but ignoring");
			logger.error(error);
			// ignore error because something may have already gone wrong and we want that error to surface
		}

		logger.exit("ttStorage.storeDiagnosticString_makeFolders_callback", fsPromise);
		return fsPromise;
	});

	logger.exit("ttStorage.storeDiagnosticString", promise);
	return promise;
}

/*
 * Store the result of the transfer of the service version for the business service, under the service
 * version directory.
 *
 * result = object as follows (is a ttResults SV result item):
 * {
 * 	success: true/false - if the transfer succeeded
 *  pushSuccess: true/false - push to APIC. Also implies capture was attempted and succeeded.
 *  pushAttempted: true/false - did we try ever? Implies capture was attempted and succeeded.
 *  captureSuccess: true/false - download from WSRR
 *  captureAttempted: true/false - did we try ever?
 *  publishAttempted: true/false - did we try?
 *  publishSuccess: true/false - publish to catalogs
 *  diagnostics: [] - array of diagnostic strings if the transfer failed
 *
 * }
 *
 * Whatever is missing has attempted set to false and success to false. Unless this is something
 * implied in which case they are set to true. Eg pushSuccess means we set captures to true.
 *
 * Given the transfer can be done by a capture then a push, this records if the current operation
 * succeeded and if each has been attempted and succeeded.
 *
 * Result is stored as a JSON string in "result.json"
 *
 * Returns a promise that resolves once the store is done.
 *
 */
//TODO: if !productPerVersion, store under the BS folder (for one product per BS)
function storeTransferResult(businessServiceBsrURI, serviceVersionBsrURI, result) {
	logger.entry("ttStorage.storeTransferResult", businessServiceBsrURI, serviceVersionBsrURI, result);

	// copy across to strip extra stuff

	var data = {
			captureAttempted: false,
			captureSuccess: false,
			pushAttempted: false,
			pushSuccess: false,
			publishAttempted: false,
			publishSuccess: false,
			catalogs: [],
			consumersAttempted: false,
			consumersSuccess: false
	};
	data.success = result.success;
	data.diagnostics = result.diagnostics;
	if(result.captureAttempted) {
		data.captureAttempted = result.captureAttempted;
	}
	if(result.captureSuccess) {
		data.captureSuccess = result.captureSuccess;
	}
	if(result.pushAttempted) {
		data.pushAttempted = result.pushAttempted;
		data.captureAttempted = true;
		data.captureSuccess = true;
	}
	if(result.pushSuccess) {
		data.pushSuccess = result.pushSuccess;
		data.pushAttempted = true;
		data.captureAttempted = true;
		data.captureSuccess = true;
	}
	if(result.publishAttempted) {
		data.publishAttempted = result.publishAttempted;
		data.pushAttempted = true;
		data.pushSuccess = true;
		data.captureAttempted = true;
		data.captureSuccess = true;
	}
	if(result.publishSuccess) {
		data.publishSuccess = result.publishSuccess;
		data.publishAttempted = true;
		data.pushAttempted = true;
		data.pushSuccess = true;
		data.captureAttempted = true;
		data.captureSuccess = true;
	}
	if(result.consumersAttempted) {
		data.consumersAttempted = result.consumersAttempted;
		data.publishAttempted = true;
		data.publishSuccess = true;
		data.pushAttempted = true;
		data.pushSuccess = true;
		data.captureAttempted = true;
		data.captureSuccess = true;
	}
	if(result.consumersSuccess) {
		data.consumersSuccess = result.consumersSuccess;
		data.consumersAttempted = true;
		data.publishAttempted = true;
		data.publishSuccess = true;
		data.pushAttempted = true;
		data.pushSuccess = true;
		data.captureAttempted = true;
		data.captureSuccess = true;
	}
	if(result.catalogs) {
		data.catalogs = result.catalogs;
	}

	var promise = _makeFolders(businessServiceBsrURI, serviceVersionBsrURI).then(function(){
		logger.entry("ttStorage.storeTransferResult_makeFolders_callback");

		var fsPromise = null;
		try {
			var jsonData = JSON.stringify(data, null, "  ");
			var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/result.json";
			fsPromise = fs.writeFileAsync(filePath, jsonData);
		}catch(error){
			logger.debug("Error making result JSON");
			logger.error(error);
			throw error;
		}

		logger.exit("ttStorage.storeTransferResult_makeFolders_callback", fsPromise);
		return fsPromise;
	});

	logger.exit("ttStorage.storeTransferResult", promise);
	return promise;
}

/*
 * Get the path to the directory of the created REST yaml for the specified bs and sv.
 * Does not guarantee that the directory exists. Does not return the file name of the
 * REST yaml.
 *
 * Return a path including the fsRoot.
 */
function getCreatedRestDirectory(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("getCreatedRestDirectory", businessServiceBsrURI, serviceVersionBsrURI);

	var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/logs";

	logger.exit("getCreatedRestDirectory", filePath);
	return filePath;
}

/*
 * Get the name of the created REST yaml for the specified bs and sv.
 *
 * Return a file name.
 */
function getCreatedRestName(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("getCreatedRestName", businessServiceBsrURI, serviceVersionBsrURI);

	var name = "createdRest.yaml";

	logger.exit("getCreatedRestName", name);
	return name;
}

/*
 * Get the name of the WSDL documents Zip for the specified bs and sv.
 * Does not guarantee that the document exists.
 *
 * Return a file name.
 */
function getWSDLZipName(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("getWSDLZipName", businessServiceBsrURI, serviceVersionBsrURI);

	var name = serviceVersionBsrURI + "_wsdls.zip";

	logger.exit("getWSDLZipName", name);
	return name;
}

/*
 * Get the path to the product yaml for the specified bs and sv.
 * Does not guarantee that the document exists.
 * If productPerVersion true, then return a path to product under the version directory.
 * If not, under the business service directory.
 *
 * businessServiceBsrURI - bs bsrURI (required)
 * serviceVersionBsrURI - sv bsrURI (optional)
 *
 * Return a path including the fsRoot.
 */
function getProductPath(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("getProductPath", businessServiceBsrURI, serviceVersionBsrURI);

	var zipPath = null;
	if(productPerVersion) {
		zipPath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/product.yaml";
	} else {
		zipPath = fsRoot + "/" + businessServiceBsrURI + "/product.yaml";
	}

	logger.exit("getProductPath", zipPath);
	return zipPath;
}

/*
 * Get the name of the product yaml relative to the business service directory.
 * Does not guarantee that the document exists.
 *
 * Return the name.
 */
function getProductYamlName(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("getProductYamlName", businessServiceBsrURI, serviceVersionBsrURI);

	// actually is just the name
	var name = "product.yaml";

	logger.exit("getProductYamlName", name);
	return name;
}

/*
 * Get the name of the api yaml relative to the business service directory.
 * Does not guarantee that the document exists.
 *
 * Return the name.
 */
function getApiYamlName(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("getApiYamlName", businessServiceBsrURI, serviceVersionBsrURI);

	// actually is just the name
	var name = "api.yaml";

	logger.exit("getApiYamlName", name);
	return name;
}

/*
 * Get the name of the consumers yaml relative to the business service directory.
 * Does not guarantee that the document exists.
 *
 * Return the name.
 */
function getConsumersYamlName(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("getConsumersYamlName", businessServiceBsrURI, serviceVersionBsrURI);

	// actually is just the name
	var name = "consumers.yaml";

	logger.exit("getConsumersYamlName", name);
	return name;
}

/*
 * Get the path to the Product yaml directory for the specified bs and sv.
 * Does not guarantee that the directory exists.
 *
 * This is because in v5000 drafts:push needs to run in the directory
 * where the WSDLs are.
 *
 * Return a path including the fsRoot.
 */
//TODO: if !productperversion, path is to the BS folder
function getProductDirectoryPath(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("getProductDirectoryPath", businessServiceBsrURI, serviceVersionBsrURI);

	var filePath = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/";

	logger.exit("getProductDirectoryPath", filePath);
	return filePath;
}

/*
 * Move the WSDL Yaml contents from path to destFile by
 * copying the contents then deleting.
 *
 * path - full path to the file
 * destFile - full path to the destination file
 *
 * returns a Promise that resolves when done.
 */
function _copyMoveWSDLYaml(filePath, destPath) {
	logger.entry("ttStorage._copyMoveWSDLYaml", filePath, destPath);

	var readPromise = fs.readFileAsync(filePath, 'utf8').then(function(data){
		logger.entry("ttStorage._copyMoveWSDLYaml_read");
		var writePromise = fs.writeFileAsync(destPath, data);
		logger.exit("ttStorage._copyMoveWSDLYaml_read", writePromise);
		return writePromise;
	}).then(function() {
		logger.entry("ttStorage._copyMoveWSDLYaml_write");
		var unlinkPromise = fs.unlinkAsync(filePath);
		logger.exit("ttStorage._copyMoveWSDLYaml_write", unlinkPromise);
		return unlinkPromise;
	});

	logger.exit("ttStorage._copyMoveWSDLYaml", readPromise);
	return readPromise;
}

/*
 * Move the WSDL Yaml specified into the correct location for the BS and SV.
 * Rename to wsdl.yaml and put in logs directory. Assumes the file is utf8
 * text.
 *
 * The folder should already exist for the bs and sv.
 *
 * path - path to file which should be moved
 *
 * Return promise that resolves once move is done.
 */
function moveWSDLYaml(filePath, businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("ttStorage.moveWSDLYaml", filePath, businessServiceBsrURI, serviceVersionBsrURI);

	// try to rename but if that fails read in contents, write out and delete original
	// (rename does not work across partitions or on some FS)

	var destFile = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/logs/wsdl.yaml";

	var promise = fs.renameAsync(filePath, destFile).caught(function(error){
		logger.entry("ttStorage.moveWSDLYaml_error", error);
		// error
		logger.debug("ttStorage.moveWSDLYaml copying instead");
		// return promise to read in original file, write new, delete old
		var copyPromise = _copyMoveWSDLYaml(filePath, destFile);

		logger.exit("ttStorage.moveWSDLYaml_error", copyPromise);
		return copyPromise;
	});

	logger.exit("ttStorage.moveWSDLYaml", promise);
	return promise;
}

/*
 * Read the YAML file in and convert to an object.
 *
 * Returns promise which resolves with the object.
 */
function _readYamlConvert(file) {
	logger.entry("ttStorage._readYamlConvert", file);

	var promise = fs.readFileAsync(file, "utf8").then(function(data){
		// parse into object
		logger.entry("ttStorage._readYamlConvert_result", file, data);
		// try to convert to object
		var returnObject = null;
		try {
			returnObject = yaml.safeLoad(data);
		} catch(e) {
			logger.debug("Error converting Yaml to object");
			logger.error(e);
			throw e;
		}
		logger.exit("ttStorage._readYamlConvert_result", returnObject);
		return returnObject;
	});

	logger.exit("ttStorage._readYamlConvert", promise);
	return promise;
}

/*
 * Read in the WSDL yaml and convert to an object.
 *
 * Returns a promise that resolves with the read object.
 */
function readWSDLYaml(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("ttStorage.readWSDLYaml", businessServiceBsrURI, serviceVersionBsrURI);

	var file = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/logs/wsdl.yaml";

	var promise = _readYamlConvert(file);

	logger.exit("ttStorage.readWSDLYaml", promise);
	return promise;
}

/*
 * Read in the created REST yaml (created by APIC create --type api) and convert to an object.
 *
 * Returns a promise that resolves with the read object.
 */
function readCreatedRESTYaml(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("ttStorage.readCreatedRESTYaml", businessServiceBsrURI, serviceVersionBsrURI);

	var directory = getCreatedRestDirectory(businessServiceBsrURI, serviceVersionBsrURI);
	var name = getCreatedRestName(businessServiceBsrURI, serviceVersionBsrURI);
	var file = path.resolve(directory, name);

	var promise = _readYamlConvert(file);

	logger.exit("ttStorage.readCreatedRESTYaml", promise);
	return promise;
}

/*
 * Read in the WSRR yaml and convert to an object.
 *
 * Returns a promise that resolves with the read object.
 */
function readWSRRApiYaml(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("ttStorage.readWSRRApiYaml", businessServiceBsrURI, serviceVersionBsrURI);

	var file = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/logs/wsrr.yaml";

	var promise = _readYamlConvert(file);

	logger.exit("ttStorage.readWSRRApiYaml", promise);
	return promise;
}

/*
 * Read in the product yaml and convert to an object.
 *
 * Returns a promise that resolves with the read object.
 */
function readProductYaml(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("ttStorage.readProductYaml", businessServiceBsrURI, serviceVersionBsrURI);

	var file = getProductPath(businessServiceBsrURI, serviceVersionBsrURI);

	var promise = _readYamlConvert(file);

	logger.exit("ttStorage.readProductYaml", promise);
	return promise;
}

/*
 * Read in the consumers yaml and convert to an object.
 *
 * Returns a promise that resolves with the read object.
 */
function readConsumersYaml(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("ttStorage.readConsumersYaml", businessServiceBsrURI, serviceVersionBsrURI);

	var file = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/consumers.yaml";

	var promise = _readYamlConvert(file);

	logger.exit("ttStorage.readConsumersYaml", promise);
	return promise;
}

/*
 * Check if the consumers YAML exists.
 *
 * Returns a promise that resolves with true if exists or false if not.
 */
function existsConsumersYaml(businessServiceBsrURI, serviceVersionBsrURI) {
	logger.entry("ttStorage.existsConsumersYaml", businessServiceBsrURI, serviceVersionBsrURI);

	var file = fsRoot + "/" + businessServiceBsrURI + "/" + serviceVersionBsrURI + "/consumers.yaml";

	var promise = fs.lstatAsync(file).then(function(stat){
		logger.entry("ttStorage.existsConsumersYaml_stat", stat);
		// found
		logger.exit("ttStorage.existsConsumersYaml_stat", true);
		return true;
	}).caught(function(error){
		logger.entry("ttStorage.existsConsumersYaml_error", error);
		// not found
		logger.exit("ttStorage.existsConsumersYaml_error", false);
		return false;
	});

	logger.exit("ttStorage.existsConsumersYaml", promise);
	return promise;
}

/*
 * Get list of directories in the specified directory.
 *
 * filePath - full path to the directory
 *
 * Returns a promise that resolves with an array of directory names (not full paths).
 */
function _getDirectoryList(filePath) {
	logger.entry("ttStorage._getDirectoryList", filePath);

	var promise = fs.readdirAsync(filePath).then(function(list){
		logger.entry("ttStorage._getDirectoryList_read_callback", list);

		// stat each file to find the folders
		var folders = [];
		var reducePromise = Promise.reduce(list, function(total, file, index, length){
			logger.entry("ttStorage._getDirectoryList_reduce_callback", total, file, index, length);

			var subFilePath = path.resolve(filePath, file);
			var statPromise = fs.statAsync(subFilePath).then(function(stats){
				logger.entry("ttStorage._getDirectoryList_reduce_stat_callback", file, stats);
				if(stats.isDirectory()) {
					// add
					total.push(file);
				}
				logger.exit("ttStorage._getDirectoryList_reduce_stat_callback", total);
				return total;
			});

			logger.exit("ttStorage._getDirectoryList_reduce_callback", statPromise);
			return statPromise;
		}, folders);

		logger.exit("ttStorage._getDirectoryList_read_callback", reducePromise);
		return reducePromise;
	});

	logger.exit("ttStorage._getDirectoryList", promise);
	return promise;
}

/*
 * Get an array of each business service and service version which is on the file system.
 *
 * Returns a Promise which resolves with an array of objects:
 * { bsBsrURI: business service bsrURI,
 * versions: [service version bsrURI, service version bsrURI]
 * }
 *
 */
function getBusinessServiceVersionList() {
	logger.entry("ttStorage.getBusinessServiceVersionList");

	// read all directories under the root, assume these are business services
	var promise = _getDirectoryList(fsRoot).then(function(businessServices){
		logger.entry("ttStorage.getBusinessServiceVersionList_list_directories", businessServices);

		var data = [];
		// for each folder we need to list the content folders which we assume are service versions
		var reducePromise = Promise.reduce(businessServices, function(total, businessService, index, length){
			logger.entry("ttStorage.getBusinessServiceVersionList_reduce", total, businessService, index, length);

			var filePath = path.resolve(fsRoot, businessService);
			var listPromise = _getDirectoryList(filePath).then(function(serviceVersions){
				logger.entry("ttStorage.getBusinessServiceVersionList_reduce_list", serviceVersions, businessService);

				var bs = {bsBsrURI: businessService};
				bs.versions = [];
				for(var i = 0, len = serviceVersions.length; i < len; i++){
					// assume directories are the service versions except for the "docs" directory
					if(serviceVersions[i] !== "docs") {
						bs.versions.push(serviceVersions[i]);
					}
				}
				total.push(bs);

				logger.exit("ttStorage.getBusinessServiceVersionList_reduce_list", total);
				return total;
			});

			logger.exit("ttStorage.getBusinessServiceVersionList_reduce", listPromise);
			return listPromise;
		}, data);

		logger.exit("ttStorage.getBusinessServiceVersionList_list_directories", reducePromise);
		return reducePromise;
	});

	logger.exit("ttStorage.getBusinessServiceVersionList", promise);
	return promise;
}

module.exports = {
	setFSRoot: setFSRoot,
	setProductPerVersion: setProductPerVersion,
	storeWSDL: storeWSDL,
	storeProductYaml: storeProductYaml,
	storeApiYaml: storeApiYaml,
	storeWSRRApiYaml: storeWSRRApiYaml,
	storeCombinedRESTYaml: storeCombinedRESTYaml,
	storeConsumersYaml: storeConsumersYaml,
	getWSDLPath: getWSDLPath,
	getWSDLZipName: getWSDLZipName,
	getCreatedRestDirectory: getCreatedRestDirectory,
	getCreatedRestName: getCreatedRestName,
	moveWSDLYaml: moveWSDLYaml,
	readWSDLYaml: readWSDLYaml,
	readProductYaml: readProductYaml,
	readCreatedRESTYaml: readCreatedRESTYaml,
	readWSRRApiYaml: readWSRRApiYaml,
	readConsumersYaml: readConsumersYaml,
	existsConsumersYaml: existsConsumersYaml,
	getProductPath: getProductPath,
	getProductYamlName: getProductYamlName,
	getApiYamlName:getApiYamlName,
	getConsumersYamlName:getConsumersYamlName,
	getProductDirectoryPath: getProductDirectoryPath,
	storeDiagnostic: storeDiagnostic,
	storeTransferResult: storeTransferResult,
	storeDiagnosticString: storeDiagnosticString,
	storeWsrrData: storeWsrrData,
	readWsrrData: readWsrrData,
	readWsrrDataOrEmpty: readWsrrDataOrEmpty,
	storeBusinessServiceArtifacts: storeBusinessServiceArtifacts,
	storeServiceVersionArtifacts: storeServiceVersionArtifacts,
	clearVersionFolder: clearVersionFolder,
	getBusinessServiceVersionList: getBusinessServiceVersionList,

	// for testing only
	_test_makeFolders: _makeFolders,
	_test_copyMoveWSDLYaml:_copyMoveWSDLYaml,
	_test_storeBinaryDocs:_storeBinaryDocs,
	_test_getDirectoryList:_getDirectoryList
};
