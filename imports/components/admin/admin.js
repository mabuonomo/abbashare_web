import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './admin.html';
import css from './admin.css';
import { Meteor } from 'meteor/meteor';
import uiRouter from '@uirouter/angularjs';
// import paypal from 'paypal-rest-sdk';
// import loadingBar from 'angular-loading-bar';
import ngMaterial from 'angular-material';
import Dropbox from 'dropbox';
import fs from 'fs';
// import '/assets/js/dropzone.js';
import lfNgMdFileInput from 'lf-ng-md-file-input';

import { MongoUploads } from '../../api/mongo/mongo_upload.js';
// import ngdropzone from 'ngdropzone';

import ngFileUpload from 'ng-file-upload';
import ngMessage from 'angular-messages';

const nameClass = 'admin';
var controller;
var $mdDialog;

class Controlleradmin {

  constructor($scope, $stateParams, $http, $mdDialog, $mdToast, $state) {
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
        if (Meteor.userId() !== null) {
          try {
            if (Meteor.user().profile.user_info.email != 'ma.buonomo@gmail.com') {
              $state.go("login_a");
            } else {
              return MongoUploads.find({}, { sort: { 'info.uploadedAt': -1 } }).fetch();
            }
          } catch (err) {
            // console.log(err); 
          }
        }
      },
      allUsers() {
        return Meteor.users.find({}).fetch();
      }

    });

    // if (Meteor.user().profile.email.user_info.email != 'ma.buonomo@gmail.com') {
    //   $state.go("login_a");
    // }

    $scope.deleteApp = function (app) {

      var confirm = $mdDialog.confirm()
        .title('Warning')
        .textContent('Do you want delete ' + app.info.info[0].CFBundleName + '?')
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
        // console.log(file.size);

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
        });
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

Controlleradmin.$inject = ['$scope', '$stateParams', '$http', '$mdDialog', '$mdToast', '$state'];

export default angular.module(nameClass, [
  angularMeteor,
  uiRouter,
  ngMaterial,
  'lfNgMdFileInput',
  ngMessage
]).component(nameClass, {
  templateUrl: template,
  controller: Controlleradmin
}).config(("config", config));//run(('run', run));//.config(("dropzoneF", dropzoneF));

config.$inject = ['$stateProvider', '$qProvider'];

//routing
function config($stateProvider, $qProvider) {
  'ngInject';

  $stateProvider.state('admin', {
    url: '/admin',
    views: {
      // 'header': {
      //   template: '<header></header>'
      // },
      "main": {
        template: '<admin></admin>'
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

run.$inject = ['$rootScope', '$state', '$transitions'];

function run($rootScope, $state, $transitions) {
  'ngInject';

  $transitions.onError({}, function (transition) {
    // console.log('error', transition.error().message, transition);
    switch (transition.error().detail) {
      case 'AUTH_REQUIRED':
        $state.go('login');
        break;

      case 'WRONG_ROLE':
        $state.go('login');
        break;
    }
  });
}

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