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
angular.module('santedb').controller('CreateDeviceController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    $scope.EntityClassKeys = EntityClassKeys;

    
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
    
    /**
     * @summary Save the specified user 
     */
    $scope.saveDevice = async function (deviceForm) {

        if (!deviceForm.$valid) return;

        try {
            // Correct arrays and assign id
            $scope.target.entity.id = SanteDB.application.newGuid();

            if ($scope.target.entity.relationship && $scope.target.entity.relationship.DedicatedServiceDeliveryLocation)
                $scope.target.entity.relationship.DedicatedServiceDeliveryLocation = {
                    source: $scope.target.entity.id,
                    target: $scope.target.entity.relationship.DedicatedServiceDeliveryLocation.target
                };

            // Show wait state
            SanteDB.display.buttonWait("#saveDeviceButton", true);

            
                $scope.target.securityDevice.deviceSecret = SanteDB.application.generatePassword();
                // Register the user first
                let res = await SanteDB.resources.securityDevice.insertAsync({
                    $type: "SecurityDeviceInfo",
                    role: $scope.target.role,
                    entity: $scope.target.securityDevice
                })
                let scrt = $scope.target.securityDevice.deviceSecret;
                $scope.target.entity.securityDevice = res.entity.id;
                $scope.target.securityDevice = res.entity;
                $scope.target.securityDevice.etag = res.etag;
                $scope.target.securityDevice.deviceSecret = scrt;
                let r = await SanteDB.resources.deviceEntity.insertAsync($scope.target.entity)
                $scope.target.entity = r;
            toastr.success(SanteDB.locale.getString("ui.model.securityDevice.saveSuccess"));
            $state.go("santedb-admin.security.devices.edit", { id: res.id });

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveDeviceButton", false);
        }
    }
}]);