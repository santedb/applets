/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('SystemInfoController', ["$scope", "$rootScope", "$state", "$interval", function ($scope, $rootScope, $state, $interval) {


    $scope.isLoading = true;

    // Get application information
    SanteDB.application.getAppInfoAsync({ updates: true })
        .then(function(d) {
            $scope.info = d;
            $scope.isLoading = $scope.server === undefined;
            $scope.$apply();
        })
        .catch($rootScope.errorHandler);

    // Get application information
    SanteDB.application.getAppInfoAsync({ remote: true })
    .then(function(d) {
        $scope.server = d;
        $scope.isLoading = $scope.info === undefined;
        $scope.$apply();
    })
    .catch($rootScope.errorHandler);

    // Get application health
    $interval(function() {
        SanteDB.application.getHealthAsync().then(function(d) { $scope.health = d; $scope.$apply(); }).catch($rootScope.errorHandler);
        $scope.online = SanteDB.application.getOnlineState();
    }, 10000);


}]);