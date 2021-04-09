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
    $scope.saveApplication = async function(deviceForm, application) {
        if(!deviceForm.$valid) return;

        // Correct arrays and assign id
        if(!application.entity.id) {
            application.entity.id = SanteDB.application.newGuid();
        }

        // Show wait state
        SanteDB.display.buttonWait("#saveApplicationButton", true);

        try {
            if(application.securityApplication.id) {
                let u = await  SanteDB.resources.securityApplication.updateAsync(application.securityApplication.id, {
                    $type: "SecurityApplicationInfo",
                    role: application.role,
                    entity: application.securityApplication
                })
                application.entity.securityApplication = u.entity.id;
                let r = await SanteDB.resources.applicationEntity.insertAsync(application.entity);
                application.entity = r;
            }
            else {
                application.securityApplication.applicationSecret = SanteDB.application.generatePassword();

                let u = await SanteDB.resources.securityApplication.insertAsync({
                    $type: "SecurityApplicationInfo",
                    role: application.role,
                    entity: application.securityApplication
                })

                var scrt = application.target.securityApplication.applicationSecret;
                $scope.target.entity.securityApplication = u.entity.id;
                $scope.target.securityApplication = u.entity;
                $scope.target.policy = u.policy || [];
                $scope.target.securityApplication.etag = u.etag;
                $scope.target.securityApplication.applicationSecret = scrt;
                let r = await SanteDB.resources.applicationEntity.insertAsync($scope.target.entity)
                $scope.target.entity = r;
            }
            toastr.success(SanteDB.locale.getString("ui.model.securityApplication.saveSuccess"));
        }
        catch (e) {
            SanteDB.display.buttonWait("#saveApplicationButton", false);
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveApplicationButton", false);
            $state.transitionTo("santedb-admin.security.applications.index");          
        }
    }
}]);