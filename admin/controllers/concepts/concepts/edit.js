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
 */
angular.module('santedb').controller('EditConceptController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    async function checkDuplicate(mnemonic) {
        try {
            var duplicate = await SanteDB.resources.concept.findAsync({
                mnemonic: mnemonic, 
                _includeTotal: true,
                _count: 0
            });
            return duplicate.totalResults > 0;
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }

    // Initialize the view
    async function initializeView(id) {
        try {
            var concept = await SanteDB.resources.concept.getAsync(id, "concept");
            if(!concept.conceptSet) {
                concept.conceptSet = [];
            }
            if(!concept.name) {
                concept.name = {};
                concept.name[SanteDB.locale.getLanguage()] = [""];
            }
            $timeout(() => $scope.concept = concept);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Save code system
    async function saveConcept(conceptForm, conceptToSave) {
        if (conceptForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#saveConceptButton", true);

            // Sometimes users will have newSet with a value - we should add that
            if($scope.newSet) {
                conceptToSave.conceptSet.push($scope.newSet);
            }

            // Update
            var concept = null;
            if ($stateParams.id) {
                concept = await SanteDB.resources.concept.updateAsync($stateParams.id, conceptToSave);
            }
            else {
                concept = await SanteDB.resources.concept.insertAsync(conceptToSave);
            }

            toastr.success(SanteDB.locale.getString("ui.admin.concept.save.success"));

            if (!$stateParams.id) {
                $state.go("santedb-admin.concept.concepts.view", { id: concept.id });
            }
            else {
                concept = await SanteDB.resources.concept.getAsync(concept.id, 'concept');
                $timeout(() => $scope.concept = concept);
            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveConceptButton", false);
        }
    }

    // Initialize view for load or create
    if ($stateParams.id) {
        initializeView($stateParams.id);
    }
    else {
        $scope.concept = new Concept({
            name: {
                $other: [
                    {
                        language: SanteDB.locale.getLanguage()
                    }
                ]
            },
            conceptClass: ConceptClassKeys.Other,
            conceptSet: [],
            statusConcept: StatusKeys.Active,
            referenceTerm: {
                $other: []
            }
            
        });
        $scope.$watch("concept.mnemonic", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate(n);
                $timeout(() => $scope.createConceptForm.conceptMnemonic.$setValidity('duplicate', valid));
            }
        });
    
    }
    // Bind to scope
    $scope.saveConceptInternal = saveConcept;
    $scope.saveConcept = function(form) { saveConcept(form, $scope.concept) };

    
    // Set the active state
    $scope.setState = async function (newStatus) {
        try {
            SanteDB.display.buttonWait("#btnSetState", true);
            // Set the status and update
            var patch = new Patch({
                appliesTo: new PatchTarget({
                    id: $scope.concept.id
                }),
                change: [
                    new PatchOperation({
                        op: PatchOperationType.Replace,
                        path: "statusConcept",
                        value: newStatus
                    })
                ]
            });
            await SanteDB.resources.concept.patchAsync($scope.concept.id, $scope.concept.etag, patch);            
            toastr.success(SanteDB.locale.getString("ui.model.concept.saveSuccess"));

            $state.reload();
            
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSetState", false);
        }
    }

    // Download code system
    $scope.downloadConcept = function(id) {

        var refTerms = [], codeSys = [];
        if($scope.concept.referenceTerm) {
            Object.keys($scope.concept.referenceTerm).forEach(k=> {
                $scope.concept.referenceTerm[k].forEach(t=> {
                    refTerms.push(`id=${t.term}`); 
                    if(t.termModel) {
                        codeSys.push(`id=${t.termModel.codeSystem}`); 
                    }
                });
            });
        } 
        var win = window.open(`/hdsi/Concept/${id}/_export?_include=ConceptSet:concept%3d${id}%26_exclude=concept&_include=CodeSystem:${codeSys.join('%26')}&_include=ReferenceTerm:${refTerms.join('%26')}&_exclude=previousVersion&_includesFirst=true&_include=ConceptSet:compose.source=${id}%26_include=ReferenceTerm:concept.source=${id}%26_include=CodeSystem:referenceTerm.concept.source=${id}`, '_blank');
        win.onload = function (e) {
            win.close();
        };
    }
}]);
