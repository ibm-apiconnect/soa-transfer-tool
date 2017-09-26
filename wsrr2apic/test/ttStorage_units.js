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
 * Unit tests for ttStorage.
 * 
 */

var should = require('chai').should();

var ttStorage = require('../lib/ttStorage');

describe('unittests_ttStorage', function(){
	var testFolder = "ttStorageTestOutput";
	var bs = "businessService";
	var sv = "serviceVersion";

	describe('getWSDLPath', function() {
		
		it('should get WSDL path for BS and SV', function() {
			ttStorage.setFSRoot(testFolder);

			var wsdlPath = ttStorage.getWSDLPath(bs, sv, true);
			
			wsdlPath.should.equal(testFolder + "/" + bs + "/" + sv + "/" + sv + "_wsdls.zip");
		});

		//TODO: for when productPerVersion is false
	});

	describe('getWSDLZipName', function() {
		
		it('should get WSDL name for BS and SV', function() {
			ttStorage.setFSRoot(testFolder);

			var wsdlPath = ttStorage.getWSDLZipName(bs, sv);

			// just uses version bsrUri anyway
			wsdlPath.should.equal(sv + "_wsdls.zip");
		});

		//TODO: for when productPerVersion is false
	});

	describe('getProductPath', function() {
		
		it('should get path for BS and SV', function() {
			ttStorage.setFSRoot(testFolder);

			var path = ttStorage.getProductPath(bs, sv);
			
			path.should.equal(testFolder + "/" + bs + "/" + sv + "/product.yaml");
		});

		//TODO: when productperversion is false
	});
	
});
