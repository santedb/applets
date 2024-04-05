/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
angular.module("santedb").controller("MaterialWidgetController", ["$scope", "$rootScope", "$timeout", function($scope, $rootScope, $timeout) {

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

    var saveMaterialInternal = SanteDB.display.getParentScopeVariable($scope, "saveMaterial");
    $scope.idDomains = SanteDB.display.getParentScopeVariable($scope, "idDomains");

    // Wrapper for underlying save material function
    $scope.saveMaterial = async function(editForm) {
        if(editForm.$invalid) return;
        saveMaterialInternal(editForm, $scope.editObject);
    }

}]);