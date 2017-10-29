var inherits = require('inherits');
var Reader = require('./Reader');
var ManifestParser = require('./manifest');
var utils = require('./utils');

var MANIFEST_FTIL_NAME = /^androidmanifest\.xml$/;
var RESOURCE_FILE_NAME = /^resources\.arsc$/;

var DEFAULT_OPTIONS = {
  ignore: [
    'uses-sdk.minSdkVersion',
    'application.activity',
    'application.service',
    'application.receiver',
    'application.provider'
  ],
  searchResource: true,
  withIcon: false,
  iconType: 'base64'
};

function ApkReader(path, options) {
  if (!(this instanceof ApkReader)) return new ApkReader(path, options);
  Reader.call(this, path);
  this.options = utils.extend({}, DEFAULT_OPTIONS, (options || {}));
}

inherits(ApkReader, Reader);

ApkReader.prototype.parse = function(callback) {
  var that = this;

  var whatYouNeed = [MANIFEST_FTIL_NAME];

  if (this.options.searchResource) whatYouNeed.push(RESOURCE_FILE_NAME);

  this.getEntries(whatYouNeed, function(error, buffers) {
    if (error) return callback(error);
    that.parseManifest(buffers[MANIFEST_FTIL_NAME], function(error, apkInfo) {
      if (error) return callback(error);

      if (that.options.searchResource) {
        that.parseResorceMap(buffers[RESOURCE_FILE_NAME], function(error, resourceMapStr) {
          if (error) {
            return callback(error);
          }

          utils.findOutResources(apkInfo, resourceMapStr);

          if (that.options.withIcon) {
            if (typeof Blob === 'undefined' || typeof document === 'undefined' || typeof URL === 'undefined') {
              console.warn('withIcon options only works in browser!');
            } else {
              var icon = utils.findOutIcon(apkInfo, 'apk');

              if (icon) {
                return that.getEntry(icon, { type: 'blob' }, function(error, blob) {
                  if (error) {
                    console.error('Error happened when try paring icon.');
                    console.error(error);
                    return callback(null, apkInfo);
                  }

                  if (blob) {
                    blob = new Blob([blob], { type: 'image/png' });

                    if (that.options.iconType === 'blob') {
                      apkInfo.icon = URL.createObjectURL(blob);
                    } else {
                      return utils.blobToBase64(blob, function(err, base64Icon) {
                        if (err) {
                          console.error('Error happened when try turn blob to base64.');
                          console.error(error);
                          return callback(null, apkInfo);
                        }

                        if (base64Icon) {
                          apkInfo.icon = base64Icon;
                        }

                        callback(null, apkInfo);
                      });
                    }

                    callback(null, apkInfo);
                  }
                });
              }
            }
          }

          callback(null, apkInfo);
        });
      }
    });
  });
};

ApkReader.prototype.parseManifest = function(manifestBuffer, callback) {
  var apkInfo;
  try {
    apkInfo = new ManifestParser(manifestBuffer, {
      ignore: [
        'application.activity',
        'application.service',
        'application.receiver',
        'application.provider',
        'permission-group'
      ]
    }).parse();
  } catch (e) {
    return callback(e);
  }

  callback(null, apkInfo);
};

module.exports = ApkReader;
