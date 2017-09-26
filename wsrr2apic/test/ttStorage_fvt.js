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
 * FVT tests for ttStorage.
 * 
 * Uses the FS to do the tests.
 *
 * Run with: ./node_modules/mocha/bin/mocha --grep ttStorage_fvttests 
 * from the root directory (above /tests)
 * 
 */

var should = require('chai').should();
var expect = require('chai').expect;

var ttStorage = require('../lib/ttStorage'), fs = require('fs'), AdmZip = require("adm-zip"),
yaml = require('js-yaml'), os = require("os"), testData = require('./testData'), _ = require('lodash'),
path = require('path');

var checkFolders = function(testFolder, bs, sv) {
	var stat = fs.statSync(testFolder + "/" + bs);
	stat.isDirectory().should.equal(true);
	stat = fs.statSync(testFolder + "/" + bs + "/docs");
	stat.isDirectory().should.equal(true);				
	stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
	stat.isDirectory().should.equal(true);
	stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs");
	stat.isDirectory().should.equal(true);
	stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/docs");
	stat.isDirectory().should.equal(true);				
};

describe('ttStorage_fsfvttests', function(){

	var testFolder = "ttStorageTestOutput";
	var bs = "businessService";
	var bs2 = "businessService2";
	var sv = "serviceVersion";
	var sv2 = "serviceVersion2";

	beforeEach(function(){
//		console.log("Before making folders");
		try{
			fs.statSync(testFolder);
		} catch(error) {
			// make the dir in case the error was that the folder does not exist
			fs.mkdirSync(testFolder);
		}
//		console.log("Before done");
	});
	
	describe('_test_makeFolders', function() {
		//this.timeout(15000);

		it('should make folder for BS and SV', function(done) {
			ttStorage.setFSRoot(testFolder);

			var promise = ttStorage._test_makeFolders(bs, sv);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				checkFolders(testFolder, bs, sv);

				done();
			});
		});

		it('should make folder for SV when BS folder exists', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make bs folder
			fs.mkdirSync(testFolder + "/" + bs);
			
			var promise = ttStorage._test_makeFolders(bs, sv);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				checkFolders(testFolder, bs, sv);
				
				done();
			});
		});

		it('should work when BS and SV folder exists', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make bs folder
			fs.mkdirSync(testFolder + "/" + bs);

			// make sv folder
			fs.mkdirSync(testFolder + "/" + bs + "/" + sv);

			var promise = ttStorage._test_makeFolders(bs, sv);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				checkFolders(testFolder, bs, sv);

				done();
			});
		});

		it('should work when BS and SV and logs folder exists', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make bs folder
			fs.mkdirSync(testFolder + "/" + bs);

			// make sv folder
			fs.mkdirSync(testFolder + "/" + bs + "/" + sv);

			// make logs folder
			fs.mkdirSync(testFolder + "/" + bs + "/" + sv + "/logs");

			var promise = ttStorage._test_makeFolders(bs, sv);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				checkFolders(testFolder, bs, sv);
				
				done();
			});
		});

		it('should make folder for SV2', function(done) {
			ttStorage.setFSRoot(testFolder);

			var promise = ttStorage._test_makeFolders(bs, sv);
			promise.then(function() {
				// if resolved then ok
				return ttStorage._test_makeFolders(bs, sv2);
			}).then(function(){
					// check it did what we expect
				
					checkFolders(testFolder, bs, sv);
					checkFolders(testFolder, bs, sv2);
				
					var stat = fs.statSync(testFolder + "/" + bs);
					stat.isDirectory().should.equal(true);
					stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
					stat.isDirectory().should.equal(true);
					stat = fs.statSync(testFolder + "/" + bs + "/" + sv2);
					stat.isDirectory().should.equal(true);
					
					done();
			});
		});

		it('should make folder for BS only', function(done) {
			ttStorage.setFSRoot(testFolder);

			var promise = ttStorage._test_makeFolders(bs);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/docs");
				stat.isDirectory().should.equal(true);				
				
				done();
			});
		});

	});

	describe('storeWSDL', function() {

		it('should make WSDL zip', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// [{bsrURI: bsrURI of doc, name: name of doc, content: Buffer with binary content}]
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = [];
			var buffer = new Buffer(testString, "utf8");
			data.push({bsrURI: bsrURI, name: name, content: buffer, location: name});
			
			var promise = ttStorage.storeWSDL(bs, sv, data);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a zip
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/" + sv + "_wsdls.zip");
				stat.isFile().should.equal(true);
				
				// check contents of the zip
				var zip = new AdmZip(testFolder + "/" + bs + "/" + sv + "/" + sv + "_wsdls.zip");
				var zipEntries = zip.getEntries();
				zipEntries.forEach(function(zipEntry){
					// expect just one entry
					zipEntry.entryName.should.equal(name);
					// get string
					zipEntry.getData().toString("utf8").should.equal(testString);
				});
				
				done();
			});
		});

	});	

	describe('getWSDLPath', function() {
		//this.timeout(15000);

		it('should get the WSDL path', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// [{bsrURI: bsrURI of doc, name: name of doc, content: Buffer with binary content}]
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = [];
			var buffer = new Buffer(testString, "utf8");
			data.push({bsrURI: bsrURI, name: name, content: buffer, location: name});
			
			var promise = ttStorage.storeWSDL(bs, sv, data);
			promise.then(function() {
				// if resolved then ok
				
				// get the path used to store the WSDL
				var path = ttStorage.getWSDLPath(bs, sv);
				
				// check it wrote a zip using the path we asked for
				stat = fs.statSync(path);
				stat.isFile().should.equal(true);
				
				// contents is checked by test for storeWSDL
				
				done();
			});
		});

	});	

	describe('getProductPath', function() {

		it('should get the Product path', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// [{bsrURI: bsrURI of doc, name: name of doc, content: Buffer with binary content}]
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {bsrURI: bsrURI, name: name, content: testString};
			
			var promise = ttStorage.storeProductYaml(bs, sv, data);
			promise.then(function() {
				// if resolved then ok
				
				// get the path used to store the Product
				var path = ttStorage.getProductPath(bs, sv);
				
				// check it wrote a yaml using the path we asked for
				var stat = fs.statSync(path);
				stat.isFile().should.equal(true);
				
				// contents is checked by test for storeProductYaml
				
				done();
			});
		});

	});	

	describe('getProductDirectoryPath', function() {
		//this.timeout(15000);

		it('should get the Product Directory path', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// [{bsrURI: bsrURI of doc, name: name of doc, content: Buffer with binary content}]
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {bsrURI: bsrURI, name: name, content: testString};
			
			var promise = ttStorage.storeProductYaml(bs, sv, data);
			promise.then(function() {
				// if resolved then ok
				
				// get the path used to store the Product
				var path = ttStorage.getProductDirectoryPath(bs, sv);
				
				// check it was where the yaml is
				stat = fs.statSync(path);
				stat.isDirectory().should.equal(true);
				
				// contents is checked by test for storeProductYaml
				
				done();
			});
		});

	});	
	
	describe('storeProductYaml', function() {

		it('should make product yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeProductYaml(bs, sv, data);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/product.yaml");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = yaml.safeLoad(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/product.yaml", 'utf8'));
				object.should.have.deep.equal(data);
				
				done();
			});
		});

	});	

	describe('storeApiYaml', function() {
		//this.timeout(15000);

		it('should make api yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeApiYaml(bs, sv, data);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/api.yaml");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = yaml.safeLoad(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/api.yaml", 'utf8'));
				object.should.have.deep.equal(data);
				
				done();
			});
		});
	});

	describe('storeConsumersYaml', function() {
		//this.timeout(15000);

		it('should make consumers yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeConsumersYaml(bs, sv, data);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/consumers.yaml");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = yaml.safeLoad(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/consumers.yaml", 'utf8'));
				object.should.have.deep.equal(data);
				
				done();
			});
		});
	});

	describe('readConsumersYaml', function() {

		it('should read consumers yaml', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeConsumersYaml(bs, sv, data).then(function() {
				// read consumers now				
				return ttStorage.readConsumersYaml(bs, sv);
			}).then(function(object){
				object.should.have.deep.equal(data);
			});
			return promise;
		});
		
	});

	describe('existsConsumersYaml', function() {

		it('should find existing consumers yaml', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeConsumersYaml(bs, sv, data).then(function() {
				// read consumers now				
				return ttStorage.existsConsumersYaml(bs, sv);
			}).then(function(exists){
				exists.should.equal(true);
			});
			return promise;
		});

		it('should not find non-existing consumers yaml', function() {
			ttStorage.setFSRoot(testFolder);

			// make folder
			var promise = ttStorage._test_makeFolders(bs, sv).then(function() {
				// read consumers now				
				return ttStorage.existsConsumersYaml(bs, sv);
			}).then(function(exists){
				exists.should.equal(false);
			});
			return promise;
		});
		
	});

	describe('storeWSRRApiYaml', function() {
		//this.timeout(15000);

		it('should make WSRR api yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeWSRRApiYaml(bs, sv, data);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs");
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs/wsrr.yaml");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = yaml.safeLoad(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/logs/wsrr.yaml", 'utf8'));
				object.should.have.deep.equal(data);
				
				done();
			});
		});
	});

	describe('moveWSDLYaml', function() {

		it('should move the wsdl yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make file
			var testString = "test string";
			fs.writeFileSync(testFolder + "/testfile.txt", testString);

			var promise = ttStorage._test_makeFolders(bs, sv).then(function() {
				// move
				return ttStorage.moveWSDLYaml(testFolder + "/testfile.txt", bs, sv);
			}).then(function() {
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs/wsdl.yaml");
				stat.isFile().should.equal(true);
				
				var content = fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/logs/wsdl.yaml", "utf8");
				content.should.equal(testString);
				
				done();				
			});
			
		});
	});

	describe('_test_copyMoveWSDLYaml', function() {
		//this.timeout(15000);

		it('should copy move the wsdl yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make file
			var testString = "test string";
			fs.writeFileSync(testFolder + "/testfile.txt", testString);

			var promise = ttStorage._test_makeFolders(bs, sv).then(function() {
				// move
				var path = testFolder + "/" + bs + "/" + sv + "/logs/wsdl.yaml";
				return ttStorage._test_copyMoveWSDLYaml(testFolder + "/testfile.txt", path);
			}).then(function() {
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs/wsdl.yaml");
				stat.isFile().should.equal(true);
				
				var content = fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/logs/wsdl.yaml", "utf8");
				content.should.equal(testString);
				
				done();				
			});
			
		});
	});
	
	describe('readWSRRApiYaml', function() {
		//this.timeout(15000);

		it('should load WSRR api yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeWSRRApiYaml(bs, sv, data);
			promise.then(function() {
				// if resolved then ok

				// load the file back
				return ttStorage.readWSRRApiYaml(bs, sv);
			}).then(function(object){
				object.should.have.deep.equal(data);
				
				done();
			});
		});
	});

	describe('readProductYaml', function() {
		//this.timeout(15000);

		it('should load product yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeProductYaml(bs, sv, data);
			promise.then(function() {
				// if resolved then ok

				// load the file back
				return ttStorage.readProductYaml(bs, sv);
			}).then(function(object){
				object.should.have.deep.equal(data);
				
				done();
			});
		});
	});
	
	describe('readWSDLYaml', function() {
		//this.timeout(15000);

		it('should read WSDL yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			var promise = ttStorage._test_makeFolders(bs, sv).then(function() {
				
				var yaml = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL;
				var object = {swagger: "2.0", info: {version: "1.0.0"}};
				
				// write YAML ourselves
				fs.writeFileSync(testFolder + "/" + bs + "/" + sv + "/logs/wsdl.yaml", yaml);
				
				// now read it back as an object
				ttStorage.readWSDLYaml(bs, sv).then(function(data) {
					data.should.deep.equal(object);
					
					done();
				});
			});
			
		});
	});

	describe('readCreatedRESTYaml', function() {
		//this.timeout(15000);

		it('should read REST yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			var promise = ttStorage._test_makeFolders(bs, sv).then(function() {
				
				var yaml = "swagger: '2.0'" + os.EOL + "info:" + os.EOL + "  version: '1.0.0'" + os.EOL;
				var object = {swagger: "2.0", info: {version: "1.0.0"}};
				
				// write YAML ourselves
				fs.writeFileSync(testFolder + "/" + bs + "/" + sv + "/logs/createdRest.yaml", yaml);
				
				// now read it back as an object
				ttStorage.readCreatedRESTYaml(bs, sv).then(function(data) {
					data.should.deep.equal(object);
					
					done();
				});
			});
			
		});
	});

	describe('storeCombinedRESTYaml', function() {
		//this.timeout(15000);

		it('should store combined rest yaml', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeCombinedRESTYaml(bs, sv, data);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs/combinedApi.yaml");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = yaml.safeLoad(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/logs/combinedApi.yaml", 'utf8'));
				object.should.have.deep.equal(data);
				
				done();
			});
		});
	});
	
	describe('storeDiagnostic', function() {
		//this.timeout(15000);

		it('should save the diagnostic', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeDiagnostic(bs, sv, data, "diagnostic.json");
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs");
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs/diagnostic.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = JSON.parse(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/logs/diagnostic.json", 'utf8'));
				object.should.have.deep.equal(data);
				
				done();
			});
		});
	});

	describe('storeWsrrData', function() {
		//this.timeout(15000);

		it('should save the data', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeWsrrData(bs, sv, data);
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs");
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs/wsrrdata.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = JSON.parse(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/logs/wsrrdata.json", 'utf8'));
				object.should.have.deep.equal(data);
				
				done();
			});
		});
	});

	describe('readWsrrData', function() {
		//this.timeout(15000);

		it('should read the data', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeWsrrData(bs, sv, data).then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs");
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs/wsrrdata.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading using method
				ttStorage.readWsrrData(bs, sv).then(function(object){
					object.should.have.deep.equal(data);
				});
			});
			return promise;
		});
	});
	
	describe('readWsrrDataOrEmpty', function() {
		//this.timeout(15000);

		it('should read the data', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var testString = "test string";
			var bsrURI = "xxx-yyy-zzz";
			var name = "doc.wsdl";
			
			var data = {};
			data.name = name;
			data.bsrURI = bsrURI;
			data.testString = testString;
			
			var promise = ttStorage.storeWsrrData(bs, sv, data).then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs");
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs/wsrrdata.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading using method
				ttStorage.readWsrrDataOrEmpty(bs, sv).then(function(object){
					object.should.have.deep.equal(data);
				});
			});
			return promise;
		});
		it('should return null for no data', function() {
			ttStorage.setFSRoot(testFolder);
			
			var promise = ttStorage._test_makeFolders(bs, sv).then(function() {
				// if resolved then ok
				// check contents of the not file by loading using method
				ttStorage.readWsrrDataOrEmpty(bs, sv).then(function(object){
					expect(object).to.be.a('null');
				});
			});
			return promise;
		});
	});

	describe('storeDiagnosticString', function() {
		//this.timeout(15000);

		it('should save the diagnostic string', function(done) {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old string}
			
			var testString = "test string";
			
			var promise = ttStorage.storeDiagnosticString(bs, sv, testString, "diagnostic.txt");
			promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs");
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/logs/diagnostic.txt");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var readString = fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/logs/diagnostic.txt", 'utf8');
				
				readString.should.equal(testString);
				
				done();
			});
		});
	});

	describe('storeTransferResult', function() {
		//this.timeout(15000);

		it('should save the success result', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var data = {};
			data.success = true;
			data.captureAttempted = true;
			data.captureSuccess = true;
			data.pushAttempted = true;
			data.pushSuccess = true;
			data.publishSuccess = true;
			data.publishAttempted = true;
			data.catalogs = ["sb"];
			data.consumersAttempted = true;
			data.consumersSuccess = true;
			
			var promise = ttStorage.storeTransferResult(bs, sv, data).then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/result.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = JSON.parse(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/result.json", 'utf8'));
				object.should.have.deep.equal(data);
				
			});
			return promise;			
		});
		it('should save the push error result', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var data = {};
			data.success = false;
			data.diagnostics = ["error1"];
			data.captureAttempted = true;
			data.captureSuccess = true;
			data.pushAttempted = true;
			data.pushSuccess = false;
			data.publishAttempted = false;
			data.publishSuccess = false;
			data.catalogs = [];
			data.consumersAttempted = false;
			data.consumersSuccess = false;
			
			var promise = ttStorage.storeTransferResult(bs, sv, data).then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/result.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = JSON.parse(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/result.json", 'utf8'));
				object.should.have.deep.equal(data);
				
			});
			return promise;
		});
		it('should save the capture error result', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			var data = {};
			data.success = false;
			data.diagnostics = ["error1"];
			data.captureAttempted = true;
			data.captureSuccess = false;
			data.pushAttempted = false;
			data.pushSuccess = false;
			data.publishAttempted = false;
			data.publishSuccess = false;
			data.catalogs = [];
			data.consumersAttempted = false;
			data.consumersSuccess = false;
			
			var promise = ttStorage.storeTransferResult(bs, sv, data).then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/result.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = JSON.parse(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/result.json", 'utf8'));
				object.should.have.deep.equal(data);
				
			});
			return promise;
		});
		it('should default the push', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			// no push should be defaulted to false
			var data = {};
			data.success = true;
			data.captureAttempted = true;
			data.captureSuccess = true;
			
			var expected = _.cloneDeep(data);
			expected.pushAttempted = false;
			expected.pushSuccess = false;
			expected.publishAttempted = false;
			expected.publishSuccess = false;
			expected.catalogs = [];
			expected.consumersAttempted = false;
			expected.consumersSuccess = false;
			
			var promise = ttStorage.storeTransferResult(bs, sv, data).then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/result.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = JSON.parse(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/result.json", 'utf8'));
				object.should.have.deep.equal(expected);
				
			});
			return promise;
		});
		it('should default the capture', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			// no capture should be defaulted to true
			var data = {};
			data.success = true;
			// attempted should indicate the capture succeeded
			data.pushAttempted = true;
			data.pushSuccess = false;
			data.publishAttempted = false;
			data.publishSuccess = false;
			data.catalogs = [];
			data.consumersAttempted = false;
			data.consumersSuccess = false;
			
			var expected = _.cloneDeep(data);
			expected.captureAttempted = true;
			expected.captureSuccess = true;
			
			var promise = ttStorage.storeTransferResult(bs, sv, data).then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/result.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = JSON.parse(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/result.json", 'utf8'));
				object.should.have.deep.equal(expected);
				
			});
			return promise;
		});
		it('should default the publish', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			// no publish should be defaulted to false
			var data = {};
			data.success = true;
			data.captureAttempted = true;
			data.captureSuccess = true;
			data.pushAttempted = true;
			data.pushSuccess = true;
			data.catalogs = [];
			data.consumersAttempted = false;
			data.consumersSuccess = false;
			
			var expected = _.cloneDeep(data);
			expected.publishAttempted = false;
			expected.publishSuccess = false;
			
			var promise = ttStorage.storeTransferResult(bs, sv, data).then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/result.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = JSON.parse(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/result.json", 'utf8'));
				object.should.have.deep.equal(expected);
				
			});
			return promise;
		});

		it('should default the consumers', function() {
			ttStorage.setFSRoot(testFolder);

			// make data in memory
			// {any old object}
			
			// no consumers should be defaulted to false
			var data = {};
			data.success = true;
			data.captureAttempted = true;
			data.captureSuccess = true;
			data.pushAttempted = true;
			data.pushSuccess = true;
			data.publishAttempted = true;
			data.publishSuccess = true;
			data.catalogs = [];
			
			var expected = _.cloneDeep(data);
			expected.consumersAttempted = false;
			expected.consumersSuccess = false;
			
			var promise = ttStorage.storeTransferResult(bs, sv, data).then(function() {
				// if resolved then ok
				
				// check it did what we expect
				var stat = fs.statSync(testFolder + "/" + bs);
				stat.isDirectory().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv);
				stat.isDirectory().should.equal(true);
				
				// check it wrote a file
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/result.json");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var object = JSON.parse(fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/result.json", 'utf8'));
				object.should.have.deep.equal(expected);
				
			});
			return promise;
		});

	});

	describe('_test_storeBinaryDocs', function() {
		this.timeout(15000);

		it('should store a binary doc', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});

			// store under bs for now, doesn't matter
			var dataPath = testFolder + "/" + bs;
			try {
				fs.mkdirSync(dataPath);
			}catch(e) {
				console.log(e);
				// ignore
			}
			
			var promise = ttStorage._test_storeBinaryDocs(dataPath, data);
			return promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/test.doc");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var binary = fs.readFileSync(testFolder + "/" + bs + "/test.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
			});
		});

		it('should work for empty array', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];

			// store under bs for now, doesn't matter
			var dataPath = testFolder + "/" + bs;
			try {
				fs.mkdirSync(dataPath);
			}catch(e) {
				console.log(e);
				// ignore
			}
			
			var promise = ttStorage._test_storeBinaryDocs(dataPath, data);
			return promise.then(function() {
				// if resolved then ok
				
			});
		});

		it('should store multiple binary docs', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "test2.doc",
				bsrURI: "b",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "test3.doc",
				bsrURI: "c",
				content: testData.catalogSearchCharter
			});

			// store under bs for now, doesn't matter
			var dataPath = testFolder + "/" + bs;
			try {
				fs.mkdirSync(dataPath);
			}catch(e) {
				console.log(e);
				// ignore
			}
			
			var promise = ttStorage._test_storeBinaryDocs(dataPath, data);
			return promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/test.doc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/test2.doc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/test3.doc");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var binary = fs.readFileSync(testFolder + "/" + bs + "/test.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/test2.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/test3.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
			});
		});

		it('should store multiple binary docs with clashing names', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];
			// clash of two names
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "test.doc",
				bsrURI: "b",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "testNew.doc",
				bsrURI: "c",
				content: testData.catalogSearchCharter
			});

			// store under bs for now, doesn't matter
			var dataPath = testFolder + "/" + bs;
			try {
				fs.mkdirSync(dataPath);
			}catch(e) {
				console.log(e);
				// ignore
			}
			
			var promise = ttStorage._test_storeBinaryDocs(dataPath, data);
			return promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/a_test.doc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/b_test.doc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/testNew.doc");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var binary = fs.readFileSync(testFolder + "/" + bs + "/a_test.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/b_test.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/testNew.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
			});
		});

		it('should store 1 copy of 2 binary docs with the same bsrURI', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];
			// clash of two names but same bsrURI for both
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "testNew.doc",
				bsrURI: "c",
				content: testData.catalogSearchCharter
			});

			// store under bs for now, doesn't matter
			var dataPath = testFolder + "/" + bs;
			try {
				fs.mkdirSync(dataPath);
			}catch(e) {
				console.log(e);
				// ignore
			}
			
			var promise = ttStorage._test_storeBinaryDocs(dataPath, data);
			return promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/test.doc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/testNew.doc");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var binary = fs.readFileSync(testFolder + "/" + bs + "/test.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/testNew.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
			});
		});

		it('should store 1 copy of 3 binary docs with the same bsrURI', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];
			// clash of 3 names but same bsrURI for all 3
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "testNew.doc",
				bsrURI: "c",
				content: testData.catalogSearchCharter
			});

			// store under bs for now, doesn't matter
			var dataPath = testFolder + "/" + bs;
			try {
				fs.mkdirSync(dataPath);
			}catch(e) {
				console.log(e);
				// ignore
			}
			
			var promise = ttStorage._test_storeBinaryDocs(dataPath, data);
			return promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/test.doc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/testNew.doc");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var binary = fs.readFileSync(testFolder + "/" + bs + "/test.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/testNew.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
			});
		});

		it('should store a docs with embedded relative paths in the names', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];
			data.push({
				name: "Service v1.0 WSDL\\Schema package",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "Service v2.0 WSDL/Schema package",
				bsrURI: "b",
				content: testData.addressInterfaceTxt
			});
			data.push({
				name: "Service v2.0 WSDL\Schema package",
				bsrURI: "c",
				content: testData.echoJson
			});
			data.push({
				name: "../Service v2.0 WSDL/Schema package",
				bsrURI: "d",
				content: testData.catalogSearch
			});

			// store under bs for now, doesn't matter
			var dataPath = testFolder + "/" + bs;
			try {
				fs.mkdirSync(dataPath);
			}catch(e) {
				console.log(e);
				// ignore
			}
			
			var promise = ttStorage._test_storeBinaryDocs(dataPath, data);
			return promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/Service v1.0 WSDLSchema package");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/b_Service v2.0 WSDLSchema package");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/c_Service v2.0 WSDLSchema package");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/d_Service v2.0 WSDLSchema package");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var binary = fs.readFileSync(testFolder + "/" + bs + "/Service v1.0 WSDLSchema package");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/b_Service v2.0 WSDLSchema package");
				binary.should.deep.equal(testData.addressInterfaceTxt);
				binary = fs.readFileSync(testFolder + "/" + bs + "/c_Service v2.0 WSDLSchema package");
				binary.should.deep.equal(testData.echoJson);
				binary = fs.readFileSync(testFolder + "/" + bs + "/d_Service v2.0 WSDLSchema package");
				binary.should.deep.equal(testData.catalogSearch);
			});
		});
		it('should change name of binary document containing special characters',function(){
			ttStorage.setFSRoot(testFolder);
			
			var data = [];
			data.push({
				name: "Service.svc",
				bsrURI: "s",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "ServiceA.svc?wsdl",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "ServiceB.svc:wsdl",
				bsrURI: "b",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "ServiceC.svc*wsdl",
				bsrURI: "c",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "ServiceD.svc|wsdl",
				bsrURI: "d",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "ServiceE.svc<wsdl",
				bsrURI: "e",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "ServiceF.svc>wsdl",
				bsrURI: "f",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "Ser?vice*G.svc|wsdl",
				bsrURI: "g",
				content: testData.catalogSearchCharter
			});
			
			// store under bs for now, doesn't matter
			var dataPath = testFolder + "/" + bs;
			try {
				fs.mkdirSync(dataPath);
			}catch(e) {
				console.log(e);
				// ignore
			}
			var promise = ttStorage._test_storeBinaryDocs(dataPath, data);
			return promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect				
				// check it wrote a file
				/*fs.readdir(testFolder + "/" + bs, function(err, items) {
				    console.log(items);
				 
				    for (var i=0; i<items.length; i++) {
				        console.log(items[i]);
				    }
				});*/
				var stat = fs.statSync(testFolder + "/" + bs + "/Service.svc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/ServiceA.svc.wsdl");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/ServiceB.svc.wsdl");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/ServiceC.svc.wsdl");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/ServiceD.svc.wsdl");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/ServiceE.svc.wsdl");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/ServiceF.svc.wsdl");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/Ser.vice.G.svc.wsdl");
				stat.isFile().should.equal(true);
			});
		});
	});

	describe('storeBusinessServiceArtifacts', function() {
		this.timeout(15000);

		it('should store a binary doc', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});

			var promise = ttStorage.storeBusinessServiceArtifacts(bs, data);
			return promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/docs/test.doc");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var binary = fs.readFileSync(testFolder + "/" + bs + "/docs/test.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
			});
		});

		it('should work for empty array', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];

			var promise = ttStorage.storeBusinessServiceArtifacts(bs, data);
			return promise.then(function() {
				// if resolved then ok
				
			});
		});

		it('should store multiple binary docs', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "test2.doc",
				bsrURI: "b",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "test3.doc",
				bsrURI: "c",
				content: testData.catalogSearchCharter
			});

			var promise = ttStorage.storeBusinessServiceArtifacts(bs, data);
			return promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/docs/test.doc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/docs/test2.doc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/docs/test3.doc");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var binary = fs.readFileSync(testFolder + "/" + bs + "/docs/test.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/docs/test2.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/docs/test3.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
			});
		});

	});

	describe('storeServiceVersionArtifacts', function() {
		this.timeout(15000);

		it('should store a binary doc', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});

			var promise = ttStorage.storeServiceVersionArtifacts(bs, sv, data);
			return promise.then(function() {
				// if resolved then ok
				
				// check it did what we expect
				
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/docs/test.doc");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var binary = fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/docs/test.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
			});
		});

		it('should work for empty array', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];

			var promise = ttStorage.storeServiceVersionArtifacts(bs, sv, data);
			return promise.then(function() {
				// if resolved then ok
				
			});
		});

		it('should store multiple binary docs', function() {
			ttStorage.setFSRoot(testFolder);

			var data = [];
			data.push({
				name: "test.doc",
				bsrURI: "a",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "test2.doc",
				bsrURI: "b",
				content: testData.catalogSearchCharter
			});
			data.push({
				name: "test3.doc",
				bsrURI: "c",
				content: testData.catalogSearchCharter
			});

			return ttStorage.storeServiceVersionArtifacts(bs, sv, data).then(function() {
				// if resolved then ok
				
				// check it did what we expect
				
				// check it wrote a file
				var stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/docs/test.doc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/docs/test2.doc");
				stat.isFile().should.equal(true);
				stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/docs/test3.doc");
				stat.isFile().should.equal(true);
				
				// check contents of the file by loading
				var binary = fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/docs/test.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/docs/test2.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
				binary = fs.readFileSync(testFolder + "/" + bs + "/" + sv + "/docs/test3.doc");
				binary.should.deep.equal(testData.catalogSearchCharter);
			});
		});

	});

	describe('clearVersionFolder', function() {
		this.timeout(15000);
	
		it('should clear the folder when nothing is in there', function() {
			ttStorage.setFSRoot(testFolder);

			var promise = ttStorage.clearVersionFolder(bs, sv);
			return promise;
		});
		
		it('should clear the folder when something is in there', function() {
			ttStorage.setFSRoot(testFolder);

			var promise = ttStorage._test_makeFolders(bs, sv).then(function(){
				// put some things in there
				fs.writeFileSync(testFolder + "/" + bs + "/" + sv + "/test.txt", "Hello World Test");
				fs.writeFileSync(testFolder + "/" + bs + "/" + sv + "/test2.txt", "Hello World Test 2");
				fs.writeFileSync(testFolder + "/" + bs + "/" + sv + "/test3.txt", "Hello World Test 3");
				
				return ttStorage.clearVersionFolder(bs, sv);
			});
			return promise.then(function() {
				// if resolved then ok
				
				// check it is empty
				var files = fs.readdirSync(testFolder + "/" + bs + "/" + sv);
				for(var i = 0; i < files.length; i++) {
					var stat = fs.statSync(testFolder + "/" + bs + "/" + sv + "/" + files[i]);
					// make objects so the fail shows the file name
					var check = {name: files[i], isFile: stat.isFile()};
					var expected = {name: files[i], isFile: false};
					check.should.deep.equal(expected);
				}
			});
		});
		
	});

	describe('_test_getDirectoryList', function() {
		this.timeout(15000);
		it('finds nothing when nothing is there', function() {
			ttStorage.setFSRoot(testFolder);

			var promise = ttStorage._test_getDirectoryList(testFolder).then(function(list){
				list.should.be.of.length(0);
			});
			return promise;
		});
	});
	
	describe('_test_getDirectoryList2', function() {
		this.timeout(15000);
		it('find 1 directory', function() {
			ttStorage.setFSRoot(testFolder);

			var promise = ttStorage._test_makeFolders(bs, sv).then(function(){
				var listPromise = ttStorage._test_getDirectoryList(testFolder).then(function(list){
					list.should.be.of.length(1);
					list[0].should.deep.equal(bs);
				});
				return listPromise;
			});
			
			return promise;
		});
	});
	
	describe('_test_getDirectoryList3', function() {
		this.timeout(15000);
		it('finds multiple directories', function() {
			ttStorage.setFSRoot(testFolder);

			var promise = ttStorage._test_makeFolders(bs, sv).then(function(){
				return ttStorage._test_makeFolders(bs, sv2);
			}).then(function(){
				var filePath = path.resolve(testFolder, bs);
				var listPromise = ttStorage._test_getDirectoryList(filePath).then(function(list){
					// will also get a "docs" folder under the bs folder
					list.should.be.of.length(3);
					list.should.deep.include.members([sv, sv2, "docs"]);
				});
				return listPromise;
			});
			
			return promise;
		});
	
	});

	// getBusinessServiceVersionList
	describe('getBusinessServiceVersionList', function() {
		this.timeout(15000);
		it('finds multiple versions', function() {
			ttStorage.setFSRoot(testFolder);

			// make one bs with two versions
			var promise = ttStorage._test_makeFolders(bs, sv).then(function(){
				return ttStorage._test_makeFolders(bs, sv2);
			}).then(function(){
				var listPromise = ttStorage.getBusinessServiceVersionList().then(function(list){
					list.should.be.of.length(1);
					list[0].bsBsrURI.should.equal(bs);
					list[0].versions.should.deep.include.members([sv, sv2]);
				});
				return listPromise;
			});
			
			return promise;
		});
	
	});
	describe('getBusinessServiceVersionList2', function() {
		this.timeout(15000);
		it('finds multiple services and versions', function() {
			ttStorage.setFSRoot(testFolder);

			// make two bs with two versions
			var promise = ttStorage._test_makeFolders(bs, sv).then(function(){
				return ttStorage._test_makeFolders(bs, sv2);
			}).then(function(){
				return ttStorage._test_makeFolders(bs2, sv);
			}).then(function(){
				var listPromise = ttStorage.getBusinessServiceVersionList().then(function(list){
					list.should.be.of.length(2);
					for(var i = 0, len = list.length; i < len; i++) {
						var member = list[i];
						if(member.bsBsrURI === bs) {
							member.versions.should.be.of.length(2);
							member.versions.should.include.members([sv, sv2]);
						} else if(member.bsBsrURI === bs2) {
							member.versions.should.be.of.length(1);
							member.versions.should.include.members([sv]);
						} else {
							throw new Error("bad bs bsrURI: " + member.bsBsrURI);
						}
					}
				});
				return listPromise;
			});
			
			return promise;
		});
	
	});
	
	afterEach(function(){

		var files, i;
//		console.log("After deleting folders");
		try {
			files = fs.readdirSync(testFolder + "/" + bs + "/" + sv + "/logs");
			for(i = 0; i < files.length; i++) {
				fs.unlinkSync(testFolder + "/" + bs + "/" + sv + "/logs/" + files[i]);
			}
		}catch (error) {

		}
		try {
			fs.rmdirSync(testFolder + "/" + bs + "/" + sv + "/logs");
		}catch(error) {
			
		}
		try {
			fs.rmdirSync(testFolder + "/" + bs + "/" + sv2 + "/logs");
		}catch(error) {
			
		}
		try {
			fs.rmdirSync(testFolder + "/" + bs2 + "/" + sv + "/logs");
		}catch(error) {
			
		}
		
		try {
			files = fs.readdirSync(testFolder + "/" + bs + "/" + sv + "/docs");
			for(i = 0; i < files.length; i++) {
				fs.unlinkSync(testFolder + "/" + bs + "/" + sv + "/docs/" + files[i]);
			}
		}catch (error) {

		}
		try {
			fs.rmdirSync(testFolder + "/" + bs + "/" + sv + "/docs");
		}catch(error) {
			
		}
		try {
			fs.rmdirSync(testFolder + "/" + bs + "/" + sv2 + "/docs");
		}catch(error) {
			
		}
		try {
			fs.rmdirSync(testFolder + "/" + bs2 + "/" + sv + "/docs");
		}catch(error) {
			
		}
		
		try {
			files = fs.readdirSync(testFolder + "/" + bs + "/" + sv);
			for(i = 0; i < files.length; i++) {
				fs.unlinkSync(testFolder + "/" + bs + "/" + sv + "/" + files[i]);
			}
		}catch (error) {

		}
		try {
			fs.rmdirSync(testFolder + "/" + bs + "/" + sv);
		}catch(error) {
			
		}
		try {
			fs.rmdirSync(testFolder + "/" + bs + "/" + sv2);
		}catch(error) {
			
		}
		try {
			fs.rmdirSync(testFolder + "/" + bs2 + "/" + sv);
		}catch(error) {
			
		}
		
		try {
			files = fs.readdirSync(testFolder + "/" + bs + "/docs");
			for(i = 0; i < files.length; i++) {
				fs.unlinkSync(testFolder + "/" + bs + "/docs/" + files[i]);
			}
		}catch (error) {

		}
		try {
			fs.rmdirSync(testFolder + "/" + bs + "/docs");
		}catch(error) {
			
		}
		try {
			fs.rmdirSync(testFolder + "/" + bs2 + "/docs");
		}catch(error) {
			
		}
		try {
			files = fs.readdirSync(testFolder + "/" + bs);
			for(i = 0; i < files.length; i++) {
				fs.unlinkSync(testFolder + "/" + bs + "/" + files[i]);
			}
		}catch (error) {

		}
		try{
			fs.rmdirSync(testFolder + "/" + bs);
		}catch(error) {
			
		}
		try{
			fs.rmdirSync(testFolder + "/" + bs2);
		}catch(error) {
			
		}
//		console.log("After done");
		
	});

});
