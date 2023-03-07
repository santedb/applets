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
angular.module('santedb').controller('PlaceEditController', ["$scope", "$rootScope", "$stateParams", "$state", "$timeout", function ($scope, $rootScope, $stateParams, $state, $timeout) {

    // Initialize the view
    async function initialize(id) {
        try {
            var place = await SanteDB.resources.place.getAsync(id, "full");

            if (typeof place.isMobile === undefined) {
                place.isMobile = false;
            }

            if (typeof place.relationship === undefined) {
                place.relationship = {
                    Parent: [
                        {

                        }
                    ]
                };
            }
            return place;
        }
        catch (e) {
            $rootScope.errorHandler(e);
            return null;
        }
    }

    if ($stateParams.id) {
        initialize($stateParams.id).then((place) => {
            $timeout(() => { $scope.target = place; });
        });
    }
    else {
        // Create a templated place
        $scope.target = new Place({
            classConcept: EntityClassKeys.Place,
            statusConcept: StatusKeys.Active,
            isMobile: false,
            relationship: {
                Parent: []
            },
            name: {
                OfficialRecord: [{
                    component: {
                        $other: []
                    },
                    use: NameUseKeys.OfficialRecord
                }]
            }
        });
    }

    // Initialize the query controls
    $scope.parentQuery = {
        classConcept: `!${EntityClassKeys.ServiceDeliveryLocation}`,
        statusConcept: StatusKeys.Active
    };

    $scope.savePlace = async function (form) {

        if (!form.$valid) return;

        try {
            SanteDB.display.buttonWait("#savePlaceButton", true);

            var place = $scope.target;

            // Correct the address information based on the type and parent
            if (!place.address &&
                place.relationship && place.relationship.Parent &&
                place.relationship.Parent[0] &&
                place.relationship.Parent[0].target) {


                // Fetch the parent
                var parent = await SanteDB.resources.place.getAsync(place.relationship.Parent[0].target);
                var address = parent.address.Direct ||
                    parent.address.PhysicalVisit; // Grab the direct address of the parent
                
                switch (place.classConcept) {

                    case EntityClassKeys.Country:
                        address[0].component.Country = [ place.name.OfficialRecord[0].component.$other[0] ];
                        break;
                    case EntityClassKeys.State:
                        address[0].component.State = [ place.name.OfficialRecord[0].component.$other[0] ];
                        break;
                    case EntityClassKeys.CountyOrParish:
                        address[0].component.County = [ place.name.OfficialRecord[0].component.$other[0] ];
                        break;
                    case EntityClassKeys.CityOrTown:
                        address[0].component.City = [ place.name.OfficialRecord[0].component.$other[0] ];
                        break;
                    case EntityClassKeys.PrecinctOrBorough:
                        address[0].component.Precinct = [ place.name.OfficialRecord[0].component.$other[0] ];
                        break;
                }
                place.address = { Direct : address };
            }

            if (!$stateParams.id) {
                place = await SanteDB.resources.place.insertAsync(place);
                toastr.success(SanteDB.locale.getString("ui.model.place.saveSuccess"));
            }
            else {
                place = await SanteDB.resources.place.updateAsync($stateParams.id, place);
                toastr.success(SanteDB.locale.getString("ui.admin.place.saveSuccess"));
            }

            $state.go('santedb-admin.data.place.edit', { id: place.id });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#savePlaceButton", false);
        }
    }

    $scope.$watch("target.classConcept", function (n, o) {

        if (n) {
            switch (n) {
                case EntityClassKeys.ServiceDeliveryLocation:
                    $scope.parentQuery.classConcept == EntityClassKeys.ServiceDeliveryLocation;
                    break;
                case EntityClassKeys.Place:
                    $scope.parentQuery.classConcept == '!ff34dfa7-c6d3-4f8b-bc9f-14bcdc13ba6c';
                    break;
                case EntityClassKeys.Country:
                    $scope.parentQuery.classConcept == EmptyGuid;
                    break;
                case EntityClassKeys.State:
                    $scope.parentQuery.classConcept = EntityClassKeys.Country;
                    break;
                case EntityClassKeys.CountyOrParish:
                    $scope.parentQuery.classConcept = EntityClassKeys.State;
                    break;
                case EntityClassKeys.CityOrTown:
                    $scope.parentQuery.classConcept = [EntityClassKeys.CountyOrParish, EntityClassKeys.State];
                    break;
                case EntityClassKeys.PrecinctOrBorough:
                    $scope.parentQuery.classConcept = EntityClassKeys.CityOrTown;
                    break;
            }


        }
    });
}]);