/*
 *
 * Plantt Angular Module : HTML Scheduler
 * Licence MIT, @ Polosson 2016
 *
 */
'use strict';

/**
 * Count the number of days in the month of a date
 *
 * @param {DATE} date The date to check the month of
 * @returns {INT} Number of days in the month of date
 */
function daysInMonth(date) {
	var r = new Date(date.getYear(), date.getMonth()+1, 0).getDate();
	return parseInt(r);
}
/**
 * Count the number of days between two dates
 *
 * @param {DATE} date1 Start date for period
 * @param {DATE} date2 End date for period
 * @param {BOOLEAN} wantDiff True to allow negative numbers in result
 * @returns {INT} Number of days in period between date1 and date2
 */
function daysInPeriod(date1, date2, wantDiff) {
	var one_day	= 1000*60*60*24;
	date1.setHours(12); date1.setMinutes(0); date1.setSeconds(0); date1.setMilliseconds(0);
	date2.setHours(12); date2.setMinutes(0); date2.setSeconds(0); date2.setMilliseconds(0);
	var result	= parseInt((date2.getTime() - date1.getTime()) / one_day);
	if (wantDiff) return result;
	else return Math.abs(result);
}
/**
 * Add some days to a date object
 *
 * @param {DATE} date Original date
 * @param {INT} days Number of days to add to the date
 * @returns {DATE} The resulting date object, normalized to noon (12:00:00.000)
 */
function addDaysToDate(date, days) {
	date.setTime( date.getTime()+ days * 1000*60*60*24 );
	date.setHours(12); date.setMinutes(0); date.setSeconds(0); date.setMilliseconds(0);
	return date;
}


/**
 * PLANTT MODULE MAIN DECLARATION
 */
angular.module('plantt.module', [])
	/*
	 * SCHEDULER directive
	 */
	.directive('scheduler', ['$document', '$timeout', '$filter', 'dateFilter', function($document, $timeout, $filter, dateFilter) {
		return {
			restrict: 'E',							// DOM Element only : <scheduler></scheduler>
			templateUrl: 'plantt-template.html',	// Load HTML template for the view
			link: function(scope){
				if (!scope.events) scope.events = [];	// Populate the list of events, if doesn't exists in the app controller
				scope.renderedEvents = [];				// Used to restrict the events list at only rendered events (memory saving)
				scope.currDate   = addDaysToDate(new Date(), 0);					// Today's date
				scope.viewStart  = addDaysToDate(angular.copy(scope.currDate), -7);					// Firt day to display in view. Default: today minus 7 days
				scope.viewEnd	 = addDaysToDate(angular.copy(scope.currDate), 14);					// Last day to display in view. Default: today plus 14 days
				scope.viewPeriod = daysInPeriod(scope.viewStart, scope.viewEnd);	// Number of days within the view.
				scope.gridWidth	 = $document.find('tbody').prop('offsetWidth');
				scope.cellWidth	 = scope.gridWidth / (scope.viewPeriod + 1);
				scope.enumDays	 = [];					// List of objects describing all days within the view. Objects are in the form { day#, dateObj, dayName, nbEvents, todaydateObj }
				scope.enumMonths = [];					// List of objects describing all months within the view. Objects are in the form { month#, monthName, nbEvents }
				var eventHeightBase = 40 + 10;
				recalcGrid();
				/*
				 * Recalculate the Grid and the rendered events for the view
				 */
				function recalcGrid() {
					scope.enumDays	 = [];
					scope.enumMonths = [];
					scope.gridWidth	 = $document.find('tbody').prop('offsetWidth');
					scope.viewPeriod = daysInPeriod(scope.viewStart, scope.viewEnd, false);
					scope.cellWidth	 = scope.gridWidth / (scope.viewPeriod + 1);
					var lastMonth	 = -1;
					var monthNumDays = 1;
					var nbMonths	 = 0;
					for (var d=0; d <= scope.viewPeriod; d++) {
						var dayDate = addDaysToDate(angular.copy(scope.viewStart), d);
						var today = (scope.currDate.getTime() === dayDate.getTime());
						var isLastOfMonth = (daysInMonth(dayDate) === dayDate.getDate());
						// Populate the list of all days
						scope.enumDays.push({
							num: dateFilter(dayDate, 'dd'),
							date: dayDate,
							time: dayDate.getTime(),
							title: dateFilter(dayDate, 'EEEE dd MMMM'),
							nbEvents: 0,
							today: today,
							isLastOfMonth: isLastOfMonth
						});
						// Populate the list of all months
						monthNumDays += 1;
						if (lastMonth != dayDate.getMonth()) {
							scope.enumMonths.push({
								num: dayDate.getMonth(),
								name: dateFilter(dayDate, 'MMMM yyyy')
							});
							lastMonth = dayDate.getMonth();
							monthNumDays = 1;
							nbMonths += 1;
						}
						if (scope.enumMonths[nbMonths-1]) {
							scope.enumMonths[nbMonths-1].numDays = monthNumDays;
						}
					}
					// Populate the list of all *rendered* events
					scope.renderedEvents = [];
					angular.forEach(scope.events, function(evt){
						var eStart	= evt.startDate.getTime(),
							eEnd	= evt.endDate.getTime(),
							vStart	= scope.viewStart.getTime(),
							vEnd	= scope.viewEnd.getTime();
						if (eStart < vStart && eEnd < vStart)			// Do not render event if it's totally BEFORE the view's period
							return true;
						if (eStart > vEnd)								// Do not render event if it's AFTER the view's period
							return true;
						evt.locScale = {
							'left': 0,
							'top': 0,
							'width': '100px'
						};
						evt.calcHeight = 0;
						scope.renderedEvents.push(angular.copy(evt));	// Render the event
					});

					// Vertical calculations to avoid collisions
					$timeout(function(){
						var line = 0;
						angular.forEach(scope.renderedEvents, function(evt){
							var DB = addDaysToDate(angular.copy(evt.startDate), -1);
							var DA = addDaysToDate(angular.copy(evt.endDate), +1);
							var dayBeforeEvent = $filter('filter')(scope.enumDays, {time: DB.getTime()}, true)[0];
							var dayAfterEvent  = $filter('filter')(scope.enumDays, {time: DA.getTime()}, true)[0];
							if (dayBeforeEvent && dayAfterEvent) {
								if (dayBeforeEvent.nbEvents === 0 && dayAfterEvent.nbEvents === 0)
									line = 0;
							}
							evt.locScale.top = (line * eventHeightBase)+'px';
							line += 1;
						});
						// Extends the view vertically to fit the elements
						var gridHeight = 100 + (scope.renderedEvents.length * eventHeightBase);
						$document.find('tbody').find('td').css('height', gridHeight+'px');
					}, 0);
				}
				/*
				 * Offset view to previous day
				 */
				scope.prevDay = function(){
					scope.viewStart = addDaysToDate(angular.copy(scope.viewStart), -1);
					scope.viewEnd	= addDaysToDate(angular.copy(scope.viewEnd), -1);
					recalcGrid();
				};
				/*
				 * Offset view to previous 10 days
				 */
				scope.prevDecade = function(){
					scope.viewStart = addDaysToDate(angular.copy(scope.viewStart), -10);
					scope.viewEnd	= addDaysToDate(angular.copy(scope.viewEnd), -10);
					recalcGrid();
				};
				/*
				 * Center view to current day (-7 ; +14 days)
				 */
				scope.centerView = function(){
					scope.viewStart  = addDaysToDate(new Date(), -7);
					scope.viewEnd	 = addDaysToDate(new Date(), 14);
					recalcGrid();
				};
				/*
				 * Offset view to next day
				 */
				scope.nextDay = function(){
					scope.viewStart = addDaysToDate(angular.copy(scope.viewStart), 1);
					scope.viewEnd	= addDaysToDate(angular.copy(scope.viewEnd), 1);
					recalcGrid();
				};
				/*
				 * Offset view to next 10 days
				 */
				scope.nextDecade = function(){
					scope.viewStart = addDaysToDate(angular.copy(scope.viewStart), 10);
					scope.viewEnd	= addDaysToDate(angular.copy(scope.viewEnd), 10);
					recalcGrid();
				};

			}
		};
	}])
	/*
	 * EVENTS Directive
	 */
	.directive('event', ['$document', '$timeout', '$filter', function($document, $timeout, $filter){
		return {
			restrict: 'E',
			link: function(scope, element, attrs) {
				// Get the element's corresponding rendered event, by its ID
				var thisEvent	= $filter('filter')(scope.renderedEvents, {id: +attrs.eventId}, true)[0];

				// Calculate the left and width offsets for the event's element
				var offsetDays	= -daysInPeriod(thisEvent.startDate, scope.viewStart, true);
				var eventLength = daysInPeriod(thisEvent.endDate, thisEvent.startDate, false) + 1;
				var eventWidth	= eventLength * scope.cellWidth;
				var offsetLeft	= offsetDays * scope.cellWidth;

				var daysExceed	= 0, extraClass	= '';
				// If the event's START date is BEFORE the current displayed view
				if (offsetDays < 0) {
					offsetLeft = 0;				// to stick the element to extreme left
					daysExceed = -offsetDays;	// to trim the total element's width
					extraClass += 'overLeft ';	// to decorate the element's left boundary
				}
				// If the event's END date is AFTER the current displayed month
				if (thisEvent.endDate.getTime() > scope.viewEnd.getTime()) {
					daysExceed = daysInPeriod(scope.viewEnd, thisEvent.endDate, false);
					extraClass += 'overRight ';	// to decorate the element's right boundary
				}
				// If the event's END date is BEFORE TODAY
				if (thisEvent.endDate.getTime() < scope.currDate.getTime()) {
					extraClass += 'past ';	// to illustrate the fact it's in the past
				}
				// If the event is CURRENTLY active (over today)
				if (thisEvent.startDate.getTime() < scope.currDate.getTime() && thisEvent.endDate.getTime() > scope.currDate.getTime()) {
					extraClass += 'current ';	// to illustrate the fact it's currently active
				}
				// Add some classes to the element
				element.addClass(extraClass);

				// Place and scale the event's element horizontally in DOM
				thisEvent.locScale.left		= offsetLeft+'px';
				thisEvent.locScale.width	= (eventWidth - (daysExceed * scope.cellWidth))+'px';

				// Store the number of events in enumDays array
				for (var n = 0; n < eventLength; n++) {
					var D = addDaysToDate(angular.copy(thisEvent.startDate), n);
					var thisDay = $filter('filter')(scope.enumDays, {time: D.getTime()}, true)[0];
					if (!thisDay) continue;
					thisDay.nbEvents += 1;
				}

			}
		};
	}]);