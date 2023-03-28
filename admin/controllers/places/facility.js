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

    // initialize the view
    async function initialize(id) {
        try {
            var place = await SanteDB.resources.place.getAsync(id, "full");
            if(place.classConcept != EntityClassKeys.ServiceDeliveryLocation) {
                $state.go("santedb-admin.data.place.view", {id: id});
            }

            if(place.isMobile === undefined) {
                place.isMobile = true;
            }
            place.relationship = place.relationship || {};
            if(!place.relationship.Parent) {
                place.relationship.Parent = [{}]
            }

            document.title = document.title + " - " + SanteDB.display.renderEntityName(place.name);

            return place;
        }
        catch(e) {
            $rootScope.errorHandler(e);
            return null;
        }
    }

    if($scope.$parent.scopedObject) { // don't reload
        $scope.entity = $scope.$parent.scopedObject;
        return;
    }
    else if($stateParams.id) {
        initialize($stateParams.id).then((place) => {
            $timeout(() => {
                $scope.entity = place;
            });
        })
    }
    else {
        $scope.entity = new Place({
            classConcept: EntityClassKeys.ServiceDeliveryLocation,
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
            },
            address: {
                PhysicalVisit: [
                    {
                        component: {
                            City: [],
                            Country: [],
                            State: [],
                            County: [],
                            Precinct: [],
                            StreetAddressLine: [],
                            PostalCode: []
                        },
                        use: AddressUseKeys.PhysicalVisit
                    }
                ]
            }
        });
    }


    // Save the place
    $scope.savePlace = async function(form) {
        if(!form.$valid) return;

        try {
            SanteDB.display.buttonWait("#savePlaceButton", true);
            
            var place = await prepareEntityForSubmission(angular.copy($scope.entity));
            
            if(!$stateParams.id) {
                place = await SanteDB.resources.place.insertAsync(place);
                toastr.success(SanteDB.locale.getString("ui.model.place.saveSuccess"));
            }
            else {
                place = await SanteDB.resources.place.updateAsync($stateParams.id, place);
                toastr.success(SanteDB.locale.getString("ui.model.place.saveSuccess"));
            }
            $state.go("santedb-admin.data.facility.view", { id: place.id });

        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#savePlaceButton", false);
        }
    }

    // Set the active state
    $scope.setState = async function (status) {
        try {
            SanteDB.display.buttonWait("#btnSetState", true);
            await setEntityState($scope.entity.id, $scope.entity.etag, status);
            toastr.info(SanteDB.locale.getString("ui.model.place.saveSuccess"));
            $state.reload();

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSetState", false);
        }
    }

    
    // Set the active state
    $scope.setTag = async function (tagName, tagValue) {
        try {
            SanteDB.display.buttonWait("#btnClearTag", true);
            await setEntityTag($stateParams.id, tagName, tagValue);
            toastr.info(SanteDB.locale.getString("ui.model.place.saveSuccess"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnClearTag", false);
        }
    }

}]);