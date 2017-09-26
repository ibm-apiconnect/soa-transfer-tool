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
 * Module to handle the data that the tool and templates use.
 * 
 * The module will alter the objects passed in to add properties, but this is ok because
 * the objects should come from fetches and queries.
 * 
 * The object getters will return clones.
 * 
 * The data structure is:
 * 
 * { 
 *  -- top level WSRR object which is the business service --
 *	(usual WSRR data)
 *	version: {
 *		-- Service Version WSRR object --
 *		(usual WSRR data)
 *		slds: [
 *			{ 
 *				-- SLD WSRR object --
 *				(usual WSRR data)
 *				endpoints: [
 *					{ 
 *						-- Endpoint WSRR object --
 *						(usual WSRR data)
 *					}
 *				]
 *				soapEndpoints: [
 *					{ endpoint object}...
 *				]
 *				restEndpoints: [
 *					{ endpoint object}...
 *				]
 *	            consumers: [
 *					{ consumer object}...
 *				]
 *			}
 *		]
 *      consumers: [ array of consumer objects of consumers of the version]
 *	versions: [ array of above version objects when multiple versions exist, or array with just one version when requested ]
 *  consumers: [ array of consumer objects of consumers of the business service ]
 *  } 
 * 
 * WSRR objects follow this structure:
 * 
 *  bsrURI: bsrURI
 *  type: SDO type
 *  governanceRootBsrURI: bsrURI of gov root
 *  primaryType: model type if a business model instance
 *  state: URI of state
 * 	properties: {name:value pairs}
 *  classifications: [URI, URI,...]
 *  relationships: {relationship name: array of relationship target objects for that relationship, name: array, etc}
 *  
 *  relationship target object is:
 *  {
 *  bsrURI: bsrURI of a target
 *  type: SDO type of target
 *  primaryType: model type of target if a business model instance
 *  }
 *
 * Consumer objects follow this structure:
 * {
 *  sla: consuming SLA - WSRR data object for the SLA,
 *  version: consuming Version - WSRR data object for the version,
 *  capability: consuming Capability - WSRR data object for the business capability
 * }
 * 
 * For the consuming version and consuming capability, these have a property "organization" added which is the WSRR
 * data object for the owning organization for each.
 * 
 */
'use strict';

var logger = require("./Logger");
var _ = require("lodash");

//TODO: doesn't handle SLD on multiple service versions properly. Which should not happen because it does not make sense.

//TODO: methods to get data for certain use cases: -API Swagger/Product per Service (just one version in the data), 
// -Product per business service (all versions)

var ttData = {
	data: null,
	// map of WSRR environment URI to APIC catalog name
	environmentMap: null,

	ENDPOINT_TYPE_SOAP: "SOAP",
	ENDPOINT_TYPE_REST: "REST",
	
	/*
	 * Set the business service object into the data.
	 * 
	 * Take a clone of the business service.
	 */
	setBusinessService: function setBusinessService(businessService) {
		logger.entry("setBusinessService", businessService);

		var clonedService = _.cloneDeep(businessService);
		
		if(this.data === null) {
			this.data = clonedService;
		} 
		//TODO: else: merge but not usually called this way, this should be the first method called before addVersion, or overwrite?
		
		// set empty versions array
		if(!this.data.versions){
			this.data.versions = [];
		}
		
		logger.exit("setBusinessService");
	},
	
	/*
	 * Add a service version to the data, as version and to the versions.
	 * 
	 * Does not clone the service version.
	 */
	addServiceVersion: function addServiceVersion(serviceVersion) {
		logger.entry("addServiceVersion", serviceVersion);
		
		if(this.data === null) {
			this.data = {};
		}
		if(!this.data.version) {
			this.data.version = serviceVersion;
		}
		if(!this.data.versions){
			this.data.versions = [];
		}
		this.data.versions.push(serviceVersion);
		
		logger.exit("addServiceVersion");
	},

	/*
	 * Find the version with bsrURI of serviceVersionBsrURI.
	 * Return null or version object.
	 */
	_findVersion: function _findVersion(serviceVersionBsrURI) {
		logger.entry("_findVersion", serviceVersionBsrURI);
		var foundVersion = null;

		if(this.data !== null) {
			if(this.data.versions) {
				for(var i = 0, len = this.data.versions.length; i < len; i++) {
					var version = this.data.versions[i];
					if(version.bsrURI === serviceVersionBsrURI) {
						foundVersion = version;
						break;
					}
				}
			}
		}
		
		logger.exit("_findVersion", foundVersion);
		return foundVersion;
	},
	
	/*
	 * Add the SLD onto the service version. If the service version bsrURI does not exist
	 * then do nothing.
	 */
	addSLD: function addSLD(sld, serviceVersionBsrURI) {
		logger.entry("addSLD", sld, serviceVersionBsrURI);

		var version = this._getVersion(serviceVersionBsrURI);
		if(version) {
			// add
			if(!version.slds) {
				version.slds = [];
			}
			version.slds.push(sld);
		}
		
		logger.exit("addSLD");
	},

	/*
	 * Find the SLD in the data with bsrUR of sldBsrURI.
	 * Return null or the SLD object.
	 */
	_findSLD: function _findSLD(sldBsrURI) {
		logger.entry("_findSLD", sldBsrURI);

		var foundSld = null;
		if(this.data) {
			if(this.data.versions) {
				for(var i = 0, vLen = this.data.versions.length; i < vLen && foundSld === null; i++) {
					var version = this.data.versions[i];
					if(version.slds) {
						for(var j = 0, sLen = version.slds.length; j < sLen; j++) {
							var sld = version.slds[j];
							if(sld.bsrURI === sldBsrURI) {
								foundSld = sld;
								break;
							}
						}
					}
				}
			}
		}
		
		logger.exit("_findSLD", foundSld);
		return foundSld;
	},
	
	/*
	 * Add the endpoints in the array to the SLD identified by the sldBsrURI.
	 * If the sldBsrURI does not exist, do nothing.
	 * Will append to any existing endpoints.
	 * Will also sort endpoints into environmentEndpoints map and eventually catalogEndpoints,
	 * environmentEndpoints is a map of WSRR environment (minus bit of URI before #) to endpoint,
	 * eg "Production" -> [{endpoint object}, ...]
	 * 
	 * endpointType is ENDPOINT_TYPE_SOAP or ENDPOINT_TYPE_REST.
	 * 
	 * catalogEndpoints is similar but the key is the APIC catalog name. (which is gotten from a map
	 * of WSRR environment to APIC catalog).
	 */
	addEndpointsToSLD: function addEndpointsToSLD(endpointsArray, sldBsrURI, endpointType) {
		logger.entry("addEndpointsToSLD", endpointsArray, sldBsrURI);
		
		// If somehow the same SLD is on different versions, this is not really a valid
		// use of WSRR.
		var sld = this._findSLD(sldBsrURI);
		if(sld) {
			// add
			if(!sld.endpoints) {
				sld.endpoints = [];
			}
			if(!sld.soapEndpoints) {
				sld.soapEndpoints = [];
			}
			if(!sld.restEndpoints) {
				sld.restEndpoints = [];
			}
			var newEndpoints = sld.endpoints.concat(endpointsArray);
			sld.endpoints = newEndpoints;
			// add endpoints to array for specific type
			if(endpointType && endpointType === this.ENDPOINT_TYPE_SOAP) {
				newEndpoints = sld.soapEndpoints.concat(endpointsArray);
				sld.soapEndpoints = newEndpoints;
			}
			if(endpointType && endpointType === this.ENDPOINT_TYPE_REST) {
				newEndpoints = sld.restEndpoints.concat(endpointsArray);
				sld.restEndpoints = newEndpoints;
			}
		}
		
		logger.exit("addEndpointsToSLD");
	},

	/*
	 * Add a consumer to the SLD, version and capability, on the consumers array on each.
	 * 
	 * If the SLD or version is unknown, throws an error. 
	 *
	 * consumingSLA - SLA object used to consume the SLD
	 * consumingVersion - Version object which the SLA is on
	 * consumingCapability - Capability object which owns the version
	 * sldBsrURI - SLD which the SLA points to
	 * serviceVersionBsrURI - service version which owns the SLD
	 * 
	 */
	addConsumer: function addConsumer(consumingSLA, consumingVersion, consumingCapability, sldBsrURI, serviceVersionBsrURI) {
		logger.entry("addConsumer", consumingSLA, consumingVersion, consumingCapability, sldBsrURI, serviceVersionBsrURI);

		var consumer = {
			sla: consumingSLA,
			version: consumingVersion,
			capability: consumingCapability
		};

		// find SLD
		var sld = this._findSLD(sldBsrURI);
		if(sld) {
			if(!sld.consumers) {
				sld.consumers = [];
			}
			sld.consumers.push(consumer);			
		} else {
			throw new Error("cannot find sld " + sldBsrURI);
		}
		
		// get version
		var version = this._findVersion(serviceVersionBsrURI);
		if(version) {
			if(!version.consumers) {
				version.consumers = [];
			}
			version.consumers.push(consumer);
		} else {
			throw new Error("cannot find version " + serviceVersionBsrURI);
		}
		
		// add to capability
		if(!this.data.consumers) {
			this.data.consumers = [];
		}
		this.data.consumers.push(consumer);		
		
		logger.exit("addConsumer");
	},	
	
	/*
	 * Get the version identified by BsrURI.
	 * Return a reference to the version object or null if not found.
	 */
	_getVersion: function _getVersion(versionBsrURI) {
		logger.entry("_getVersion", versionBsrURI);
		
		var theVersion = null;
		if(this.data !== null) {
			if(this.data.versions) {
				for(var i = 0; i < this.data.versions.length; i++) {
					var version = this.data.versions[i];
					if(version.bsrURI === versionBsrURI) {
						theVersion = version;
					}
				}
			}
		}
		logger.exit("_getVersion", theVersion);
		return theVersion;
	},
	
	/*
	 * Check the type of endpoints in the array of SLDs on the version, each SLD object has a restEndpoints
	 * and soapEndpoints arrays, if there is something in them this indicates the type of endpoints.
	 * 
	 * We used to check the primary type, but this does not allow of subclasses of the endpoint types
	 * because we do not know what these subtypes are. So the query code needs to fetch soap and rest
	 * endpoints separately then store them in the correct lists.
	 * 
	 * versionBsrURI - bsrURI of the service version to check on
	 * 
	 * Return {SOAP: true/false, REST: true/false}
	 */
	checkEndpointTypes: function checkEndpointTypes(versionBsrURI) {
		logger.entry("checkEndpointTypes", versionBsrURI);
		
		var result = {SOAP: false, REST: false};

		var theVersion = this._getVersion(versionBsrURI);

		if(theVersion !== null) {
			if(theVersion.slds && theVersion.slds.length > 0) {
				for(var j = 0; j < theVersion.slds.length; j++) {
					var sld = theVersion.slds[j];
					if(sld.soapEndpoints && sld.soapEndpoints.length > 0) {
						result.SOAP = true;
					}
					if(sld.restEndpoints && sld.restEndpoints.length > 0) {
						result.REST = true;
					}
				}
			}
		}
						
		logger.exit("checkEndpointTypes", result);
		return result;
	},
	
	/* Get the bsrURI of the business service.
	 * 
	 * Return null if no business service set.
	 */
	getBusinessServiceBsrURI: function getBusinessServiceBsrURI() {
		logger.entry("getBusinessServiceBsrURI");
		var ret = null;
		if(this.data) {
			ret = this.data.bsrURI;
		}
		logger.exit("getBusinessServiceBsrURI", ret);
		return ret;		
	},

	/*
	 * Return data for the service version specified.
	 * This returns the business service object but with "version" on the business service
	 * referencing the specific version asked for. It has the "versions"
	 * array containing just this version, so the only version accessible is the one specified.
	 * This also returns a deep clone of the data.
	 * 
	 * Return the data as specified, or null if the bsruri is unrecognised.
	 */
	getApiData: function getApiData(serviceVersionBsrURI) {
		logger.entry("getApiData", serviceVersionBsrURI);
		
		var ret = null;
		
		var theVersion = this._getVersion(serviceVersionBsrURI);
		if(theVersion) {
			// clone
			ret = _.cloneDeep(this.data);
			// add version
			ret.version = _.cloneDeep(theVersion);
			// remove versions and set to the single version
			if(ret.versions) {
				delete ret.versions;
				// add single version
				ret.versions = [ret.version];
			}
		}		
		
		logger.exit("getApiData", ret);
		return ret;
	},
	
	/*
	 * Return data for a product which can include all versions if serviceVersionBsrURI is
	 * null (versions array present), or a specific version if not (version reference 
	 * and versions array only contains that version).
	 * 
	 * Return data or null if serviceVersionBsrURI specified but not found.
	 */
	getProductData: function getProductData(serviceVersionBsrURI) {
		logger.entry("getProductData", serviceVersionBsrURI);
		
		var ret = null;
		if(serviceVersionBsrURI) {
			// is the same as getApiData
			ret = this.getApiData(serviceVersionBsrURI);
		} else {
			// is the whole thing
			ret = _.cloneDeep(this.data);
		}
		
		logger.exit("getProductData", ret);
		return ret;
	},
	
	/*
	 * Get all data for dumping to diagnostics.
	 * 
	 * Returns reference to the data object. Do not modify the data.
	 */
	getDiagnosticData: function getDiagnosticData() {
		return this.data;
	},
	
	/*
	 * set data for dumping to diagnostics.
	 * 
	 * Returns reference to the data object. Do not modify the data.
	 */
	setDiagnosticData: function getDiagnosticData(data) {
		this.data=data;
	}
	
};

// factory that creates an instance of the data
var factory = function() {
	var theData = Object.create(ttData);
	return theData;
};

module.exports = {
		create: factory
};
