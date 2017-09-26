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
/**
 * Wrapper for Spinner, while performing operations
 */

var Spinner = require('cli-spinner').Spinner;

var spinner;
var running=false;

var start = function(){
	spinner = new Spinner('%s');
	spinner.setSpinnerString('|/-\\');
	spinner.setSpinnerDelay(100);
	running=true;
	spinner.start();
} 

var stop = function(){
	running=false;
	spinner.stop();
}

module.exports = {
		start:start,
		stop:stop,
		running:running
}