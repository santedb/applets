/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('SecurityDashboardController', ["$scope", "$rootScope", "$state", "$interval", function ($scope, $rootScope, $state, $interval) {

    SanteDB.resources.securityUser.findAsync({_count:0}).then(function(d) { 
        $scope.dashboard = $scope.dashboard || {};
        $scope.dashboard.users = d.size;
        try { $scope.$apply(); }
        catch {}
    });
    SanteDB.resources.securityRole.findAsync({_count:0}).then(function(d) { 
        $scope.dashboard = $scope.dashboard || {};
        $scope.dashboard.groups = d.size;
        try { $scope.$apply(); }
        catch {}
    });
    SanteDB.resources.securityDevice.findAsync({_count:0}).then(function(d) { 
        $scope.dashboard = $scope.dashboard || {};
        $scope.dashboard.devices = d.size;
        try { $scope.$apply(); }
        catch {}
    });
    SanteDB.resources.securityApplication.findAsync({_count:0}).then(function(d) { 
        $scope.dashboard = $scope.dashboard || {};
        $scope.dashboard.applications = d.size;
        try { $scope.$apply(); }
        catch {}
    });
}]);