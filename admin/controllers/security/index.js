/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('SecurityDashboardController', ["$scope", function ($scope) {

    $scope.dashboard = {
        sessions : { 
            "from-date" : new Date(new Date().getFullYear(), 0, 1),
            "to-date": new Date(new Date().getFullYear(), 11, 31)
        }
    };

    async function fetchStats() {
        try {
            $scope.dashboard.users = (await SanteDB.resources.securityUser.findAsync({_count:0})).size;
            $scope.dashboard.groups = (await SanteDB.resources.securityRole.findAsync({_count:0})).size;
            $scope.dashboard.devices = (await SanteDB.resources.securityDevice.findAsync({_count:0})).size;
            $scope.dashboard.applications = (await SanteDB.resources.securityApplication.findAsync({_count:0})).size;
        }
        catch(e) {
            console.error(e);
        }
    }
    fetchStats().then(() => $scope.$apply());
}]);