import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './amenu.html';
import css from './amenu.css';
import { Meteor } from 'meteor/meteor';
import uiRouter from '@uirouter/angularjs';
import ngMaterial from 'angular-material';

// import { MongoUploads } from '../../../api/mongo/mongo_upload.js';
// import { MongoAmbulatory } from '../../../api/mongo/mongo_ambulatory.js';

const nameClass = 'amenu';
var controller;

class Controlleramenu {

  constructor($scope, $stateParams, $http, $mdDialog, $mdToast, $state) {
    'ngInject';

    $scope.viewModel(this);

    controller = this;
    // this.message = "Waiting...";

    this.helpers({
      currentUser() {
        // console.log("cerco l'utente loggato" + JSON.stringify(Meteor.user()));
        return Meteor.user();
      }
      // getAvatarUrl() {
      //   try {
      //     var ambulatory_id = Meteor.user().profile.lastAmbulatoryId;
      //     // console.log(ambulatory_id);
      //     var ambulatory = MongoAmbulatory.find({ _id: ambulatory_id }).fetch()[0];
      //     // console.log(ambulatory);
      //     var url = MongoUploads.link(ambulatory.avatar);
      //     // console.log("url: " + url);
      //     return url;
      //   } catch (err) { }

      //   console.log("nada");
      // }
    });

    $scope.logout = function () {
      // Meteor.logout();

      var confirm = $mdDialog.confirm()
        .title('We will miss you!')
        .textContent('Really, do you want logout?')
        // .ariaLabel('Lucky day')
        // .targetEvent(ev)
        .ok('Logout!')
        .cancel('Cancel');

      $mdDialog.show(confirm).then(function () {
        Meteor.logout(function (err) {

          if (err) {
            console.log('Error logging out: ' + err); // using mrt:bootstrap-alerts
          } else {
            // your cleanup code here
            // window.location.href = "/login";
            $state.go("login_a");
          }
        });
      }, function () {
        // $scope.status = 'You decided to keep your debt.';
      });
    }

  }



}

Controlleramenu.$inject = ['$scope', '$stateParams', '$http', '$mdDialog', '$mdToast', '$state'];

export default angular.module(nameClass, [
  angularMeteor,
  uiRouter,
  ngMaterial
]).component(nameClass, {
  templateUrl: template,
  controller: Controlleramenu
});//.config(config);

//routing
// function config($stateProvider, $qProvider) {
//   'ngInject';

//   $stateProvider.state('amenu', {
//     url: '/amenu',
//     views: {
//       // 'header': {
//       //   template: '<header></header>'
//       // },
//       "main": {
//         template: '<amenu></amenu>'
//       }
//     }, resolve: {
//       currentUser($q) {
//         if (Meteor.userId() === null) {
//           return $q.reject('AUTH_REQUIRED');
//         } else {
//           // if (Meteor.user().profile.role != "veterinario") {
//           //   return $q.reject('WRONG_ROLE');
//           // }

//           // console.log(Meteor.userId);
//           // if(Meteor.user()) {} 
//           // console.log(Meteor.user());
//           // console.log(Meteor.users.findOne({ _id: Meteor.userId() }));
//           // var a = Meteor.users.findOne({ _id: 'GwW8K7QzSYrsKgNTK' });
//           // console.log("sdsa" + a);

//           return $q.resolve();
//         }
//       }
//     }
//   });

// }