/// <reference path="../../../core/js/santedb.js"/>
/*
 * Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you 
 * may not use this file except in compliance with the License. You may 
 * obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under 
 * the License.
 * 
 * User: Justin Fyfe
 * Date: 2019-12-16
 */
angular.module("santedb").controller("SyncController", ['$scope', '$rootScope', '$interval', function ($scope, $rootScope, $interval) {

    /**
     * @summary Refreshes queues
     */
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

    /**
     * @summary Gets the synchonization log
     */
    async function getLog() {
        try {
            $scope.syncLog = await SanteDB.resources.sync.findAsync();
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

    // Open a queue
    $scope.openQueue= async function(queueName) {
        try {
            $scope.currentQueue = { name: queueName };
            $("#queueModal").modal('show');
            $scope.currentQueue.content = await SanteDB.resources.queue.getAsync(queueName);
            $scope.$apply();
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    // View object
    $scope.viewObject = async function(id) {
        try {
            $("#currentItemModal").modal({ 'backdrop' : 'static' });
            $scope.currentObject = await SanteDB.resources.queue.getAsync(`${$scope.currentQueue.name}/${id}`);
            $scope.$apply();
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }
    getLog().then(() => $scope.$apply());

}]);