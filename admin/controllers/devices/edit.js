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
 * Date: 2019-9-20
 */
angular.module('santedb').controller('EditDeviceController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    $scope.EntityClassKeys = EntityClassKeys;
    
    // Get the specified device
    if ($stateParams.id) {
        $scope.isLoading = true;
        SanteDB.resources.securityDevice.getAsync($stateParams.id)
            .then(function (u) {
                $scope.isLoading = !$scope.target;
                $scope.target = $scope.target || {};
                $scope.target.policy = u.policy;
                $scope.target.securityDevice = u.entity;
                $scope.target.securityDevice.etag = u.etag;
                $scope.$apply();
            })
            .catch($rootScope.errorHandler);

        // Get the related user entity at the same time
        SanteDB.resources.deviceEntity.findAsync({ securityDevice: $stateParams.id })
            .then(function (u) {
                $scope.isLoading = !$scope.target;
                $scope.target = $scope.target || {};

                if (u.resource && u.resource.length > 0) {
                    $scope.target.entity = u.resource[0];
                }
                else 
                    $scope.target.entity = new DeviceEntity();

                $scope.$apply();
            })
            .catch($rootScope.errorHandler);
    }
    else  // New user
    {
        $scope.target = {
            securityDevice: new SecurityDevice(),
            entity: new DeviceEntity(),
            roles: []
        };

        /**
         * @summary Watch for changes to the username if we're creating and warn of duplicates
         */
        $scope.$watch("target.securityDevice.name", function (n, o) {
            if (n != o && n && n.length >= 3) {
                SanteDB.display.buttonWait("#devicenameCopyButton button", true, true);
                SanteDB.resources.securityDevice.findAsync({ name: n, _count: 0 })
                    .then(function (r) {
                        SanteDB.display.buttonWait("#devicenameCopyButton button", false, true);
                        if (r.size > 0) // Alert error for duplicate
                            $scope.targetForm.devicename.$setValidity('duplicate', false);
                        else
                            $scope.targetForm.devicename.$setValidity('duplicate', true);

                        try { $scope.$apply(); }
                        catch (e) { }
                    })
                    .catch(function () {
                        SanteDB.display.buttonWait("#devicenameCopyButton button", false, true);
                    });
            }
        });
    }

  
    /**
     * @summary Reactivate Inactive device
     */
    $scope.reactivateDevice = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.devices.reactivate.confirm")))
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
        SanteDB.display.buttonWait("#reactivateDeviceButton", true);
        SanteDB.resources.securityDevice.patchAsync($stateParams.id, $scope.target.securityDevice.etag, patch)
            .then(function(r) {
                $scope.target.securityDevice.obsoletionTime = null;
                $scope.target.securityDevice.obsoletedBy = null;
                SanteDB.display.buttonWait("#reactivateDeviceButton", false);
                $scope.$apply();
            })
            .catch(function(e) { 
                $rootScope.errorHandler(e); 
                SanteDB.display.buttonWait("#reactivateDeviceButton", false);
            });

    }

    /**
     * @summary Reset secret
     */
    $scope.resetSecret = function() {
        if($scope.target.securityDevice.id && !confirm(SanteDB.locale.getString("ui.admin.devices.secret.reset")))
            return;

        // Generate UUID
        var repl = SanteDB.application.generatePassword();
        var patch = new Patch({
            change: [
                new PatchOperation({
                    op: PatchOperationType.Replace,
                    path: "deviceSecret",
                    value: repl
                })
            ]
        });

        SanteDB.display.buttonWait("#resetSecretButton", true);
        SanteDB.resources.securityDevice.patchAsync($stateParams.id, $scope.target.securityDevice.etag, patch)
            .then(function(r) {
                SanteDB.display.buttonWait("#resetSecretButton", false);
                $scope.target.securityDevice.deviceSecret = repl;
                $scope.$apply();
            }).catch(function(e) {
                SanteDB.display.buttonWait("#resetSecretButton", false);
                $rootScope.errorHandler(e); 
            });
    }

    /**
     * @summary Reset invalid logins
     */
    $scope.resetInvalidLogins = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.devices.invalidLogin.reset")))
            return;

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
        SanteDB.resources.securityDevice.patchAsync($stateParams.id, $scope.target.securityDevice.etag, patch)
            .then(function(r) {
                SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
                $scope.target.securityDevice.invalidAuth = 0;
                $scope.$apply();
            })
            .catch(function(e) {
                $rootScope.errorHandler(e);
                SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
            })
    }

     /**
     * @summary Unlock user
     */
    $scope.unlock = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.devices.confirmUnlock")))
            return;

        SanteDB.display.buttonWait("#unlockButton", true);
        SanteDB.resources.securityDevice.unLockAsync($stateParams.id)
            .then(function(r) {
                SanteDB.display.buttonWait("#unlockButton", false);
                $scope.target.securityDevice.lockout = null;
                $scope.$apply();
            })
            .catch(function(e) {
                $rootScope.errorHandler(e);
                SanteDB.display.buttonWait("#unlockButton", false);
            })
    }

  
    /**
     * @summary Save the specified user 
     */
    $scope.saveDevice = async function(deviceForm, device) {
        
        if(!deviceForm.$valid) return;

        try {
            // Correct arrays and assign id
            if(!device.entity.id) {
                device.entity.id = SanteDB.application.newGuid();
            }
    
            if(device.entity.relationship && device.entity.relationship.DedicatedServiceDeliveryLocation)
                    device.entity.relationship.DedicatedServiceDeliveryLocation = {
                        source: device.entity.id,
                        target: device.entity.relationship.DedicatedServiceDeliveryLocation.target
                    } ;

            // Show wait state
            SanteDB.display.buttonWait("#saveDeviceButton", true);

             // user is already registered we are updating them 
            if(device.securityDevice.id)
            {
                // Register the user first
                let res = await SanteDB.resources.securityDevice.updateAsync(device.securityDevice.id, {
                    $type: "SecurityDeviceInfo",
                    role: device.role,
                    entity: device.securityDevice
                })
                device.entity.securityDevice = res.entity.id;
                let r = await SanteDB.resources.deviceEntity.insertAsync(device.entity)
                device.entity = r;
            }
            else {
                device.securityDevice.deviceSecret = SanteDB.application.generatePassword();
                // Register the user first
                let res = await SanteDB.resources.securityDevice.insertAsync({
                    $type: "SecurityDeviceInfo",
                    role: device.role,
                    entity: device.securityDevice
                })
                let scrt = device.securityDevice.deviceSecret;
                device.entity.securityDevice = res.entity.id;
                device.securityDevice = res.entity;
                device.policy = u.policy || [];
                device.securityDevice.etag = res.etag;
                device.securityDevice.deviceSecret = scrt;
                let r = await SanteDB.resources.deviceEntity.insertAsync(device.entity)
                device.entity = r;
            }
        }
        catch (e) {
            SanteDB.display.buttonWait("#saveDeviceButton", false);
            $rootScope.errorHandler(e);
        }
        finally {
            toastr.success(SanteDB.locale.getString("ui.model.securityDevice.saveSuccess"));
            SanteDB.display.buttonWait("#saveDeviceButton", false);
            $state.transitionTo("santedb-admin.security.devices.index");
        }
    }
}]);