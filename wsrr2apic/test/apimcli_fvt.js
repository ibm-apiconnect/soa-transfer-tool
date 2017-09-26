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
// Run these using "./node_modules/.bin/mocha --reporter spec --grep apimcli_fvt"

/*
 * Tests assume a catalog "sb" which is a sandbox.
 * Test use the connectionproperties.properties file and this should contain valid details of an APIC system.
 * 
 */

var should = require('chai').should();

var apimcli = require('../lib/apimcli'), propertyParse = require("properties-parser"), fs = require('fs'), Promise = require('bluebird'),
logger = require('../lib/Logger');

// fvt tests for apimcli - visually inspect
describe('apimfvttests', function(){

	before(function(done){
		// initialize logger
		logger.initialize(done);
	});
	
describe('setConnectionDetails', function() {
	  this.timeout(30000);
	  it('sets connection details', function() {
			var wsrr2apicProperties = fs
			.readFileSync("./connectionproperties.properties");
			var inputOptions = propertyParse.parse(wsrr2apicProperties);

		  return apimcli.setConnectionDetails(inputOptions).then(function(results) {
			  console.log("setConnectionDetails: " + results.stdout);
		  });
	  });

	  it('rejects the promise if the connection details are bad', function(done) {
			var wsrr2apicProperties = fs
			.readFileSync("./connectionproperties.properties");
			var inputOptions = propertyParse.parse(wsrr2apicProperties);
			// no password - bad
			inputOptions.apiPassword = " ";
			
		  apimcli.setConnectionDetails(inputOptions).then(function(results) {
			  console.log("setConnectionDetails should have errored");
			  done("should have errored");
		  }).caught(function(error){
			  // expected
			  console.log("expected error");
			  done();
		  });
	  });

});

describe('validate', function() {
	  this.timeout(15000);
	  it('validates a correct file', function() {
		  return apimcli.validate("test/valid_api.yaml").then(function(results) {
			  console.log("validate: " + results.stdout);
		  });
	  });

	  it('fails validating an incorrect file', function() {
		  return apimcli.validate("test/invalid_api.yaml").then(function(results) {
			  fail("should have invalidated");
		  })
		  .caught(function(error){
			  console.log("Expected error: " + error);
		  });
	  });

});

describe('push', function() {
	  this.timeout(60000);
	  it('pushes a correct file', function() {
		  
			var wsrr2apicProperties = fs
			.readFileSync("./connectionproperties.properties");
			var inputOptions = propertyParse.parse(wsrr2apicProperties);

		  return apimcli.setConnectionDetails(inputOptions).then(function(results1) {
			  return apimcli.push("test/valid_api.yaml").then(function(results2) {
				  console.log("push: " + results2.stdout);
			  });
		  });
		  
	  });
});

describe('publishFromDrafts', function() {
	  this.timeout(60000);
	  it('publishes something in drafts', function() {
		  
			var wsrr2apicProperties = fs
			.readFileSync("./connectionproperties.properties");
			var inputOptions = propertyParse.parse(wsrr2apicProperties);

		  return apimcli.setConnectionDetails(inputOptions).then(function(results1) {
			  return apimcli.push("test/valid_product.yaml").then(function(results2) {
				  // assumes there is a "sb" catalog
				  console.log("push: " + results2.stdout);
				  return apimcli.publishFromDrafts("valid-product", "1.0.0", "sb", ".").then(function(results3) {
					  console.log("publishFromDrafts: " + results3.stdout);
					  // done
				  });
			  });
		  });
		  
	  });
});

describe('publishFromDraftsSpaces', function() {
	  this.timeout(60000);
	  it('publishes something in drafts into a catalog with spaces', function() {
		  
			var wsrr2apicProperties = fs
			.readFileSync("./connectionproperties.properties");
			var inputOptions = propertyParse.parse(wsrr2apicProperties);

		  return apimcli.setConnectionDetails(inputOptions).then(function(results1) {
			  return apimcli.push("test/valid_product.yaml").then(function(results2) {
				  // assumes there is a "sb" catalog
				  console.log("push: " + results2.stdout);
				  return apimcli.publishFromDrafts("valid-product", "1.0.0", "spaces", ".","test-space").then(function(results3) {
					  console.log("publishFromDrafts: " + results3.stdout);
					  // done
				  });
			  });
		  });
		  
	  });
});


describe('productsSet', function() {
	  this.timeout(60000);
	  it('sets to retired', function() {
		  
			var wsrr2apicProperties = fs
			.readFileSync("./connectionproperties.properties");
			var inputOptions = propertyParse.parse(wsrr2apicProperties);

		  return apimcli.setConnectionDetails(inputOptions).then(function(results1) {
			  return apimcli.push("test/valid_product.yaml").then(function(results2) {
				  // assumes there is a "sb" catalog
				  console.log("push: " + results2.stdout);
				  return apimcli.publishFromDrafts("valid-product", "1.0.0", "sb", ".").then(function(results3) {
					  console.log("publishFromDrafts: " + results3.stdout);
					  return apimcli.productsSet("valid-product", "1.0.0", "retired", "sb").then(function(results4){
						  console.log("productsSet: " + results4.stdout);
						  // done
					  });
				  });
			  });
		  });
		  
	  });
});

describe('productsSetSpaces', function() {
	  this.timeout(60000);
	  it('sets to retired in Spaces Catalog', function() {
		  
			var wsrr2apicProperties = fs
			.readFileSync("./connectionproperties.properties");
			var inputOptions = propertyParse.parse(wsrr2apicProperties);

		  return apimcli.setConnectionDetails(inputOptions).then(function(results1) {
			  return apimcli.push("test/valid_product.yaml").then(function(results2) {
				  // assumes there is a "space" catalog with a space called "test-space
				  console.log("push: " + results2.stdout);
				  return apimcli.publishFromDrafts("valid-product", "1.0.0", "spaces", ".","test-space").then(function(results3) {
					  console.log("publishFromDrafts: " + results3.stdout);
					  return apimcli.productsSet("valid-product", "1.0.0", "retired", "spaces","test-space").then(function(results4){
						  console.log("productsSet: " + results4.stdout);
						  // done
					  });
				  });
			  });
		  });
		  
	  });
});

describe('productsDelete', function() {
	  this.timeout(60000);
	  it('deletes a product', function() {
		  
			var wsrr2apicProperties = fs
			.readFileSync("./connectionproperties.properties");
			var inputOptions = propertyParse.parse(wsrr2apicProperties);

		  return apimcli.setConnectionDetails(inputOptions).then(function(results1) {
			  return apimcli.push("test/valid_product.yaml").then(function(results2) {
				  // assumes there is a "sb" catalog and it is a sandbox
				  console.log("push: " + results2.stdout);
				  return apimcli.publishFromDrafts("valid-product", "1.0.0", "sb", ".").then(function(results3) {
					  console.log("publishFromDrafts: " + results3.stdout);
					  return apimcli.productsDelete("valid-product", "1.0.0", "sb").then(function(results4){
						  console.log("productsDelete: " + results4.stdout);
						  // done
					  });
				  });
			  });
		  });
	  });
});

describe('productsDeleteSpaces', function() {
	  this.timeout(60000);
	  it('deletes a product from a Spaces Catalog', function() {
		  
			var wsrr2apicProperties = fs
			.readFileSync("./connectionproperties.properties");
			var inputOptions = propertyParse.parse(wsrr2apicProperties);

		  return apimcli.setConnectionDetails(inputOptions).then(function(results1) {
			  return apimcli.push("test/valid_product.yaml").then(function(results2) {
				  // assumes there is a "spaces" catalog and it has a space called "test-space"
				  console.log("push: " + results2.stdout);
				  return apimcli.publishFromDrafts("valid-product", "1.0.0", "spaces", ".","test-space").then(function(results3) {
					  console.log("publishFromDrafts: " + results3.stdout);
					  return apimcli.productsDelete("valid-product", "1.0.0", "spaces","test-space").then(function(results4){
						  console.log("productsDelete: " + results4.stdout);
						  // done
					  });
				  });
			  });
		  });
	  });
});

//version function
describe('version', function() {
	  this.timeout(15000);
	  var wsrr2apicProperties = fs
		.readFileSync("./connectionproperties.properties");
		var inputOptions = propertyParse.parse(wsrr2apicProperties);
	  it('outputs the version', function() {
		  return apimcli.getVersion(inputOptions).then(function(result) {
			  console.log("Version: " + result.stdout);
		  });
	  });
});

describe('_test_runAPICCommand', function() {
	  this.timeout(15000);
	  it('handles errors properly', function() {
		  // run unknown command, should call the error on the promise chain
		  return apimcli._test_runAPICCommand(["--cakes"]).then(function(result) {
			  fail("Should have errored");
		  }).caught(function(error){
			  console.log("Expected error: " + error);
		  });
	  });
});

describe('createAPIFromWSDL', function() {
	  this.timeout(30000);
	  it('creates a file from a WSDL and returns correct details', function() {
		  // delete existing file it will make "basicservice.yaml"
		  var filePath = "basicservice.yaml";
		  if(fs.existsSync(filePath)) {
			  fs.unlinkSync(filePath);
		  }
		  // run test
		  return apimcli.createAPIFromWSDL("test/basic.wsdl", ".").then(function(result) {
			  result.should.contain.property("yamlName", "basicservice.yaml");
			  result.should.contain.property("xIBMName", "basicservice");
			  result.should.contain.property("version", "1.0.0");
			  
			  // delete file for clean up "basicservice.yaml"
			  var filePath = "basicservice.yaml";
			  if(fs.existsSync(filePath)) {
				  fs.unlinkSync(filePath);
			  }
		  });
	  });

	  it('errors when passed a ZIP with no WSDLs', function(done) {
		  // run test
		  return apimcli.createAPIFromWSDL("test/nowsdl.zip", ".").then(function(result) {
			  // should have error
			  done("should have error");
		  }).caught(function(error) {
			  done();
		  });
	  });
	  
});

describe('createAPIForREST', function() {
	  this.timeout(30000);
	  it('creates a file and returns correct details', function() {
		  // delete existing file it will make "basicapi.yaml"
		  var filePath = "basicapi.yaml";
		  if(fs.existsSync(filePath)) {
			  fs.unlinkSync(filePath);
		  }
		  // run test
		  return apimcli.createAPIForREST("basicapi", "basicapi.yaml", ".").then(function(result) {
			  result.should.contain.property("yamlName", "basicapi.yaml");
			  result.should.contain.property("xIBMName", "basicapi");
			  result.should.contain.property("version", "1.0.0");
			  
			  // delete file for clean up "basicapi.yaml"
			  var filePath = "basicapi.yaml";
			  if(fs.existsSync(filePath)) {
				  fs.unlinkSync(filePath);
			  }
		  });
	  });
});


});
