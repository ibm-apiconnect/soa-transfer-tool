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
var _ = require('lodash');
var os = require('os');
var swaggerUtils = require('../lib/swaggerUtils');
var logger = require('../lib/Logger');


// unit tests in here
describe('unittests_swaggerUtils', function(){

// init the logger
before(function(done) {
	logger.initialize(done);		
});
	
describe('checkContentIsSwagger', function() {
	  it('trues for valid yaml with upper case extension', function() {
		  var content = new Buffer("swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'", "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.YAML");
		  result.should.equal(true);
	  });

	  it('trues for valid yaml with lower case extension', function() {
		  var content = new Buffer("swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'", "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.yaml");
		  result.should.equal(true);
	  });

	  it('trues for valid yml with lower case extension', function() {
		  var content = new Buffer("swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'", "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.yml");
		  result.should.equal(true);
	  });

	  it('trues for valid yaml with mixed case extension', function() {
		  var content = new Buffer("swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'", "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.yMl");
		  result.should.equal(true);
	  });

	  it('falses for empty buffer', function() {
		  var content = new Buffer("", "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.yaml");
		  result.should.equal(false);
	  });

	  it('falses for bad extension', function() {
		  var content = new Buffer("swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'", "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.bad");
		  result.should.equal(false);
	  });

	  it('trues for valid json with lower case extension', function() {
		  var content = new Buffer('{"swagger": "2.0", "info": { "version": "1.0.0" } }', "utf8");
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.json");
		  result.should.equal(true);
	  });

	  it('trues for valid json with upper case extension', function() {
		  var content = new Buffer('{"swagger": "2.0", "info": { "version": "1.0.0" } }', "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.JSON");
		  result.should.equal(true);
	  });

	  it('trues for valid yml with --- and indented', function() {
		  var content = new Buffer("---" + os.EOL + "  swagger: '2.0'" + os.EOL + "  info:" + os.EOL + "    version: '1.0.0'", "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.yaml");
		  result.should.equal(true);
	  });
	  
	  it('falses for invalid yml', function() {
		  var content = new Buffer("goats  swagger: '2.0'" + os.EOL + "  info:" + os.EOL + "    version: '1.0.0'", "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.yaml");
		  result.should.equal(false);
	  });
	  
	  it('falses for invalid json', function() {
		  var content = new Buffer('{"swagger": "2.0", "info": { "version": "1.0.0" } no end bracket', "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.json");
		  result.should.equal(false);
	  });

	  it('falses for valid yaml with no swagger', function() {
		  var content = new Buffer("info:" + os.EOL + "  version: '1.0.0'", "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.yaml");
		  result.should.equal(false);
	  });

	  it('falses for valid json with no swagger', function() {
		  var content = new Buffer('{"info": { "version": "1.0.0" } }', "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.JSON");
		  result.should.equal(false);
	  });

	  it('falses for valid yaml with wrong swagger version', function() {
		  var content = new Buffer("swagger: '3.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'", "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.yaml");
		  result.should.equal(false);
	  });

	  it('falses for valid json with wrong swagger version', function() {
		  var content = new Buffer('{"swagger": "1.0", "info": { "version": "1.0.0" } }', "utf8");
		  
		  var result = swaggerUtils.checkContentIsSwagger(content, "test.json");
		  result.should.equal(false);
	  });

});

describe('_test_internalEndsWith', function() {
	  it('trues for does end', function() {
		  var test = swaggerUtils._test_internalEndsWith("a.yaml", ".yaml");
		  test.should.equal(true);		  
	  });
	  it('falses for does not end', function() {
		  var test = swaggerUtils._test_internalEndsWith("a.yaml", "goats");
		  test.should.equal(false);		  
	  });
	  it('falses for in string but not at end', function() {
		  var test = swaggerUtils._test_internalEndsWith("a.yaml", ".yam");
		  test.should.equal(false);		  
	  });
	  it('falses for in string but not at end in middle', function() {
		  var test = swaggerUtils._test_internalEndsWith("acat.yaml", "cat");
		  test.should.equal(false);		  
	  });
	  
});

describe('generateSwaggerObject', function() {
	it('should generate for a simple json', function() {
		var jsonString = '{"swagger": "2.0", "info": { "version": "1.0.0"}}';
		
		var resultObject = swaggerUtils.generateSwaggerObject(jsonString, "swagger.json");
		resultObject.should.have.property("swagger", "2.0");
		resultObject.should.have.deep.property("info.version", "1.0.0");
	});

	it('should error when the json is invalid', function(done) {
		var jsonString = '{"swagger": "2.0", "info": { "version": "1.0.0"} no bracket';
		
		try {
			var resultObject = swaggerUtils.generateSwaggerObject(jsonString, "swagger.json");
			done("should have errored");
			
		}catch(error) {
			// expected error
			done();
		}
		
	});

	it('should generate for a simple yaml', function(done) {
		var yamlString = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'";
		
		var resultObject = swaggerUtils.generateSwaggerObject(yamlString, "swagger.yaml");
		resultObject.should.have.property("swagger", "2.0");
		resultObject.should.have.deep.property("info.version", "1.0.0");
		
		done();
	});

	it('should error when the yaml is invalid', function(done) {
		var yamlString = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL 
		+ "  description: 'goats'" + os.EOL + 
		"cakes";
		
		try {
			var resultObject = swaggerUtils.generateSwaggerObject(yamlString, "swagger.yaml");
			done("should have errored");
			
		}catch(error) {
			// expected error
			done();
		}
		
	});

	it('should error when the name extension is invalid', function(done) {
		var yamlString = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL 
		+ "  description: 'goats'" + os.EOL + 
		"cakes";
		
		try {
			var resultObject = swaggerUtils.generateSwaggerObject(yamlString, "swagger.yamlbad");
			done("should have errored");
			
		}catch(error) {
			// expected error
			done();
		}
		
	});
	
});

describe('isSwaggerExtension', function() {
	it('should true for .yaml', function() {
		var resultObject = swaggerUtils.isSwaggerExtension("swagger.yaml");
		resultObject.should.equal(true);
	});
	it('should true for .yson', function() {
		var resultObject = swaggerUtils.isSwaggerExtension("swagger.json");
		resultObject.should.equal(true);
	});
	it('should true for .yml', function() {
		var resultObject = swaggerUtils.isSwaggerExtension("swagger.yml");
		resultObject.should.equal(true);
	});
	it('should true for .YAML', function() {
		var resultObject = swaggerUtils.isSwaggerExtension("swagger.YAML");
		resultObject.should.equal(true);
	});
	it('should true for .YML', function() {
		var resultObject = swaggerUtils.isSwaggerExtension("swagger.YML");
		resultObject.should.equal(true);
	});
	it('should true for .JSON', function() {
		var resultObject = swaggerUtils.isSwaggerExtension("swagger.JSON");
		resultObject.should.equal(true);
	});
	it('should false for .txt', function() {
		var resultObject = swaggerUtils.isSwaggerExtension("swagger.txt");
		resultObject.should.equal(false);
	});

});


});
