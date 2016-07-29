/*
 *
 * Plantt Angular Module : HTML Scheduler
 * Licence MIT, @ Polosson 2016
 *
 */
'use strict';

function daysInMonth(date) {
	var r = new Date(date.getYear(), date.getMonth()+1, 0).getDate();
	return parseInt(r);
}

angular.module('plantt.module', [])
	/*
	 * SCHEDULER directive
	 */
	.directive('scheduler', ['dateFilter', function(dateFilter) {
		return {
			restrict: 'E',							// DOM Element only : <scheduler></scheduler>
			templateUrl: 'plantt-template.html',	// Load HTML template for the view
			link: function(scope){
				if (!scope.events) scope.events = [];	// Populate the list of events, if doesn't exists in the app controller
				scope.renderedEvents = [];				// Used to restrict the events list at only rendered events (memory saving)
				scope.currDate  = new Date();			// Now's exact date and time
				scope.currMonth = new Date();			// Current month, with day set to first of month
				scope.currMonth.setDate(1);
				scope.enumDays = [];					// List of all days in the current month with {#, date, title, nbEvents}
				recalcGrid();
				/*
				 * Recalculate the Grid and the rendered events for the view
				 */
				function recalcGrid() {
					// Populate the list of all days
					scope.enumDays = [];
					for (var d=1; d <= daysInMonth(scope.currMonth); d++) {
						var dayDate = angular.copy(scope.currMonth);
						dayDate.setDate(d);
						scope.enumDays.push({num: d, date: dayDate, title: dateFilter(dayDate, 'EEEE'), nbEvents: 0});
					}

					// Populate the list of all *rendered* events
					scope.renderedEvents = [];
					angular.forEach(scope.events, function(evt){
						// Do not render event if not in current year
						if (evt.startDate.getFullYear() !== scope.currMonth.getFullYear())
							return true;
						// Do not render event if not in current month
						if (evt.startDate.getMonth() !== scope.currMonth.getMonth() && evt.endDate.getMonth() !== scope.currMonth.getMonth())
							return true;
						// Render the event
						scope.renderedEvents.push(angular.copy(evt));
					});
				}
				/*
				 * Display previous month
				 */
				scope.prevMonth = function(){
					scope.currMonth.setMonth(scope.currMonth.getMonth() - 1);
					recalcGrid();
				};
				/*
				 * Display current month
				 */
				scope.nowMonth = function(){
					scope.currMonth = new Date();
					scope.currMonth.setDate(1);
					recalcGrid();
				};
				/*
				 * Display next month
				 */
				scope.nextMonth = function(){
					scope.currMonth.setMonth(scope.currMonth.getMonth() + 1);
					recalcGrid();
				};

			}
		};
	}])
	/*
	 * EVENTS Directive
	 */
	.directive('event', ['$document', 'dateFilter', '$filter', function($document, dateFilter, $filter){
		return {
			restrict: 'E',
			link: function(scope, element, attrs) {
				// Decomposition of the event's dates (start, end)
				var thisEvent	= $filter('filter')(scope.events, {id: +attrs.eventId}, true)[0];
				var startYear	= thisEvent.startDate.getFullYear();
				var startMonth	= thisEvent.startDate.getMonth();
				var startDay	= thisEvent.startDate.getDate() - 1;
				var endYear		= thisEvent.endDate.getFullYear();
				var endMonth	= thisEvent.endDate.getMonth();
				var endDay		= thisEvent.endDate.getDate();

				// Set a bunch of variables used to calculate the event's offsets
				var gridWidth	= $document.find('thead').prop('offsetWidth');
				var gridLength	= daysInMonth(scope.currMonth);
				var cellWidth	= gridWidth / gridLength;
				var one_day		= 1000*60*60*24;
				var eventLength = parseInt((thisEvent.endDate - thisEvent.startDate) / one_day) + 1;
				var eventWidth	= eventLength * cellWidth;
				var eventHeight = $document.find('event').prop('offsetHeight');

				// Calculate the left and width offsets for the event
				var offsetLeft	= (startDay) * cellWidth;
				var daysExceed	= 0;
				var extraClass	= '';
				// If the event's START date is BEFORE the current displayed month
				if (startMonth < scope.currMonth.getMonth() && endMonth === scope.currMonth.getMonth()) {
					offsetLeft = 0;
					extraClass += 'overLeft ';
				}
				// If the event's END date is AFTER the current displayed month
				if (endMonth > scope.currMonth.getMonth()) {
					extraClass += 'overRight ';
				}

				// Calculate the top offset of the event and add 1 to the bnEvents variable in the list of all days, for each days of the event
				var offsetTop = 0, decalTop = 0;
				for (var n = 1; n <= eventLength; n++) {
					var N = startDay + n;
					var D = new Date(startYear, startMonth, N, 12);
					if (D.getFullYear() !== scope.currMonth.getFullYear()) continue;
					if (D.getMonth() !== scope.currMonth.getMonth()){
						daysExceed += 1;
						continue;
					}
					scope.enumDays[D.getDate()-1].nbEvents += 1;
					decalTop  = Math.max(parseInt(scope.enumDays[D.getDate()-1].nbEvents - 1), decalTop);
					offsetTop = decalTop * (eventHeight + 10);
				}


//				console.log(startDay, 'eme jour =', parseInt(offsetLeft), 'px left;', eventLength, 'jours =', parseInt(eventWidth+offsetWidth), 'px large;', extraClass);
				// Place the event in DOM with CSS
				element.css('top', offsetTop+'px');
				element.css('left', offsetLeft+'px');
				element.css('width', (eventWidth - (daysExceed * cellWidth))+'px');
				element.addClass(extraClass);
			}
		};
	}]);