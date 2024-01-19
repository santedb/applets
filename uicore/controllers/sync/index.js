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
angular.module("santedb").controller("SyncController", ['$scope', '$rootScope', '$interval', '$timeout', function ($scope, $rootScope, $interval, $timeout) {

    /**
     * @summary Refreshes queues
     */
    async function refreshQueues() { 
        // Fetch the queues from the server
        try {
            var queue = await SanteDB.resources.queue.findAsync();
            $timeout(() => $scope.queue = queue);
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

            $scope.syncLog.forEach(function(s) {
                var resource = s.ResourceType.toCamelCase();
                if(s.Filter)
                    s.Filter = decodeURI(s.Filter);
                var filter = remoteFilter = s.Filter;


                if(!SanteDB.resources[resource])
                    {
                        s.local = "-";
                        s.remote = "-";
                        return;
                    }

                if(!remoteFilter)
                    remoteFilter = "_upstream=true&_count=0&_includeTotal=true";
                else 
                    remoteFilter += "&_upstream=true&_count=0&_includeTotal=true";

                if(!filter)
                    filter = "_count=0&_includeTotal=true";
                else 
                    filter += "&_count=0&_includeTotal=true";

                if(filter.indexOf("_subscription") > -1)
                    s.local = "-";
                else
                    SanteDB.resources[resource].findAsync(filter, null, s).then(r=>s.local= r.totalResults !== undefined ? r.totalResults : r.size).catch(r=>s.local = '?');
                
                SanteDB.resources[resource].findAsync(remoteFilter, null, s).then(r=>s.remote= r.totalResults !== undefined ? r.totalResults : r.size).catch(r=>s.remote = '?');
            });

        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    // Retry queue
    async function retryAll() {
        await SanteDB.resources.queue.insertAsync({ $type: "Queue"});
        await refreshQueues();
    }

    $scope.retryAll = retryAll;
    $scope.filter = { _count: 10, _includeTotal: true };
    
    // Synchronize all now
    async function syncNow() {
        SanteDB.display.buttonWait("#btnSync", true);
        await SanteDB.resources.sync.insertAsync({ $type: "Sync"});
        SanteDB.display.buttonWait("#btnSync", false);
    }

    $scope.syncNow = syncNow;

    // Refresh queues on 30s intervals
    refreshQueues().then(() => $scope.$apply());
    var refreshPromise = $interval(refreshQueues, 10000);

    $scope.$on('$destroy',function(){
        if(refreshPromise)
            $interval.cancel(refreshPromise);   
    });

    $("#queueModal").on("hidden.bs.modal", function() {
        $scope.currentQueue = null;
    });

    $("#currentItemModal").on("hidden.bs.modal", function() {
        $scope.currentObject = null;
    });
    
    // Open a queue
    $scope.openQueue = async function(queueName) {
        try {
            $scope.currentQueue = { name: queueName };
            $("#queueModal").modal('show');
            var queueContents = await SanteDB.resources.queue.getAsync(queueName, null, $scope.filter);
            $timeout(() => $scope.currentQueue.content = queueContents);
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.$watch("filter._offset", async function(n,o) {
        if(n !== undefined && $scope.currentQueue && $scope.currentQueue.name) {
            var queueContents = await SanteDB.resources.queue.getAsync($scope.currentQueue.name, null, $scope.filter);
            $timeout(() => $scope.currentQueue.content = queueContents);
        }
    })

    // View object
    $scope.viewObject = async function(id, tag) {
        try {
            $("#currentItemModal").modal({ 'backdrop' : 'static' });
            var currentObject = await SanteDB.resources.queue.getAsync(`${$scope.currentQueue.name}/${id}`);

            var queueObject = $scope.currentQueue.content.resource.find(o=>o.id == id);
            $timeout(() => {
                $scope.currentObject = queueObject;
                $scope.currentObject.data = currentObject;
            });
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }
    getLog().then(() => $scope.$apply());

    // Resubmit object to queue
    $scope.resubmitObject = async function(id) {
        try {
            $scope.currentQueue = null;
            await SanteDB.resources.queue.addAssociatedAsync("dead", id, {});
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            $scope.openQueue("deadletter");
        }
    }

    // Ignore the queue object
    $scope.ignoreObject = async function(id) {
        try {
            if(confirm(SanteDB.locale.getString("ui.sync.deadletter.ignoreConfirm")))
                SanteDB.resources.queue.removeAssociatedAsync("dead", "confirm", id);
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            $scope.openQueue("deadletter");
        }
    }

    // Reset the sync log
    $scope.resetSyncLog = async function(type) {
        if(confirm(SanteDB.locale.getString("ui.sync.resetConfirm"))) {
            try {
                SanteDB.display.buttonWait("#syncCenterTable button", true);
                SanteDB.display.buttonWait("#resetAllButton", true);
                if(type === undefined) 
                    await SanteDB.resources.queue.deleteAsync();
                else {
                    await SanteDB.resources.queue.deleteAsync(type);
                }
                
                await getLog();
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
            finally {
                SanteDB.display.buttonWait("#syncCenterTable button", false);
                SanteDB.display.buttonWait("#resetAllButton", false);
                try { $scope.$apply(); }
                catch(e) {}
            }
        }
    }
}]);