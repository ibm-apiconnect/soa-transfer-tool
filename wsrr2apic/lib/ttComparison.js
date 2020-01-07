/**
 * http://usejsdoc.org/
 */

var logger=require('./logger'),fs=require('fs'),Promise=require('bluebird'),_=require('lodash'),yaml = require('js-yaml'), strftime = require('strftime');

var resultFilePath;
var resultLogStream;

var endpointDiffernceFound=false;

var keyIgnoreList=['lastModified'];

function openResultLogger(){
	if(resultFilePath){
		resultLogStream = fs.createWriteStream(resultFilePath);
	}else{
		logger.error("result file path not set");
	}
}

function closeResultLogger(){
	resultLogStream.end();
}

function logResult(line){
	return new Promise(function(resolve){
		console.log(line);
		resultLogStream.write(line+"\n");
		resolve();
	});
}

/**
 * @param slds1, Array of sld objects from Object1
 * @param slds2, Array of sld objects from Object2
 * @param path, They current keyPath
 */
function sldComparison(slds1,slds2,path){
	logger.entry("sldComparison",path);
	return Promise.join(
		//full comparison, if a match is found for defined criteria e.g. matching bsrURI
		Promise.reduce(slds1,function(total,sld1){
		//use bsrURI to match the sld objects, ignore
		var found=false;
		return Promise.reduce(slds2,function(total,sld2){
			return new Promise(function(resolve){
				if(sld1.bsrURI===sld2.bsrURI){
					found=true;
					objectCompare(sld1,sld2).then(function(keys){
						if(keys.length>=0){
							processResults(sld1,sld2,objectCompare(sld1,sld2),path+".slds."+sld1.bsrURI).then(function(){
								resolve();
							});
						}else{
							resolve();
						}
					});
				}else{
					resolve();
				}
			});
		},0).then(function(){
			if(!found){
				logResult(logger.Globalize.formatMessage("compareTypeSLDNotFound",sld1.bsrURI,2));
			}
		});
	},0),
	//checks to see if there are any slds in 2 that are not in 1, must contain matching logic steps to first set of Promise.reduce
	// but should only actual match found, not continue to processing as the first promise will do the processing
		Promise.reduce(slds2,function(total,sld2){
		//use bsrURI to match the sld objects, ignore
		var found=false;
		return Promise.reduce(slds1,function(total,sld1){
			return new Promise(function(resolve){
				if(sld2.bsrURI===sld1.bsrURI){
					found=true;
					resolve();
				}else{
					resolve();
				}
			});
		},0).then(function(){
			if(!found){
				logResult(logger.Globalize.formatMessage("compareTypeSLDNotFound",sld2.bsrURI,sld2.url,1));
			}
		});
	},0)
	);
	logger.exit("sldComparison",path);
}

/**
 * Example multi-value comparison
 *
 * As SOAP documents that have multiple endpoints which correspond to different environments then it is
 * required that they are correctly handled so that production endpoints are not compared to staging endpoints
 *
 * @param endpoints1, Array of endpoint objects from Object1
 * @param endpoints2, Array of endpoint objects from Object2
 * @param path, They current keyPath
 */
function endpointComparison(endpoints1,endpoints2,path){
	logger.entry("endpointComparison",path);
	return Promise.join(
		//full comparison, if a match is found for defined criteria e.g. matching bsrURI
		Promise.reduce(endpoints1,function(total,endpoint1){
		//use bsrURI to match the endpoint objects, ignore
		var found=false;
		return Promise.reduce(endpoints2,function(total,endpoint2){
			return new Promise(function(resolve){
				if(endpoint1.bsrURI===endpoint2.bsrURI){
					found=true;
					objectCompare(endpoint1,endpoint2).then(function(keys){
						if(keys.length>=0){
							resolve(processResults(endpoint1,endpoint2,objectCompare(endpoint1,endpoint2),path+".endpoints."+endpoint1.bsrURI));
						}else{
							logResult(logger.Globalize.formatMessage("compareEndpointMatchFound",path+".endpoints."+endpoint1.bsrURI))
							resolve();
						}
					});
				}else if(endpoint1.url===endpoint2.url){
					logResult(logger.Globalize.formatMessage("compareEndpointUrlFoundBsrURIMismatch",endpoint1.url));
					found=true;
					resolve(processResults(endpoint1,endpoint2,objectCompare(endpoint1,endpoint2),path+".endpoints."+endpoint1.url));
				}else{
					resolve();
				}
			});
		},0).then(function(){
			if(!found){
				logResult(logger.Globalize.formatMessage("compareTypeBsrURIURLNotFound",endpoint1.bsrURI,endpoint1.url,2));
			}
		});
	},0),
	//checks to see if there are any endpoints in 2 that are not in 1, must contain matching logic steps to first set of Promise.reduce
	// but should only actual match found, not continue to processing as the first promise will do the processing
		Promise.reduce(endpoints2,function(total,endpoint2){
		//use bsrURI to match the endpoint objects, ignore
		var found=false;
		return Promise.reduce(endpoints1,function(total,endpoint1){
			return new Promise(function(resolve){
				if(endpoint2.bsrURI===endpoint1.bsrURI || endpoint2.url===endpoint1.url){
					found=true;
					resolve();
				}else{
					resolve();
				}
			});
		},0).then(function(){
			if(!found){
				logResult(logger.Globalize.formatMessage("compareTypeEndpointBsrURIURLNotFound",endpoint2.bsrURI,endpoint2.url,1));
			}
		});
	},0)
	);
	logger.exit("endpointComparison",path);
}

/**
 * Compare arrays, these are the end values for comparison so no need to dig further
 * but as an array are likely to have odd
 * @param array1
 * @param array2
 * @param path
 * @param name - name of item type being compared
 */
function arrayComparison(array1,array2,keyPath,name){
	logger.entry("arrayComparison",keyPath,name);
	return Promise.join(
			//full comparison, if a match is found for defined criteria e.g. matching bsrURI
			Promise.reduce(array1,function(total,item1){
			//use bsrURI to match the endpoint objects, ignore
			var found=false;
			return Promise.reduce(array2,function(total,item2){
				return new Promise(function(resolve){
					if(item1===item2){
						found=true;
						resolve();
					}else{
						resolve();
					}
				});
			},0).then(function(){
				if(!found){
					logResult(logger.Globalize.formatMessage("compareTypeArrayItemNotFound",name,item1,keyPath,2));
				}
			});
		},0),
		//checks to see if there are any endpoints in 2 that are not in 1, must contain matching logic steps to first set of Promise.reduce
		// but should only actual match found, not continue to processing as the first promise will do the processing
		Promise.reduce(array2,function(total,item2){
			//use bsrURI to match the endpoint objects, ignore
			var found=false;
			return Promise.reduce(array1,function(total,item1){
				return new Promise(function(resolve){
					if(item2===item1){
						found=true;
						resolve();
					}else{
						resolve();
					}
				});
			},0).then(function(){
				if(!found){
					logResult(logger.Globalize.formatMessage("compareTypeArrayItemNotFound",name,item2,keyPath,1));
				}
			});
		},0)
		);
	logger.exit("arrayComparison");
}

/**
 * Base object Comparison,
 * returns an array of keys that have been found to be different
 * returns if either Object1 or Object2 is missing a key that the other has
 * or if the values/objects of that key are deemed to be different by _.reduce
 *
 * will only do one level of keys in a single pass, can be rerun over a key that is an object
 * that is found to be different and will return the sub-keys of that object.
 *
 * @param object1
 * @param object2
 */
function objectCompare(object1,object2){
	return new Promise(function(resolve){
		resolve(Object.keys(object1).reduce(function(result, key){
	        if (!object2.hasOwnProperty(key)) {
	            result.push(key);
	        //if the objects are deemed equal or the key is part of the ignore list then splice
	        } else if (_.isEqual(object1[key], object2[key]) || keyIgnoreList.includes(key)) {
	            const resultKeyIndex = result.indexOf(key);
	            result.splice(resultKeyIndex, 1);
	        }
	        return result;
	    }, Object.keys(object2)));
	});
}
/**
 * Primary function that handles the processing of results from objectCompare and handling of recognized keys
 *
 * To add handling of a specific key, expand the if/else if group to contain the key and the method that should be called
 * if the key refers to an array of primitive types i.e. not an object, then add to the "classifications if block as an "||"
 *
 * @param object1
 * @param object2
 * @param keys
 * @param keyPath
 */
function processResults(object1,object2,keys,keyPath){
	logger.entry("ttComparison.processResults",keys,keyPath);
	return Promise.reduce(keys,function(total,key){
		logger.entry("processResults_reduce_callback",key,keyPath)
		//General Processing of objects. This will return all differences that can be found
		if(key==="SLDs"){
			return sldComparison(object1[key],object2[key],keyPath);
		}else if(key==="endpoints"){
			endpointDiffernceFound=true;
			return endpointComparison(object1[key],object2[key],keyPath);
		}else if(key==="classifications"){
		    return arrayComparison(object1[key],object2[key],keyPath,key);
		}
		else if (typeof(object1[key]) === 'object' && typeof(object2[key]) === 'object'){
			if(keyPath===""){
				keyPath=key;
			}else{
				keyPath=keyPath+"."+key;
			}
			return processResults(object1[key],object2[key],objectCompare(object1[key],object2[key]),keyPath);
		}else if(typeof(object1[key]) === 'undefined'){
			logResult(logger.Globalize.formatMessage("compareTypeUndefined",keyPath+"."+key,object2[key],1));
		}else if(typeof(object2[key]) === 'undefined'){
			logResult(logger.Globalize.formatMessage("compareTypeUndefined",keyPath+"."+key,object1[key],2));
		}else{
			logResult(logger.Globalize.formatMessage("compareDifferenceFound",keyPath,key,object1[key],object2[key]));
		}
	},0);
	logger.exit("ttComparison.processResults");
}

function fileCompare(filePath1,filePath2,resultDirectory,resultFileName){
	logger.entry("ttComparison.fileCompare",filePath1,filePath2,resultDirectory,resultFileName);
	var fileData1;
	var fileData2;
	if(resultFileName){
		resultFilePath=resultDirectory+"/"+resultFileName;
	}else{
		//resultFilePath=resultDirectory+"/comparison_results_"+Date.now();
		resultFilePath=resultDirectory+"/comparison_results";
	}
	Promise.join(
		new Promise(function(resolve,reject){
			fs.readFile(filePath1,function(err,data){
				if(!err){
					fileData1=yaml.safeLoad(data);
					resolve();
				}else{
					reject();
				}
			});
		}),
		new Promise(function(resolve,reject){
			fs.readFile(filePath2,function(err,data){
				if(!err){
					fileData2=yaml.safeLoad(data);
					resolve();
				}else{
					logger.error(err);
					reject();
				}
			});
		})
		).then(function(){
			objectCompare(fileData1,fileData2).then(function(keys){
				if(keys.length === 0){
					logger.info(logger.Globalize.formatMessage("compareFilesIdentical"));
				}else{
					openResultLogger();
					processResults(fileData1, fileData2, keys,"").then(function(){
					//check for global matching settings
					if(!endpointDiffernceFound){
						logResult(logger.Globalize.formatMessage("compareEndpointsNoDifferencesFound"))
					}
					//need to promisfying this logic and can then properly close stream
						closeResultLogger();
					});
				}
			});
		});
	logger.exit("ttComparison.fileCompare");
}

module.exports={
		fileCompare:fileCompare,
		objectCompare:objectCompare
}
