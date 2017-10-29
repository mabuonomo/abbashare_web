import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './hash.html';
import css from './hash.css';
import { Meteor } from 'meteor/meteor';
import uiRouter from '@uirouter/angularjs';
import crypto from 'crypto';
import { MongoHash } from '../../api/mongo/mongo_hash.js';
import ngMaterial from 'angular-material';

const nameClass = 'hash';

class Controllerhash {
  // constructor($scope) {
  //   $scope.viewModel(this);

  // }
  constructor($scope, $stateParams, $mdDialog, $mdToast, $state) {
    'ngInject';

    $scope.viewModel(this);

    this.helpers({
      getHashs() {
        // console.log("Hash: " + MongoHash.find());
        return _.shuffle(MongoHash.find().fetch());
      }
    });

  }

  // aggiungo al db se non esiste già una corrispondenza
  addHash(text, hash) {

    // var arrayHash = [{
    //   hash: hash,
    //   algorithm: type
    // }];

    var object = {
      text: text,
      hash: hash,
      count: 0
    };

    //cerco se esiste
    // var oldHash = MongoHash.find({ text: text });
    // console.log(oldHash[0]);
    var oldHash = MongoHash.findOne({ text: text });
    if (!oldHash) {
      MongoHash.insert(object);
    } else {
      // oldHash.hash.push(arrayHash);
      // MongoHash.update(oldHash);

      MongoHash.update({ _id: oldHash._id }, { $set: { count: ++oldHash.count } });
    }
  }

  doSearch() {
    this.found = MongoHash.findOne({ "hash.sha1.hash": this.text_search });

    if (this.found) {
      return;
    }

    this.found = MongoHash.findOne({ "hash.md5.hash": this.text_search });
    if (this.found) {
      return;
    }

    this.found = MongoHash.findOne({ "hash.sha256.hash": this.text_search });
    if (this.found) {
      return;
    }

    this.found = MongoHash.findOne({ "hash.sha512.hash": this.text_search });
    if (this.found) {
      return;
    }

  }

  doHash() {

    // 

    if (this.text != undefined) {
      // console.log("do hash" + this.hash);
      // this.text_hash_sha1 = this.hashAlgorithm('sha1');
      var sha1 = this.hashAlgorithm('sha1');
      var md5 = this.hashAlgorithm('md5');
      var sha256 = this.hashAlgorithm('sha256');
      var sha512 = this.hashAlgorithm('sha512');

      var hash = { sha1, md5, sha256, sha512 };
      this.hash = hash;

      this.addHash(this.text, hash);
    }
  }

  hashAlgorithm(type) {
    var algorithm = type//'sha1'
      , shasum = crypto.createHash(algorithm)

    var textToHash = this.text//"Hello, I want a hash from it"
      , shasum2 = crypto.createHash(algorithm)
    shasum2.update(textToHash)
    var hash2 = shasum2.digest('hex')
    // console.log(hash2 + '  ' + textToHash)

    // this.text_hash = hash2;

    // this.addHash(this.text, hash2, type);

    return { type: type, hash: hash2 };
  }
}

Controllerhash.$inject = ['$scope', '$stateParams', '$mdDialog', '$mdToast', '$state'];

export default angular.module(nameClass, [
  angularMeteor,
  uiRouter,
  ngMaterial
]).component(nameClass, {
  templateUrl: template,
  controller: Controllerhash
}).config(('config', config));

config.$inject = ['$stateProvider', '$qProvider'];

//routing
function config($stateProvider, $qProvider) {
  'ngInject';

  $stateProvider.state('tools_hash', {
    url: '/hash',
    // template: '<home></home>',
    views: {
      // 'header': {
      //   template: '<header></header>'
      // },
      "main": {
        template: '<hash></hash>'
      }
    },
    resolve: {
      currentUser: ["$q", function ($q) {
        if (Meteor.userId() === null) {
          return $q.reject('AUTH_REQUIRED');
        } else {
          return $q.resolve();
        }
      }]
    }
  });

}
