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
/**
 * Tests for WSDL module.
 * 
 */

'use strict';

var should = require('chai').should();
var expect = require('chai').expect;

var wsdl = require('../lib/wsdl'), fs = require('fs'),
testData = require('./testData'), _ = require('lodash'),
path = require('path'), os = require('os');

function removeDirectory(testFolder, name) {
	try {
		var files = fs.readdirSync(testFolder + "/" + name);
		for(var i = 0; i < files.length; i++) {
			fs.unlinkSync(testFolder + "/" + name+ "/" + files[i]);
		}
	}catch (error) {

	}
	try {
		fs.rmdirSync(testFolder + "/" + name);
	}catch(error) {
		
	}
}

describe('wsdl_fsfvttests', function(){

	var testFolder = "wsdlTestOutput";
	var wsdl1 = "wsdl1";
	var wsdl2 = "wsdl2";
	var wsdl3 = "wsdl3";

	this.timeout(15000);
	
	before(function(done){
		require('../lib/Logger').initialize(done);
	});
	
	beforeEach(function(){
		try{
			fs.statSync(testFolder);
		} catch(error) {
			// make the dir in case the error was that the folder does not exist
			fs.mkdirSync(testFolder);
		}
		removeDirectory(path.join(testFolder, wsdl1), "xsd");
		removeDirectory(testFolder, wsdl1);
		removeDirectory(path.join(testFolder, wsdl2), "xsd");
		removeDirectory(testFolder, wsdl2);
		removeDirectory(testFolder, wsdl3);		
	});

	describe('getWSDLDirectoryList', function() {
		//this.timeout(15000);

		it('should find directories', function() {
			wsdl.initialize(testFolder);
			
			// make folders
			fs.mkdirSync(testFolder + "/" + wsdl1);
			fs.mkdirSync(testFolder + "/" + wsdl2);
			fs.mkdirSync(testFolder + "/" + wsdl3);
			
			return wsdl.getWSDLDirectoryList().then(function(list){
				// check list
				list.should.be.of.length(3);
				list.should.contain.members([wsdl1, wsdl2, wsdl3]);
			});
		});
		it('should ignore files', function() {
			wsdl.initialize(testFolder);
			
			// make folders
			fs.mkdirSync(testFolder + "/" + wsdl1);
			fs.mkdirSync(testFolder + "/" + wsdl2);
			fs.mkdirSync(testFolder + "/" + wsdl3);
			// add file in root
			fs.writeFileSync(testFolder + "/" + "MathServerService_EP1.wsdl", testData.mathServerService_EP1);
			
			return wsdl.getWSDLDirectoryList().then(function(list){
				// check list
				list.should.be.of.length(3);
				list.should.contain.members([wsdl1, wsdl2, wsdl3]);
			});
		});
	});

	describe('getWSDLContent', function() {
		this.timeout(15000);

		it('should find contents', function() {
			wsdl.initialize(testFolder);
			
			// make folder
			fs.mkdirSync(testFolder + "/" + wsdl1);
			
			// add wsdl to folder
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerService_EP1.wsdl", testData.mathServerService_EP1);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerBinding.wsdl", testData.mathServerBinding);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerInterface_InlineSchema1.xsd", testData.mathServerInterface_InlineSchema1);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerInterface.wsdl", testData.mathServerInterface);
			
			var expected = [];
			expected.push({name: "MathServerService_EP1.wsdl", location: "MathServerService_EP1.wsdl", bsrURI: "d94257d9-d39a-4a91.975e.9b545b9b5ecf", content: testData.mathServerService_EP1});
			expected.push({name: "MathServerBinding.wsdl", location: "MathServerBinding.wsdl", bsrURI: "8ec5198e-bedb-4be4.ae55.ba951cba5574", content: testData.mathServerBinding});
			expected.push({name: "MathServerInterface.wsdl", location: "MathServerInterface.wsdl", bsrURI: "97b28197-17b7-4790.87f0.488f5a48f053", content: testData.mathServerInterface});
			expected.push({name: "MathServerInterface_InlineSchema1.xsd", location: "MathServerInterface_InlineSchema1.xsd", bsrURI: "4db5094d-560b-4bb7.9010.537325531086", content: testData.mathServerInterface_InlineSchema1});

			return wsdl.getWSDLContent(wsdl1).then(function(data){
				// check data but bsrURI is random
				data.should.have.length.of(expected.length);
				for(var i = 0, len = data.length; i < len; i++) {
					var dat = data[i];
					var found = false;
					for(var j = 0; j < len; j++) {
						var expect = expected[j];
						if(expect.name === dat.name) {
							expect.content.should.deep.equal(dat.content);
							expect.location.should.equal(dat.location);
							found = true;
							break;
						}
					}
					if(found === false) {
						var msg = "Did not find: " + dat;
						console.error(msg);
						throw new Error(msg);
					}
				}
			});
		});

		it('should ignore non WSDL and XSD', function() {
			wsdl.initialize(testFolder);
			
			// make folder
			fs.mkdirSync(testFolder + "/" + wsdl1);
			
			// add wsdl to folder
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerService_EP1.wsdl", testData.mathServerService_EP1);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerBinding.wsdl", testData.mathServerBinding);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerInterface_InlineSchema1.xsd", testData.mathServerInterface_InlineSchema1);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerInterface.wsdl", testData.mathServerInterface);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "AddressInterface.txt", testData.addressInterfaceTxt);
			
			var expected = [];
			expected.push({name: "MathServerService_EP1.wsdl", location: "MathServerService_EP1.wsdl", bsrURI: "d94257d9-d39a-4a91.975e.9b545b9b5ecf", content: testData.mathServerService_EP1});
			expected.push({name: "MathServerBinding.wsdl", location: "MathServerBinding.wsdl", bsrURI: "8ec5198e-bedb-4be4.ae55.ba951cba5574", content: testData.mathServerBinding});
			expected.push({name: "MathServerInterface.wsdl", location: "MathServerInterface.wsdl", bsrURI: "97b28197-17b7-4790.87f0.488f5a48f053", content: testData.mathServerInterface});
			expected.push({name: "MathServerInterface_InlineSchema1.xsd", location: "MathServerInterface_InlineSchema1.xsd", bsrURI: "4db5094d-560b-4bb7.9010.537325531086", content: testData.mathServerInterface_InlineSchema1});

			return wsdl.getWSDLContent(wsdl1).then(function(data){
				// check data but bsrURI is random
				data.should.have.length.of(expected.length);
				for(var i = 0, len = data.length; i < len; i++) {
					var dat = data[i];
					var found = false;
					for(var j = 0; j < len; j++) {
						var expect = expected[j];
						if(expect.name === dat.name) {
							expect.content.should.deep.equal(dat.content);
							expect.location.should.equal(dat.location);
							found = true;
							break;
						}
					}
					if(found === false) {
						var msg = "Did not find: " + dat;
						console.error(msg);
						throw new Error(msg);
					}
				}
			});
		});

		it('should find contents in subdirs', function() {
			wsdl.initialize(testFolder);
			
			// make folders
			fs.mkdirSync(testFolder + "/" + wsdl1);
			fs.mkdirSync(testFolder + "/" + wsdl1 + "/xsd");
			
			// add wsdl to folder
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "AccountCreationProductionService.wsdl", testData.AccountCreationProductionService);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "AccountCreationInterface.wsdl", testData.AccountCreationInterface);
			// xsd in subfolder
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/xsd/" + "AccountCreationSchema.xsd", testData.AccountCreationSchema);
			
			var expected = [];
			expected.push({name: "AccountCreationProductionService.wsdl", location: "AccountCreationProductionService.wsdl", bsrURI: "d94257d9-d39a-4a91.975e.9b545b9b5ecf", content: testData.AccountCreationProductionService});
			expected.push({name: "AccountCreationInterface.wsdl", location: "AccountCreationInterface.wsdl", bsrURI: "8ec5198e-bedb-4be4.ae55.ba951cba5574", content: testData.AccountCreationInterface});
			expected.push({name: "AccountCreationSchema.xsd", location: "xsd" + path.sep + "AccountCreationSchema.xsd", bsrURI: "4db5094d-560b-4bb7.9010.537325531086", content: testData.AccountCreationSchema});

			return wsdl.getWSDLContent(wsdl1).then(function(data){
				// check data but bsrURI is random
				data.should.have.length.of(expected.length);
				for(var i = 0, len = data.length; i < len; i++) {
					var dat = data[i];
					var found = false;
					for(var j = 0; j < len; j++) {
						var expect = expected[j];
						if(expect.name === dat.name) {
							dat.location.should.equal(expect.location);
							dat.content.should.deep.equal(expect.content);
							found = true;
							break;
						}
					}
					if(found === false) {
						var msg = "Did not find: " + dat;
						console.error(msg);
						throw new Error(msg);
					}
				}
			});
		});
		
	});

	describe('getMetadata', function() {
		//this.timeout(15000);

		it('should find null when no metadata', function() {
			wsdl.initialize(testFolder);
			
			// make folder
			fs.mkdirSync(testFolder + "/" + wsdl1);

			return wsdl.getMetadata(wsdl1).then(function(data){
				expect(data).to.equal(null);
			});
		});
		
		it('should find metadata', function() {
			wsdl.initialize(testFolder);
			
			var content = new Buffer("swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'", "utf8");
			var contentObj = {
					swagger: "2.0",
					info: {
						version: "1.0.0"
					}
			};
			
			// make folder
			fs.mkdirSync(testFolder + "/" + wsdl1);

			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "metadata.yaml", content);
			
			return wsdl.getMetadata(wsdl1).then(function(data){
				contentObj.should.deep.equal(data);
			});
		});
		
	});
	
	afterEach(function(){
//		console.log("After deleting folders");

		removeDirectory(path.join(testFolder, wsdl1), "xsd");
		removeDirectory(testFolder, wsdl1);
		removeDirectory(path.join(testFolder, wsdl2), "xsd");
		removeDirectory(testFolder, wsdl2);
		removeDirectory(testFolder, wsdl3);		

//		console.log("After done");
	});
	
});
