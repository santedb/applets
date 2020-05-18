
/// <reference path="../../../core/js/santedb.js" />

angular.module('santedb').controller('UserMailController', ["$scope", "$rootScope", "$stateParams", "$interval", function ($scope, $rootScope, $stateParams, $interval) {

    $scope.filter = {
        flags: '!20',
        _count: 10
    };

    checkMail();

    $scope.setFilter = function(filter)
    {
        $scope.filter = filter;
        $scope._count = 10;
        $scope.mailbox = { loading: true };
        checkMail();
    };

    // Check the mail
    async function checkMail() {
        try {
            if ($scope.filter._subject)
                $scope.filter.subject = `~${$scope.filter._subject}`;
            $scope.mailbox = await SanteDB.resources.mail.findAsync($scope.filter);
            $scope.$apply();
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    var refreshInterval = $interval(() => checkMail(), 5000);

    async function selectMessage(id) {
        try {
            
            // Try to get locally
            if ($scope.mailbox)
                $scope.currentMessage = $scope.mailbox.resource.find(o => o.id == id);
            if (!$scope.currentMessage) {
                $scope.currentMessage = await SanteDB.resources.mail.getAsync(id);
            }

            try {
                $scope.$apply();
            }
            catch (e) { }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.selectMessage = function(id) {
        $scope.currentMessage = { loading: true };
        selectMessage(id);
    }

    // Destry
    $scope.$on('$destroy', function () {
        if (refreshInterval)
            $interval.cancel(refreshInterval);
    });

}]);
