v 1.5.3
  - HotFix: using new paths of src in example

v 1.5.2
  - HotFix: updated bower.json release version

v 1.5.1
  - HotFix: current events color (CSS)

v 1.5.0
  - Refactored project's structure to allow install with Bower

v 1.5
  - **Hourly grid** available (one sub-column = one hour) with numbers (hour in day) in header
  - Customizable start & end hours for working day
  - **Drag & drop** support (still only for desktop) on hourly grid too
  - Several small bugs fixed and improved UI

v 1.0
  - **Daily grid** (one column = one day) with numbers (day in month) and month-year labels in header
  - **Automatic vertical positioning** to avoid collisions
  - Current day and current events **highlighted with CSS classes**
  - **Custom CSS allowed** for all aspects of the UI (see `plantt.css` for examples)
  - **Drag & drop** support (for desktop only at the moment) to visually move and resize events
  - Fully **independant of the controller**, allowing you to make anything you want with this widget !
  - **View manipulation**: zoom in & out, move left or right, set custom start and end dates with a bunch of scope-accessible functions
  - Emits **custom DOM events** to handle callbacks for every UI actions (`daySelect`, `periodSelect`, `eventMove`, `eventScale`, `eventOpen`, `planttError`), allowing you to make your own checks before storing new dates of the event, and save it on your server using ajax for example
  - **Automatic lock** of current and past events (with possible secure days margin)
  - Dates **Internationalization** really simple with [ng-locale](https://github.com/angular/angular.js/tree/master/src/ngLocale) (i18n)
