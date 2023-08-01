/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('EditCodeSystemController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

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

    // Initialize the view
    async function initializeView(id) {
        try {
            var codeSystem = await SanteDB.resources.codeSystem.getAsync(id, "full");
            $timeout(() => $scope.codeSystem = codeSystem);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Save code system
    async function saveCodeSystem(codeSystemForm) {
        if (codeSystemForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#saveCodeSystemButton", true);
            // Update
            var codeSystem = null;
            if ($stateParams.id) {
                codeSystem = await SanteDB.resources.codeSystem.updateAsync($stateParams.id, $scope.codeSystem);
            }
            else {
                codeSystem = await SanteDB.resources.codeSystem.insertAsync($scope.codeSystem);
            }

            toastr.success(SanteDB.locale.getString("ui.admin.codeSystem.save.success"));

            if (!$stateParams.id) {
                $state.go("santedb-admin.concept.codeSystem.view", { id: codeSystem.id });
            }
            else {
                $timeout(() => $scope.codeSystem = codeSystem);
            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveCodeSystemButton", false);
        }
    }

    // Initialize view for load or create
    if ($stateParams.id) {
        initializeView($stateParams.id);
    }
    else {
        $scope.codeSystem = new CodeSystem();
        $scope.$watch("codeSystem.authority", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ authority: n });
                $timeout(() => $scope.createCodeSystemForm.codeSystemAuthority.$setValidity('duplicate', valid));
            }
        });
    
        $scope.$watch("codeSystem.oid", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ oid: n });
                $timeout(() => $scope.createCodeSystemForm.codeSystemOid.$setValidity('duplicate', valid));
            }
        });
    
        $scope.$watch("codeSystem.url", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ url: n });
                $timeout(() => $scope.createCodeSystemForm.codeSystemUrl.$setValidity('duplicate', valid));
            }
        });
    
    }
    // Bind to scope
    $scope.saveCodeSystem = saveCodeSystem;

    // Download code system
    $scope.downloadCodeSystem = function(id) {
        window.open(`/hdsi/CodeSystem/${id}/_export?_include=ReferenceTerm:codeSystem%3d${id}&_include=Concept:referenceTerm.term.codeSystem%3d${id}%26_exclude=relationship%26_exclude=conceptSet&_include=ConceptReferenceTerm:term.codeSystem%3d${id}`, '_blank').onload = function (e) {
            win.close();
        };
    }
}]);
