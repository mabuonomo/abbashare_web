var test = require('tape');
var zip = require('./');

test('zipjs-browserify', function(t){
  t.ok(zip);
  t.ok(zip.Reader);
  t.end();
});
