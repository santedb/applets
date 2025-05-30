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
            if(!place.service) {
                place.service = [];
            }

            place.address = place.address || { PhysicalVisit: [new EntityAddress({use: AddressUseKeys.PhysicalVisit })] };

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

    
    $scope.download = function () {
        var parms = [];
        if ($scope.entity.typeConcept) {
            parms.push(`_include=Concept:id%3d${$scope.entity.typeConcept}%26_exclude=conceptSet%26_exclude=referenceTerm`);
        }

        if (confirm(SanteDB.locale.getString("ui.admin.facility.export.heirarchy"))) {
            for(var i = 1; i < 5; i++) {
                parms.push(`_include=Place:${"relationship[Parent].target.".repeat(i)}id=${$scope.entity.id}`);
            }
        }

        var url = `/hdsi/Place/${$scope.entity.id}/_export?${parms.join("&")}`;
        console.info(url);
        var win = window.open(`/hdsi/Place/${$scope.entity.id}/_export?${parms.join("&")}`, '_blank');
        win.onload = function (e) {
            win.close();
        };
    }

    // Set the active state
    $scope.setTag = async function (tagName, tagValue) {
        try {
            SanteDB.display.buttonWait("#btnClearTag", true);
            await setEntityTag($stateParams.id, tagName, tagValue);
            toastr.info(SanteDB.locale.getString("ui.model.place.saveSuccess"));
            
            var updated = await SanteDB.resources.place.getAsync($stateParams.id, "full"); // re-fetch the place
            $timeout(() => {
                SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'entity'], updated);
            });
            
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnClearTag", false);
        }
    }

}]);