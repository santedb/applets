angular.module('santedb').controller('NotificationsDashboardController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

    async function initializeView() {
        try {
            var refData = await SanteDB.resources.notificationTemplate;

            $timeout(() => {
                $scope.dashboard = {};
                refData.forEach(o => $scope.dashboard[Object.keys(o)[0]] = o[Object.keys(o)[0]].totalResults);
            });

            console.log("TEST")
            console.log(refData)
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    initializeView();
}]);