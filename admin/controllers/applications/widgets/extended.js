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
angular.module('santedb').controller('EditApplicationExtendedController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $templateCache, $stateParams, $timeout) {

    $scope.EntityClassKeys = EntityClassKeys;


    /**
     * @summary Save the specified application 
     */
    $scope.saveApplication = async function (deviceForm) {

        if (!deviceForm.$valid) return;

        // Correct arrays and assign id
        if (!$scope.scopedObject.entity.id) {
            $scope.scopedObject.entity.id = SanteDB.application.newGuid();
        }

        // Show wait state
        SanteDB.display.buttonWait("#saveApplicationButton", true);

        try {
            let u = await SanteDB.resources.securityApplication.updateAsync($scope.scopedObject.securityApplication.id, {
                $type: "SecurityApplicationInfo",
                role: $scope.scopedObject.role,
                entity: $scope.scopedObject.securityApplication
            })
            $scope.scopedObject.entity.securityApplication = u.entity.id;
            let r = await SanteDB.resources.applicationEntity.insertAsync($scope.scopedObject.entity);

            toastr.success(SanteDB.locale.getString("ui.model.securityApplication.saveSuccess"));
            $timeout(() => {
                $scope.scopedObject.entity = r;
            });
        }
        catch (e) {
            SanteDB.display.buttonWait("#saveApplicationButton", false);
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveApplicationButton", false);
        }
    }
}]);