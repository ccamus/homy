var routeProvider=angular.module('routeProvider',['ngRoute']);
routeProvider.config(function($routeProvider){
	$routeProvider
	.when('/home',{templateUrl:'template/home.html',controller:'homeController'})
	.when('/param',{templateUrl:'template/param.html',controller:'paramController'})
	.when('/editHabitat',{templateUrl:'template/editHabitat.html',controller:'editHabitatController'})
	.otherwise({redirectTo:'/home'});
})
