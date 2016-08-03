/*
 * Usage example of the Plantt AngularJS module
 * MIT licence, @ Polosson 2016
 *
 */
'use strict';

var planttEx = angular.module("planttEx", ["plantt.module"]);

planttEx.controller("planttExample", function($scope, $timeout){
	// Basic settings (optional)
	$scope.eventHeight	= 50;	// Height of events elements in pixels
	$scope.eventMargin	= 10;	// Margin above events elements for spacing
	$scope.nbLines		= 6;	// Maximum number of lines we can draw in timeline

	// Create the events list
	$scope.events = [
		{ id: 1, title: 'Opps Lala', type: 'normal', startDate: new Date(2016, 6-1, 21, 8), endDate: new Date(2016, 7-1, 4, 19) },
		{ id: 2, title: 'Wouzah', type: 'normal', startDate: new Date(2016, 7-1, 14, 8), endDate: new Date(2016, 7-1, 15, 19) },
		{ id: 3, title: 'Hoydih', type: 'urgent', startDate: new Date(2016, 7-1, 21, 8), endDate: new Date(2016, 8-1, 1, 19) },
		{ id: 4, title: 'Surpuissant', type: 'urgent', startDate: new Date(2016, 7-1, 19, 8), endDate: new Date(2016, 7-1, 21, 19) },
		{ id: 5, title: 'Gniuk', type: 'urgent', startDate: new Date(2016, 7-1, 17, 8), endDate: new Date(2016, 7-1, 22, 19) },
		{ id: 6, title: 'Gnark Gnark Gnark Gnark Gnark Gnark Gnark', type: 'urgent', startDate: new Date(2016, 7-1, 17, 8), endDate: new Date(2016, 7-1, 18, 19) },
		{ id: 7, title: 'En cours', type: 'normal', startDate: new Date(2016, 7-1, 31, 8), endDate: new Date(2016, 8-1, 5, 19) },
		{ id: 8, title: 'AoutFirst', type: 'normal', startDate: new Date(2016, 8-1, 8, 8), endDate: new Date(2016, 8-1, 14, 19) },
		{ id: 9, title: 'Aout Second one', type: 'urgent', startDate: new Date(2016, 8-1, 16, 8), endDate: new Date(2016, 8-1, 16, 19) },
		{ id: 10, title: 'Aout Third event', type: 'urgent', startDate: new Date(2016, 8-1, 9, 8), endDate: new Date(2016, 8-1, 11, 19) },
		{ id: 11, title: 'Tout qui marche au top', type: 'urgent', startDate: new Date(2016, 8-1, 2, 8), endDate: new Date(2016, 8-1, 6, 19) },
		{ id: 12, title: 'Mid-August Fiesta', type: 'normal', startDate: new Date(2016, 8-1, 16, 8), endDate: new Date(2016, 8-1, 21, 19) }
	];

	// Listen to the "daySelect" DOM event, to add a new event
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

	// Listen to the "periodSelect" DOM event, to add a new event
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

	// Listen to the "eventMove" DOM event, to store the new position of the event in time
	$scope.$on('eventMove', function(e, event, deltaDays){
		event.startDate = addDaysToDate(angular.copy(event.startDate), deltaDays);
		event.endDate	= addDaysToDate(angular.copy(event.endDate), deltaDays);
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	// Listen to the "eventScale" DOM event, to store the new positions of the event limits in time
	$scope.$on('eventScale', function(e, event, side, deltaDays){
		if (side === 'left')
			event.startDate = addDaysToDate(angular.copy(event.startDate), deltaDays);
		else if (side === 'right')
			event.endDate	= addDaysToDate(angular.copy(event.endDate), deltaDays);
		$timeout(function(){
			$scope.renderView();
		}, 0);
	});

	// Listen to the "eventOpen" DOM event
	$scope.$on('eventOpen', function(e, event){
		console.log(event);
		alert('Opening event "' + event.title +'"');
	});

});