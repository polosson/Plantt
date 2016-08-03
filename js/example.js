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
		{ id: 1, title: 'Hello World', type: 'normal', startDate: new Date(2016, 6-1, 21), endDate: new Date(2016, 7-1, 4) },
		{ id: 2, title: 'OK Junior, pent over', type: 'normal', startDate: new Date(2016, 7-1, 11), endDate: new Date(2016, 7-1, 15) },
		{ id: 3, title: 'Running in the mountain', type: 'urgent', startDate: new Date(2016, 7-1, 18), endDate: new Date(2016, 7-1, 20) },
		{ id: 4, title: 'July Ruby', type: 'urgent', startDate: new Date(2016, 7-1, 23), endDate: new Date(2016, 7-1, 25) },
		{ id: 5, title: 'Old one', type: 'urgent', startDate: new Date(2016, 7-1, 17), endDate: new Date(2016, 7-1, 29) },
		{ id: 6, title: 'Outdated event', type: 'urgent', startDate: new Date(2016, 7-1, 31), endDate: new Date(2016, 8-1, 2) },
		{ id: 7, title: 'In progress, low priority', type: 'normal', startDate: new Date(2016, 8-1, 2), endDate: new Date(2016, 8-1, 7) },
		{ id: 8, title: 'Full Week Holidays', type: 'normal', startDate: new Date(2016, 8-1, 8), endDate: new Date(2016, 8-1, 14) },
		{ id: 9, title: 'Something to do soon', type: 'normal', startDate: new Date(2016, 8-1, 6), endDate: new Date(2016, 8-1, 10) },
		{ id: 10, title: 'In progress, hi-priority', type: 'urgent', startDate: new Date(2016, 8-1, 4), endDate: new Date(2016, 8-1, 8) },
		{ id: 11, title: 'Mid-August Fiesta on the beach', type: 'urgent', startDate: new Date(2016, 8-1, 15), endDate: new Date(2016, 8-1, 21) },
		{ id: 12, title: '1 day', type: 'normal', startDate: new Date(2016, 8-1, 16), endDate: new Date(2016, 8-1, 16) },
		{ id: 13, title: 'Testing', type: 'urgent', startDate: new Date(2016, 8-1, 12), endDate: new Date(2016, 8-1, 13) }
	];

	// Listen to the "planttError" DOM event, to do something when an error occurs
	$scope.$on('planttError', function(e, err){
		console.log('Plantt '+err.levelName+' ('+err.level+'):', err.message);
	});

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