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
 * End to end FVT tests which take a service from WSRR, load into APIC, publish, subscribe an app and invoke.
 * Run these using "npm run-script e2efvt" 
 */

var should = require('chai').should();
var wsrrUtils = require('../lib/WSRR/wsrrUtils');
var logger = require("../lib/Logger");
var apimCli = require('../lib/apimcli');
//var Buffer = require("buffer");
var fs = require("fs");
var fse = require("fs-extra");
var AdmZip = require("adm-zip");
var flow = require("../lib/flow");
var propertyParse = require("properties-parser");
var Promise = require('bluebird');
var ttStorage = require('../lib/ttStorage');
var yaml = require('js-yaml');
var apimdevportal = require('../lib/apimdevportal');
var https = require('https');
var _ = require('lodash');
var testData = require('./testData');
var os = require('os');
var retry = require('retry');

//var yakbak = require('yakbak');
var http = require('http');

var inputOptions = null;
var testOptions = null;

var APPLICATION_NAME = "E2ETestApp";

// name of dev org to use
var DEVORG_NAME = "wsrrdev_sb";

// catalog to publish to
var PUBLISH_CATALOG = "sb";

var FLOWTESTOUTPUT = "flowTestOutput";

//create yakbak proxy
//var proxy = http.createServer(yakbak('https://srb84a.hursley.ibm.com:9443/', {
//	dirname: __dirname + "/e2efvttapes"
//}));

// expected results
var allExpectedResults = [];
var mathServiceExpectedResults = [];
var mathServiceCaptureExpectedResults = [];
var mathServicePushExpectedResults = [];

// queries to download all services
var allServiceVersionsForBusinessService="/WSRR/GenericObject[@bsrURI='%s']/gep63_capabilityVersions(.)[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion')]";
var allConsumingVersionsForSLA="/WSRR/GenericObject[gep63_consumes(.)/@bsrURI='%s' and ale63_owningOrganization(.)/matches(@name,'%s','i')]";
var allBusinessServiceByOwningOrg="/WSRR/GenericObject[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService') and ale63_owningOrganization(.)/matches(@name,'%s','i')]";
var allConsumingVersionsForSLASingleSV="/WSRR/GenericObject[gep63_consumes(.)/@bsrURI='%s']";

allExpectedResults.push({
	name: "Partial BS - Staged Version Endpoints",
	bsrURI: "e79e0de7-a2c0-40d1.b9a0.f79b5df7a03c",
	version: "",
	description: "Partial BS - version is staged with staging endpoint online and offline dev endpoint",
	success: false,
	versions: [{
		name: "Partial BS - Staged Version Endpoints",
		bsrURI: "e79e0de7-a2c0-40d1.b9a0.f79b5df7a03c",
		version: "1.0",
		description: "Partial BS - Staged Version with staging endpoint online and dev endpoint offline",
		productName: "",
		productVersion: "1.0",
		success: false,
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: false,
		publishAttempted: false,
		publishSuccess: false,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: []
	}]
});
allExpectedResults.push({
			"name" : "Partial BS - Version Operational Review",
			"version" : "",
			"description" : "Partial BS - version is in operational review so it has approved SLD, production online endpoint, staging endpoint, no dev endpoint.",
			"bsrURI" : "05080705-1637-478b.b845.73a5d4734567",
			"success" : true,
			"versions" : [ {
				"name" : "Partial BS - Version Operational Review",
				"version" : "1.0",
				"description" : "Partial BS - Version Operational Review",
				"bsrURI" : "d0da75d0-fc17-4700.9719.11d977111948",
				"success" : true,
				productName: "partial-bs-version-operational-review",
				productVersion: "1.0",
				captureAttempted: true,
				captureSuccess: true,
				pushAttempted: true,
				pushSuccess: true,
				publishAttempted: true,
				publishSuccess: true,
				consumersAttempted: false,
				consumersSuccess: false,
				catalogConsumersDone: {},
				catalogs: [PUBLISH_CATALOG]
			} ]
		});
allExpectedResults.push({
			"name" : "Basic Service",
			"version" : "",
			"description" : "Basic service for testing",
			"bsrURI" : "aa867aaa-c596-46a4.83b5.affba8afb525",
			"success" : true,
			"versions" : [
					{
						"name" : "Basic Service",
						"version" : "1.0",
						"description" : "Basic version 1.0 in SOAP.",
						"bsrURI" : "2919fd29-fc17-4729.bae4.0b95690be4f9",
						"success" : true,
						productName: "basic-service",
						productVersion: "1.0",
						captureAttempted: true,
						captureSuccess: true,
						pushAttempted: true,
						pushSuccess: true,
						publishAttempted: true,
						publishSuccess: true,
						consumersAttempted: false,
						consumersSuccess: false,
						catalogConsumersDone: {},
						catalogs: [PUBLISH_CATALOG]
					},
					{
						"name" : "Basic Service",
						"version" : "1.1",
						"description" : "Returns somewhat different data. Actually the same data for test purposes.",
						"bsrURI" : "37000137-dbfb-4be4.83bb.d5f54cd5bbaf",
						"success" : true,
						productName: "basic-service",
						productVersion: "1.1",
						captureAttempted: true,
						captureSuccess: true,
						pushAttempted: true,
						pushSuccess: true,
						publishAttempted: true,
						publishSuccess: true,
						consumersAttempted: false,
						consumersSuccess: false,
						catalogConsumersDone: {},
						catalogs: [PUBLISH_CATALOG]
					} ]
});

allExpectedResults.push({
	"name" : "BS - Deprecated Version",
	"version" : "",
	"description" : "BS - Deprecated Version",
	"bsrURI" : "c0eab1c0-e6e5-459b.96ce.2a73322ace1e",
	"success" : true,
	"versions" : [ {
		"name" : "BS - Deprecated Version",
		"version" : "1.0",
		"description" : "BS - Deprecated Version",
		"bsrURI" : "47d31847-b55d-4d8a.b818.954ab89518a5",
		"success" : true,
		productName: "bs-deprecated-version",
		productVersion: "1.0",
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: true,
		publishAttempted: true,
		publishSuccess: true,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: [PUBLISH_CATALOG]
	} ]
});

allExpectedResults.push({
	"name" : "Partial BS - Version approved spec",
	"version" : "",
	"description" : "Partial BS with version with approved spec",
	"bsrURI" : "51fd6351-eb88-4838.8b31.fac44efa313e",
	"success" : false,
	"versions" : [ {
		"name" : "Partial BS - Version approved spec",
		"version" : "1.0",
		"description" : "Version in approved spec state with a SIS on it but no endpoints or WSDL Services",
		"bsrURI" : "4e59f54e-591f-4fdd.b431.990ff4993132",
		"success" : false,
		productName: "",
		productVersion: "",
		captureAttempted: true,
		captureSuccess: false,
		pushAttempted: false,
		pushSuccess: false,
		publishAttempted: false,
		publishSuccess: false,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: []
	} ]
});
allExpectedResults.push({
	"name" : "Partial BS - Version with nothing",
	"version" : "",
	"description" : "Partial BS - Version has nothing but is as far in the life cycle as it can be",
	"bsrURI" : "0a64dd0a-e5b7-4705.97a1.946af094a10a",
	"success" : false,
	"versions" : [ {
		"name" : "Partial BS - Version with nothing",
		"version" : "1.0",
		"description" : "Version with nothing but as far along the life cycle as it can be",
		"bsrURI" : "0748ab07-d8ad-4d88.b5a3.66d4d366a3df",
		"success" : false,
		productName: "",
		productVersion: "",
		captureAttempted: true,
		captureSuccess: false,
		pushAttempted: false,
		pushSuccess: false,
		publishAttempted: false,
		publishSuccess: false,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: []
	} ]
});
allExpectedResults.push({
	"name" : "Partial BS - Approved",
	"version" : "",
	"description" : "Partial BS - Approved but no version",
	"bsrURI" : "41d05d41-c3d9-49ed.a3b8.2333c923b808",
	"success" : false,
	"versions" : []
});
allExpectedResults.push({
	"name" : "Catalog Search",
	"version" : "",
	"description" : "Searches the catalog",
	"bsrURI" : "f13602f1-4e6a-4a1b.9240.2b397a2b407f",
	"success" : true,
	"versions" : [ {
		"name" : "Catalog Search",
		"version" : "1.0.0",
		"description" : "REST version",
		"bsrURI" : "a4a92ea4-7dda-4a8d.ae71.a92ed1a97196",
		"success" : true,
		productName: "catalog-search",
		productVersion: "1.0.0",
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: true,
		publishAttempted: true,
		publishSuccess: true,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: [PUBLISH_CATALOG]
	} ]
});
allExpectedResults.push({
	"name" : "Insurance Quote",
	"version" : "",
	"description" : "Provide an insurance quote",
	"bsrURI" : "348e6534-314a-4a83.b338.1501d51538d4",
	"success" : true,
	"versions" : [ {
		"name" : "Insurance Quote",
		"version" : "1.0",
		"description" : "",
		"bsrURI" : "89cd2b89-3338-48e5.b628.36190e36286e",
		"success" : true,
		productName: "insurance-quote",
		productVersion: "1.0",
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: true,
		publishAttempted: true,
		publishSuccess: true,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: [PUBLISH_CATALOG]
	} ]
});
allExpectedResults.push({
	"name" : "Address",
	"version" : "",
	"description" : "Address provider",
	"bsrURI" : "8ff2028f-4f93-43db.9b3a.8e69298e3aa0",
	"success" : true,
	"versions" : [ {
		"name" : "Address",
		"version" : "1.0",
		"description" : "REST implementation",
		"bsrURI" : "ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4",
		"success" : true,
		productName: "address",
		productVersion: "1.0",
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: true,
		publishAttempted: true,
		publishSuccess: true,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: [PUBLISH_CATALOG]
	} ]
});
allExpectedResults.push({
	"name" : "The Method",
	"version" : "",
	"description" : "Provides the method to achieve various aims",
	"bsrURI" : "878a1a87-5ec8-4846.b39c.50615f509cea",
	"success" : true,
	"versions" : [ {
		"name" : "The Method",
		"version" : "1.0",
		"description" : "",
		"bsrURI" : "64070164-2ed9-49f1.b004.a3a3fba304a1",
		"success" : true,
		productName: "the-method",
		productVersion: "1.0",
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: true,
		publishAttempted: true,
		publishSuccess: true,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: [PUBLISH_CATALOG]
	} ]
});

allExpectedResults.push({
	"name" : "MathService",
	"version" : "",
	"description" : "Maths service",
	"bsrURI" : "0f94240f-cfff-4f86.8ed3.a12b21a1d37e",
	"success" : true,
	"versions" : [ {
		"name" : "MathService",
		"version" : "1.0",
		"description" : "Doc literal SOAP version",
		"bsrURI" : "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733",
		"success" : true,
		productName: "mathservice",
		productVersion: "1.0",
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: true,
		publishAttempted: true,
		publishSuccess: true,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: [PUBLISH_CATALOG]
	} ]
});

// math service for push only is different
mathServiceExpectedResults.push({
		"name" : "MathService",
		"version" : "",
		"description" : "Maths service",
		"bsrURI" : "0f94240f-cfff-4f86.8ed3.a12b21a1d37e",
		"success" : true,
		"versions" : [ {
			"name" : "MathService",
			"version" : "1.0",
			"description" : "Doc literal SOAP version",
			"bsrURI" : "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733",
			"success" : true,
			productName: "mathservice",
			productVersion: "1.0",
			captureAttempted: true,
			captureSuccess: true,
			pushAttempted: true,
			pushSuccess: true,
			publishAttempted: false,
			publishSuccess: false,
			consumersAttempted: false,
			consumersSuccess: false,
			catalogConsumersDone: {},
			catalogs: []
		} ]
	});

//math service for capture only is different
mathServiceCaptureExpectedResults.push({
		"name" : "MathService",
		"version" : "",
		"description" : "Maths service",
		"bsrURI" : "0f94240f-cfff-4f86.8ed3.a12b21a1d37e",
		"success" : true,
		"versions" : [ {
			"name" : "MathService",
			"version" : "1.0",
			"description" : "Doc literal SOAP version",
			"bsrURI" : "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733",
			"success" : true,
			productName: "mathservice",
			productVersion: "1.0",
			captureAttempted: true,
			captureSuccess: true,
			pushAttempted: false,
			pushSuccess: false,
			publishAttempted: false,
			publishSuccess: false,
			consumersAttempted: false,
			consumersSuccess: false,
			catalogConsumersDone: {},
			catalogs: []
		} ]
	});

//math service for push only is different
mathServicePushExpectedResults.push({
		"name" : "MathService",
		"version" : "",
		"description" : "Maths service",
		"bsrURI" : "0f94240f-cfff-4f86.8ed3.a12b21a1d37e",
		"success" : true,
		"versions" : [ {
			"name" : "MathService",
			"version" : "1.0",
			"description" : "Doc literal SOAP version",
			"bsrURI" : "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733",
			"success" : true,
			productName: "mathservice",
			productVersion: "1.0",
			captureAttempted: false,
			captureSuccess: false,
			pushAttempted: true,
			pushSuccess: true,
			publishAttempted: false,
			publishSuccess: false,
			consumersAttempted: false,
			consumersSuccess: false,
			catalogConsumersDone: {},
			catalogs: []
		} ]
	});

allExpectedResults.push({
	"name" : "Partial BS - Version propose spec",
	"version" : "",
	"description" : "Partial BS - version is in propose spec",
	"bsrURI" : "de3b66de-a0c0-4034.8380.f1e622f1807a",
	"success" : false,
	"versions" : [ {
		"name" : "Partial BS - Version propose spec",
		"version" : "1.0",
		"description" : "Version in propose spec",
		"bsrURI" : "a62cefa6-8189-49ab.a8f3.108c8f10f322",
		"success" : false,
		productName: "",
		productVersion: "",
		captureAttempted: true,
		captureSuccess: false,
		pushAttempted: false,
		pushSuccess: false,
		publishAttempted: false,
		publishSuccess: false,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: []
	} ]
});
allExpectedResults.push({
	"name" : "BS - Retired Version",
	"version" : "",
	"description" : "BS - Retired Version",
	"bsrURI" : "7db7947d-c5e9-4963.b788.7d2dea7d88c6",
	"success" : true,
	"versions" : [ {
		"name" : "BS - Retired Version",
		"version" : "1.0",
		"description" : "BS - Retired Version",
		"bsrURI" : "90e2f890-6bd9-4945.8907.6b991a6b07af",
		"success" : true,
		productName: "bs-retired-version",
		productVersion: "1.0",
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: true,
		publishAttempted: true,
		publishSuccess: true,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: [PUBLISH_CATALOG]
	} ]
});
allExpectedResults.push({
	"name" : "Partial BS - realized version endpoint",
	"version" : "",
	"description" : "Partial BS - version is realized and has a non-approved SLD with staging and development endpoints.",
	"bsrURI" : "a2a455a2-7d0d-4d05.9b0a.a2c9e7a20abf",
	"success" : false,
	"versions" : [ {
		"name" : "Partial BS - realized version endpoint",
		"version" : "1.0",
		"description" : "Partial BS - realized version endpoint",
		"bsrURI" : "22618d22-2946-4674.9f39.1b03371b3933",
		"success" : false,
		productName: "partial-bs-realized-version-endpoint",
		productVersion: "1.0",
		captureAttempted: true,
		captureSuccess: false,
		pushAttempted: false,
		pushSuccess: false,
		publishAttempted: false,
		publishSuccess: false,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: []
	} ]
});
allExpectedResults.push({
	"name" : "Partial BS only identified",
	"version" : "",
	"description" : "Partial BS - only in identified and no other content",
	"bsrURI" : "8e08938e-9c1d-4dba.8cf3.dfc44adff3e0",
	"success" : false,
	"versions" : []
});
allExpectedResults.push({
	"name" : "Logging",
	"version" : "",
	"description" : "Centralized logging service",
	"bsrURI" : "bdeefabd-6b47-47bd.becc.02986702cc82",
	"success" : true,
	"versions" : [ {
		"name" : "Logging",
		"version" : "1.0",
		"description" : "",
		"bsrURI" : "545cc554-8b5c-4c13.9910.18e54218108d",
		"success" : true,
		productName: "logging",
		productVersion: "1.0",
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: true,
		publishAttempted: true,
		publishSuccess: true,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: [PUBLISH_CATALOG]
	} ]
});
allExpectedResults.push({
	"name" : "Partial BS - Proposed",
	"version" : "",
	"description" : "Partial BS in proposed state",
	"bsrURI" : "1e2a9b1e-4a40-408c.80b8.1f91b61fb8c8",
	"success" : false,
	"versions" : []
});
allExpectedResults.push({
	"name" : "Partial BS - Realized Version",
	"version" : "",
	"description" : "Partial BS - version is realized and has a non-approved SLD. No endpoints.",
	"bsrURI" : "1845b818-f46c-4cba.b264.f4ed4bf46489",
	"success" : false,
	"versions" : [ {
		"name" : "Partial BS - Realized Version",
		"version" : "1.0",
		"description" : "Partial BS - Realized Version none approved SLD no endpoints",
		"bsrURI" : "e57148e5-5d2c-4c95.91aa.e31d3ee3aa4a",
		"success" : false,
		productName: "",
		productVersion: "",
		captureAttempted: true,
		captureSuccess: false,
		pushAttempted: false,
		pushSuccess: false,
		publishAttempted: false,
		publishSuccess: false,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: []
	} ]
});
allExpectedResults.push({
	"name" : "Basic Echo",
	"version" : "",
	"description" : "Basic service again",
	"bsrURI" : "3929ca39-56eb-4bea.99c8.7d73d17dc80b",
	"success" : true,
	"versions" : [ {
		"name" : "Basic Echo",
		"version" : "1.0",
		"description" : "Basic service 1.0",
		"bsrURI" : "b6d2b1b6-211b-4b40.ad48.c6ea75c64839",
		"success" : true,
		productName: "basic-echo",
		productVersion: "1.0",
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: true,
		publishAttempted: true,
		publishSuccess: true,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: [PUBLISH_CATALOG]
	} ]
});
allExpectedResults.push({
	"name" : "Partial BS - Identified Version",
	"version" : "",
	"description" : "Partial BS - Approved BS, Version is Identified",
	"bsrURI" : "13272213-da03-435c.b62d.9a81869a2d9c",
	"success" : false,
	"versions" : [ {
		"name" : "Partial BS - Identified Version",
		"version" : "1.0",
		"description" : "Version but nothing in the version",
		"bsrURI" : "13b85913-d839-4949.b8a0.b6e4c1b6a076",
		"success" : false,
		productName: "",
		productVersion: "",
		captureAttempted: true,
		captureSuccess: false,
		pushAttempted: false,
		pushSuccess: false,
		publishAttempted: false,
		publishSuccess: false,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: []
	} ]
});
allExpectedResults.push({
	"name" : "BS - Superceded Version",
	"version" : "",
	"description" : "BS - with Superceded Version",
	"bsrURI" : "4ad5684a-6db3-4362.9bfb.afdae7affb85",
	"success" : true,
	"versions" : [ {
		"name" : "BS - Superceded Version",
		"version" : "1.0",
		"description" : "BS - Superceded Version",
		"bsrURI" : "44746e44-789b-4b4a.b711.78157c7811a2",
		"success" : true,
		productName: "bs-superceded-version",
		productVersion: "1.0",
		captureAttempted: true,
		captureSuccess: true,
		pushAttempted: true,
		pushSuccess: true,
		publishAttempted: true,
		publishSuccess: true,
		consumersAttempted: false,
		consumersSuccess: false,
		catalogConsumersDone: {},
		catalogs: [PUBLISH_CATALOG]
	} ]
});

// create new templates for all API types which combine the shipped with the samples/extensions.yaml
function createNewAPITemplates() {
	var extensions = fs.readFileSync("./samples/extensions.yaml", "utf8");
	
	var soap = fs.readFileSync("./templates/soap.yaml", "utf8");
	var newSoap = soap + os.EOL + os.EOL + extensions;
	fs.writeFileSync("./" + FLOWTESTOUTPUT + "/soap.yaml", newSoap, "utf8");

	var rest = fs.readFileSync("./templates/rest.yaml", "utf8");
	var newRest = rest + os.EOL + os.EOL + extensions;
	fs.writeFileSync("./" + FLOWTESTOUTPUT + "/rest.yaml", newRest, "utf8");
	
	var restSwagger = fs.readFileSync("./templates/restSwagger.yaml", "utf8");
	var newRestSwagger = restSwagger + os.EOL + os.EOL + extensions;
	fs.writeFileSync("./" + FLOWTESTOUTPUT + "/restSwagger.yaml", newRestSwagger, "utf8");
	
}

function readConfig() { 
	// read config
	var wsrr2apimProperties = fs.readFileSync("./connectionproperties.properties");
	inputOptions = propertyParse.parse(wsrr2apimProperties);
	// point to local proxy
/*	inputOptions.wsrrHostname = "localhost";
	inputOptions.wsrrPort = 4567;
	inputOptions.wsrrProtocol = "http";
	// set credentials to those used for the tapes
	inputOptions.wsrrUsername = "user";
	inputOptions.wsrrPassword = "user";
*/	
	var e2eProperties = fs.readFileSync("./test/e2e_fvt.properties");
	testOptions = propertyParse.parse(e2eProperties);
	
	// now need to make a new template for 3 API types with combines the shipped ones with samples/extensions.yaml
	// and override in the config to use these
	var loc = createNewAPITemplates();

	// override the location of the templates
	inputOptions.template_SOAP="./" + FLOWTESTOUTPUT + "/soap.yaml";
	inputOptions.template_REST="./" + FLOWTESTOUTPUT + "/rest.yaml";
	inputOptions.template_REST_SWAGGER="./" + FLOWTESTOUTPUT + "/restSwagger.yaml";
	
}

// empty directory and remove
// testFolder - path
// name - directory name
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

// send string request "requestData" using options "options", will set the length
function _sendRequest(options, requestData) {
	logger.entry("_sendRequest", options, requestData);
	
	var length = "0";
	if(requestData) {
		length = requestData.length.toString();
	}
	
	// set content length header and type
	options.headers["Content-Length"] = length;

	// sometimes the test API requests get 401 on the first invocation, so retry
	var operation = retry.operation({
		retries : 10,
		factor : 1,
		minTimeout : 1000,
		maxTimeout : 5000,
		randomize : false
	});
	
	var promise = new Promise(function(resolve, reject) {
		operation.attempt(function(currentAttempt) {		
			var req = https.request(options, function(res) {
				res.setEncoding('utf-8');
				var responseString = '';
		
				res.on('data', function(data) {
					if(logger.Debug){
						logger.debug(data);
					}
					responseString += data;
				});
		
				res.on('end', function() {
					logger.entry("_sendRequest_end");
					
					if(logger.Debug){
						logger.debug(responseString);
					}
					logger.debug(responseString);
	
					// check the status code
					var status = res.statusCode;
					// deal with non-good return codes. 100 and 200 are ok, 300 is redirect and 400 or 500 are bad.
					// but we will not deal with redirects for now.
					var statusNumber = parseInt(status);
					if(isNaN(statusNumber) || statusNumber >= 300) {
						// retry if necessary
						if(operation.retry(new Error("bad code " + statusNumber))) {
							console.log("Bad code received: " + statusNumber + ", retrying");
							// do nothing, operation will be retried
							return;
						} else {
							// bad HTTP response code
							logger.error("Bad HTTP return code: " + status);
							logger.error(responseString);
							reject(responseString);
						}
					} else {
						resolve(responseString);
					}
					logger.exit("_sendRequest_end");
				});
			});
			
			if(length > 0) {
				req.write(requestData);
			}
			req.end();
	
			req.on('error', function(e) {
				logger.error("Error from request");
				logger.error(e);
				reject(e);
			});
		});	
	});	
		
	logger.exit("_sendRequest", promise);
	return promise;
}

/*
 * Test the Basic WSDL API via the gateway
 * 
 * apiKey - apikey to use to test with, as the X-IBM-Client-Id header
 * 
 * Returns a promise that resolves when the test is successful, rejects if an error happens
 */
function testBasicWSDL(apiKey) {
	var url = testOptions.gatewayUrl + "Basic/basicService";
	
	var data = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bas="http://ibm.com/sr/test/wsdl/basic.schema"><soapenv:Header/><soapenv:Body><bas:basicRequest><request>goats2x</request></bas:basicRequest></soapenv:Body></soapenv:Envelope>';

	var expectedResponseEnd = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><a:basicResponse xmlns:a="http://ibm.com/sr/test/wsdl/basic.schema"><response>goats2x</response></a:basicResponse></soapenv:Body></soapenv:Envelope>';
	
	var connectionOptions = {
		hostname : testOptions.gatewayHost,
		port : 443,
		method : 'POST',
		agent : false,
		rejectUnauthorized : false,
		//auth : apiDeveloperUsername + ':' + apiDeveloperPassword,
		headers: {
			"X-IBM-Client-Id": apiKey,
			"Content-Type": "text/xml",
			"SOAPAction": ""
		},
		path: url
	};

	var promise = _sendRequest(connectionOptions, data).then(function(response){
		console.log("- Response data");
		console.log(response);
		if(response.indexOf(expectedResponseEnd) === 0) {
			throw new Error("Response did not match excepted");
		}
	});
	return promise;
}

/*
 * Test the Math Service WSDL API via the gateway
 * 
 * apiKey - apikey to use to test with, as the X-IBM-Client-Id header
 * 
 * Returns a promise that resolves when the test is successful, rejects if an error happens
 */
function testMathServiceWSDL(apiKey) {
	var url = testOptions.gatewayUrl + "MathService/MathServerService";
	
	var data = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:math="http://math.pot.ibm.com"><soapenv:Header/><soapenv:Body><math:add><augend>5</augend><addend>2</addend></math:add></soapenv:Body></soapenv:Envelope>';

	var expectedResponseEnd = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><a:addResponse xmlns:a="http://math.pot.ibm.com"><addReturn>7</addReturn></a:addResponse></soapenv:Body></soapenv:Envelope>';
console.log("Key: " + apiKey);	
	var connectionOptions = {
		hostname : testOptions.gatewayHost,
		port : 443,
		method : 'POST',
		agent : false,
		rejectUnauthorized : false,
		//auth : apiDeveloperUsername + ':' + apiDeveloperPassword,
		headers: {
			"X-IBM-Client-Id": apiKey,
			"Content-Type": "text/xml",
			"SOAPAction": ""
		},
		path: url
	};

	var promise = _sendRequest(connectionOptions, data).then(function(response){
		console.log("- Response data");
		console.log(response);
		if(response.indexOf(expectedResponseEnd) === 0) {
			throw new Error("Response did not match excepted");
		}
	});
	return promise;
}

/*
 * Test the Address API via the gateway
 * 
 * apiKey - apikey to use to test with, as the X-IBM-Client-Id header
 * 
 * Returns a promise that resolves when the test is successful, rejects if an error happens
 */
function testAddressREST(apiKey) {
	var url = testOptions.gatewayUrl + "Addresses/jaxrs/addresses";
	
	var data = '';

	var expectedResponse = [
	      "Eric- 932 Deloraine Av.",
		  "Yen - 687 Markham Rd.",
		  "Keith - 4301 McCowan Rd.",
		  "Ron - 465 Melrose St.",
		  "Jane - 35 Cranbrooke Av.",
		  "Sam - 146 Brooke Av."
	];
	
	var connectionOptions = {
		hostname : testOptions.gatewayHost,
		port : 443,
		method : 'GET',
		agent : false,
		rejectUnauthorized : false,
		//auth : apiDeveloperUsername + ':' + apiDeveloperPassword,
		headers: {
			"X-IBM-Client-Id": apiKey,
			"Content-Type": "text/xml",
			"SOAPAction": ""
		},
		path: url
	};

	var promise = _sendRequest(connectionOptions, data).then(function(response){
		console.log("- Response data");
		console.log(response);
		
		// convert to object because it is JSON
		var responseObject = JSON.parse(response);
		responseObject.should.deep.equal(expectedResponse);
	});
	return promise;
}

/*
 * Test the Catalog Search API via the gateway
 * 
 * apiKey - apikey to use to test with, as the X-IBM-Client-Id header
 * 
 * Returns a promise that resolves when the test is successful, rejects if an error happens
 */
function testCatalogSearchREST(apiKey) {
	var url = testOptions.gatewayUrl + "CatalogSearch/jaxrs/catalog/1/";
	
	var data = '';

	var expectedResponse = {
			  "entry": "SOA Policy, Service Gateway, and SLA Management"
	};
	
	var connectionOptions = {
		hostname : testOptions.gatewayHost,
		port : 443,
		method : 'GET',
		agent : false,
		rejectUnauthorized : false,
		//auth : apiDeveloperUsername + ':' + apiDeveloperPassword,
		headers: {
			"X-IBM-Client-Id": apiKey,
			"Content-Type": "text/xml",
			"SOAPAction": ""
		},
		path: url
	};

	var promise = _sendRequest(connectionOptions, data).then(function(response){
		console.log("- Response data");
		console.log(response);
		
		// convert to object because it is JSON
		var responseObject = JSON.parse(response);
		responseObject.should.deep.equal(expectedResponse);
	});
	return promise;
}

/*
 * Test the Insurance Quote API via the gateway
 * 
 * apiKey - apikey to use to test with, as the X-IBM-Client-Id header
 * 
 * Returns a promise that resolves when the test is successful, rejects if an error happens
 */
function testInsuranceQuoteWSDL(apiKey) {
	var url = testOptions.gatewayUrl + "InsuranceQuote/QuoteService";
	
	var data = '<soap-env:Envelope xmlns:soap-env="http://schemas.xmlsoap.org/soap/envelope/"><soap-env:Header><wsse:wsSecurityHeader xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><UsernameToken><Username>string</Username><Password>string</Password></UsernameToken></wsse:wsSecurityHeader></soap-env:Header><soap-env:Body><tns:getQuote xmlns:tns="http://test.ibm.com/"><arg0><value>3</value><name>myName</name><address>myAddress</address></arg0></tns:getQuote></soap-env:Body></soap-env:Envelope>';

	var expectedResponseEnd = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><rpcOp:getQuoteResponse xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:rpcOp="http://test.ibm.com/"><return><quoteAmount>1</quoteAmount></return></rpcOp:getQuoteResponse></soapenv:Body></soapenv:Envelope>';
	
	var connectionOptions = {
		hostname : testOptions.gatewayHost,
		port : 443,
		method : 'POST',
		agent : false,
		rejectUnauthorized : false,
		//auth : apiDeveloperUsername + ':' + apiDeveloperPassword,
		headers: {
			"X-IBM-Client-Id": apiKey,
			"Content-Type": "text/xml",
			"SOAPAction": ""
		},
		path: url
	};

	var promise = _sendRequest(connectionOptions, data).then(function(response){
		console.log("- Response data");
		console.log(response);
		if(response.indexOf(expectedResponseEnd) === 0) {
			throw new Error("Response did not match excepted");
		}
	});
	return promise;
}

/*
 * Test The Method API via the gateway
 * 
 * apiKey - apikey to use to test with, as the X-IBM-Client-Id header
 * 
 * Returns a promise that resolves when the test is successful, rejects if an error happens
 */
function testTheMethodWSDL(apiKey) {
	var url = testOptions.gatewayUrl + "MyMethod/MyMethodService";
	
	var data = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:test="http://test.ibm.com/"><soapenv:Header/><soapenv:Body><test:x>4</test:x></soapenv:Body></soapenv:Envelope>';

	var expectedResponseEnd = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><RunMyMethodResponse xmlns="http://test.ibm.com/">8</RunMyMethodResponse></soapenv:Body></soapenv:Envelope>';
	
	var connectionOptions = {
		hostname : testOptions.gatewayHost,
		port : 443,
		method : 'POST',
		agent : false,
		rejectUnauthorized : false,
		//auth : apiDeveloperUsername + ':' + apiDeveloperPassword,
		headers: {
			"X-IBM-Client-Id": apiKey,
			"Content-Type": "text/xml",
			"SOAPAction": ""
		},
		path: url
	};

	var promise = _sendRequest(connectionOptions, data).then(function(response){
		console.log("- Response data");
		console.log(response);
		if(response.indexOf(expectedResponseEnd) === 0) {
			throw new Error("Response did not match excepted");
		}
	});
	return promise;
}

/*
 * Test the Logging API via the gateway
 * 
 * apiKey - apikey to use to test with, as the X-IBM-Client-Id header
 * 
 * Returns a promise that resolves when the test is successful, rejects if an error happens
 */
function testLoggingWSDL(apiKey) {
	var url = testOptions.gatewayUrl + "Logging/services/Logging";
	
	var data = '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:Logging"><soapenv:Header/><soapenv:Body><urn:createLog soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><request xsi:type="urn:LogRequest"><data xsi:type="soapenc:string" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">some log</data><uniqueId xsi:type="soapenc:string" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">101234</uniqueId><timeStamp xsi:type="xsd:long">10</timeStamp></request></urn:createLog></soapenv:Body></soapenv:Envelope>';

	var expectedResponseEnd = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soapenv:Body><ns1:createLogResponse soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:ns1="urn:Logging"><createLogReturn href="#id0"/></ns1:createLogResponse><multiRef id="id0" soapenc:root="0" soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xsi:type="ns2:LogResponse" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:ns2="urn:Logging"><itemId xsi:type="soapenc:string">65997523-37c9-48c4-ab33-9dc44b94eede</itemId></multiRef></soapenv:Body></soapenv:Envelope>';
	
	var connectionOptions = {
		hostname : testOptions.gatewayHost,
		port : 443,
		method : 'POST',
		agent : false,
		rejectUnauthorized : false,
		//auth : apiDeveloperUsername + ':' + apiDeveloperPassword,
		headers: {
			"X-IBM-Client-Id": apiKey,
			"Content-Type": "text/xml",
			"SOAPAction": ""
		},
		path: url
	};

	var promise = _sendRequest(connectionOptions, data).then(function(response){
		console.log("- Response data");
		console.log(response);
		if(response.indexOf(expectedResponseEnd) === 0) {
			throw new Error("Response did not match excepted");
		}
	});
	return promise;
}

// array of which services to publish and invoke
var serviceInvokes = [];
serviceInvokes.push({
	name : "MathService",
	bsBsrURI : "0f94240f-cfff-4f86.8ed3.a12b21a1d37e",
	bsrURI : "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733",
	checker: testMathServiceWSDL
});

serviceInvokes.push({
	name : "Address",
	bsBsrURI : "8ff2028f-4f93-43db.9b3a.8e69298e3aa0",
	bsrURI : "ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4",
	checker: testAddressREST
});
serviceInvokes.push({
	name : "Catalog Search",
	bsBsrURI : "f13602f1-4e6a-4a1b.9240.2b397a2b407f",
	bsrURI : "a4a92ea4-7dda-4a8d.ae71.a92ed1a97196",
	checker: testCatalogSearchREST
});
serviceInvokes.push({
	name : "Insurance Quote",
	bsBsrURI : "348e6534-314a-4a83.b338.1501d51538d4",
	bsrURI : "89cd2b89-3338-48e5.b628.36190e36286e",
	checker: testInsuranceQuoteWSDL
});
serviceInvokes.push({
	name : "Logging",
	bsBsrURI : "bdeefabd-6b47-47bd.becc.02986702cc82",
	bsrURI : "545cc554-8b5c-4c13.9910.18e54218108d",
	checker: testLoggingWSDL
});

serviceInvokes.push({
	name : "Basic Service",
	bsBsrURI : "aa867aaa-c596-46a4.83b5.affba8afb525",
	bsrURI : "2919fd29-fc17-4729.bae4.0b95690be4f9",
	checker: testBasicWSDL
});

// check results, shouldError is true if this will throw on the first, or false if it catches and ignores the error
function checkResults(result, worked, expectedResults, shouldError, checkConsumers) {
	// examine result
	var resData = result.getResults();

	// all will have worked?
	resData.success.should.equal(worked);
	// expected results have all results
	resData.details.should.have.lengthOf(expectedResults.length);
	for(var eresI = 0; eresI < expectedResults.length; eresI++){
		var expectedResult = expectedResults[eresI];
		try {
			// find the data entry for this business service
			for(var resI = 0; resI < resData.details.length; resI++){
				if(resData.details[resI].bsrURI === expectedResult.bsrURI) {
					// check it. The order of versions is not important, so we cannot deep.equal here

					// check the business service object
					resData.details[resI].should.have.property("name", expectedResult.name);
					resData.details[resI].should.have.property("version", expectedResult.version);
					resData.details[resI].should.have.property("description", expectedResult.description);
					resData.details[resI].should.have.property("success", expectedResult.success);
					// length of versions should match
					resData.details[resI].versions.should.have.length(expectedResult.versions.length);
					if(checkConsumers) {
						// need to check consumers but the IDs from APIC are in there, so we ignore the IDs

						// assume that there is just one version and check the lengths of things
						var version = expectedResult.versions[0];
						version.catalogConsumersDone.should.have.property("sb");
						version.catalogConsumersDone.sb.created.should.be.length(4);
						version.catalogConsumersDone.sb.updated.should.be.length(0);
						version.catalogConsumersDone.sb.subscriptionsAdded.should.be.length(4);
						version.catalogConsumersDone.sb.subscriptionsDeleted.should.be.length(0);
						var appIDs = Object.keys(version.catalogConsumersDone.sb.appIDToName);
						appIDs.should.be.length(4);
						
					} else {
						// remove consumer stuff from real data
						delete resData.details[resI].versions.catalogConsumersDone;
						
						// versions should include the versions expected in any order
						resData.details[resI].versions.should.deep.include.members(expectedResult.versions);
					}
				}
			}
		} catch(e) {
			console.error("Error checking: " + expectedResult.name + " (" + expectedResult.version + ") bsrURI: " + expectedResult.bsrURI);
			console.error(e);
			console.error(e.stack);
			if(shouldError) {
				throw e;
			}
		}
	}				
}

/*
 * Publish the Product created for the business service bsBsrURI and version bsrURI, then
 * subscribe an application to it.
 * 
 * Then call testFunction with the api key.
 * 
 * Returns a promise that resolves with nothing when the test is done.
 * 
 */
function publishAndSubscribeProductAndTest(bsBsrURI, bsrURI, testFunction) {

	var productName = null;
	var productVersion = null;
	var planName = null;
	var devOrgId = null;
	var appKey = null;

	console.log("- Reading product YAML for name, version, plan");
	var productFilename = ttStorage.getProductYamlName(bsBsrURI, bsrURI);
	var productPath = ttStorage.getProductDirectoryPath(bsBsrURI, bsrURI);
	
	// need to read in to find the product and plan details
	var productData = fs.readFileSync(productPath + "/" + productFilename, "utf8");
	var productObject = yaml.safeLoad(productData);
	productName = productObject.info.name;
	productVersion = productObject.info.version;
	var plans = productObject.plans;
	var planNames = Object.keys(plans);
	// had better be one plan
	planName = planNames[0];
	var catalogName = apimCli.getDefaultCatalog();
	
	console.log("- Publishing API to APIC catalog");

	// do the publish now
	var promise = apimCli.publishFromDrafts(productName, productVersion, catalogName, productPath).then(function(){
		console.log("- Getting dev org id");
		// should be published, so now make and subscribe an app
		
		// get the id of the developer org first
		return apimdevportal.getDeveloperOrganizationIdOfConfigured();
	}).then(function(orgId){
		console.log("- Finding application");
		devOrgId = orgId;
	
		return apimdevportal.retrieveApplicationByName(APPLICATION_NAME, devOrgId);
	}).then(function(existingApplication){
		if(existingApplication === null) {
			console.log("- Creating application");
			// need to make the application
			return apimdevportal.createApplication(APPLICATION_NAME, "", devOrgId);
		} else {
			// delete existing application then create a new one
			console.log("- Recreating application");
			return apimdevportal.deleteApplication(existingApplication.id, devOrgId).then(function() {
				return apimdevportal.createApplication(APPLICATION_NAME, "", devOrgId);
			});
		}
	}).then(function(application){
		// get the key
		appKey = application.credentials.clientID;
		console.log("- Subscribing application to plan");
	
		return apimdevportal.subscribeApplicationToPlan(application.id, devOrgId, productName, productVersion, planName);
	}).then(function(subscription) {
		// run the test
		console.log("- Invoking the API");
		return testFunction(appKey);
	});
	
	return promise;
}

/*
 * Subscribe an application to the Product created for the business service bsBsrURI and version bsrURI.
 * 
 * Then call testFunction with the api key.
 * 
 * Returns a promise that resolves with nothing when the test is done.
 * 
 */
function subscribeProductAndTest(bsBsrURI, bsrURI, testFunction) {

	var productName = null;
	var productVersion = null;
	var planName = null;
	var devOrgId = null;
	var appKey = null;

	console.log("- Reading product YAML for name, version, plan");
	var productFilename = ttStorage.getProductYamlName(bsBsrURI, bsrURI);
	var productPath = ttStorage.getProductDirectoryPath(bsBsrURI, bsrURI);
	
	// need to read in to find the product and plan details
	var productData = fs.readFileSync(productPath + "/" + productFilename, "utf8");
	var productObject = yaml.safeLoad(productData);
	productName = productObject.info.name;
	productVersion = productObject.info.version;
	var plans = productObject.plans;
	var planNames = Object.keys(plans);
	// had better be one plan
	planName = planNames[0];


	console.log("- Getting dev org id");
	var promise = apimdevportal.getDeveloperOrganizationIdOfConfigured().then(function(orgId){
		
		console.log("- Finding application");
		devOrgId = orgId;
	
		return apimdevportal.retrieveApplicationByName(APPLICATION_NAME, devOrgId);
	}).then(function(existingApplication){
		if(existingApplication === null) {
			console.log("- Creating application");
			// need to make the application
			return apimdevportal.createApplication(APPLICATION_NAME, "", devOrgId);
		} else {
			// delete existing application then create a new one
			console.log("- Recreating application");
			return apimdevportal.deleteApplication(existingApplication.id, devOrgId).then(function() {
				return apimdevportal.createApplication(APPLICATION_NAME, "", devOrgId);
			});
		}
	}).then(function(application){
		// get the key
		appKey = application.credentials.clientID;
		console.log("- Subscribing application to plan");
	
		return apimdevportal.subscribeApplicationToPlan(application.id, devOrgId, productName, productVersion, planName);
	}).then(function(subscription) {
		// run the test
		console.log("- Invoking the API");
		return testFunction(appKey);
	});
	
	return promise;
}

/*
 * Check consumers part of the swagger. Expected is a map of sld bsrURI to an array of consumer objects we expect to see, 
 * we expect to see all parts of expected but can have more in there. 
 * 
 * bsBsrURI - business service bsrURI
 * bsrURI - service bsrURI
 * expected - map of SLD bsrURI to array of consumers
 * shouldError - if true throw on the first error, if false log all differences
 * 
 */
function checkConsumers(bsBsrURI, bsrURI, expected, shouldError) {

	var apiFilename = ttStorage.getApiYamlName(bsBsrURI, bsrURI);
	// assume API is in same directory as product
	var apiPath = ttStorage.getProductDirectoryPath(bsBsrURI, bsrURI);
	
	// need to read in 
	var apiData = fs.readFileSync(apiPath + "/" + apiFilename, "utf8");
	var apiObject = yaml.safeLoad(apiData);

	var considering = null;
	// look for consumers
	try {
		var slds = apiObject["x-wsrr-metadata"].SLDs;
		for(var i = 0, len = slds.length; i < len; i++) {
			var j, jLen, k, kLen, findBsrURI, checkConsumer;
			var sld = slds[i];
			considering = sld;
			if(expected[sld.bsrURI]) {
				var expectedConsumers = expected[sld.bsrURI];
				var consumers = sld.consumers;
				consumers.should.not.equal(null);
				
				// match on SLA bsrURI
				for(j = 0, jLen = consumers.length; j < jLen; j++) {
					checkConsumer = consumers[j];
					considering = checkConsumer;
					findBsrURI = checkConsumer.sla.bsrURI;
					
					var compareConsumer = null;
					for(k = 0, kLen = expectedConsumers.length; k < kLen; k++) {
						if(expectedConsumers[k].sla.bsrURI === findBsrURI) {
							compareConsumer = expectedConsumers[k];
							break;
						}					
					}
					
					if(compareConsumer !== null) {
						// compare fields of the consumer but only contains so can have fields we do not check for
						checkConsumer.sla.should.have.property("bsrURI", compareConsumer.sla.bsrURI);
						checkConsumer.sla.should.have.property("name", compareConsumer.sla.name);
						checkConsumer.sla.should.have.property("description", compareConsumer.sla.description);
						// length of classifications should match
						checkConsumer.sla.classifications.should.have.length(compareConsumer.sla.classifications.length);
						// classifications should include the expected in any order
						checkConsumer.sla.classifications.should.deep.include.members(compareConsumer.sla.classifications);

						checkConsumer.version.should.have.property("bsrURI", compareConsumer.version.bsrURI);
						checkConsumer.version.should.have.property("name", compareConsumer.version.name);
						checkConsumer.version.should.have.property("description", compareConsumer.version.description);
						// length of classifications should match
						checkConsumer.version.classifications.should.have.length(compareConsumer.version.classifications.length);
						// classifications should include the expected in any order
						checkConsumer.version.classifications.should.deep.include.members(compareConsumer.version.classifications);

						checkConsumer.capability.should.have.property("bsrURI", compareConsumer.capability.bsrURI);
						checkConsumer.capability.should.have.property("name", compareConsumer.capability.name);
						checkConsumer.capability.should.have.property("description", compareConsumer.capability.description);
						// length of classifications should match
						checkConsumer.capability.classifications.should.have.length(compareConsumer.capability.classifications.length);
						// classifications should include the expected in any order
						checkConsumer.capability.classifications.should.deep.include.members(compareConsumer.capability.classifications);
						
					} else {
						throw new Error("No expected consumer found for data: " + JSON.stringify(checkConsumer, null, "  "));
					}
				}
				// check we have all expected consumers in the data
				for(k = 0, kLen = expectedConsumers.length; k < kLen; k++) {
					findBsrURI = expectedConsumers[k].sla.bsrURI;
					var found = false;
					for(j = 0, jLen = consumers.length; j < jLen; j++) {
						checkConsumer = consumers[j];
						
						if(checkConsumer.sla.bsrURI === findBsrURI) {
							found = true;
						}
					}
					if(found === false) {
						throw new Error("Did not find expected consumer in data. Expected: " + JSON.stringify(expectedConsumers[k], null, "  "));
					}
				}
			} else if(sld.consumers && sld.consumers.length > 0){
				// there are consumers in the metadata, so there should be some in expected
				throw new Error("No expected SLD found for SLD in data with bsrURI: " + sld.bsrURI);
			}		
		}
		
		// check the expected SLDs are in the data
		var keys = Object.keys(expected);
		for(i = 0, len = keys.length; i < len; i++) {
			var sldBsrURI = keys[i];
			
			// find sld
			var findSld = null;
			for(var sldI = 0, sldLen = slds.length; sldI < sldLen; sldI++) {
				if(slds[sldI].bsrURI === sldBsrURI) {
					findSld = slds[sldI];
				}
			}
			
			if(findSld === null) {
				// cannot find the SLD
				throw new Error("Cannot find expected SLD " + sldBsrURI + " in data");
			}
		}
		
	} catch(e) {
		console.error("Error checking: " + JSON.stringify(considering, null, "  "));
		console.error(e);
		if(shouldError === true) {
			throw e;
		}
	}
}

// expected consumers for Math Service
var expectedMathServiceConsumers = {
		"1543a515-14e2-4292.8405.1fc5551f059d": 
		[
			{
				sla: {
					bsrURI: "c6c7cdc6-7ba7-4702.b0de.3ff5633fde39",
			        name: "SLA - Math Application ‪(1.0)‬",
			        description: "Consumes Math Service For the Math Application Basic agreement",
			        classifications: ['http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Finance',
			            'http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#SalesMarketing']
				},
				version: {
					bsrURI: "8ea74a8e-f207-47ce.b3d0.af7232afd0d5",
			        name: "Math Application",
			        description: "Math Application",
			        classifications: ['http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Finance']
				},
				capability: {
					bsrURI: "9b770e9b-cebf-4f65.a9e8.f5da91f5e86f",
			        name: "Math Application",
			        description: "Application to do Math",
			        classifications: ['http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Finance']
				}
			},
			{
				sla: {
					bsrURI: "20907d20-5b0b-4bfd.a98f.0d54970d8fb0",
			        name: "SLA - Math service consumer ‪(1.0)‬",
			        description: "Consumes the Math Service",
			        classifications: ['http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#SalesMarketing']
				},
				version: {
					bsrURI: "5d03bc5d-f2ee-4e80.9d22.7c31627c2220",
			        name: "Math service consumer",
			        description: "Approved consumer",
			        classifications: ['http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#SalesMarketing']
				},
				capability: {
					bsrURI: "9a1a759a-5327-477e.95ef.50910550ef38",
			        name: "Math service consumer",
			        description: "Approved consumer",
			        classifications: ['http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#SalesMarketing']
				}
			}			                                         
		],
		"6858d768-19b4-447d.a196.b3a741b396f6": 
			[
				{
					sla: {
						bsrURI: "73be5273-f231-416f.ba2f.9d39449d2f82",
				        name: "SLA - Math Service Gold ‪(1.0)‬",
				        description: "Gold agreement to use Math Service",
				        classifications: ['http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Insurance']
					},
					version: {
						bsrURI: "69136469-060d-4d0a.83dc.d3a0a5d3dcd9",
				        name: "Math Service Gold",
				        description: "",
				        classifications: ['http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Insurance']
					},
					capability: {
						bsrURI: "99ff8199-06ac-4ca8.99bb.a35159a3bb2b",
				        name: "Math Service Gold",
				        description: "Gold consumer",
				        classifications: ['http://www.ibm.com/xmlns/prod/serviceregistry/6/1/GovernanceProfileTaxonomy#Insurance']
					}
				}
			]
};
// all math service consumers
var allExpectedMathServiceConsumers = _.cloneDeep(expectedMathServiceConsumers);
allExpectedMathServiceConsumers["1543a515-14e2-4292.8405.1fc5551f059d"].push({
	sla: {
		bsrURI: "3d40253d-3dec-4cee.af74.4f59304f745d",
        name: "SLA - Math Mobile App ‪(1.0)‬",
        description: "",
        classifications: []
	},
	version: {
		bsrURI: "24a42024-0eb6-4658.93f5.de9af6def5de",
        name: "Math Mobile App",
        description: "Mobile app version",
        classifications: []
	},
	capability: {
		bsrURI: "4ee5d84e-78cd-4dd5.a462.ccf3d1cc6220",
        name: "Math Mobile App",
        description: "In a different organization than Math Service",
        classifications: []
	}
});

var expectedLoggingConsumers = {
		"3db3733d-d3bb-4b17.affa.f35ff1f3fa63": 
			[
				{
					sla: {
						bsrURI: "d2519fd2-539f-4fb4.b738.f6626ff638d3",
				        name: "SLA - Insurance Quote ‪(1.0)‬",
				        description: "SLA to use Logging by Insurance Quote",
				        classifications: []
					},
					version: {
						bsrURI: "89cd2b89-3338-48e5.b628.36190e36286e",
				        name: "Insurance Quote",
				        description: "",
				        classifications: []
					},
					capability: {
						bsrURI: "348e6534-314a-4a83.b338.1501d51538d4",
				        name: "Insurance Quote",
				        description: "Provide an insurance quote",
				        classifications: []
					}
				}
			]
};

// expected for Address none as the one in WSRR is SLA Identified not Approved
var expectedAddressConsumers = {
};

// Basic Service
var expectedBasicConsumers = {
		"08797f08-58c6-46e9.b37a.fbd8affb7add": 
		[
			{
				sla: {
					bsrURI: "34ad4734-dc44-4488.bd90.9645489690cd",
			        name: "SLA - Basic Consumer ‪(1.1)‬",
			        description: "",
			        classifications: []
				},
				version: {
					bsrURI: "dee10bde-11c5-45a2.acf1.ace25cacf1ef",
			        name: "Basic Consumer",
			        description: "1.1 version",
			        classifications: []
				},
				capability: {
					bsrURI: "461ca146-83ff-4fc0.bb94.12b5fb129459",
			        name: "Basic Consumer",
			        description: "Consume basically",
			        classifications: []
				}
			}			                                         
		]
};

// Catalog - no consumers because SLA is inactive
var expectedCatalogConsumers = {
};
	
/*
 * Check all consumers, once without error then once with error on the first bad one.
 */ 
function checkAllConsumers() {
	
	checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumers, false);
	checkConsumers("bdeefabd-6b47-47bd.becc.02986702cc82", "545cc554-8b5c-4c13.9910.18e54218108d", expectedLoggingConsumers, false);
	checkConsumers("8ff2028f-4f93-43db.9b3a.8e69298e3aa0", "ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4", expectedAddressConsumers, false);
	checkConsumers("aa867aaa-c596-46a4.83b5.affba8afb525", "37000137-dbfb-4be4.83bb.d5f54cd5bbaf", expectedBasicConsumers, false);
	checkConsumers("f13602f1-4e6a-4a1b.9240.2b397a2b407f", "a4a92ea4-7dda-4a8d.ae71.a92ed1a97196", expectedCatalogConsumers, false);

	// fail on first error
	checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumers, true);
	checkConsumers("bdeefabd-6b47-47bd.becc.02986702cc82", "545cc554-8b5c-4c13.9910.18e54218108d", expectedLoggingConsumers, true);
	checkConsumers("8ff2028f-4f93-43db.9b3a.8e69298e3aa0", "ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4", expectedAddressConsumers, true);
	checkConsumers("aa867aaa-c596-46a4.83b5.affba8afb525", "37000137-dbfb-4be4.83bb.d5f54cd5bbaf", expectedBasicConsumers, true);
	checkConsumers("f13602f1-4e6a-4a1b.9240.2b397a2b407f", "a4a92ea4-7dda-4a8d.ae71.a92ed1a97196", expectedCatalogConsumers, true);

}

/*
 * Check the consumers.yaml file for the service, ensure it contains the expected data.
 * 
 * expected - object which should be equal to the object represented by the consumers swagger.
 * 
 */
function checkConsumersYaml(bsBsrURI, bsrURI, expected, shouldError) {
	
	var consumersFilename = ttStorage.getConsumersYamlName(bsBsrURI, bsrURI);
	// assume consumers is in same directory as product
	var consumersPath = ttStorage.getProductDirectoryPath(bsBsrURI, bsrURI);
	
	// need to read in 
	var consumersData = fs.readFileSync(consumersPath + "/" + consumersFilename, "utf8");
	var consumersObject = yaml.safeLoad(consumersData);

	try {
		var actualConsumer = _.cloneDeep(consumersObject);
		var expectedConsumer = _.cloneDeep(expected);
		delete actualConsumer.consumers;
		delete expectedConsumer.consumers;
		
		// check deep on the one with just properties
		actualConsumer.should.deep.equal(expectedConsumer);
		
		// check on the one with consumers
		consumersObject.consumers.length.should.equal(expected.consumers.length);
		consumersObject.consumers.should.deep.include.members(expected.consumers);
		
	} catch(e) {
		console.error("Error comparing consumers file for bs bsrURI: " + bsBsrURI + " sv bsrURI: " + bsrURI);
		console.error(e);
		if(shouldError) {
			throw e;
		}
	}
}

// expected math service consumers yaml
var expectedMathServiceConsumersYaml = {
		consumersDetails: "1.0.0",
		consumers: [
		            {name: "Math service consumer (5d03bc5d-f2ee-4e80.9d22.7c31627c2220)",
		            	description: "Approved consumer",
		            	clientID: "",
		            	duplicateClientID: "", 
		            	planName: "sld-mathserverporttype"},
		            {name: "Math Application (8ea74a8e-f207-47ce.b3d0.af7232afd0d5)",
		            	description: "Math Application",
		            	clientID: "ASCV0001",
		            	duplicateClientID: "ASCV0001",
		            	planName: "sld-mathserverporttype"},
		            {name: "Math Service Gold (69136469-060d-4d0a.83dc.d3a0a5d3dcd9)",
		            	description: "",
		            	clientID: "",
		            	duplicateClientID: "",
		            	planName: "sld-gold-mathserverporttype"
		            	}
		]			
	};

// all consumers across all orgs for Math Service
var allExpectedMathServiceConsumersYaml = _.cloneDeep(expectedMathServiceConsumersYaml);
allExpectedMathServiceConsumersYaml.consumers.push({
	name: "Math Mobile App (24a42024-0eb6-4658.93f5.de9af6def5de)",
	description: "Mobile app version",
	clientID: "",
	duplicateClientID: "",
	planName: "sld-mathserverporttype"	
});

/*
 * Check all consumers swagger, once without error then once with error on the first bad one.
 */ 
function checkAllConsumersYaml() {

	var expectedLoggingConsumersYaml = {
			consumersDetails: "1.0.0",
			consumers: [
			            {name: "Insurance Quote (89cd2b89-3338-48e5.b628.36190e36286e)",
			            	description: "",
			            	clientID: "CONS001",
			            	duplicateClientID: "CONS001ASCV0001", 
			            	planName: "sld-logging"}
			]			
		};

	// SLA identified so no consumers
	var expectedAddressConsumersYaml = {
			consumersDetails: "1.0.0",
			consumers: []			
		};

	var expectedBasicConsumersYaml = {
			consumersDetails: "1.0.0",
			consumers: [
			            {name: "Basic Consumer (dee10bde-11c5-45a2.acf1.ace25cacf1ef)",
			            	description: "1.1 version",
			            	clientID: "",
			            	duplicateClientID: "",
			            	planName: "sld-basicservices"}
			]			
		};

	// SLA inactive so no consumers
	var expectedCatalogConsumersYaml = {
			consumersDetails: "1.0.0",
			consumers: []			
		};

	// no consumers at all
	var expectedTheMethodConsumersYaml = {
			consumersDetails: "1.0.0",
			consumers: []			
		};
	
	checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumersYaml, false);
	checkConsumersYaml("bdeefabd-6b47-47bd.becc.02986702cc82", "545cc554-8b5c-4c13.9910.18e54218108d", expectedLoggingConsumersYaml, false);
	checkConsumersYaml("8ff2028f-4f93-43db.9b3a.8e69298e3aa0", "ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4", expectedAddressConsumersYaml, false);
	checkConsumersYaml("aa867aaa-c596-46a4.83b5.affba8afb525", "37000137-dbfb-4be4.83bb.d5f54cd5bbaf", expectedBasicConsumersYaml, false);
	checkConsumersYaml("f13602f1-4e6a-4a1b.9240.2b397a2b407f", "a4a92ea4-7dda-4a8d.ae71.a92ed1a97196", expectedCatalogConsumersYaml, false);
	checkConsumersYaml("878a1a87-5ec8-4846.b39c.50615f509cea", "64070164-2ed9-49f1.b004.a3a3fba304a1", expectedTheMethodConsumersYaml, false);

	checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumersYaml, true);
	checkConsumersYaml("bdeefabd-6b47-47bd.becc.02986702cc82", "545cc554-8b5c-4c13.9910.18e54218108d", expectedLoggingConsumersYaml, true);
	checkConsumersYaml("8ff2028f-4f93-43db.9b3a.8e69298e3aa0", "ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4", expectedAddressConsumersYaml, true);
	checkConsumersYaml("aa867aaa-c596-46a4.83b5.affba8afb525", "37000137-dbfb-4be4.83bb.d5f54cd5bbaf", expectedBasicConsumersYaml, true);
	checkConsumersYaml("f13602f1-4e6a-4a1b.9240.2b397a2b407f", "a4a92ea4-7dda-4a8d.ae71.a92ed1a97196", expectedCatalogConsumersYaml, true);
	checkConsumersYaml("878a1a87-5ec8-4846.b39c.50615f509cea", "64070164-2ed9-49f1.b004.a3a3fba304a1", expectedTheMethodConsumersYaml, true);

}

/*
 * Clear out any consumers of the specified Product in the devOrgName.
 */
function clearConsumers(productName, productVersion, devOrgName, apimdevportal) {
	
	var devOrgId = null;
	// get dev org ID
	apimdevportal.setDeveloperOrganizationName(devOrgName);
	return apimdevportal.getDeveloperOrganizationIdOfConfigured().then(function(devOrg){
		devOrgId = devOrg;
		// get product
		return apimdevportal.retrieveProductByName(productName, productVersion, devOrgId);
	}).then(function(prod){
		if(prod !== null) {
			// get subscriptions
			return apimdevportal.listSubscriptionsForProduct(prod.id, devOrgId).then(function(subs){
				// remove each app that is subscribed - each app can only subscribe once to the product
				var promises = [];
				for(var i = 0, len = subs.length; i < len; i++) {
					var sub = subs[i];
					console.log("Deleting application " + sub.app.name);
					var promise = apimdevportal.deleteApplication(sub.app.id, devOrgId);
					promises.push(promise);
				}
				return Promise.all(promises);				
			}).then(function(){
				console.log("Deleted all applications");
			});
		}
	});	
}


describe('e2e_fvt', function(){
	
	before(function(done) {
		/*
		var doneCount = 0;
		var listener = function() {
			doneCount++;
			if(doneCount === 2) {
				// both done
				done();
			}
		};
		
		proxy.listen(4567, listener);
*/		
		logger.initialize(done);
		
		console.log("If tests hang here then check that the APIC lic is accepted and usage send back is set");
	});

	// test to push and publish all services for org to sb catalog
	describe('flow_transferToDraftForOrganization with publish', function() {
		// 20 minutes timeout
		this.timeout(12000000);

		it('should transfer all services for an org then invoke one', function() {
			// make folder for output
			try{
				fs.statSync(FLOWTESTOUTPUT);
				// exists
			} catch(error) {
				// make
				fs.mkdirSync(FLOWTESTOUTPUT);
			}

			readConfig();
			// override to do publish to "sb"
			inputOptions.publish = "true";
			// will use the apiIdentifier URL which should have sb in
			inputOptions.publishCatalogs = "";
			// no consumers
			inputOptions.createConsumers="false";
			
			// set back to downloading all services
			inputOptions.ServiceVersionsForBusinessService=allServiceVersionsForBusinessService;
			inputOptions.ConsumingVersionsForSLA=allConsumingVersionsForSLA;
			inputOptions.BusinessServiceByOwningOrg=allBusinessServiceByOwningOrg;
			
			wsrrUtils.setWSRRConnectiondetails(inputOptions);
			apimdevportal.setConnectionDetails(inputOptions);

			var productName = null;
			var productVersion = null;
			var planName = null;
			var devOrgId = null;
			var appKey = null;

			// business service bsrURI
			var bsBsrURI = null;
			// service version bsrURI
			var bsrURI = null;

			// do not publish because this should have been done
			return apimCli.setConnectionDetails(inputOptions).then(function() {
				console.log("Pushing all services in organization 'Common services' to APIC");
				return flow.transferToDraftForOrganization("Common services", "./" + FLOWTESTOUTPUT, inputOptions, wsrrUtils, apimCli, null);
			}).then(function(result) {
				console.log("Checking results object");

				// examine all results
				checkResults(result, false, allExpectedResults, false);
				// now check again and throw on the first error
				checkResults(result, false, allExpectedResults, true);
				
				// need to publish the files we know where they are
				ttStorage.setFSRoot("./" + FLOWTESTOUTPUT);
				ttStorage.setProductPerVersion(true);

				console.log("Checking consumers");
				// check consumers for Math Service
				checkAllConsumers();
				// check consumers yaml
				checkAllConsumersYaml();
				
				// run one by one
				return Promise.reduce(serviceInvokes, function(oldResult, invokeDetails, index, length) {
					console.log("Testing " + invokeDetails.name);
					
					return subscribeProductAndTest(invokeDetails.bsBsrURI, invokeDetails.bsrURI, invokeDetails.checker).then(function(){
						// worked so return true && old result so any falses are passed through
						return true && oldResult;
					}).caught(function(error) {
						console.log("ERROR: " + error);
						// failed so return false
						return false;
					});					
				}, true).then(function(result){
					console.log("Overall invoke result: " + result);
					// if result was false then an invoke failed so error
					if(result === false) {
						throw new Error("an invoke test failed");
					}
				});
			});

		});
	});

	// test to do push only on mathservice
	describe('flow_transferToDraftForOrganization push only', function() {
		// 20 minutes timeout
		this.timeout(12000000);
		
		it('should transfer math service then invoke it', function() {
			// make folder for output
			try{
				fs.statSync(FLOWTESTOUTPUT);
				// exists
			} catch(error) {
				// make
				fs.mkdirSync(FLOWTESTOUTPUT);
			}

			readConfig();
			// override to not publish
			inputOptions.publish = "false";
			// will use the apiIdentifier URL which should have sb in
			inputOptions.publishCatalogs = "";
			// no consumers
			inputOptions.createConsumers="false";

			// set back to downloading all services
			inputOptions.ConsumingVersionsForSLA=allConsumingVersionsForSLA;

			// override xpath to select Math Service 1.0
			inputOptions.BusinessServiceByOwningOrg = "/WSRR/GenericObject[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessCapability') and gep63_capabilityVersions(.)/@bsrURI='9cb8619c-5eea-4ac5.b6a7.fe64e7fea733']";
			inputOptions.ServiceVersionsForBusinessService = "/WSRR/GenericObject[@bsrURI='%s']/gep63_capabilityVersions(.)[@bsrURI='9cb8619c-5eea-4ac5.b6a7.fe64e7fea733']";
			
			wsrrUtils.setWSRRConnectiondetails(inputOptions);
			apimdevportal.setConnectionDetails(inputOptions);

			var productName = null;
			var productVersion = null;
			var planName = null;
			var devOrgId = null;
			var appKey = null;

			// business service bsrURI
			var bsBsrURI = null;
			// service version bsrURI
			var bsrURI = null;
			
			// publish because this has not been done
			return apimCli.setConnectionDetails(inputOptions).then(function() {
				console.log("Pushing Math Service to APIC");
				return flow.transferToDraftForOrganization("Common services", "./" + FLOWTESTOUTPUT, inputOptions, wsrrUtils, apimCli, null);
			}).then(function(result) {
				console.log("Checking results object");

				// examine results
				checkResults(result, true, mathServiceExpectedResults, false);
				// now check again and throw on the first error
				checkResults(result, true, mathServiceExpectedResults, true);
				
				// need to publish the files we know where they are
				ttStorage.setFSRoot("./" + FLOWTESTOUTPUT);
				ttStorage.setProductPerVersion(true);

				console.log("Checking consumers");
				// check consumers for Math Service
				checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumers, false);
				checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumers, true);

				// check Math Service consumers yaml
				checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumersYaml, false);
				checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumersYaml, true);
				
				// run Math Service
				console.log("Testing Math Service");
				return publishAndSubscribeProductAndTest("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", testMathServiceWSDL);
				
			});

		});
	});
	

	// test to do push only on mathservice using transferToDraftForServiceVersion
	describe('flow_transferToDraftForServiceVersion push only', function() {
		// 20 minutes timeout
		this.timeout(12000000);

		it('should transfer math service then invoke it', function() {
			// make folder for output
			try{
				fs.statSync(FLOWTESTOUTPUT);
				// exists
			} catch(error) {
				// make
				fs.mkdirSync(FLOWTESTOUTPUT);
			}

			readConfig();
			// override to not publish
			inputOptions.publish = "false";
			// will use the apiIdentifier URL which should have sb in
			inputOptions.publishCatalogs = "";
			// no consumers
			inputOptions.createConsumers="false";

			// set back to downloading all services
			inputOptions.ServiceVersionsForBusinessService=allServiceVersionsForBusinessService;
			inputOptions.ConsumingVersionsForSLA=allConsumingVersionsForSLA;
			inputOptions.BusinessServiceByOwningOrg=allBusinessServiceByOwningOrg;
			inputOptions.ConsumingVersionsForSLASingleSV=allConsumingVersionsForSLASingleSV;

			wsrrUtils.setWSRRConnectiondetails(inputOptions);
			apimdevportal.setConnectionDetails(inputOptions);

			var productName = null;
			var productVersion = null;
			var planName = null;
			var devOrgId = null;
			var appKey = null;

			// business service bsrURI
			var bsBsrURI = null;
			// service version bsrURI
			var bsrURI = null;
			
			// publish because this has not been done
			return apimCli.setConnectionDetails(inputOptions).then(function() {
				console.log("Pushing Math Service to APIC");
				return flow.transferToDraftForServiceVersion("9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", "./" + FLOWTESTOUTPUT, inputOptions, wsrrUtils, apimCli, null);
			}).then(function(result) {
				console.log("Checking results object");

				// examine results
				checkResults(result, true, mathServiceExpectedResults, false);
				// now check again and throw on the first error
				checkResults(result, true, mathServiceExpectedResults, true);
				
				// need to publish the files we know where they are
				ttStorage.setFSRoot("./" + FLOWTESTOUTPUT);
				ttStorage.setProductPerVersion(true);

				console.log("Checking consumers");
				// check consumers for Math Service
				checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumers, false);
				checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumers, true);

				// check Math Service consumers yaml
				checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumersYaml, false);
				checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumersYaml, true);
				
				// run Math Service
				console.log("Testing Math Service");
				return publishAndSubscribeProductAndTest("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", testMathServiceWSDL);
				
			}).caught(function(error){
				// wait for a bit to get logs!
				return Promise.delay(5000).then(function(){
					throw error;
					
				});
			});

		});
	});

	// test to do push only on mathservice using transferToFileSystemForServiceVersion and pushToDraftFromFileSystem
	describe('flow_transferToFileSystemForServiceVersion pushToDraftFromFileSystem push only', function() {
		// 20 minutes timeout
		this.timeout(12000000);

		var filePath = "flowTestOutput2";
		
		it('should transfer math service then invoke it', function() {
			// make folder for output or clear it
			try{
				fs.statSync(filePath);
				// exists - clear
				console.log("clearing test directory");
				fse.emptyDirSync(filePath);
			} catch(error) {
				// make
				fs.mkdirSync(filePath);
			}

			readConfig();
			// override to not publish
			inputOptions.publish = "false";
			// will use the apiIdentifier URL which should have sb in
			inputOptions.publishCatalogs = "";
			// no consumers
			inputOptions.createConsumers="false";

			// set back to downloading all services
			inputOptions.ServiceVersionsForBusinessService=allServiceVersionsForBusinessService;
			inputOptions.ConsumingVersionsForSLA=allConsumingVersionsForSLA;
			inputOptions.BusinessServiceByOwningOrg=allBusinessServiceByOwningOrg;
			inputOptions.ConsumingVersionsForSLASingleSV=allConsumingVersionsForSLASingleSV;

			wsrrUtils.setWSRRConnectiondetails(inputOptions);
			apimdevportal.setConnectionDetails(inputOptions);

			var productName = null;
			var productVersion = null;
			var planName = null;
			var devOrgId = null;
			var appKey = null;

			// business service bsrURI
			var bsBsrURI = null;
			// service version bsrURI
			var bsrURI = null;
			
			return apimCli.setConnectionDetails(inputOptions).then(function() {
				console.log("Pushing Math Service to file system");
				// first capture to file system
				return flow.transferToFileSystemForServiceVersion("9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", "./" + filePath, inputOptions, wsrrUtils, apimCli);
			}).then(function(result) {
				
				console.log("Checking results object");

				// examine results
				checkResults(result, true, mathServiceCaptureExpectedResults, false);
				// now check again and throw on the first error
				checkResults(result, true, mathServiceCaptureExpectedResults, true);
				
				// need to publish the files we know where they are
				ttStorage.setFSRoot("./" + filePath);
				ttStorage.setProductPerVersion(true);

				console.log("Checking consumers");
				// check consumers for Math Service
				checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumers, false);
				checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumers, true);

				// check Math Service consumers yaml
				checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumersYaml, false);
				checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumersYaml, true);

				// now run push to APIC from file system
				console.log("Pushing to APIC");
				return flow.pushToDraftFromFileSystem(filePath, inputOptions, apimCli);
			}).then(function(result) {
				
				// examine results
				checkResults(result, true, mathServicePushExpectedResults, false);
				// now check again and throw on the first error
				checkResults(result, true, mathServicePushExpectedResults, true);

				// run Math Service
				console.log("Testing Math Service");
				return publishAndSubscribeProductAndTest("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", testMathServiceWSDL);
				
			}).caught(function(error){
				// wait for a bit to get logs!
				return Promise.delay(5000).then(function(){
					throw error;
					
				});
			});

		});
	});

	// test to do push only on mathservice
	describe('flow_transferToFileSystemForOrganization pushToDraftFromFileSystem push only', function() {
		// 20 minutes timeout
		this.timeout(12000000);

		var filePath = "flowTestOutput2";

		it('should transfer math service then invoke it', function() {
			// make folder for output or clear it
			try{
				fs.statSync(filePath);
				// exists - clear
				console.log("clearing test directory");
				fse.emptyDirSync(filePath);
			} catch(error) {
				// make
				fs.mkdirSync(filePath);
			}

			readConfig();
			// override to not publish
			inputOptions.publish = "false";
			// will use the apiIdentifier URL which should have sb in
			inputOptions.publishCatalogs = "";
			// no consumers
			inputOptions.createConsumers="false";

			// set back to downloading all services
			inputOptions.ConsumingVersionsForSLA=allConsumingVersionsForSLA;

			// override xpath to select Math Service 1.0
			inputOptions.BusinessServiceByOwningOrg = "/WSRR/GenericObject[classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessCapability') and gep63_capabilityVersions(.)/@bsrURI='9cb8619c-5eea-4ac5.b6a7.fe64e7fea733']";
			inputOptions.ServiceVersionsForBusinessService = "/WSRR/GenericObject[@bsrURI='%s']/gep63_capabilityVersions(.)[@bsrURI='9cb8619c-5eea-4ac5.b6a7.fe64e7fea733']";
			
			wsrrUtils.setWSRRConnectiondetails(inputOptions);
			apimdevportal.setConnectionDetails(inputOptions);

			var productName = null;
			var productVersion = null;
			var planName = null;
			var devOrgId = null;
			var appKey = null;

			// business service bsrURI
			var bsBsrURI = null;
			// service version bsrURI
			var bsrURI = null;
			
			// publish because this has not been done
			return apimCli.setConnectionDetails(inputOptions).then(function() {
				console.log("Pushing Math Service to APIC");
				return flow.transferToFileSystemForOrganization("Common services", "./" + filePath, inputOptions, wsrrUtils, apimCli);
			}).then(function(result) {
				console.log("Checking results object");

				// examine results
				checkResults(result, true, mathServiceCaptureExpectedResults, false);
				// now check again and throw on the first error
				checkResults(result, true, mathServiceCaptureExpectedResults, true);
				
				// need to publish the files we know where they are
				ttStorage.setFSRoot("./" + filePath);
				ttStorage.setProductPerVersion(true);

				console.log("Checking consumers");
				// check consumers for Math Service
				checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumers, false);
				checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumers, true);

				// check Math Service consumers yaml
				checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumersYaml, false);
				checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", expectedMathServiceConsumersYaml, true);

				// now run push to APIC from file system
				console.log("Pushing to APIC");
				return flow.pushToDraftFromFileSystem(filePath, inputOptions, apimCli);
			}).then(function(result) {

				// examine results
				checkResults(result, true, mathServicePushExpectedResults, false);
				// now check again and throw on the first error
				checkResults(result, true, mathServicePushExpectedResults, true);

				// run Math Service
				console.log("Testing Math Service");
				return publishAndSubscribeProductAndTest("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", testMathServiceWSDL);
				
			});

		});
	});
	

/*
	describe.skip('flow_transferToDraftForOrganization2', function() {
		// 10 minutes timeout
		this.timeout(600000);

		it('tests consumers for existing transferred data', function() {
			
			readConfig();
			wsrrUtils.setWSRRConnectiondetails(inputOptions);
			apimdevportal.setConnectionDetails(inputOptions);
			
			// need to publish the files we know where they are
			ttStorage.setFSRoot("./flowTestOutput");
			ttStorage.setProductPerVersion(true);

			console.log("Checking consumers");
			// check consumers for Math Service
			checkAllConsumers();
			// check consumers yaml
			checkAllConsumersYaml();

		});
	});
*/
	describe('flow_transferToFileSystemForWSDL', function() {
		// 10 minutes timeout
		this.timeout(600000);

		var filePath = "flowTestOutput2";

		it('tests transfer for two WSDLs', function() {

			var wsdlExpected = {
						    "success": true,
						    "details": [
						      {
						        "name": "MathServerService",
						        "version": "1.0.0",
						        "description": "",
						        "bsrURI": "wsdl1",
						        "success": true,
						        "versions": [
						          {
						            "name": "MathServerService",
						            "version": "1.0.0",
						            "description": "",
						            "bsrURI": "wsdl1",
						            "success": true,
						            "productName": "",
						            "productVersion": "",
						            "captureAttempted": true,
						            "captureSuccess": true,
						            "pushAttempted": false,
						            "pushSuccess": false,
						            "publishAttempted": false,
						            "publishSuccess": false,
						            "consumersAttempted": false,
						            "consumersSuccess": false,
									catalogConsumersDone: {},
									catalogs: []
						          }
						        ]
						      },
						      {
						        "name": "TestService",
						        "version": "1.0.0",
						        "description": "",
						        "bsrURI": "wsdl2",
						        "success": true,
						        "versions": [
						          {
						            "name": "TestService",
						            "version": "1.0.0",
						            "description": "",
						            "bsrURI": "wsdl2",
						            "success": true,
						            "productName": "",
						            "productVersion": "",
						            "captureAttempted": true,
						            "captureSuccess": true,
						            "pushAttempted": false,
						            "pushSuccess": false,
						            "publishAttempted": false,
						            "publishSuccess": false,
						            "consumersAttempted": false,
						            "consumersSuccess": false,
									catalogConsumersDone: {},
									catalogs: []
						          }
						        ]
						      }
						    ]
						};
			var wsdl = require('../lib/wsdl');

			var testFolder = "wsdlTestOutput";
			try{
				fs.statSync(testFolder);
			} catch(error) {
				// make the dir in case the error was that the folder does not exist
				fs.mkdirSync(testFolder);
			}
			// make folder for output or clear it
			try{
				fs.statSync(filePath);
				// exists - clear
				console.log("clearing test directory");
				fse.emptyDirSync(filePath);
			} catch(error) {
				// make
				fs.mkdirSync(filePath);
			}

			// write test data
			var wsdl1 = "wsdl1";
			var wsdl2 = "wsdl2";

			removeDirectory(testFolder + "/" + wsdl1, "xsd");
			removeDirectory(testFolder, wsdl1);
			removeDirectory(testFolder, wsdl2);
			try {
				fs.mkdirSync(testFolder + "/" + wsdl1);
				fs.mkdirSync(testFolder + "/" + wsdl2);
				fs.mkdirSync(testFolder + "/" + wsdl2 + "/xsd");
			}catch(e){
				// ignore exists
			}
			
			console.log("Writing test data");
			
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerService_EP1.wsdl", testData.mathServerService_EP1);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerBinding.wsdl", testData.mathServerBinding);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerInterface_InlineSchema1.xsd", testData.mathServerInterface_InlineSchema1);
			fs.writeFileSync(testFolder + "/" + wsdl1 + "/" + "MathServerInterface.wsdl", testData.mathServerInterface);

			fs.writeFileSync(testFolder + "/" + wsdl2 + "/" + "AccountCreationProductionService.wsdl", testData.AccountCreationProductionService);
			fs.writeFileSync(testFolder + "/" + wsdl2 + "/" + "AccountCreationInterface.wsdl", testData.AccountCreationInterface);
			fs.writeFileSync(testFolder + "/" + wsdl2 + "/xsd/" + "AccountCreationSchema.xsd", testData.AccountCreationSchema);

			// metadata will override swagger title in the API Yaml
			var metadata = new Buffer("info:" + os.EOL + "  version: '1.0.0'" + os.EOL + "  title: 'TestService'", "utf8");
			fs.writeFileSync(testFolder + "/" + wsdl2 + "/" + "metadata.yaml", metadata);
			
			wsdl.initialize(testFolder);
			
			readConfig();

			// override to not publish
			inputOptions.publish = "false";
			// will use the apiIdentifier URL which should have sb in
			inputOptions.publishCatalogs = "";
			// no consumers
			inputOptions.createConsumers="false";

			// need to publish the files we know where they are
			ttStorage.setFSRoot("./" + filePath);
			ttStorage.setProductPerVersion(true);

			console.log("Doing WSDL");

			// set template to WSDL one
			inputOptions.template_PRODUCT_WSDL = "./templates/productWsdl.yaml";
			
			// offline transfer so no log into APIC
			return flow.transferToFileSystemForWSDL("./" + filePath, inputOptions, wsdl, apimCli).then(function(results){
				// done
				var resData = results.getResults();
				
				resData.should.deep.equal(wsdlExpected);
				//console.log(JSON.stringify(results, null, "  "));

				// initialise APIC library
				return apimCli.setConnectionDetails(inputOptions);
			}).then(function(){
				
				// now push these to APIC to prove the data is ok
				console.log("Pushing to APIC");
				
				return flow.pushToDraftFromFileSystem("./" + filePath, inputOptions, apimCli);
			}).then(function(result) {
	
				// just log
//				console.log(JSON.stringify(result, null, "  "));
				
			});
		});
	});

	// test to do push publish consumer create on mathservice using transferToDraftForServiceVersion
	describe('flow_transferToDraftForServiceVersion push publish consumer', function() {
		// 20 minutes timeout
		this.timeout(12000000);

		it('should transfer math service, publish and create consumers then invoke it', function() {
			// make folder for output
			try{
				fs.statSync(FLOWTESTOUTPUT);
				// exists
			} catch(error) {
				// make
				fs.mkdirSync(FLOWTESTOUTPUT);
			}

			// math service has a consumer "Math Application" 1.0 with consumer ID "ASCV0001"
			
			readConfig();
			// override to publish
			inputOptions.publish = "true";
			// will use the apiIdentifier URL which should have sb in
			inputOptions.publishCatalogs = "sb";

			// set back to downloading all services
			inputOptions.ServiceVersionsForBusinessService=allServiceVersionsForBusinessService;
			inputOptions.ConsumingVersionsForSLA=allConsumingVersionsForSLA;
			inputOptions.BusinessServiceByOwningOrg=allBusinessServiceByOwningOrg;
			inputOptions.ConsumingVersionsForSLASingleSV=allConsumingVersionsForSLASingleSV;
				
			// override to create consumers
			inputOptions.createConsumers = "true";
			// map of dev org id
			inputOptions.apiDeveloperOrgName_sb = DEVORG_NAME;
			
			wsrrUtils.setWSRRConnectiondetails(inputOptions);
			apimdevportal.setConnectionDetails(inputOptions);

			var productName = null;
			var productVersion = null;
			var planName = null;
			var devOrgId = null;
			var appKey = "ASCV0001";

			// business service bsrURI
			var bsBsrURI = null;
			// service version bsrURI
			var bsrURI = null;
			
			// need to clear out the consumers in the dev portal if any exist
			return apimCli.setConnectionDetails(inputOptions).then(function() {
				return clearConsumers("mathservice", "1.0", DEVORG_NAME, apimdevportal);
			}).then(function(){
				console.log("Pushing Publishing Creating Consumers for Math Service to APIC");
				return flow.transferToDraftForServiceVersion("9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", "./" + FLOWTESTOUTPUT, inputOptions, wsrrUtils, apimCli, apimdevportal);
			}).then(function(result) {
				console.log("Checking results object");
				var newExpected = _.cloneDeep(mathServiceExpectedResults);
				newExpected[0].versions[0].publishAttempted = true;
				newExpected[0].versions[0].publishSuccess = true;
				newExpected[0].versions[0].consumersAttempted = true;
				newExpected[0].versions[0].consumersSuccess = true;
				newExpected[0].versions[0].catalogs = ["sb"];
				newExpected[0].versions[0].catalogConsumersDone = {
					sb: {
						created: ["1", "2", "3", "4"],
						updated: [],
						subscriptionsAdded: [
						                     {subID: "a", appID: "1"},
						                     {subID: "b", appID: "2"},
						                     {subID: "c", appID: "3"},
						                     {subID: "d", appID: "4"}
						                     ],
						subscriptionsDeleted: [],
						appIDToName: {
							"1": "Math Mobile App (24a42024-0eb6-4658.93f5.de9af6def5de)",
							"2": "Math service consumer (5d03bc5d-f2ee-4e80.9d22.7c31627c2220)",
							"3": "Math Application (8ea74a8e-f207-47ce.b3d0.af7232afd0d5)",
							"4": "Math Service Gold (69136469-060d-4d0a.83dc.d3a0a5d3dcd9)"
						}
					}
				};
				
				// examine results and set consumers to true
				checkResults(result, true, newExpected, false, true);
				// now check again and throw on the first error
				checkResults(result, true, newExpected, true, true);
				
				// need to publish the files we know where they are
				ttStorage.setFSRoot("./" + FLOWTESTOUTPUT);
				ttStorage.setProductPerVersion(true);

				console.log("Checking consumers");
				// check consumers for Math Service - SV mode gets all consumers irrespective of owning org
				checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumers, false);
				checkConsumers("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumers, true);

				// check Math Service consumers yaml - SV mode gets all consumers irrespective of owning org
				checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumersYaml, false);
				checkConsumersYaml("0f94240f-cfff-4f86.8ed3.a12b21a1d37e", "9cb8619c-5eea-4ac5.b6a7.fe64e7fea733", allExpectedMathServiceConsumersYaml, true);
				
				// TODO: check consumers have been created against what is returned
				
				// run Math Service directly using API key which proves we created one consumer
				console.log("Testing Math Service");
				return testMathServiceWSDL(appKey);
				
			}).caught(function(error){
				// wait for a bit to get logs!
				return Promise.delay(10000).then(function(){
					throw error;
					
				});
			});

		});
	});
	
});
