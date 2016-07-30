# Plantt
### AngularJS module : Simple scheduler on a timeline

*This is a Work In Progress project, a lot of new features are comming*

Check the **live demo** (kept updated) here : [code.polosson.com/Plantt/](http://www.code.polosson.com/Plantt/)

## Installation

Just import AngularJS, and the Plantt's javacript and CSS files:

    <link href="plantt.css" rel="stylesheet" type="text/css" />
    <script src="js/vendor/angular-1.5.8.min.js"></script>
    <script src="plantt.js"></script>

Then, make sure the file **plantt-template.html** is readable into your project's root folder.

## Usage

Insert an element **scheduler** into your HTML, and attach your controller to it:

    <scheduler ng-controller="planttExample"></scheduler>

Finally, inject the module in your app and define your controller:

    var planttApp = angular.module("planttApp", ["plantt.module"]);

    planttApp.controller("planttExample", function($scope){
        $scope.events = [
            {
                id: 0, title: 'Test', type: 'normal',
                startDate: new Date(2016, 8-1, 20, 8),
                endDate: new Date(2016, 8-1, 25, 19)
            }
        ]
    }

Please not that your controller must have a **$scope.events** variable, which must be an array.  
The following data is needed in the objects of events collection:
 - **id** (int)
 - **title** (string)
 - **type** (string)
 - **startDate** (date object)
 - **endDate** (date object)


### That's it!
Have fun :)
