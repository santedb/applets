/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('ConceptWidgetController', ["$scope", "$rootScope", "$timeout", "$state", function ($scope, $rootScope, $timeout, $state) {


    // Check for duplicates
    async function checkDuplicate(mnemonic) {
        try {
            query = {
                _count: 0,
                _includeTotal: true,
                id: `!${$scope.scopedObject.id}`,
                mnemonic: mnemonic
            };
            var duplicate = await SanteDB.resources.concept.findAsync(query);
            return duplicate.totalResults > 0;
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }


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

    $scope.$watch("editObject.mnemonic", async function (n, o) {
        if (n != o && n && n.length > 1 && n && o) {
            var valid = !await checkDuplicate(n);
            $timeout(() => {
                if($scope.panel.editForm) // HACK: Since this controller is used in multiple panels
                    $scope.panel.editForm.conceptMnemonic.$setValidity('duplicate', valid);
            });
        }
    });

    $scope.$watch("panel.view", async function(n, o) {
        if(n == "Edit" && n != o) {
            // Name comes in the format of { lang: [values] } so we have to normalize these to $other
            var newName = [];
            if($scope.editObject.name) {
                Object.keys($scope.editObject.name).forEach(k => { $scope.editObject.name[k].forEach(v => newName.push(new ConceptName({ language: k, value: v }))) });
            }
            $scope.editObject.name = { $other: newName };
        }
    })
}]);