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
angular.module('santedb').controller('IdentityDomainEditController', ["$scope", "$rootScope", "$stateParams", "$state", "$timeout", function ($scope, $rootScope, $stateParams, $state, $timeout) {

    async function initializeView()
    {
        try {
            var checkDigits = await SanteDB.resources.identityDomain.getAsync("_checkDigit");
            var validators = await SanteDB.resources.identityDomain.getAsync("_validator");
            $timeout(() => {
                $scope.checkDigitAlgorithms = checkDigits.resource;
                $scope.customValidators = validators.resource;
            });
        }
        catch(e) {
            console.warn(e);
        }
    }

    // Load the authority
    async function loadDomain(id) {
        try {
            var domain = await SanteDB.resources.identityDomain.getAsync(id, "full");
            document.title = document.title + " - " + domain.name;

            $timeout(() => { 
                $scope.domain = domain;
                if(!domain.assigningAuthority) {
                    domain.assigningAuthority = [];
                }
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Load or create?
    if ($stateParams.id)
        loadDomain($stateParams.id);
    else
        $scope.domain = new IdentityDomain();

    initializeView();

    // Validate the form data
    async function validateForm() {
        try {
            if ($scope.domain.oid) {
                if ((await SanteDB.resources.identityDomain.findAsync({ oid: $scope.domain.oid, id: `!${$scope.domain.id || EmptyGuid}`, _count: 0 })).size > 0)
                    $scope.targetForm.oid.$setValidity('duplicate', false);
                else
                    $scope.targetForm.oid.$setValidity('duplicate', true);
            }

            if ($scope.domain.domainName) {
                if ((await SanteDB.resources.identityDomain.findAsync({ domainName: $scope.domain.domainName, id: `!${$scope.domain.id || EmptyGuid}`, _count: 0 })).size > 0)
                    $scope.targetForm.domainName.$setValidity('duplicate', false);
                else
                    $scope.targetForm.domainName.$setValidity('duplicate', true);
            }

            if ($scope.domain.url) {
                if ((await SanteDB.resources.identityDomain.findAsync({ url: $scope.domain.url, id: `!${$scope.domain.id || EmptyGuid}`, _count: 0 })).size > 0)
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

    $scope.reactivateDomain  = async function() {
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
            await SanteDB.resources.identityDomain.patchAsync($stateParams.id, $scope.domain.etag, patch);
            $timeout(() => {
                $scope.domain.obsoletionTime = null;
                $scope.domain.obsoletedBy = null;
    
            })
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

            if(!$scope.domain.id) {
                var domain = await SanteDB.resources.identityDomain.insertAsync($scope.domain);
                toastr.success(SanteDB.locale.getString("ui.admin.domain.saveSuccess"));
                $state.go('santedb-admin.data.domain.edit', {id: domain.id});
            }
            else {
                var domain = await SanteDB.resources.identityDomain.updateAsync($stateParams.id, $scope.domain);
                toastr.success(SanteDB.locale.getString("ui.admin.domain.saveSuccess"));
                $state.go('santedb-admin.data.domain.index', {id: domain.id});

            }
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveAuthorityButton", false);
        }
    }

    $scope.$watch("domain.validation", function(n, o) {
        if(n) {
            $scope.domain._exampleId = new RandExp(new RegExp($scope.domain.validation)).gen();
        }
    })
}]);