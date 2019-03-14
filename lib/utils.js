"use strict";
var _ = require("lodash");
var expand = require("glob-expand");
var vinylFile = require("vinyl-file");
var File = require("vinyl");

/**
 * Get array of vinyl files based on clconfig.json
 * In case if 'file' is directory further processing
 * is skipped
 *
 * @param {Array} files
 * @param {String} src
 * @param {String} base
 * @param {String} dest
 */
var getConfigCollection = function(files, src, options, dest) {
  var fileCollection = [];
  _.each(files, function(file) {
    try {
      var clFile = vinylFile.readSync(file, {cwd: src, base: src});
      clFile.base = options.root;
      clFile.cwd = options.root;
      clFile.path = dest + "/" + file;
      fileCollection.push(clFile);
    }catch(e) {
      // Handle error
      if (e.code === "ENOENT" || e.code === "EISDIR") {
        if (options.debug === true) {
          console.debug(file + ": -> Is either a directory or does not exists");
        }   
      }
   }
  });
  return fileCollection;
};

/**
 * Builds content and descriptor files based on clconfig.json
 * Also it generates viny form for actual files which should
 * be send to gulp pipeline
 * Example for clientLibs:
 * <p>
 * clientLibsConfig: {
 *  "example.base.lib": {
 *    "js": [{
				"files": [
          "bootstrap.js",
          "jquery.js"
				],
				"path": "src/js/"
			}]
 *  }
 * </p>
 * This method will create a css.txt file under <gulp.dest>/example.base.lib with the following content:
 * "#base=js
 *
 * bootstrap.js"
 * "jquery.js"
 *
 * @param {Object} clientLibs
 * @param {string} clientLibsRoot
 * @returns {[], []}
 */
var generateClientLibFiles = function writeClientLibFiles(clientLibs, options) {
  var content;
  var files;
  var libFiles = {};
  libFiles.fileCollection = [];
  libFiles.descriptors = [];

  var clientLibsKeys = _.keys(clientLibs);
  _.map(clientLibsKeys, function(name) {
    var expandOptions;

    if (clientLibs[name].hasOwnProperty("js")) {
      content = "#base=js\n\n";
      if (clientLibs[name].js.length > 0) {
        _.each(clientLibs[name].js, function(fileObj) {
          expandOptions = {cwd: fileObj.path};
          files = expand(expandOptions, fileObj.files);
          content += files.join("\n");
          content += "\n";
          libFiles.fileCollection = _.union(libFiles.fileCollection,
            getConfigCollection(files, fileObj.path, options, options.root + name + "/js"));
        });
        content.trim();
        var jsFile = new File({
          base: options.root,
          cwd: options.root,
          path: options.root + name + "/js.txt",
          contents: new Buffer(content)
        });
        libFiles.descriptors.push(jsFile);
      }
    }

    if (clientLibs[name].hasOwnProperty("css")) {
      if (clientLibs[name].css.length > 0) {
        content = "#base=css\n\n";
        _.each(clientLibs[name].css, function(fileObj) {
          expandOptions = {cwd: fileObj.path};
          files = expand(expandOptions, fileObj.files);
          content += files.join("\n");
          content += "\n";
          libFiles.fileCollection = _.union(libFiles.fileCollection,
            getConfigCollection(files, fileObj.path, options, options.root + name + "/css"));
        });
        content.trim();
        var file = new File({
          base: options.root,
          cwd: options.root,
          path: options.root + name + "/css.txt",
          contents: new Buffer(content)
        });
        libFiles.descriptors.push(file);
      }
    }

    if (clientLibs[name].hasOwnProperty("resources")) {
      if (clientLibs[name].resources.length > 0) {
        _.each(clientLibs[name].resources, function(fileObj) {
          expandOptions = {cwd: fileObj.path};
          files = expand(expandOptions, fileObj.files);
          libFiles.fileCollection = _.union(libFiles.fileCollection,
            getConfigCollection(files, fileObj.path, options, options.root + name + "/resources"));
        });
      }
    }
  });
  return libFiles;
};


/**
 * Writes the client libs specific json files for the initial import
 * Example for clientLibs:
 * clientLibsConfig: {
 *  "example.base.lib": {
 *    jsBasePath: "dev/js/",
 *      jsFiles: ["vendor.js"]
 *    },
 *  }
 *  "clientLibsRoot": "../dist/clientLibsRoot"
 * This method will create a example.base.lib.json file under ../dist/clientLibsRoot/ with the following content:
 * {
 *    "jcr:primaryType": "cq:ClientLibraryFolder",
 *    "categories": [
 *      "ngw.base.lib"
 *    ]
 * }
 * @param {Object} clientLibs
 * @param {string} libroot
 */
function generateConfigFiles (clientLibs, libroot) {
  var clientLibsKeys = _.keys(clientLibs);
  var configFiles = [];
  _.map(clientLibsKeys, function(name) {

    var content = '<?xml version="1.0" encoding="UTF-8"?>'+ '\n'
    +'<jcr:root'+ ' '+'xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:jcr="http://www.jcp.org/jcr/1.0"' +'\n'
    +'\t'+'jcr:primaryType="cq:ClientLibraryFolder"'+' '
    +'categories='+'"['+name+']"';

    if (clientLibs[name].hasOwnProperty("allowProxy")) {
      content += ' allowProxy="{Boolean}true"';
    }
    if (clientLibs[name].hasOwnProperty("embed")) {
      content += ' embed="[' + clientLibs[name].embed + ']"';
    }
   
    content += '>'+'\n' + '</jcr:root>'; 
    var file = new File({
      base: libroot,
      cwd: libroot,
      path: libroot + name + "/" + ".content.xml",
      contents: new Buffer(content)
    });
    configFiles.push(file);
  });
  return configFiles;
}


module.exports = {
  generateClientLibFiles: generateClientLibFiles,
  generateConfigFiles: generateConfigFiles
};