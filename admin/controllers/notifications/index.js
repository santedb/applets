angular.module('santedb').controller('NotificationsDashboardController', ["$scope", "$timeout", function ($scope, $timeout) {

    async function initializeView() {
        $scope.numberOfInstances = 10
    }

    initializeView();
}]);