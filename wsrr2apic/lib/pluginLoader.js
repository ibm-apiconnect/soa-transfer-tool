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

/*
 * Loads plugins from directory ./plugins.
 * 
 * list plugin dir contents sync
 * for each dir:
 * - require directory name
 * - module should export a function we can call to get details with object with type (current is template or capture), name
 * - for capture module should export a function to call to do capture that we call. 
 * - for template module should export a function we call with no params that just registers handlebars helpers
 * 
 * plugin modules should export functions:
 * 
 * getDetails() - returns {name: name of plugin, type: TYPE_CAPTURE or TYPE_TEMPLATE (see below)}
 * 
 * template module:
 * process() - returns when done registering handlebars helpers
 * 
 * capture module:
 * process(configuration, inputDirectory, inputValue, modules) - returns Promise which resolves with nothing when done
 * 
 * configuration - key value pairs from the connectionproperties.properties file, store config here
 * inputDirectory - the path to the input directory if specified with the -i command
 * inputValue - value specified on the command line, for example bsrURI for transfer mode 2
 * modules - object with initialized modules:
 *  {
 *  	logger: initialized Logger from /lib/Logger.js, can be used to log messages to the console and trace
 * 		ttStorage: initialized ttStorage from /lib/ttStorage.js, should be used to store the results of the processing
 * 		templating: initialized templating from /lib/templating.js, can be used to generate YAML from data and provided templates
 * 	}
 */

// then run tool like -t 2 -type <name from module function call> to use our module for t2

var logger=require("../lib/Logger"), path = require('path'), fs = require('fs');

// name of plugins dir off root
var PLUGINS_DIR = "plugins";

var TYPE_CAPTURE = "capture";
var TYPE_TEMPLATE = "template";


// map of plugins name to module, stores the capture plugins
var plugins = {};

/*
 * Get the plugin with the provided name.
 * 
 * Returns the plugin module or null if not found.
 */
function getPlugin(name) {
	logger.entry("pluginLoader.getPlugin", name);
	
	var plugin = null;
	if(plugins[name]) {
		plugin = plugins[name];
	}
	
	logger.exit("pluginLoader.getPlugin", plugin);
	return plugin;
}

/*
 * List the loaded plugins.
 * 
 * Returns an array with plugin names.
 * 
 */
function listPlugins() {
	logger.entry("pluginLoader.listPlugins");
	
	var pluginNames = Object.keys(plugins);
	
	logger.exit("pluginLoader.listPlugins", pluginNames);
	return pluginNames;
}

/*
 * Load plugins from directory and register in plugins map for capture plugins, otherwise run immediately for handlebars plugins.
 * 
 * directory - path to the directory to look in.
 */
function _loadPluginsFromDir(directory) {
	logger.entry("pluginLoader._loadPluginsFromDir", directory);
	
	// get name of dirs in the directory
	var names = fs.readdirSync(directory);
	
	for(var i = 0, len = names.length; i < len; i++) {
		var plugin = names[i];
		var modulePath = path.resolve(directory, plugin);
		try {
			// check if it is a directory
			var moduleStat = fs.lstatSync(modulePath);
			
			if(moduleStat && moduleStat.isDirectory()) {
				logger.debug("loading plugin: " + modulePath);
				var pluginModule = require(modulePath);
	
				var details = pluginModule.getDetails();
				logger.debug("loaded plugin details name: " + details.name + " type: " + details.type);
				if(details.type === TYPE_TEMPLATE) {
					// template, run function
					logger.debug("calling process() on template plugin");
					pluginModule.process();
					logger.debug("called process() on template plugin");
				} else if(details.type === TYPE_CAPTURE) {
					if(details.name) { 
						// save
						plugins[details.name] = pluginModule;
					} else {
						throw new Error("plugin details missing name");
					}
				}
			}
		}catch(e) {
			logger.error("error loading plugin " + plugin, e);
			logger.info(logger.Globalize.formatMessage("errorPluginLoading", plugin, e.toString()));
			// ignore and carry on
		}
	}
	logger.exit("pluginLoader._loadPluginsFromDir");	
}

/*
 * Load plugins from the plugins directory.
 * If an error occurs log and do nothing.
 *
 * Returns when plugins loaded.
 */
function loadPlugins() {
	logger.entry("pluginLoader.loadPlugins");

	try {
		var dir = path.resolve(__dirname, "..", PLUGINS_DIR);
		_loadPluginsFromDir(dir);
	}catch(e){
		// log and ignore
		logger.error("Error loading plugins", e);
		logger.info(logger.Globalize.formatMessage("errorPluginsLoading", e.toString()));
	}
	
	logger.exit("pluginLoader.loadPlugins");	
}

/*
 * Remove plugins from list.
 */
function clearPlugins() {
	logger.entry("pluginLoader.clearPlugins");
	
	// empty array
	plugins = [];
	
	logger.exit("pluginLoader.clearPlugins");
}

module.exports = {		
		getPlugin: getPlugin,
		loadPlugins: loadPlugins,
		clearPlugins: clearPlugins,
		listPlugins: listPlugins,
		
		// testing only
		_test_loadPluginsFromDir: _loadPluginsFromDir
};
