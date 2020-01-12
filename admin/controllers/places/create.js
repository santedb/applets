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
angular.module('santedb').controller('PlaceCreateController', ["$scope", "$rootScope", "$state", function ($scope, $rootScope, $state) {

    // Create a templated place
    $scope.target = new Place({
        classConcept: $state.current.name.indexOf("facili") > -1 ? EntityClassKeys.ServiceDeliveryLocation : EntityClassKeys.Place,
        classConceptModel : { id: $state.current.name.indexOf("facili") > -1 ? EntityClassKeys.ServiceDeliveryLocation : EntityClassKeys.Place },
        statusConcept: StatusKeys.Active,
        name: {
            other: [ {
                component: {
                    other : {
                        value: ""
                    }
                },
                useModel: { id: NameUseKeys.OfficialRecord }
            } ]
        }
    });
}]);