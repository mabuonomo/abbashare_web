var PkgReader = require('../../index');
var utils = require('../utils');
var fineUploader = require('beta-dev-uploader');
var JsonFormater = require('./static/jsonFormater');
require('./static/jsonFormater.css');
var Collapsed = require('./static/Collapsed.gif');
var Expanded = require('./static/Expanded.gif');

var $input = document.querySelector('input');
var $status = document.querySelector('#status');
var $json = document.querySelector('#json');
var $icon = document.querySelector('#icon');

var file;

document.addEventListener('click', function(e) {
  if (e.target.id !== 'upload') return;

  if (!file) return;

  uploader.addFiles([file]);
});

var uploader = new fineUploader.FineUploaderBasic({
  multiple: false,
  request: {
    endpoint: '/upload',
  },
  callbacks: {
    onRetry: function(id, name, attemptNumber) {
      console.log('id, name, attemptNumber', id, name, attemptNumber);
    },
    onUpload: function(id, name) {
      console.log('Start uploading file:', name);
    },
    onStatusChange: function(id, prev, next) {
      console.log('Status change from ' + prev + ' to ' + next);
    },
    onComplete: function(id, name, json, xhr) {
      console.log('Upload and parse succeed! Package info:');
      console.log(json);

      alert('Upload and parse pkg succeed, open your console and you can see the result');
    },
    onProgress: function(id, name, uploadedBytes, totalBytes) {
      document.querySelector('.progress-bar').style.width = (uploadedBytes * 100 / totalBytes) + '%';
    }
  }
});

$input.addEventListener('change', function(e) {
  file = e.target.files[0];

  if (!file) return;

  var extension = utils.getExtension(file.name);

  var reader = new PkgReader(file, extension, { searchResource: true, withIcon: true, iconType: 'blob' });

  showStatusMsg(extension + '\'s parsing...');

  var startTime = Date.now();

  reader.parse(function(err, pkgInfo) {
    if (err) {
      showStatusMsg('Error happened when parsing ' + file.name + ', <br/>' + err.stack);
      return;
    }

    showStatusMsg(extension + ' has been parsed successfully, cast ' + (Date.now() - startTime) + 'ms (Don\'t worried, every is async).<br/> package info is down here. ' +
      '<div>' +
      '<button id="upload">Try parsing on server</button>' +
      '<div class="progress">' +
      '<div class="progress-bar"></div>' +
      '</div>' +
      '</div>');

    console.log('package parsed successfully, package info: ');
    console.log(pkgInfo);

    // $json.innerHTML = JSON.stringify(pkgInfo, undefined, 2);
    new JsonFormater({
      dom: '#json',
      imgCollapsed: Collapsed,
      imgExpanded: Expanded
    }).doFormat(pkgInfo);

    $icon.src = pkgInfo.icon;
  });
});

function showStatusMsg(msg) {
  $status.innerHTML = msg;
}
