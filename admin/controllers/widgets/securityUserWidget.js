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
angular.module('santedb').controller('SecurityUserWidgetController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    /**
     * @summary Reset password for the current
     */
    $scope.resetPassword = function (securityUser) {
        // Show wait
        SanteDB.display.buttonWait("#resetPasswordButton", true);

        // Setup password change request
        $scope.password = {
            id: securityUser.id,
            entity: {
                userName: securityUser.userName,
                id: securityUser.id,
                password: null
            },
            passwordOnly: true
        };
        $("#passwordModal").modal({ backdrop: 'static' });

        // User has pressed save or cancelled
        $("#passwordModal").on('hidden.bs.modal', function () {
            $scope.password = null;
            SanteDB.display.buttonWait("#resetPasswordButton", false);
        });

    }

    /**
     * @summary Reactivate Inactive User
     */
    $scope.reactivateUser = async function (securityUser) {
        if (!confirm(SanteDB.locale.getString("ui.admin.users.reactivate.confirm")))
        return;

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
        try {
            SanteDB.display.buttonWait("#reactivateUserButton", true);
            var updatedUser = await SanteDB.resources.securityUser.patchAsync($stateParams.id, securityUser.etag, patch)
            
            $timeout(() => {
                securityUser.obsoletionTime = null;
                securityUser.obsoletedBy = null;
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#reactivateUserButton", false);

        }

    }

    /**
     * @summary Reset invalid logins
     */
    $scope.resetInvalidLogins = async function (securityUser) {
        if (!confirm(SanteDB.locale.getString("ui.admin.users.invalidLogin.reset")))
            return;

        var patch = new Patch({
            change: [
                new PatchOperation({
                    op: PatchOperationType.Replace,
                    path: "invalidLoginAttempts",
                    value: 0
                })
            ]
        });

        try {
            SanteDB.display.buttonWait("#resetInvalidLoginButton", true);
            await SanteDB.resources.securityUser.patchAsync($stateParams.id, securityUser.etag, patch);
            $timeout(() => {
                securityUser.invalidLoginAttempts = 0;
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
        }
    }

    /**
    * @summary Unlock user
    */
    $scope.unlock = async function (securityUser) {
        if (!confirm(SanteDB.locale.getString("ui.admin.users.confirmUnlock")))
            return;

        try {
            SanteDB.display.buttonWait("#unlockButton", true);
            await SanteDB.resources.securityUser.unLockAsync($stateParams.id);
            $timeout(() => securityUser.lockout = null);
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#unlockButton", false);
        }
    }
    /**
     * @summary Save the user security data
     */
    $scope.saveUser = async function(userForm, securityUser, roles) {

        if (!userForm.$valid) return;

        // Show wait state
        SanteDB.display.buttonWait("#saveUserButton", true);

        // Set roles
        try {
            var userSubmission = {
                $type: "SecurityUserInfo",
                role : roles,
                entity : securityUser
            };

            var result = await SanteDB.resources.securityUser.updateAsync(securityUser.id, userSubmission);
            toastr.success(SanteDB.locale.getString("ui.model.securityUser.saveSuccess"));
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveUserButton", false);
        }

    }

}]);