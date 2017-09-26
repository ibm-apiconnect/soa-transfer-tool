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
var wsrrUtils = require('../lib/WSRR/wsrrUtils');
var testData = require('./testData');


// compare two WSRR objects but do not insist on the order of things in arrays to be the same
// original - the original data
// object - the thing we want to compare with the original
var compareWsrrObjects = function(original, object) {
	
	  object.should.have.property("properties");

	  var i;
	  
	  // classifications
	  object.should.have.property("classifications").that.is.an("array").length(original.classifications.length);
	  for(i = 0; i < original.classifications.length; i++) {
		  object.classifications.should.deep.contains(original.classifications[i]);
	  }

	  // top level things
	  object.should.have.property("type", original.type);
	  object.should.have.property("governanceRootBsrURI", original.bsrURI);
	  object.should.have.property("bsrURI", original.bsrURI);

	  // properties
	  object.should.have.property("properties").that.is.an("array").length(original.properties.length);
	  for(i = 0; i < original.properties.length; i++) {
		  object.properties.should.deep.contains(original.properties[i]);
	  }
	  
	  // should not have these
	  object.should.not.have.property("state");

	  // rels
	  object.should.have.property("relationships").that.is.an("array").length(original.relationships.length);
	  for(i = 0; i < original.relationships.length; i++) {
		  object.relationships.should.deep.contains(original.relationships[i]);
	  }
	
};

// unit tests in here
describe('unittests_wsrrUtils', function(){

describe('setWSRRConnectiondetails', function() {
	var options = {
		wsrrHostname: "wsrr.hursley.ibm.com",
		wsrrPort: "9443",
		wsrrUsername: "user",
		wsrrPassword: "user",
		wsrrProtocol: "https"
	};

	it('should error if missing configuration', function() {
		var inputOptions = _.clone(options);
		delete inputOptions.wsrrProtocol;
		try {
			wsrrUtils.setWSRRConnectiondetails(inputOptions);
			throw new Error("should have thrown");
		} catch(e) {
			// expected
		}
	});
	
	it('should error if missing security configuration and https', function() {
		var inputOptions = _.clone(options);
		delete inputOptions.wsrrUsername;
		try {
			wsrrUtils.setWSRRConnectiondetails(inputOptions);
			throw new Error("should have thrown");
		} catch(e) {
			// expected
		}
	});

	it('should not error if missing security configuration and http', function() {
		var inputOptions = _.clone(options);
		inputOptions.wsrrProtocol = "http";
		delete inputOptions.wsrrUsername;

		wsrrUtils.setWSRRConnectiondetails(inputOptions);
	});

});


// _flattenDataArray function
describe('_test_flattenDataArray', function() {
	  this.timeout(15000);
	  it('flattens data array', function(done) {

		  // actual data from WSRR
		  var data = [{"properties":[{"value":"7c88fb7c-693f-4f3a.92db.14b65514db81","name":"bsrURI"},{"value":"SLD - Account creation service","name":"name"},{"value":"","name":"namespace"},{"value":"","name":"version"},{"value":"","name":"description"},{"value":"wasadmin","name":"owner"},{"value":"1410870163048","name":"lastModified"},{"value":"1337174209809","name":"creationTimestamp"},{"value":"admin","name":"lastModifiedBy"},{"value":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelDefinition","name":"primaryType"},{"value":"Working Hours Only","name":"gpx63_availability"},{"value":null,"name":"gpx63_peakMessageRateDailyTime"},{"value":null,"name":"gpx63_peakMessageRateDailyDuration"},{"value":"0","name":"gpx63_averageMessagesPerDay"},{"value":"0","name":"gpx63_peakMessageRate"},{"value":"0","name":"gpx63_maximumMessagesPerDay"},{"value":"100","name":"gpx63_averageResponseTime"},{"value":null,"name":"gep63_contextIdentifierLocationInfo"},{"value":null,"name":"gep63_consumerIdentifierLocationInfo"},{"value":"0","name":"gpx63_minimumMessagesPerDay"}],"subscribedTransitions":[],"subscribedOperations":[],"type":"GenericObject","relationships":[{"name":"gep63_boundScaExport"},{"name":"gep63_anonymousSLA"},{"name":"gep63_compatibleSLDs"},{"targetType":"GenericObject","name":"gep63_boundWebServicePort","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServicePort","targetBsrURI":"a5176da5-8042-4298.af56.0f06c90f56e4"},{"name":"gep63_boundRESTService"},{"targetType":"GenericObject","name":"gep63_serviceInterface","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServiceInterface","targetBsrURI":"9e77309e-e10e-4e3a.8547.610277614775"},{"name":"gep63_availableOperations"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e"}],"bsrURI":"7c88fb7c-693f-4f3a.92db.14b65514db81","targetClassifications":[],"classifications":[{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/lifecycle\/v6r3\/LifecycleDefinition#SLDSubscribable","governanceState":"true"},{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelDefinition"},{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#SomeTagOrAnother"}],"governanceRootBsrURI":"7c88fb7c-693f-4f3a.92db.14b65514db81"}];
		  
		  var results = wsrrUtils._test_flattenDataArray(data);

		  // make sure its flattened ok
		  results.should.have.length(1);
		  var object = results[0];
		  object.should.have.property("properties");
		  // check for property with value
		  object.should.have.property("state", "http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/lifecycle\/v6r3\/LifecycleDefinition#SLDSubscribable");
		  object.should.have.property("classifications").that.is.an("array").length(1);
		  object.should.have.deep.property("classifications[0]", "http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#SomeTagOrAnother");

		  object.should.have.property("relationships");
		  object.should.have.property("type", "GenericObject");
		  object.should.have.property("primaryType", "http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelDefinition");
		  object.should.have.property("governanceRootBsrURI", "7c88fb7c-693f-4f3a.92db.14b65514db81");
		  object.should.have.property("bsrURI", "7c88fb7c-693f-4f3a.92db.14b65514db81");

		  // get property off property
		  object.should.have.deep.property("properties.name", "SLD - Account creation service");
		  
		  // should not have these
		  object.should.not.have.deep.property("properties.bsrURI");
		  object.should.not.have.deep.property("properties.primaryType");
		  
		  object.should.have.deep.property("relationships.gep63_availableEndpoints").length(2);
		  object.should.have.deep.property("relationships.gep63_boundScaExport").length(0);

		  // rel should only have the specified keys and values and no other
		  object.should.have.deep.property("relationships.gep63_serviceInterface[0]").have.all.keys(
			{"bsrURI": "9e77309e-e10e-4e3a.8547.610277614775", "type": "GenericObject", "primaryType": "http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServiceInterface"}
		  );
		  
		  done();
	  });
});

//_flattenPropertyQueryResultsArray function
describe('_test_flattenPropertyQueryResultsArray', function() {
	  this.timeout(15000);
	  it('flattens property array', function(done) {

		  // actual data from WSRR
		  var data = [[{"value":"Account creation service","name":"name"},{"value":"d400ead4-cd96-46bd.9254.be2921be5447","name":"bsrURI"}],[{"value":"Account creation service","name":"name"},{"value":"9afa319a-bf21-4102.a24d.1fbfb71f4d67","name":"bsrURI"}]];
		  
		  var results = wsrrUtils._test_flattenPropertyQueryResultsArray(data);
		  
		  // make sure its flattened ok
		  results.should.have.length(2);
		  var object = results[0];
		  object.should.have.property("name", "Account creation service");
		  object.should.have.property("bsrURI", "d400ead4-cd96-46bd.9254.be2921be5447");

		  object = results[1];
		  object.should.have.property("name", "Account creation service");
		  object.should.have.property("bsrURI", "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  
		  done();
	  });
});

//_unflattenDataArray function
describe('_test_unflattenDataArray', function() {
	  this.timeout(15000);
	  it('unflattens data array', function() {

		  var data = [{"bsrURI":"348e6534-314a-4a83.b338.1501d51538d4","type":"GenericObject","governanceRootBsrURI":"348e6534-314a-4a83.b338.1501d51538d4","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService","properties":{"name":"Insurance Quote","namespace":"","version":"","description":"Provide an insurance quote","owner":"wasadmin","lastModified":"1464870800537","creationTimestamp":"1464870413160","lastModifiedBy":"wasadmin","ale63_guid":"","ale63_ownerEmail":"test@ibm.com","ale63_assetType":"","ale63_remoteState":"","ale63_fullDescription":"","ale63_assetOwners":"","ale63_communityName":"","ale63_requirementsLink":null,"ale63_assetWebLink":null},"relationships":{"ale63_owningOrganization":[{"bsrURI":"9772d397-a8fd-4d2f.adb4.44f34044b410","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ALEModel#Organization"}],"ale63_artifacts":[],"gep63_charter":[],"gep63_serviceInterfaceVersions":[],"ale63_dependency":[],"gep63_capabilityVersions":[{"bsrURI":"89cd2b89-3338-48e5.b628.36190e36286e","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityIdentified"}];
		  
		  var results = wsrrUtils._test_unflattenDataArray(data);

		  // make sure its unflattened ok
		  results.should.have.length(1);
		  var object = results[0];
		  object.should.have.property("properties");
		  
		  // classifications
		  object.should.have.property("classifications").that.is.an("array").length(3);
		  object.classifications.should.deep.contains({uri: "http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/lifecycle\/v6r3\/LifecycleDefinition#CapabilityIdentified", governanceState: "true"});
		  object.classifications.should.deep.contains({uri: "http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceEnablementModel#BusinessService"});
		  object.classifications.should.deep.contains({uri: "http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"});

		  object.should.have.property("type", "GenericObject");
		  object.properties.should.deep.contains({name: "primaryType", value:"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceEnablementModel#BusinessService"});
		  object.properties.should.deep.contains({name: "bsrURI", value:"348e6534-314a-4a83.b338.1501d51538d4"});
		  object.properties.should.deep.contains({name: "name", value:"Insurance Quote"});
		  object.properties.should.deep.contains({name: "ale63_assetWebLink", value: null});
		  object.properties.should.deep.contains({name: "ale63_communityName", value: ""});
		  object.should.have.property("governanceRootBsrURI", "348e6534-314a-4a83.b338.1501d51538d4");
		  object.should.have.property("bsrURI", "348e6534-314a-4a83.b338.1501d51538d4");

		  // should not have these
		  object.should.not.have.property("state");

		  // rels
		  object.should.have.property("relationships");
		  object.relationships.should.deep.contains({name: "ale63_artifacts"});
		  object.relationships.should.deep.contains({"targetType" : "GenericObject",
				"name" : "ale63_owningOrganization",
				"primaryType" : "http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ALEModel#Organization",
				"targetBsrURI" : "9772d397-a8fd-4d2f.adb4.44f34044b410"});
		  
	  });
	  
	  it('unflattens data array round trip business service', function() {

		  // the order of things in arrays and objects cannot be guaranteed

		  // wsrr retrieved data for business service
		  var data = [{"properties":[{"value":"72c3c072-56f7-4735.ba18.3afa1b3a1858","name":"bsrURI"},{"value":"MathService","name":"name"},{"value":"","name":"namespace"},{"value":"","name":"version"},{"value":"Service that performs basic calculations.","name":"description"},{"value":"wasadmin","name":"owner"},{"value":"1469449103840","name":"lastModified"},{"value":"1379085076508","name":"creationTimestamp"},{"value":"admin","name":"lastModifiedBy"},{"value":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceEnablementModel#BusinessService","name":"primaryType"},{"value":"","name":"ale63_guid"},{"value":"","name":"ale63_ownerEmail"},{"value":"","name":"ale63_assetType"},{"value":"","name":"ale63_remoteState"},{"value":"","name":"ale63_fullDescription"},{"value":"","name":"ale63_assetOwners"},{"value":"","name":"ale63_communityName"},{"value":null,"name":"ale63_requirementsLink"},{"value":null,"name":"ale63_assetWebLink"}],"type":"GenericObject","relationships":[{"targetType":"GenericObject","name":"ale63_owningOrganization","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ALEModel#Organization","targetBsrURI":"d2d6c2d2-3d69-4975.b47d.d26767d27d38"},{"targetType":"GenericDocument","name":"ale63_artifacts","targetBsrURI":"fc7678fc-b21c-4c91.98ae.56a99d56aee3"},{"targetType":"GenericDocument","name":"gep63_charter","targetBsrURI":"fc7678fc-b21c-4c91.98ae.56a99d56aee3"},{"name":"gep63_serviceInterfaceVersions"},{"name":"ale63_dependency"},{"targetType":"GenericObject","name":"gep63_capabilityVersions","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceEnablementModel#ServiceVersion","targetBsrURI":"fe96affe-fda5-4583.99e3.78da9078e3db"},{"targetType":"GenericObject","name":"gep63_capabilityVersions","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceEnablementModel#ServiceVersion","targetBsrURI":"97152397-42be-4eb5.bc06.39e5bf390602"}],"bsrURI":"72c3c072-56f7-4735.ba18.3afa1b3a1858","classifications":[{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceEnablementModel#BusinessService"},{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/lifecycle\/v6r3\/LifecycleDefinition#CapabilityApproved","governanceState":"true"}],"governanceRootBsrURI":"72c3c072-56f7-4735.ba18.3afa1b3a1858"}];
		  
		  var flattened = wsrrUtils._test_flattenDataArray(data);
		  
		  var results = wsrrUtils._test_unflattenDataArray(flattened);

		  // make sure its unflattened ok
		  results.should.have.length(1);
		  var object = results[0];
		  var original = data[0];

		  compareWsrrObjects(original, object);

	  });

	  it('unflattens data array round trip service version', function() {

		  // the order of things in arrays and objects cannot be guaranteed

		  // wsrr retrieved data for SV
		  var data = [{"properties":[{"value":"9afa319a-bf21-4102.a24d.1fbfb71f4d67","name":"bsrURI"},{"value":"Account creation service","name":"name"},{"value":"","name":"namespace"},{"value":"1.0","name":"version"},{"value":"This service version provides the capabilities for the account creation service","name":"description"},{"value":"wasadmin","name":"owner"},{"value":"1472127855064","name":"lastModified"},{"value":"1337173506669","name":"creationTimestamp"},{"value":"admin","name":"lastModifiedBy"},{"value":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceEnablementModel#ServiceVersion","name":"primaryType"},{"value":"","name":"ale63_guid"},{"value":"","name":"ale63_ownerEmail"},{"value":"","name":"ale63_assetType"},{"value":"http:\/\/requirements.jkhle.com\/requirements.jsp&id=8820","name":"ale63_requirementsLink"},{"value":"","name":"ale63_remoteState"},{"value":"","name":"ale63_fullDescription"},{"value":"","name":"ale63_assetOwners"},{"value":"2013-05-16","name":"gep63_versionTerminationDate"},{"value":"","name":"ale63_communityName"},{"value":"ACSV000 ","name":"gep63_consumerIdentifier"},{"value":"2012-05-16","name":"gep63_versionAvailabilityDate"},{"value":null,"name":"ale63_assetWebLink"}],"type":"GenericObject","relationships":[{"targetType":"GenericObject","name":"ale63_owningOrganization","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ALEModel#Organization","targetBsrURI":"5f34055f-fcb2-4226.9aa9.a6acdda6a999"},{"targetType":"GenericObject","name":"gep63_consumes","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelAgreement","targetBsrURI":"29e4a629-6b10-404c.891f.7e442e7e1ff3"},{"targetType":"WSDLDocument","name":"ale63_artifacts","targetBsrURI":"cb6c37cb-410d-4d36.ab5f.5f9c0e5f5ffb"},{"targetType":"WSDLDocument","name":"ale63_artifacts","targetBsrURI":"25e0c725-ffaa-4ad7.869f.6d2d496d9fc9"},{"targetType":"WSDLDocument","name":"ale63_artifacts","targetBsrURI":"98001c98-6515-4551.984f.60e676604f14"},{"targetType":"GenericObject","name":"gep63_interfaceSpecifications","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceEnablementModel#ServiceInterfaceSpecification","targetBsrURI":"6f422d6f-83a9-490d.98a4.58258958a4df"},{"name":"gep63_providedSCAModules"},{"targetType":"GenericObject","name":"gep63_providedWebServices","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#Service","targetBsrURI":"d3d4f6d3-0f38-4820.b1ee.d34280d3ee34"},{"targetType":"GenericObject","name":"gep63_providedWebServices","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#Service","targetBsrURI":"2ae4b72a-38b6-4633.a03f.7e062e7e3fbd"},{"targetType":"GenericObject","name":"gep63_providedWebServices","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#Service","targetBsrURI":"6124f661-00d1-412a.a5bc.5e1d6a5ebc48"},{"targetType":"GenericObject","name":"gep63_providedWebServices","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#Service","targetBsrURI":"7939d479-c092-428c.a4f2.d7bc2fd7f277"},{"targetType":"GenericObject","name":"gep63_providedWebServices","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#Service","targetBsrURI":"b1818fb1-a576-4622.b34e.3b7be13b4e4c"},{"name":"ale63_dependency"},{"targetType":"GenericObject","name":"gep63_provides","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelDefinition","targetBsrURI":"3def133d-c13e-4eb8.b800.955f2295003c"},{"targetType":"GenericObject","name":"gep63_provides","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelDefinition","targetBsrURI":"7c88fb7c-693f-4f3a.92db.14b65514db81"},{"name":"gep63_providedRESTServices"}],"bsrURI":"9afa319a-bf21-4102.a24d.1fbfb71f4d67","classifications":[{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/lifecycle\/v6r3\/LifecycleDefinition#Operational","governanceState":"true"},{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceEnablementModel#ServiceVersion"}],"governanceRootBsrURI":"9afa319a-bf21-4102.a24d.1fbfb71f4d67"}];
		  
		  var flattened = wsrrUtils._test_flattenDataArray(data);
		  
		  var results = wsrrUtils._test_unflattenDataArray(flattened);

		  // make sure its unflattened ok
		  results.should.have.length(1);
		  var object = results[0];
		  var original = data[0];

		  compareWsrrObjects(original, object);

	  });

	  it('unflattens data array round trip ESLD', function() {

		  // the order of things in arrays and objects cannot be guaranteed

		  // wsrr retrieved data for ESLD
		  var data = [{"properties":[{"value":"3def133d-c13e-4eb8.b800.955f2295003c","name":"bsrURI"},{"value":"Gold","name":"name"},{"value":"","name":"namespace"},{"value":"","name":"version"},{"value":"Gold SLD","name":"description"},{"value":"admin","name":"owner"},{"value":"1472128080130","name":"lastModified"},{"value":"1472127816549","name":"creationTimestamp"},{"value":"admin","name":"lastModifiedBy"},{"value":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelDefinition","name":"primaryType"},{"value":"24\/7 High Availability","name":"gpx63_availability"},{"value":"12:00","name":"gpx63_peakMessageRateDailyTime"},{"value":"1:00","name":"gpx63_peakMessageRateDailyDuration"},{"value":"50","name":"gpx63_peakMessageRate"},{"value":"10","name":"gpx63_averageMessagesPerDay"},{"value":"100","name":"gpx63_averageResponseTime"},{"value":"100","name":"gpx63_maximumMessagesPerDay"},{"value":"1","name":"gpx63_minimumMessagesPerDay"}],"type":"GenericObject","relationships":[{"name":"gep63_boundScaExport"},{"name":"gep63_anonymousSLA"},{"name":"gep63_compatibleSLDs"},{"targetType":"GenericObject","name":"gep63_boundWebServicePort","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServicePort","targetBsrURI":"d13a68d1-9a10-40e7.a085.44409c44851d"},{"targetType":"GenericObject","name":"gep63_boundWebServicePort","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServicePort","targetBsrURI":"80c54180-a5d2-420b.ac76.8e68af8e7603"},{"targetType":"GenericObject","name":"gep63_boundWebServicePort","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServicePort","targetBsrURI":"26e6dd26-59fb-4be0.9942.38b7ca38423c"},{"targetType":"GenericObject","name":"gep63_boundWebServicePort","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServicePort","targetBsrURI":"077bb607-cf44-4419.a712.0616b20612a5"},{"targetType":"GenericObject","name":"gep63_boundWebServicePort","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServicePort","targetBsrURI":"c3bb36c3-b0db-4bf9.a3c5.46794a46c5f0"},{"targetType":"GenericObject","name":"gep63_boundWebServicePort","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServicePort","targetBsrURI":"a5176da5-8042-4298.af56.0f06c90f56e4"},{"targetType":"GenericObject","name":"gep63_boundWebServicePort","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServicePort","targetBsrURI":"f253caf2-e97f-4fcc.b9cc.8dfd448dcce9"},{"targetType":"GenericObject","name":"gep63_boundWebServicePort","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServicePort","targetBsrURI":"583f7458-555d-4dae.9a8e.cbe457cb8e19"},{"name":"gep63_boundRESTService"},{"targetType":"GenericObject","name":"gep63_serviceInterface","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#ServiceInterface","targetBsrURI":"9e77309e-e10e-4e3a.8547.610277614775"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v8r0\/RESTModel#RESTServiceEndpoint","targetBsrURI":"14892514-ac22-42f2.a7bf.7d2eba7dbf2f"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"7bf5997b-78fe-4ee1.8ab7.29817429b7ab"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"6b19fe6b-e178-48cb.88a1.9a4e7f9aa1cc"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"cec2e4ce-dbba-4a31.af99.3b89133b99db"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"af6a08af-8725-4586.bac2.70cb5f70c24b"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"16a1dd16-40cf-4f37.b611.2d97eb2d110a"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"0bf4ae0b-9061-41f9.9bc6.331bb933c6fb"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e"},{"targetType":"GenericObject","name":"gep63_availableEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","targetBsrURI":"e9a42ce9-b83e-4e2e.9125.ed7661ed253b"},{"name":"gep63_availableOperations"}],"bsrURI":"3def133d-c13e-4eb8.b800.955f2295003c","classifications":[{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/BusinessDomain#Collection"},{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/BusinessDomain#Sales"},{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/lifecycle\/v6r3\/LifecycleDefinition#SLDIdentified","governanceState":"true"},{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelDefinition"}],"governanceRootBsrURI":"3def133d-c13e-4eb8.b800.955f2295003c"}];
		  
		  var flattened = wsrrUtils._test_flattenDataArray(data);
		  
		  var results = wsrrUtils._test_unflattenDataArray(flattened);

		  // make sure its unflattened ok
		  results.should.have.length(1);
		  var object = results[0];
		  var original = data[0];

		  compareWsrrObjects(original, object);

	  });

	  it('unflattens data array round trip SOAP Service Endpoint', function() {

		  // the order of things in arrays and objects cannot be guaranteed

		  // wsrr retrieved data for SSE
		  var data = [{"properties":[{"value":"cec2e4ce-dbba-4a31.af99.3b89133b99db","name":"bsrURI"},{"value":"http:\/\/development.jkhle.com:9080\/jkhle\/services\/AccountCreation","name":"name"},{"value":"http:\/\/www.jkhle.com\/AccountCreation\/service1","name":"namespace"},{"value":"1.0.0","name":"version"},{"value":"","name":"description"},{"value":"wasadmin","name":"owner"},{"value":"1470410678675","name":"lastModified"},{"value":"1337175352091","name":"creationTimestamp"},{"value":"admin","name":"lastModifiedBy"},{"value":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint","name":"primaryType"},{"value":"http:\/\/www.jkhle.com\/AccountCreation\/service1","name":"sm63_serviceNamespace"},{"value":"AccountCreationPort","name":"sm63_portName"},{"value":"SOAPAddress","name":"sm63_endpointType"},{"value":"AccountCreationService-Development","name":"sm63_serviceName"},{"value":"1.0.0","name":"sm63_serviceVersion"}],"type":"GenericObject","relationships":[{"targetType":"WSDLDocument","name":"sm63_sourceDocument","targetBsrURI":"25e0c725-ffaa-4ad7.869f.6d2d496d9fc9"},{"targetType":"SOAPAddress","name":"sm63_soapAddress","targetBsrURI":"1b07891b-7b4d-4d72.98da.71cdd471da23"},{"targetType":"WSDLPort","name":"sm63_wsdlPorts","targetBsrURI":"e0c05ee0-93ff-4f48.960b.75fc76750bc7"}],"bsrURI":"cec2e4ce-dbba-4a31.af99.3b89133b99db","classifications":[{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/lifecycle\/v6r3\/LifecycleDefinition#Offline","governanceState":"true"},{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/6\/1\/GovernanceProfileTaxonomy#Development"},{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/v6r3\/ServiceModel#SOAPServiceEndpoint"}],"governanceRootBsrURI":"cec2e4ce-dbba-4a31.af99.3b89133b99db"}];
		  
		  var flattened = wsrrUtils._test_flattenDataArray(data);
		  
		  var results = wsrrUtils._test_unflattenDataArray(flattened);

		  // make sure its unflattened ok
		  results.should.have.length(1);
		  var object = results[0];
		  var original = data[0];

		  compareWsrrObjects(original, object);

	  });

	  it('unflattens data array round trip SLA', function() {

		  // the order of things in arrays and objects cannot be guaranteed

		  // wsrr retrieved data for SLA
		  var data = [{"properties":[{"value":"29e4a629-6b10-404c.891f.7e442e7e1ff3","name":"bsrURI"},{"value":"SLA - Account creation consumption of eligibility service","name":"name"},{"value":"","name":"namespace"},{"value":"","name":"version"},{"value":"SLA for eligibility service","name":"description"},{"value":"wasadmin","name":"owner"},{"value":"1472128278210","name":"lastModified"},{"value":"1337175171559","name":"creationTimestamp"},{"value":"admin","name":"lastModifiedBy"},{"value":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelAgreement","name":"primaryType"},{"value":"2012-05-16","name":"gep63_subscriptionAvailabilityDate"},{"value":"12:00","name":"gpx63_peakMessageRateDailyTime"},{"value":"LatestCompatibleVersion","name":"gep63_versionMatchCriteria"},{"value":"0:30","name":"gpx63_peakMessageRateDailyDuration"},{"value":"20","name":"gpx63_peakMessageRate"},{"value":"10","name":"gpx63_averageMessagesPerDay"},{"value":"2013-05-16","name":"gep63_subscriptionTerminationDate"},{"value":"20","name":"gpx63_maximumMessagesPerDay"},{"value":"ASCV001","name":"gep63_contextIdentifier"},{"value":"0","name":"gpx63_minimumMessagesPerDay"}],"type":"GenericObject","relationships":[{"targetType":"GenericObject","name":"gep63_agreedEndpoints","primaryType":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelDefinition","targetBsrURI":"5aefcc5a-ae71-415d.a1b2.3e2de73eb2d3"},{"name":"gep63_boundSCAimport"},{"name":"gep63_serviceLevelPolicies"}],"bsrURI":"29e4a629-6b10-404c.891f.7e442e7e1ff3","classifications":[{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/profile\/v6r3\/GovernanceProfileExtensions#ServiceLevelAgreement"},{"uri":"http:\/\/www.ibm.com\/xmlns\/prod\/serviceregistry\/lifecycle\/v6r3\/LifecycleDefinition#SLAActive","governanceState":"true"}],"governanceRootBsrURI":"29e4a629-6b10-404c.891f.7e442e7e1ff3"}];
		  
		  var flattened = wsrrUtils._test_flattenDataArray(data);
		  
		  var results = wsrrUtils._test_unflattenDataArray(flattened);

		  // make sure its unflattened ok
		  results.should.have.length(1);
		  var object = results[0];
		  var original = data[0];

		  compareWsrrObjects(original, object);

	  });
	  
});

//_test_calculateLocationsAndRewriteDocuments function
describe('_test_calculateLocationsAndRewriteDocuments', function() {
	  this.timeout(15000);
	  it('calculates location correctly for flat', function() {

		  // data which has straight locations where the docs can be in the root
		  var wsdlData = [];
		  wsdlData.push({name: "MathServerService_EP1.wsdl", bsrURI: "6dc15f6d-d784-441c.a4c1.25565525c1b6", content: testData.mathServerService_EP1_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerBinding.wsdl", bsrURI: "8eb1e98e-2769-4947.9708.e84dbae80880", content: testData.mathServerBinding_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerInterface.wsdl", bsrURI: "2f5fa82f-bcd3-4314.b797.cdf86ccd971d", content: testData.mathServerInterface_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerInterface_InlineSchema1.xsd", bsrURI: "6ffed46f-5955-451b.8edf.b47ea7b4dfe8", content: testData.mathServerInterface_InlineSchema1_relative, type: "XSDDocument"});
		  
		  var results = wsrrUtils._test_calculateLocationsAndRewriteDocuments(wsdlData);
		  
		  // locations should all be doc names
		  wsdlData[0].should.have.property("location", "MathServerService_EP1.wsdl");
		  wsdlData[1].should.have.property("location", "MathServerBinding.wsdl");
		  wsdlData[2].should.have.property("location", "MathServerInterface.wsdl");
		  wsdlData[3].should.have.property("location", "MathServerInterface_InlineSchema1.xsd");
		  
	  });

	  it('calculates location correctly for flat with docs in a different order', function() {

		  // data which has straight locations where the docs can be in the root
		  var wsdlData = [];
		  // schema first, endpoint doc last
		  wsdlData.push({name: "MathServerInterface_InlineSchema1.xsd", bsrURI: "6ffed46f-5955-451b.8edf.b47ea7b4dfe8", content: testData.mathServerInterface_InlineSchema1_relative, type: "XSDDocument"});
		  wsdlData.push({name: "MathServerBinding.wsdl", bsrURI: "8eb1e98e-2769-4947.9708.e84dbae80880", content: testData.mathServerBinding_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerInterface.wsdl", bsrURI: "2f5fa82f-bcd3-4314.b797.cdf86ccd971d", content: testData.mathServerInterface_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerService_EP1.wsdl", bsrURI: "6dc15f6d-d784-441c.a4c1.25565525c1b6", content: testData.mathServerService_EP1_relative, type: "WSDLDocument"});
		  
		  var results = wsrrUtils._test_calculateLocationsAndRewriteDocuments(wsdlData);
		  
		  // locations should all be doc names
		  wsdlData[0].should.have.property("location", "MathServerInterface_InlineSchema1.xsd");
		  wsdlData[1].should.have.property("location", "MathServerBinding.wsdl");
		  wsdlData[2].should.have.property("location", "MathServerInterface.wsdl");
		  wsdlData[3].should.have.property("location", "MathServerService_EP1.wsdl");
		  
	  });
	  
	  it('calculates location correctly for flat with XSD import XSD', function() {

		  // data which has straight locations where the docs can be in the root
		  var wsdlData = [];
		  wsdlData.push({name: "DoStuffService.wsdl", bsrURI: "d2c0b0d2-8fb7-4766.b396.91f4d091967d", content: testData.DoStuffService_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "DoStuffService_schema1.xsd", bsrURI: "1a18001a-e4b5-45b7.a253.3de81a3d538d", content: testData.DoStuffService_schema1_relative, type: "XSDDocument"});
		  wsdlData.push({name: "DoStuffService_schema2.xsd", bsrURI: "e9735ae9-8c2f-4f5f.966e.c4204ac46ef7", content: testData.DoStuffService_schema2_relative, type: "XSDDocument"});
		  
		  var results = wsrrUtils._test_calculateLocationsAndRewriteDocuments(wsdlData);

		  // locations should all be doc names
		  wsdlData[0].should.have.property("location", "DoStuffService.wsdl");
		  wsdlData[1].should.have.property("location", "DoStuffService_schema1.xsd");
		  wsdlData[2].should.have.property("location", "DoStuffService_schema2.xsd");
		  
	  });

	  it('calculates location correctly for duplicate names for wsdl', function() {

		  // data which has two imports for wsdls with the same name
		  var wsdlData = [];
		  wsdlData.push({name: "MathServerService_EP1.wsdl", bsrURI: "6dc15f6d-d784-441c.a4c1.25565525c1b6", content: testData.mathServerService_EP1_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerBinding.wsdl", bsrURI: "8eb1e98e-2769-4947.9708.e84dbae80880", content: testData.mathServerBinding_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerBinding.wsdl", bsrURI: "2f5fa82f-bcd3-4314.b797.cdf86ccd971d", content: testData.mathServerInterface_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerInterface_InlineSchema1.xsd", bsrURI: "6ffed46f-5955-451b.8edf.b47ea7b4dfe8", content: testData.mathServerInterface_InlineSchema1_relative, type: "XSDDocument"});
		  
		  var results = wsrrUtils._test_calculateLocationsAndRewriteDocuments(wsdlData);

		  // locations should be doc names and bsrURI with extension for duplicates
		  wsdlData[0].should.have.property("location", "MathServerService_EP1.wsdl");
		  wsdlData[1].should.have.property("location", "8eb1e98e-2769-4947.9708.e84dbae80880.wsdl");
		  wsdlData[2].should.have.property("location", "2f5fa82f-bcd3-4314.b797.cdf86ccd971d.wsdl");
		  wsdlData[3].should.have.property("location", "MathServerInterface_InlineSchema1.xsd");
		  
	  });

	  it('calculates location correctly for duplicate names for xsd', function() {

		  // data which has two imports for XSDs with the same name
		  var wsdlData = [];
		  wsdlData.push({name: "DoStuffService.wsdl", bsrURI: "d2c0b0d2-8fb7-4766.b396.91f4d091967d", content: testData.DoStuffService_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "DoStuffService_schema1.xsd", bsrURI: "1a18001a-e4b5-45b7.a253.3de81a3d538d", content: testData.DoStuffService_schema1_relative, type: "XSDDocument"});
		  wsdlData.push({name: "DoStuffService_schema1.xsd", bsrURI: "e9735ae9-8c2f-4f5f.966e.c4204ac46ef7", content: testData.DoStuffService_schema2_relative, type: "XSDDocument"});
		  
		  var results = wsrrUtils._test_calculateLocationsAndRewriteDocuments(wsdlData);
		  
		  // locations should be doc name except for the duplicates
		  wsdlData[0].should.have.property("location", "DoStuffService.wsdl");
		  wsdlData[1].should.have.property("location", "1a18001a-e4b5-45b7.a253.3de81a3d538d.xsd");
		  wsdlData[2].should.have.property("location", "e9735ae9-8c2f-4f5f.966e.c4204ac46ef7.xsd");
		  
	  });
	  
	  it('calculates location correctly for two top level WSDLs', function() {

		  // two top level WSDLs that import other things
		  var wsdlData = [];
		  wsdlData.push({name: "MathServerService_EP1.wsdl", bsrURI: "6dc15f6d-d784-441c.a4c1.25565525c1b6", content: testData.mathServerService_EP1_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerService_EP2.wsdl", bsrURI: "67b78c67-f017-47f5.aaf6.fcca87fcf69f", content: testData.mathServerService_EP2_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerBinding.wsdl", bsrURI: "8eb1e98e-2769-4947.9708.e84dbae80880", content: testData.mathServerBinding_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerInterface.wsdl", bsrURI: "2f5fa82f-bcd3-4314.b797.cdf86ccd971d", content: testData.mathServerInterface_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerInterface_InlineSchema1.xsd", bsrURI: "6ffed46f-5955-451b.8edf.b47ea7b4dfe8", content: testData.mathServerInterface_InlineSchema1_relative, type: "XSDDocument"});
		  
		  var results = wsrrUtils._test_calculateLocationsAndRewriteDocuments(wsdlData);
		  
		  // locations should all be doc names
		  wsdlData[0].should.have.property("location", "MathServerService_EP1.wsdl");
		  wsdlData[1].should.have.property("location", "MathServerService_EP2.wsdl");
		  wsdlData[2].should.have.property("location", "MathServerBinding.wsdl");
		  wsdlData[3].should.have.property("location", "MathServerInterface.wsdl");
		  wsdlData[4].should.have.property("location", "MathServerInterface_InlineSchema1.xsd");
		  
	  });

	  it('calculates location correctly for duplicate top level WSDLs', function() {

		  // duplicate name at the top level so not imported? Eg two endpoint WSDLs with the same name
		  var wsdlData = [];
		  wsdlData.push({name: "MathServerService_EP1.wsdl", bsrURI: "6dc15f6d-d784-441c.a4c1.25565525c1b6", content: testData.mathServerService_EP1_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerService_EP1.wsdl", bsrURI: "67b78c67-f017-47f5.aaf6.fcca87fcf69f", content: testData.mathServerService_EP2_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerBinding.wsdl", bsrURI: "8eb1e98e-2769-4947.9708.e84dbae80880", content: testData.mathServerBinding_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerInterface.wsdl", bsrURI: "2f5fa82f-bcd3-4314.b797.cdf86ccd971d", content: testData.mathServerInterface_relative, type: "WSDLDocument"});
		  wsdlData.push({name: "MathServerInterface_InlineSchema1.xsd", bsrURI: "6ffed46f-5955-451b.8edf.b47ea7b4dfe8", content: testData.mathServerInterface_InlineSchema1_relative, type: "XSDDocument"});
		  
		  var results = wsrrUtils._test_calculateLocationsAndRewriteDocuments(wsdlData);
		  
		  // locations should all be doc names
		  wsdlData[0].should.have.property("location", "6dc15f6d-d784-441c.a4c1.25565525c1b6.wsdl");
		  wsdlData[1].should.have.property("location", "67b78c67-f017-47f5.aaf6.fcca87fcf69f.wsdl");
		  wsdlData[2].should.have.property("location", "MathServerBinding.wsdl");
		  wsdlData[3].should.have.property("location", "MathServerInterface.wsdl");
		  wsdlData[4].should.have.property("location", "MathServerInterface_InlineSchema1.xsd");
		  
	  });
	  
});

// _test_rewriteImports function
describe('_test_rewriteImports', function() {
	  this.timeout(15000);
	  it('rewrites for wsdl /import location=x.wsdl', function() {

		  var bsrURIToName = {"1a2aec1a-8076-462d.b543.cbadf4cb4351": "test.wsdl"};
		  var bsrURIToType = {"1a2aec1a-8076-462d.b543.cbadf4cb4351": "WSDLDocument"};
		  var content = new Buffer('<?xml version="1.0" encoding="UTF-8"?><definitions xmlns="http://schemas.xmlsoap.org/wsdl/" targetNamespace="http://www.test.com/MyTest/service1" xmlns:apachesoap="http://xml.apache.org/xml-soap" xmlns:intf="http://www.test.com/MyTest/interface" xmlns:serv="http://www.test.com/MyTest/service1" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/" xmlns:wsdlsoap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
				  '<import location="1a2aec1a-8076-462d.b543.cbadf4cb4351?type=relative" namespace="http://www.test.com/MyTest/interface"/>' +
				  '<wsdl:service name="TestService-Development"><wsdl:port binding="intf:TestServiceSoapBinding" name="TestServicePort"><wsdlsoap:address location="http://development.test.com:9080/test/services/TestService"/></wsdl:port></wsdl:service></definitions>', 'utf-8');
		  var expectedContent = new Buffer('<?xml version="1.0" encoding="UTF-8"?><definitions xmlns="http://schemas.xmlsoap.org/wsdl/" targetNamespace="http://www.test.com/MyTest/service1" xmlns:apachesoap="http://xml.apache.org/xml-soap" xmlns:intf="http://www.test.com/MyTest/interface" xmlns:serv="http://www.test.com/MyTest/service1" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/" xmlns:wsdlsoap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
				  '<import location="test.wsdl" namespace="http://www.test.com/MyTest/interface"/>' +
				  '<wsdl:service name="TestService-Development"><wsdl:port binding="intf:TestServiceSoapBinding" name="TestServicePort"><wsdlsoap:address location="http://development.test.com:9080/test/services/TestService"/></wsdl:port></wsdl:service></definitions>', 'utf-8');
		  
		  var buff = wsrrUtils._test_rewriteImports(content, true, bsrURIToName, "a.wsdl", bsrURIToType);
		  
		  buff.should.deep.equal(expectedContent);
		  
	  });

	  it('rewrites for wsdl /types/schema/import schemaLocation=x.xsd', function() {

		  var bsrURIToName = {"aba510ab-8a0b-4b6a.b0c4.8b5fd58bc472": "test.xsd"};
		  var bsrURIToType = {"aba510ab-8a0b-4b6a.b0c4.8b5fd58bc472": "XSDDocument"};
		  var content = new Buffer('<?xml version="1.0" encoding="UTF-8"?><definitions name="DoStuffService" targetNamespace="http://test.ibm.com/" xmlns="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:wsam="http://www.w3.org/2007/05/addressing/metadata" xmlns:wsp="http://www.w3.org/ns/ws-policy" xmlns:wsp1_2="http://schemas.xmlsoap.org/ws/2004/09/policy" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
				  '<types><xsd:schema><xsd:import namespace="http://test.ibm.com/" schemaLocation="aba510ab-8a0b-4b6a.b0c4.8b5fd58bc472?type=relative"/></xsd:schema></types>' +
				  '<message name="doSomething"><part element="tns:doSomething" name="parameters"/></message><message name="doSomethingResponse"><part element="tns2:doSomethingResponse" name="parameters"/></message><portType name="DoStuffDelegate"><operation name="doSomething"><input message="tns:doSomething" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingRequest"/><output message="tns:doSomethingResponse" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingResponse"/></operation></portType><binding name="DoStuffPortBinding" type="tns:DoStuffDelegate"><soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/><operation name="doSomething"><soap:operation soapAction=""/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation></binding><service name="DoStuffService"><port binding="tns:DoStuffPortBinding" name="DoStuffPort"><soap:address location="http://localhost:9080/ManyTypes/DoStuffService"/></port></service></definitions>', 'utf-8');
		  
		  var buff = wsrrUtils._test_rewriteImports(content, true, bsrURIToName, "a", bsrURIToType);

		  var expectedContent = new Buffer('<?xml version="1.0" encoding="UTF-8"?><definitions name="DoStuffService" targetNamespace="http://test.ibm.com/" xmlns="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:wsam="http://www.w3.org/2007/05/addressing/metadata" xmlns:wsp="http://www.w3.org/ns/ws-policy" xmlns:wsp1_2="http://schemas.xmlsoap.org/ws/2004/09/policy" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
				  '<types><xsd:schema><xsd:import namespace="http://test.ibm.com/" schemaLocation="test.xsd"/></xsd:schema></types>' +
				  '<message name="doSomething"><part element="tns:doSomething" name="parameters"/></message><message name="doSomethingResponse"><part element="tns2:doSomethingResponse" name="parameters"/></message><portType name="DoStuffDelegate"><operation name="doSomething"><input message="tns:doSomething" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingRequest"/><output message="tns:doSomethingResponse" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingResponse"/></operation></portType><binding name="DoStuffPortBinding" type="tns:DoStuffDelegate"><soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/><operation name="doSomething"><soap:operation soapAction=""/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation></binding><service name="DoStuffService"><port binding="tns:DoStuffPortBinding" name="DoStuffPort"><soap:address location="http://localhost:9080/ManyTypes/DoStuffService"/></port></service></definitions>', 'utf-8');

		  buff.should.deep.equal(expectedContent);
		  
	  });

	  it('rewrites for wsdl /types/schema/include schemaLocation=x.xsd', function() {

		  var bsrURIToName = {"aba510ab-8a0b-4b6a.b0c4.8b5fd58bc472": "test.xsd"};
		  var bsrURIToType = {"aba510ab-8a0b-4b6a.b0c4.8b5fd58bc472": "XSDDocument"};
		  var content = new Buffer('<?xml version="1.0" encoding="UTF-8"?><definitions name="DoStuffService" targetNamespace="http://test.ibm.com/" xmlns="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:wsam="http://www.w3.org/2007/05/addressing/metadata" xmlns:wsp="http://www.w3.org/ns/ws-policy" xmlns:wsp1_2="http://schemas.xmlsoap.org/ws/2004/09/policy" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
				  '<types><xsd:schema><xsd:include schemaLocation="aba510ab-8a0b-4b6a.b0c4.8b5fd58bc472?type=relative"/></xsd:schema></types>' +
				  '<message name="doSomething"><part element="tns:doSomething" name="parameters"/></message><message name="doSomethingResponse"><part element="tns2:doSomethingResponse" name="parameters"/></message><portType name="DoStuffDelegate"><operation name="doSomething"><input message="tns:doSomething" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingRequest"/><output message="tns:doSomethingResponse" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingResponse"/></operation></portType><binding name="DoStuffPortBinding" type="tns:DoStuffDelegate"><soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/><operation name="doSomething"><soap:operation soapAction=""/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation></binding><service name="DoStuffService"><port binding="tns:DoStuffPortBinding" name="DoStuffPort"><soap:address location="http://localhost:9080/ManyTypes/DoStuffService"/></port></service></definitions>', 'utf-8');
		  
		  var buff = wsrrUtils._test_rewriteImports(content, true, bsrURIToName, "a", bsrURIToType);

		  var expectedContent = new Buffer('<?xml version="1.0" encoding="UTF-8"?><definitions name="DoStuffService" targetNamespace="http://test.ibm.com/" xmlns="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:wsam="http://www.w3.org/2007/05/addressing/metadata" xmlns:wsp="http://www.w3.org/ns/ws-policy" xmlns:wsp1_2="http://schemas.xmlsoap.org/ws/2004/09/policy" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
				  '<types><xsd:schema><xsd:include schemaLocation="test.xsd"/></xsd:schema></types>' +
				  '<message name="doSomething"><part element="tns:doSomething" name="parameters"/></message><message name="doSomethingResponse"><part element="tns2:doSomethingResponse" name="parameters"/></message><portType name="DoStuffDelegate"><operation name="doSomething"><input message="tns:doSomething" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingRequest"/><output message="tns:doSomethingResponse" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingResponse"/></operation></portType><binding name="DoStuffPortBinding" type="tns:DoStuffDelegate"><soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/><operation name="doSomething"><soap:operation soapAction=""/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation></binding><service name="DoStuffService"><port binding="tns:DoStuffPortBinding" name="DoStuffPort"><soap:address location="http://localhost:9080/ManyTypes/DoStuffService"/></port></service></definitions>', 'utf-8');

		  buff.should.deep.equal(expectedContent);
		  
	  });

	  it('rewrites for xsd /import schemaLocation=x.xsd', function() {

		  var bsrURIToName = {"e9735ae9-8c2f-4f5f.966e.c4204ac46ef7": "DoStuffService_schema2.xsd"};
		  var bsrURIToType = {"e9735ae9-8c2f-4f5f.966e.c4204ac46ef7": "XSDDocument"};
		  var content = new Buffer('<?xml version="1.0" encoding="UTF-8"?><xs:schema targetNamespace="http://test.ibm.com/" version="1.0" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:xs="http://www.w3.org/2001/XMLSchema">' +
				  '<xs:import namespace="http://test2.ibm.com/" schemaLocation="e9735ae9-8c2f-4f5f.966e.c4204ac46ef7?type=relative"/>' + 
				  '<xs:element name="doSomething" type="tns:doSomething"/><xs:complexType name="doSomething"><xs:sequence><xs:element minOccurs="0" name="arg0" type="tns:inputType"/></xs:sequence></xs:complexType><xs:complexType name="inputType"><xs:sequence><xs:element minOccurs="0" name="name" type="xs:string"/><xs:element minOccurs="0" name="description" type="xs:string"/><xs:element name="isItOne" type="xs:boolean"/></xs:sequence></xs:complexType></xs:schema>', 'utf-8');
		  
		  var buff = wsrrUtils._test_rewriteImports(content, false, bsrURIToName, "a", bsrURIToType);
		  
		  var expectedContent = new Buffer('<?xml version="1.0" encoding="UTF-8"?><xs:schema targetNamespace="http://test.ibm.com/" version="1.0" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:xs="http://www.w3.org/2001/XMLSchema">' +
				  '<xs:import namespace="http://test2.ibm.com/" schemaLocation="DoStuffService_schema2.xsd"/>' + 
				  '<xs:element name="doSomething" type="tns:doSomething"/><xs:complexType name="doSomething"><xs:sequence><xs:element minOccurs="0" name="arg0" type="tns:inputType"/></xs:sequence></xs:complexType><xs:complexType name="inputType"><xs:sequence><xs:element minOccurs="0" name="name" type="xs:string"/><xs:element minOccurs="0" name="description" type="xs:string"/><xs:element name="isItOne" type="xs:boolean"/></xs:sequence></xs:complexType></xs:schema>', 'utf-8');

		  buff.should.deep.equal(expectedContent);
		  
	  });

	  it('rewrites for xsd /include schemaLocation=x.xsd', function() {

		  var bsrURIToName = {"4672f946-b45f-4fc6.9d1f.f86509f81ff0": "DoStuffService_schema2.xsd"};
		  var bsrURIToType = {"4672f946-b45f-4fc6.9d1f.f86509f81ff0": "XSDDocument"};
		  var content = new Buffer('<?xml version="1.0" encoding="UTF-8"?><xs:schema targetNamespace="http://test.ibm.com/" version="1.0" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:xs="http://www.w3.org/2001/XMLSchema">' +
				  '<xs:include schemaLocation="4672f946-b45f-4fc6.9d1f.f86509f81ff0?type=relative"/>' + 
				  '<xs:element name="doSomething" type="tns:doSomething"/><xs:complexType name="doSomething"><xs:sequence><xs:element minOccurs="0" name="arg0" type="tns:inputType"/></xs:sequence></xs:complexType><xs:complexType name="inputType"><xs:sequence><xs:element minOccurs="0" name="name" type="xs:string"/><xs:element minOccurs="0" name="description" type="xs:string"/><xs:element name="isItOne" type="xs:boolean"/></xs:sequence></xs:complexType></xs:schema>', 'utf-8');
		  
		  var buff = wsrrUtils._test_rewriteImports(content, false, bsrURIToName, "a", bsrURIToType);
		  
		  var expectedContent = new Buffer('<?xml version="1.0" encoding="UTF-8"?><xs:schema targetNamespace="http://test.ibm.com/" version="1.0" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:xs="http://www.w3.org/2001/XMLSchema">' +
				  '<xs:include schemaLocation="DoStuffService_schema2.xsd"/>' + 
				  '<xs:element name="doSomething" type="tns:doSomething"/><xs:complexType name="doSomething"><xs:sequence><xs:element minOccurs="0" name="arg0" type="tns:inputType"/></xs:sequence></xs:complexType><xs:complexType name="inputType"><xs:sequence><xs:element minOccurs="0" name="name" type="xs:string"/><xs:element minOccurs="0" name="description" type="xs:string"/><xs:element name="isItOne" type="xs:boolean"/></xs:sequence></xs:complexType></xs:schema>', 'utf-8');

		  buff.should.deep.equal(expectedContent);
		  
	  });

	  it('does not rewrite xsd when no type=relative', function() {

		  var bsrURIToName = {"e9735ae9-8c2f-4f5f.966e.c4204ac46ef7": "DoStuffService_schema2.xsd"};
		  var bsrURIToType = {"e9735ae9-8c2f-4f5f.966e.c4204ac46ef7": "XSDDocument"};
		  var content = new Buffer('<?xml version="1.0" encoding="UTF-8"?><xs:schema targetNamespace="http://test.ibm.com/" version="1.0" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:xs="http://www.w3.org/2001/XMLSchema">' +
				  '<xs:import namespace="http://test2.ibm.com/" schemaLocation="e9735ae9-8c2f-4f5f.966e.c4204ac46ef7.wsdl"/>' + 
				  '<xs:element name="doSomething" type="tns:doSomething"/><xs:complexType name="doSomething"><xs:sequence><xs:element minOccurs="0" name="arg0" type="tns:inputType"/></xs:sequence></xs:complexType><xs:complexType name="inputType"><xs:sequence><xs:element minOccurs="0" name="name" type="xs:string"/><xs:element minOccurs="0" name="description" type="xs:string"/><xs:element name="isItOne" type="xs:boolean"/></xs:sequence></xs:complexType></xs:schema>', 'utf-8');
		  
		  var buff = wsrrUtils._test_rewriteImports(content, false, bsrURIToName, "a", bsrURIToType);
		  
		  var expectedContent = new Buffer('<?xml version="1.0" encoding="UTF-8"?><xs:schema targetNamespace="http://test.ibm.com/" version="1.0" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:xs="http://www.w3.org/2001/XMLSchema">' +
				  '<xs:import namespace="http://test2.ibm.com/" schemaLocation="e9735ae9-8c2f-4f5f.966e.c4204ac46ef7.wsdl"/>' + 
				  '<xs:element name="doSomething" type="tns:doSomething"/><xs:complexType name="doSomething"><xs:sequence><xs:element minOccurs="0" name="arg0" type="tns:inputType"/></xs:sequence></xs:complexType><xs:complexType name="inputType"><xs:sequence><xs:element minOccurs="0" name="name" type="xs:string"/><xs:element minOccurs="0" name="description" type="xs:string"/><xs:element name="isItOne" type="xs:boolean"/></xs:sequence></xs:complexType></xs:schema>', 'utf-8');

		  buff.should.deep.equal(expectedContent);
		  
	  });

	  it('rewrites for xsd with bsrURI not in the map and is xsd', function() {

		  var bsrURIToName = {};
		  var bsrURIToType = {"e9735ae9-8c2f-4f5f.966e.c4204ac46ef7": "XSDDocument"};
		  var content = new Buffer('<?xml version="1.0" encoding="UTF-8"?><xs:schema targetNamespace="http://test.ibm.com/" version="1.0" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:xs="http://www.w3.org/2001/XMLSchema">' +
				  '<xs:import namespace="http://test2.ibm.com/" schemaLocation="e9735ae9-8c2f-4f5f.966e.c4204ac46ef7?type=relative"/>' + 
				  '<xs:element name="doSomething" type="tns:doSomething"/><xs:complexType name="doSomething"><xs:sequence><xs:element minOccurs="0" name="arg0" type="tns:inputType"/></xs:sequence></xs:complexType><xs:complexType name="inputType"><xs:sequence><xs:element minOccurs="0" name="name" type="xs:string"/><xs:element minOccurs="0" name="description" type="xs:string"/><xs:element name="isItOne" type="xs:boolean"/></xs:sequence></xs:complexType></xs:schema>', 'utf-8');
		  
		  var buff = wsrrUtils._test_rewriteImports(content, false, bsrURIToName, "a", bsrURIToType);
		  
		  var expectedContent = new Buffer('<?xml version="1.0" encoding="UTF-8"?><xs:schema targetNamespace="http://test.ibm.com/" version="1.0" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:xs="http://www.w3.org/2001/XMLSchema">' +
				  '<xs:import namespace="http://test2.ibm.com/" schemaLocation="e9735ae9-8c2f-4f5f.966e.c4204ac46ef7.xsd"/>' + 
				  '<xs:element name="doSomething" type="tns:doSomething"/><xs:complexType name="doSomething"><xs:sequence><xs:element minOccurs="0" name="arg0" type="tns:inputType"/></xs:sequence></xs:complexType><xs:complexType name="inputType"><xs:sequence><xs:element minOccurs="0" name="name" type="xs:string"/><xs:element minOccurs="0" name="description" type="xs:string"/><xs:element name="isItOne" type="xs:boolean"/></xs:sequence></xs:complexType></xs:schema>', 'utf-8');

		  buff.should.deep.equal(expectedContent);
		  
	  });

	  it('rewrites for wsdl with bsrURI not in the map and is wsdl', function() {

		  var bsrURIToName = {};
		  var bsrURIToType = {"1a2aec1a-8076-462d.b543.cbadf4cb4351": "WSDLDocument"};
		  var content = new Buffer('<?xml version="1.0" encoding="UTF-8"?><definitions xmlns="http://schemas.xmlsoap.org/wsdl/" targetNamespace="http://www.test.com/MyTest/service1" xmlns:apachesoap="http://xml.apache.org/xml-soap" xmlns:intf="http://www.test.com/MyTest/interface" xmlns:serv="http://www.test.com/MyTest/service1" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/" xmlns:wsdlsoap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
				  '<import location="1a2aec1a-8076-462d.b543.cbadf4cb4351?type=relative" namespace="http://www.test.com/MyTest/interface"/>' +
				  '<wsdl:service name="TestService-Development"><wsdl:port binding="intf:TestServiceSoapBinding" name="TestServicePort"><wsdlsoap:address location="http://development.test.com:9080/test/services/TestService"/></wsdl:port></wsdl:service></definitions>', 'utf-8');
		  var expectedContent = new Buffer('<?xml version="1.0" encoding="UTF-8"?><definitions xmlns="http://schemas.xmlsoap.org/wsdl/" targetNamespace="http://www.test.com/MyTest/service1" xmlns:apachesoap="http://xml.apache.org/xml-soap" xmlns:intf="http://www.test.com/MyTest/interface" xmlns:serv="http://www.test.com/MyTest/service1" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/" xmlns:wsdlsoap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
				  '<import location="1a2aec1a-8076-462d.b543.cbadf4cb4351.wsdl" namespace="http://www.test.com/MyTest/interface"/>' +
				  '<wsdl:service name="TestService-Development"><wsdl:port binding="intf:TestServiceSoapBinding" name="TestServicePort"><wsdlsoap:address location="http://development.test.com:9080/test/services/TestService"/></wsdl:port></wsdl:service></definitions>', 'utf-8');
		  
		  var buff = wsrrUtils._test_rewriteImports(content, true, bsrURIToName, "a", bsrURIToType);
		  
		  buff.should.deep.equal(expectedContent);
		  
	  });

	  it('rewrites for wsdl with bsrURI not in the map and is xsd', function() {

		  var bsrURIToName = {};
		  var bsrURIToType = {"aba510ab-8a0b-4b6a.b0c4.8b5fd58bc472": "XSDDocument"};
		  var content = new Buffer('<?xml version="1.0" encoding="UTF-8"?><definitions name="DoStuffService" targetNamespace="http://test.ibm.com/" xmlns="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:wsam="http://www.w3.org/2007/05/addressing/metadata" xmlns:wsp="http://www.w3.org/ns/ws-policy" xmlns:wsp1_2="http://schemas.xmlsoap.org/ws/2004/09/policy" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
				  '<types><xsd:schema><xsd:import namespace="http://test.ibm.com/" schemaLocation="aba510ab-8a0b-4b6a.b0c4.8b5fd58bc472?type=relative"/></xsd:schema></types>' +
				  '<message name="doSomething"><part element="tns:doSomething" name="parameters"/></message><message name="doSomethingResponse"><part element="tns2:doSomethingResponse" name="parameters"/></message><portType name="DoStuffDelegate"><operation name="doSomething"><input message="tns:doSomething" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingRequest"/><output message="tns:doSomethingResponse" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingResponse"/></operation></portType><binding name="DoStuffPortBinding" type="tns:DoStuffDelegate"><soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/><operation name="doSomething"><soap:operation soapAction=""/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation></binding><service name="DoStuffService"><port binding="tns:DoStuffPortBinding" name="DoStuffPort"><soap:address location="http://localhost:9080/ManyTypes/DoStuffService"/></port></service></definitions>', 'utf-8');
		  
		  var buff = wsrrUtils._test_rewriteImports(content, true, bsrURIToName, "a", bsrURIToType);

		  var expectedContent = new Buffer('<?xml version="1.0" encoding="UTF-8"?><definitions name="DoStuffService" targetNamespace="http://test.ibm.com/" xmlns="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:tns="http://test.ibm.com/" xmlns:tns2="http://test2.ibm.com/" xmlns:wsam="http://www.w3.org/2007/05/addressing/metadata" xmlns:wsp="http://www.w3.org/ns/ws-policy" xmlns:wsp1_2="http://schemas.xmlsoap.org/ws/2004/09/policy" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
				  '<types><xsd:schema><xsd:import namespace="http://test.ibm.com/" schemaLocation="aba510ab-8a0b-4b6a.b0c4.8b5fd58bc472.xsd"/></xsd:schema></types>' +
				  '<message name="doSomething"><part element="tns:doSomething" name="parameters"/></message><message name="doSomethingResponse"><part element="tns2:doSomethingResponse" name="parameters"/></message><portType name="DoStuffDelegate"><operation name="doSomething"><input message="tns:doSomething" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingRequest"/><output message="tns:doSomethingResponse" wsam:Action="http://test.ibm.com/DoStuffDelegate/doSomethingResponse"/></operation></portType><binding name="DoStuffPortBinding" type="tns:DoStuffDelegate"><soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/><operation name="doSomething"><soap:operation soapAction=""/><input><soap:body use="literal"/></input><output><soap:body use="literal"/></output></operation></binding><service name="DoStuffService"><port binding="tns:DoStuffPortBinding" name="DoStuffPort"><soap:address location="http://localhost:9080/ManyTypes/DoStuffService"/></port></service></definitions>', 'utf-8');

		  buff.should.deep.equal(expectedContent);
		  
	  });

	  // WSRR handles these combos, are they all valid? /types/schema/import|include
	  // wsdl /types/schema/import location=x.xsd N 
	  // wsdl /types/schema/include location=x.xsd N 
	  // wsdl /types/schema/import location=y.wsdl N
	  // wsdl /types/schema/include schemaLocation=x.xsd DONE
	  // wsdl /types/schema/import schemaLocation=x.xsd DONE
	  // wsdl /types/schema/import schemaLocation=y.wsdl N
	  // WSRR handles these for wsdl /import, are they valid?
	  // wsdl /import location=x.wsdl DONE
	  // wsdl /import schemaLocation=y.wsdl N
	  // WSRR handles these for XSD /import|include, are they valid?
	  // xsd /import location=x.xsd N
	  // xsd /import schemaLocation=x.xsd DONE
	  // xsd /import location=y.wsdl N
	  // xsd /import schemaLocation=y.wsdl N
	  // xsd /include location=x.xsd N
	  // xsd /include schemaLocation=x.xsd DONE

	  // bad XML that causes parse errors
	  // bad insert that causes invalid XML and error rewriting it to string
	  // for nothing that can be changed, no type=relative DONE
	  // bsrURI not in the map, should change to type - wsdl & xsd DONE
	
	  // importing two XSDs in a WSDL
	  
	  // oddly the WSRR rewrite does not handle redefines...
	  
});


describe('_test_makeSwaggerFetchList', function() {
	  it('works when one and it is swagger', function() {
		  var data = [{name: "a.json", _sdoType: "GenericDocument", bsrURI: "xyz"}];
		  var expected = _.cloneDeep(data);
		  
		  var result = wsrrUtils._test_makeSwaggerFetchList(data);
		  result.should.have.length(1);
		  result.should.deep.equal(expected);
	  });
	  
	  it('works when one and it is not swagger', function() {
		  var data = [{name: "Address.txt", _sdoType: "GenericDocument", bsrURI: "xyz"}];
		  var expected = _.cloneDeep(data);
		  
		  var result = wsrrUtils._test_makeSwaggerFetchList(data);
		  result.should.have.length(0);
	  });

	  it('works when two and one is swagger', function() {
		  var data = [{name: "a.json", _sdoType: "GenericDocument", bsrURI: "xyz"},
		              {name: "Code.txt", _sdoType: "GenericDocument", bsrURI: "xyza"}];
		  var expected = [{name: "a.json", _sdoType: "GenericDocument", bsrURI: "xyz"}];
		  
		  var result = wsrrUtils._test_makeSwaggerFetchList(data);
		  result.should.have.length(1);
		  result.should.deep.equal(expected);
	  });

});

});
