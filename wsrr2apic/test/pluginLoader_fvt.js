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
// Run these using "./node_modules/.bin/mocha --reporter spec --grep pluginLoader_fvttests"

var should = require('chai').should();
var expect = require('chai').expect;

var pluginLoader = require('../lib/pluginLoader'), path = require('path'), logger = require('../lib/Logger');
var fse = require("fs-extra"), fs = require('fs');

var testFolder = "wsdlTestOutput";

//unit tests for plugin loader
describe('pluginLoader_fvttests', function(){
	before(function(done){
		logger.initialize(done);
	});

	beforeEach(function(){
		try{
			fs.statSync(testFolder);
			// exists - clear
//			console.log("clearing test directory");
			fse.emptyDirSync(testFolder);
		} catch(error) {
			// make
			fs.mkdirSync(testFolder);
		}
	});
	
	describe('_test_loadPluginsFromDir', function(){
		it('loads modules from plugin dir', function(){
			var testDir = path.resolve(__dirname, "plugins");
			
			// load template module
			var template = require('./plugins/template');
			// set template module process() to call callback() so we know it was called
			var called = false;
			var callback = function(){
				called = true;
			};
			template.setToCall(callback);
			
			pluginLoader._test_loadPluginsFromDir(testDir);
		
			// called should be true
			called.should.equal(true);
			
			// get the plugin - also tests getPlugin
			var capturePlugin = pluginLoader.getPlugin("capture1");
			capturePlugin.getDetails().name.should.equal("capture1");
		});	
		
		// empty dir loads nothing
		it('loads nothing from empty dir', function() {
			// check it does not error
			pluginLoader._test_loadPluginsFromDir(testFolder);
			// should be no errors from empty directory			
		});
	});

	describe('getPlugin', function(){
		it('returns empty when nothing loaded', function(){
			// clear
			pluginLoader.clearPlugins();
			// ask for anything
			var plugin = pluginLoader.getPlugin("name");
			expect(plugin).to.equal(null);			
		});
	});

	describe('loadPlugins', function(){
		it('returns empty when main plugins directory empty', function(){
			// clear
			pluginLoader.clearPlugins();
			// load
			pluginLoader.loadPlugins();
			// ask for anything
			var plugin = pluginLoader.getPlugin("name");
			expect(plugin).to.equal(null);			
		});
	});

	describe('listPlugins', function(){
		it('returns empty when main plugins directory empty', function(){
			// clear
			pluginLoader.clearPlugins();
			// load
			pluginLoader.loadPlugins();
			// list
			var plugins = pluginLoader.listPlugins();
			plugins.should.be.length(0);
		});
		
		it('lists modules from plugin dir', function(){
			var testDir = path.resolve(__dirname, "plugins");
			
			pluginLoader._test_loadPluginsFromDir(testDir);

			var plugins = pluginLoader.listPlugins();
			plugins.should.contain.members(['capture1']);
		});	
		
	});

});
