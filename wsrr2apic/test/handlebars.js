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
// Run these using "./node_modules/.bin/mocha --reporter spec --grep handlebars"

var should = require('chai').should();
var Handlebars = require('handlebars');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var url = require('url');

var wsrrUtils = require('../lib/WSRR/wsrrUtils');

// unit tests in here
describe('handlebars', function(){

	/*
	 * Test handle bars.
	 * 
	 * The template has to know where to find the version, slds and endpoint, and at the moment
	 * they are arrays in the test. So thats ok but in certain modes will they be single entry
	 * and so should not be arrays? Also for the product template you will need one thing but
	 * for the API template another:
	 * 
	 *  - one Product per SV - only one version on the service for product and API
	 *  - one Product per BS - multiple versions on the service for product, just the current version for API
	 *  - one Product per App - erm we don't have the app at the moment, will need to grab it, but it will be one version
	 * 
	 * So for the product template and API template we can pass just the current version in. 
	 * 
	 *  Just version on the data for the API, array for the Product, so there is no need to put .0. everywhere for the API template.
	 *  But then just leave versions in there for the API and also have .version as the current one. 
	 *  
	 * For the SLDs this implies multiple plans so we need them all. For the endpoints that's harder cos you cannot
	 * have endpoint per plan, so we'd just take the first one. Well put them all onto the data and the template will
	 * take the first one. Or they can write some custom handler if they want to do special stuff.
	 * 
	 * For product template we need the api(s) yaml name... which not sure how we are generating them
	 * so maybe we pass in an array with them in? Or can we figure them out?
	 * 
	 * If one Product per SV best use the bsrURI of the SV, there will be one SV.
	 * If one Product per BS there will be many SVs, so again use the bsrURI of the SVs.
	 * If one Product per App, not sure.
	 * For the bsrURI these are available on versions or version.
	 * 
	 * So you need to have a different product template for one Product per SV rather than one Product per BS.
	 */
// stuffs!
describe('_test_handlebars', function() {
	  this.timeout(30000);
	  it('generates swagger', function(done) {

		  // register helpers for "host" and "path"
		  Handlebars.registerHelper("host", function(data){
			  // lets you do: host: {{host versions.0.slds.0.endpoints.0.properties.name}}
			  // call with URL, strip the host out
			  var theUrl = url.parse(data);
			  return theUrl.host;
		  });
		  Handlebars.registerHelper("path", function(data){
			  // lets you do: basePath: {{path versions.0.slds.0.endpoints.0.properties.name}}
			  // call with URL, strip the path out
			  var theUrl = url.parse(data);
			  return theUrl.pathname;
		  });
		  Handlebars.registerHelper("apimName", function(data){
			  // lets you do: name: {{apimName properties.name}}
			  // change spaces to minuses
			  var replaced = "";
			  if(data) {
				  replaced = data.replace(/ /g, "-");
			  }
			  return replaced;
		  });
		  Handlebars.registerHelper("debug", function(data){
			  // lets you do: {{debug endpoints}} 
			  // and get this and also whatever endpoints is out to the console. 
			 console.log("Current:");
			 console.log(this);
			 if(data){
				 console.log("Data:");
				 console.log(data);
			 }
		  });
		  
		  // pull test b service
		  var overallData = {};
		  var promise = wsrrUtils.runGraphQuery("//GenericObject[@name='Catalog Search' and @primaryType='http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService']");
		  promise.then(function(data) {
				// if data then ok
			  	console.log("BUSINESS SERVICE");
				console.dir(data);
				// store on top level
				overallData = data[0];
				// run find versions
				var bsrURI = overallData.bsrURI;
				return wsrrUtils.runGraphQuery("//GenericObject[@bsrURI='" + bsrURI + "']/gep63_capabilityVersions(.)");
		  })
		  .then(function(data) {
			  // got back versions
			  console.log("VERSIONS");
			  console.dir(data);
			  // add to top level
			  overallData.versions = data;

			  // for API we will call with just one version, so grab the first one.
			  // obviously when done properly this will be called in a loop with each version set.
			  overallData.version = overallData.versions[0];
			  
			  // for the first version grab the SLDs
			  // not sure how to handle many versions, some Promise trickery probably
			  var len = overallData.versions.length;
			  var promiseArray = [];
			  if(len > 0) {
				  var version = overallData.versions[0];
				  return wsrrUtils.runGraphQuery("//GenericObject[@bsrURI='" + version.bsrURI + "']/gep63_provides(.)");
			  }
		  })
		  .then(function(slds) {
			  console.log("SLDs");
			  console.dir(slds);
			  
			  overallData.versions[0].slds = slds;
			  
			  // get endpoints for the first SLD. Again not sure how to get them for all.
			  var sldLen = slds.length;
			  if(sldLen > 0) {
				  var sld = slds[0];
				  return wsrrUtils.runGraphQuery("//GenericObject[@bsrURI='" + sld.bsrURI + "']/gep63_availableEndpoints(.)");
			  }
		  })
		  .then(function(endpoints){
			  console.log("ENDPOINTS");
			  console.dir(endpoints);
			  
			  overallData.versions[0].slds[0].endpoints = endpoints;
			
			  console.log("");
			  console.log("DATA:");
			  console.log(JSON.stringify(overallData, null, 4));
			  // now do some handlebars magics with the overallData and a swagger template
			  // because handlebars can have custom code to do funky stuff which we may need
			  
			  // read in swagger template
			  return fs.readFileAsync('test/swagger.template.yaml', 'utf-8');
		  }).
		  then(function(fileData){
			  // file data
			  var template = Handlebars.compile(fileData);
			  var result = template(overallData);
			  // write
			  return fs.writeFile("test/swagger.out.yaml", result);
		  })
		  .then(function(){
			  // read in product template
			  return fs.readFileAsync('test/product.template.yaml', 'utf-8');
		  })
		  .then(function(fileData){
			  // file data
			  var template = Handlebars.compile(fileData);
			  var result = template(overallData);
			  // write
			  return fs.writeFile("test/product.out.yaml", result);
		  })
		  .then(function(){
			  // done
			  
			  done();
		  })
		  .catch(function(error){
			  done(error);
		  })
		  ;
			
			
	  });
});

});