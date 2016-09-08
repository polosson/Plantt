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
	var mdate = new Date(date.getTime());
	mdate.setTime( mdate.getTime()+ days * 1000*60*60*24 );
	mdate.setHours(12); mdate.setMinutes(0); mdate.setSeconds(0); mdate.setMilliseconds(0);
	return mdate;
}
/**
 * Add some hours to a date object
 *
 * @param {DATE} date Original date
 * @param {INT} hours Number of hours to add to the date
 * @returns {DATE} The resulting date object, normalized (xx:00:00.000)
 */
function addHoursToDate(date, hours) {
	var mdate = new Date(date.getTime());
	mdate.setTime( mdate.getTime()+ hours * 1000*60*60 );
	mdate.setMinutes(0); mdate.setSeconds(0); mdate.setMilliseconds(0);
	return mdate;
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
				/*
				 * OPTIONS VALUES
				 * Can be overwritten in app controller
				 */
				if (!scope.viewStart)						// Firt day to display in view. Default: today minus 7 days
					scope.viewStart		= addDaysToDate(scope.currDate, -7);
				if (!scope.viewEnd)							// Last day to display in view. Default: today plus 14 days
					scope.viewEnd		= addDaysToDate(scope.currDate, 14);
				if (!scope.eventHeight)
					scope.eventHeight	= 50;				// Height of events elements in pixels
				if (!scope.eventMargin)
					scope.eventMargin	= 10;				// Margin above events elements for spacing
				if (!scope.nbLines)
					scope.nbLines		= 5;				// Maximum number of lines we can draw in timeline
				if (typeof scope.autoLock === 'undefined')
					scope.autoLock		= true;				// To enable or disable the automatic lock of current & past events
				if (typeof scope.lockMarginDays === 'undefined')
					scope.lockMarginDays = 0;				// Number of days between today and the start date of events for the automatic lock to be effective
				if (!scope.formatDayLong)
					scope.formatDayLong  = 'EEEE MMMM dd';	// The JS date format for the long display of dates (see https://docs.angularjs.org/api/ng/filter/date)
				if (!scope.formatDayShort)
					scope.formatDayShort = 'yyyy-MM-dd';	// The JS date format for the short display of dates
				if (!scope.formatMonth)
					scope.formatMonth    = 'MMMM yyyy';		// The JS date format for the month display in header
				if (typeof scope.useHours === 'undefined')
					scope.useHours		 = false;			// To specify the use of hours ('true' to display hourly grid and don't force events hours to 12:00)
				if (typeof scope.dayStartHour === 'undefined')
					scope.dayStartHour	 = 8;				// The hour number at which the day begins (default 08:00)
				if (typeof scope.dayEndHour === 'undefined')
					scope.dayEndHour	 = 20;				// The hour number at which the day ends (default 20:00)
				/* END OPTIONS VALUES */

				// Options security
				scope.nbLines += 1;										// Add one line on the grid to be sure
				if (scope.dayStartHour < 0) scope.dayStartHour = 0;		// Limit start hour of day to midnight
				if (scope.dayEndHour > 23)  scope.dayEndHour = 23;		// Limit end hour of day to 23:00
				if (scope.dayStartHour >= scope.dayEndHour) {			// Prevent errors for hours grid
					scope.dayStartHour = 6;
					scope.dayEndHour   = 20;
				}

				// View essentials
				scope.currDate   = addDaysToDate(new Date(), 0);								// Today's date
				scope.nbHours = scope.dayEndHour +1 - scope.dayStartHour;						// Number of hours displayed in one day
				scope.minCellWidthForHours = (scope.dayEndHour+1 - scope.dayStartHour) * 13;	// Minimum width in pixels for the hours grid to be displayed

				// To be calculated by the browser
				scope.headerHeight = 40;
				scope.theadHeight  = 63;
				scope.headHeight   = 113;

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
					$rootScope.$broadcast('planttError', { level: lvl, levelName: level, message: msg });
				};

				/**
				 * Function to get the list of all hours within a working day (between dayStartHour & dayEndHour)
				 *
				 * @returns {ARRAY} The list of all hours within a working day
				 */
				function listHoursInDay() {
					var enumHours = [];
					for (var h = scope.dayStartHour; h < (scope.dayEndHour +1); h++)
						enumHours.push({ num: h, title: ('00' + h).substr(-2) });
					return enumHours;
				}

				/*
				 * (Re)Compute the view: grid and rendered events
				 */
				scope.renderView = function() {
					var currTime	 = (new Date()).getTime();
					scope.enumDays	 = [];													// List of objects describing all days within the view.
					scope.enumMonths = [];													// List of objects describing all months within the view.
					scope.gridWidth	 = $document.find('tbody').prop('offsetWidth');			// Width of the rendered grid
					scope.viewPeriod = daysInPeriod(scope.viewStart, scope.viewEnd, false);	// Number of days in period of the view
					scope.cellWidth	 = scope.gridWidth / (scope.viewPeriod + 1);			// Width of the days cells of the grid
					scope.HcellWidth = scope.cellWidth / scope.nbHours;						// Width of the hours cells of the grid
					scope.linesFill	 = {};			// Empty the lines filling map
					scope.renderedEvents  = [];		// Empty the rendered events list

					// First Loop: on all view's days, to define the grid
					var lastMonth = -1, monthNumDays = 1, nbMonths = 0;
					for (var d = 0; d <= scope.viewPeriod; d++) {
						var dayDate = addDaysToDate(scope.viewStart, d);
						var today = (scope.currDate.getTime() === dayDate.getTime());
						var isLastOfMonth = (daysInMonth(dayDate) === dayDate.getDate());

						// Populate the lines filling map
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
							title: dateFilter(dayDate, scope.formatDayLong),
							nbEvents: 0,
							today: today,
							isLastOfMonth: isLastOfMonth,
							enumHours: listHoursInDay()
						});
						// Populate the list of all months
						monthNumDays += 1;
						if (lastMonth != dayDate.getMonth()) {
							scope.enumMonths.push({
								num: dayDate.getMonth(),
								name: dateFilter(dayDate, scope.formatMonth)
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
					angular.forEach(scope.events, function(event){
						var evt		= angular.copy(event);
						var eStart	= evt.startDate.getTime(),
							eEnd	= evt.endDate.getTime(),
							viewRealStart	= new Date(scope.viewStart.getTime()),
							viewRealEnd		= new Date(scope.viewEnd.getTime());
						viewRealStart.setHours(0); viewRealStart.setMinutes(0); viewRealStart.setSeconds(0);
						viewRealEnd.setHours(23); viewRealEnd.setMinutes(59); viewRealEnd.setSeconds(59);
						var vStart	= viewRealStart.getTime(),
							vEnd	= viewRealEnd.getTime();
						if (eStart < vStart && eEnd < vStart)			// Do not render event if it's totally BEFORE the view's period
							return true;
						if (eStart > vEnd)								// Do not render event if it's AFTER the view's period
							return true;

						// Calculate the left and width offsets for the event's element
						var offsetDays	= -daysInPeriod(angular.copy(evt.startDate), scope.viewStart, true);
						var eventLength = daysInPeriod(angular.copy(evt.endDate), angular.copy(evt.startDate), false) + 1;
						var eventWidth	= eventLength * scope.cellWidth;
						var offsetLeft	= Math.floor(offsetDays * scope.cellWidth);
						if (scope.useHours) {
							var eventStartHour	= evt.startDate.getHours();
							var eventEndHour	= evt.endDate.getHours();
							var offsetHours		= Math.floor(scope.HcellWidth * (eventStartHour - scope.dayStartHour));
							offsetLeft += offsetHours;
							if (evt.startDate.getDate() === evt.endDate.getDate())	// If event is during one single day
								eventWidth = scope.HcellWidth * (eventEndHour - eventStartHour);
							else {
								if (eStart < vStart)								// If event start date or hour is BEFORE the view start
									eventWidth += offsetHours;
								if (eEnd > vEnd)									// If event end date or hour is AFTER the view end
									eventWidth -= offsetHours;
								else												// If event end hour is before the view end
									eventWidth -= offsetHours + (scope.HcellWidth * (scope.dayEndHour+1 - eventEndHour));
							}
						}

						var daysExceed	= 0, extraClass	= evt.type+' ';
						// If the event's START date is BEFORE the current displayed view
						if (offsetDays < 0) {
							offsetLeft = 0;				// to stick the element to extreme left
							daysExceed = -offsetDays;	// to trim the total element's width
							extraClass += 'overLeft ';	// to decorate the element's left boundary
						}
						// If the event's END date is AFTER the current displayed view
						if (eEnd > vEnd) {
							daysExceed = daysInPeriod(scope.viewEnd, angular.copy(evt.endDate), false);
							extraClass += 'overRight ';	// to decorate the element's right boundary
						}
						// If the event's END date is BEFORE TODAY (to illustrate the fact it's in the past)
						if (eEnd < currTime)
							extraClass += 'past ';

						// To automatically lock the event on the view
						evt.lock = (eStart < (currTime - ((scope.lockMarginDays - 1) * 24*60*60*1000)) && scope.autoLock === true);
						// If the event has the lock value set to true
						if (evt.lock === true)
							extraClass += 'locked ';

						// If the event is CURRENTLY active (over today)
						if (eStart <= currTime && eEnd >= currTime) {
							extraClass += 'current ';	// to illustrate the fact it's currently active
						}
						// Add some classes to the element
						evt.extraClasses = extraClass;

						// Store the number of events in enumDays array, and calculate the line (Y-axis) for the event
						evt.line = 0;
						for (var n = 0; n < eventLength; n++) {
							var D = addDaysToDate(evt.startDate, n);
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
							'left': Math.floor(offsetLeft)+'px',
							'width': (eventWidth - (daysExceed * scope.cellWidth))+'px',
							'top': (evt.line * (scope.eventHeight + scope.eventMargin))+'px',
							'margin-top': scope.headHeight+'px',
							'height': scope.eventHeight+'px'
						};

						// Actually RENDER the event on the timeline
						scope.renderedEvents.push(evt);
					});


					// Compute the view's height to fit all elements (with margins)
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
					scope.viewStart = addDaysToDate(scope.viewStart, -1);
					scope.viewEnd	= addDaysToDate(scope.viewEnd, -1);
					scope.renderView();
				};
				/*
				 * Offset view to previous X days
				 */
				scope.prevCustom = function(days){
					if (typeof days === 'undefined') days = 15;
					scope.viewStart = addDaysToDate(scope.viewStart, -days);
					scope.viewEnd	= addDaysToDate(scope.viewEnd, -days);
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
					scope.viewStart  = addDaysToDate(scope.viewStart, +step);
					scope.viewEnd	 = addDaysToDate(scope.viewEnd, -step);
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
					scope.viewStart  = addDaysToDate(scope.viewStart, -step);
					scope.viewEnd	 = addDaysToDate(scope.viewEnd, +step);
					scope.renderView();
				};
				/*
				 * Center view to current day (defaults -7, +14 days)
				 */
				scope.centerView = function(daysBefore, daysAfter){
					if (typeof daysBefore === 'undefined') daysBefore = 7;
					if (typeof daysAfter === 'undefined') daysAfter = 14;
					scope.viewStart  = addDaysToDate(new Date(), -daysBefore);
					scope.viewEnd	 = addDaysToDate(new Date(), daysAfter);
					scope.renderView();
				};
				/*
				 * Offset view to next day
				 */
				scope.nextDay = function(){
					scope.viewStart = addDaysToDate(scope.viewStart, 1);
					scope.viewEnd	= addDaysToDate(scope.viewEnd, 1);
					scope.renderView();
				};
				/*
				 * Offset view to next X days
				 */
				scope.nextCustom = function(days){
					if (typeof days === 'undefined') days = 15;
					scope.viewStart = addDaysToDate(scope.viewStart, days);
					scope.viewEnd	= addDaysToDate(scope.viewEnd, days);
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
	.directive('planttDaysGrid', function($document, $rootScope){
		return {
			restrict: 'A',
			link: function(scope, element) {

				// Click-drag on grid emits the event "periodSelect" to all other scopes
				// Useful to add events on the timeline
				var eventHelper = $document.find('eventhelper');
				var dragInit = false, startWidth = 0, selStart = null, selEnd   = null;
				element.on('mousedown', grabGridStart);

				function grabGridStart (e){
					e.preventDefault(); e.stopPropagation();
					var startDay = Math.floor(e.layerX / scope.cellWidth);
					selStart = addDaysToDate(scope.viewStart, startDay);
					if (scope.useHours) {
						var startHour = Math.floor((e.layerX % scope.cellWidth) / scope.nbHours) - 12 + scope.dayStartHour;
						selStart = addHoursToDate(selStart, startHour);
					}
					eventHelper.css({top: (e.layerY - 25)+'px', left: (e.layerX)+'px'});
					eventHelper.css({display: 'block'});
					$document.on('mousemove', grabGridMove);
					$document.on('mouseup',   grabGridEnd);
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
					$document.off('mousemove', grabGridMove);
					$document.off('mouseup',   grabGridEnd);
					if (!dragInit) return;
					if (!selStart) return;
					e.preventDefault(); e.stopPropagation();
					var dayInView = Math.floor(e.layerX / scope.cellWidth);
					selEnd  = addDaysToDate(scope.viewStart, dayInView);
					if (scope.useHours) {
						var endHour = Math.floor((e.layerX % scope.cellWidth) / scope.nbHours) - 12 + scope.dayStartHour;
						selEnd = addHoursToDate(selEnd, endHour);
					}
					if (selStart.getTime() < selEnd.getTime()) {
						$rootScope.$broadcast('periodSelect', {start: selStart, end: selEnd});
						scope.throwError(3, "The DOM event 'periodSelect' was emitted in rootScope.");
					}
					dragInit = false;
				}
			}
		};
	})
	/*
	 * GRID CELLS Directive
	 */
	.directive('td', function($rootScope){
		return {
			restrict: 'E',
			link: function(scope, element) {
				// Double-click on a cell of the grid emits the event "dayselect" to all other scopes
				// Useful to add an event on a specific day of the timeline
				element.on('dblclick', function(e){
					e.preventDefault();
					var dayInView = Math.floor(e.layerX / scope.cellWidth);
					var selectedDate = addDaysToDate(scope.viewStart, dayInView);
					if (scope.useHours)
						selectedDate.setHours(scope.dayStartHour);
					$rootScope.$broadcast('daySelect', selectedDate);
					scope.throwError(3, "The DOM event 'daySelect' was emitted in rootScope.");
				});
			}
		};
	})
	/*
	 * GRID HEADER Directive
	 */
	.directive('thead', function($document, $timeout){
		return {
			restrict: 'E',
			link: function(scope, element) {

				// Click-drag on grid header to move the view left or right
				element.on('mousedown', grabHeadStart);

				var dragInit	= false, grabDeltaX  = 0;
				function grabHeadStart(e) {
					e.preventDefault(); e.stopPropagation();
					grabDeltaX	= 0;
					$document.on('mousemove', grabHeadMove);
					$document.on('mouseup',   grabHeadEnd);
				}
				function grabHeadMove(e) {
					if(e.buttons !== 1)
						return;
					e.preventDefault(); e.stopPropagation();
					dragInit = true;
					grabDeltaX += e.movementX;
					if (Math.abs(grabDeltaX) >= scope.cellWidth) {
						var deltaDay = Math.round(grabDeltaX / scope.cellWidth);
						scope.viewStart = addDaysToDate(scope.viewStart, -deltaDay);
						scope.viewEnd	= addDaysToDate(scope.viewEnd, -deltaDay);
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
					$document.off('mousemove', grabHeadMove);
					$document.off('mouseup',   grabHeadEnd);
				}
			}
		};
	})
	/*
	 * EVENTS Directive
	 */
	.directive('event', function($document, $rootScope, $timeout, $filter){
		return {
			restrict: 'E',
			link: function(scope, element, attrs) {

				// Calculate the margin-top offset to avoid overlapping the grid's headers
				$timeout(function(){
					scope.theadHeight	= parseInt($document.find('thead').prop('offsetHeight'));
					scope.headerHeight	= parseInt($document.find('header').prop('offsetHeight'));
					scope.headHeight	= (scope.theadHeight + scope.headerHeight + scope.eventMargin)+'px';
					element.css({'margin-top': scope.headHeight});
				}, 0);

				// Double-click an event element to emit the custom event "eventOpen" to all other scopes
				// Useful to open a modal window containing detailed informations of the vent, for example
				element.on('dblclick', function(e){
					e.preventDefault(); e.stopPropagation();
					var thisEvent = $filter('filter')(scope.events, {id: +attrs.eventId}, true)[0];
					if (!thisEvent) {
						scope.throwError(1, "Event with ID "+attrs.eventId+" not found!");
						return;
					}
					$rootScope.$broadcast('eventOpen', thisEvent);
					scope.throwError(3, "The DOM event 'eventOpen' was emitted in rootScope.");
				});

				/*
				 * EVERYTHING following will only be accessible if the event is NOT LOCKED
				 * (if "event.lock" is not = true)
				 */
				var thisRenderedEvent = $filter('filter')(scope.renderedEvents, {id: +attrs.eventId}, true)[0];
				if (thisRenderedEvent.lock && thisRenderedEvent.lock === true)
					return;

				// Click-Drag an event to change its dates
				// (emits the DOM event "eventMove" to all other scopes)
				var dragInit	= false;
				var grabDeltaX	= 0, offsetDay = 0, offsetLeft = 0, offsetTop = 0, elemWidth = 0;
				var newStartDate = thisRenderedEvent.startDate;
				var newEndDate   = thisRenderedEvent.endDate;
				var newStartHour = thisRenderedEvent.startDate.getHours();
				var newEndHour	 = thisRenderedEvent.endDate.getHours();
				element.on('mousedown', grabEventStart);

				function grabEventStart (e) {
					e.preventDefault(); e.stopPropagation();
					grabDeltaX	= 0;
					offsetLeft	= parseInt(element.css('left'));
					offsetTop	= parseInt(element.css('top'));
					elemWidth	= parseInt(element.css('width'));
					element.css({'opacity': 0.5, 'z-index': 1000});
					$document.on('mousemove', grabEventMove);
					$document.on('mouseup',   grabEventEnd);
				}
				function grabEventMove (e) {
					if(e.buttons !== 1)
						return;
					e.preventDefault(); e.stopPropagation();
					dragInit = true;
					grabDeltaX += e.movementX;
					offsetDay	= Math.round(grabDeltaX / scope.cellWidth);
					offsetLeft += e.movementX;
					offsetTop  += e.movementY;
					element.css({left: offsetLeft+'px', top: offsetTop+'px'});
				}
				function grabEventEnd (e){
					element.css({opacity: 1});
					if (!dragInit)
						return;
					e.preventDefault(); e.stopPropagation();
					if (scope.useHours) {
						var newStartPos		= Math.round(offsetLeft / scope.HcellWidth);
						var newEndPos		= Math.round((offsetLeft + elemWidth) / scope.HcellWidth);
						var dayStartInGrid	= Math.floor(newStartPos / scope.nbHours);
						var dayEndInGrid	= Math.floor(newEndPos / scope.nbHours);
						newStartDate		= addDaysToDate(angular.copy(scope.viewStart), dayStartInGrid) ;
						newEndDate			= addDaysToDate(angular.copy(scope.viewStart), dayEndInGrid);
						newStartHour		= scope.dayStartHour + newStartPos - (scope.nbHours * dayStartInGrid);
						newEndHour			= scope.dayStartHour + newEndPos - (scope.nbHours * dayEndInGrid);
						// When placing the event's end on the last hour of day, make sure that
						// its date corresponds (and not set before the first hour of next day)
						if (newEndHour === scope.dayStartHour) {
							newEndHour = scope.dayEndHour + 1;
							newEndDate = addDaysToDate(newEndDate, -1);
						}
					}
					else {
						newStartDate = addDaysToDate(newStartDate, offsetDay);
						newEndDate	 = addDaysToDate(newEndDate, offsetDay);
					}
					var thisEvent = $filter('filter')(scope.events, {id: +attrs.eventId}, true)[0];
					if (thisEvent) {
						$rootScope.$broadcast('eventMove', thisEvent, newStartDate, newEndDate, newStartHour, newEndHour);
						scope.throwError(3, "The DOM event 'eventMove' was emitted in rootScope.");
					}
					else
						scope.throwError(0, "The event with id #"+attrs.eventId+" was not found!");
					dragInit = false;
					grabDeltaX  = 0;
					$document.off('mousemove', grabEventMove);
					$document.off('mouseup', grabEventEnd);
				}
			}
		};
	})
	/*
	 * EVENTS HANDLES Directive
	 */
	.directive('handle', function($document, $rootScope, $filter){
		return {
			restrict: 'E',
			link: function(scope, element, attrs) {

				/*
				 * EVERYTHING following will only be accessible if the event is NOT LOCKED
				 * (if "event.lock" is not = true)
				 */
				var thisRenderedEvent = $filter('filter')(scope.renderedEvents, {id: +attrs.eventId}, true)[0];
				if (thisRenderedEvent.lock && thisRenderedEvent.lock === true)
					return;

				// Click-Drag an event's handles to change its start or end dates
				// (emits the DOM event "eventScale" to all other scopes)
				var dragInit	= false;
				var startDeltaX = 0, grabDeltaX = 0, offsetDay = 0, side = attrs.handleSide, offsetLeft = 0, offsetWidth = 0;
				var newDate		= new Date(), newHour = 12;
				var parentEvent = element.parent();
				element.on('mousedown', grabHandleStart);

				function grabHandleStart (e) {
					e.preventDefault(); e.stopPropagation();
					startDeltaX	= e.layerX;
					grabDeltaX	= 0;
					offsetLeft  = parentEvent.prop('offsetLeft');
					offsetWidth = parentEvent.prop('offsetWidth');
					parentEvent.css({'opacity': 0.5, 'z-index': 1000});
					$document.on('mousemove', grabHandleMove);
					$document.on('mouseup',   grabHandleEnd);
				}
				function grabHandleMove (e) {
					if(e.buttons !== 1)
						return;
					e.preventDefault(); e.stopPropagation();
					dragInit = true;
					grabDeltaX  += e.movementX;
					if (side === 'left') {
						offsetWidth -= e.movementX;
						if (offsetWidth >= scope.HcellWidth)
							offsetLeft  += e.movementX;
						offsetDay	 = Math.round((grabDeltaX - startDeltaX) / scope.cellWidth);
					}
					else if (side === 'right') {
						offsetWidth += e.movementX;
						offsetDay	 = Math.round((startDeltaX + grabDeltaX) / scope.cellWidth);
					}
					else return;
					if (offsetWidth < scope.HcellWidth)
						offsetWidth = scope.HcellWidth;
					parentEvent.css({left: offsetLeft+'px', width: offsetWidth+'px'});
				}
				function grabHandleEnd (e){
					if (!dragInit)
						return;
					e.preventDefault(); e.stopPropagation();
					if (scope.useHours) {
						if (side === 'left')
							var newPos = Math.round(offsetLeft / scope.HcellWidth);
						else if (side === 'right')
							var newPos = Math.round((offsetLeft+offsetWidth) / scope.HcellWidth);
						else return;
						var dayInGrid = Math.floor(newPos / scope.nbHours);
						newDate	= addDaysToDate(angular.copy(scope.viewStart), dayInGrid);
						newHour	= scope.dayStartHour + newPos - (scope.nbHours * dayInGrid);
						// When placing the right handle on the last hour of day, make sure that
						// its date corresponds (and not set before the first hour of next day)
						if (side === 'right' && newHour === scope.dayStartHour) {
							newHour = scope.dayEndHour + 1;
							newDate = addDaysToDate(newDate, -1);
						}
					}
					else {
						if (side === 'left')
							var oldDate = thisRenderedEvent.startDate;
						else if (side === 'right')
							var oldDate =  thisRenderedEvent.endDate;
						else return;
						newDate = addDaysToDate(oldDate, offsetDay);
					}
					var thisEvent = $filter('filter')(scope.events, {id: +attrs.eventId}, true)[0];
					if (thisEvent) {
						$rootScope.$broadcast('eventScale', thisEvent, side, newDate, newHour);
						scope.throwError(3, "The DOM event 'eventScale' was emitted in rootScope.");
					}
					else
						scope.throwError(0, "The event with id #"+attrs.eventId+" was not found!");
					dragInit = false;
					startDeltaX = 0; grabDeltaX  = 0;
					parentEvent.css({opacity: 1});
					$document.off('mousemove', grabHandleMove);
					$document.off('mouseup', grabHandleEnd);
				}
			}
		};
	});