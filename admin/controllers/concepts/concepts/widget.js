/// <reference path="../../../../core/js/santedb.js"/>
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
 * Date: 2023-9-7
 */
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

    $scope.saveConcept = function(editForm, newSet) {
         // Sometimes users will have newSet with a value - we should add that
         if(newSet) {
            $scope.editObject.conceptSet.push(newSet);
        }
        var parentSaveFn = SanteDB.display.getParentScopeVariable($scope, 'saveConceptInternal');
        parentSaveFn(editForm, $scope.editObject);
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