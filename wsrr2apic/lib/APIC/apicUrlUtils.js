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

var logger=require("../Logger"), url = require('url');

//Parse the server host from a URL like:
//apic-catalog://apicmanagement.domain.com/orgs/wsrrdev/catalogs/sb
function getHostFromApicUrl(apicUrl) {
	logger.entry("apicUtils.getHostFromApicUrl", apicUrl);
	
	var ret = null;
	try {
		var theUrl = url.parse(apicUrl);
		ret = theUrl.host;
	} catch(error) {
		logger.error(error);
	}
	
	logger.exit("apicUtils.getHostFromApicUrl", ret);
	return ret;
}

//Parse the server port from a URL like:
//apic-catalog://apicmanagement.domain.com/orgs/wsrrdev/catalogs/sb
function getPortFromApicUrl(apicUrl) {
	logger.entry("apicUtils.getPortFromApicUrl", apicUrl);
	
	var ret = null;
	try {
		var theUrl = url.parse(apicUrl);
		ret = theUrl.port;
	} catch(error) {
		logger.error(error);
	}
	
	logger.exit("apicUtils.getPortFromApicUrl", ret);
	return ret;
}

//Parse the provider org from a URL like:
//apic-catalog://apicmanagement.domain.com/orgs/wsrrdev/catalogs/sb
//where the pOrg is the wsrrdev bit
function getPOrgFromApicUrl(apicUrl) {
	logger.entry("apicUtils.getPOrgFromApicUrl", apicUrl);
	
	var ret = null;
	try {
		var theUrl = url.parse(apicUrl);
		var path = theUrl.pathname;
		var pathFragments;
		if(path) {
			pathFragments = path.split("/");
		}
		// get empty one then entries are the path bits
		if(pathFragments && pathFragments.length > 2) {
			ret = pathFragments[2];
		}
	} catch(error) {
		logger.error(error);
	}
	
	logger.exit("apicUtils.getPOrgFromApicUrl", ret);
	return ret;
}


//Parse the catalog from a URL like:
//apic-catalog://apicmanagement.domain.com/orgs/wsrrdev/catalogs/sb
//where the catalog is the sb bit
function getCatalogFromApicUrl(apicUrl) {
	logger.entry("apicUtils.getCatalogFromApicUrl", apicUrl);
	
	var ret = null;
	try {
		var theUrl = url.parse(apicUrl);
		var path = theUrl.pathname;
		var pathFragments;
		if(path) {
			pathFragments = path.split("/");
		}
		// get empty one then entries are the path bits
		if(pathFragments && pathFragments.length > 4) {
			ret = pathFragments[4];
		}
	} catch(error) {
		logger.error(error);
	}
	
	logger.exit("apicUtils.getCatalogFromApicUrl", ret);
	return ret;
}

function getSpaceFromApicUrl(apicUrl){
logger.entry("apicUtils.getSpaceFromApicUrl", apicUrl);
	
	var ret = null;
	try {
		var theUrl = url.parse(apicUrl);
		var path = theUrl.pathname;
		var pathFragments;
		if(path) {
			pathFragments = path.split("/");
		}
		// get empty one then entries are the path bits
		if(pathFragments && pathFragments.length > 6) {
			ret = pathFragments[6];
		}
	} catch(error) {
		logger.error(error);
	}
	
	logger.exit("apicUtils.getSpaceFromApicUrl", ret);
	return ret;
}

module.exports = {
		getHostFromApicUrl: getHostFromApicUrl,
		getPOrgFromApicUrl: getPOrgFromApicUrl,
		getCatalogFromApicUrl:getCatalogFromApicUrl,
		getPortFromApicUrl:getPortFromApicUrl,
		getSpaceFromApicUrl:getSpaceFromApicUrl
};
