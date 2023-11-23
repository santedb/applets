/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('CdssEditController', ["$scope", "$rootScope", "$timeout", "$state", "$stateParams", function ($scope, $rootScope, $timeout, $state, $stateParams) {

    
    async function checkDuplicate(query) {
        try {
            query._includeTotal = true;
            query._count = 0;
            query._upstream = true;
            var duplicate = await SanteDB.resources.cdssLibraryDefinition.findAsync(query);
            return duplicate.size == 0;
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }

    async function initializeView(id) {
        try {
            var cdssLibrary = await SanteDB.resources.cdssLibraryDefinition.getAsync(id);
            $timeout(() => $scope.cdssLibrary = cdssLibrary);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    if ($stateParams.id) {
        initializeView($stateParams.id);
    }
    else {
        $scope.cdssLibrary = {
            "$type": "CdssLibraryDefinitionInfo",
            _mode: 'upload',
            library: {
            }
        }
    };

    async function saveCdssLibrary(form) {
        // Mark duplicates
        var failedValidation = false;
        if($scope.cdssLibrary.library.oid) {
            var valid = await checkDuplicate({oid: $scope.cdssLibrary.library.oid});
            $timeout(() => $scope.panel.editForm.libraryOid.$setValidity('duplicate', valid));
            failedValidation = valid;
        }
        if($scope.cdssLibrary.library.id) {
            var valid = await checkDuplicate({id: $scope.cdssLibrary.library.id});
            $timeout(() => $scope.panel.editForm.libraryId.$setValidity('duplicate', valid));
            failedValidation = valid;
        }
        if($scope.cdssLibrary.library.name) {
            var valid = await checkDuplicate({name: $scope.cdssLibrary.library.name});
            $timeout(() => $scope.panel.editForm.libraryName.$setValidity('duplicate', valid));
            failedValidation = valid;
        }

        if (form.$invalid || failedValidation) {
            return;
        }

        SanteDB.display.buttonWait("#btnSaveLibrary", true);

        switch ($scope.cdssLibrary._mode) {
            case 'upload':
                uploadCdssLibraryDefinition(form);
                return;
            default:
                try {
                    SanteDB.display.buttonWait("#btnSaveLibrary", true);

                    var library = null;
                    if($scope.cdssLibrary.id) {
                        library = await SanteDB.resources.cdssLibraryDefinition.updateAsync($scope.cdssLibrary.id, $scope.cdssLibrary, true);
                    }
                    else {
                        library = await SanteDB.resources.cdssLibraryDefinition.insertAsync($scope.cdssLibrary, true);
                    }

                    toastr.success(SanteDB.locale.getString("ui.admin.cdss.create.success"));
                    $state.go("santedb-admin.cdss.view", { id: library.id });

                }
                catch (e) {
                    $rootScope.errorHandler(e);
                }
                finally {
                    SanteDB.display.buttonWait("#btnSaveLibrary", false);
                }
        }
    }

    function uploadCdssLibraryDefinition(form) {
        var file_data = form.source.$$element.prop('files')[0];
        var form_data = new FormData();
        form_data.append('source', file_data);
        SanteDB.display.buttonWait("#btnSaveLibrary", true);
        $.ajax({
            cache: false,
            contentType: false,
            processData: false,
            headers: {
                "X-SanteDB-Upstream": true
            },
            method: 'POST',
            dataType: 'json',
            url: "/ami/CdssLibraryDefinition",
            data: form_data,
            success: function (data) {
                try {
                    if (!data.issue || data.issue.length == 0) {
                        toastr.success(SanteDB.locale.getString('ui.admin.cdss.upload.success'));
                        $state.go('santedb-admin.cdss.view', { id: data.id });
                    }
                    else {
                        toastr.success(SanteDB.locale.getString('ui.admin.cdss.upload.error', { error: data.message }));
                        $rootScope.errorHandler(data);
                    }
                }
                catch (e) {
                    console.error(e);
                }
                finally {
                    SanteDB.display.buttonWait("#btnSaveLibrary", false);
                }
            },
            error: function (xhr, status, error) {
                $rootScope.errorHandler(xhr.responseJSON);
                toastr.error(SanteDB.locale.getString('ui.admin.cdss.upload.error', { status: status, error: error }));
                SanteDB.display.buttonWait("#btnSaveLibrary", false);

            }
        });
    }


    $scope.saveCdssLibrary = saveCdssLibrary;
}]);