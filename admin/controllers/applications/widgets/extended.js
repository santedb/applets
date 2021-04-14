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
angular.module('santedb').controller('EditApplicationExtendedController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

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
            $scope.scopedObject.entity = r;

            toastr.success(SanteDB.locale.getString("ui.model.securityApplication.saveSuccess"));
            try {
                $scope.$apply();
            }
            catch(e) {}
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