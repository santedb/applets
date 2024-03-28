function CdssAceEditor(controlName, initialText, fileName, libraryUuid) {

    var _editor;
    var _tooltipElement = document.createElement("div");
    var _uuidRegex = /.*?([a-fA-F0-9]{8}\-(?:[a-fA-F0-9]{4}\-){3}[a-fA-F0-9]{12}).*/;
    var _lookupApi = [
        SanteDB.resources.entity,
        SanteDB.resources.concept,
        SanteDB.resources.conceptSet
    ];
    var _validationCallback = [];

    // Require
    var LanguageTools = ace.require("ace/ext/language_tools");
    var Range = ace.require("ace/range").Range;
    var { HoverTooltip } = ace.require("ace/tooltip");

    
    async function _validateEditor(force) {
        try {
            var value = _editor.getValue();
            if (force !== true && !_validationDirty) {
                return;
            }

            _validationDirty = false;
            var issues = await SanteDB.resources.cdssLibraryDefinition.invokeOperationAsync(null, "validate", {
                definition: value,
                name: fileName
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
                _validationCallback.forEach(o=>o(annotations));

            }
            return issues.issue.find(o => o.priority == 'Error') == null;
        }
        catch (e) {
            console.error(e);
            return false;
        }

    }

    // CDSS Auto-completor
    function _cdssCompletor() {
        var _typeMaps = {
            "CdssLibrary" : "Library",
            "CdssDecisionLogicBlockDefinition" : "Logic",
            "CdssFactAssetDefinition" : "Fact",
            "CdssProtocolAssetDefinition": "Protocol",
            "CdssModelAssetDefinition": "Model",
            "CdssDataBlockDefinition": "Data"
        };
        var _scopedList;
        _refreshOptions();

        async function _refreshOptions()
        { 
            try {
                var definition = _editor.getValue();
                _scopedList = await SanteDB.resources.cdssLibraryDefinition.invokeOperationAsync(null, "symbol", {
                    definition: definition
                }, true);
            } catch(e) {

            }
        }

        _editor.on('change', (e) => {
            var documentPosition = e.start;
            var token = _editor.getSession().getTokenAt(documentPosition.row, documentPosition.column);
            if(token) {
                switch (token.value.trim()) {
                    case "end":
                        _refreshOptions();
                }
            }
        });

        this.getCompletions = async function (editor, session, pos, prefix, callback) {

            var searchField = "name";
            var closeChar = "x\"";
            var token = session.getTokenAt(pos.row, pos.column);
            if (token) {
                var tokenValue = token.value.trim();
                switch (tokenValue[0]) {
                    case "<":
                        searchField = "id";
                        closeChar = "x>";
                    case "\"":
                        
                        var results = _scopedList.symbol.filter(sc => {
                            return sc[searchField] && sc[searchField].indexOf(tokenValue.substring(1) == 0)
                        }).map((result) => {
                            return {
                                value: result[searchField],
                                name: result.name,
                                score: 1,
                                meta: _typeMaps[result.typeName] || "Other"
                            }
                        });

                        callback(null, results);
                        break;
                    default:
                        callback(null, []);
                }
            }
            // your code
            /* for example
            * let TODO = ...;
            * callback(null, [{name: TODO, value: TODO, score: 1, meta: TODO}]);
            */
        }
    };

    function _initializeEditor(controlName, initialText) {
        // Initialize the editor
        _editor = ace.edit(controlName, {
            theme: "ace/theme/sqlserver",
            mode: "ace/mode/cdss",
            wrap: true,
            maxLines: window.innerHeight / 27,
            minLines: 2,
            hasCssTransforms: true,
            value: initialText,
            keyboardHandler: "ace/keyboard/vscode",
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
        });
        LanguageTools.addCompleter(new _cdssCompletor());
        _addTestKeyboardShortcut();
        _addGotoKeyboardShortcut();
        _addSaveKeyboardShortcut();
        _addHelpTooltip();
    }

    function _addTestKeyboardShortcut() {
        _editor.commands.addCommand({
            name: 'test',
            bindKey: { win: 'F9', mac: 'F9' },
            exec: function (editor) {
                $("#test-tab").tab('show');
            }
        })
    }

    function _addGotoKeyboardShortcut() {
        _editor.commands.addCommand({
            name: 'goto',
            bindKey: { win: 'F12', mac: 'F12' },
            exec: function (editor) {
                var session = editor.getSession();
                var currentPosition = editor.getCursorPosition();
                var findToken = session.getTokenAt(currentPosition.row, currentPosition.column);
                if (findToken.value.indexOf("\"") !== 0) return;

                var isInDefintiion = false;

                for (var line = 0; line < session.getDocument().getAllLines().length; line++) {
                    var tokens = session.getTokens(line);
                    isInDefintiion |= tokens.find(o => o.value == "define") != null;
                    var foundToken = tokens.find(o => o.value == findToken.value);
                    if (isInDefintiion && foundToken) {
                        editor.gotoLine(line);
                        var indexOnLine = session.getDocument().getLine(line).indexOf(foundToken.value);
                        editor.selection.setRange(new Range(line, indexOnLine, line, indexOnLine + foundToken.length), true);
                        return;
                    }
                    isInDefintiion = tokens.find(o => o.value == "end") != null ? false : isInDefintiion;
                }
            }
        })
    }

    function _addSaveKeyboardShortcut() {
        _editor.commands.addCommand({
            name: 'save',
            bindKey: { win: 'Ctrl-S', mac: "Cmd-S" },
            exec: async function (editor) {
                var valid = await _validateEditor(true);
                if (!valid) {
                    toastr.error(SanteDB.locale.getString("ui.admin.cdss.publish.invalid"));
                }
                else if (confirm(SanteDB.locale.getString("ui.admin.cdss.publish.confirm"))) {
                    try {
                        await SanteDB.resources.cdssLibraryDefinition.checkoutAsync(libraryUuid, true);

                        _editor.setReadOnly(true);
                        await SanteDB.api.ami.putAsync({
                            resource: `CdssLibraryDefinition`,
                            id: libraryUuid,
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
                        if (e.message) {
                            alert(e.message);
                        }
                        else {
                            alert(e);
                        }
                    }
                    finally {
                        _editor.setReadOnly(false);
                    }
                }
            }
        })
    }

    function _addHelpTooltip() {
        // Documentation tooltip
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
        });

        docToolTip.addToEditor(_editor);

    }

    // Perform initialization
    _initializeEditor(controlName, initialText);

    this.getValue = function () {
        return _editor.getValue();
    }
    this.clearAnnotations = function () {
        _editor.getSession().clearAnnotations();
    }
    this.setAnnotations = function (annotations) {
        _editor.getSession().setAnnotations(annotations);
        _validationCallback.forEach(o=>o(annotations));
    }
    this.onChange = function (changeHandler) {
        _editor.getSession().on('change', changeHandler);
    }
    this.onAnnotationChange = function(callback) {
        _validationCallback.push(callback);
    }
    this.setReadonly = function (readonly) {
        _editor.setReadonly(readonly);
    }
    this.gotoIssue = function (issue) {
        _editor.gotoLine(issue.row + 1, issue.column);
    }
    this.validateEditor = function() {
        _validateEditor();
    }
}