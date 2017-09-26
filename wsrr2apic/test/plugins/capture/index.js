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

// test capture module

// dummy process 
function process(configuration, inputDirectory, inputValue, modules) {

}

module.exports = {
	getDetails: function() {
		return {name: "capture1", type: "capture"};
	},
	process: process
};
