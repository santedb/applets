angular.module('santedb').controller('NotificationsDashboardController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

    $scope.dashboard = {};

    async function initializeView() {
        try {
            //We use _upstream:true because notifications are only at the iCDR level so there will never be 'local' notification objects.
            $scope.dashboard.templateCount = (await SanteDB.resources.notificationTemplate.findAsync({_count:0,_includeTotal:true,_upstream:true})).size;
            $scope.dashboard.instanceCount = (await SanteDB.resources.notificationInstance.findAsync({_count:0,_includeTotal:true,_upstream:true})).size;
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    initializeView().then(() => $scope.$apply());
}]);