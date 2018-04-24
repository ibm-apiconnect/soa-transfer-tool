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

'use strict';

var logger=require("../../lib/Logger");
var util = require("util");

var propertyQuery="PropertyQuery?query=";
var graphQuery="GraphQuery?query=";

var AllServiceVersions ={
		path: "WSRR/7.5/Metadata/XML/",
		query: "/WSRR/GenericObject[@primaryType=%22http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel%23ServiceVersion%22]\&p1=name\&p2=version\&p3=bsrURI"
};

var AllApplicationVersions = {
		path: "WSRR/7.5/Metadata/XML/",
		query: "/WSRR/GenericObject[@primaryType=%22http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel%23ApplicationVersion%22]\&p1=name\&p2=version\&p3=bsrURI"
};

var EndpointAddressGivenBsrURI = {
		path: "WSRR/7.5/Metadata/XML/",
		query: "/WSRR/GenericObject[@bsrURI=%22%bsrURI%%22]/gep63_provides()/gep63_availableEndpoints()&p1=name"
};

var SLDForApplicationVersion = {
		path: "WSRR/7.5/Metadata/XML/",
		query: "/WSRR/GenericObject[@bsrURI=%27%bsrURI%%27]/gep63_consumes()/gep63_agreedEndpoints()&p1=bsrURI"
};

// get root WSDL on service version
var WSDLForServiceVersion = {
		query: "/WSRR/GenericObject[@bsrURI='%s']/gep63_providedWebServices(.)/sm63_wsdlServices(.)/document(.)",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "WSDLForServiceVersion"
};

//get root business service for service version
var BusinessServiceForServiceVersion = {
		query: "/WSRR/GenericObject[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessCapability') and gep63_capabilityVersions(.)/@bsrURI='%s']",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "BusinessServiceForServiceVersion"
};

//get SLDs on service version
var SLDsForServiceVersion = {
		query: "/WSRR/GenericObject[@bsrURI='%s']/gep63_provides(.)",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "SLDsForServiceVersion"
};

//get SOAP endpoints on SLD
var SOAPEndpointsForSLD = {
		query: "/WSRR/GenericObject[@bsrURI='%s' and classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelDefinition')]/gep63_availableEndpoints(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/v6r3/ServiceModel#SOAPServiceEndpoint')]",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "SOAPEndpointsForSLD"
};

//get REST endpoints on SLD
var RESTEndpointsForSLD = {
		query: "/WSRR/GenericObject[@bsrURI='%s' and classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelDefinition')]/gep63_availableEndpoints(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v8r0/RESTModel#RESTServiceEndpoint')]",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "RESTEndpointsForSLD"
};

//get REST interface documents on the Service Version, which is the documents attached to the RESTServiceInterface
var RESTInterfaceDocumentsForServiceVersion = {
		query: "/WSRR/GenericObject[@bsrURI='%s']/gep63_providedRESTServices(.)/rest80_serviceInterface(.)/rest80_definitionDocument(.)",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "RESTInterfaceDocumentsForServiceVersion"
};

//get Artifact documents on the Service Version or Business Service, which is the documents attached to the artifacts relationship
var ArtifactDocumentsForService = {
		query: "/WSRR/GenericObject[@bsrURI='%s']/ale63_artifacts(.)",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "ArtifactDocumentsForService"
};

//get charter document on the Business Service, which is the document attached to the charter relationship
var CharterDocumentForService = {
		query: "/WSRR/GenericObject[@bsrURI='%s']/gep63_charter(.)",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "CharterDocumentForService"
};

//get business service with the owning organization name, case insensitive, and at least one version in Operational state
var BusinessServiceByOwningOrg = {
		query: "/WSRR/GenericObject[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService') and ale63_owningOrganization(.)/matches(@name,'%s','i') and gep63_capabilityVersions(.)/classifiedByAnyOf(., 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational')]",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "BusinessServiceByOwningOrg"
};

//get versions for business service, check that the version is a Service Version and is in Operational state
var ServiceVersionsForBusinessService = {
		// this should be overidden in the config if wanted
		query: "/WSRR/GenericObject[@bsrURI='%s']/gep63_capabilityVersions(.)[classifiedByAllOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational')]",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "ServiceVersionsForBusinessService"
};

//get consuming SLAs for SLD where the SLA is active
var ConsumingSLAsForSLD = {
		// this should be overidden in the config if wanted
		query: "/WSRR/GenericObject[classifiedByAllOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceLevelAgreement', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#SLAActive') and gep63_agreedEndpoints(.)/@bsrURI='%s']",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "ConsumingSLAsForSLD"
};

//get consuming Versions for SLA where the version is owned by the specified organization and is in Operational or VersionApproved state
var ConsumingVersionsForSLA = {
		// this should be overidden in the config if wanted
		query: "/WSRR/GenericObject[gep63_consumes(.)/@bsrURI='%s' and ale63_owningOrganization(.)/matches(@name,'%s','i') and classifiedByAnyOf(., 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#VersionApproved')]",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "ConsumingVersionsForSLA"
};

//get consuming Versions for SLA where the version is in Operational or VersionApproved state. For use when transferring a single version.
var ConsumingVersionsForSLASingleSV = {
		// this should be overidden in the config if wanted
		query: "/WSRR/GenericObject[gep63_consumes(.)/@bsrURI='%s' and classifiedByAnyOf(., 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#Operational', 'http://www.ibm.com/xmlns/prod/serviceregistry/lifecycle/v6r3/LifecycleDefinition#VersionApproved')]",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "ConsumingVersionsForSLASingleSV"
};

//get owning Business Capability for Version - should return any type of Capability
var OwningCapabilityForVersion = {
		// this should be overidden in the config if wanted
		query: "/WSRR/GenericObject[gep63_capabilityVersions(.)/@bsrURI='%s']",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "OwningCapabilityForVersion"
};

//get owning organization for business cap or cap version
var OwningOrganizationForEntity = {
		query: "/WSRR/GenericObject[@bsrURI='%s']/ale63_owningOrganization(.)",
		// name of config item which overrides this XPath (code should try to find it and use it instead)
		configOverrideName: "OwningOrganizationForEntity"
};

var SimplePropertyQuery={
		query: "/WSRR/GenericObject[@bsrURI='%s']"
};

// for SOAP wsdl on SLD, we already have the SOAP Service Endpoint so we just use the sm63_sourceDocument(.) relationship to get the WSDL to start from

/*
 * Get the xpath string for the query, taking an override from the config if there.
 *
 * queryObject - the object in this module, such as WSDLForServiceVersion
 * configProperties - the config object
 */
function getQueryXPath(queryObject, configProperties) {
	logger.entry("getQueryXPath", queryObject, configProperties);

	var ret = queryObject.query;
	if(queryObject.configOverrideName) {
		var xpath = configProperties[queryObject.configOverrideName];
		if(xpath && xpath !== "") {
			logger.debug("using for xpath: " + xpath);
			 ret = xpath;
		}
	}

	logger.exit("getQueryXPath", ret);
	return ret;
}

//Resolve inserts of the form %s with the parameters, first is the message string,
//rest are the inserts. Like sprintf.
//Any inserts passed that do not have %s in the string will be ignored.
function resolveInserts() {
	// message is argument 0
	var ret = arguments[0];
	var len = arguments.length;
	// find out how many string place holders are in the message
	var insertHits = ret.match(/%s/g);
	var count = 0;
	if(insertHits) {
		count = insertHits.length;
	}
	//if there is more than one insert and
	if (count > 0 && len > 1) {
		// pass in only those params that have inserts (arguments is not an actual array thus below)
		var params = Array.prototype.slice.call(arguments, 0, count + 1);
		// use util.format and pass all arguments to it that have inserts for them plus the message
		ret = util.format.apply(null, params);
	}
 return ret;
}

module.exports={
		propertyQuery:propertyQuery,
		graphQuery:graphQuery,
		AllServiceVersions:AllServiceVersions,
		AllApplicationVersions:AllApplicationVersions,
		EndpointAddressGivenBsrURI:EndpointAddressGivenBsrURI,
		SLDForApplicationVersion:SLDForApplicationVersion,
		WSDLForServiceVersion:WSDLForServiceVersion,
		BusinessServiceForServiceVersion:BusinessServiceForServiceVersion,
		SLDsForServiceVersion:SLDsForServiceVersion,
		SOAPEndpointsForSLD:SOAPEndpointsForSLD,
		RESTEndpointsForSLD:RESTEndpointsForSLD,
		BusinessServiceByOwningOrg:BusinessServiceByOwningOrg,
		ServiceVersionsForBusinessService:ServiceVersionsForBusinessService,
		RESTInterfaceDocumentsForServiceVersion:RESTInterfaceDocumentsForServiceVersion,
		ArtifactDocumentsForService:ArtifactDocumentsForService,
		CharterDocumentForService:CharterDocumentForService,
		ConsumingSLAsForSLD:ConsumingSLAsForSLD,
		ConsumingVersionsForSLA:ConsumingVersionsForSLA,
		ConsumingVersionsForSLASingleSV:ConsumingVersionsForSLASingleSV,
		OwningCapabilityForVersion:OwningCapabilityForVersion,
		OwningOrganizationForEntity:OwningOrganizationForEntity,
		SimplePropertyQuery:SimplePropertyQuery,

		getQueryXPath:getQueryXPath,
		resolveInserts:resolveInserts
};
