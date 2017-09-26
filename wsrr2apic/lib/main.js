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

var wsrrUtils = require("./WSRR/wsrrUtils");
var apimcli = require("./apimcli");
var apimdevportal = require("./apimdevportal");
var logger = require("./Logger");

// export WSRR and APIC libraries and the logger
module.exports = {
	wsrrUtils: wsrrUtils,
	apimcli: apimcli,
	apimdevportal: apimdevportal,
	logger: logger
};	
