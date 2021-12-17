/// <reference path="../../../core/js/santedb.js"/>
/*
 * Portions Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * Portions Copyright 2019-2019 SanteSuite Contributors (See NOTICE)
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
 * Date: 2019-10-12
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

    // Disable the subscription
    $scope.disableSubscription = async function (id) {

        if (confirm(SanteDB.locale.getString("ui.admin.pubsub.disable.confirm"))) {
            try {
                await SanteDB.resources.pubSubSubscription.invokeOperationAsync(id, "activate", { "status": false });
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
                await SanteDB.resources.pubSubSubscription.invokeOperationAsync(id, "activate", { "status": true });
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
                await SanteDB.resources.pubSubSubscription.deleteAsync(id);
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
            var sub = await SanteDB.resources.pubSubSubscription.getAsync(id);
            sub.obsoletionTime = null;
            sub.obsoletedBy = null;
            await SanteDB.resources.pubSubSubscription.updateAsync(id, sub);
            $("#pubSubManager table").DataTable().ajax.reload();

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Create subscription
    $scope.createSubscription = function() {
        $state.transitionTo("santedb-admin.system.pubsub.edit", { id: 'new' });
    }
}])