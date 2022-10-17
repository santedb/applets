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

    async function loadPlace(id){
        try{
            let place = await SanteDB.resources.place.getAsync(id, "full");

            if(typeof place.isMobile === 'undefined'){
                place.isMobile = false;
            }

            if (typeof place.relationship === 'undefined'){
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

            console.log("Place loaded");
            console.log(place);

            return place;
        }
        catch(e){
            $rootScope.errorHandler(e);

            return null;
        }
    }

    if ($stateParams.id){
        loadPlace($stateParams.id).then((place)=> {
                $timeout(()=>{$scope.target = { place };});
        });
    }
    else{
        // Create a templated place
        $scope.target = { 
            place : new Place({
                classConcept: isFacility ? EntityClassKeys.ServiceDeliveryLocation : EntityClassKeys.Place,
                classConceptModel : { id: isFacility ? EntityClassKeys.ServiceDeliveryLocation : EntityClassKeys.Place },
                statusConcept: StatusKeys.Active,
                isMobile: false,
                name: {
                    $other: [ {
                        component: {
                        },
                        use: NameUseKeys.OfficialRecord
                    } ]
                }
            })
        };
    }

    $scope.savePlace = async function (form) {

        try {
            SanteDB.display.buttonWait("#savePlaceButton", true);
            //if (!await validateForm() || !form.$valid)
                //return;

            console.log("Place for save");
            console.log($scope.target.place);

            if(!$scope.target.place.id) {
                $scope.target.place = await SanteDB.resources.place.insertAsync($scope.target.place);
                toastr.success(SanteDB.locale.getString("ui.model.place.saveSuccess"));
                $state.transitionTo(isFacility ? 'santedb-admin.data.facility.edit' : 'santedb-admin.data.place.edit', {id: $scope.target.place.id});
            }
            else {
                $scope.target.place = await SanteDB.resources.place.updateAsync($stateParams.id, $scope.target.place);
                toastr.success(SanteDB.locale.getString("ui.admin.place.saveSuccess"));
                $state.transitionTo(isFacility ? 'santedb-admin.data.facility.index' : 'santedb-admin.data.place.index', {id: $scope.target.place.id});

            }
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#savePlaceButton", false);
            try { $scope.$apply(); }
            catch (e) {}
        }
    }

    
}]);