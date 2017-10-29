var fs = require('fs');
var zip = require('zip');

function createUrl(src){
  var blob = new Blob([src], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

var zWorker = createUrl(fs.readFileSync(__dirname + '/vendor/z-worker.js', 'utf8'));
zip.workerScripts = {
  deflater: [zWorker, createUrl(fs.readFileSync(__dirname + '/vendor/deflate.js', 'utf8'))],
  inflater: [zWorker, createUrl(fs.readFileSync(__dirname + '/vendor/inflate.js', 'utf8'))]
};

module.exports = zip;

