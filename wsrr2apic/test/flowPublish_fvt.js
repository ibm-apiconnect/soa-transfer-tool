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
// Run these using "npm test"

var should = require('chai').should();

var flow = require('../lib/flow');
var flowPublish = require('../lib/flowPublish');
var logger = require('../lib/Logger');
var _ = require('lodash');
var fakeModule = require('./fakeModule');
var realapiccli = require('../lib/apimcli');
var Promise = require('bluebird');

// FVT tests for flow but run in the unit test bucket
describe('unittests_fvt_flowPublish', function(){
	before(function(done){
		logger.initialize(function() {
			done();
		});		
	});

	this.timeout(10000);

	var bsBsrURI = "a";
	var bsrURI = "b";
	var productDetails = {
		productName: "product",
		productVersion: "1.0.0."
	};

	var catalog = "sb";
	var space = "space";
	var catalogToSpace = {};
	catalogToSpace[catalog] = space;

	var catalog2 = "production";
	var space2 = "space2";
	var catalogToSpace2 = {};
	catalogToSpace2[catalog] = space;
	catalogToSpace2[catalog2] = space2;
	var catalog3 = "qa";

	describe('publishProductToCatalogs', function(){
		
		// publish to single catalog no space
		it('publish to single catalog no space', function(){
			
			var apicCli = fakeModule.create(realapiccli);

			apicCli.fakeModule_addExpected(["getPublishCatalogs"], [catalog], false);
			apicCli.fakeModule_addExpected(["getCatalogToSpace"], {}, false);
			apicCli.fakeModule_addExpected(["publishFromDrafts", productDetails.productName, productDetails.productVersion, catalog, ".", undefined], null, true);
			
			var ret = flowPublish.publishProductToCatalogs(bsBsrURI, bsrURI, productDetails, apicCli).then(function(catalogsDone){
				apicCli.fakeModule_done();
				
				catalogsDone.should.deep.equal([catalog]);
			});
			return ret;
		});
		
		// publish to single catalog with a space
		it('publish to single catalog with a space', function(){
			
			var apicCli = fakeModule.create(realapiccli);

			apicCli.fakeModule_addExpected(["getPublishCatalogs"], [catalog], false);
			apicCli.fakeModule_addExpected(["getCatalogToSpace"], catalogToSpace, false);
			apicCli.fakeModule_addExpected(["publishFromDrafts", productDetails.productName, productDetails.productVersion, catalog, ".", space], null, true);
			
			var ret = flowPublish.publishProductToCatalogs(bsBsrURI, bsrURI, productDetails, apicCli).then(function(catalogsDone){
				apicCli.fakeModule_done();
				
				catalogsDone.should.deep.equal([catalog]);
			});
			return ret;
		});
		
		// publish to multiple catalogs some with spaces and some without
		it('publish to multiple catalogs some with spaces and some without', function(){

			var apicCli = fakeModule.create(realapiccli);

			apicCli.fakeModule_addExpected(["getPublishCatalogs"], [catalog, catalog2, catalog3], false);
			apicCli.fakeModule_addExpected(["getCatalogToSpace"], catalogToSpace2, false);
			apicCli.fakeModule_addExpected(["publishFromDrafts", productDetails.productName, productDetails.productVersion, catalog, ".", space], null, true);
			apicCli.fakeModule_addExpected(["publishFromDrafts", productDetails.productName, productDetails.productVersion, catalog2, ".", space2], null, true);
			apicCli.fakeModule_addExpected(["publishFromDrafts", productDetails.productName, productDetails.productVersion, catalog3, ".", undefined], null, true);
			
			var ret = flowPublish.publishProductToCatalogs(bsBsrURI, bsrURI, productDetails, apicCli).then(function(catalogsDone){
				apicCli.fakeModule_done();
				
				catalogsDone.should.deep.equal([catalog, catalog2, catalog3]);
			});
			return ret;
		});

		
		// error during one publish, unpublishes (note when error it does not return what was done)
		it('error during one publish, unpublishes', function(done){

			var apicCli = fakeModule.create(realapiccli);

			apicCli.fakeModule_addExpected(["getPublishCatalogs"], [catalog, catalog2, catalog3], false);
			apicCli.fakeModule_addExpected(["getCatalogToSpace"], catalogToSpace2, false);
			apicCli.fakeModule_addExpected(["publishFromDrafts", productDetails.productName, productDetails.productVersion, catalog, ".", space], null, true);
			apicCli.fakeModule_addExpected(["publishFromDrafts", productDetails.productName, productDetails.productVersion, catalog2, ".", space2], null, true);
			// error publishing to catalog3
			var error3 = new Error("Expected error to catalog3");
			apicCli.fakeModule_addExpected(["publishFromDrafts", productDetails.productName, productDetails.productVersion, catalog3, ".", undefined], error3, true);
			// rollbacks
			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog, space], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog, space], null, true);			
			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog2, space2], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog2, space2], null, true);			
						
			var ret = flowPublish.publishProductToCatalogs(bsBsrURI, bsrURI, productDetails, apicCli).then(function(){
				done("Expected error");
				
			}).caught(function(error){
				apicCli.fakeModule_done();
				
				done();
			});
			return ret;
		});
		
	});
	
	describe('removeFromCatalogs', function() {
		
		// remove from single catalog no space
		it('remove from single catalog no space', function(){
			
			var apicCli = fakeModule.create(realapiccli);

			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog, undefined], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog, undefined], null, true);			
			
			var ret = flowPublish.removeFromCatalogs(productDetails, [catalog], {}, apicCli).then(function(){
				apicCli.fakeModule_done();
			});
			return ret;
		});
		
		// remove from single catalog with space
		it('remove from single catalog with space', function(){
			
			var apicCli = fakeModule.create(realapiccli);

			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog, space], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog, space], null, true);			
			
			var ret = flowPublish.removeFromCatalogs(productDetails, [catalog], catalogToSpace, apicCli).then(function(){
				apicCli.fakeModule_done();
			});
			return ret;
		});
		
		// remove from multiple catalogs with mix of space and no space
		it('remove from multiple catalogs with mix of space and no space', function(){
			
			var apicCli = fakeModule.create(realapiccli);

			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog, space], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog, space], null, true);			
			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog3, undefined], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog3, undefined], null, true);			
			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog2, space2], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog2, space2], null, true);			
			
			var ret = flowPublish.removeFromCatalogs(productDetails, [catalog, catalog3, catalog2], catalogToSpace2, apicCli).then(function(){
				apicCli.fakeModule_done();
			});
			return ret;
		});
		
		// error happens during remove on one, ignores (note when error it does not return what was done)
		it('error happens during product set on one, ignores', function(){
			
			var apicCli = fakeModule.create(realapiccli);

			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog, space], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog, space], null, true);
			// error on set for second catalog
			var errorSet = new Error("Expected error on product set");
			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog3, undefined], errorSet, true);
			
			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog2, space2], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog2, space2], null, true);
			
			var ret = flowPublish.removeFromCatalogs(productDetails, [catalog, catalog3, catalog2], catalogToSpace2, apicCli).then(function(){
				apicCli.fakeModule_done();
			});
			return ret;
		});
		
		it('error happens during product delete on one, ignores', function(){
			
			var apicCli = fakeModule.create(realapiccli);

			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog, space], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog, space], null, true);			
			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog3, undefined], null, true);
			// error on delete
			var errorDelete = new Error("Expected error on product delete");
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog3, undefined], errorDelete, true);
			
			apicCli.fakeModule_addExpected(["productsSet", productDetails.productName, productDetails.productVersion, "retired", catalog2, space2], null, true);
			apicCli.fakeModule_addExpected(["productsDelete", productDetails.productName, productDetails.productVersion, catalog2, space2], null, true);			
			
			var ret = flowPublish.removeFromCatalogs(productDetails, [catalog, catalog3, catalog2], catalogToSpace2, apicCli).then(function(){
				apicCli.fakeModule_done();
			});
			return ret;
		});
		
	});
	
});