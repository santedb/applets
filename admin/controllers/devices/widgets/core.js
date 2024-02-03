/// <reference path="../../../../core/js/santedb.js"/>
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
angular.module('santedb').controller('EditDeviceCoreController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

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
     * @summary Save the specified user 
     */
    $scope.saveDevice = async function (deviceForm, device) {

        if (!deviceForm.$valid) return;

        try {
            // Correct arrays and assign id
            if (device.entity.relationship && device.entity.relationship.DedicatedServiceDeliveryLocation)
                device.entity.relationship.DedicatedServiceDeliveryLocation = {
                    source: device.entity.id,
                    target: device.entity.relationship.DedicatedServiceDeliveryLocation.target
                };

            // Show wait state
            SanteDB.display.buttonWait("#saveDeviceButton", true);

            // Register the user first
            let res = await SanteDB.resources.securityDevice.updateAsync(device.securityDevice.id, {
                $type: "SecurityDeviceInfo",
                role: device.role,
                entity: device.securityDevice
            })
            device.entity.securityDevice = res.entity.id;
            let r = await SanteDB.resources.deviceEntity.insertAsync(device.entity)
            device.entity = r;
            toastr.success(SanteDB.locale.getString("ui.model.securityDevice.saveSuccess"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveDeviceButton", false);
        }
    }
}]);