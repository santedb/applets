angular.module('santedb').controller('NotificationsDashboardController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

    async function initializeView() {
        try {
            refData = await Promise.all([
                await SanteDB.resources.notificationTemplate.getAsync(null, null, { _count: 0, _includeTotal: true }, true),
                await SanteDB.resources.notificationInstance.getAsync(null, null, { _count: 0, _includeTotal: true }, true)
            ])

            $scope.dashboard = {
                "templateCount": refData[0].size,
                "instanceCount": refData[1].size
            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    initializeView();
}]);