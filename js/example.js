/*
 * Usage example of the Plantt AngularJS module
 * MIT licence, @ Polosson 2016
 *
 */
'use strict';

var planttEx = angular.module("planttEx", ["plantt.module"]);

planttEx.controller("planttExample", function($scope, $timeout){

	$scope.events = [
		{ id: 1, title: 'Opps Lala', type: 'normal', startDate: new Date(2016, 6-1, 21, 8), endDate: new Date(2016, 7-1, 4, 19) },
		{ id: 2, title: 'Wouzah', type: 'normal', startDate: new Date(2016, 7-1, 14, 8), endDate: new Date(2016, 7-1, 15, 19) },
		{ id: 3, title: 'Hoydih', type: 'urgent', startDate: new Date(2016, 7-1, 21, 8), endDate: new Date(2016, 7-1, 25, 19) },
		{ id: 4, title: 'Surpuissant', type: 'urgent', startDate: new Date(2016, 7-1, 19, 8), endDate: new Date(2016, 7-1, 21, 19) },
		{ id: 5, title: 'Gniuk', type: 'urgent', startDate: new Date(2016, 7-1, 17, 8), endDate: new Date(2016, 7-1, 22, 19) },
		{ id: 6, title: 'Gnark Gnark Gnark Gnark Gnark Gnark Gnark', type: 'urgent', startDate: new Date(2016, 7-1, 17, 8), endDate: new Date(2016, 7-1, 18, 19) },
		{ id: 7, title: 'À cheval', type: 'normal', startDate: new Date(2016, 7-1, 29, 8), endDate: new Date(2016, 8-1, 2, 19) },
		{ id: 8, title: 'AoutFirst', type: 'normal', startDate: new Date(2016, 8-1, 6, 8), endDate: new Date(2016, 8-1, 12, 19) },
		{ id: 9, title: 'Aout Second one', type: 'urgent', startDate: new Date(2016, 8-1, 14, 8), endDate: new Date(2016, 8-1, 14, 19) },
		{ id: 10, title: 'Aout Third event', type: 'urgent', startDate: new Date(2016, 8-1, 8, 8), endDate: new Date(2016, 8-1, 10, 19) },
		{ id: 11, title: 'Buggy One', type: 'urgent', startDate: new Date(2016, 8-1, 2, 8), endDate: new Date(2016, 8-1, 6, 19) }
	];

	$scope.$on('daySelect', function(e, date){
		var name = prompt('New event title:');
		if (!name) return;
		if (name === "") return;
		var end  = new Date(date.getTime() + 1000*60*60);
		var id   = $scope.events.length + 1;
		var newEvent = {
			id: id,
			title: name,
			type: 'normal',
			startDate: date,
			endDate: end
		};
		$scope.events.push(newEvent);
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	$scope.$on('periodSelect', function(e, dates){
		var name = prompt('New event title:');
		if (!name) return;
		if (name === "") return;
		var id   = $scope.events.length + 1;
		var newEvent = {
			id: id,
			title: name,
			type: 'normal',
			startDate: dates.start,
			endDate: dates.end
		};
		$scope.events.push(newEvent);
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

});