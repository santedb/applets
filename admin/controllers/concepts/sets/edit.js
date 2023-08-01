/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('EditConceptSetController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

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

    // Initialize the view
    async function initializeView(id) {
        try {
            var conceptSet = await SanteDB.resources.conceptSet.getAsync(id, "full");
            $timeout(() => $scope.conceptSet = conceptSet);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Save code system
    async function saveConceptSet(conceptSetForm) {
        if (conceptSetForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#saveConceptSetButton", true);
            // Update
            var conceptSet = null;
            if ($stateParams.id) {
                conceptSet = await SanteDB.resources.conceptSet.updateAsync($stateParams.id, $scope.conceptSet);
            }
            else {
                conceptSet = await SanteDB.resources.conceptSet.insertAsync($scope.conceptSet);
            }

            toastr.success(SanteDB.locale.getString("ui.admin.conceptSet.save.success"));

            if (!$stateParams.id) {
                $state.go("santedb-admin.concept.conceptSet.view", { id: conceptSet.id });
            }
            else {
                $timeout(() => $scope.conceptSet = conceptSet);
            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveConceptSetButton", false);
        }
    }

    // Initialize view for load or create
    if ($stateParams.id) {
        initializeView($stateParams.id);
    }
    else {
        $scope.conceptSet = new ConceptSet();
        $scope.$watch("conceptSet.mnemonic", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ mnemonic: n });
                $timeout(() => $scope.createConceptSetForm.conceptMnemonic.$setValidity('duplicate', valid));
            }
        });
    
        $scope.$watch("conceptSet.oid", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ oid: n });
                $timeout(() => $scope.createConceptSetForm.conceptSetOid.$setValidity('duplicate', valid));
            }
        });
    
        $scope.$watch("conceptSet.url", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ url: n });
                $timeout(() => $scope.createConceptSetForm.conceptSetUrl.$setValidity('duplicate', valid));
            }
        });
    
    }
    // Bind to scope
    $scope.saveConceptSet = saveConceptSet;

    // Download code system
    $scope.downloadConceptSet = function(id) {
        window.open(`/hdsi/ConceptSet/${id}/_export?_include=Concept:conceptSet%3d${id}%26_exclude=conceptSet%26_exclude=referenceTerm&_includesFirst=true`, '_blank').onload = function (e) {
            win.close();
        };
    }
}]);
