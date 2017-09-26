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
var os = require('os');

var templating = require('../lib/templating');
var Handlebars = require('handlebars');

describe('unittests_wsrrtemplating', function(){
	describe('_mergeObjects', function() {
		this.timeout(15000);

		it('should merge two objects', function(done) {
			
			var baseObject = {"version" : "1.0.0"};
			var overrideObject = {"version" : "2.0.0"};
			var result = templating._test_mergeObjects(baseObject, overrideObject);
			
			result.should.have.property("version", "2.0.0");
			
			done();
		});

		it('should merge two deep objects', function(done) {
			
			var baseObject = {swagger: '2.0'};
			baseObject.info = {"version" : "1.0"};
			var overrideObject = {swagger: '2.0'};
			overrideObject.info = {"version" : "2.0", "title" : "goats"};

			var result = templating._test_mergeObjects(baseObject, overrideObject);
			
			result.should.have.property("swagger", "2.0");
			result.should.have.deep.property("info.version", "2.0");
			result.should.have.deep.property("info.title", "goats");
			
			done();
		});
		
		it('should merge two deep objects containing x-ibm-configuration.assembley',function(done){
			var baseObject={swagger: '2.0','x-ibm-configuration':{'assembly': 'baseObject'}};						
			var overrideObject={swagger: '2.0','x-ibm-configuration':{'assembly': 'overrideObject'}};
			var result=templating._test_mergeObjects(baseObject,overrideObject);
			
			result.should.have.property("swagger","2.0");
			result.should.have.deep.property("x-ibm-configuration.assembly","overrideObject");
			done();
		});
		
		it('should merge two deep objects with only baseObject having x-ibm-configuration.assembley',function(done){
			var baseObject={swagger: '2.0','x-ibm-configuration':{'assembly': 'baseObject'}};						
			var overrideObject={swagger: '2.0','x-ibm-configuration':{'type': 'wsdl'}};
			var result=templating._test_mergeObjects(baseObject,overrideObject);
			
			result.should.have.property("swagger","2.0");
			result.should.have.deep.property("x-ibm-configuration.assembly","baseObject");
			result.should.have.deep.property("x-ibm-configuration.type","wsdl");
			done();
		});
		
		it('should merge two deep objects with only overrideObject having x-ibm-configuration.assembley',function(done){
			var overrideObject={swagger: '2.0','x-ibm-configuration':{'assembly': 'overrideObject'}};						
			var baseObject={swagger: '2.0','x-ibm-configuration':{'type': 'wsdl'}};
			var result=templating._test_mergeObjects(baseObject,overrideObject);
			
			result.should.have.property("swagger","2.0");
			result.should.have.deep.property("x-ibm-configuration.assembly","overrideObject");
			result.should.have.deep.property("x-ibm-configuration.type","wsdl");
			done();
		});

	});

	describe('combineApiYamlObjects', function() {
		this.timeout(15000);

		// for now the function is identical to _mergeObjects, so a basic test
		// if anything extra is added this will need to be extended.
		
		it('should merge two yaml objects', function(done) {
			
			var baseObject = {"version" : "1.0.0"};
			var overrideObject = {"version" : "2.0.0"};
			var result = templating.combineApiYamlObjects(baseObject, overrideObject);
			
			result.should.have.property("version", "2.0.0");
			
			done();
		});

	});
	
	// uses handlebars so we do not need too many tests here
	describe('generateObjectFromYamlTemplate', function() {
		
		it('should generate for a simple yaml', function(done) {
			var template = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'";
			var dataObject = {};
			//console.log(template);
			
			var resultObject = templating.generateObjectFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultObject.should.have.property("swagger", "2.0");
			resultObject.should.have.deep.property("info.version", "1.0.0");
			
			done();
		});

		it('should generate for a simple yaml using data', function(done) {
			var template = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  description: '{{version.name}}'";
			var dataObject = {};
			dataObject.version = {name: "goats"};
			//console.log(template);
			
			var resultObject = templating.generateObjectFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultObject.should.have.property("swagger", "2.0");
			resultObject.should.have.deep.property("info.version", "1.0.0");
			resultObject.should.have.deep.property("info.description", "goats");
			
			done();
		});

		it('should error when the yaml is invalid', function(done) {
			var template = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL 
			+ "  description: '{{version.name}}'" + os.EOL + 
			"cakes";
			
			var dataObject = {};
			dataObject.version = {name: "goats"};
			
			try {
				var resultObject = templating.generateObjectFromYamlTemplate(template, dataObject);
				done("should have errored");
				
			}catch(error) {
				// expected error
//				console.log("Expected error: " + error);
				done();
			}
			
		});

		it('should generate for a yaml with special functions using data', function(done) {
			var template = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  description: '{{apiName version.name}}'" + os.EOL + "  endpoint: '{{path version.url}}'"
			+ os.EOL + "  endpointHost: '{{host version.url}}'" + os.EOL + "  endpointHostProtocol: '{{hostProtocol version.url}}'"
			;
			var dataObject = {};
			dataObject.version = {name: "goats", url: "http://www.ibm.com/paths/path1"};
			//console.log(template);
			
			var resultObject = templating.generateObjectFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultObject.should.have.property("swagger", "2.0");
			resultObject.should.have.deep.property("info.version", "1.0.0");
			resultObject.should.have.deep.property("info.description", "goats");
			resultObject.should.have.deep.property("info.endpoint", "/paths/path1");
			resultObject.should.have.deep.property("info.endpointHost", "www.ibm.com");
			resultObject.should.have.deep.property("info.endpointHostProtocol", "http://www.ibm.com");
			
			done();
		});

		it('should generate for a yaml with data with carriage returns', function(done) {
			// have to use multiline filter and use double quotes on the value!
			var template = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  description: \"{{multiline version.description}}\"";
			var dataObject = {};
			// description has line feeds in it
			dataObject.version = {description: "Line one\nOperations:\nOperation 1\nOperation 2"};
			//console.log(template);
			
			//var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//var resultObject = templating.generateObjectFromYamlString(resultString);
			var resultObject = templating.generateObjectFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultObject.should.have.property("swagger", "2.0");
			resultObject.should.have.deep.property("info.version", "1.0.0");
			// should preserve the LFs given we used the multiline filter
			resultObject.should.have.deep.property("info.description", dataObject.version.description);
			
			done();
		});

		it('should not break things when using the multiline filter', function(done) {
			// have to use multiline filter and use double quotes on the value!
			var template = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  description: \"{{multiline version.description}}\"";
			var dataObject = {};
			// description has NO line feeds in it
			dataObject.version = {description: "Line one same line no line feeds here"};
			//console.log(template);
			
			//var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//var resultObject = templating.generateObjectFromYamlString(resultString);
			var resultObject = templating.generateObjectFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultObject.should.have.property("swagger", "2.0");
			resultObject.should.have.deep.property("info.version", "1.0.0");
			// should not break the description
			resultObject.should.have.deep.property("info.description", dataObject.version.description);
			
			done();
		});
		
	});

	describe('generateStringFromYamlTemplate', function() {
		
		it('should generate for a simple yaml', function(done) {
			var template = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'";
			var dataObject = {};
			//console.log(template);
			
			var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultString.should.equal(template);
			
			done();
		});

		it('should generate for a simple yaml using data', function(done) {
			var template = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  description: '{{version.name}}'";
			var dataObject = {};
			dataObject.version = {name: "goats"};
			//console.log(template);
			
			var expectedResult = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  description: 'goats'";
			
			var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultString.should.equal(expectedResult);
			
			done();
		});

		it('should generate for a yaml with special functions using data', function(done) {
			var template = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  description: '{{apiName version.name}}'" + os.EOL + "  endpoint: '{{path version.url}}'"
			+ os.EOL + "  endpointHost: '{{host version.url}}'"
			;
			var dataObject = {};
			dataObject.version = {name: "goats", url: "http://www.ibm.com/paths/path1"};
			//console.log(template);
			
			var expectedResult = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  description: 'goats'" + os.EOL + "  endpoint: '/paths/path1'"
			+ os.EOL + "  endpointHost: 'www.ibm.com'"
			;
			
			var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultString.should.equal(expectedResult);
			
			done();
		});
		
	});
	
	describe('generateObjectFromYamlString', function() {
		
		it('should generate for a simple yaml', function(done) {
			var yamlString = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'";
			
			var resultObject = templating.generateObjectFromYamlString(yamlString);
			//console.dir(resultObject);
			resultObject.should.have.property("swagger", "2.0");
			resultObject.should.have.deep.property("info.version", "1.0.0");
			
			done();
		});

		it('should error when the yaml is invalid', function(done) {
			var yamlString = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL 
			+ "  description: 'goats'" + os.EOL + 
			"cakes";
			
			try {
				var resultObject = templating.generateObjectFromYamlString(yamlString);
				done("should have errored");
				
			}catch(error) {
				// expected error
//				console.log("Expected error: " + error);
				done();
			}
			
		});

	});
	
	describe('generateStubNames',function(){
		this.timeout(15000);
		var template = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
		+ "  name: '{{apiName version.name}}'"
		;		
		it('should generate for simple name', function(done){
			var dataObject = {};
			dataObject.version = {name: "goats"};
			var expectedResult = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  name: 'goats'"
			var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultString.should.equal(expectedResult);
			done();
		});
		
		it('should generate a name from spaces',function(done){
			var dataObject = {};
			dataObject.version = {name: "goats on a hill"};
			var expectedResult = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  name: 'goats-on-a-hill'"
			var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultString.should.equal(expectedResult);
			done();
		});
		
		it('should generate a name containing only a-Z0-9- characters',function(done){
			var dataObject = {};
			dataObject.version = {name: "goats/on{a};hill"};
			var expectedResult = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  name: 'goatsonahill'"
			var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultString.should.equal(expectedResult);
			done();
		});
		
		it('should generate a name that does not start with - characters',function(done){
			var dataObject = {};
			dataObject.version = {name: "-goats"};
			var expectedResult = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  name: 'goats'"
			var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultString.should.equal(expectedResult);
			done();
		});
		
		it('should generate a name that does not start with 0-9 characters',function(done){
			var dataObject = {};
			dataObject.version = {name: "01234567890goats"};
			var expectedResult = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  name: 'goats'"
			var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultString.should.equal(expectedResult);
			done();
		});
		
		it('should generate a name that does not start with 0-9 or spaces characters',function(done){
			var dataObject = {};
			dataObject.version = {name: "012345/67890 goats"};
			var expectedResult = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL
			+ "  name: 'goats'"
			var resultString = templating.generateStringFromYamlTemplate(template, dataObject);
			//console.dir(resultObject);
			resultString.should.equal(expectedResult);
			done();
		});
		
	});

	describe('getTemplate', function() {
		this.timeout(15000);

		it('throw for unknown type', function(done) {

			try {
				templating.getTemplate("UNKNOWN");
				done("Should have thrown for UNKNOWN");				
			}catch(e){
				// expected
				done();
			}
		});

	});
	
	describe('_test_handlerHostProtocol', function() {
		it('works for http', function() {
			var result = templating._test_handlerHostProtocol("http://www.test.ibm.com/path1/path2");
			result.should.equal("http://www.test.ibm.com");
		});
		it('works for no slash protocol', function() {
			var result = templating._test_handlerHostProtocol("mailto:ibm.com/path1/path2");
			result.should.equal("mailto:ibm.com");
		});
		it('works for no paths', function() {
			var result = templating._test_handlerHostProtocol("https://www.test.ibm.com/");
			result.should.equal("https://www.test.ibm.com");
		});
	});
	
	describe('_test_handlerClassificationToValue', function() {
		it('works for empty classifications and parameters', function() {
			var data = {};
			var options = {hash: {}};
			
			var result = templating._test_handlerClassificationToValue(data, options);
			result.should.equal("");
		});
		it('works for single classification', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationToValue(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("External");
		});
		
		it('works for single classification and only provide that as a parameter', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationToValue(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("External");
		});

		it('works for multiple classification', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationToValue(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("External");
		});
		it('works for multiple classification no required classification', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationToValue(data, options);
			result.should.equal("");
		});

		it('works for multiple classification with no value parameter provided for URI that is not needed', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationToValue(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#NeitherInternalNorExternal", options);
			result.should.equal("External");
		});

		it('works for multiple classification with no value parameter provided and ignores the URI', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationToValue(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", options);
			// external we wanted has no value so should be empty
			result.should.equal("");
		});

	});
	
	describe('_test_handlerClassificationsToValueArray',function(){
		//First set are to ensure same result as _handlerClassificationToValue
		it('works for empty classifications and parameters', function() {
			var data = {};
			var options = {hash: {}};
			
			var result = templating._test_handlerClassificationsToValueArray(data, options);
			result.should.equal("[]");
		});
		it('works for single classification', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationsToValueArray(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("[External]");
		});
		
		it('works for single classification and only provide that as a parameter', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationsToValueArray(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("[External]");
		});

		it('works for multiple classification', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationsToValueArray(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("[External]");
		});
		it('works for multiple classification no required classification', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationsToValueArray(data, options);
			result.should.equal("[]");
		});

		it('works for multiple classification with no value parameter provided for URI that is not needed', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationsToValueArray(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#NeitherInternalNorExternal", options);
			result.should.equal("[External]");
		});

		it('works for multiple classification with no value parameter provided and ignores the URI', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationsToValueArray(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", options);
			// external we wanted has no value so should be empty
			result.should.equal("[]");			
		});
		//Array specific tests
		it('works for multiple classifications with multiple results',function(){
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationsToValueArray(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External","External", options);
			result.should.equal("[External,Internal]");
		});
		it('works for multiple classification with no value parameter provided and ignores the URI, but still produces result', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationsToValueArray(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", options);
			// external we wanted has no value so should be empty
			result.should.equal("[Internal]");			
		});
	});
	
	describe('_test_handlerClassificationsToValueArrayWithKey',function(){
		//First set are to ensure same result as _handlerClassificationToValue
		it('works for empty classifications and parameters', function() {
			var data = {};
			var options = {hash: {}};			
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data, options);
			result.should.equal("[]");
		});
		it('works for single classification', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"]};
			var options = {hash: {}};
			var key="key";
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data, key, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("[key: External]");
		});
		
		it('works for single classification and only provide that as a parameter', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"]};
			var options = {hash: {}};
			var key="key"
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data, key, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("[key: External]");
		});

		it('works for multiple classification', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var key="key";			
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data, key, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("[key: External]");
		});
		it('works for multiple classification no required classification', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data, options);
			result.should.equal("[]");
		});

		it('works for multiple classification with no value parameter provided for URI that is not needed', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var key="key";
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data, key, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#NeitherInternalNorExternal", options);
			result.should.equal("[key: External]");
		});

		it('works for multiple classification with no value parameter provided and ignores the URI', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"]};
			var options = {hash: {}};
			var key="key";
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data,key, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", options);
			// external we wanted has no value so should be empty
			result.should.equal("[]");			
		});
		//Array specific tests
		it('works for multiple classifications with multiple results',function(){
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"]};
			var options = {hash: {}};
			var key="key"
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data,key, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External","External", options);
			result.should.equal("[key: External,key: Internal]");
		});
		it('works for multiple classification with no value parameter provided and ignores the URI, but still produces result', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"]};
			var options = {hash: {}};
			var key="key";
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data,key, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", options);
			// external we wanted has no value so should be empty
			result.should.equal("[key: Internal]");			
		});
		//Array with Keys
		it('works for multiple classifications with multiple results, with key',function(){
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"]};
			var options = {hash: {}};
			var key="key";
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data,key, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External","External", options);
			result.should.equal("[key: External,key: Internal]");
		});
		it('works for multiple classification with no value parameter provided and ignores the URI, but still produces result with key', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified",
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"]};
			var options = {hash: {}};
			var key="key";
			var result = templating._test_handlerClassificationsToValueArrayWithKey(data,key, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", options);
			// external we wanted has no value so should be empty
			result.should.equal("[key: Internal]");			
		});
	});

	
	// _handlerStateToValue
	describe('_test_handlerStateToValue', function() {
		it('works for empty classifications and parameters', function() {
			var data = {};
			var options = {hash: {}};
			
			var result = templating._test_handlerStateToValue(data, options);
			result.should.equal("");
		});
		it('works for state', function() {
			var data = {state: "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"};
			var options = {hash: {}};
			var result = templating._test_handlerStateToValue(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("External");
		});
		
		it('works for single state and only provide that as a parameter', function() {
			var data = {state: "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"};
			var options = {hash: {}};
			var result = templating._test_handlerStateToValue(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", options);
			result.should.equal("External");
		});

		it('works for state no required classification', function() {
			var data = {state: "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"};
			var options = {hash: {}};
			var result = templating._test_handlerStateToValue(data, options);
			result.should.equal("");
		});

		it('works for state with no value parameter provided for URI that is not needed', function() {
			var data = {state: "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"};
			var options = {hash: {}};
			var result = templating._test_handlerStateToValue(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", "External", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#NeitherInternalNorExternal", options);
			result.should.equal("External");
		});

		it('works for state with no value parameter provided and ignores the URI', function() {
			var data = {state: "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"};
			var options = {hash: {}};
			var result = templating._test_handlerStateToValue(data, "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal", "Internal", "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", options);
			// external we wanted has no value so should be empty
			result.should.equal("");
		});

	});

	
	
	describe('_test_handlerOnlyClassified', function() {
		it('works for empty classifications and object', function() {
			var data = {};
			var classification = "";
			var options = {};
			
			var checked = false;
			options.fn = function(context) {
				if(context === data) {
					checked = true;
				}
				return "";
			};
			
			var result = templating._test_handlerOnlyClassified(data, classification, options);
			checked.should.equal(false);
			result.should.equal("");
			
		});

		it('works for classification in object', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", 
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService"]};
			var classification = "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External";
			var options = {};
			
			var checked = false;
			options.fn = function(context) {
				if(context === data) {
					checked = true;
				}
				return "test";
			};
			
			var result = templating._test_handlerOnlyClassified(data, classification, options);
			checked.should.equal(true);
			result.should.equal("test");
		});

		it('works for classification not in object', function() {
			var data = {classifications: ["http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External", 
			                              "http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService"]};
			var classification = "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#ExternalNOTIN";
			var options = {};
			
			var checked = false;
			options.fn = function(context) {
				if(context === data) {
					checked = true;
				}
				return "test";
			};
			
			var result = templating._test_handlerOnlyClassified(data, classification, options);
			checked.should.equal(false);
			result.should.equal("");
		});
		
	});

	describe('_test_handlerEndpointByClassifications', function() {
		it('works for empty classifications and object', function() {
			var data = [];
			var classification = "";
			var options = {};
			
			var result = templating._test_handlerEndpointByClassifications(data, classification, options);
			result.should.equal("");
			
		});

		it('works for match in single SLD single classification', function() {
			var data = [];
			data.push({
				// two endpoints one Prod one Staging
				endpoints:[{"bsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","type":"GenericObject","governanceRootBsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819476238","creationTimestamp":"1467819354138","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"74343974-05fb-4ba5.bdaf.26808d26af21","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"87903587-662b-4bc9.9435.a61f06a6355b","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"8e3a5d8e-5329-4960.98fc.a02c53a0fc89","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","type":"GenericObject","governanceRootBsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819555695","creationTimestamp":"1467819372786","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort42","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"305b0a30-2a1b-4bab.8e64.fbd4befb6490","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"f25749f2-1e5e-4ec9.8fe2.5eab385ee2b8","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"ff2d79ff-d587-4759.ae17.ffd8d4ff1754","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Offline"}]
			});
			var classification = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production";
			var options = {};
			
			var result = templating._test_handlerEndpointByClassifications(data, classification, options);
			result.should.equal("http://production.jkhle.com:9080/jkhle/services/AccountCreation");
			
		});

		it('works for match in single SLD single classification providing the SLD only', function() {
			// test providing just one SLD not in an array
			var data = {
				// two endpoints one Prod one Staging
				endpoints:[{"bsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","type":"GenericObject","governanceRootBsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819476238","creationTimestamp":"1467819354138","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"74343974-05fb-4ba5.bdaf.26808d26af21","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"87903587-662b-4bc9.9435.a61f06a6355b","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"8e3a5d8e-5329-4960.98fc.a02c53a0fc89","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","type":"GenericObject","governanceRootBsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819555695","creationTimestamp":"1467819372786","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort42","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"305b0a30-2a1b-4bab.8e64.fbd4befb6490","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"f25749f2-1e5e-4ec9.8fe2.5eab385ee2b8","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"ff2d79ff-d587-4759.ae17.ffd8d4ff1754","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Offline"}]
			};
			var classification = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production";
			var options = {};
			
			var result = templating._test_handlerEndpointByClassifications(data, classification, options);
			result.should.equal("http://production.jkhle.com:9080/jkhle/services/AccountCreation");
			
		});

		it('works for match in single SLD 2 endpoint classifications', function() {
			var data = [];
			data.push({
				// two endpoints one Prod one Staging
				endpoints: [{"bsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","type":"GenericObject","governanceRootBsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819476238","creationTimestamp":"1467819354138","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"74343974-05fb-4ba5.bdaf.26808d26af21","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"87903587-662b-4bc9.9435.a61f06a6355b","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"8e3a5d8e-5329-4960.98fc.a02c53a0fc89","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","type":"GenericObject","governanceRootBsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819555695","creationTimestamp":"1467819372786","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort42","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"305b0a30-2a1b-4bab.8e64.fbd4befb6490","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"f25749f2-1e5e-4ec9.8fe2.5eab385ee2b8","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"ff2d79ff-d587-4759.ae17.ffd8d4ff1754","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Offline"}]
			});
			var classification = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production";
			var classification2 = "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External";
			var options = {};
			
			var result = templating._test_handlerEndpointByClassifications(data, classification, classification2, options);
			result.should.equal("http://production.jkhle.com:9080/jkhle/services/AccountCreation");
			
		});

		// because the code was taking the first endpoint
		it('works for match in single SLD 2 endpoint classifications where matched is the second endpoint', function() {
			var data = [];
			data.push({
				// two endpoints one Prod one Staging
				endpoints: [{"bsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","type":"GenericObject","governanceRootBsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819476238","creationTimestamp":"1467819354138","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"74343974-05fb-4ba5.bdaf.26808d26af21","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"87903587-662b-4bc9.9435.a61f06a6355b","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"8e3a5d8e-5329-4960.98fc.a02c53a0fc89","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","type":"GenericObject","governanceRootBsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819555695","creationTimestamp":"1467819372786","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort42","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"305b0a30-2a1b-4bab.8e64.fbd4befb6490","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"f25749f2-1e5e-4ec9.8fe2.5eab385ee2b8","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"ff2d79ff-d587-4759.ae17.ffd8d4ff1754","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Offline"}]
			});
			var classification = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging";
			var classification2 = "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal";
			var options = {};
			
			var result = templating._test_handlerEndpointByClassifications(data, classification, classification2, options);
			result.should.equal("http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation");
			
		});

		it('works for no match in single SLD 2 endpoint classifications', function() {
			var data = [];
			data.push({
				// two endpoints one Prod one Staging
				endpoints: [{"bsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","type":"GenericObject","governanceRootBsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819476238","creationTimestamp":"1467819354138","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"74343974-05fb-4ba5.bdaf.26808d26af21","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"87903587-662b-4bc9.9435.a61f06a6355b","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"8e3a5d8e-5329-4960.98fc.a02c53a0fc89","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","type":"GenericObject","governanceRootBsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819555695","creationTimestamp":"1467819372786","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort42","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"305b0a30-2a1b-4bab.8e64.fbd4befb6490","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"f25749f2-1e5e-4ec9.8fe2.5eab385ee2b8","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"ff2d79ff-d587-4759.ae17.ffd8d4ff1754","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Offline"}]
			});
			// this one is not in the endpoints
			var classification = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#ProductionNoMatch";
			var classification2 = "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External";
			var options = {};
			
			var result = templating._test_handlerEndpointByClassifications(data, classification, classification2, options);
			result.should.equal("");
			
		});

		it('works for match in single SLD 5 endpoint classifications', function() {
			var data = [];
			data.push({
				// two endpoints one Prod one Staging
				endpoints: [{"bsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","type":"GenericObject","governanceRootBsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819476238","creationTimestamp":"1467819354138","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"74343974-05fb-4ba5.bdaf.26808d26af21","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"87903587-662b-4bc9.9435.a61f06a6355b","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"8e3a5d8e-5329-4960.98fc.a02c53a0fc89","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External","http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#ProductionTest","http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#DataPowerGateway","http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Energised"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","type":"GenericObject","governanceRootBsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819555695","creationTimestamp":"1467819372786","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort42","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"305b0a30-2a1b-4bab.8e64.fbd4befb6490","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"f25749f2-1e5e-4ec9.8fe2.5eab385ee2b8","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"ff2d79ff-d587-4759.ae17.ffd8d4ff1754","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Offline"}]
			});
			var classification = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production";
			var classification2 = "http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External";
			
			var classification3 = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#ProductionTest";
			var classification4 = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#DataPowerGateway";
			var classification5 = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Energised";

			var options = {};
			
			var result = templating._test_handlerEndpointByClassifications(data, classification, classification2, classification3, classification4, classification5, options);
			result.should.equal("http://production.jkhle.com:9080/jkhle/services/AccountCreation");
			
		});

		it('works for match in single SLD 1 endpoint classification where there are 5 on the EP', function() {
			var data = [];
			data.push({
				// two endpoints one Prod one Staging
				endpoints: [{"bsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","type":"GenericObject","governanceRootBsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819476238","creationTimestamp":"1467819354138","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"74343974-05fb-4ba5.bdaf.26808d26af21","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"87903587-662b-4bc9.9435.a61f06a6355b","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"8e3a5d8e-5329-4960.98fc.a02c53a0fc89","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External","http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#ProductionTest","http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#DataPowerGateway","http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Energised"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","type":"GenericObject","governanceRootBsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819555695","creationTimestamp":"1467819372786","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort42","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"305b0a30-2a1b-4bab.8e64.fbd4befb6490","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"f25749f2-1e5e-4ec9.8fe2.5eab385ee2b8","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"ff2d79ff-d587-4759.ae17.ffd8d4ff1754","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Offline"}]
			});
			var classification = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#ProductionTest";

			var options = {};
			
			var result = templating._test_handlerEndpointByClassifications(data, classification, options);
			result.should.equal("http://production.jkhle.com:9080/jkhle/services/AccountCreation");
			
		});

		it('works for match in 3 SLDs 1 endpoint classification where there are 5 on the EP', function() {
			var data = [];
			data.push({
				// two endpoints one Prod one Staging not with the classification
				endpoints:[{"bsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","type":"GenericObject","governanceRootBsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819476238","creationTimestamp":"1467819354138","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"74343974-05fb-4ba5.bdaf.26808d26af21","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"87903587-662b-4bc9.9435.a61f06a6355b","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"8e3a5d8e-5329-4960.98fc.a02c53a0fc89","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","type":"GenericObject","governanceRootBsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819555695","creationTimestamp":"1467819372786","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort42","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"305b0a30-2a1b-4bab.8e64.fbd4befb6490","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"f25749f2-1e5e-4ec9.8fe2.5eab385ee2b8","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"ff2d79ff-d587-4759.ae17.ffd8d4ff1754","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Offline"}]
			});
			data.push({
				// two endpoints one Prod one Staging with the classification
				endpoints: [{"bsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","type":"GenericObject","governanceRootBsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreationTest","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819476238","creationTimestamp":"1467819354138","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"74343974-05fb-4ba5.bdaf.26808d26af21","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"87903587-662b-4bc9.9435.a61f06a6355b","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"8e3a5d8e-5329-4960.98fc.a02c53a0fc89","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External","http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#ProductionTest","http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#DataPowerGateway","http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Energised"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","type":"GenericObject","governanceRootBsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819555695","creationTimestamp":"1467819372786","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort42","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"305b0a30-2a1b-4bab.8e64.fbd4befb6490","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"f25749f2-1e5e-4ec9.8fe2.5eab385ee2b8","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"ff2d79ff-d587-4759.ae17.ffd8d4ff1754","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#Internal"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Offline"}]
			});
			data.push({
				// two endpoints one Prod one Staging not with the classification
				endpoints:[{"bsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","type":"GenericObject","governanceRootBsrURI":"40a43640-7bb9-498d.ba30.20de512030e9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819476238","creationTimestamp":"1467819354138","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"74343974-05fb-4ba5.bdaf.26808d26af21","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"87903587-662b-4bc9.9435.a61f06a6355b","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"8e3a5d8e-5329-4960.98fc.a02c53a0fc89","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","type":"GenericObject","governanceRootBsrURI":"57acc857-d8fa-4af0.8c12.c41c2bc412f3","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://stagingX42.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.1.7","description":"","owner":"wasadmin","lastModified":"1467819555695","creationTimestamp":"1467819372786","lastModifiedBy":"wasadmin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort42","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.1.7"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"305b0a30-2a1b-4bab.8e64.fbd4befb6490","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"f25749f2-1e5e-4ec9.8fe2.5eab385ee2b8","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"ff2d79ff-d587-4759.ae17.ffd8d4ff1754","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Offline"}]
			});
			
			var classification = "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#ProductionTest";

			var options = {};
			
			var result = templating._test_handlerEndpointByClassifications(data, classification, options);
			result.should.equal("http://production.jkhle.com:9080/jkhle/services/AccountCreationTest");
			
		});
		
	});
	
		
});
