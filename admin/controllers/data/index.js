/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
angular.module('santedb').controller('ReferenceDataIndexController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {


    // Get stats
    async function getStats() {
        try {

            var domains = (await SanteDB.resources.identityDomain.findAsync({_count:0})).size;
            var places = (await SanteDB.resources.place.findAsync({ classConcept: "!" + EntityClassKeys.ServiceDeliveryLocation, statusConcept: StatusKeys.Active,  _count:0})).totalResults;
            var facilities = (await SanteDB.resources.place.findAsync({ classConcept: EntityClassKeys.ServiceDeliveryLocation, statusConcept: StatusKeys.Active, _count:0})).totalResults;
            var materials = (await SanteDB.resources.material.findAsync({classConcept: EntityClassKeys.Material, _count:0})).totalResults;
            var organizations = (await SanteDB.resources.organization.findAsync({_count:0})).totalResults;

            $timeout(() => {
                $scope.dashboard = {};
                $scope.dashboard.domains = domains;
                $scope.dashboard.places = places;
                $scope.dashboard.facilities = facilities;
                $scope.dashboard.materials = materials;
                $scope.dashboard.organizations = organizations;
            })
        }
        catch(e){ 
            $rootScope.errorHandler(e);
        }
    }
    getStats().then(()=>$scope.$apply());
}]);