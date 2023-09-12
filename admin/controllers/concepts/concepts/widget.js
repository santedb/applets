/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('ConceptWidgetController', ["$scope", "$rootScope", "$timeout", "$state", function ($scope, $rootScope, $timeout, $state) {


    $scope.renderRefTermCodeSystem = function(c) {
        return `<a ui-sref="santedb-admin.concept.codeSystem.view({ id: '${c.termModel.codeSystem}' })">${c.termModel.codeSystemModel.authority }</a>`;
    }

    $scope.renderRefTermMnemonic = function(c) {
        return c.termModel.mnemonic;
    }

    $scope.renderRelationshipType = function(c) {
        return c.relationshipTypeModel.mnemonic;
    }

    $scope.$watch("scopedObject.previousVersion", async function(n,o) {
        if(n && $scope.scopedObject && $scope.scopedObject.id && (n!=o || !$scope.scopedObject._previousVersions)) {
            $scope.scopedObject._previousVersions =[];
            var versions = await SanteDB.resources.concept.findAssociatedAsync($scope.scopedObject.id, "_history", {}, "history");
            $timeout(() => {
                $scope.scopedObject._previousVersions = versions.resource;
            });
        }
    })
}]);