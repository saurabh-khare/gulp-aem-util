'use strict';

const PLUGIN_NAME = "aem-utils";
var _ = require("lodash");
var through = require('through2');
var PluginError = require('plugin-error');
var del = require("del");
var aemsync = require("./lib/utils");


// file can be a vinyl file object or a string
// when a string it will construct a new one
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
      del.sync([
        clientLibObj.clientLibsRoot
      ], {force: true});
    }
    
    //Generate *.txt files for client libraries
    var libFiles = aemsync.generateClientLibFiles(libConfig, libroot);
    libFiles.descriptors.forEach((libFile) => {
      this.push(libFile);
    });

    //Copy actual client library files using gulp pipes
    libFiles.fileCollection.forEach((clFile) => {
      this.push(clFile);
    });

    //Generate content descriptor file for client libraries
    var contentFiles = aemsync.generateConfigFiles(libConfig, libroot);
    contentFiles.forEach((contentFile) => {
      this.push(contentFile);
    });

    callback();
}
});
};
