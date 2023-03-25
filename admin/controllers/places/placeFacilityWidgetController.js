/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
        var parentAddress = $scope.$parent.scopedObject.address.Direct || $scope.$parent.scopedObject.PhysicalVisit || [{}];
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
    $scope.removeAssociatedFacility = async function (idOfRelatedPlace, index) {
        if (confirm(SanteDB.locale.getString("ui.admin.place.edit.associate.remove.confirm", { id: idOfRelatedPlace }))) {
            try {
                SanteDB.display.buttonWait(`#Placeremove${index}`, true);
                var relationship = await SanteDB.resources.entityRelationship.findAsync({ source: $stateParams.id, target: idOfRelatedPlace, relationshipType: EntityRelationshipTypeKeys.DedicatedServiceDeliveryLocation, _count: 1 }, "min");
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

    // Associate a facility to a place
    $scope.associateFacilityToPlace = async function (formData) {

        if (formData.$invalid) {
            return;
        }

        try {
            SanteDB.display.buttonWait('#btn-submit-association-facility', true);
            var submission = new Bundle({ resource: [] });
            var targetPlaceId = null;
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
