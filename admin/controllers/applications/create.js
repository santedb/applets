/// <reference path="../../../core/js/santedb.js"/>
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
angular.module('santedb').controller('CreateApplicationController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    $scope.EntityClassKeys = EntityClassKeys;

    $scope.target = {
        securityApplication: new SecurityApplication(),
        entity: new ApplicationEntity(),
        roles: []
    };

    /**
     * @summary Watch for changes to the username if we're creating and warn of duplicates
     */
    $scope.$watch("target.securityApplication.name", function (n, o) {
        if (n != o && n && n.length >= 3) {
            SanteDB.display.buttonWait("#applicationNameCopyButton button", true, true);
            SanteDB.resources.securityApplication.findAsync({ name: n, _count: 0 })
                .then(function (r) {
                    SanteDB.display.buttonWait("#applicationNameCopyButton button", false, true);
                    if (r.size > 0) // Alert error for duplicate
                        $scope.createForm.applicationname.$setValidity('duplicate', false);
                    else
                        $scope.createForm.applicationname.$setValidity('duplicate', true);

                    try { $scope.$apply(); }
                    catch (e) { }
                })
                .catch(function () {
                    SanteDB.display.buttonWait("#applicationNameCopyButton button", false, true);
                });
        }
    });

    /**
     * @summary Save the specified application 
     */
    $scope.saveApplication = async function (deviceForm) {

        if (!deviceForm.$valid) return;

        // Correct arrays and assign id
        if (!$scope.target.entity.id) {
            $scope.target.entity.id = SanteDB.application.newGuid();
        }

        // Show wait state
        SanteDB.display.buttonWait("#saveApplicationButton", true);

        try {

            $scope.target.securityApplication.applicationSecret = SanteDB.application.generatePassword();

            let u = await SanteDB.resources.securityApplication.insertAsync({
                $type: "SecurityApplicationInfo",
                role: $scope.target.role,
                entity: $scope.target.securityApplication
            })

            var scrt = $scope.target.securityApplication.applicationSecret;
            $scope.target.entity.securityApplication = u.entity.id;
            $scope.target.securityApplication = u.entity;
            $scope.target.policy = u.policy || [];
            $scope.target.securityApplication.etag = u.etag;
            $scope.target.securityApplication.applicationSecret = scrt;
            let r = await SanteDB.resources.applicationEntity.insertAsync($scope.target.entity);
            $scope.target.entity = r;
            toastr.success(SanteDB.locale.getString("ui.model.securityApplication.saveSuccess"));
            $state.go("santedb-admin.security.applications.edit", { "id": u.entity.id })


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