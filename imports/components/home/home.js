import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './home.html';
import css from './home.css';
import { Meteor } from 'meteor/meteor';
import uiRouter from '@uirouter/angularjs';
// import paypal from 'paypal-rest-sdk';
// import loadingBar from 'angular-loading-bar';
import ngMaterial from 'angular-material';
import Dropbox from 'dropbox';
import fs from 'fs';
// import '/assets/js/dropzone.js';
import lfNgMdFileInput from 'lf-ng-md-file-input';

// import '../../../node_modules/mdi/css/materialdesignicons.min.css';

import { MongoUploads } from '../../api/mongo/mongo_upload.js';
// import ngdropzone from 'ngdropzone';

import ngFileUpload from 'ng-file-upload';
import ngMessage from 'angular-messages';
import amenu from '../amenu/amenu';

import 'angular-socialshare';

const nameClass = 'home';
var controller;
var $mdDialog;

var CLIENT_DROPBOX_ID = Meteor.settings.public.dropbox_api_id;

class Controllerhome {

  constructor($scope, $stateParams, $http, $mdDialog, $mdToast, $state, Socialshare) {
    'ngInject';

    $scope.viewModel(this);

    controller = this;
    this.message = "Waiting...";

    this.$mdDialog = $mdDialog;

    this.helpers({
      currentUser() {
        // console.log("cerco l'utente loggato" + JSON.stringify(Meteor.user()));
        return Meteor.user();
      },
      myApps() {
        return MongoUploads.find({ 'info.ownerId': Meteor.userId() }, { sort: { 'info.uploadedAt': -1 } }).fetch();
      }

    });

    // $scope.logout = function () {
    //   // Meteor.logout();

    //   var confirm = $mdDialog.confirm()
    //     .title('We will miss you!')
    //     .textContent('Really, do you want logout?')
    //     // .ariaLabel('Lucky day')
    //     // .targetEvent(ev)
    //     .ok('Logout!')
    //     .cancel('Cancel');

    //   $mdDialog.show(confirm).then(function () {
    //     Meteor.logout(function (err) {

    //       if (err) {
    //         console.log('Error logging out: ' + err); // using mrt:bootstrap-alerts
    //       } else {
    //         // your cleanup code here
    //         // window.location.href = "/login";
    //         $state.go("login_a");
    //       }
    //     });
    //   }, function () {
    //     // $scope.status = 'You decided to keep your debt.';
    //   });



    // }

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

    $scope.deleteApp = function (app) {

      var text = '';
      try {
        text = 'Do you want delete ' + app.info.info[0].CFBundleName + '?';
      } catch (err) {
        text = 'Do you want delete it?';
      }

      var confirm = $mdDialog.confirm()
        .title('Warning')
        .textContent(text)
        // .ariaLabel('Lucky day')
        // .targetEvent(ev)
        .ok('Delete it!')
        .cancel('Cancel');

      $mdDialog.show(confirm).then(function () {
        Meteor.call('deleteApp', {
          id: app._id
        }, (err, res) => {
          if (err) {
            alert(err);
          } else {
            // success!
            // console.log(res);
          }
        });
      }, function () {
        // $scope.status = 'You decided to keep your debt.';
      });

    }

    $scope.showSimpleToast = function (text) {

      $mdToast.show(
        $mdToast.simple()
          .textContent(text)//'Simple Toast!')
          .position('top right')
          .hideDelay(3000)
      );
    };

    $scope.progress = 0;
    //salvo prima localmente e poi effettuo l'upload a dropbox
    $scope.upload = function () {
      // console.log($scope.fileArray);

      // var imagesFiles = $scope.fileArray;

      $scope.fileArray.forEach(function (element) {
        var selectedFile = element.lfFile;
        // console.log(selectedFile);

        // if (selectedFile.mime-type == "application/x-itunes-ipa") {

        var arr = selectedFile.name.split('.');
        var extension = (arr[arr.length - 1]).toLowerCase();;

        if (extension == 'ipa') {
          $scope.showSimpleToast("Upload..");

          //salve local file
          // var selectedFile = imagesFiles[0];
          // console.log(selectedFile);
          var timeStamp = new Date().valueOf();
          var upload = MongoUploads.insert({
            file: selectedFile,
            streams: 'dynamic',
            chunkSize: 'dynamic',
            fileName: 'imagen' + timeStamp.toString(),
            onProgress: function (progress, fileData) {

              $scope.$apply(function () {
                // $scope.$apply
                $scope.progress = progress;
                // console.log(progress);

                if (progress == 100) {
                  $scope.progress = 0;
                }
              });
            },
            onUploaded: function (error, fileObj) {
              if (error) {
                alert('Error during upload: ' + error);
              } else {
                // console.log("upload effettuato");
                // console.log(fileObj);
                // console.log(fileObj.path);

                // MongoUploads.update(fileObj._id, {
                //   $set: {
                //     ownerId: Meteor.user()._id
                //   }
                // });

                $scope.showSimpleToast("Processing..");

                Meteor.call('upload_dp', {
                  access_token: Meteor.user().profile.access_token,
                  file: fileObj,
                  ownerId: Meteor.user()._id,
                  file_original: selectedFile.name
                }, (err, res) => {
                  if (err) {
                    alert(err);
                  } else {
                    // success!
                    // console.log(res);
                  }
                });

              }
            }
          })
        } else {
          $scope.showSimpleToast(selectedFile.name + " is not an .IPA");
        }
        // console.log(upload)
      }, this);

      $scope.fileArray = [];
    }

  }

  controller = this;

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

Controllerhome.$inject = ['$scope', '$stateParams', '$http', '$mdDialog', '$mdToast', '$state', 'Socialshare'];

export default angular.module(nameClass, [
  angularMeteor,
  uiRouter,
  ngMaterial,
  'lfNgMdFileInput',
  ngMessage,
  amenu.name,
  '720kb.socialshare'
]).component(nameClass, {
  templateUrl: template,
  controller: Controllerhome
}).config(("config", config));//run(('run', run));//.config(("dropzoneF", dropzoneF));

config.$inject = ['$stateProvider', '$qProvider'];

//routing
function config($stateProvider, $qProvider) {
  'ngInject';

  $stateProvider.state('home', {
    url: '/home',
    views: {
      // 'header': {
      //   template: '<header></header>'
      // },
      "main": {
        template: '<home></home>'
      }
    },
    resolve: {
      currentUser: ["$q", function ($q) {
        if (Meteor.userId() === null) {
          return $q.reject('AUTH_REQUIRED');
        } else {
          return $q.resolve();
        }
      }],
    },
    // onEnter: ['$state', function ($state) {
    //   if (Meteor.userId() === null)
    //     return $state.go('login');
    // }]
  });

}

// run.$inject = ['$rootScope', '$state', '$transitions'];

// function run($rootScope, $state, $transitions) {
//   'ngInject';

//   $transitions.onError({}, function (transition) {
//     // console.log('error', transition.error().message, transition);
//     switch (transition.error().detail) {
//       case 'AUTH_REQUIRED':
//         $state.go('login');
//         break;

//       case 'WRONG_ROLE':
//         $state.go('login');
//         break;
//     }
//   });
// }

// dropzoneF.$inject = ['dropzoneOpsProvider'];

// function dropzoneF(dropzoneOpsProvider) {
//   dropzoneOpsProvider.setOptions({
//     url: '',
//     method: 'dropzoneCalled',
//     acceptedFiles: 'image/jpeg, images/jpg, image/png',
//     addRemoveLinks: true,
//     dictDefaultMessage: 'Click to add or drop photos',
//     dictRemoveFile: 'Remove photo',
//     dictResponseError: 'Could not upload this photo'
//   });
// };