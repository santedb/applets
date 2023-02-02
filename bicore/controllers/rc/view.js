/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../js/santedb-bi.js"/>

angular.module('santedb').controller('ReportViewController', ["$scope", "$rootScope", "$stateParams", "$timeout", function ($scope, $rootScope, $stateParams, $timeout) {

    $scope.reportId = $stateParams.id;
   
}]);