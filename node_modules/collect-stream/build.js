'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = collect;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _concatStream = require('concat-stream');

var _concatStream2 = _interopRequireDefault(_concatStream);

var _once = require('once');

var _once2 = _interopRequireDefault(_once);

function collect(stream, opts, fn) {
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }
  fn = (0, _once2['default'])(fn);
  stream.on('error', fn);
  stream.pipe((0, _concatStream2['default'])(opts, function (data) {
    fn(null, data);
  }));
}

;
module.exports = exports['default'];

