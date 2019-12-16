/// <reference path="../../../core/js/santedb.js"/>
angular.module("santedb").controller("SyncController", ['$scope', '$rootScope', '$interval', function ($scope, $rootScope, $interval) {

    // Refresh queues
    async function refreshQueues() { 
        // Fetch the queues from the server
        try {
            $scope.queue = await SanteDB.resources.queue.findAsync();
            await $scope.$applyAsync();
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    // Retry queue
    $scope.retryAll = async function() {
        await SanteDB.resources.queue.insertAsync({ $type: "Queue"});
        await refreshQueues();
    }

    // Synchronize all now
    $scope.syncNow = async function() {
        SanteDB.display.buttonWait("#btnSync", true);
        await SanteDB.resources.sync.insertAsync({ $type: "Sync"});
        SanteDB.display.buttonWait("#btnSync", false);
    }

    // Refresh queues on 30s intervals
    refreshQueues().then(() => $scope.$apply());
    $interval(refreshQueues, 10000);

    // Get sync log
    async function getLog() {
        try {
            $scope.syncLog = await SanteDB.resources.sync.findAsync();
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }
    getLog().then(() => $scope.$apply());
}]);