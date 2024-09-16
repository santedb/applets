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
angular.module('santedb').controller('ConceptSetWidgetController', ["$scope", "$rootScope", "$timeout", "$state", function ($scope, $rootScope, $timeout, $state) {

    var loadedSets = {};
    $scope.uploadTerm = {
        language: SanteDB.locale.getLanguage()
    };

    $scope.conceptTemplate = new Concept({
        name: {
            $other: [
                {
                    language: SanteDB.locale.getLanguage()
                }
            ]
        },
        conceptClass: ConceptClassKeys.Other,
        conceptSet: [$scope.scopedObject.id],
        statusConcept: StatusKeys.Active
    });


    var _areEventsInitialized = false;

    // Initialize the BS modal events
    function initializeModalEvent() {
        if (!_areEventsInitialized) {
            // User has closed the add modal so we want to reset the new
            $("#addConceptModal").on('hidden.bs.modal', function () {
                $("#ConceptSetMemberTable table").DataTable().draw();
            });
            $("#composeConceptSetModal").on("hidden.bs.modal", async function () {
                try {
                    await SanteDB.resources.conceptSet.checkinAsync($scope.scopedObject.id);
                    $("#ConceptSetMemberTable").attr("newQueryId", true);
                    $("#ConceptSetMemberTable table").DataTable().draw();

                }
                catch (e) {
                    console.warn(e);
                }
            })
            _areEventsInitialized = true;
        }
    }

    // Check for duplicates
    async function checkDuplicate(query) {
        try {
            query._count = 0;
            query._includeTotal = true;
            var duplicate = await SanteDB.resources.conceptSet.findAsync(query);
            return duplicate.totalResults > 0;
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }

    // Upload reference term sheet
    function uploadConceptSetSheet(conceptSheetForm) {

        var file_data = conceptSheetForm.source.$$element.prop('files')[0];
        var form_data = new FormData();
        form_data.append('source', file_data);
        form_data.append('description', 'Automatically submitted via the ConceptSet management portal');
        form_data.append('map', '67BEFD0E-B976-FDD0-09AD-D98BCAFD30FE');
        form_data.append('conceptSetKey', $scope.scopedObject.id);
        form_data.append('language', $scope.uploadSet.language);
        SanteDB.display.buttonWait("#uploadConceptSheetButton", true);
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
                        if (confirm(SanteDB.locale.getString('ui.admin.concept.conceptSet.upload.run'))) {

                            SanteDB.resources.jobInfo.invokeOperationAsync("2EBF8094-6628-4CEC-93B8-3D623F227722", "start", [data.id]);
                            toastr.success(SanteDB.locale.getString("ui.admin.job.runJob.success"));
                        }
                    }
                    else if (confirm(SanteDB.locale.getString('ui.admin.concept.conceptSet.upload.issue', { issue: data.issue.length }))) {
                        $state.go('santedb-admin.data.import.view', { id: data.id });
                    }
                }
                catch (e) {
                    console.error(e);
                }
                finally {
                    SanteDB.display.buttonWait("#uploadConceptSheetButton", false);
                    $("#uploadConceptSetModal").modal('hide');
                    conceptSheetForm.$setPristine();
                    conceptSheetForm.$setUntouched();
                    conceptSheetForm.$submitted = false;
                }
            },
            error: function (xhr, status, error) {
                toastr.error(SanteDB.locale.getString('ui.admin.alien.upload.error', { status: status, error: error }));
                SanteDB.display.buttonWait("#uploadConceptSheetButton", false);

            }
        });
    }

    // Add concept to the to set
    async function associateConcept(associateConceptForm) {
        if (associateConceptForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#associateConceptModalButtonActions button:not([data-toggle])", true);

            // First - we want to prepare a submission bundle
            var concept = new Concept(angular.copy($scope.edit.concept));
            // Register the refenrece term
            if (!associateConceptForm.$pristine) {

                // Existing concept or a new concept?
                if (concept.id) {
                    var newPatch = new Patch({
                        appliesTo: {
                            type: "Concept",
                            id: concept.id
                        },
                        change: [
                            {
                                op: PatchOperationType.Add,
                                path: "conceptSet",
                                value: $scope.scopedObject.id
                            }
                        ]
                    });

                    concept = await SanteDB.resources.concept.patchAsync(concept.id, null, newPatch, true);
                }
                else {
                    concept.id = SanteDB.application.newGuid();
                    concept.conceptSet = [$scope.scopedObject.id];
                    concept = await SanteDB.resources.concept.insertAsync(concept);
                }

                toastr.success(SanteDB.locale.getString("ui.admin.concept.conceptSet.add.success"));

                if ($scope.edit.concept.$then == 'another') {
                    $timeout(() => {
                        $scope.edit.concept = angular.copy($scope.conceptTemplate);
                        associateConceptForm.$setPristine();
                        associateConceptForm.$setUntouched();
                        $scope.associateConceptForm.$setUntouched();
                        $scope.associateConceptForm.$setPristine();
                        $scope.associateConceptForm.$submitted = false;
                        associateConceptForm.$submitted = false;
                        associateConceptForm.$valid = false;
                        associateConceptForm.$invalid = true;
                    });
                }
                else {
                    $("#ConceptSetMemberTable table").DataTable().draw();
                    $("#addConceptModal").modal('hide');
                }
            }
            else {
                $("#addConceptModal").modal('hide');
            }

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#associateConceptModalButtonActions button:not([data-toggle])", false);
        }
    }

    // remove a reference term
    async function removeConceptMember(id, index) {
        try {
            SanteDB.display.buttonWait(`#action_grp_${index}`, true);

            if (confirm(SanteDB.locale.getString($scope.scopedObject.createdBy == SanteDB.authentication.SYSTEM_USER ? "ui.admin.concept.conceptSet.remove.concept.confirm.system" : "ui.admin.concept.conceptSet.remove.concept.confirm"))) {
                // Patch the refernece term
                var patch = new Patch({
                    change: [
                        new PatchOperation({
                            op: PatchOperationType.Remove,
                            path: "conceptSet",
                            value: $scope.scopedObject.id
                        })
                    ]
                });
                var result = await SanteDB.resources.concept.patchAsync(id, null, patch);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.conceptSet.remove.concept.success"));
                $("#ConceptSetMemberTable table").DataTable().draw();
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
    async function saveConceptSet(conceptSetForm) {
        if (conceptSetForm.$invalid) return;

        try {

            SanteDB.display.buttonWait("#saveConceptSetButton", true);
            // Update
            var conceptSet = $scope.editObject || $scope.scopedObject;

            // Remove any model objects 
            delete conceptSet.conceptModel;
            if (conceptSet.compose && conceptSet.compose.$other) {
                conceptSet.compose.$other.forEach(o => delete o.targetModel);
            }

            await SanteDB.resources.conceptSet.updateAsync(conceptSet.id, conceptSet);
            conceptSet = await SanteDB.resources.conceptSet.getAsync(conceptSet.id, "concept");
            toastr.success(SanteDB.locale.getString("ui.admin.conceptSet.save.success"));
            $timeout(() => {
                SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'conceptSet'], conceptSet);
                $("#composeConceptSetModal").modal('hide');
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveConceptSetButton", false);

        }
    }

    // Un-delete
    async function unDelete() {
        if (confirm(SanteDB.locale.getString("ui.admin.concept.conceptSet.unDelete.confirm"))) {
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

                await SanteDB.resources.conceptSet.patchAsync($scope.scopedObject.id, null, patch);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.conceptSet.unDelete.success"));
                var conceptSet = await SanteDB.resources.conceptSet.getAsync($scope.scopedObject.id, 'concept');

                $timeout(() => {
                    SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'conceptSet'], conceptSet);

                });

            }
            catch (e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.conceptSet.unDelete.error", { e: e.message }));
            }
        }
    }

    $scope.$watch("editObject.mnemonic", async function (n, o) {
        if (n != o && n && n.length > 1 && o) {
            var valid = !await checkDuplicate({ mnemonic: n, id: `!${$scope.editObject.id}` });
            $timeout(() => $scope.panel.editForm.conceptSetMnemonic.$setValidity('duplicate', valid));
        }
    });

    $scope.$watch("editObject.oid", async function (n, o) {
        if (n != o && n && n.length > 1 && o) {
            var valid = !await checkDuplicate({ oid: n, id: `!${$scope.editObject.id}` });
            $timeout(() => $scope.panel.editForm.conceptSetOid.$setValidity('duplicate', valid));
        }
    });

    $scope.$watch("editObject.url", async function (n, o) {
        if (n != o && n && n.length > 1 && o) {
            var valid = !await checkDuplicate({ url: n, id: `!${$scope.editObject.id}` });
            $timeout(() => $scope.panel.editForm.conceptSetUrl.$setValidity('duplicate', valid));
        }
    });

    $scope.saveConceptSet = saveConceptSet;
    $scope.edit = { concept: angular.copy($scope.conceptTemplate), mode: 'existing' };
    $scope.removeConceptMember = removeConceptMember;
    $scope.uploadConceptSetSheet = uploadConceptSetSheet;
    $scope.associateConcept = associateConcept;
    $scope.unDelete = unDelete;

    $scope.uploadConceptSet = function () {
        $("#uploadConceptSetModal").modal('show');
    }

    // Show the add concept member modal
    $scope.addConceptMember = function () {
        initializeModalEvent();
        $timeout(() => {
            $scope.edit.concept = angular.copy($scope.conceptTemplate);
            $("#addConceptModal").modal('show');
        });
    }

    // Show the composition dialog
    $scope.composeConceptSet = async function () {
        initializeModalEvent();

        try {
            await SanteDB.resources.conceptSet.checkoutAsync($scope.scopedObject.id);
            $timeout(() => {
                $scope.editObject = angular.copy($scope.scopedObject); // Preserve the original
                // Fix the composition from K/V to $other
                if ($scope.editObject.compose) {
                    var newCompose = [];
                    Object.keys($scope.editObject.compose).forEach(k => $scope.editObject.compose[k].forEach(i => newCompose.push(i)));
                    $scope.editObject.compose = { $other: newCompose };
                }
                else {
                    $scope.editObject.compose = { $other: [] };
                }
                $("#composeConceptSetModal").modal('show');
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.renderName = function (concept) {
        return SanteDB.display.renderConcept(concept);
    }

    $scope.$watch("edit.concept.mnemonic", async function(n, o) {
        if(n && o) {
            var existing = await SanteDB.resources.concept.findAsync({ mnemonic: n, _count: 0, _includeTotal: true });
            $timeout(()=> {
                $scope.associateConceptForm.mnemonicInput.$setValidity('duplicate', existing.totalResults == 0);
            });
        }
    })

    $scope.renderIsMember = function (concept) {
        if (!concept.conceptSetModel || concept.conceptSetModel[$scope.scopedObject.mnemonic]) {
            return `<i class='fas fa-circle text-success'></i> ${$scope.scopedObject.mnemonic}`;
            concept._canRemove = true;
        }
        else {
            var firstProperty = Object.keys(concept.conceptSetModel)[0];
            return `<a ui-sref="santedb-admin.concept.conceptSet.view({id: '${concept.conceptSetModel[firstProperty][0].id}'})" target="_blank"><i class='fas fa-circle text-secondary'></i> ${firstProperty}</a>`;
        }
    }
}]);