import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './view.html';
import css from './view.css';
import { Meteor } from 'meteor/meteor';
import uiRouter from '@uirouter/angularjs';
import ngMaterial from 'angular-material';
import Dropbox from 'dropbox';
import { MongoUploads } from '../../api/mongo/mongo_upload.js';
import 'angular-socialshare';
import 'angular-update-meta';

const nameClass = 'view';
var controller;
var shortId = '';

class Controllerview {

  constructor($scope, $stateParams, $mdDialog, $location, Socialshare) {
    'ngInject';

    $scope.viewModel(this);

    controller = this;
    this.message = "Waiting...";
    this.$mdDialog = $mdDialog;

    shortId = $stateParams.shortId;
    $scope.showLink = false;

    $scope.owner = {};

    // Meteor.logout();

    // console.log($stateParams.shortId);

    this.helpers({
      getApp() {
        var app = MongoUploads.findOne({ 'info.shortId': shortId });//.fetch()[0];

        var hour4_in_seconds = 14400;
        var date_now = Math.floor(Date.now() / 1000);

        //prendo il link solo se non c'è o se sono passate 4h
        if (app && app.info.temporaryLinkPlist !== undefined && app.info.temporaryLink.time + hour4_in_seconds > date_now) {
          $scope.showLink = true;
        } else {
          $scope.showLink = false;
        }
        if (app) {
          $scope.owner = Meteor.users.findOne({ _id: app.info.ownerId });
          // console.log($scope.owner);
        }

        //   $scope.getTemporaryLink();

        return app;
      }
    });

    $scope.getTemporaryLink = function () {
      Meteor.call('getTemporaryLink', {
        shortId: shortId
      }, (err, res) => {
        if (err) {
          // alert(err);
        } else {
          // success!
          // console.log(res);
        }
      });
    }

    $scope.ios = function () {

      var iDevices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
      ];

      if (!!navigator.platform) {
        while (iDevices.length) {
          if (navigator.platform === iDevices.pop()) { return true; }
        }
      }

      return false;

    }

    $scope.share = function (app, provider) {
      Socialshare.share({
        'provider': provider,//'facebook',
        'attrs': {
          'socialshareUrl': Meteor.absoluteUrl() + 'view/' + app.info.shortId,
          'socialshareHashtags': 'abbashare, ios, enterprise',
          'socialshareText': 'abbashare | tools for developers'
        }
      })
    }

    $scope.getTemporaryLink();

    // getTemporaryLink();
    $scope.updateDownload = function () {
      Meteor.call('updateDownload', {
        shortId: shortId
      }, (err, res) => {
        if (err) {
          // alert(err);
        } else {
          // success!
          // console.log(res);
        }
      });
    }

  }

  showAlert(text) {
    this.$mdDialog.show(
      this.$mdDialog.alert()
        // .parent(angular.element(document.querySelector('#popupContainer')))
        .clickOutsideToClose(true)
        // .title('Info')
        .textContent(text)
        .ariaLabel('Alert Dialog')
        .ok('Ok')
      // .targetEvent(ev)
    );
  }
}

Controllerview.$inject = ['$scope', '$stateParams', '$mdDialog', '$location', 'Socialshare'];

export default angular.module(nameClass, [
  angularMeteor,
  uiRouter,
  ngMaterial,
  '720kb.socialshare',
  'updateMeta'
]).component(nameClass, {
  templateUrl: template,
  controller: Controllerview
}).config(("config", config));

config.$inject = ['$stateProvider', '$qProvider', '$locationProvider'];

//routing
function config($stateProvider, $qProvider, $locationProvider) {
  'ngInject';

  // $locationProvider.html5Mode(true);

  $stateProvider.state('view_a', {
    url: '/view/:shortId',
    views: {
      // 'header': {
      //   template: '<header></header>'
      // },
      "main": {
        template: '<view></view>'
      }
    }
    // ,
    // resolve: {
    //   url: function ($location) {
    //     return $location.url().replace("#", "?")
    //   }
    // }
  });

}