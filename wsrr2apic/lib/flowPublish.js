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

// Flow publish module which encapsulates the processing needed for publishing APIs

var logger = require("./Logger"), Promise = require("bluebird");

/*
 * Remove products from the catalogs.
 * 
 * This is done by first retiring then deleting, because a sandbox will allow a delete but a non-sandbox will
 * only allow delete of a retired API.
 * 
 * If anything goes wrong then this does not throw an exception but just logs the error.
 * 
 * productDetails - object {productName, productVersion} which identifies the version
 * catalogs - array of catalog name strings (not display name)
 * spaces - map of catalog name to space name
 * apiCli - APIC cli module
 * 
 * Returns a promise that resolves with nothing when done.
 * 
 */
function _removeFromCatalogs(productDetails, catalogs, spaces, apiCli) {
	logger.entry("_removeFromCatalogs", productDetails, catalogs, spaces, apiCli);

	logger.info(logger.Globalize.formatMessage("flowErrorCleaningUpProductToCatalog"));

	// need non undefined total to make it call for one value in the array 
	var resultsObj = {};
	// reduce to do it one by one
	var loopPromise = Promise.reduce(catalogs, function(total, catalog, index, length) {
		logger.entry("_removeFromCatalogs_reduce_callback", total, catalog, index, length);
		if(spaces[catalog]){
			logger.info(logger.Globalize.formatMessage("flowRetiringProductInSpace", productDetails.productName, productDetails.productVersion, catalog,spaces[catalog]));
		}else{
			logger.info(logger.Globalize.formatMessage("flowRetiringProductInCatalog", productDetails.productName, productDetails.productVersion, catalog));
		}
		
		var retireDeletePromise = apiCli.productsSet(productDetails.productName, productDetails.productVersion, "retired", catalog,spaces[catalog]).then(function(){
  			logger.entry("_removeFromCatalogs_reduce_retire_callback");

  			// now delete
  			if(spaces[catalog]){
  				logger.info(logger.Globalize.formatMessage("flowDeletingProductInSpace", productDetails.productName, productDetails.productVersion, catalog,spaces[catalog]));
  			}else{
  				logger.info(logger.Globalize.formatMessage("flowDeletingProductInCatalog", productDetails.productName, productDetails.productVersion, catalog));
  			}
  			
  			var deletePromise = apiCli.productsDelete(productDetails.productName, productDetails.productVersion, catalog,spaces[catalog]);
  			
  			logger.exit("_removeFromCatalogs_reduce_retire_callback", deletePromise);
  			return deletePromise;
		}).then(function(){
			logger.entry("_removeFromCatalogs_reduce_delete_callback");
			
			// done
			
  			logger.exit("_removeFromCatalogs_reduce_delete_callback", total);
  			return total;
		}).caught(function(error) {
			logger.entry("_removeFromCatalogs_reduce_remove_error");
			if(spaces[catalog]){
				logger.error(logger.Globalize.formatMessage("flowErrorRemovingProductInSpace", productDetails.productName, productDetails.productVersion, catalog,spaces[catalog]));
			}else{
				logger.error(logger.Globalize.formatMessage("flowErrorRemovingProductInCatalog", productDetails.productName, productDetails.productVersion, catalog));
			}
			// ignore and carry on with the next catalog
			
			logger.exit("_removeFromCatalogs_reduce_remove_error", total);
			return total;
		});
		logger.exit("_removeFromCatalogs_reduce_callback", retireDeletePromise);
		return retireDeletePromise;
	}, resultsObj).then(function(){
		logger.entry("_removeFromCatalogs_reduce_done");

		logger.info(logger.Globalize.formatMessage("flowErrorFinishedCleaningUpProductToCatalog"));
		
		logger.exit("_removeFromCatalogs_reduce_done");
	});	
	
	logger.exit("_removeFromCatalogs", loopPromise);
	return loopPromise;
}

/*
 * Publish the Product identified by the business service and service version or productDetails to the catalogs in the configuration.
 * 
 * productDetails is an object {productName, productVersion} which identifies the version.
 * 
 * If an error happens doing a publish then the process stops and subsequent catalogs are not pushed to. The error
 * has the catalog that failed, although if the error comes from apiCli then the message will detail the 
 * catalog name anyway.
 * 
 * Returns a Promise that resolves with an array of catalogs that were published to when the publishes have happened.
 * Throws if an error happens. The Error object will have a property of "catalog" which is the catalog which failed.
 */
function publishProductToCatalogs(bsBsrURI, bsrURI, productDetails, apiCli) {
	logger.entry("publishProductToCatalogs", bsBsrURI, bsrURI, productDetails, apiCli);

	var catalogs = apiCli.getPublishCatalogs();
	var spaces = apiCli.getCatalogToSpace();

	// do one at once because the APIC toolkit should not be called in multiple threads simultaneously
	var resultsObj = {
			doneCatalogs: []
	};
	
	// use reduce so it waits until the promise for an item resolves before processing the next item
	var loopPromise = Promise.reduce(catalogs, function(total, catalog, index, length) {
		logger.entry("publishProductToCatalogs_reduce_callback", total, catalog, index, length);

		var space = spaces[catalog];
		if(space) {
			logger.info(logger.Globalize.formatMessage("flowPublishingProductToCatalogSpace", productDetails.productName, productDetails.productVersion, catalog, space));
		} else {
			logger.info(logger.Globalize.formatMessage("flowPublishingProductToCatalog", productDetails.productName, productDetails.productVersion, catalog));
		}
		
		var publishPromise = apiCli.publishFromDrafts(productDetails.productName, productDetails.productVersion, catalog, ".", space).then(function(){
  			logger.entry("publishProductToCatalogs_reduce_publish_callback");

  			// add to done
  			total.doneCatalogs.push(catalog);
  			
  			logger.exit("publishProductToCatalogs_reduce_publish_callback", total);
  			return total;
		}).caught(function(error) {
			logger.entry("publishProductToCatalogs_reduce_publish_error");

			logger.error(logger.Globalize.formatMessage("flowErrorPublishingProductToCatalog", productDetails.productName, productDetails.productVersion, catalog));
			if(error instanceof Error) {
				// add failing catalog
				error.catalog = catalog;
			} else {
				// need an Error so we can add the catalog that failed
				var error2 = new Error(error);
				error2.catalog = catalog;
				error = error2;
			}
			
			// now try to delete from the catalogs we published to
			var deletePromise = _removeFromCatalogs(productDetails, resultsObj.doneCatalogs,spaces, apiCli).then(function() {
				logger.entry("publishProductToCatalogs_reduce_publish_error_delete_callback");
				
				// now throw the error
				
				logger.exit("publishProductToCatalogs_reduce_publish_error_delete_callback", error);
				throw error;
			});
			
			logger.exit("publishProductToCatalogs_reduce_publish_error", deletePromise);
			return deletePromise;
		});
		logger.exit("publishProductToCatalogs_reduce_callback", publishPromise);
		return publishPromise;
	}, resultsObj).then(function(total){
		logger.entry("publishProductToCatalogs_reduce_done", total);
		
		// return done catalogs array
		var catalogs = total.doneCatalogs;
		logger.exit("publishProductToCatalogs_reduce_done", catalogs);
		return catalogs;
	});	
	
	logger.exit("publishProductToCatalogs", loopPromise);
	return loopPromise;
}

module.exports = {
		publishProductToCatalogs:publishProductToCatalogs,
		removeFromCatalogs:_removeFromCatalogs
};
