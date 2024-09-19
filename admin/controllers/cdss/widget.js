/// <reference path="../../.ref/js/santedb.js"/>
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
angular.module('santedb').controller('CdssWidgetController', ["$scope", "$rootScope", "$timeout", "$state", "$stateParams", function ($scope, $rootScope, $timeout, $state, $stateParams) {

    $scope.filterDatasets = (r) => r.$type == "SanteDB.Cdss.Xml.Model.CdssDatasetDefinition, SanteDB.Cdss.Xml" || r.data && r.compress;
    $scope.filterLogicBlocks = (r) => r.$type == "SanteDB.Cdss.Xml.Model.CdssDecisionLogicBlockDefinition, SanteDB.Cdss.Xml" || r.context;

    $scope.$watch("source", function(n,o) {

        if(n && !o) {
            $timeout(() => hljs.highlightAll(), 500);
        }
    });

    $scope.getDatasetSize = function (dat) {
        try {
            return atob(dat.data).length;
        }
        catch (e) {
            return dat.data.length;
        }
    }

    $scope.navigateToDefinition = async function (definition) {
        try {
            var resolvedDefinition = await SanteDB.resources.cdssLibraryDefinition.findAssociatedAsync(null, "_definition", { ref: definition }, null, true);

            if (resolvedDefinition.resource[0].library) {
                $state.go("santedb-admin.cdr.cdss.view", { id: resolvedDefinition.resource[0].id });
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    function renderLogic (logicBlock) {
        if (!logicBlock) return;

        switch (logicBlock.$type) {
            case "SanteDB.Cdss.Xml.Model.Expressions.CdssAllExpressionDefinition, SanteDB.Cdss.Xml":
                return  `<div class='bg-primary text-white' style='font-family:monospace'>ALL OF:<ul class='list-unstyled bg-light text-dark ml-2'>${logicBlock.expressions.map(e=>`<li>${renderLogic(e)}</li>`).join("")}</ul>`;
            case "SanteDB.Cdss.Xml.Model.Expressions.CdssAnyExpressionDefinition, SanteDB.Cdss.Xml":
                return  `<div class='bg-info text-white' style='font-family:monospace'>ANY OF:<ul class='list-unstyled bg-light text-dark ml-2'>${logicBlock.expressions.map(e=>`<li>${renderLogic(e)}</li>`).join("")}</ul>`;
                case "SanteDB.Cdss.Xml.Model.Expressions.CdssNoneExpressionDefinition, SanteDB.Cdss.Xml":
                return  `<div class='bg-dark text-white' style='font-family:monospace'>NONE OF:<ul class='list-unstyled bg-light text-dark ml-2'>${logicBlock.expressions.map(e=>`<li>${renderLogic(e)}</li>`).join("")}</ul>`;
            case "SanteDB.Cdss.Xml.Model.Expressions.CdssHdsiExpressionDefinition, SanteDB.Cdss.Xml":
                return `<pre class="m-1"><small class="badge badge-success">HDSI</small> ${logicBlock.expression.replace("<", "&lt;").replace(">", "&gt;")} </pre>`;
            case "SanteDB.Cdss.Xml.Model.Expressions.CdssCsharpExpressionDefinition, SanteDB.Cdss.Xml":
                return `<pre class="m-1"><small class="badge badge-success">C#</small> ${logicBlock.expression.replace("<", "&lt;").replace(">", "&gt;")} </pre>`;
            case "SanteDB.Cdss.Xml.Model.Expressions.CdssFactReferenceExpressionDefinition, SanteDB.Cdss.Xml":
                return `<code class="m-1"><i class="fas fa-cube fa-fw"></i> ${logicBlock.ref}</code>`
            case "SanteDB.Cdss.Xml.Model.Expressions.CdssQueryExpressionDefinition, SanteDB.Cdss.Xml":
                var retVal = `<pre>FROM <small class="badge badge-success">HDSI</small> ${logicBlock.source.replace("<", "&lt;").replace(">", "&gt;")}\r\n`;
                if(logicBlock.orderBy) {
                    retVal += `SORTED BY <small class="badge badge-success">HDSI</small> ${logicBlock.orderBy.replace("<", "&lt;").replace(">", "&gt;")}\r\n`;
                }
                retVal += `WHERE <small class="badge badge-success">HDSI</small> ${logicBlock.expression.replace("<", "&lt;").replace(">", "&gt;")}\r\nSELECT ${logicBlock.fn.toUpperCase()} <small class="badge badge-success">HDSI</small> ${logicBlock.select.replace("<", "&lt;").replace(">", "&gt;")}</pre>`;
                return retVal;
            default:
                return `<code class="text-primary">${logicBlock}</code>`;
        }
    }

    // TODO: Translate this to MermaidJS - this is just a quick and dirty implementation
    $scope.renderLogic = function(logicBlock) {
        if(!logicBlock) return;
        if(typeof logicBlock === 'string') {
            return `<code class="text-primary">${logicBlock}</code>`;
        }
        logicBlock._html = renderLogic(logicBlock);
        return logicBlock._html;
    } 

}]);