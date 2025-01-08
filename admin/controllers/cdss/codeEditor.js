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
function CdssAceEditor(controlName, initialText, fileName, libraryUuid) {

    // TODO:
    var _defaultAutoComplete = {
        "keyword": "define include as end having with where from select order by metadata type",
        "structure": "rule model fact library protocol data logic",
        "action" : "repeat propose apply assign raise",
        "control": "iterations until when then",
        "format": "json xml",
        "id": "id uuid oid",
        "severity" : "warn info danger error",
        "constants": "true false for active dont-use trial-use retired context",
        "modifier": "negation track-by normalize computed scoped-to",
        "function": "hdsi csharp all none any query first last average ",
        "variable": "format type scope const priority",
        "type": "string bool int real long"
    };
    _defaultAutoComplete = Object.keys(_defaultAutoComplete).map(k => {
        return _defaultAutoComplete[k].split(' ').map(v => {
            return {
                type: k,
                name: v
            }
        });
    }).reduce((a,b) => a.concat(b) );

    var _editor;
    var _completor;
    var _saveHandlers = [];
    var _tooltipElement = document.createElement("div");
    var _uuidRegex = /.*?([a-fA-F0-9]{8}\-(?:[a-fA-F0-9]{4}\-){3}[a-fA-F0-9]{12}).*/;
    const jsonTypeExtractor = /"\$type"\s*\:\s*\"(\w+)\"/mi;
    var _lookupApi = [
        SanteDB.resources.entity,
        SanteDB.resources.concept,
        SanteDB.resources.conceptSet
    ];
    var _validationCallback = [];
    var _basicTypes = Object.keys(SanteDB.resources).filter(o => SanteDB.resources[o] instanceof ResourceWrapper).map(o => { return { name: SanteDB.resources[o].getResource(), type: "Resource" } });

    // Require
    var LanguageTools = ace.require("ace/ext/language_tools");
    var Range = ace.require("ace/range").Range;
    var { HoverTooltip } = ace.require("ace/tooltip");
    var { TokenIterator } = ace.require("ace/token_iterator");


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
                _validationCallback.forEach(o => o(annotations));

            }
            var isValid = issues.issue.find(o => o.priority == 'Error') == null;

            if (isValid) {
                _completor.refreshCdssSymbols();
            }
            return isValid;
        }
        catch (e) {
            console.error(e);
            return false;
        }

    }

    // CDSS Auto-completor
    function _cdssCompletor() {
        const _typeMaps = {
            "CdssLibrary": "Library",
            "CdssDecisionLogicBlockDefinition": "Logic",
            "CdssFactAssetDefinition": "Fact",
            "CdssProtocolAssetDefinition": "Protocol",
            "CdssModelAssetDefinition": "Model",
            "CdssDataBlockDefinition": "Data"
        };
        var _cdssSymbols = [];

        // TODO: Interact with a more intelligent C# completion 
        const _dateFunctions = [
            { name: "AddDays", snippet: "AddDays(${1:days})", type: "DateTime", documentation: "Add the specified number of days to date time. Example: AddDays(3)" },
            { name: "AddMonths", snippet: "AddMonths(${1:months})", type: "DateTime", documentation: "Add the specified number of months to the date/time. Example: AddMonths(12)" },
            { name: "Subtract (fact)", snippet: "Subtract(date(\"${1:fact_name}\")", type: "TimeSpan", documentation: "Get the difference in two times. Example: Subtract(date(\"Patient Date Of Birth\"))" },
            { name: "Subtract", snippet: "Subtract(${1:date})", type: "TimeSpan", documentation: "Get the difference in two times. Example: Subtract(otherDate)" }
        ];
        const _csharpKeywords =
            [
                { name: "DateTime", type: "C# Type", documentation: "Functions for interacting with dates & times with timezone information", children: [
                    { name: "Now", type: "DateTimeOffset", documentation: "The current date and time", children: _dateFunctions },
                    { name: "Today", type: "DateTimeOffset", documentation: "The current date and time", children: _dateFunctions }
                ] },
                { name: "String", type: "C# Type", documentation: "Functions for dealing with strings", children: [
                    { name: "IsNullOrEmpty", snippet: "IsNullOrEmpty(${1:string})", type: "Boolean" }
                ] },
                { name: "Int32", type: "C# Type", documentation: "Functions for dealing with integers", children: [
                    { name: "Parse (fact)", snippet: "Parse(string(\"${1:fact_name}\"))", documentation: "Parse a fact into an integer" },
                    { name: "Parse", snippet: "Parse(${1:numberString})", documentation: "Parse a string into an integer" },
                    { name: "MaxValue", snippet: "MaxValue", documentation: "Maximum value of integer" },
                    { name: "MinValue", snippet: "MinValue", documentation: "Minimum value of integer" }
                ] },
                { name: "scopedObject", type: "Object", documentation: "The currently scoped object (the output of the assignment)"},
                { name: "true", type: "Boolean", documentation: "Constant representing TRUE"},
                { name: "false", type: "Boolean", documentation: "Constant representing FALSE"},
                { name: "int", type: "Int32", snippet: "int(\"${1:fact_name}\")", documentation: "Retrieve an Integer based fact from the context" },
                { name: "real", type: "Double", snippet: "real(\"${1:fact_name}\")", documentation: "Retrieve a double precision decimal number fact from context" },
                { name: "bool", type: "Boolean", snippet: "bool(\"${1:fact_name}\")", documentation: "Retrieve a boolean value fact from the context" },
                { name: "date", type: "DateTime", snippet: "date(\"${1:fact_name}\")", documentation: "Retrieve a date value fact from the context" },
                { name: "string", type: "String", snippet: "string(\"${1:fact_name}\")", documentation: "Retrieve a string fact from the context" },
                { name: "data", type: "Dataset", snippet: "data(\"${1:data_name}\")", documentation: "Get a CDSS defined dataset for reference value lookup" },
                { name: "act", type: "Act", snippet: "act(\"${1:fact_name}\")", documentation: "Retrieve an Act based fact from the context" },
                { name: "entity", type: "Entity", snippet: "entity(\"${1:fact_name}\")", documentation: "Retrieve an Entity based fact from the context" },
                { name: "Lookup", type: "Dataset", snippet: "Lookup(\"${1:column}\", ${2:filterValue})", documentation: "Filter the dataset by the specified data (must be applied to a dataset)"},
                { name: "Between", type: "Dataset", snippet: "Between(\"${1:column}\", ${2:lowerValue}, ${3:upperValue})", documentation: "Filter the dataset by values between upper and lower values"},
                { name: "Select", type: "Enumeration of Object", snippet: "Select(\"${1:column}\")", documentation: "Select a single column from the dataset"},
                { name: "SelectReal", type: "Enumeration of Real", snippet: "SelectReal(\"${1:column}\")", documentation: "Select a single column only returning the REAL (double precision decimal) values from the dataset"},
                { name: "SelectInt", type: "Enumeration", snippet: "SelectInt(\"${1:column}\")", documentation: "Select a single column only returning INTEGER values from the dataset"},
                { name: "SelectDate", type: "Enumeration", snippet: "SelectDate(\"${1:column}\")", documentation: "Select a single column only returning DATE values from the dataset"},
                { name: "Min", type: "Object", snippet: "Min()", documentation: "Return the minimum value in the dataset enumeration"},
                { name: "Max", type: "Object", snippet: "Max()", documentation: "Return the maximum value in the dataset enumeration"},
                { name: "Average", type: "Object", snippet: "Average()", documentation: "Return the average value in the dataset enumeration"},

                { name: "context", type: "CDSS Context", document: "The current CDSS execution context", children: [
                    { name: "Int", type: "Int32", snippet: "Int(\"${1:fact_name}\")", documentation: "Retrieve an Integer based fact from the context" },
                    { name: "Real", type: "Double", snippet: "Real(\"${1:fact_name}\")", documentation: "Retrieve a double precision decimal number fact from context" },
                    { name: "Bool", type: "Boolean", snippet: "Bool(\"${1:fact_name}\")", documentation: "Retrieve a boolean value fact from the context" },
                    { name: "Date", type: "DateTime", snippet: "Date(\"${1:fact_name}\")", documentation: "Retrieve a date value fact from the context" },
                    { name: "String", type: "String", snippet: "String(\"${1:fact_name}\")", documentation: "Retrieve a string fact from the context" },
                    { name: "GetFact", type: "Object", snippet: "GetFact(\"${1:fact_name}\")", documentation: "Retrieve the raw fact for the data" },
                    { name: "data", type: "Dataset", snippet: "GetDataset(\"${1:data_name}\")", documentation: "Get a CDSS defined dataset for reference value lookup" },

                    { name: "Target", type: "IdentifiedData", documentation: "The current target object of the CDSS context" }
                ]}
            ];

        async function _refreshSymbols() {
            try {
                var definition = _editor.getValue();
                _cdssSymbols = await SanteDB.resources.cdssLibraryDefinition.invokeOperationAsync(null, "symbol", {
                    definition: definition
                }, true);
                _cdssSymbols = _cdssSymbols.symbol.map(o => {
                    return {
                        type: _typeMaps[o.typeName],
                        name: o.name,
                        documentation: o.meta ? o.meta.documentation : "No Documentation",
                        id: o.id
                    }
                })
            } catch (e) {

            }
        }

        _refreshSymbols();

        this.refreshCdssSymbols = _refreshSymbols;

        // Consume the token name
        function consumeTokenName(tokenIterator, keepRow) {
            // Move to the "STRING"
            var tokenType = null;
            var rt = null;
            while (tokenIterator.stepBackward()) {
                var currentToken = tokenIterator.getCurrentToken();
                if (keepRow === undefined || keepRow === tokenIterator.$row) {
                    switch (currentToken.type) {
                        case "variable":
                            return { name: currentToken.value.trim().replaceAll("\"", ""), type: tokenType, resourceType: rt };
                        case "paren.lparen":
                            tokenType = currentToken.value.trim();
                            break;
                        case "paren.rparen": // Consume
                            consumeObjectTokens(tokenIterator);
                            break;
                    }
                }
            }
        }

        // Consume all token objects from the iterator
        function consumeObjectTokens(tokenIterator) {
            while (tokenIterator.stepBackward()) {
                var currentToken = tokenIterator.getCurrentToken();
                switch (currentToken.type) {
                    case "paren.rparen":
                        consumeObjectTokens(tokenIterator);
                        break;
                    case "paren.lparen":
                        return;
                }
            }
        }

        function consumeCurrentRawContent(tokenIterator) {
            var definition = "";
            do {
                var currentToken = tokenIterator.getCurrentToken();
                switch (currentToken.type) {
                    case "markup.raw":
                        if (currentToken.value.trim() === "$$") {
                            return definition;
                        }
                        else if(currentToken.value.indexOf("$$") === 0) {
                            definition = currentToken.value.substring(2).trim() + definition;
                            return definition;  
                        }
                    default:
                        definition = currentToken.value + definition;
                }
            } while (tokenIterator.stepBackward());
            return definition;
        }

        async function _getRimSchemaCompletion(session, row, column, forDocumentation) {
            try {
                // Consume the JSON object back to the raw
                var tokenIterator = new TokenIterator(session, row, column);
                var definition = consumeCurrentRawContent(tokenIterator);
                var retVal = [];

                // Attempt to extract the "$type" from the definition
                var match = jsonTypeExtractor.exec(definition);
                var api = null;
                if (match) {
                    var type = match[1].toCamelCase();
                    var api = SanteDB.resources[type];
                }

                if (api) {
                    var tokenIterator = new TokenIterator(session, row, column);
                    // Var token extractor - 
                    var tokenPath = [];
                    var lastString = null;
                    var cObjectType = null;
                    var lastVariable = null;
                    while (tokenIterator.stepBackward()) {
                        var currentToken = tokenIterator.getCurrentToken();
                        if (currentToken.type == "markup.raw" && currentToken.value.indexOf("$$") >= 0) {
                            break;
                        }
                        switch (currentToken.type) {
                            case "paren.lparen":
                                // Get property
                                var tokenData = consumeTokenName(tokenIterator);
                                if (tokenData) {
                                    tokenData.castAs = cObjectType;
                                }
                                tokenPath.push(tokenData);
                                break;
                            case "paren.rparen":
                                consumeObjectTokens(tokenIterator);
                                consumeTokenName(tokenIterator); // Get the token name
                                break;
                            case "string":
                                lastString = currentToken.value;
                                break;
                            case "variable":
                                if (currentToken.value == '"$type"') {
                                    cObjectType = lastString.replaceAll("\"", "");
                                }
                                else {
                                    lastVariable = currentToken.value;
                                }
                        }
                    }
                    // Translate the token 
                    tokenPath = tokenPath.reverse().filter(o => o !== undefined && o.name !== undefined);
                    var expressionPath = "";
                    if (tokenPath.length > 1) {
                        expressionPath = tokenPath.reduce((o, c, i) => {
                            var retVal = "";
                            if (c.type == "[") // Guard
                            {
                                retVal = `${o.name || o}[${c.name}]`;
                            }
                            else {
                                retVal = `${o.name || o}.${c.name}`;
                            }

                            if (c.castAs && i == tokenPath.length - 1) {
                                retVal += `@${c.castAs}`;
                            }
                            return retVal;
                        });
                    }
                    else if (tokenPath.length == 1) {
                        expressionPath = tokenPath[0].name;
                    }

                    if (!forDocumentation && (expressionPath.endsWith("Model") || expressionPath.indexOf("@") > -1)) {
                        expressionPath += "."; // HACK: The auto complete
                    }

                    var schemaComplete = await SanteDB.resources[type].invokeOperationAsync(null, "schema-complete", { expression: expressionPath }, false);

                    // Does the current path have any classifier values?
                    if (schemaComplete.properties) {
                        var myProperty = tokenPath.length == 0 ? null : schemaComplete.properties.find(o => o.name == tokenPath[tokenPath.length - 1].name);
                        if (myProperty && myProperty.classifierValues) {
                            retVal = myProperty.classifierValues.map(o => { return { name: o, type: "Classifier" } });
                        }
                        else {
                            // All properties can have a Model 
                            schemaComplete.properties.filter(o => o.delayLoadable).forEach(r => {
                                schemaComplete.properties.push({
                                    name: `${r.name}`,
                                    type: "Guid",
                                    values: r.values,
                                    documentation: r.documentation
                                });
                                r.name += "Model";
                                r.values = null;
                            });
                            retVal = schemaComplete.properties;
                        }
                    }
                }
                else {
                    // TODO: call a symbol lookup function here
                    retVal = [{ name: "$type" }];
                }
                return retVal;
            } catch (e) {
                console.error(e);
            }
        }

        this.getCompletions = async function (editor, session, pos, prefix, callback) {

            // We need to determine what scope we're in 
            var token = session.getTokenAt(pos.row, pos.column);
            if (!token) { return; } // no token

            var snippetMaker = null;
            var tokenIterator = new TokenIterator(session, pos.row, pos.column);
            var rawTokens = 0;
            var lastFunction = null;
            var lastType = null;
            do {
                var currentToken = tokenIterator.getCurrentToken();
                switch (currentToken.type) {
                    case "markup.raw":
                        if (currentToken.value.indexOf("$$") >= 0) {
                            rawTokens++;
                        }
                        break;
                    case "support.function":
                    case "support.constant":
                        lastFunction = lastFunction || currentToken.value;
                        break;
                    case "storage.type":
                        tokenIterator.stepBackward(); // text
                        tokenIterator.stepBackward(); // control
                        if(tokenIterator.getCurrentToken().value == "context") {
                            lastType = lastType || currentToken.value;
                        }
                        break;
                }
            } while (tokenIterator.stepBackward());

            var _scopedList = [];
            
            var _factList = angular.copy(_cdssSymbols);
            if (rawTokens % 2 == 1) // we're in a raw text block
            {
                switch (lastFunction) {
                    case "json":

                        _scopedList = await _getRimSchemaCompletion(session, pos.row, pos.column, false);
                        if (token.type !== "variable") {
                            var tokenIterator = new TokenIterator(session, pos.row, pos.column);
                            var variableName = consumeTokenName(tokenIterator, pos.row);
                            if (variableName && variableName.name == "$type") {
                                _scopedList = _basicTypes;
                            } else if (_scopedList) {
                                var fnVar = variableName === undefined ? null : _scopedList.find(c => c.name == variableName.name);
                                if (fnVar) {
                                    var modelVar = _scopedList.find(c => c.name == `${variableName.name}Model`);
                                    if (fnVar.values) {
                                        _scopedList = Object.keys(fnVar.values).map(o => { return { name: fnVar.values[o], value: o, type: "Concept" } });
                                    }
                                    else {
                                        _scopedList = [];
                                    }

                                    // For GUID we need to also provide lookup data - so let's do that
                                    if (!fnVar.values && modelVar) {
                                        var query = { _count: 10, _includeTotal: false };
                                        switch (modelVar.type) {
                                            case Concept.name:
                                                query["name.value||mnemonic"] = `~${token.value.replaceAll("\"", "")}`;
                                                break;
                                            case Entity.name:
                                                query["name.component.value"] = `~${token.value.replaceAll("\"", "")}`;
                                                break;
                                        }

                                        var api = SanteDB.resources[modelVar.type.toCamelCase()];
                                        if (Object.keys(query).length > 2 && api) {
                                            if (api) {
                                                var matches = await api.findAsync(query, "dropdown");
                                                if (matches.resource) {
                                                    matches.resource.map(r => {
                                                        return {
                                                            name: r.$type == "Concept" ? SanteDB.display.renderConcept(r) : SanteDB.display.renderEntityName(r.name),
                                                            value: r.id,
                                                            type: r.$type,
                                                            documentation: r.mnemonic
                                                        }
                                                    }).forEach(r => _scopedList.push(r));
                                                }
                                            }
                                        }
                                    }
                                }

                            }
                        }
                        break;
                    case "hdsi":
                        var api = SanteDB.resources[lastType.toCamelCase()];
                        if(api){
                            tokenIterator = new TokenIterator(session, pos.row, pos.column);
                            var hdsiExpression = consumeCurrentRawContent(tokenIterator).trim().replaceAll("\r","").replaceAll("\n","");
                            // vars 
                            try {
                                hdsiExpression = hdsiExpression.split('&');
                                hdsiExpression = hdsiExpression[hdsiExpression.length -1];
                                var vars = _factList.filter(o=>o.type == "Fact").map(f=> `$${f.name}`);
                                var result = await api.invokeOperationAsync(null, "schema-complete", {
                                    "expression": hdsiExpression,
                                    "vars": vars
                                }, false, null, null, "application/json");
                                if(Array.isArray(result)) {
                                    _scopedList = result.map(r=> {
                                        return {
                                            name: r,
                                            type: "Classifier"
                                        }
                                    });
                                }
                                else {
                                    _scopedList = result.properties;
                                }
                            }
                            catch(e) {
                                console.warn(e);
                            }
                        }
                        break;
                    case "csharp":
                        if(token.type == "string") {
                            _scopedList = _factList;
                        }
                        else {
                            var _currentList = _csharpKeywords;
                            var _currentCompleteData = {};
                            token.value.split(".").forEach(currentKeyword => 
                            {
                                _currentCompleteData = _currentList.find(o=>o.name == currentKeyword || o.name == _currentCompleteData.type);
                                if(!_currentCompleteData) { _currentCompleteData = {}; return; }
                                _currentList = _currentCompleteData.children || _csharpKeywords;
                            });
                            _scopedList = _currentList;
                        }
                        break;
                }
            }
            else if (token.type === "string.id" || token.type === "string") {

                _scopedList = _factList;
                switch (token.value.trim()[0]) {
                    case "<":
                        _scopedList = _scopedList.filter(s => s.id);
                        _scopedList.forEach(r => r.name = r.id);
                        snippetMaker = (s) => `${s.id}>`;
                        break;
                    case "\"":
                        snippetMaker = (s) => `${s.name}"`;
                        break;
                }
            }

            else {
                _scopedList = _defaultAutoComplete;

            }

            var results = _scopedList.map(r => {
                return {
                    caption: r.name,
                    value: r.value || r.name,
                    snippet: snippetMaker ? snippetMaker(r) : r.snippet,
                    score: 10,
                    docText: (r.documentation || "No Documentation").trim(),
                    meta: r.type
                }
            });

            callback(null, results);

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
        _completor = new _cdssCompletor();
        LanguageTools.setCompleters([_completor]);
        // LanguageTools.addCompleter(_completor);
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
                        _saveHandlers.forEach(o => o());
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
            console.info(cdssToken);
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
        _validationCallback.forEach(o => o(annotations));
    }
    this.onChange = function (changeHandler) {
        _editor.getSession().on('change', changeHandler);
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
    this.validateEditor = function () {
        _validateEditor();
    }
}