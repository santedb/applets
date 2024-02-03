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
 * 
 * User: fyfej
 * Date: 2023-5-19
 */
angular.module('santedb').controller('PlaceFacilityWidgetController', ["$scope", "$rootScope", "$stateParams", "$state", "$timeout", function ($scope, $rootScope, $stateParams, $state, $timeout) {

    if (!$scope.$parent.scopedObject) {
        throw new Exception("InvalidContextException", "This panel needs to be embedded when a parent scope scopedObject is set");
    }
    // Skeleton association structure
    $scope.associationTemplate = {
        type: 'existing',
        holder: $scope.$parent.scopedObject.id,
        targetModel: new Place({
            classConcept: EntityClassKeys.ServiceDeliveryLocation,
            statusConcept: StatusKeys.Active,
            relationship: {
                Parent: [
                    {
                        target: null
                    }
                ]
            },
            address: {
                PhysicalVisit: [
                    new EntityAddress({
                        use: AddressUseKeys.PhysicalVisit
                    })
                ]
            },
            name: {
                OfficialRecord: [
                    {
                        component:
                        {
                            "$other": [null]
                        }
                    }
                ]
            }
        })
    };

    // Copy data from the parent scoped object
    if ($scope.$parent.scopedObject.address) {
        var parentAddress = $scope.$parent.scopedObject.address.PhysicalVisit || $scope.$parent.scopedObject.address.Direct;
        var newAddress = angular.copy(parentAddress[0]);
        newAddress.use = AddressUseKeys.PhysicalVisit;
        delete (newAddress.id);
        $scope.associationTemplate.targetModel.address.PhysicalVisit = newAddress;
    }

    $scope.association = angular.copy($scope.associationTemplate);

    $scope.renderName = function (plc) {
        return SanteDB.display.renderEntityName(plc.name);
    }
    $scope.renderAddress = function (plc) {
        return SanteDB.display.renderEntityAddress(plc.address);
    }
    $scope.renderType = function (plc) {
        return SanteDB.display.renderConcept(plc.typeConceptModel);
    }
    $scope.renderClass = function (plc) {
        return SanteDB.display.renderConcept(plc.classConceptModel);
    }
    $scope.renderStatus = function (place) {
        return SanteDB.display.renderStatus(place.statusConcept);
    }


    // Add an associated facility popup
    $scope.addAssociatedFacility = async function () {
        try {
            await SanteDB.resources.place.checkoutAsync($scope.association.holder);
            $('#associateFacilityToPlaceModal').modal('show');
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Remove a place from the association with this place
    $scope.removeAssociatedFacility = function (idOfRelatedPlace, index) {
        removeAssociation($stateParams.id, idOfRelatedPlace, index);
    }

    $scope.removeAssociatedPlace = function(idOfRelatedPlace, index) {
        removeAssociation(idOfRelatedPlace, $stateParams.id, index);
    }

    // Remove association
    async function removeAssociation(idOfSource, idOfTarget, index) {
        if (confirm(SanteDB.locale.getString("ui.admin.place.edit.associate.remove.confirm", { id: idOfTarget }))) {
            try {
                SanteDB.display.buttonWait(`#Placeremove${index}`, true);
                var relationship = await SanteDB.resources.entityRelationship.findAsync({ source: idOfSource, target: idOfTarget, relationshipType: EntityRelationshipTypeKeys.DedicatedServiceDeliveryLocation, _count: 1 }, "min");
                if (relationship.resource.length == 1) {
                    await SanteDB.resources.entityRelationship.deleteAsync(relationship.resource[0].id);
                }
                toastr.success(SanteDB.locale.getString("ui.admin.place.edit.associate.remove.success"));
                $("#facilityAssociationTable table").DataTable().ajax.reload();
            }
            catch (e) {
                toastr.success(SanteDB.locale.getString("ui.admin.place.edit.associate.remove.fail", { e: e.message || e }));
                $rootScope.errorHandler(e);
            }
            finally {
                SanteDB.display.buttonWait(`#Placeremove${index}`, false);
            }
        }
    }

    // Associate a place to a facility
    $scope.associatePlaceToFacility = async function(placeId) {

        try {
            SanteDB.display.buttonWait('#btn-associate-place', true);
            await SanteDB.resources.place.checkoutAsync($scope.scopedObject.id);
            await SanteDB.resources.entityRelationship.insertAsync(new EntityRelationship({
                source: placeId,
                target: $scope.scopedObject.id,
                relationshipType: EntityRelationshipTypeKeys.DedicatedServiceDeliveryLocation
            }));
            await SanteDB.resources.place.checkinAsync($scope.scopedObject.id);
            toastr.success(SanteDB.locale.getString("ui.admin.place.edit.associate.success"));
            $("#facilityAssociationTable table").DataTable().ajax.reload();
        }
        catch (e) {
            toastr.error(SanteDB.locale.getString('ui.admin.place.edit.associate.fail', { e: e.message || e }));
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait('#btn-associate-place', false);
        }
    }

    // Associate a facility to a place
    $scope.associateFacilityToPlace = async function (formData) {

        if (formData.$invalid) {
            return;
        }

        try {
            SanteDB.display.buttonWait('#btn-submit-association-facility', true);
            var submission = new Bundle({ resource: [] });
            var targetPlaceId = null;
            await SanteDB.resources.place.checkoutAsync($scope.association.holder);

            switch ($scope.association.type) {
                case "existing":
                    targetPlaceId = $scope.association.target;
                    submission.resource.push(new EntityRelationship({
                        holder: $scope.association.holder,
                        target: $scope.association.target,
                        relationshipType: EntityRelationshipTypeKeys.DedicatedServiceDeliveryLocation
                    }));
                    break;
                case "new":
                    var newPlace = new Place($scope.association.targetModel);
                    targetPlaceId = newPlace.id = SanteDB.application.newGuid();
                    submission.resource.push(newPlace);
                    submission.resource.push(new EntityRelationship({
                        holder: $scope.association.holder,
                        target: newPlace.id,
                        relationshipType: EntityRelationshipTypeKeys.DedicatedServiceDeliveryLocation
                    }));
                    break;
                default:
                    throw new Exception("InvalidOperationException", "Invalid association target");
            }

            // Register the facility
            var facilityResult = new Bundle(await SanteDB.resources.bundle.insertAsync(submission));
            toastr.success(SanteDB.locale.getString("ui.admin.place.edit.associate.success"));
            await SanteDB.resources.place.checkinAsync($scope.association.holder);

            switch ($scope.association.next || "") {
                case "another":
                    $timeout(() => {
                        $scope.association = angular.copy($scope.associationTemplate);
                    });
                    break;
                case "edit":
                    // Locate the place
                    $state.go("santedb-admin.data.facility.view", { id: targetPlaceId });
                    break;
                default:
                    $('#associateFacilityToPlaceModal').modal('hide');
                    $("#facilityAssociationTable table").DataTable().ajax.reload();
                    break;
            }

            
        }
        catch (e) {
            toastr.error(SanteDB.locale.getString('ui.admin.place.edit.associate.fail', { e: e.message || e }));
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait('#btn-submit-association-facility', false);

        }
    }

}]);
