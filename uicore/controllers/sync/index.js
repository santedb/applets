/// <reference path="../../../core/js/santedb.js"/>
angular.module("santedb").controller("SyncController", ['$scope', '$rootScope', '$interval', async function ($scope, $rootScope, $interval) {

    $scope.syncLog = [];
    // Refresh queues
    async function refreshQueues() { 
        // Fetch the queues from the server
        try {
            $scope.queue = await SanteDB.resources.queue.findAsync();
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    // Refresh queues on 30s intervals
    await refreshQueues();
    $interval(refreshQueues, 30000);

    // Get sync log
    try {
        $scope.syncLog = await SanteDB.resources.sync.findAsync();
    }
    catch(e) {
        $rootScope.errorHandler(e);
    }
}]);