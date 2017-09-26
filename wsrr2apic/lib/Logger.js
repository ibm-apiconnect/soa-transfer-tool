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
 * All
 * 
 */

'use strict';

// TODO: do not stringify objects if debug is off

var logFileName = "./logs/soatt.log";
var Debug = true;
var locale;
var bunyan = require('bunyan'), Globalize = require('globalize'), fs = require('fs'), os = require('os'), strftime = require('strftime'), rotateStream = require('logrotate-stream'), os = require("os"), mkdirp = require("mkdirp"), path = require('path'), Promise = require("bluebird"), homedir = require("os-homedir"), prompt = require("prompt"), _ = require('lodash'), trace = require("./utils/trace"), stream = require("stream");
var exec = require('child_process').exec;
var pjson = require('../package.json');
// temporary stderr logger until initialized
var logger = bunyan.createLogger({
	name : "soatt",
	level : 'error',
	stream : process.stderr
});
var errorlogger=bunyan.createLogger({
	name : "soatterror",
	level : "error",
	stream : process.stderr
});

function _createDirectory(directory, resolve) {
	// Create Directory for logs and default output file log
	fs.access(directory, fs.F_OK, function(err) {
		if (err) {
			// TODO: give this proper error message, but this cannot be
			// logged in log because these are the directories for the log
			// Not how to do as Messages not yet initialized
			mkdirp(directory, function(err) {
				resolve();
			});
		} else {
			resolve();
		}

	});
}

function _createLogger(callback) {
	logger = new bunyan({
		name : 'soatt',
		streams : [ {
			name : 'soatt',
			level : 'trace',
			stream : new rotateStream({
				file : strftime(homedir() + '/.soatt/logs/soatt.log'),
				size : "20m",
				keep : 5,
				compress : false
			})
		} ],
		serializers : {
			logRequests : bunyan.stdSerializers.req,
			logResponse : bunyan.stdSerializers.res
		},
	});
	errorlogger = new bunyan({
		name : 'soatterror',
		streams : [ {
			name : 'soatterror',
			level : 'trace',
			stream : new rotateStream({
				file : strftime(homedir() + '/.soatt/logs/soatt-error.log'),
				size : "20m",
				keep : 1,
				compress : false
			})
		} ],
		serializers : {
			logRequests : bunyan.stdSerializers.req,
			logResponse : bunyan.stdSerializers.res
		},
	}); 
	callback();
}

function _loadLanguages(callback) {
	new Promise(function(resolve) {
		Globalize.load(require("cldr-data/supplemental/likelySubtags"));
		// load all Message files from resourcebundle into Globalize
		var bundlepath = path.resolve(__dirname, "../resourcebundle");
		var files = fs.readdirSync(bundlepath);
		files.forEach(function(file) {
			Globalize.loadMessages(require(path.resolve(bundlepath, file)));
		});
		Globalize.locale("en");
		resolve();
	}).then(callback);
}

function loggerStart() {
	logger.info("************ Start Display Current Environment ************");
	logger.info({
		Environment : {
			Architecture : os.arch(),
			OSPlatform : os.platform(),
			OSRelease : os.release(),
			NodeVersion : process.version,
			NodeExecPath : process.execPath,
			NodeEnv : process.env,
			NodeCWD : process.cwd(),
			ToolVersion : pjson.version,
			TimezoneOffset : new Date().toTimeString().slice(9,
					new Date().toTimeString().length)
		}
	});
	logger.info("************* End Display Current Environment *************");
	logger.info("Starting SOATT Transfer tool");
}

function setLoggerErrorOnly() {
	logger = bunyan.createLogger({
		name : "soatt",
		level : 'error',
		stream : process.stderr
	});
}

function timeStamp() {
	var dateStamp = new Date();
	var date = dateStamp.toISOString().slice(0, 10);
	var time = dateStamp.toTimeString().slice(0, 8);
	var milliseconds = ('000' + dateStamp.getMilliseconds()).substr(-3);
	return date + " " + time + ":" + milliseconds;
}

function info(data) {
	console.log(timeStamp() + ": " + data);
	logger.info(data);
}

function error(message, data) {
	console.error(timeStamp() + ": " + message+((data)?((data.message)?(" "+data.message):" "+data):""));
	logger.error(message);
	errorlogger.error(message);
	if (data) {
			logger.error(data);
			errorlogger.error(data);
		if (data.stack) {
			logger.error(data.stack);
			errorlogger.error(data.stack);
		}
	}
}

// if object is object then convert, else return
function objectToString(object) {
	var ret = object;
	// Promise objects cannot be stringified
	if (typeof object === "object" && object !== null
			&& ('function' !== typeof object.then)) {
		return JSON.stringify(object);
	} else if (typeof object !== "undefined" && object !== null) {
		return object.toString();
	} else {
		return ret;
	}

}

function debug(data) {
	logger.debug(data);
}

// entry method name, parameters...
function entry(data) {
	var toLog = "Entering ";
	var first = false;
	for (var i = 0; i < arguments.length; i++) {
		if (first === false) {
			first = true;
			toLog += objectToString(arguments[i]);
		} else {
			toLog += ", " + objectToString(arguments[i]);
		}
	}
	debug(toLog);
}

function setDebug(newDebug) {
	Debug = newDebug;
}

function exit(data) {
	var toLog = "Exiting ";
	var first = false;
	for (var i = 0; i < arguments.length; i++) {
		if (first === false) {
			first = true;
			toLog += objectToString(arguments[i]);
		} else {
			toLog += ", " + objectToString(arguments[i]);
		}
	}
	debug(toLog);
}

function trace(data) {
	logger.trace(data);
}

function warn(data) {
	console.warn(timeStamp() + ": " + Globalize.formatMessage("warning") + " "
			+ data);
	logger.warn(data);
}

function request(data) {
	logger.info({
		logRequests : data
	});
}

function response(data) {
	logger.info({
		logResponses : data
	});
}
/**
 * Using the given log file find all the Buffers containing data
 * @param logfile
 * @param callback
 * @returns
 */
function _getAllLogEntriesWithBuffers(logfile, callback) {
	var stream = fs.createReadStream(logfile);
	var fileData = '';
	var bufferMatch = /\{\\"type\\"\:\\"Buffer\\",\\"data\\":\[((?:[0-9]+,)*[0-9]+)\]/g;	
	new Promise(function(resolve, reject) {
		stream.on('data', function(data) {
			fileData+=data;			
		});
		stream.on('error', function(err) {
			//TODO improve error functionality for streams
			if (err.code === 'EPERM') {
				error(Globalize.formatMessage("fileReadPermissionDenied", logfile), err);
			} else if (err.code === 'ENOENT') {
				error(Globalize.formatMessage("logFileNotFound", logfile), err);
			} else {
				logger.error(Globalize.formatMessage("logFileGenericError", logfile), err);
			}
			reject();
		});
		stream.on('end', function() {
			resolve(fileData);
		});
	}).then(function(filedata){
		var bufferLines=[];
		var lines= filedata.split('\n');
		for(var l=0;l<lines.length;l++){
			var matches = bufferMatch.exec(lines[l]);			
			if(matches && matches.length > 1) {
				bufferLines.push(lines[l]);
			}
			if(lines.length-1===l){
				callback(bufferLines);
			}
		}
	}).caught(function(e){
		callback();
	});
}
/**
 * Not current used, but could prove useful in the future
 * @param lineNo
 * @param logfile
 * @param callback
 * @returns
 */
function _getLineInLog(lineNo, logfile, callback) {
	var stream = fs.createReadStream(logfile);
	var fileData = '';
	stream.on('data', function(data) {
		fileData += data;
		var lines = fileData.split('\n');
		if (lines.length >= +lineNo) {
			stream.destroy();
			callback(null, lines[+lineNo]);
		}
		// Add this else condition to remove all unnecesary data from the
		// variable
		else {
			fileData = Array(lines.length).join('\n');
		}
	});
	stream.on('error', function(err) {
		//TODO handle errrors
		error(err);
	});

	stream.on('end', function() {
		callback('File end reached without finding line', null);
	});
}

/**
 * From the given Directory retreive a list of wsrrtoapic log files
 * 
 * @param directory
 * @param callback
 *            
 */
function _retrieveLogFilesFromDirectory(directory, callback) {
	fs.readdir(directory, function(err, files) {
		if (err) {
			error(Globalize.formatMessage("logUnableToRetrieveDirectoryContentsGeneric", directory,err));
			callback();
		} else {			
			// retrieve only log files produced by the tool
			// do it in reverse as allows for splicing to occur without
			// impacting the count
			for (var f = files.length - 1; f >= 0; f--) {
				if (files[f].indexOf("wsrrtoapic") === -1) {
					files.splice(f, 1);
				}
				if (f === 0) {
					//check again once all the splicing is finished
					if (files.lenght === 0) {
						error(Globalize.formatMessage("logEmptyDirectory",directory));
						callback();
					} else {
						callback(files);
					}
				}
			}
		}
	});
}

function _selectFileForProcessing(directory, callback) {
	_retrieveLogFilesFromDirectory(
		directory,
		function(files) {
			if (files !== null) {
				var numbOfFiles = files.length;
				var exit = false;
				// while (!exit) {
				new Promise(function(resolve, reject) {
					for (var i = 0; i < files.length; i++) {
						console.log((i + 1) + '.' + ' ' + files[i]);
						if (i === files.length - 1) {
							resolve();
						}
					}
				}).then(function() {
					prompt.start();
						prompt.get(
							[ {
								name : 'logFileNumber',
								description : Globalize.formatMessage("selectLogFileNum"),
								message : Globalize.formatMessage("logFileNumber",files.length),
								type : 'integer',
								required : true,
								conform : function(logFileNumber) {
									return (logFileNumber >= 0 && logFileNumber <= files.length);
								}
							} ],
							function(err, result) {
								if (result.logFileNumber === 0) {
									callback("0");
								} else {
								// readjust number
									var fileNum = result.logFileNumber - 1;
									callback(directory+ '/'+ files[fileNum]);
								}
							});
				});
			}
		});
}

function _processLogFile(file, resolve) {
	fs.readFile(file,function(err, data) {
		if (err) {
			if (err.code === 'EPERM') {
				error(Globalize.formatMessage("fileReadPermissionDenied", file), err);
			} else if (err.code === 'ENOENT') {
				error(Globalize.formatMessage("logFileNotFound", file), err);
			} else {
				error(Globalize.formatMessage("logFileGenericError", file), err);
			}
		} else {
			prompt.start();
			prompt.get(
				[ {
					name : 'logAction',
					description : Globalize.formatMessage("logFileAction"),
					message : Globalize.formatMessage("logFileActionError"),
					type : 'integer',
					required : true,
					conform : function(logAction) {
						return (logAction >= 0 && logAction <= 3);
					}
				} ],
				function(err, result) {
					if (err) {
						_processLogFile(file,resolve);
					} else {
						var logAction = result.logAction;
						var callback = function(err, stdout, stderr) {
						var result = {stdout : stdout,stderr : stderr};
							if (err === null) {
								/* success, do not put through the logger as this would add
								* potenitally 20MB to the log immediatelyand cause it to 
								* roll and this would not be good */
								if (logAction === 1) {
									console.log(stdout);
									resolve();
								} else if (logAction === 2) {
									_createDirectory(homedir()+ "/.soatt/logs/processed/",
									function() {																		
										var filename = _.cloneDeep(file);
										new Promise(function(resolve,reject) {
											var count = 0;
											while (!(filename.indexOf("\\") === -1 && filename.indexOf("/") === -1)) {
												var tmp = filename.substring(count,filename.length);
												if ((tmp.indexOf("\\") === -1 && tmp.indexOf("/") === -1)) {
													filename = _.cloneDeep(tmp);
													resolve();
												} else {
													count++;
												}
											}
										}).then(function() {
											fs.writeFile(homedir()+ "/.soatt/logs/processed/"+ filename+ '.json',stdout,
												function(err) {
													if (err) {
														console.log(Globalize.formatMessage("processedLogFileError"));
														error(err);
													}
													resolve();
											});
										});
									});
								} else if (logAction === 3) {
									_getAllLogEntriesWithBuffers(file,function(lines) {		
										lines.forEach(function(line){
											trace.expandTraceBuffers(JSON.parse(line));																			
										});
									});													
								}
							} else {
								result.error = err;
								error(err);
								resolve(result);
							}
						};
						// Currently the logger will only produce non-standardjson conversions (Another
						// Json parser would fail the processed output additional options need to be looked at and how
						// they could be applied here --time local sets the timestamp to be whereever the tool is run from.
						var bunyanPath = require.resolve("bunyan");
						// cover linux and windows cases due to differencesin slashes
						bunyanPath = bunyanPath.replace("lib/bunyan.js","bin/bunyan");
						bunyanPath = bunyanPath.replace("lib\\bunyan.js","bin\\bunyan");
						var cmd = "node "+ bunyanPath+ " " + file + " -j --time local";
						// Need to increase buffersize from 200KB to be above single log size setting to >40MB to provide additional space
						// above the max log size, a processed 20MB log can take up ~30MB
						var childProcess = exec(cmd,
							{maxBuffer : 1024 * 1024 * 40}
							, callback);
						}
				});
		}
	});
}

function reviewLogs(input, callback) {
	if (input.length > 0) {
		if (input[0].indexOf("\\") === -1 && input[0].indexOf("/") === -1) {
			_retrieveLogFilesFromDirectory(homedir() + '/.soatt/logs',
					function(files) {
						if (files !== null) {
							var path = homedir() + '/.soatt/logs/' + input[0];
							var found = false;
							new Promise(function(resolve, reject) {
								for (var i = 0; i < files.length; i++) {
									if (files[i] === input[0]) {
										found = true;
										_processLogFile(path, resolve);
									} else if (i === files.length - 1) {
										if (!found) {
											resolve();
										}
									}
								}
							}).then(function() {
								if (!found) {
									error(Globalize.formatMessage("unableToRetrieveLogFile", path));
								}
								callback();
							});
						}});
			} else {
				// File contains / or \ therefore it is assumed that
				// there is a path to the file
				_processLogFile(input[0], function() {
				callback();
			});
		}
	} else {
		// no file has been requested need to display all available logs files associated with a number so that the file can be requested
		_selectFileForProcessing(homedir() + '/.soatt/logs/',
				function(file) {
					if (file !== "0") {
						_processLogFile(file, function() {
							reviewLogs(input, callback);
						});
					} else {
						callback();
					}
				});
	}
}

function traceBuffers(input,callback){
	if (input.length > 1) {
		if (input[1].indexOf("\\") === -1 && input[1].indexOf("/") === -1) {
			_retrieveLogFilesFromDirectory(homedir() + '/.soatt/logs',
				function(files) {
					if (files !== null) {
						var path = homedir() + '/.soatt/logs/' + input[1];
						var found = false;
						new Promise(function(resolve, reject) {
							for (var i = 0; i < files.length; i++) {
								if (files[i] === input[1]) {
									found = true;
									_getAllLogEntriesWithBuffers(path,function(lines) {		
										lines.forEach(function(line){
											trace.expandTraceBuffers(JSON.parse(line));																			
										});
										callback();
									});	
								} else if (i === files.length - 1) {
									if (!found) {
										resolve();
									}
								}
							}
						}).then(function() {
							if (!found) {
								error(Globalize.formatMessage("unableToRetrieveLogFile", path));
							}
							callback();
						});
					}
				});						
		} else {
			// File contains / or \ therefore it is assumed that
			// there is a path to the file
			_getAllLogEntriesWithBuffers(input[1],function(lines) {		
				lines.forEach(function(line){
					trace.expandTraceBuffers(JSON.parse(line));																			
				});
				callback();
			});	
		}							
	} else {
		// no file has been requested need to display all
		// available logs files associated with a number
		// so that the file can be requested
		_selectFileForProcessing(homedir() + '/.soatt/logs/',
			function(file) {
				if (file !== "0") {
					_getAllLogEntriesWithBuffers(file,function(lines) {		
						lines.forEach(function(line){
							trace.expandTraceBuffers(JSON.parse(line));																			
						});
						callback();
					});	
				} else {
					callback();
				}
			});
}
}

function initalize(callback) {
	_createDirectory(homedir() + '/.soatt/logs', function() {
		_createLogger(function() {
			_loadLanguages(function() {
				if (callback) {
					callback();
				}
			});
		});
	});
}

module.exports = {
	initialize : initalize,
	loggerStart : loggerStart,
	info : info,
	error : error,
	entry : entry,
	exit : exit,
	warn : warn,
	setDebug : setDebug,
	debug : debug,
	request : request,
	response : response,
	Globalize : Globalize,
	reviewLogs : reviewLogs,
	traceBuffers:traceBuffers,
	setLoggerErrorOnly : setLoggerErrorOnly
};
