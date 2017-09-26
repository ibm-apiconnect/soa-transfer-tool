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
var fs = require('fs'),logger=require('../Logger'),homedir=require("os-homedir");
var constants = fs.constants;

function exit(code){	
	unlock(function(err){
		if(err){
			//console.log("Error removing Lock file, this may need to be removed manually to be able to rerun the tool");
			//logger.error(err);
		}
		process.exit(code);	
	});	
}

function lock(callback){
	//create lock file
	fs.writeFile(homedir() + '/.soatt/.filelock',process.pid,function(err) {
	    if(err) {	        
	        callback(err);
	    }else{
	    	callback();
	    }});
}

function isLocked(callback){	
	fs.access(homedir() + '/.soatt/.filelock',fs.F_OK,function(err){
		err ? callback(false) : callback(true);
	});	
}

function unlock(callback){
	//delete file
	fs.unlink(homedir() + '/.soatt/.filelock',function(err) {
	    if(err) {
	    	callback(err)
	    }else{
	    callback();
	    }
	});
}

module.exports={
	exit:exit,
	lock:lock,	
	isLocked:isLocked
}