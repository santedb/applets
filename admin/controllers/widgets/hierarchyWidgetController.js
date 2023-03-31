/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
angular.module('santedb').controller('HierarchyWidgetController', ["$scope", "$rootScope", "$stateParams", "$state", "$timeout", function ($scope, $rootScope, $stateParams, $state, $timeout) {

    if (!$scope.$parent.scopedObject) {
        throw new Exception("InvalidContextException", "This panel needs to be embedded when a parent scope scopedObject is set");
    }

    $scope.renderName = function (plc) {
        return SanteDB.display.renderEntityName(plc.name);
    }
    $scope.renderAddress = function (plc) {
        return SanteDB.display.renderEntityAddress(plc.address);
    }
    $scope.renderClass = function (plc) {
        return SanteDB.display.renderConcept(plc.classConceptModel);
    }
    $scope.renderType = function (plc) {
        return SanteDB.display.renderConcept(plc.typeConceptModel);
    }

    $scope.renderStatusConcept = function (plc) {
        return SanteDB.display.renderStatus(plc.statusConcept);
    }


    var originalParent = null;
    if ($scope.$parent.scopedObject.relationship &&
        $scope.$parent.scopedObject.relationship.Parent) {
        originalParent = $scope.$parent.scopedObject.relationship.Parent[0].target;
    }
    else if ($scope.$parent.scopedObject.relationship) {
        $scope.$parent.scopedObject.relationship.Parent = [{}];
    }
    else {
        $scope.$parent.scopedObject.relationship = {
            Parent: [{}]
        }
    }

    // 
    $scope.addChild = async function (newChildId) {
        try {
            SanteDB.display.buttonWait("#btnAddChild", true);
            var submissionBundle = new Bundle({ resource: [] });

            // Current child has a parent already?
            var newChild = await SanteDB.resources.entityRelationship.findAsync({ source: newChildId, relationshipType: EntityRelationshipTypeKeys.Parent, _count: 1 }, "min");
            if (newChild && newChild.resource) {
                newChild = newChild.resource[0];
                if (!confirm(SanteDB.locale.getString("ui.admin.entity.edit.child.add.confirm"))) // user wants to change the parent?
                {
                    return;
                }
                submissionBundle.resource.push(new EntityRelationship({
                    operation: BatchOperationType.Delete,
                    id: newChild.id
                }));
            }
            submissionBundle.resource.push(new EntityRelationship({
                source: newChildId,
                target: $scope.scopedObject.id,
                relationshipType: EntityRelationshipTypeKeys.Parent
            }));
            await SanteDB.resources.bundle.insertAsync(submissionBundle);
            toastr.success(SanteDB.locale.getString("ui.admin.entity.edit.child.add.success"));
            $("#hierarchyTable table").DataTable().ajax.reload();

        }
        catch (e) {
            toastr.success(SanteDB.locale.getString("ui.admin.entity.edit.child.add.fail", { e: e.message || e }));
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnAddChild", false);
        }
    }

    $scope.removeChild = async function (childPlaceIdToRemove, index) {
        if (confirm(SanteDB.locale.getString("ui.admin.entity.edit.child.remove.confirm", { id: childPlaceIdToRemove }))) {
            try {
                SanteDB.display.buttonWait(`#Placeremove${index}`, true);
                var relationship = await SanteDB.resources.entityRelationship.findAsync({ target: $stateParams.id, source: childPlaceIdToRemove, relationshipType: EntityRelationshipTypeKeys.Parent, _count: 1 }, "min");
                if (relationship.resource.length == 1) {
                    await SanteDB.resources.entityRelationship.deleteAsync(relationship.resource[0].id);
                }
                toastr.success(SanteDB.locale.getString("ui.admin.entity.edit.child.remove.success"));
                $("#hierarchyTable table").DataTable().ajax.reload();
            }
            catch (e) {
                toastr.success(SanteDB.locale.getString("ui.admin.entity.edit.child.remove.fail", { e: e.message || e }));
                $rootScope.errorHandler(e);
            }
            finally {
                SanteDB.display.buttonWait(`#Placeremove${index}`, false);
            }
        }
    }

    $scope.saveHierarchy = async function (formData) {
        if (formData.$invalid) {
            return;
        }

        if (!originalParent || originalParent != $scope.scopedObject.relationship.Parent[0].target && confirm(SanteDB.locale.getString("ui.admin.entity.edit.parent.change"))) {
            // Delete the current parent relationship from the object
            try {

                var submissionBundle = new Bundle({ resource: [] });
                if (originalParent) {
                    submissionBundle.resource.push(new EntityRelationship({
                        id: $scope.scopedObject.relationship.Parent[0].id,
                        operation: BatchOperationType.Delete
                    }));
                }
                submissionBundle.resource.push(new EntityRelationship({
                    source: $scope.scopedObject.id,
                    target: $scope.scopedObject.relationship.Parent[0].target,
                    relationshipType: EntityRelationshipTypeKeys.Parent
                }));

                var result = await SanteDB.resources.bundle.insertAsync(submissionBundle);
                toastr.success(SanteDB.locale.getString("ui.admin.entity.edit.parent.change.success"));

                var updated = await SanteDB.resources[$scope.scopedObject.$type.toCamelCase()].getAsync($scope.scopedObject.id, "full"); // re-fetch the place
         
                $timeout(() => {
                    $scope.scopedObject.relationship.Parent[0] = result.resource.find(o => o.$type == "EntityRelationship" && o.operation == BatchOperationType.Insert || o.operation == BatchOperationType.InsertInt);
                    SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'entity'], updated);
                });
            }
            catch (e) {
                toastr.error(SanteDB.locale.getString("ui.admin.entity.edit.parent.change.fail", { e: e.message }));
                $rootScope.errorHandler(e);
            }
            finally {

            }
        }
        else {
            $scope.scopedObject.relationship.Parent[0].target = originalParent;
        }
    }
}]);
