/// <reference path="../../../core/js/santedb.js"/>
/*
 * Copyright (C) 2021 - 2025, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Portions Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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
angular.module('santedb').controller('QueueAdminController', ["$scope", "$rootScope", '$interval', '$timeout', function ($scope, $rootScope, $interval, $timeout) {

    $scope.extern = "false";

    $scope.purgeQueue = async function (id, idx) {
        if(confirm(SanteDB.locale.getString("ui.admin.queue.purge.confirm", { queue: id })))
        {

            try {
                SanteDB.display.buttonWait(`#DispatcherQueuerepurge${idx}`, true);
                await SanteDB.resources.dispatcherQueue.deleteAsync(id, $scope.extern == "true");
                $("div[type=DispatcherQueue] table").DataTable().ajax.reload()

            }   
            catch (e) {
                $rootScope.errorHandler(e);
            }         
            finally {
                SanteDB.display.buttonWait(`#DispatcherQueuerepurge${idx}`, false);

            }
        }
    }

    // Resubmit all data
    $scope.resubmitQueue = async function (id, idx) {
        if(confirm(SanteDB.locale.getString("ui.admin.queue.resubmit.confirm", { queue: id })))
        {

            try {
                SanteDB.display.buttonWait(`#DispatcherQueueresubmit${idx}`, true);
                await SanteDB.resources.dispatcherQueue.updateAsync(id, { "$type": "SanteDB.Core.Queue.DispatcherQueueInfo, SanteDB.Core.Api", "id": id }, $scope.extern == "true");
                $("div[type=DispatcherQueue] table").DataTable().ajax.reload()

            }   
            catch (e) {
                $rootScope.errorHandler(e);
            }         
            finally {
                SanteDB.display.buttonWait(`#DispatcherQueueresubmit${idx}`, false);

            }
        }
    }

    $scope.refreshTable = function() {
        $("#queueTable table").DataTable().draw();

    }

}]);