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
angular.module('santedb').controller('EditGroupController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$compile", '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $compile, $timeout) {

    $scope.EntityClassKeys = EntityClassKeys;

    var membersTable = null;

    // Get the specified user
    if ($stateParams.id) {
        $scope.isLoading = true;
        SanteDB.resources.securityRole.getAsync($stateParams.id)
            .then(function (u) {
                $scope.isLoading = false;
                $scope.target = $scope.target || {};
                $scope.target.policy = u.policy;
                $scope.target.securityRole = u.entity;
                $scope.target.securityRole.etag = u.etag;
                $scope.target.id = u.id;
                document.title = document.title + " - " + u.entity.name;

                $scope.$apply();
            })
            .catch($rootScope.errorHandler);

    }
    else  // Invalid
    {
        console.error("Should not be here!");
    }
    
    
}]);