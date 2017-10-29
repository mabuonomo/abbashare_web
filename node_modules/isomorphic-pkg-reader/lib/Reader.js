var Unzip = require('isomorphic-unzip');
var ResourceFinder = require('./ResourceFinder');
var BinaryXmlParser = require('./binaryxml');
var utils = require('./utils');
var MANIFEST_FTIL_NAME = 'androidmanifest.xml';

/**
 *
 * @param {Any} path    In browser, path must be a File object or a Blob. In NodeJS, this must be a string of your file's path.
 * @constructor
 */
function Reader(path) {
  this.path = path;
  this.unzip = new Unzip(path);
}

Reader.prototype.parseResorceMap = function(resourceBuffer, callback) {
  var res;
  try {
    res = new ResourceFinder().processResourceTable(resourceBuffer);
  } catch (e) {
    return callback(e);
  }

  callback(null, res);
};

/**
 *
 *
 * @param {Array<String>} whatYouNeed    Entries' name
 * @param {Object}        options        (Optional)
 * @param {String}        options.type   By default, this function will return an Object of buffers.
 *                                       If options.type='blob', it will return blobs in browser.
 *                                       It won't do anything in NodeJS.
 * @param {Function}      callback       Will be called like `callback(error, buffers)`
 */
Reader.prototype.getEntries = function(whatYouNeed, options, callback) {
  if (utils.isFunction(options)) {
    callback = options;
    options = {};
  }

  whatYouNeed = whatYouNeed.map(function(rule) {
    if (typeof rule === 'string') rule = rule.split('\u0000').join('');
    return rule;
  });

  this.unzip.getBuffer(whatYouNeed, options, function(error, buffers) {
    callback(error, buffers);
  });
};

Reader.prototype.getEntry = function(entryName, options, callback) {
  if (utils.isFunction(options)) {
    callback = options;
    options = {};
  }
  if (typeof entryName === 'string') entryName = entryName.split('\u0000').join('');

  this.unzip.getBuffer([entryName], options, function(error, buffers) {
    callback(error, buffers[entryName]);
  });
};

module.exports = Reader;