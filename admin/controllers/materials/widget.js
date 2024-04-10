/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
angular.module("santedb").controller("MaterialWidgetController", ["$scope", "$rootScope", "$timeout", function($scope, $rootScope, $timeout) {

    $scope.newUsedEntity = new EntityRelationship({ quantity: 1 });

    $scope.$watch("editObject.typeConcept", async function (n, o) {
        if (n && n != o) {
            try {
                var concept = await SanteDB.resources.concept.getAsync(n, 'min');

                $timeout(() => {
                    $scope.editObject.isAdministrable = concept.conceptSet.find(o => o == "ab16722f-dcf5-4f5a-9957-8f87dbb390d5") != null;
                });
            }
            catch (e) {
                console.error(e);
            }
        }
    });

    $scope.$watch((s) => s.editObject && 
        s.editObject.relationship &&
        s.editObject.relationship.UsedEntity ? s.editObject.relationship.UsedEntity.length : 0, async function(n, o) {
        if(n > 0) {
            $scope.editObject.relationship.UsedEntity.filter(o=>!o.targetModel).forEach(o=> {
                SanteDB.resources.material.getAsync(o.target, 'dropdown')
                    .then(m=> $timeout(() => o.targetModel = m))
                    .catch(e=>console.error(e));
            });
        }
    });

    var saveMaterialInternal = SanteDB.display.getParentScopeVariable($scope, "saveMaterial");
    $scope.idDomains = SanteDB.display.getParentScopeVariable($scope, "idDomains");

    // Wrapper for underlying save material function
    $scope.saveMaterial = async function(editForm) {
        if(editForm.$invalid) return;

        // New used entity?
        if($scope.newUsedEntity && $scope.newUsedEntity.target) {
            $scope.editObject.relationship.UsedEntity.push($scope.newUsedEntity);
        } 
        saveMaterialInternal(editForm, $scope.editObject);
    }

}]);