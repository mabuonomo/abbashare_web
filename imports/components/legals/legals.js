import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './legals.html';
import css from './legals.css';
import { Meteor } from 'meteor/meteor';
import uiRouter from '@uirouter/angularjs';
import ngMaterial from 'angular-material';
import Dropbox from 'dropbox';
import slick from 'slick-carousel';
import slickCarousel from 'angular-slick-carousel';
import jQuery from 'jquery';
// import HTTP from 'http';

const nameClass = 'legals';
var controller;

// var CLIENT_DROPBOX_ID = 'hinixw7xesh412x';

class Controllerlegals {

  constructor($scope, $stateParams, $mdDialog, $location, $state) {
    'ngInject';

    $scope.viewModel(this);

    controller = this;
    this.message = "Waiting...";
    this.$mdDialog = $mdDialog;

    // Meteor.logout();

    this.helpers({
    });


  }
}

Controllerlegals.$inject = ['$scope', '$stateParams', '$mdDialog', '$location', '$state'];

export default angular.module(nameClass, [
  angularMeteor,
  uiRouter,
  ngMaterial,
  'slickCarousel'
]).component(nameClass, {
  templateUrl: template,
  controller: ("Controllerlegals", Controllerlegals)
}).config(("config", config));

config.$inject = ['$stateProvider', '$qProvider', '$locationProvider'];

//routing
function config($stateProvider, $qProvider, $locationProvider) {
  'ngInject';

  // $locationProvider.html5Mode(true);

  $stateProvider.state('legals_a', {
    url: '/legals',
    views: {
      // 'header': {
      //   template: '<header></header>'
      // },
      "main": {
        template: '<legals></legals>'
      }
    }, resolve: {
      currentUser: ["$state", function ($state) {
        if (Meteor.userId() === null) {
          // return $q.reject('AUTH_REQUIRED');
        } else {
          // return $state.go('home');
        }
      }]
    }
    // ,
    // resolve: {
    //   url: function ($location) {
    //     return $location.url().replace("#", "?")
    //   }
    // }
  });

}