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
angular.module('santedb').controller('CreateGroupController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$compile", '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $compile, $timeout) {

    $scope.target = {
        securityRole: new SecurityRole(),
        policy: []
    };

    /**
     * @summary Watch for changes to the username if we're creating and warn of duplicates
     */
    $scope.$watch("target.securityRole.name", function (n, o) {
        if (n != o && n && n.length >= 3) {
            SanteDB.display.buttonWait("#roleNameCopyButton button", true, true);
            SanteDB.resources.securityRole.findAsync({ name: n, _count: 0 })
                .then(function (r) {
                    SanteDB.display.buttonWait("#roleNameCopyButton button", false, true);
                    if (r.size > 0) // Alert error for duplicate
                        $scope.createForm.rolename.$setValidity('duplicate', false);
                    else
                        $scope.createForm.rolename.$setValidity('duplicate', true);

                    try { $scope.$apply(); }
                    catch (e) { }
                })
                .catch(function () {
                    SanteDB.display.buttonWait("#roleNameCopyButton button", false, true);
                });
        }
    });

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
            // Insert the role
            var role = await SanteDB.resources.securityRole.insertAsync({
                $type: "SecurityRoleInfo",
                entity: group.securityRole
            });
            toastr.success(SanteDB.locale.getString("ui.model.securityRole.saveSuccess"));
            $state.go("santedb-admin.security.groups.edit", { "id": role.entity.id })
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveGroupButton", false);
        }

    }
}]);
