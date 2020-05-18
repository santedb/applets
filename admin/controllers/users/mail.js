
/// <reference path="../../../core/js/santedb.js" />

angular.module('santedb').controller('UserMailController', ["$scope", "$rootScope", "$stateParams", "$interval", function ($scope, $rootScope, $stateParams, $interval) {

    $scope.filter = {
        flags: '!32',
        _count: 10,
        _orderBy :"creationTime:desc"
    };

    if($stateParams.id) {
        $scope.currentMessage = { loading :  true };
        selectMessage($stateParams.id);
    }

    checkMail();

    $scope.setFilter = function(filter)
    {
        $scope.filter = filter;
        $scope.filter._count = 10;
        $scope.filter._orderBy = "creationTime:desc";
        $scope.mailbox = { loading: true };
        checkMail();
    };


    // Check mail refresh results.
    $scope.refreshResults = checkMail;

    // Check the mail
    async function checkMail() {
        try {
            if ($scope.filter._subject || $scope.filter.subject)
                $scope.filter.subject = `~${$scope.filter._subject}`;
            $scope.mailbox = await SanteDB.resources.mail.findAsync($scope.filter);
            $scope.$apply();
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    var refreshInterval = $interval(() => checkMail(), 30000);

    async function selectMessage(id) {
        try {
            
            // Try to get locally
            if ($scope.mailbox && $scope.mailbox.resource)
                $scope.currentMessage = $scope.mailbox.resource.find(o => o.id == id);
            else 
                $scope.currentMessage = await SanteDB.resources.mail.getAsync(id);

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

    /**
     * Set the status of the message
     */
    $scope.setState = async function(id, state) {
        try {
            var current = await SanteDB.resources.mail.getAsync(id);
            current.flags = state;
            await SanteDB.resources.mail.updateAsync(id, current);
            checkMail();
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    // Destry
    $scope.$on('$destroy', function () {
        if (refreshInterval)
            $interval.cancel(refreshInterval);
    });

}]);
