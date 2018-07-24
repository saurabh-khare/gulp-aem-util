'use strict';

const PLUGIN_NAME = "aem-utils";
var _ = require("lodash");
var through = require('through2');
var PluginError = require('plugin-error');
var del = require("del");
var aemsync = require("./lib/utils");

module.exports = function(options) {
   options = options || {};
   const DEFAULT_ROOT = "root/";
   const libroot = options.root || DEFAULT_ROOT;

 return through.obj(function(file, encoding, callback) {
  if (file.isNull()) {
    // nothing to do
    return callback(null, file);
}

if (file.isStream()) {
    this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));

} else if (file.isBuffer()) {
    var clientLibObj = JSON.parse(file.contents);
    var libConfig = clientLibObj.clientLibsConfig;
    
    //Clean the client libs root
    if(libroot !== DEFAULT_ROOT){
	  console.log("Cleaning root directory: " + libroot);
      del.sync([
        libroot
      ], {force: true});
    }
    
    //Generate *.txt files for client libraries
	console.debug("Generating text files for libraries");
    var libFiles = aemsync.generateClientLibFiles(libConfig, libroot);
    libFiles.descriptors.forEach((libFile) => {
      this.push(libFile);
    });

    //Copy actual client library files using gulp pipes
	console.debug("Pushing library files to gulp stream");
    libFiles.fileCollection.forEach((clFile) => {
      this.push(clFile);
    });

    //Generate content descriptor file for client libraries
	console.debug("Generating .content.xml files");
    var contentFiles = aemsync.generateConfigFiles(libConfig, libroot);
    contentFiles.forEach((contentFile) => {
      this.push(contentFile);
    });
	
    callback();
}
});
};
