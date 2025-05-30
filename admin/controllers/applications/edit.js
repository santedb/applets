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
angular.module('santedb').controller('EditApplicationController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    $scope.EntityClassKeys = EntityClassKeys;

    // Get the specified application
    $scope.isLoading = true;
    SanteDB.resources.securityApplication.getAsync($stateParams.id)
        .then(function (u) {
            $scope.isLoading = !$scope.target;
            $scope.target = $scope.target || {};
            $scope.target.policy = u.policy;
            $scope.target.securityApplication = u.entity;
            $scope.target.securityApplication.etag = u.etag;
            $scope.target.id = u.id;
            document.title = document.title + " - " + u.entity.name;

            $scope.$apply();
        })
        .catch($rootScope.errorHandler);

    // Get the related user entity at the same time
    SanteDB.resources.applicationEntity.findAsync({ securityApplication: $stateParams.id })
        .then(function (u) {
            $scope.isLoading = !$scope.target;
            $scope.target = $scope.target || {};

            if (u.resource && u.resource.length > 0) {
                $scope.target.entity = u.resource[0];
            }
            else
                $scope.target.entity = new ApplicationEntity();

            $scope.$apply();
        })
        .catch($rootScope.errorHandler);

}]);