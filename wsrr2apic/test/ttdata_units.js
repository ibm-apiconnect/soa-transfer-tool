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

var should = require('chai').should(), expect = require('chai').expect;

var ttData = require('../lib/ttData');
var _ = require("lodash");

var bsData = {"bsrURI":"d400ead4-cd96-46bd.9254.be2921be5447","type":"GenericObject","governanceRootBsrURI":"d400ead4-cd96-46bd.9254.be2921be5447","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService","properties":{"name":"Account creation service","namespace":"","version":"","description":"Confirm customer eligibility, perform credit check, and create new customer account ","owner":"wasadmin","lastModified":"1410870163048","creationTimestamp":"1337173372497","lastModifiedBy":"admin","ale63_guid":"","ale63_ownerEmail":"","ale63_assetType":"","ale63_remoteState":"","ale63_fullDescription":"","ale63_assetOwners":"","ale63_communityName":"","ale63_requirementsLink":null,"ale63_assetWebLink":null},"relationships":{"ale63_owningOrganization":[{"bsrURI":"5f34055f-fcb2-4226.9aa9.a6acdda6a999","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ALEModel#Organization"}],"ale63_artifacts":[{"bsrURI":"9b99cd9b-1da3-4391.99f4.b3de1fb3f4a4","type":"GenericDocument"}],"gep63_charter":[{"bsrURI":"9b99cd9b-1da3-4391.99f4.b3de1fb3f4a4","type":"GenericDocument"}],"gep63_serviceInterfaceVersions":[],"ale63_dependency":[],"gep63_capabilityVersions":[{"bsrURI":"9afa319a-bf21-4102.a24d.1fbfb71f4d67","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion"}]},"classifications":[],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityApproved"};
var svData = {"bsrURI":"9afa319a-bf21-4102.a24d.1fbfb71f4d67","type":"GenericObject","governanceRootBsrURI":"9afa319a-bf21-4102.a24d.1fbfb71f4d67","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion","properties":{"name":"Account creation service","namespace":"","version":"1.0","description":"This service version provides the capabilities for the account creation service","owner":"wasadmin","lastModified":"1410870163048","creationTimestamp":"1337173506669","lastModifiedBy":"admin","ale63_guid":"","ale63_ownerEmail":"","ale63_assetType":"","ale63_requirementsLink":"http://requirements.jkhle.com/requirements.jsp&id=8820","ale63_remoteState":"","ale63_fullDescription":"","ale63_assetOwners":"","gep63_versionTerminationDate":"2013-05-16","ale63_communityName":"","gep63_consumerIdentifier":"ACSV000 ","gep63_versionAvailabilityDate":"2012-05-16","ale63_assetWebLink":null},"relationships":{"ale63_owningOrganization":[{"bsrURI":"5f34055f-fcb2-4226.9aa9.a6acdda6a999","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ALEModel#Organization"}],"gep63_consumes":[{"bsrURI":"29e4a629-6b10-404c.891f.7e442e7e1ff3","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceProfileExtensions#ServiceLevelAgreement"}],"ale63_artifacts":[{"bsrURI":"cb6c37cb-410d-4d36.ab5f.5f9c0e5f5ffb","type":"WSDLDocument"},{"bsrURI":"25e0c725-ffaa-4ad7.869f.6d2d496d9fc9","type":"WSDLDocument"},{"bsrURI":"98001c98-6515-4551.984f.60e676604f14","type":"WSDLDocument"}],"gep63_interfaceSpecifications":[{"bsrURI":"6f422d6f-83a9-490d.98a4.58258958a4df","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceInterfaceSpecification"}],"gep63_providedSCAModules":[],"gep63_providedWebServices":[{"bsrURI":"2ae4b72a-38b6-4633.a03f.7e062e7e3fbd","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#Service"},{"bsrURI":"6124f661-00d1-412a.a5bc.5e1d6a5ebc48","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#Service"},{"bsrURI":"7939d479-c092-428c.a4f2.d7bc2fd7f277","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#Service"},{"bsrURI":"b1818fb1-a576-4622.b34e.3b7be13b4e4c","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#Service"}],"ale63_dependency":[],"gep63_provides":[{"bsrURI":"7c88fb7c-693f-4f3a.92db.14b65514db81","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceProfileExtensions#ServiceLevelDefinition"}],"gep63_providedRESTServices":[]},"classifications":[],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational"};
var sldData = {"bsrURI":"7c88fb7c-693f-4f3a.92db.14b65514db81","type":"GenericObject","governanceRootBsrURI":"7c88fb7c-693f-4f3a.92db.14b65514db81","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceProfileExtensions#ServiceLevelDefinition","properties":{"name":"SLD - Account creation service","namespace":"","version":"","description":"","owner":"wasadmin","lastModified":"1410870163048","creationTimestamp":"1337174209809","lastModifiedBy":"admin","gpx63_availability":"Working Hours Only","gpx63_peakMessageRateDailyTime":null,"gpx63_peakMessageRateDailyDuration":null,"gpx63_peakMessageRate":"0","gpx63_averageMessagesPerDay":"0","gpx63_averageResponseTime":"100","gpx63_maximumMessagesPerDay":"0","gep63_contextIdentifierLocationInfo":null,"gep63_consumerIdentifierLocationInfo":null,"gpx63_minimumMessagesPerDay":"0"},"relationships":{"gep63_boundScaExport":[],"gep63_anonymousSLA":[],"gep63_compatibleSLDs":[],"gep63_boundWebServicePort":[{"bsrURI":"a5176da5-8042-4298.af56.0f06c90f56e4","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#ServicePort"}],"gep63_boundRESTService":[],"gep63_serviceInterface":[{"bsrURI":"9e77309e-e10e-4e3a.8547.610277614775","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#ServiceInterface"}],"gep63_availableEndpoints":[{"bsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint"},{"bsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint"}],"gep63_availableOperations":[]},"classifications":[],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#SLDSubscribable"};
var endpointsData = [{"bsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","type":"GenericObject","governanceRootBsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://staging.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163001","creationTimestamp":"1337175539403","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"cb6c37cb-410d-4d36.ab5f.5f9c0e5f5ffb","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"cbc27ecb-662e-4e77.9000.0a440c0a008a","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"86930a86-3cee-4e58.bd5e.563301565e17","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"},{"bsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","type":"GenericObject","governanceRootBsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163017","creationTimestamp":"1337176790841","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"98001c98-6515-4551.984f.60e676604f14","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"c47329c4-3c59-492a.8b28.e5d355e52859","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"16ea0816-9422-421f.bd95.1ee5eb1e9572","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"}];

// SLA consumes the SLD
var slaData = {"bsrURI":"c6c7cdc6-7ba7-4702.b0de.3ff5633fde39","type":"GenericObject","governanceRootBsrURI":"c6c7cdc6-7ba7-4702.b0de.3ff5633fde39","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceProfileExtensions#ServiceLevelAgreement","properties":{"name":"SLA - Math Application ‪(1.0)‬","namespace":"","version":"","description":"","owner":"wasadmin","lastModified":"1467821512736","creationTimestamp":"1467821330542","lastModifiedBy":"wasadmin","gpx63_peakMessageRateDailyTime":"","gep63_versionMatchCriteria":"LatestCompatibleVersion","gpx63_peakMessageRateDailyDuration":"","gep63_contextIdentifier":"","gpx63_maximumMessagesPerDay":null,"gpx63_averageMessagesPerDay":null,"gpx63_peakMessageRate":null,"gpx63_minimumMessagesPerDay":null,"gep63_subscriptionAvailabilityDate":null,"gep63_subscriptionTerminationDate":null},"relationships":{"gep63_agreedEndpoints":[{"bsrURI":"7c88fb7c-693f-4f3a.92db.14b65514db81","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelDefinition"}],"gep63_boundSCAimport":[],"gep63_serviceLevelPolicies":[]},"classifications":[],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#SLAActive"};
var consumingSv = {"bsrURI":"8ea74a8e-f207-47ce.b3d0.af7232afd0d5","type":"GenericObject","governanceRootBsrURI":"8ea74a8e-f207-47ce.b3d0.af7232afd0d5","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ApplicationVersion","properties":{"name":"Math Application","namespace":"","version":"1.0","description":"Math Application","owner":"wasadmin","lastModified":"1467821617992","creationTimestamp":"1467821330541","lastModifiedBy":"wasadmin","ale63_guid":"","ale63_ownerEmail":"","ale63_assetType":"","ale63_remoteState":"","ale63_fullDescription":"","ale63_assetOwners":"","ale63_communityName":"","gep63_consumerIdentifier":"","gep63_versionTerminationDate":null,"gep63_versionAvailabilityDate":null,"ale63_requirementsLink":null,"ale63_assetWebLink":null},"relationships":{"ale63_owningOrganization":[{"bsrURI":"9772d397-a8fd-4d2f.adb4.44f34044b410","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ALEModel#Organization"}],"gep63_consumes":[{"bsrURI":"c6c7cdc6-7ba7-4702.b0de.3ff5633fde39","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceProfileExtensions#ServiceLevelAgreement"}],"ale63_artifacts":[],"gep63_interfaceSpecifications":[],"gep63_providedSCAModules":[],"gep63_providedWebServices":[],"ale63_dependency":[],"gep63_provides":[],"gep63_providedRESTServices":[]},"classifications":[],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational"};
var consumingBs = {"bsrURI":"9b770e9b-cebf-4f65.a9e8.f5da91f5e86f","type":"GenericObject","governanceRootBsrURI":"9b770e9b-cebf-4f65.a9e8.f5da91f5e86f","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessApplication","properties":{"name":"Math Application","namespace":"","version":"","description":"Application to do Math","owner":"wasadmin","lastModified":"1467821361095","creationTimestamp":"1467821330560","lastModifiedBy":"wasadmin","ale63_guid":"","ale63_ownerEmail":"","ale63_assetType":"","ale63_remoteState":"","ale63_fullDescription":"","ale63_assetOwners":"","ale63_communityName":"","ale63_requirementsLink":null,"ale63_assetWebLink":null},"relationships":{"ale63_owningOrganization":[{"bsrURI":"9772d397-a8fd-4d2f.adb4.44f34044b410","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ALEModel#Organization"}],"ale63_artifacts":[{"bsrURI":"e70a70e7-89d2-42e8.8dc1.78d14e78c1bd","type":"GenericDocument"}],"gep63_charter":[{"bsrURI":"e70a70e7-89d2-42e8.8dc1.78d14e78c1bd","type":"GenericDocument"}],"gep63_serviceInterfaceVersions":[],"ale63_dependency":[],"gep63_capabilityVersions":[{"bsrURI":"8ea74a8e-f207-47ce.b3d0.af7232afd0d5","type":"GenericObject","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ApplicationVersion"}]},"classifications":[],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#CapabilityApproved"};

// must clone deep the data before passing to ttData because ttData alters the objects passed in, which will break subsequent tests
describe('unittests_ttData', function(){

describe('create', function() {
	  it('creates a unique ttData', function() {
		  var data = ttData.create({});
		  var data2 = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  
		  // adds version array
		  var expected = _.cloneDeep(bsData);
		  expected.versions = [];

		  data.data.should.deep.equal(expected);
		  // data2 should be unchanged
		  expect(data2.data).to.be.a('null');
	  });
	  
});

describe('setBusinessService', function() {
	  it('adds the business service', function() {
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));

		  // adds version array
		  var expected = _.cloneDeep(bsData);
		  expected.versions = [];

		  data.data.should.deep.equal(expected);
	  });
	  
});

describe('getBusinessServiceBsrURI', function() {
	  it('gets the business service bsrURI', function() {
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  var bsrURI = data.getBusinessServiceBsrURI();
		  bsrURI.should.equal(bsData.bsrURI);
	  });
	  
});

describe('addServiceVersion', function() {
	  it('adds the service version', function() {
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  
		  data.addServiceVersion(_.cloneDeep(svData));
		  
		  data.data.should.have.deep.property("versions[0].bsrURI", "9afa319a-bf21-4102.a24d.1fbfb71f4d67");

		  data.data.versions[0].should.deep.equal(svData);
	  });

});

describe('addSLD', function() {
	  it('adds the SLD', function() {
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  
		  data.addServiceVersion(_.cloneDeep(svData));

		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  
		  data.data.versions[0].slds[0].should.deep.equal(sldData);
	  });
});

describe('addEndpointsToSLD', function() {
	  it('adds the endpoints', function() {
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  
		  data.addServiceVersion(_.cloneDeep(svData));

		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  
		  data.addEndpointsToSLD(_.cloneDeep(endpointsData), "7c88fb7c-693f-4f3a.92db.14b65514db81");
		  
		  data.data.versions[0].slds[0].endpoints.should.deep.equal(endpointsData);
		  
	  });
	  
	  it('adds SOAP endpoints', function() {
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  
		  data.addServiceVersion(_.cloneDeep(svData));

		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  
		  data.addEndpointsToSLD(_.cloneDeep(endpointsData), "7c88fb7c-693f-4f3a.92db.14b65514db81", "SOAP");

		  data.data.versions[0].slds[0].endpoints.should.deep.equal(endpointsData);
		  // should be on the SOAP relationship
		  data.data.versions[0].slds[0].soapEndpoints.should.deep.equal(endpointsData);
	  });

	  it('adds REST endpoints', function() {
		  
		  var endpoint1 = {"bsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","type":"GenericObject","governanceRootBsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v8r0/RESTModel#RESTServiceEndpoint","properties":{"name":"http://staging.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163001","creationTimestamp":"1337175539403","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"cb6c37cb-410d-4d36.ab5f.5f9c0e5f5ffb","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"cbc27ecb-662e-4e77.9000.0a440c0a008a","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"86930a86-3cee-4e58.bd5e.563301565e17","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var endpoint2 = {"bsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","type":"GenericObject","governanceRootBsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v8r0/RESTModel#RESTServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163017","creationTimestamp":"1337176790841","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"98001c98-6515-4551.984f.60e676604f14","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"c47329c4-3c59-492a.8b28.e5d355e52859","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"16ea0816-9422-421f.bd95.1ee5eb1e9572","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var endpointsData2 = [endpoint1, endpoint2];
		  
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  
		  data.addServiceVersion(_.cloneDeep(svData));

		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  
		  data.addEndpointsToSLD(_.cloneDeep(endpointsData2), "7c88fb7c-693f-4f3a.92db.14b65514db81", "REST");

		  data.data.versions[0].slds[0].endpoints.should.deep.equal(endpointsData2);
		  // should be on the REST relationship
		  data.data.versions[0].slds[0].restEndpoints.should.deep.equal(endpointsData2);
	  });
	  
});

describe('checkEndpointTypes', function() {
	  this.timeout(15000);
	  it('finds SOAP endpoints', function() {

		  var data = ttData.create({});
		  data.setBusinessService(_.cloneDeep(bsData));
		  data.addServiceVersion(_.cloneDeep(svData));
		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  var endpoint1 = {"bsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","type":"GenericObject","governanceRootBsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://staging.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163001","creationTimestamp":"1337175539403","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"cb6c37cb-410d-4d36.ab5f.5f9c0e5f5ffb","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"cbc27ecb-662e-4e77.9000.0a440c0a008a","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"86930a86-3cee-4e58.bd5e.563301565e17","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var endpoint2 = {"bsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","type":"GenericObject","governanceRootBsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163017","creationTimestamp":"1337176790841","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"98001c98-6515-4551.984f.60e676604f14","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"c47329c4-3c59-492a.8b28.e5d355e52859","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"16ea0816-9422-421f.bd95.1ee5eb1e9572","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var endpointsData2 = [endpoint1, endpoint2];
		  data.addEndpointsToSLD(endpointsData2, "7c88fb7c-693f-4f3a.92db.14b65514db81", "SOAP");
		  
		  var results = data.checkEndpointTypes("9afa319a-bf21-4102.a24d.1fbfb71f4d67");

		  // make sure its flattened ok
		  results.should.have.property("SOAP", true);
		  results.should.have.property("REST", false);
	  });
	  
	  it('ok with no SLDs', function() {

		  var data = ttData.create({});
		  data.setBusinessService(_.cloneDeep(bsData));
		  data.addServiceVersion(_.cloneDeep(svData));
		  
		  var results = data.checkEndpointTypes("9afa319a-bf21-4102.a24d.1fbfb71f4d67");

		  // should find none
		  results.should.have.property("SOAP", false);
		  results.should.have.property("REST", false);

	  });
	  
	  it('finds REST endpoints', function() {

		  var data = ttData.create({});
		  data.setBusinessService(_.cloneDeep(bsData));
		  data.addServiceVersion(_.cloneDeep(svData));
		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  var endpoint1 = {"bsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","type":"GenericObject","governanceRootBsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v8r0/RESTModel#RESTServiceEndpoint","properties":{"name":"http://staging.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163001","creationTimestamp":"1337175539403","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"cb6c37cb-410d-4d36.ab5f.5f9c0e5f5ffb","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"cbc27ecb-662e-4e77.9000.0a440c0a008a","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"86930a86-3cee-4e58.bd5e.563301565e17","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var endpoint2 = {"bsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","type":"GenericObject","governanceRootBsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v8r0/RESTModel#RESTServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163017","creationTimestamp":"1337176790841","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"98001c98-6515-4551.984f.60e676604f14","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"c47329c4-3c59-492a.8b28.e5d355e52859","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"16ea0816-9422-421f.bd95.1ee5eb1e9572","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var endpointsData2 = [endpoint1, endpoint2];
		  data.addEndpointsToSLD(endpointsData2, "7c88fb7c-693f-4f3a.92db.14b65514db81", "REST");
		  
		  var results = data.checkEndpointTypes("9afa319a-bf21-4102.a24d.1fbfb71f4d67");

		  // make sure its flattened ok
		  results.should.have.property("SOAP", false);
		  results.should.have.property("REST", true);
	  });

	  
	  it('finds REST and SOAP endpoints', function() {

		  var data = ttData.create({});
		  data.setBusinessService(_.cloneDeep(bsData));
		  data.addServiceVersion(_.cloneDeep(svData));
		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  var restEndpoint = {"bsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","type":"GenericObject","governanceRootBsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://staging.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163001","creationTimestamp":"1337175539403","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"cb6c37cb-410d-4d36.ab5f.5f9c0e5f5ffb","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"cbc27ecb-662e-4e77.9000.0a440c0a008a","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"86930a86-3cee-4e58.bd5e.563301565e17","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var soapEndpoint = {"bsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","type":"GenericObject","governanceRootBsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/profile/v8r0/RESTModel#RESTServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163017","creationTimestamp":"1337176790841","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"98001c98-6515-4551.984f.60e676604f14","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"c47329c4-3c59-492a.8b28.e5d355e52859","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"16ea0816-9422-421f.bd95.1ee5eb1e9572","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  
		  data.addEndpointsToSLD([restEndpoint], "7c88fb7c-693f-4f3a.92db.14b65514db81", "REST");
		  data.addEndpointsToSLD([soapEndpoint], "7c88fb7c-693f-4f3a.92db.14b65514db81", "SOAP");
		  
		  var results = data.checkEndpointTypes("9afa319a-bf21-4102.a24d.1fbfb71f4d67");

		  // make sure its flattened ok
		  results.should.have.property("SOAP", true);
		  results.should.have.property("REST", true);
	  });

	  it('finds SOAP endpoints for two data objects reusing the capability object', function() {

		  var data = ttData.create({});
		  var cap = _.cloneDeep(bsData);
		  
		  data.setBusinessService(cap);
		  data.addServiceVersion(_.cloneDeep(svData));
		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  var endpoint1 = {"bsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","type":"GenericObject","governanceRootBsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://staging.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163001","creationTimestamp":"1337175539403","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"cb6c37cb-410d-4d36.ab5f.5f9c0e5f5ffb","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"cbc27ecb-662e-4e77.9000.0a440c0a008a","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"86930a86-3cee-4e58.bd5e.563301565e17","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var endpoint2 = {"bsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","type":"GenericObject","governanceRootBsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163017","creationTimestamp":"1337176790841","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"98001c98-6515-4551.984f.60e676604f14","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"c47329c4-3c59-492a.8b28.e5d355e52859","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"16ea0816-9422-421f.bd95.1ee5eb1e9572","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var endpointsData2 = [endpoint1, endpoint2];
		  data.addEndpointsToSLD(endpointsData2, "7c88fb7c-693f-4f3a.92db.14b65514db81", "SOAP");
		  
		  var results = data.checkEndpointTypes("9afa319a-bf21-4102.a24d.1fbfb71f4d67");

		  // make sure its flattened ok
		  results.should.have.property("SOAP", true);
		  results.should.have.property("REST", false);
		  
		  
		  // now make another one with the same cap (as flow does)
		  var data2 = ttData.create({});
		  
		  data2.setBusinessService(cap);
		  data2.addServiceVersion(_.cloneDeep(svData));
		  data2.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  var endpoint1 = {"bsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","type":"GenericObject","governanceRootBsrURI":"6de2206d-3b6f-4fe8.af93.f98720f993ff","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://staging.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163001","creationTimestamp":"1337175539403","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Staging","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"cb6c37cb-410d-4d36.ab5f.5f9c0e5f5ffb","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"cbc27ecb-662e-4e77.9000.0a440c0a008a","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"86930a86-3cee-4e58.bd5e.563301565e17","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Staging","http://www.ibm.com/xmlns/prod/serviceregistry/8/0/visibilitytaxonomy#External"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var endpoint2 = {"bsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","type":"GenericObject","governanceRootBsrURI":"4a98264a-2ac4-44fb.a89e.fa1e95fa9e7e","primaryType":"http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint","properties":{"name":"http://production.jkhle.com:9080/jkhle/services/AccountCreation","namespace":"http://www.jkhle.com/AccountCreation/service1","version":"1.0.0","description":"","owner":"wasadmin","lastModified":"1410870163017","creationTimestamp":"1337176790841","lastModifiedBy":"admin","sm63_serviceNamespace":"http://www.jkhle.com/AccountCreation/service1","sm63_portName":"AccountCreationPort","sm63_endpointType":"SOAPAddress","sm63_serviceName":"AccountCreationService-Production","sm63_serviceVersion":"1.0.0"},"relationships":{"sm63_sourceDocument":[{"bsrURI":"98001c98-6515-4551.984f.60e676604f14","type":"WSDLDocument"}],"sm63_soapAddress":[{"bsrURI":"c47329c4-3c59-492a.8b28.e5d355e52859","type":"SOAPAddress"}],"sm63_wsdlPorts":[{"bsrURI":"16ea0816-9422-421f.bd95.1ee5eb1e9572","type":"WSDLPort"}]},"classifications":["http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Production"],"state":"http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Online"};
		  var endpointsData2 = [endpoint1, endpoint2];
		  data2.addEndpointsToSLD(endpointsData2, "7c88fb7c-693f-4f3a.92db.14b65514db81", "SOAP");
		  
		  results = data2.checkEndpointTypes("9afa319a-bf21-4102.a24d.1fbfb71f4d67");

		  // make sure its flattened ok
		  results.should.have.property("SOAP", true);
		  results.should.have.property("REST", false);
		  
	  });

});

describe('getApiData', function() {
	  it('gets the version asked for', function() {
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  
		  data.addServiceVersion(_.cloneDeep(svData));

		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  
		  data.addEndpointsToSLD(_.cloneDeep(endpointsData), "7c88fb7c-693f-4f3a.92db.14b65514db81");
		  
		  var examine = data.getApiData("9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  examine.should.not.equal(null);
		  
		  data.data.versions[0].should.deep.equal(examine.version);
		  data.data.versions[0].should.deep.equal(examine.versions[0]);
		  data.data.properties.should.deep.equal(examine.properties);
		  data.data.relationships.should.deep.equal(examine.relationships);
		  data.data.classifications.should.deep.equal(examine.classifications);
		  
	  });
});

describe('getProductData', function() {
	  it('gets the version asked for', function() {
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  
		  data.addServiceVersion(_.cloneDeep(svData));

		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  
		  data.addEndpointsToSLD(_.cloneDeep(endpointsData), "7c88fb7c-693f-4f3a.92db.14b65514db81");
		  
		  var examine = data.getProductData("9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  examine.should.not.equal(null);
		  
		  data.data.versions[0].should.deep.equal(examine.version);
		  data.data.versions[0].should.deep.equal(examine.versions[0]);
		  data.data.properties.should.deep.equal(examine.properties);
		  data.data.relationships.should.deep.equal(examine.relationships);
		  data.data.classifications.should.deep.equal(examine.classifications);
		  
	  });
	  
	  it('gets all the data', function() {
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  
		  data.addServiceVersion(_.cloneDeep(svData));

		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  
		  data.addEndpointsToSLD(_.cloneDeep(endpointsData), "7c88fb7c-693f-4f3a.92db.14b65514db81");
		  
		  var examine = data.getProductData();
		  examine.should.not.equal(null);
		  
		  data.data.should.deep.equal(examine);
		  
	  });

});

describe('addConsumer', function() {
	  it('adds a consumer', function() {
		  var data = ttData.create({});
		  
		  data.setBusinessService(_.cloneDeep(bsData));
		  
		  data.addServiceVersion(_.cloneDeep(svData));

		  data.addSLD(_.cloneDeep(sldData), "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  
		  data.addEndpointsToSLD(_.cloneDeep(endpointsData), "7c88fb7c-693f-4f3a.92db.14b65514db81");

		  // add consumers
		  data.addConsumer(_.cloneDeep(slaData), _.cloneDeep(consumingSv), _.cloneDeep(consumingBs), "7c88fb7c-693f-4f3a.92db.14b65514db81", "9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  
		  var examine = data.getApiData("9afa319a-bf21-4102.a24d.1fbfb71f4d67");
		  examine.should.not.equal(null);
		  
		  data.data.consumers.should.be.of.length(1);
		  data.data.consumers[0].version.should.deep.equal(consumingSv);
		  data.data.consumers[0].sla.should.deep.equal(slaData);
		  data.data.consumers[0].capability.should.deep.equal(consumingBs);
		  
		  data.data.version.consumers.should.be.of.length(1);
		  data.data.version.consumers[0].version.should.deep.equal(consumingSv);
		  data.data.version.consumers[0].sla.should.deep.equal(slaData);
		  data.data.version.consumers[0].capability.should.deep.equal(consumingBs);
		  
		  data.data.version.slds[0].consumers.should.be.of.length(1);
		  data.data.version.slds[0].consumers[0].version.should.deep.equal(consumingSv);
		  data.data.version.slds[0].consumers[0].sla.should.deep.equal(slaData);
		  data.data.version.slds[0].consumers[0].capability.should.deep.equal(consumingBs);
		  
	  });
	  
});

});
