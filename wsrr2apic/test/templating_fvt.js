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
// Run these using "./node_modules/.bin/mocha --reporter spec --grep wsrrtemplating_fvttests"
// Run from the root folder.

var should = require('chai').should();
var os = require('os');
var fs = require('fs');

var templating = require('../lib/templating');

describe('wsrrtemplating_fsfvttests', function(){
	describe('loadTemplatesIntoMap and getTemplate', function() {
		this.timeout(15000);

		it('should load default template files', function(done) {
			// empty config so uses defaults
			templating.loadTemplatesIntoMap({}).then(function(){
				// check for some entries initially
				var content = templating.getTemplate(templating.SOAP);
				content.should.not.equal(null);
				content = templating.getTemplate(templating.REST);
				content.should.not.equal(null);
				content = templating.getTemplate(templating.REST_SWAGGER);
				content.should.not.equal(null);
				content = templating.getTemplate(templating.PRODUCT);
				content.should.not.equal(null);
				content = templating.getTemplate(templating.PRODUCT_PER_VERSION);
				content.should.not.equal(null);
				content = templating.getTemplate(templating.CONSUMERS_PER_VERSION);
				content.should.not.equal(null);
				
				done();
			}).caught(function(error){
				done(error);
			});
		});
		
		it('should load specified template files', function(done) {
			var map = {};
			map["template_SOAP"] = "templates/rest.yaml";
			
			templating.loadTemplatesIntoMap(map).then(function(){
				// check for some entries initially
				var soapContent = templating.getTemplate(templating.SOAP);
				soapContent.should.not.equal(null);
				var content = templating.getTemplate(templating.REST);
				content.should.not.equal(null);
				
				// soap and rest should be equal
				content.should.equal(soapContent);
				
				content = templating.getTemplate(templating.REST_SWAGGER);
				content.should.not.equal(null);
				content = templating.getTemplate(templating.PRODUCT);
				content.should.not.equal(null);
				
				done();
			}).caught(function(error) {
				done(error);
			});
		});

		it('should load specified template files which use fs paths', function(done) {
			var map = {};
			// template that is stored in some other directory
			map["template_SOAP"] = "test/differentPathTemplate.yaml";
			
			templating.loadTemplatesIntoMap(map).then(function(){
				// check for some entries initially
				var soapContent = templating.getTemplate(templating.SOAP);
				soapContent.should.not.equal(null);
				
				// soap should be our file
				var newContent = fs.readFileSync("test/differentPathTemplate.yaml", 'utf8');
				soapContent.should.equal(newContent);

				var content = templating.getTemplate(templating.REST);
				content.should.not.equal(null);
				content = templating.getTemplate(templating.REST_SWAGGER);
				content.should.not.equal(null);
				content = templating.getTemplate(templating.PRODUCT);
				content.should.not.equal(null);
				
				done();
			}).caught(function(error) {
				done(error);
			});
		});

	});
	
});
