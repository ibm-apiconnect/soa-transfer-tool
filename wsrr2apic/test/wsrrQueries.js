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

var wsrrQueries = require('../lib/WSRR/wsrrqueries');

// unit tests in here
describe('unittests_wsrrqueries', function(){

	//getQueryXPath function
	describe('getQueryXPath', function() {
		  this.timeout(15000);
		  it('gets query when nothing in config', function(done) {

			  // actual data from WSRR
			  var config = {};
			  
			  var xpath = wsrrQueries.getQueryXPath(wsrrQueries.WSDLForServiceVersion, config);

			  xpath.should.equal(wsrrQueries.WSDLForServiceVersion.query);
			  
			  done();
		  });
		  it('gets query when nothing in config for query override', function(done) {

			  // actual data from WSRR
			  var config = {};
			  var query = {query: "//WSDLDocument/myQuery", configOverrideName: "goats"};
			  
			  var xpath = wsrrQueries.getQueryXPath(query, config);

			  xpath.should.equal(query.query);
			  
			  done();
		  });
		  it('gets query when no override property in query', function(done) {

			  // actual data from WSRR
			  var config = {};
			  var query = {query: "//WSDLDocument/myQuery"};
			  
			  var xpath = wsrrQueries.getQueryXPath(query, config);

			  xpath.should.equal(query.query);
			  
			  done();
		  });
		  it('gets query when override present in config', function(done) {

			  // actual data from WSRR
			  var config = {goats: "//XSDDocument/theQuery"};
			  var query = {query: "//WSDLDocument/myQuery", configOverrideName: "goats"};
			  
			  var xpath = wsrrQueries.getQueryXPath(query, config);

			  xpath.should.equal(config.goats);
			  
			  done();
		  });
		  
	});

	//resolveInserts function
	describe('resolveInserts', function() {
		  this.timeout(15000);
		  it('resolves inserts', function(done) {

			  var message = "Test %s";
			  var results = wsrrQueries.resolveInserts(message, "goats");
			  results.should.equal("Test goats");
			  
			  done();
		  });
		  it('resolves multiple inserts', function(done) {

			  var message = "Test %s %s";
			  var results = wsrrQueries.resolveInserts(message, "goats", "pies");
			  results.should.equal("Test goats pies");
			  
			  done();
		  });
		  it('resolves no inserts', function(done) {

			  var message = "Test";
			  var results = wsrrQueries.resolveInserts(message);
			  results.should.equal("Test");
			  
			  done();
		  });
		  it('resolves no inserts when some are supplied', function(done) {

			  var message = "Test";
			  var results = wsrrQueries.resolveInserts(message, "goats");
			  results.should.equal("Test");
			  
			  done();
		  });
		  it('resolves inserts when no parameters supplied', function(done) {

			  var message = "Test %s";
			  var results = wsrrQueries.resolveInserts(message);
			  results.should.equal(message);
			  
			  done();
		  });
		  it('resolves wrong number of inserts correctly', function(done) {

			  var message = "Test %s %s";
			  // third insert should be ignored	
			  var results = wsrrQueries.resolveInserts(message, "goats", "pies", "cake");
			  results.should.equal("Test goats pies");
			  
			  done();
		  });

	});


});
