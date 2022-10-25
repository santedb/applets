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

    const isFacility = $state.current.name.indexOf("facili") > -1;
    $scope.isFacility = isFacility;

    async function loadPlace(id) {
        try {
            let place = await SanteDB.resources.place.getAsync(id, "full");

            if (typeof place.isMobile === 'undefined') {
                place.isMobile = false;
            }

            if (typeof place.relationship === 'undefined') {
                //Put in a default relationship selection.
                place.relationship = {
                    Parent: [
                        {

                        }
                    ],
                    DedicatedServiceDeliveryLocation: [
                        {

                        }
                    ]
                };
            }

            for (let idx = 0; idx < place.relationship.DedicatedServiceDeliveryLocation.length; idx++) {
                let dsdl = place.relationship.DedicatedServiceDeliveryLocation[idx];

                if (dsdl && typeof dsdl.target === 'string') {
                    dsdl.targetModel = await SanteDB.resources.place.getAsync(dsdl.target, 'min');
                }
            }

            console.log("Place loaded");
            console.log(place);

            return place;
        }
        catch (e) {
            $rootScope.errorHandler(e);

            return null;
        }
    }

    if ($stateParams.id) {
        loadPlace($stateParams.id).then((place) => {
            $timeout(() => { $scope.target = { place, parentScope: $scope, newFacility: '' }; });
        });
    }
    else {
        // Create a templated place
        $scope.target = {
            place: new Place({
                classConcept: isFacility ? EntityClassKeys.ServiceDeliveryLocation : EntityClassKeys.Place,
                classConceptModel: { id: isFacility ? EntityClassKeys.ServiceDeliveryLocation : EntityClassKeys.Place },
                statusConcept: StatusKeys.Active,
                isMobile: false,
                name: {
                    $other: [{
                        component: {
                        },
                        use: NameUseKeys.OfficialRecord
                    }]
                }
            }),
            parentScope: $scope,
            newFacility: ''
        };
    }

    $scope.savePlace = async function (form) {

        try {
            SanteDB.display.buttonWait("#savePlaceButton", true);
            //if (!await validateForm() || !form.$valid)
            //return;

            console.log("Place for save");
            console.log($scope.target.place);

            if (!$scope.target.place.id) {
                $scope.target.place = await SanteDB.resources.place.insertAsync($scope.target.place);
                toastr.success(SanteDB.locale.getString("ui.model.place.saveSuccess"));
                $state.transitionTo(isFacility ? 'santedb-admin.data.facility.edit' : 'santedb-admin.data.place.edit', { id: $scope.target.place.id });
            }
            else {
                $scope.target.place = await SanteDB.resources.place.updateAsync($stateParams.id, $scope.target.place);
                toastr.success(SanteDB.locale.getString("ui.admin.place.saveSuccess"));
                $state.transitionTo(isFacility ? 'santedb-admin.data.facility.index' : 'santedb-admin.data.place.index', { id: $scope.target.place.id });

            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#savePlaceButton", false);
            try { $scope.$apply(); }
            catch (e) { }
        }
    }

    $scope.addNewFacility = async function () {

        try {
            SanteDB.display.buttonWait("#addFacilityButton", true);

            $scope.target.place.relationship.DedicatedServiceDeliveryLocation = $scope.target.place.relationship.DedicatedServiceDeliveryLocation || [];

            $scope.target.place.relationship.DedicatedServiceDeliveryLocation.push({ target: $scope.target.newFacility });

            $scope.target.place = await SanteDB.resources.place.updateAsync($scope.target.place.id, $scope.target.place);

            for (let idx = 0; idx < $scope.target.place.relationship.DedicatedServiceDeliveryLocation.length; idx++) {
                let dsdl = $scope.target.place.relationship.DedicatedServiceDeliveryLocation[idx];

                if (dsdl && typeof dsdl.target === 'string' && typeof dsdl.targetModel === 'undefined') {
                    dsdl.targetModel = await SanteDB.resources.place.getAsync(dsdl.target, 'min');
                }
            }

            toastr.success(SanteDB.locale.getString("ui.model.place.saveSuccess"));

            $scope.target.newFacility = '';
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#addFacilityButton", false);
        }

        return true;
    }

    $scope.removeFacility = async function (facilityId) {

        try {

            let idx = $scope.target.place.relationship.DedicatedServiceDeliveryLocation.findIndex(elem => elem.target === facilityId);

            if (idx > -1) {
                $scope.target.place.relationship.DedicatedServiceDeliveryLocation.splice(idx, 1);

                $scope.target.place = await SanteDB.resources.place.updateAsync($scope.target.place.id, $scope.target.place);

                for (let idx = 0; idx < $scope.target.place.relationship.DedicatedServiceDeliveryLocation.length; idx++) {
                    let dsdl = $scope.target.place.relationship.DedicatedServiceDeliveryLocation[idx];

                    if (dsdl && typeof dsdl.target === 'string' && typeof dsdl.targetModel === 'undefined') {
                        dsdl.targetModel = await SanteDB.resources.place.getAsync(dsdl.target, 'min');
                    }
                }

                toastr.success(SanteDB.locale.getString("ui.model.place.saveSuccess"));
            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {

        }

        return true;
    }


}]);