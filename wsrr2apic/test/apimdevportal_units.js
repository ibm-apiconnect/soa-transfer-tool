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

var should = require('chai').should(),
expect = require('chai').expect;

var apimdevportal = require('../lib/apimdevportal'), Promise = require('bluebird'), _ = require('lodash');

// fvt tests for apim portal API - visually inspect
describe('unittests_apimdevportal_units', function() {

	var options = {
		apiUsername: "seager@uk.ibm.com",
		apiPassword: "password",
		apiDeveloperUsername: "username",
		apiDeveloperPassword: "password",
		apiDeveloperOrgName: "wsrrdev",
		apiVersion: "5.0.0.0",
		apiIdentifier: "apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb"
	};
	
	describe('setConnectionDetails', function() {
		it('sets connection details', function() {
			var inputOptions = _.clone(options);

			apimdevportal.setConnectionDetails(inputOptions);
		});

		it('errors if missing connection details', function() {
			var inputOptions = _.clone(options);
			
			// remove something 
			delete inputOptions.apiDeveloperOrgName;

			try {
				apimdevportal.setConnectionDetails(inputOptions);
				
				throw new Error("should have gotten an error");
			}catch (e) {
				// expected
			}
		});
	});

});
