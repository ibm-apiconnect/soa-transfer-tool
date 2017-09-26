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

// unit tests for flow
describe('unittests_flow', function(){
	before(function(done){
		logger.initialize(function() {
			done();
		});		
	});

	this.timeout(10000);

	/*
	 * Validate the consumers object contains the correct fields.
	 * 
	 * consumersDetails: 1.0.0
	 * 
	 * consumers: [ {consumer object} ]
	 * 
	 * consumer object: {
	 * 	name: string
	 *  description: string
	 *  clientID: string
	 *  duplicateClientID: string
	 *  planName: string
	 * } 
	 * 
	 * Parameters:
	 * consumers - object.
	 * plans - array of plan names that are valid
	 * 
	 * Throws an error describing the issue if not valid, else returns nothing.
	 * 
	 */
	describe('validateConsumersObject', function() {
		var valid = {
			consumersDetails: "1.0.0",
			productName: "name",
			productVersion: "version",
			consumers: [
			            {
			            	name: "name",
			            	description: "desc",
			            	clientID: "id",
			            	duplicateClientID: "id",
			            	planName: "plan"
			            },
			            {
			            	name: "name2",
			            	description: "desc2",
			            	clientID: "id2",
			            	duplicateClientID: "id2",
			            	planName: "plan2"
			            } 			            
			            ]
		};
		var plans = ["plan", "plan2"];
		
		it('fails an empty object', function(done) {
			var obj = {};
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});
		
		it('fails wrong version', function(done) {
			var obj = {consumersDetails: "1.2.0"};
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});

		it('passes valid', function() {
			var obj = _.cloneDeep(valid);
			flowConsumers.validateConsumersObject(obj, plans);
		});

		it('passes valid no consumers', function() {
			var obj = _.cloneDeep(valid);
			obj.consumers = [];			
			flowConsumers.validateConsumersObject(obj, plans);
		});

		it('passes valid 1 consumer', function() {
			var obj = _.cloneDeep(valid);
			obj.consumers = [obj.consumers[0]];
			flowConsumers.validateConsumersObject(obj, plans);
		});

		it('fails missing consumers', function(done) {
			var obj = _.cloneDeep(valid);
			delete obj.consumers;
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});

		it('fails consumers is not array', function(done) {
			var obj = _.cloneDeep(valid);
			obj.consumers = "not array";
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});

		it('fails consumer missing name', function(done) {
			var obj = _.cloneDeep(valid);
			delete obj.consumers[0].name;
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});
		it('fails consumer empty name', function(done) {
			var obj = _.cloneDeep(valid);
			obj.consumers[0].name = "";
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});

		it('fails consumer missing description', function(done) {
			var obj = _.cloneDeep(valid);
			delete obj.consumers[0].description;
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});

		it('fails consumer missing clientID', function(done) {
			var obj = _.cloneDeep(valid);
			delete obj.consumers[0].clientID;
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});

		it('fails consumer missing duplicateClientID', function(done) {
			var obj = _.cloneDeep(valid);
			delete obj.consumers[0].duplicateClientID;
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});

		it('fails consumer missing planName', function(done) {
			var obj = _.cloneDeep(valid);
			delete obj.consumers[0].planName;
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});
		it('fails consumer empty planName', function(done) {
			var obj = _.cloneDeep(valid);
			obj.consumers[0].planName = "";
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});

		it('fails second consumer missing planName', function(done) {
			var obj = _.cloneDeep(valid);
			delete obj.consumers[1].planName;
			try {
				flowConsumers.validateConsumersObject(obj, plans);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});

		it('fails bad plan name', function(done) {
			// missing plan2
			var missingPlan2 = ["plan"];
			try {
				flowConsumers.validateConsumersObject(valid, missingPlan2);
				done("expect fail");
			}catch (error) {
				// expected
				done();
			}
		});

	});
	
	describe('_test_checkForDuplicateSubscriptions', function() {
		var consumers = [
		                 {
		                	 name: "Test App",
		                	 description: "Desc",
		                	 clientID: "",
		                	 duplicateClientID: "",
		                	 planName: "basic"
		                 },
		                 {
		                	 name: "Maths App",
		                	 description: "Maths calculator application",
		                	 clientID: "",
		                	 duplicateClientID: "",
		                	 planName: "basic"
		                 },
		                 {
		                	 name: "Website",
		                	 description: "website application",
		                	 clientID: "",
		                	 duplicateClientID: "",
		                	 planName: "premium"
		                 }
		                 ];
		
		it("returns the same list when no duplicates", function(){
			var ret = flowConsumers._test_checkForDuplicateSubscriptions(consumers);
			ret.consumers.should.deep.equal(consumers);
		});

		it("returns the correct list when 2 duplicate", function(){
			var dupConsumers = _.cloneDeep(consumers);
			var dups = [];
			dups.push(
	                 {
	                	 name: "Website",
	                	 description: "website application",
	                	 clientID: "",
	                	 duplicateClientID: "",
	                	 planName: "basic"
	                 }
					);
			dups.push(
	                 {
	                	 name: "Maths App",
	                	 description: "Maths calculator application",
	                	 clientID: "",
	                	 duplicateClientID: "",
	                	 planName: "premium"
	                 }
					);
			dupConsumers.push(dups[0]);
			dupConsumers.push(dups[1]);
			var ret = flowConsumers._test_checkForDuplicateSubscriptions(dupConsumers);
			// should be the original one and ignore the extra 2 consumers
			ret.consumers.should.deep.equal(consumers);
			ret.duplicates.should.deep.equal(dups);
		});
		
	});
	
});
