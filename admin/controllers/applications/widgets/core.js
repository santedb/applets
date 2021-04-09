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
angular.module('santedb').controller('CoreApplicationController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {
   
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
  
}]);