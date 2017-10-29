var ApkReader = require('./lib/ApkReader');
var IpaReader = require('./lib/IpaReader');

function PkgReader(path, extension, options) {
  return new (extension === 'ipa' ? IpaReader : ApkReader)(path, options);
}

module.exports = PkgReader;
