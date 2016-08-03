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
	.directive('scheduler', function($window, $document, $timeout, $rootScope, $filter, dateFilter) {
		return {
			restrict: 'E',							// DOM Element only : <scheduler></scheduler>
			templateUrl: 'plantt-template.html',	// Load HTML template for the view
			link: function(scope){
				// Create the list of events variable, if not present in the app controller
				if (!scope.events)
					scope.events = [];
				// Options that can be overwritten in app controller
				if (!scope.eventHeight)
					scope.eventHeight	= 50;				// Height of events elements in pixels
				if (!scope.eventMargin)
					scope.eventMargin	= 10;				// Margin above events elements for spacing
				if (!scope.nbLines)
					scope.nbLines		= 5;				// Maximum number of lines we can draw in timeline
				scope.nbLines += 1;							// With one line more to be safe
				// View essentials
				scope.currDate   = addDaysToDate(new Date(), 0);					// Today's date
				scope.viewStart  = addDaysToDate(angular.copy(scope.currDate), -7);	// Firt day to display in view. Default: today minus 7 days
				scope.viewEnd	 = addDaysToDate(angular.copy(scope.currDate), 14);	// Last day to display in view. Default: today plus 14 days

				/**
				 * Common function to relay errors elsewhere (@todo)
				 *
				 * @param {STRING} lvl The level of the error (0 = Fatal; 1 = Warning; 2 = Notice, 3 = Info)
				 * @param {STRING} msg The message to show
				 */
				scope.throwError = function(lvl, msg){
					var level = '';
					switch (lvl) {
						case 0: level = 'FATAL ERROR';
						case 1: level = 'WARNING';
						case 2: level = 'Notice';
						case 3: level = 'Info';
					}
					$rootScope.$broadcast('planttError', { level: level, message: msg });
					console.log('Plantt '+level+' throwed:', msg);
				};


				/*
				 * Recalculate the Grid and the rendered events for the view
				 */
				scope.renderView = function() {
					scope.enumDays	 = [];													// List of objects describing all days within the view.
					scope.enumMonths = [];													// List of objects describing all months within the view.
					scope.gridWidth	 = $document.find('tbody').prop('offsetWidth');			// Width of the rendered grid
					scope.viewPeriod = daysInPeriod(scope.viewStart, scope.viewEnd, false);	// Number of days in period of the view
					scope.cellWidth	 = scope.gridWidth / (scope.viewPeriod + 1);			// Width of the cells of the grid
					scope.linesFill	 = {};
					scope.renderedEvents  = [];		// Empty the rendered events list

					// First Loop: on all view's days, to define the grid
					var lastMonth = -1, monthNumDays = 1, nbMonths = 0;
					for (var d = 0; d <= scope.viewPeriod; d++) {
						var dayDate = addDaysToDate(angular.copy(scope.viewStart), d);
						var today = (scope.currDate.getTime() === dayDate.getTime());
						var isLastOfMonth = (daysInMonth(dayDate) === dayDate.getDate());

						// Populate the lines filling
						for (var l = 1; l <= scope.nbLines; l++) {
							scope.linesFill[l] = [];
							for (var ld = 0; ld <= scope.viewPeriod; ld++)
								scope.linesFill[l].push(false);
						}
						// Populate the list of all days
						scope.enumDays.push({
							num: dateFilter(dayDate, 'dd'),
							offset: d,
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

					// Second loop: Filter and calculate the placement of all events to be rendered
					angular.forEach(scope.events, function(evt){
						var eStart	= evt.startDate.getTime(),
							eEnd	= evt.endDate.getTime(),
							vStart	= scope.viewStart.getTime(),
							vEnd	= scope.viewEnd.getTime();
						if (eStart < vStart && eEnd < vStart)			// Do not render event if it's totally BEFORE the view's period
							return true;
						if (eStart > vEnd)								// Do not render event if it's AFTER the view's period
							return true;

						// Calculate the left and width offsets for the event's element
						var offsetDays	= -daysInPeriod(evt.startDate, scope.viewStart, true);
						var eventLength = daysInPeriod(evt.endDate, evt.startDate, false) + 1;
						var eventWidth	= eventLength * scope.cellWidth;
						var offsetLeft	= offsetDays * scope.cellWidth;

						var daysExceed	= 0, extraClass	= evt.type+' ';
						// If the event's START date is BEFORE the current displayed view
						if (offsetDays < 0) {
							offsetLeft = 0;				// to stick the element to extreme left
							daysExceed = -offsetDays;	// to trim the total element's width
							extraClass += 'overLeft ';	// to decorate the element's left boundary
						}
						// If the event's END date is AFTER the current displayed month
						if (evt.endDate.getTime() > scope.viewEnd.getTime()) {
							daysExceed = daysInPeriod(scope.viewEnd, evt.endDate, false);
							extraClass += 'overRight ';	// to decorate the element's right boundary
						}
						// If the event's END date is BEFORE TODAY
						if (evt.endDate.getTime() < scope.currDate.getTime()) {
							extraClass += 'past ';	// to illustrate the fact it's in the past
						}
						// If the event is CURRENTLY active (over today)
						if (evt.startDate.getTime() <= scope.currDate.getTime() && evt.endDate.getTime() >= scope.currDate.getTime()) {
							extraClass += 'current ';	// to illustrate the fact it's currently active
						}
						// Add some classes to the element
						evt.extraClasses = extraClass;

						// Store the number of events in enumDays array, and calculate the line (Y-axis) for the event
						evt.line = 0;
						for (var n = 0; n < eventLength; n++) {
							var D = addDaysToDate(angular.copy(evt.startDate), n);
							var thisDay = $filter('filter')(scope.enumDays, {time: D.getTime()}, true)[0];
							if (!thisDay) continue;
							thisDay.nbEvents += 1;

							var dayFilled = false;
							angular.forEach(scope.linesFill, function(thisLine, numLine){
								if (thisLine[thisDay.offset] === false && !dayFilled) {
									thisLine[thisDay.offset] = thisDay.num+': '+evt.title;
									dayFilled = true;
									evt.line = Math.max(evt.line, parseInt(numLine)-1);
									scope.linesFill[evt.line+1][thisDay.offset] = thisDay.num+': '+evt.title;
								}
							});
						}

						// Place and scale the event's element in DOM
						evt.locScale = {
							'left': offsetLeft+'px',
							'width': (eventWidth - (daysExceed * scope.cellWidth))+'px',
							'top': (evt.line * (scope.eventHeight + scope.eventMargin))+'px',
							'height': scope.eventHeight+'px'
						};

						// Store the event in the temp list
						scope.renderedEvents.push(angular.copy(evt));
					});


					// Calculate the view height to fit the elements (with margins)
					var gridMarginBottom = 40;			// Margin to apply at the bottom of grid, below last line
					var filledLines = 0;
					for (var l = 1; l <= scope.nbLines; l++) {
						for (var ld = 0; ld <= scope.viewPeriod; ld++) {
							if (scope.linesFill[l][ld] !== false) {
								filledLines += 1;
								break;
							}
						}
					}
					scope.gridHeight = ((filledLines+1) * (scope.eventHeight + scope.eventMargin)) + gridMarginBottom;
				};

				// Call the renderer for the first time
				scope.renderView();


				// Call the renderer when window is resized
				angular.element($window).bind('resize', function(){
					$timeout(function(){
						scope.renderView();
					}, 100);
				});

				/*
				 * Offset view to previous day
				 */
				scope.prevDay = function(){
					scope.viewStart = addDaysToDate(angular.copy(scope.viewStart), -1);
					scope.viewEnd	= addDaysToDate(angular.copy(scope.viewEnd), -1);
					scope.renderView();
				};
				/*
				 * Offset view to previous 10 days
				 */
				scope.prevCustom = function(days){
					if (!days) days = 15;
					scope.viewStart = addDaysToDate(angular.copy(scope.viewStart), -days);
					scope.viewEnd	= addDaysToDate(angular.copy(scope.viewEnd), -days);
					scope.renderView();
				};
				/*
				 * Set the start date for view
				 */
				scope.setStartView = function(year, month, day){
					var date = addDaysToDate(new Date(year, month-1, day), 0);
					if (date.getTime() >= scope.viewEnd.getTime()) {
						scope.throwError(2, "Aborting view draw: start date would be after end date.");
						return;
					}
					scope.viewStart = date;
					scope.renderView();
				};
				/*
				 * Zoom IN view (-1 day on each side)
				 */
				scope.zoomIn = function(step){
					if (daysInPeriod(scope.viewStart, scope.viewEnd) <= 2) {
						scope.throwError(2, "Aborting view draw: reached minimum days to show.");
						return;
					}
					scope.viewStart  = addDaysToDate(angular.copy(scope.viewStart), +step);
					scope.viewEnd	 = addDaysToDate(angular.copy(scope.viewEnd), -step);
					scope.renderView();
				};
				/*
				 * Zoom OUT view (+1 day on each side)
				 */
				scope.zoomOut = function(step){
					if (daysInPeriod(scope.viewStart, scope.viewEnd) >= 365) {
						scope.throwError(2, "Aborting view draw: reached maximum days to show.");
						return;
					}
					scope.viewStart  = addDaysToDate(angular.copy(scope.viewStart), -step);
					scope.viewEnd	 = addDaysToDate(angular.copy(scope.viewEnd), +step);
					scope.renderView();
				};
				/*
				 * Center view to current day (-7 ; +14 days)
				 */
				scope.centerView = function(){
					scope.viewStart  = addDaysToDate(new Date(), -7);
					scope.viewEnd	 = addDaysToDate(new Date(), 14);
					scope.renderView();
				};
				/*
				 * Offset view to next day
				 */
				scope.nextDay = function(){
					scope.viewStart = addDaysToDate(angular.copy(scope.viewStart), 1);
					scope.viewEnd	= addDaysToDate(angular.copy(scope.viewEnd), 1);
					scope.renderView();
				};
				/*
				 * Offset view to next 10 days
				 */
				scope.nextCustom = function(days){
					if (!days) days = 15;
					scope.viewStart = addDaysToDate(angular.copy(scope.viewStart), days);
					scope.viewEnd	= addDaysToDate(angular.copy(scope.viewEnd), days);
					scope.renderView();
				};
				/*
				 * Set the end date for view
				 */
				scope.setEndView = function(year, month, day){
					var date = addDaysToDate(new Date(year, month-1, day), 0);
					if (date.getTime() <= scope.viewStart.getTime()) {
						scope.throwError(2, "Aborting view draw: end date would be before start date.");
						return;
					}
					scope.viewEnd = date;
					scope.renderView();
				};

			}
		};
	})
	/*
	 * GRID Directive
	 */
	.directive('tbody', function($document, $rootScope){
		return {
			restrict: 'E',
			link: function(scope, element) {

				// Click-drag on grid emits the event "periodSelect" to all other scopes
				var eventHelper = $document.find('eventhelper');
				var dragInit = false, startWidth = 0, selStart = null, selEnd   = null;
				element.bind('mousedown', grabGridStart);
				element.bind('mousemove', grabGridMove);
				element.bind('mouseup',   grabGridEnd);

				function grabGridStart (e){
					e.preventDefault(); e.stopPropagation();
					var dayInView = Math.floor(e.layerX / scope.cellWidth);
					selStart = addDaysToDate(angular.copy(scope.viewStart), dayInView);
					eventHelper.css({display: 'block'});
					eventHelper.css({top: (e.layerY-145)+'px', left: (e.layerX)+'px'});
				}
				function grabGridMove (e){
					if(e.buttons === 1) {
						e.preventDefault(); e.stopPropagation();
						dragInit = true;
						startWidth += e.movementX;
						if (startWidth <= 0)
							return;
						eventHelper.css({width: (startWidth - 2)+'px'});
					}
				}
				function grabGridEnd (e) {
					startWidth  = 0;
					eventHelper.css({width: '0px', display: 'none'});
					if (!dragInit) return;
					if (!selStart) return;
					e.preventDefault(); e.stopPropagation();
					var dayInView = Math.floor(e.layerX / scope.cellWidth);
					selEnd  = addDaysToDate(angular.copy(scope.viewStart), dayInView);
					if (selStart.getTime() < selEnd.getTime()) {
						$rootScope.$broadcast('periodSelect', {start: selStart, end: selEnd});
						scope.throwError(3, "The DOM event 'periodSelect' was emitted in rootScope.");
					}
					dragInit	= false;
				}
			}
		};
	})
	/*
	 * GRID CELLS Directive
	 */
	.directive('td', function($document, $rootScope){
		return {
			restrict: 'E',
			link: function(scope, element) {
				// Double-click on a cell of the grid emits the event "dayselect" to all other scopes
				element.bind('dblclick', function(e){
					e.preventDefault();
					var dayInView = Math.floor(e.layerX / scope.cellWidth);
					var selectedDate = addDaysToDate(angular.copy(scope.viewStart), dayInView);
					$rootScope.$broadcast('daySelect', selectedDate);
					scope.throwError(3, "The DOM event 'daySelect' was emitted in rootScope.");
				});
			}
		};
	})
	/*
	 * GRID HEADER Directive
	 */
	.directive('thead', function($timeout){
		return {
			restrict: 'E',
			link: function(scope, element) {

				// Click-drag on grid header to move the view to the left or right
				element.bind('mousedown', grabHeadStart);
				element.bind('mousemove', grabHeadMove);
				element.bind('mouseup',   grabHeadEnd);
				element.bind('mouseout',  grabHeadEnd);

				var dragInit	= false, grabDeltaX  = 0;
				function grabHeadStart(e) {
					e.preventDefault(); e.stopPropagation();
					grabDeltaX	= 0;
				}
				function grabHeadMove(e) {
					if(e.buttons !== 1)
						return;
					e.preventDefault(); e.stopPropagation();
					dragInit = true;
					grabDeltaX += e.movementX;
					if (Math.abs(grabDeltaX) >= scope.cellWidth) {
						var deltaDay = Math.round(grabDeltaX / scope.cellWidth);
						scope.viewStart = addDaysToDate(angular.copy(scope.viewStart), -deltaDay);
						scope.viewEnd	= addDaysToDate(angular.copy(scope.viewEnd), -deltaDay);
						grabDeltaX = 0;
						$timeout(function(){
							scope.renderView();
						}, 0);
						return;
					}
				}
				function grabHeadEnd(e) {
					e.preventDefault(); e.stopPropagation();
					if (!dragInit)
						return;
					dragInit = false;
					grabDeltaX = 0;
				}
			}
		};
	})
	/*
	 * EVENTS Directive
	 */
	.directive('event', function($rootScope, $filter){
		return {
			restrict: 'E',
			link: function(scope, element, attrs) {
				// Get the element's corresponding rendered event, by its ID
				var thisEvent	= $filter('filter')(scope.renderedEvents, {id: +attrs.eventId}, true)[0];

				// Click-Drag an event to change its dates (emits the event "eventMove" to all other scopes)
				var dragInit	= false;
				var startDeltaX = 0, grabDeltaX = 0, offsetDay = 0, offsetLeft = 0, offsetTop = 0;
				element.bind('mousedown', grabEventStart);
				element.bind('mousemove', grabEventMove);
				element.bind('mouseup',   grabEventEnd);
				element.bind('mouseout',  grabEventEnd);

				function grabEventStart (e) {
					e.preventDefault(); e.stopPropagation();
					startDeltaX	= e.layerX / scope.cellWidth;
					grabDeltaX	= 0;
					offsetLeft	= parseInt(element.css('left'));
					offsetTop	= parseInt(element.css('top'));
					element.css({'opacity': 0.5, 'z-index': 1000});
				}
				function grabEventMove (e) {
					if(e.buttons !== 1)
						return;
					e.preventDefault(); e.stopPropagation();
					dragInit = true;
					grabDeltaX += e.movementX;
					offsetDay	= Math.round((startDeltaX + grabDeltaX) / scope.cellWidth);
					offsetLeft += e.movementX;
					offsetTop  += e.movementY;
					element.css({left: offsetLeft+'px', top: offsetTop+'px'});
				}
				function grabEventEnd (e){
					element.css({opacity: 1});
					if (!dragInit)
						return;
					e.preventDefault(); e.stopPropagation();
					var event = $filter('filter')(scope.events, {id: thisEvent.id}, true)[0];
					$rootScope.$broadcast('eventMove', event, offsetDay);
					scope.throwError(3, "The DOM event 'eventMove' was emitted in rootScope.");
					dragInit = false;
					startDeltaX = 0; grabDeltaX  = 0;
				}

				// Double-click an event element to emit the custom event "eventOpen" to all other scopes
				element.bind('dblclick', function(e){
					e.preventDefault(); e.stopPropagation();
					var event = $filter('filter')(scope.events, {id: thisEvent.id}, true)[0];
					$rootScope.$broadcast('eventOpen', event);
					scope.throwError(3, "The DOM event 'eventOpen' was emitted in rootScope.");
				});
			}
		};
	})
	/*
	 * EVENTS HANDLES Directive
	 */
	.directive('handle', function($rootScope, $filter){
		return {
			restrict: 'E',
			link: function(scope, element, attrs) {

				// Click-Drag an event to change its dates
				var dragInit	= false;
				var startDeltaX = 0, grabDeltaX = 0, offsetDay = 0, side = attrs.handleSide, thisEvent, offsetLeft = 0, offsetWidth = 0;
				var parentEvent = element.parent();
				element.bind('mousedown', grabHandleStart);
				element.bind('mousemove', grabHandleMove);
				element.bind('mouseup',   grabHandleEnd);
				element.bind('mouseout',  grabHandleEnd);

				function grabHandleStart (e) {
					e.preventDefault(); e.stopPropagation();
					thisEvent = $filter('filter')(scope.events, {id: +attrs.eventId}, true)[0];
					startDeltaX	= e.layerX;
					grabDeltaX	= 0;
					offsetLeft  = parentEvent.prop('offsetLeft');
					offsetWidth = parentEvent.prop('offsetWidth');
					parentEvent.css({'opacity': 0.5, 'z-index': 1000});
				}
				function grabHandleMove (e) {
					if(e.buttons !== 1)
						return;
					e.preventDefault(); e.stopPropagation();
					dragInit = true;
					grabDeltaX  += e.movementX;
					if (side === 'left') {
						offsetLeft  += e.movementX;
						offsetWidth -= e.movementX;
						offsetDay	 = Math.round((grabDeltaX - startDeltaX) / scope.cellWidth);
					}
					else if (side === 'right') {
						offsetWidth += e.movementX;
						offsetDay	 = Math.round((startDeltaX + grabDeltaX) / scope.cellWidth);
					}
					else return;
					parentEvent.css({left: offsetLeft+'px', width: offsetWidth+'px'});
				}
				function grabHandleEnd (e){
					if (!dragInit)
						return;
					e.preventDefault(); e.stopPropagation();
					$rootScope.$broadcast('eventScale', thisEvent, side, offsetDay);
					scope.throwError(3, "The DOM event 'eventScale' was emitted in rootScope.");
					dragInit = false;
					startDeltaX = 0; grabDeltaX  = 0;
					parentEvent.css({opacity: 1});
				}
			}
		};
	});