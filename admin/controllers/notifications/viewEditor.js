/*
 * Copyright (C) 2021 - 2025, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Portions Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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
 *
 */

/**
 * @summary An HTML/SDL view based editor
 * @param {*} controlName The name of the control to which the ACE language editor is to be attached
 * @param {*} templateDefinition The initial text of the ACE editor
 * @param {*} viewType The type of view that this operating on
 */
function ViewAceEditor(controlName, templateDefinition, viewType) {

    var view = templateDefinition.views.find(o => o.type == viewType);
    var _editor;
    var _completor;
    var _saveHandlers = [];
    var _validationDirty = false;
    var _changeHandler = null;
    var _tooltipElement = document.createElement("div");
    var _uuidRegex = /.*?([a-fA-F0-9]{8}\-(?:[a-fA-F0-9]{4}\-){3}[a-fA-F0-9]{12}).*/;
    var _exceptionExtract = /^(.*?)\.\sLine\s(\d+)\,\sposition\s(\d+)\.$/;

    // Require
    var LanguageTools = ace.require("ace/ext/language_tools");
    var Range = ace.require("ace/range").Range;
    var { HoverTooltip } = ace.require("ace/tooltip");
    var { TokenIterator } = ace.require("ace/token_iterator");

    // HTML helper based auto complete
    function _htmlCompletor() {


        this.getCompletions = async function (editor, session, pos, prefix, callback) {

            // TODO: Get completions
        }


    };

    // SIMPLE data view completor
    function _svdCompletor() {

        function consumeComment(tokenIterator) {
            while (tokenIterator.stepBackward()) {
                switch (tokenIterator.getCurrentToken().type) {
                    case "comment.start.xml":
                        return;
                }
            }
        }

        function consumeToStartTag(tokenIterator, closingTag) {

            while (tokenIterator.stepBackward()) {
                var currentToken = tokenIterator.getCurrentToken();
                switch (currentToken.type) {
                    case "meta.tag.punctuation.tag-close.xml":
                        var tagInfo = consumeTag(tokenIterator);
                        if (tagInfo.isEndTag) {
                            consumeToStartTag(tokenIterator, tagInfo);
                        }
                        if (tagInfo.localName == closingTag.localName) {
                            return;
                        }
                        break;
                }
            }
        }

        function consumeTag(tokenIterator) {
            var currentToken = tokenIterator.getCurrentToken();
            // if (currentToken.type === "meta.tag.punctuation.tag-close.xml" ) {
            //     tokenIterator.stepBackward();
            //     currentToken = tokenIterator.getCurrentToken();
            // }

            var retVal = { attributes: [] };
            var currentAttribute = null;
            do {
                currentToken = tokenIterator.getCurrentToken();
                switch (currentToken.type) {
                    case "meta.tag.punctuation.end-tag-open.xml":
                        retVal.isEndTag = true;
                    case "meta.tag.punctuation.tag-open.xml":
                        return retVal;
                    case "meta.tag.tag-name.xml":
                        retVal.localName = currentToken.value;
                        break;
                    case "entity.other.attribute-name.xml":
                        currentAttribute.name = currentToken.value;
                        retVal.attributes.push(currentAttribute);
                        currentAttribute = null;
                        break;
                    case "string.attribute-value.xml":
                        currentAttribute = {
                            value: currentToken.value
                        };
                        break;
                }
            } while (tokenIterator.stepBackward());
        }

        async function getSchemaCompleteData(session, row, column) {
            try {
                var _scopedList = null;

                var tokenIterator = new TokenIterator(session, row, column);
                // Var token extractor - 
                var tagStack = [];
                var currentPath = "";
                var startToken = tokenIterator.getCurrentToken();
                while (tokenIterator.stepBackward()) {
                    var currentToken = tokenIterator.getCurrentToken();

                    switch (currentToken.type) {
                        case "meta.tag.punctuation.tag-close.xml":
                        case "meta.tag.tag-name.xml":
                            var tagInfo = consumeTag(tokenIterator);

                            if (tagInfo.isEndTag) {
                                consumeToStartTag(tokenIterator, tagInfo);
                            }
                            else {
                                tagStack.push(tagInfo);
                                currentPath = `/${tagInfo.localName}${currentPath}`;
                            }
                            break;
                        case "comment.end.xml":
                            consumeComment(tokenIterator);
                            break;
                        case "entity.other.attribute-name.xml":
                            if(startToken.type === "string.attribute-value.xml" && currentPath == "") {
                                currentPath = `@${currentToken.value}`;
                            }
                            break;
                    }
                }

                var options = await SanteDB.resources.dataTemplateDefinition.invokeOperationAsync(null, "xsd-complete", {
                    "path" : currentPath, 
                    "type" : "SimplifiedViewDefinition"
                });

                if(options) {
                    switch(startToken.type) {
                        case "entity.other.attribute-name.xml":
                            return options.filter(o=>o.attribute);
                        case "meta.tag.tag-name.xml":
                        case "text.tag-open.xml":
                            return options.filter(o=>!o.attribute);
                        default: 
                            return options;
                    }
                }
                else {
                    return [];
                }
            } catch (e) {
                console.error(e);
                return [];
            }
        }
    }

    function _initializeEditor(controlName, templateDefinition) {
        // Initialize the editor
        _editor = ace.edit(controlName, {
            theme: "ace/theme/sqlserver",
            mode: "ace/mode/html",
            wrap: true,
            maxLines: window.innerHeight / 27,
            minLines: 20,
            hasCssTransforms: true,
            value: view.content,
            keyboardHandler: "ace/keyboard/vscode",
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
        });
        _editor.getSession().on('change', () => {
            _validationDirty = true;
            if (_changeHandler) {
                _changeHandler(_editor.getValue());
            }
        });
        _addHelpTooltip();
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
            var token = session.getTokenAt(docPosition.row, docPosition.column);

            if (token.value != _lastLookupSymbol) {
                _lastLookupSymbol = token.value;

                // Now we want to fetch documentation for the keyword - or we want to lookup what a UUID might be
                if (_uuidRegex.test(token.value)) {
                    var results = _uuidRegex.exec(token.value);
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
                    var _symbolList = await getSchemaCompleteData(session, docPosition.row, docPosition.column, true);

                    var value = _symbolList.find(c => c.name == token.value.replaceAll("\"", "").trim());
                    if (value) {
                        _tooltipElement.innerHTML = value.documentation ? value.documentation.trim() : "No Documentation";
                    }
                    else {
                        _tooltipElement.innerHTML = token.value;
                    }
                }
            }
            docToolTip.showForRange(editor, wordRange, _tooltipElement, e);
        });

        docToolTip.addToEditor(_editor);

    }

    // Perform initialization
    _initializeEditor(controlName, view);

    this.getValue = function () {
        return _editor.getValue();
    }
    this.clearAnnotations = function () {
        _editor.getSession().clearAnnotations();
    }
    this.setAnnotations = function (annotations) {
        _editor.getSession().setAnnotations(annotations);
        _validationCallback.forEach(o => o(annotations));
    }
    this.onChange = function (changeHandler) {
        _changeHandler = changeHandler;
    }
    this.onSave = function (saveHandler) {
        _saveHandlers.push(saveHandler);
    }
    this.onAnnotationChange = function (callback) {
        _validationCallback.push(callback);
    }
    this.setReadonly = function (readonly) {
        _editor.setReadonly(readonly);
    }
    this.gotoIssue = function (issue) {
        _editor.gotoLine(issue.row + 1, issue.column);
    }
    this.setIssueException = function (e) {
        var root = e.getRootCause();
        _editor.getSession().clearAnnotations();
        if (root.$type == "XmlException") {
            var exception = _exceptionExtract.exec(root.message);
            if(!exception) { // HACK: Sometimes the regex doesn't parse
                exception = [ null, 1, 1 ];
            }
            _editor.getSession().setAnnotations([
                {
                    row: parseInt(exception[2]) - 1,
                    column: exception[3],
                    text: root.message,
                    type: "error"
                }
            ]);
        }
        else {
            _editor.getSession().setAnnotations([
                {
                    row: 0, 
                    column: 1,
                    text: root.message,
                    type: "error"
                }
            ]);
        }
    }
    this.destroy = function() {
        _editor.destroy();
    }

}