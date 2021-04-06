/// <reference path="../../../core/js/santedb.js"/>
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
angular.module('santedb').controller('ViewAuditController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$compile", '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $compile, $timeout) {

    if ($stateParams.id) {
        SanteDB.resources.audit.getAsync($stateParams.id)
            .then ( r=> {
                console.log(r);
                $scope.isLoading = false;
                $scope.target = $scope.target || {};
                $scope.target.audit = r;

                if ($scope.target.audit.meta) {
                    $scope.target.audit.metaDisplay = {};
                    $scope.target.audit.meta.forEach((o) => $scope.target.audit.metaDisplay[o.key] = o.value);
                }
                if ($scope.target.audit.actor) {
                    $scope.target.audit.actorDisplay = {
                        "source": $scope.target.audit.actor.find((o) => o.role.find((r) => r.code == "110153")),
                        "destination": $scope.target.audit.actor.find((o) => o.role.find((r) => r.code == "110152")),
                    }
                }
                $scope.$apply();
            })
            .catch($rootScope.errorHandler);
    }
}]);