/*
 * Usage example of the Plantt AngularJS module
 * MIT licence, @ Polosson 2016
 *
 */
'use strict';

var planttEx = angular.module("planttEx", ["plantt.module"]);

planttEx.controller("planttExample", function($scope, $timeout){
	// Basic settings (optional)
	$scope.eventHeight		= 50;				// Height of events elements in pixels
	$scope.eventMargin		= 10;				// Margin above events elements for spacing
	$scope.nbLines			= 6;				// Maximum number of lines we can draw in timeline
	$scope.autoLock			= true;				// To enable the automatic lock of past events
	$scope.lockMarginDays	= 15;				// Number of days between today and the start date of events for the automatic lock to take effect
	$scope.formatDayLong	= 'EEEE dd MMMM';	// The JS date format for the long display of dates
	$scope.formatDayShort	= 'dd/MM/yyyy';		// The JS date format for the short display of dates
	$scope.formatMonth		= 'MMMM yyyy';		// The JS date format for the month display in header

	// FOR DEMO : using today as a reference to create events, for them to be allways visible
	var now = new Date();

	// Create the events list (don't use it like this, it's relative for DEMO)
	$scope.events = [
		{ id: 1, title: 'Hello World',				type: 'normal', startDate: addDaysToDate(now, -30), endDate: addDaysToDate(now, -22) },
		{ id: 2, title: 'OK Junior, pent over',		type: 'normal', startDate: addDaysToDate(now, -24), endDate: addDaysToDate(now, -21) },
		{ id: 3, title: 'Running in the mountain',	type: 'urgent', startDate: addDaysToDate(now, -17), endDate: addDaysToDate(now, -15) },
		{ id: 4, title: 'July Ruby',				type: 'urgent', startDate: addDaysToDate(now, -12), endDate: addDaysToDate(now, -10) },
		{ id: 5, title: 'Old one',					type: 'urgent', startDate: addDaysToDate(now, -18), endDate: addDaysToDate(now, -6) },
		{ id: 6, title: 'Outdated event',			type: 'urgent', startDate: addDaysToDate(now, -4), endDate: addDaysToDate(now, -2) },
		{ id: 7, title: 'In progress, low priority',type: 'normal', startDate: addDaysToDate(now, -2), endDate: addDaysToDate(now, 2) },
		{ id: 8, title: 'Full Week Holidays',		type: 'normal', startDate: addDaysToDate(now, 4), endDate: addDaysToDate(now, 10) },
		{ id: 9, title: 'Something to do soon',		type: 'normal', startDate: addDaysToDate(now, 2), endDate: addDaysToDate(now, 6) },
		{ id: 10, title: 'In progress, hi-priority',type: 'urgent', startDate: addDaysToDate(now, 0), endDate: addDaysToDate(now, 4) },
		{ id: 11, title: 'Fiesta on the beach',		type: 'urgent', startDate: addDaysToDate(now, 12), endDate: addDaysToDate(now, 20) },
		{ id: 12, title: '1 day', lock: true,		type: 'normal', startDate: addDaysToDate(now, 13), endDate: addDaysToDate(now, 13) },
		{ id: 13, title: 'Testing',					type: 'urgent', startDate: addDaysToDate(now, 8), endDate: addDaysToDate(now, 9) },
		{ id: 14, title: 'Near future event',		type: 'normal', startDate: addDaysToDate(now, 30), endDate: addDaysToDate(now, 35) },
		{ id: 15, title: 'Far future event',		type: 'normal', startDate: addDaysToDate(now, 92), endDate: addDaysToDate(now, 98) }
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


planttEx.controller("planttHourlyExample", function($scope, $timeout){
	// Basic settings (optional)
	$scope.nbLines			= 6;				// Maximum number of lines we can draw in timeline
	$scope.lockMarginDays	= 2;				// Number of days between today and the start date of events for the automatic lock to take effect
	$scope.viewStart		= addDaysToDate(new Date(), -1);	// Firt day to display in view.
	$scope.viewEnd			= addDaysToDate(new Date(), 1);		// Last day to display in view.

	$scope.useHours			= true;				// To specify the use of hours (to display hourly grid and don't force events hours to 00:00)
	$scope.dayStartHour		= 8;				// The hour number at which the day begins (default 06:00)
	$scope.dayEndHour		= 19;				// The hour number at which the day begins (default 06:00)

	// FOR DEMO : using today as a reference to create events, for them to be allways visible
	var now = new Date();

	// Create the events list (don't use it like this, it's relative for DEMO)
	$scope.events = [
		{ id: 1, title: 'One day long',				type: 'normal', startDate: new Date(2016, 8-1, 17, 9, 0), endDate: new Date(2016, 8-1, 17, 15, 0) },
		{ id: 1, title: 'Two Days long',			type: 'urgent', startDate: new Date(2016, 8-1, 17, 14, 0), endDate: new Date(2016, 8-1, 18, 14, 0) }
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