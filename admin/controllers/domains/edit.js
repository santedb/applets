/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
angular.module('santedb').controller('IdentityDomainEditController', ["$scope", "$rootScope", "$stateParams", "$state", function ($scope, $rootScope, $stateParams, $state) {


    // Load the authority
    async function loadAuthority(id) {
        try {
            $scope.authority = await SanteDB.resources.assigningAuthority.getAsync(id, "full");
            $scope.$apply();
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Load or create?
    if ($stateParams.id)
        loadAuthority($stateParams);
    else
        $scope.authority = new AssigningAuthority();

    // Validate the form data
    async function validateForm() {
        try {
            if ($scope.authority.oid) {
                if ((await SanteDB.resources.assigningAuthority.findAsync({ oid: $scope.authority.oid, id: `!${$scope.authority.id || EmptyGuid}`, _count: 0 })).size > 0)
                    $scope.targetForm.oid.$setValidity('duplicate', false);
                else
                    $scope.targetForm.oid.$setValidity('duplicate', true);
            }

            if ($scope.authority.domainName) {
                if ((await SanteDB.resources.assigningAuthority.findAsync({ domainName: $scope.authority.domainName, id: `!${$scope.authority.id || EmptyGuid}`, _count: 0 })).size > 0)
                    $scope.targetForm.domainName.$setValidity('duplicate', false);
                else
                    $scope.targetForm.domainName.$setValidity('duplicate', true);
            }

            if ($scope.authority.url) {
                if ((await SanteDB.resources.assigningAuthority.findAsync({ url: $scope.authority.url, id: `!${$scope.authority.id || EmptyGuid}`, _count: 0 })).size > 0)
                    $scope.targetForm.url.$setValidity('duplicate', false);
                else
                    $scope.targetForm.url.$setValidity('duplicate', true);
            }
            $scope.$apply();
            return true;
        }
        catch (e) {
            $rootScope.errorHandler(e);;
            return false;
        }
    }

    $scope.reactivateAuthority = async function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.domain.reactivate.confirm")))
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
        try {
            SanteDB.display.buttonWait("#reactivateAuthorityButton", true);
            await SanteDB.resources.assigningAuthority.patchAsync($stateParams.id, $scope.authority.etag, patch);
            $scope.authority.obsoletionTime = null;
            $scope.authority.obsoletedBy = null;
            $scope.$apply();
        }
        catch(e) {
            $rootScope.errorHandler(e); 
        }
        finally {
            SanteDB.display.buttonWait("#reactivateAuthorityButton", false);
        }
    }

    // Save the domain
    $scope.saveDomain = async function (form) {

        try {
            SanteDB.display.buttonWait("#saveAuthorityButton", true);
            if (!await validateForm() || !form.$valid)
                return;

            if(!$scope.authority.id) {
                $scope.authority = await SanteDB.resources.assigningAuthority.insertAsync($scope.authority);
                $state.transitionTo('santedb-admin.data.domain.edit', {id: $scope.authority.id});
            }
            else {
                $scope.authority = await SanteDB.resources.assigningAuthority.updateAsync($stateParams.id, $scope.assigningAuthority);
                $scope.$apply();
            }
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveAuthorityButton", false);
            try { $scope.$apply(); }
            catch (e) {}
        }
    }

}]);