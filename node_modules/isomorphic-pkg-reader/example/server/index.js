var Express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var multer = require('multer');
var app = new Express();
var server = new http.Server(app);
var path = require('path');

var PkgReader = require('../../index');
var utils = require('../utils');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var uploader = multer({
  dest: path.resolve(__dirname, '../uploads/')
}).single('qqfile');

app.post('/upload', function(req, res, next) {
  uploader(req, res, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).send({
        message: err.stack
      });
    }

    if (req.file) {
      var file = req.file;
      var extension = utils.getExtension(file.originalname);
      var reader = new PkgReader(file.path, extension, { searchResource: true });

      reader.parse(function(err, pkgInfo) {
        if (err) {
          return res.status(500).send({
            message: 'Error happened when parsing pkg.',
            error: err.stack
          });
        }

        res.send(pkgInfo);
      });
    } else {
      res.sendStatus(204);
    }
  });
});

server.listen('3002');