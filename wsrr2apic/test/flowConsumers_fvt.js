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
// Run these using "npm test"

var should = require('chai').should();

var flow = require('../lib/flow');
var flowConsumers = require('../lib/flowConsumers');
var logger = require('../lib/Logger');
var _ = require('lodash');
var fakeModule = require('./fakeModule');
var realapicdevportal = require('../lib/apimdevportal');
var realapiccli = require('../lib/apimcli');
var Promise = require('bluebird');

// FVT tests for flow but run in the unit test bucket
describe('unittests_fvt_flowConsumers', function(){
	before(function(done){
		logger.initialize(function() {
			done();
		});		
	});

	this.timeout(10000);

	describe('_test_updateAppCredentials', function() {
		var consumer = {
				 name: "test",
				   description: "",
				   clientID: "newAPIKey",
				   duplicateClientID: "",
				   planName: "basic"
				 };

		var appId = "1";
		var newAPIKey = "newAPIKey";
		var devOrg = "devOrg";
		var oldClientID = "oldClientID";
		
		it('updates app credentials', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, newAPIKey, devOrg], {url: "http://www.a.com/", clientID: newAPIKey, clientSecret: "xxyy", description: ""}, true);
			
			var ret = flowConsumers._test_updateAppCredentials(appId, consumer, oldClientID, devOrg, consumersDone, apicdevportal).then(function(retAppId){
				apicdevportal.fakeModule_done();
				
				retAppId.should.equal(appId);
				consumersDone.updated.should.deep.equal([{appID: appId, clientID: oldClientID}]);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

		it('updates app credentials for new app', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, newAPIKey, devOrg], {url: "http://www.a.com/", clientID: newAPIKey, clientSecret: "xxyy", description: ""}, true);

			var ret = flowConsumers._test_updateAppCredentials(appId, consumer, null, devOrg, consumersDone, apicdevportal).then(function(retAppId){
				apicdevportal.fakeModule_done();
				
				retAppId.should.equal(appId);
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

	});

	describe('_test_subscribeAppToProduct', function() {
		
		var consumer = {
				 name: "test",
				   description: "",
				   clientID: "newAPIKey",
				   duplicateClientID: "",
				   planName: "basic"
				 };

		var appId = "1";
		var newAPIKey = "newAPIKey";
		var devOrg = "devOrg";
		var oldClientID = "oldClientID";
		var productName = "basic-service";
		var productVersion = "1.0.0";
		var planName = "premium";
		var subId = "5880c568e4b0eacb4b5df1e1";
		var productDetails = {productName: productName, productVersion: productVersion};
		
		it('subscribes app to product', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var subscription = 
				{ id: subId,
				    app:
				     { id: appId,
				       name: 'TestToSubscribe2ce9202feb6fb6c94e962' },
				    product:
				     { id: '587e3301e4b0eacb4b5d29bf',
				       name: productName,
				       version: productVersion },
				    plan: planName,
				    approved: true,
				    createdAt: '2017-01-19T13:55:52.236+0000',
				    updatedAt: '2017-01-19T13:55:52.236+0000',
				    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };		
				
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productName, productVersion, planName], subscription, true);
			
			var ret = flowConsumers._test_subscribeAppToProduct(appId, productDetails, planName, devOrg, consumersDone, apicdevportal).then(function(sub){
				apicdevportal.fakeModule_done();
				
				sub.should.deep.equal(subscription);
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.deep.equal([{subID: subId, appID: appId}]);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

	});

	describe('_test_checkAppSubscriptions', function() {

		var planName = "premium";
		var consumer = {
				 name: "test",
				   description: "",
				   clientID: "newAPIKey",
				   duplicateClientID: "",
				   planName: planName
				 };

		var appId = "1";
		var newAPIKey = "newAPIKey";
		var devOrg = "devOrg";
		var oldClientID = "oldClientID";
		var productName = "basic-service";
		var productVersion = "1.0.0";
		var subId = "5880c568e4b0eacb4b5df1e1";
		var subId3 = "5880c568e4b0eacb4b5df1e3";
		var productDetails = {productName: productName, productVersion: productVersion};
		var wrongPlan = "wrongPlan";
		var productId = "587e3301e4b0eacb4b5d29bf";
		
		var subscription =  
		{ id: subId,
		    app:
		     { id: appId,
		       name: 'TestToSubscribe2ce9202feb6fb6c94e962' },
		    product:
		     { id: productId,
		       name: productName,
		       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };
	
		var subscription2 =  
		{ id: "123456789",
		    app:
		     { id: appId,
		       name: 'TestToSubscribe2ce9202feb6fb6c94e962' },
		    product:
		     { id: '587e3301e4b0eacb4b5d29b1',
		       name: "math-service",
		       version: "1.0" },
		    plan: "basic",
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };		

		var subscription3 =  
		{ id: subId3,
		    app:
		     { id: appId,
		       name: 'TestToSubscribe2ce9202feb6fb6c94e962' },
		    product:
		     { id: productId,
		       name: productName,
		       version: productVersion },
		    plan: wrongPlan,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };

		it('finds existing matching subscription (product and plan name)', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var subscriptions = [subscription, subscription2];
			
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], subscriptions, true);
			
			var ret = flowConsumers._test_checkAppSubscriptions(appId, consumer, productDetails, "sb", devOrg, "wsrrdev", consumersDone, apicdevportal).then(function(sub){
				apicdevportal.fakeModule_done();

				// should not create a subscription
				
				sub.should.deep.equal(subscription);
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

		it('creates subscription when none exist', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var subscriptions = [];
			
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], subscriptions, true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productName, productVersion, planName], subscription, true);
			
			var ret = flowConsumers._test_checkAppSubscriptions(appId, consumer, productDetails, "sb", devOrg, "wsrrdev", consumersDone, apicdevportal).then(function(sub){
				apicdevportal.fakeModule_done();

				// should create a subscription
				sub.should.deep.equal(subscription);
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.deep.equal([{subID: subId, appID: appId}]);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

		// creates when some exist but no match
		it('creates subscription when none match', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			var subscriptions = [subscription2];
			
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], subscriptions, true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productName, productVersion, planName], subscription, true);
			
			var ret = flowConsumers._test_checkAppSubscriptions(appId, consumer, productDetails, "sb", devOrg, "wsrrdev", consumersDone, apicdevportal).then(function(sub){
				apicdevportal.fakeModule_done();

				// should create a subscription
				sub.should.deep.equal(subscription);
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.deep.equal([{subID: subId, appID: appId}]);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});
		
		// changes sub when exists but not to the correct plan
		it('creates subscription when one matches but wrong plan', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			var subscriptions = [subscription2, subscription3];
			
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], subscriptions, true);
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId, subId3, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productName, productVersion, planName], subscription, true);
			
			var ret = flowConsumers._test_checkAppSubscriptions(appId, consumer, productDetails, "sb", devOrg, "wsrrdev", consumersDone, apicdevportal).then(function(sub){
				apicdevportal.fakeModule_done();

				// should create a subscription and also delete one
				sub.should.deep.equal(subscription);
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.deep.equal([{subID: subId, appID: appId}]);
				consumersDone.subscriptionsDeleted.should.deep.equal([{planName: wrongPlan, productID: productId, appID: appId}]);
			});
			return ret;
		});
		
		
	});

	describe('_test_makeOrFindApp', function() {

		var planName = "premium";
		var newAPIKey = "newAPIKey";
		var appName = "test";
		var appDesc = "description";
		var consumer = {
				 name: appName,
				   description: appDesc,
				   clientID: newAPIKey,
				   duplicateClientID: "",
				   planName: planName
				 };
		var catalog = "sb";
		var appId = "1";
		var devOrg = "devOrg";
		var oldClientID = "oldClientID";
		var productName = "basic-service";
		var productVersion = "1.0.0";
		var productDetails = {productName: productName, productVersion: productVersion};
		var wrongPlan = "wrongPlan";
		var productId = "587e3301e4b0eacb4b5d29bf";
		
		var app = {
									id : appId,
									name : appName,
									orgID : '58737006e4b0eacb4b593d22',
									public : true,
									description : appDesc,
									credentials : {
										clientID : newAPIKey,
										clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB',
										description : 'Default',
										url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials'
									},
									appCredentials : [ {
										id : '5885f5d4e4b0eacb4b5f6d3a',
										description : 'Default',
										url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials/5885f5d4e4b0eacb4b5f6d3a',
										clientID : '79417acb-932c-4be0-96f2-77d157226b7a',
										clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB'
									} ],
									enabled : true,
									state : 'ACTIVE',
									imageURL : null,
									oauthRedirectURI : '',
									createdAt : '2017-01-23T12:23:48.561+0000',
									updatedAt : '2017-01-23T12:23:48.561+0000',
									url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39'
								};

		it('finds existing matching app', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", appName, devOrg], app, true);
			
			var ret = flowConsumers._test_makeOrFindApp(consumer, catalog, devOrg, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);
				
				// should not create an app
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
				var expectedAppIDToName = {};
				expectedAppIDToName[appId] = appName;
				consumersDone.appIDToName.should.deep.equal(expectedAppIDToName);
			});
			return ret;
		});

		// finds existing app and updates the API key cos it is different
		it('updates API key of existing app', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			var oldAPIKey = "oldAPIKey";
			var oldAPIKeyApp = _.cloneDeep(app);
			oldAPIKeyApp.credentials.clientID = oldAPIKey;
			
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", appName, devOrg], oldAPIKeyApp, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, newAPIKey, devOrg], app, true);
			
			var ret = flowConsumers._test_makeOrFindApp(consumer, catalog, devOrg, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);

				// should updated the app API key
				consumersDone.updated.should.be.length(1);
				consumersDone.updated.should.deep.equal([{appID: appId, clientID: oldAPIKey}]);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
				var expectedAppIDToName = {};
				expectedAppIDToName[appId] = appName;
				consumersDone.appIDToName.should.deep.equal(expectedAppIDToName);
			});
			return ret;
		});
		
		// finds existing app and updates the description cos it is different
		it('updates description of existing app', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			var oldDescription = "oldDescription";
			var oldDescriptionApp = _.cloneDeep(app);
			oldDescriptionApp.description = oldDescription;
			
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", appName, devOrg], oldDescriptionApp, true);
			apicdevportal.fakeModule_addExpected(["updateApplication", appId, appDesc, devOrg], app, true);
			
			var ret = flowConsumers._test_makeOrFindApp(consumer, catalog, devOrg, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);

				// should updated the app description
				consumersDone.updated.should.be.length(1);
				consumersDone.updated.should.deep.equal([{appID: appId, description: oldDescription}]);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
				var expectedAppIDToName = {};
				expectedAppIDToName[appId] = appName;
				consumersDone.appIDToName.should.deep.equal(expectedAppIDToName);
			});
			return ret;
		});
		
		// finds existing app and updates the description AND API Key cos they are different
		it('updates description and API of existing app', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			var oldDescription = "oldDescription";
			var oldAPIKey = "oldAPIKey";
			var oldApp = _.cloneDeep(app);
			oldApp.description = oldDescription;
			oldApp.credentials.clientID = oldAPIKey;
			
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", appName, devOrg], oldApp, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, newAPIKey, devOrg], app, true);
			apicdevportal.fakeModule_addExpected(["updateApplication", appId, appDesc, devOrg], app, true);
			
			var ret = flowConsumers._test_makeOrFindApp(consumer, catalog, devOrg, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);

				// should updated the app description and API key in seperate update records
				consumersDone.updated.should.be.length(2);
				consumersDone.updated.should.deep.equal([{appID: appId, clientID: oldAPIKey}, {appID: appId, description: oldDescription}]);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
				var expectedAppIDToName = {};
				expectedAppIDToName[appId] = appName;
				consumersDone.appIDToName.should.deep.equal(expectedAppIDToName);
			});
			return ret;
		});
		
		// creates a new app with the specified key
		it('creates a new app', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", appName, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", appName, appDesc, devOrg], app, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, newAPIKey, devOrg], app, true);
			
			var ret = flowConsumers._test_makeOrFindApp(consumer, catalog, devOrg, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);

				// should created the app
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(1);
				consumersDone.created.should.deep.equal([appId]);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
				var expectedAppIDToName = {};
				expectedAppIDToName[appId] = appName;
				consumersDone.appIDToName.should.deep.equal(expectedAppIDToName);
			});
			return ret;
		});
		
		// creates a new app and leaves the key asis
		it('creates a new app and leaves the key asis', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			var newConsumer = _.cloneDeep(consumer);
			// no client ID to set
			newConsumer.clientID = "";
			
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", appName, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", appName, appDesc, devOrg], app, true);
			
			var ret = flowConsumers._test_makeOrFindApp(newConsumer, catalog, devOrg, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);

				// should created the app
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(1);
				consumersDone.created.should.deep.equal([appId]);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
				var expectedAppIDToName = {};
				expectedAppIDToName[appId] = appName;
				consumersDone.appIDToName.should.deep.equal(expectedAppIDToName);
			});
			return ret;
		});

	});

	//_test_updateAppDescription
	describe('_test_updateAppDescription', function() {

		var planName = "premium";
		var newAPIKey = "newAPIKey";
		var appName = "test";
		var appDesc = "description";
		var consumer = {
				 name: appName,
				   description: appDesc,
				   clientID: newAPIKey,
				   duplicateClientID: "",
				   planName: planName
				 };
		var oldDesc = "oldDescription";
		var appId = "1";
		var devOrg = "devOrg";
		
		it('finds existing matching app', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			apicdevportal.fakeModule_addExpected(["updateApplication", appId, appDesc, devOrg], appId, true);
			
			var ret = flowConsumers._test_updateAppDescription(appId, consumer, oldDesc, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);
				
				// should update description
				consumersDone.updated.should.be.length(1);
				consumersDone.updated.should.deep.equal([{appID: appId, description: oldDesc}]);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});
	});

	// _test_updateCredentialsAndDescription
	describe('_test_updateCredentialsAndDescription', function() {

		var planName = "premium";
		var newAPIKey = "newAPIKey";
		var appName = "test";
		var appDesc = "description";
		var consumer = {
				 name: appName,
				   description: appDesc,
				   clientID: newAPIKey,
				   duplicateClientID: "",
				   planName: planName
				 };
		var catalog = "sb";
		var appId = "1";
		var devOrg = "devOrg";
		var oldClientID = "oldClientID";
		var productName = "basic-service";
		var productVersion = "1.0.0";
		var productDetails = {productName: productName, productVersion: productVersion};
		var wrongPlan = "wrongPlan";
		var productId = "587e3301e4b0eacb4b5d29bf";
		
		var app = {
									id : appId,
									name : appName,
									orgID : '58737006e4b0eacb4b593d22',
									public : true,
									description : appDesc,
									credentials : {
										clientID : newAPIKey,
										clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB',
										description : 'Default',
										url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials'
									},
									appCredentials : [ {
										id : '5885f5d4e4b0eacb4b5f6d3a',
										description : 'Default',
										url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials/5885f5d4e4b0eacb4b5f6d3a',
										clientID : '79417acb-932c-4be0-96f2-77d157226b7a',
										clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB'
									} ],
									enabled : true,
									state : 'ACTIVE',
									imageURL : null,
									oauthRedirectURI : '',
									createdAt : '2017-01-23T12:23:48.561+0000',
									updatedAt : '2017-01-23T12:23:48.561+0000',
									url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39'
								};

		it('updates nothing', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

//			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", appName, devOrg], app, true);
			
			var ret = flowConsumers._test_updateCredentialsAndDescription(appId, app, consumer, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);
				
				// should not update an app
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});
		
		// update key only
		it('updates API key', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var oldAPIKey = "oldAPIKey";
			var oldAPIKeyApp = _.cloneDeep(app);
			oldAPIKeyApp.credentials.clientID = oldAPIKey;
			
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, newAPIKey, devOrg], app, true);
			
			var ret = flowConsumers._test_updateCredentialsAndDescription(appId, oldAPIKeyApp, consumer, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);

				// should updated the app API key
				consumersDone.updated.should.be.length(1);
				consumersDone.updated.should.deep.equal([{appID: appId, clientID: oldAPIKey}]);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

		// update description only
		it('updates description', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var oldDescription = "oldDescription";
			var oldDescriptionApp = _.cloneDeep(app);
			oldDescriptionApp.description = oldDescription;
			
			apicdevportal.fakeModule_addExpected(["updateApplication", appId, appDesc, devOrg], app, true);
			
			var ret = flowConsumers._test_updateCredentialsAndDescription(appId, oldDescriptionApp, consumer, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);

				// should updated the app description
				consumersDone.updated.should.be.length(1);
				consumersDone.updated.should.deep.equal([{appID: appId, description: oldDescription}]);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});
		
		// update description and key
		it('updates description and API', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var oldDescription = "oldDescription";
			var oldAPIKey = "oldAPIKey";
			var oldApp = _.cloneDeep(app);
			oldApp.description = oldDescription;
			oldApp.credentials.clientID = oldAPIKey;
			
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, newAPIKey, devOrg], app, true);
			apicdevportal.fakeModule_addExpected(["updateApplication", appId, appDesc, devOrg], app, true);
			
			var ret = flowConsumers._test_updateCredentialsAndDescription(appId, oldApp, consumer, devOrg, consumersDone, apicdevportal).then(function(data){
				apicdevportal.fakeModule_done();

				data.should.equal(appId);

				// should updated the app description and API key in seperate update records
				consumersDone.updated.should.be.length(2);
				consumersDone.updated.should.deep.equal([{appID: appId, clientID: oldAPIKey}, {appID: appId, description: oldDescription}]);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});
		
	});	

	// _test_reconciliateProductSubscriptions
	describe('_test_reconciliateProductSubscriptions', function() {

		var planName = "premium";
		var newAPIKey = "newAPIKey";
		var newAPIKey2 = "newAPIKey2";
		var appName = "test";
		var appDesc = "description";
		var appName2 = "test2";
		var appDesc2 = "description2";
		var consumer = {
				 name: appName,
				   description: appDesc,
				   clientID: newAPIKey,
				   duplicateClientID: "",
				   planName: planName
				 };
		var consumer2 = {
				 name: appName2,
				   description: appDesc2,
				   clientID: newAPIKey2,
				   duplicateClientID: "",
				   planName: planName
				 };
		var catalog = "sb";
		var appId = "1";
		var appId2 = "2";
		var appId3 = "3";
		var appId4 = "4";
		var devOrg = "devOrg";
		var oldClientID = "oldClientID";
		var productName = "basic-service";
		var productVersion = "1.0.0";
		var productDetails = {productName: productName, productVersion: productVersion};
		var wrongPlan = "wrongPlan";
		var productId = "587e3301e4b0eacb4b5d29bf";
		var subId = "5880c568e4b0eacb4b5df1e1";
		var subId3 = "5880c568e4b0eacb4b5df1e3";
		var subId4 = "5880c568e4b0eacb4b5df1e4";
		var plan3 = "basic";

		// app1
		var subscription =  
		{ id: subId,
		    app:
		     { id: appId,
		       name: appName},
		    product:
		     { id: productId,
		       name: productName,
		       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };
	
		// app2 
		var subscription2 =  
		{ id: "123456789",
		    app:
		     { id: appId2,
		       name: appName2 },
		    product:
		     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };		

		// different app not in consumers subscribed (app Name different)
		var subscription3 =  
		{ id: subId3,
		    app:
		     { id: appId3,
		       name: 'TestToSubscribe2ce9202feb6fb6c94e962' },
			    product:
			     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };

		// different app not in consumers subscribed (plan different)
		var subscription4 =  
		{ id: subId4,
		    app:
		     { id: appId3,
		       name: appName2 },
			    product:
			     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: plan3,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };

		var app = {
									id : appId,
									name : appName,
									orgID : '58737006e4b0eacb4b593d22',
									public : true,
									description : appDesc,
									credentials : {
										clientID : newAPIKey,
										clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB',
										description : 'Default',
										url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials'
									},
									appCredentials : [ {
										id : '5885f5d4e4b0eacb4b5f6d3a',
										description : 'Default',
										url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials/5885f5d4e4b0eacb4b5f6d3a',
										clientID : '79417acb-932c-4be0-96f2-77d157226b7a',
										clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB'
									} ],
									enabled : true,
									state : 'ACTIVE',
									imageURL : null,
									oauthRedirectURI : '',
									createdAt : '2017-01-23T12:23:48.561+0000',
									updatedAt : '2017-01-23T12:23:48.561+0000',
									url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39'
								};

		// skeleton product
		var product = {
				id: productId
		};
		
		it('removes nothing', function(){

			var apicdevportal = fakeModule.create(realapicdevportal);

			// only app in consumers is subscribed			
			var subscriptions = [subscription, subscription2];

			var consumers = [consumer, consumer2];
			
			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productName, productVersion, devOrg], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct" , productId, devOrg], subscriptions, true);
			
			var ret = flowConsumers._test_reconciliateProductSubscriptions(consumers, productDetails, catalog, devOrg, devOrg, consumersDone, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				// should have done nothing
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

		// removes extra subscriptions
		it('removes extra subscriptions', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			// apps subscribed subscription3 subscription4 are not in consumers
			var subscriptions = [subscription, subscription3, subscription2, subscription4];

			var consumers = [consumer, consumer2];
			
			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productName, productVersion, devOrg], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct" , productId, devOrg], subscriptions, true);
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId3, subId3, devOrg], "", true);
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId3, subId4, devOrg], "", true);
			
			var ret = flowConsumers._test_reconciliateProductSubscriptions(consumers, productDetails, catalog, devOrg, devOrg, consumersDone, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				// should have removed sub3
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(2);
				consumersDone.subscriptionsDeleted.should.deep.equal([{planName: planName, productID: productId, appID: appId3}, {planName: plan3, productID: productId, appID: appId3}]);
			});
			return ret;
		});

	});

	describe('_test_removeSubscriptions', function() {

		var planName = "premium";
		var consumer = {
				 name: "test",
				   description: "",
				   clientID: "newAPIKey",
				   duplicateClientID: "",
				   planName: planName
				 };

		var appId = "1";
		var newAPIKey = "newAPIKey";
		var devOrg = "devOrg";
		var oldClientID = "oldClientID";
		var productName = "basic-service";
		var productVersion = "1.0.0";
		var subId = "5880c568e4b0eacb4b5df1e1";
		var subId2 = "123456789";
		var subId3 = "5880c568e4b0eacb4b5df1e3";
		var productDetails = {productName: productName, productVersion: productVersion};
		var wrongPlan = "wrongPlan";
		var productId = "587e3301e4b0eacb4b5d29bf";
		
		var subscription =  
		{ id: subId,
		    app:
		     { id: appId,
		       name: 'TestToSubscribe2ce9202feb6fb6c94e962' },
		    product:
		     { id: productId,
		       name: productName,
		       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };
	
		var subscription3 =  
		{ id: subId3,
		    app:
		     { id: appId,
		       name: 'TestToSubscribe2ce9202feb6fb6c94e962' },
		    product:
		     { id: productId,
		       name: productName,
		       version: productVersion },
		    plan: wrongPlan,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };

		it('removes 2 subscriptions', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			var subscriptions = [subscription, subscription3];
			
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId, subId, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId, subId3, devOrg], null, true);
			
			var ret = flowConsumers._test_removeSubscriptions(subscriptions, devOrg, consumersDone, apicdevportal).then(function(consumersDone){
				apicdevportal.fakeModule_done();

				// should remove two subscriptions
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(2);
				consumersDone.subscriptionsDeleted.should.deep.equal([{planName: planName, productID: productId, appID: appId}, {planName: wrongPlan, productID: productId, appID: appId}]);
			});
			return ret;
		});
		
		it('removes 1 subscription', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			var subscriptions = [subscription];
			
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId, subId, devOrg], null, true);
			
			var ret = flowConsumers._test_removeSubscriptions(subscriptions, devOrg, consumersDone, apicdevportal).then(function(consumersDone){
				apicdevportal.fakeModule_done();

				// should remove two subscriptions
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(0);
				consumersDone.subscriptionsDeleted.should.be.length(1);
				consumersDone.subscriptionsDeleted.should.deep.equal([{planName: planName, productID: productId, appID: appId}]);
			});
			return ret;
		});
		
	});

	// _test_reconciliateConsumers
	describe('_test_reconciliateConsumers', function() {

		var planName = "premium";
		var planName2 = "basic";
		var newAPIKey = "newAPIKey";
		var newAPIKey2 = "newAPIKey2";
		var newAPIKey3 = "llamas";
		var appName = "test";
		var appDesc = "description";
		var appName2 = "test2";
		var appDesc2 = "description2";
		var appName3 = "goats";
		var appDesc3 = "description3";
		var wrongPlan = "wrongPlan";
		var consumer = {
				 name: appName,
				   description: appDesc,
				   clientID: newAPIKey,
				   duplicateClientID: "",
				   planName: planName
				 };
		var consumer2 = {
				 name: appName2,
				   description: appDesc2,
				   clientID: newAPIKey2,
				   duplicateClientID: "",
				   planName: planName
				 };
		var consumer3 = {
				 name: appName3,
				   description: appDesc3,
				   clientID: newAPIKey3,
				   duplicateClientID: "",
				   planName: planName2
				 };
		var consumerDup = {
				 name: appName,
				   description: appDesc,
				   clientID: newAPIKey,
				   duplicateClientID: "",
				   planName: wrongPlan
				 };
		
		var catalog = "sb";
		var appId = "1";
		var appId2 = "2";
		var appId3 = "3";
		var appId4 = "4";
		var devOrg = "devOrg";
		var oldClientID = "oldClientID";
		var productName = "basic-service";
		var productVersion = "1.0.0";
		var productDetails = {productName: productName, productVersion: productVersion};
		var productId = "587e3301e4b0eacb4b5d29bf";
		var subId = "5880c568e4b0eacb4b5df1e1";
		var subId2 = "123456789";
		var subId3 = "5880c568e4b0eacb4b5df1e3";
		var subId4 = "5880c568e4b0eacb4b5df1e4";
		var plan3 = "basic";

		// app1
		var subscription =  
		{ id: subId,
		    app:
		     { id: appId,
		       name: appName},
		    product:
		     { id: productId,
		       name: productName,
		       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };
	
		// app2 
		var subscription2 =  
		{ id: subId2,
		    app:
		     { id: appId2,
		       name: appName2 },
		    product:
		     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };		

		// different app not in consumers subscribed (app Name different)
		var subscription3 =  
		{ id: subId3,
		    app:
		     { id: appId3,
		       name: 'TestToSubscribe2ce9202feb6fb6c94e962' },
			    product:
			     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };

		// different app not in consumers subscribed (plan different)
		var subscription4 =  
		{ id: subId4,
		    app:
		     { id: appId3,
		       name: appName2 },
			    product:
			     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: plan3,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };

		// app3
		var subscriptionApp3 =  
		{ id: subId3,
		    app:
		     { id: appId3,
		       name: appName3 },
		    product:
		     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: planName2,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };		
		
		var app = {
									id : appId,
									name : appName,
									orgID : '58737006e4b0eacb4b593d22',
									public : true,
									description : appDesc,
									credentials : {
										clientID : newAPIKey,
										clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB',
										description : 'Default',
										url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials'
									},
									appCredentials : [ {
										id : '5885f5d4e4b0eacb4b5f6d3a',
										description : 'Default',
										url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials/5885f5d4e4b0eacb4b5f6d3a',
										clientID : '79417acb-932c-4be0-96f2-77d157226b7a',
										clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB'
									} ],
									enabled : true,
									state : 'ACTIVE',
									imageURL : null,
									oauthRedirectURI : '',
									createdAt : '2017-01-23T12:23:48.561+0000',
									updatedAt : '2017-01-23T12:23:48.561+0000',
									url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39'
								};

		var app2 = {
				id : appId2,
				name : appName2,
				orgID : '58737006e4b0eacb4b593d22',
				public : true,
				description : appDesc2,
				credentials : {
					clientID : oldClientID,
					clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB',
					description : 'Default',
					url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials'
				},
				appCredentials : [ {
					id : '5885f5d4e4b0eacb4b5f6d3a',
					description : 'Default',
					url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials/5885f5d4e4b0eacb4b5f6d3a',
					clientID : '79417acb-932c-4be0-96f2-77d157226b7a',
					clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB'
				} ],
				enabled : true,
				state : 'ACTIVE',
				imageURL : null,
				oauthRedirectURI : '',
				createdAt : '2017-01-23T12:23:48.561+0000',
				updatedAt : '2017-01-23T12:23:48.561+0000',
				url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39'
			};

		// skeleton product
		var product = {
				id: productId
		};

		var results = {
				_doneCatalogs: []
		};

		// makes non existing application with 1 sub to the product, product has no existing subs
		it('makes non existing application with 1 sub to the product, product has no existing subs', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var consumersObject = {
					consumersDetails: "1.0.0",
					consumers: [consumer]
			};
			
			var resultsObj = _.cloneDeep(results);
			
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer.name, consumer.description, devOrg], {id: appId, credentials: { clientID: "1234", clientSecret: "1234" }}, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, consumer.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer.clientID, clientSecret: "1234", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productDetails.productName, productDetails.productVersion, planName], subscription, true);
			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productDetails.productName, productDetails.productVersion, devOrg], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct", productId, devOrg], [], true);

			var ret = flowConsumers._test_reconciliateConsumers(consumersObject, catalog, productDetails, devOrg, devOrg, resultsObj, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				var consumersDone = resultsObj[catalog];
				// should create application and 1 sub
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(1);
				consumersDone.created.should.deep.equal([appId]);
				consumersDone.subscriptionsAdded.should.be.length(1);
				consumersDone.subscriptionsAdded.should.deep.equal([{subID: subId, appID: appId}]);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});
		
		// same app subscribing on two plans, only take first one
		it('same app subscribing on two plans, only take first one and makes non existing application with 1 sub to the product, product has no existing subs', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			// same app subscribing to the product with two plans
			var consumersObject = {
					consumersDetails: "1.0.0",
					consumers: [consumer, consumerDup]
			};

			var resultsObj = _.cloneDeep(results);

			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer.name, consumer.description, devOrg], {id: appId, credentials: { clientID: "1234", clientSecret: "1234" }}, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, consumer.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer.clientID, clientSecret: "1234", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productDetails.productName, productDetails.productVersion, planName], subscription, true);
			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productDetails.productName, productDetails.productVersion, devOrg], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct", productId, devOrg], [], true);

			var ret = flowConsumers._test_reconciliateConsumers(consumersObject, catalog, productDetails, devOrg, devOrg, resultsObj, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				var consumersDone = resultsObj[catalog];

				// should create application and 1 sub, ignores the second one
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(1);
				consumersDone.created.should.deep.equal([appId]);
				consumersDone.subscriptionsAdded.should.be.length(1);
				consumersDone.subscriptionsAdded.should.deep.equal([{subID: subId, appID: appId}]);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

		// update existing application to add 1 sub to the product, product has no existing subs
		it('update existing application to add 1 sub to the product, product has no existing subs', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var consumersObject = {
					consumersDetails: "1.0.0",
					consumers: [consumer]
			};

			var resultsObj = _.cloneDeep(results);

			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg], app, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productDetails.productName, productDetails.productVersion, planName], subscription, true);
			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productDetails.productName, productDetails.productVersion, devOrg], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct", productId, devOrg], [], true);

			var ret = flowConsumers._test_reconciliateConsumers(consumersObject, catalog, productDetails, devOrg, devOrg, resultsObj, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				var consumersDone = resultsObj[catalog];

				// should create 1 sub
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(0);
				consumersDone.subscriptionsAdded.should.be.length(1);
				consumersDone.subscriptionsAdded.should.deep.equal([{subID: subId, appID: appId}]);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

		// makes non existing application with 1 sub to the product, product has 1 existing sub that is not listed
		it('makes non existing application with 1 sub to the product, product has 1 existing sub that is not listed', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: [],
					appIDToName: {}
			};

			var consumersObject = {
					consumersDetails: "1.0.0",
					consumers: [consumer]
			};

			var resultsObj = _.cloneDeep(results);

			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer.name, consumer.description, devOrg], {id: appId, credentials: { clientID: "1234", clientSecret: "1234" }}, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, consumer.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer.clientID, clientSecret: "1234", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productDetails.productName, productDetails.productVersion, planName], subscription, true);
			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productDetails.productName, productDetails.productVersion, devOrg], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct", productId, devOrg], [subscription3], true);
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId3, subId3, devOrg], null, true);

			var ret = flowConsumers._test_reconciliateConsumers(consumersObject, catalog, productDetails, devOrg, devOrg, resultsObj, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				var consumersDone = resultsObj[catalog];

				// should create 1 sub and delete 1 sub and 1 app
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(1);
				consumersDone.created.should.deep.equal([appId]);
				consumersDone.subscriptionsAdded.should.be.length(1);
				consumersDone.subscriptionsAdded.should.deep.equal([{subID: subId, appID: appId}]);
				consumersDone.subscriptionsDeleted.should.be.length(1);
				consumersDone.subscriptionsDeleted.should.deep.equal([{planName: planName, productID: productId, appID: appId3}]);
			});
			return ret;
		});

		// makes 3 existing applications with 1 sub each to the product, product has no existing subs
		it('makes 3 existing applications with 1 sub each to the product, product has no existing subs', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var consumersObject = {
					consumersDetails: "1.0.0",
					consumers: [consumer, consumer2, consumer3]
			};

			var resultsObj = _.cloneDeep(results);

			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer.name, consumer.description, devOrg], {id: appId, credentials: { clientID: "1234", clientSecret: "1234" }}, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, consumer.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer.clientID, clientSecret: "1234", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productDetails.productName, productDetails.productVersion, planName], subscription, true);

			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer2.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer2.name, consumer2.description, devOrg], {id: appId2, credentials: { clientID: "12345", clientSecret: "12345" }}, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId2, consumer2.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer2.clientID, clientSecret: "12345", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId2, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId2, devOrg, productDetails.productName, productDetails.productVersion, planName], subscription2, true);

			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer3.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer3.name, consumer3.description, devOrg], {id: appId3, credentials: { clientID: "123456", clientSecret: "123456" }}, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId3, consumer3.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer3.clientID, clientSecret: "123456", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId3, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId3, devOrg, productDetails.productName, productDetails.productVersion, planName2], subscriptionApp3, true);
			
			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productDetails.productName, productDetails.productVersion, devOrg], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct", productId, devOrg], [], true);

			var ret = flowConsumers._test_reconciliateConsumers(consumersObject, catalog, productDetails, devOrg, devOrg, resultsObj, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				var consumersDone = resultsObj[catalog];

				// should create 3 applications and 3 subs
				consumersDone.updated.should.be.length(0);
				consumersDone.created.should.be.length(3);
				consumersDone.created.should.deep.equal([appId, appId2, appId3]);
				consumersDone.subscriptionsAdded.should.be.length(3);
				consumersDone.subscriptionsAdded.should.deep.equal([{subID: subId, appID: appId}, {subID: subId2, appID: appId2}, {subID: subId3, appID: appId3}]);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

		// makes 2 applications and finds one existing application and adds a sub from one application with no subs to the product, product has no existing subs
		it('makes 2 applications and finds one existing application and adds a sub from one application with no subs to the product, product has no existing subs', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var consumersObject = {
					consumersDetails: "1.0.0",
					consumers: [consumer, consumer2, consumer3]
			};

			var resultsObj = _.cloneDeep(results);

			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer.name, consumer.description, devOrg], {id: appId, credentials: { clientID: "1234", clientSecret: "1234" }}, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, consumer.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer.clientID, clientSecret: "1234", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productDetails.productName, productDetails.productVersion, planName], subscription, true);

			// App2 exists but creds are wrong
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer2.name, devOrg], app2, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId2, consumer2.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer2.clientID, clientSecret: "12345", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId2, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId2, devOrg, productDetails.productName, productDetails.productVersion, planName], subscription2, true);

			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer3.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer3.name, consumer3.description, devOrg], {id: appId3, credentials: { clientID: "123456", clientSecret: "123456" }}, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId3, consumer3.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer3.clientID, clientSecret: "123456", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId3, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId3, devOrg, productDetails.productName, productDetails.productVersion, planName2], subscriptionApp3, true);
			
			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productDetails.productName, productDetails.productVersion, devOrg], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct", productId, devOrg], [], true);

			var ret = flowConsumers._test_reconciliateConsumers(consumersObject, catalog, productDetails, devOrg, devOrg, resultsObj, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				var consumersDone = resultsObj[catalog];

				// should create 2 applications and 3 subs and update 1 app's api key
				consumersDone.updated.should.be.length(1);
				consumersDone.updated.should.deep.equal([{appID: appId2, clientID: oldClientID}]);
				consumersDone.created.should.be.length(2);
				consumersDone.created.should.deep.equal([appId, appId3]);
				consumersDone.subscriptionsAdded.should.be.length(3);
				consumersDone.subscriptionsAdded.should.deep.equal([{subID: subId, appID: appId}, {subID: subId2, appID: appId2}, {subID: subId3, appID: appId3}]);
				consumersDone.subscriptionsDeleted.should.be.length(0);
			});
			return ret;
		});

		
	});

	// createConsumersInCatalogs
	describe('createConsumersInCatalogs', function() {

		var planName = "premium";
		var planName2 = "basic";
		var newAPIKey = "newAPIKey";
		var newAPIKey2 = "newAPIKey2";
		var newAPIKey3 = "llamas";
		var appName = "test";
		var appDesc = "description";
		var appName2 = "test2";
		var appDesc2 = "description2";
		var appName3 = "goats";
		var appDesc3 = "description3";
		var wrongPlan = "wrongPlan";
		var consumer = {
				 name: appName,
				   description: appDesc,
				   clientID: newAPIKey,
				   duplicateClientID: "",
				   planName: planName
				 };
		var consumer2 = {
				 name: appName2,
				   description: appDesc2,
				   clientID: newAPIKey2,
				   duplicateClientID: "",
				   planName: planName
				 };
		var consumer3 = {
				 name: appName3,
				   description: appDesc3,
				   clientID: newAPIKey3,
				   duplicateClientID: "",
				   planName: planName2
				 };
		var consumerDup = {
				 name: appName,
				   description: appDesc,
				   clientID: newAPIKey,
				   duplicateClientID: "",
				   planName: wrongPlan
				 };
		
		var catalog = "sb";
		var catalog2 = "production";
		var appId = "1";
		var appId2 = "2";
		var appId3 = "3";
		var appId4 = "4";
		var devOrg = "devOrg";
		var devOrgName = "devOrgName";
		var devOrg2 = "devOrg2";
		var devOrg2Name = "devOrg2Name";
		var oldClientID = "oldClientID";
		var productName = "basic-service";
		var productVersion = "1.0.0";
		var productDetails = {productName: productName, productVersion: productVersion};
		var productId = "587e3301e4b0eacb4b5d29bf";
		var subId = "5880c568e4b0eacb4b5df1e1";
		var subId2 = "123456789";
		var subId3 = "5880c568e4b0eacb4b5df1e3";
		var subId4 = "5880c568e4b0eacb4b5df1e4";
		var plan3 = "basic";

		// app1
		var subscription =  
		{ id: subId,
		    app:
		     { id: appId,
		       name: appName},
		    product:
		     { id: productId,
		       name: productName,
		       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };
	
		// app2 
		var subscription2 =  
		{ id: subId2,
		    app:
		     { id: appId2,
		       name: appName2 },
		    product:
		     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };		

		// different app not in consumers subscribed (app Name different)
		var subscription3 =  
		{ id: subId3,
		    app:
		     { id: appId3,
		       name: 'TestToSubscribe2ce9202feb6fb6c94e962' },
			    product:
			     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: planName,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };

		// different app not in consumers subscribed (plan different)
		var subscription4 =  
		{ id: subId4,
		    app:
		     { id: appId3,
		       name: appName2 },
			    product:
			     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: plan3,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };

		// app3
		var subscriptionApp3 =  
		{ id: subId3,
		    app:
		     { id: appId3,
		       name: appName3 },
		    product:
		     { id: productId,
			       name: productName,
			       version: productVersion },
		    plan: planName2,
		    approved: true,
		    createdAt: '2017-01-19T13:55:52.236+0000',
		    updatedAt: '2017-01-19T13:55:52.236+0000',
		    url: 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5880c567e4b0eacb4b5df1d6/subscriptions/5880c568e4b0eacb4b5df1e1' };		
		
		var app = {
									id : appId,
									name : appName,
									orgID : '58737006e4b0eacb4b593d22',
									public : true,
									description : appDesc,
									credentials : {
										clientID : newAPIKey,
										clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB',
										description : 'Default',
										url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials'
									},
									appCredentials : [ {
										id : '5885f5d4e4b0eacb4b5f6d3a',
										description : 'Default',
										url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials/5885f5d4e4b0eacb4b5f6d3a',
										clientID : '79417acb-932c-4be0-96f2-77d157226b7a',
										clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB'
									} ],
									enabled : true,
									state : 'ACTIVE',
									imageURL : null,
									oauthRedirectURI : '',
									createdAt : '2017-01-23T12:23:48.561+0000',
									updatedAt : '2017-01-23T12:23:48.561+0000',
									url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39'
								};

		var app2 = {
				id : appId2,
				name : appName2,
				orgID : '58737006e4b0eacb4b593d22',
				public : true,
				description : appDesc2,
				credentials : {
					clientID : oldClientID,
					clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB',
					description : 'Default',
					url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials'
				},
				appCredentials : [ {
					id : '5885f5d4e4b0eacb4b5f6d3a',
					description : 'Default',
					url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39/credentials/5885f5d4e4b0eacb4b5f6d3a',
					clientID : '79417acb-932c-4be0-96f2-77d157226b7a',
					clientSecret : 'tF7eI2uY0yI0uG2lA3pU2sB2vN8aA0rH7dO7dS0kQ3wX1fV5jB'
				} ],
				enabled : true,
				state : 'ACTIVE',
				imageURL : null,
				oauthRedirectURI : '',
				createdAt : '2017-01-23T12:23:48.561+0000',
				updatedAt : '2017-01-23T12:23:48.561+0000',
				url : 'https://apimdev1248.hursley.ibm.com/v1/portal/orgs/58737006e4b0eacb4b593d22/apps/5885f5d4e4b0eacb4b5f6d39'
			};

		// skeleton product
		var product = {
				id: productId
		};

		var bsBsrURI = "bsBsrURI";
		var bsrURI = "svBsrURI";
		
		// sb catalog mapped to devOrg, same as above (makes non existing application with 1 sub to the product, product has no existing subs)
		it('does single catalog nothing there 1 app', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);
			var apiccli = fakeModule.create(realapiccli);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var consumersObject = {
					consumersDetails: "1.0.0",
					consumers: [consumer]
			};

			// ordering between modules is not checked but we are not testing this
			apiccli.fakeModule_addExpected(["getPublishCatalogs"], [catalog], false);
			var catalogToDevOrg = {};
			catalogToDevOrg[catalog] = devOrgName;
			apiccli.fakeModule_addExpected(["getCatalogToDevOrg"], catalogToDevOrg, false);
			
			apicdevportal.fakeModule_addExpected(["setDeveloperOrganizationName", devOrgName], null, false);
			apicdevportal.fakeModule_addExpected(["setCatalog", catalog], null, false);
			apicdevportal.fakeModule_addExpected(["getDeveloperOrganizationIdOfConfigured"], devOrg, true);
			
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer.name, consumer.description, devOrg], app, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, consumer.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer.clientID, clientSecret: "1234", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productDetails.productName, productDetails.productVersion, planName], subscription, true);
			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productDetails.productName, productDetails.productVersion, devOrg], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct", productId, devOrg], [], true);

			var ret = flowConsumers.createConsumersInCatalogs(bsBsrURI, bsrURI, consumersObject, productDetails, apicdevportal, apiccli).then(function(){
				apicdevportal.fakeModule_done();

			});
			return ret;
		});
		
		it('does two catalogs nothing there 1 app', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);
			var apiccli = fakeModule.create(realapiccli);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var consumersObject = {
					consumersDetails: "1.0.0",
					consumers: [consumer]
			};

			apiccli.fakeModule_addExpected(["getPublishCatalogs"], [catalog, catalog2], false);
			var catalogToDevOrg = {};
			catalogToDevOrg[catalog] = devOrgName;
			catalogToDevOrg[catalog2] = devOrg2Name;
			apiccli.fakeModule_addExpected(["getCatalogToDevOrg"], catalogToDevOrg, false);
			
			apicdevportal.fakeModule_addExpected(["setDeveloperOrganizationName", devOrgName], null, false);
			apicdevportal.fakeModule_addExpected(["setCatalog", catalog], null, false);
			apicdevportal.fakeModule_addExpected(["getDeveloperOrganizationIdOfConfigured"], devOrg, true);
			
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer.name, consumer.description, devOrg], app, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, consumer.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer.clientID, clientSecret: "1234", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg, productDetails.productName, productDetails.productVersion, planName], subscription, true);
			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productDetails.productName, productDetails.productVersion, devOrg], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct", productId, devOrg], [], true);

			apicdevportal.fakeModule_addExpected(["setDeveloperOrganizationName", devOrg2Name], null, false);
			apicdevportal.fakeModule_addExpected(["setCatalog", catalog2], null, false);
			apicdevportal.fakeModule_addExpected(["getDeveloperOrganizationIdOfConfigured"], devOrg2, true);
			
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg2], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer.name, consumer.description, devOrg2], {id: appId, credentials: { clientID: "1234", clientSecret: "1234" }}, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, consumer.clientID, devOrg2], {url: "http://www.ibm.com/", clientID: consumer.clientID, clientSecret: "1234", description: "Default"}, true);
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg2], [], true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlan", appId, devOrg2, productDetails.productName, productDetails.productVersion, planName], subscription, true);
			apicdevportal.fakeModule_addExpected(["retrieveProductByName", productDetails.productName, productDetails.productVersion, devOrg2], product, true);
			apicdevportal.fakeModule_addExpected(["listSubscriptionsForProduct", productId, devOrg2], [], true);
			
			var ret = flowConsumers.createConsumersInCatalogs(bsBsrURI, bsrURI, consumersObject, productDetails, apicdevportal, apiccli).then(function(){
				apicdevportal.fakeModule_done();

			});
			return ret;
		});

		// when error and nothing done in a catalog
		it('when error and nothing done in a catalog', function(done){
			var apicdevportal = fakeModule.create(realapicdevportal);
			var apiccli = fakeModule.create(realapiccli);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var consumersObject = {
					consumersDetails: "1.0.0",
					consumers: [consumer]
			};

			var thrownError = new Error("Error: expected app create error");
			
			// ordering between modules is not checked but we are not testing this
			apiccli.fakeModule_addExpected(["getPublishCatalogs"], [catalog], false);
			var catalogToDevOrg = {};
			catalogToDevOrg[catalog] = devOrgName;
			apiccli.fakeModule_addExpected(["getCatalogToDevOrg"], catalogToDevOrg, false);
			
			apicdevportal.fakeModule_addExpected(["setDeveloperOrganizationName", devOrgName], null, false);
			apicdevportal.fakeModule_addExpected(["setCatalog", catalog], null, false);
			apicdevportal.fakeModule_addExpected(["getDeveloperOrganizationIdOfConfigured"], devOrg, true);
			
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg], null, true);
			// errors when trying to create application
			apicdevportal.fakeModule_addExpected(["createApplication", consumer.name, consumer.description, devOrg], thrownError, true);
			
			flowConsumers.createConsumersInCatalogs(bsBsrURI, bsrURI, consumersObject, productDetails, apicdevportal, apiccli).then(function(){
				// error should have thrown
				done("Should have thrown");
			}).caught(function(error){
				apiccli.fakeModule_done();
				apicdevportal.fakeModule_done();

				error.toString().should.equal(thrownError.toString());
				error.catalog.should.equal(catalog);
				
				done();
			}).caught(function(error){
				done(error);
			});
		});

		// when error and have created 1 app ensure it works
		it('when error and have created 1 app ensure it works', function(done){
			var apicdevportal = fakeModule.create(realapicdevportal);
			var apiccli = fakeModule.create(realapiccli);

			var consumersDone = {
					created: [],
					updated: [],
					subscriptionsAdded: [],
					subscriptionsDeleted: []
			};

			var consumersObject = {
					consumersDetails: "1.0.0",
					consumers: [consumer]
			};

			var thrownError = new Error("Error expected checking app subscriptions");
				
			// ordering between modules is not checked but we are not testing this
			apiccli.fakeModule_addExpected(["getPublishCatalogs"], [catalog], false);
			var catalogToDevOrg = {};
			catalogToDevOrg[catalog] = devOrgName;
			apiccli.fakeModule_addExpected(["getCatalogToDevOrg"], catalogToDevOrg, false);
			
			apicdevportal.fakeModule_addExpected(["setDeveloperOrganizationName", devOrgName], null, false);
			apicdevportal.fakeModule_addExpected(["setCatalog", catalog], null, false);
			apicdevportal.fakeModule_addExpected(["getDeveloperOrganizationIdOfConfigured"], devOrg, true);
			
			apicdevportal.fakeModule_addExpected(["retrieveApplicationByName", consumer.name, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["createApplication", consumer.name, consumer.description, devOrg], app, true);
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, consumer.clientID, devOrg], {url: "http://www.ibm.com/", clientID: consumer.clientID, clientSecret: "1234", description: "Default"}, true);
			// errors when listing subscriptions
			apicdevportal.fakeModule_addExpected(["listApplicationPlanSubscriptions", appId, devOrg], thrownError, true);

			// then undos app create
			apicdevportal.fakeModule_addExpected(["setDeveloperOrganizationName", devOrgName], null, false);
			apicdevportal.fakeModule_addExpected(["setCatalog", catalog], null, false);
			apicdevportal.fakeModule_addExpected(["getDeveloperOrganizationIdOfConfigured"], devOrg, true);
			// no update credentials because the app was created so the update of credentials is not logged for undo
			apicdevportal.fakeModule_addExpected(["deleteApplication", appId, devOrg], null, true);
			
			flowConsumers.createConsumersInCatalogs(bsBsrURI, bsrURI, consumersObject, productDetails, apicdevportal, apiccli).then(function(){
				// error should have thrown
				done("Should have thrown");
			}).caught(function(error){
				console.log(error);
				console.log(error.stack);
				apiccli.fakeModule_done();
				apicdevportal.fakeModule_done();

				error.toString().should.equal(thrownError.toString());
				error.catalog.should.equal(catalog);

				done();
			}).caught(function(error){
				done(error);
			});
		});
		
	});		

	
	describe('_test_undoConsumersFromCatalog', function() {

		var planName = "premium";
		var newAPIKey = "newAPIKey";
		var newAPIKey2 = "newAPIKey2";
		var catalog = "sb";
		var appId = "1";
		var appId2 = "2";
		var appId3 = "3";
		var appId4 = "4";
		var appDesc2 = "description2";
		var devOrg = "devOrg";
		var productName = "basic-service";
		var productVersion = "1.0.0";
		var productDetails = {productName: productName, productVersion: productVersion};
		var productId = "587e3301e4b0eacb4b5d29bf";
		var subId = "5880c568e4b0eacb4b5df1e1";
		var subId2 = "123456789";
		var subId3 = "5880c568e4b0eacb4b5df1e3";
		var subId4 = "5880c568e4b0eacb4b5df1e4";

		var toRemoveObj = {
				created: [],
				updated: [],
				subscriptionsAdded: [],
				subscriptionsDeleted: [],
				appIDToName: {}
		};
		toRemoveObj.appIDToName[appId] = "App1";
		toRemoveObj.appIDToName[appId3] = "App3";
		
		// toRemove nothing in (nothing was created, no consumers)
		it('toRemove nothing in (nothing was created, no consumers)', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);

			// no expected calls
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

			});
			return ret;
		});

		// toRemove single catalog with a app create
		it('toRemove single app create', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.created = [appId];

			apicdevportal.fakeModule_addExpected(["deleteApplication", appId, devOrg], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				toRemove.created.should.have.length.of(0);
			});
			return ret;
		});

		// toRemove single catalog with a app update description
		it('toRemove single app update description', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.updated = [{appID: appId, description: appDesc2}];

			apicdevportal.fakeModule_addExpected(["updateApplication", appId, appDesc2, devOrg], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				toRemove.updated.should.have.length.of(0);
			});
			return ret;
		});

		// toRemove single catalog with a app update credentials
		it('toRemove single app update credentials', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.updated = [{appID: appId, clientID: newAPIKey}];

			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, newAPIKey, devOrg], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				toRemove.updated.should.have.length.of(0);
			});
			return ret;
		});

		// toRemove single catalog with a subscribe
		it('toRemove single subscribe', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.subscriptionsAdded = [{subID: subId, appID: appId}];

			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId, subId, devOrg], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				toRemove.subscriptionsAdded.should.have.length.of(0);
			});
			return ret;
		});
		
		// toRemove single unsubscribe
		it('toRemove single unsubscribe', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.subscriptionsDeleted = [{planName: planName, productID: productId, appID: appId3}];
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlanAndProductID", appId3, devOrg, productId, planName], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				toRemove.subscriptionsDeleted.should.have.length.of(0);
			});
			return ret;
		});
		
		// toRemove app create and subscribe
		it('toRemove app create and subscribe', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.subscriptionsAdded = [{subID: subId, appID: appId}];
			toRemove.created = [appId];

			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId, subId, devOrg], null, true);			
			apicdevportal.fakeModule_addExpected(["deleteApplication", appId, devOrg], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				toRemove.subscriptionsDeleted.should.have.length.of(0);
				toRemove.created.should.have.length.of(0);
			});
			return ret;
		});
		
		// toRemove app create, subscribe, unsubscribe
		it('toRemove app create, subscribe, unsubscribe', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.subscriptionsAdded = [{subID: subId, appID: appId}];
			toRemove.created = [appId];
			toRemove.subscriptionsDeleted = [{planName: planName, productID: productId, appID: appId3}];

			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlanAndProductID", appId3, devOrg, productId, planName], null, true);			
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId, subId, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["deleteApplication", appId, devOrg], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				toRemove.subscriptionsDeleted.should.have.length.of(0);
				toRemove.created.should.have.length.of(0);
				toRemove.subscriptionsAdded.should.have.length.of(0);
			});
			return ret;
		});

		// toRemove app create, update description, update clientID
		it('toRemove app create, update description, update clientID', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.created = [appId];
			toRemove.updated = [{appID: appId, description: appDesc2}, {appID: appId, clientID: newAPIKey}];

			apicdevportal.fakeModule_addExpected(["updateApplication", appId, appDesc2, devOrg], null, true);			
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, newAPIKey, devOrg], null, true);			
			apicdevportal.fakeModule_addExpected(["deleteApplication", appId, devOrg], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				toRemove.created.should.have.length.of(0);
				toRemove.updated.should.have.length.of(0);
			});
			return ret;
		});
		
		// toRemove multiple of same type for all types
		it('toRemove multiple of same type for all types', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.created = [appId, appId3];
			toRemove.updated = [{appID: appId, description: appDesc2}, {appID: appId, clientID: newAPIKey}];
			toRemove.subscriptionsAdded = [{subID: subId, appID: appId}, {subID: subId3, appID: appId3}];
			toRemove.subscriptionsDeleted = [{planName: planName, productID: productId, appID: appId3}, {planName: planName, productID: productId, appID: appId}];

			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlanAndProductID", appId3, devOrg, productId, planName], null, true);
			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlanAndProductID", appId, devOrg, productId, planName], null, true);
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId, subId, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId3, subId3, devOrg], null, true);
			apicdevportal.fakeModule_addExpected(["updateApplication", appId, appDesc2, devOrg], null, true);			
			apicdevportal.fakeModule_addExpected(["updateApplicationCredentials", appId, newAPIKey, devOrg], null, true);			
			apicdevportal.fakeModule_addExpected(["deleteApplication", appId, devOrg], null, true);			
			apicdevportal.fakeModule_addExpected(["deleteApplication", appId3, devOrg], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				toRemove.subscriptionsDeleted.should.have.length.of(0);
				toRemove.subscriptionsAdded.should.have.length.of(0);
				toRemove.created.should.have.length.of(0);
				toRemove.updated.should.have.length.of(0);
			});
			return ret;
		});

		// toRemove with a app create, update, unsubscribe, get error on update (second thing to do)
		it('toRemove with a app create, update, unsubscribe, get error on update (second thing to do)', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.created = [appId];
			toRemove.updated = [{appID: appId, description: appDesc2}];
			toRemove.subscriptionsDeleted = [{planName: planName, productID: productId, appID: appId3}];

			apicdevportal.fakeModule_addExpected(["subscribeApplicationToPlanAndProductID", appId3, devOrg, productId, planName], null, true);
			// update will error
			apicdevportal.fakeModule_addExpected(["updateApplication", appId, appDesc2, devOrg], new Error("Expected update failed"), true);
			apicdevportal.fakeModule_addExpected(["deleteApplication", appId, devOrg], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalog(catalog, toRemove, devOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				toRemove.created.should.have.length.of(0);
				// update was not undone
				toRemove.updated.should.have.length.of(1);
				toRemove.subscriptionsDeleted.should.have.length.of(0);
			});
			return ret;
		});
		
		
	});	

	
	// _test_undoConsumersFromCatalogs
	describe('_test_undoConsumersFromCatalogs', function() {

		var planName = "premium";
		var newAPIKey = "newAPIKey";
		var newAPIKey2 = "newAPIKey2";
		var catalog = "sb";
		var catalog2 = "production";
		var appId = "1";
		var appId2 = "2";
		var appId3 = "3";
		var appId4 = "4";
		var appDesc2 = "description2";
		var devOrg = "devOrg";
		var devOrgName = "devOrgName";
		var devOrg2 = "devOrg2";
		var devOrgName2 = "devOrgName2";
		var productName = "basic-service";
		var productVersion = "1.0.0";
		var productDetails = {productName: productName, productVersion: productVersion};
		var productId = "587e3301e4b0eacb4b5d29bf";
		var subId = "5880c568e4b0eacb4b5df1e1";
		var subId2 = "123456789";
		var subId3 = "5880c568e4b0eacb4b5df1e3";
		var subId4 = "5880c568e4b0eacb4b5df1e4";

		var toRemoveObj = {
				created: [],
				updated: [],
				subscriptionsAdded: [],
				subscriptionsDeleted: [],
				appIDToName: {}
		};
		toRemoveObj.appIDToName[appId] = "App1";
		toRemoveObj.appIDToName[appId3] = "App3";

		// undos for one catalog and one change
		it('undos for one catalog and one change', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {};
			
			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.created = [appId];
			consumersDone[catalog] = toRemove;
			consumersDone._doneCatalogs = [catalog];

			var catalogToDevOrg = {};
			catalogToDevOrg[catalog] = devOrgName;

			apicdevportal.fakeModule_addExpected(["setDeveloperOrganizationName", devOrgName], null, false);
			apicdevportal.fakeModule_addExpected(["setCatalog", catalog], null, false);
			apicdevportal.fakeModule_addExpected(["getDeveloperOrganizationIdOfConfigured"], devOrg, true);
			
			apicdevportal.fakeModule_addExpected(["deleteApplication", appId, devOrg], null, true);			
			var ret = flowConsumers._test_undoConsumersFromCatalogs(consumersDone, catalogToDevOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				consumersDone[catalog].created.should.have.length.of(0);
			});
			return ret;
		});
		
		// undos for multiple catalogs with one change each (_test_undoConsumersFromCatalog checks details of undoes for each catalog)
		it('undos for multiple catalogs with one change each', function(){
			var apicdevportal = fakeModule.create(realapicdevportal);

			var consumersDone = {};
			
			var toRemove = _.cloneDeep(toRemoveObj);
			toRemove.created = [appId];
			consumersDone[catalog] = toRemove;
			var toRemove2 = _.cloneDeep(toRemoveObj);
			toRemove2.subscriptionsAdded = [{subID: subId, appID: appId}];
			consumersDone[catalog2] = toRemove2;
			consumersDone._doneCatalogs = [catalog, catalog2];

			var catalogToDevOrg = {};
			catalogToDevOrg[catalog] = devOrgName;
			catalogToDevOrg[catalog2] = devOrgName2;
			
			apicdevportal.fakeModule_addExpected(["setDeveloperOrganizationName", devOrgName], null, false);
			apicdevportal.fakeModule_addExpected(["setCatalog", catalog], null, false);
			apicdevportal.fakeModule_addExpected(["getDeveloperOrganizationIdOfConfigured"], devOrg, true);
			apicdevportal.fakeModule_addExpected(["deleteApplication", appId, devOrg], null, true);
			
			apicdevportal.fakeModule_addExpected(["setDeveloperOrganizationName", devOrgName2], null, false);
			apicdevportal.fakeModule_addExpected(["setCatalog", catalog2], null, false);
			apicdevportal.fakeModule_addExpected(["getDeveloperOrganizationIdOfConfigured"], devOrg2, true);
			apicdevportal.fakeModule_addExpected(["unsubscribeApplicationFromPlan", appId, subId, devOrg2], null, true);
			
			var ret = flowConsumers._test_undoConsumersFromCatalogs(consumersDone, catalogToDevOrg, apicdevportal).then(function(){
				apicdevportal.fakeModule_done();

				consumersDone[catalog].created.should.have.length.of(0);
				consumersDone[catalog2].subscriptionsAdded.should.have.length.of(0);
			});
			return ret;
		});
		
		
	});	
	
});
