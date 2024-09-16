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
angular.module('santedb').controller('CodeSystemWidgetController', ["$scope", "$rootScope", "$timeout", "$state", function ($scope, $rootScope, $timeout, $state) {

    $scope.uploadTerm = {
        language: SanteDB.locale.getLanguage()
    };

    $scope.refTermTemplate = {
        $type: "ReferenceTerm",
        codeSystem: $scope.scopedObject.id,
        name: {
            $other: [{ language: SanteDB.locale.getLanguage() }]
        },
        concepts: [
            {
                relationshipType: '2c4dafc2-566a-41ae-9ebc-3097d7d22f4a'
            }
        ]
    };

    var _areEventsInitialized = false;

    // Initialize the BS modal events
    function initializeModalEvent() {
        if (!_areEventsInitialized) {
            // User has closed the add modal so we want to reset the new
            $("#addReferenceTermModal").on('hidden.bs.modal', function () {
                // Check in 
                if ($scope.edit.referenceTerm.id) {
                    SanteDB.resources.referenceTerm.checkinAsync($scope.edit.referenceTerm.id);
                }
                $("#CodeSystemRefTermTable table").DataTable().draw();
            });
            _areEventsInitialized = true;
        }
    }

    // Check for duplicates
    async function checkDuplicate(query) {
        try {
            query._count = 0;
            query._includeTotal = true;
            query.id = `!${$scope.scopedObject.id}`;
            var duplicate = await SanteDB.resources.codeSystem.findAsync(query);
            return duplicate.totalResults > 0;
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }

    // Upload reference term sheet
    function uploadReferenceTermSheet(referenceTermSheetForm) {

        var file_data = referenceTermSheetForm.source.$$element.prop('files')[0];
        var form_data = new FormData();
        form_data.append('source', file_data);
        form_data.append('description', 'Automatically submitted via the CodeSystem management portal');
        form_data.append('map', '4A5CAFE0-B975-4623-92A2-7EF105E0C428');
        form_data.append('codeSystemKey', $scope.scopedObject.id);
        form_data.append('language', $scope.uploadTerm.language);
        SanteDB.display.buttonWait("#uploadReferenceTermSheetButton", true);
        $.ajax({
            cache: false,
            contentType: false,
            processData: false,
            method: 'POST',
            dataType: 'json',
            url: "/ami/ForeignData",
            data: form_data,
            success: function (data) {

                try {
                    if (data.issue.length == 0) {
                        toastr.success(SanteDB.locale.getString('ui.admin.alien.upload.success'));
                        if (confirm(SanteDB.locale.getString('ui.admin.concept.codeSystem.upload.run'))) {

                            SanteDB.resources.jobInfo.invokeOperationAsync("2EBF8094-6628-4CEC-93B8-3D623F227722", "start", [data.id]);
                            toastr.success(SanteDB.locale.getString("ui.admin.job.runJob.success"));
                        }
                    }
                    else if (confirm(SanteDB.locale.getString('ui.admin.concept.codeSystem.upload.issue', { issue: data.issue.length }))) {
                        $state.go('santedb-admin.data.import.view', { id: data.id });
                    }
                }
                catch(e) {
                    console.error(e);
                }
                finally {
                    SanteDB.display.buttonWait("#uploadReferenceTermSheetButton", false);
                    $("#uploadTerminologyModal").modal('hide');
                    referenceTermSheetForm.$setPristine();
                    referenceTermSheetForm.$setUntouched();
                    referenceTermSheetForm.$submitted = false;
                }
            },
            error: function (xhr, status, error) {
                toastr.error(SanteDB.locale.getString('ui.admin.alien.upload.error', { status: status, error: error }));
                SanteDB.display.buttonWait("#uploadReferenceTermSheetButton", false);

            }
        });
    }

    // Add reference term to the code system
    async function saveReferenceTerm(newRefTermForm) {
        if (newRefTermForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#addNewRefTermButtonActions button:not([data-toggle])", true);

            // First - we want to prepare a submission bundle
            var submissionBundle = new Bundle({ resource: [] });
            var refTerm = angular.copy($scope.edit.referenceTerm);
            refTerm.id = refTerm.id || SanteDB.application.newGuid();
            submissionBundle.resource.push(refTerm);

            // Remove old concept maps 
            if (refTerm._originalConcepts) {
                refTerm._originalConcepts.filter(c => c.id).forEach(c => submissionBundle.resource.push(new ConceptReferenceTerm({ id: c.id, operation: BatchOperationType.DeleteInt })));
            }

            // Concept maps
            refTerm.concepts.forEach(map => {
                if (map.$newConcept) {
                    map.source = SanteDB.application.newGuid();
                    submissionBundle.resource.push(new Concept({
                        mnemonic: map.$newConcept,
                        conceptClass: ConceptClassKeys.Other,
                        id: map.source,
                        name: {
                            $other: refTerm.name.$other.map(n => new ConceptName({ language: n.language, value: n.value }))
                        },
                        statusConcept: StatusKeys.Active
                    }));
                }
                submissionBundle.resource.push(new ConceptReferenceTerm({
                    term: refTerm.id,
                    source: map.source,
                    relationshipType: map.relationshipType
                }));
            });

            mappings = {};
            // Register the refenrece term
            if (!newRefTermForm.$pristine) {
                var result = await SanteDB.resources.bundle.insertAsync(submissionBundle);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.codeSystem.saveTerm.success", { mnemonic: refTerm.mnemonic }));

                if ($scope.edit.referenceTerm.$then == 'another') {
                    $timeout(() => {
                        $scope.edit.referenceTerm = angular.copy($scope.refTermTemplate);
                        newRefTermForm.$setPristine();
                        newRefTermForm.$setUntouched();
                        $scope.quickAddReferenceTermForm.$setUntouched();
                        $scope.quickAddReferenceTermForm.$setPristine();
                        $scope.quickAddReferenceTermForm.$submitted = false;
                        newRefTermForm.$submitted = false;
                        newRefTermForm.$valid = false;
                        newRefTermForm.$invalid = true;

                    });
                }
                else {
                    $("#addReferenceTermModal").modal('hide');
                }
            }
            else {
                $("#addReferenceTermModal").modal('hide');
            }

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#addNewRefTermButtonActions button:not([data-toggle])", false);
        }
    }

    // remove a reference term
    async function removeConceptReferenceTerm(id, index) {
        try {
            SanteDB.display.buttonWait(`#action_grp_${index}`, true);

            if (confirm(SanteDB.locale.getString("ui.admin.concept.codeSystem.remove.referenceTerm.confirm"))) {
                var result = await SanteDB.resources.referenceTerm.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.codeSystem.remove.referenceTerm.success", { mnemonic: result.mnemonic }));
                $("#CodeSystemRefTermTable table").DataTable().draw();
            }

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait(`#action_grp_${index}`, false);
        }
    }

    // Save code system
    async function saveCodeSystem(codeSystemForm) {
        if (codeSystemForm.$invalid) return;

        try {
            // Update
            var codeSystem = await SanteDB.resources.codeSystem.updateAsync($scope.editObject.id, $scope.editObject);
            toastr.success(SanteDB.locale.getString("ui.admin.codeSystem.save.success"));
            $timeout(() => {
                SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'codeSystem'], codeSystem);
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Un-delete
    async function unDelete() {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.codeSystem.unDelete.confirm"))) {
            try {
                // Patch the code system
                var patch = new Patch({
                    change: [
                        new PatchOperation({
                            op: PatchOperationType.Remove,
                            path: 'obsoletionTime',
                            value: null
                        }),
                        new PatchOperation({
                            op: PatchOperationType.Remove,
                            path: 'obsoletedBy',
                            value: null
                        })
                    ]
                });

                await SanteDB.resources.codeSystem.patchAsync($scope.scopedObject.id, null, patch);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.codeSystem.unDelete.success"));
                var codeSystem = await SanteDB.resources.codeSystem.getAsync($scope.scopedObject.id, 'concept');

                $timeout(() => {
                    SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'codeSystem'], codeSystem);
                });

            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.codeSystem.unDelete.error", { e: e.message }));
            }
        }
    }

    $scope.$watch("editObject.authority", async function (n, o) {
        if (n != o && n && n.length > 1 && n && o) {
            var valid = !await checkDuplicate({ authority: n  });
            $timeout(() =>{
                if($scope.panel.editForm) // HACK: Since this controller is used in multiple panels
                    $scope.panel.editForm.codeSystemAuthority.$setValidity('duplicate', valid);
            });
        }
    });

    $scope.$watch("editObject.oid", async function (n, o) {
        if (n != o && n && n.length > 1 && n && o) {
            var valid = !await checkDuplicate({ oid: n });
            $timeout(() =>{
                if($scope.panel.editForm) // HACK: Since this controller is used in multiple panels
                    $scope.panel.editForm.codeSystemOid.$setValidity('duplicate', valid);
            });
        }
    });

    $scope.$watch("editObject.url", async function (n, o) {
        if (n != o && n && n.length > 1 && n && o) {
            var valid = !await checkDuplicate({ url: n });
            $timeout(() =>{
                if($scope.panel.editForm) // HACK: Since this controller is used in multiple panels
                    $scope.panel.editForm.codeSystemUrl.$setValidity('duplicate', valid);
            });
        }
    });

    $scope.saveReferenceTerm = saveReferenceTerm;
    $scope.saveCodeSystem = saveCodeSystem;
    $scope.edit = { referenceTerm: angular.copy($scope.refTermTemplate) };
    $scope.removeConceptReferenceTerm = removeConceptReferenceTerm;
    $scope.uploadReferenceTermSheet = uploadReferenceTermSheet;
    $scope.unDelete = unDelete;

    $scope.uploadReferenceTermFile = function () {
        $("#uploadTerminologyModal").modal('show');
    }

    $scope.addReferenceTerm = function () {
        initializeModalEvent();
        $timeout(() => {
            $scope.edit.referenceTerm = angular.copy($scope.refTermTemplate);
            $("#addReferenceTermModal").modal('show');
        });
    }

    $scope.editReferenceTerm = async function (id, index) {
        try {
            initializeModalEvent();
            await SanteDB.resources.referenceTerm.checkoutAsync(id);
            var refTerm = await SanteDB.resources.referenceTerm.getAsync(id);
            var mappings = await SanteDB.resources.conceptReferenceTerm.findAsync({ term: id }, 'reverseRelationship');

            // Name comes in the format of { lang: [values] } so we have to normalize these to $other
            var newName = [];
            if(refTerm.name) {
                Object.keys(refTerm.name).forEach(k => { refTerm.name[k].forEach(v => newName.push(new ReferenceTermName({ language: k, value: v }))) });
            }
            refTerm.name = { $other: newName };
            refTerm.concepts = mappings.resource || [ { relationshipType: '2c4dafc2-566a-41ae-9ebc-3097d7d22f4a' } ];
            refTerm._originalConcepts = angular.copy(mappings.resource);
            $timeout(() => {
                $scope.edit.referenceTerm = refTerm;
                $("#addReferenceTermModal").modal('show');
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }
    $scope.renderName = function (term) {
        return SanteDB.display.renderConcept(term);
    }

    $scope.renderMappings = function (term) {
        try {
            if (term.concepts) {
                return term.concepts.map(map => `<span class="badge badge-info">${map.relationshipTypeModel.name}</span> <a ui-sref="santedb-admin.concept.concepts.view({id: '${map.source}'})"> ${map.sourceModel.mnemonic}</a>`).join(', ');
            }
            else {
                return SanteDB.locale.getString("ui.none");
            }
        }
        catch (e) {
            return "";
        }
    }

    $scope.loadReferenceTermMappings = async function (refTerm) {
        try {
            var mappings = await SanteDB.resources.conceptReferenceTerm.findAsync({ 'term': refTerm.id }, 'reverseRelationship');
            refTerm.concepts = mappings.resource;
        }
        catch (e) {
            console.warn(e);
        }
        return refTerm;
    }


}]);