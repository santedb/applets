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
 * Date: 2019-9-27
 */
angular.module('santedb').controller('EditApplicationController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    $scope.EntityClassKeys = EntityClassKeys;
    
    // Get the specified application
    if ($stateParams.id) {
        $scope.isLoading = true;
        SanteDB.resources.securityApplication.getAsync($stateParams.id)
            .then(function (u) {
                $scope.isLoading = !$scope.target;
                $scope.target = $scope.target || {};
                $scope.target.policy = u.policy;
                $scope.target.securityApplication = u.entity;
                $scope.target.securityApplication.etag = u.etag;
                $scope.$apply();
            })
            .catch($rootScope.errorHandler);

        // Get the related user entity at the same time
        SanteDB.resources.applicationEntity.findAsync({ securityApplication: $stateParams.id })
            .then(function (u) {
                $scope.isLoading = !$scope.target;
                $scope.target = $scope.target || {};

                if (u.resource && u.resource.length > 0) {
                    $scope.target.entity = u.resource[0];
                }
                else 
                    $scope.target.entity = new ApplicationEntity();

                $scope.$apply();
            })
            .catch($rootScope.errorHandler);
    }
    else  // New user
    {
        $scope.target = {
            securityApplication: new SecurityApplication(),
            entity: new ApplicationEntity(),
            roles: []
        };

        /**
         * @summary Watch for changes to the username if we're creating and warn of duplicates
         */
        $scope.$watch("target.securityApplication.name", function (n, o) {
            if (n != o && n && n.length >= 3) {
                SanteDB.display.buttonWait("#applicationNameCopyButton button", true, true);
                SanteDB.resources.securityApplication.findAsync({ name: n, _count: 0 })
                    .then(function (r) {
                        SanteDB.display.buttonWait("#applicationNameCopyButton button", false, true);
                        if (r.size > 0) // Alert error for duplicate
                            $scope.targetForm.applicationname.$setValidity('duplicate', false);
                        else
                            $scope.targetForm.applicationname.$setValidity('duplicate', true);

                        try { $scope.$apply(); }
                        catch (e) { }
                    })
                    .catch(function () {
                        SanteDB.display.buttonWait("#applicationNameCopyButton button", false, true);
                    });
            }
        });
    }

  
    /**
     * @summary Reactivate Inactive device
     */
    $scope.reactivateApplication = async function(application) {
        if(!confirm(SanteDB.locale.getString("ui.admin.applications.reactivate.confirm")))
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
        SanteDB.display.buttonWait("#reactivateApplicationButton", true);
        await  SanteDB.resources.securityApplication.patchAsync($stateParams.id, application.securityApplication.etag, patch)
        application.securityApplication.obsoletionTime = null;
        application.securityApplication.obsoletedBy = null;
        }
        catch (e) {
            $rootScope.errorHandler(e); 
            SanteDB.display.buttonWait("#reactivateApplicationButton", false);
        }
        finally {
            SanteDB.display.buttonWait("#reactivateApplicationButton", false);
        }
    }

    /**
     * @summary Reset secret
     */
    $scope.resetSecret = async function(application) {
        if($scope.target.securityApplication.id && !confirm(SanteDB.locale.getString("ui.admin.applications.secret.reset")))
            return;

        try {
            // Generate UUID
            var repl = SanteDB.application.generatePassword();
            var patch = new Patch({
                change: [
                    new PatchOperation({
                        op: PatchOperationType.Replace,
                        path: "applicationSecret",
                        value: repl
                    })
                ]
            });

            SanteDB.display.buttonWait("#resetSecretButton", true);
            await SanteDB.resources.securityApplication.patchAsync($stateParams.id, application.securityApplication.etag, patch);
            application.securityApplication.applicationSecret = repl;
        }
        catch(e) {
            SanteDB.display.buttonWait("#resetSecretButton", false);
            $rootScope.errorHandler(e); 
        }
        finally {
            SanteDB.display.buttonWait("#resetSecretButton", false);
        }
    }

    /**
     * @summary Reset invalid logins
     */
    $scope.resetInvalidLogins = async function(application) {
        if(!confirm(SanteDB.locale.getString("ui.admin.devices.invalidLogin.reset")))
            return;

        try {
            var patch = new Patch({
                change: [
                    new PatchOperation({
                        op: PatchOperationType.Replace,
                        path: "invalidAuth",
                        value: 0
                    })
                ]
            });

            SanteDB.display.buttonWait("#resetInvalidLoginButton", true);
            await SanteDB.resources.securityApplication.patchAsync($stateParams.id, application.securityApplication.etag, patch)
            application.securityApplication.invalidAuth = 0;
        }
        catch (e) {
            $rootScope.errorHandler(e);
            SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
        }
        finally {
            SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
        }
    }

     /**
     * @summary Unlock user
     */
    $scope.unlock = async function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.applications.confirmUnlock")))
            return;

        try {
            SanteDB.display.buttonWait("#unlockButton", true);
            await SanteDB.resources.securityApplication.unLockAsync($stateParams.id);
            $scope.target.securityApplication.lockout = null;
        }
        catch (e) {
            $rootScope.errorHandler(e);
            SanteDB.display.buttonWait("#unlockButton", false);
        }
        finally {
            SanteDB.display.buttonWait("#unlockButton", false);
            $scope.apply;
        }
    }

  
    /**
     * @summary Save the specified application 
     */
    $scope.saveApplication = async function(deviceForm, application) {

        if(!deviceForm.$valid) return;

        // Correct arrays and assign id
        if(!$scope.target.entity.id) {
            $scope.target.entity.id = SanteDB.application.newGuid();
        }

        // Show wait state
        SanteDB.display.buttonWait("#saveApplicationButton", true);

        try {
            if(application.securityApplication.id) {
                await  SanteDB.resources.securityApplication.updateAsync(application.securityApplication.id, {
                    $type: "SecurityApplicationInfo",
                    role: application.role,
                    entity: application.securityApplication
                })
            }
            else {
                application.securityApplication.applicationSecret = SanteDB.application.generatePassword();

                await SanteDB.resources.securityApplication.insertAsync({
                    $type: "SecurityApplicationInfo",
                    role: application.role,
                    entity: application.securityApplication
                })
            }
        }
        catch (e) {
            SanteDB.display.buttonWait("#saveApplicationButton", false);
            $rootScope.errorHandler(e);
        }
        finally {
            toastr.success(SanteDB.locale.getString("ui.model.securityApplication.saveSuccess"));
            SanteDB.display.buttonWait("#saveApplicationButton", false);
            application.entity = r;
        }

        // // user is already registered we are updating them 
        // if($scope.target.securityApplication.id)
        // {
        //     // Register the user first
        //     SanteDB.resources.securityApplication.updateAsync($scope.target.securityApplication.id, {
        //         $type: "SecurityApplicationInfo",
        //         role: $scope.target.role,
        //         entity: $scope.target.securityApplication
        //     }).then(function(u) {
        //         $scope.target.entity.securityApplication = u.entity.id;
        //         SanteDB.resources.applicationEntity.insertAsync($scope.target.entity)
        //             .then(successFn)
        //             .catch(errorFn)
        //     })
        // }
        // else {
        //     $scope.target.securityApplication.applicationSecret = SanteDB.application.generatePassword();
        //     // Register the user first
        //     SanteDB.resources.securityApplication.insertAsync({
        //         $type: "SecurityApplicationInfo",
        //         role: $scope.target.role,
        //         entity: $scope.target.securityApplication
        //     }).then(function(u) {
        //         var scrt = $scope.target.securityApplication.applicationSecret;
        //         $scope.target.entity.securityApplication = u.entity.id;
        //         $scope.target.securityApplication = u.entity;
        //         $scope.target.policy = u.policy || [];
        //         $scope.target.securityApplication.etag = u.etag;
        //         $scope.target.securityApplication.applicationSecret = scrt;
        //         SanteDB.resources.applicationEntity.insertAsync($scope.target.entity)
        //             .then(successFn)
        //             .catch(errorFn)
        //     })
        //     .catch(errorFn);
        // }
    }
}]);