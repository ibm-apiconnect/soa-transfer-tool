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
// Run these using "./node_modules/.bin/mocha --reporter spec --grep apimcli_units"

var should = require('chai').should();
var expect = require('chai').expect;
var _ = require('lodash');
var apimcli = require('../lib/apimcli');
var apicUrlUtils = require('../lib/APIC/apicUrlUtils');

describe('unittests_apimcli_units', function(){

describe('setConnectionDetails', function() {
	var options = {
			apiUsername: "seager@uk.ibm.com",
			apiPassword: "password",
			apiDeveloperUsername: "username",
			apiDeveloperPassword: "password",
			apiDeveloperOrgName: "wsrrdev",
			apiDeveloperHost: "wsrrdev.hursley.ibm.com",
			apiVersion: "5.0.0.0",
			apiIdentifier: "apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb"
		};
	
	  it('throws when missing connection details', function() {
			var inputOptions = _.clone(options);
			delete inputOptions.apiUsername;

			try {
				apimcli.setConnectionDetails(inputOptions);
				throw new Error("Should have thrown");
			}catch(e) {
				// expected
			}
	  });

});

describe('getDefaultCatalog', function() {
	var options = {
			apiUsername: "seager@uk.ibm.com",
			apiPassword: "password",
			apiDeveloperUsername: "username",
			apiDeveloperPassword: "password",
			apiDeveloperOrgName: "wsrrdev",
			apiDeveloperHost: "wsrrdev.hursley.ibm.com",
			apiVersion: "5.0.0.0",
			apiIdentifier: "apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb"
		};
	
	  it('gets the catalog from configuration', function() {
			apimcli.setConnectionDetails(options, true);
			var catalog = apimcli.getDefaultCatalog();
			catalog.should.equal("sb");
	  });
});

describe('_test_obfuscateSensitiveData', function() {
	  this.timeout(15000);
	  it('obfuscates password', function() {
		  // test with command line
		  var ret = apimcli._test_obfuscateSensitiveData("--password goats");
		  ret.should.equal("--password *****");
	  });
	  it('obfuscates password with long command', function() {
		  // test with command line
		  var ret = apimcli._test_obfuscateSensitiveData("apic login --username seager --password goats --server apimdev1248.hursley.ibm.com");
		  ret.should.equal("apic login --username seager --password ***** --server apimdev1248.hursley.ibm.com");
	  });

});

describe('getHostFromApicUrl', function() {
	  this.timeout(15000);
	  it('gets host', function() {
		  var ret = apicUrlUtils.getHostFromApicUrl("apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb");
		  ret.should.equal("apimdev1248.hursley.ibm.com");
	  });
	  it('returns null if nothing host', function() {
		  var ret = apicUrlUtils.getHostFromApicUrl("");
		  expect(ret).to.equal(null);
	  });

});

describe('getPortFromApicUrl', function() {
	  this.timeout(15000);
	  it('gets port', function() {
		  var ret = apicUrlUtils.getPortFromApicUrl("apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb");
		  expect(ret).to.equal(null);
	  });
	  it('gets port', function() {
		  var ret = apicUrlUtils.getPortFromApicUrl("apic-catalog://apimdev1248.hursley.ibm.com:9443/orgs/wsrrdev/catalogs/sb");
		  ret.should.equal("9443");
	  });
	  it('returns null if nothing host', function() {
		  var ret = apicUrlUtils.getPortFromApicUrl("");
		  expect(ret).to.equal(null);
	  });

});

describe('getPOrgFromApicUrl', function() {
	  this.timeout(15000);
	  it('gets pOrg', function() {
		  var ret = apicUrlUtils.getPOrgFromApicUrl("apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb");
		  ret.should.equal("wsrrdev");
	  });
	  it('returns null if no pOrg', function() {
		  var ret = apicUrlUtils.getPOrgFromApicUrl("");
		  expect(ret).to.equal(null);
	  });

});

describe('getCatalogFromApicUrl', function() {
	  this.timeout(15000);
	  it('gets pOrg', function() {
		  var ret = apicUrlUtils.getCatalogFromApicUrl("apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb");
		  ret.should.equal("sb");
	  });
	  it('returns null if no pOrg', function() {
		  var ret = apicUrlUtils.getCatalogFromApicUrl("");
		  expect(ret).to.equal(null);
	  });

});


describe('_test_extractCreateResults', function() {
	  this.timeout(15000);
	  it('gets details correctly', function() {
		  var ret = apimcli._test_extractCreateResults("Created basicservice.yaml API definition [basicservice:1.0.0]");
		  ret.should.have.property("yamlName", "basicservice.yaml");
		  ret.should.have.property("xIBMName", "basicservice");
		  ret.should.have.property("version", "1.0.0");
	  });

	  it('gets details correctly with yaml in the name', function() {
		  var ret = apimcli._test_extractCreateResults("Created byaml.yaml API definition [byaml:1.0.0]");
		  ret.should.have.property("yamlName", "byaml.yaml");
		  ret.should.have.property("xIBMName", "byaml");
		  ret.should.have.property("version", "1.0.0");
	  });
	  
	  it('gets details correctly when file already exists', function() {
		  // CLI will add -1 to the file name if the file it wants to make exists
		  var ret = apimcli._test_extractCreateResults("Created basicservice-1.yaml API definition [basicservice:1.0.0]");
		  ret.should.have.property("yamlName", "basicservice-1.yaml");
		  ret.should.have.property("xIBMName", "basicservice");
		  ret.should.have.property("version", "1.0.0");
	  });

	  it('gets details correctly with line break', function() {
		  var ret = apimcli._test_extractCreateResults("Created basicservice.yaml API definition [basicservice:1.0.0]\n");
		  ret.should.have.property("yamlName", "basicservice.yaml");
		  ret.should.have.property("xIBMName", "basicservice");
		  ret.should.have.property("version", "1.0.0");
	  });
	  it('gets details correctly when given mutliple files createed',function(){
		 var ret = apimcli._test_extractCreateResults("Created accountcreationservice-from-accountcreationproductionservicewsdl.yaml API definition [accountcreationservice-from-accountcreationproductionservicewsdl:1.0.0]\nCreated accountcreationservice-from-accountcreationproductionservice2wsdl.yaml API definition [accountcreationservice-from-accountcreationproductionservice2wsdl:1.0.0]\nCreated accountcreationservice-from-accountcreationstagingendpointwsdl.yaml API definition [accountcreationservice-from-accountcreationstagingendpointwsdl:1.0.0]");
		 ret.should.have.property("yamlName", "accountcreationservice-from-accountcreationproductionservicewsdl.yaml");
		  ret.should.have.property("xIBMName", "accountcreationservice-from-accountcreationproductionservicewsdl");
		  ret.should.have.property("version", "1.0.0");
	  });

});

describe('getPublishMode', function() {
	var options = {
			apiUsername: "seager@uk.ibm.com",
			apiPassword: "password",
			apiDeveloperUsername: "username",
			apiDeveloperPassword: "password",
			apiDeveloperOrgName: "wsrrdev",
			apiDeveloperHost: "wsrrdev.hursley.ibm.com",
			apiVersion: "5.0.0.0",
			apiIdentifier: "apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb"
		};

	it('should default false if missing entry', function() {
		var inputOptions = _.clone(options);
		apimcli.setConnectionDetails(inputOptions, true);
		var publish = apimcli.getPublishMode();
		publish.should.equal(false);
	});

	it('should get true if entry true string', function() {
		var inputOptions = _.clone(options);
		inputOptions.publish = "true";
		apimcli.setConnectionDetails(inputOptions, true);
		var publish = apimcli.getPublishMode();
		publish.should.equal(true);
	});
	
	it('should get false if entry false string', function() {
		var inputOptions = _.clone(options);
		inputOptions.publish = "false";
		apimcli.setConnectionDetails(inputOptions, true);
		var publish = apimcli.getPublishMode();
		publish.should.equal(false);
	});


});

describe('getPublishCatalogs', function() {
	
	var options = {
			apiUsername: "seager@uk.ibm.com",
			apiPassword: "password",
			apiDeveloperUsername: "username",
			apiDeveloperPassword: "password",
			apiDeveloperOrgName: "wsrrdev",
			apiDeveloperHost: "wsrrdev.hursley.ibm.com",
			apiVersion: "5.0.0.0",
			apiIdentifier: "apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb"
		};
	
	it('should get set catalogs', function() {
		var inputOptions = _.clone(options);
		inputOptions.publishCatalogs = "sb,production";

		apimcli.setConnectionDetails(inputOptions, true);
		var publishC = apimcli.getPublishCatalogs();
		publishC.should.deep.equal(["sb","production"]);
	});

	it('should get single set catalog', function() {
		var inputOptions = _.clone(options);
		inputOptions.publishCatalogs = "sb";

		apimcli.setConnectionDetails(inputOptions, true);
		var publishC = apimcli.getPublishCatalogs();
		publishC.should.deep.equal(["sb"]);
	});

	it('should get default when no set catalog', function() {
		var inputOptions = _.clone(options);
		inputOptions.publishCatalogs = "";

		apimcli.setConnectionDetails(inputOptions, true);
		var publishC = apimcli.getPublishCatalogs();
		var def = apimcli.getDefaultCatalog();
		publishC.should.deep.equal([def]);
	});

	it('should get default when no config existing for catalog', function() {
		var inputOptions = _.clone(options);

		apimcli.setConnectionDetails(inputOptions, true);
		var publishC = apimcli.getPublishCatalogs();
		var def = apimcli.getDefaultCatalog();
		publishC.should.deep.equal([def]);
	});

});


// getCatalogToDevOrg
describe('getCatalogToDevOrg', function() {
	var options = {
			apiUsername: "seager@uk.ibm.com",
			apiPassword: "password",
			apiDeveloperUsername: "username",
			apiDeveloperPassword: "password",
			apiDeveloperOrgName: "wsrrdev",
			apiDeveloperHost: "wsrrdev.hursley.ibm.com",
			apiVersion: "5.0.0.0",
			apiIdentifier: "apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb"
		};
	
	it('should get set map', function() {
		var inputOptions = _.clone(options);
		inputOptions.publishCatalogs = "sb,production";
		inputOptions.apiDeveloperOrgName_sb = "wsrrdev";
		inputOptions.apiDeveloperOrgName_production = "wsrrdevProd";

		apimcli.setConnectionDetails(inputOptions, true);
		var map = apimcli.getCatalogToDevOrg();
		map.should.deep.equal({"sb": "wsrrdev", "production": "wsrrdevProd"});
	});

	it('should throw with one not mapped', function() {
		var inputOptions = _.clone(options);
		inputOptions.publishCatalogs = "sb,production";
		inputOptions.apiDeveloperOrgName_sb = "wsrrdev";
		// do not map production

		apimcli.setConnectionDetails(inputOptions, true);
		try {
			var map = apimcli.getCatalogToDevOrg();
			// should have thrown
			throw new Error("Should have thrown for non existing map devorgname")
		} catch(error) {
			// expected
		}
	});

	it('should throw if empty catalogs because it uses the default', function() {
		var inputOptions = _.clone(options);
		inputOptions.publishCatalogs = "";

		apimcli.setConnectionDetails(inputOptions, true);
		try {
			var map = apimcli.getCatalogToDevOrg();
			// should have thrown
			throw new Error("Should have thrown for non existing map devorgname for default catalog")
		} catch(error) {
			// expected
		}
	});

});

// getConsumersMode
describe('getConsumersMode', function() {
	var options = {
			apiUsername: "seager@uk.ibm.com",
			apiPassword: "password",
			apiDeveloperUsername: "username",
			apiDeveloperPassword: "password",
			apiDeveloperOrgName: "wsrrdev",
			apiDeveloperHost: "wsrrdev.hursley.ibm.com",
			apiVersion: "5.0.0.0",
			apiIdentifier: "apic-catalog://apimdev1248.hursley.ibm.com/orgs/wsrrdev/catalogs/sb"
		};
  //TODO: this will login so is not suitable for a unit test

	it('should default false if missing entry', function() {
		var inputOptions = _.clone(options);
		apimcli.setConnectionDetails(inputOptions, true);
		var publish = apimcli.getConsumersMode();
		publish.should.equal(false);
	});

	it('should get true if entry true string', function() {
		var inputOptions = _.clone(options);
		inputOptions.createConsumers = "true";
		apimcli.setConnectionDetails(inputOptions, true);
		var publish = apimcli.getConsumersMode();
		publish.should.equal(true);
	});
	
	it('should get false if entry false string', function() {
		var inputOptions = _.clone(options);
		inputOptions.createConsumers = "false";
		apimcli.setConnectionDetails(inputOptions, true);
		var publish = apimcli.getConsumersMode();
		publish.should.equal(false);
	});


});


});
