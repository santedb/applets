/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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