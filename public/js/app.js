'use strict'

angular.module('ANNO', [
  'ngRoute',
  'ngCookies',
  // 'ngResource',
  'ANNO.controllers',
  'ANNO.directives',
  'ui.bootstrap'
]).config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {
    templateUrl: '/partials/login.html',
    controller: 'LoginCtrl'
  }).when('/', {
    templateUrl: '/partials/books.html',
    controller: 'BooksCtrl'
  }).when('/:uid/book/:bid', {
    templateUrl: '/partials/book.html',
    controller: 'BookCtrl'
  }).when('/:uid/book/:bid/new', {
    templateUrl: '/partials/edit.html',
    controller: 'EditorCtrl'
  }).when('/:uid/info', {
    templateUrl: '/partials/info.html',
    controller: 'InfoCtrl'
  }).when('/note/:nid', {
    templateUrl: '/partials/note.html',
    controller: 'NoteCtrl'
  }).when('/note/:nid/edit', {
    templateUrl: '/partials/edit.html',
    controller: 'EditorCtrl'
  }).when('/friends', {
    templateUrl: '/partials/friends.html',
    controller: 'FriendsCtrl'
  }).when('/about', {
    templateUrl: '/partials/about.html'
  }).when('/:uid/', {
    templateUrl: '/partials/books.html',
    controller: 'BooksCtrl'
  }).otherwise({
    templateUrl: '/partials/error.html'
  })
}])
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('HttpLoadingIntercepter')
}])
.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true)
}])
.run(function($route, $rootScope, $location, UserService) {
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    if ( !UserService.isLoggedIn ) {
      if ( next.templateUrl == "/partials/login.html" || next.templateUrl == "/partials/about.html" ) {
      } else {
        $location.path( "/login" )
      }
    }
  })
})
