# Plantt
AngularJS module : Simple scheduler on a timeline

## Installation

Just import AngularJS, and the Plantt's javacript and CSS files:

    <link href="plantt.css" rel="stylesheet" type="text/css" />
    <script src="js/vendor/angular-1.5.8.min.js"></script>
    <script src="plantt.js"></script>

Then, make sure the file **plantt-template.html** is readable into your project's root folder.

## Usage

Insert an element **<scheduler>** into your HTML, attach your controller to it, then inject the module in your app:

    var planttApp = angular.module("planttApp", ["plantt.module"]);

    planttApp.controller("planttExample", function($scope){
        $scope.events = [
            { id: 0, title: 'Test', type: 'normal', startDate: new Date(2016, 8-1, 20, 8), endDate: new Date(2016, 8-1, 25, 19) }
        ]
    }

### That's it!
Have fun :)