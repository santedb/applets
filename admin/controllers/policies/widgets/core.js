/// <reference path="../../../../core/js/santedb.js"/>
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
 */
angular.module('santedb').controller('EditPolicyCoreController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {



   /**
     * @summary Save the specified role
     */
    $scope.savePolicy = async function (policyForm, policy) {

        if (!policyForm.$valid) return;

        // Show wait state
        SanteDB.display.buttonWait("#savePolicyButton", true);

        try {
            if (policy.securityPolicy.id) {
                await SanteDB.resources.securityPolicy.updateAsync(policy.securityPolicy.id, policy.securityPolicy);
            }
            else {
                await SanteDB.resources.securityPolicy.insertAsync(policy.securityPolicy)
            }

            toastr.success(SanteDB.locale.getString("ui.model.securityPolicy.saveSuccess"));
        }
        catch (e) {
            SanteDB.display.buttonWait("#savePolicyButton", false);
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#savePolicyButton", false);
            $state.transitionTo("santedb-admin.security.policies.index")
        }
    }

    /**
     * @summary Reactivate Inactive User
     */
     $scope.reactivatePolicy = async function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.policy.reactivate.confirm")))
            return;
        
        try {
            var patch = new Patch({
                change: [
                    new PatchOperation({
                        op: PatchOperationType.Remove,
                        path: 'obsoletionTime',
                        value: null
                    }),
                    new PatchOperation({
                        op: PatchOperationType.Remove,
                        path: 'obsoletedBy',
                        value: null
                    })
                ]
            });

            SanteDB.display.buttonWait("#reactivatePolicyButton", true);
            await SanteDB.resources.securityPolicy.patchAsync($stateParams.id, $scope.target.securityPolicy.etag, patch);
            toastr.success(SanteDB.locale.getString("ui.admin.policy.reactivate.success"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
            SanteDB.display.buttonWait("#reactivatePolicyButton", false);
        }
        finally {
            SanteDB.display.buttonWait("#reactivatePolicyButton", false);
        }
    }
}]);