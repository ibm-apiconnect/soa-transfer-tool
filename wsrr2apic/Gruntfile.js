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
var nlf = require('nlf');
var fs = require('fs');
var markdown = require('markdown-to-html').Markdown;

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
	usebanner: {
		taskName: {
		  options: {
			position: 'top',
			linebreak: true,
			// grab all line breaks after the header so we don't get one added each run
			replace: /.*\{COPYRIGHT\-TOP\}[\s\S]*\{COPYRIGHT\-END\}.*[\n|\r\n]*/g
		  },
		  files: {
			src: [ './index.js', 'lib/**/*.js', 'test/**/*.js', './Gruntfile.js' ]
		  }
		}
	  },
	  markdown: {
		    all: {
		      files: [
		        {
		          expand: true,
		          src: 'README.md',
		          dest: './',
		          ext: '.html'	
		        },
		        {
		          expand: true,
		          src: 'DETAILS.md',
		          dest: './',
		          ext: '.html'
		        }
		      ]
		    }
		  }	  
  });

  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-markdown');
  
  // grunt copyright - add or update copyright banner
  grunt.registerTask('copyright', ['usebanner']);

  // grunt makereadme - convert readme.md to html
  grunt.registerTask('makereadme', ['markdown']);

  // task to get lic for all runtime dependencies in the package.json
  grunt.registerTask('package-lic', 'list the lics for all runtime dependencies in the package.json', function(){
	  var done = this.async();
	  
	  nlf.find({
		 directory: __dirname,
		 production: true,
		 depth: 0
	  }, function(err, data){
		  if(err) {
			  console.error(err);
		  }
		  
		  var packageLics = [];

		  // get the package.json
		  var pkgJson = require('./package.json');
		  // find just the ones in the package.json dependencies
		  var licLen = data.length;
		  var lic = null;
		  for(var i = 0; i < licLen; i++) {
			  lic = data[i];
			  // see if this one is in package.json
			  if(pkgJson.dependencies[lic.name]) {
				  // save
				  packageLics.push(lic);
			  }
		  }
		  
		  // now output the lics for these
		  var buf = "Name, Version, Directory, Repository, Summary, From package, From lic, From readme\n";
		  var summary = "Unknown";
		  var readmeLic = null;
		  var licenzeLic = null;
		  var pkgLic = null;
		  var LICSOURCES = "lic" + "enseSources";
		  var LICENZE = "lic" + "ense";
		  
		  licLen = packageLics.length;
		  for(i = 0; i < licLen; i++) {
			  lic = packageLics[i];
			  var line = lic.name + "," + lic.version + "," + lic.directory + "," + lic.repository;

			  summary = lic.summary().join(";");
			  pkgLic = lic[LICSOURCES].package.summary().join(",");
			  licenzeLic = lic[LICSOURCES][LICENZE].summary().join(",");
			  readmeLic = lic[LICSOURCES].readme.summary().join(",");
			  
			  line += "," + summary + "," + pkgLic + "," + licenzeLic + "," + readmeLic + "\n";
			  buf += line;
		  }
		  
		  // write
		  fs.writeFile("./lic_dependencies.csv", buf, function(error){
			  if(error) {
				  console.error(error);
			  }
			  console.log("Written lic_dependencies.csv");
			  done();
		  });
	  });
  });
  
  
};