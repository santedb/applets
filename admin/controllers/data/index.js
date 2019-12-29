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
angular.module('santedb').controller('ReferenceDataIndexController', ["$scope", "$rootScope", function ($scope, $rootScope) {

    $scope.dashboard = {};

    // Get stats
    async function getStats() {
        try {
            $scope.dashboard.domains = (await SanteDB.resources.assigningAuthority.findAsync({_count:0})).size;
            $scope.dashboard.places = (await SanteDB.resources.place.findAsync({ classConcept: "!" + EntityClassKeys.ServiceDeliveryLocation, statusConcept: StatusKeys.Active,  _count:0})).totalResults;
            $scope.dashboard.facilities = (await SanteDB.resources.place.findAsync({ classConcept: EntityClassKeys.ServiceDeliveryLocation, statusConcept: StatusKeys.Active, _count:0})).totalResults;
            $scope.dashboard.materials = (await SanteDB.resources.material.findAsync({_count:0})).totalResults;
        }
        catch(e){ 
            $rootScope.errorHandler(e);
        }
    }
    getStats().then(()=>$scope.$apply());
}]);