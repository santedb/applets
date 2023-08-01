/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('ConceptSetWidgetController', ["$scope", "$rootScope", "$timeout", "$state", function ($scope, $rootScope, $timeout, $state) {

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
        referenceTerm: {
            $other: [new ConceptReferenceTerm({
                relationshipType: ConceptRelationshipTypeKeys.SameAs
            })
            ]
        },
        relationship: {
            $other: [
                new ConceptRelationship({
                    relationshipType: ConceptRelationshipTypeKeys.SameAs
                })
            ]
        },
        statusConcept: StatusKeys.Active,
    });


    var _areEventsInitialized = false;

    // Initialize the BS modal events
    function initializeModalEvent() {
        if (!_areEventsInitialized) {
            // User has closed the add modal so we want to reset the new
            $("#addConceptModal").on('hidden.bs.modal', function () {
                // Check in 
                if ($scope.edit.referenceTerm.id) {
                    SanteDB.resources.referenceTerm.checkinAsync($scope.edit.referenceTerm.id);
                }
                $("#ConceptSetMemberTable table").DataTable().draw();
            });
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
    function uploadConceptSheet(conceptSheetForm) {

        var file_data = conceptSheetForm.source.$$element.prop('files')[0];
        var form_data = new FormData();
        form_data.append('source', file_data);
        form_data.append('description', 'Automatically submitted via the ConceptSet management portal');
        form_data.append('map', '');
        form_data.append('codeSystemKey', $scope.scopedObject.id);
        form_data.append('language', $scope.uploadConcepts.language);
        SanteDB.display.buttonWait("#uploadConceptSetSheetButton", true);
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
                catch (e) {
                    console.error(e);
                }
                finally {
                    SanteDB.display.buttonWait("#uploadConceptSetSheetButton", false);
                    $("#uploadConceptSetModal").modal('hide');
                    conceptSheetForm.$setPristine();
                    conceptSheetForm.$setUntouched();
                    conceptSheetForm.$submitted = false;
                }
            },
            error: function (xhr, status, error) {
                toastr.error(SanteDB.locale.getString('ui.admin.alien.upload.error', { status: status, error: error }));
                SanteDB.display.buttonWait("#uploadConceptSetSheetButton", false);

            }
        });
    }

    // Add reference term to the code system
    async function saveConcept(newConceptForm) {
        if (newConceptForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#addNewConceptButtonActions button:not([data-toggle])", true);

            // First - we want to prepare a submission bundle
            var submissionBundle = new Bundle({ resource: [] });
            var concept = angular.copy($scope.edit.concept);
            concept.id = concept.id || SanteDB.application.newGuid();
            submissionBundle.resource.push(concept);

            // TODO: Ensure that proper entity cleanup is performed prior to submitting

            mappings = {};
            // Register the refenrece term
            if (!newConceptForm.$pristine) {
                var result = await SanteDB.resources.bundle.insertAsync(submissionBundle);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.codeSystem.saveTerm.success", { mnemonic: concept.mnemonic }));

                if ($scope.edit.referenceTerm.$then == 'another') {
                    $timeout(() => {
                        $scope.edit.concept = angular.copy($scope.conceptTemplate);
                        newConceptForm.$setPristine();
                        newConceptForm.$setUntouched();
                        $scope.quickAddConceptForm.$setUntouched();
                        $scope.quickAddConceptForm.$setPristine();
                        $scope.quickAddConceptForm.$submitted = false;
                        newConceptForm.$submitted = false;
                        newConceptForm.$valid = false;
                        newConceptForm.$invalid = true;

                    });
                }
                else {
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
            SanteDB.display.buttonWait("#addNewConceptButtonActions button:not([data-toggle])", false);
        }
    }

    // remove a reference term
    async function removeConceptMember(id, index) {
        try {
            SanteDB.display.buttonWait(`#action_grp_${index}`, true);

            if (confirm(SanteDB.locale.getString("ui.admin.concept.conceptSet.remove.concept.confirm"))) {
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
            // Update
            var conceptSet = await SanteDB.resources.conceptSet.updateAsync($scope.editObject.id, $scope.editObject);
            toastr.success(SanteDB.locale.getString("ui.admin.conceptSet.save.success"));
            $timeout(() => {
                SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'conceptSet'], conceptSet);
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
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
                var conceptSet = await SanteDB.resources.conceptSet.getAsync($scope.scopedObject.id, 'full');

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
    $scope.saveConcept = saveConcept;
    $scope.edit = { concept: angular.copy($scope.conceptTemplate) };
    $scope.removeConceptMember = removeConceptMember;
    $scope.uploadConceptSheet = uploadConceptSheet;
    $scope.unDelete = unDelete;

    $scope.uploadConceptSheet = function () {
        $("#uploadConceptSetModal").modal('show');
    }

    $scope.addConcept = function () {
        initializeModalEvent();
        $timeout(() => {
            $scope.edit.concept = angular.copy($scope.conceptTemplate);
            $("#addConceptModal").modal('show');
        });
    }

    $scope.editConcept = async function (id, index) {
        try {
            initializeModalEvent();
            await SanteDB.resources.concept.checkoutAsync(id);
            var concept = await SanteDB.resources.concept.getAsync(id, 'full');

            // Name comes in the format of { lang: [values] } so we have to normalize these to $other
            var newName = [], newTerms = [], newRelationships = [];
            Object.keys(concept.name).forEach(k => { concept.name[k].forEach(v => newName.push(new ConceptName({ language: k, value: v }))) });
            Object.keys(concept.relationship).forEach(k => {
                concept.relationship[k].forEach(v => {
                    var newRel = new ConceptRelationship(v);
                    newRel.relationshipType = k;
                    newRelationships.push(newRel);
                })
            });;
            Object.keys(concept.referenceTerm).forEach(k => { concept.relationship[k].forEach(v => newTerms.push(new ConceptReferenceTerm(v))) });
            concept.name = { $other: newName };
            concept.relationship = {$other: newRelationships};
            concept.referenceTerm = {$other: newTerms};
            $timeout(() => {
                $scope.edit.concept = concept;
                $("#addConceptModal").modal('show');
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.renderName = function (concept) {
        return SanteDB.display.renderConcept(concept);
    }


}]);