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
 * Unit tests for ttResults.
 * 
 */

var should = require('chai').should();

var ttResults = require('../lib/ttResults');

describe('unittests_ttResults', function(){

	describe('create', function() {
		
		it('should create an object', function() {
			var res = ttResults.create();
		});

		it('should create a unique object', function() {
			var res = ttResults.create();
			var res2 = ttResults.create();

			res.setSuccess(false);

			var theRes = res.getResults();
			theRes.should.have.property("success", false);
			var theRes2 = res2.getResults();
			theRes2.should.have.property("success", true);
			
		});
		
	});

	describe('setSuccess', function() {
		
		it('should set Success true', function() {
			var res = ttResults.create();
			res.setSuccess(true);
			
			var theRes = res.getResults();
			theRes.should.have.property("success", true);
		});

		it('should set Success false', function() {
			var res = ttResults.create();
			res.setSuccess(false);
			
			var theRes = res.getResults();
			theRes.should.have.property("success", false);
		});

	});

	describe('addBusinessService', function() {
		
		it('should add business service', function() {
			var res = ttResults.create();
			var bs = ttResults.createBSResultsItem("name", "1.0", "description", "bsrURI", true);
			res.addBusinessService(bs);
			
			var theRes = res.getResults();
			theRes.should.have.deep.property("details.0.name", "name");
			theRes.should.have.deep.property("details.0.version", "1.0");
			theRes.should.have.deep.property("details.0.description", "description");
			theRes.should.have.deep.property("details.0.bsrURI", "bsrURI");
			theRes.should.have.deep.property("details.0.success", true);			
		});

		it('should add business service and use the true success value', function() {
			var res = ttResults.create();
			var bs = ttResults.createBSResultsItem("name", "1.0", "description", "bsrURI", true);
			res.addBusinessService(bs);
			var theRes = res.getResults();
			theRes.should.have.property("success", true);
		});

		it('should add business service and use the false success value', function() {
			var res = ttResults.create();
			var bs = ttResults.createBSResultsItem("name", "1.0", "description", "bsrURI", false);
			res.addBusinessService(bs);
			
			var theRes = res.getResults();
			theRes.should.have.property("success", false);
		});

	});
	
	describe('createResultsItem', function() {
		
		it('should create a Results Item', function() {
			
			var res = ttResults.createSVResultsItem("name", "1.0", "description", "bsrURI", true);
			res.captureAttempted = true;
			res.captureSuccess = true;
			res.pushAttempted = true;
			res.pushSuccess = true;
			res.publishAttempted = true;
			res.publishSuccess = true;

			res.should.have.property("name", "name");
			res.should.have.property("version", "1.0");
			res.should.have.property("description", "description");
			res.should.have.property("bsrURI", "bsrURI");
			res.should.have.property("success", true);
			res.should.have.property("captureAttempted", true);
			res.should.have.property("captureSuccess", true);
			res.should.have.property("pushAttempted", true);
			res.should.have.property("pushSuccess", true);
			res.should.have.property("publishAttempted", true);
			res.should.have.property("publishSuccess", true);
		});

		it('should create a Results Item and default attempteds', function() {
			var res = ttResults.createSVResultsItem("name", "1.0", "description", "bsrURI", true);
			res.should.have.property("name", "name");
			res.should.have.property("version", "1.0");
			res.should.have.property("description", "description");
			res.should.have.property("bsrURI", "bsrURI");
			res.should.have.property("success", true);
			res.should.have.property("captureAttempted", false);
			res.should.have.property("captureSuccess", false);
			res.should.have.property("pushAttempted", false);
			res.should.have.property("pushSuccess", false);
			res.should.have.property("publishAttempted", false);
			res.should.have.property("publishSuccess", false);
			res.should.have.property("consumersAttempted", false);
			res.should.have.property("consumersSuccess", false);
		});

	});

	describe('addServiceVersion', function() {
		
		it('should add a version', function() {
			var res = ttResults.createBSResultsItem("name", "1.0", "description", "bsrURI", true);
			var sv = ttResults.createSVResultsItem("name2", "2.0", "description2", "bsrURI2", true);
			ttResults.addServiceVersion(res, sv);
			
			res.should.have.property("name", "name");
			res.should.have.property("version", "1.0");
			res.should.have.property("description", "description");
			res.should.have.property("bsrURI", "bsrURI");
			res.should.have.property("success", true);
			
			res.should.have.deep.property("versions.0.name", "name2");
			res.should.have.deep.property("versions.0.version", "2.0");
			res.should.have.deep.property("versions.0.description", "description2");
			res.should.have.deep.property("versions.0.bsrURI", "bsrURI2");
			res.should.have.deep.property("versions.0.success", true);
			
		});

		it('should add a version taking the success value', function() {
			var res = ttResults.createBSResultsItem("name", "1.0", "description", "bsrURI", true);
			var sv = ttResults.createSVResultsItem("name2", "2.0", "description2", "bsrURI2", false);
			ttResults.addServiceVersion(res, sv);
			
			// bs success should be false now
			res.should.have.property("success", false);
			
			res.should.have.deep.property("versions.0.success", false);
			
		});
		
	});

});
