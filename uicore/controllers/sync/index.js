/// <reference path="../../../core/js/santedb.js"/>
/*
 * Copyright (C) 2021 - 2024, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
 * Portions Copyright (C) 2015-2018 Mohawk College of Applied Arts and Technology
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
 */
angular.module("santedb").controller("SyncController", ['$scope', '$rootScope', '$interval', '$timeout', function ($scope, $rootScope, $interval, $timeout) {

    const SYNC_JOB_ID = "E511689A-98E1-47CD-8933-6A8CEF8AE014";

    /**
     * @summary Refreshes queues
     */
    async function refreshState() {
        // Fetch the queues from the server
        try {
            var queue = await SanteDB.resources.queue.findAsync();
            var jobState = await SanteDB.resources.jobInfo.getAsync(SYNC_JOB_ID);
            $timeout(() => {
                $scope.queue = queue;
                $scope.queue.isSynchronizing = jobState.state == "Running";
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    /**
     * @summary Gets the synchonization log
     */
    async function getLog() {
        try {
            var syncLog = await SanteDB.resources.sync.findAsync();
            await Promise.all(syncLog.map(async function (s) {
                var resource = s.ResourceType.toCamelCase();
                switch (resource) {
                    case "relationshipValidationRule":
                        resource = "validationRule";
                        break;
                }
                if (s.Filter)
                    s.Filter = decodeURI(s.Filter);
                var filter = s.Filter;

                if (!SanteDB.resources[resource] || filter && filter.indexOf("$") == 0) {
                    s.local = "-";
                    s.remote = "-";
                    return;
                }

                if (!filter)
                    filter = "_count=0&_includeTotal=true";
                else
                    filter += "&_count=0&_includeTotal=true";

                // if (filter.indexOf("_subscription") > -1)
                //     s.local = "-";
                // else {
                    try {
                        var localCount = await SanteDB.resources[resource].findAsync(filter, null, null, s);
                        s.local = localCount.totalResults === undefined ? localCount.size : localCount.totalResults;
                    }
                    catch (e) {
                        s.local = '-';
                    }
                // }

                if ($scope.showRemoteCounts) {
                    try {
                        var remoteCount = await SanteDB.resources[resource].findAsync(filter, null, true, s);
                        s.remote = remoteCount.totalResults === undefined ? remoteCount.size : remoteCount.totalResults;
                    }
                    catch (e) {
                        s.remote = '-';
                    }
                }
            }));

            $timeout(() => $scope.syncLog = syncLog);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Retry queue
    async function retryAll() {
        if (confirm(SanteDB.locale.getString("ui.sync.deadletter.retryAll.confirm"))) {
            try {
                SanteDB.display.buttonWait("#btnRetryQueue", true);
                await SanteDB.resources.queue.invokeOperationAsync("deadletter", "retry", { all: true });
                await refreshState();
                toastr.success(SanteDB.locale.getString("ui.sync.deadletter.retryAll.success"));
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
            finally {
                SanteDB.display.buttonWait("#btnRetryQueue", false);
            }

        }
    }

    $scope.retryAll = retryAll;
    $scope.filter = { _count: 10, _includeTotal: true };

    // Synchronize all now
    async function syncNow() {
        try {
            await SanteDB.resources.jobInfo.invokeOperationAsync(SYNC_JOB_ID, "start", { "mode": "All", "push": true });
            await refreshState();
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.syncNow = syncNow;

    // Refresh queues on 10s intervals
    refreshState();
    getLog();

    var refreshPromise = $interval(refreshState, 5000);

    $scope.$on('$destroy', function () {
        if (refreshPromise)
            $interval.cancel(refreshPromise);
    });

    $("#queueModal").on("hidden.bs.modal", function () {
        $scope.currentQueue = null;
    });

    $("#currentItemModal").on("hidden.bs.modal", function () {
        $scope.currentObject = null;
    });

    // Open a queue
    $scope.openQueue = async function (queueName) {
        try {
            $("#queueModal").modal('show');
            var queueContents = await SanteDB.resources.queue.getAsync(queueName, null, $scope.filter);
            $timeout(() => {
                $scope.currentQueue = { name: queueName };
                $scope.currentQueue.content = queueContents
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.$watch("filter._offset", async function (n, o) {
        if (n !== undefined && $scope.currentQueue && $scope.currentQueue.name) {
            var queueContents = await SanteDB.resources.queue.getAsync($scope.currentQueue.name, null, $scope.filter);
            $timeout(() => $scope.currentQueue.content = queueContents);
        }
    });

    $scope.$watch("showRemoteCounts", function (n, o) {
        if (n) getLog();
    });

    // View object
    $scope.viewObject = async function (id, tag) {
        try {
            $("#currentItemModal").modal({ 'backdrop': 'static' });
            var currentObject = await SanteDB.resources.queue.getAsync(`${$scope.currentQueue.name}/${id}`);

            var queueObject = $scope.currentQueue.content.resource.find(o => o.id == id);
            $timeout(() => {
                $scope.currentObject = queueObject;
                $scope.currentObject.data = currentObject;
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Resubmit object to queue
    $scope.resubmitObject = async function (id) {
        try {
            $scope.currentQueue = null;
            await SanteDB.resources.queue.invokeOperationAsync("deadletter", "retry", { id: id });
            $("#currentItemModal").modal("hide");
            toastr.success(SanteDB.locale.getString("ui.sync.deadletter.requeue.success"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            $scope.openQueue("deadletter");
        }
    }

    // Ignore the queue object
    $scope.ignoreObject = async function (id) {
        try {
            if (confirm(SanteDB.locale.getString("ui.sync.deadletter.ignore.confirm"))) {
                await SanteDB.resources.queue.deleteAsync(`deadletter/${id}`);
                $("#currentItemModal").modal("hide");
                toastr.success(SanteDB.locale.getString("ui.sync.deadletter.ignore.success"));

            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            $scope.openQueue("deadletter");
        }
    }

    // Reset the sync log
    $scope.resetSyncLog = async function (key) {
        if (confirm(SanteDB.locale.getString("ui.sync.resetConfirm"))) {
            try {
                SanteDB.display.buttonWait("#syncCenterTable button", true);
                SanteDB.display.buttonWait("#resetAllButton", true);
                if (key === undefined)
                    await SanteDB.resources.sync.invokeOperationAsync(null, "reset");
                else {
                    await SanteDB.resources.sync.invokeOperationAsync(key, "reset");
                }

                await getLog();
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
            finally {
                SanteDB.display.buttonWait("#syncCenterTable button", false);
                SanteDB.display.buttonWait("#resetAllButton", false);
                try { $scope.$apply(); }
                catch (e) { }
            }
        }
    }
}]);