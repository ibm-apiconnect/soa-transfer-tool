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
// Run these using "./node_modules/.bin/mocha --reporter spec --grep apimdevportal_fvt"

var should = require('chai').should(),
expect = require('chai').expect;

var apimdevportal = require('../lib/apimdevportal'), propertyParse = require("properties-parser"), fs = require('fs'), Promise = require('bluebird'), crypto = require('crypto'), 
logger = require('../lib/Logger'), _ = require('lodash');

var devOrgId = "57446637e4b0fe43584c5909";
var devOrgName = "wsrrdev";

var inputOptions = null;

var appsCreated = [];

var randomKey = "";

// fvt tests for apim portal API
describe('apimdevportal_fvttests', function() {

	// before all, set connection and get dev org id
	before(function(done){
		this.timeout(15000);

		console.log("*** before");

		// make random key for names
		var buf = crypto.randomBytes(10);
		randomKey = buf.toString("hex");
		
		// read config
		var wsrr2apicProperties = fs.readFileSync("./connectionproperties.properties");
		inputOptions = propertyParse.parse(wsrr2apicProperties);

		// initialize logger
		logger.initialize(function(){
			// set details with good details
			apimdevportal.setConnectionDetails(inputOptions);
	
			// find the dev org ID from the name in the config
			apimdevportal.getDeveloperOrganizationIdOfConfigured().then(function(id){
				// store
				devOrgId = id;
				
				// check there is a product basic-service:1.0 else some tests will fail
				return apimdevportal.retrieveProductByName("basic-service", "1.0", devOrgId);
			}).then(function(product) {
				if(product === null) {
					throw new Error("Product basic-service:1.0 must be published in the catalog");
				}				
				done();
			});
		});
	});
	
	describe('createApplication', function() {
		this.timeout(15000);
		it('creates a valid application', function() {
			// create app
			return apimdevportal.createApplication("Test" + randomKey, "Test Description",
					devOrgId).then(function(application) {
				console.log("createApplication:");
				console.dir(application);
				
				appsCreated.push(application.id);
			});
		});

	});

	describe('listDeveloperOrganizations', function() {
		this.timeout(15000);
		it('lists all the orgs', function() {
			// list orgs
			return apimdevportal.listDeveloperOrganizations().then(function(orgs) {
				console.log("listDeveloperOrganizations:");
				console.dir(orgs);
				expect(orgs).to.not.equal(null);
			});
		});

		it('lists orgs with a filter', function() {
			// list orgs
			return apimdevportal.listDeveloperOrganizations("wsrrdev").then(function(orgs) {
				console.log("listDeveloperOrganizations:");
				console.dir(orgs);
				expect(orgs).to.not.equal(null);
			});
		});

	});

	describe('getDeveloperOrganizationId', function() {
		this.timeout(15000);
		it('gets known ID', function() {
			// get known existing org (is done in before but test explicitly here)
			return apimdevportal.getDeveloperOrganizationId(devOrgName).then(function(id) {
				console.log("getDeveloperOrganizationId:");
				console.log(id);
			});
		});

		it('errors for unknown ID', function(done) {
			// list orgs
			apimdevportal.getDeveloperOrganizationId("UNKNOWN").then(function(id) {
				throw new Error("Should have errored");
			}).caught(function(error){
				// expected
				done();
			});
		});

	});

	
	describe('listApplications', function() {
		this.timeout(15000);
		it('lists all the applications', function() {
			// list apps
			return apimdevportal.listApplications(devOrgId).then(function(apps) {
				console.log("listApplications:");
				console.dir(apps);
				expect(apps).to.not.equal(null);
			});
		});

	});

	describe('listProducts', function() {
		this.timeout(15000);
		it('lists all the products', function() {
			// list apps
			return apimdevportal.listProducts(devOrgId).then(function(prods) {
				console.log("listProducts:");
				console.dir(prods);
				expect(prods).to.not.equal(null);
			});
		});

	});
	
	describe('retrieveApplicationByName', function() {
		this.timeout(15000);
		it('gets a known application', function() {
			// make app first
			return apimdevportal.createApplication("TestToRetrieve" + randomKey, "Test Description",
					devOrgId).then(function(application) {
						
				appsCreated.push(application.id);
						
				// get app by name
				return apimdevportal.retrieveApplicationByName("TestToRetrieve" + randomKey, devOrgId).then(function(app) {
					console.log("retrieveApplicationByName:");
					console.dir(app);
					expect(app).to.not.equal(null);
				});
			});
		});

		it('returns null for an unknown application', function() {
			// get app
			return apimdevportal.retrieveApplicationByName("UNKNOWN", devOrgId).then(function(app) {
				console.log("retrieveApplicationByName:");
				expect(app).to.equal(null);
			});
		});

	});

	describe('deleteApplication', function() {
		this.timeout(15000);
		it('deletes an application', function() {
			// create app so we can delete it
			return apimdevportal.createApplication("TestToDelete" + randomKey, "Test Description",
					devOrgId).then(function(application) {
				console.log("createApplication:");
				console.dir(application);
				// now delete, return 
				return apimdevportal.deleteApplication(application.id, devOrgId);
			}).then(function(){
				// see if it still exists
				return apimdevportal.retrieveApplicationByName("TestToDelete" + randomKey, devOrgId);
			}).then(function(application){
				// should be null if delete worked
				expect(application).to.equal(null);				
			});
		});

	});

	//TODO: might need to publish out basic-service in this test so it will work... or find an API to sub to
	describe('subscribeApplicationToPlan', function() {
		this.timeout(15000);
		it('subscribes an application to basic-service:1.0 *** assumes this is published ***', function() {
			// create app using the dev org ID so we can subscribe to it and hardcoded product/plan
			var app = null;
			return apimdevportal.createApplication("TestToSubscribe" + randomKey, "Test Description",
					devOrgId).then(function(application) {
				console.log("createApplication:");
				console.dir(application);
				appsCreated.push(application.id);
				
				app = application;
				// now subscribe - assumes basic service is published
				return apimdevportal.subscribeApplicationToPlan(application.id, devOrgId, "basic-service", "1.0", "sld-basicservices");
			});
		});

	});

	describe('subscribeApplicationToPlanAndProductID', function() {
		this.timeout(15000);
		it('subscribes an application to basic-service:1.0 using product ID *** assumes this is published ***', function() {
			// create app using the dev org ID so we can subscribe to it and hardcoded product/plan
			var app = null;
			var prod = null;
			return apimdevportal.createApplication("TestToSubscribe" + randomKey, "Test Description",
					devOrgId).then(function(application) {
				console.log("createApplication:");
				console.dir(application);
				appsCreated.push(application.id);
				
				app = application;
				// retrieve product
				return apimdevportal.retrieveProductByName("basic-service", "1.0", devOrgId);
			}).then(function(product){
				
				prod = product;
				
				if(product === null) {
					throw new Error("basic-service 1.0 must exist in Catalog");
				}
				// now subscribe by product id
				return apimdevportal.subscribeApplicationToPlanAndProductID(app.id, devOrgId, product.id, "sld-basicservices");
			}).then(function(){
				// check the subscription exists
				return apimdevportal.listApplicationPlanSubscriptions(app.id, devOrgId);
			}).then(function(subs){
				var found = false;
				for(var i = 0, len = subs.length; i < len; i++) {
					var sub = subs[i];
					if(sub.product.id === prod.id) {
						found = true;
					}
				}
				found.should.equal(true);				
			});
		});

	});
	
	// test change app credentials
	describe('updateApplicationCredentials', function() {
		this.timeout(15000);
		it('updates an application', function() {
			// create app to test on
			return apimdevportal.createApplication("Test2_" + randomKey, "Test Description",
					devOrgId).then(function(application) {
				console.log("createApplication:");
				console.dir(application);
				
				appsCreated.push(application.id);
				
				// update credentials - the actual test
				return apimdevportal.updateApplicationCredentials(application.id, "TEST_ID", devOrgId);
			}).then(function(updates) {
				console.log("updateApplicationCredentials:");
				console.dir(updates);
				
				updates.clientID.should.equal("TEST_ID");
			});
		});

	});

	// test change app 
	describe('updateApplication', function() {
		this.timeout(15000);
		it('updates an application description', function() {
			// create app to test on
			return apimdevportal.createApplication("Test2Desc_" + randomKey, "Test Description",
					devOrgId).then(function(application) {
				console.log("createApplication:");
				console.dir(application);
				
				appsCreated.push(application.id);
				
				// update credentials - the actual test
				return apimdevportal.updateApplication(application.id, "New Description", devOrgId);
			}).then(function(updates) {
				console.log("updateApplication:");
				console.dir(updates);
				
				updates.description.should.equal("New Description");
			});
		});

	});

	// test set Catalog
	describe('setCatalog', function() {
		this.timeout(30000);
		it('uses the set catalog', function(done) {
			// set connection 
			apimdevportal.setConnectionDetails(inputOptions);
			
			// set to bad catalog
			apimdevportal.setCatalog("bad");
			
			// list orgs for bad catalog
			return apimdevportal.listDeveloperOrganizations().then(function(orgs) {
				console.log("listDeveloperOrganizations should have thrown");
				done("listDeveloperOrganizations should have thrown");
			}).caught(function(error) {
				// expected error
				console.log("listDeveloperOrganizations expected error:");
				console.log(error);
				
				// set to good catalog
				apimdevportal.setCatalog("sb");
				return apimdevportal.listDeveloperOrganizations();
			}).then(function(orgs){
				// worked
				console.log("listDeveloperOrganizations:");
				console.dir(orgs);
				
				done();
			});
		});

	});

	//	listApplicationPlanSubscriptions
	describe('listApplicationPlanSubscriptions', function() {
		this.timeout(15000);
		it('gets application subscriptions to basic-service:1.0 *** assumes this is published ***', function() {
			// create app using the dev org ID so we can subscribe to it and hardcoded product/plan
			var app = null;
			return apimdevportal.createApplication("TestToSubscribe2" + randomKey, "Test Description",
					devOrgId).then(function(application) {
				console.log("createApplication:");
				console.dir(application);
				appsCreated.push(application.id);
				
				app = application;
				
				// get subscriptions - should be empty
				return apimdevportal.listApplicationPlanSubscriptions(application.id, devOrgId);
			}).then(function(subscriptions){
				console.log("listApplicationPlanSubscriptions:");
				console.dir(subscriptions);
				
				subscriptions.should.be.of.length(0);
				
				// now subscribe - assumes basic service is published
				return apimdevportal.subscribeApplicationToPlan(app.id, devOrgId, "basic-service", "1.0", "sld-basicservices");
			}).then(function() {
				console.log("Subscribed to basic-service");
				
				// get subscriptions
				return apimdevportal.listApplicationPlanSubscriptions(app.id, devOrgId);
			}).then(function(subscriptions){
				console.log("listApplicationPlanSubscriptions:");
				console.dir(subscriptions);
				
				// should be one
				subscriptions.should.be.of.length(1);
				
				subscriptions[0].should.have.deep.property("app.id", app.id);
				subscriptions[0].should.have.deep.property("plan", "sld-basicservices");
				subscriptions[0].should.have.deep.property("product.name", "basic-service");
				subscriptions[0].should.have.deep.property("product.version", "1.0");
			});
		});

	});

	// listSubscriptionsForProduct
	describe('listSubscriptionsForProduct', function() {
		this.timeout(20000);
		it('gets all subscriptions to basic-service:1.0 *** assumes this is published ***', function() {
			// create app using the dev org ID so we can subscribe to it and hardcoded product/plan
			var app = null;
			var prod = null;
			var subsLen = 0;
			return apimdevportal.createApplication("TestToSubscribe3" + randomKey, "Test Description",
					devOrgId).then(function(application) {
				console.log("createApplication:");
				console.dir(application);
				appsCreated.push(application.id);
				
				app = application;
				// get product ID
				return apimdevportal.retrieveProductByName("basic-service", "1.0", devOrgId);
			}).then(function(product) {
				prod = product;
				
				// get subscriptions
				return apimdevportal.listSubscriptionsForProduct(prod.id, devOrgId);
			}).then(function(subscriptions){
				console.log("listSubscriptionsForProduct:");
				console.dir(subscriptions);
				subsLen = subscriptions.length;
				
				// now subscribe - assumes basic service is published
				return apimdevportal.subscribeApplicationToPlan(app.id, devOrgId, "basic-service", "1.0", "sld-basicservices");
			}).then(function() {
				console.log("Subscribed to basic-service");
				
				// get subscriptions
				return apimdevportal.listSubscriptionsForProduct(prod.id, devOrgId);
			}).then(function(subscriptions){
				console.log("listSubscriptionsForProduct:");
				console.dir(subscriptions);
				
				// should be one more
				subscriptions.should.be.of.length(subsLen + 1);
				
				// find expected subscription in the list
				for(var i = 0, len = subscriptions.length; i < len; i++) {
					if(subscriptions[i].app.id === app.id) {
						// check
						subscriptions[i].should.have.deep.property("app.id", app.id);
						subscriptions[i].should.have.deep.property("plan", "sld-basicservices");
						subscriptions[i].should.have.deep.property("product.name", "basic-service");
						subscriptions[i].should.have.deep.property("product.version", "1.0");
					}
				}
				
			});
		});

	});
	
	// unsubscribeApplicationFromPlan
	describe('unsubscribeApplicationFromPlan', function() {
		this.timeout(15000);
		it('unsubscribed from basic-service:1.0 *** assumes this is published ***', function() {
			// create app using the dev org ID so we can subscribe to it and hardcoded product/plan
			var app = null;
			return apimdevportal.createApplication("TestToSubscribe4" + randomKey, "Test Description",
					devOrgId).then(function(application) {
				console.log("createApplication:");
				console.dir(application);
				appsCreated.push(application.id);
				
				app = application;
				
				// now subscribe - assumes basic service is published
				return apimdevportal.subscribeApplicationToPlan(app.id, devOrgId, "basic-service", "1.0", "sld-basicservices");
			}).then(function(subscription) {
				console.log("Subscribed to basic-service");
				
				// unsubscribe
				console.log("Unsubscribing from basic-service");
				return apimdevportal.unsubscribeApplicationFromPlan(app.id, subscription.id, devOrgId);
			});
		});

	});

	describe('retrieveProductByName', function() {
		this.timeout(15000);
		it('gets a known product basic-service:1.0 *** assumes this is published *** ', function() {
			return apimdevportal.retrieveProductByName("basic-service", "1.0", devOrgId).then(function(product) {
				console.log("retrieveProductByName:");
				console.dir(product);
				expect(product).to.not.equal(null);
			});
		});

		it('gets a known product with no version set basic-service:1.0 *** assumes this is published *** ', function() {
			return apimdevportal.retrieveProductByName("basic-service", null, devOrgId).then(function(product) {
				console.log("retrieveProductByName:");
				console.dir(product);
				expect(product).to.not.equal(null);
			});
		});

		it('returns null for an unknown product', function() {
			// get app
			return apimdevportal.retrieveProductByName("UNKNOWN", null, devOrgId).then(function(prod) {
				console.log("retrieveProductByName:");
				expect(prod).to.equal(null);
			});
		});

	});
	
	
	// run after all
	after(function(done){
		console.log("*** after");

		this.timeout(30000);
		
		var promises = [];
		// delete the apps we made
		for(var i = 0; i < appsCreated.length; i++) {
			var id = appsCreated[i];
			console.log("Deleting " + id);
			
			var delPromise = apimdevportal.deleteApplication(id, devOrgId).caught(function(error){
				// failed to delete, log and continue the others
				console.error(error);
			});
			promises.push(delPromise);
		}
		var promise = Promise.all(promises).then(function(){
			console.log("Delete done");
			done();
		});
	});

});
