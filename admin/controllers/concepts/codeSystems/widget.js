/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('CodeSystemWidgetController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

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

    $scope.saveCodeSystem = saveCodeSystem;

}]);