/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('CodeSystemWidgetController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

    var refTermTemplate = {
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

    // Check for duplicates
    async function checkDuplicate(query) {
        try {
            query._count = 0;
            query._includeTotal = true;
            var duplicate = await SanteDB.resources.codeSystem.findAsync(query);
            return duplicate.totalResults > 0;
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }

    // Add reference term to the code system
    async function addReferenceTerm(newRefTermForm) {
        if (newRefTermForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#addNewRefTermButton", true);

            // First - we want to prepare a submission bundle
            var submissionBundle = new Bundle({ resource: [] });
            var refTerm = angular.copy($scope.newReferenceTerm);
            refTerm.id = SanteDB.application.newGuid();
            submissionBundle.resource.push(refTerm);

            // Concept maps
            refTerm.concepts.forEach(map => {
                if (map.$newConcept) {
                    map.source = SanteDB.application.newGuid();
                    submissionBundle.resource.push(new Concept({
                        mnemonic: map.$newConcept,
                        conceptClass: ConceptClassKeys.Other,
                        id: map.source,
                        name: refTerm.name,
                        referenceTerm: [
                            new ConceptReferenceTerm({
                                term: refTerm.id,
                                relationshipType: map.relationshipType
                            })
                        ]
                    }));
                }
                else {
                    submissionBundle.resource.push(new ConceptReferenceTerm({
                        term: refTerm.id,
                        source: map.source,
                        relationshipType: map.relationshipType
                    }));
                }
            });

            mappings = {};
            // Register the refenrece term
            var result = await SanteDB.resources.bundle.insertAsync(submissionBundle);
            toastr.success(SanteDB.locale.getString("ui.admin.codeSystem.addTerm.success", { term: refTerm.mnemonic }));
            // Refresh any tables 
            $("#CodeSystemRefTermTable table").DataTable().draw();

            $timeout(() => {
                $scope.newReferenceTerm = angular.copy(refTermTemplate);
            })
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#addNewRefTermButton", false);
        }
    }
    // Save code system
    async function saveCodeSystem(codeSystemForm) {
        if (codeSystemForm.$invalid) return;

        try {
            // Update
            var codeSystem = await SanteDB.resources.codeSystem.updateAsync($scope.editObject.id, $scope.editObject);
            toastr.success(SanteDB.locale.getString("ui.admin.codeSystem.save.success"));
            SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'codeSystem'], codeSystem);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.$watch("editObject.authority", async function (n, o) {
        if (n != o && n && n.length > 1) {
            var valid = !await checkDuplicate({ authority: n, id: `!${$scope.editObject.id}` });
            $timeout(() => $scope.panel.editForm.codeSystemAuthority.$setValidity('duplicate', valid));
        }
    });

    $scope.$watch("editObject.oid", async function (n, o) {
        if (n != o && n && n.length > 1) {
            var valid = !await checkDuplicate({ oid: n, id: `!${$scope.editObject.id}` });
            $timeout(() => $scope.panel.editForm.codeSystemOid.$setValidity('duplicate', valid));
        }
    });

    $scope.$watch("editObject.url", async function (n, o) {
        if (n != o && n && n.length > 1) {
            var valid = !await checkDuplicate({ url: n, id: `!${$scope.editObject.id}` });
            $timeout(() => $scope.panel.editForm.codeSystemUrl.$setValidity('duplicate', valid));
        }
    });

    $scope.addReferenceTerm = addReferenceTerm;
    $scope.saveCodeSystem = saveCodeSystem;
    $scope.newReferenceTerm = angular.copy(refTermTemplate);

    $scope.renderName = function (term) {
        return SanteDB.display.renderConcept(term);
    }

    $scope.renderMappings = function (term) {
        try {
            if (term.mappings) {
                return term.mappings.map(map => `${map.relationshipTypeModel.name} ${map.sourceModel.mnemonic}`).join(',');
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
            refTerm.mappings = mappings.resource;
        }
        catch (e) {
            console.warn(e);
        }
        return refTerm;
    }
}]);