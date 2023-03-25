/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
angular.module('santedb').controller('PlaceHierarchyController', ["$scope", "$rootScope", "$stateParams", "$state", "$timeout", function ($scope, $rootScope, $stateParams, $state, $timeout) {

    if (!$scope.$parent.scopedObject) {
        throw new Exception("InvalidContextException", "This panel needs to be embedded when a parent scope scopedObject is set");
    }
    
    $scope.renderName = function (plc) {
        return SanteDB.display.renderEntityName(plc.name);
    }
    $scope.renderClass = function (plc) {
        return SanteDB.display.renderConcept(plc.classConceptModel);
    }

    var originalParent = null;
    if($scope.$parent.scopedObject.relationship &&
        $scope.$parent.scopedObject.relationship.Parent) {
            originalParent = $scope.$parent.scopedObject.relationship.Parent[0].target;
        }
        else {
            $scope.parent.relationship.Parent = [ {} ];
        }

    $scope.saveHierarchy = async function(formData) {
        if(formData.$invalid) {
            return;
        }

        if(originalParent && originalParent != $scope.scopedObject.relationship.Parent[0].target && confirm(SanteDB.locale.getString("ui.admin.place.edit.parent.change")))
        {
            // Delete the current parent relationship from the object
            try {
                
                var submissionBundle = new Bundle({resource: []});
                submissionBundle.resource.push(new EntityRelationship({ 
                    id: $scope.scopedObject.relationship.Parent[0].id,
                    operation: BatchOperationType.Delete
                }));
                submissionBundle.resource.push(new EntityRelationship({
                    source: $scope.scopedObject.id,
                    target: $scope.scopedObject.relationship.Parent[0].target,
                    relationshipType: EntityRelationshipTypeKeys.Parent
                }));

                var result = await SanteDB.resources.bundle.insertAsync(submissionBundle);
                toastr.success(SanteDB.locale.getString("ui.admin.place.edit.parent.change.success"));
                
                // Refresh the selection 
                $timeout(() => {
                    $scope.scopedObject.relationship.Parent[0] = result.resource.find(o=>o.$type == "EntityRelationship" && o.operation == BatchOperationType.Insert || o.operation == BatchOperationType.InsertInt);
                    var updatedAddress = result.resource.find(o=>o.$type == "EntityAddress" && o.operation == BatchOperationType.Insert || o.operation == BatchOperationType.InsertInt);
                    if(updatedAddress != null) {
                        $scope.scopedObject.address.Direct[0] = updatedAddress;
                    }
                });
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.place.edit.parent.change.fail", { e: e.message }));
                $rootScope.errorHandler(e);
            }
            finally {

            }
        }
        else {
            $timeout(() => {
                scopedObject.relationship.Parent[0].target = originalParent;
            });
        }
    }
}]);
