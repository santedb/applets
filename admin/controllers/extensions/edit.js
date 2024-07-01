/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
angular.module("santedb").controller("EditExtensionTypeController", [ "$scope", "$rootScope", "$timeout", "$stateParams", "$state", function($scope, $rootScope, $timeout, $stateParams, $state) {

    async function initializeView(id) {
        try {
            var extensionType = null;
            if(id) {
                extensionType = await SanteDB.resources.extensionType.getAsync(id, 'full');
            }
            else {
                extensionType = new ExtensionType();
            }

            var handlerClasses = await SanteDB.resources.extensionType.invokeOperationAsync(null, 'handlers');
            $timeout(() => {
                $scope.extensionType = extensionType;
                $scope.handlerClasses = handlerClasses.parameter;
            });
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    initializeView($stateParams.id);

    $scope.$watch("extensionType.uri", async function(n, o) {

        if(n && n != o) {
            try {
                var query = { 'uri' : n, _count: 0, _includeTotal: true };
                if($scope.extensionType.id) {
                    query['id'] = `!${$scope.extensionType.id}`;
                }
                var count = await SanteDB.resources.extensionType.findAsync(query);
                $scope.extensionTypeForm.uri.$setValidity('duplicate', count.totalResults == 0);
            }
            catch(e) {
                console.warn(e);
            }
        }
    });

    async function saveExtensionType(form) {
        if(form.$invalid) return;

        try {
            SanteDB.display.buttonWait("#btnSaveExtensionType", true);
            var submissionObject = new ExtensionType($scope.extensionType);
            if(submissionObject.id) {
                await SanteDB.resources.extensionType.updateAsync(submissionObject.id, submissionObject);
                toastr.success(SanteDB.locale.getString("ui.admin.cdr.extensionType.save.success"));
            }
            else {
                await SanteDB.resources.extensionType.insertAsync(submissionObject);
                toastr.success(SanteDB.locale.getString("ui.admin.cdr.extensionType.create.success"));
            }
            $state.go("santedb-admin.cdr.ext.index");

        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSaveExtensionType", false);
        }
    }

    async function restoreExtensionType() {
        if(confirm(SanteDB.locale.getString("ui.admin.cdr.extensionType.restore.confirm"))) {
            try {
                var patch = new Patch({
                    appliesTo: new PatchTarget({
                        type: "EntityExtension",
                        id: $scope.extensionType.id
                    }),
                    change: [
                        new PatchOperation({
                            op: PatchOperationType.Remove,
                            path: "obsoletionTime",
                            value: null
                        }),
                        new PatchOperation({
                            op: PatchOperationType.Remove,
                            path: "obsoletedBy",
                            value: null
                        })
                    ]
                });
                await SanteDB.resources.extensionType.patchAsync($scope.extensionType.id, null, patch, true);
                toastr.success(SanteDB.locale.getString("ui.admin.cdr.extensionType.restore.success"));
                $state.reload();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.cdr.extensionType.restore.error", {error: e.message}));
            }
        }
    }


    
    $scope.unDelete = restoreExtensionType;
    $scope.saveExtensionType = saveExtensionType;
}]);