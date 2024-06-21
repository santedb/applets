/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="./codeEditor.js"/>
angular.module('santedb').controller('CdssEditController', ["$scope", "$rootScope", "$timeout", "$state", "$stateParams", "$interval", "$transitions", function ($scope, $rootScope, $timeout, $state, $stateParams, $interval, $transitions) {

    var _editor = null;
    var _editorDirty = _validationDirty = false;
    $scope.dirty = () => _editorDirty;

    // Clean the object so the JSON.Stringify works
    function cleanObject(object) {

        if (!object) {
            return object;
        }
        else if (object.$type == "Concept") {
            return {
                $type: "Concept",
                mnemonic: object.mnemonic,
                id: object.id,
                name: object.name
            };
        }
        else if (Array.isArray(object)) {
            for (var idx in object) {
                object[idx] = cleanObject(object[idx]);
            }
        }
        else if (typeof object !== "string" && typeof object !== "number" && !(object instanceof Date) && typeof object !== "boolean") {
            Object.keys(object).forEach(k => object[k] = cleanObject(object[k]));
        }

        return object;
    }
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

            var libraryDefinition = await SanteDB.resources.cdssLibraryDefinition.getAsync(id, null, null, true);
            $timeout(() => {
                $scope.cdssLibrary = libraryDefinition;
            });

            if (ace && $("#cdssEditor").length == 1) {

                var cdssTxtSource = await SanteDB.api.ami.getAsync({
                    resource: `CdssLibraryDefinition/${id}`,
                    dataType: 'text',
                    headers: {
                        'X-SanteDB-Upstream': true
                    },
                    query: {
                        _format: 'txt'
                    }
                });

                
                await SanteDB.resources.cdssLibraryDefinition.checkoutAsync(libraryDefinition.id, true);

                _editor = new CdssAceEditor('cdssEditor', cdssTxtSource, $scope.cdssLibrary.library.id, id);
                _editor.onChange(() => _validationDirty = _editorDirty = true);
                _editor.onAnnotationChange((issues) => $timeout(() => $scope.validationIssues = issues));
                validateInterval = $interval(_editor.validateEditor, 5000);
                window.onbeforeunload = (e) => _editorDirty ? SanteDB.locale.getString("ui.action.abandon.confirm") : null;
                $transitions.onBefore({ from: "santedb-admin.emr.cdss.*", to: "santedb-admin.*" },
                    (transition) => {
                        if (_editorDirty && !confirm(SanteDB.locale.getString("ui.action.abandon.confirm"))) {
                            $("#pageTransitioner").hide();
                            transition.abort();
                        }
                    });
                _editor.validateEditor(true);
                $scope.$on('$destroy', function (s) {
                    $interval.cancel(validateInterval);
                    SanteDB.resources.cdssLibraryDefinition.checkinAsync(s.currentScope.cdssLibrary.id, true);
                    window.onbeforeunload = null;
                });
            }
            else {
                var libraryHistory = await SanteDB.resources.cdssLibraryDefinition.findAssociatedAsync(id, "_history", null, null, true);
                $timeout(() => {
                    $scope.cdssLibrary._history = libraryHistory.resource;
                });
            }
        }
        catch (e) {
            if (e.$type == "ObjectLockedException") {
                $timeout(() => $scope.lock = e.message);
                _editor.setReadOnly(true);
            }
            else {
                $rootScope.errorHandler(e);
            }
        }
    }

    $scope.gotoIssue = function (issue) {
        _editor.gotoIssue(issue);
    }

    if ($stateParams.id) {
        initializeView($stateParams.id);
        $scope.test = {
            type: 'Patient',
            source: 'db',
            new: '{ "$type": "Patient" }',
            parameters: [
                { name: "debug", value: "true" }
            ]
        }
        $scope.$watch("test.type", function (n, o) {
            if (n && n != o) {

                $scope.test.new = `{ "$type" : "${$scope.test.type}" }`;
            }
        });
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
        if ($scope.cdssLibrary.library.oid) {
            var valid = await checkDuplicate({ oid: $scope.cdssLibrary.library.oid });
            $timeout(() => $scope.saveCdssLibraryForm.libraryOid.$setValidity('duplicate', valid));
            failedValidation |= !valid;
        }
        if ($scope.cdssLibrary.library.id) {
            var valid = await checkDuplicate({ id: $scope.cdssLibrary.library.id });
            $timeout(() => $scope.saveCdssLibraryForm.libraryId.$setValidity('duplicate', valid));
            failedValidation |= !valid;
        }
        if ($scope.cdssLibrary.library.name) {
            var valid = await checkDuplicate({ name: $scope.cdssLibrary.library.name });
            $timeout(() => $scope.saveCdssLibraryForm.libraryName.$setValidity('duplicate', valid));
            failedValidation |= !valid;
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
                    if ($scope.cdssLibrary.id) {
                        library = await SanteDB.resources.cdssLibraryDefinition.updateAsync($scope.cdssLibrary.id, $scope.cdssLibrary, true);
                    }
                    else {
                        $scope.cdssLibrary.library.status = 'DontUse';
                        library = await SanteDB.resources.cdssLibraryDefinition.insertAsync($scope.cdssLibrary, true);
                        $state.go("santedb-admin.cdr.cdss.edit", { id: library.id });
                    }

                    toastr.success(SanteDB.locale.getString("ui.admin.cdss.create.success"));

                }
                catch (e) {
                    $rootScope.errorHandler(e);
                }
                finally {
                    SanteDB.display.buttonWait("#btnSaveLibrary", false);
                }
        }
    }

    function uploadCdssLibraryDefinition(form, originalId) {
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
            method: originalId ? 'PUT' : 'POST',
            dataType: 'json',
            url: originalId ? `/ami/CdssLibraryDefinition/${originalId}` : "/ami/CdssLibraryDefinition",
            data: form_data,
            success: function (data) {
                try {
                    if (!data.issue || data.issue.length == 0) {
                        toastr.success(SanteDB.locale.getString('ui.admin.cdss.upload.success'));
                        if (!originalId) {
                            $state.go('santedb-admin.cdr.cdss.view', { id: data.id });
                        }
                        else {
                            $state.reload();
                        }
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

    $scope.downloadCdssLibrary = function (format) {
        var win = window.open(`/ami/CdssLibraryDefinition/${$scope.cdssLibrary.id}?_format=${format}&_upstream=true`, '_blank');
        win.onload = function (e) {
            win.close();
        };
    }

    $scope.uploadReplacementLibrary = function () {
        $("#uploadCdssLibraryModal").modal('show');
    }

    $scope.saveCdssLibrary = saveCdssLibrary;
    $scope.uploadCdssLibraryDefinition = function (form) {
        if (form.$invalid) {
            return;
        }
        uploadCdssLibraryDefinition(form, $scope.cdssLibrary.id);
    }

    $scope.performTest = async function (form) {
        if (form.$invalid) {
            return;
        }

        $timeout(() => {
            $scope.test.result = null;
        })

        try {

            SanteDB.display.buttonWait("#btnRunTest", true);

            var parms = {
                "isTesting": true,
                "debug": true,
                "definition": _editor.getValue(),
                "targetType": $scope.test.type
            };

            if ($scope.test.source == "db") {
                parms.targetId = $scope.test.db;
            }
            else {
                parms.target = $scope.test.new;
            }

            $scope.test.parameters.forEach(p => parms[p.name] = p.value);
            var executionResult = await SanteDB.resources.cdssLibraryDefinition.invokeOperationAsync($stateParams.id, "execute", parms, true);
            if (executionResult.target) {
                executionResult.target = await SanteDB.resources[executionResult.target.$type.toCamelCase()].invokeOperationAsync(null, "expand", { "object": executionResult.target }, false);
            }

            var loadedResults = await SanteDB.resources.act.invokeOperationAsync(null, "expand", {
                "object": new Bundle({
                    resource: executionResult.propose.filter((o, i) => i <= 20)
                })
            });
            loadedResults = loadedResults.resource;

            for (var idx in executionResult.propose) {
                executionResult.propose[idx] = cleanObject(loadedResults.find(o => o.id == executionResult.propose[idx].id));
            }
            $timeout(() => {
                $scope.test.result = executionResult;
            })
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnRunTest", false);
        }
    }
}]);