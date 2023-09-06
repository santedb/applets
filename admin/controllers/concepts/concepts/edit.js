/// <reference path="../../../../core/js/santedb.js"/>
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
            var concept = await SanteDB.resources.concept.getAsync(id, "full");
            $timeout(() => $scope.concept = concept);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Save code system
    async function saveConcept(conceptForm) {
        if (conceptForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#saveConceptButton", true);
            // Update
            var concept = null;
            if ($stateParams.id) {
                concept = await SanteDB.resources.concept.updateAsync($stateParams.id, $scope.concept);
            }
            else {
                concept = await SanteDB.resources.concept.insertAsync($scope.concept);
            }

            toastr.success(SanteDB.locale.getString("ui.admin.concept.save.success"));

            if (!$stateParams.id) {
                $state.go("santedb-admin.concept.concept.view", { id: concept.id });
            }
            else {
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
            referenceTerm: [
            ]
        });
        $scope.$watch("concept.mnemonic", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate(n);
                $timeout(() => $scope.createConceptForm.conceptMnemonic.$setValidity('duplicate', valid));
            }
        });
    
    }
    // Bind to scope
    $scope.saveConcept = saveConcept;

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
        window.open(`/hdsi/Concept/${id}/_export?_include=ConceptSet:concept%3d${id}%26_exclude=concept&_include=CodeSystem:${codeSys.join('%26')}&_include=ReferenceTerm:${refTerms.join('%26')}&_exclude=previousVersion&_includesFirst=true&_include=ConceptSet:compose.source=${id}%26_include=ReferenceTerm:concept.source=${id}%26_include=CodeSystem:referenceTerm.concept.source=${id}`, '_blank').onload = function (e) {
            win.close();
        };
    }
}]);
