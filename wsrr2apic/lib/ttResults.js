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
 * Module to handle the results from the tool. Describes the whole process worked, and if each
 * business service worked, and if each version worked.
 * 
 * {
 *   success: boolean - did all work?
 *   details: [
 *   	{
 *   		name: string
 *   		bsrURI: string
 *   		version: string
 *   		description: string
 *   		success: boolean - did this business service work?
 *   		versions: [
 *   			{
 *			   		name: string
 *   				bsrURI: string
 *   				version: string
 *   				description: string
 *   				productName: string
 *   				productVersion: string
 *   				success: boolean - did this version work?
 *   				captureAttempted - did we attempt capture
 *					captureSuccess - did it work
 *					pushAttempted - did we attempt push
 *					pushSuccess - did it work
 *					publishAttempted - did we attempt to publish
 *					publishSuccess - did it work
 *					catalogs: array of strings, which catalogs were published to
 *					catalogConsumersDone: {
 *						catalogName: {
 * 							created: [ id of any created applications, ...]
 *  						updated: [ {appID: id of the app, clientID: old client ID (OR) description: old client description}, ... ]
 *  						subscriptionsAdded: [ {subID: id of any created subscriptions, appID: id of the app}, ...]
 *  						subscriptionsDeleted: [ {planName: plan name, productID: id of the product, appID: id of the app}, ...]
 *  						appIDToName: { appID: app name, appID2: app name 2 }
 *						}, ...
 *					}
 *   			}
 *   		]
 *   	}   
 *   ] 
 * }
 * 
 * For catalogConsumersDone this is returned from flowConsumers, see _reconciliateConsumers().
 */
//TODO: add consumers done to this
//TODO: add which Catalogs were published to as well

'use strict';

var ttResults = {
	data: null,

	// set the success state of the overall results
	setSuccess: function setSuccess(success) {
		this.data.success = success;
	},

	// store the business service in the results
	// if the business service success is false, sets the overall success to false
	addBusinessService: function addBusinessService(bs) {
		// add versions array
		if(!bs.versions) {
			bs.versions = [];
		}
		this.data.details.push(bs);
		
		if(bs.success === false) {
			this.data.success = false;
		}
	},
	
	// get the raw results object, for reading
	getResults: function getResults() {
		return this.data;
	}
};

//factory that creates an instance of the results
var factory = function() {
	var theData = Object.create(ttResults);
	theData.data = {
		success: true,
		details: []
	};
	return theData;
};

// make a results item for a business service.
// returns the results item object.
var createBSResultsItem = function createBSResultsItem(name, version, description, bsrURI, success) {
	var bs = {
		name: name,
		version: version,
		description: description,
		bsrURI: bsrURI,
		success: success
	};
	
	return bs;
};

//make a results item for a service version.
//returns the results item object.
var createSVResultsItem = function createSVResultsItem(name, version, description, bsrURI, success) {
	var sv = {
		name: name,
		version: version,
		description: description,
		bsrURI: bsrURI,
		success: success,
		productName: "", 
		productVersion: "",
		captureAttempted: false,
		captureSuccess: false,
		pushAttempted: false,
		pushSuccess: false,		
		publishAttempted: false,
		publishSuccess: false,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogs: [],
		catalogConsumersDone: {}
	};

	return sv;
};

// add service version to the provided business service
// if the success is false, the business service success is set to false
var addServiceVersion = function addServiceVersion(bs, sv) {
	if(!bs.versions) {
		bs.versions = [];
	}
	bs.versions.push(sv);
	if(sv.success === false) {
		bs.success = false;
	}
};

module.exports = {
		create: factory,
		createBSResultsItem: createBSResultsItem,
		createSVResultsItem: createSVResultsItem,
		addServiceVersion: addServiceVersion
};
