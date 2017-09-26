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

// Flow consumers module which encapsulates the processing needed to achieve consumers tasks for the tool

var logger = require("./Logger"), Promise = require("bluebird"), wsrrQueries = require("./WSRR/wsrrqueries"),
templating = require("./templating"), ttStorage = require("./ttStorage");


/*
 * Get owning organization for the version or capability indicated. 
 * Add to the version or capability on the "organization" property if one is found, otherwise
 * do nothing.
 * 
 * versionCapability - the version or capability to find the organization for
 * configuration - config
 * wsrrUtils - initialized wsrrUtils
 * 
 * Returns Promise which resolves when done, with no data.
 * 
 */
function _getOwningOrganization(versionCapability, configuration, wsrrUtils) {
	logger.entry("_getOwningOrganization", versionCapability, configuration, wsrrUtils);

	// retrieve versions for the SLA
	var xpath = wsrrQueries.getQueryXPath(wsrrQueries.OwningOrganizationForEntity, configuration);
	xpath = wsrrQueries.resolveInserts(xpath, versionCapability.bsrURI);
	
	// don't output this because it's too much
//	logger.info(logger.Globalize.formatMessage("flowFetchingOwningOrganization", versionCapability.properties.name, versionCapability.properties.version, versionCapability.bsrURI));
	
	var promise = wsrrUtils.runGraphQuery(xpath)
	.then(function(data) {
		// should be just one organization
		if(data[0]) {
			var organization = data[0];
			// add directly using organization property
			versionCapability.organization = organization;
		} // don't mind if there is no owning organization
	});
	
	logger.exit("_getOwningOrganization", promise);
	return promise;
}

/*
 * Get owning capability for the version indicated. 
 * Also call _getOwningOrganization to get the owning org for the version
 * and capability.
 * 
 * Add the SLA, version and capability to the overall Data. If no capability, do
 * nothing.
 * 
 * consumingVersion - the consuming version
 * sla - the SLA
 * sldBsrURI - bsrURI of the SLD which the SLA consumes
 * versionBsrURI - version bsrURI which the SLD is on
 * capabilityBsrURI - capability bsrURI which the SLD is on
 * overallData - ttData object
 * configuration - config
 * wsrrUtils - initialized wsrrUtils
 * 
 * Returns Promise which resolves when done, with no data.
 * 
 */
function _getOwningCapabilityForVersion(consumingVersion, sla, sldBsrURI, versionBsrURI, capabilityBsrURI, overallData, configuration, wsrrUtils) {
	logger.entry("_getOwningCapabilityForVersion", consumingVersion, sla, sldBsrURI, versionBsrURI, capabilityBsrURI, overallData, configuration, wsrrUtils);

	// retrieve capability for the version
	var xpath = wsrrQueries.getQueryXPath(wsrrQueries.OwningCapabilityForVersion, configuration);
	xpath = wsrrQueries.resolveInserts(xpath, consumingVersion.bsrURI);

	logger.info(logger.Globalize.formatMessage("flowFetchingOwningCapabilityForVersion", consumingVersion.properties.name, consumingVersion.properties.version, consumingVersion.bsrURI));

	var promise = wsrrUtils.runGraphQuery(xpath)
	.then(function(data) {
		// should be just one capability
		if(data[0]) {
			var capability = data[0];
			
			// now fetch and set the owning org for both version and capability
			var versionOrgPromise = _getOwningOrganization(consumingVersion, configuration, wsrrUtils);
			var capabilityOrgPromise = _getOwningOrganization(capability, configuration, wsrrUtils);
			
			return Promise.all([versionOrgPromise, capabilityOrgPromise]).then(function() {
				// now add to the data
				overallData.addConsumer(sla, consumingVersion, capability, sldBsrURI, versionBsrURI);
			});
		} // otherwise ignore the consumer
	});
	
	logger.exit("_getOwningCapabilityForVersion", promise);
	return promise;
}

/*
 * Get consuming versions for an SLA indicated.
 * The query checks that the owning org of the version has the org name provided in config.
 * Because _getOwningCapabilityForVersion adds the consumer to the metadata, an SLA which
 * has no version is ignored.
 * 
 * Add to the overall Data.
 * For each version, fetch the business capability.
 * 
 * sla - SLA
 * sldBsrURI - bsrURI of the SLD which the SLA consumes
 * versionBsrURI - version bsrURI which the SLD is on
 * capabilityBsrURI - capability bsrURI which the SLD is on
 * overallData - ttData object
 * configuration - config
 * wsrrUtils - initialized wsrrUtils
 * singleSV - if running for a single version (true)
 * 
 * Returns Promise which resolves when done, with no data.
 * 
 */
//TODO: allow multiple owning org names from configuration!
function _getConsumingVersionsForSLA(sla, sldBsrURI, versionBsrURI, capabilityBsrURI, overallData, configuration, wsrrUtils, singleSV) {
	logger.entry("_getConsumingVersionsForSLA", sla, sldBsrURI, versionBsrURI, capabilityBsrURI, overallData, configuration, wsrrUtils, singleSV);

	var xpath = null;
	// if single SV then use the org name and ConsumingVersionsForSLASingleSV
	if(singleSV) {
		xpath = wsrrQueries.getQueryXPath(wsrrQueries.ConsumingVersionsForSLASingleSV, configuration);
		xpath = wsrrQueries.resolveInserts(xpath, sla.bsrURI);
		
		logger.info(logger.Globalize.formatMessage("flowFetchingConsumerVersionsForSLASingleSV", sla.properties.name, sla.bsrURI));
	} else {
		// otherwise use ConsumingVersionsForSLA and the org name
		
		// get org name from utils
		//TODO: allow multiple org names in a different config property
		var orgName = wsrrUtils.getWSRROrg();
		
		// retrieve versions for the SLA
		xpath = wsrrQueries.getQueryXPath(wsrrQueries.ConsumingVersionsForSLA, configuration);
		xpath = wsrrQueries.resolveInserts(xpath, sla.bsrURI, orgName);
		
		logger.info(logger.Globalize.formatMessage("flowFetchingConsumerVersionsForSLA", sla.properties.name, sla.bsrURI, orgName));
	}
	
	var promise = wsrrUtils.runGraphQuery(xpath)
	.then(function(data) {
		var loopPromise = null;
		if(data.length > 0) {
	  		loopPromise = Promise.reduce(data, function(total, version, index, length) {
	  			logger.entry("_getConsumingVersionsForSLA_reduce_callback", total, sla, index, length);
	  			// usually one version for an SLA so don't output a message 
	  			var capabilityPromise = _getOwningCapabilityForVersion(version, sla, sldBsrURI, versionBsrURI, capabilityBsrURI, overallData, configuration, wsrrUtils).then(function(){
		  			logger.entry("_getConsumingVersionsForSLA_reduce_transfer_callback");
		  			// don't actually need the total
	  				logger.exit("_getConsumingVersionsForSLA_reduce_transfer_callback", total);
	  				return total;
	  			});
	  			logger.exit("_getConsumingVersionsForSLA_reduce_callback", capabilityPromise);
	  			return capabilityPromise;
	  		}, 0);
		}
		return loopPromise;		
	});
	
	logger.exit("_getConsumingVersionsForSLA", promise);
	return promise;
}

/*
 * Get consumers for the SLD indicated. Add to the overallData. For each SLA, fetch the versions.
 * 
 * A consumer must be an SLA which references the SLD, and has an owning version, and the version
 * must have an owning capability. 
 *
 * TODO: Should only fetch one object once, if the same object is encountered again, will re-use the already fetched object.
 * 
 * If an error happens, throw it.
 * 
 * sldData - SLD data
 * versionBsrURI - version bsrURI which the SLD is on
 * capabilityBsrURI - capability bsrURI which the SLD is on
 * overallData - ttData object
 * configuration - config
 * wsrrUtils - initialized wsrrUtils
 * singleSV - if running for a single version (true)
 * 
 * Returns Promise which resolves when done, with no data.
 * 
 */
function getConsumersForSLD(sldData, versionBsrURI, capabilityBsrURI, overallData, configuration, wsrrUtils, singleSV){
	logger.entry("getConsumersForSLD", sldData, versionBsrURI, capabilityBsrURI, overallData, configuration, wsrrUtils, singleSV);

	var consumers = [];
	
	var sldBsrURI = sldData.bsrURI;
	
	// retrieve SLAs for the SLD
	var xpath = wsrrQueries.getQueryXPath(wsrrQueries.ConsumingSLAsForSLD, configuration);
	xpath = wsrrQueries.resolveInserts(xpath, sldBsrURI);
	
	logger.info(logger.Globalize.formatMessage("flowFetchingConsumerSLAsForSLD", sldData.properties.name, sldBsrURI));

	var promise = wsrrUtils.runGraphQuery(xpath)
	.then(function(data) {
		var loopPromise = null;
		if(data.length > 0) {
	  		loopPromise = Promise.reduce(data, function(total, sla, index, length) {
	  			logger.entry("getConsumersForSLD_reduce_callback", total, sla, index, length);
	  			logger.info(logger.Globalize.formatMessage("flowProcessingSLA", (index + 1), length, sldData.properties.name, sldBsrURI));
	  			var versionPromise = _getConsumingVersionsForSLA(sla, sldBsrURI, versionBsrURI, capabilityBsrURI, overallData, configuration, wsrrUtils, singleSV).then(function(){
		  			logger.entry("getConsumersForSLD_reduce_transfer_callback");
		  			// don't actually need the total
	  				logger.exit("getConsumersForSLD_reduce_transfer_callback", total);
	  				return total;
	  			});
	  			logger.exit("getConsumersForSLD_reduce_callback", versionPromise);
	  			return versionPromise;
	  		}, 0);
		}
		return loopPromise;		
	});
	
	logger.exit("getConsumersForSLD", promise);
	return promise;
}

/*
 * Validate the consumers object contains the correct fields.
 * 
 * consumersDetails: 1.0.0
 * 
 * consumers: [ {consumer object} ]
 * 
 * consumer object: {
 * 	name: string required
 *  description: string can be empty
 *  clientID: string can be empty
 *  duplicateClientID: string can be empty
 *  planName: string required
 * } 
 * 
 * Parameters:
 * consumers - object.
 * plans - array of valid plan names
 * 
 * Throws an error describing the issue if not valid, else returns nothing.
 * 
 */
function validateConsumersObject(consumers, plans) {
	logger.entry("validateConsumersObject", consumers, plans);
	
	var msgs = [];
	
	if(!consumers.consumersDetails || consumers.consumersDetails !== "1.0.0") {
		msgs.push(logger.Globalize.formatMessage("errorConsumersValidateVersion"));
	}
	
	if(typeof consumers.consumers === "undefined" || consumers.consumers === null || !(consumers.consumers instanceof Array)) {
		msgs.push(logger.Globalize.formatMessage("errorConsumersValidateConsumers"));
	} else {
		// check consumers
		for(var i = 0, len = consumers.consumers.length; i < len; i++) {
			var cons = consumers.consumers[i];
			if(typeof cons.name === "undefined" || cons.name === null || cons.name === "") {
				msgs.push(logger.Globalize.formatMessage("errorConsumersValidateConsumerName", JSON.stringify(cons)));
			}
			if(typeof cons.description === "undefined" || cons.description === null) {
				msgs.push(logger.Globalize.formatMessage("errorConsumersValidateConsumerDescription", JSON.stringify(cons)));
			}
			if(typeof cons.clientID === "undefined" || cons.clientID === null) {
				msgs.push(logger.Globalize.formatMessage("errorConsumersValidateConsumerClientID", JSON.stringify(cons)));
			}
			if(typeof cons.duplicateClientID === "undefined" || cons.duplicateClientID === null) {
				msgs.push(logger.Globalize.formatMessage("errorConsumersValidateConsumerDuplicateClientID", JSON.stringify(cons)));
			}
			if(typeof cons.planName === "undefined" || cons.planName === null || cons.planName === "") {
				msgs.push(logger.Globalize.formatMessage("errorConsumersValidateConsumerPlanName", JSON.stringify(cons)));
			} else {
				// plan name must exist in the plans array
				if(plans.indexOf(cons.planName) === -1) {
					msgs.push(logger.Globalize.formatMessage("errorConsumersValidateConsumerPlanNameInvalid", cons.planName, plans, JSON.stringify(cons)));
				}				
			}
		}
	}

	var msg = null;
	var err = null;
	if(msgs.length === 1) {
		msg = logger.Globalize.formatMessage("errorConsumersValidate", msgs[0]);
		err = new Error(msg);
		logger.exit("validateConsumersObject", err);
		throw err;
	} else if(msgs.length > 1) {
		msg = logger.Globalize.formatMessage("errorConsumersValidateMultiple", msgs.join(" "));
		err = new Error(msg);
		logger.exit("validateConsumersObject", err);
		throw err;
	}
	
	logger.exit("validateConsumersObject");
}

/*
 * Generate the consumers yaml from the data and template, and store in the storage.
 * 
 * plans - array of valid plan names
 * 
 * Returns a promise that resolves with the consumers object when done.
 */
function generateConsumersYaml(bsBsrURI, bsrURI, overallData, plans){
	logger.entry("generateConsumersYaml", bsBsrURI, bsrURI, overallData, plans);
	
	logger.info(logger.Globalize.formatMessage("flowCreatingConsumers"));

	var template = templating.getTemplate(templating.CONSUMERS_PER_VERSION);

	// use product data in case in future we do consumers not per version 
	var productData = overallData.getProductData(bsrURI);
	
	var consumersString = templating.generateStringFromYamlTemplate(template, productData);
	
	var consumersObject = null;
	
	// store string version of yaml for diagnostic
	var promise = ttStorage.storeDiagnosticString(bsBsrURI, bsrURI, consumersString, "consumersFromTemplate.yaml").then(function() {
		logger.entry("generateConsumersYaml_store_diagnostic_callback");
		
		// generate object from the yaml
		consumersObject = templating.generateObjectFromYamlString(consumersString);

		logger.info(logger.Globalize.formatMessage("flowValidatingConsumers"));

		// validate the object has the required fields
		validateConsumersObject(consumersObject, plans);		
		
		logger.info(logger.Globalize.formatMessage("flowStoringConsumers"));
		
		// store the consumers yaml
		var storePromise = ttStorage.storeConsumersYaml(bsBsrURI, bsrURI, consumersObject);
		logger.exit("generateConsumersYaml_store_diagnostic_callback", storePromise);
		return storePromise;
	}).then(function() {
		logger.entry("generateConsumersYaml_store_callback");
		
		// return the object
		
		logger.exit("generateConsumersYaml_store_callback", consumersObject);
		return consumersObject;
	});
	
	logger.exit("generateConsumersYaml", promise);
	return promise;
}

/*
 * Check the consumers Yaml object for duplicate app->product subscriptions.
 * 
 * APIC only allows an app to subscribe to a single plan in a product, you
 * cannot have one app subscribing to multiple plans.
 *
 * consumers - array of consumer objects:
 * {
 * 	name: string required
 *  description: string can be empty
 *  clientID: string can be empty
 *  duplicateClientID: string can be empty
 *  planName: string required
 * }
 *
 * Return a object with:
 * consumers: an array of consumers objects which should be processed.
 * duplicates: an array of consumers objects which should not be processed.
 */
function _checkForDuplicateSubscriptions(consumers){
	logger.entry("_checkForDuplicateSubscriptions", consumers);

	// Given this is for the same product, then there will be a duplicate if
	// the same app name appears more than once. 

	var toDo = {consumers: [], duplicates: []};
	
	var seenAppNames = {};
	
	for(var i = 0, len = consumers.length; i < len; i++) {
		var consumer = consumers[i];
		if(typeof seenAppNames[consumer.name] === "undefined") {
			// not seen already
			toDo.consumers.push(consumer);
			seenAppNames[consumer.name] = true;
		} else {
			toDo.duplicates.push(consumer);
		}
	}
	
	logger.exit("_checkForDuplicateSubscriptions", toDo);
	return toDo;
}

/*
 * Update the app credentials clientID with the value in consumer.clientID.
 *
 * appId - ID of app
 * consumer - consumer object
 * oldClientId - old clientID or null if the app has been created so we do not track this update
 * devOrgId - dev org ID to create in
 * consumersDone - object to track what was done
 * apicdevportal - apic dev portal API module
 *
 * Returns a promise that resolves with the app ID.
 */
function _updateAppCredentials(appId, consumer, oldClientId, devOrgId, consumersDone, apicdevportal) {
	logger.entry("_updateAppCredentials", appId, consumer, oldClientId, devOrgId, consumersDone, apicdevportal);
	
	var promise = apicdevportal.updateApplicationCredentials(appId, consumer.clientID, devOrgId).then(function(credentials){
		logger.entry("_updateAppCredentials_callback", credentials);
		// add to updated apps if needed
		if(oldClientId !== null) {
			consumersDone.updated.push({appID: appId, clientID: oldClientId});
		}
		
		// return app id
		logger.exit("_updateAppCredentials_callback", appId);
		return appId;
	});

	logger.exit("_updateAppCredentials", promise);
	return promise;
}

/*
 * Update the app description with the value in consumer.description.
 *
 * appId - ID of app
 * consumer - consumer object
 * oldDescription - old description
 * devOrgId - dev org ID to update in
 * consumersDone - object to track what was done
 * apicdevportal - apic dev portal API module
 *
 * Returns a promise that resolves with the app ID.
 */
function _updateAppDescription(appId, consumer, oldDescription, devOrgId, consumersDone, apicdevportal) {
	logger.entry("_updateAppDescription", appId, consumer, oldDescription, devOrgId, consumersDone, apicdevportal);
	
	var promise = apicdevportal.updateApplication(appId, consumer.description, devOrgId).then(function(credentials){
		logger.entry("_updateAppDescription_callback", credentials);
		// add to updated apps 
		consumersDone.updated.push({appID: appId, description: oldDescription});
		
		// return app id
		logger.exit("_updateAppDescription_callback", appId);
		return appId;
	});

	logger.exit("_updateAppDescription", promise);
	return promise;
}

/*
 * For an existing app, check the credentials and description against that in consumer.
 * If either is different, update them and log this in consumersDone. Update must be
 * done sequentially.
 * 
 * appId - id of the app that exists
 * app - app details fetched from the apicdevportal
 * devOrgId - dev org ID to create in
 * consumersDone - object to track what was done
 * apicdevportal - apic dev portal API module
 * 
 * Returns a Promise that resolves with the appId when done.
 */
function _updateCredentialsAndDescription(appId, app, consumer, devOrgId, consumersDone, apicdevportal) {
	logger.entry("_updateCredentialsAndDescription", appId, app, consumer, devOrgId, consumersDone, apicdevportal);

	var ret = null;
	// check the clientID matches what we have
	if(consumer.clientID && app.credentials.clientID !== consumer.clientID) {
		// update client ID
		ret = _updateAppCredentials(app.id, consumer, app.credentials.clientID, devOrgId, consumersDone, apicdevportal).then(function(dataId){
			logger.entry("_updateCredentialsAndDescription_update_creds", dataId);
			var ret = null;
			// check the description matches what we have
			if(consumer.description !== app.description) {
				// update description
				ret = _updateAppDescription(appId, consumer, app.description, devOrgId, consumersDone, apicdevportal);
			} else {
				ret = app.id;
			}
			logger.exit("_updateCredentialsAndDescription_update_creds", ret);
			return ret;
		});
	} else if(consumer.description !== app.description) {
		// update description
		ret = _updateAppDescription(appId, consumer, app.description, devOrgId, consumersDone, apicdevportal);
	} else {
		ret = Promise.resolve(app.id);
	}
	
	logger.exit("_updateCredentialsAndDescription", ret);
	return ret;
}

/*
 * Find the app in consumer, or create it if it does not exist.
 * This uses the app name to find the app, and app names are unique in 
 * a developer org.
 * Update the API key if creating or the old key is different.
 * Update the description if the old description is different.
 * Updates consumersDone if an app is created or updated.
 *
 * consumer - consumer object
 * catalog - catalog name to create in
 * devOrgId - dev org ID to create in
 * devOrgName - dev org name to create in
 * consumersDone - object to track what was done
 * apicdevportal - apic dev portal API module
 * 
 * Return a promise that resolves with the app ID.
 */ 
function _makeOrFindApp(consumer, catalog, devOrgId, devOrgName, consumersDone, apicdevportal) {
	logger.entry("_makeOrFindApp", consumer, catalog, devOrgId, devOrgName, consumersDone, apicdevportal);

	var promise = apicdevportal.retrieveApplicationByName(consumer.name, devOrgId).then(function(app){
		logger.entry("_makeOrFindApp_retrieve_callback", app);
		
		var ret = null;
		if(app === null) {
			// need to make the app
			logger.info(logger.Globalize.formatMessage("flowCreatingConsumerInCatalog", consumer.name, catalog, devOrgName));

			ret = apicdevportal.createApplication(consumer.name, consumer.description, devOrgId).then(function(app){
				logger.entry("_makeOrFindApp_create_callback", app);
				// add to created apps
				consumersDone.created.push(app.id);
				consumersDone.appIDToName[app.id] = app.name;
				
				var ret = null;
				if(consumer.clientID && consumer.clientID !== "") {
					// set API key, for now we do not duplicate the app so use the clientID
					ret = _updateAppCredentials(app.id, consumer, null, devOrgId, consumersDone, apicdevportal);
				} else {
					// return the created app ID
					ret = app.id;
				}
				logger.exit("_makeOrFindApp_create_callback", ret);
				return ret;				
			});
		} else {
			// record app name
			consumersDone.appIDToName[app.id] = app.name;
			ret = _updateCredentialsAndDescription(app.id, app, consumer, devOrgId, consumersDone, apicdevportal);
		}
		
		logger.exit("_makeOrFindApp_retrieve_callback", ret);
		return ret;
	});
	
	logger.exit("_makeOrFindApp", promise);
	return promise;
}

/*
 * Subscribe App to Product and Plan.
 * 
 * appId - ID of app
 * productDetails - product details object
 * planName - name of plan
 * devOrgId - dev org ID to create in
 * consumersDone - object to track what was done
 * apicdevportal - apic dev portal API module
 * 
 * Returns Promise that resolves with the subscription created.
 * 
 */
function _subscribeAppToProduct(appId, productDetails, planName, devOrgId, consumersDone, apicdevportal) {
	logger.entry("_subscribeAppToProduct", appId, productDetails, planName, devOrgId, consumersDone, apicdevportal);
	
	var promise = apicdevportal.subscribeApplicationToPlan(appId, devOrgId, productDetails.productName, productDetails.productVersion, planName).then(function(sub){
		logger.entry("_checkAppSubscriptions_subscribe", sub);
		// add as subscribed
		consumersDone.subscriptionsAdded.push({subID: sub.id, appID: appId});
		logger.exit("_checkAppSubscriptions_subscribe", sub);
		return sub;
	});
	
	logger.exit("_subscribeAppToProduct", promise);
	return promise;	
}

/*
 * Check the subscriptions on the app and make one to the product if needed.
 * There needs to be a subscription to the product and plan which matches that 
 * needed in the consumer object. If a subscription does not exist, this will
 * create it. 
 * 
 * If a subscription exists but to the wrong plan then remove the old one and 
 * add a new one.
 *
 * appId - ID of app
 * consumer - consumer object
 * productDetails - product details object
 * catalog - catalog name to create in
 * devOrgId - dev org ID to create in
 * devOrgName - dev org name to create in
 * consumersDone - object to track what was done
 * apicdevportal - apic dev portal API module
 *
 * Returns a promise that resolves with the subscription which corresponds to the entry in consumer. Either created or existing.
 */
function _checkAppSubscriptions(appId, consumer, productDetails, catalog, devOrgId, devOrgName, consumersDone, apicdevportal) {
	logger.entry("_checkAppSubscriptions", appId, consumer, productDetails, catalog, devOrgId, devOrgName, consumersDone, apicdevportal);
	
	var promise = apicdevportal.listApplicationPlanSubscriptions(appId, devOrgId).then(function(subscriptions){
		logger.entry("_checkAppSubscriptions_subscriptions", subscriptions);

		var ret = null;
		
		// look for an existing subscription for the product
		var matchingSub = null;
		for(var i = 0, len = subscriptions.length; i < len; i++) {
			var sub = subscriptions[i];
			if(sub.product.name === productDetails.productName && sub.product.version === productDetails.productVersion) {
				// already have a subscription for this product
				matchingSub = sub;
				break;
			}
		}
		if(matchingSub === null) {
			// create a subscription
			ret = _subscribeAppToProduct(appId, productDetails, consumer.planName, devOrgId, consumersDone, apicdevportal);
		} else if(matchingSub.plan !== consumer.planName) {
			// change the plan the app is subscribed to
			ret = apicdevportal.unsubscribeApplicationFromPlan(appId, matchingSub.id, devOrgId).then(function(){
				logger.entry("_checkAppSubscriptions_unsubscribe");
				// track removal
				consumersDone.subscriptionsDeleted.push({planName: matchingSub.plan, productID: matchingSub.product.id, appID: appId});
				// subscribe to correct plan
 				var subPromise = _subscribeAppToProduct(appId, productDetails, consumer.planName, devOrgId, consumersDone, apicdevportal);
 				
 				logger.exit("_checkAppSubscriptions_unsubscribe", subPromise);
 				return subPromise;
			});
		} else {
			// do nothing the app is already subscribed
			ret = matchingSub;
		}
		
		logger.exit("_checkAppSubscriptions_subscriptions", ret);
		return ret;
	});

	logger.exit("_checkAppSubscriptions", promise);
	return promise;
}

/*
 * Remove the subscriptions.
 * 
 * subscriptions - array of subscription objects from listSubscriptionsForProduct
 * devOrgId - dev org ID to create in
 * consumersDone - object to track what was done
 * apicdevportal - apic dev portal API module
 *
 * Returns a promise that resolves with consumersDone once done.
 */
function _removeSubscriptions(subscriptions, devOrgId, consumersDone, apicdevportal, catalog, devOrgName) {
	logger.entry("_removeSubscriptions", subscriptions, devOrgId, consumersDone, apicdevportal, catalog, devOrgName);

	var loopPromise = Promise.reduce(subscriptions, function(total, subscription, index, length) {
		logger.entry("_removeSubscriptions_reduce", total, subscription, index, length);
		logger.info(logger.Globalize.formatMessage("flowRemovingSubscriptionInCatalog", subscription.app.name, subscription.product.name, subscription.product.version, catalog, devOrgName));
		var promise = apicdevportal.unsubscribeApplicationFromPlan(subscription.app.id, subscription.id, devOrgId).then(function(){
			logger.entry("_removeSubscriptions_unsubscribe");
			
			total.subscriptionsDeleted.push({planName: subscription.plan, productID: subscription.product.id, appID: subscription.app.id});

			logger.exit("_removeSubscriptions_unsubscribe");
			return total;
		});
		
		logger.exit("_removeSubscriptions_reduce", promise);
		return promise;	
	}, consumersDone);

	logger.exit("_removeSubscriptions", loopPromise);
	return loopPromise;
}

/*
 * Check subscriptions on the product and remove any that are not listed in the consumers.
 * Which means the app name is listed and the plan matches.
 * 
 * consumers - array of consumer objects
 * productDetails - product details object
 * catalog - catalog name to create in
 * devOrgId - dev org ID to create in
 * devOrgName - dev org name to create in
 * consumersDone - object to track what was done
 * apicdevportal - apic dev portal API module
 *
 * Returns a promise that resolves with nothing.
 * Throws if the product cannot be found.
 */
function _reconciliateProductSubscriptions(consumers, productDetails, catalog, devOrgId, devOrgName, consumersDone, apicdevportal) {
	logger.entry("_reconciliateProductSubscriptions", consumers, productDetails, catalog, devOrgId, devOrgName, consumersDone, apicdevportal);
	
	var prod = null;
	// fetch product
	var promise = apicdevportal.retrieveProductByName(productDetails.productName, productDetails.productVersion, devOrgId).then(function(product){
		logger.entry("_reconciliateProductSubscriptions_retrieve_callback", product);
		if(product === null){
			// error product not found
			var msg = logger.Globalize.formatMessage("flowErrorProductNotFound", productDetails.productName, productDetails.productVersion, catalog, devOrgName);
			logger.error(msg);
			var err = new Error(msg);
			
			logger.exit("_reconciliateProductSubscriptions", err);
			throw err;
		}
		prod = product;
		
		// fetch product subscriptions
		var fetchPromise = apicdevportal.listSubscriptionsForProduct(product.id, devOrgId);
		
		logger.exit("_reconciliateProductSubscriptions_retrieve_callback", fetchPromise);
		return fetchPromise;
	}).then(function(subscriptions){
		logger.entry("_reconciliateProductSubscriptions_retrieve_subscriptions_callback", subscriptions);
		
		// for each entry in the subscriptions there should be one in consumers else add to remove list
		var toRemove = [];
		for(var i = 0, len = subscriptions.length; i < len; i++) {
			var subAppName = subscriptions[i].app.name;
			var subPlanName = subscriptions[i].plan;
			
			var found = false;
			for(var j = 0, consumersLen = consumers.length; j < consumersLen; j++) {
				if(consumers[j].name === subAppName && consumers[j].planName === subPlanName) {
					found = true;
					break;
				}
			}
			if(found === false) {
				// did not find, remove
				toRemove.push(subscriptions[i]);
			}
		}
		
		var ret = null;
		// now remove the subscriptions we need to
		if(toRemove.length > 0) {
			logger.info(logger.Globalize.formatMessage("flowRemovingSubscriptionsInCatalog", productDetails.productName, productDetails.productVersion, catalog, devOrgName));
			
			ret = _removeSubscriptions(toRemove, devOrgId, consumersDone, apicdevportal, catalog, devOrgName);
		} else {
			ret = "";
		}
		logger.exit("_reconciliateProductSubscriptions_retrieve_subscriptions_callback", ret);
		return ret;
	});
	
	logger.exit("_reconciliateProductSubscriptions", promise);
	return promise;
}

/*
 * Reconciliate the applications on the catalog with the applications in the consumersObject.
 * 
 * This means create the application if it does not exist, set the API key if specified, 
 * create the subscriptions to the product specified.
 * Remove subscriptions that are not listed for the product, because we assume we only process
 * consumers for a product once and this is that once. We assume the transfer tool is
 * managing consumers for the application. If someone else has created a subscription manually
 * then this will be removed.
 * 
 * If the same app is subscribing to the same API on two plans, APIC does not support this. So
 * the code will need to detect this and log a warning and only make the first subscription.
 * 
 * consumersObject - consumers Yaml object
 * catalog - catalog name to create in
 * productDetails - product details object with productName and productVersion properties.
 * devOrgId - dev org ID to create in
 * devOrgName - dev org name for logging
 * resultsObj - map of catalog name to consumersDone object. Add and update as we do work.
 * apicdevportal - apic dev portal API module set to the catalog and dev org
 * 
 * Returns promise which resolves with nothing. 
 * 
 * The "consumersDone" object contains details of what was done so we can roll back:
 * 
 * {
 * 	created: [ id of any created applications, ...]
 *  updated: [ {appID: id of the app, clientID: old client ID (OR) description: old client description} ]
 *  subscriptionsAdded: [ {subID: id of any created subscriptions, appID: id of the app}, ...]
 *  subscriptionsDeleted: [ {planName: plan name, productID: id of the product, appID: id of the app}, ...]
 *  appIDToName: { appID: app name, appID2: app name 2 }
 * }
 */
function _reconciliateConsumers(consumersObject, catalog, productDetails, devOrgId, devOrgName, resultsObj, apicdevportal) {
	logger.entry("_reconciliateConsumers", consumersObject, catalog, productDetails, devOrgId, devOrgName, resultsObj, apicdevportal);

	logger.info(logger.Globalize.formatMessage("flowProcessingConsumers", productDetails.productName, productDetails.productVersion, catalog, devOrgName));
	
	// first process consumersObject to spot duplicate app->product subscriptions and remove the ones we won't do
	var toMake = _checkForDuplicateSubscriptions(consumersObject.consumers);

	// log warning for ignored consumers
	for(var i = 0, len = toMake.duplicates.length; i < len; i++) {
		var dup = toMake.duplicates[i];
		logger.info(logger.Globalize.formatMessage("flowDuplicateConsumer", dup.name, productDetails.productName, dup.planName, catalog));
	}

	var consumersDone = {
		created: [],
		updated: [],
		subscriptionsAdded: [],
		subscriptionsDeleted: [],
		appIDToName: {}
	};

	// add to results now
	resultsObj[catalog] = consumersDone;
	resultsObj._doneCatalogs.push(catalog);
	
	// first create apps for each app and then make subscription detailed, or look it up and make subscription, or find the sub exists so do nothing
	var loopPromise = Promise.reduce(toMake.consumers, function(total, consumer, index, length) {
		logger.entry("_reconciliateConsumers_reduce_callback", total, consumer, index, length);

		var appPromise = _makeOrFindApp(consumer, catalog, devOrgId, devOrgName, consumersDone, apicdevportal).then(function(appId){
			logger.entry("_reconciliateConsumers_makeOrFindApp", appId);
			
			// check subscriptions on the app, make one if needed
			var checkPromise = _checkAppSubscriptions(appId, consumer, productDetails, catalog, devOrgId, devOrgName, consumersDone, apicdevportal);
			
			logger.exit("_reconciliateConsumers_makeOrFindApp", checkPromise);
			return checkPromise;
		}).then(function(){
			logger.entry("_reconciliateConsumers_checkAppSubscriptions");
			// return total

			logger.exit("_reconciliateConsumers_checkAppSubscriptions", total);
			return total;
		});
		
		logger.exit("_reconciliateConsumers_reduce_callback", appPromise);
		return appPromise;
	}, consumersDone).then(function(total){
		// then after all apps processed, look at the product and compare the subs against the list and delete any that are extra
		logger.entry("_reconciliateConsumers_reduce_end", total);
		
		var productPromise = _reconciliateProductSubscriptions(toMake.consumers, productDetails, catalog, devOrgId, devOrgName, consumersDone, apicdevportal);
		
		logger.exit("_reconciliateConsumers_reduce_end", productPromise);
		return productPromise;
	}).then(function() {
		logger.entry("_reconciliateConsumers_product_subscriptions");

		logger.exit("_reconciliateConsumers_product_subscriptions");
	});	
	
	logger.exit("_reconciliateConsumers", loopPromise);
	return loopPromise;
}

/*
 * Undo consumers work in the catalog because something went wrong.
 * 
 * For each entry in the toRemove object, do the work to undo what is done.
 * If anything goes wrong log it and continue. Remove successful undos from
 * toRemove. 
 *
 * Ensure what is in toRemove represents what is left, if an error happens.
 * 
 * Process one-by-one in case we update the same object twice at once.
 *
 * Returns a Promise that resolves with nothing when done.
 * If something goes wrong, log this and continue on the list.
 * 
 * catalog: name of catalog for messages
 * toRemove: consumers done details which is returned from _reconciliateConsumers() for a single catalog
 * apicdevportal: APIC dev portal API module
 * 
 */
function _undoConsumersFromCatalog(catalog, toRemove, devOrgId, apicdevportal) {
	logger.entry("_undoConsumersFromCatalog", catalog, toRemove, devOrgId, apicdevportal);

/*
 *  * {
 * 	created: [ id of any created applications, ...]
 *  updated: [ {appID: id of the app, clientID: old client ID (OR) description: old client description} ]
 *  subscriptionsAdded: [ {subID: id of any created subscriptions, appID: id of the app}, ...]
 *  subscriptionsDeleted: [ {planName: plan name, productID: id of the product, appID: id of the app}, ...]
 *  appIDToName: { appID: app name, appID2: app name 2 }
 * }

 * 
 */ 	

	// make array of work to reduce over, each object {type: subscriptionsDeleted|subscriptionsAdded|updated|created, 
	// 	data: entry from array for that type}
	var work = [];
	var i, len;
	// subs deleted
	for(i = 0, len = toRemove.subscriptionsDeleted.length; i< len; i++) {
		work.push({type:"subscriptionsDeleted", data: toRemove.subscriptionsDeleted[i]});
	}
	// subs added
	for(i = 0, len = toRemove.subscriptionsAdded.length; i< len; i++) {
		work.push({type:"subscriptionsAdded", data: toRemove.subscriptionsAdded[i]});
	}
	// updated
	for(i = 0, len = toRemove.updated.length; i< len; i++) {
		work.push({type:"updated", data: toRemove.updated[i]});
	}
	// created
	for(i = 0, len = toRemove.created.length; i< len; i++) {
		work.push({type:"created", data: toRemove.created[i]});
	}

	// now reduce over the work list and process each
	var total = {};
	var loopPromise = Promise.reduce(work, function(total, workItem, index, length) {
		logger.entry("_undoConsumersFromCatalog_reduce_callback", total, workItem, index, length);

		var i, len;
		var promise = null;
		switch(workItem.type) {
			case "subscriptionsDeleted":
				// re-add subscription
				// data: {planName: plan name, productID: id of the product, appID: id of the app}
				logger.info(logger.Globalize.formatMessage("flowErrorCleaningUpUndoSubscriptionDelete", toRemove.appIDToName[workItem.data.appID]));				
				promise = apicdevportal.subscribeApplicationToPlanAndProductID(workItem.data.appID, devOrgId, workItem.data.productID, workItem.data.planName).then(function(){
					logger.entry("_undoConsumersFromCatalog_subscription_undelete");
					for(i = 0, len = toRemove.subscriptionsDeleted.length; i < len; i++) {
						if(toRemove.subscriptionsDeleted[i] === workItem.data) {
							// remove
							toRemove.subscriptionsDeleted.splice(i, 1);
							break;
						}
					}
					
					logger.exit("_undoConsumersFromCatalog_subscription_undelete");
				});
				
			break;
			case "subscriptionsAdded":
				// delete subscription
				// data: {subID: id of any created subscriptions, appID: id of the app}
				logger.info(logger.Globalize.formatMessage("flowErrorCleaningUpUndoSubscriptionCreate", toRemove.appIDToName[workItem.data.appID]));
				
				promise = apicdevportal.unsubscribeApplicationFromPlan(workItem.data.appID, workItem.data.subID, devOrgId).then(function(){
					logger.entry("_undoConsumersFromCatalog_subscription_uncreate");

					for(i = 0, len = toRemove.subscriptionsAdded.length; i < len; i++) {
						if(toRemove.subscriptionsAdded[i] === workItem.data) {
							// remove 
							toRemove.subscriptionsAdded.splice(i, 1);
							break;
						}
					}

					logger.exit("_undoConsumersFromCatalog_subscription_uncreate");
				});
				
			break;
			case "updated":
				// update to old values
				// data: {appID: id of the app, clientID: old client ID (OR) description: old client description}

				var updatePromise = null;
				if(workItem.data.clientID) {
					// update client ID
					logger.info(logger.Globalize.formatMessage("flowErrorCleaningUpUndoSubscriptionUpdateClientID", toRemove.appIDToName[workItem.data.appID]));				
					
					updatePromise = apicdevportal.updateApplicationCredentials(workItem.data.appID, workItem.data.clientID, devOrgId);
				} else if(workItem.data.description){
					// update description
					logger.info(logger.Globalize.formatMessage("flowErrorCleaningUpUndoSubscriptionUpdateDescription", toRemove.appIDToName[workItem.data.appID]));				
					
					updatePromise = apicdevportal.updateApplication(workItem.data.appID, workItem.data.description, devOrgId);
				} else {
					// else error should be clientID or description
					throw new Error("Should have clientID or description in: " + workItem.data);
				}
				
				promise = updatePromise.then(function(){
					logger.entry("_undoConsumersFromCatalog_unupdate");
					
					for(i = 0, len = toRemove.updated.length; i < len; i++) {
						if(toRemove.updated[i] === workItem.data) {
							// remove 
							toRemove.updated.splice(i, 1);
							break;
						}
					}
					
					logger.exit("_undoConsumersFromCatalog_unupdate");
				});
				
			break;
			case "created":
				// delete app
				// data: string id of created application
				logger.info(logger.Globalize.formatMessage("flowErrorCleaningUpUndoSubscriptionAppCreate", toRemove.appIDToName[workItem.data]));				

				promise = apicdevportal.deleteApplication(workItem.data, devOrgId).then(function(){
					logger.entry("_undoConsumersFromCatalog_uncreate");
					
					for(i = 0, len = toRemove.created.length; i < len; i++) {
						if(toRemove.created[i] === workItem.data) {
							// remove 
							toRemove.created.splice(i, 1);
							break;
						}
					}
					
					logger.exit("_undoConsumersFromCatalog_uncreate");
				});				
				
			break;
		}

		// return total at the end of the promise chain
		var totalPromise = promise.then(function(){
			logger.entry("_undoConsumersFromCatalog_work_end");
			
			logger.exit("_undoConsumersFromCatalog_work_end", total);
			return total;
		}).caught(function(error){
			logger.entry("_undoConsumersFromCatalog_work_error", error);
			// log any errors and continue
			
			logger.error(error, error);
			logger.info(logger.Globalize.formatMessage("flowErrorCleaningUpUndoSubscriptionError", error.toString()));
			
			logger.exit("_undoConsumersFromCatalog_work_error", total);
			return total;
		});
		
		logger.exit("_undoConsumersFromCatalog_reduce_callback", totalPromise);
		return totalPromise;		
	}, total);

	logger.exit("_undoConsumersFromCatalog", loopPromise);
	return loopPromise;
}

/*
 * Undo consumers work in the catalogs because something went wrong. 
 * 
 * For each entry in the allConsumersDone object, do the work to undo what is done.
 * If anything goes wrong log it and continue. 
 *
 * Ensure what is in allCustomersDone represents what is left, if an error happens.
 *
 * Returns a Promise that resolves with nothing when done.
 * 
 * allConsumersDone: object with properties of catalog name to "consumersDone" object (which is returned from _reconciliateConsumers()) and property _doneCatalogs which is an array with strings of catalog names.
 * catalogToDevOrg: map of catalog name to devorg name
 * apicdevportal: APIC dev portal API module
 */
function _undoConsumersFromCatalogs(allConsumersDone, catalogToDevOrg, apicdevportal) {
	logger.entry("_undoConsumersFromCatalogs", allConsumersDone, catalogToDevOrg, apicdevportal);

	var undone = {};
	
	var loopPromise = Promise.reduce(allConsumersDone._doneCatalogs, function(total, catalog, index, length) {
		logger.entry("_undoConsumersFromCatalogs_reduce_callback", total, catalog, index, length);

		// check if there is any work to do
		var toRemove = allConsumersDone[catalog];
		var returnValue = null;
		if(toRemove.created.length > 0 || toRemove.updated.length > 0 || toRemove.subscriptionsAdded.length > 0 || toRemove.subscriptionsDeleted.length > 0) {
			// do work
			var devOrgName = catalogToDevOrg[catalog];
			var devOrgId = null;
	
			logger.info(logger.Globalize.formatMessage("flowErrorCleaningUpConsumersInCatalogSpecific", catalog, devOrgName));
	
			// set up the portal module
			apicdevportal.setDeveloperOrganizationName(devOrgName);
			apicdevportal.setCatalog(catalog);
			
			// fetch dev org Id
			returnValue = apicdevportal.getDeveloperOrganizationIdOfConfigured().then(function(orgId) {
				logger.entry("_undoConsumersFromCatalogs_reduce_getorgid_callback", orgId);
				devOrgId = orgId;
	
				var removePromise = _undoConsumersFromCatalog(catalog, toRemove, devOrgId, apicdevportal);
				logger.exit("_undoConsumersFromCatalogs_reduce_getorgid_callback", removePromise);
				return removePromise;
			}).then(function(){
				logger.entry("_undoConsumersFromCatalogs_reduce_undone");
				
				// have to return total
				
				logger.exit("_undoConsumersFromCatalogs_reduce_undone", total);
				return total;
			});
		} else {
			// directly return total
			returnValue = total;
		}
		
		logger.exit("_undoConsumersFromCatalogs_reduce_callback", returnValue);
		return returnValue;
	}, undone).then(function(total){
		logger.entry("_undoConsumersFromCatalogs_reduce_done", total);
	
		logger.exit("_undoConsumersFromCatalogs_reduce_done");
	});
	
	logger.exit("_undoConsumersFromCatalogs", loopPromise);
	return loopPromise;
}

/*
 * Create consumers in the catalogs in the configuration for the product and service version.
 * 
 * Creates Applications in the catalog developer portal for the developer org detailed in the configuration 
 * map of catalog to developer org.
 * 
 * Then subscribes the applications to the products and plans detailed in the consumers.yaml file for
 * the service version.
 * 
 * If anything goes wrong, attempts to delete all applications that were created for the product. Unless 
 * we added a new subscription to an application, then remove the subscription we created. If anything
 * goes wrong cleaning up just log it. Then throws an error after clean up.
 * 
 * The calling code must then delete the product from the catalog if needed.
 * 
 * bsBsrURI - business service bsrURI
 * bsrURI - service version bsrURI
 * consumersObject - consumers YAML object, already validated. Has product and plan details.
 * productDetails - product details object with productName and productVersion properties.
 * apicdevportal - api dev portal module
 * apiCli - api cli module
 * 
 * Returns a Promise that resolves with an object with keys of the catalog name and value of a consumersDone object.
 * Throws an error if something goes wrong, after trying to clean up.
 */
function createConsumersInCatalogs(bsBsrURI, bsrURI, consumersObject, productDetails, apicdevportal, apiCli) {
	logger.entry("createConsumersInCatalogs", bsBsrURI, bsrURI, consumersObject, productDetails, apicdevportal, apiCli);

	// get details - catalogs
	var catalogs = apiCli.getPublishCatalogs();
	
	// get dev orgs
	var catalogToDevOrg = apiCli.getCatalogToDevOrg();

	var resultsObj = {
			_doneCatalogs: []
	};

	// Do one by one to make the process clearer, and allow for rollbacks.
	var loopPromise = Promise.reduce(catalogs, function(total, catalog, index, length) {
		logger.entry("createConsumersInCatalogs_reduce_callback", total, catalog, index, length);
		
		logger.info(logger.Globalize.formatMessage("flowCreatingConsumersInCatalog", catalog));

		var devOrgName = catalogToDevOrg[catalog];
		var devOrgId = null;

		// set up the portal module
		apicdevportal.setDeveloperOrganizationName(devOrgName);
		apicdevportal.setCatalog(catalog);
		
		// fetch dev org Id
		var consumersPromise = apicdevportal.getDeveloperOrganizationIdOfConfigured().then(function(orgId) {
			logger.entry("createConsumersInCatalogs_reduce_getorgid_callback", orgId);
			devOrgId = orgId;
			
			var reconciliatePromise = _reconciliateConsumers(consumersObject, catalog, productDetails, devOrgId, devOrgName, resultsObj, apicdevportal);
			logger.exit("createConsumersInCatalogs_reduce_getorgid_callback", reconciliatePromise);
			return reconciliatePromise;
		}).then(function(){
  			logger.entry("createConsumersInCatalogs_reduce_publish_callback");

  			logger.info(logger.Globalize.formatMessage("flowCreatedConsumersInCatalog", catalog));

  			logger.exit("createConsumersInCatalogs_reduce_publish_callback", total);
  			return total;
		}).caught(function(error) {
			logger.entry("createConsumersInCatalogs_reduce_create_error", error.toString());

			// error on this catalog, log and add catalog, then throw so the reduce can catch
			
			logger.error(logger.Globalize.formatMessage("flowErrorCreatingConsumersInCatalog", catalog));

			if(error instanceof Error) {
				// add failing catalog
				error.catalog = catalog;
			} else {
				// need an Error so we can add the catalog that failed
				var error2 = new Error(error);
				error2.catalog = catalog;
				error = error2;
			}

			// now throw
			logger.exit("createConsumersInCatalogs_reduce_create_error", error);
			throw error;
		});
		
		logger.exit("createConsumersInCatalogs_reduce_callback", consumersPromise);
		return consumersPromise;
	}, resultsObj).then(function(total){
		logger.entry("createConsumersInCatalogs_reduce_done", total);
		
		// remove _doneCatalogs
		delete total._doneCatalogs;
		
		logger.exit("createConsumersInCatalogs_reduce_done", total);
		return total;
	}).caught(function(error) {
		logger.entry("createConsumersInCatalogs_create_error", error.toString());

		// error on one of the catalogs, undo everything
		var ret = null;
		if(resultsObj._doneCatalogs.length > 0) {
			logger.info(logger.Globalize.formatMessage("flowErrorCleaningUpConsumersInCatalog"));

			ret = _undoConsumersFromCatalogs(resultsObj, catalogToDevOrg, apicdevportal).then(function() {
				logger.entry("createConsumersInCatalogs_reduce_create_error_delete_callback");
				
				logger.info(logger.Globalize.formatMessage("flowErrorFinishedCleaningUpConsumersInCatalog"));
				// now throw the error
				
				logger.exit("createConsumersInCatalogs_reduce_create_error_delete_callback", error);
				throw error;
			});
		} else {
			// throw the error
			logger.exit("createConsumersInCatalogs_reduce_create_error", error);
			throw error;
		}		
		logger.exit("createConsumersInCatalogs_reduce_create_error", ret);
		return ret;
	});
	
	logger.exit("publishProductToCatalogs", loopPromise);
	return loopPromise;
}

module.exports = {
		getConsumersForSLD: getConsumersForSLD,
		generateConsumersYaml: generateConsumersYaml,
		validateConsumersObject: validateConsumersObject,
		createConsumersInCatalogs: createConsumersInCatalogs,
		
		// for testing only
		_test_checkForDuplicateSubscriptions: _checkForDuplicateSubscriptions,
		_test_updateAppCredentials: _updateAppCredentials,
		_test_subscribeAppToProduct: _subscribeAppToProduct,
		_test_checkAppSubscriptions: _checkAppSubscriptions,
		_test_makeOrFindApp: _makeOrFindApp,
		_test_updateAppDescription: _updateAppDescription,
		_test_updateCredentialsAndDescription: _updateCredentialsAndDescription,
		_test_reconciliateProductSubscriptions: _reconciliateProductSubscriptions,
		_test_removeSubscriptions: _removeSubscriptions,
		_test_reconciliateConsumers: _reconciliateConsumers,
		_test_undoConsumersFromCatalog: _undoConsumersFromCatalog,
		_test_undoConsumersFromCatalogs: _undoConsumersFromCatalogs
		
};
