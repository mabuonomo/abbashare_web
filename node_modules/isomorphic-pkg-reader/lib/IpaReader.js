var inherits = require('inherits');
var Reader = require('./Reader');
var utils = require('./utils');
var plist = require('./plistParser');
var PNGReader = require('isomorphic-png.js');

var PLIST_REG = new RegExp('payload\/.+?\.app\/info.plist$', 'i');
var PROVISION_REG = /payload\/.+?\.app\/embedded.mobileprovision/;

var DEFAULT_OPTIONS = {
  withIcon: false,
  iconType: 'base64'
};

function IpaReader(path, options) {
  if (!(this instanceof IpaReader)) return new IpaReader(path, options);
  Reader.call(this, path);
  this.options = utils.extend({}, DEFAULT_OPTIONS, (options || {}));
}

inherits(IpaReader, Reader);

IpaReader.prototype.parse = function(callback) {
  var whatYouNeed = [PLIST_REG, PROVISION_REG];
  var that = this;

  this.getEntries(whatYouNeed, function(error, buffers) {
    if (error) return callback(error);

    var plistInfo, provisionInfo;

    if (buffers[PLIST_REG]) {
      try {
        plistInfo = plist.parse(buffers[PLIST_REG]);
      } catch (e) {
        return callback(e);
      }
    } else {
      return callback(new Error('Parse ipa file failed, can not find info.plist.'));
    }

    if (buffers[PROVISION_REG]) {
      try {
        provisionInfo = buffers[PROVISION_REG].toString('utf-8');
        var firstIndex = provisionInfo.indexOf('<');
        var lastIndex = provisionInfo.lastIndexOf('</plist>');
        provisionInfo = provisionInfo.slice(firstIndex, lastIndex);
        provisionInfo += '</plist>';

        provisionInfo = plist.parse(provisionInfo);
      } catch (e) {
        return callback(e);
      }
    }

    plistInfo.mobileProvision = provisionInfo;

    if (that.options.withIcon) {
      if (typeof Blob === 'undefined' || typeof document === 'undefined' || typeof URL === 'undefined') {
        console.warn('withIcon options only works in browser!');
      } else {
        var iconName = utils.findOutIcon(plistInfo, 'ipa');

        return that.getEntry(new RegExp(iconName.toLowerCase()), function(error, blob) {
          if (error) return callback(error);

          if (blob) {
            return that.parseIcon(blob, function(err, png) {
              if (err) {
                console.error('Error happened when parseIcon');
                console.error(err);
                return callback(null, plistInfo);
              }

              var icon = utils.redraw(png);

              if (icon) {
                if (that.options.iconType === 'blob') {
                  return utils.base64ToBlob(icon, 'image/png', function(error, iconBlob) {
                    if (error) {
                      console.error('Error happened when turning blob.');
                      console.error(error);
                      return callback(null, plistInfo);
                    }

                    plistInfo.icon = URL.createObjectURL(iconBlob);

                    callback(null, plistInfo);
                  });
                } else if (that.options.iconType === 'base64') {
                  plistInfo.icon = icon;
                }
              }

              callback(null, plistInfo);
            });
          } else {
            callback(null, plistInfo);
          }
        })
      }
    }

    callback(null, plistInfo);
  });
};

IpaReader.prototype.parseIcon = function(buffer /* or blob*/, callback) {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)) {
    const pngReader = new PNGReader(buffer);
    pngReader.parse(function(err, png) {
      if (err) return callback(err);
      callback(null, png);
    });
  } else if (typeof Blob !== 'undefined' && buffer instanceof Blob) {
    // in browser
    const fileReader = new FileReader();

    fileReader.onload = function(e) {
      const pngReader = new PNGReader(e.target.result);
      pngReader.parse(function(err, png) {
        if (err) return callback(err);
        callback(null, png);
      });
    };

    fileReader.readAsArrayBuffer(buffer);
  } else {
    return callback(new Error('Invalid first argument, Blob or Buffer expected, but received ' + (typeof buffer) + '.'));
  }
};

IpaReader.prototype.redraw = function(png, type, callback) {
  if (typeof Blob === 'undefined' || typeof document === 'undefined' || typeof URL === 'undefined') {
    console.warn('withIcon options only works in browser!');
    return callback(new Error('withIcon options only works in browser!'));
  }

  if (typeof type === 'function') {
    callback = type;
    type = 'base64';
  }

  var icon = utils.redraw(png);

  if (icon) {
    if (type === 'blob') {
      return utils.base64ToBlob(icon, 'image/png', function(error, iconBlob) {
        if (error) {
          console.error('Error happened when turning blob.');
          console.error(error);
          return callback(error);
        }

        callback(null, URL.createObjectURL(iconBlob));
      });
    } else if (type.iconType === 'base64') {
      callback(null, icon);
    }
  } else {
    callback();
  }
};

module.exports = IpaReader;
