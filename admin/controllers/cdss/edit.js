/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('CdssEditController', ["$scope", "$rootScope", "$timeout", "$state", "$stateParams", "$interval", "$transitions", function ($scope, $rootScope, $timeout, $state, $stateParams, $interval, $transitions) {

    var _editor = null;
    var _editorDirty = _validationDirty = false;

    var _tooltipElement = document.createElement("div");
    var _uuidRegex = /.*?([a-fA-F0-9]{8}\-(?:[a-fA-F0-9]{4}\-){3}[a-fA-F0-9]{12}).*/;
    var _lookupApi = [
        SanteDB.resources.entity,
        SanteDB.resources.concept,
        SanteDB.resources.conceptSet
    ];



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


    async function validateEditor(force) {
        try {
            var value = _editor.getValue();
            if (force !== true && !_validationDirty) {
                return;
            }

            _validationDirty = false;
            var issues = await SanteDB.resources.cdssLibraryDefinition.invokeOperationAsync(null, "validate", {
                definition: value,
                name: $scope.cdssLibrary.library.id
            }, true);

            _editor.getSession().clearAnnotations();
            if (issues.issue) {
                annotations = issues.issue.map(i => {

                    if (!i.refersTo || i.refersTo.indexOf("@") == -1) {
                        return {
                            row: 0,
                            column: 1,
                            text: i.text,
                            type: i.priority == "Error" ? "error" : i.priority == "Warning" ? "warn" : "info"
                        }; // doesn't apply
                    }
                    var ln = i.refersTo.substring(i.refersTo.indexOf("@") + 1).split(":");
                    return {
                        row: parseInt(ln[0]) - 1,
                        column: parseInt(ln[1]),
                        text: i.text,
                        type: i.priority == "Error" ? "error" : i.priority == "Warning" ? "warning" : "info"
                    };
                });
                _editor.getSession().setAnnotations(annotations);
                $timeout(() => $scope.validationIssues = annotations);
            }
            return issues.issue.find(o => o.priority == 'Error') == null;
        }
        catch (e) {
            console.error(e);
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

                ace.require("ace/ext/language_tools");
                var Range = ace.require("ace/range").Range;

                _editor = ace.edit("cdssEditor", {
                    theme: "ace/theme/sqlserver",
                    mode: "ace/mode/cdss",
                    wrap: true,
                    maxLines: window.innerHeight / 27,
                    minLines: 2,
                    hasCssTransforms: true,
                    value: cdssTxtSource,
                    keyboardHandler: "ace/keyboard/vscode",
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true
                });

                await SanteDB.resources.cdssLibraryDefinition.checkoutAsync(libraryDefinition.id, true);

                _editor.commands.addCommand({
                    name: 'test',
                    bindKey: { win: 'F9', mac: 'F9' },
                    exec: function (editor) {
                        $("#test-tab").tab('show');
                    }
                })
                _editor.commands.addCommand({
                    name: 'goto',
                    bindKey: { win: 'F12', mac: 'F12'},
                    exec: function(editor) {
                        var session = editor.getSession();
                        var currentPosition = editor.getCursorPosition();
                        var findToken = session.getTokenAt(currentPosition.row, currentPosition.column);
                        if(findToken.value.indexOf("\"") !== 0) return;

                        var isInDefintiion = false;
                        
                        for(var line = 0; line < session.getDocument().getAllLines().length; line++) {
                            var tokens = session.getTokens(line);
                            isInDefintiion |= tokens.find(o => o.value == "define") != null;
                            var foundToken = tokens.find(o => o.value == findToken.value);
                            if(isInDefintiion && foundToken) {
                               editor.gotoLine(line);
                               var indexOnLine = session.getDocument().getLine(line).indexOf(foundToken.value);
                               editor.selection.setRange(new Range(line, indexOnLine, line, indexOnLine + foundToken.length), true);
                               return;
                            }
                            isInDefintiion = tokens.find(o=>o.value == "end") != null ? false : isInDefintiion;
                        }
                    }
                })
                _editor.commands.addCommand({
                    name: 'save',
                    bindKey: { win: 'Ctrl-S', mac: "Cmd-S" },
                    exec: async function (editor) {
                        var valid = await validateEditor(true);
                        if (!valid) {
                            toastr.error(SanteDB.locale.getString("ui.admin.cdss.publish.invalid"));
                        }
                        else if (confirm(SanteDB.locale.getString("ui.admin.cdss.publish.confirm"))) {
                            try {
                                await SanteDB.resources.cdssLibraryDefinition.checkoutAsync(libraryDefinition.id, true);

                                _editor.setReadOnly(true);
                                await SanteDB.api.ami.putAsync({
                                    resource: `CdssLibraryDefinition`,
                                    id: $stateParams.id,
                                    dataType: 'text',
                                    data: _editor.getValue(),
                                    contentType: "text/plain",
                                    enableBasicAutocompletion: true,
                                    headers: {
                                        "X-SanteDB-Upstream": true
                                    }
                                });
                                _editorDirty = false;
                                toastr.success(SanteDB.locale.getString("ui.admin.cdss.publish.success"));
                            }
                            catch (e) {
                                if (e.$type == "ObjectLockedException") {
                                    alert(e.message);
                                }
                                else {
                                    $rootScope.errorHandler(e);
                                }
                            }
                            finally {
                                _editor.setReadOnly(false);
                            }
                        }
                    }
                })

                // Documentation tooltip
                var { HoverTooltip } = ace.require("ace/tooltip");
                var docToolTip = new HoverTooltip();
                var _lastLookupSymbol = null;
                docToolTip.setDataProvider(async function (e, editor) {
                    var session = editor.session;
                    var docPosition = e.getDocumentPosition();

                    // Get the word rage
                    var wordRange = session.getWordRange(docPosition.row, docPosition.column);
                    var cdssToken = session.getTokenAt(docPosition.row, docPosition.column);

                    if (cdssToken.value != _lastLookupSymbol) {
                        _lastLookupSymbol = cdssToken.value;

                        // Now we want to fetch documentation for the keyword - or we want to lookup what a UUID might be
                        if (_uuidRegex.test(cdssToken.value)) {
                            var results = _uuidRegex.exec(cdssToken.value);
                            try {
                                var refConcept = await Promise.all(
                                    _lookupApi.map(async function (a) {
                                        var res = await a.findAsync({ id: results[1] });
                                        if (res.resource) {
                                            return res.resource[0];
                                        }
                                        else {
                                            return null;
                                        }
                                    })
                                );
                                refConcept = refConcept.find(rc => rc !== null);

                                if (refConcept) {
                                    var helpHtml = `<strong>${refConcept.$type}</strong>: `;
                                    switch (refConcept.$type) {
                                        case "Concept":
                                            helpHtml += `${SanteDB.display.renderConcept(refConcept)} <em>(${refConcept.mnemonic})</em>`;
                                            break;
                                        case "ConceptSet":
                                            helpHtml += refConcept.name;
                                            break;
                                        case "Entity":
                                        case "Patient":
                                        case "Place":
                                        case "Material":
                                        case "ManufacturedMaterial":
                                        case "Person":
                                            if (refConcept.name) {
                                                helpHtml += SanteDB.display.renderEntityName(refConcept.name);
                                            } if (refConcept.typeConceptModel) {
                                                helpHtml += ` <em>(${refConcept.typeConceptModel.mnemonic})</em>`;
                                            }
                                            break;
                                    }
                                    _tooltipElement.innerHTML = helpHtml;
                                }
                                else {
                                    _tooltipElement.innerHTML = "Unknown";
                                }
                            }
                            catch (e) {
                                console.error(e);
                            }
                        }
                        else {
                            _tooltipElement.innerHTML = cdssToken.value;
                        }
                    }
                    docToolTip.showForRange(editor, wordRange, _tooltipElement, e);
                    console.info(wordRange);
                });

                docToolTip.addToEditor(_editor);


                _editor.getSession().on('change', () => _validationDirty = _editorDirty = true);
                validateInterval = $interval(validateEditor, 5000);
                window.onbeforeunload = (e) => _editorDirty ? SanteDB.locale.getString("ui.action.abandon.confirm") : null;
                $transitions.onBefore({ from: "santedb-admin.emr.cdss.*", to: "santedb-admin.*" },
                    (transition) => {
                        if (_editorDirty && !confirm(SanteDB.locale.getString("ui.action.abandon.confirm"))) {
                            $("#pageTransitioner").hide();
                            transition.abort();
                        }
                    });
                validateEditor(true);
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
        _editor.gotoLine(issue.row + 1, issue.column);
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
                            $state.go('santedb-admin.emr.cdss.view', { id: data.id });
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