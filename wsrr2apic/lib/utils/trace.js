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
/**
 * Trace utilities for diagnostics.
 */

// dump the buffer array to screen
// bufferArray is a string with the numbers comma separated
function _dumpBuffer(bufferArrayString, index) {
	var bufferString = "[" + bufferArrayString + "]";
	try {
		var bufferArray = JSON.parse(bufferString);
		var buf = new Buffer(bufferArray);

		console.log("Buffer " + index + " contents: ");
		console.log(buf.toString());
		
	}catch(e){
		console.error(e);
	}
}

/*
 * Dump any buffer contents in the trace point in msg to console.log.
 * 
 * point - the whole trace line eg {"name":"soatt","hostname":"CNPTCAM3528369","pid":15328,"level".....
 */ 
function expandTraceBuffers(point) {
	// regexp to find buffers in the trace
	var bufferMatch = /\{"type"\:"Buffer","data":\[((?:[0-9]+,)*[0-9]+)\]/g;
	// output each key
	for(var key in point) {
		// types
		var obj = point[key];
		var str = Object.prototype.toString.call(obj);
		if(str === "[object Object]") {
			// object
			console.log(key + " : " +  obj);
		} else if(str === "[object Array]") {
			// array
			console.log(key + " : " + obj);
		} else {
			console.log(key + " : " + obj);
			if(key === "msg") {
				// see if any buffers are in there
				var matches = bufferMatch.exec(obj);
				if(matches && matches.length > 1) {
					// found some
					for(var matchI = 1, len = matches.length; matchI < len; matchI++) {
						_dumpBuffer(matches[matchI], matchI);
					}
				}
			}
		}
	}
} 

module.exports = {
		expandTraceBuffers: expandTraceBuffers
};
