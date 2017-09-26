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

/*
 * Creates a fake module which can expect to have various methods called in order,
 * with specified parameters, and will return specified results either sync or
 * with a promise.
 * 
 * Uses chai to check the data.
 * 
 * Call addExpected to add an expected function call to the list. The function calls
 * must occur in the order in the list.
 * 
 * Eg:
 *
 * (someModule has function "updateApplicationCredentials")
 * 
 * var someModule = fakeModule.create(require('./someModule'));
 * someModule.addExpected(["updateApplicationCredentials", "1", "newAPIKey", "devOrg"], {url: "http://www.a.com/", clientID: "newAPIKey", clientSecret: "xxyy", description: ""}, true);
 * someModule.updateApplicationCredentials("1", "newAPIKey", "devOrg").then(function(res){ 
 *  // res should be {url: "http://www.a.com/", clientID: "newAPIKey", clientSecret: "xxyy", description: ""} 
 * });
 * someModule.updateApplicationCredentials("1", "newAPIKey", "devOrg").caught(function(error){ 
 *  // will get an error as only expecting one call to updateApplicationCredentials
 * });
 * 
 */

var should = require('chai').should();
var Promise = require('bluebird');

/* 
 * Factory creates an object. Pass in the module which has been gotten from require().
 * Returns fake module with the functions on the module.
 * 
 * Eg: fakeModule.create(require('./someModule'));
 * 
 */
function factory(oldModule) {
	
	/* 
	 * A function was called.
	 * Arg 0 is the function name. Other args are the arguments.
	 *
	 * Check this was expected against the expected list for index. 
	 * 
	 */
	var called = function() {
		// copy arguments into a real array
		var args = Array.prototype.slice.call(arguments);

		// ensure not closed
		if(this.fakeModule_closed === true) {
			var closedmsg = "Error fakeModule_done() has already been called";
			console.error(closedmsg);
			console.error("Current call: " + args);
			console.error("Previous calls:");
			this.fakeModule_dumpHappened();
			throw new Error(closedmsg);
		}

		// check we expect another call
		if(this.fakeModule_index >= this.fakeModule_expected.length) {
			var lenmsg = "Error not expecting this call, all expected calls made";
			console.error(lenmsg);
			console.error("Current call: " + args);
			console.error("Previous calls:");
			this.fakeModule_dumpHappened();
			throw new Error(lenmsg);
		}
		
		// then check that what is expected actually happened
		var expectedCall = this.fakeModule_expected[this.fakeModule_index];
		if(expectedCall) {
			try{
				args.should.deep.equal(expectedCall);
			}catch(e) {
				var emsg = "Error expected call did not equal called: " + e;
				console.error(emsg);
				console.error("Current call: " + args);
				console.error("Expected call: " + expectedCall);
				console.error("Previous calls:");
				this.fakeModule_dumpHappened();
				throw e;
			}
		} else {
			// error missing
			var msg = "Missing expected call for call number: " + (this.fakeModule_index + 1);
			console.error(msg);
			console.error("Current call: " + args);
			console.error("Previous calls:");
			this.fakeModule_dumpHappened();
			throw new Error(msg);
		}

		// store what happened
		this.fakeModule_happened.push(args);
		
		var ret = this.fakeModule_toReturn[this.fakeModule_index].toReturn;
		if(this.fakeModule_toReturn[this.fakeModule_index].async === true) {
			// Error prototype should be the same for every where in Node
			if(ret instanceof Error) {
				// need to throw the error
				var e = ret;
				ret = Promise.delay(10).then(function(){
					throw e;
				});
			} else {
				// async - return promise which resolves with ret after 10 ms
				ret = Promise.delay(10, ret);
			}
		}
		
		this.fakeModule_index++;
		
		// throw if sync and is Error
		if(ret instanceof Error){
			throw ret;
		}
		
		return ret;		
	};

	var ret = {
		// try to avoid key clashes by using "fakeModule_"
		fakeModule_expected: [],
		fakeModule_happened: [],
		fakeModule_toReturn: [],
		fakeModule_index: 0,
		fakeModule_closed: false,

		/*
		 * Add expected function call, 
		 * 
		 * theExpected - array with:
		 * 0 - function name
		 * 1 - 1st parameter
		 * 2 - etc...
		 * toReturn - what to return, can be null. Can be an Error in which case it is thrown.
		 * async - whether to return a promise that resolved to the return data on a timeout (true) or immediately (false)
		 * 
		 * Eg fakedModuleInstance.fakeModule_addExpected(["updateApplicationCredentials", "1", "newAPIKey", "devOrg"], {url: "http://www.a.com/", clientID: "newAPIKey", clientSecret: "xxyy", description: ""}, true);
		 */ 
		fakeModule_addExpected: function fakeModule_addExpected(theExpected, toReturn, async) {
			this.fakeModule_expected.push(theExpected);
			this.fakeModule_toReturn.push({toReturn: toReturn, async: async});
		},
		
		/*
		 * Get what happened to console.
		 */
		fakeModule_dumpHappened: function fakeModule_dumpHappened() {
			console.log(this.fakeModule_happened);
		},
		
		/*
		 * Add function name to thing which calls called() with the thing as this and name as first param
		 * Used to register functions on the object to call in tests.
		 */
		fakeModule_addFunction: function fakeModule_addFunction(name) {
			this[name] = called.bind(this, name);
		},
		
		/*
		 * Indicate the module calls should be done, check all expected have been called.
		 */
		fakeModule_done: function fakeModule_done() {
			this.fakeModule_closed = true;
			if(this.fakeModule_index !== this.fakeModule_expected.length) {
				// index is wrong
				var msg = "Expected functions were not all called. Number called: " + (this.fakeModule_index) + ", expected: " + this.fakeModule_expected.length;
				console.error(msg);
				console.error("Previous calls:");
				this.fakeModule_dumpHappened();
				throw new Error(msg);
			}
		}
	};

	// add functions from the oldModule
	for(var key in oldModule) {
		if(oldModule.hasOwnProperty(key)) {
			ret.fakeModule_addFunction(key);
		}
	}

	return ret;
}

module.exports = {
		create: factory
};
