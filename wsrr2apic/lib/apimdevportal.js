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
 * API Connect Developer Portal REST API library.
 * 
 * Uses Promises to resolve when the calls finish.
 */

'use strict';

var logger=require("../lib/Logger"), Promise = require('bluebird'), url = require('url'), _ = require('lodash'), retry = require('retry');
var https = require('https'), apicUrlUtils = require('./APIC/apicUrlUtils');

//connection details
var apiDeveloperUsername;
var apiDeveloperPassword;
var apiDeveloperOrgName;
var apicVersion;

var apicServer;
var apicPort;
var apicUrl;
var apicPOrg;
var apicCatalog;

var baseConnectionOptions;
var retries = 5;
//Timeouts define how long between attempts should be waited not the amount of
//time for each attempt. The default can produce a max of 5 minutes, though is
//more likely to produce 2 minutes of retries
//Timeouts in Milliseconds
var minTimeout = 1 * 1000;
var maxTimeout = 60 * 1000 * 3;
var randomize = true;

//timeout for all requests
var requestTimeout = 300000;
/*
 * Call before using the module, sets up the connection from the properties, which should
 * be an object containing key:value pairs.
 * Sets the config to the catalog identifier URL in the configuration, which sets the hostname and port.
 * Other config sets the developer org id and the "Hostname for Developer Portal API Calls".
 * All functions are directed to this dev org and hostname, which is why there are no options to specify them on the calls.
 * 
 * If required settings are missing, throws an Error.
 */
function setConnectionDetails(connectionProperties) {
	logger.entry("apimdevportal.setConnectionDetails", connectionProperties);

	apiDeveloperUsername = connectionProperties.apiDeveloperUsername;
	apiDeveloperPassword = connectionProperties.apiDeveloperPassword;
	apiDeveloperOrgName = connectionProperties.apiDeveloperOrgName;

	// get version in case we need different behaviour in future
	apicVersion = connectionProperties.apiVersion;

	// get identifier 
	apicUrl = connectionProperties.apiIdentifier;

	// check configuration
	if(!apiDeveloperUsername || !apiDeveloperPassword || !apiDeveloperOrgName || !apicVersion || !apicUrl) {
		var message = logger.Globalize.formatMessage("apicDevPortalMissingConfiguration");
		var e = new Error(message);
		logger.error(e);
		throw e;
	}
	
	// get server etc from identifier
	apicServer = apicUrlUtils.getHostFromApicUrl(apicUrl);
	apicPort = apicUrlUtils.getPortFromApicUrl(apicUrl);
	apicPOrg = apicUrlUtils.getPOrgFromApicUrl(apicUrl);
	apicCatalog = apicUrlUtils.getCatalogFromApicUrl(apicUrl);
	
	baseConnectionOptions = {
		hostname : apicServer,
		port : apicPort,
		method : 'GET',
		agent : false,
		rejectUnauthorized : false,
		auth : apiDeveloperUsername + ':' + apiDeveloperPassword,
		headers: {}
	};
	
	// set details of developer portal in the headers
	baseConnectionOptions.headers["X-IBM-APIManagement-Context"] = apicPOrg + "." + apicCatalog;
	
	logger.exit("apimdevportal.setConnectionDetails");
}

/*
 * Send request to APIC as application/json. Parse the response as application/json into 
 * an object.
 * 
 * connectionOptions - options to clone and pass to connection.request (contains url etc)
 * requestData - data to send on the request, should be a string. optional.
 * 
 * Returns Promise which resolves with the response javascript object.
 */
function _sendRequestToAPIC(connectionOptions, requestData) {
	var tConnectionOptions = _.cloneDeep(connectionOptions);
	tConnectionOptions.auth=tConnectionOptions.auth.split(":")[0]+":********";
	logger.entry("apimdevportal._sendRequestToAPIC", tConnectionOptions, requestData);

	var options = _.cloneDeep(connectionOptions);

	var length = "0";
	if(requestData) {
		length = requestData.length.toString();
	}
	
	// set content length header and type
	options.headers["Content-Type"] = "application/json";
	options.headers["Content-Length"] = length;
	
	var promise = new Promise(function(resolve, reject) {
		var operation = retry.operation({
			retries : retries,
			factor : 3,
			minTimeout : minTimeout,
			maxTimeout : maxTimeout,
			randomize : randomize,
		});
		operation.attempt(function(currentAttempt) {
			var req = https.request(options, function(res) {
				res.setEncoding('utf-8');
				var responseString = '';

				res.on('data', function(data) {
					if (logger.Debug) {
						logger.debug(data);
					}
					responseString += data;
				});

				res.on('end', function() {
					logger.entry("apimdevportal._sendRequestToAPIC_end",
							res.statusCode);

					if (logger.Debug) {
						logger.debug(responseString);
					}
					if (responseString.length > 0) {
						logger.debug(responseString);
					}

					// check the status code
					var status = res.statusCode;
					// deal with non-good return codes. 100 and 200 are ok, 300
					// is redirect and 400 or 500 are bad.
					// but we will not deal with redirects for now.
					var statusNumber = parseInt(status);
					if (isNaN(statusNumber) || statusNumber >= 300) {
						// bad HTTP response code
						logger.error(logger.Globalize.formatMessage(
								"badHTTPcode", status));
						logger.error(responseString);
						reject(responseString);
					} else {
						// parse response to javascript object if there is one
						var responseObject = null;
						if (responseString.length > 0) {
							try {
								responseObject = JSON.parse(responseString);
							} catch (e) {
								logger.error(logger.Globalize
										.formatMessage("responseParseError"));
								logger.error(e);
								reject(e);
							}
						}
						resolve(responseObject);
					}
					logger.exit("apimdevportal._sendRequestToAPIC_end");
				});
			});

			if (length > 0) {
				req.write(requestData);
			}
			req.setTimeout(requestTimeout, function() {
				var msg = logger.Globalize.formatMessage("apicdevportaltimeout",
						requestTimeout);
				var e = new Error(msg);
				logger.error(e);
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
						logger.warn(logger.Globalize.formatMessage("connectionfailedretry",connectionOptions.hostname,currentAttempt-1,retries));
					}else if(retries>0){
						logger.warn(logger.Globalize.formatMessage("connectionfailedfirst",connectionOptions.hostname));						
					}
					return;
				}else{
					logger.error(logger.Globalize.formatMessage("connectionfailedend",connectionOptions.hostname));
					logger.error(e);					
				}								
			});
		});
	});

	logger.exit("apimdevportal._sendRequestToAPIC", promise);
	return promise;
}

/*
 * List the applications for the organization.
 *
 * apiDeveloperOrgId - ID of the developer organization
 *
 * Returns a promise that resolves with a list of applications, data for /v1/portal/orgs/{orgID}/apps
 * See http://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/methods/rest_op_portal_orgs__orgID__appsGET.html
 * 
 */
function listApplications(apiDeveloperOrgId) {
	logger.entry("apimdevportal.listApplications", apiDeveloperOrgId);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/apps';

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "GET";
	options.path = uri;
	
	var promise = _sendRequestToAPIC(options, null);
	
	logger.exit("apimdevportal.listApplications", promise);
	return promise;
}

/*
 * Retrieve an application by Name.
 * 
 * This has to retrieve all applications then match the name against the name field.
 * 
 * name - full name of the application
 * apiDeveloperOrgId - ID of the developer organization
 *
 * App names are unique in a developer org.
 *
 * Returns a promise that resolves to the application data if found, see 
 * http://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/methods/rest_op_portal_orgs__orgID__apps__appID_GET.html
 * 
 * Returns null if the application is not found.
 * 
 */
function retrieveApplicationByName(name, apiDeveloperOrgId) {
	logger.entry("apimdevportal.retrieveApplicationByName", name, apiDeveloperOrgId);
	
	var promise = listApplications(apiDeveloperOrgId).then(function(applications){
		logger.entry("apimdevportal.retrieveApplicationByName_applications", applications);
		var app = null;
		for(var i = 0; i < applications.length; i++) {
			if(applications[i].name === name) {
				app = applications[i];
				break;
			}
		}
		logger.exit("apimdevportal.retrieveApplicationByName_applications", app);
		return app;
	});

	logger.entry("apimdevportal.retrieveApplicationByName", promise);
	return promise;
}

/*
 * Create an application in the developer organization set on the connection details.
 * 
 * name - name of the application
 * description - description of the application
 * apiDeveloperOrgId - id of the developer org, of the form "573c6672e4b0fe43584c367b", NOT the name
 * 
 * Returns Promise that resolves with:
 * {
 * 	 id: id of app
 *   credentials: { clientID: secret, clientSecret: secret }
 * }
 * Return data from POST /v1/portal/orgs/{orgID}/apps
 * See http://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/methods/rest_op_portal_orgs__orgID__appsPOST.html
 * 
 */
function createApplication(name, description, apiDeveloperOrgId) {
	logger.entry("apimdevportal.createApplication", name, description, apiDeveloperOrgId);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/apps';

	var content = {
		"name": name,
		"description": description,
		"oauthRedirectURI": "",
		"credentials": {
			"description": "",
			"clientSecret": true,
			"clientID": true
		},
		"public": true
	};

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "POST";
	options.path = uri;
	var contentString = JSON.stringify(content);
	
	var promise = _sendRequestToAPIC(options, contentString);
	
	logger.exit("apimdevportal.createApplication", promise);
	return promise;
}

/*
 * Delete an application.
 * 
 * id - application id
 * apiDeveloperOrgId - id of the developer org, of the form "573c6672e4b0fe43584c367b", NOT the name
 *
 * Returns Promise that resolves when the app is deleted. Rejects if the app did not exist or something went wrong.
 * 
 */
function deleteApplication(applicationId, apiDeveloperOrgId) {
	logger.entry("apimdevportal.deleteApplication", applicationId, apiDeveloperOrgId);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/apps/' + encodeURIComponent(applicationId);

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "DELETE";
	options.path = uri;
	
	var promise = _sendRequestToAPIC(options, null);
	
	logger.exit("apimdevportal.deleteApplication", promise);
	return promise;
}

/*
 * Update the application credentials by changing the client ID.
 * 
 * id - application id
 * clientId - new client ID
 * apiDeveloperOrgId - id of the developer org, of the form "573c6672e4b0fe43584c367b", NOT the name
 *
 * Returns Promise that resolves with:
 * {
 * 		url: string
 *   	clientID: string
 *   	clientSecret: string
 *   	description: string
 * } 
 * Return data from PUT /v1/portal/orgs/{orgID}/apps/{appId}/credentials
 * See https://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/rest_op_portal_orgs__orgID__apps__appID__credentialsPUT.html
 * 
 */
function updateApplicationCredentials(applicationId, clientId, apiDeveloperOrgId) {
	logger.entry("apimdevportal.updateApplicationCredentials", applicationId, clientId, apiDeveloperOrgId);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/apps/' + encodeURIComponent(applicationId) + "/credentials";

	var content = {
			"clientID": clientId
	};

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "PUT";
	options.path = uri;
	
	var contentString = JSON.stringify(content);
	
	var promise = _sendRequestToAPIC(options, contentString);
	
	logger.exit("apimdevportal.updateApplicationCredentials", promise);
	return promise;
}

/*
 * Update the application by changing the description (for now).
 * 
 * id - application id
 * description - new description
 * apiDeveloperOrgId - id of the developer org, of the form "573c6672e4b0fe43584c367b", NOT the name
 *
 * Returns Promise that resolves with application data
 * Return data from PUT /v1/portal/orgs/{orgID}/apps/{appID}
 * See https://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/rest_op_portal_orgs__orgID__apps__appID_PUT.html
 * 
 */
function updateApplication(applicationId, description, apiDeveloperOrgId) {
	logger.entry("apimdevportal.updateApplication", applicationId, description, apiDeveloperOrgId);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/apps/' + encodeURIComponent(applicationId);

	var content = {
			"description": description
	};

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "PUT";
	options.path = uri;
	
	var contentString = JSON.stringify(content);
	
	var promise = _sendRequestToAPIC(options, contentString);
	
	logger.exit("apimdevportal.updateApplication", promise);
	return promise;
}

/*
 * Subscribe the application to the plan in the product identified by the productName and productVersion.
 * 
 * applicationId - id of existing application
 * apiDeveloperOrgId - id of the developer org, of the form "573c6672e4b0fe43584c367b", NOT the name
 * productName - name of product (not display name or title)
 * productVersion - version of product
 * planName - name of plan in the product (not display name or title)
 * 
 * Returns a promise that resolves when the subscription is created, with the subscription data
 * See https://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/rest_op_portal_orgs__orgID__apps__appID__subscriptionsPOST.html
 * 
 */
function subscribeApplicationToPlan(applicationId, apiDeveloperOrgId, productName, productVersion, planName) {
	logger.entry("apimdevportal.subscribeApplicationToPlan", applicationId, apiDeveloperOrgId, productName, productVersion, planName);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/apps/' + encodeURIComponent(applicationId) + "/subscriptions";

	var content = {
		"plan": planName,
		"product": {
			"name": productName,
			"version": productVersion
		}
	};

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "POST";
	options.path = uri;
	var contentString = JSON.stringify(content);
	
	var promise = _sendRequestToAPIC(options, contentString);
	
	logger.exit("apimdevportal.subscribeApplicationToPlan", promise);
	return promise;
}

/*
 * Subscribe the application to the plan in the product identified by the product ID.
 * 
 * applicationId - id of existing application
 * apiDeveloperOrgId - id of the developer org, of the form "573c6672e4b0fe43584c367b", NOT the name
 * productId - id of product
 * planName - name of plan in the product (not display name or title)
 * 
 * Returns a promise that resolves when the subscription is created, with the subscription data
 * See https://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/rest_op_portal_orgs__orgID__apps__appID__subscriptionsPOST.html
 * 
 */
function subscribeApplicationToPlanAndProductID(applicationId, apiDeveloperOrgId, productId, planName) {
	logger.entry("apimdevportal.subscribeApplicationToPlanAndProductID", applicationId, apiDeveloperOrgId, productId, planName);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/apps/' + encodeURIComponent(applicationId) + "/subscriptions";

	var content = {
		"plan": planName,
		"product": {
			"id": productId
		}
	};

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "POST";
	options.path = uri;
	var contentString = JSON.stringify(content);
	
	var promise = _sendRequestToAPIC(options, contentString);
	
	logger.exit("apimdevportal.subscribeApplicationToPlanAndProductID", promise);
	return promise;
}

/*
 * Unsubscribe the application from the subscription identified.
 * 
 * applicationId - id of existing application
 * subscriptionId - id of subscription
 * apiDeveloperOrgId - id of the developer org, of the form "573c6672e4b0fe43584c367b", NOT the name
 * 
 * Returns a promise that resolves when the subscription is deleted with no content.
 * See https://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/rest_op_portal_orgs__orgID__apps__appID__subscriptions__subID_DELETE.html
 * 
 */
function unsubscribeApplicationFromPlan(applicationId, subscriptionId, apiDeveloperOrgId) {
	logger.entry("apimdevportal.unsubscribeApplicationFromPlan", applicationId, subscriptionId, apiDeveloperOrgId);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/apps/' + encodeURIComponent(applicationId) + "/subscriptions/" + encodeURIComponent(subscriptionId);

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "DELETE";
	options.path = uri;
	
	var promise = _sendRequestToAPIC(options, null);
	
	logger.exit("apimdevportal.unsubscribeApplicationFromPlan", promise);
	return promise;
}


/*
 * List the applications plan subscriptions for the application.
 *
 * id - application ID
 * apiDeveloperOrgId - ID of the developer organization
 *
 * Returns a promise that resolves with a list of subscriptions, data for /v1/portal/orgs/{orgID}/apps/{appID}/subscriptions
 * See https://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/rest_op_portal_orgs__orgID__apps__appID__subscriptionsGET.html
 * 
 */
function listApplicationPlanSubscriptions(applicationId, apiDeveloperOrgId) {
	logger.entry("apimdevportal.listApplicationPlanSubscriptions", applicationId, apiDeveloperOrgId);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/apps/' + encodeURIComponent(applicationId) + "/subscriptions";

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "GET";
	options.path = uri;
	
	var promise = _sendRequestToAPIC(options, null);
	
	logger.exit("apimdevportal.listApplicationPlanSubscriptions", promise);
	return promise;
}

/*
 * List the subscriptions for the product.
 *
 * productId - product ID
 * apiDeveloperOrgId - ID of the developer organization
 *
 * Returns a promise that resolves with an array of subscriptions, data for /portal/orgs/{orgID}/products/{productID}/subscriptions
 * See https://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/rest_op_portal_orgs__orgID__products__productID__subscriptionsGET.html
 * 
 */
function listSubscriptionsForProduct(productId, apiDeveloperOrgId) {
	logger.entry("apimdevportal.listSubscriptionsForProduct", productId, apiDeveloperOrgId);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/products/' + encodeURIComponent(productId) + "/subscriptions";

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "GET";
	options.path = uri;
	
	var promise = _sendRequestToAPIC(options, null);
	
	logger.exit("apimdevportal.listSubscriptionsForProduct", promise);
	return promise;
}

/*
 * List the developer organizations the logged in user is a member of.
 * 
 * nameFilter - name to filter on, optional
 * 
 * Note the name is the display name as shown in the API Manager UI, not the "name" which is a shortened display name.
 * 
 * Returns a promise which resolves with an array of organizations, return data from GET /v1/portal/orgs
 * See http://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/methods/rest_op_portal_orgsGET.html
 */
function listDeveloperOrganizations(nameFilter) {
	logger.entry("apimdevportal.listDeveloperOrganizations", nameFilter);
	
	var uri = '/v1/portal/orgs';
	
	if(nameFilter) {
		uri += "?name=" + encodeURIComponent(nameFilter);
	}
	
	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "GET";
	options.path = uri;
	
	var promise = _sendRequestToAPIC(options, null);
	
	logger.exit("apimdevportal.listDeveloperOrganizations", promise);
	return promise;
}

/*
 * Get the ID of the developer organization by its display name.
 * 
 * The logged in user must be a member of the organization.
 * 
 * name - full display name of the developer organization
 * 
 * Returns a promise that resolves with a string which is the ID of the organization. Rejects if
 * the organization cannot be found.
 * 
 */
function getDeveloperOrganizationId(name) {
	logger.entry("apimdevportal.getDeveloperOrganizationId", name);

	var promise = listDeveloperOrganizations().then(function(orgs) {
		logger.entry("apimdevportal.getDeveloperOrganizationId_orgs", orgs);
		// process the results		
		var id = null;
		var orgsWithSameName=[];
		for(var i = 0; i < orgs.length; i++) {
			var org = orgs[i];
			if(org.name === name || org.id === name) {
				//id has already been set, therefore we have mulitple orgs with the same name
				//store the id of all matching organisations so that they can be listed 
				if(id){
					orgsWithSameName.push(org.id);					
				}else{
					id = org.id;
				}
				
			}
		}
		if(orgsWithSameName.length>0){
			logger.warn(logger.Globalize.formatMessage("apicdevportalmutlipleorgswithsamename",name,id));		
			logger.warn(logger.Globalize.formatMessage("apicdevportalmutlipleorgswithsamenameadditionalids",orgsWithSameName.toString(0)));			
		}
		if(id) {
			logger.exit("apimdevportal.getDeveloperOrganizationId_orgs", id);
			return id;
		} else {
			var message = logger.Globalize.formatMessage("apicOrgNotFound", name);			
			var e = new Error(message);
			logger.error(e);
			throw e;			
		}
	});
	
	logger.exit("apimdevportal.getDeveloperOrganizationId", promise);
	return promise;
}

/*
 * Get the ID of the configured developer organization.
 * 
 * The logged in user must be a member of the organization.
 * 
 * Returns a promise that resolves with a string which is the ID of the organization which is on the
 * configuration. Rejects if the organization cannot be found.
 * 
 */
function getDeveloperOrganizationIdOfConfigured() {
	logger.entry("apimdevportal.getDeveloperOrganizationIdOfConfigured");

	var promise = getDeveloperOrganizationId(apiDeveloperOrgName);
	
	logger.exit("apimdevportal.getDeveloperOrganizationIdOfConfigured", promise);
	return promise;
}

/*
 * List the products for the organization.
 *
 * apiDeveloperOrgId - ID of the developer organization
 *
 * Returns a promise that resolves with a list of products, data for /v1/portal/orgs/{orgID}/products
 * See https://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/rest_op_portal_orgs__orgID__productsGET.html
 * 
 */
function listProducts(apiDeveloperOrgId) {
	logger.entry("apimdevportal.listProducts", apiDeveloperOrgId);
	
	var uri = '/v1/portal/orgs/' + encodeURIComponent(apiDeveloperOrgId) + '/products';

	var options = _.cloneDeep(baseConnectionOptions);
	options.method = "GET";
	options.path = uri;
	
	var promise = _sendRequestToAPIC(options, null);
	
	logger.exit("apimdevportal.listProducts", promise);
	return promise;
}

/*
 * Retrieve a product by Name.
 * 
 * This has to retrieve all products then match the name against the name field and 
 * the version against the version field.
 * 
 * name - full name of the product
 * version - version of the product (optional)
 * apiDeveloperOrgId - ID of the developer organization
 *
 * Returns a promise that resolves to the product data if found, see 
 * https://www.ibm.com/support/knowledgecenter/SSMNED_5.0.0/com.ibm.apic.apirest.doc/rest_op_portal_orgs__orgID__productsGET.html
 * 
 * Returns null if the product is not found.
 * 
 */
function retrieveProductByName(name, version, apiDeveloperOrgId) {
	logger.entry("apimdevportal.retrieveProductByName", name, version, apiDeveloperOrgId);
	
	var promise = listProducts(apiDeveloperOrgId).then(function(products){
		logger.entry("apimdevportal.retrieveProductByName_products", products);
		var prod = null;
		for(var i = 0; i < products.length; i++) {
			if(products[i].info.name === name) {
				if(version) {
					if(products[i].info.version === version) {
						prod = products[i];
						break;
					}
				} else {
					prod = products[i];
					break;
				}
			}
		}
		logger.exit("apimdevportal.retrieveProductByName_applications", prod);
		return prod;
	});

	logger.entry("apimdevportal.retrieveProductByName", promise);
	return promise;
}

/*
 * Set the catalog to use on all subsequent calls.
 * 
 * catalog - catalog name (not display name)
 */
function setCatalog(catalog) {
	logger.entry("apimdevportal.setCatalog", catalog);

	apicCatalog = catalog;

	// update details of developer portal in the headers
	baseConnectionOptions.headers["X-IBM-APIManagement-Context"] = apicPOrg + "." + apicCatalog;

	logger.exit("apimdevportal.setCatalog");
}

/*
 * Set the name of the developer org
 */
function setDeveloperOrganizationName(name) {
	logger.entry("apimdevportal.setDeveloperOrganizationName", name);
	
	apiDeveloperOrgName = name;
	
	logger.exit("apimdevportal.setDeveloperOrganizationName");
}


module.exports = {
	setConnectionDetails: setConnectionDetails,
	createApplication: createApplication,
	listDeveloperOrganizations: listDeveloperOrganizations,
	getDeveloperOrganizationId: getDeveloperOrganizationId,
	listApplications: listApplications,
	retrieveApplicationByName: retrieveApplicationByName,
	deleteApplication: deleteApplication,
	subscribeApplicationToPlan: subscribeApplicationToPlan,
	subscribeApplicationToPlanAndProductID: subscribeApplicationToPlanAndProductID,
	updateApplicationCredentials: updateApplicationCredentials,
	updateApplication: updateApplication,
	listApplicationPlanSubscriptions: listApplicationPlanSubscriptions,
	unsubscribeApplicationFromPlan: unsubscribeApplicationFromPlan,
	listSubscriptionsForProduct: listSubscriptionsForProduct,
	listProducts: listProducts,
	retrieveProductByName: retrieveProductByName,

	getDeveloperOrganizationIdOfConfigured: getDeveloperOrganizationIdOfConfigured,
	setCatalog: setCatalog,
	setDeveloperOrganizationName: setDeveloperOrganizationName
};
