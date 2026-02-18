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
angular.module('santedb').controller('PubSubIndexController', ["$scope", "$rootScope", "$state", function ($scope, $rootScope, $state) {

    // Render the active indicator
    $scope.renderActive = function (r) {
        if(r.obsoletionTime) {
            return `<i class='text-danger fas fa-circle'></i>  ${SanteDB.locale.getString("ui.state.obsolete")}`;
        }
        else if (r.active === true) {
            return `<i class='text-success fas fa-circle'></i> ${SanteDB.locale.getString("ui.state.active")}`;
        }
        else {
            return `<i class='text-warning fas fa-circle'></i>  ${SanteDB.locale.getString("ui.state.inactive")}`;

        }
    }

    $scope.reprocess = async function(id, index) {

        var data = $("#pubSubManager table").DataTable().row(index).data();
        if(confirm(SanteDB.locale.getString("ui.admin.pubsub.reprocess.confirm", { name: data.name }))) {
            try {
                await SanteDB.resources.jobInfo.invokeOperationAsync("5A389F18-0170-4D73-A37A-EE99B2EB201E", "start", [data.name]);
                toastr.success(SanteDB.locale.getString("ui.admin.job.runJob.success"));
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        }

    }
    // Disable the subscription
    $scope.disableSubscription = async function (id) {

        if (confirm(SanteDB.locale.getString("ui.admin.pubsub.disable.confirm"))) {
            try {
                await SanteDB.resources.pubSubSubscriptionDefinition.invokeOperationAsync(id, "activate", { "status": false });
                $("#pubSubManager table").DataTable().ajax.reload();
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }
    }

    // Enable the subscription
    $scope.enableSubscription = async function (id) {
        if (confirm(SanteDB.locale.getString("ui.admin.pubsub.enable.confirm"))) {
            try {
                await SanteDB.resources.pubSubSubscriptionDefinition.invokeOperationAsync(id, "activate", { "status": true });
                $("#pubSubManager table").DataTable().ajax.reload();
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }
    }

    // Delete subscription
    $scope.deleteSubscription = async function(id) {
        if (confirm(SanteDB.locale.getString("ui.admin.pubsub.delete.confirm"))) {
            try {
                await SanteDB.resources.pubSubSubscriptionDefinition.deleteAsync(id);
                $("#pubSubManager table").DataTable().ajax.reload();
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }
    }

    // Un-delete a subscription
    $scope.undeleteSubscription = async function(id) {
        try {
            
            await SanteDB.resources.pubSubSubscriptionDefinition.invokeOperationAsync(id, "activate", { "status": false });
            $("#pubSubManager table").DataTable().ajax.reload();

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Create subscription
    $scope.createSubscription = function() {
        $state.go("santedb-admin.system.pubsub.edit", { id: 'new' });
    }
}])