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
angular.module('santedb').controller('FacilityEditController', ["$scope", "$rootScope", "$stateParams", "$state", "$timeout", function ($scope, $rootScope, $stateParams, $state, $timeout) {

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
            classConcept: EntityClassKeys.ServiceDeliveryLocation,
            statusConcept: StatusKeys.Active,
            isMobile: false,
            relationship: {
                Parent: []
            },
            name: {
                $other: [{
                    component: {
                    },
                    use: NameUseKeys.OfficialRecord
                }]
            }
        });
    }

    $scope.savePlace = async function (form) {

        if (!form.$valid) return;

        try {
            SanteDB.display.buttonWait("#savePlaceButton", true);

            var place = {};
            if (!placeToSave.id) {
                place = await SanteDB.resources.place.insertAsync($scope.target);
                toastr.success(SanteDB.locale.getString("ui.model.facility.saveSuccess"));
            }
            else {
                place = await SanteDB.resources.place.updateAsync($stateParams.id, $scope.target);
                toastr.success(SanteDB.locale.getString("ui.admin.facility.saveSuccess"));
            }

            $state.go('santedb-admin.data.facility.edit', { id: place.id });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#savePlaceButton", false);
        }
    }

}]);