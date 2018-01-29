import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './login.html';
import css from './login.css';
import { Meteor } from 'meteor/meteor';
import uiRouter from '@uirouter/angularjs';
import ngMaterial from 'angular-material';
import Dropbox from 'dropbox';
import slick from 'slick-carousel';
import slickCarousel from 'angular-slick-carousel';
import jQuery from 'jquery';
// import HTTP from 'http';

const nameClass = 'login';
var controller;

class ControllerLogin {

    constructor($scope, $stateParams, $mdDialog, $location, $state) {
        'ngInject';

        $scope.viewModel(this);

        controller = this;
        this.message = "Waiting...";
        this.$mdDialog = $mdDialog;

        // Meteor.logout();
        $scope.access_token = $stateParams.access_token;

        this.helpers({
            getUser() {
                /*var user = Meteor.users.findOne({ 'profile.access_token': $scope.access_token });

                // console.log(user);
                // console.log($scope.access_token);
                if (user) {

                  $scope.loading = true;

                  // console.log(user.profile.user_info.email);
                  // console.log(user.profile.user_info.account_id);
                  $scope.login(user.profile.user_info.email, user.profile.user_info.account_id);
                }*/
            }
        });

        $scope.getAccessTokenFromUrl = function() {
                // console.log();
                return utils.parseQueryString(window.location.hash).access_token;
            }
            // If the user was just redirected from authenticating, the urls hash will
            // contain the access token.
        $scope.isAuthenticated = function() {
            return !!getAccessTokenFromUrl();
        }


        if (Meteor.userId() != null) {
            // window.location.href = "/home";
            console.log("user logged, redirect to home");
            $state.go("home");
        } else {

            // $location.url().replace("#","?");
            // console.log($stateParams);
            // console.log($location.search()['access_token']);
            // console.log($location.hash());

            if ($location.hash() != undefined && $location.hash() != '') {
                // console.log("redirect to " + "/login?" + $location.hash());
                window.location.href = "/login?" + $location.hash();
            }

            //utente appena loggato
            $scope.access_token = $stateParams.access_token;
            if ($stateParams.access_token != undefined && $stateParams.access_token != '') {

                $scope.loading = true;

                Meteor.call('login_dropbox', {
                    access_token: $stateParams.access_token,
                    account_id: $stateParams.account_id
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

        $scope.login = function(username, password) {
            console.log("login");
            Meteor.loginWithPassword(username, password, function(error) {
                if (error) {
                    // controller.showAlert('Credenziali errate');
                    // console.log(error);
                } else {
                    // window.location.href = "/home";
                    console.log("login called, redirect to home");
                    $state.go("home");
                }
            })
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

ControllerLogin.$inject = ['$scope', '$stateParams', '$mdDialog', '$location', '$state'];

export default angular.module(nameClass, [
    angularMeteor,
    uiRouter,
    ngMaterial,
    'slickCarousel'
]).component(nameClass, {
    templateUrl: template,
    controller: ("ControllerLogin", ControllerLogin)
}).config(("config", config));

config.$inject = ['$stateProvider', '$qProvider', '$locationProvider'];

//routing
function config($stateProvider, $qProvider, $locationProvider) {
    'ngInject';

    // $locationProvider.html5Mode(true);

    $stateProvider.state('login_a', {
        url: '/login?access_token&token_type&uid&account_id',
        views: {
            // 'header': {
            //   template: '<header></header>'
            // },
            "main": {
                template: '<login></login>'
            }
        }
        // , resolve: {
        //   currentUser: ["$state", function ($state) {
        //     if (Meteor.userId() === null) {
        //       // return $q.reject('AUTH_REQUIRED');
        //     } else {
        //       // return $state.go('home');
        //     }
        //   }]
        // }
        // ,
        // resolve: {
        //   url: function ($location) {
        //     return $location.url().replace("#", "?")
        //   }
        // }
    });

}