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

// test template module

var Handlebars = require('handlebars');

var toCall = null;

// dummy process calls whatever is set
function process() {
	// register simple test handlebars helper
	Handlebars.registerHelper("test", function(data){
		  var ret = data;
		  return ret;
	});
	
	if(toCall) {
		toCall();
	}
}

// set something to return
function setToCall(fn) {
	toCall = fn;
}

module.exports = {
	getDetails: function() {
		return {name: "template", type: "template"};
	},
	process: process,
	setToCall: setToCall
};
