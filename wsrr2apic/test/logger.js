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
// Run these using "./node_modules/.bin/mocha --reporter spec --grep logger"

var should = require('chai').should();

var logger = require('../lib/Logger');

// unit tests for logger - visually inspect to see if it works
describe('logger_fvttests', function(){

	// initialize the logger and wait
	before(function(done){
		logger.initialize(function() {
			done();
		});		
	});
	
// entry function
describe('entry', function() {
	  this.timeout(15000);
	  it('logs single data', function(done) {

		  logger.entry("TEST");
		  
		  done();
	  });
	  it('logs multiple data', function(done) {

		  logger.entry("TEST", "param1", "param2");
		  
		  done();
	  });
	  it('logs object data', function(done) {

		  logger.entry("TEST", {param1: "value1", param2: "value2"}, "param2");
		  
		  done();
	  });
});

describe('exit', function() {
	  this.timeout(15000);
	  it('logs single data', function(done) {

		  logger.exit("TEST");
		  
		  done();
	  });
	  it('logs multiple data', function(done) {

		  logger.exit("TEST", "param1", "param2");
		  
		  done();
	  });
	  it('logs object data', function(done) {

		  logger.exit("TEST", {param1: "value1", param2: "value2"}, "param2");
		  
		  done();
	  });

});

});
