/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
/*
 * Copyright (C) 2021 - 2024, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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
angular.module('santedb').controller('PlaceEditController', ["$scope", "$rootScope", "$stateParams", "$state", "$timeout", function ($scope, $rootScope, $stateParams, $state, $timeout) {

    // Initialize the view
    async function initialize(id) {
        try {
            var place = await SanteDB.resources.place.getAsync(id, "full");

            if (place.classConcept == EntityClassKeys.ServiceDeliveryLocation) {
                $state.go("santedb-admin.data.facility.view", { id: id });
            }
            if (place.isMobile === undefined) {
                place.isMobile = false;
            }
            place.relationship = place.relationship || {};
            if (!place.relationship.Parent) {
                place.relationship.Parent = [{}]
            }

            place.address = place.address || { PhysicalVisit: [new EntityAddress({ use: AddressUseKeys.PhysicalVisit })] };

            document.title = document.title + " - " + SanteDB.display.renderEntityName(place.name);

            return place;
        }
        catch (e) {
            $rootScope.errorHandler(e);
            return null;
        }
    }

    if ($scope.$parent.scopedObject) // Prevent duplicate loading of this object
    {
        return;
    }
    else if ($stateParams.id) {
        initialize($stateParams.id).then((place) => {
            $timeout(() => {
                $scope.entity = place;
            });
        });
    }
    else {
        // Create a templated place
        $scope.entity = new Place({
            classConcept: EntityClassKeys.Place,
            statusConcept: StatusKeys.Active,
            isMobile: false,
            relationship: {
                Parent: []
            },
            identifier: {
                ISO3166: [{}]
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

    $scope.savePlace = async function (form) {

        if (!form.$valid) return;

        try {
            SanteDB.display.buttonWait("#savePlaceButton", true);

            var place = angular.copy($scope.entity);

            // Correct the address information based on the type and parent
            if (!place.address) {
                if (place.relationship && place.relationship.Parent &&
                    place.relationship.Parent[0] &&
                    place.relationship.Parent[0].target) {
                    // Fetch the parent
                    var parent = await SanteDB.resources.place.getAsync(place.relationship.Parent[0].target, "fastview");
                    var address = parent.address.PhysicalVisit || parent.address.Direct; // Grab the direct address of the parent
                    delete (address[0].id); // we don't w|ant to update the address
                    switch (place.classConcept) {

                        case EntityClassKeys.Country:
                            address[0].component.Country = [place.name.OfficialRecord[0].component.$other[0]];
                            break;
                        case EntityClassKeys.State:
                        case EntityClassKeys.StateOrProvince:
                            address[0].component.State = [place.name.OfficialRecord[0].component.$other[0]];
                            break;
                        case EntityClassKeys.CountyOrParish:
                            address[0].component.County = [place.name.OfficialRecord[0].component.$other[0]];
                            break;
                        case EntityClassKeys.CityOrTown:
                            address[0].component.City = [place.name.OfficialRecord[0].component.$other[0]];
                            break;
                        case EntityClassKeys.PrecinctOrBorough:
                            address[0].component.Precinct = [place.name.OfficialRecord[0].component.$other[0]];
                            break;
                    }
                    place.address = { PhysicalVisit: address };

                }
            }

            if (place.classConcept == EntityClassKeys.Country) {
                place.address = {
                    PhysicalVisit: [new EntityAddress({
                        use: AddressUseKeys.PhysicalVisit,
                        component: {
                            Country: [place.identifier.ISO3166[0].value]
                        }
                    })]
                }
            }
            else {
                delete place.identifier.ISO3166;
            }

            place = await prepareEntityForSubmission(place);

            if (!$stateParams.id) {
                place = await SanteDB.resources.place.insertAsync(place);
                toastr.success(SanteDB.locale.getString("ui.model.place.saveSuccess"));
            }
            else {
                place = await SanteDB.resources.place.updateAsync($stateParams.id, place);
                toastr.success(SanteDB.locale.getString("ui.admin.place.saveSuccess"));
            }

            $state.go('santedb-admin.data.place.view', { id: place.id });
        }
        catch (e) {
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

        if (confirm(SanteDB.locale.getString("ui.admin.place.export.heirarchy"))) {
            var hLevels = {};
            hLevels[EntityClassKeys.Country] = 5;
            hLevels[EntityClassKeys.StateOrProvince] = 4;
            hLevels[EntityClassKeys.State] = 4;
            hLevels[EntityClassKeys.CountyOrParish] = 3;
            hLevels[EntityClassKeys.CityOrTown] = 2;
            hLevels[EntityClassKeys.PrecinctOrBorough] = 1;

            for(var i = 1; i < hLevels[$scope.entity.classConcept]; i++) {
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