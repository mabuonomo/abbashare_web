import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './header.html';
import css from './header.css';
import { Meteor } from 'meteor/meteor';
import uiRouter from '@uirouter/angularjs';
import ngMaterial from 'angular-material';
import ngMdIcons from 'angular-material-icons';
import Dropbox from 'dropbox';

// import { MongoAmbulatory } from '../../../api/mongo/mongo_ambulatory.js';

var CLIENT_DROPBOX_ID = 'hinixw7xesh412x';

const nameClass = 'header';
var controller;

class Controllerheader {

  constructor($scope, $stateParams, $mdDialog, $mdToast, $state) {
    'ngInject';

    $scope.viewModel(this);

    controller = this;
    this.message = "Waiting...";

    this.helpers({
      currentUser() {
        return Meteor.user();
      },
      currentAmbulatory() {
        // console.log("test");
        // try {
        //   var ambulatory = MongoAmbulatory.findOne({ _id: Meteor.user().profile.lastAmbulatoryId });
        //   // console.log(ambulatory);
        //   // console.log(Meteor.user());
        //   return ambulatory;
        // } catch (err) {
        //   // console.log(err);
        // }
        // // return null;
      }
    });

    var dbx = new Dropbox({ clientId: CLIENT_DROPBOX_ID });
    $scope.authUrl = dbx.getAuthenticationUrl(Meteor.absoluteUrl() + "login");

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
  }
}

Controllerheader.$inject = ['$scope', '$stateParams', '$mdDialog', '$mdToast', '$state'];

export default angular.module(nameClass, [
  angularMeteor,
  uiRouter,
  ngMaterial,
  ngMdIcons
]).component(nameClass, {
  templateUrl: template,
  controller: Controllerheader
});//.config(('config', config));

// config.$inject = ['$stateProvider', '$qProvider'];

// //routing
// function config($stateProvider, $qProvider) {
//   'ngInject';

//   $stateProvider.state('header', {
//     url: '/header',
//     views: {
//       // 'header': {
//       //   template: '<header></header>'
//       // },
//       "main": {
//         template: '<header></header>'
//       }
//     }
//   });

// }