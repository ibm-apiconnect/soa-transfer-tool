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
// Run these using "npm run-script wsrrfvt"
// To debug, run node-inspector in one window, then in the other run 
// ./node_modules/.bin/mocha --reporter spec --grep wsrrfvttests --debug-brk
// Then in Chrome go to http://127.0.0.1:8080/debug?port=5858 

var should = require('chai').should();

var wsrrUtils = require('../lib/WSRR/wsrrUtils');
var logger = require("../lib/Logger");
var apimCli = require('../lib/apimcli');

var testData = require('./testData');

var fs = require("fs");
var AdmZip = require("adm-zip");
var flow = require("../lib/flow");
var propertyParse = require("properties-parser");
var Promise = require('bluebird');

var yakbak = require('yakbak');
var http = require('http');

// create yakbak proxy
var proxy = http.createServer(yakbak('https://srb84a.hursley.ibm.com:9443/', {
	dirname: __dirname + "/wsrrfvttapes"
}));

var inputOptions = null;

function readConfig() { 
	// read config
	var wsrr2apimProperties = fs.readFileSync("./connectionproperties.properties");
	inputOptions = propertyParse.parse(wsrr2apimProperties);
	// point to local proxy
	inputOptions.wsrrHostname = "localhost";
	inputOptions.wsrrPort = 4567;
	inputOptions.wsrrProtocol = "http";
	// set credentials to those used for the tapes
	inputOptions.wsrrUsername = "user";
	inputOptions.wsrrPassword = "user";
}

// data for Basic Service business service
var bsBasicService = {"bsrURI":"aa867aaa-c596-46a4.83b5.affba8afb525","type":"GenericObject","governanceRootBsrURI":"aa867aaa-c596-46a4.83b5.affba8afb525","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService","properties":{"name":"Basic Service","namespace":"","version":"","description":"Basic service for testing","owner":"admin","lastModified":"1463323309999","creationTimestamp":"1462460017778","lastModifiedBy":"wasadmin","ale63_guid":"","ale63_ownerEmail":"seager@uk.ibm.com","ale63_assetType":"","ale63_remoteState":"","ale63_fullDescription":"","ale63_assetOwners":"","ale63_communityName":"","ale63_requirementsLink":null,"ale63_assetWebLink":null},"relationships":{"ale63_owningOrganization":[{"bsrURI":"9772d397-a8fd-4d2f.adb4.44f34044b410","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ALEModel#Organization"}],"ale63_artifacts":[],"gep63_charter":[],"gep63_serviceInterfaceVersions":[],"ale63_dependency":[],"gep63_capabilityVersions":[{"bsrURI":"2919fd29-fc17-4729.bae4.0b95690be4f9","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion"},{"bsrURI":"37000137-dbfb-4be4.83bb.d5f54cd5bbaf","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion"}]},"classifications":[],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityApproved"};
// data for Basic Service v1.0 service version
var svBasicService10 = {"bsrURI":"2919fd29-fc17-4729.bae4.0b95690be4f9","type":"GenericObject","governanceRootBsrURI":"2919fd29-fc17-4729.bae4.0b95690be4f9","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion","properties":{"name":"Basic Service","namespace":null,"version":"1.0","description":"Basic version 1.0 in SOAP.","owner":"admin","lastModified":"1462972576992","creationTimestamp":"1462460025106","lastModifiedBy":"wasadmin","ale63_guid":"","ale63_ownerEmail":"seager@uk.ibm.com","ale63_assetType":"","ale63_remoteState":"","ale63_fullDescription":"","ale63_assetOwners":"","ale63_communityName":"","gep63_consumerIdentifier":null,"gep63_versionTerminationDate":null,"gep63_versionAvailabilityDate":null,"ale63_requirementsLink":null,"ale63_assetWebLink":null},"relationships":{"ale63_owningOrganization":[{"bsrURI":"9772d397-a8fd-4d2f.adb4.44f34044b410","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ALEModel#Organization"}],"gep63_consumes":[],"ale63_artifacts":[],"gep63_interfaceSpecifications":[],"gep63_providedSCAModules":[],"gep63_providedWebServices":[{"bsrURI":"bb4d19bb-e0c0-4010.b582.30787c308267","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#Service"}],"ale63_dependency":[],"gep63_provides":[{"bsrURI":"9a27e09a-5bc6-4693.b6a0.6747b067a0af","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceProfileExtensions#ServiceLevelDefinition"}],"gep63_providedRESTServices":[]},"classifications":[],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational"};

// base 64 encoded test docs
var mathServerService_EP1 = testData.mathServerService_EP1;
var mathServerBinding = testData.mathServerBinding;
var mathServerInterface_InlineSchema1 = testData.mathServerInterface_InlineSchema1;
var mathServerInterface = testData.mathServerInterface;
var basicWsdl = new Buffer('PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHdzZGw6ZGVmaW5pdGlvbnMgdGFyZ2V0TmFtZXNwYWNlPSJodHRwOi8vaWJtLmNvbS9zci90ZXN0L3dzZGwvYmFzaWMud3NkbCIgeG1sbnM6aW1wbD0iaHR0cDovL2libS5jb20vc3IvdGVzdC93c2RsL2Jhc2ljLnNjaGVtYSIgeG1sbnM6aW50Zj0iaHR0cDovL2libS5jb20vc3IvdGVzdC93c2RsL2Jhc2ljLndzZGwiIHhtbG5zOndzZGw9Imh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzZGwvIiB4bWxuczp3c2Rsc29hcD0iaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3NkbC9zb2FwLyIgeG1sbnM6d3NpPSJodHRwOi8vd3MtaS5vcmcvcHJvZmlsZXMvYmFzaWMvMS4xL3hzZCIgeG1sbnM6eHNkPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYSI+CiA8d3NkbDp0eXBlcz4KICA8c2NoZW1hIHRhcmdldE5hbWVzcGFjZT0iaHR0cDovL2libS5jb20vc3IvdGVzdC93c2RsL2Jhc2ljLnNjaGVtYSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hIiB4bWxuczp3c2RsPSJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93c2RsLyIgeG1sbnM6eHNkPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYSI+CiAgIDxlbGVtZW50IG5hbWU9ImJhc2ljUmVxdWVzdCI+CiAgICA8Y29tcGxleFR5cGU+CiAgICAgPHNlcXVlbmNlPgogICAgICA8ZWxlbWVudCBuYW1lPSJyZXF1ZXN0IiB0eXBlPSJ4c2Q6c3RyaW5nIi8+CiAgICAgPC9zZXF1ZW5jZT4KICAgIDwvY29tcGxleFR5cGU+CiAgIDwvZWxlbWVudD4KICAgPGVsZW1lbnQgbmFtZT0iYmFzaWNSZXNwb25zZSI+CiAgICA8Y29tcGxleFR5cGU+CiAgICAgPHNlcXVlbmNlPgogICAgICA8ZWxlbWVudCBuYW1lPSJyZXNwb25zZSIgdHlwZT0ieHNkOnN0cmluZyIvPgogICAgIDwvc2VxdWVuY2U+CiAgICA8L2NvbXBsZXhUeXBlPgogICA8L2VsZW1lbnQ+CiAgPC9zY2hlbWE+CiA8L3dzZGw6dHlwZXM+CgogICA8d3NkbDptZXNzYWdlIG5hbWU9ImJhc2ljUmVxdWVzdCI+CgogICAgICA8d3NkbDpwYXJ0IGVsZW1lbnQ9ImltcGw6YmFzaWNSZXF1ZXN0IiBuYW1lPSJwYXJhbWV0ZXJzIi8+CgogICA8L3dzZGw6bWVzc2FnZT4KCiAgIDx3c2RsOm1lc3NhZ2UgbmFtZT0iYmFzaWNSZXNwb25zZSI+CgogICAgICA8d3NkbDpwYXJ0IGVsZW1lbnQ9ImltcGw6YmFzaWNSZXNwb25zZSIgbmFtZT0icGFyYW1ldGVycyIvPgoKICAgPC93c2RsOm1lc3NhZ2U+CgogICA8d3NkbDpwb3J0VHlwZSBuYW1lPSJiYXNpY1NlcnZpY2VzIj4KCiAgICAgIDx3c2RsOm9wZXJhdGlvbiBuYW1lPSJiYXNpY01lc3NhZ2UiPgoKICAgICAgICAgPHdzZGw6aW5wdXQgbWVzc2FnZT0iaW50ZjpiYXNpY1JlcXVlc3QiIG5hbWU9ImJhc2ljUmVxdWVzdCIvPgoKICAgICAgICAgPHdzZGw6b3V0cHV0IG1lc3NhZ2U9ImludGY6YmFzaWNSZXNwb25zZSIgbmFtZT0iYmFzaWNSZXNwb25zZSIvPgoKICAgICAgPC93c2RsOm9wZXJhdGlvbj4KCiAgIDwvd3NkbDpwb3J0VHlwZT4KCiAgIDx3c2RsOmJpbmRpbmcgbmFtZT0iYmFzaWNTb2FwQmluZGluZyIgdHlwZT0iaW50ZjpiYXNpY1NlcnZpY2VzIj4KCiAgICAgIDx3c2Rsc29hcDpiaW5kaW5nIHN0eWxlPSJkb2N1bWVudCIgdHJhbnNwb3J0PSJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy9zb2FwL2h0dHAiLz4KCiAgICAgIDx3c2RsOm9wZXJhdGlvbiBuYW1lPSJiYXNpY01lc3NhZ2UiPgoKICAgICAgICAgPHdzZGxzb2FwOm9wZXJhdGlvbiBzb2FwQWN0aW9uPSIiLz4KCiAgICAgICAgIDx3c2RsOmlucHV0IG5hbWU9ImJhc2ljUmVxdWVzdCI+CgogICAgICAgICAgICA8d3NkbHNvYXA6Ym9keSB1c2U9ImxpdGVyYWwiLz4KCiAgICAgICAgIDwvd3NkbDppbnB1dD4KCiAgICAgICAgIDx3c2RsOm91dHB1dCBuYW1lPSJiYXNpY1Jlc3BvbnNlIj4KCiAgICAgICAgICAgIDx3c2Rsc29hcDpib2R5IHVzZT0ibGl0ZXJhbCIvPgoKICAgICAgICAgPC93c2RsOm91dHB1dD4KCiAgICAgIDwvd3NkbDpvcGVyYXRpb24+CgogICA8L3dzZGw6YmluZGluZz4KCiAgIDx3c2RsOnNlcnZpY2UgbmFtZT0iYmFzaWNTZXJ2aWNlIj4KCiAgICAgIDx3c2RsOnBvcnQgYmluZGluZz0iaW50ZjpiYXNpY1NvYXBCaW5kaW5nIiBuYW1lPSJiYXNpYyI+CgogICAgICAgICA8d3NkbHNvYXA6YWRkcmVzcyBsb2NhdGlvbj0iaHR0cHM6Ly9zcmI4NGEuaHVyc2xleS5pYm0uY29tOjk0NDMvQmFzaWMvYmFzaWNTZXJ2aWNlIi8+CgogICAgICA8L3dzZGw6cG9ydD4KCiAgIDwvd3NkbDpzZXJ2aWNlPgoKPC93c2RsOmRlZmluaXRpb25zPgo=', 'base64');

/*
 * Compare data from download service docs. This download will rewrite the XML and depending on the platform
 * that the WSRR is run on, will either add CRLF (Windows) or LF (Unix) to the file endings of the downloaded
 * documents.
 * 
 */
function compareWsdlData(data, expected) {
	
}

// fvt tests in here which require the connection properties to be set up, and will invoke a real WSRR server
describe('wsrrfvttests', function(){

	before(function(done) {
		var doneCount = 0;
		var listener = function() {
			doneCount++;
			if(doneCount === 2) {
				// both done
				done();
			}
		};
		
		proxy.listen(4567, listener);
		
		logger.initialize(listener);
		
	});

	describe('runGraphQuery', function() {
		this.timeout(15000);

		readConfig();
		wsrrUtils.setWSRRConnectiondetails(inputOptions);

		it('should run a graph query against the server', function(done) {
			// run query for Basic Service business service
			var promise = wsrrUtils.runGraphQuery("//GenericObject[@bsrURI='aa867aaa-c596-46a4.83b5.affba8afb525']");
			promise.then(function(data) {
				// if data then ok
				data.length.should.equal(1);
				var bs = data[0];
				bs.should.have.property("bsrURI", "aa867aaa-c596-46a4.83b5.affba8afb525");
				bs.should.have.deep.property("properties.name", "Basic Service");
				
				bs.should.deep.equal(bsBasicService);
				
				done();
			}).caught(function(error){
				done(error);
			});
		});
		
		it('should error when the graph query is bad', function(done) {
			// run query
			var promise = wsrrUtils.runGraphQuery("aaabadxpath");
			promise.then(function(data) {
				// if data then this is wrong
			})
			.caught(function(error){
				// expect an error
				console.log("Expected error");
				done();
			});
		});
	});

	describe('runNamedQuery', function() {
		this.timeout(15000);

		readConfig();
		wsrrUtils.setWSRRConnectiondetails(inputOptions);

		it('should run a named query against the server', function() {
			// run query for getGovernanceRecord for Basic Service business service
			var promise = wsrrUtils.runNamedQuery("getGovernanceRecord", ['aa867aaa-c596-46a4.83b5.affba8afb525']).then(function(data) {
				// if data then ok
				data.length.should.equal(1);
				var bs = data[0];
				bs.should.have.deep.property("type", "GovernanceRecord");
				bs.should.have.deep.property("properties.entityBsrURI", "aa867aaa-c596-46a4.83b5.affba8afb525");
			});
			
			return promise;
		});

		it('should run a named query against the server with multiple parameters', function() {
			// run query for getWSDLDocument for Logging.wsdl
			var promise = wsrrUtils.runNamedQuery("getWSDLDocument", ['name', 'Logging.wsdl']).then(function(data) {
				// if data then ok
				data.length.should.equal(1);
				var bs = data[0];
				bs.should.have.deep.property("type", "WSDLDocument");
				bs.should.have.deep.property("bsrURI", "94b67794-dcd8-48cb.b2ed.8c81258ced98");
			});
			
			return promise;
		});

		it('should error when the named query is bad', function(done) {
			// run query
			var promise = wsrrUtils.runNamedQuery("aaabadxpath");
			promise.then(function(data) {
				// if data then this is wrong
			})
			.caught(function(error){
				// expect an error
				console.log("Expected error");
				done();
			});
		});
	});
	
	
	describe('retrieveMetadata', function() {
		this.timeout(15000);

		readConfig();
		wsrrUtils.setWSRRConnectiondetails(inputOptions);

		it('should retrieve data from the server', function() {
			// get metadata - for "basic service" service version 1.0
			var promise = wsrrUtils.retrieveMetadata("2919fd29-fc17-4729.bae4.0b95690be4f9").then(function(data) {
				// if data then ok
				svBasicService10.should.deep.equal(data);
			});
			return promise;
		});
		
		it('should error when the metadata bsrURI is bad', function(done) {
			// run query
			var promise = wsrrUtils.retrieveMetadata("aaabadxpath");
			promise.then(function(data) {
				// if data then this is wrong
			})
			.caught(function(error){
				// expect an error
				console.log("Expected error");
				done();
			});
		});
	});

	describe('runPropertyQuery', function() {
		this.timeout(15000);

		readConfig();
		wsrrUtils.setWSRRConnectiondetails(inputOptions);

		it('should run a property query against the server', function(done) {
			// run query
			var promise = wsrrUtils.runPropertyQuery("//GenericObject[@bsrURI='aa867aaa-c596-46a4.83b5.affba8afb525']", ["name", "bsrURI"]);
			promise.then(function(data) {
				// if data then ok
				data.length.should.equal(1);
				var bs = data[0];
				bs.should.have.property("bsrURI", "aa867aaa-c596-46a4.83b5.affba8afb525");
				bs.should.have.property("name", "Basic Service");
				
				done();
			}).caught(function(error){
				done(error);
			});
		});
		
		it('should error when the property query is bad', function(done) {
			// run query
			var promise = wsrrUtils.runPropertyQuery("aaabadxpath", ["name", "bsrURI"]);
			promise.then(function(data) {
				// if data then this is wrong
			})
			.caught(function(error){
				// expect an error
				console.log("Error");
				//console.dir(error);
				done();
			});
		});
	});	

	describe('downloadBinaryContent', function() {
		this.timeout(15000);

		readConfig();
		wsrrUtils.setWSRRConnectiondetails(inputOptions);

		it('should download a known binary from the server', function() {
			// get binary of basic.wsdl
			var promise = wsrrUtils.downloadBinaryContent("3fa1e73f-e7d1-41e3.b185.9f79bc9f85fd").then(function(/* Buffer */ data) {
				// compare
				basicWsdl.should.deep.equal(data);
			});
			return promise;
		});

		it('should error when the bsrURI is bad', function(done) {
			// run query
			var promise = wsrrUtils.downloadBinaryContent("doesnotexist");
			promise.then(function(data) {
				// if data then this is wrong
			})
			.caught(function(error){
				// expect an error which is a binary buffer
				console.log("Expected error:");
				console.log(error.toString());
				done();
			});
		});

	});

	describe('downloadServiceDocuments', function() {
		this.timeout(15000);

		readConfig();
		wsrrUtils.setWSRRConnectiondetails(inputOptions);

		it('should retrieve docs from the server', function() {
			// expected array in order that we expect the documents from the server API
			var expected = [];
			// The data on the server has CRLF as the line end, and when rewritten on WSRR comes back with CRLF. But when
			// rewritten in the tool, comes back with LF. So the compare data has LF line ends.
			expected.push({name: "MathServerService_EP1.wsdl", bsrURI: "d94257d9-d39a-4a91.975e.9b545b9b5ecf", content: mathServerService_EP1, location: "MathServerService_EP1.wsdl", type: "WSDLDocument"});
			expected.push({name: "MathServerBinding.wsdl", bsrURI: "8ec5198e-bedb-4be4.ae55.ba951cba5574", content: mathServerBinding, location: "MathServerBinding.wsdl", type: "WSDLDocument"});
			expected.push({name: "MathServerInterface.wsdl", bsrURI: "97b28197-17b7-4790.87f0.488f5a48f053", content: mathServerInterface, location: "MathServerInterface.wsdl", type: "WSDLDocument"});
			expected.push({name: "MathServerInterface_InlineSchema1.xsd", bsrURI: "4db5094d-560b-4bb7.9010.537325531086", content: mathServerInterface_InlineSchema1, location: "MathServerInterface_InlineSchema1.xsd", type: "XSDDocument"});
			
			// get docs - d94257d9-d39a-4a91.975e.9b545b9b5ecf endpoint wsdl for MathService
			var promise = wsrrUtils.downloadServiceDocuments(["d94257d9-d39a-4a91.975e.9b545b9b5ecf"]).then(function(data) {
				
				// check for expected data - assume deep equals looks at array order
				expected.should.deep.equal(data);
				
			});
			return promise;
		});
		
		it('should error when the bsrURI is bad', function(done) {
			// run query
			var promise = wsrrUtils.downloadServiceDocuments(["doesnotexist"]);
			promise.then(function(data) {
				// if data then this is wrong
				throw new Error("should have failed");
			})
			.caught(function(error){
				// expect an error which is a binary buffer
				console.log("Expected error:");
				console.log(error.toString());
				done();
			});
		});

	});

	describe('forService_downloadServiceDocumentsForService', function() {
		this.timeout(300000);

		readConfig();
		wsrrUtils.setWSRRConnectiondetails(inputOptions);

		it('should retrieve docs from a service version', function() {
			// expected array in order that we expect the documents from the server API
			var expected = [];
			expected.push({name: "MathServerService_EP1.wsdl", bsrURI: "d94257d9-d39a-4a91.975e.9b545b9b5ecf", content: mathServerService_EP1, location: "MathServerService_EP1.wsdl", type: "WSDLDocument"});
			expected.push({name: "MathServerBinding.wsdl", bsrURI: "8ec5198e-bedb-4be4.ae55.ba951cba5574", content: mathServerBinding, location: "MathServerBinding.wsdl", type: "WSDLDocument"});
			expected.push({name: "MathServerInterface.wsdl", bsrURI: "97b28197-17b7-4790.87f0.488f5a48f053", content: mathServerInterface, location: "MathServerInterface.wsdl", type: "WSDLDocument"});
			expected.push({name: "MathServerInterface_InlineSchema1.xsd", bsrURI: "4db5094d-560b-4bb7.9010.537325531086", content: mathServerInterface_InlineSchema1, location: "MathServerInterface_InlineSchema1.xsd", type: "XSDDocument"});
			
			// get docs - 9cb8619c-5eea-4ac5.b6a7.fe64e7fea733 Math Service 1.0 service version
			var promise = wsrrUtils.downloadServiceDocumentsForService("9cb8619c-5eea-4ac5.b6a7.fe64e7fea733").then(function(data) {
				// should be same array as expected
				expected.should.deep.equal(data);
			});
			return promise;
		});
		
		it('should retrieve no docs from a service version', function() {
			// expected no docs
			var expected = [];
			
			// Partial BS - Identified Version 1.0 has no SLD or documents 13b85913-d839-4949.b8a0.b6e4c1b6a076
			var promise = wsrrUtils.downloadServiceDocumentsForService("13b85913-d839-4949.b8a0.b6e4c1b6a076").then(function(data) {
				// should be same array as expected
				expected.should.deep.equal(data);
			});
			return promise;
		});
		
	});
	
	describe('downloadRESTDocumentsForService', function() {
		this.timeout(300000);

		readConfig();
		wsrrUtils.setWSRRConnectiondetails(inputOptions);

		it('should retrieve Swagger Yaml from a service version', function() {
			var expected = [];
			expected.push({name: "Catalog Search_1.0.0.yaml", bsrURI: "09d33b09-7998-4865.b671.d899a2d871cd", content: testData.catalogSearch});
			
			// get docs - a4a92ea4-7dda-4a8d.ae71.a92ed1a97196 Catalog Search 1.0 service version with a swagger
			var promise = wsrrUtils.downloadRESTDocumentsForService("a4a92ea4-7dda-4a8d.ae71.a92ed1a97196", true).then(function(data) {
				// should be same array as expected
				expected.should.deep.equal(data);
			});
			return promise;
		});

		it('should retrieve Swagger Json from a service version', function() {
			var expected = [];
			// expect only the swagger json and not the non-swagger yaml, json or the txt file
			expected.push({name: "echo.json", bsrURI: "5c8ed45c-fd47-4767.8b37.936e8293378e", content: testData.echoJson});
			
			// get docs - 738c4773-f50d-4d46.a2e9.3fa5e43fe95f Echo 1.0 service version with a JSON swagger,
			// and a txt and a yaml that is not Swagger and a Json that is not Swagger.
			var promise = wsrrUtils.downloadRESTDocumentsForService("738c4773-f50d-4d46.a2e9.3fa5e43fe95f", true).then(function(data) {
				// should be same array as expected
				expected.should.deep.equal(data);
			});
			return promise;
		});

		it('should retrieve nothing from a service version with no swagger', function() {
			var expected = [];
			// expect nothing
			
			// get docs - ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4 Address 1.0 service version with no swagger
			var promise = wsrrUtils.downloadRESTDocumentsForService("ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4", true).then(function(data) {
				// should be same array as expected
				expected.should.deep.equal(data);
			});
			return promise;
		});

		// multiple swagger
		
		// false on the call to download non swagger
		it('should retrieve everything from a service version with non swagger attached', function() {
			var expected = [];
			expected.push({name: "address.txt", bsrURI: "a6b949a6-8044-44fb.a689.2ca5002c89a0", content: testData.addressInterfaceTxt});
			
			// get docs - ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4 Address service version with a Address.txt
			var promise = wsrrUtils.downloadRESTDocumentsForService("ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4", false).then(function(data) {
				// should be same array as expected
				expected.should.deep.equal(data);
			});
			return promise;
		});
		
	});

	describe('downloadArtifactDocumentsForService', function() {
		this.timeout(300000);

		readConfig();
		wsrrUtils.setWSRRConnectiondetails(inputOptions);

		it('should retrieve artifacts from a service version', function() {
			var expected = [];
			expected.push({name: "Catalog Search_1.0.0.yaml", bsrURI: "09d33b09-7998-4865.b671.d899a2d871cd", content: testData.catalogSearch});
			expected.push({name: "echo.json", bsrURI: "5c8ed45c-fd47-4767.8b37.936e8293378e", content: testData.echoJson});
			
			// get docs - 9cb8619c-5eea-4ac5.b6a7.fe64e7fea733 Maths Service
			var promise = wsrrUtils.downloadArtifactDocumentsForService("9cb8619c-5eea-4ac5.b6a7.fe64e7fea733").then(function(data) {
				// should be same array as expected but order of docs different
				data.should.have.lengthOf(2);
				for(var i = 0; i < expected.length; i++) {
					data.should.deep.include(expected[i]);	
				}
			});
			return promise;
		});

		it('should retrieve no artifacts from a service version', function() {
			// this one has no artifacts
			var expected = [];
			
			// basic service 1.0 2919fd29-fc17-4729.bae4.0b95690be4f9
			var promise = wsrrUtils.downloadArtifactDocumentsForService("2919fd29-fc17-4729.bae4.0b95690be4f9").then(function(data) {
				// should be empty array
				data.should.have.lengthOf(0);
			});
			return promise;
		});
		
	});

	describe('downloadCharterDocumentsForService', function() {
		this.timeout(300000);

		readConfig();
		wsrrUtils.setWSRRConnectiondetails(inputOptions);

		it('should retrieve the charter from a business service', function() {
			var expected = [];
			expected.push({name: "CatalogSearchCharter.odt", bsrURI: "52456d52-a608-4867.b7be.9b0a339bbe11", content: testData.catalogSearchCharter});
			
			// Catalog Search BS - f13602f1-4e6a-4a1b.9240.2b397a2b407f
			var promise = wsrrUtils.downloadCharterDocumentsForService("f13602f1-4e6a-4a1b.9240.2b397a2b407f").then(function(data) {
				// should be the same
				data.should.deep.equal(expected);	
			});
			return promise;
		});

		it('should retrieve no charter from a business service', function() {
			// this one has no charter
			var expected = [];
			
			// basic service 1.0 2919fd29-fc17-4729.bae4.0b95690be4f9
			var promise = wsrrUtils.downloadCharterDocumentsForService("2919fd29-fc17-4729.bae4.0b95690be4f9").then(function(data) {
				// should be empty array
				data.should.have.lengthOf(0);
			});
			return promise;
		});
		
	});
	
/*
	describe('flow_generateWSRRDataForServiceVersion', function() {
		this.timeout(60000);

		it('should retrieve data from the server', function(done) {
			logger.initialize();
			readConfig();
			wsrrUtils.setWSRRConnectiondetails(inputOptions);

			// make folder for output
			if(fs.statSync("flowTestOutput") === null) {
				fs.mkdirSync("flowTestOutput");
			}

			apimCli.setConnectionDetails(inputOptions).then(function(){
				// get data - 2919fd29-fc17-4729.bae4.0b95690be4f9 is Basic Service V1.0
				var promise = flow.generateWSRRDataForServiceVersion("2919fd29-fc17-4729.bae4.0b95690be4f9", 
						"./flowTestOutput", inputOptions, wsrrUtils, apimCli);
				promise.then(function() {
					// examine what was output visually
					done();
				}).caught(function(error){
					console.error("Error");
					console.error(error);
					console.error(error.stack);
					done(error);
				});
			});
		});
	});
*/
/*	
	describe('flow_transferToDraftForOrganization', function() {
		this.timeout(60000);

		it('should transfer all services for an org', function(done) {
			// make folder for output
			if(fs.statSync("flowTestOutput") === null) {
				fs.mkdirSync("flowTestOutput");
			}

			logger.initialize();
			readConfig();
			wsrrUtils.setWSRRConnectiondetails(inputOptions);

			var doTest = function() {
				flow.transferToDraftForOrganization("Common services", 
						"./flowTestOutput", inputOptions, wsrrUtils, apimCli).then(function() {
					// examine what was output visually
					done();
				}).caught(function(error){
					console.error("Error");
					console.error(error);
					console.error(error.stack);
					done(error);
				});
			};
			
			apimCli.setConnectionDetails(inputOptions).then(doTest).catch(function(error){
				// error
				console.error("setconnection error: " + error);
				done(error);
			});

		});
	});
*/

});

/*
TOOD:

Version which is:
- not operational
- does not have an SLD or interface or WSDL
- has SLD with WSDL but no endpoint
- has SLD and WSDL and endpoint but not Production

Ideally the above should all error and be marked as failures. Or something. Eventually transferred across as Drafts?

*/