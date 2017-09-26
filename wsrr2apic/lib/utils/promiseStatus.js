/**
 * http://usejsdoc.org/
 */

var Promise=require("bluebird");

function checkPromisesStatus(promises,callback){	
	var stillRunning=false;
	new Promise(function(resolve,reject){
		for(var i=0;i<promises.length;i++){
			if(promises[i].isPending()===true){
				stillRunning=true;
			}
			if(i+1===promises.length){
				resolve();
			}
		}
	}).then(function(){
		if(stillRunning){
			Promise.delay(1000).then(function(){				
				checkPromisesStatus(promises,callback);
			});
		}else{			
			callback();
		}
	});	
}

module.exports = {
		checkPromisesStatus:checkPromisesStatus
};
	