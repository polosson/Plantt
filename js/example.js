/*
 * Usage example of the Plantt AngularJS module
 * MIT licence, @ Polosson 2016
 *
 */
'use strict';

var planttEx = angular.module("planttEx", ["plantt.module"]);

planttEx.controller("planttExample", function($scope){

	$scope.events = [
		{ id: 0, title: 'Opps Lala', type: 'normal', startDate: new Date(2016, 6-1, 21, 8), endDate: new Date(2016, 7-1, 4, 19) },
		{ id: 1, title: 'Wouzah', type: 'normal', startDate: new Date(2016, 7-1, 14, 8), endDate: new Date(2016, 7-1, 15, 19) },
		{ id: 2, title: 'Hoydih', type: 'urgent', startDate: new Date(2016, 7-1, 21, 8), endDate: new Date(2016, 7-1, 25, 19) },
		{ id: 3, title: 'Surpuissant', type: 'urgent', startDate: new Date(2016, 7-1, 19, 8), endDate: new Date(2016, 7-1, 21, 19) },
		{ id: 4, title: 'Gniuk', type: 'urgent', startDate: new Date(2016, 7-1, 15, 8), endDate: new Date(2016, 7-1, 22, 19) },
		{ id: 5, title: 'Gnark', type: 'urgent', startDate: new Date(2016, 7-1, 17, 8), endDate: new Date(2016, 7-1, 18, 19) },
		{ id: 10, title: 'À cheval', type: 'normal', startDate: new Date(2016, 7-1, 29, 8), endDate: new Date(2016, 8-1, 2, 19) },
		{ id: 11, title: 'AoutFirst', type: 'normal', startDate: new Date(2016, 8-1, 6, 8), endDate: new Date(2016, 8-1, 12, 19) }
	];
});