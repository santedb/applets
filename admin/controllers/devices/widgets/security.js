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
 * 
 * User: Justin Fyfe
 * Date: 2019-9-20
 */
angular.module('santedb').controller('EditDeviceSecurityController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    /**
     * @summary Reactivate Inactive device
     */
    $scope.reactivateDevice = async function () {
        if (!confirm(SanteDB.locale.getString("ui.admin.devices.reactivate.confirm")))
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

        try {
            // Send the patch
            SanteDB.display.buttonWait("#reactivateDeviceButton", true);
            await SanteDB.resources.securityDevice.patchAsync($stateParams.id, $scope.scopedObject.securityDevice.etag, patch);
            $scope.$apply((s) => {
                s.scopedObject.securityDevice.obsoletionTime = null;
                s.scopedObject.securityDevice.obsoletedBy = null;
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#reactivateDeviceButton", false);
        }
    }

    /**
     * @summary Reset secret
     */
    $scope.resetSecret = async function () {
        if ($scope.scopedObject.securityDevice.id && !confirm(SanteDB.locale.getString("ui.admin.devices.secret.reset")))
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

        try {
            SanteDB.display.buttonWait("#resetSecretButton", true);
            await SanteDB.resources.securityDevice.patchAsync($stateParams.id, $scope.scopedObject.securityDevice.etag, patch);
            $scope.$apply((s) => s.scopedObject.securityDevice.deviceSecret = repl);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#resetSecretButton", false);
        }
    }

    /**
     * @summary Reset invalid logins
     */
    $scope.resetInvalidLogins = async function () {
        if (!confirm(SanteDB.locale.getString("ui.admin.devices.invalidLogin.reset")))
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

        try {
            SanteDB.display.buttonWait("#resetInvalidLoginButton", true);
            await SanteDB.resources.securityDevice.patchAsync($stateParams.id, $scope.scopedObject.securityDevice.etag, patch);
            $scope.$apply((s) => s.scopedObject.securityDevice.invalidAuth = 0);
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
    $scope.unlock = async function () {
        if (!confirm(SanteDB.locale.getString("ui.admin.devices.confirmUnlock")))
            return;

        try {
            SanteDB.display.buttonWait("#unlockButton", true);
            await SanteDB.resources.securityDevice.unLockAsync($stateParams.id);
            $scope.$apply((s) => s.scopedObject.securityDevice.lockout = null);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#unlockButton", false);
        }
    }


    /**
     * @summary Save the specified user 
     */
    $scope.saveDevice = async function (deviceForm, device) {

        if (!deviceForm.$valid) return;

        try {
            // Correct arrays and assign id
            if (!device.entity.id) {
                device.entity.id = SanteDB.application.newGuid();
            }

            if (device.entity.relationship && device.entity.relationship.DedicatedServiceDeliveryLocation)
                device.entity.relationship.DedicatedServiceDeliveryLocation = {
                    source: device.entity.id,
                    target: device.entity.relationship.DedicatedServiceDeliveryLocation.target
                };

            // Show wait state
            SanteDB.display.buttonWait("#saveDeviceButton", true);

            // user is already registered we are updating them 
            if (device.securityDevice.id) {
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
            toastr.success(SanteDB.locale.getString("ui.model.securityDevice.saveSuccess"));
        }
        catch (e) {
            SanteDB.display.buttonWait("#saveDeviceButton", false);
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveDeviceButton", false);
            $state.transitionTo("santedb-admin.security.devices.index");
        }
    }
}]);