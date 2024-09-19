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
 */
angular.module('santedb').controller('EditApplicationCoreController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $templateCache, $stateParams, $timeout) {

    /**
     * @summary Reactivate Inactive device
     */
    $scope.reactivateApplication = async function (application) {
        if (!confirm(SanteDB.locale.getString("ui.admin.applications.reactivate.confirm")))
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
            await SanteDB.resources.securityApplication.patchAsync($stateParams.id, application.securityApplication.etag, patch)
            $timeout(() => {
                application.securityApplication.obsoletionTime = null;
                application.securityApplication.obsoletedBy = null;
            });
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