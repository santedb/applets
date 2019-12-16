/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('SystemInfoController', ["$scope", "$rootScope", "$state", "$interval", function ($scope, $rootScope, $state, $interval) {


    $scope.isRemoteLoading = true;
    $scope.isLocalLoading = true;

    // Get application information
    SanteDB.application.getAppInfoAsync({ updates: false })
        .then(function(d) {
            $scope.info = d;
            $scope.isLocalLoading = false;
            $scope.$apply();
        })
        .catch($rootScope.errorHandler);

    // Get application information
    SanteDB.application.getAppInfoAsync({ remote: true })
    .then(function(d) {
        $scope.server = d;
        $scope.isRemoteLoading = false;
        $scope.$apply();
    })
    .catch(function(e) { 
        toastr.error(e.message, SanteDB.locale.getString("ui.error.remote.error"));
        $scope.isRemoteLoading = false;
        
    });


}]);