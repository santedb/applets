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
 * 
 * User: fyfej
 * Date: 2023-5-19
 */
angular.module('santedb').controller('EditGroupPropertiesController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$compile", '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $compile, $timeout) {

    /**
     * @summary Reactivate Inactive Group
     */
    $scope.reactivateGroup = async function (group) {
        if (!confirm(SanteDB.locale.getString("ui.admin.group.reactivate.confirm")))
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

            // Send the patch
            SanteDB.display.buttonWait("#reactivateRoleButton", true);
            await SanteDB.resources.securityRole.patchAsync($stateParams.id, group.securityRole.etag, patch);
            group.securityRole.obsoletionTime = null;
            group.securityRole.obsoletedBy = null;
            toastr.success(SanteDB.locale.getString("ui.admin.group.reactivate.success"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#reactivateRoleButton", false);
        }

    }

    /**
     * @summary Save the specified role
     * @param {any} roleForm The form to use for validation
     * @param {SecurityRole} group The group to save
     */
    $scope.saveGroup = async function (roleForm, group) {

        if (!roleForm.$valid) return;

        // Show wait state
        SanteDB.display.buttonWait("#saveGroupButton", true);

        try {

            // Just post the security role 
            var patch = new Patch({
                appliesTo: {
                    id: group.securityRole.id,
                    etag: group.securityRole.tag
                },
                change: [
                    new PatchOperation({
                        op: PatchOperationType.Replace,
                        path: "description",
                        value: group.securityRole.description
                    })
                ]
            });
            var role = await SanteDB.resources.securityRole.patchAsync(group.securityRole.id, group.securityRole.etag, patch);
            toastr.success(SanteDB.locale.getString("ui.model.securityRole.saveSuccess"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveGroupButton", false);
        }

    }
}]);