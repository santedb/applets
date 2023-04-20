/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../js/santedb-bi.js"/>

angular.module('santedb').controller('ReportCenterController', ["$scope", "$rootScope", "$state", "$timeout", function ($scope, $rootScope, $state, $timeout) {

    // Initialize the controller
    async function initialize() {
        try {
            
            var reports = await SanteDBBi.resources.report.findAsync({ "meta.public": true });
            $timeout(() => $scope.reports = reports.item);

        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    initialize();
   
}]);