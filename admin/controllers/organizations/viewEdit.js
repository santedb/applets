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
angular.module('santedb').controller('OrganizationViewEditController', ["$scope", "$rootScope", "$stateParams", "$state", "$timeout", function ($scope, $rootScope, $stateParams, $state, $timeout) {


     // initialize the view
     async function initialize(id) {
        try {
            var place = await SanteDB.resources.organization.getAsync(id, "full");

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
        $scope.entity = new Organization({
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
            statusConcept: StatusKeys.Active,
            address: {
                PostalAddress: [
                    {
                        component: {
                            City: [],
                            Country: [],
                            State: [],
                            County: [],
                            Precinct: [],
                            StreetAddressLine: [],
                            PostalCode: [],
                            PostBox: [],
                            CareOf: []
                        },
                        use: AddressUseKeys.PostalAddress
                    }
                ]
            }
        });
    }

    
    // Save the org
    $scope.saveOrganization = async function(form) {
        if(!form.$valid) return;

        try {
            SanteDB.display.buttonWait("#saveOrgButton", true);
            
            var organization = await prepareEntityForSubmission(angular.copy($scope.entity));
            
            if(!$stateParams.id) {
                organization = await SanteDB.resources.organization.insertAsync(organization);
                toastr.success(SanteDB.locale.getString("ui.model.organization.saveSuccess"));
            }
            else {
                organization = await SanteDB.resources.organization.updateAsync($stateParams.id, organization);
                toastr.success(SanteDB.locale.getString("ui.model.organization.saveSuccess"));
            }
            $state.go("santedb-admin.data.organization.view", { id: organization.id });

        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveOrgButton", false);
        }
    }


    // Set the active state
    $scope.setState = async function (status) {
        try {
            SanteDB.display.buttonWait("#btnSetState", true);
            await setEntityState($scope.entity.id, $scope.entity.etag, status);
            toastr.info(SanteDB.locale.getString("ui.model.organization.saveSuccess"));

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
            toastr.info(SanteDB.locale.getString("ui.model.organization.saveSuccess"));
            
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